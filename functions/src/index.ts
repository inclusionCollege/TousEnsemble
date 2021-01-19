import * as functions from 'firebase-functions';
import * as nodemailer from 'nodemailer';
import * as admin from 'firebase-admin';
import * as cors from 'cors';
import * as handlebars from 'handlebars';
import * as fs from 'fs';
import * as pdfMakePrinter from 'pdfmake/src/printer.js';
import * as templatePdf from './templatePdf'
import * as UUID from 'uuid-v4'


// Initializing app
admin.initializeApp();

// Setting the mail transporter
const mailTransport = nodemailer.createTransport({
  // service: 'gmail',
  host: 'smtp.gmail.com',
  auth: {
    user: "inclusion.college@gmail.com",//gmailEmail,
    pass: "college+33405",//gmailPassword,
  }
});

// URL that host the WebApp
const projectId = "module-de-suivi";
const baseUrl = "https://"+ projectId +".firebaseapp.com";
const baseStorageUrl = "https://firebasestorage.googleapis.com/v0/b/"+ projectId +".appspot.com/o/";

/* ----------------------------------------------------------------------------------------- */

// Generate a random password
function generatePass() {
  const l = 8;
  /* c : chaîne de caractères alphanumérique */
  const c = 'abcdefghijknopqrstuvwxyzACDEFGHJKLMNPQRSTUVWXYZ12345679';
  const n = c.length;
  /* p : chaîne de caractères spéciaux */
  const p = '!@#$+-*&_';
  const o = p.length;
  let r = '';
  /* s : determine la position du caractère spécial dans le mdp */
  const s = Math.floor(Math.random() * (o - 1));
  for (let i = 0; i < l; ++i) {
    if (s === i) {
      /* on insère à la position donnée un caractère spécial aléatoire */
      r += p.charAt(Math.floor(Math.random() * o));
    } else {
      /* on insère un caractère alphanumérique aléatoire */
      r += c.charAt(Math.floor(Math.random() * n));
    }
  }
  return r;
}

// Format date to DD/MM/YYYY format
function formatDate(timestamp) {
  const date = new Date(timestamp);
  // 01, 02, 03, ... 29, 30, 31
  const dd = (date.getDate() < 10 ? '0' : '') + date.getDate();
  // 01, 02, 03, ... 10, 11, 12
  const mm = ((date.getMonth() + 1) < 10 ? '0' : '') + (date.getMonth() + 1);
  // 1970, 1971, ... 2015, 2016, ...
  const yyyy = date.getFullYear();
  return dd + '/' + mm + '/' + yyyy;
}

/* ----------------------------------- SENDING MAIL FUNCTIONS ----------------------------------- */

// ------ Welcome Mail when signing up
function sendWelcomeEmail(email, name, pass) {
  const subject = "BIENVENUE " + name;
  const file = './emailTemplates/welcomeEmail.html';
  const context = {
    username: name,
    userpass: pass,
    baseUrl: baseUrl
  }
  sendEmail(file,context,subject,email);
}
// ------ End Welcome Mail

// ------ News Mail
function sendNewsEmail(writer, email, name, id, news, schoolId) {
  const context = {
    writer: writer,
    studentName: name,
    studentId: id,
    news: news,
    schoolId: schoolId,
    baseUrl: baseUrl
  }
  const file = './emailTemplates/newsEmail.html';
  const subject = "Nouvelle Actualité pour l'élève " + name;
  sendEmail(file,context,subject,email);
}
// ------ End News Email

// ------ Solution Mail
function sendSolutionEmail(writer, email, name, id, solutionTitle, solutionText, schoolId) {
  const subject = "Nouvelle Solution pour l'élève " + name;
  const file = './emailTemplates/solutionEmail.html';
  const context = {
    writer: writer,
    studentName: name,
    studentId: id,
    solutionTitle: solutionTitle,
    solutionText: solutionText,
    schoolId: schoolId,
    baseUrl: baseUrl
  }
  sendEmail(file,context,subject,email);
}
// ------ End Solution Email

// ------ Meeting Email
function sendMeetingEmail(listOfUsersEmail, url, studentName) {
  const subject = "Nouvelle réunion pour l'élève " + studentName;
  const file = './emailTemplates/meetingEmail.html';
  const context = {
    studentName: studentName
  }
  const attachments = [
      {
        path: url
      }
    ]
  sendEmail(file,context,subject,listOfUsersEmail.toString(),attachments);
}
// ------ End Meeting Email


