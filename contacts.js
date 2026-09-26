import {firebaseConfig} from "./firebase-config.js";
import {getApps,getApp,initializeApp} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import {getAuth,onAuthStateChanged} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import {getFirestore,doc,getDoc,setDoc,collection,query,where,getDocs,onSnapshot,serverTimestamp} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const toast=t=>{const e=$("#toast");if(!e)return;e.textContent=t;e.classList.add("show");setTimeout(()=>e.classList.remove("show"),2300)};
const esc=s=>String(s??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]));
const norm=s=>String(s||"").trim().toLowerCase().replace(/[^a-z0-9_.-]/g,"");
const configured=()=>firebaseConfig.apiKey&&!String(firebaseConfig.apiKey).includes("YOUR_");
let auth=null,db=null,user=null,accountPhone="",contacts=[],off=null,nativePhoneContacts=[],nativeSelectedContacts=new Set();

const COUNTRY_CODES = [
["HT","+509"],["US","+1"],["CA","+1"],["FR","+33"],["GB","+44"],["ES","+34"],["DO","+1809"],["DO","+1829"],["DO","+1849"],
["AF","+93"],["AL","+355"],["DZ","+213"],["AS","+1684"],["AD","+376"],["AO","+244"],["AI","+1264"],["AQ","+672"],["AG","+1268"],["AR","+54"],["AM","+374"],["AW","+297"],["AU","+61"],["AT","+43"],["AZ","+994"],
["BS","+1242"],["BH","+973"],["BD","+880"],["BB","+1246"],["BY","+375"],["BE","+32"],["BZ","+501"],["BJ","+229"],["BM","+1441"],["BT","+975"],["BO","+591"],["BQ","+599"],["BA","+387"],["BW","+267"],["BR","+55"],["IO","+246"],["BN","+673"],["BG","+359"],["BF","+226"],["BI","+257"],
["CV","+238"],["KH","+855"],["CM","+237"],["KY","+1345"],["CF","+236"],["TD","+235"],["CL","+56"],["CN","+86"],["CX","+61"],["CC","+61"],["CO","+57"],["KM","+269"],["CG","+242"],["CD","+243"],["CK","+682"],["CR","+506"],["CI","+225"],["HR","+385"],["CU","+53"],["CW","+599"],["CY","+357"],["CZ","+420"],
["DK","+45"],["DJ","+253"],["DM","+1767"],["EC","+593"],["EG","+20"],["SV","+503"],["GQ","+240"],["ER","+291"],["EE","+372"],["SZ","+268"],["ET","+251"],
["FK","+500"],["FO","+298"],["FJ","+679"],["FI","+358"],["GF","+594"],["PF","+689"],["GA","+241"],["GM","+220"],["GE","+995"],["DE","+49"],["GH","+233"],["GI","+350"],["GR","+30"],["GL","+299"],["GD","+1473"],["GP","+590"],["GU","+1671"],["GT","+502"],["GG","+44"],["GN","+224"],["GW","+245"],["GY","+592"],
["HN","+504"],["HK","+852"],["HU","+36"],["IS","+354"],["IN","+91"],["ID","+62"],["IR","+98"],["IQ","+964"],["IE","+353"],["IM","+44"],["IL","+972"],["IT","+39"],
["JM","+1876"],["JM","+1658"],["JP","+81"],["JE","+44"],["JO","+962"],["KZ","+7"],["KE","+254"],["KI","+686"],["KP","+850"],["KR","+82"],["XK","+383"],["KW","+965"],["KG","+996"],
["LA","+856"],["LV","+371"],["LB","+961"],["LS","+266"],["LR","+231"],["LY","+218"],["LI","+423"],["LT","+370"],["LU","+352"],["MO","+853"],["MG","+261"],["MW","+265"],["MY","+60"],["MV","+960"],["ML","+223"],["MT","+356"],["MH","+692"],["MQ","+596"],["MR","+222"],["MU","+230"],["YT","+262"],["MX","+52"],["FM","+691"],["MD","+373"],["MC","+377"],["MN","+976"],["ME","+382"],["MS","+1664"],["MA","+212"],["MZ","+258"],["MM","+95"],
["NA","+264"],["NR","+674"],["NP","+977"],["NL","+31"],["NC","+687"],["NZ","+64"],["NI","+505"],["NE","+227"],["NG","+234"],["NU","+683"],["NF","+672"],["MK","+389"],["MP","+1670"],["NO","+47"],
["OM","+968"],["PK","+92"],["PW","+680"],["PS","+970"],["PA","+507"],["PG","+675"],["PY","+595"],["PE","+51"],["PH","+63"],["PN","+64"],["PL","+48"],["PT","+351"],["PR","+1787"],["PR","+1939"],
["QA","+974"],["RE","+262"],["RO","+40"],["RU","+7"],["RW","+250"],["BL","+590"],["SH","+290"],["KN","+1869"],["LC","+1758"],["MF","+590"],["PM","+508"],["VC","+1784"],["WS","+685"],["SM","+378"],["ST","+239"],["SA","+966"],["SN","+221"],["RS","+381"],["SC","+248"],["SL","+232"],["SG","+65"],["SX","+1721"],["SK","+421"],["SI","+386"],["SB","+677"],["SO","+252"],["ZA","+27"],["GS","+500"],["SS","+211"],["LK","+94"],["SD","+249"],["SR","+597"],["SJ","+47"],["SE","+46"],["CH","+41"],["SY","+963"],
["TW","+886"],["TJ","+992"],["TZ","+255"],["TH","+66"],["TL","+670"],["TG","+228"],["TK","+690"],["TO","+676"],["TT","+1868"],["TN","+216"],["TR","+90"],["TM","+993"],["TC","+1649"],["TV","+688"],
["UG","+256"],["UA","+380"],["AE","+971"],["UY","+598"],["UZ","+998"],["VU","+678"],["VA","+39"],["VE","+58"],["VN","+84"],["VG","+1284"],["VI","+1340"],["WF","+681"],["EH","+212"],["YE","+967"],["ZM","+260"],["ZW","+263"]
];
function populateCountryCodes(){
  const sel=$("#contactCountryCode"); if(!sel)return;
  sel.innerHTML=COUNTRY_CODES.map(([iso,code])=>'<option value="'+code+'"'+(iso==="HT"&&code==="+509"?' selected':'')+'>'+iso+' '+code+'</option>').join("");
}
populateCountryCodes();

