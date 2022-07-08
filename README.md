### Fin de l'hébergement d'HiberFile

L'hébergement d'HiberFile s'arrêtera en fin d'année, le 31 décembre 2022. A ce moment là, HiberCLI ne vous permettra plus de télécharger ou uploader des fichiers à partir des serveurs d'HiberFile.

Source : [Twitter / HiberFile](https://twitter.com/HiberFile/status/1540049377800208390).

Une alternative à HiberCLI est prévu, mais arrivera sûrement à la fin de l'année. En attendant, vous pouvez continuer à utiliser HiberFile (et HiberCLI) jusqu'à sa fin, ou utiliser [SendOverNetwork](https://github.com/johan-perso/sendovernetwork) (CLI) et [SwissTransfer](https://swisstransfer.com) (WEB).

Vous pouvez également héberger HiberFile ([API](https://github.com/HiberFile/HiberAPI) et [Site](https://github.com/hiberfile/hiberfile)) vous même, et modifier certaines variables d'environnements pour faire qu'HiberCLI utilise votre instance.


# HiberCLI

[HiberFile](https://hiberfile.com) est un service permettant de partager des fichiers rapidement et sans compte obligatoire. HiberCLI permet lui, de télécharger / envoyer des fichiers sur HiberFile. Vous pouvez également crée des groupes de liens et les partager.

HiberCLI propose quelques fonctionnalités comme :

* Affichage d'un QR code lors de l'upload sur Windows (via une notification)
* Importation automatique des sauvegardes [Twitterminal](https://github.com/johan-perso/twitterminal)
* Création/extraction de fichiers .zip
* Historique des uploads
* Copie automatique des liens dans le presse-papier
* Prévisualisation des fichier .txt
* Création et ouverture de groupe de liens


## Prérequis

* Un appareil sous Windows, macOS, Linux ou ChromeOS (en passant par Crostini)
* [nodejs et npm](https://nodejs.org) d'installé


## Installation

```
$ (sudo) npm install --global hibercli
```


## Comment utiliser HiberCLI

Dans un terminal, faite la commande `hibercli` pour afficher la page d'aide d'HiberCLI. Pour envoyer un fichier, faite la commande `hibercli --upload <chemin/vers/le/fichier>`. Pour télécharger un fichier, faite la commande `hibercli --download <lien HiberFile>`.


## Variables d'environnements

Vous pouvez modifier le lien de l'API et du site utilisé par HiberCLI grâce aux variables d'environnements suivantes 

| Nom                     | Utilité                                              | Valeur par défaut         |
|-------------------------|------------------------------------------------------|---------------------------|
| `HIBERCLI_API_BASELINK` | API (téléchargement et envoie de fichiers)           | https://api.hiberfile.com |
| `HIBERCLI_WEB_BASELINK` | WEB (télécharger des fichiers depuis son navigateur) | https://hiberfile.com     |

Vous pouvez utiliser la commande `hibercli --apiLink` pour voir les paramètres actuellement définis.


## Liés

* [DylanAkp/HiberSend](https://github.com/DylanAkp/HiberSend) - Ajoute une option "Partager avec HiberFile" dans le menu contextuel d'un fichier de l'explorateur de fichiers.
* [HiberFile](https://api.hiberfile.com/documentation) - Documentation de l'API d'HiberFile


## Licence

MIT © [Johan](https://johanstickman.com)
