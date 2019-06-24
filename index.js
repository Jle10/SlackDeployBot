// Import express and request modules
var express = require('express');
var request = require('request');
var bodyParser = require('body-parser'); //Para poder leer los POST que hagan
var urlencodedParser = bodyParser.urlencoded({ extended: false });
const lineReader = require('line-reader'); //To read the queue from a txt file.
const fs = require('fs'); // To store the queue.

//Apollo URL: http://18.194.23.56:5000/
const PORT=5000;

// Store our app's ID and Secret. These we got from Step 1. 
// For this tutorial, we'll keep your API credentials right here. But for an actual app, you'll want to  store them securely in environment variables. 
var clientId = '2334790112.629113793923';
var clientSecret = 'bcb9211ab8a2256b583bfb899e8a8600';

// Instantiates Express and assigns our app variable to it
var app = express();


app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies

// Lets start our server
app.listen(PORT, function () {
    //Callback triggered when server is successfully listening. Hurray!
    console.log("deployQueueAPP ejecutada con exito en el puerto: " + PORT);
});

// This route handles GET requests to our root ngrok address and responds with the same "Ngrok is working message" we used before
app.get('/', function(req, res) {
    res.send('Ngrok esta funcionando bb: ' + req.url);
});

// This route handles get request to a /oauth endpoint. We'll use this endpoint for handling the logic of the Slack oAuth process behind our app.
app.get('/oauth', function(req, res) {
    // When a user authorizes an app, a code query parameter is passed on the oAuth endpoint. If that code is not there, we respond with an error message
    if (!req.query.code) {
        res.status(500);
        res.send({"Error": "Looks like we're not getting code."});
        console.log("Looks like we're not getting code.");
    } else {
        // If it's there...

        // We'll do a GET call to Slack's `oauth.access` endpoint, passing our app's client ID, client secret, and the code we just got as query parameters.
        request({
            url: 'https://slack.com/api/oauth.access', //URL to hit
            qs: {code: req.query.code, client_id: clientId, client_secret: clientSecret}, //Query string data
            method: 'GET', //Specify the method

        }, function (error, response, body) {
            if (error) {
                console.log(error);
            } else {
                res.json(body);

            }
        })
    }
});

//TODO: Cambiar todo los "var XXX = function() por "function XXX()"

//------- LOAD QUEUE (from a .txt file) -----------
var loadQueue = function() {
	var index = 0;

	lineReader.eachLine('queue.txt', function(line) {  
    	console.log(line);
    	deployList[index] = line;
    	index++;
	});

	//res.send('Se ha cargado la última cola guardad de deploy, puedes mostrarla con: /deploy show');
};

var deployList = [];
var queue = loadQueue();


// *********************** FUNCTIONS ***********************************
//------- STORE QUEUE (as a .txt file) -----------
var storeQueue = function() {
	fs.writeFile("queue.txt", getQueue(), function(err) {
	    if(err) {
	        return console.log(err);
	    }

	    console.log("Cola guarda en queue.txt!");
	}); 
	//res.send('Cola guardada! Puedes cargarla con /deploy load');
};

//------- GET DEPLOY QUEUE (as A STRING LIST) -----------
var printQueue = function() {
	var deployQueue = '';

	for(i=0; i < deployList.length; i++) {
		if(i === 0) {
			deployQueue = (i+1) + '.) *' + deployList[i] + '*\n';
		}
		else {
			deployQueue = deployQueue + (i+1) + '.) *' + deployList[i] + '*\n';
		}
	}

	return deployQueue;
};

//------- GET DEPLOY QUEUE (as A STRING LIST) -----------
var getQueue = function() {
	var queueTXT = '';
	for(i=0; i < deployList.length; i++) {
		queueTXT = queueTXT + deployList[i] + '\n';
	}
	return queueTXT;
};

//------- REMOVE user FROM DEPLOY QUEUE ----------------
var remove = function(user) {
	var index = deployList.indexOf(user);

	if (index < 0) {
		return false;
	}

	console.log('Se ha borrado a -> ' + deployList[0] + ' de la cola');
	deployList.splice(index, 1);
	console.log('El siguiente es ->' + deployList[0]);

	storeQueue(); //Actualice the queue.txt

	return true;
};

//------- REMOVE user FROM QUEUE and WARNS the CHAT that the turn is over ----------------
var endDeploy = function(req, res, user){
	var isUser = remove(user);

	if(isUser) {
		if(deployList[0] === undefined){
		    res.status(200).json({
		    	"response_type": "in_channel",
		    	"text": '<@' + user + '> ha terminado el deploy!',
		    	"attachments": [
		        	{
		            	"text":"¡No hay nadie en la cola: *DEPLOY LIBRE*!"
		        	}
		    	]
			});
		}
		else {
		    res.status(200).json({
		    	"response_type": "in_channel",
		    	"text": '<@' + user + '> ha terminado el deploy!',
		    	"attachments": [
		        	{
		            	"text":'¡Es tu turno <@' + deployList[0] + '>!'
		        	}
		    	]
			});
		}
	}
	else {
		res.status(200).json({
			"text": "¡No estas en la cola!",
			"attachments": [
		    	{
		        	"text": "Puedes apuntarte con /deploy"
		    	}
			]
		});
	}
};

