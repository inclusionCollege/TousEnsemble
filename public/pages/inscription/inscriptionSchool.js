/*
	VERIFICATIONS
*/
// Firebase Authentication verification
firebase.auth().onAuthStateChanged(userAuth => {
	if (userAuth) {
		let id = userAuth.uid;
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
	}
	else {
		return window.location.replace("../connection/connection.html");
	}
})
// End Firebase Authentication verification
/*
	END VERIFICATIONS
*/

const schoolName = document.querySelector("#schoolInfos #name");
const adminName = document.querySelector("#adminInfos #name");
const adminSurname = document.querySelector("#adminInfos #surname");
const adminEmail = document.querySelector("#adminInfos #email");

const inscriptionSchoolBtn = document.getElementById("inscriptionSchoolBtn");

// Inscription School Click
inscriptionSchoolBtn.addEventListener('click', e => {

	const successText = "Nouvelle école créée avec succès. Un email a été envoyé au nouvel admin."
		+ "<br>Pour revenir à la liste des écoles"
		+ " <a href='../superAdmin/superAdmin.html' class='alert-link'>cliquez ici</a>";
	const failText = "Une erreur est survenue. L'adresse mail est peut être déjà utilisée."
		+ " Veuillez réessayer plus tard."
		+ "<br>Pour revenir à la liste des écoles"
		+ " <a href='../superAdmin/superAdmin.html' class='alert-link'>cliquez ici</a>";
	const errorText = "Les champs Nom de l'école, Nom, Prénom et Mail de l'Admin sont obligatoires.";
	const errorEmailText = "L'adresse mail de l'Admin n'est pas valide.";

	$("#inscriptionForm").addClass("darkClass");
	$("#inscriptionSchoolLoading").removeClass('hidden');
	$("#inscriptionSchoolAlert").addClass('hidden');
	$("#inscriptionSchoolAlert").empty();
	$("#inscriptionSchoolAlert").removeClass("alert-danger", "alert-success");
	$('#inscriptionSchoolBtn').attr('disabled', true);

	if (schoolName.value && adminName.value && adminSurname.value && adminEmail.value) {
		if(!validateEmail(adminEmail.value)){
			// Email not valid
			showInscriptionSchoolAlert("alert-danger", errorEmailText);
			return;
		}
		const school = baseDbRef.child("schools").push();
		school.set({
			infos: {
				name: schoolName.value
			},
			database: baseDatabase
		})
		.then(() => {
			const body = {
				name: adminName.value, 
				surname: adminSurname.value, 
				email: adminEmail.value, 
				role: 'admin', 
				schoolId: school.key 
			}
			cfSignUpUser(body)
			.then(res => {
				showInscriptionSchoolAlert("alert-success", successText);
			})
			.catch(function (error) {
				// ERROR fetch
				deleteSchool(school.key)
				.then(() => {
					showInscriptionSchoolAlert("alert-danger", failText);
				})
			});
		})
		.catch(function (error) {
			// ERROR school set
			deleteSchool(school.key)
			.then(() => {
				showInscriptionSchoolAlert("alert-danger", failText);
			})
		});
	} else {
		// If school name, admin name, surname and email are empty
		showInscriptionSchoolAlert("alert-danger", errorText);
	}
});

function showInscriptionSchoolAlert(alertClass, text){
	$('#inscriptionSchoolBtn').removeAttr('disabled');
	$("#inscriptionSchoolLoading").addClass('hidden');
	$("#inscriptionSchoolAlert").removeClass('hidden');
	$("#inscriptionForm").removeClass("darkClass");
	$("#inscriptionSchoolAlert").append(text)
	$("#inscriptionSchoolAlert").addClass(alertClass)
	$("#inscriptionSchoolAlert").hide().slideDown();
}

function deleteSchool(schoolId) {
	return new Promise((resolve, reject) => {
		let schoolRef = baseDbRef.child("schools").child(schoolId)
		schoolRef.remove()
		.then(() => {
			resolve();
		})
		.catch(() => {
			resolve();
		})
	})
}