if(configured()){const app=getApps().length?getApp():initializeApp(firebaseConfig);auth=getAuth(app);db=getFirestore(app)}

function go(name){return typeof window.WBP_ROUTE==="function"?window.WBP_ROUTE(name):showPage(name)}
function showPage(name){
  if(typeof window.WBP_ROUTE==="function")return window.WBP_ROUTE(name);
  $(".page").forEach(x=>x.classList.remove("active"));
  $("#"+name+"Page")?.classList.add("active");
  document.body.classList.toggle("waMainTab",name==="chat"||name==="calls");
  return true;
}

function normalizePhone(v){
  let p=String(v||"").trim().replace(/[^0-9+]/g,"");
  if(p.startsWith("00"))p="+"+p.slice(2);
  return p;
}
async function phoneDocId(phone){
  const p=normalizePhone(phone);
  try{
    if(crypto?.subtle){
      const bytes=new TextEncoder().encode(p);
      const hash=await crypto.subtle.digest("SHA-256",bytes);
      return "phone_"+[...new Uint8Array(hash)].map(b=>b.toString(16).padStart(2,"0")).join("").slice(0,32);
    }
  }catch{}
  return "phone_"+p.replace(/[^0-9]/g,"");
}
async function lookupAppUserByPhone(phone){
  if(!user)return null;
  const p=normalizePhone(phone);
  if(!p)return null;
  try{
    const id=await phoneDocId(p);
    const snap=await getDoc(doc(db,"phoneDirectory",id));
    if(!snap.exists())return null;
    const data=snap.data()||{};
    return data.uid?{uid:data.uid,username:data.username||"",displayName:data.displayName||""}:null;
  }catch(e){
    if(e?.code!=="permission-denied")console.warn("phone lookup",e);
    return null;
  }
}

