(() => {
  "use strict";
  const pages = () => [...document.querySelectorAll(".page")];
  const navButtons = () => [...document.querySelectorAll(".bottomNav button[data-page]")];

  function route(name){
    const target = document.getElementById(name + "Page");
    if(!target) return false;

    pages().forEach(p => p.classList.remove("active"));
    target.classList.add("active");

    navButtons().forEach(b => b.classList.toggle("active", b.dataset.page === name));
    document.body.classList.toggle("waMainTab", name === "chat" || name === "calls");

    // Close transient overlays that could intercept touches.
    document.getElementById("notificationPanel")?.classList.add("hidden");
    document.querySelector("#chatPage .conversation")?.classList.remove("open");
    document.getElementById("chatPage")?.classList.remove("chat-open");
    document.body.classList.remove("chatConversationOpen");

    window.scrollTo({top:0, behavior:"auto"});
    return true;
  }

  // Main five-button navigation. Capture phase makes this work even if another module fails.
  document.addEventListener("click", (event) => {
    const button = event.target.closest(".bottomNav button[data-page]");
    if(!button) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    route(button.dataset.page);
  }, true);

  // Safe fallback for ordinary data-go links. Other feature handlers may still run.
  document.addEventListener("click", (event) => {
    const button = event.target.closest("[data-go]");
    if(!button || button.closest(".bottomNav")) return;
    const name = button.dataset.go;
    if(name) route(name);
  }, false);

  window.WBP_ROUTE = route;
})();
