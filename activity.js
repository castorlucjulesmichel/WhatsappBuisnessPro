import {firebaseConfig} from "./firebase-config.js";
import {getApps,getApp,initializeApp} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import {getAuth,onAuthStateChanged} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import {getFirestore,collection,addDoc,serverTimestamp} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

const configured=()=>firebaseConfig.apiKey&&!String(firebaseConfig.apiKey).includes("YOUR_");
const queueKey="wbp_activity_queue_v1";
const sessionId=crypto.randomUUID();
let user=null,db=null,flushing=false,lastSignature="",lastAt=0;

if(configured()){
  const app=getApps().length?getApp():initializeApp(firebaseConfig);
  db=getFirestore(app);
  const auth=getAuth(app);
  onAuthStateChanged(auth,u=>{
    user=u||null;
    if(u){
      queueActivity({action:"session_login",target:"auth",page:activePage(),meta:{provider:u.providerData?.[0]?.providerId||"firebase"}},{remote:true});
      flushQueue();
    }
  });
}

function activePage(){
  const p=document.querySelector(".page.active[id]");
  return p?.id?.replace(/Page$/,"")||"unknown";
}
function cleanText(v,max=90){
  return String(v??"").replace(/\s+/g," ").trim().slice(0,max);
}
function safeMeta(meta={}){
  const out={};
  for(const [k,v] of Object.entries(meta||{})){
    if(v===undefined||v===null||v==="")continue;
    if(typeof v==="boolean"||typeof v==="number")out[k]=v;
    else out[k]=cleanText(v,140);
  }
  return out;
}
function readQueue(){
  try{
    const q=JSON.parse(localStorage.getItem(queueKey)||"[]");
    return Array.isArray(q)?q:[];
  }catch{return []}
}
function writeQueue(rows){
  localStorage.setItem(queueKey,JSON.stringify(rows.slice(-300)));
}
function makeRecord(payload={}){
  return {
    userId:user?.uid||"",
    action:cleanText(payload.action||"ui_action",60),
    target:cleanText(payload.target||"",120),
    page:cleanText(payload.page||activePage(),60),
    sessionId,
    clientAtMs:Date.now(),
    clientAt:new Date().toISOString(),
    online:navigator.onLine,
    meta:safeMeta(payload.meta)
  };
}
function queueActivity(payload={},opts={}){
  const rec=makeRecord(payload);
  const sig=[rec.action,rec.target,rec.page,JSON.stringify(rec.meta)].join("|");
  const now=Date.now();
  if(sig===lastSignature&&now-lastAt<700)return;
  lastSignature=sig;lastAt=now;
  const rows=readQueue();rows.push(rec);writeQueue(rows);
  if(opts.remote!==false)flushQueue();
}
async function sendRecord(rec){
  if(!user||!db)return false;
  await addDoc(collection(db,"userActivity"),{
    ...rec,userId:user.uid,createdAt:serverTimestamp()
  });
  return true;
}
async function flushQueue(){
  if(flushing||!user||!db||!navigator.onLine)return;
  flushing=true;
  try{
    let rows=readQueue();
    if(!rows.length)return;
    const remaining=[];
    for(const rec of rows.slice(-300)){
      try{await sendRecord(rec)}
      catch(e){
        console.warn("activity sync",e?.code||e);
        remaining.push(rec);
        if(e?.code==="permission-denied"||e?.code==="unauthenticated")break;
      }
    }
    const attempted=Math.max(0,rows.length-remaining.length);
    if(attempted>0)rows=remaining;
    writeQueue(rows);
  }finally{flushing=false}
}
function buttonTarget(el){
  return el.id||
    el.dataset?.go||
    el.dataset?.page||
    el.dataset?.settingTarget||
    el.dataset?.createAction||
    el.dataset?.marketMode||
    el.dataset?.walletAction||
    el.dataset?.chatFilter||
    cleanText(el.getAttribute("aria-label")||el.textContent||"button",80);
}
document.addEventListener("click",e=>{
  const b=e.target.closest("button,[role='button']");
  if(!b)return;
  queueActivity({
    action:"button_click",
    target:buttonTarget(b),
    meta:{
      elementId:b.id||"",
      dataGo:b.dataset?.go||"",
      dataPage:b.dataset?.page||"",
      disabled:b.disabled===true
    }
  });
},true);
document.addEventListener("submit",e=>{
  const f=e.target;
  queueActivity({action:"form_submit",target:f.id||"form",meta:{formId:f.id||""}});
},true);
document.addEventListener("change",e=>{
  const el=e.target;
  if(!el?.id)return;
  if(!(/Setting$/.test(el.id)||["lang","role","marketCategory","walletMethod","walletCurrency","exchangeFrom","exchangeTo"].includes(el.id)))return;
  queueActivity({action:"setting_change",target:el.id,meta:{control:el.tagName?.toLowerCase()||""}});
},true);
window.addEventListener("wbp-route-changed",e=>{
  queueActivity({action:"route_open",target:e.detail?.name||"",page:e.detail?.name||activePage()});
});
window.addEventListener("wbp-chat-open",e=>{
  queueActivity({action:"chat_open",target:e.detail?.chatId||"chat",page:"chat",meta:{peerUid:e.detail?.uid||""}});
});
window.addEventListener("wbp-start-call",e=>{
  queueActivity({action:"call_start",target:e.detail?.mode||"voice",page:"chat",meta:{chatId:e.detail?.chatId||""}});
});
window.addEventListener("online",()=>{queueActivity({action:"network_online",target:"network"},{remote:false});flushQueue()});
window.addEventListener("offline",()=>queueActivity({action:"network_offline",target:"network"},{remote:false}));
window.addEventListener("error",e=>queueActivity({
  action:"client_error",target:cleanText(e.message||"error",100),meta:{file:cleanText(e.filename||"",100),line:Number(e.lineno||0)}
},{remote:false}));
window.addEventListener("unhandledrejection",e=>queueActivity({
  action:"promise_rejection",target:cleanText(e.reason?.code||e.reason?.message||"rejection",100)
},{remote:false}));

window.WBP_ACTIVITY=(action,target="",meta={})=>queueActivity({action,target,meta});
window.WBP_ACTIVITY_FLUSH=flushQueue;
setInterval(flushQueue,15000);
