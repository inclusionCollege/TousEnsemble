/*
	VERIFICATIONS
*/
// Firebase Authentication verification
firebase.auth().onAuthStateChanged(userAuth => {
	if (userAuth) {
		let id = userAuth.uid;
		getUserRole(id)
			.then(role => {
				if (role.name === "superadmin") {
					return window.location.replace("../superAdmin/superAdmin.html");
				}
				if (role.name === "admin") {
					return window.location.replace("../admin/admin.html?schoolId=" + role.school);
				}
				if (role.name === "user") {
					return window.location.replace("../studentList/studentList.html?schoolId=" + role.school);
				}
				if (role.name === "unknown") {
					firebase.auth().signOut();
					$('#btnLogIn').prop('disabled', false);
					$("#connectionLoading").addClass('hidden');
					$("#formConnection").removeClass("darkClass");
					$("#connectionAlert").text("Une erreur de connexion est survenue.")
					$("#connectionAlert").removeClass("hidden")
					$("#connectionAlert").addClass("alert-danger")
					$("#connectionAlert").slideDown(400);
				}
			})
			.catch(err=>{
				firebase.auth().signOut();
				$('#btnLogIn').prop('disabled', false);
				$("#connectionLoading").addClass('hidden');
				$("#formConnection").removeClass("darkClass");
				$("#connectionAlert").text("Une erreur de connexion est survenue.")
				$("#connectionAlert").removeClass("hidden")
				$("#connectionAlert").addClass("alert-danger")
				$("#connectionAlert").slideDown(400);
			})
	}
})
// End Firebase Authentication verification
/*
	END VERIFICATIONS
*/


// Get the values
// Log in Info
const txtMail = document.getElementById("mail");
const password = document.getElementById("pass");
const btnLogIn = document.getElementById("btnLogIn");

const btnUserInfo = document.getElementById("btnUserInfo");
const alertContent = document.getElementById("alert-content");
const btnValidateForgotPwd = document.getElementById("validateForgotPwdBtn");
const txtMailModal = document.getElementById("modalMail");

const form = document.getElementById("connectionForm");
// When the ENTER key is pressed in the form, performs the connection
form.addEventListener('keypress',e=>{
	if(e.keyCode === 13){
		logIn();
	}
})

// LogIn Button Click
btnLogIn.addEventListener('click', e => {
	logIn();
});

function logIn(){
	const mail = txtMail.value;
	const pass = password.value;

	const failText = "L'adresse mail et le mot de passe sont obligatoires.";
	const errorText = "L'adresse mail et/ou le mot de passe sont incorrects.";

	$("#formConnection").addClass("darkClass");
	$("#connectionLoading").removeClass('hidden');
	$("#connectionAlert").addClass('hidden');
	$("#connectionAlert").empty();
	$("#connectionAlert").removeClass("alert-danger", "alert-success");
	$('#btnLogIn').prop('disabled', true);

	if(mail && pass){
		firebase.auth().signInWithEmailAndPassword(mail, pass)
		.then(() => {
			// SUCCESS Log In
			// The Firebase Authentication verification does the redirection
		})
		.catch(function (e) {
			// ERROR Log In
			showConnectionAlert("alert-danger",errorText);
		})
	}else{
		// If mail or password are empty
		showConnectionAlert("alert-danger",failText);
	}
}

function showConnectionAlert(alertClass,alertText){
	$('#btnLogIn').prop('disabled', false);
	$("#connectionLoading").addClass('hidden');
	$("#formConnection").removeClass("darkClass");
	$("#connectionAlert").text(alertText)
	$("#connectionAlert").removeClass("hidden")
	$("#connectionAlert").addClass(alertClass)
	$("#connectionAlert").hide().slideDown(400);
}

// Forgot Password Button Click
btnValidateForgotPwd.addEventListener('click', e => {
	$(btnValidateForgotPwd).attr("disabled",true);
	const mailModal = txtMailModal.value;

	const successText = "Nouveau mot de passe généré avec succès. Veuillez consulter votre boîte mail.";
	const errorText = "Une erreur est survenue. Veuillez réessayer plus tard.";

	$("#connectionLoadingForgotPassword").removeClass('hidden');
	$("#connectionAlertForgotPassword").addClass('hidden');
	$("#connectionAlertForgotPassword").removeClass("alert-danger", "alert-success");

	cfForgotPassword({email: mailModal}).then((res) => {
		showPasswordAlert("alert-success",successText)
		$('#modalForgotPwd #active').addClass('hidden');
		$('#modalForgotPwd #closeModal').removeClass('hidden');
	})
	.catch((err) => {
		// ERROR fetch
		showPasswordAlert("alert-danger",errorText)
	})
});

function showPasswordAlert(alertClass, text){
	$(btnValidateForgotPwd).removeAttr("disabled");
	$("#connectionLoadingForgotPassword").addClass('hidden');
	$("#connectionAlertForgotPassword").removeClass('hidden');
	$("#connectionAlertForgotPassword").addClass(alertClass);
	$("#connectionAlertForgotPassword").text(text)
	$("#connectionAlertForgotPassword").hide().slideDown(400);
}

// Empty forgot password modal on close
$('#modalForgotPwd').on('hidden.bs.modal', function () {
	txtMailModal.value="";
	$('#modalForgotPwd #active').removeClass('hidden');
	$('#modalForgotPwd #closeModal').addClass('hidden');
	$("#connectionAlertForgotPassword").addClass('hidden');
	$("#connectionAlertForgotPassword").removeClass("alert-danger", "alert-success");
});
