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

// schoolId verification
if(!schoolId){
    window.location.replace("../connection/connection.html");
}
// End schoolId verification
/*
    END VERIFICATION
*/

const linkUsers = document.getElementById("linkInscriptionUsers");
linkUsers.setAttribute("href", "../inscription/inscriptionUsers.html?schoolId=" + schoolId);
const linkChild = document.getElementById("linkInscriptionChild");
linkChild.setAttribute("href", "../inscription/inscriptionChild.html?schoolId=" + schoolId);
const linkSchoolConfig = document.getElementById("schoolConfig");
linkSchoolConfig.setAttribute("href", "../school/school.html?schoolId=" + schoolId);

// Database references
const childrenRef = schoolDbRef.child('/children');
const usersRef = schoolDbRef.child('/users');
const relationshipsRef = schoolDbRef.child('/relationships');

// Template references
const temp = document.getElementById("relationsTemplate");
const usersList = temp.content.querySelector("#userTemplate");
const childrenList = temp.content.querySelector("#childrenTemplate");
const associateChildList = temp.content.querySelector('#associateChildTemplate')

// DOM references
const usersListContent = document.getElementById('usersList');
const childrenListContent = document.getElementById('childrenList');
const associateChildContent = document.getElementById("associateChildList")

const modalUser = document.getElementById("userDelModal");
const validUserBtn = modalUser.querySelector("#validButton");

const modalChild = document.getElementById("childDelModal");
const validChildBtn = modalChild.querySelector("#validButton");

const buttonAssociation = document.getElementById('btnAssociation');
buttonAssociation.addEventListener('click', onClick);

let associateChildContentInput = associateChildContent.getElementsByTagName('input');

const today = Date.now();

// Prints the name of the school
baseDbRef.child('schools/' + schoolId + '/infos').once('value').then(function (snapSchool) {
    document.querySelector("#schoolName").innerText = ' ' + snapSchool.val().name;
})

// Creates new users
usersRef.on('child_added', snap => {
    schoolDbRef.child('/roles/' + snap.val().role).once('value').then(function (snapshot) {
        let role = snapshot.val().role_name;
        let div = document.importNode(usersList, true);
        let idValue = today + snap.key;

        div.id = snap.key;
        div.setAttribute("data-id",snap.key);
        div.querySelector("#userLink").innerText = snap.val().name + " " + snap.val().surname + " ( " + role + " ) "; //Surname and Name of the user

        setCardAttributes(div, "userCard", idValue, "userHeader", "header" + idValue);

        div.querySelector("#userDel").addEventListener('click', e=>{
            modalUser.querySelector("#body span").id = snap.key;
            $(modalUser).modal('show');
        })

        div.querySelector("#userEmail").innerText = snap.val().email;
        // On Association Button Click
        const btn = div.querySelector("#buttonModal");
        btn.addEventListener('click', e => {
            buttonAssociation.id = snap.key;
            relationshipsRef.child(snap.key).once('value', relationSnap => {
                if (relationSnap.val() !== null) {
                    Object.keys(relationSnap.val()).forEach(item => {
                        childrenRef.child(item).once('value', childSnap => {
                            associateChildContentInput[item].checked = true;
                        })
                    })
                }
                Object.keys(childReferent).forEach(child=>{
                    if(snap.val().role === "referent" && childReferent[child] && childReferent[child] !== snap.key){
                        associateChildContentInput[child].disabled = true;
                    }
                })
                $("#relationModal").modal("show");
            })
        })
        // End Association Button Click

        usersListContent.appendChild(div);

        let ul = div.querySelector("#listRelation");
        relationshipsRef.on('child_added', relSnap => {
            if(relSnap.key === snap.key){
                modifyListRelation(relSnap,ul);
            }
        });
        relationshipsRef.on('child_changed', relSnap => {
            if(relSnap.key === snap.key){
                modifyListRelation(relSnap,ul);
            }
        })
        relationshipsRef.on('child_removed', relSnap => {
            if(relSnap.key === snap.key){
                $(ul).empty();
            }
        })
    })

});

// Removes a deleted user
usersRef.on('child_removed',snap=>{
    let usr = usersListContent.querySelector("[data-id=\""+snap.key+"\"]");
    usersListContent.removeChild(usr);
})

validUserBtn.addEventListener('click',e=>{
    const id = modalUser.querySelector("#body span").id;
	cfDeleteUser({userId:id})
	.then(()=>{

    })
	.catch(err=>{

    })
})

validChildBtn.addEventListener('click',e=>{
    const id = modalChild.querySelector("#body span").id;
    childrenRef.child(id).ref.remove()
    .then(() => {

    })
    .catch(() => {

    })
})

function modifyListRelation(snap,ul) {
    if (snap.val() !== null) {
        $(ul).empty();
        Object.keys(snap.val()).forEach(item => {
            childrenRef.child(item).once('value', childSnap => {
                let li = document.createElement('li')
                li.innerText = childSnap.val().name + " " + childSnap.val().surname;
                ul.appendChild(li);
            })
        })
    }
}

// ChildReferent controls which child has a referent and who is it for no duplicata
let childReferent = {};

function addChildReferent(childId,userId){
    childReferent[childId] = userId;
}
function removeChildReferent(childId,userId){
    childReferent[childId] = null;
}
function isChildReferent(childId,userId){
    return childReferent[childId] === userId;
}

// UserRoles contains the role of every user for the application to go faster
let userRoles = {};

function addUserRoles(role){
    userRoles[role.userId] = role;
}
function removeUserRoles(){
    userRoles[role.userId] = null;
}

