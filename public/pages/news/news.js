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

const newsInfos = document.getElementById("newsInfos");
setCardAttributes(newsInfos,"newsInfosContent","newsInfosContent","newsInfosHeader","newsInfosHeader");

const newsChild = schoolDbRef.child('/children/' + studentId);
const newsRef = schoolDbRef.child('/children_news/' + studentId);
const newsRefOrder = newsRef.orderByChild("date");
const usersRef = schoolDbRef.child('/users');
const authorRole = schoolDbRef.child('/roles');

const temp = document.getElementById("newsTemplate");
const item = temp.content.querySelector("#newsValue");

const newsContent = document.getElementById("newsContent");
const newsButton = document.getElementById('addNews');
const newsText = document.getElementById('newsInput');

// Get the child surname
newsChild.once('value', function(newsSnap){
    document.getElementById("surname").innerText = newsSnap.val().surname;
})

// Adds a created news
newsRefOrder.on('child_added', snap => {
    let div = document.importNode(item, true);

    div.querySelector("#newsText").innerText = snap.val().text;

    const author = snap.val().author;
    const time = new Date(snap.val().date);
    div.querySelector("#newsDate").innerText = time.toLocaleDateString("fr-FR") +" "+time.toLocaleTimeString("fr-FR");

    getUser(author)
      .then(role => {
          if(role.permissionDenied){
            div.querySelector("#newsAuthor").innerText = role.val;
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
            if (role.name === 'unknown') {
              div.querySelector("#newsAuthor").innerHTML = "<i>Utilisateur supprimé</i>"
            } else {
              Promise.all(promises)
              .then(()=>{
                div.querySelector("#newsAuthor").innerText = role.val.name 
                  + " " + role.val.surname + " " + roleName;
              })
            }
          }
      })

    div.setAttribute("data-id",snap.key);

    newsContent.insertBefore(div, newsContent.firstChild);
});

// Removes a deleted news
newsRefOrder.on('child_removed', snap=>{
  const div = newsContent.querySelector("[data-id='" + snap.key + "']");
  newsContent.removeChild(div);
})

// Empty modals on close
$('#newsButton').on('hidden.bs.modal', function () {
  newsText.value="";
});

// addNews Button Click
newsButton.addEventListener('click', function () {
    if (newsText.value) {
      const date = new Date().getTime();
      const userId = firebase.auth().currentUser.uid;
      const news = { date: date, text: newsText.value, author: userId}
      newsRef.push(news);
      newsText.value = "";
    } else { 
      // news text empty
      console.error("newsText.value null")
    }
    $('#newsButton').modal('hide');
})

// Deals with multiple modals in from of each other
$(document).ready(function() {
  $('.modal').on('hidden.bs.modal', function( event ) {
    $(this).removeClass( 'fv-modal-stack' );
    $('body').data( 'fv_open_modals', $('body').data( 'fv_open_modals' ) - 1 );
  });


  $( '.modal' ).on( 'shown.bs.modal', function ( event ) {

    // keep track of the number of open modals

    if ( typeof( $('body').data( 'fv_open_modals' ) ) == 'undefined' )
    {
    $('body').data( 'fv_open_modals', 0 );
    }


    // if the z-index of this modal has been set, ignore.

    if ( $(this).hasClass( 'fv-modal-stack' ) )
    {
    return;
    }

    $(this).addClass( 'fv-modal-stack' );

    $('body').data( 'fv_open_modals', $('body').data( 'fv_open_modals' ) + 1 );

    $(this).css('z-index', 1040 + (10 * $('body').data( 'fv_open_modals' )));

    $( '.modal-backdrop' ).not( '.fv-modal-stack' )
    .css( 'z-index', 1039 + (10 * $('body').data( 'fv_open_modals' )));


    $( '.modal-backdrop' ).not( 'fv-modal-stack' )
    .addClass( 'fv-modal-stack' );

  });
});