let resolvingContactLinks=false;
async function refreshDirectoryLinks(rows=contacts){
  if(resolvingContactLinks||!user||!Array.isArray(rows)||!rows.length)return;
  resolvingContactLinks=true;
  try{
    for(const contact of rows){
      const phone=normalizePhone(contact.phone||"");
      if(!phone)continue;
      const isSelf=phone===normalizePhone(accountPhone||user.phoneNumber||"");
      let targetUid=isSelf?user.uid:"";
      let targetUsername=contact.username||"";
      if(!isSelf){
        const found=await lookupAppUserByPhone(phone);
        targetUid=found?.uid||"";
        if(found?.username)targetUsername=found.username;
      }
      if(targetUid&&contact.contactUid!==targetUid){
        await setDoc(doc(db,"users",user.uid,"contacts",contact.id),{
          contactUid:targetUid,
          username:targetUsername,
          linkedByPhone:true,
          updatedAt:serverTimestamp()
        },{merge:true});
      }else if(!targetUid&&contact.linkedByPhone===true&&contact.contactUid){
        await setDoc(doc(db,"users",user.uid,"contacts",contact.id),{
          contactUid:"",
          linkedByPhone:false,
          updatedAt:serverTimestamp()
        },{merge:true});
      }
    }
  }catch(e){
    console.warn("refresh phone links",e);
  }finally{
    resolvingContactLinks=false;
  }
}

