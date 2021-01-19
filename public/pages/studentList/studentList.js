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
					if (schoolId !== role.school) {
						return window.location.replace("../studentList/studentList.html?schoolId=" + role.school);
					}
					schoolDbRef.child("users").child(role.userId).once('value',userSnap=>{
						if(userSnap.val().role !== "referent"){
							btnInscriptionChild.parentNode.removeChild(btnInscriptionChild);
						}
					})
					displayChild(id);
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

const childrenRef = schoolDbRef.child('/children');
const usersRef = schoolDbRef.child('/users');
const relationshipsRef = schoolDbRef.child('/relationships');

const accordionDiv = document.getElementById("accordion");

const temp = document.getElementById("studentListTemplate");
const item = temp.content.querySelector("#student");

const schoolName = document.getElementById("schoolName");
schoolRef.child("infos").once('value',infoSnap=>{
	schoolName.innerText = infoSnap.val().name;
})

function displayChild(user){
	// When a child is added
	relationshipsRef.child(user).on('child_added', relationSnap => {
		const childId = relationSnap.key;
		childrenRef.child(childId).once('value', snap => {
			addChild(snap.key,snap.val().name,snap.val().surname)
		});
	});
	// When a child is removed
	relationshipsRef.child(user).on('child_removed', relationSnap => {
		removeChild(relationSnap.key)
	});
}

// Add a child to the list
function addChild(childId, childName, childSurname){
	const div = document.importNode(item, true);
	const today = Date.now();
	const idValue = today + childId;

	div.id = childId;
	div.setAttribute("data-id",childId);
	div.querySelector("#studentLink").innerText = childName + " " + childSurname;
	div.querySelector("#studentProfile").setAttribute("href", "../index/index.html?schoolId=" + schoolId + "&studentId=" + childId);

	setCardAttributes(div, "studentContent", idValue, "studentHeader", "header" + idValue);

	relationshipsRef.on('child_added', relSnap => {
		if (relSnap.child(childId).val()) {
			getUser(relSnap.key)
			.then(role => {
				if (role.name === "user") {
					if (role.val.role === "referent") {
						const link = div.querySelector("#referentLink");
						link.setAttribute("title", role.val.email); //set the mail for the referent's tooltip
						link.innerText = role.val.name + " " + role.val.surname; //Surname and Name of the referent
						$(link).tooltip();
					}
					if (role.val.role === "parent") {
						const parentList = div.querySelector("#parentList");
						if (parentList.innerText !== "") {
							parentList.innerText += " -- ";
						}
						parentList.innerText += role.val.name + " " + role.val.surname; //Surname and Name of the referent
					}
				}
			})
		}
	})

	accordionDiv.appendChild(div);
}

// Remove a child from the list
function removeChild(childId){
	const child = accordionDiv.querySelector("[data-id='" + childId + "']");
	accordionDiv.removeChild(child);
}

// Search bar
document.getElementById('search').addEventListener('keyup', function (e) {
	let search = this.value.toLowerCase();
	let cards = document.querySelectorAll('#accordion div.card');

	//  console.log("Search : %s", search); // display the searching result in console

	Array.prototype.forEach.call(cards, function (doc) {
		// For all items, compare with searching terms
		const name = doc.querySelector("a.card-link").innerText;
		if (name.toLowerCase().indexOf(search) > -1) {
			// if it does match with the searching terms, display the item
			$(doc).removeClass('hidden');
		} else {
			// if it doesn't match with the searching terms, hide the item
			$(doc).addClass('hidden');
		}
	});
});

// Inscription Child Button Click
const btnInscriptionChild = document.getElementById("btnInscriptionChild");
btnInscriptionChild.addEventListener('click', e => {
	window.location.replace("../inscription/inscriptionChild.html?schoolId=" + schoolId);
})