// ------ Forgot Password Email
function sendForgotPasswordEmail(email, pass) {
  const subject = "Réinitialisation de votre mot de passe";
  const file = './emailTemplates/forgotPasswordEmail.html';
  const context = {
    userPass: pass,
    baseUrl: baseUrl
  }
  sendEmail(file,context,subject,email);
}
// ------ End Forgot Password Email

// ------ Change User Email
function sendChangeUserEmail(email, oldEmail) {
  const subject = "Changement d'adresse mail";
  const file = './emailTemplates/changeUserEmail.html';
  const context = {
    userOldEmail: oldEmail,
    baseUrl: baseUrl
  }
  sendEmail(file,context,subject,email);
}
// ------ End Change User Email


// ------ Deleted User Email
function sendByeEmail(email, username) {
  const subject = "Votre compte a été supprimé";
  const file = './emailTemplates/byeEmail.html';
  const context = {
    username: username
  }
  sendEmail(file,context,subject,email);
}
// ------ End Deleted User Email

// ------ send Email
function sendEmail(file, context, subject, email, attachments?) {
  fs.readFile(file, 'utf-8', function read(err, data) {
    if (err) {
      throw err;
    }
    const templ = handlebars.compile(data);
    const htmlToSend = templ(context);
    const mailOptions = {
      to: email,
      subject: subject,
      html: htmlToSend,
      attachments: attachments
    };

    mailTransport.sendMail(mailOptions).then(() => {
      console.log('email sent to: ', email);
    })
    .catch((error) => {
      console.log(error)
    });
  });
}
// ------ End send Email


/* -----------------------------------  CLOUD FUNCTIONS ----------------------------------- */

// Cloud function called on a user creation
// Create a new user in the database and in the firebase auth with a generated password
// Send an email to the new user with his password

// export const signUpUser = functions.https.onRequest((req, res) => {
//   const corsFn = cors();
//   corsFn(req, res, function () {
//     const userType = req.body.role;
//     const userEmail = req.body.email;
//     const userName = req.body.name;
//     const userSurname = req.body.surname;
//     const userMoreInfo = req.body.additional_info;
//     const schoolId = req.body.schoolId;
//     signUp(userType, userEmail, userName, userSurname, userMoreInfo, schoolId)
//     .then(() => {
//       res.json({ success: true });
//     })
//       .catch(() => {
//         res.json({ success: false });
//       })
//   });
// });

export const signUpUser = functions.https.onCall((data, context) => {
  const userType = data.role;
  const userEmail = data.email;
  const userName = data.name;
  const userSurname = data.surname;
  const userMoreInfo = data.additional_info;
  const schoolId = data.schoolId;

  const uid = context.auth.uid;

  return admin.database().ref("authentication").child(uid).once('value')
  .then(authSnap => {
    if(authSnap.val()){
      const authRole = authSnap.val().role;
      const authSchool = authSnap.val().school;
      const errorDenied = new functions.https.HttpsError('permission-denied',
        "You don't have the permission to perform the action");
      if(userType === 'superadmin' && authRole !== 'superadmin'){
        throw errorDenied;
      }
      if(authRole !== 'admin' && authRole !== 'superadmin'){
        throw errorDenied;
      }
      if(authSchool && authSchool !== schoolId){
        throw errorDenied;
      }
      return signUp(userType, userEmail, userName, userSurname, userMoreInfo, schoolId)
      .then(() => {
        return { success: true };
      })
      .catch(() => {
        throw new functions.https.HttpsError('internal','An internal error occured');
      });
    }else{
      throw new functions.https.HttpsError('failed-precondition','User not authenticated');
    }
  })
  .catch(() => {
    throw new functions.https.HttpsError('internal','An internal error occured');
  });
})

export const createFirstSuperAdmin = functions.https.onRequest((req,res)=>{
  const role = req.body.role;
  const name = req.body.name;
  const surname = req.body.surname;
  const email = req.body.email;

  const corsFn = cors();
  return corsFn(req, res, function () {
    if(!role || !name || !surname || !email){
      res.status(400).send({ success: false, error: "All fields must be filled" })
      return { success: false }
    }
    return admin.database().ref('superadmin').once('value')
    .then(superSnap => {
      if(superSnap.hasChildren()){
        // throw new functions.https.HttpsError('failed-precondition','A superadmin already exists.')
        console.log("A superadmin already exists.");
        res.status(400).send({ success: false, error: "A superadmin already exists." })
        return { success: false };
      }else{
        return signUp(role,email,name,surname)
        .then(()=>{
          console.log("Succesfully created first superadmin");
          res.status(200).send({success: true, msg: "The superadmin was successfully created."})
          return { success: true }
        })
        .catch((err)=>{
          console.error(err);
          throw new functions.https.HttpsError('internal','An internal error occured.')
        })
      }
    })
    .catch((err)=>{
      console.error(err);
      throw new functions.https.HttpsError('internal','An internal error occured.')
    })
  })
})

