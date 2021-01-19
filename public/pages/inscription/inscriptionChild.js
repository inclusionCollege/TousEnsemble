/*
	VERIFICATIONS
*/
// Firebase Authentication verification
let inscriptionUser;
firebase.auth().onAuthStateChanged(userAuth => {
	if (userAuth) {
		let id = userAuth.uid;
		getUserRole(id)
			.then(role => {
				inscriptionUser = role;
				if (role.name === "admin" && schoolId !== role.school) {
					return window.location.replace("../admin/admin.html?schoolId=" + role.school);
				}
				if (role.name === "user") {
					if(schoolId !== role.school){
						return window.location.replace("../inscription/inscriptionChild.html?schoolId="+role.school);
					}else{
            			schoolDbRef.child('users').child(role.userId).once('value',userSnap=>{
							if (userSnap.val().role !== "referent") {
								return window.location.replace("../studentList/studentList.html?schoolId="+role.school);
							} else {
								inscriptionUser.referent = true;
							}
						})
					}
				}
				if(role.name === "unknown"){
					return window.location.replace("../connection/connection.html");
				}
			})
	}
	else{
		return window.location.replace("../connection/connection.html");
	}
})
// End Firebase Authentication verification
/*
	END VERIFICATIONS
*/

const childRef = schoolDbRef.child('/children');
const relationshipsRef = schoolDbRef.child('/relationships');

const nameInput = document.getElementById('name');
const surnameInput = document.getElementById('surname');
const additionalInfoInput = document.getElementById('additional_info');
const dateOfBirthInput = document.getElementById('dateOfBirth');
const classInput = document.getElementById('class');
const usersRef = firebase.database().ref('users');

const inscriptionChildBtn = document.getElementById('inscriptionChildBtn');
inscriptionChildBtn.addEventListener('click', onClick);

// Inscription Button Click
function onClick() {
	let link;
	if(inscriptionUser.name === "superadmin" || inscriptionUser.name === "admin"){
		link = "<a href='../admin/admin.html?schoolId=" + schoolId + "'";
	}else{
		link = "<a href='../studentList/studentList.html?schoolId=" + schoolId + "'";
	}

	const successText = "L'inscription s'est déroulée avec succès."+
		"<br>Pour revenir à la liste des élèves " + link + " class='alert-link'>cliquez ici</a>";
	const failText = "Une erreur est survenue. Veuillez réessayer plus tard."+
		"<br>Pour revenir à la liste des élèves " + link + " class='alert-link'>cliquez ici</a>";
	const errorText = "Les champs Nom, Prénom, Classe et Date de naissance sont obligatoires.";

	$("#inscriptionForm").addClass("darkClass");
	$("#inscriptionChildLoading").removeClass('hidden');
	$("#inscriptionChildAlert").addClass('hidden');
	$("#inscriptionChildAlert").empty();
	$("#inscriptionChildAlert").removeClass("alert-danger", "alert-success");
	$('#inscriptionChildBtn').attr('disabled', true);

 	if(nameInput.value && surnameInput.value  && dateOfBirthInput.value && classInput.value ){
		const childSet = {
			name: nameInput.value, 
			surname: surnameInput.value,
			date_of_birth: dateOfBirthInput.value, 
			additional_info: additionalInfoInput.value, 
			class: classInput.value,
			creation_date: Date.now()
		}
		const child = childRef.push();
		child.set(childSet)
		.then(()=>{
			// SUCCESS
			const promises = [];
			if(inscriptionUser.referent){
				promises.push(
					relationshipsRef.child(inscriptionUser.userId).child(child.key).set(true)
				)
			}
			if(childrenDefault){
				if(childrenDefault.categories){
					promises.push(addDefaultCategories(child.key));
				}
				if(childrenDefault.profile){
					promises.push(addDefaultProfile(child.key));
				}
			}
			Promise.all(promises)
			.then(()=>{
				// SUCCESS
				showInscriptionChildAlert("alert-success", successText);
			})
			.catch(err=>{
				// ERROR relationshipsRef set
				showInscriptionChildAlert("alert-danger", failText);
			})
		})
		.catch(()=>{
			// ERROR childRef push
			showInscriptionChildAlert("alert-danger", failText);
		})
 	} else {
		// If name, surname, dateOfBirth or class are empty
		showInscriptionChildAlert("alert-danger", errorText);
 	}
}

function showInscriptionChildAlert(alertClass, text){
	$("#inscriptionChildLoading").addClass('hidden');
	$("#inscriptionChildAlert").removeClass('hidden');
	$("#inscriptionForm").removeClass("darkClass");
	$('#inscriptionChildBtn').removeAttr('disabled');
	$("#inscriptionChildAlert").append(text)
	$("#inscriptionChildAlert").addClass(alertClass)
	$("#inscriptionChildAlert").hide().slideDown(400);
}

function addDefaultCategories(studentId){
	const childrenCategoriesRef = schoolDbRef.child("children_categories").child(studentId);
	return new Promise((resolve,reject) => {
		const catPromises = [];
		childrenDefault.categories.forEach(category => {
			const name = category.name;
			const newCat = childrenCategoriesRef.push();
			catPromises.push(
				newCat.update({name: name})
			)
			const childrenSkillsRef = childrenCategoriesRef.child(newCat.key).child("skills");
			const skillPromises = [];
			category.skills.forEach(skillName => {
				const newSkill = childrenSkillsRef.push();
				skillPromises.push(
					newSkill.update({name:skillName})
				)
			})
			catPromises.push(
				Promise.all(skillPromises)
			)
		})
		Promise.all(catPromises)
		.then(()=>{
			resolve()
		})
		.catch(()=>{
			reject()
		})
	})
}

function addDefaultProfile(studentId){
	const childrenProfileRef = schoolDbRef.child("children_profile").child(studentId).child("infos");
	return new Promise((resolve,reject) => {
		const promises = [];
		childrenDefault.profile.forEach(name => {
			const newList = childrenProfileRef.push();
			promises.push(
				newList.update({name: name})
			)
		})
		Promise.all(promises)
		.then(()=>{
			resolve()
		})
		.catch(()=>{
			reject()
		})
	})
}