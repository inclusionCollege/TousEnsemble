/*
	VERIFICATIONS
*/
// Firebase Authentication verification
firebase.auth().onAuthStateChanged(userAuth => {
	if (!userAuth) {
		userNotConnected();
	} else {
		userConnected(userAuth.uid);
	}
});
// End Firebase Authentication verification
/*
    END VERIFICATION
*/


const btnLogOut = document.getElementById("btnLogOut");
const btnValidatePwd = document.getElementById("asideValidatePwd");
const btnValidateEmail = document.getElementById("asideValidateEmail");
const btnValidateDelUser = document.getElementById("asideValidateDelUser");

// LogOut Button Click
btnLogOut.addEventListener('click', e => {
	firebase.auth().signOut();
});

// Attaches the tooltip for the password information
$("#asidePwdInfo").tooltip({ trigger: "hover" });

/*---------------------------LINKS------------------------------*/

const asideOldPwd = document.getElementById('asideOldPwd');
const asideNewPwd = document.getElementById('asideNewPwd');
const asideNewPwd2 = document.getElementById('asideNewPwd2');
const asideNewEmail= document.getElementById('asideNewEmail');
const asidePwd = document.getElementById('asidePwd');

const studentLink = document.getElementById("asideStudentLink");
const adminLink = document.getElementById("asideAdminLink");
const superAdminLink = document.getElementById("asideSuperAdminLink");

// Change password
btnValidatePwd.addEventListener('click', e => {
	$(btnValidatePwd).attr("disabled",true);
	const oldPwd = document.getElementById('asideOldPwd').value;
	const newPwd = document.getElementById('asideNewPwd').value;
	const confPwd = document.getElementById('asideNewPwd2').value;

	$("#asideLoadingModifyPass").removeClass('hidden');
	$("#asideAlertModifyPass").addClass('hidden');
	$("#asideAlertModifyPass").removeClass("alert-danger", "alert-success", "alert-info");

	// If values are empty
	if(!oldPwd || !newPwd || !confPwd){
		showAsidePasswordAlert("alert-danger",
		"Tous les champs doivent être remplis.")
		return;
	}

	// If the passwords don't match
	if(newPwd !== confPwd){
		showAsidePasswordAlert("alert-danger",
		"Les nouveaux mots de passe ne correspondent pas.")
		return;
	}

	// If the password is too short
	if(newPwd.length < 6){
		showAsidePasswordAlert("alert-danger",
		"Le nouveau mot de passe doit contenir au moins 6 caractères.")
		return;
	}

	const userAside = firebase.auth().currentUser;

	const credential = firebase.auth.EmailAuthProvider.credential(userAside.email, oldPwd);
		userAside.reauthenticateAndRetrieveDataWithCredential(credential)
			.then(() => {
				userAside.updatePassword(newPwd)
					.then(() => {
						// SUCCESS
						showAsidePasswordAlert("alert-success","Mot de passe changé avec succès.")
						$('#asideModalPsw #active').addClass('hidden');
						$('#asideModalPsw #closeModal').removeClass('hidden');
					})
					.catch((err) => {
						// ERROR Update Password
						showAsidePasswordAlert("alert-danger",
						"Une erreur est survenue. Veuillez réessayer plus tard.")
					})
			})
			.catch((err) => {
				// ERROR Reauthenticate
				showAsidePasswordAlert("alert-danger","Mauvais mot de passe")
			})
});
// End Change password

function showAsidePasswordAlert(alertClass,text){
	$(btnValidatePwd).removeAttr("disabled");
	$("#asideLoadingModifyPass").addClass('hidden');
	$("#asideAlertModifyPass").removeClass('hidden');
	$("#asideAlertModifyPass").addClass(alertClass);
	$("#asideAlertModifyPass").text(text)
	$("#asideAlertModifyPass").hide().slideDown(400);
}

// Change email
btnValidateEmail.addEventListener('click', e => {
	$(btnValidateEmail).attr("disabled",true);
	const newEmail = document.getElementById('asideNewEmail').value;
	const pwd = document.getElementById('asidePwd').value;

	const successText = "Votre adresse mail a été changée avec succès.";
	const errorText = "Une erreur est survenue. L'adresse mail est peut être déjà utilisée. Veuillez réessayer plus tard.";

	$("#asideLoadingModifyEmail").removeClass('hidden');
	$("#asideAlertModifyEmail").addClass('hidden');
	$("#asideAlertModifyEmail").removeClass("alert-danger", "alert-success");

	const userAside = firebase.auth().currentUser;

	const credential = firebase.auth.EmailAuthProvider.credential(userAside.email, pwd);
	userAside.reauthenticateAndRetrieveDataWithCredential(credential)
		.then(() => {
			const body = { 
				schoolId: schoolId, 
				newEmail: newEmail, 
				oldEmail: userAside.email 
			};

			cfChangeEmail(body)
			.then((res) => {
				const newCred = firebase.auth.EmailAuthProvider.credential(newEmail, pwd);
				userAside.reauthenticateAndRetrieveDataWithCredential(newCred)
				showAsideEmailAlert("alert-success",successText)
				$('#asideModalEmail #active').addClass('hidden');
				$('#asideModalEmail #closeModal').removeClass('hidden');
			})
			.catch((err) => {
				// ERROR fetch
				showAsideEmailAlert("alert-danger",errorText)
			})
		})
		.catch((err) => {
			// ERROR Reauthenticate
			showAsideEmailAlert("alert-danger",errorText)
		})
})
// End Change email

