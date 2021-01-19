const headerSiteName = document.getElementById("headerSiteName");
const headerSiteImg = document.getElementById("headerLogoSite").querySelector("img");
const headerSiteImgSpinner = document.getElementById("headerSiteImgSpinner");

const headerSiteRef = baseDbRef.child("infos").child("site");

headerSiteRef.on('value',snap => {
    $(headerSiteImgSpinner).removeClass('hidden');
    $(headerSiteImg).addClass('hidden');
    if(snap.val()){
        if(snap.val().name){
            headerSiteName.innerText = snap.val().name;
        }
        if(snap.val().img_url){
            headerSiteImg.setAttribute("src",snap.val().img_url);
        }else{
            headerSiteImg.setAttribute("src","../common/images/college_plus.png");
        }
    }else{
        headerSiteName.innerText = "Collège +";
        headerSiteImg.setAttribute("src","../common/images/college_plus.png");
    }
})

headerSiteImg.onload = () => {
    $(headerSiteImgSpinner).addClass('hidden');
    $(headerSiteImg).removeClass('hidden');
}