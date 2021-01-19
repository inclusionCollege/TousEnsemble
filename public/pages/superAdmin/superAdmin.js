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
					
					return window.location.replace("../studentList/studentList.html?schoolId="+role.school);
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

const superTemplate = document.getElementById("superTemplate");
const schoolDiv = superTemplate.content.querySelector("#school");
const adminLi = superTemplate.content.querySelector("#admin");
const schoolsContainer = document.getElementById("schoolsContainer");

const schoolDelBtn = document.getElementById("schoolDelBtn");
const modal = document.getElementById("schoolDelModal");

/* --------------------------SCHOOL----------------------------- */

// When a school is added
baseDbRef.child("/schools").on('child_added',schoolSnap=>{
	const schoolId = schoolSnap.key;
	const schoolName = schoolSnap.child("/infos").val().name;
	createSchool(schoolId,schoolName);
})

// When a school is added
baseDbRef.child("/schools").on('child_changed',schoolSnap=>{
	const schoolId = schoolSnap.key;
	const school = schoolsContainer.querySelector("[data-id='" + schoolId + "']")
	const schoolName = schoolSnap.child("/infos").val().name;
	changeSchool(school,schoolName);
})

// When a school is added
baseDbRef.child("/schools").on('child_removed',schoolSnap=>{
	const schoolId = schoolSnap.key;
	deleteSchool(schoolsContainer,schoolId);
})

// Create a school from a template
function createSchool(schoolId,schoolName){
	const school = document.importNode(schoolDiv,true);
	changeSchool(school,schoolName);
	setCardAttributes(school,"schoolContent",schoolId,"schoolLink","header"+schoolId);

	// Admin added
	baseDbRef.child("schools").child(schoolId).child("admin").on('child_added',adminSnap=>{
		createAdmin(school,adminSnap.key,adminSnap.val().name,adminSnap.val().surname,adminSnap.val().email);
	})
	// Admin changed
	baseDbRef.child("schools").child(schoolId).child("admin").on('child_changed',adminSnap=>{
		const admin = school.querySelector("[data-id='" + adminSnap.key + "']")
		changeAdmin(admin,adminSnap.val().name,adminSnap.val().surname,adminSnap.val().email);
	})
	// Admin removed
	baseDbRef.child("schools").child(schoolId).child("admin").on('child_removed',adminSnap=>{
		deleteAdmin(school,adminSnap.key);
	})

	// school.querySelector("#schoolDel").addEventListener('click', e=>{
	// 	modal.querySelector("#body span").id = schoolId;
	// 	$(modal).modal('show');
	// })

	school.querySelector("#schoolBtn").href = "../admin/admin.html?schoolId="+schoolId;
	schoolsContainer.appendChild(school);
}

schoolDelBtn.addEventListener('click',e=>{
    const id = modal.querySelector("#body span").id;
	baseDbRef.child("schools").child(id).ref.remove();
})

// Change a school
function changeSchool(school,schoolName){
	school.querySelector("#schoolName").innerText = schoolName;
}

// Delete a school
function deleteSchool(parent,schoolId){
	const school = parent.querySelector("[data-id='" + schoolId + "']");
	parent.removeChild(school);
}

// Create an admin from a template
function createAdmin(parent,id,name,surname,email){
	const admin = document.importNode(adminLi,true);
	changeAdmin(admin,name,surname,email);
	admin.setAttribute("data-id",id);
	parent.querySelector("#adminList").appendChild(admin);
}

// Change an admin
function changeAdmin(admin,name,surname,email){
	admin.querySelector("#adminName").innerText = name + " " + surname;
	admin.querySelector("#adminName").setAttribute("title",email);
	$(admin.querySelector("#adminName")).tooltip();
}

// Delete an admin with id
function deleteAdmin(parent,id){
	const admin = parent.querySelector("[data-id='" + id + "']")
	parent.removeChild(admin);
}

/* --------------------------SUPERADMIN----------------------------- */
const superAdminLi = superTemplate.content.querySelector("#superAdmin");
const superAdminList = document.getElementById("superAdminList");

// When a superAdmin is added
baseDbRef.child("/superadmin").on('child_added',superSnap=>{
	const id = superSnap.key;
	const name = superSnap.val().name;
	const surname = superSnap.val().surname;
	const email = superSnap.val().email;
	createSuperAdmin(superAdminList,id,name,surname,email);
})

// When a superAdmin is changed
baseDbRef.child("/superadmin").on('child_changed',superSnap=>{
	const superAdmin = superAdminList.querySelector("[data-id='" + id + "']")
	const name = superSnap.val().name;
	const surname = superSnap.val().surname;
	const email = superSnap.val().email;
	changeSuperAdmin(superAdmin,name,surname,email);
})