function signUp(userType, userEmail, userName, userSurname, userMoreInfo?, schoolId?) {
  return new Promise((resolve, reject) => {
    const userPass = generatePass();

    admin.auth().createUser({
      email: userEmail,
      emailVerified: false,
      password: userPass,
      displayName: userName + ' ' + userSurname,
      disabled: false
    })
    .then((userRecord) => {
      // See the UserRecord reference doc for the contents of userRecord.
      console.log("Successfully created new user in firebase auth:", userRecord.uid);
      const user = { 
        name: userName, 
        surname: userSurname, 
        email: userEmail,
        firstConnection: true,
        additional_info: null,
        role: null
      }
      if (userType === 'superadmin') {
        admin.database().ref('/superadmin/' + userRecord.uid).set(user)
          .then(function () {
            admin.database().ref('/authentication/' + userRecord.uid).set({role: userType})

            console.log('Created new user in Database');
            // Call the function for sending welcome email
            sendWelcomeEmail(userEmail, userName + ' ' + userSurname, userPass);
            resolve();
          })
          .catch((errorDb) => {

            // If error in setting the user to the db, delete the user in firebase auth
            admin.auth().deleteUser(userRecord.uid)
              .then(function () {
                console.log("Successfully deleted user");
              })
              .catch(function (errorDeleteUser) {
                console.log("Error deleting user:", errorDeleteUser);
              });
            console.log(errorDb.message)
            reject();
          })
      }
      else if (userType === 'admin') {
        admin.database().ref('/schools/' + schoolId + '/admin/' + userRecord.uid).set(user)
          .then(function () {
            admin.database().ref('/authentication/' + userRecord.uid).set({role: userType, school: schoolId})

            console.log('Created new user in Database');
            // Call the function for sending welcome email
            sendWelcomeEmail(userEmail, userName + ' ' + userSurname, userPass);
            resolve();
          })
          .catch((errorDb) => {

            // If error in setting the user to the db, delete the user in firebase auth
            admin.auth().deleteUser(userRecord.uid)
              .then(function () {
                console.log("Successfully deleted user");
              })
              .catch(function (errorDeleteUser) {
                console.log("Error deleting user:", errorDeleteUser);
              });
            console.log(errorDb.message)
            reject();
          })
      }
      else {
        user.additional_info = userMoreInfo
        user.role = userType;
        admin.database().ref('/schools/' + schoolId + '/database/users/' + userRecord.uid).set(user)
        .then(function () {
          admin.database().ref('/authentication/' + userRecord.uid).set({role: "user", school: schoolId})

          console.log('Created new user in Database');
          // Call the function for sending welcome email
          sendWelcomeEmail(userEmail, userName + ' ' + userSurname, userPass);
          resolve();
        })
        .catch((errorDb) => {
          // If error in setting the user to the db, delete the user in firebase auth
          admin.auth().deleteUser(userRecord.uid)
            .then(function () {
              console.log("Successfully deleted user");
            })
            .catch(function (errorDeleteUser) {
              console.log("Error deleting user:", errorDeleteUser);
            });
          console.log(errorDb.message)
          reject();
        })
      }
    })
    .catch(function (errorAddUser) {
      console.log("Error creating new user:", errorAddUser);
      reject();
    })
  })
}

function getUser(userId){
  return new Promise((resolve,reject)=>{
    admin.database().ref('authentication').child(userId).once('value').then(snapshot=>{
      let val;
      if(snapshot.val().role === "superadmin"){
        admin.database().ref('superadmin').child(userId).once('value',superSnap => {
          val = superSnap.val();
        })
      }
      if(snapshot.val().role === "admin"){
        admin.database().ref("schools").child(snapshot.val().school).child("admin").child(userId)
        .once('value',adminSnap=>{
          val = adminSnap.val();
        })
      }
      if(snapshot.val().role === "user"){
        admin.database().ref("schools").child(snapshot.val().school).child("database/user")
        .child(userId).once('value',userSnap=>{
          val = userSnap.val();
        })
      }
      if(val){
        resolve(val);
      }else{
        reject()
      }
    })
		.catch(err=>{
      console.error(err);
      reject(err);
    })
  })
}