//------- REMOVE user FROM DEPLOY QUEUE ----------------
var removeDeploy = function(req, res, user) {

	if(deployList[0] === user) {
		remove(user);
		res.status(200).json({
			"response_type": "in_channel",
			"text": '<@' + user + '> ha cedido su turno!',
			"attachments": [
				{
					"text":'¡Es tu turno <@' + deployList[0] + '>!'
				}
			]
		});
		//TODO: Notificar al siguiente, si lo hubiera, por privado

		// res.status(200).json({
		// 	  "channel": "deployList[0]",
		// 	  "message": {
		// 	    "attachments": [
		// 	      {
		// 	        "fallback": "This is an attachment's fallback",
		// 	        "id": 1,
		// 	        "text": "This is an attachment"
		// 	      }
		// 	    ],
		// 	    "bot_id": "AJH3BPBT5",
		// 	    "subtype": "bot_message",
		// 	    "text": "Here's a message for you",
		// 	    "ts": time,
		// 	    "type": "message",
		// 	    "username": "deployQueue"
		// 	  },
		// 	  "ok": true,
		// 	  "ts": time
		// });
	} else if(remove(user)) {
		res.send('Tu siguiente turno ha sido eliminado de la cola con exito');
	} else {
		res.status(200).json({
			"text": "¡No tienes turno en la cola!",
			"attachments": [
		    	{
		        	"text": "Puedes apuntarte con *'/deploy start'*"
		    	}
			]
		});
	}
};

// ---- SHOW DEPLOY QUEUE ---
var showDeploy = function(req, res, user) {
	queue = printQueue();

	if(queue) {
		res.status(200).json({
			"response_type": "in_channel",
			"text": "Esto son los turnos: \n",
			"attachments": [
		    	{
		        	"text": queue
		    	}
			]
		});
	}
	else {
		res.send("No hay nadie!! *DEPLOY LIBRE* pero no olvides apuntarte con '/deploy start'");
	}
};

// ---- INFO ABOUT THE APP ---
var help = function(res) {
    res.status(200).json({
		"text": "Information about deployQueueAPP!! Here you have some /COMMANDS [params]",
		"attachments": [
	    	{
	        	"text": "/deploy [start, show, remove, end, help]\n*'start'* = Add yourself to the queue \n*'end'* = remove yourself from the queue and notify next turn\n*'remove'* = remove yourself from the queue\n *'show'* = Show dpeloy queue"
	    	}
		]
	});
};

// ---- ADD TO QUEUE ---
var deploy = function(req, res, user) {
	var time = Math.floor(new Date() / 1000);

	deployList.push(user);

	storeQueue(); //Actualice the queue.txt

	queue = printQueue();

	if(deployList[1] === undefined) {
		 res.status(200).json({
			"response_type": "in_channel",
			"text": "<@" + user + "> ha empezado un deploy/debug en PROD -- *<!date^"+ time +"^{time}|Algo va mal con la fecha>* \nEsto son los turnos: ",
			"attachments": [
		    	{
		        	"text": queue
		    	}
			]
		});
	}
	else {
		 res.status(200).json({
			"response_type": "in_channel",
			"text": "<@" + user + "> ha sido añadido a la cola \nEsto son los turnos: ",
			"attachments": [
		    	{
		        	"text": queue
		    	}
			]
		});
	}
};

var clearQueue = function(req, res) {
	res.status(200).end(); //Parece que segun la API es la mejor practica para devolver un 200

	var responseURL = req.body.url;
	if (req.body.token !== 'yOjuxAxUt3k1apbTiH1JW9r9') { //Testeando validacion de token
		res.status(403).end("Acceso Denagado")
	} else {
		var message = {
			'text': 'Empieza la votación para limpiar la cola!',
			'attachments': [
				{
					'text': 'Elegi una de las siguientes opciones!',
					'fallback': 'Whooops! Algo no va bien',
					'callback_id': 'vote_buttons',
					'color': '#5baaa1',
					'attachment_type': 'default',
					'actions': [
						{
							'name'  : 'si',
							'text'  : 'SI!',
							'type:' : 'button',
							'value' : 'yes'
						},
						{
							'name'  : 'no',
							'text'  : 'OH NO!',
							'type:' : 'button',
							'value' : 'no',
							'style' : 'danger'
						}
					]
				}
			]
		};

		res.status(200).json(message);



		// sendMessageToSlack(message, responseURL);
	}
};

var sendMessageToSlack = function(message, url){
	var sendPost = {
		uri: url,
		method: 'POST',
		header: {
			'Content-type': 'application/json'
		},
		json: JSONmessage
	};

	request(sendPost, (error, response, body) => {
		if(error) {
			response.status(403).end("Error al enviar las opciones en POST")
		}
	});
};
// *********************** SLASH COMMANDS ***********************************

//Manage the slash commands that will generate button responses
app.post('/slack/actions', urlencodedParser, (req, res) => {
	res.status(200).end();

	var actionJSONPayload = JSON.parse(req.body.payload); // parse URL-encoded payload JSON string
	var message = {
		"text": actionJSONPayload.user.name + " clicked: " + actionJSONPayload.actions[0].name,
		"replace_original": false
	};

	sendMessageToSlack(actionJSONPayload.response_url, message);
});

app.post('/deploy', function(req, res) {
	var user = req.body.user_name;
	var params = req.body.text;

	switch(params){
		case 'start':
			deploy(req, res, user);
			break;
		case 'end':
			endDeploy(req, res, user);
			break;
		case 'remove':
			removeDeploy(req, res, user);
			break;
		case 'show':
			showDeploy(req, res, user);
			break;
		case 'help':
			help(res);
			break;
		case 'store':
			storeQueue();
			break;
		case 'load':
			loadQueue();
			break;

		//TODO: Esta haciendose en appTEST

		// case 'clear':
		// 	clearQueue(req, res);
		// 	break;
		default:
			help(res);
	}
});

