import {firebaseConfig} from "./firebase-config.js";
import {getApps,getApp,initializeApp} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import {getAuth,onAuthStateChanged} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import {getFirestore,doc,getDoc,setDoc,addDoc,updateDoc,deleteDoc,collection,query,where,getDocs,onSnapshot,serverTimestamp,arrayUnion} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";
import {getStorage,ref,uploadBytes,getDownloadURL} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-storage.js";

const $=s=>document.querySelector(s);
const $$=s=>[...document.querySelectorAll(s)];
const configured=()=>firebaseConfig.apiKey&&!String(firebaseConfig.apiKey).includes("YOUR_");
const toast=t=>{const e=$("#toast");if(!e)return;e.textContent=t;e.classList.add("show");setTimeout(()=>e.classList.remove("show"),2200)};
const norm=s=>String(s||"").trim().toLowerCase().replace(/[^a-z0-9_.-]/g,"");
const safe=s=>String(s||"file").replace(/[^a-zA-Z0-9._-]/g,"_");

let auth=null,db=null,storage=null,user=null,currentChat=null,currentPeer=null,typingOff=null,typingTimer=null;
let recorder=null,recordChunks=[],recordStream=null,recordStarted=0;

function ephemeralExpiresAtMs(){
  if(!user||!currentChat)return 0;
  try{
    const p=JSON.parse(localStorage.getItem("wbp_chatprefs_"+user.uid+"_"+currentChat)||"{}");
    const v=p.disappearingDuration||"off";
    const ms=v==="24h"?86400000:v==="7d"?604800000:v==="90d"?7776000000:0;
    return ms?Date.now()+ms:0;
  }catch{return 0}
}
function chatBlocked(){
  if(window.WBP_CHAT_BLOCKED||window.WBP_CHAT_BLOCKED_BY_PEER)return true;
  if(!user||!currentPeer)return false;
  return localStorage.getItem("wbp_block_"+user.uid+"_"+currentPeer)==="1";
}

if(configured()){
  const app=getApps().length?getApp():initializeApp(firebaseConfig);
  auth=getAuth(app);db=getFirestore(app);storage=getStorage(app);
}

$("#newGroupBtn")?.addEventListener("click",()=>$("#newGroupBox")?.classList.toggle("hidden"));

$("#createGroupBtn")?.addEventListener("click",async()=>{
  if(!user||!db)return toast("Konekte dabò.");
  const name=$("#groupName")?.value.trim();
  const usernames=($("#groupMembers")?.value||"").split(",").map(norm).filter(Boolean);
  if(!name)return toast("Mete non gwoup la.");
  if(!usernames.length)return toast("Ajoute omwen yon lòt manm.");
  if(usernames.length>49)return toast("Maksimòm 50 manm nan vèsyon sa a.");
  try{
    const members=new Map();
    members.set(user.uid,{id:user.uid,name:"Mwen"});
    for(const username of [...new Set(usernames)]){
      const s=await getDocs(query(collection(db,"publicProfiles"),where("username","==",username)));
      if(s.empty)throw new Error("@"+username+" pa jwenn.");
      const p=s.docs[0];
      if(p.id!==user.uid)members.set(p.id,{id:p.id,name:p.data().displayName||p.data().username||username});
    }
    if(members.size<2)throw new Error("Gwoup la bezwen omwen 2 moun.");
    const ids=[...members.keys()];
    const names={};
    members.forEach((m,id)=>names[id]=m.name);
    const cr=doc(collection(db,"chats"));
    await setDoc(cr,{
      type:"group",groupName:name,ownerId:user.uid,
      participants:ids,participantNames:names,
      lastMessage:"Gwoup kreye",createdAt:serverTimestamp(),updatedAt:serverTimestamp()
    });
    $("#groupName").value="";$("#groupMembers").value="";
    $("#newGroupBox").classList.add("hidden");
    toast("Gwoup kreye.");
  }catch(e){console.error(e);toast(e.message||"Gwoup la pa kreye.");}
});

