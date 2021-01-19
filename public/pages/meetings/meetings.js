// If user is not referent, delete the newMeeting Button
firebase.auth().onAuthStateChanged(userAuth => {
	const user=userAuth.uid;
	getUserRole(user)
	.then(role => {
		if (role.name === "user") {
			schoolDbRef.child("users").child(role.userId).once('value',userSnap=>{
				if(userSnap.val().role !== "referent"){
					const btnCreateMeeting = document.getElementById("btnCreateMeeting");
					btnCreateMeeting.parentNode.removeChild(btnCreateMeeting);
				}
			})
		}
	})
});

const meetingsInfos = document.getElementById("meetingsInfos");
setCardAttributes(meetingsInfos,"meetingsInfosContent","meetingsInfosContent","meetingsInfosHeader","meetingsInfosHeader");

const meetingsUsersRef = schoolDbRef.child('/users');
const childrenMeetingsRef = schoolDbRef.child("/children_meetings");

const meetingsTemplate = document.getElementById("meetingsTemplate");
const meetingsContainer = document.getElementById("meetingsContainer");

// Create Meeting Click
const btnCreateMeeting = document.getElementById("btnCreateMeeting");
btnCreateMeeting.addEventListener('click', e => {
	window.open("../newMeeting/newMeeting.html?schoolId=" + schoolId + "&studentId=" + studentId);
});

// Creates a new meeting
childrenMeetingsRef.child(studentId).orderByChild("date").on('child_added', meetingSnap => {
	createMeeting(meetingSnap.val().date, meetingSnap.val().pdf_url, meetingSnap.key)
})

// Changes the link of an updated meeting
childrenMeetingsRef.child(studentId).orderByChild("date").on('child_changed', meetingSnap => {
	const meeting = meetingsContainer.querySelector("[data-id='" + meetingSnap.key + "']");
	const pdfInfo = meeting.querySelector("#meetingPdfInfo")
	const meetingLink = meeting.querySelector("#meetingLink")
	changeMeetingLink(meetingLink, pdfInfo, meetingSnap.val().pdf_url)
})

// Removes a deleted meeting
childrenMeetingsRef.child(studentId).on('child_removed', meetingSnap => {
	removeMeeting(meetingSnap.key)
})

function createMeeting(timestamp, url, meetingId) {
	const item = meetingsTemplate.content.querySelector("#meeting");
	const meeting = document.importNode(item, true);
	meeting.querySelector("#meetingDate").innerText = new Date(timestamp).toLocaleDateString("fr-FR");
	const pdfInfo = meeting.querySelector("#meetingPdfInfo")
	changeMeetingLink(meeting.querySelector("#meetingLink"),pdfInfo,url);
	meeting.setAttribute("data-id", meetingId)
	meetingsContainer.insertBefore(meeting,meetingsContainer.childNodes[0]);
}

function changeMeetingLink(meetingLink, pdfInfo, url){
	if (url) {
		meetingLink.href = url;
		$(pdfInfo).addClass('hidden');
	}else{
		meetingLink.removeAttribute("href");
		$(pdfInfo).removeClass('hidden');
		$(pdfInfo).tooltip({ trigger: "hover" });
	}
}

function removeMeeting(meetingId){
	const meeting = meetingsContainer.querySelector("[data-id='" + meetingId + "']")
	meetingsContainer.removeChild(meeting);
}