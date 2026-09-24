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
if(configured()){const app=getApps().length?getApp():initializeApp(firebaseConfig);auth=getAuth(app);db=getFirestore(app)}

function go(name){document.querySelector('nav button[data-page="'+name+'"]')?.click()||document.querySelector('[data-go="'+name+'"]')?.click()}
function showPage(name){
  $$(".page").forEach(x=>x.classList.remove("active"));
  $("#"+name+"Page")?.classList.add("active");
  document.body.classList.toggle("waMainTab",name==="chat"||name==="calls");
}
function render(){
  const q=($("#contactPickerSearch")?.value||"").trim().toLowerCase();
  const rows=contacts.filter(c=>!q||((c.displayName||"")+" "+(c.username||"")+" "+(c.phone||"")).toLowerCase().includes(q));
  if($("#contactCountLabel"))$("#contactCountLabel").textContent=contacts.length+" contact"+(contacts.length===1?"":"s");
  const box=$("#contactPickerList");if(!box)return;
  box.innerHTML=rows.length?rows.map(c=>`<button class="waContactPerson" data-contact-uid="${esc(c.contactUid||"")}" data-contact-name="${esc(c.displayName||c.username||c.phone||"Contact")}">
    <span class="waPersonAvatar">${esc((c.displayName||c.username||"?").charAt(0).toUpperCase())}</span>
    <span><b>${esc(c.displayName||c.username||c.phone||"Contact")}</b><small>${esc(c.username?("@"+c.username):(c.phone||""))}</small></span>
  </button>`).join(""):'<p class="muted">Aucun contact pour le moment.</p>';
  $$("[data-contact-uid]").forEach(b=>b.onclick=()=>startChat(b.dataset.contactUid,b.dataset.contactName));
}
async function startChat(uid,name){
  if(!user||!uid)return toast("Ce contact n’est pas encore inscrit dans l’application.");
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
$("#newChatBtn")?.addEventListener("click",e=>{e.preventDefault();showPage("contactPicker")});
$("#pickerNewContactBtn")?.addEventListener("click",()=>showPage("newContact"));
$("#pickerNewGroupBtn")?.addEventListener("click",()=>{showPage("chat");setTimeout(()=>$("#newGroupBox")?.classList.remove("hidden"),50)});
$("#contactPickerSearchBtn")?.addEventListener("click",()=>$("#contactPickerSearch")?.classList.toggle("hidden"));
$("#contactPickerSearch")?.addEventListener("input",render);
$("#newContactForm")?.addEventListener("submit",async e=>{
  e.preventDefault();
  if(!user)return;
  const username=norm($("#contactProfileName")?.value);
  if(!username)return toast("Entrez le nom de profil / username.");
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
  toast(target?"Contact enregistré.":"Contact enregistré localement; il pourra être contacté lorsqu’il rejoindra l’application.");
  e.target.reset();showPage("contactPicker");
});
onAuthStateChanged(auth,u=>{user=u;if(u)watchContacts();else{off?.();contacts=[]}});
