/*
	VERIFICATIONS
*/
// Firebase Authentication verification
firebase.auth().onAuthStateChanged(userAuth => {
	if (userAuth) {
		const id = userAuth.uid;
		getUserRole(id)
			.then(role => {
				if (role.name === "admin") {
					return window.location.replace("../admin/admin.html?schoolId=" + role.school);
				}
				if (role.name === "user") {
					return window.location.replace("../studentList/studentList.html?schoolId=" + role.school);
				}
				if (role.name === "unknown") {
					return window.location.replace("../connection/connection.html");
				}
			})
	} else {
		return window.location.replace("../connection/connection.html");
	}
})
// End Firebase Authentication verification
/*
	END VERIFICATIONS
*/

const superAdminName = document.querySelector("#superAdminInfos #name");
const superAdminSurname = document.querySelector("#superAdminInfos #surname");
const superAdminEmail = document.querySelector("#superAdminInfos #email");

const inscriptionSuperAdminBtn = document.getElementById("inscriptionSuperAdminBtn");

// Inscription Button Click
inscriptionSuperAdminBtn.addEventListener('click', e => {
	const successText = "Nouvel superAdmin inscrit avec succès. Un email lui a été envoyé."
		+ "<br>Pour revenir à la liste des super administrateurs"
		+ " <a href='../superAdmin/superAdmin.html' class='alert-link'>cliquez ici</a>";
	const failText = "Une erreur est survenue. L'adresse mail est peut être déjà utilisée."
		+ " Veuillez réessayer plus tard."
		+ "<br>Pour revenir à la liste des super administrateurs"
		+ " <a href='../superAdmin/superAdmin.html' class='alert-link'>cliquez ici</a>";
	const errorText = "Les champs Nom, Prénom et Mail sont obligatoires.";
	const errorEmailText = "L'adresse mail n'est pas valide.";

	$("#inscriptionForm").addClass("darkClass");
	$("#inscriptionSuperAdminLoading").removeClass('hidden');
	$("#inscriptionSuperAdminAlert").addClass('hidden');
	$("#inscriptionSuperAdminAlert").empty();
	$("#inscriptionSuperAdminAlert").removeClass("alert-danger", "alert-success");
	$('#inscriptionSuperAdminBtn').attr('disabled', true);

	if(!validateEmail(superAdminEmail.value)){
		// Email not valid
		showInscriptionSuperAdminAlert("alert-danger",errorEmailText);
		return;
	}

	if (superAdminName.value && superAdminSurname.value && superAdminEmail.value) {
		const body = {
			name: superAdminName.value, 
			surname: superAdminSurname.value, 
			email: superAdminEmail.value, 
			role: 'superadmin', 
			schoolId: schoolId 
		}
		cfSignUpUser(body)
		.then(res => {
			showInscriptionSuperAdminAlert("alert-success",successText);
		})
		.catch(function (error) {
			// ERROR fetch
			showInscriptionSuperAdminAlert("alert-danger",failText);
		});
	} else {
		// If name, surname or email values are empty
		showInscriptionSuperAdminAlert("alert-danger",errorText);
	}
});

function showInscriptionSuperAdminAlert(alertClass, text){
	$('#inscriptionSuperAdminBtn').removeAttr('disabled');
	$("#inscriptionSuperAdminLoading").addClass('hidden');
	$("#inscriptionSuperAdminAlert").removeClass('hidden');
	$("#inscriptionForm").removeClass("darkClass");
	$("#inscriptionSuperAdminAlert").html(text)
	$("#inscriptionSuperAdminAlert").addClass(alertClass)
	$("#inscriptionSuperAdminAlert").hide().slideDown(400);
}