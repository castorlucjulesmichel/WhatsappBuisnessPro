(() => {
  "use strict";
  const pages=()=>[...document.querySelectorAll(".page")];
  const navButtons=()=>[...document.querySelectorAll(".bottomNav button[data-page]")];
  const parentMap={
    calls:"chat",contactPicker:"chat",newContact:"chat",
    status:"clips",
    orders:"create",stats:"create",business:"create",wallet:"create",invest:"create",tools:"create",
    settings:"profile"
  };
  function closeTransient(){
    document.getElementById("notificationPanel")?.classList.add("hidden");
    document.getElementById("chatActionPanel")?.classList.add("hidden");
    document.getElementById("chatContactInfoPanel")?.classList.add("hidden");
    document.getElementById("nativeContactSelector")?.classList.add("hidden");
  }
  function route(name,opts={}){
    const target=document.getElementById(name+"Page");
    if(!target)return false;
    if(name!=="chat"){
      try{window.WBP_CLOSE_CHAT?.()}catch{}
      document.querySelector("#chatPage .conversation")?.classList.remove("open");
      document.getElementById("chatPage")?.classList.remove("chat-open");
      document.body.classList.remove("chatConversationOpen");
      document.documentElement.classList.remove("chatConversationOpen");
    }
    closeTransient();
    pages().forEach(p=>p.classList.remove("active"));
    target.classList.add("active");
    const parent=parentMap[name]||name;
    navButtons().forEach(b=>b.classList.toggle("active",b.dataset.page===parent));
    document.body.classList.toggle("waMainTab",name==="chat"||name==="calls");
    if(opts.scroll!==false)window.scrollTo({top:0,behavior:"auto"});
    window.dispatchEvent(new CustomEvent("wbp-route-changed",{detail:{name,parent}}));
    return true;
  }
  document.addEventListener("click",event=>{
    const button=event.target.closest(".bottomNav button[data-page]");
    if(!button)return;
    event.preventDefault();
    event.stopImmediatePropagation();
    route(button.dataset.page);
  },true);
  document.addEventListener("click",event=>{
    const button=event.target.closest("[data-go]");
    if(!button||button.closest(".bottomNav"))return;
    event.preventDefault();
    route(button.dataset.go);
  },false);
  window.WBP_ROUTE=route;
})();