async function saveImportedContacts(items){
  if(!user||!Array.isArray(items)||!items.length)return {imported:0,skipped:0,failed:0};

  const unique=new Map();
  for(const item of items){
    const phone=normalizePhone(item?.phone||"");
    if(!phone)continue;
    const name=String(item?.name||"Contact").trim()||"Contact";
    if(!unique.has(phone))unique.set(phone,{name,phone});
  }

  const existingPhones=new Set(
    contacts.map(x=>normalizePhone(x.phone)).filter(Boolean)
  );

  let imported=0,skipped=0,failed=0;
  const pending=[];

  for(const item of unique.values()){
    if(existingPhones.has(item.phone)){
      skipped++;
      continue;
    }
    const id=await phoneDocId(item.phone);
    pending.push({id,...item});
  }

  const CHUNK=15;
  for(let i=0;i<pending.length;i+=CHUNK){
    const chunk=pending.slice(i,i+CHUNK);
    const results=await Promise.allSettled(chunk.map(async item=>{
      const ref=doc(db,"users",user.uid,"contacts",item.id);
      const snap=await getDoc(ref);
      if(snap.exists())return "skipped";
      const isSelfPhone=normalizePhone(accountPhone||user?.phoneNumber||"")===item.phone;
      const found=isSelfPhone?{uid:user.uid,username:""}:await lookupAppUserByPhone(item.phone);
      await setDoc(ref,{
        contactUid:found?.uid||"",
        username:found?.username||"",
        displayName:item.name,
        phone:item.phone,
        importedFromPhone:true,
        isSelfContact:isSelfPhone,
        createdAt:serverTimestamp(),
        updatedAt:serverTimestamp()
      });
      return "imported";
    }));

    for(const r of results){
      if(r.status==="fulfilled"){
        if(r.value==="skipped")skipped++;
        else imported++;
      }else{
        failed++;
        console.warn("contact import write failed",r.reason?.code||r.reason);
      }
    }
  }

  return {imported,skipped,failed};
}
function showImportResult(result){
  const r=result||{imported:0,skipped:0,failed:0};
  const base=(window.WBP_T?.("Contacts imported")||"Contacts imported")+": "+r.imported;
  const skipped=r.skipped?" • "+(window.WBP_T?.("Already present")||"Already present")+": "+r.skipped:"";
  const failed=r.failed?" • "+(window.WBP_T?.("Failed")||"Failed")+": "+r.failed:"";
  toast(base+skipped+failed);
}
async function importPhoneContacts(){
  if(!user)return;
  if(!("contacts" in navigator)||typeof navigator.contacts?.select!=="function"){
    toast(window.WBP_T?.("Phone contacts are not supported in this browser. Open the app in Chrome on Android.")||"Phone contacts are not supported in this browser. Open the app in Chrome on Android.");
    return;
  }
  try{
    const selected=await navigator.contacts.select(["name","tel"],{multiple:true});
    if(!selected?.length)return;
    const flat=[];
    for(const item of selected){
      const name=String(item.name?.[0]||"Contact").trim()||"Contact";
      for(const phone of (item.tel||[]))flat.push({name,phone});
    }
    const result=await saveImportedContacts(flat);
    showImportResult(result);
  }catch(e){
    if(e?.name==="AbortError")return;
    console.warn("contact picker",e);
    toast(window.WBP_T?.("Unable to import phone contacts.")||"Unable to import phone contacts.");
  }
}
window.WBP_ANDROID_CONTACTS_IMPORTED=async raw=>{
  try{
    const list=Array.isArray(raw)?raw:JSON.parse(String(raw||"[]"));
    const result=await saveImportedContacts(list);
    showImportResult(result);
  }catch(e){
    console.warn("native contact import",e);
    toast(window.WBP_T?.("Unable to import phone contacts.")||"Unable to import phone contacts.");
  }
};
window.WBP_ANDROID_CONTACTS_DENIED=()=>{
  toast(window.WBP_T?.("Contacts permission was denied.")||"Contacts permission was denied.");
};
function nativeContactsAvailable(){
  try{return !!window.AndroidContacts?.isAvailable?.()}catch{return false}
}
function nativeSelectorSupported(){
  try{
    return nativeContactsAvailable() && typeof window.AndroidContacts?.openContactSelector==="function";
  }catch{return false}
}
function openNativeContactSelector(){
  if(!nativeSelectorSupported())return false;
  window.AndroidContacts.openContactSelector();
  return true;
}
function closeNativeContactSelector(){
  $("#nativeContactSelector")?.classList.add("hidden");
  $("#nativeContactSelector")?.setAttribute("aria-hidden","true");
}
function nativeSelectionLabel(){
  const n=nativeSelectedContacts.size;
  const l=window.WBP_GET_LANG?.()||"ht";
  if(l==="fr")return n+" sélectionné"+(n>1?"s":"");
  if(l==="es")return n+" seleccionado"+(n===1?"":"s");
  if(l==="en")return n+" selected";
  return n+" chwazi";
}
function renderNativePhoneContacts(){
  const box=$("#nativeContactList");if(!box)return;
  const q=($("#nativeContactSearch")?.value||"").trim().toLowerCase();
  const rows=nativePhoneContacts.filter(x=>!q||((x.name||"")+" "+(x.phone||"")).toLowerCase().includes(q));
  box.innerHTML=rows.map(item=>{
    const key=esc(item.phone);
    const checked=nativeSelectedContacts.has(item.phone)?" checked":"";
    const avatar=esc((item.name||"?").charAt(0).toUpperCase());
    return `<label class="nativeContactRow">
      <input type="checkbox" data-native-phone="${key}"${checked}>
      <span class="waPersonAvatar">${avatar}</span>
      <span class="nativeContactText"><b>${esc(item.name||"Contact")}</b><small>${esc(item.phone||"")}</small></span>
    </label>`;
  }).join("")||'<p class="muted">'+esc(window.WBP_T?.("Aucun contact pour le moment.")||"Aucun contact pour le moment.")+'</p>';

  $$("[data-native-phone]").forEach(cb=>cb.onchange=()=>{
    cb.checked?nativeSelectedContacts.add(cb.dataset.nativePhone):nativeSelectedContacts.delete(cb.dataset.nativePhone);
    updateNativeSelectorControls();
  });
  updateNativeSelectorControls();
}
function updateNativeSelectorControls(){
  const all=nativePhoneContacts.length>0&&nativeSelectedContacts.size===nativePhoneContacts.length;
  if($("#nativeSelectAllBtn"))$("#nativeSelectAllBtn").textContent=window.WBP_T?.(all?"Deselect all":"Select all")||(all?"Deselect all":"Select all");
  if($("#nativeContactSelectionCount"))$("#nativeContactSelectionCount").textContent=nativeSelectionLabel();
  if($("#importNativeSelectedBtn")){
    $("#importNativeSelectedBtn").disabled=nativeSelectedContacts.size===0;
    $("#importNativeSelectedBtn").textContent=(window.WBP_T?.("Import")||"Import")+" ("+nativeSelectedContacts.size+")";
  }
}
window.WBP_ANDROID_CONTACTS_FOR_SELECTION=raw=>{
  try{
    const list=Array.isArray(raw)?raw:JSON.parse(String(raw||"[]"));
    const unique=new Map();
    for(const item of list){
      const phone=normalizePhone(item?.phone||"");
      if(!phone)continue;
      if(!unique.has(phone))unique.set(phone,{name:String(item?.name||"Contact").trim()||"Contact",phone});
    }
    nativePhoneContacts=[...unique.values()];
    nativeSelectedContacts.clear();
    $("#nativeContactSearch")&&( $("#nativeContactSearch").value="" );
    $("#nativeContactSelector")?.classList.remove("hidden");
    $("#nativeContactSelector")?.setAttribute("aria-hidden","false");
    renderNativePhoneContacts();
  }catch(e){
    console.warn("native selector",e);
    toast(window.WBP_T?.("Unable to import phone contacts.")||"Unable to import phone contacts.");
  }
};
$("#nativeSelectAllBtn")?.addEventListener("click",()=>{
  const all=nativePhoneContacts.length>0&&nativeSelectedContacts.size===nativePhoneContacts.length;
  nativeSelectedContacts.clear();
  if(!all)nativePhoneContacts.forEach(x=>nativeSelectedContacts.add(x.phone));
  renderNativePhoneContacts();
});
$("#closeNativeContactSelector")?.addEventListener("click",closeNativeContactSelector);
$("#nativeContactSearch")?.addEventListener("input",renderNativePhoneContacts);
$("#importNativeSelectedBtn")?.addEventListener("click",async()=>{
  const selected=nativePhoneContacts.filter(x=>nativeSelectedContacts.has(x.phone));
  if(!selected.length)return;
  $("#importNativeSelectedBtn").disabled=true;
  const result=await saveImportedContacts(selected);
  showImportResult(result);
  closeNativeContactSelector();
});
window.addEventListener("wbp-language-changed",()=>{
  if(!$("#nativeContactSelector")?.classList.contains("hidden"))renderNativePhoneContacts();
});