// When a superAdmin is removed
baseDbRef.child("/superadmin").on('child_removed',superSnap=>{
	deleteSuperAdmin(superAdminList,superSnap.key);
})

// Create an superAdmin from a template
function createSuperAdmin(parent,id,name,surname,email){
	const superAdmin = document.importNode(superAdminLi,true);
	changeSuperAdmin(superAdmin,name,surname,email);
	superAdmin.setAttribute("data-id",id);
	parent.appendChild(superAdmin);
}

// Create an superAdmin from a template
function changeSuperAdmin(superAdmin,name,surname,email){
	superAdmin.querySelector("#superAdminName").innerText = name + " " + surname;
	superAdmin.querySelector("#superAdminName").setAttribute("title",email);
	$(superAdmin.querySelector("#superAdminName")).tooltip();
}

// Delete an superAdmin with id
function deleteSuperAdmin(parent,id){
	const superAdmin = parent.querySelector("[data-id='" + id + "']")
	parent.removeChild(superAdmin);
}

/* --------------------------CONFIGURATION----------------------------- */
const siteName = document.getElementById("siteName");
autosize(siteName);
const siteImg = document.getElementById("siteImg");
const siteDefaultImg = document.getElementById("siteDefaultImg");

const contactName = document.getElementById("contactName");
const contactAddress = document.getElementById("contactAddress");
autosize(contactAddress);
const saveConfig = document.getElementById("saveConfig");

const infoRef = baseDbRef.child("infos");
const siteRef = infoRef.child("site");
const contactRef = infoRef.child("contact");

const saveConfigModal = document.getElementById("saveConfigModal");
const modalSaveConfig = saveConfigModal.querySelector("#validButton");

// Change input from site
siteRef.on('value',snap => {
	if(snap.val() && snap.val().name){
		siteName.value = snap.val().name;
		autosize.update(siteName);
	}
})

// Change input from contact
contactRef.on('value',snap => {
	if(snap.val()){
		if(snap.val().name){
			contactName.value = snap.val().name;
		}
		if(snap.val().address){
			contactAddress.value = snap.val().address;
			autosize.update(contactAddress);
		}
	}
});

// On save config
saveConfig.addEventListener('click',e=>{
	if(siteDefaultImg.checked){
		$(saveConfigModal).modal('show');
	}else{
		saveConfiguration();
	}
})
// On modal save config
modalSaveConfig.addEventListener('click',e => {
	saveConfiguration();
})

function saveConfiguration(){
	const successText = "Les changements ont été enregistrés avec succès.";
	const errorText = "Le nom du site ne peut pas être vide."
    const failText = "Une erreur est survenue. Veuillez réessayer plus tard.";

    $("#configLoading").removeClass('hidden');
	$("#configAlert").addClass('hidden');
	$("#siteImgProgressBarContainer").addClass('hidden');
	$("#configAlert").empty();
	$("#configAlert").removeClass("alert-danger", "alert-success");
	$(saveConfig).attr('disabled', true);

	const saveSiteName = siteName.value;
	const saveContactName = contactName.value;
	const saveContactAddress = contactAddress.value;

	if(!saveSiteName){
		showConfigAlert("alert-danger",errorText);
		return
	}

	const promises = [];
	promises.push(changeImage());
	promises.push(siteRef.child("name").set(saveSiteName));
	promises.push(contactRef.child("name").set(saveContactName));
	promises.push(contactRef.child("address").set(saveContactAddress));
	Promise.all(promises)
	.then(()=>{
		showConfigAlert("alert-success",successText);
		resetImage();
	})
	.catch(err => {
		showConfigAlert("alert-danger",failText);
	})
}

function showConfigAlert(alertClass, text){
	$(saveConfig).removeAttr('disabled');
	$("#configLoading").addClass('hidden');
	$("#configAlert").removeClass('hidden');
	$("#configAlert").html(text)
	$("#configAlert").addClass(alertClass)
	$("#configAlert").hide().slideDown(400);
}

// Save the new image in Firebase Storage
function changeImage(){
    const progressBar = document.getElementById("siteImgProgressBar");

	if(siteDefaultImg.checked){
		return baseDbRef.child("infos/site/img_url").ref.remove();
	}else{
		if(siteImg.files.length > 0){
			return new Promise((resolve,reject) => {
				$("#siteImgProgressBarContainer").removeClass('hidden');
			
				const file = siteImg.files[0];
				const fileName = siteImg.value.split(/(\\|\/)/g).pop();
				const fileRef = '/siteImage/' + fileName;
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
$(siteImg).on('change',function(){
    const fileName = $(this).val().split(/(\\|\/)/g).pop();
    $(this).next('.custom-file-label').html(fileName);
})

// resets Image input file
function resetImage(){
    siteImg.value = "";
	$(siteImg).next('.custom-file-label').html("Choisir l'image");
	siteDefaultImg.checked = false;
}