// This cloud function triggers itself on new news added
// Send the news by email to the referent
export const onNewsAdded = functions.database.ref('/schools/{schoolId}/database/children_news/{childId}/{news}')
  .onCreate((snap, context) => {
    return new Promise((resolve, reject) => {
      const newsData = snap.val();
      const schoolId = context.params.schoolId;
      const childId = context.params.childId;
      admin.database().ref('/schools/' + schoolId + '/database/children/' + childId).once('value').then(function (snapshotChild) {
        const childrenName = snapshotChild.val().name + ' ' + snapshotChild.val().surname;
        getUser(newsData.author).then(function (author : any) {
          const authorName = author.name + " " + author.surname;
          let referentEmail;
          admin.database().ref('/schools/' + schoolId + '/database/relationships').once('value').then(function(snapshotRelation){
            const promises = [];
            snapshotRelation.forEach(relSnap=>{
              if (relSnap.child(childId).val()) {
                promises.push(new Promise((res,rej)=>{
                  admin.database().ref('/schools/' + schoolId + '/database/users/' + relSnap.key).once('value').then(function(snapshotReferent){
                    if(snapshotReferent.val() && snapshotReferent.val().role === 'referent'){
                      referentEmail = snapshotReferent.val().email;
                    }
                    res();
                  })
                  .catch(error=>rej(error))
                }))
              }
            })
            Promise.all(promises)
            .then(()=>{
              if(referentEmail){
                sendNewsEmail(authorName, referentEmail, childrenName, childId, newsData.text, schoolId);
              }
              resolve()
            })
            .catch(error=>reject(error))
          })
        })
          .catch((error) => reject(error));
      })
        .catch((error) => reject(error));
    })
  });

// This cloud function triggers itself on new solution added
// Send the solution by email to the referent
export const onSolutionAdded = functions.database.ref('/schools/{schoolId}/database/children_solutions/{childId}/{solution}')
.onCreate((snap, context) => {
  return new Promise((resolve, reject) => {
    const solutionData = snap.val();
    const schoolId = context.params.schoolId;
    const childId = context.params.childId;
    admin.database().ref('/schools/' + schoolId + '/database/children/' + childId).once('value').then(function (snapshotChild) {
      const childrenName = snapshotChild.val().name + ' ' + snapshotChild.val().surname;
      getUser(solutionData.author).then((author : any) => {
        const authorName = author.name + " " + author.surname;
        let referentEmail;
        admin.database().ref('/schools/' + schoolId + '/database/relationships').once('value').then(function(snapshotRelation){
          const promises = [];
          snapshotRelation.forEach(relSnap=>{
            if (relSnap.child(childId).val()) {
              promises.push(new Promise((res,rej)=>{
                admin.database().ref('/schools/' + schoolId + '/database/users/' + relSnap.key).once('value').then(function(snapshotReferent){
                  if(snapshotReferent.val() && snapshotReferent.val().role === 'referent'){
                    referentEmail = snapshotReferent.val().email;
                  }
                  res();
                })
                .catch(error=>rej(error))
              }))
            }
          })
          Promise.all(promises)
          .then(()=>{
            if(referentEmail){
              sendSolutionEmail(authorName, referentEmail, childrenName, childId, solutionData.title, solutionData.text, schoolId);
            }
            resolve()
          })
          .catch(error=>reject(error))
        })
      })
        .catch((error) => reject(error));
    })
      .catch((error) => reject(error));
  })
});


