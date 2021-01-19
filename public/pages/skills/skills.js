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
					if(schoolId !== role.school){
						return window.location.replace("../studentList/studentList.html?schoolId="+role.school);
					}
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

const skillsTemp = document.getElementById("skillsTemplate");

const skillSection = skillsTemp.content.querySelector("#skillSection");
const categoryArchivedSection = skillsTemp.content.querySelector("#archivedCategory");
const skillTabBtn = skillsTemp.content.querySelector("#skillTabBtn");

const skillContainer = document.getElementById("skillContainer");
const skillTabs = document.getElementById("skillTabs");

const categoryContainer = document.getElementById("categoryContainer");
const categoryTabs = document.getElementById("categoryTabs");

const skillCurrentBlock = skillsTemp.content.querySelector("#skillCurrentBlock");
const skillAcquiredBlock = skillsTemp.content.querySelector("#skillAcquiredBlock");
const skillArchivedBlock = skillsTemp.content.querySelector("#skillArchivedBlock");

const skillsChildrenCategoriesRef = schoolDbRef.child('/children_categories');
const skillsChildrenMeetingsRef = schoolDbRef.child('/children_meetings');
const skillsChildrenSkillsRef = schoolDbRef.child('/children_skills');

let first = true;
let firstArchived = true;
let charts = {};
const chartColors = [
	'rgba(178,31,53,0.8)',
	'rgba(255,116,53,0.8)',
	'rgba(255,203,53,0.8)',
	'rgba(0,117,58,0.8)',
	'rgba(22,221,53,0.8)',
	'rgba(0,121,231,0.8)',
	'rgba(104,30,126,0.8)',
	'rgba(189,122,246,0.8)',
	'rgba(216,39,53,0.8)',
	'rgba(255,161,53,0.8)',
	'rgba(255,249,53,0.8)',
	'rgba(0,158,71,0.8)',
	'rgba(0,82,165,0.8)',
	'rgba(0,169,252,0.8)',
	'rgba(125,60,181,0.8)'
];
let skillData = {};
const baseNumber = 4;

// When a category is added
skillsChildrenCategoriesRef.child(studentId).on('child_added',categorySnap=>{
	onCategoryAdd(categorySnap.key,categorySnap.val().name,categorySnap.val().archived);
})

// When a category is changed
skillsChildrenCategoriesRef.child(studentId).on('child_changed',categorySnap=>{
	removeCategory(categorySnap.key);
	onCategoryAdd(categorySnap.key,categorySnap.val().name,categorySnap.val().archived);
})

// When a category is removed
skillsChildrenCategoriesRef.child(studentId).on('child_removed',categorySnap=>{
	removeCategory(categorySnap.key);
})

// When a category is added
function onCategoryAdd(id,name,archived){
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
	// When a skill is added
	skillsChildrenCategoriesRef.child(studentId).child(id).child("skills")
	.on('child_added',skillSnap=>{
		onSkillAdded(category,id,skillSnap,archived);
	});
	// When a skill is changed
	skillsChildrenCategoriesRef.child(studentId).child(id).child("skills")
	.on('child_changed',skillSnap=>{
		onSkillChanged(category,id,skillSnap,archived);
	});
	// When a skill is removed
	skillsChildrenCategoriesRef.child(studentId).child(id).child("skills")
	.on('child_removed',skillSnap=>{
		onSkillRemoved(category,id,skillSnap);
	});
}

