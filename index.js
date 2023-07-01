const fs = require('fs');
const osc = require('node-osc');
const config = require('./config.json');

const server = new osc.Server(config.PORT_LISTENING, config.ADDRESS_LISTENING);
const client = new osc.Client(config.ADDRESS_SENDING, config.PORT_SENDING);

let interactionCount = {};
let lastChatMessage = null;

function loadData() {
	if (fs.existsSync('data.json')) {
		sendConsoleMessage('info', 'Chargement de la précédente sauvegarde...');
		try {
			const data = fs.readFileSync('data.json', 'utf8');
			interactionCount = JSON.parse(data);
			sendConsoleMessage('info', 'La sauvegarde a été chargée avec succès !');
		} catch (error) {
			sendConsoleMessage('error', 'Une erreur s\'est produite lors du chargement de la sauvegarde :', error);
		}
	}
}

function saveData() {
	try {
		fs.writeFileSync('data.json', JSON.stringify(interactionCount));
		sendConsoleMessage('info', 'Sauvegarde effectuée avec succès.');
	} catch (error) {
		sendConsoleMessage('error', 'Une erreur s\'est produite lors de la sauvegarde :', error);
	}
}

function sendConsoleMessage(type, message, error = null) {
	const date = new Date();
	const timestamp = date.toLocaleString('fr-FR', { timeZone: 'Europe/Paris' });
	switch (type) {
		case 'error':
			console.error(`[${timestamp}] [Erreur] ${message}`);
			if (error) {
				console.error(`[${timestamp}] [Erreur]`, error);
			}
			break;
		case 'info':
		default:
			console.log(`[${timestamp}] [Info] ${message}`);
			break;
	}
}

function sendChatMessage(data) {
	const currentTimestamp = Date.now();
	if (lastChatMessage === null || (currentTimestamp - lastChatMessage.timestamp > 1000 && data !== lastChatMessage.message)) {
		try {
			client.send(new osc.Message('/chatbox/input', data, true));
			lastChatMessage = { message: data, timestamp: currentTimestamp };
		} catch (error) {
			sendConsoleMessage('error', 'Une erreur s\'est produite lors de l\'envoi du message dans la chatbox de VRChat :', error);
		}
	}
}

function updateInteractionCount(interaction) {
	interactionCount[interaction] = (interactionCount[interaction] || 0) + 1;
	sendConsoleMessage('info', `Interaction: ${interaction}, Nombre: ${interactionCount[interaction]}`);
}

server.on('message', (data) => {
	const [address, flag] = data;
	if (address.startsWith('/avatar/parameters/') && flag === true) {
		const parameter = address.substring('/avatar/parameters/'.length);
		if (config.INTERACTIONS.hasOwnProperty(parameter)) {
			updateInteractionCount(parameter);
			if (config.ENABLE_CHATBOX) {
				const message = `${config.INTERACTIONS[parameter]}: ${interactionCount[parameter]}`;
				sendChatMessage(message);
			}
		}
	}
});

server.on('listening', (error) => {
	if (error) {
		sendConsoleMessage('error', `Une erreur s'est produite lors du démarrage du serveur OSC sur l'adresse [${config.ADDRESS_LISTENING}:${config.PORT_LISTENING}] :`, error);
	} else {
		sendConsoleMessage('info', `Le serveur OSC est en écoute et prêt à fonctionner à l'adresse [${config.ADDRESS_LISTENING}:${config.PORT_LISTENING}] !`);
	}
});

loadData();
setInterval(saveData, config.SAVE_INTERVAL * 60 * 1000);

process.on('SIGINT', () => {
	sendConsoleMessage('info', 'Sauvegarde des compteurs avant fermeture de l\'application...');
	saveData();
	process.exit();
});
