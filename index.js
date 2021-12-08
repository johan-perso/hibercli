#!/usr/bin/env node

// Dépendences et quelques variables
const chalk = require('chalk');
const fs = require("fs");
const fetch = require('node-fetch');
const ora = require('ora');
const hr = require('@tsmx/human-readable');
const marked = require('marked');
const boxen = require('boxen');
const clipboardy = require('clipboardy');
const notifier = require('node-notifier');
const updateNotifier = require('update-notifier');
const TerminalRenderer = require('marked-terminal');
const Box = require("cli-box");
const inquirer = require('inquirer');
const Downloader = require('nodejs-file-downloader');
const path = require('path');
const os = require('os');
const hiberfileLink = "https://api.hiberfile.com/"
const pkg = require('./package.json')

// Système de mise à jour
const notifierUpdate = updateNotifier({ pkg, updateCheckInterval: 10 });

if (notifierUpdate.update && pkg.version !== notifierUpdate.update.latest){
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
		if (!fs.existsSync(path.join(os.tmpdir(), "HiberCli_temp"))){
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
		// Crée un dossier "download" si il n'existe pas
		if (!fs.existsSync(path.join(os.tmpdir(), "HiberCLI_temp"))){
			fs.mkdirSync(path.join(os.tmpdir(), "HiberCLI_temp"));
		}

		// Obtenir le chemin
		var dirPath = path.join(os.tmpdir(), "HiberCLI_temp")

	// Crée le fichier
	fs.writeFile(path.join(dirPath, 'HiberCLI-TempGroupLink.hibercli-links'), '[HiberCLI-LinkS by Johan_Stickman]\n\n' + arrayLink.map(u => u).join('\n'), function (err) {
		if (err) console.log(chalk.red(err))
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

// Upload / Création d'un groupe de lien : demander la durée avant expiration du fichier
async function showMenuUpload(){
	// Demander la durée du fichier
	return inquirer.prompt([
		{
			type: 'list',
			name: 'name',
			message: ' Durée avant expiration du fichier',
			choices: [
				'5 minutes',
				'30 minutes',
				'1 heure',
				'12 heures',
				'1 jour',
				'1 mois',
				'1 année',
				new inquirer.Separator(),
				'Infini'
			]
		}
	])
	.then(answer => {
		// Selon le temps indiqué
		if(answer.name.toLowerCase() === "5 minutes") return 300;
		if(answer.name.toLowerCase() === "30 minutes") return 1800;
		if(answer.name.toLowerCase() === "1 heure") return 3600;
		if(answer.name.toLowerCase() === "12 heures") return 43200;
		if(answer.name.toLowerCase() === "1 jour") return 86400;
		if(answer.name.toLowerCase() === "1 mois") return 2592000;
		if(answer.name.toLowerCase() === "1 année") return 31536000;
		if(answer.name.toLowerCase() === "infini") return 250000000000;
	});
}

// Upload / Création d'un groupe de lien : faire les requêtes
async function doRequestUpload(filePath, time){
	// Préparer de quoi uploader le fichier
	const stats = fs.statSync(filePath);
	let readStream = fs.createReadStream(filePath);

	// Body pour le fetch : crée le fichier
	var bodyCreate = {
		"chunksNumber": 1,
		"name": path.basename(filePath)
	}

	// Body pour le fetch : finaliser l'envoie
	var bodyFinish = {
		"parts": [
			{
				"ETag": "%ETAG%",
				"PartNumber": 1
			}
		],
		"uploadId": "%UPLOADID%",
		"expire": time
	}

	// Faire une requête vers HiberFile : crée le fichier
	var fetchCreate = await fetch('https://api.hiberfile.com/files/create', { method: 'POST', follow: 20, size: 500000, body: JSON.stringify(bodyCreate), headers: { 'Content-Type': 'application/json' } })
    .then(res => res.json())
    .catch(err => {
		spinner.fail()
		console.log(chalk.red(err)) && process.exit()
	})

	// Faire une requête pour uploader le fichier
	var fetchUpload = await fetch(fetchCreate.uploadUrls[0], { method: 'PUT', follow: 20, body: readStream })
    .then(res => res.headers.get("etag"))
    .catch(err => {
		spinner.fail()
		console.log(chalk.red(err)) && process.exit()
	})

	// Faire une requête vers HiberFile : finaliser l'envoie
	var fetchFinish = await fetch(`https://api.hiberfile.com/files/${fetchCreate.hiberfileId}/finish/`, { method: 'POST', follow: 20, body: JSON.stringify(bodyFinish).replace(/%ETAG%/g, JSON.parse(fetchUpload)).replace(/%UPLOADID%/g, fetchCreate.uploadId), headers: { 'Content-Type': 'application/json' } })
    .then(res => res.ok)
    .catch(err => {
		spinner.fail()
		console.log(chalk.red(err)) && process.exit()
	})

	// Retourner les informations
	return fetchCreate;
}

// Upload / Création d'un groupe de lien : afficher une notification
async function showNotificationUpload(title, message, hiberfileId){
	// Si l'os n'est pas Windows ou macOS, annuler
	if(os.platform() !== "win32" && os.platform() !== "darwin") return;

	// Obtenir un QR code vers le lien HiberFile
	if(hiberfileId) var qrcode = await qrGenerator("https://hiberfile.com/d/" + hiberfileId)
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

// Si l'argument est help ou rien
if(process.argv.slice(2)[0] === "--help" || process.argv.slice(2)[0] === "-h" || process.argv.slice(2)[0] !== "--version" && process.argv.slice(2)[0] !== "-v" && process.argv.slice(2)[0] !== "--download" && process.argv.slice(2)[0] !== "-d" && process.argv.slice(2)[0] !== "--upload" && process.argv.slice(2)[0] !== "-u" && process.argv.slice(2)[0] !== "--group" && process.argv.slice(2)[0] !== "-g") return console.log(`
 Utilisation
   $ hibercli

 Options
   --version -v          Indique la version actuellement utilisé
   --download -d         Télécharge un fichier sur votre appareil
   --upload -u           Envoie un fichier sur HiberFile
   --group -g            Crée et partage un groupe de liens

 Télécharger un fichier
   $ hibercli --download <lien hiberfile>

 Envoyer un fichier
   $ hibercli --upload /chemin/du/fichier
`)

// Donner la version avec l'argument associé
if(process.argv.slice(2)[0] === "--version" || process.argv.slice(2)[0] === "-v"){
	console.log("HiberCLI utilise actuellement la version " + chalk.cyan(require('./package.json').version))
	console.log("Lien de l'API : " + chalk.cyan(hiberfileLink))
	console.log("────────────────────────────────────────────")
	console.log("Développé par Johan le stickman")
	console.log(chalk.cyan("https://johanstickman.com"))
	return process.exit()
}

// Déterminer si on souhaite télécharger, envoyer un fichier ou crée un groupe de liens
if(process.argv.slice(2)[0] === "--download" || process.argv.slice(2)[0] === "-d"){
	return download(process.argv.slice(2)[1])
}

if(process.argv.slice(2)[0] === "--upload" || process.argv.slice(2)[0] === "-u"){
	// Vérifier si un argument a été donné
	if(!process.argv.slice(2)[1]) return console.log(chalk.red("Utilisation de la commande : ") + chalk.cyan("hibercli --upload <chemin vers un fichier>"))

	// Vérifier si le chemin existe
	if(!fs.existsSync(process.argv.slice(2)[1])) return console.log(chalk.red("Le fichier n'a pas pu être trouvé."))

	// Vérifier si ce n'est pas un dossier
	if(fs.lstatSync(process.argv.slice(2)[1]).isDirectory()) return console.log(chalk.red("Vous ne pouvez pas envoyer de dossiers depuis HiberCLI."))

	// Afficher le menu d'upload de fichiers
	upload(process.argv.slice(2)[1], "option show menu")
}

if(process.argv.slice(2)[0] === "--group" || process.argv.slice(2)[0] === "-g"){
	// Vérifier si un argument a été donné
	if(!process.argv.slice(2)[1]) return console.log(chalk.red("Utilisation de la commande : ") + chalk.cyan("hibercli --group <lien1> [lien2] [lien3] [lien4] [lien5] [lien6]"))

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

	// Afficher un spinner
	spinner.start()
	spinner.text = " Envoi du fichier en cours..."

	// Faire les requêtes
	var fetchCreate = await doRequestUpload(filePath, time)

	// Arrêter le spinner
	spinner.text = " Fichier envoyé : "
	spinner.succeed()

	// Copier le lien dans le presse papier
	clipboardy.write("https://hiberfile.com/d/" + fetchCreate.hiberfileId).catch(err => {})

	// Donner le lien
	console.log(chalk.cyan("https://hiberfile.com/d/" + fetchCreate.hiberfileId));

	// Afficher une notification
	showNotificationUpload("HiberCLI - Partage de fichier", `${path.basename(filePath)} uploadé avec succès.\nhiberfile.com/d/${fetchCreate.hiberfileId}`, fetchCreate.hiberfileId)

	// Arrêter le processus automatiquement (car la notif le fait attendre)
	setTimeout(() => process.exit(), 5000)
}

// Fonction pour télécharger un fichier
async function download(link){
	// Afficher un spinner : obtention des informations du fichier
	spinner.start()
	spinner.text = " Obtention des informations du fichier..."

	// Obtenir l'ID HiberFile (note : le "hiberfile.comD" est voulu)
	if(!link.endsWith("/")) var id = link.split("/")
	if(link.endsWith("/")) var id = link.slice(0, -1).split("/")
	id = id[id.length - 1]

	// Faire une requête pour le code HTTP
	var fetchCode = await fetch(`https://api.hiberfile.com/files/${id}`, { method: 'GET', follow: 20 })
    .then(res => res.statusText)
    .catch(err => {
		spinner.fail()
		console.log(chalk.red(err)) && process.exit()
	})

	// Si le code erreur est...
	if(fetchCode === "Not Found"){
		spinner.text = " Fichier introuvable"
		return spinner.fail()
	}
	if(fetchCode === "Too Early"){
		spinner.text = " Le fichier n'est pas encore uploadé"
		return spinner.fail()
	}

	// Obtenir des informations sur le fichier
	var fetchInfo = await fetch(`https://api.hiberfile.com/files/${id}`, { method: 'GET', follow: 20 })
    .then(res => res.json())
    .catch(err => {
		spinner.fail()
		console.log(chalk.red(err)) && process.exit()
	})

	// Modifier l'état du spinner (l'arrêter)
	spinner.text = " Obtention des informations du fichier"
	spinner.succeed()

	// Obtenir le contenu du fichier (pour afficher une préview)
	if(fetchInfo.filename.endsWith(".txt") || fetchInfo.filename.endsWith(".md") || fetchInfo.filename.endsWith(".link") || fetchInfo.filename.endsWith(".hibercli-links")) var fetchContent = await fetch(fetchInfo.downloadUrl, { method: 'GET', follow: 20 })
    .then(res => res.text())
    .catch(err => {
		console.log(chalk.red(err)) && process.exit()
	})

	// Afficher une prévisualisation si possible
	if(fetchInfo.filename.endsWith(".txt")){
		// Obtenir une preview
		var preview = await showBoxPreview(fetchContent, fetchContent, 'left')

		// Afficher la preview
		console.log("Prévisualisation du fichier texte : ")
		console.log(preview)
	}
	if(fetchInfo.filename.endsWith(".link")){
		// Obtenir une preview
		var preview = await showBoxPreview(fetchContent.replace("[HiberCLI-Link by Johan_Stickman]", "").replace("OriginalURL:", "").replace(/\n/g, ""), fetchContent.replace("[HiberCLI-Link by Johan_Stickman]", "").replace("OriginalURL:", "").replace(/\n/g, ""), 'middle')

		// Afficher la preview
		console.log("Prévisualisation du fichier lien : ")
		return console.log(preview)
	}
	if(fetchInfo.filename.endsWith(".md")){
		// Ajouter des options à marked
		marked.setOptions({
			// Define custom renderer
			renderer: new TerminalRenderer()
		});

		// Obtenir une preview
		var preview = await showBoxPreview(marked(fetchContent), marked(fetchContent), 'left')

		// Afficher la preview
		console.log("Prévisualisation du fichier markdown : ")
		console.log(preview)
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
				message: ' Choissisez les sites à ouvrir',
				choices: arrayWebsite
			}
		])
		// Quand une réponse est obtenu
		.then(answer => {
			// Afficher un spinner
			spinner.start()
			spinner.text = " Ouverture des sites..."

			// Si aucun site n'a été choisi
			if(!answer.url || answer.url && !answer.url[0]){
				spinner.text = " Aucun site choisi"
				return spinner.fail()
			}

			// Ouvrir les sites
			answer.url.forEach(url => {
				// Ouvrir le/les sites
				require("openurl").open(url)
			})

			// Arrêter le spinner
			spinner.text = " Sites ouverts dans un navigateur"
			spinner.succeed()
		});
	}
	
	// Afficher un spinner : téléchargement de ...
	spinner.text = ` Téléchargement de ${fetchInfo.filename}...`
	spinner.start()

	// Préparer le téléchargement
	const downloader = new Downloader({
		url: fetchInfo.downloadUrl,
		directory: path.join(process.cwd()),  
		fileName: 'HiberCLI-' + fetchInfo.filename,
		onProgress: function (percentage, chunk, remainingSize){
			// Modifier le spinner
			spinner.text = ` Téléchargement de ${fetchInfo.filename} : ${percentage} %, ${hr.fromBytes(remainingSize, 'BYTE', 'MBYTE')} restant.`

			// Si on est à 100%
			if(percentage === "100.00") spinner.text = ` Téléchargement de ${fetchInfo.filename} effectué.`
		}
	})

	// Télécharger le fichier
	try {
		await downloader.download();
	} catch (error) {
		console.log(chalk.red(error))
	}

	// Arrêter le spinner
	spinner.text = ` Téléchargement de ${fetchInfo.filename} effectué.`
	spinner.succeed()

	// Donner l'emplacement du fichier
	console.log(chalk.green("✔") + chalk.dim("  Le fichier se trouve dans ") + chalk.cyan(path.join(path.join(process.cwd()), 'HiberCLI-' + fetchInfo.filename)))

	// Afficher une notification
	showNotificationUpload("HiberCLI - Téléchargement", `${fetchInfo.filename} vient de se téléchargé avec succès.`)
	
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
	spinner.text = " Envoi du groupe à HiberFile..."

	// Arrêter le spinner
	spinner.text = " Groupe crée : "
	spinner.succeed()

	// Copier le lien dans le presse papier
	clipboardy.write("https://hiberfile.com/d/" + fetchCreate.hiberfileId).catch(err => {})

	// Donner le lien
	console.log(chalk.cyan("https://hiberfile.com/d/" + fetchCreate.hiberfileId));

	// Afficher une notification
	showNotificationUpload("HiberCLI - Groupe de liens", `Groupe de lien crée avec succès.\nhiberfile.com/d/${fetchCreate.hiberfileId}`, fetchCreate.hiberfileId)

	// Arrêter le processus automatiquement (car la notif le fait attendre)
	setTimeout(() => process.exit(), 5000)
}
