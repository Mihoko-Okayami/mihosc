# MihOSC

Un client OSC qui compte le nombre d'interactions avec un avatar VRChat (comme les boops, etc.).

## Installation

1. Clonez ce dépôt sur votre machine locale.
2. Assurez-vous d'avoir [Node.js](https://nodejs.org) installé ( [version 18.16.1 LTS](https://nodejs.org) ou plus récent )
3. Exécutez la commande `npm install` pour installer les dépendances.

## Configuration

Avant d'exécuter l'application, vous devez configurer les paramètres dans le fichier `config.json`. Assurez-vous de fournir les valeurs appropriées pour les champs suivants :
```json
{
  "ADDRESS_SENDING": "127.0.0.1",
  "PORT_SENDING": 9000,
  "ADDRESS_LISTENING": "0.0.0.0",
  "PORT_LISTENING": 9001,
  "ENABLE_CHATBOX": true,
  "ENABLE_WHEN_AFK": false,
  "SAVE_INTERVAL": 5,
  "INTERACTIONS": {
    "Receivers/Head/Hand": "Patpats",
    "Receivers/Head/Foot": "Masochistes",
    "Receivers/Nose/Hand": "Boops",
    "Receivers/Nose/Foot": "Fétichistes",
    "Receivers/Nose/Head": "Bisous"
  }
}
```

- **PORT_LISTENING :** Port sur lequel le serveur OSC écoutera les messages.
- **ADDRESS_LISTENING :** Adresse à laquelle le serveur OSC sera lié.
- **PORT_SENDING :** Port sur lequel le client OSC enverra les messages.
- **ADDRESS_SENDING :** Adresse à laquelle le client OSC enverra les messages.
- **ENABLE_CHATBOX :** Une valeur booléenne ( true/false ) pour activer ou désactiver l'envoi des messages à la chatbox de VRChat.
- **ENABLE_WHEN_AFK :** Une valeur booléenne ( true/false ) pour activer ou désactiver les compteurs ainsi que les messages quand AFK.
- **SAVE_INTERVAL :** Intervalle de temps en minutes pour la sauvegarde automatique des compteurs.
- **INTERACTIONS :** Liste des paramètres à surveiller sur votre avatar ainsi que le nom du compteur.

Exemple de configuration dans Unity correspondant aux paramètres par défaut de l'application :
![Configuration Unity](https://raw.githubusercontent.com/Mihoko-Okayami/mihosc/master/exemples/unity.png)

## Utilisation

Exécutez la commande `node index.js` pour démarrer l'application.  
Pour fermer l'application en sauvegardant vos compteurs, utiliser `CTRL+C`.

## Fonctionnalités

L'application écoute les messages OSC entrants sur le port spécifié dans la configuration.

Lorsqu'un message OSC est reçu avec une adresse commençant par `/avatar/parameters/` et un drapeau à `true`, l'application met à jour les compteurs d'interactions correspondants dans le fichier `data.json`.

Si la configuration `ENABLE_CHATBOX` est activée, l'application envoie également un message à la chatbox VRChat avec le nom de l'interaction et le nombre d'interactions correspondant.

**Exemple :** 

> Boops: 1337

Les compteurs d'interactions sont sauvegardés automatiquement à intervalles réguliers, définis dans la configuration `SAVE_INTERVAL` ainsi que lors de la fermeture de l'application en utilisant `CTRL+C`.
