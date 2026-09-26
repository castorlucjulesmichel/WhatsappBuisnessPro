import {firebaseConfig} from "./firebase-config.js";
import {getApps,getApp,initializeApp} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import {getAuth,onAuthStateChanged} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import {getFirestore,collection,query,orderBy,limit,onSnapshot,addDoc,serverTimestamp} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

const $=s=>document.querySelector(s);
const configured=()=>firebaseConfig.apiKey&&!String(firebaseConfig.apiKey).includes("YOUR_");
const toast=t=>{const e=$("#toast");if(!e)return;e.textContent=t;e.classList.add("show");setTimeout(()=>e.classList.remove("show"),2300)};

let auth=null,db=null,user=null,currentChat="",currentPeer="",currentName="Contact";
let pc=null,localStream=null,activeCall=null,pendingOffer=null;
let contactsOff=null,signalOffs=new Map(),seenSignals=new Set(),candidateQueue=new Map();

if(configured()){
  const app=getApps().length?getApp():initializeApp(firebaseConfig);
  auth=getAuth(app);db=getFirestore(app);
}

function roomId(uid1,uid2){return [uid1,uid2].sort().join("__")}
function showOverlay(name,status,mode,incoming=false){
  $("#callPeerName").textContent=name||"Contact";
  $("#callStatus").textContent=status||"Connexion…";
  $("#callOverlay").classList.remove("hidden");
  $("#callOverlay").setAttribute("aria-hidden","false");
  $("#incomingCallActions").classList.toggle("hidden",!incoming);
  $("#activeCallActions").classList.toggle("hidden",incoming);
  $("#callAvatar").classList.toggle("hidden",mode==="video");
  $("#callRemoteVideo").classList.toggle("hidden",mode!=="video");
  $("#callLocalVideo").classList.toggle("hidden",mode!=="video");
  $("#toggleCallCameraBtn").classList.toggle("hidden",mode!=="video");
}
function hideOverlay(){
  $("#callOverlay").classList.add("hidden");
  $("#callOverlay").setAttribute("aria-hidden","true");
  $("#incomingCallActions").classList.add("hidden");
  $("#activeCallActions").classList.add("hidden");
}
function stopMedia(){
  localStream?.getTracks().forEach(t=>t.stop());
  localStream=null;
  const rv=$("#callRemoteVideo"),ra=$("#callRemoteAudio"),lv=$("#callLocalVideo");
  if(rv)rv.srcObject=null;if(ra)ra.srcObject=null;if(lv)lv.srcObject=null;
}
function cleanupCall(){
  try{pc?.close()}catch{}
  pc=null;stopMedia();activeCall=null;pendingOffer=null;hideOverlay();
}
async function sendSignal(chatId,to,signal){
  if(!user||!chatId||!to)return;
  await addDoc(collection(db,"chats",chatId,"messages"),{
    senderId:user.uid,
    type:"document",
    readBy:[user.uid],
    callSignal:{...signal,from:user.uid,to,sentAt:Date.now()},
    createdAt:serverTimestamp()
  });
}
function queueCandidate(callId,c){
  if(!candidateQueue.has(callId))candidateQueue.set(callId,[]);
  candidateQueue.get(callId).push(c);
}
async function flushCandidates(callId){
  const list=candidateQueue.get(callId)||[];
  for(const c of list){try{await pc?.addIceCandidate(c)}catch(e){console.warn("ice",e)}}
  candidateQueue.delete(callId);
}
function createPeer(call){
  pc=new RTCPeerConnection({
    iceServers:[
      {urls:"stun:stun.l.google.com:19302"},
      {urls:"stun:stun1.l.google.com:19302"}
    ]
  });
  localStream?.getTracks().forEach(t=>pc.addTrack(t,localStream));
  pc.ontrack=e=>{
    const stream=e.streams?.[0];if(!stream)return;
    if(call.mode==="video")$("#callRemoteVideo").srcObject=stream;
    else $("#callRemoteAudio").srcObject=stream;
    $("#callStatus").textContent="En appel";
  };
  pc.onicecandidate=e=>{
    if(!e.candidate||!activeCall)return;
    sendSignal(activeCall.chatId,activeCall.peerUid,{
      kind:"candidate",callId:activeCall.callId,candidate:e.candidate.toJSON()
    }).catch(console.warn);
  };
  pc.onconnectionstatechange=()=>{
    const s=pc?.connectionState;
    if(s==="connected")$("#callStatus").textContent="En appel";
    if(["failed","disconnected"].includes(s||""))$("#callStatus").textContent="Connexion interrompue";
    if(s==="closed")hideOverlay();
  };
}
async function getCallMedia(mode){
  if(!navigator.mediaDevices?.getUserMedia)throw new Error("media-unsupported");
  return navigator.mediaDevices.getUserMedia({audio:true,video:mode==="video"});
}
async function startOutgoing(mode,detail){
  if(!user)return toast("Konekte dabò.");
  if(!window.RTCPeerConnection)return toast("Navigatè sa pa sipòte apèl entènèt.");
  if(activeCall)return toast("Gen yon apèl ki deja an kou.");
  const chatId=detail?.chatId||currentChat,peerUid=detail?.uid||currentPeer,name=detail?.name||currentName;
  if(!chatId||!peerUid)return toast("Kontak apèl la pa disponib.");
  try{
    localStream=await getCallMedia(mode);
    const callId=crypto.randomUUID();
    activeCall={callId,chatId,peerUid,name,mode,role:"caller"};
    showOverlay(name,mode==="video"?"Appel vidéo…":"Appel vocal…",mode,false);
    if(mode==="video")$("#callLocalVideo").srcObject=localStream;
    createPeer(activeCall);
    const offer=await pc.createOffer();
    await pc.setLocalDescription(offer);
    await sendSignal(chatId,peerUid,{kind:"offer",callId,mode,sdp:pc.localDescription});
    $("#callStatus").textContent="Sonnerie…";
  }catch(e){
    console.error(e);cleanupCall();
    if(e?.name==="NotAllowedError")toast("Otorize mikwofòn/kamera pou apèl la.");
    else toast("Apèl la pa t ka kòmanse.");
  }
}
async function acceptIncoming(){
  if(!pendingOffer||!user)return;
  const p=pendingOffer;pendingOffer=null;
  try{
    localStream=await getCallMedia(p.mode);
    activeCall={callId:p.callId,chatId:p.chatId,peerUid:p.from,name:p.name||"Contact",mode:p.mode,role:"callee"};
    showOverlay(activeCall.name,"Connexion…",p.mode,false);
    if(p.mode==="video")$("#callLocalVideo").srcObject=localStream;
    createPeer(activeCall);
    await pc.setRemoteDescription(p.sdp);
    await flushCandidates(p.callId);
    const answer=await pc.createAnswer();
    await pc.setLocalDescription(answer);
    await sendSignal(p.chatId,p.from,{kind:"answer",callId:p.callId,mode:p.mode,sdp:pc.localDescription});
  }catch(e){
    console.error(e);
    await sendSignal(p.chatId,p.from,{kind:"decline",callId:p.callId,reason:"media-error"}).catch(()=>{});
    cleanupCall();toast("Mikwofòn/kamera pa disponib.");
  }
}
async function declineIncoming(){
  const p=pendingOffer;if(!p)return cleanupCall();
  await sendSignal(p.chatId,p.from,{kind:"decline",callId:p.callId}).catch(()=>{});
  cleanupCall();
}
async function endActive(notify=true){
  if(activeCall&&notify){
    await sendSignal(activeCall.chatId,activeCall.peerUid,{kind:"end",callId:activeCall.callId}).catch(()=>{});
  }
  cleanupCall();
}
async function handleSignal(chatId,sig){
  if(!user||!sig||sig.to!==user.uid||sig.from===user.uid)return;
  if(Date.now()-Number(sig.sentAt||0)>180000)return;
  if(sig.kind==="offer"){
    if(activeCall||pendingOffer){
      await sendSignal(chatId,sig.from,{kind:"decline",callId:sig.callId,reason:"busy"}).catch(()=>{});
      return;
    }
    pendingOffer={...sig,chatId,name:currentChat===chatId?currentName:"Contact"};
    showOverlay(pendingOffer.name,sig.mode==="video"?"Appel vidéo entrant":"Appel vocal entrant",sig.mode,true);
    return;
  }
  if(sig.kind==="candidate"){
    if(activeCall?.callId!==sig.callId){queueCandidate(sig.callId,sig.candidate);return}
    if(pc?.remoteDescription)await pc.addIceCandidate(sig.candidate).catch(console.warn);
    else queueCandidate(sig.callId,sig.candidate);
    return;
  }
  if(activeCall?.callId!==sig.callId)return;
  if(sig.kind==="answer"){
    await pc.setRemoteDescription(sig.sdp);
    await flushCandidates(sig.callId);
    $("#callStatus").textContent="Connexion…";
  }else if(sig.kind==="decline"){
    toast(sig.reason==="busy"?"Kontak la okipe.":"Apèl la refize.");
    cleanupCall();
  }else if(sig.kind==="end"){
    toast("Apèl la fini.");
    cleanupCall();
  }
}
function watchChatSignals(chatId){
  if(!chatId||signalOffs.has(chatId)||!db)return;
  const q=query(collection(db,"chats",chatId,"messages"),orderBy("createdAt","desc"),limit(12));
  const off=onSnapshot(q,s=>{
    for(const d of s.docs){
      if(seenSignals.has(d.id))continue;
      const sig=d.data()?.callSignal;
      if(!sig)continue;
      seenSignals.add(d.id);
      handleSignal(chatId,sig).catch(console.error);
    }
  },e=>console.warn("call watcher",chatId,e?.code||e));
  signalOffs.set(chatId,off);
}
function clearSignalWatchers(){
  signalOffs.forEach(off=>{try{off()}catch{}});
  signalOffs.clear();
}
window.addEventListener("wbp-chat-open",e=>{
  currentChat=e.detail?.chatId||"";
  currentPeer=e.detail?.uid||"";
  currentName=e.detail?.name||"Contact";
  if(currentChat)watchChatSignals(currentChat);
});
window.addEventListener("wbp-start-call",e=>startOutgoing(e.detail?.mode||"voice",e.detail||{}));
window.addEventListener("wbp-call-signal",e=>{
  const d=e.detail||{};
  handleSignal(d.chatId,d.signal).catch(console.error);
});

