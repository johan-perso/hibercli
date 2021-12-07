# HiberCLI

[HiberFile](https://hiberfile.com) est un service permettant de partager des fichiers (sans limite de durée et sans compte obligatoire). HiberCLI permet lui, de télécharger / envoyer des fichiers sur HiberFile. Vous pouvez également crée des groupes de liens et les partager.

HiberCLI propose quelques fonctionnalités comme :

* Création automatique d'un QR code.
* Prévisualisation des fichier .txt et .md
* Téléchargement des fichiers dans votre dossier téléchargement (seulement sous Windows)
* Création et ouverture de groupe de liens
* Copie automatique des liens dans le presse-papier


## Prérequis

* Un appareil sous Windows, macOS, Linux ou ChromeOS (Avec Crostini)
	* En gros tant que t'as NodeJS et NPM compatible avec ton système, ça passe
* [nodejs et npm](https://nodejs.org) d'installé


## Installation

```
$ (sudo) npm install --global hibercli
```


## Comment utiliser HiberCLI

Dans un terminal, faite la commande `hibercli` pour afficher la page d'aide d'HiberCLI. Pour envoyer un fichier, faite la commande `hibercli --upload <chemin/vers/le/fichier>`. Pour télécharger un fichier, faite la commande `hibercli --download <lien HiberFile>`. Pour crée un groupe de liens, faite la commande `hibercli --group <lien1> [lien2] [lien3] [lien4]` (vous pouvez mettre autant de liens que vous voulez).


## Licence

ISC © [Johan](https://johanstickman.com)
