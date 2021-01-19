// The links for the different Firebase Cloud Functions
const cfSignUpUser = firebase.functions().httpsCallable('signUpUser')
const cfChangeEmail = firebase.functions().httpsCallable('changeUserEmail');
const cfForgotPassword = firebase.functions().httpsCallable('forgotPassword');
const cfDeleteUser = firebase.functions().httpsCallable('deleteUser');