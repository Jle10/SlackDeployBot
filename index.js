// Import express and request modules
var express = require('express');
var request = require('request');

const PORT=5000;

// Store our app's ID and Secret. These we got from Step 1. 
// For this tutorial, we'll keep your API credentials right here. But for an actual app, you'll want to  store them securely in environment variables. 
var clientId = '2334790112.629113793923';
var clientSecret = 'bcb9211ab8a2256b583bfb899e8a8600';

// Instantiates Express and assigns our app variable to it
var app = express();

//Para poder leer los POST que hagan
var bodyParser = require('body-parser');
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

var deployList = [];
var queue = '';


// *********************** FUNCTIONS ***********************************
//------- GET DEPLOY QUEUE (as A STRING LIST) -----------
var getList = function(deployList, queue){
	for(i=0; i < deployList.length; i++) {
		if(i == 0) {
			queue = (i+1) + '.) *' + deployList[i] + '*\n';
		}
		else {
			queue = queue + (i+1) + '.) *' + deployList[i] + '*\n';
		}
	}

	return queue;
}

//------- REMOVE user FROM DEPLOY QUEUE ----------------
var remove = function(user) {
	var index = deployList.indexOf(user);

	if (index < 0) {
		return false;
	}

	console.log('Se ha borrado a -> ' + deployList[0] + ' de la cola');
	deployList.splice(index, 1);
	console.log('El siguiente es ->' + deployList[0]);
	return true;
}

//------- REMOVE user FROM QUEUE and WARNS the CHAT that the turn is over ----------------
var endDeploy = function(req, res, user){
	var isUser = remove(user);

	if(isUser) {
		if(deployList[0] == undefined){
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
}

//------- REMOVE user FROM DEPLOY QUEUE ----------------
var removeDeploy = function(req, res, user) {
	var isUser = remove(user);

	if(isUser) {
		res.send('Tu siguiente turno ha sido eliminado de la cola con exito');
	}
	else {
		res.status(200).json({
			"text": "¡No tienes turno en la cola!",
			"attachments": [
		    	{
		        	"text": "Puedes apuntarte con /deploy"
		    	}
			]
		});
	}
}

// ---- SHOW DEPLOY QUEUE ---
var showDeploy = function(req, res, user) {
	queue = getList(deployList, queue);

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
		res.send("No hay nadie!! *DEPLOY LIBRE* pero no olvides apuntarte con '/deploy'");
	}
}

// ---- INFO ABOUT THE APP ---
var help = function(res) {
    res.status(200).json({
		"text": "Information about deployQueueAPP!! Here you have some /COMMANDS [params]",
		"attachments": [
	    	{
	        	"text": "/deploy (add yourself to the queue) [add, show, remove, end, help]\n/queue (show the deploy queue) \n/end (remove yourself from the queue)"
	    	}
		]
	});
}

// ---- ADD TO QUEUE ---
var deploy = function(req, res, user) {
	var time = Math.floor(new Date() / 1000);

	deployList.push(user);

	queue = getList(deployList, queue);

	if(deployList[1] == undefined) {
		 res.status(200).json({
			"response_type": "in_channel",
			"text": "<!channel>!!! <@" + user + "> ha empezado un deploy/debug en PROD -- *<!date^"+ time +"^{time}|caca>* \nEsto son los turnos: ",
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
			"text": "<@" + user + "> ha sido añadido a la cola -- *<!date^"+ time +"^{time}|caca>* \nEsto son los turnos: ",
			"attachments": [
		    	{
		        	"text": queue
		    	}
			]
		});
	}
}

// *********************** SLASH COMMANDS ***********************************
app.post('/deploy', function(req, res) {
	var user = req.body.user_name;
	var params = req.body.text;
	var canal = req.body.channel_id;

	switch(params){
		case 'add':
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
		default:
			deploy(req, res, user);
	}
});

