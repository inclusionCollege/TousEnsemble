// Database Config
const schoolId = getUrlParameter("schoolId");
var baseDbRef = firebase.database().ref();
if(schoolId){
	var schoolRef = baseDbRef.child('schools/'+schoolId);
	var schoolDbRef = schoolRef.child("/database");
	var schoolDbAdmin = schoolRef.child("/admin");
}

// The base database to push on school creation
const baseDatabase = {
	"roles" : {
		"AVS" : {
			"role_name" : "Assistant à la vie scolaire"
		},
		"parent" : {
			"role_name" : "Parent"
		},
		"professor" : {
			"role_name" : "Professeur"
		},
		"referent" : {
			"role_name" : "Référent"
		}
	}
};

// Default children values
const childrenDefault = {
	// Default categories and skills
	"categories": [
		{
			"name": "Communication",
			"skills": [
				"Dis son adresse sur demande",
				"Emploie correctement les auxilliaires être et avoir",
				"Répond à des questions concernant un texte qui vient d'être lu",
				"Discute d'un sujet d'actualité",
				"À l'occasion, a de longues conversations avec ses pairs",
				"Donne des explications complexes",
				"Emploie correctement les pluriels, les pronoms et les temps dans des phrases bien construites",
				"Raconte des faits de façon cohérente",
				"Emploie les pronoms personnels (je, tu, il, nous, vous, ils)",
				"Rédige une courte lettre"
			]
		},
		{
			"name": "Socialisation",
			"skills": [
				"Écoute attentivement les problèmes d'un ami",
				"Partage ses objets personnels avec ses camarades de classe",
				"Téléphone à ses amis",
				"Console un ami lorsque nécessaire",
				"Anticipe les conséquences de ses actions",
				"Coopère avec ses camarades",
				"Donne des renseignements lorsqu'il les connait",
				"Initie des activités avec autrui",
				"Travaille facilement en équipe",
				"Maintient et termine une conversation de façon appropriée"
			]
		},
		{
			"name": "Autonomie",
			"skills": [
				"Planifie et organise des activités avec ses amis dans la communauté",
				"Exprime ses difficultés de façon adéquate",
				"Fait le choix des vêtements à porter durant la journée",
				"Travaille en équipe",
				"Estime le temps que peut prendre une activité habituelle",
				"Demande la permission avant de quitter la classe",
				"Manifeste de l'initiative (ex: initie des activités, des sorties, etc.)",
				"Comprend et accepte les conséquences de son comportement",
				"Arrive à l'heure à l'école",
				"Évalue les conséquences de ses actes",
				"Écoute la radio ou regarde la télévision afin d'obtenir des informations (ex: météo, etc.)",
				"Développe et évalue des solutions alternatives à un problème"
			]
		},
		{
			"name": "Habiletés (pré)scolaires",
			"skills": [
				"Utilise adéquatement la majuscule et le point dans une phrase",
				"Indique s'il y a une différence de coût entre certains objets",
				"Nomme ou exprime les trois intervalles de la journée (matin, après-midi, soir)",
				"Lit des histoires comme \"Le petit chaperon rouge\" et en comprend le sens.",
				"Utilise une règle pour mesurer",
				"Évalue les longueurs ou les distances",
				"Additionne le prix de trois items dont le coût total ne dépasse pas 10 euros",
				"Identifie des services publics désignés par des mots simples ou des sigles (ex: toilettes, sortie, etc.)",
				"Copie les informations du tableu, de documents écrits, de textes scolaires",
				"Utilise un dictionnaire ou d'autres sources de référence"
			]
		},
		{
			"name": "Loisirs",
			"skills": [
				"Explique les règles du jeu à d'autres",
				"Organise des sorties avec des amis (ex : cinéma, piscine, etc.)",
				"Coopère lorsqu'il joue",
				"Lit pour s'informer",
				"Écoute et participe aux comptines et aux chansons",
				"Indique comment s'occuper d'un animal",
				"Utilise un lecteur MP3, un lecteur DVD/Blu-Ray, etc.",
				"Regarde la télévision en choisissant lui-même la chaîne",
				"Utilise des jeux vidéos",
				"De sa propre initiative, va chercher un jeu pour s'occuper",
				"Joue avec d'autres enfants pour de courtes périodes de temps",
				"Joue à des jeux de société nécessitant des règles complexes (ex: Monopoly, Risk, etc.)"
			]
		}
	],
	// Default profile lists
	"profile": [
		"Mes points forts",
		"Mes points faibles",
		"Mon parcours scolaire",
		"Ce que j'aime",
		"Ce que je déteste",
		"Mes particularités"
	]
}