// Creates a category
function createCategory(name,id,first){
	const category = document.importNode(skillSection, true);
	const categoryTab = document.importNode(skillTabBtn, true);

	categoryTab.querySelector("#tabId").setAttribute("href", "#"+id);
	categoryTab.querySelector("#tabId").innerText = name;

	categoryTab.setAttribute("data-id",id);

	if(first){
		categoryTab.querySelector("#tabId").classList.add("active","show");
		category.classList.add("active","show");
	}

	category.id = id;
	category.setAttribute("data-id",id);
	setCardAttributes(category,"collapseCurrent","collapseCurrent"+id,"headingCurrent","headingCurrent"+id);
	setCardAttributes(category,"collapseAcquired","collapseAcquired"+id,"headingAcquired","headingAcquired"+id);
	setCardAttributes(category,"collapseArchived","collapseArchived"+id,"headingArchived","headingArchived"+id);

	const categoryDataTab = category.querySelector("#skillDataTab");
	const categoryChartTab = category.querySelector("#skillChartTab");
	const categoryData = category.querySelector("#skillData");
	const categoryChart = category.querySelector("#skillChart");

	categoryDataTab.querySelector("#tabId").setAttribute("href", "#data"+id);
	categoryChartTab.querySelector("#tabId").setAttribute("href", "#chart"+id);
	categoryData.id = "data" + id;
	categoryChart.id = "chart" + id;

	categoryDataTab.querySelector("#tabId").classList.add("active","show");
	categoryData.classList.add("active","show");

	createChart(category);

	const optionNumInput = category.querySelector("#optionNumber");
	const optionBeginDateInput = category.querySelector("#optionBeginDate");
	const optionEndDateInput = category.querySelector("#optionEndDate");

	const checkboxCurrent = category.querySelector("#currentCheckbox");
	const checkboxAcquired = category.querySelector("#acquiredCheckbox");
	const checkboxArchived = category.querySelector("#archivedCheckbox");

	// Radio Number Click
	const radioNumber = category.querySelector("#radioNumber");
	radioNumber.setAttribute("name","option"+id);
	radioNumber.addEventListener('click',e => {
		$(category.querySelector("#optionNumGroup")).removeClass('optionDisabled');
		$(optionNumInput).removeAttr('disabled');
		$(category.querySelector("#optionDateGroup")).addClass('optionDisabled');
		$(optionBeginDateInput).attr('disabled',true);
		$(optionEndDateInput).attr('disabled',true);
	})

	// Radio Date Click
	const radioDate = category.querySelector("#radioDate");
	radioDate.setAttribute("name","option"+id);
	radioDate.addEventListener('click',e => {
		$(category.querySelector("#optionDateGroup")).removeClass('optionDisabled');
		$(optionBeginDateInput).removeAttr('disabled');
		$(optionEndDateInput).removeAttr('disabled');
		$(category.querySelector("#optionNumGroup")).addClass('optionDisabled');
		$(optionNumInput).attr('disabled',true);
	})

	// Apply Button Click
	const optionBtn = category.querySelector("#optionBtn");
	optionBtn.addEventListener('click', e => {
		if(radioDate.checked){
			if(optionBeginDateInput.checkValidity() && optionBeginDateInput.value.length > 0){
				const beginDate = optionBeginDateInput.value;
				const beginDateVal = new Date(beginDate).setHours(0,0,0,0);
				let endDateVal;
				if(optionEndDateInput.checkValidity() && optionEndDateInput.value.length > 0){
					const endDate = optionEndDateInput.value;
					endDateVal = new Date(endDate).setHours(23,59,59,999);
				}
				updateChartDataFromDate(id, beginDateVal, endDateVal);
			}
		}
		if(radioNumber.checked){
			if(optionNumInput.checkValidity() && optionNumInput.value > 0){
				const number = optionNumInput.value;
				updateChartData(id, number);
			}
		}
		const range = [];
		if(checkboxCurrent.checked){
			range.push('current');
		}
		if(checkboxAcquired.checked){
			range.push('acquired');
		}
		if(checkboxArchived.checked){
			range.push('archived');
		}
		showDatasetInRange(id,range);
	})

	// Reset Button Click
	const resetBtn = category.querySelector("#resetBtn");
	resetBtn.addEventListener('click', e => {
		$(radioNumber).attr("checked",true).click();
		optionNumInput.value = baseNumber;
		showDatasetInRange(id, ['current']);
		checkboxCurrent.checked = true;
		checkboxAcquired.checked = false;
		checkboxArchived.checked = false;
		updateChartData(id, baseNumber);
	})

	$(resetBtn).click();
	const archivedCategories = skillContainer.querySelector("#archivedCategories");
	const archivedCategoriesTab = skillTabs.querySelector("#archivedCategoriesTab");
	skillTabs.insertBefore(categoryTab,archivedCategoriesTab);
	skillContainer.insertBefore(category,archivedCategories);
	return category;
}

// Creates a archived category
function createCategoryArchived(name,id,first){
	const category = document.importNode(categoryArchivedSection, true);
	const categoryTab = document.importNode(skillTabBtn, true);

	categoryTab.querySelector("#tabId").setAttribute("href", "#"+id);
	categoryTab.querySelector("#tabId").innerText = name;

	if(first){
		categoryTab.querySelector("#tabId").classList.add("active","show");
		category.classList.add("active","show");
	}

	categoryTab.setAttribute("data-id",id);

	category.id = id;
	category.setAttribute("data-id",id);
	setCardAttributes(category,"collapseCurrent","collapseCurrent"+id,"headingCurrent","headingCurrent"+id);
	setCardAttributes(category,"collapseAcquired","collapseAcquired"+id,"headingAcquired","headingAcquired"+id);
	setCardAttributes(category,"collapseArchived","collapseArchived"+id,"headingArchived","headingArchived"+id);

	const archivedCategoriesTab = skillTabs.querySelector("#archivedCategoriesTab");
	$(archivedCategoriesTab).removeClass('hidden');

	categoryTabs.appendChild(categoryTab);
	categoryContainer.appendChild(category);
	return category;
}