function render(){
  const q=($("#contactPickerSearch")?.value||"").trim().toLowerCase();
  const rows=contacts.filter(c=>!q||((c.displayName||"")+" "+(c.username||"")+" "+(c.phone||"")).toLowerCase().includes(q));
  if($("#contactCountLabel"))$("#contactCountLabel").textContent=window.WBP_T?.(contacts.length+" contacts")||contacts.length+" contacts";
  const box=$("#contactPickerList");if(!box)return;
  box.innerHTML=rows.length?rows.map(c=>{
    const name=esc(c.displayName||c.username||c.phone||"Contact");
    const subtitle=esc(c.phone||(c.username?("@"+c.username):""));
    const avatar=esc((c.displayName||c.username||"?").charAt(0).toUpperCase());
    const isSelf=!!user && normalizePhone(c.phone||"")===normalizePhone(accountPhone||user.phoneNumber||"");
    if(isSelf){
      return `<div class="waContactPerson waContactSelfRow">
        <span class="waPersonAvatar">${avatar}</span>
        <span><b>${name}</b><small>${subtitle}</small></span>
        <span class="waSelfBadge">${esc(window.WBP_T?.("Vous")||"Vous")}</span>
      </div>`;
    }
    if(c.contactUid){
      return `<button class="waContactPerson" data-contact-uid="${esc(c.contactUid)}" data-contact-name="${name}">
        <span class="waPersonAvatar">${avatar}</span>
        <span><b>${name}</b><small>${subtitle}</small></span>
      </button>`;
    }
    return `<div class="waContactPerson waContactInviteRow">
      <span class="waPersonAvatar">${avatar}</span>
      <span><b>${name}</b><small>${subtitle}</small></span>
      <button class="waInviteBtn" type="button" data-invite-name="${name}" data-invite-phone="${esc(c.phone||"")}">${esc(window.WBP_T?.("Inviter")||"Inviter")}</button>
    </div>`;
  }).join(""):'<p class="muted">'+esc(window.WBP_T?.("Aucun contact pour le moment.")||"Aucun contact pour le moment.")+'</p>';
  $$("[data-contact-uid]").forEach(b=>b.onclick=()=>startChat(b.dataset.contactUid,b.dataset.contactName));
  $$("[data-invite-name]").forEach(b=>b.onclick=()=>inviteContact(b.dataset.inviteName,b.dataset.invitePhone));
}
async function inviteContact(name,phone){
  const url=location.origin+location.pathname;
  const text=(window.WBP_T?.("Join me on Whatsapp Business Pro")||"Join me on Whatsapp Business Pro")+"\n"+url;
  try{
    if(navigator.share){
      await navigator.share({title:"Whatsapp Business Pro",text,url});
      return;
    }
    await navigator.clipboard.writeText(text);
    toast(window.WBP_T?.("Invitation link copied.")||"Invitation link copied.");
  }catch(e){
    if(e?.name!=="AbortError")toast(window.WBP_T?.("Invitation link copied.")||"Invitation link copied.");
  }
}
async function waitForOwnUserDoc(maxMs=5000){
  if(!user)return false;
  const started=Date.now();
  while(Date.now()-started<maxMs){
    try{
      const s=await getDoc(doc(db,"users",user.uid));
      if(s.exists()&&s.data()?.blocked!==true)return true;
    }catch(e){
      if(e?.code!=="permission-denied")console.warn("own user readiness",e);
    }
    await new Promise(r=>setTimeout(r,250));
  }
  return false;
}
async function waitForChatOpener(maxMs=5000){
  const started=Date.now();
  while(Date.now()-started<maxMs){
    if(typeof window.WBP_OPEN_CHAT==="function")return window.WBP_OPEN_CHAT;
    await new Promise(r=>setTimeout(r,80));
  }
  return null;
}
async function ensureDirectChat(uid,name){
  if(!user||!uid)throw new Error("chat/missing-user");
  if(uid===user.uid)throw new Error("chat/self");
  const ready=await waitForOwnUserDoc();
  if(!ready){
    const e=new Error("Kont lan poko pare. Eseye ankò.");
    e.code="chat/account-not-ready";
    throw e;
  }
  const me=await getDoc(doc(db,"publicProfiles",user.uid));
  const ids=[user.uid,uid].sort();
  const id=ids.join("__");
  const myName=me.data()?.displayName||me.data()?.username||user.displayName||"User";
  const contactName=name||"Contact";
  const names={[user.uid]:myName,[uid]:contactName};
  const chatRef=doc(db,"chats",id);

  let existing=null;
  try{existing=await getDoc(chatRef)}catch(e){
    if(e?.code!=="permission-denied")throw e;
  }
  if(existing?.exists()){
    const p=existing.data()?.participants||[];
    if(!p.includes(user.uid)||!p.includes(uid)){
      const e=new Error("Chat la pa gen bon patisipan yo.");
      e.code="chat/invalid-participants";
      throw e;
    }
    return {id,contactName};
  }

  await setDoc(chatRef,{
    type:"direct",
    participants:ids,
    participantNames:names,
    lastMessage:"",
    updatedAt:serverTimestamp()
  });
  return {id,contactName};
}

