/*
	VERIFICATIONS
*/
// Firebase Authentication verification
firebase.auth().onAuthStateChanged(userAuth => {
	if (userAuth) {
		let id = userAuth.uid;
		getUserRole(id)
		.then(role => {
			if (role.name === "admin" && schoolId !== role.school) {
				return window.location.replace("../admin/admin.html?schoolId=" + role.school);
			}
			if (role.name === "user") {
				return window.location.replace("../studentList/studentList.html?schoolId=" + role.school);
			}
			if(role.name === "unknown"){
				return window.location.replace("../connection/connection.html");
			}
		})
	}
	else {
		return window.location.replace("../connection/connection.html");
	}
})
// End Firebase Authentication verification
/*
	END VERIFICATIONS
*/

const userRef = schoolDbRef.child('/users');

const nameInput = document.getElementById('name');
const surnameInput = document.getElementById('surname');
const emailInput = document.getElementById('email');
const additionalInfoInput = document.getElementById('additional_info');
const selectCategory = document.getElementById("category");

const inscriptionUserBtn = document.getElementById('inscriptionUserBtn');
inscriptionUserBtn.addEventListener('click', onClick);
// Inscription Button Click
function onClick() {
	const successText = "Nouvel utilisateur inscrit avec succès. Un email lui a été envoyé." +
		"<br>Pour revenir à la liste des utilisateurs " + 
		"<a href='../admin/admin.html?schoolId=" + schoolId + "' class='alert-link'>cliquez ici</a>";
	const failText = "Une erreur est survenue. L'adresse mail est peut être déjà utilisée. " + 
		"Veuillez réessayer plus tard."+
		"<br>Pour revenir à la liste des utilisateurs " + 
		"<a href='../admin/admin.html?schoolId=" + schoolId + "' class='alert-link'>cliquez ici</a>";
	const errorText = "Les champs Nom, Prénom, Mail et Rôle sont obligatoires.";
	const errorEmailText = "L'adresse mail n'est pas valide.";

	if (nameInput.value && surnameInput.value && emailInput.value && selectCategory.value) {

		const body = {
			name: nameInput.value, 
			surname: surnameInput.value, 
			email: emailInput.value,
			additional_info: additionalInfoInput.value, 
			role: selectCategory.value,
			schoolId: schoolId
		}

		$("#inscriptionForm").addClass("darkClass");
		$("#inscriptionUsersLoading").removeClass('hidden');
		$("#inscriptionUsersAlert").addClass('hidden');
		$("#inscriptionUsersAlert").empty();
		$("#inscriptionUsersAlert").removeClass("alert-danger", "alert-success");
		$('#inscriptionUserBtn').attr('disabled', true);

		if(!validateEmail(emailInput.value)){
			// Email not valid
			showInscriptionUsersAlert("alert-danger",errorEmailText);
			return;
		}
		
		cfSignUpUser(body)
		.then((res) => {
			showInscriptionUsersAlert("alert-success",successText);
		})
		.catch(function (error) {
			// ERROR fetch
			showInscriptionUsersAlert("alert-danger",failText);
		});

	} else {
		// If name, surname, email or category are empty
		showInscriptionUsersAlert("alert-danger",errorText);
	}
}

function showInscriptionUsersAlert(alertClass, text){
	$('#inscriptionUserBtn').removeAttr('disabled');
	$("#inscriptionUsersLoading").addClass('hidden');
	$("#inscriptionUsersAlert").removeClass('hidden');
	$("#inscriptionForm").removeClass("darkClass");
	$("#inscriptionUsersAlert").html(text);
	$("#inscriptionUsersAlert").addClass(alertClass);
	$("#inscriptionUsersAlert").hide().slideDown(400);
}