// Removes a category
function removeCategory(categoryId){
	skillsChildrenCategoriesRef.child(studentId).child(categoryId).child("skills").off('child_added')
	skillsChildrenCategoriesRef.child(studentId).child(categoryId).child("skills").off('child_changed')
	skillsChildrenCategoriesRef.child(studentId).child(categoryId).child("skills").off('child_removed')
	const categoryArchived = categoryContainer.querySelector("[data-id='" + categoryId + "']")
	const categoryTabArchived = categoryTabs.querySelector("[data-id='" + categoryId + "']")
	if(categoryArchived){
		categoryContainer.removeChild(categoryArchived);
	}
	if(categoryTabArchived){
		categoryTabs.removeChild(categoryTabArchived);
	}
	const category = skillContainer.querySelector("[data-id='" + categoryId + "']")
	const categoryTab = skillTabs.querySelector("[data-id='" + categoryId + "']")
	if(category){
		skillContainer.removeChild(category);
	}
	if(categoryTab){
		skillTabs.removeChild(categoryTab);
	}
	if(skillTabs.firstElementChild){
		$(skillTabs.firstElementChild.querySelector("#tabId")).tab('show');
	}else{
		first = true;
	}
	if(!categoryTabs.firstElementChild){
		const archivedCategoriesTab = skillTabs.querySelector("#archivedCategoriesTab");
		$(archivedCategoriesTab).addClass('hidden');
		firstArchived = true;
	}else{
		$(categoryTabs.firstElementChild.querySelector("#tabId")).tab('show');
	}
}

// When a skill is added
function onSkillAdded(category,categoryId,skillSnap,categoryArchived){
	if(skillSnap.val().acquired){
		if(!categoryArchived){
			addSkillToChart(categoryId,skillSnap.key,skillSnap.val().name,true);
		}
		addSkillAction(category,categoryId,skillSnap.val().name,skillSnap.key,"acquired",categoryArchived);
	}else if(skillSnap.val().archived){
		if(!categoryArchived){
			addSkillToChart(categoryId,skillSnap.key,skillSnap.val().name,true);
		}
		addSkillAction(category,categoryId,skillSnap.val().name,skillSnap.key,"archived",categoryArchived);
	}else{
		if(!categoryArchived){
			addSkillToChart(categoryId,skillSnap.key,skillSnap.val().name,false);
		}
		const skill = addSkill(category,skillSnap.val().name,skillSnap.key,categoryArchived);
		// if(!categoryArchived){
			let value = -1;
			// Update value on any change
			skillsChildrenSkillsRef.child(studentId).child(categoryId).child(skillSnap.key)
			.on('value',snap => {
				if(snap.val()){
					if(snap.val().latest && snap.child(snap.val().latest).val()){
						value = snap.child(snap.val().latest).val().value;
					}
					updateSkillValue(skill,value);
					if(!categoryArchived){
						// store skill data
						Object.keys(snap.val()).forEach(meetingId => {
							if(meetingId !== "latest"){
								skillsChildrenMeetingsRef.child(studentId).child(meetingId)
								.once('value',meetingSnap => {
									if(meetingSnap.val()){
										addSkillData(categoryId, skillSnap.key, "current" , meetingSnap.key, 
											snap.child(meetingId).val().value, meetingSnap.val().date);
									}
								})
							}
						})
						// create a chart with the skill data
						const data = getSkillData(categoryId,skillSnap.key,baseNumber);
						const optionInput = category.querySelector("#optionNumber");
						optionInput.value = baseNumber;
						updateChartSkillData(categoryId,skillSnap.key,data)
					}
				}
			})
		// }
	}
}

// When a skill is changed
function onSkillChanged(category,categoryId,skillSnap,categoryArchived){
	removeSkill(category,categoryId,skillSnap.key);
	onSkillAdded(category,categoryId,skillSnap,categoryArchived);
}

// When a skill is removed
function onSkillRemoved(category,categoryId,skillSnap){
	removeSkill(category,categoryId,skillSnap.key);
	$(category.querySelector("#resetBtn")).click();
}

