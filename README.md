### Fin de l'hébergement d'HiberFile

L'hébergement d'HiberFile s'arrêtera en fin d'année, le 31 décembre 2022. A ce moment là, HiberCLI ne vous permettra plus de télécharger ou uploader des fichiers, et le repo GitHub sera archivé.

Source : [Twitter / HiberFile](https://twitter.com/HiberFile/status/1540049377800208390).

Une alternative à HiberCLI est prévu, mais arrivera sûrement à la fin de l'année. En attendant, vous pouvez continuer à utiliser HiberFile (et HiberCLI) jusqu'à sa fin, ou utiliser [SendOverNetwork](https://github.com/johan-perso/sendovernetwork) (CLI) et [SwissTransfer](https://swisstransfer.com) (WEB).


# HiberCLI

[HiberFile](https://hiberfile.com) est un service permettant de partager des fichiers rapidement et sans compte obligatoire. HiberCLI permet lui, de télécharger / envoyer des fichiers sur HiberFile. Vous pouvez également crée des groupes de liens et les partager.

HiberCLI propose quelques fonctionnalités comme :

* Affichage d'un QR code lors de l'upload sur Windows (via une notification)
* Prévisualisation des fichier .txt et .md
* Importation automatique des sauvegardes [Twitterminal](https://github.com/johan-perso/twitterminal)
* Création et ouverture de groupe de liens
* Copie automatique des liens dans le presse-papier
* Historique des uploads


## Prérequis

* Un appareil sous Windows, macOS, Linux ou ChromeOS (en passant par Crostini)
* [nodejs et npm](https://nodejs.org) d'installé


## Installation

```
$ (sudo) npm install --global hibercli
```


## Comment utiliser HiberCLI

Dans un terminal, faite la commande `hibercli` pour afficher la page d'aide d'HiberCLI. Pour envoyer un fichier, faite la commande `hibercli --upload <chemin/vers/le/fichier>`. Pour télécharger un fichier, faite la commande `hibercli --download <lien HiberFile>`.


## Liés

* [DylanAkp/HiberSend](https://github.com/DylanAkp/HiberSend) - Ajoute une option "Partager avec HiberFile" dans le menu contextuel d'un fichier de l'explorateur de fichiers.
* [HiberFile](https://api.hiberfile.com/documentation) - Documentation de l'API d'HiberFile


## Licence

MIT © [Johan](https://johanstickman.com)
