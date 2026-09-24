import {firebaseConfig} from "./firebase-config.js";
import {getApps,getApp,initializeApp} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import {getAuth,onAuthStateChanged} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import {getFirestore,doc,getDoc,setDoc,deleteDoc,collection,query,where,onSnapshot,getDocs,serverTimestamp,Timestamp} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";
import {getStorage,ref,uploadBytes,getBlob} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-storage.js";

const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const esc=s=>String(s??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]));
const norm=s=>String(s||"").trim().toLowerCase().replace(/[^a-z0-9_.-]/g,"");
const toast=t=>{const e=$("#toast");if(!e)return;e.textContent=t;e.classList.add("show");setTimeout(()=>e.classList.remove("show"),2200)};
const configured=()=>firebaseConfig.apiKey && !String(firebaseConfig.apiKey).includes("YOUR_");

let auth,db,storage,user=null,profile={},contacts=[],normalStatuses=[],sponsoredStatuses=[],offs=[];
const mediaCache=new Map();

if(configured()){
  const app=getApps().length?getApp():initializeApp(firebaseConfig);
  auth=getAuth(app);db=getFirestore(app);storage=getStorage(app);
}

function clear(){
  offs.forEach(f=>{try{f()}catch{}});
  offs=[];
  for(const url of mediaCache.values()) URL.revokeObjectURL(url);
  mediaCache.clear();
}
function alive(x){return (x.expiresAt?.toMillis?.()||0)>Date.now()}
function ageOf(p){
  const y=Number(p.birthYear||0);
  return y>1900 ? new Date().getFullYear()-y : null;
}
function matchesAudience(status){
  const a=status.boostAudience||{mode:"automatic"};
  if(a.mode==="automatic") return true;
  const country=String(profile.country||"").trim().toLowerCase();
  const wanted=String(a.country||"").trim().toLowerCase();
  if(wanted && country!==wanted) return false;
  const age=ageOf(profile);
  if(age===null) return false;
  return age>=Number(a.ageMin||18) && age<=Number(a.ageMax||65);
}
async function mediaUrl(s){
  if(!s.mediaPath)return "";
  if(mediaCache.has(s.id))return mediaCache.get(s.id);
  try{
    const blob=await getBlob(ref(storage,s.mediaPath));
    const url=URL.createObjectURL(blob);mediaCache.set(s.id,url);return url;
  }catch(e){console.warn("Status media denied/unavailable",e);return ""}
}
async function card(s,sponsored=false){
  const url=await mediaUrl(s);
  let body="";
  if(url && s.mediaType==="video") body=`<video src="${url}" controls playsinline preload="metadata"></video>`;
  else if(url) body=`<img src="${url}" alt="">`;
  else body=`<div class="statusText">${esc(s.text||"Status")}</div>`;
  const text=(url&&s.text)?`<div>${esc(s.text)}</div>`:"";
  return `<article class="statusCard">${sponsored?'<span class="sponsoredBadge">Sponsored</span>':""}${body}<div class="statusMeta"><b>@${esc(s.ownerUsername||"user")}</b>${text}</div></article>`;
}
async function render(){
  if($("#contactStatuses")){
    const list=normalStatuses.filter(alive);
    $("#contactStatuses").innerHTML=list.length?(await Promise.all(list.map(s=>card(s,false)))).join(""):'<p class="muted">Pa gen Status kontak aktif.</p>';
  }
  if($("#sponsoredStatuses")){
    const list=sponsoredStatuses.filter(x=>alive(x)&&x.boostActive===true&&matchesAudience(x));
    $("#sponsoredStatuses").innerHTML=list.length?(await Promise.all(list.map(s=>card(s,true)))).join(""):'<p class="muted">Pa gen Sponsored Status pou odyans ou kounye a.</p>';
  }
}
function renderContacts(){
  $("#contactList").innerHTML=contacts.length?contacts.map(c=>`<span class="contactChip">@${esc(c.username||c.displayName||c.id)} <button class="ghost" data-remove-contact="${c.id}">×</button></span>`).join(""):'<span class="muted">Pa gen kontak ankò.</span>';
  $$("[data-remove-contact]").forEach(b=>b.onclick=async()=>{await deleteDoc(doc(db,"users",user.uid,"contacts",b.dataset.removeContact));toast("Kontak retire.")});
}
function watchContacts(){
  const off=onSnapshot(collection(db,"users",user.uid,"contacts"),async s=>{
    contacts=s.docs.map(d=>({id:d.id,...d.data()}));renderContacts();watchNormalStatuses();
  });
  offs.push(off);
}
let normalOffs=[];
function clearNormal(){normalOffs.forEach(f=>{try{f()}catch{}});normalOffs=[]}
function watchNormalStatuses(){
  clearNormal();normalStatuses=[];
  const ownerIds=[user.uid,...contacts.map(c=>c.id)];
  const chunks=[];for(let i=0;i<ownerIds.length;i+=30)chunks.push(ownerIds.slice(i,i+30));
  for(const ids of chunks){
    const q=query(collection(db,"statuses"),where("ownerId","in",ids));
    const off=onSnapshot(q,s=>{
      const byChunk=s.docs.map(d=>({id:d.id,...d.data()})).filter(x=>x.boostActive!==true||ids.includes(x.ownerId));
      const other=normalStatuses.filter(x=>!ids.includes(x.ownerId));
      normalStatuses=[...other,...byChunk].sort((a,b)=>(b.createdAt?.seconds||0)-(a.createdAt?.seconds||0));
      render();
    },e=>console.warn("Status contacts",e));
    normalOffs.push(off);
  }
}
function watchSponsored(){
  const q=query(collection(db,"statuses"),where("boostActive","==",true));
  const off=onSnapshot(q,s=>{
    sponsoredStatuses=s.docs.map(d=>({id:d.id,...d.data()})).sort((a,b)=>(b.createdAt?.seconds||0)-(a.createdAt?.seconds||0));
    render();
  },e=>console.warn("Sponsored status",e));
  offs.push(off);
}

