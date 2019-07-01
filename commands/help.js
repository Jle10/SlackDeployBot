module.exports = class Help {
	constructor(response) {
		this.response = response;
	}

	send() {
		this.response.status(200).json({
			"text": "Information about deployQueueAPP!! Here you have some /COMMANDS [params]",
			"attachments": [
				{
					"text": "/deploy [start, show, remove, end, help]\n" +
						"*'start'* = Add yourself to the queue \n" +
						"*'end'* = remove yourself from the queue and notify next turn\n" +
						"*'remove'* = remove yourself from the queue\n" +
						"*'show'* = Show deploy queue\n" +
						"*'clear'* = Launch a vote for deleting the queue"
				}
			]
		});
	}
};