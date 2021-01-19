/*
	VERIFICATIONS
*/
// Firebase Authentication verification
firebase.auth().onAuthStateChanged(userAuth => {
	if (userAuth) {
		let id = userAuth.uid;
		getUserRole(id)
			.then(role => {
                if (role.name === "superadmin" && !schoolId) {
					return window.location.replace("../superAdmin/superAdmin.html");
				}
				if (role.name === "admin" && schoolId !== role.school) {
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

const infoRef = schoolRef.child("infos");
const adminRef = schoolRef.child("admin");

const temp = document.querySelector("template");
const adminLi = temp.content.querySelector("#admin");

const schoolName = document.getElementById("schoolName");
const schoolSite = document.getElementById("schoolSite");
const schoolImg = document.getElementById("schoolImg");
const schoolDefaultImg = document.getElementById("schoolDefaultImg");

const adminList = document.getElementById("adminList");

const saveInfoBtn = document.getElementById("saveSchoolInfo");
const validBtn = document.getElementById("validButton");
const modal = document.getElementById("adminDelModal");
const saveInfoModal = document.getElementById("saveConfigModal");

const addAdminLink = document.getElementById("addAdmin");
addAdminLink.setAttribute("href","../inscription/inscriptionAdmin.html?schoolId="+schoolId);

infoRef.on('value',infoSnap => {
	schoolName.value = infoSnap.val().name;
	if(infoSnap.val().site_url){
		schoolSite.value = infoSnap.val().site_url;
	}
})


/*---------------------------ADMIN-----------------------------*/

adminRef.on('value',admins => {
    $(adminList).empty();
    admins.forEach(adminSnap => {
        createAdmin(adminList,adminSnap.key,adminSnap.val().name,
        adminSnap.val().surname,adminSnap.val().email);
    })
})

// Create an admin from a template
function createAdmin(parent,id,name,surname,email){
	const admin = document.importNode(adminLi,true);
	admin.querySelector("#adminName").innerText = name + " " + surname;
	admin.querySelector("#adminName").setAttribute("title",email);
	$(admin.querySelector("#adminName")).tooltip({trigger:"hover"});
	admin.setAttribute("data-id",id);
	getUserRole(firebase.auth().currentUser.uid)
	.then(role => {
		if (role.name === 'superadmin'){
			$(admin.querySelector("#adminDel")).tooltip({trigger:"hover"});
			admin.querySelector("#adminDel").addEventListener('click', e=>{
				modal.querySelector("#body span").id = id;
				$(modal).modal('show');
			})
		} else {
			$(admin.querySelector("#adminDel")).addClass('hidden');
		}
	})
	parent.appendChild(admin);
}

validBtn.addEventListener('click',e=>{
	const id = modal.querySelector("#body span").id;
	const admin = document.querySelector("[data-id='"+id+"']");
	const adminDel = admin.querySelector("#adminDel");
	const adminLoad = admin.querySelector("#adminLoading");
	$(adminDel).addClass('hidden');
	$(adminLoad).removeClass('hidden');

	$("#adminAlert").addClass('hidden');
	$("#adminAlert").empty();
	$("#adminAlert").removeClass("alert-danger", "alert-success");

	const errorText = "Une erreur est survenue. Veuillez réessayer plus tard.";
	const successText = "L'administrateur a bien été supprimé.";

	cfDeleteUser({userId:id})
	.then(()=>{
		showAdminAlert("alert-success",successText);
	})
	.catch(err=>{
		$(adminLoad).addClass('hidden');
		showAdminAlert("alert-danger",errorText);
	})
})

function showAdminAlert(alertClass, text){
	$("#adminAlert").removeClass('hidden');
	$("#adminAlert").html(text)
	$("#adminAlert").addClass(alertClass)
	$("#adminAlert").hide().slideDown(400);
}

/*--------------------------------CONFIG------------------------------------*/

saveInfoBtn.addEventListener('click',e=>{
    if(schoolDefaultImg.checked){
		$(saveConfigModal).modal('show')
	}else{
		saveConfiguration();
	}
})

saveConfigModal.querySelector("#validButton").addEventListener('click',e=>{
	saveConfiguration();
})

function saveConfiguration(){
	const successText = "Les changements ont été enregistrés avec succès.";
    const failText = "Une erreur est survenue. Veuillez réessayer plus tard.";
    const errorNameText = "Le nom de l'école ne peut pas être vide";

    $("#schoolLoading").removeClass('hidden');
	$("#schoolAlert").addClass('hidden');
	$("#schoolImgProgressBarContainer").addClass('hidden');
	$("#schoolAlert").empty();
	$("#schoolAlert").removeClass("alert-danger", "alert-success");
	$(saveInfoBtn).attr('disabled', true);
    if(schoolName.value){
		const saveSchoolName = schoolName.value;
		const saveSchoolSite = schoolSite.value.length > 0 ? schoolSite.value : null;

		const promises = [];
		promises.push(changeImage());
		promises.push(infoRef.child("name").set(saveSchoolName));
		promises.push(infoRef.child("site_url").set(saveSchoolSite));
		Promise.all(promises)
		.then(()=>{
			showSchoolAlert("alert-success",successText);
			resetImage();
        })
        .catch(err => {
            showSchoolAlert("alert-danger",failText);
        })
    }else{
        showSchoolAlert("alert-danger",errorNameText);
    }
}

function showSchoolAlert(alertClass, text){
	$(saveInfoBtn).removeAttr('disabled');
	$("#schoolLoading").addClass('hidden');
	$("#schoolAlert").removeClass('hidden');
	$("#schoolAlert").html(text)
	$("#schoolAlert").addClass(alertClass)
	$("#schoolAlert").hide().slideDown(400);
}

// Save the new image in Firebase Storage
function changeImage(){
    const progressBar = document.getElementById("schoolImgProgressBar");

	if(schoolDefaultImg.checked){
		return schoolRef.child("infos/img_url").ref.remove();
	}else{
		if(schoolImg.files.length > 0){
			return new Promise((resolve,reject) => {
				$("#schoolImgProgressBarContainer").removeClass('hidden');
			
				const file = schoolImg.files[0];
				const fileName = schoolImg.value.split(/(\\|\/)/g).pop();
				const fileRef = '/schools/' + schoolId + '/schoolImage/' + fileName;
				const storageRef = firebase.storage().ref(fileRef);
				const task = storageRef.put(file);
	
				task.on('state_changed', 
					function progress(snapshot){
						let percentage = ((snapshot.bytesTransferred / snapshot.totalBytes) * 100).toFixed(0);
						progressBar.setAttribute("aria-valuenow",percentage);
						progressBar.style.width = percentage + "%";
						progressBar.innerText = percentage + "%";
					},
	
					function error(err){
						// console.error(err);
						reject();
					},
	
					function complete(){
						progressBar.setAttribute("aria-valuenow","100");
						progressBar.style.width = "100%";
						progressBar.innerText = "UPLOAD COMPLETED";
						resolve();
					}
				)
			})
		}
	}
}

// Update file name from input file
$(schoolImg).on('change',function(){
    const fileName = $(this).val().split(/(\\|\/)/g).pop();
    $(this).next('.custom-file-label').html(fileName);
})

// resets Image input file
function resetImage(){
    schoolImg.value = "";
	$(schoolImg).next('.custom-file-label').html("Choisir l'image");
	schoolDefaultImg.checked = false;
}