async function sendMedia(file){
  if(!user||!currentChat||!file)return;
  if(chatBlocked())return toast("Fichye bloke nan diskisyon sa a.");
  const isImage=file.type.startsWith("image/");
  const allowed=isImage||file.type==="application/pdf"||/\.(docx?|xlsx?|txt)$/i.test(file.name);
  if(!allowed)return toast("Kalite fichye sa pa sipòte.");
  if(file.size>25*1024*1024)return toast("Fichye a dwe pi piti pase 25 MB.");
  try{
    const path="whatssap-business-pro/chat-media/"+user.uid+"/"+currentChat+"/"+crypto.randomUUID()+"-"+safe(file.name);
    const rr=ref(storage,path);
    const up=await uploadBytes(rr,file,{contentType:file.type||"application/octet-stream"});
    const mediaUrl=await getDownloadURL(up.ref);
    await addDoc(collection(db,"chats",currentChat,"messages"),{
      senderId:user.uid,type:isImage?"image":"document",
      mediaUrl,mediaPath:path,fileName:file.name,fileSize:file.size,
      readBy:[user.uid],expiresAtMs:ephemeralExpiresAtMs(),createdAt:serverTimestamp()
    });
    await updateDoc(doc(db,"chats",currentChat),{
      lastMessage:isImage?"📷 Foto":"📄 "+file.name.slice(0,60),
      updatedAt:serverTimestamp()
    });
    toast(isImage?"Foto voye.":"Dokiman voye.");
  }catch(e){console.error(e);toast("Fichye a pa t voye.");}
}
$("#attachBtn")?.addEventListener("click",()=>$("#chatAttachment")?.click());
$("#chatAttachment")?.addEventListener("change",async e=>{
  const file=e.target.files?.[0];
  if(file)await sendMedia(file);
  e.target.value="";
});

async function uploadAudioFile(file){
  if(!file||!user||!currentChat)return;
  if(chatBlocked())return toast("Mesaj vokal bloke nan diskisyon sa a.");
  if(file.size>25*1024*1024)return toast("Audio a dwe pi piti pase 25 MB.");
  try{
    const ext=(file.name.split(".").pop()||"audio").replace(/[^a-z0-9]/gi,"").slice(0,6)||"audio";
    const path="whatssap-business-pro/chat-media/"+user.uid+"/"+currentChat+"/"+crypto.randomUUID()+"-voice."+ext;
    const rr=ref(storage,path),up=await uploadBytes(rr,file,{contentType:file.type||"audio/*"}),mediaUrl=await getDownloadURL(up.ref);
    await addDoc(collection(db,"chats",currentChat,"messages"),{
      senderId:user.uid,type:"audio",mediaUrl,mediaPath:path,fileSize:file.size,
      readBy:[user.uid],expiresAtMs:ephemeralExpiresAtMs(),createdAt:serverTimestamp()
    });
    await updateDoc(doc(db,"chats",currentChat),{lastMessage:"🎤 Mesaj vokal",updatedAt:serverTimestamp()});
    toast("Mesaj vokal voye.");
  }catch(e){console.error(e);toast("Mesaj vokal la pa t voye.");}
}
$("#voiceFileFallback")?.addEventListener("change",async e=>{
  const file=e.target.files?.[0];
  if(file)await uploadAudioFile(file);
  e.target.value="";
});

