import {chromium} from "playwright";

const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:390,height:844}});
const errors=[];
page.on("pageerror",e=>errors.push("pageerror: "+e.message));
page.on("console",m=>{if(m.type()==="error")errors.push("console: "+m.text())});

await page.goto("http://127.0.0.1:4173/",{waitUntil:"networkidle",timeout:90000});
await page.evaluate(()=>{
  document.querySelector("#authScreen")?.classList.add("hidden");
  document.querySelector("#setupScreen")?.classList.add("hidden");
  document.querySelector("#phoneSetupScreen")?.classList.add("hidden");
  document.querySelector("#appShell")?.classList.remove("hidden");
});

const pages=await page.$$eval("section.page[id]",els=>els.map(e=>e.id.replace(/Page$/,"")));
for(const name of pages){
  const ok=await page.evaluate(n=>window.WBP_ROUTE?.(n)!==false,name);
  if(!ok)errors.push("route failed: "+name);
  const active=await page.$eval("#"+name+"Page",e=>e.classList.contains("active"));
  if(!active)errors.push("page did not activate: "+name);
}

await page.evaluate(()=>window.WBP_ROUTE?.("settings"));
const targets=await page.$$eval("[data-setting-target]",els=>[...new Set(els.map(e=>e.dataset.settingTarget))]);
for(const target of targets){
  await page.click('[data-setting-target="'+target+'"]');
  const visible=await page.$eval('[data-setting-panel="'+target+'"]',e=>!e.classList.contains("hidden"));
  if(!visible)errors.push("settings panel did not open: "+target);
  await page.click("#settingsBackBtn");
}

await page.evaluate(()=>window.WBP_ROUTE?.("profile"));
await page.click("#profileAssistantBtn");
if(await page.$eval("#profileAssistantBox",e=>e.classList.contains("hidden")))errors.push("profile assistant did not open");

await page.evaluate(()=>window.WBP_ROUTE?.("market"));
await page.click("#sellBtn");
if(await page.$eval("#sellBox",e=>e.classList.contains("hidden")))errors.push("sell form did not open");
await page.click("#cartBtn");
if(await page.$eval("#cartBox",e=>e.classList.contains("hidden")))errors.push("cart did not open");

await page.evaluate(()=>window.WBP_ROUTE?.("clips"));
await page.click("#clipBtn");
if(await page.$eval("#clipForm",e=>e.classList.contains("hidden")))errors.push("clip form did not open");


await page.evaluate(()=>window.WBP_ROUTE?.("chat"));
await page.click("#newGroupBtn");
if(await page.$eval("#newGroupBox",e=>e.classList.contains("hidden")))errors.push("new group panel did not open");
await page.click("#chatCameraBtn");
if(!await page.$eval("#statusPage",e=>e.classList.contains("active")))errors.push("chat camera did not route to status");
await page.evaluate(()=>window.WBP_ROUTE?.("chat"));
await page.click("#chatMenuBtn");
if(!await page.$eval("#settingsPage",e=>e.classList.contains("active")))errors.push("chat menu did not route to settings");

await page.evaluate(()=>window.WBP_ROUTE?.("calls"));
await page.click("#callsSearchBtn");
if(await page.$eval("#callsSearchInput",e=>e.classList.contains("hidden")))errors.push("calls search did not open");
await page.click("#callsMenuBtn");
if(!await page.$eval("#settingsPage",e=>e.classList.contains("active")))errors.push("calls menu did not route to settings");

await page.evaluate(()=>window.WBP_ROUTE?.("contactPicker"));
await page.click("#contactPickerSearchBtn");
if(await page.$eval("#contactPickerSearch",e=>e.classList.contains("hidden")))errors.push("contact search did not open");
await page.click("#contactPickerMenuBtn");
if(!await page.$eval("#settingsPage",e=>e.classList.contains("active")))errors.push("contact picker menu did not route to settings");


await page.goto("http://127.0.0.1:4173/admin.html",{waitUntil:"networkidle",timeout:90000});
await page.evaluate(()=>{
  document.querySelector("#adminGate")?.classList.add("hidden");
  document.querySelector("#adminApp")?.classList.remove("hidden");
});
const adminTabs=await page.$eval("[data-admin]",els=>els.map(e=>e.dataset.admin));
for(const name of adminTabs){
  await page.click('[data-admin="'+name+'"]');
  const active=await page.$eval("#"+name+"Admin",e=>e.classList.contains("active"));
  if(!active)errors.push("admin tab did not activate: "+name);
}

await browser.close();

const meaningful=errors.filter(x=>!x.includes("Failed to load resource")&&!x.includes("net::ERR"));
if(meaningful.length){
  console.error("\nBROWSER UI SMOKE FAILED");
  meaningful.forEach(x=>console.error(" - "+x));
  process.exit(1);
}
console.log("Browser UI smoke passed: routes, settings panels, profile assistant, marketplace toggles and video form respond.");