// Cloud function triggers itself on new meeting added
// Send an email and the pdf of the meeting to the users to notify them
export const onMeetingAdded = functions.database.ref('/schools/{schoolId}/database/children_meetings/{childId}/{meetingId}/finished')
.onCreate((snap, context) => {
  return new Promise((resolve, reject) => {
    console.log('New Meeting Added')
    const schoolId = context.params.schoolId;
    const meetingId = context.params.meetingId;
    const childId = context.params.childId;
    let studentName, studentClass, meetingDate, remarksText;
    const participantsList = [];
    const skillsObj = [];

    const childrenMeetingRef = admin.database().ref('/schools/' + schoolId + '/database/children_meetings').child(childId).child(meetingId);
    const childrenRef = admin.database().ref('/schools/' + schoolId + '/database/children/' + childId);
    const childCategoriesRef = admin.database().ref('/schools/' + schoolId + '/database/children_categories/' + childId);
    const childSkillsRef = admin.database().ref('/schools/' + schoolId + '/database/children_skills/' + childId);
    return snap.ref.parent.once('value')
    .then(eventSnap => {
      const listOfUsersEmail = eventSnap.val().emails;
      childrenRef.once('value')
      .then(function (snapshotChild) {
        studentName = snapshotChild.val().name + ' ' + snapshotChild.val().surname;
        studentClass = snapshotChild.val().class;

        meetingDate = formatDate(eventSnap.val().date)

        remarksText = eventSnap.val().additional_notes;
        const participants = eventSnap.val().participants
        if(participants){
          participants.forEach(participant => {
            participantsList.push(participant.name + ' - ' + participant.email);
          });
        }

        const promisesCategories = [];
        childCategoriesRef.once('value')
        .then(function (snapshot) {
          const promisesSkills = [];
          snapshot.forEach(categorySnap => {
            const tempSkill = {
              mainSkillTitle: categorySnap.val().name,
              subSkills: []
            };
            for (const key in categorySnap.val().skills) {
              promisesSkills.push(childSkillsRef.child(categorySnap.key).child(key).once('value')
                .then(function (skillSnap) {
                  if (skillSnap.child(meetingId).val() !== null) {
                    const val = skillSnap.child(meetingId).val().value;
                    let oldVal = -1;
                    if(skillSnap.child("old_latest").val() !== null){
                      oldVal = skillSnap.child(skillSnap.child("old_latest").val()).val().value;
                    }
                    tempSkill.subSkills.push({
                      title: categorySnap.val().skills[key].name,
                      oldValue: oldVal,
                      value: val
                    })
                  }
                })
                .catch((err) => {
                  console.error(err);
                })
              )
            }
            promisesCategories.push(Promise.all(promisesSkills).then(() => {
              if (tempSkill.subSkills.length > 0) {
                skillsObj.push(tempSkill)
              }
            })
            .catch((err) => {
              console.error(err)
            })
            )
          })
          Promise.all(promisesCategories).then(() => {
            // Generation of the pdf
            const pdfDoc = generatePdfDoc(studentName, studentClass, meetingDate, participantsList, skillsObj, remarksText)

            // Save the pdf to the firebase storage and get the link
            uploadFile(pdfDoc, meetingId, schoolId, childId, meetingDate.replace(/\//g,"-"), studentName.replace(/\s/g,"-")).then((url) => {

              //Write the Pdf URl in the database
              childrenMeetingRef.child("pdf_url").set(url);

              // Send the meeting email
              if(listOfUsersEmail){
                sendMeetingEmail(listOfUsersEmail, url, studentName);
              }

              //Finish operation
              childrenMeetingRef.child("finished").set(true);
              resolve()
            })
            .catch(err => {
              console.error(err);
              childrenMeetingRef.child("pdf_url").set(false);
              reject(err)
            })
          })
        })
        .catch((err) => {
          console.error(err);
          childrenMeetingRef.child("pdf_url").set(false);
          reject(err)
        })
      })
      .catch((err) => {
        console.error(err);
        reject(err)
      })
    })
  })
  .catch((err) => {
    console.log(err)
  })
})

export const onSchoolDelete = functions.database.ref('/schools/{schoolId}')
.onDelete((snap,context) => {
  const promises = [];
  snap.child("admin").forEach(adminSnap => {
    promises.push(admin.auth().deleteUser(adminSnap.key))
    return false;
  })
  snap.child("database/users").forEach(userSnap => {
    promises.push(admin.auth().deleteUser(userSnap.key))
    return false;
  })
  return Promise.all(promises)
  .then(() => {
    return { success: true }
  })
  .catch(() => {
    throw new functions.https.HttpsError('internal','An internal error occured');
  })
})

function generatePdfDoc(studentName, studentClass, meetingDate, participantsList, skillsObj, remarksText) {
  const fontDescriptors = {
    Roboto: {
      normal: './fonts/Roboto-Regular.ttf',
      bold: './fonts/Roboto-Medium.ttf',
      italics: './fonts/Roboto-Italic.ttf',
      bolditalics: './fonts/Roboto-MediumItalic.ttf'
    }
  };

  const dd = templatePdf.generateDocDefinition(studentName, studentClass, meetingDate, participantsList, skillsObj, remarksText)

  const printer = new pdfMakePrinter(fontDescriptors);
  const pdfDoc = printer.createPdfKitDocument(dd);

  return pdfDoc;
}