async function startVoice(){
  if(chatBlocked())return toast("Mesaj vokal bloke nan diskisyon sa a.");
  if(!navigator.mediaDevices?.getUserMedia||typeof MediaRecorder==="undefined"){
    $("#voiceFileFallback")?.click();
    return toast("Sèvi ak anrejistrè telefòn lan pou voye audio.");
  }
  try{
    recordStream=await navigator.mediaDevices.getUserMedia({audio:true});
    const types=["audio/webm;codecs=opus","audio/webm","audio/mp4"];
    const mime=types.find(t=>MediaRecorder.isTypeSupported?.(t))||"";
    recorder=new MediaRecorder(recordStream,mime?{mimeType:mime}:undefined);
    recordChunks=[];recordStarted=Date.now();
    recorder.ondataavailable=e=>{if(e.data?.size)recordChunks.push(e.data)};
    recorder.onstop=uploadVoice;
    recorder.start(250);
    $("#voiceBtn").textContent="⏹️";
    $("#voiceStatus").textContent="🎙️ Ap anrejistre... peze ankò pou voye";
    $("#voiceStatus").classList.remove("hidden");
  }catch(e){console.error(e);$("#voiceFileFallback")?.click();toast("Mikwofòn dirèk pa disponib; chwazi oswa anrejistre yon audio.");}
}
async function stopVoice(){
  if(recorder?.state==="recording")recorder.stop();
}
async function uploadVoice(){
  const duration=Math.max(1,Math.round((Date.now()-recordStarted)/1000));
  const mime=recorder?.mimeType||"audio/webm";
  const blob=new Blob(recordChunks,{type:mime});
  recordStream?.getTracks().forEach(t=>t.stop());
  $("#voiceBtn").textContent="🎤";
  $("#voiceStatus").classList.add("hidden");
  if(!blob.size||!user||!currentChat)return;
  try{
    const ext=mime.includes("mp4")?"m4a":"webm";
    const path="whatssap-business-pro/chat-media/"+user.uid+"/"+currentChat+"/"+crypto.randomUUID()+"-voice."+ext;
    const rr=ref(storage,path),up=await uploadBytes(rr,blob,{contentType:mime}),mediaUrl=await getDownloadURL(up.ref);
    await addDoc(collection(db,"chats",currentChat,"messages"),{
      senderId:user.uid,type:"audio",mediaUrl,mediaPath:path,duration,
      fileSize:blob.size,readBy:[user.uid],expiresAtMs:ephemeralExpiresAtMs(),createdAt:serverTimestamp()
    });
    await updateDoc(doc(db,"chats",currentChat),{lastMessage:"🎤 Mesaj vokal",updatedAt:serverTimestamp()});
    toast("Mesaj vokal voye.");
  }catch(e){console.error(e);toast("Mesaj vokal la pa t voye.");}
}
$("#voiceBtn")?.addEventListener("click",()=>recorder?.state==="recording"?stopVoice():startVoice());

function stopTypingWatch(){
  typingOff?.();typingOff=null;
  if($("#typingIndicator"))$("#typingIndicator").classList.add("hidden");
}
function watchTyping(chatId){
  stopTypingWatch();
  if(!user||!chatId)return;
  typingOff=onSnapshot(collection(db,"chats",chatId,"typing"),s=>{
    const someone=s.docs.some(d=>d.id!==user.uid&&d.data().active===true);
    const el=$("#typingIndicator");if(el)el.classList.toggle("hidden",!someone);
  });
}
async function setTyping(){
  if(!user||!currentChat)return;
  const r=doc(db,"chats",currentChat,"typing",user.uid);
  await setDoc(r,{active:true,updatedAt:serverTimestamp()},{merge:true}).catch(()=>{});
  clearTimeout(typingTimer);
  typingTimer=setTimeout(()=>deleteDoc(r).catch(()=>{}),1300);
}
$("#messageText")?.addEventListener("input",setTyping);

async function markRead(messages=[]){
  if(!user||!currentChat)return;
  const unread=messages.filter(m=>m.senderId!==user.uid&&!(Array.isArray(m.readBy)&&m.readBy.includes(user.uid))).slice(-40);
  for(const m of unread){
    await updateDoc(doc(db,"chats",currentChat,"messages",m.id),{readBy:arrayUnion(user.uid)}).catch(()=>{});
  }
}


window.addEventListener("wbp-chat-open",e=>{
  currentChat=e.detail?.chatId||null;
  currentPeer=e.detail?.uid||null;
  watchTyping(currentChat);
});
window.addEventListener("wbp-messages-rendered",e=>{
  if(e.detail?.chatId===currentChat)markRead(e.detail.messages||[]);
});

if(configured())onAuthStateChanged(auth,u=>{
  user=u;
  if(!u){
    currentChat=null;stopTypingWatch();
    recordStream?.getTracks().forEach(t=>t.stop());
  }
});
