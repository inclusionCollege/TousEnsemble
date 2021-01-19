# ProjetINCENDI
-------------------

Installer Git : https://git-scm.com/downloads

Pour ajouter le projet sur votre ordinateur : git clone https://github.com/EnseirbTelecom/ProjetINCENDI.git

Il faut installer NodeJS (https://nodejs.org/en/download/) et NPM pour utiliser le Firebase CLI (Command Line Interface) qui sert à lancer les commandes firebase
Ensuite, il faut lancer `npm install -g firebase-tools` pour installer le nécessaire pour firebase
https://firebase.google.com/docs/cli/

Puis, lancer `firebase deploy` pour déployer le site sur Firebase Cloud

## Namming convention
-----------------------

### General convention

**language** : English

explicit names will be used

### HTML, CSS

**class** : camelCase

**id** : camelCase

### JavaScript, TypeScript

**variable** : camelCase

**function** : camelCase

**constructor** : PascalCase

no anonymous functions except for arrow functions

### JSON

**key** : snake_case
