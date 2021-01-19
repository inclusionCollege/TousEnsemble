// Loads the header, footer and aside pages
$("#header").load("../header/header.html",()=>{
    console.log("Loaded header");
});
$("#aside").load("../aside/aside.html",()=>{
    console.log("Loaded aside");
});
$("#footer").load("../footer/footer.html",()=>{
    console.log("Loaded footer");
});