$("#newStatusBtn")?.addEventListener("click",()=>$("#statusForm")?.classList.toggle("hidden"));
$("#statusForm")?.addEventListener("submit",async e=>{
  e.preventDefault();
  if(!user)return toast("Konekte dabò.");
  const text=$("#statusText").value.trim(),file=$("#statusMedia").files[0];
  if(!text&&!file)return toast("Ekri yon tèks oswa chwazi foto/videyo.");
  if(file&&file.size>80*1024*1024)return toast("Fichye a twò gwo.");
  const sr=doc(collection(db,"statuses"));
  const mediaType=file?(file.type.startsWith("video/")?"video":"image"):"text";
  const mediaPath=file?`whatssap-business-pro/statuses/${user.uid}/${sr.id}/${crypto.randomUUID()}-${file.name.replace(/[^a-zA-Z0-9._-]/g,"_")}`:"";
  const expiresAt=Timestamp.fromMillis(Date.now()+24*60*60*1000);
  try{
    await setDoc(sr,{
      ownerId:user.uid,ownerUsername:profile.username||"",ownerName:profile.displayName||"",
      text,mediaType,mediaPath,boostActive:false,boostAudience:{mode:"contacts"},
      boostEndsAt:null,createdAt:serverTimestamp(),expiresAt
    });
    if(file)await uploadBytes(ref(storage,mediaPath),file,{contentType:file.type});
    e.target.reset();$("#statusForm").classList.add("hidden");toast("Status pibliye pou 24 èdtan.");
  }catch(err){
    console.error(err);
    try{await deleteDoc(sr)}catch{}
    toast("Status pa t pibliye.");
  }
});
$("#addContactBtn")?.addEventListener("click",async()=>{
  const username=norm($("#contactUsername").value);
  if(!username)return toast("Mete username kontak la.");
  const q=query(collection(db,"publicProfiles"),where("username","==",username));
  const s=await getDocs(q);
  if(s.empty)return toast("Username pa jwenn.");
  const target=s.docs[0];
  if(target.id===user.uid)return toast("Ou pa ka ajoute tèt ou.");
  await setDoc(doc(db,"users",user.uid,"contacts",target.id),{
    uid:target.id,username:target.data().username||username,displayName:target.data().displayName||username,addedAt:serverTimestamp()
  });
  $("#contactUsername").value="";toast("Kontak ajoute.");
});

if(configured())onAuthStateChanged(auth,async u=>{
  clear();clearNormal();user=u;if(!u)return;
  const p=await getDoc(doc(db,"publicProfiles",u.uid));profile=p.exists()?p.data():{};
  watchContacts();watchSponsored();
});
