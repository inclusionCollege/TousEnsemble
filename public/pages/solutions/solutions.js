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
                  }                }
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

const solutionsInfos = document.getElementById("solutionsInfos");
setCardAttributes(solutionsInfos,"solutionsInfosContent","solutionsInfosContent","solutionsInfosHeader","solutionsInfosHeader");

const solutionsRef = schoolDbRef.child('/children_solutions/' + studentId);
const solutionsRefOrder = solutionsRef.orderByChild("date");
const usersSolutionsRef = schoolDbRef.child('/users');

const temp_sol = document.getElementById('solutionsTemplate');
const item_sol = temp_sol.content.querySelector("#solution");

const solutionsButton = document.getElementById('addSolutions');
const solutionsText = document.getElementById('solutionsInput');
const solutionsTitle = document.getElementById('solutionsInputTitle');
const solutionsContent = document.getElementById('solutionsContent');

// When a solution is added
solutionsRefOrder.on('child_added', snap => {
    const div = document.importNode(item_sol, true);
    const author = snap.val().author;

    div.querySelector("#solutionTitle").innerText = snap.val().title;
    div.querySelector("#solutionText").innerText = snap.val().text;
    const time = new Date(snap.val().date);
    div.querySelector("#solutionDate").innerText = time.toLocaleDateString("fr-FR");


    getUser(author)
    .then(role => {
        if(role.permissionDenied){
            div.querySelector("#solutionAuthor").innerText =role.val;
        }else{
            const promises = [];
            let roleName = "";
            if (role.name === "user") {
              promises.push(schoolDbRef.child('/roles/' + role.val.role).once('value',roleSnap=>{
                roleName = "(" + roleSnap.val().role_name + ")";
              }))
            }
            if (role.name === "admin") {
              roleName = "(Administrateur)";
            }
            if (role.name === "superadmin") {
              roleName = "(Super Administrateur)";
            }
            if (role.name === "unknown") {
                div.querySelector("#solutionAuthor").innerHTML = "<i>Utilisateur supprimé</i>";
            } else {
                Promise.all(promises)
                .then(()=>{
                div.querySelector("#solutionAuthor").innerText = role.val.name 
                    + " " + role.val.surname + " " + roleName;
                })
            }
        }
    })

    div.setAttribute("data-id",snap.key);

    solutionsContent.insertBefore(div, solutionsContent.firstChild);
});

// When a solution is removed
solutionsRefOrder.on('child_removed', snap=>{
  const div = solutionsContent.querySelector("[data-id='" + snap.key + "']");
  solutionsContent.removeChild(div);
})

// Add Solution Button Click
solutionsButton.addEventListener('click', function () {
    if (solutionsText.value && solutionsTitle.value) {
        const date = new Date().getTime();
        const solutionObj = { 
            date: date,
            title: solutionsTitle.value, 
            text: solutionsText.value, 
            author: firebase.auth().currentUser.uid
        }
        solutionsRef.push(solutionObj)
        solutionsText.value = "";
        solutionsTitle.value = "";
    }
    $('#solutionsButton').modal('hide');
});

// Empty modals on close
$('#solutionsButton').on('hidden.bs.modal', function () {
  solutionsText.value="";
  solutionsTitle.value="";
});