function uploadFile(pdfDoc, meetingId, schoolId, childId, date, childName) {
  return new Promise((resolve, reject) => {
    console.log('Uploading PDF')
    const storage = admin.storage();
    const fileName = 'Reunion_' + date + '_' + childName;
    const filePath = 'schools/' + schoolId + '/meetingPdf/' + childId + '/' + meetingId + '/' + fileName + '.pdf';
    const file = storage.bucket().file(filePath);

    const uuid = UUID();

    pdfDoc.pipe(file.createWriteStream({
      metadata: {
        contentType: 'application/pdf',
        metadata: {
          firebaseStorageDownloadTokens: uuid
        }
      },
      resumable: false
    })).on('finish', function () {
      //success
      console.log('PDF added to the bucket')
      resolve(baseStorageUrl + encodeURIComponent(filePath) + "?alt=media&token=" + uuid);
    })

      .on("error", err => {
        console.log('Error PDF not stored ', err)
        reject(err);
      });
    pdfDoc.end();
  })
}

// Cloud function called when a user don't remember his password
// Generates a new password and send it by email to the user

// export const forgotPassword = functions.https.onRequest((req, res) => {
//   const corsFn = cors();
//   corsFn(req, res, function () {
//     const email = req.body.email;
//     forgotPwd(email).then(() => {
//       res.json({ success: true });
//     })
//       .catch(() => {
//         res.json({ success: false });
//       })
//   });
// });

export const forgotPassword = functions.https.onCall((data,context) => {
  const email = data.email;
  return forgotPwd(email)
  .then(() => {
    return { success: true };
  })
  .catch(() => {
    throw new functions.https.HttpsError('internal','An error has occured')
  });
})

function forgotPwd(email) {
  return new Promise((resolve, reject) => {
    const userPass = generatePass();
    admin.auth().getUserByEmail(email)
      .then(function (userRecord) {
        console.log("Successfully fetched user data:", userRecord.toJSON());
        admin.auth().updateUser(userRecord.uid, {
          password: userPass,
        })
          .then(function (userRecordUpdated) {
            // See the UserRecord reference doc for the contents of userRecord.
            console.log("Successfully updated user", userRecordUpdated.toJSON());
            // Call the function for sending forgot password email
            sendForgotPasswordEmail(email, userPass)
            resolve();
          })
          .catch(function (error) {
            console.log("Error updating user:", error);
            reject();
          });
      })
      .catch(function (error) {
        console.log("Error fetching user data:", error);
        reject();
      });
  })
}

// Cloud function called when a user want to change his email

// export const changeUserEmail = functions.https.onRequest((req, res) => {
//   const corsFn = cors();
//   corsFn(req, res, function () {
//     const uid = req.body.id;
//     const schoolId = req.body.schoolId;
//     const newEmail = req.body.newEmail;
//     const oldEmail = req.body.oldEmail;
//     changeEmail(uid, schoolId, newEmail, oldEmail).then(() => {
//       res.json({ success: true });
//     })
//       .catch(() => {
//         res.json({ success: false });
//       })
//   });
// });

export const changeUserEmail = functions.https.onCall((data, context) => {
  const uid = context.auth.uid;
  const schoolId = data.schoolId;
  const newEmail = data.newEmail;
  const oldEmail = data.oldEmail;
  return changeEmail(uid, schoolId, newEmail, oldEmail)
  .then(() => {
    return { success: true };
  })
  .catch(() => {
    throw new functions.https.HttpsError('internal','An error has occured')
  });
})

function changeEmail(uid, schoolId, newEmail, oldEmail) {
  return new Promise((resolve, reject) => {
    admin.auth().getUserByEmail(oldEmail)
      .then(function (userRecord) {
        console.log("Successfully fetched user data:", userRecord.toJSON());
        admin.auth().updateUser(userRecord.uid, {
          email: newEmail
        })
          .then(function (userRecordUpdated) {
            // See the UserRecord reference doc for the contents of userRecord.
            console.log("Successfully updated user", userRecordUpdated.toJSON());
            admin.database().ref('/schools/' + schoolId + '/database/users/' + uid).update({ email: newEmail })
              .then(() => {
                sendChangeUserEmail(newEmail, oldEmail)
                resolve();
              })
              .catch(function (error) {
                console.log("Error updating user in database: ", error);
                reject();
              });
          })
          .catch(function (error) {
            console.log("Error updating user in auth: ", error);
            reject();
          });
      })
      .catch(function (error) {
        console.log("Error fetching user data:", error);
        reject();
      });
  })
}

