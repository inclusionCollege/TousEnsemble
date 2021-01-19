/*
	parameters
	- name : the name of the query parameter
	returns the query parameter that corresponds to the name given

	example : http://test.fr?user=Bob
	getUrlParameter('user') returns Bob
*/
function getUrlParameter(name) {
    name = name.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]');
    var regex = new RegExp('[\\?&]' + name + '=([^&#]*)');
    var results = regex.exec(location.search);
    return results === null ? '' : decodeURIComponent(results[1].replace(/\+/g, ' '));
}

/*
	parameters
	- userId : the id of the user
	returns object with values
	{
		name : role name ('superadmin', 'admin', 'user')
		userId : the id of the user
		school : the id of the school #OPTIONNAL
	}
*/
function getUserRole(userId){
	return new Promise((resolve,reject)=>{
		firebase.database().ref("/authentication").child(userId).once('value',snapshot=>{
			if(snapshot.val()){
				const role = snapshot.val().role;
				const school = snapshot.val().school;
				const user = {name:role,userId:snapshot.key};
				if(school){
					user.school = school;
				}
				resolve(user);
			}else{
				resolve();
			}
		})
		.catch(err=>{
			reject(err);
		})
	})
}

/*
	Get an user details.
	Checks if you are allowed to request or not.
	MUST BE AUTHENTICATED IN FIREBASE

	parameters
	- userId : the id of the user
	returns object with values
	{
		name : role name ('superadmin','admin','user')
		userId : the id of the user
		school : the id of the school #OPTIONNAL
		val : {
			name : the name of the user 
			surname : the surname of the user 
			email : the email of the user
		} || ('Super Administrateur','Administrateur')
		permissionDenied : boolean #OPTIONNAL
	}
*/
function getUser(userId){
	const selfId = firebase.auth().currentUser.uid;
	return new Promise((resolve,reject)=>{
		getUserRole(selfId)
		.then(selfRole=>{
			getUserRole(userId)
			.then(userRole=>{
				if(userRole){
					const promises = [];
					let user = userRole;
					const school = userRole.school;
					if(userRole.name === "superadmin"){
						if(selfRole.name === "superadmin"){
							promises.push(firebase.database().ref("/superadmin").child(userId).once('value',superadminSnap=>{
								user.val = superadminSnap.val();
							}))
						}else{
							user.val = "Super Administrateur";
							user.permissionDenied = true;
						}
					}
					if(userRole.name === "admin"){
						if(selfRole.name === "superadmin" 
						|| (selfRole.name === "admin" && selfRole.school === userRole.school)){
							promises.push(firebase.database().ref("/schools").child(school).child("admin").child(userId).once('value',adminSnap=>{
								user.val = adminSnap.val();
								user.school = school;
							}))
						}else{
							user.val = "Administrateur";
							user.permissionDenied = true;
						}
					}
					if(userRole.name === "user"){
						if(selfRole.name === "superadmin" 
						|| (selfRole.name === "admin" && selfRole.school === userRole.school) 
						|| (selfRole.name === "user" && selfRole.school === userRole.school)){
							promises.push(firebase.database().ref("/schools").child(school).child("database/users").child(userId).once('value',userSnap=>{
								user.val = userSnap.val();
								user.school = school;
							}))
						}else{
							user.val = "Utilisateur";
							user.permissionDenied = true;
						}
					}
					Promise.all(promises)
					.then(()=>{
						resolve(user);
					})
					.catch(err=>{
						reject(err);
					})
				}else{
					resolve({name: "unknown"})
				}
			})
		})
	})
}

/*
	Sets the Bootstrap card attributes
	Uses the accordion card principle
*/
function setCardAttributes(parent, oldCollapseId, newCollapseId, oldHeadingId, newHeadingId) {
    let current = parent.querySelector("#" + oldCollapseId);
    let currentHead = parent.querySelector("#" + oldHeadingId);
    current.id = newCollapseId;
    currentHead.id = newHeadingId;
    currentHead.setAttribute("data-target", "#" + current.id);
    currentHead.setAttribute("aria-controls", current.id);
	current.setAttribute("aria-labelledby", currentHead.id);
	currentHead.addEventListener('click',e=>{
        let arrow = currentHead.querySelector("#arrow");
        if(currentHead.classList.contains("collapsed")){
            arrow.classList.remove("fa-caret-down");
            arrow.classList.add("fa-caret-up");
        }else{
            arrow.classList.remove("fa-caret-up");
            arrow.classList.add("fa-caret-down");
        }
    })
}

/*
	Check if the email is in valid format or not

	parameters
	- email : the email to validate
	returns true if the email is correctly formed false if not
*/
function validateEmail(email) {
	const regex = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
	return regex.test(email);
}