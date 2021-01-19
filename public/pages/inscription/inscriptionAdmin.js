/*
	VERIFICATIONS
*/
// Firebase Authentication verification
firebase.auth().onAuthStateChanged(userAuth => {
	if (userAuth) {
		const id = userAuth.uid;
		getUserRole(id)
			.then(role => {
				if (role.name === "superadmin" && !schoolId) {
					return window.location.replace("../superAdmin/superAdmin.html");
				}
				if (role.name === "admin" && role.school !== schoolId) {
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

const adminName = document.querySelector("#adminInfos #name");
const adminSurname = document.querySelector("#adminInfos #surname");
const adminEmail = document.querySelector("#adminInfos #email");

const inscriptionAdminBtn = document.getElementById("inscriptionAdminBtn");

// Inscription Button Click
inscriptionAdminBtn.addEventListener('click', e => {
	const successText = "Nouvel admin inscrit avec succès. Un email lui a été envoyé."
		+ "<br>Pour revenir à la liste des administrateurs"
		+ " <a href='../school/school.html?schoolId="+schoolId+"' class='alert-link'>cliquez ici</a>";
	const failText = "Une erreur est survenue. L'adresse mail est peut être déjà utilisée."
		+ " Veuillez réessayer plus tard."
		+ "<br>Pour revenir à la liste des administrateurs"
		+ " <a href='../school/school.html?schoolId="+schoolId+"' class='alert-link'>cliquez ici</a>";
	const errorText = "Les champs Nom, Prénom et Mail sont obligatoires.";
	const errorEmailText = "L'adresse mail n'est pas valide.";

	$("#inscriptionForm").addClass("darkClass");
	$("#inscriptionAdminLoading").removeClass('hidden');
	$("#inscriptionAdminAlert").addClass('hidden');
	$("#inscriptionAdminAlert").empty();
	$("#inscriptionAdminAlert").removeClass("alert-danger", "alert-success");
	$('#inscriptionAdminBtn').attr('disabled', true);

	if(!validateEmail(adminEmail.value)){
		// Email not valid
		showInscriptionAdminAlert("alert-danger",errorEmailText);
		return;
	}

	if (adminName.value && adminSurname.value && adminEmail.value) {
		const body = {
				name: adminName.value, 
				surname: adminSurname.value, 
				email: adminEmail.value, 
				role: 'admin', 
				schoolId: schoolId 
			}
		// fetch(cfSignUpUser, {
		// 	method: 'post',
		// 	headers: {
		// 		'Content-Type': 'application/json'
		// 	},
		// 	body: JSON.stringify(body)
		// })
		// .then(res => res.json())
		cfSignUpUser(body)
		.then(res => {
			showInscriptionAdminAlert("alert-success",successText);
		})
		.catch(function (error) {
			// ERROR fetch
			showInscriptionAdminAlert("alert-danger",failText);
		});
	} else {
		// If name, surname or email values are empty
		showInscriptionAdminAlert("alert-danger",errorText);
	}
});

function showInscriptionAdminAlert(alertClass, text){
	$('#inscriptionAdminBtn').removeAttr('disabled');
	$("#inscriptionAdminLoading").addClass('hidden');
	$("#inscriptionAdminAlert").removeClass('hidden');
	$("#inscriptionForm").removeClass("darkClass");
	$("#inscriptionAdminAlert").html(text)
	$("#inscriptionAdminAlert").addClass(alertClass)
	$("#inscriptionAdminAlert").hide().slideDown(400);
}