/*
    VERIFICATIONS
*/
// Firebase Authentication verification
firebase.auth().onAuthStateChanged(userAuth => {
    if (userAuth) {
        const id = userAuth.uid;
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
                if(role.name === "unknown"){
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

const childRef = schoolDbRef.child('/children/' + studentId);

const imgSpinner = document.getElementById("imageSpinner");
const childImage = document.getElementById("childImage");
childImage.onload = () => {
    $(imgSpinner).addClass('hidden');
    $(childImage).removeClass('hidden');
}

// Writes the name, age, class and image of the child
childRef.on('value', function(childSnap) {
    if(childSnap.val()){
        // Child is added or changed
        document.getElementById("fullName").innerText = childSnap.val().name + ' ' + childSnap.val().surname;
        document.getElementById("name").innerText = childSnap.val().surname;
        document.getElementById("age").innerText = ageWithBirth(childSnap.val().date_of_birth);
        document.getElementById("class").innerText = childSnap.val().class + 'e';
        if(childSnap.val().img_url){
            $("#imageProgressBarContainer").addClass('hidden');
            childImage.setAttribute("src",childSnap.val().img_url);
        }else{
            childImage.setAttribute("src","../common/images/child_generic.png");
        }
    }else{
        // Child is removed
        getUserRole(firebase.auth().currentUser.uid)
        .then(role => {
            if (role.name === "superadmin"){
                return window.location.replace("../superAdmin/superAdmin.html");
            }
            if (role.name === "admin"){
                return window.location.replace("../admin/admin.html?schoolId=" + role.school);
            }
            if (role.name === "user"){
                return window.location.replace("../studentList/studentList.html?schoolId="+role.school);
            }
            return window.location.replace("../connection/connection.html");
        })
    }
})

/*
    Returns the age of a person with his date of birth
*/
function ageWithBirth(dateOfBirth){
    let birthday = new Date(dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - birthday.getFullYear();
    // Reset birthday to the current year.
    birthday.setFullYear(today.getFullYear());
    // If the user's birthday has not occurred yet this year, subtract 1.
    if (today < birthday) {
        age--;
    }
    return age;
}

/* Profile informations change */
const childrenProfileRef = schoolDbRef.child('/children_profile/'+studentId+'/infos/');

const tempProfile = document.getElementById("profileTemplate");
const fields = tempProfile.content.querySelector("#fields");
const liEdition = tempProfile.content.querySelector("#liEdition");

const fieldsContent = document.getElementById('childInfo');
const profileImageGroup = document.getElementById("profileImage");
const inputFile = document.getElementById("profileImageFile");
const profileDefaultImg = document.getElementById("profileDefaultImg");

const saveConfigModal = document.getElementById("saveConfigModal");

const btnEdition = document.getElementById("btnEdition");
btnEdition.addEventListener('click', onClick);

const btnCancel = document.getElementById("btnCancel");
btnCancel.addEventListener('click', onClick);

const btnAdd = document.getElementById("btnAdd");
$(btnAdd).tooltip({ trigger: 'hover' })
btnAdd.addEventListener('click', onClickAdd);

const btnSave = document.getElementById("btnSave");
btnSave.addEventListener('click',e=>{
    if(profileDefaultImg.checked){
        $(saveConfigModal).modal('show')
    }else{
        onClickSave();
    }
});
saveConfigModal.querySelector("#validButton").addEventListener('click',e=>{
    onClickSave();
})

// Edition mode or not
let edition = false;
// Saves the local changes of the profile
let updates = {};
// Saves the profile before edition
// Used when cancel edition
let beforeEdition = {};

// Create informations from children_profile
childrenProfileRef.on('child_added', snap => {
    profileCreateCategory(snap.key,snap.val().name,snap.val().items,false);
})

/*
    Create information for the profile
    Returns the DOM element created
*/
function profileCreateCategory(id,name,items,edition){
    const div = document.importNode(fields, true);
    div.id = id;

    const title = div.querySelector('#title');
    const titleSpan = title.querySelector("#spanTitle");
    const titleInput = title.querySelector("#inputTitle");
    const titleGroup = title.querySelector("#edition");
    titleSpan.innerText = name;
    titleInput.value = name;
    if(edition){
        titleGroup.classList.remove('hidden')
    }else{
        titleSpan.classList.remove('hidden')
    }

    const ul = div.querySelector("#profileList");

    const btnAddElements = div.querySelector("#addElement")
    btnAddElements.addEventListener('click',e=>{
        onClickAddElement(ul,id);
    })
    if(edition){
        btnAddElements.classList.remove("hidden");
    }
    const btnDelTitle = div.querySelector("#delTitle");
    btnDelTitle.addEventListener('click',e=>{
        div.classList.add("hidden");
        changeUpdates(updates, id, "deleted", true);
    })

    if(items){
        Object.keys(items).forEach(item=>{
            addLiElement(ul,id,items[item].name,item,edition);
        })
    }

    fieldsContent.appendChild(div)
    $("[data-tooltip='tooltip']").tooltip({ trigger: "hover" });
    return div;
}

/*
    Add liEdition template to parent
*/
function addLiElement(parent,parentId,name,id,edition){
    const liElements = document.importNode(liEdition, true);

    liElements.id = id;

    const liSpan = liElements.querySelector("#spanLi");
    const liInput = liElements.querySelector("#inputLi");
    const liGroup = liElements.querySelector("#edition");
    const btnDelItem = liElements.querySelector("#delItem");

    liSpan.innerText = name;
    liInput.value = name;

    if(edition){
        liGroup.classList.remove('hidden');
    }else{
        liSpan.classList.remove('hidden');
    }
    
    btnDelItem.addEventListener('click',e=>{
        liElements.classList.add("hidden");
        changeElementUpdates(updates, parentId, id, "deleted", true);
    })

    parent.appendChild(liElements);
    $("[data-tooltip='tooltip']").tooltip({ trigger: "hover" });
    return liElements;
}

// Prints profile from obj
function printProfile(obj,edition){
    if(edition){
        document.querySelector('#btnModification').classList.remove('hidden')
        profileImageGroup.classList.remove("hidden");
    }else{
        document.querySelector('#btnModification').classList.add('hidden')
        profileImageGroup.classList.add("hidden");
        resetImage();
    }

    // If edition mode was on, save the changes on non edition mode
    if(edition){
        saveObject(obj,false);
    }

    regenerateProfile(obj,edition);
}

// reset the information lists with profile given
function regenerateProfile(profile,edition){
    fieldsContent.innerHTML = "";
    Object.keys(profile).forEach(cat=>{
        profileCreateCategory(cat,profile[cat].name,profile[cat].items,edition);
    })
}

// Save current profile in obj
function saveObject(obj,edition){
    const divChildInfo = document.querySelector("#childInfo")

    divChildInfo.querySelectorAll("div").forEach(div =>{
        const title = div.querySelector("#title");
        // If element is hidden, it will not count
        if(title && !div.classList.contains("hidden")){
            let name;
            if(edition){
                name = title.querySelector("#inputTitle").value;
            }else{
                name = title.querySelector("#spanTitle").innerText;
            }
            if(name){
                changeUpdates(obj, div.id, "name", name);
                const ul = div.querySelector("#profileList")
                ul.querySelectorAll("li").forEach(li => {
                    // If element is hidden, it will not count
                    if(!li.classList.contains("hidden")){
                        let name;
                        if(edition){
                            name = li.querySelector("#inputLi").value;
                        }else{
                            name = li.querySelector("#spanLi").innerText;
                        }
                        if(name){
                            changeElementUpdates(obj, div.id, li.id, "name", name);
                        }
                    }
                })
            }
        }
    })
}

// Add key value to obj[id]
function changeUpdates(obj,id,key,value){
    if(!obj[id]){
        obj[id] = {
            items : {}
        };
    }
    obj[id][key] = value;
}

// Add key value to item elementId in obj[id]
function changeElementUpdates(obj,id,elementId,key,value){
    if(!obj[id]){
        obj[id] = {
            items : {}
        };
    }
    if(!obj[id].items[elementId]){
        obj[id].items[elementId] = {};
    }
    obj[id].items[elementId][key] = value;
}

// Click on Edition Button and Cancel Button
function onClick() {
    edition = !edition;
    printProfile(beforeEdition,edition);
}

// Add liElement to ul Click
function onClickAddElement(ul,id){
    // current timestamp is used as local is for new element
    const timestamp = Date.now();
    addLiElement(ul,id,"",timestamp,true);
    changeElementUpdates(updates,id,timestamp,"created",true);
}

// Add category info to profile Click
function onClickAdd() {
    // current timestamp is used as local id for new category
    const timestamp = Date.now();
    profileCreateCategory(timestamp, "", {}, true);
    changeUpdates(updates,timestamp,"created",true);
}

// Update file name from input file
$(inputFile).on('change',function(){
    const fileName = $(this).val().split(/(\\|\/)/g).pop();
    $(this).next('.custom-file-label').html(fileName);
})

// resets Image input file
function resetImage(){
    inputFile.value = "";
    $(inputFile).next('.custom-file-label').html("Choisir l'image");
    profileDefaultImg.checked = false;
}

// Save the new image in Firebase Storage
function changeImage(){
    const progressBar = document.getElementById("imageProgressBar");

    if(profileDefaultImg.checked){
        schoolDbRef.child("children").child(studentId).child("img_url").ref.remove();
    }else{
        if(inputFile.files.length > 0){
            $("#imageProgressBarContainer").removeClass('hidden');
            
            const file = inputFile.files[0];
            const fileName = inputFile.value.split(/(\\|\/)/g).pop();
            const fileRef = '/schools/' + schoolId + '/profileImage/' + studentId + '/' + fileName;
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
                },
    
                function complete(){
                    progressBar.setAttribute("aria-valuenow","100");
                    progressBar.style.width = "100%";
                    progressBar.innerText = "UPLOAD COMPLETED";
                    $(imgSpinner).removeClass('hidden');
                    $(childImage).addClass('hidden');
                }
            )
        }
    }
}

// Save the changes to Firebase Database
function onClickSave(){
    changeImage();
    edition = false;
    let editionSave = {};
    saveObject(editionSave, true);
    const catUpdate = [];
    const itemUpdate = [];
    const editionUpdate = [];

    Object.keys(updates).forEach(cat=>{
        if(!(updates[cat].created && updates[cat].deleted)){
            if(updates[cat].created && editionSave[cat]){
                catUpdate.push({
                    id: cat,
                    action: "created"
                });
            }else if(updates[cat].deleted || (!editionSave[cat] && !updates[cat].created)){
                catUpdate.push({
                    id: cat,
                    action: "deleted"
                });
            }
            Object.keys(updates[cat].items).forEach(item=>{
                if(!(updates[cat].items[item].created && updates[cat].items[item].deleted)){
                    if(editionSave[cat] && updates[cat].items[item].created && editionSave[cat].items[item]){
                        itemUpdate.push({
                            id: item,
                            catId: cat,
                            action: "created"
                        })
                    }else if(!editionSave[cat] || updates[cat].items[item].deleted || (!editionSave[cat].items[item] && !updates[cat].items[item].created)){
                        itemUpdate.push({
                            id: item,
                            catId: cat,
                            action: "deleted"
                        })
                    }
                }
            })
        }
    })

    Object.keys(editionSave).forEach(edt=>{
        const its = [];
        Object.keys(editionSave[edt].items).forEach(edtIt=>{
            its.push({
                id: edtIt,
                name: editionSave[edt].items[edtIt].name
            })
        })
        editionUpdate.push({
            id: edt,
            name: editionSave[edt].name,
            items: its
        })
    })

    catUpdate.forEach(cat=>{
        // Firebase update
        if(cat.action === "created"){
            const newCat = childrenProfileRef.push();
            itemUpdate.forEach(item=>{
                if(item.catId === cat.id){
                    item.catId = newCat.key;
                }
            })
            editionUpdate.forEach(editionCat=>{
                if(editionCat.id === cat.id){
                    editionCat.id = newCat.key;
                }
            })
        }
        if(cat.action === "deleted"){
            editionUpdate.forEach(editionCat=>{
                if(editionCat.id === cat.id){
                    delete editionCat;
                }
            })
        }
    })
    itemUpdate.forEach(item=>{
        // Firebase update
        if(item.action === "created"){
            const newItem = childrenProfileRef.child(item.catId).child("items").push();
            editionUpdate.forEach(editionCat=>{
                editionCat.items.forEach(editionItem=>{
                    if(editionItem.id === item.id){
                        editionItem.id = newItem.key;
                    }
                })
            })
        }
        if(item.action === "deleted"){
            editionUpdate.forEach(editionCat=>{
                editionCat.items.forEach(editionItem=>{
                    if(editionItem.id === item.id){
                        delete editionItem;
                    }
                })
            })
        }
    })
    let editionFinal = {};
    editionUpdate.forEach(edt=>{
        changeUpdates(editionFinal, edt.id, "name", edt.name);
        edt.items.forEach(item=>{
            changeElementUpdates(editionFinal, edt.id, item.id, "name", item.name)
        })
    })
    childrenProfileRef.set(editionFinal);
    updates = {};
    printProfile(editionFinal,false);
}