export const deleteUser = functions.https.onCall((data, context) => {
  const authId = context.auth.uid;
  const userId = data.userId;

  return admin.database().ref("authentication").child(authId).once('value')
  .then(authSnap => {
    if(authSnap.val()){
      const authRole = authSnap.val().role;
      const authSchool = authSnap.val().school;
      const errorDenied = new functions.https.HttpsError('permission-denied',
        "You don't have the permission to perform the action");
      return admin.database().ref("authentication").child(userId).once('value')
      .then(userSnap => {
        if(userSnap.val()){
          const userRole = userSnap.val().role;
          const userSchool = userSnap.val().school;
          if(userRole === 'superadmin' && authRole !== 'superadmin'){
            throw errorDenied;
          }
          if(authRole !== 'admin' && authRole !== 'superadmin'){
            throw errorDenied;
          }
          if(authSchool && authSchool !== userSchool){
            throw errorDenied;
          }
          return admin.auth().deleteUser(userId)
          .then(() => {
            return { success: true };
          })
          .catch(() => {
            throw new functions.https.HttpsError('internal','An internal error occured');
          });
        }else{
          throw new functions.https.HttpsError('failed-precondition','User does not exist');    
        }
      })
      .catch(() => {
        throw new functions.https.HttpsError('internal','An internal error occured');
      });
    }else{
      throw new functions.https.HttpsError('failed-precondition','User not authenticated');
    }
  })
  .catch(() => {
    throw new functions.https.HttpsError('internal','An internal error occured');
  });
})

// Cloud function triggers itself on a user deletion
// Send an email to the user to notify him
export const onUserDelete = functions.auth.user().onDelete((data) => {
  const userId = data.uid;
  return admin.database().ref('/authentication/' + userId).once('value')
  .then(snapshot=>{
    const promises = [];
    if(snapshot.val().role === "superadmin"){
      promises.push(
        admin.database().ref("superadmin").child(userId).ref.remove()
      );
    }
    if(snapshot.val().role === "admin"){
      promises.push(
        admin.database().ref("/schools/" + snapshot.val().school + "/admin").child(userId).ref.remove()
      )
    }
    if(snapshot.val().role === "user"){
      promises.push(
        admin.database().ref("/schools/" + snapshot.val().school + "/database").child("relationships").child(userId).ref.remove()
      )
      promises.push(
        admin.database().ref("/schools/" + snapshot.val().school + "/database").child("users").child(userId).ref.remove()
      )
    }
    promises.push(
      admin.database().ref("authentication").child(userId).ref.remove()
    )
    return Promise.all(promises)
    .then(()=>{
      return true;
    })
    .catch(err=>console.error(err))
  })
  .then(() => {
    sendByeEmail(data.email, data.displayName);
  })
  .catch(errorDb => { 
    console.log(errorDb) 
  });
});

// Cloud function triggers itself on a storage finalize
// links the profile image to a child
export const onStorageFinalize = functions.storage.object().onFinalize((data,context)=>{
  const filePath = data.name;

  const file = filePath.split("/");
  console.log(filePath,file);

  const imgUrl = baseStorageUrl + encodeURIComponent(filePath) + "?alt=media&token=" + data.metadata.firebaseStorageDownloadTokens;

  if(file[0] === 'schools'){
    if(file[2] === 'profileImage'){
      const schoolId = file[1];
      const childId = file[3];
      return admin.database().ref('/schools/' + schoolId + '/database/children/' + childId + '/img_url').set(imgUrl)
      .then(()=>{
        console.log("Succesfully linked the image to the child");
        return true;
      })
      .catch(err=>{
        console.error(err)
        return false;
      })
    }
    if(file[2] === 'schoolImage'){
      const schoolId = file[1];
      return admin.database().ref('/schools/' + schoolId + '/infos/img_url').set(imgUrl)
      .then(()=>{
        console.log("Successfully linked school image");
        return true;
      })
      .catch(err=>{
        console.error(err);
        return false;
      })
    }
  }
  if(file[0] === 'siteImage'){
    return admin.database().ref('infos/site/img_url').set(imgUrl)
    .then(()=>{
      console.log("Successfully linked site image");
      return true;
    })
    .catch(err=>{
      console.error(err);
      return false;
    })
  }
  return true;
})

