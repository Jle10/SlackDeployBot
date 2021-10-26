const lineReader = require('line-reader'); //To read the queue from a txt file.
const fs = require('fs'); // To store the queue.

module.exports = class File {
	constructor() {

	}

	read() {
		var index = 0;

		lineReader.eachLine('queue.txt', function(line) {
			console.log(line);
			deployList[index] = line;
			index++;
		});
	};

	write() {
		fs.writeFile("queue.txt", getQueue(), function(err) {
			if(err) {
				return console.log(err);
			}

			console.log("Cola guarda en queue.txt!");
		});
	};
};