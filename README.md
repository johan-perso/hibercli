### Fin de l'hébergement d'HiberFile

L'hébergement d'HiberFile s'arrêtera un peu avant la fin de l'année, le 31 août 2022. A ce moment là, HiberCLI ne vous permettra plus de télécharger ou uploader des fichiers à partir des serveurs d'HiberFile.

En attendant, vous pouvez continuer à utiliser HiberFile (et HiberCLI) jusqu'à sa fin, ou utiliser [SendOverNetwork](https://github.com/johan-perso/sendovernetwork) (CLI) et [SwissTransfer](https://swisstransfer.com) (WEB).

Vous pouvez également héberger votre propre instance vous même, et modifier certains paramètres pour qu'HiberFile n'utilise pas l'API d'HiberFile mais la votre.

> Si vous hébergez l'API, mais pas le site, vous serez tout de même dans la possibilité de télécharger et uploader des fichiers depuis le CLI

* HiberFile (utilise Amazon S3) : [API](https://github.com/HiberFile/HiberAPI) | [Site](https://github.com/hiberfile/hiberfile)
* EteFile (utilise Firebase) : [API](https://github.com/johan-perso/etefile-api) | [Site](https://github.com/johan-perso/etefile-web)

*Source : [Twitter / HiberFile](https://twitter.com/HiberFile/status/1552227485500194817)*


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

Vous pouvez modifier certains paramètres d'HiberCLI grâce aux variables d'environnements suivantes :

| Nom                                     | Utilité                                                           | Valeur par défaut         |
|-----------------------------------------|-------------------------------------------------------------------|---------------------------|
| `HIBERCLI_LOGIN_EMAIL`                  | Permet d'entrer une adresse mail pour se connecter à EteFile      |                           |
| `HIBERCLI_LOGIN_PASSWORD`               | Permet d'entrer un mot de passe pour se connecter à EteFile       |                           |	
| `HIBERCLI_API_BASELINK`                 | API (téléchargement et envoie de fichiers)                        | https://api.hiberfile.com |
| `HIBERCLI_WEB_BASELINK`                 | WEB (télécharger des fichiers depuis son navigateur)              | https://hiberfile.com     |
| `HIBERCLI_DISABLE_HISTORY`              | Désactive l'historique d'upload                                   |                           |
| `HIBERCLI_DISABLE_NOTIFICATIONS`        | Désactive les notifications sous Windows et macOS                 |                           |
| `HIBERCLI_DISABLE_AUTO_WRITE_CLIPBOARD` | Désactive la copie des liens dans le presse papier                |                           |
| `HIBERCLI_DISABLE_PREVIEW`              | Désactive les prévisualisations de fichiers                       |                           |
| `HIBERCLI_REPLACE_WITHOUT_ASKING`       | Remplace les fichiers sans demandés lorsqu'un conflit est détecté |                           |
| `HIBERCLI_AUTO_EXTRACT_ZIP`             | Extrait les fichiers .zip lors du téléchargement sans demander    |                           |
| `HIBERCLI_AUTO_USE_TWITTERMINAL_SAVE`   | Importe les configurations [Twitterminal](https://github.com/johan-perso/twitterminal) sans demander             |                           |

> Vous pouvez utiliser la commande `hibercli --apiLink` pour voir les paramètres actuellement définis pour les variables `HIBERCLI_API_BASELINK` et `HIBERCLI_WEB_BASELINK`

> Seul les 4 premiers paramètres peuvent contenir une valeur spécifique. Les autres variables peuvent être activé en définissant une valeur (n'importe laquelle), ou désactivé (ne pas définir de valeur).

> `HIBERCLI_DISABLE_PREVIEW` désactive également la fonctionnalité des groupes de liens


## Liés

* [DylanAkp/HiberSend](https://github.com/DylanAkp/HiberSend) - Ajoute une option "Partager avec HiberFile" dans le menu contextuel d'un fichier de l'explorateur de fichiers.
* [HiberFile](https://api.hiberfile.com/documentation) - Documentation de l'API d'HiberFile
* [EteFile](https://github.com/johan-perso/etefile-api) - Alternative à l'API d'HiberFile en utilisant Firebase


## Licence

MIT © [Johan](https://johanstick.me)