function showAsideEmailAlert(alertClass,text){
	$(btnValidateEmail).removeAttr("disabled");
	$("#asideLoadingModifyEmail").addClass('hidden');
	$("#asideAlertModifyEmail").removeClass('hidden');
	$("#asideAlertModifyEmail").addClass(alertClass);
	$("#asideAlertModifyEmail").text(text)
	$("#asideAlertModifyEmail").hide().slideDown(400);
}

// Delete user
btnValidateDelUser.addEventListener('click', e => {
	const userAside = firebase.auth().currentUser;
	const successText = "Votre compte a été supprimé.";
	const failText = "Une erreur est survenue. Veuillez réessayer plus tard.";

	$(btnValidateDelUser).attr("disabled",true);
	$("#asideLoadingDeleteUser").removeClass('hidden');
	$("#asideAlertDeleteUser").addClass('hidden');
	$("#asideAlertDeleteUser").removeClass("alert-danger", "alert-success");

	userAside.delete().then(function() {
		showAsideDelUserAlert("alert-success",successText);
	}).catch(function(error) {
		showAsideDelUserAlert("alert-danger",failText);
	});
})
// End Delete user

function showAsideDelUserAlert(alertClass,text){
	$(btnValidateDelUser).removeAttr("disabled");
	$("#asideLoadingDeleteUser").addClass('hidden');
	$("#asideAlertDeleteUser").removeClass('hidden');
	$("#asideAlertDeleteUser").addClass(alertClass);
	$("#asideAlertDeleteUser").text(text)
	$("#asideAlertDeleteUser").hide().slideDown(400);
}

/*---------------------------IMAGE CHANGE------------------------------*/

const asideBannerImg = document.getElementById("asideImgBanner");
const asideBannerImgContent = document.getElementById("asideBannerImgContent");
const asideBannerImgSpinner = document.getElementById("asideBannerImgSpinner");

if(schoolId){
	$(asideBannerImgContent).removeClass('hidden');
	$(asideBannerImgSpinner).removeClass('hidden');
	$(asideBannerImg).addClass('hidden');
	schoolRef.child("infos").on('value',snap=>{
		if(snap.val() && snap.val().img_url){
			asideBannerImg.setAttribute("src",snap.val().img_url)
		}else{
			asideBannerImg.setAttribute("src","../common/images/college_plus_banner.jpeg")
		}
	})
}else{
	$(asideBannerImgContent).addClass('hidden');
}

asideBannerImg.onload = () => {
    $(asideBannerImgSpinner).addClass('hidden');
    $(asideBannerImg).removeClass('hidden');
}

/*---------------------------USER STATE------------------------------*/

// User not connected
function userNotConnected() {
	$("#asideAuthInfo").addClass("hidden");
	$("#asideConnection").removeClass("hidden");
}

// User connected
function userConnected(userId) {
	$("#asideAuthInfo").removeClass("hidden");
	$("#asideConnection").addClass("hidden");
	getUser(userId)
		.then(role => {
			$("#asideUser").text(role.val.name + " " + role.val.surname);
			// Set the right link from the role
			if (role.name === "superadmin") {
				superAdminLink.setAttribute("href", "../superAdmin/superAdmin.html");
				superAdminLink.classList.remove("hidden");
				$("#asideUserRole").text("(Super Administrateur)");
				if(schoolId){
					adminLink.setAttribute("href", "../admin/admin.html?schoolId=" + schoolId);
					adminLink.classList.remove("hidden");
				}
			}
			if (role.name === "admin") {
				adminLink.setAttribute("href", "../admin/admin.html?schoolId=" + role.school);
				adminLink.classList.remove("hidden");
				$("#asideUserRole").text("(Administrateur)");
			}
			if (role.name === "user") {
				studentLink.setAttribute("href", "../studentList/studentList.html?schoolId=" + schoolId);
				studentLink.classList.remove("hidden");
				schoolDbRef.child('/roles/' + role.val.role).once('value',roleSnap=>{
					$("#asideUserRole").text("("+roleSnap.val().role_name+")");
				})
			}
			if (role.val.firstConnection && !window.location.pathname.includes("/connection/connection.html")) {
				const firstText = "Il s'agit de votre première connexion. Nous vous conseillons de changer votre mot de passe."
				$("#asideModalPsw").modal('show');
				showAsidePasswordAlert("alert-info",firstText);
				if(role.name === 'superadmin'){
					baseDbRef.child("superadmin").child(userId).child("firstConnection").ref.remove();
				}
				if(role.name === 'admin'){
					schoolRef.child("admin").child(userId).child("firstConnection").ref.remove();
				}
				if(role.name === 'user'){
					schoolDbRef.child("users").child(userId).child("firstConnection").ref.remove();
				}
			}
		})
}

/*---------------------------EMPTY MODAL------------------------------*/

// Empty password Modal on close
$('#asideModalPsw').on('hidden.bs.modal', function () {
	asideOldPwd.value="";
	asideNewPwd.value="";
	asideNewPwd2.value="";
	$('#asideModalPsw #active').removeClass('hidden');
	$('#asideModalPsw #closeModal').addClass('hidden');
	$("#asideAlertModifyPass").addClass('hidden');
	$("#asideAlertModifyPass").removeClass("alert-danger", "alert-success");
});

// Empty email Modal on close
$('#asideModalEmail').on('hidden.bs.modal', function () {
	asideNewEmail.value="";
	asidePwd.value="";
	$('#asideModalEmail #active').removeClass('hidden');
	$('#asideModalEmail #closeModal').addClass('hidden');
	$("#asideAlertModifyEmail").addClass('hidden');
	$("#asideAlertModifyEmail").removeClass("alert-danger", "alert-success");
});