// Cloud function triggers itself on a storage delete
// deletes the meeting link if file deleted
// unlinks the profile image to a child
export const onStorageDelete = functions.storage.object().onDelete((data,context)=>{
  const filePath = data.name;

  const file = filePath.split("/");
  console.log(filePath,file);

  const imgUrl = baseStorageUrl + encodeURIComponent(filePath) + "?alt=media&token=" + data.metadata.firebaseStorageDownloadTokens;

  if(file[0] === 'schools'){
    if(file[2] === 'profileImage') {
      const schoolId = file[1];
      const childId = file[3];
  
      return admin.database().ref('/schools/' + schoolId + '/database/children/' + childId + '/img_url').once('value')
      .then(snap=>{
        if(imgUrl === snap.val()){
          return admin.database().ref('/schools/' + schoolId + '/database/children/' + childId + '/img_url').ref.remove()
          .then(()=>{
            console.log("Succesfully unlinked the image to the child");
            return true;
          })
          .catch(err=>{
            console.error(err)
            return false;
          })
        }
        return true;
      })
      .catch(err=>{
        console.error(err)
        return false;
      })
    }
    if(file[2] === 'meetingPdf') {
      const schoolId = file[1];
      const childId = file[3]
      const meetingId = file[4];
  
      return admin.database().ref('/schools/' + schoolId + '/database/children_meetings/' + childId + '/' + meetingId + '/pdf_url').ref.remove()
      .then(()=>{
        console.log("Succesfully removed pdf link");
        return true;
      })
      .catch(err=>{
        console.error(err);
        return false;
      })
    }
    if(file[2] === 'schoolImage') {
      const schoolId = file[1];
      return admin.database().ref('/schools/' + schoolId + '/infos/img_url').once('value',snap => {
        if(snap.val() === imgUrl){
          return admin.database().ref('/schools/' + schoolId + 'infos/img_url').ref.remove()
          .then(()=>{
            console.log("Succesfully removed school image link");
            return true;
          })
          .catch(err=>{
            console.error(err);
            return false;
          })
        }
        return true;
      })
    }
  }
  if(file[0] === 'siteImage') {
    return admin.database().ref('infos/site/img_url').once('value',snap => {
      if(snap.val() === imgUrl){
        return admin.database().ref('infos/site/img_url').ref.remove()
        .then(()=>{
          console.log("Succesfully removed site image link");
          return true;
        })
        .catch(err=>{
          console.error(err);
          return false;
        })
      }
      return true;
    })
  }
  return true;
})

// Cloud function triggers itself on a child delete
// removes all child reference in the database
export const onChildDelete = functions.database.ref('/schools/{schoolId}/database/children/{childId}')
.onDelete((snapshot, context) => {
  const schoolId = context.params.schoolId;
  const childId = context.params.childId;

  const promises = [];

  promises.push(
    admin.database().ref('schools').child(schoolId).child('database/children_categories').child(childId).ref.remove()
  );
  promises.push(
    admin.database().ref('schools').child(schoolId).child('database/children_meetings').child(childId).ref.remove()
  );
  promises.push(
    admin.database().ref('schools').child(schoolId).child('database/children_news').child(childId).ref.remove()
  );
  promises.push(
    admin.database().ref('schools').child(schoolId).child('database/children_profile').child(childId).ref.remove()
  );
  promises.push(
    admin.database().ref('schools').child(schoolId).child('database/children_skills').child(childId).ref.remove()
  );
  promises.push(
    admin.database().ref('schools').child(schoolId).child('database/children_solutions').child(childId).ref.remove()
  );
  promises.push(
    admin.database().ref('schools').child(schoolId).child('database/relationships')
    .once('value',snap => {
      snap.forEach(userSnap => {
        Object.keys(userSnap.val()).forEach(child => {
          if(child === childId){
            admin.database().ref('schools').child(schoolId).child('database/relationships').child(userSnap.key).child(child).ref.remove();
          }
        })
        return false;
      })
    })
  );

  return Promise.all(promises)
  .then(() => {
    console.log("Sucessfully deleted all child references");
  })
  .catch(err => {
    console.error(err);
  })
})