// Add a current skill to category
function addSkill(category,name,id,categoryArchived){
	const skill = document.importNode(skillCurrentBlock, true);
	skill.querySelector("#skillName").innerText = name;
	// if(!categoryArchived){
		skill.querySelector("#skillName").innerText += " :"
	// }

	skill.id = id;

	if(categoryArchived){
		// $(skill.querySelector("#skillsCheckbox")).addClass('hidden');
	}

	category.querySelector("#tabContentCurrent").appendChild(skill);
	return skill;
}

// Add a archived or acquired skill to category
function addSkillAction(category,categoryId,name,id,action,categoryArchived){
	let skill;
	if(action === "acquired"){
		skill = document.importNode(skillAcquiredBlock, true);
	}else if(action === "archived"){
		skill = document.importNode(skillArchivedBlock, true);
	}
	skill.querySelector("#skillName").innerText = name;
	skill.id = id;

	if(action === "acquired"){
		category.querySelector("#tabContentAcquired").appendChild(skill);
	}else if(action === "archived"){
		category.querySelector("#tabContentArchived").appendChild(skill);
	}

	if(!categoryArchived){
		skillsChildrenSkillsRef.child(studentId).child(categoryId).child(id)
		.on('value',snap => {
			if(snap.val()){
				// store skill data
				Object.keys(snap.val()).forEach(meetingId => {
					if(meetingId !== "latest"){
						skillsChildrenMeetingsRef.child(studentId).child(meetingId)
						.once('value',meetingSnap => {
							if(meetingSnap.val()){
								addSkillData(categoryId, id, action , meetingSnap.key, 
									snap.child(meetingId).val().value, meetingSnap.val().date);
							}
						})
					}
				})
				// create a chart with the skill data
				const data = getSkillData(categoryId,id,baseNumber);
				const optionInput = category.querySelector("#optionNumber");
				optionInput.value = baseNumber;
				updateChartSkillData(categoryId,id,data)
			}
		})
	}
	return skill;
}

// Removes a skill from a category
function removeSkill(category,categoryId,skillId){
	category.querySelectorAll("#"+skillId).forEach(skill=>{
		skill.parentNode.removeChild(skill);
	});
	skillsChildrenSkillsRef.child(studentId).child(categoryId).child(skillId).off();
	removeSkillFromChart(categoryId,skillId);
}

// Update a skill value
function updateSkillValue(skill,value){
	const green = skill.querySelector("#checkbox_green");
	const orange = skill.querySelector("#checkbox_orange");
	const red = skill.querySelector("#checkbox_red");

	green.removeAttribute("checked");
	orange.removeAttribute("checked");
	red.removeAttribute("checked");

	if (value === 3){
		green.setAttribute("checked", "");
	}
	if (value === 2){
		orange.setAttribute("checked", "");
	}
	if (value === 1){
		red.setAttribute("checked", "");
	}
}

// Add value and date to the skillData
function addSkillData(categoryId, skillId, type, meetingId, value, date){
	if(!skillData[categoryId]){
		skillData[categoryId] = {};
	}
	if(!skillData[categoryId][skillId]){
		skillData[categoryId][skillId] = {
			type: type,
			meetings: {}
		};
	}
	skillData[categoryId][skillId].meetings[meetingId] = {
		value: value,
		date: date
	};
}

// Remove value and date to the skillData
function removeSkillData(categoryId, skillId, meetingId){
	delete skillData[categoryId][skillId].meetings[meetingId];
}

// Get the first \number\ sorted skillData
function getSkillData(categoryId, skillId, number){
	const data = [];
	const sortedData = sortSkillData(categoryId, skillId, true);
	for (let i = 0; i < sortedData.length && i < number; i++) {
		const d = sortedData[i];
		data.push({
			x: new Date(d[1]),
			y: d[0]
		})
	}
	return data;
}

// Get the sorted skillData between \beginDate\ and \endDate\
function getSkillDataFromDate(categoryId, skillId, beginDate, endDate){
	endDate = endDate || Date.now();
	const data = [];
	const sortedData = sortSkillData(categoryId, skillId, true);
	for (let i = 0; i < sortedData.length; i++) {
		const d = sortedData[i];
		if( d[1] > beginDate && d[1] < endDate ){
			data.push({
				x: new Date(d[1]),
				y: d[0]
			})
		}
	}
	return data;
}

// Sort the skillData in ascending or descending order
function sortSkillData(categoryId, skillId, asc){
	const sortedData = [];
	Object.keys(skillData[categoryId][skillId].meetings).forEach(meetingId => {
		sortedData.push([
			skillData[categoryId][skillId].meetings[meetingId].value, 
			skillData[categoryId][skillId].meetings[meetingId].date
		]);
	})
	sortedData.sort(function(a, b) {
		if(asc){
			return b[1] - a[1];
		}else{
			return a[1] - b[1];
		}
	});
	return sortedData;
}