$("#acceptCallBtn")?.addEventListener("click",acceptIncoming);
$("#declineCallBtn")?.addEventListener("click",declineIncoming);
$("#endCallBtn")?.addEventListener("click",()=>endActive(true));
$("#toggleCallMuteBtn")?.addEventListener("click",()=>{
  const tracks=localStream?.getAudioTracks()||[];if(!tracks.length)return;
  const next=!tracks[0].enabled;tracks.forEach(t=>t.enabled=next);
  $("#toggleCallMuteBtn").textContent=next?"🎙️":"🔇";
});
$("#toggleCallCameraBtn")?.addEventListener("click",()=>{
  const tracks=localStream?.getVideoTracks()||[];if(!tracks.length)return;
  const next=!tracks[0].enabled;tracks.forEach(t=>t.enabled=next);
  $("#toggleCallCameraBtn").textContent=next?"📹":"🚫";
});

if(configured())onAuthStateChanged(auth,u=>{
  user=u;clearSignalWatchers();seenSignals.clear();
  contactsOff?.();contactsOff=null;
  if(!u){cleanupCall();return}
  contactsOff=onSnapshot(collection(db,"users",u.uid,"contacts"),s=>{
    const ids=[...new Set(s.docs.map(d=>d.data()?.contactUid||d.data()?.uid||d.id).filter(Boolean))].slice(0,30);
    for(const uid of ids)watchChatSignals(roomId(u.uid,uid));
  },e=>console.warn("call contacts",e?.code||e));
});
