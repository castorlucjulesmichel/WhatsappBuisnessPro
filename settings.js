import {firebaseConfig} from "./firebase-config.js";
import {getApps,getApp,initializeApp} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import {getAuth,onAuthStateChanged,signOut} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import {getFirestore,doc,getDoc,setDoc,serverTimestamp} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const configured=()=>firebaseConfig.apiKey && !String(firebaseConfig.apiKey).includes("YOUR_");
const toast=t=>{const e=$("#toast");if(!e)return;e.textContent=t;e.classList.add("show");setTimeout(()=>e.classList.remove("show"),2200)};
const esc=s=>String(s??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]));
const defaultPrefs={
  readReceipts:true,
  disappearing:false,
  disappearingDuration:"off",
  onlineVisibility:true,
  onlinePresence:"contacts",
  profilePhotoPrivacy:"everyone",
  aboutPrivacy:"everyone",
  statusPrivacy:"contacts",
  groupsPrivacy:"contacts",
  twoStep:false,
  securityNotifications:true,
  autoLists:false,
  enterToSend:false,
  mediaVisibility:true,
  stickerSuggestions:true,
  keepArchived:true,
  messageSound:true,
  reminders:true,
  priorityNotifications:true,
  reactionNotifications:true,
  statusReaction:true,
  theme:"system",
  fontSize:"normal",
  orderNotifications:true,
  adNotifications:true,
  autoDownload:"wifi",
  dataSaver:false,
  customerActivity:false,
  highContrast:false,
  reduceMotion:false,
  language:"ht",
  customerLists:[]
};

let auth=null,db=null,user=null,prefs={...defaultPrefs};

if(configured()){
  const app=getApps().length?getApp():initializeApp(firebaseConfig);
  auth=getAuth(app); db=getFirestore(app);
}