// Function called when a child's relationships are updated
function modifyChildRelations(snap,childId,div,remove){
    const link = div.querySelector("#referentLink");
    let parentList = div.querySelector("#parentList");
    let role = userRoles[snap.key];
    if (role.val.role === "referent") {
        if(snap.child(childId).val()){
            if(remove){
                link.innerText = "";
                removeChildReferent(childId,snap.key);
            }else{
                link.setAttribute("title", role.val.email); //set the mail for the referent's tooltip
                link.innerText = role.val.name + " " + role.val.surname; //Surname and Name of the referent
                $(link).tooltip();
                addChildReferent(childId,snap.key);
            }
        }else{
            if(isChildReferent(childId,snap.key)){
                link.innerText = "";
                removeChildReferent(childId,snap.key);
            }
        }
    }
    if (role.val.role === "parent") {
        let parentLi = parentList.querySelector("[data-id=\""+snap.key+"\"]");
        if(snap.child(childId).val()){
            if(!parentLi){
                let li = document.createElement('li');
                li.setAttribute("data-id",snap.key);
                li.innerText +=  role.val.name + " " + role.val.surname; //Surname and Name of the parent
                parentList.appendChild(li);
            }else{
                if(remove){
                    parentList.removeChild(parentLi);
                }
            }
        }else{
            if(parentLi){
                parentList.removeChild(parentLi);
            }
        }
    }
}

usersRef.once('value',snap=>{
    snap.forEach(usrSnap=>{
        let roleObj = {userId : usrSnap.key, val : usrSnap.val()}
        addUserRoles(roleObj);
    })
    childrenRef.on('child_added', snap => {
        const divModal = document.importNode(associateChildList, true);
    
        divModal.querySelector("#associateInput").id = snap.key;
        divModal.querySelector("#associateLabel").setAttribute("for",snap.key);
        divModal.querySelector("#associateLabel").innerText = snap.val().name + " " + snap.val().surname;
    
        const idValue = today + snap.key;
    
        const div = document.importNode(childrenList, true);
    
        div.id = snap.key;
        div.setAttribute("data-id",snap.key);
        div.querySelector("#childLink").innerText = snap.val().name + " " + snap.val().surname; //Surname and Name of the student
        div.querySelector("#childProfile").setAttribute("href", "../index/index.html?schoolId=" + schoolId + "&studentId=" + snap.key);
    
        setCardAttributes(div, "childCard", idValue, "childCardHeader", "header" + idValue);
    
        const idChild = snap.key;

        div.querySelector("#childDel").addEventListener('click', e=>{
            modalChild.querySelector("#body span").id = snap.key;
            $(modalChild).modal('show');
        })
        
        relationshipsRef.on('child_added', relSnap => {
            modifyChildRelations(relSnap,idChild,div);
        })
        relationshipsRef.on('child_changed', relSnap => {
            modifyChildRelations(relSnap,idChild,div);
        })
        relationshipsRef.on('child_removed', relSnap => {
            modifyChildRelations(relSnap,idChild,div,true);
        })
    
        associateChildContent.appendChild(divModal);
        childrenListContent.appendChild(div);
    });
    childrenRef.on('child_removed', snap => {
        const child = childrenListContent.querySelector("[data-id='" + snap.key + "']");
        childrenListContent.removeChild(child);
    });
})

// On Association Modal Button Click
function onClick() {
    let idAssociateChild = null;
    let userId = buttonAssociation.id;

    for (var i = 0, lenAssociation = associateChildContentInput.length; i < lenAssociation; i++) {
        idAssociateChild = associateChildContentInput[i].id;
        if (associateChildContentInput[i].checked) {
            relationshipsRef.child(userId).child(idAssociateChild).set(true);
        } else {
            relationshipsRef.child(userId).child(idAssociateChild).remove();
        }
    }
    buttonAssociation.setAttribute("data-dismiss", "modal")
}

// Empty Modal when modal closed
$("#relationModal").on('hidden.bs.modal', e => {
    for (var i = 0, lenAssociation = associateChildContentInput.length; i < lenAssociation; i++) {
        if (associateChildContentInput[i].checked) {
            associateChildContentInput[i].checked = false;
        }
        associateChildContentInput[i].disabled = false;
    }
})

// Controls the search bar for users
document.getElementById('searchUser').addEventListener('keyup', function (e) {
    var search = this.value.toLowerCase();
    var cards = document.querySelectorAll('#usersList div.card');

    //  console.log("Search : %s", search); // display the searching result in console

    Array.prototype.forEach.call(cards, function (doc) {
        // For all items, compare with searching terms
        const name = doc.querySelector("a.card-linkUser").innerText;
        if (name.toLowerCase().indexOf(search) > -1) {
            // if it does match with the searching terms, display the item
            $(doc).removeClass('hidden');
        } else {
            // if it doesn't match with the searching terms, hide the item
            $(doc).addClass('hidden');
        }
    });
});

// Controls the search bar for children
document.getElementById('searchChild').addEventListener('keyup', function (e) {
    var search = this.value.toLowerCase();
    var cards = document.querySelectorAll('#childrenList div.card');

    //  console.log("Search : %s", search); // display the searching result in console

    Array.prototype.forEach.call(cards, function (doc) {
        // For all items, compare with searching terms
        const name = doc.querySelector("a.card-linkChild").innerText;
        if (name.toLowerCase().indexOf(search) > -1) {
            // if it does match with the searching terms, display the item
            $(doc).removeClass('hidden');
        } else {
            // if it doesn't match with the searching terms, hide the item
            $(doc).addClass('hidden');
        }
    });
});
