import {firebaseConfig} from "./firebase-config.js";
import {getApps,getApp,initializeApp} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import {getAuth,onAuthStateChanged} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import {getFirestore,doc,getDoc,setDoc,collection,query,where,getDocs,onSnapshot,serverTimestamp} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const toast=t=>{const e=$("#toast");if(!e)return;e.textContent=t;e.classList.add("show");setTimeout(()=>e.classList.remove("show"),2300)};
const esc=s=>String(s??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]));
const norm=s=>String(s||"").trim().toLowerCase().replace(/[^a-z0-9_.-]/g,"");
const configured=()=>firebaseConfig.apiKey&&!String(firebaseConfig.apiKey).includes("YOUR_");
let auth=null,db=null,user=null,contacts=[],off=null;

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

function go(name){document.querySelector('nav button[data-page="'+name+'"]')?.click()||document.querySelector('[data-go="'+name+'"]')?.click()}
function showPage(name){
  $$(".page").forEach(x=>x.classList.remove("active"));
  $("#"+name+"Page")?.classList.add("active");
  document.body.classList.toggle("waMainTab",name==="chat"||name==="calls");
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
async function importPhoneContacts(){
  if(!user)return;
  if(!("contacts" in navigator)||typeof navigator.contacts?.select!=="function"){
    toast(window.WBP_T?.("Phone contacts are not supported in this browser. Open the app in Chrome on Android.")||"Phone contacts are not supported in this browser. Open the app in Chrome on Android.");
    return;
  }
  try{
    const selected=await navigator.contacts.select(["name","tel"],{multiple:true});
    if(!selected?.length)return;
    let imported=0;
    for(const item of selected){
      const name=String(item.name?.[0]||"Contact").trim()||"Contact";
      const numbers=(item.tel||[]).map(normalizePhone).filter(Boolean);
      for(const phone of numbers){
        const existing=contacts.find(x=>normalizePhone(x.phone)===phone);
        const id=existing?.id||await phoneDocId(phone);
        await setDoc(doc(db,"users",user.uid,"contacts",id),{
          contactUid:existing?.contactUid||"",
          username:existing?.username||"",
          displayName:name,
          phone,
          importedFromPhone:true,
          updatedAt:serverTimestamp(),
          createdAt:existing?.createdAt||serverTimestamp()
        },{merge:true});
        imported++;
      }
    }
    toast((window.WBP_T?.("Contacts imported")||"Contacts imported")+": "+imported);
  }catch(e){
    if(e?.name==="AbortError")return;
    console.warn("contact picker",e);
    toast(window.WBP_T?.("Unable to import phone contacts.")||"Unable to import phone contacts.");
  }
}
function render(){
  const q=($("#contactPickerSearch")?.value||"").trim().toLowerCase();
  const rows=contacts.filter(c=>!q||((c.displayName||"")+" "+(c.username||"")+" "+(c.phone||"")).toLowerCase().includes(q));
  if($("#contactCountLabel"))$("#contactCountLabel").textContent=window.WBP_T?.(contacts.length+" contacts")||contacts.length+" contacts";
  const box=$("#contactPickerList");if(!box)return;
  box.innerHTML=rows.length?rows.map(c=>{
    const name=esc(c.displayName||c.username||c.phone||"Contact");
    const subtitle=esc(c.phone||(c.username?("@"+c.username):""));
    const avatar=esc((c.displayName||c.username||"?").charAt(0).toUpperCase());
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
$("#selectAllContactsBtn")?.addEventListener("click",async()=>{
  toast(window.WBP_T?.("Android will ask you to confirm the contacts to share.")||"Android will ask you to confirm the contacts to share.");
  await importPhoneContacts();
});
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
async function startChat(uid,name){
  if(!user||!uid)return;
  const me=await getDoc(doc(db,"publicProfiles",user.uid));
  const ids=[user.uid,uid].sort(),id=ids.join("__");
  const names={[user.uid]:me.data()?.displayName||me.data()?.username||user.phoneNumber||"User",[uid]:name||"Contact"};
  await setDoc(doc(db,"chats",id),{type:"direct",participants:ids,participantNames:names,lastMessage:"",updatedAt:serverTimestamp()},{merge:true});
  showPage("chat");
  setTimeout(()=>document.querySelector('[data-chat="'+id+'"]')?.click(),250);
}
function watchContacts(){
  off?.();
  off=onSnapshot(collection(db,"users",user.uid,"contacts"),snap=>{
    contacts=snap.docs.map(d=>({id:d.id,...d.data()}));
    render();
  });
}
$("#newChatBtn")?.addEventListener("click",async e=>{e.preventDefault();showPage("contactPicker");if(!contacts.length)await importPhoneContacts();});
$("#pickerNewContactBtn")?.addEventListener("click",()=>showPage("newContact"));
$("#importPhoneContactsBtn")?.addEventListener("click",importPhoneContacts);
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
onAuthStateChanged(auth,u=>{user=u;if(u)watchContacts();else{off?.();contacts=[]}});