function languageLabel(v){
  return {
    ht:"Kreyòl",fr:"Français",en:"English",es:"Español",
    pt:"Português",de:"Deutsch",it:"Italiano",ar:"العربية",
    zh:"中文",hi:"हिन्दी",bn:"বাংলা",ru:"Русский",
    tr:"Türkçe",ja:"日本語",ko:"한국어"
  }[v]||"Kreyòl";
}
function applyVisualPrefs(){
  document.documentElement.dataset.theme=prefs.theme||"system";
  document.documentElement.dataset.fontsize=prefs.fontSize||"normal";
  document.documentElement.classList.toggle("highContrast",prefs.highContrast===true);
  document.documentElement.classList.toggle("reduceMotion",prefs.reduceMotion===true);
}
function fillControls(){
  const setCheck=(id,v)=>{const e=$(id);if(e)e.checked=!!v};
  const setValue=(id,v)=>{const e=$(id);if(e)e.value=v??""};
  setCheck("#readReceiptsSetting",prefs.readReceipts);
  setValue("#disappearingDurationSetting",prefs.disappearingDuration||"off");
  setValue("#onlinePresenceSetting",prefs.onlinePresence||"contacts");
  setValue("#profilePhotoPrivacySetting",prefs.profilePhotoPrivacy||"everyone");
  setValue("#aboutPrivacySetting",prefs.aboutPrivacy||"everyone");
  setValue("#statusPrivacySetting",prefs.statusPrivacy||"contacts");
  setValue("#groupsPrivacySetting",prefs.groupsPrivacy||"contacts");
  setCheck("#twoStepSetting",prefs.twoStep);
  setCheck("#securityNotificationsSetting",prefs.securityNotifications);
  setCheck("#autoListsSetting",prefs.autoLists);
  setCheck("#enterToSendSetting",prefs.enterToSend);
  setCheck("#mediaVisibilitySetting",prefs.mediaVisibility);
  setCheck("#stickerSuggestionsSetting",prefs.stickerSuggestions);
  setCheck("#keepArchivedSetting",prefs.keepArchived);
  setCheck("#messageSoundSetting",prefs.messageSound);
  setCheck("#remindersSetting",prefs.reminders);
  setCheck("#priorityNotificationsSetting",prefs.priorityNotifications);
  setCheck("#reactionNotificationsSetting",prefs.reactionNotifications);
  setCheck("#statusReactionSetting",prefs.statusReaction);
  setValue("#themeSetting",prefs.theme);
  setValue("#fontSizeSetting",prefs.fontSize);
  setCheck("#orderNotificationsSetting",prefs.orderNotifications);
  setCheck("#adNotificationsSetting",prefs.adNotifications);
  setValue("#autoDownloadSetting",prefs.autoDownload);
  setCheck("#dataSaverSetting",prefs.dataSaver);
  setCheck("#customerActivitySetting",prefs.customerActivity);
  setCheck("#highContrastSetting",prefs.highContrast);
  setCheck("#reduceMotionSetting",prefs.reduceMotion);
  prefs.language=localStorage.getItem("wbp_lang")||prefs.language||"ht";
  setValue("#settingsLanguage",prefs.language);
  if($("#settingsLanguageLabel"))$("#settingsLanguageLabel").textContent=languageLabel(prefs.language);
  renderLists();
  applyVisualPrefs();
}
async function savePrefs(){
  localStorage.setItem("wbp_settings",JSON.stringify(prefs));
  applyVisualPrefs();
  if(!user||!db)return;
  await setDoc(doc(db,"userSettings",user.uid),{
    preferences:prefs,
    updatedAt:serverTimestamp()
  },{merge:true});
}
function loadLocal(){
  try{prefs={...defaultPrefs,...JSON.parse(localStorage.getItem("wbp_settings")||"{}")}}catch{prefs={...defaultPrefs}}
  fillControls();
}
async function loadRemote(){
  if(!user||!db)return;
  try{
    const s=await getDoc(doc(db,"userSettings",user.uid));
    if(s.exists()) prefs={...prefs,...(s.data().preferences||{})};
    fillControls();
  }catch(e){console.warn("settings load",e)}
}
function openPanel(name){
  if(!name)return;
  $("#settingsMenuList")?.classList.add("hidden");
  $("#settingsDetail")?.classList.remove("hidden");
  $$(".settingPanel").forEach(p=>p.classList.add("hidden"));
  document.querySelector('[data-setting-panel="'+name+'"]')?.classList.remove("hidden");
  const title=document.querySelector('[data-setting-target="'+name+'"] .settingsText b')?.textContent || "Paramètres";
  if($("#settingsDetailTitle"))$("#settingsDetailTitle").textContent=title;
  if(name==="account"&&$("#settingsPhone"))$("#settingsPhone").textContent=user?.phoneNumber||"—";
  if(name==="devices"){
    if($("#currentDeviceName"))$("#currentDeviceName").textContent=navigator.userAgentData?.platform||navigator.platform||"Appareil actuel";
    if($("#currentDeviceInfo"))$("#currentDeviceInfo").textContent="Session active • "+(navigator.onLine?"En ligne":"Hors ligne");
  }
}
function closePanel(){
  $("#settingsDetail")?.classList.add("hidden");
  $("#settingsMenuList")?.classList.remove("hidden");
  $$(".settingPanel").forEach(p=>p.classList.add("hidden"));
}
function renderLists(){
  const box=$("#customerLists");if(!box)return;
  const arr=Array.isArray(prefs.customerLists)?prefs.customerLists:[];
  box.innerHTML=arr.length?arr.map((x,i)=>'<div class="historyRow"><b>'+esc(x)+'</b><button class="ghost" data-remove-list="'+i+'">Retire</button></div>').join(""):'<p class="muted">Pa gen lis kliyan ankò.</p>';
  $$("[data-remove-list]").forEach(b=>b.onclick=async()=>{prefs.customerLists.splice(Number(b.dataset.removeList),1);renderLists();await savePrefs();toast("Lis retire.")});
}

$("#settingsSearchBtn")?.addEventListener("click",()=>$("#settingsSearch")?.classList.toggle("hidden"));
$("#settingsSearch")?.addEventListener("input",e=>{
  const q=e.target.value.trim().toLowerCase();
  $$("#settingsMenuList .settingsItem").forEach(item=>{
    item.classList.toggle("hidden",q && !item.textContent.toLowerCase().includes(q));
  });
});
$$("[data-setting-target]").forEach(b=>b.addEventListener("click",()=>openPanel(b.dataset.settingTarget)));
$("#settingsBackBtn")?.addEventListener("click",closePanel);
$$("[data-info-msg]").forEach(b=>b.addEventListener("click",()=>toast(b.dataset.infoMsg)));
$("#settingsProfileCard")?.addEventListener("click",()=>document.querySelector('[data-go="profile"]')?.click());

$$('[data-go="settings"][data-settings-section]').forEach(b=>b.addEventListener("click",()=>{
  setTimeout(()=>openPanel(b.dataset.settingsSection),30);
}));

