/*
	VERIFICATIONS
*/
// Firebase Authentication verification
let userId;
firebase.auth().onAuthStateChanged(userAuth => {
	if (userAuth) {
		userId = userAuth.uid;
		getUserRole(userId)
			.then(role => {
				if (role.name === "admin" && schoolId !== role.school) {
					return window.location.replace("../admin/admin.html?schoolId=" + role.school);
				}
				if (role.name === "user") {
					if (schoolId !== role.school) {
						return window.location.replace("../studentList/studentList.html?schoolId=" + role.school);
					}
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

// studentId and schoolId verification
const studentId = getUrlParameter('studentId');
if (!studentId || !schoolId) {
	window.location.replace('../index/index.html');
}
// End studentId and schoolId verification
/*
	END VERIFICATIONS
*/

const temp = document.getElementById("newMeetingTemplate");
const item = temp.content.querySelector("#participant");

const skillParent = document.getElementById("skillParent");
const skillSection = temp.content.querySelector("#skillSection");
const skillBlock = temp.content.querySelector("#skillBlock");
const skillTabBtn = temp.content.querySelector("#skillTabBtn");

const archivedCategory = document.getElementById("archivedCategories");
const archivedCategoryTab = document.getElementById("archivedCategoriesTab");

const remarks = document.getElementById("comment");
autosize(remarks);
remarks.value = "";

const membersList = document.getElementById('membersList');
const memberInput = document.getElementById('memberInput');

const today = new Date().getTime();

const meetingDate = document.getElementById("newMeetingDate");
meetingDate.innerText = "Réunion du " + new Date(today).toLocaleDateString("fr-FR");

const studentNameAndClass = document.getElementById("studentNameAndClass");
schoolDbRef.child('/children/' + studentId).once('value', function (childSnap) {
	studentNameAndClass.innerText = childSnap.val().name + ' ' + childSnap.val().surname + ' : ' + childSnap.val().class + 'ème'
})

const usersRef = schoolDbRef.child('/users');
const rolesRef = schoolDbRef.child('/roles');
const relationshipsRef = schoolDbRef.child('/relationships');
const childrenCategoriesRef = schoolDbRef.child('/children_categories');
const childrenSkillsRef = schoolDbRef.child('/children_skills');
const childrenMeetingsRef = schoolDbRef.child('/children_meetings');
const meetingsRef = schoolDbRef.child('/meetings');

const saveBtn = document.getElementById("saveModalButton");
const cancelBtn = document.getElementById("cancelButton");
const closeBtn = document.getElementById("closeButton");

const name= document.getElementById('name');
const email= document.getElementById('email');
const nameCat= document.getElementById('nameCat');
const nameSkill= document.getElementById('nameSkill');

let participants = {};
const participantList = [];
// Stores the local changes of the skills and categories
let skillValues = {};

let first = true;
let firstArchived = true;

relationshipsRef.once('value', snapshot => {
	// We add the user if he is in a relationship with the student
	snapshot.forEach(relationSnap => {
		Object.keys(relationSnap.val()).forEach(childId => {
			if (childId === studentId) {
				participantList.push(relationSnap.key);
			}
		})
	})
})
.then(() => {
	// We create a participant for each user related to the student
	participantList.forEach(userId => {
		usersRef.child(userId).once('value', userSnap => {
			let user = userSnap.val();
			if (user) {
				rolesRef.child(user.role).once('value', roleSnap => {
					createParticipant(user.name + " " + user.surname, roleSnap.val().role_name, userSnap.key, user.email);
				})
			}
		})
	})
});

childrenCategoriesRef.child(studentId).once('value', snapshot => {
	// We create the categories and the skills in each category
	snapshot.forEach(categorySnap => {
		const name = categorySnap.val().name;
		const id = categorySnap.key;
		const archived = categorySnap.val().archived;
		onCategoryAdded(name,id,archived);
	})
})

function onCategoryAdded(name, id, archived){
	let category;
	if(archived){
		category = createCategoryArchived(name,id,firstArchived);
		if(firstArchived){
			firstArchived = false;
		}
	}else{
		category = createCategory(name,id,first);
		if(first){
			first = false;
		}
	}
	childrenCategoriesRef.child(studentId).child(id).child("skills").once('value', skills => {
		skills.forEach(skill => {
			const val = skill.val();
			const key = skill.key;
			childrenSkillsRef.child(studentId).child(id).child(key).once('value',skillSnap => {
				let latestValue = -1;
				if (skillSnap.val() !== null) {
					latestValue = skillSnap.child(skillSnap.val().latest).val().value;
				}
				if (val.acquired) {
					addSkill(category, archived, val.name, latestValue, key, "acquired");
				}else if(val.archived){
					addSkill(category, archived, val.name, latestValue, key, "archived")
				}else{
					addSkill(category, archived, val.name, latestValue, key, "current");
				}
			})
		})
	})
}

// Add Participant Button Click
const addButton = document.querySelector("#newMeetingAddPart #addButton");
$("#addParticipant").tooltip({ trigger: "hover" });
addButton.addEventListener('click', e => {
	let name = document.querySelector("#newMeetingAddPart #name");
	let email = document.querySelector("#newMeetingAddPart #email");
	if (name.value && email.value) {
		createParticipant(name.value, null, Date.now(), email.value);
		name.value = "";
		email.value = "";
	}
});

// Add Category Button Click
const addCatBtn = document.querySelector("#newMeetingAddCat #addButton");
$("#addCategory").tooltip({ trigger: "hover" });
addCatBtn.addEventListener('click', e => {
	let name = document.querySelector("#newMeetingAddCat #nameCat");
	addRemark("La catégorie \"" + name.value + "\" a été créée.");
	let id = Date.now();
	createCategory(name.value, id, true);
	changeCatValues(id, "new", true);
	changeCatValues(id, "name", name.value);
})

// Archive Category Button Click
const delCatBtn = document.querySelector("#newMeetingCatDel #validButton");
delCatBtn.addEventListener('click', e => {
	const name = document.querySelector("#newMeetingCatDel #catName").value;
	const id = document.querySelector("#newMeetingCatDel #catId").value;
	changeCatValues(id, "archived", true);
	if (skillValues[id].new) {
		skillValues[id] = {};
	}
	addRemark("La catégorie \"" + name + "\" a été archivée.");
	removeCategory(id,false);
	onCategoryAdded(name,id,true);
})

// Add Category Button Click
const resCatBtn = document.querySelector("#newMeetingCatRestore #validButton");
resCatBtn.addEventListener('click', e => {
	const name = document.querySelector("#newMeetingCatRestore #catName").value;
	const id = document.querySelector("#newMeetingCatRestore #catId").value;
	if(skillValues[id] && skillValues[id].archived){
		delete skillValues[id].archived;
	}else{
		changeCatValues(id, "restored", true);
	}
	addRemark("La catégorie \"" + name + "\" a été restaurée.");
	removeCategory(id,true);
	onCategoryAdded(name,id,false);
})

// Add Skill Button Click
const addSkillBtn = document.querySelector("#newMeetingAddSkill #addButton");
addSkillBtn.addEventListener('click', e => {
	const name = document.querySelector("#newMeetingAddSkill #nameSkill").value;
	const categoryId = document.querySelector("#newMeetingAddSkill #categoryId").value;
	addRemark("La compétence \"" + name + "\" a été créée.");
	const id = Date.now();
	const category = skillParent.querySelector("#tabContent")
	.querySelector("[data-id='" + categoryId + "']").querySelector("#skillContent");
	addSkill(category, false, name, -1, id, "current");
	changeSkillValues(categoryId, id, "new", true);
	changeSkillValues(categoryId, id, "name", name);
})

// Save Meeting Modal Button Click
saveBtn.addEventListener('click', e => {
	$('#saveButton').prop('disabled', true);
	$("#PDF").addClass("darkClass");
	$("#newMeetingLoading").removeClass('hidden');
	$("#newMeetingAlert").addClass('hidden');
	$("#newMeetingAlert").removeClass("alert-danger", "alert-success");
	saveMeeting();
})

// Close Meeting Button Click
closeBtn.addEventListener('click',e=>{
	window.close();
})

// Cancel Meeting Button Click
cancelBtn.addEventListener('click', e => {
	window.close();
})

/*
	Creates a participant from a template
*/
function createParticipant(name, role, id, email) {
	const newLine = document.createElement('br');
	const label = document.importNode(item, true);

	let roleLabel = "";
	if (role) {
		roleLabel = "(" + role + ")"
	}

	label.append(name + " " + roleLabel);
	const input = label.querySelector("input")
	input.id = id;

	if(id === userId){
		input.setAttribute("checked", "");
		if (!participants[id]) {
			participants[id] = {};
		}
		participants[id].active = true;
		participants[id].name = name;
		participants[id].email = email;
	}

	// Participant checkbox input Click
	input.addEventListener('click', e => {
		if (!participants[id]) {
			participants[id] = {};
		}
		participants[id].active = input.checked;
		participants[id].name = name;
		participants[id].email = email;
	})

	membersList.appendChild(label);
	membersList.appendChild(newLine);
}

/*
	Creates a category from a template
	Returns the DOM element created
*/
function createCategory(name, id, first) {
	const category = document.importNode(skillSection, true);
	const categoryTab = document.importNode(skillTabBtn, true);

	categoryTab.querySelector("#tabId").setAttribute("href", "#" + id);
	categoryTab.querySelector("#tabName").innerText = name;

	setCardAttributes(category,"collapseCurrent","collapseCurrent"+id,"headingCurrent","headingCurrent"+id);
	setCardAttributes(category,"collapseAcquired","collapseAcquired"+id,"headingAcquired","headingAcquired"+id);
	setCardAttributes(category,"collapseArchived","collapseArchived"+id,"headingArchived","headingArchived"+id);
	
	// Delete category Click
	categoryTab.querySelector("#tabDel").addEventListener('click', e => {
		document.querySelector("#newMeetingCatDel #catName").value = name;
		document.querySelector("#newMeetingCatDel #catId").value = id;
	})

	// Activate tooltips
	$(categoryTab.querySelector("#tabDel")).tooltip({ trigger: "hover" });
	$(category.querySelector("#addSkill")).tooltip({ trigger: "hover" });

	categoryTab.setAttribute("data-id",id);

	category.setAttribute("data-id",id);
	category.id = id;

	const content = category.querySelector("#skillContent");
	content.setAttribute("data-id",id);

	// Add Skill Button Click
	$(category.querySelector("#addSkill")).tooltip({ trigger: "hover" });
	$(category.querySelector("#addSkill")).on('click', e => {
		const addSkillModal = document.querySelector("#newMeetingAddSkill")
		addSkillModal.querySelector("#categoryId").value = id;
		$(addSkillModal).modal('show');
	})

	skillParent.querySelector("#tabContainer").insertBefore(categoryTab,archivedCategoryTab);
	skillParent.querySelector("#tabContent").insertBefore(category,archivedCategory);

	// If is the first category, we activate it
	if (first) {
		$(categoryTab.querySelector("#tabId")).tab('show');
	}
	return content;
}

/*
	Creates an archived category from a template
	Returns the DOM element created
*/
function createCategoryArchived(name, id, first) {
	const category = document.importNode(skillSection, true);
	const categoryTab = document.importNode(skillTabBtn, true);

	categoryTab.querySelector("#tabId").setAttribute("href", "#" + id);
	categoryTab.querySelector("#tabName").innerText = name;

	setCardAttributes(category,"collapseCurrent","collapseCurrent"+id,"headingCurrent","headingCurrent"+id);
	setCardAttributes(category,"collapseAcquired","collapseAcquired"+id,"headingAcquired","headingAcquired"+id);
	setCardAttributes(category,"collapseArchived","collapseArchived"+id,"headingArchived","headingArchived"+id);

	// Restore category Click
	categoryTab.querySelector("#tabRestore").addEventListener('click', e => {
		document.querySelector("#newMeetingCatRestore #catName").value = name;
		document.querySelector("#newMeetingCatRestore #catId").value = id;
	})

	categoryTab.setAttribute("data-id",id);

	category.setAttribute("data-id",id);
	category.id = id;

	const content = category.querySelector("#skillContent");
	content.id = id;

	$(categoryTab.querySelector("#tabRestore")).removeClass('hidden');
	$(categoryTab.querySelector("#tabRestore")).tooltip({ trigger:'hover' })

	archiveCategory(category,categoryTab);
	$(archivedCategoryTab).removeClass('hidden');

	archivedCategory.querySelector("#categoryTabs").appendChild(categoryTab);
	archivedCategory.querySelector("#categoryContainer").appendChild(category);

	// If is the first category, we activate it
	if (first) {
		$(categoryTab.querySelector("#tabId")).tab('show');
	}
	return content;
}

function archiveCategory(category,categoryTab){
	$(category).addClass("newMeetingDisabled");
	$(category.querySelectorAll("button")).attr("disabled", "disabled");
	$(category.querySelectorAll("button[data-tooltip='tooltip']")).tooltip('disable');
	$(category.querySelector("#addSkill")).addClass("hidden");
	$(categoryTab.querySelector("#tabDel")).addClass("hidden");
}

function removeCategory(categoryId,archived){
	let categoryContainer;
	let categoryTabs;
	if (archived){
		categoryContainer = archivedCategory.querySelector("#categoryContainer");
		categoryTabs = archivedCategory.querySelector("#categoryTabs");
	} else {
		categoryContainer = skillParent.querySelector("#tabContent");
		categoryTabs = skillParent.querySelector("#tabContainer");
	}
	const category = categoryContainer.querySelector("[data-id='" + categoryId + "']")
	const categoryTab = categoryTabs.querySelector("[data-id='" + categoryId + "']")
	categoryContainer.removeChild(category);
	categoryTabs.removeChild(categoryTab);
	const skillTabs = skillParent.querySelector("#tabContainer");
	if(!skillTabs.firstElementChild){
		first = true;
	}else{
		$(skillParent.querySelector("#tabContainer").firstElementChild
		.querySelector("#tabId")).tab('show');
	}
	const archivedTabs = archivedCategory.querySelector("#categoryTabs");
	if(!archivedTabs.firstElementChild){
		const archivedCategoriesTab = skillTabs.querySelector("#archivedCategoriesTab");
		$(archivedCategoriesTab).addClass('hidden');
		firstArchived = true;
	}else{
		$(archivedCategory.querySelector("#categoryTabs").firstElementChild
		.querySelector("#tabId")).tab('show');
	}
}

/*
	Creates a skill from a template
	Returns the DOM element created
*/
function addSkill(category, categoryArchived, name, value, id, type) {
	const categoryId = category.getAttribute("data-id");
	const skill = document.importNode(skillBlock, true);
	const nameSpan = skill.querySelector("#skillName");
	const nameInput = skill.querySelector("#skillNameEdit input")
	nameSpan.innerText = name;
	nameInput.value = name;

	if (value !== -1) {
		// We activate the smiley corresponding to the value of the skill
		const val = value - 1;
		const valBtn = skill.querySelector("#skillBtnGroup").children[val];
		valBtn.classList.add("newMeetingOldSkill");
		$(valBtn).prop("data-tooltip","tooltip");
		$(valBtn).prop("data-placement","top");
		$(valBtn).prop("title","Ancienne valeur");
		$(valBtn).tooltip({ trigger: "hover" });
		if(type === "current"){
			changeSkillValues(categoryId, id, "value", value);
		}
	}

	skill.id = id;

	const valueBtns = skill.querySelectorAll("#skillBtnGroup button");
	valueBtns.forEach(elem => {
		// Smiley Button Click
		elem.addEventListener("click", function () {
			elem.parentNode.querySelectorAll("button").forEach(el => {
				if (el != elem)
					el.classList.remove('active');
			})
			elem.classList.toggle('active');
			const newVal = getValueOfBtn(elem, elem.classList.contains('active'));
			if(newVal === -1 && type === "current"){
				changeSkillValues(categoryId, id, "value", value);
			}else{
				changeSkillValues(categoryId, id, "value", newVal);
			}
		});
	});

	// Activate tooltips
	if(!categoryArchived){
		const tooltips = skill.querySelectorAll("button[data-tooltip='tooltip']");
		tooltips.forEach(btn => {
			$(btn).tooltip({ trigger: "hover" });
		})
	}

	const edit = skill.querySelector("#skillNameEditBtn");
	const valid = skill.querySelector("#skillNameEditValidateBtn");

	const check = skill.querySelector("#skillCheck");
	const restore = skill.querySelector("#skillRestore");
	const del = skill.querySelector("#skillDel");
	const cancel = skill.querySelector("#skillCancel");

	let skillAction;

	// Edit skill name
	edit.addEventListener('click', e => {
		$(skill.querySelector("#skillNameNoEdit")).addClass('hidden');
		$(skill.querySelector("#skillNameEdit")).removeClass('hidden');
	})

	// Validate name edition
	valid.addEventListener('click', e => {
		const newName = nameInput.value;
		if(newName && newName !== name){
			addRemark("La compétence \"" + name + "\" a été renommée en \"" + newName + "\".")
			name = newName;
			nameSpan.innerText = newName;
			changeSkillValues(categoryId, id, "update", newName);
			changeSkillValues(categoryId, id, "name", newName);
			if(skillValues[categoryId].skills[id].new){
				delete skillValues[categoryId].skills[id].update;
			}
		}
		$(skill.querySelector("#skillNameEdit")).addClass('hidden');
		$(skill.querySelector("#skillNameNoEdit")).removeClass('hidden');
	})

	// Acquire skill Click
	check.addEventListener('click', e => {
		$(skill.querySelector("#skillNameEdit")).addClass('hidden');
		$(skill.querySelector("#skillNameNoEdit")).removeClass('hidden');
		$(edit).addClass('hidden');
		skillAction = "acquise";
		addRemark("La compétence \"" + name + "\" a été acquise.");
		$(skill).addClass("newMeetingAcquired");
		$(check).addClass("hidden");
		$(del).addClass("hidden");
		$(restore).addClass("hidden");
		$(cancel).removeClass("hidden");
		$(valueBtns).attr("disabled", "disable");
		$(valueBtns).removeClass("active");
		changeSkillValues(categoryId, id, "acquired", true);
		if (skillValues[categoryId].skills[id].new) {
			skillValues[categoryId].skills[id] = {};
		}
	})
	// Restore skill Click
	restore.addEventListener('click', e => {
		$(skill.querySelector("#skillNameEdit")).addClass('hidden');
		$(skill.querySelector("#skillNameNoEdit")).removeClass('hidden');
		$(edit).addClass('hidden');
		skillAction = "restaurée";
		addRemark("La compétence \"" + name + "\" a été restaurée.");
		$(check).addClass("hidden");
		$(del).addClass("hidden");
		$(restore).addClass("hidden");
		$(cancel).removeClass("hidden");
		$(skill.querySelector("#skillBtnGroup")).removeClass('hidden');
		changeSkillValues(categoryId, id, "restored", true);
	})
	// Archive skill Click
	del.addEventListener('click', e => {
		$(skill.querySelector("#skillNameEdit")).addClass('hidden');
		$(skill.querySelector("#skillNameNoEdit")).removeClass('hidden');
		$(edit).addClass('hidden');
		skillAction = "archivée";
		addRemark("La compétence \"" + name + "\" a été archivée.");
		$(skill).addClass("newMeetingArchived");
		$(check).addClass("hidden");
		$(del).addClass("hidden");
		$(restore).addClass("hidden");
		$(cancel).removeClass("hidden");
		$(valueBtns).attr("disabled", "disable");
		$(valueBtns).removeClass("active");
		changeSkillValues(categoryId, id, "archived", true);
		if (skillValues[categoryId].skills[id].new) {
			skillValues[categoryId].skills[id] = {};
		}
	})

	// Cancel action
	cancel.addEventListener('click', e => {
		addRemark("La compétence \"" + name + "\" n'est plus " + skillAction +  ".");
		$(skill).removeClass("newMeetingArchived");
		$(skill).removeClass("newMeetingAcquired");
		if(type === "current"){
			$(edit).removeClass('hidden');
			$(check).removeClass("hidden");
			$(del).removeClass("hidden");
		}
		if(type === "acquired"){
			$(restore).removeClass("hidden");
			$(del).removeClass("hidden");
			$(skill.querySelector("#skillBtnGroup")).addClass('hidden');
		}
		if(type === "archived"){
			$(restore).removeClass("hidden");
			$(skill.querySelector("#skillBtnGroup")).addClass('hidden');
		}
		$(cancel).addClass("hidden");
		$(valueBtns).removeAttr("disabled");
		if (skillValues[categoryId].skills[id].acquired) {
			delete skillValues[categoryId].skills[id].acquired;
		}
		if (skillValues[categoryId].skills[id].archived) {
			delete skillValues[categoryId].skills[id].archived;
		}
		if (skillValues[categoryId].skills[id].restored){
			delete skillValues[categoryId].skills[id].restored;
			delete skillValues[categoryId].skills[id].value;
		}
		if (skillValues[categoryId].skills[id].value){
			const newValue = skillValues[categoryId].skills[id].value;
			const val = newValue - 1;
			const valBtn = skill.querySelector("#skillBtnGroup").children[val];
			$(valBtn).addClass("active");
		}
	})

	if(type === "current"){
		$(restore).addClass('hidden');
	}
	if(type === "acquired"){
		$(edit).addClass('hidden');
		$(check).addClass('hidden');
		$(skill.querySelector("#skillBtnGroup")).addClass('hidden');
	}
	if(type === "archived"){
		$(edit).addClass('hidden');
		$(del).addClass('hidden');
		$(check).addClass('hidden');
		$(skill.querySelector("#skillBtnGroup")).addClass('hidden');
	}

	if(categoryArchived){
		const buttons = skill.querySelectorAll("button");
		$(buttons).attr("disabled","disabled");
	}

	if(type === "current"){
		const addSkillBtn = category.querySelector("#addSkill");
		category.querySelector("#tabContentCurrent").insertBefore(skill, addSkillBtn);
	}
	if(type === "acquired"){
		category.querySelector("#tabContentAcquired").appendChild(skill);
	}
	if(type === "archived"){
		category.querySelector("#tabContentArchived").appendChild(skill);
	}
}

/*
	Gets the value of the smiley button checked
	return a value between 1 and 3 or -1 if not smiley is checked
*/
function getValueOfBtn(el, active) {
	if (!active) return -1;
	let parent = el.parentNode;
	for (var i = 0; i < parent.children.length; i++) {
		if (parent.children[i] === el) {
			return i + 1;
		}
	}
	return -1;
}

/*
	Change the local category values
*/
function changeCatValues(categoryId, key, value) {
	if (!skillValues[categoryId]) {
		skillValues[categoryId] = {
			skills: {}
		};
	}
	skillValues[categoryId][key] = value;
}

/*
	Change the local skill values
*/
function changeSkillValues(categoryId, skillId, key, value) {
	if (!skillValues[categoryId]) {
		skillValues[categoryId] = {
			skills: {}
		};
	}
	if (!skillValues[categoryId].skills[skillId]) {
		skillValues[categoryId].skills[skillId] = {};
	}
	skillValues[categoryId].skills[skillId][key] = value;
}

/*
	Add text to the comment section
*/
function addRemark(remark) {
	let string = remark + "\n";
	remarks.value += string;
	autosize.update(remarks);
}

/*
	Save the Meeting to the Firebase Database
*/
function saveMeeting() {
	$("#newMeetingLoading").removeClass('hidden');
	const finalParticipants = [];
	const emailList = [];
	for (let participant in participants) {
		if (participants[participant].active) {
			finalParticipants.push({
				id: participant,
				name: participants[participant].name,
				email: participants[participant].email
			})
			emailList.push(participants[participant].email);
		}
	}
	// console.log("finalParticipants", finalParticipants);
	// console.log("emailList", emailList);
	const values = [];
	const catUpdates = [];
	const skillUpdates = [];
	for (let cat in skillValues) {
		for (let key in skillValues[cat]){
			if(key !== "name" && key !== "skills"){
				catUpdates.push({
					category: cat,
					action: key,
					name: skillValues[cat].name
				})
			}
		}
		for (let skill in skillValues[cat].skills) {
			for (let key in skillValues[cat].skills[skill]) {
				if (key !== "value") {
					if (key !== "name") {
						let obj = {
							category: cat,
							skill: skill,
							action: key
						};
						if (key === "new" || key === "update") {
							obj.name = skillValues[cat].skills[skill].name;
						}
						skillUpdates.push(obj);
					}
				} else {
					let value = skillValues[cat].skills[skill].value;
					if (value !== -1) {
						values.push({
							category: cat,
							skill: skill,
							value: value
						});
					}
				}
			}
		}
	}
	// console.log("catUpdates", catUpdates);
	// console.log("skillUpdates", skillUpdates);
	// console.log("values", values);

	const promises = [];

	const meeting = childrenMeetingsRef.child(studentId).push();
	const meetingSet = {
		participants: finalParticipants,
		date: today,
		additional_notes: remarks.value,
		emails: emailList
	};
	promises.push(meeting.set(meetingSet));

	childrenMeetingsRef.child(studentId).child(meeting.key).child("pdf_url").on('value', function (meetingSnap) {
		$('#newMeetingAlert').removeClass("alert-success");
		$('#newMeetingAlert').removeClass("alert-danger");
		if(meetingSnap.val() !== null){
			if (!meetingSnap.val()) {
				// PDF is completed
				$("#newMeetingLoading").addClass('hidden');
				$("#PDF").removeClass("darkClass");
				$('#newMeetingAlert').addClass("alert-danger")
				$('#newMeetingAlert').removeClass("hidden")
				$('#newMeetingAlert').text("Une erreur est survenue, veuillez rééssayer.")
				$('#newMeetingAlert').slideDown(400);
				$('#saveButton').prop("disabled",false);
				$('#newMeetingValid').modal('hide');
			} else {
				// PDF has failed
				$("#newMeetingLoading").addClass('hidden');
				$("#PDF").removeClass("darkClass");
				$('#newMeetingAlert').addClass("alert-success")
				$('#newMeetingAlert').removeClass("hidden")
				$('#newMeetingAlert').text("Un résumé PDF de la réunion a été envoyé aux intervenants. Vous pouvez le consulter dans l'onglet Mes Réunions de l'élève.")
				$('#newMeetingAlert').slideDown(400);
				$('#saveButton').addClass("hidden");
				$('#cancelButton').addClass("hidden");
				$('#closeButton').removeClass("hidden");
				$('#newMeetingValid').modal('hide');
			}
		}
	})

	catUpdates.forEach(cat => {
		// Updates category
		// if new category, creates a new category in the children_categories node
		if (cat.action === "new") {
			let newCat = childrenCategoriesRef.child(studentId).push();
			newCat.set({
				name: cat.name
			})
			skillUpdates.forEach(skill => {
				if (skill.category === cat.category) {
					skill.category = newCat.key;
				}
			})
			values.forEach(val => {
				if (val.category === cat.category) {
					val.category = newCat.key;
				}
			})
		} else if (cat.action === "update") {
			// Updates the category name
			childrenCategoriesRef.child(studentId).child(cat.category).child("name").set(cat.name);
		} else if (cat.action === "restored") {
			childrenCategoriesRef.child(studentId).child(cat.category).child("archived").set(null);
		} else {
			// Sets the archived action
			childrenCategoriesRef.child(studentId).child(cat.category).child(cat.action).set(true);
		}
	})

	skillUpdates.forEach(skill => {
		// Updates skills
		// if new skill, creates a new skill in the children_categories node
		if (skill.action === "new") {
			let newSkill = childrenCategoriesRef.child(studentId).child(skill.category).child("skills").push();
			newSkill.set({
				name: skill.name
			})
			values.forEach(val => {
				if (val.skill === skill.skill) {
					val.skill = newSkill.key;
				}
			})
		} else if (skill.action === "update") {
			// Updates the skill name
			childrenCategoriesRef.child(studentId).child(skill.category).child("skills").child(skill.skill).child("name").set(skill.name)
		} else if (skill.action === "restored") {
			// Restored the skill, removing acquired and archived fields
			childrenCategoriesRef.child(studentId).child(skill.category).child("skills").child(skill.skill).child("acquired").set(null);
			childrenCategoriesRef.child(studentId).child(skill.category).child("skills").child(skill.skill).child("archived").set(null);
		} else {
			// Sets the acquired or archived action
			childrenCategoriesRef.child(studentId).child(skill.category).child("skills").child(skill.skill).child("acquired").set(null);
			childrenCategoriesRef.child(studentId).child(skill.category).child("skills").child(skill.skill).child("archived").set(null);
			childrenCategoriesRef.child(studentId).child(skill.category).child("skills").child(skill.skill).child(skill.action).set(true);
		}
	})

	values.forEach(val => {
		// Add the skill values to the children_skills node
		childrenSkillsRef.child(studentId).child(val.category)
		.child(val.skill).once('value',snap=>{
			promises.push(
				new Promise((resolve,reject)=>{
					const pros = []
					pros.push(childrenSkillsRef.child(studentId).child(val.category)
					.child(val.skill).child(meeting.key).set({ value: val.value }));
					pros.push(childrenSkillsRef.child(studentId).child(val.category)
					.child(val.skill).update({ latest: meeting.key }));
					if(snap.val()){
						const oldMeeting = snap.val().latest;
						pros.push(childrenSkillsRef.child(studentId).child(val.category)
						.child(val.skill).update({ old_latest: oldMeeting }));
					}
					Promise.all(pros)
					.then(()=>{
						resolve()
					})
					.catch(err=>{
						console.error("The values was not added to the database")
						console.error(err)
						reject()
					})
				})
			)
		})
	})

	Promise.all(promises)
	.then(()=>{
		meeting.child('finished').set(false);
	})
	.catch(err=>{
		console.error("The PDF was not generated. ERROR:",err)
	})
}

// Empty modal on close
$('.modal').on('hidden.bs.modal', function () {
	name.value="";
	email.value="";
	nameCat.value="";
	nameSkill.value="";
});

// Focus modal on open
$('.modal').on('shown.bs.modal', function () {
	$(this.querySelector("input")).focus()
});