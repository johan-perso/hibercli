#!/usr/bin/env node

// Lazy Load Modules
var _require = require;
var require = function (moduleName) {
	var module;
	return new Proxy(function () {
		if (!module) {
			module = _require(moduleName)
		}
		return module.apply(this, arguments)
	}, {
		get: function (target, name) {
			if (!module) {
				module = _require(moduleName)
			}
			return module[name];
		}
	})
};

// Dépendences et quelques variables
const chalk = require('chalk');
const fs = require("fs");
const fetch = require('node-fetch');
const ora = require('ora');
const hr = require('@tsmx/human-readable');
const boxen = require('boxen');
const clipboardy = require('clipboardy');
const notifier = require('node-notifier');
const updateNotifier = require('update-notifier');
const Box = _require("cli-box");
const inquirer = require('inquirer');
const Downloader = _require('nodejs-file-downloader');
const path = require('path');
const os = require('os');
const hiberfileAPILink = process.env.HIBERCLI_API_BASELINK || "https://api.hiberfile.com"
const hiberfileWEBLink = process.env.HIBERCLI_WEB_BASELINK || "https://hiberfile.com"; const simplified_hiberfileWEBLink = hiberfileWEBLink.replace(/https:\/\//g, '').replace(/http:\/\//g, '').replace(/www\.\.\./g, '')
const pkg = require('./package.json')

// Vérifier les mises à jour
const notifierUpdate = updateNotifier({ pkg, updateCheckInterval: 10 });
if(notifierUpdate.update && pkg.version !== notifierUpdate.update.latest){
	// Afficher un message
	console.log(boxen("Mise à jour disponible " + chalk.dim(pkg.version) + chalk.reset(" → ") + chalk.green(notifierUpdate.update.latest) + "\n" + chalk.cyan("npm i -g " + pkg.name) + " pour mettre à jour", {
		padding: 1,
		margin: 1,
		align: 'center',
		borderColor: 'yellow',
		borderStyle: 'round'
	}))

	// Mettre une "notification" (bell)
	console.log('\u0007');
}

// Préparer un spinner
const spinner = ora('')

// Crée un QR Code
async function qrGenerator(qrtext){
	// Obtenir un chemin pour l'enregistrement de fichier (temporaire)
		// Crée un dossier "HiberCLI_temp" si il n'existe pas
		if(!fs.existsSync(path.join(os.tmpdir(), "HiberCli_temp"))){
			fs.mkdirSync(path.join(os.tmpdir(), "HiberCli_temp"));
		}

		// Obtenir le chemin
		var dirPath = path.join(os.tmpdir(), "HiberCli_temp")

	// Télécharger le fichier
		// Préparer le téléchargement
		const downloader = new Downloader({
			url: 'https://chart.googleapis.com/chart?cht=qr&chs=512x512&chl=' + qrtext,
			directory: dirPath,
			fileName: 'HiberCLI-TempQR.png',
			cloneFiles: false
		})

		// Télécharger le fichier
		try {
			await downloader.download();
		} catch (error) {
			console.log(chalk.red(error))
		}

	// Retourner le chemin du fichier
	return path.join(dirPath, 'HiberCLI-TempQR.png');
}

// Générer un fichier temporaire ".hibercli-links" (groupe de liens)
async function groupLinkGenerator(arrayLink){
	// Obtenir un chemin pour l'enregistrement de fichier (temporaire)
		// Crée un dossier si il n'existe pas
		if(!fs.existsSync(path.join(os.tmpdir(), "HiberCLI_temp"))){
			fs.mkdirSync(path.join(os.tmpdir(), "HiberCLI_temp"));
		}

		// Obtenir le chemin
		var dirPath = path.join(os.tmpdir(), "HiberCLI_temp")

	// Crée le fichier
	fs.writeFile(path.join(dirPath, 'HiberCLI-TempGroupLink.hibercli-links'), '[HiberCLI-LinkS by Johan_Stickman]\n\n' + arrayLink.map(u => u).join('\n'), function (err) {
		if(err) console.log(chalk.red(err))
	 });

	// Retourner le chemin du fichier
	return path.join(dirPath, 'HiberCLI-TempGroupLink.hibercli-links');
}

// Afficher une prévisualisation "box"
function showBoxPreview(text, h, align){
	// Préparer une preview
	const preview = new Box({
		w: process.stdout.columns,
		h: h.split(/\r\n|\r|\n/).length,
		stringify: false,
		marks: {
			nw: chalk.yellow('╭'),
			n: chalk.yellow('─'),
			ne: chalk.yellow('╮'),
			e: chalk.yellow('│'),
			se: chalk.yellow('╯'),
			s: chalk.yellow('─'),
			sw: chalk.yellow('╰'),
			w: chalk.yellow('│')
		},
		hAlign: align,
	}, text);

	// Retourner la preview
	return preview.stringify();
}

// Fonction pour ajouter un lien à l'historique de fichiers
function addToHistory(link, type, expirationTime){
	// Si l'historique est désactivé
	if(process.env.HIBERCLI_DISABLE_HISTORY) return false;

	// Obtenir un chemin pour l'enregistrement de l'historique
		// Crée un dossier si il n'existe pas
		if(!fs.existsSync(path.join(os.tmpdir(), "HiberCLI_temp"))){
			fs.mkdirSync(path.join(os.tmpdir(), "HiberCLI_temp"));
		}

		// Obtenir le chemin
		var dirPath = path.join(os.tmpdir(), "HiberCLI_temp")

	// Si le fichier "history.json" n'existe pas
	if(!fs.existsSync(path.join(dirPath, "history.json"))){
		fs.writeFileSync(path.join(dirPath, "history.json"), JSON.stringify({ list: [] }));
	}

	// Ajouter le lien à l'historique
	var history = JSON.parse(fs.readFileSync(path.join(dirPath, "history.json")));
	history.list.push({
		link: link,
		type: type,
		expirationDate: (new Date()).getTime() + (expirationTime * 1000),
		savedTime: new Date().getTime()
	})

	// Enregistrer l'historique
	fs.writeFileSync(path.join(dirPath, "history.json"), JSON.stringify(history));

	// Retourner l'historique
	return history;
}

// Upload / Création d'un groupe de lien : demander la durée avant expiration du fichier
async function showMenuUpload(){
	// Demander la durée du fichier
	return inquirer.prompt([
		{
			type: 'list',
			name: 'name',
			message: 'Durée avant expiration du fichier',
			choices: [
				'5 minutes',
				'30 minutes',
				'1 heure',
				'12 heures',
				'1 jour',
				'1 mois',
				new inquirer.Separator(),
				'Infini',
				'Personnalisable',
				new inquirer.Separator(),
			]
		}
	])
	.then(async answer => {
		// Selon le temps indiqué
		if(answer.name === "5 minutes") return 300;
		if(answer.name === "30 minutes") return 1800;
		if(answer.name === "1 heure") return 3600;
		if(answer.name === "12 heures") return 43200;
		if(answer.name === "1 jour") return 86400;
		if(answer.name === "1 mois") return 2592000;
		if(answer.name === "Infini") return 250000000000;
		if(answer.name === "Personnalisable") return await showMenuCustomTime();
	});
}

// Upload / Création d'un groupe de lien : choisir une durée personnalisée
async function showMenuCustomTime(){
	// Demander la durée du fichier
	return inquirer.prompt([
		{
			type: 'input',
			name: 'time',
			message: 'Durée personnalisée (en secondes)',
			validate: function(value){
				if(!value) return "Entrer une durée en seconde, le fichier sera supprimé après ce temps";
				if(isNaN(value)) return "La durée ne semble pas être un nombre valide";
				if(value < 2) return "La durée est un peu trop.. courte";
				if(value > 2592000) return "La durée est un peu trop.. longue";
				return true;
			}
		}
	])
	.then(answer => {
		// Retourner la durée
		return answer.time;
	});
}

// Upload / Création d'un groupe de lien : faire les requêtes
async function doRequestUpload(filePath, time){
	// Préparer de quoi uploader le fichier
	const stats = fs.statSync(filePath);
	let readStream = fs.createReadStream(filePath);

	// Body pour le fetch : crée le fichier
	var bodyCreate = {
		chunksNumber: 1,
		name: path.basename(filePath),
		email: (process.env.HIBERCLI_LOGIN_EMAIL ? process.env.HIBERCLI_LOGIN_EMAIL : null),
		password: (process.env.HIBERCLI_LOGIN_PASSWORD ? process.env.HIBERCLI_LOGIN_PASSWORD : null),
		expire: time
	}

	// Body pour le fetch : finaliser l'envoie
	var bodyFinish = {
		parts: [
			{
				ETag: "%ETAG%",
				PartNumber: 1
			}
		],
		uploadId: "%UPLOADID%",
		expire: time
	}

	// Faire une requête vers HiberFile : crée le fichier
	var fetchCreate = await fetch(`${hiberfileAPILink}/files/create`, { method: 'POST', body: JSON.stringify(bodyCreate), headers: { 'Content-Type': 'application/json' } })
	.then(res => res.json())
	.catch(err => {
		spinner.fail()
		console.log(chalk.red(err))
		process.exit()
	})

	// Si il y a une erreur
	if(fetchCreate.error){
		spinner.fail()
		console.log(chalk.red(fetchCreate?.message?.replace('email/password manquant',`L'API nécessite une connexion pour uploader des fichiers. Définissez les variables d'environnements ${chalk.yellow('HIBERCLI_LOGIN_EMAIL')} et ${chalk.yellow('HIBERCLI_LOGIN_PASSWORD')}.\nLes informations définies sur l'API peuvent être vues en faisant la commande ${chalk.cyan('hibercli --apiLink')}.`))?.replace('User does not exist.',"Les informations de connexion sont incorrectes"))
		process.exit()
	}

	// Faire une requête pour uploader le fichier - si on a pas d'autorisation donné (API normal d'HiberFile)
	if(!fetchCreate.authorization) var fetchUpload = await fetch(fetchCreate?.uploadUrls?.[0], { method: 'PUT', body: readStream })
	.then(res => res.headers.get("etag"))
	.catch(err => {
		spinner.fail()
		console.log(chalk.red(err))
		process.exit()
	})

	// Faire une requête pour uploader le fichier - si on A UNE autorisation donné (EteFile/Firebase)
	if(fetchCreate.authorization && fetchCreate?.authorization?.toString()?.startsWith('Firebase ')) var fetchUpload = await fetch(fetchCreate?.uploadUrls?.[0], { method: 'POST', body: readStream, headers: { 'Authorization': fetchCreate.authorization } })
	.then(res => res.json())
	.catch(err => {
		spinner.fail()
		console.log(chalk.red(err))
		process.exit()
	})

	// Faire une requête vers HiberFile : finaliser l'envoie - si on a pas de propriété "name" dans fetchUpload (c'est à dire, qu'on utilise l'API d'HiberFile)
	if(!fetchUpload?.name) var fetchFinish = await fetch(`${hiberfileAPILink}/files/${fetchCreate.hiberfileId}/finish/`, { method: 'POST', body: JSON.stringify(bodyFinish).replace(/%ETAG%/g, JSON.parse(fetchUpload)).replace(/%UPLOADID%/g, fetchCreate.uploadId), headers: { 'Content-Type': 'application/json' } })
	.then(res => res.ok)
	.catch(err => {
		spinner.fail()
		console.log(chalk.red(err))
		process.exit()
	})

	// Retourner les informations
	return fetchCreate;
}

// Afficher une notification
async function showNotification(title, message, hiberfileId){
	// Si l'os n'est pas Windows ou macOS, annuler
	if(os.platform() !== "win32" && os.platform() !== "darwin") return;

	// Si les notifications sont désactivées
	if(process.env.HIBERCLI_DISABLE_NOTIFICATIONS) return false;

	// Obtenir un QR code vers le lien HiberFile
	if(hiberfileId) var qrcode = await qrGenerator(`${hiberfileWEBLink}/d/${hiberfileId}`)
	if(!hiberfileId) var qrcode = 'Terminal Icon'

	// Afficher une notification
	notifier.notify({
		title: title,
		message: message,
		sound: false,
		icon: qrcode,
		contentImage: qrcode,
		wait: false,
		install: false
	}, function (error, response, metadata) {
		if(error) return;
		if(metadata.action === "clicked") require("openurl").open("file://" + qrcode)
	})

	// Mettre une "notification" (bell)
	console.log('\u0007');
}

// Fonction pour enlever les slash à la fin d'un texte
function removeTrailingSlash(string){
	if(string.endsWith("/")) return string.substring(0, string.length - 1);
	if(string.endsWith("\\")) return string.substring(0, string.length - 1);
	if(string.endsWith("\"")) return string.substring(0, string.length - 1);
	return string.trim();
}

// Si l'argument est help ou rien
var validArguments = ['--version','-v','--download','-d','--upload','-u','--group','-g','--history','-h','--apiLink'];
if(process.argv.slice(2)[0] === "--help" || validArguments.indexOf(process.argv.slice(2)[0]) === -1) console.log(`
 Utilisation
   $ hibercli

 Options
   --version -v          Indique la version actuellement utilisé
   --download -d         Télécharge un fichier sur votre appareil
   --upload -u           Envoie un fichier sur HiberFile
   --history -h          Affiche l'historique des fichiers uploadés
   --group -g            Crée et partage un groupe de liens
   --apiLink             Affiche le lien de l'API HiberFile

 Télécharger un fichier
   $ hibercli --download <lien hiberfile>

 Envoyer un fichier
   $ hibercli --upload /chemin/du/fichier
`)

// Donner le lien de l'API avec l'argument associé
if(process.argv.slice(2)[0] === "--apiLink"){
	console.log(`Lien de l'API (${chalk.yellow('HIBERCLI_API_BASELINK')})  : ${chalk.cyan(hiberfileAPILink)}`)
	console.log(`Lien du site  (${chalk.yellow('HIBERCLI_WEB_BASELINK')})  : ${chalk.cyan(hiberfileWEBLink)}`)
	process.exit()
}

// Donner la version avec l'argument associé
if(process.argv.slice(2)[0] === "--version" || process.argv.slice(2)[0] === "-v"){
	console.log(`HiberCLI utilise actuellement la version ${chalk.cyan(require('./package.json').version)}`)
	console.log("────────────────────────────────────────────")
	console.log("Développé par Johan le stickman")
	console.log(chalk.cyan("https://johanstick.me"))
	process.exit()
}

// Déterminer si on souhaite télécharger, envoyer un fichier ou crée un groupe de liens
if(process.argv.slice(2)[0] === "--download" || process.argv.slice(2)[0] === "-d"){
	// Vérifier si un argument a été donné
	if(!process.argv.slice(2)[1]) console.log(chalk.red("Utilisation de la commande : ") + chalk.cyan("hibercli --download <lien du fichier>")) & process.exit()

	// Télécharger le fichier
	download(process.argv.slice(2)[1])
}

if(process.argv.slice(2)[0] === "--upload" || process.argv.slice(2)[0] === "-u"){
	// Vérifier si un argument a été donné
	if(!process.argv.slice(2)[1]) console.log(chalk.red("Utilisation de la commande : ") + chalk.cyan("hibercli --upload <chemin vers un fichier>")) & process.exit()

	// Vérifier si le chemin existe
	if(!fs.existsSync(removeTrailingSlash(process.argv.slice(2)[1]))) return console.log(chalk.red("Le fichier n'a pas pu être trouvé."))

	// Afficher le menu d'upload de fichiers
	upload(removeTrailingSlash(process.argv.slice(2)[1]), "option show menu")
}

if(process.argv.slice(2)[0] === "--history" || process.argv.slice(2)[0] === "-h"){
	// Si l'historique est désactivé
	if(process.env.HIBERCLI_DISABLE_HISTORY){
		return console.log(`L'historique semble être désactivé. Pour le réactiver, supprimer la variable d'environnement ${chalk.yellow('HIBERCLI_DISABLE_HISTORY')}`)
	}

	// Obtenir un chemin pour l'enregistrement de l'historique
		// Crée un dossier si il n'existe pas
		if(!fs.existsSync(path.join(os.tmpdir(), "HiberCLI_temp"))){
			fs.mkdirSync(path.join(os.tmpdir(), "HiberCLI_temp"));
		}

		// Obtenir le chemin
		var dirPath = path.join(os.tmpdir(), "HiberCLI_temp")

	// Si le fichier "history.json" n'existe pas
	if(!fs.existsSync(path.join(dirPath, "history.json"))){
		fs.writeFileSync(path.join(dirPath, "history.json"), JSON.stringify({ list: [] }));
	}

	// Obtenir l'historique
	var history;
	try {
		history = JSON.parse(fs.readFileSync(path.join(dirPath, "history.json")))
	} catch (error) {
		// Réinitialiser l'historique
		fs.writeFileSync(path.join(dirPath, "history.json"), JSON.stringify({ list: [] }));
		history = { list: [] }
	}
	history = history?.list

	// Si l'historique est vide
	if(!history || history.length == 0){
		console.log(chalk.red("Votre historique est actuellement vide."))
		process.exit()
	}

	// Mettre les type "group" au début, puis le type "file"
	history = history.sort(function(a, b){
		if(a.type == "group" && b.type == "file") return -1;
		if(a.type == "file" && b.type == "group") return 1;
		return 0;
	})

	// Préparer de quoi filtrer l'historique en 2 parties
	var history_notExpired = []
	var history_expired = []

	// Filtrer l'historique
	for(var i = 0; i < history.length; i++){
		// Si le lien n'est pas expiré
		if(history[i].expirationDate > Date.now()){
			history_notExpired.push(history[i])
		} else {
			history_expired.push(history[i])
		}
	}

	// Afficher les élements expirés
	if(history_expired?.length) console.log(chalk.bold('Elements expirés :'))
	history_expired.forEach(item => {
		console.log(`• ${chalk.cyan(item.link)} :\n   Type                  : ${chalk.gray(item.type.replace('file','fichier 📄').replace('group','groupe 🔗'))}\n   Date d'expiration     : ${chalk.gray(new Date(item.expirationDate).toLocaleString())}\n   Date d'enregistrement : ${chalk.gray(new Date(item.savedTime).toLocaleString())}\n`)
	})

	// Afficher un séparateur
	if(history_notExpired?.length && history_expired?.length) console.log(chalk.yellow("─".repeat(parseInt(process.stdout.columns))) + '\n')

	// Afficher les élements non expirés
	if(history_notExpired?.length) console.log(chalk.bold('Elements non expirés :'))
	history_notExpired.forEach(item => {
		console.log(`• ${chalk.cyan(item.link)} :\n   Type                  : ${chalk.gray(item.type.replace('file','fichier 📄').replace('group','groupe 🔗'))}\n   Date d'expiration     : ${chalk.gray(new Date(item.expirationDate).toLocaleString())}\n   Date d'enregistrement : ${chalk.gray(new Date(item.savedTime).toLocaleString())}\n`)
	})

	// Demander si on veut effectuer des actions supplémentaires
	console.log()
	inquirer.prompt([
		{
			type: "list",
			name: "action",
			message: "Que souhaitez-vous faire ?",
			choices: [
				"Afficher le fichier",
				"Supprimer l'historique",
				"Quitter"
			]
		}
	]).then(answers => {
		// Si on veut l'afficher
		if(answers.action === "Afficher le fichier"){
			// Déminifier le fichier
			try {
				fs.writeFileSync(path.join(dirPath, "history.json"), JSON.stringify(JSON.parse(fs.readFileSync(path.join(dirPath, "history.json"), "utf8")), null, 4))
			} catch (error){}

			// Ouvrir le fichier
			require("openurl").open("file://" + path.join(dirPath, "history.json"))
		}

		// Si on veut le supprimer
		if(answers.action === "Supprimer l'historique"){
			// Supprimer le fichier
			fs.unlinkSync(path.join(dirPath, "history.json"))

			// Afficher un message
			console.log(chalk.green("L'historique a été supprimé."))
		}

		// Si on veut quitter
		if(answers.action === "Quitter") process.exit()
	})
}

if(process.argv.slice(2)[0] === "--group" || process.argv.slice(2)[0] === "-g"){
	// Vérifier si un argument a été donné
	if(!process.argv.slice(2)[1]) console.log(chalk.red("Utilisation de la commande : ") + chalk.cyan("hibercli --group <lien1> [lien2] [lien3] [lien4] [lien5] [lien6]")) & process.exit()

	// Liste des liens
	var list = []
	process.argv.slice(2).forEach(url => {
		// Empêcher le premier argument (souvent --group) d'être dans l'array
		if(url === process.argv.slice(2)[0]) return;

		// Ajouter le lien à la liste
		list.push(url)
	})

	// Crée un groupe de lien
	createGroupLink(list, "option show menu")
}

// Fonction pour uploader un fichier
async function upload(filePath, time){
	// Si le temps est d'afficher le menu
	if(time === "option show menu"){
		var showMenuTime = await showMenuUpload()
		return upload(filePath, showMenuTime)
	}

	// Si c'est un dossier
	var fileName = path.basename(filePath);
	var isArchiveSelfGenerated = false;
	if(fs.lstatSync(filePath).isDirectory()){
		// Définir l'archive comme généré automatiquement
		isArchiveSelfGenerated = true;

		// Créer l'archive
		zip = require('archiver')('zip', { zlib: { level: 9 } });
		spinner.text = `Création de ${chalk.green(`${fileName}.zip`)}`
		spinner.start()// En cas d'erreur
		zip.on('error', function(err) {
			spinner.text = chalk.red(err.message || err)
			spinner.fail()
			process.exit(1)
		})

		// Obtenir un chemin pour l'enregistrement de l'historique
			// Crée un dossier si il n'existe pas
			if(!fs.existsSync(path.join(os.tmpdir(), "HiberCLI_temp"))){
				fs.mkdirSync(path.join(os.tmpdir(), "HiberCLI_temp"));
			}

			// Obtenir le chemin
			var dirPath = path.join(os.tmpdir(), "HiberCLI_temp")

		// Pipe l'archive vers un fichier temporaire
		zip.pipe(fs.createWriteStream(path.join(dirPath, `${fileName}.zip`)))

		// Ajouter les fichiers et dossiers
		fs.readdirSync(filePath).forEach(file => {
			// Si c'est un dossier, l'ajouter
			if(fs.lstatSync(path.join(filePath, file)).isDirectory()){
				spinner.text = `Création d'une archive : ${chalk.blue(file)}`
				zip.directory(path.join(filePath, file), file);
			}

			// Sinon, ajouter le fichier
			else {
				spinner.text = `Création d'une archive : ${chalk.blue(file)}`
				zip.file(path.join(filePath, file), { name: file });
			}
		});

		// Modifier le spinner quand c'est terminé
		zip.on('end', () => {
			spinner.succeed()
		})

		// Finaliser la création de l'archive
		spinner.text = `Création de ${chalk.green(`${fileName}.zip`)}`
		await zip.finalize();

		// Modifier le chemin du fichier à uploader
		filePath = path.join(dirPath, `${fileName}.zip`)
	}

	// Si le fichier pèse plus de 5 GB
	var stats = fs.statSync(filePath)
	if(stats.size > 5000000000){
		// Si le fichier expire dans plus d'un mois
		if(time > 2592000){
			console.log(chalk.yellow(`Votre fichier pèse ${chalk.bold(hr.fromBytes(stats.size, 'BYTE', 'MBYTE'))} et ${(time == 250000000000 ? "n'expire pas" : "est censé expirer le " + chalk.bold(new Date(Date.now() + (time * 1000)).toLocaleDateString()))}.`))
			console.log(`La durée maximale d'expiration d'un fichier est défini sur "1 mois" sur ${chalk.cyan(simplified_hiberfileWEBLink)}, mais HiberCLI vous permet d'uploader les fichiers de moins de 5 GB sans limite.`)
			return process.exit()
		}

		// Afficher la taille du fichier
		console.log(chalk.yellow(`\nLe fichier que vous tentez d'uploader pèse ${chalk.bold(hr.fromBytes(stats.size, 'BYTE', 'MBYTE'))}.`))

		// Demander si on est sûr de vouloir l'upload
		var sureToUploadFile = await inquirer.prompt([
			{
				type: 'confirm',
				name: 'confirm',
				message: "Êtes-vous sûr d'uploader ce fichier ?",
				default: false
			}
		])

		// Si on ne veut pas uploader le fichier, arrêter le processus
		if(!sureToUploadFile.confirm) return process.exit()
	}

	// Afficher un spinner
	spinner.start()
	spinner.text = "Envoi du fichier en cours..."

	// Faire les requêtes
	var fetchCreate = await doRequestUpload(filePath, time)

	// Ajouter le fichier à l'historique
	addToHistory(`${hiberfileWEBLink}/d/${fetchCreate.hiberfileId}`, 'file', time)

	// Arrêter le spinner
	spinner.text = "Fichier envoyé : "
	spinner.succeed()

	// Copier le lien dans le presse papier
	if(!process.env.HIBERCLI_DISABLE_AUTO_WRITE_CLIPBOARD) clipboardy.write(`${hiberfileWEBLink}/d/${fetchCreate.hiberfileId}`).catch(err => {})

	// Donner le lien
	console.log(chalk.cyan(`${hiberfileWEBLink}/d/${fetchCreate.hiberfileId}`));

	// Afficher une notification
	showNotification("HiberCLI - Partage de fichier", `${path.basename(filePath)} uploadé avec succès.\n${simplified_hiberfileWEBLink}/d/${fetchCreate.hiberfileId}`, fetchCreate.hiberfileId)

	// Supprimer le fichier si l'archive a été autogénéré
	if(isArchiveSelfGenerated == true){
		fs.unlinkSync(filePath)
	}

	// Arrêter le processus automatiquement (car la notif le fait attendre)
	setTimeout(() => process.exit(), 5000)
}

// Fonction pour télécharger un fichier
async function download(link){
	// Afficher un spinner : obtention des informations du fichier
	spinner.start()
	spinner.text = "Obtention des informations du fichier..."

	// Obtenir l'ID HiberFile (note : le "hiberfile.comD" est voulu)
	if(!link.endsWith("/")) var id = link.split("/")
	if(link.endsWith("/")) var id = link.slice(0, -1).split("/")
	id = id[id.length - 1]

	// Faire une requête pour le code HTTP
	var fetchCode = await fetch(`${hiberfileAPILink}/files/${id}`, { method: 'GET' })
	.then(res => res.statusText)
	.catch(err => {
		spinner.fail()
		console.log(chalk.red(err))
		process.exit()
	})

	// Si le code erreur est...
	if(fetchCode === "Not Found"){
		spinner.text = "Fichier introuvable"
		return spinner.fail()
	}
	if(fetchCode === "Too Early"){
		spinner.text = "Le fichier n'est pas encore uploadé"
		return spinner.fail()
	}

	// Obtenir des informations sur le fichier
	var fetchInfo = await fetch(`${hiberfileAPILink}/files/${id}`, { method: 'GET' })
	.then(res => res.json())
	.catch(err => {
		spinner.fail()
		console.log(chalk.red(err))
		process.exit()
	})

	// Modifier l'état du spinner (l'arrêter)
	spinner.text = "Obtention des informations du fichier"
	spinner.succeed()

	// Si la prévisualisation des fichier n'est pas désactivée
	if(!process.env.HIBERCLI_DISABLE_PREVIEW){
		// Obtenir le contenu du fichier (pour afficher une préview)
		if(fetchInfo.filename.endsWith(".txt") || fetchInfo.filename.endsWith(".link") || fetchInfo.filename.endsWith(".hibercli-links")) var fetchContent = await fetch(fetchInfo.downloadUrl, { method: 'GET' })
		.then(res => res.text())
		.catch(err => {
			console.log(chalk.red(err))
			process.exit()
		})

		// Afficher une prévisualisation si possible
		if(fetchInfo.filename.endsWith(".txt")){
			// Obtenir une preview
			var preview = showBoxPreview(fetchContent, fetchContent, 'left')

			// Afficher la preview
			console.log("Prévisualisation du fichier texte : ")
			console.log(preview)
		}
		if(fetchInfo.filename.endsWith(".link")){
			// Obtenir une preview
			var preview = showBoxPreview(fetchContent.replace("[HiberCLI-Link by Johan_Stickman]", "").replace("OriginalURL:", "").replace(/\n/g, ""), fetchContent.replace("[HiberCLI-Link by Johan_Stickman]", "").replace("OriginalURL:", "").replace(/\n/g, ""), 'middle')

			// Afficher la preview
			console.log("Prévisualisation du fichier lien : ")
			return console.log(preview)
		}
		if(fetchInfo.filename.endsWith(".hibercli-links")){
			// Faire un array avec la liste des sites
			var listWeb = fetchContent.toString().replace(/\r\n/g,'\n').split('\n');
			var arrayWebsite = []
			for(let i of listWeb) {
				if(i !== "[HiberCLI-LinkS by Johan_Stickman]" && i !== "" && i !== " ") arrayWebsite.push(i)
			}

			// Afficher un menu de sélection
			return inquirer.prompt([
				{
					type: 'checkbox',
					name: 'url',
					message: 'Choissisez les sites à ouvrir',
					choices: arrayWebsite
				}
			])
			// Quand une réponse est obtenu
			.then(answer => {
				// Afficher un spinner
				spinner.start()
				spinner.text = "Ouverture des sites..."

				// Si aucun site n'a été choisi
				if(!answer.url || answer.url && !answer.url[0]){
					spinner.text = "Aucun site choisi"
					return spinner.fail()
				}

				// Ouvrir les sites
				answer.url.forEach(url => {
					// Ouvrir le/les sites
					require("openurl").open(url)
				})

				// Arrêter le spinner
				spinner.text = "Sites ouverts dans un navigateur"
				spinner.succeed()
			});
		}
	}

	// Vérifier si un fichier avec ce nom n'existe pas déjà
	if(fs.existsSync(path.join(process.cwd(), fetchInfo.filename))){
		// Si on doit directement rempalcer sans demander
		if(process.env.HIBERCLI_REPLACE_WITHOUT_ASKING) fs.unlinkSync(path.join(process.cwd(), fetchInfo.filename))
		else {
			// Si oui, demander si l'utilisateur veut le remplacer
			var answer = await inquirer.prompt([
				{
					type: 'confirm',
					name: 'replace',
					message: `Un fichier portant le nom "${fetchInfo.filename}" existe déjà. Voulez-vous le remplacer ?`,
					default: false
				}
			])

			// Si l'utilisateur ne veut pas le remplacer, obtenir un nom différent qui n'existe pas déjà
			if(!answer.replace){
				var newName = fetchInfo.filename
				while(fs.existsSync(path.join(process.cwd(), newName))){
					newName = `${Math.floor(Math.random() * 100)}_${fetchInfo.filename}`
				}
				fetchInfo.filename = newName
			}

			// Si l'utilisateur veut le remplacer, supprimer le fichier
			else fs.unlinkSync(path.join(process.cwd(), fetchInfo.filename))
		}
	}

	// Afficher un spinner : téléchargement de ...
	spinner.text = `Téléchargement de ${fetchInfo.filename}...`
	spinner.start()

	// Préparer le téléchargement
	const downloader = new Downloader({
		url: fetchInfo.downloadUrl,
		directory: path.join(process.cwd()),
		fileName: fetchInfo.filename,
		onProgress: function (percentage, chunk, remainingSize){
			// Modifier le spinner
			spinner.text = `Téléchargement de ${fetchInfo.filename} : ${percentage} %, ${hr.fromBytes(remainingSize, 'BYTE', 'MBYTE')} restant.`

			// Si on est à 100%
			if(percentage === "100.00") spinner.text = `Téléchargement de ${fetchInfo.filename} effectué.`
		}
	})

	// Télécharger le fichier
	try {
		await downloader.download();
	} catch (error) {
		console.log(chalk.red(error))
	}

	// Arrêter le spinner
	spinner.text = `Téléchargement de ${fetchInfo.filename} effectué.`
	spinner.succeed()

	// Donner l'emplacement du fichier
	console.log(chalk.green("✔") + chalk.dim("  Le fichier se trouve dans ") + chalk.cyan(path.join(path.join(process.cwd()), fetchInfo.filename)))

	// Afficher une notification
	showNotification("HiberCLI - Téléchargement", `${fetchInfo.filename} vient de se téléchargé avec succès.`)

	// Si le fichier est un fichier .zip
	if(fetchInfo.filename.endsWith(".zip")){
		// Demander si on veut extraire
		if(!process.env.HIBERCLI_AUTO_EXTRACT_ZIP) var answer = await inquirer.prompt([
			{
				type: 'confirm',
				name: 'extract',
				message: `Voulez-vous extraire l'archive ?`,
				default: true
			}
		]); else var answer = { extract: true }

		// Si on veut extraire
		if(answer.extract){
			// Extraire l'archive
			var extractor = require('extract-zip');
			await extractor(path.join(process.cwd(), fetchInfo.filename), { dir: process.cwd() }, function (err) {
				// En cas d'erreur
				if(err) return console.log(err)
			})

			// Supprimer l'archive
			fs.unlinkSync(path.join(process.cwd(), fetchInfo.filename))
		}
	}

	// Si le fichier est un fichier .json
	if(fetchInfo.filename.endsWith(".json")){
		// Tenter de lire le fichier
		var fetchContent;
		try {
			fetchContent = require(path.join(process.cwd(), fetchInfo.filename))
		} catch (error) {
			fetchContent = null
		}

		// Si la propriété "configVersion", "clipboardy" et "account" existe : on suppose que c'est une configuration Twitterminal
		if(fetchContent && fetchContent.configVersion && fetchContent.clipboardy && fetchContent.account){
			// Obtenir la liste des comptes
			var listTwitterminalAccount = Object?.keys(fetchContent?.accountList || [])

			// Si il n'y a pas de compte, on laisse tomber
			if(!listTwitterminalAccount || (listTwitterminalAccount && !listTwitterminalAccount?.length)) return;

			// Vérifier si Twitterminal est installé sur l'appareil
				// Faire une commande pour obtenir le chemin de la configuration
				var configPath;
				try {
					configPath = require('child_process')?.execSync('twitterminal -cp', { stdio: 'pipe' })?.toString()?.replace(/\n/g, "")
				} catch (error) {}

				// Si la commande n'a pas marché
				if(!configPath || configPath == "") return;

			// Demander si on veut remplacer la configuration actuelle par celle-ci
			console.log(`Le fichier téléchargé est considéré comme une configuration Twitterminal.`)
			if(!process.env.HIBERCLI_AUTO_USE_TWITTERMINAL_SAVE) var wantToReplaceTwitterminalConfig = await inquirer.prompt([
				{
					type: 'confirm',
					name: 'replace',
					message: "Voulez-vous l'utiliser ?",
					default: false
				}
			]); else var answer = { replace: true }

			// Si on ne veut pas remplacer, laissons tomber :(
			if(!wantToReplaceTwitterminalConfig.replace) return;

			// Sinon, c'est parti pour la remplacer :)
			spinner.text = "Remplacement de la configuration Twitterminal..."
			spinner.start()

			// Faire une copie de la précédente configuration
			var oldConfig = require('fs').readFileSync(configPath, 'utf8')
			fs.writeFileSync(path.join(path.dirname(configPath), 'twitterminalConfig.old.json'), oldConfig)

			// Remplacer la configuration
			fs.writeFileSync(configPath, JSON.stringify(fetchContent, null, 2))

			// C'est bon, c'est fini
			spinner.text = 'Configuration Twitterminal remplacée.'
			spinner.succeed()

			// Dire également qu'une copie a été faite
			console.log(chalk.dim("Une copie de la configuration Twitterminal a été créée dans ") + chalk.cyan(path.join(path.dirname(configPath), 'twitterminalConfig.old.json')))
		}
	}

	// Arrêter le processus automatiquement (car la notif le fait attendre)
	setTimeout(() => process.exit(), 5000)
}

// Fonction pour crée un groupe de lien
async function createGroupLink(arrayLink, time){
	// Si le temps est d'afficher le menu
	if(time === "option show menu"){
		var showMenuTime = await showMenuUpload()
		return createGroupLink(arrayLink, showMenuTime)
	}

	// Si aucun lien n'a été fourni
	if(!arrayLink || arrayLink && !arrayLink[0]) return console.log(chalk.red("Aucun lien n'a été spécifié..."))

	// Faire un fichier temporaire
	var groupFile = await groupLinkGenerator(arrayLink)

	// Faire les requêtes
	var fetchCreate = await doRequestUpload(groupFile, time)

	// Afficher un spinner
	spinner.start()
	spinner.text = "Envoi du groupe à HiberFile..."

	// Ajouter le groupe à l'historique
	addToHistory(`${hiberfileWEBLink}/d/${fetchCreate.hiberfileId}`, 'group', time)

	// Arrêter le spinner
	spinner.text = "Groupe crée : "
	spinner.succeed()

	// Copier le lien dans le presse papier
	if(!process.env.HIBERCLI_DISABLE_AUTO_WRITE_CLIPBOARD) clipboardy.write(`${hiberfileWEBLink}/d/${fetchCreate.hiberfileId}`).catch(err => {})

	// Donner le lien
	console.log(chalk.cyan(`${hiberfileWEBLink}/d/${fetchCreate.hiberfileId}`));

	// Afficher une notification
	showNotification("HiberCLI - Groupe de liens", `Groupe de lien crée avec succès.\n${simplified_hiberfileWEBLink}/d/${fetchCreate.hiberfileId}`, fetchCreate.hiberfileId)

	// Arrêter le processus automatiquement (car la notif le fait attendre)
	setTimeout(() => process.exit(), 5000)
}