const binds=[
  ["#readReceiptsSetting","readReceipts","checked"],
  ["#disappearingDurationSetting","disappearingDuration","value"],
  ["#onlinePresenceSetting","onlinePresence","value"],
  ["#profilePhotoPrivacySetting","profilePhotoPrivacy","value"],
  ["#aboutPrivacySetting","aboutPrivacy","value"],
  ["#statusPrivacySetting","statusPrivacy","value"],
  ["#groupsPrivacySetting","groupsPrivacy","value"],
  ["#twoStepSetting","twoStep","checked"],
  ["#securityNotificationsSetting","securityNotifications","checked"],
  ["#autoListsSetting","autoLists","checked"],
  ["#enterToSendSetting","enterToSend","checked"],
  ["#mediaVisibilitySetting","mediaVisibility","checked"],
  ["#stickerSuggestionsSetting","stickerSuggestions","checked"],
  ["#keepArchivedSetting","keepArchived","checked"],
  ["#messageSoundSetting","messageSound","checked"],
  ["#remindersSetting","reminders","checked"],
  ["#priorityNotificationsSetting","priorityNotifications","checked"],
  ["#reactionNotificationsSetting","reactionNotifications","checked"],
  ["#statusReactionSetting","statusReaction","checked"],
  ["#themeSetting","theme","value"],
  ["#fontSizeSetting","fontSize","value"],
  ["#orderNotificationsSetting","orderNotifications","checked"],
  ["#adNotificationsSetting","adNotifications","checked"],
  ["#autoDownloadSetting","autoDownload","value"],
  ["#dataSaverSetting","dataSaver","checked"],
  ["#customerActivitySetting","customerActivity","checked"],
  ["#highContrastSetting","highContrast","checked"],
  ["#reduceMotionSetting","reduceMotion","checked"],
  ["#settingsLanguage","language","value"]
];
for(const [sel,key,prop] of binds){
  $(sel)?.addEventListener("change",async e=>{
    prefs[key]=e.target[prop];
    if(key==="language"){
      localStorage.setItem("wbp_lang",prefs.language);
      window.WBP_SET_LANG?.(prefs.language);
      const lang=$("#lang");if(lang)lang.value=prefs.language;
      if($("#settingsLanguageLabel"))$("#settingsLanguageLabel").textContent=languageLabel(prefs.language);
    }
    await savePrefs();
    toast("Paramètre enregistré.");
  });
}

$("#createListBtn")?.addEventListener("click",async()=>{
  const input=$("#newListName"),name=input?.value.trim();
  if(!name)return toast("Mete non lis la.");
  prefs.customerLists=Array.isArray(prefs.customerLists)?prefs.customerLists:[];
  if(!prefs.customerLists.includes(name))prefs.customerLists.push(name);
  input.value="";renderLists();await savePrefs();toast("Lis kreye.");
});
$("#openProfileFromSettings")?.addEventListener("click",()=>document.querySelector('[data-go="profile"]')?.click());
$("#logoutFromSettings")?.addEventListener("click",()=>auth&&signOut(auth));
$("#settingsSocialBtn")?.addEventListener("click",()=>toast("Facebook/Instagram ap aktive lè API Meta yo konekte."));
$("#inviteContactBtn")?.addEventListener("click",async()=>{
  const url=location.origin+location.pathname;
  const data={title:"Whatssap Business Pro",text:"Vin jwenn mwen sou Whatssap Business Pro",url};
  try{
    if(navigator.share)await navigator.share(data);
    else{await navigator.clipboard.writeText(url);toast("Lyen envitasyon kopye.");}
  }catch{}
});

loadLocal();
if(configured())onAuthStateChanged(auth,async u=>{
  user=u;
  if(!u)return;
  await loadRemote();
  if($("#settingsPhone"))$("#settingsPhone").textContent=u.phoneNumber||"—";
  try{
    const p=await getDoc(doc(db,"publicProfiles",u.uid));
    if(p.exists()){
      const d=p.data();
      if($("#settingsDisplayName"))$("#settingsDisplayName").textContent=d.displayName||d.username||"Mon profil";
      if($("#settingsAbout"))$("#settingsAbout").textContent=d.bio||"Whatsapp Business Pro";
      if($("#settingsAvatar")&&d.photoUrl)$("#settingsAvatar").src=d.photoUrl;
    }
  }catch{}
});