// Create a new chart
function createChart(category){
	const ctx = $(category.querySelector("#chart"));
	const data = {
		datasets: []
	}
	const options = {
		responsive: true,
		elements:{
			line:{
				tension: 0.2
			}
		},
		scales: {
			xAxes: [{
				id: "x-axes-" + category.id,
				type: 'time',
				time: {
					tooltipFormat: "ll h:mm:ss a"
				}
			}],
			yAxes: [{
				id: "y-axes-" + category.id,
				ticks: {
					beginAtZero: true,
					max: 4,
					stepSize: 1,
					userCallback: function(label) {
						if (label === 1 || label === 2 || label === 3) {
							return label;
						}
   
					}
				}
			}]
		}
	};
	const chart = new Chart(ctx, {
		type: 'line',
		data: data,
		options: options
	});
	const colors = [];
	for (let i = 0; i < chartColors.length; i++) {
		const color = chartColors[i];
		colors.push({
			color: color,
			taken: false
		})
		
	}
	charts[category.id] = {
		chart: chart,
		colors: colors
	};
}

// Returns a color that was not taken
function getFreeColor(categoryId,skillId){
	const colors = charts[categoryId].colors;
	for (let i = 0; i < colors.length; i++) {
		const c = colors[i];
		if(!c.taken){
			c.taken = true;
			c.id = skillId;
			return c.color;
		}
	}
	return null;
}

// Create skill dataset to the category chart
function addSkillToChart(categoryId,skillId,skillName,hidden){
	const chart = charts[categoryId].chart;
	const color = getFreeColor(categoryId,skillId);
	const dataset = createChartDataset(skillId,skillName,color,hidden);
	chart.data.datasets.push(dataset);
	chart.update();
}

// Update the skill dataset to the category chart
function updateChartSkillData(categoryId,skillId,data){
	const chart = charts[categoryId].chart;
	chart.data.datasets.forEach(dataset => {
		if(dataset.id === skillId){
			dataset.data = data;
		}
	})
	chart.update();
}

// Update the category chart
function updateChartData(categoryId,number){
	if(skillData[categoryId]){
		Object.keys(skillData[categoryId]).forEach(skillId => {
			const data = getSkillData(categoryId,skillId,number);
			updateChartSkillData(categoryId,skillId,data);
		})
	}
}

// Update the category chart from date
function updateChartDataFromDate(categoryId,beginDate,endDate){
	endDate = endDate || Date.now()
	Object.keys(skillData[categoryId]).forEach(skillId => {
		const data = getSkillDataFromDate(categoryId,skillId,beginDate,endDate);
		updateChartSkillData(categoryId,skillId,data);
	})
}

// Create a chart dataset
function createChartDataset(id,name,color,hidden){
	const dataset = {
		label: name,
		id: id,
		data: [],
		hidden: hidden,
		fill: false,
		borderColor: color
	}
	return dataset;
}

function showDatasetInRange(categoryId,range){
	const chart = charts[categoryId].chart;
	chart.data.datasets.forEach(dataset => {
		const skillId = dataset.id;
		const i = chart.data.datasets.indexOf(dataset);
		if(range.includes(skillData[categoryId][skillId].type)){
			chart.getDatasetMeta(i).hidden = false;
		}else{
			chart.getDatasetMeta(i).hidden = true;
		}
	})
	chart.update();
}

// Removes a dataset from the chart
function removeChartDataset(chart,datasetId){
	chart.data.datasets.forEach((dataset) => {
		if(dataset.id === datasetId){
			const removalIndex = chart.data.datasets.indexOf(dataset);
        	chart.data.datasets.splice(removalIndex, 1);
		}
    });
}

// Reset the chart dataset
function resetChartDataset(chart,datasetId){
	chart.data.datasets.forEach((dataset) => {
		if(dataset.id === datasetId){
			dataset.data.pop();
		}
    });
}

// Reset the category chart
function resetChart(chart){
	chart.data.labels.pop();
    chart.data.datasets.forEach((dataset) => {
        dataset.data.pop();
    });
    chart.update();
}

// Remove a skill from the chart
function removeSkillFromChart(categoryId,skillId){
	const chart = charts[categoryId].chart;
	delete skillData[categoryId][skillId];
	const colors = charts[categoryId].colors;
	for (let i = 0; i < colors.length; i++) {
		const c = colors[i];
		if(c.id === skillId){
			c.taken = false;
			c.id = null;
		}
	}
	removeChartDataset(chart,skillId)
}