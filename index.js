const fs = require('fs');
const osc = require('node-osc');
const config = require('./config.json');

const server = new osc.Server(config.PORT_LISTENING, config.ADDRESS_LISTENING);
const client = new osc.Client(config.ADDRESS_SENDING, config.PORT_SENDING);

let interactionCount = {};
let lastChatMessage = null;
let isAfkEnabled = false;

function loadData() {
	if (fs.existsSync('data.json')) {
		sendConsoleMessage('info', 'Chargement de la précédente sauvegarde...');
		try {
			const data = fs.readFileSync('data.json', 'utf8');
			interactionCount = JSON.parse(data);
			sendConsoleMessage('info', 'La sauvegarde a été chargée avec succès :');
			for (const interaction in interactionCount) {
				sendConsoleMessage('info', `\x1b[33m${config.INTERACTIONS[interaction]}: ${interactionCount[interaction]} ( ${interaction} )\x1b[0m`);
			}
		} catch (error) {
			sendConsoleMessage('error', 'Une erreur s\'est produite lors du chargement de la sauvegarde :', error);
			process.exit(1);
		}
	}
}

function saveData() {
	try {
		fs.writeFileSync('data.json', JSON.stringify(interactionCount));
		sendConsoleMessage('info', '\x1b[36mSauvegarde effectuée avec succès.\x1b[0m');
	} catch (error) {
		sendConsoleMessage('error', 'Une erreur s\'est produite lors de la sauvegarde :', error);
	}
}

function sendConsoleMessage(type, message, error = null) {
	const date = new Date();
	const timestamp = date.toLocaleString('fr-FR', { timeZone: 'Europe/Paris' });
	switch (type) {
		case 'error':
			console.error(`[${timestamp}] \x1b[31m[Erreur]\x1b[0m ${message}`);
			if (error) {
				console.error(`[${timestamp}] \x1b[31m[Erreur]\x1b[0m`, error);
			}
			break;
		case 'info':
		default:
			console.log(`[${timestamp}] \x1b[32m[Info]\x1b[0m ${message}`);
			break;
	}
}

function sendChatMessage(data) {
	const timestamp = Date.now();
	if (lastChatMessage === null || (timestamp - lastChatMessage.timestamp > 1000 && data !== lastChatMessage.message)) {
		try {
			client.send(new osc.Message('/chatbox/input', data, true));
			lastChatMessage = { message: data, timestamp: timestamp };
		} catch (error) {
			sendConsoleMessage('error', 'Une erreur s\'est produite lors de l\'envoi du message dans la chatbox de VRChat :', error);
		}
	}
}

function updateInteractionCount(interaction) {
	interactionCount[interaction] = (interactionCount[interaction] || 0) + 1;
	sendConsoleMessage('info', `\x1b[2m${config.INTERACTIONS[interaction]}: ${interactionCount[interaction]} ( ${interaction} )\x1b[0m`);
}

server.on('message', (data) => {
	const [address, flag] = data;
	if (address.startsWith('/avatar/parameters/') && typeof flag === 'boolean') {
		const parameter = address.substring('/avatar/parameters/'.length);
		if (parameter === 'AFK') {
			isAfkEnabled = flag;
			if (!config.ENABLE_WHEN_AFK) {
				if (flag) {
					sendConsoleMessage('info', 'Début d\'AFK => Les compteurs sont maintenant en pause.');
				} else {
					sendConsoleMessage('info', 'Fin d\'AFK => Les compteurs sont à nouveau actifs.');
				}
			}
		}
		if (isAfkEnabled && !config.ENABLE_WHEN_AFK) {
			return;
		}
		if (flag && config.INTERACTIONS.hasOwnProperty(parameter)) {
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
		sendConsoleMessage('error', `Une erreur s'est produite lors du démarrage de MihOSC à l'adresse [${config.ADDRESS_LISTENING}:${config.PORT_LISTENING}].`);
		sendConsoleMessage('error', `Assurez-vous qu'aucune autre application OSC ne fonctionne déjà sur le port ${config.PORT_LISTENING}.`, error);
		process.exit(1);
	} else {
		sendConsoleMessage('info', `MihOSC est en écoute et prêt à fonctionner à l'adresse [${config.ADDRESS_LISTENING}:${config.PORT_LISTENING}] !`);
	}
});

loadData();
setInterval(saveData, config.SAVE_INTERVAL * 60 * 1000);

process.on('SIGINT', () => {
	sendConsoleMessage('info', 'Sauvegarde des compteurs avant fermeture de l\'application...');
	saveData();
	process.exit(0);
});