async function startChat(uid,name){
  if(!user||!uid)return;
  try{
    const {id,contactName}=await ensureDirectChat(uid,name);

    if(typeof window.WBP_ROUTE==="function")window.WBP_ROUTE("chat");
    else showPage("chat");

    const opener=await waitForChatOpener();
    if(!opener){
      const e=new Error("Chat module not ready");
      e.code="chat/module-not-ready";
      throw e;
    }
    await opener(id,contactName);
  }catch(e){
    console.error("start contact chat",e);
    const code=e?.code||"chat/open-failed";
    toast((window.WBP_T?.("Unable to open chat.")||"Unable to open chat.")+" ("+code+")");
  }
}
function watchContacts(){
  off?.();
  off=onSnapshot(collection(db,"users",user.uid,"contacts"),snap=>{
    contacts=snap.docs.map(d=>({id:d.id,...d.data()}));
    render();
    refreshDirectoryLinks(contacts);
  });
}
$("#newChatBtn")?.addEventListener("click",e=>{e.preventDefault();showPage("contactPicker");});
$("#pickerNewContactBtn")?.addEventListener("click",()=>showPage("newContact"));
$("#importPhoneContactsBtn")?.addEventListener("click",async()=>{if(openNativeContactSelector())return;await importPhoneContacts();});
$("#pickerNewGroupBtn")?.addEventListener("click",()=>{showPage("chat");setTimeout(()=>$("#newGroupBox")?.classList.remove("hidden"),50)});
$("#contactPickerSearchBtn")?.addEventListener("click",()=>$("#contactPickerSearch")?.classList.toggle("hidden"));
$("#contactPickerSearch")?.addEventListener("input",render);
window.addEventListener("wbp-language-changed",render);
$("#newContactForm")?.addEventListener("submit",async e=>{
  e.preventDefault();
  if(!user)return;
  const username=norm($("#contactProfileName")?.value);
  if(!username)return toast(window.WBP_T?.("Entrez le nom de profil / username.")||"Entrez le nom de profil / username.");
  const found=await getDocs(query(collection(db,"publicProfiles"),where("username","==",username)));
  const target=found.docs[0]||null;
  const first=$("#contactFirstName")?.value.trim()||"",last=$("#contactLastName")?.value.trim()||"";
  const phone=($("#contactCountryCode")?.value||"")+($("#contactPhone")?.value.trim()||"");
  const displayName=(first+" "+last).trim()||target?.data()?.displayName||username;
  const contactUid=target?.id||"";
  const id=contactUid||("local_"+username.replace(/[^a-z0-9_-]/g,"_"));
  await setDoc(doc(db,"users",user.uid,"contacts",id),{
    contactUid,username,displayName,phone,
    syncPhone:$("#contactSyncPhone")?.checked===true,
    createdAt:serverTimestamp()
  });
  toast(window.WBP_T?.(target?"Contact enregistré.":"Contact enregistré localement; il pourra être contacté lorsqu’il rejoindra l’application.")||(target?"Contact enregistré.":"Contact enregistré localement; il pourra être contacté lorsqu’il rejoindra l’application."));
  e.target.reset();showPage("contactPicker");
});
onAuthStateChanged(auth,async u=>{user=u;if(u){try{const s=await getDoc(doc(db,"users",u.uid));accountPhone=s.data()?.phone||u.phoneNumber||""}catch{accountPhone=u.phoneNumber||""}watchContacts()}else{off?.();contacts=[];accountPhone=""}});
window.addEventListener("wbp-phone-updated",e=>{accountPhone=e.detail?.phone||accountPhone;render()});
