/*-----------------------SCHOOL INFO----------------------------*/
const footerSchoolInfo = document.getElementById("footerSchoolInfo")

if(!schoolId){
    $(footerSchoolInfo).addClass('hidden');
} else {
    schoolRef.child("infos").on('value',snap => {
        if(snap.val()){
            if(snap.val().name){
                footerSchoolInfo.querySelector("#footerSchoolName").innerText = snap.val().name;
            }
            if(snap.val().site_url){
                $(footerSchoolInfo.querySelector("#footerSchoolSite")).removeClass('hidden');
                footerSchoolInfo.querySelector("#footerSchoolSite").href = snap.val().site_url;
            }else{
                $(footerSchoolInfo.querySelector("#footerSchoolSite")).addClass('hidden');
            }
        }
    })
}

/*-----------------------CONTACT----------------------------*/
const footerContactName = document.getElementById("footerContactName");
const footerContactAddress = document.getElementById("footerContactAddress")

baseDbRef.child("infos").child("contact").on('value',snap => {
    if(snap.val()){
        if(snap.val().name){
            footerContactName.innerText = snap.val().name;
        }
        if(snap.val().address){
            footerContactAddress.innerHTML = snap.val().address.replace(/\n/g,"<br>");
        }
    }
})