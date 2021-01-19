"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function generateDd(studentFullName, studentClass, meetingDate, participantsContent, skillsObj, remarksText) {
    // Styles for the template
    const styles = {
        studentInfo: {
            fontSize: 15,
            bold: true,
            alignment: 'right'
        },
        title: {
            fontSize: 21,
            bold: true,
            alignment: 'center'
        },
        header: {
            italics: true,
            fontSize: 15,
            bold: true,
        }
    };
    // Logo of college plus
    const collegePlusLogo = {
        image: './img/collegePlus.png',
        width: 90,
        alignment: 'left'
    };
    const studentName = {
        text: 'Élève : ' + studentFullName,
        style: 'studentInfo'
    };
    const studentClassHeader = {
        text: 'Classe : ' + studentClass + 'ème',
        style: 'studentInfo'
    };
    const student = {
        stack: [studentName, studentClassHeader]
    };
    const title = {
        text: 'Réunion du ' + meetingDate,
        style: 'title',
        margin: [0, 20]
    };
    const participantsHeader = {
        text: 'Intervenants :',
        style: 'header',
        margin: [0, 20, 0, 20]
    };
    const participantsList = {
        ul: participantsContent,
        margin: [50, 0, 0, 0]
    };
    const participants = {
        stack: [participantsHeader, participantsList],
    };
    const skillsHeader = {
        text: 'Compétences :',
        style: 'header',
        margin: [0, 20, 0, 20]
    };
    // let skillsObj = [{
    //     mainSkillTitle: 'Communication',
    //     subSkills: [{
    //         title: 'Saad sait dire Bonjour',
    //         value: '0'
    //     },
    //     {
    //         title: 'Saad sait répondre à une question',
    //         value: '1'
    //     }]
    // },
    // {
    //     mainSkillTitle: 'Autonomie',
    //     subSkills: [{
    //         title: 'Saad sait lever la main pour parler',
    //         value: '2'
    //     },
    //     {
    //         title: 'Saad sait prendre soin de ses affaires',
    //         value: '0'
    //     }]
    // },
    // ]
    const skillsList = {
        ul: [],
        margin: [50, 0]
    };
    // Fill the skillsList Object with the skills object
    skillsObj.forEach(elem => {
        skillsList.ul.push(elem.mainSkillTitle);
        const ulContent = [];
        elem.subSkills.forEach(sub => {
            if (sub.oldValue === -1) {
                ulContent.push(sub.title + ': ' + sub.value);
            }
            else {
                ulContent.push(sub.title + ': ' + sub.oldValue + '-->' + sub.value);
            }
        });
        const localUl = {
            ul: ulContent,
            margin: [30, 10]
        };
        skillsList.ul.push(localUl);
    });
    const skills = {
        stack: [skillsHeader, skillsList],
    };
    const remarksHeader = {
        text: 'Remarques :',
        style: 'header',
        margin: [0, 20, 0, 20]
    };
    const remarksContent = {
        text: remarksText
    };
    const remarks = {
        stack: [remarksHeader, remarksContent],
    };
    const content = [];
    content.push(collegePlusLogo);
    content.push(student);
    content.push(title);
    content.push(participants);
    content.push(skills);
    content.push(remarks);
    const dd = {
        content,
        styles,
    };
    return dd;
}
// generateDd
exports.generateDocDefinition = generateDd;
//# sourceMappingURL=templatePdf.js.map