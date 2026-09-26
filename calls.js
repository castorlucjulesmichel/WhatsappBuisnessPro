import {firebaseConfig} from "./firebase-config.js";
import {getApps,getApp,initializeApp} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import {getAuth,onAuthStateChanged} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import {getFirestore,doc,getDoc,setDoc,collection,query,where,orderBy,limit,onSnapshot,addDoc,serverTimestamp} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

const $=s=>document.querySelector(s);
const configured=()=>firebaseConfig.apiKey&&!String(firebaseConfig.apiKey).includes("YOUR_");
const toast=t=>{const e=$("#toast");if(!e)return;e.textContent=t;e.classList.add("show");setTimeout(()=>e.classList.remove("show"),2300)};

let auth=null,db=null,user=null,currentChat="",currentPeer="",currentName="Contact";
let pc=null,localStream=null,activeCall=null,pendingOffer=null;
let chatsOff=null,signalOffs=new Map(),seenSignals=new Set(),candidateQueue=new Map();

if(configured()){
  const app=getApps().length?getApp():initializeApp(firebaseConfig);
  auth=getAuth(app);db=getFirestore(app);
}

function roomId(uid1,uid2){return [uid1,uid2].sort().join("__")}
function historyKey(){return user?"wbp_call_history_"+user.uid:"wbp_call_history_guest"}
function readHistory(){try{return JSON.parse(localStorage.getItem(historyKey())||"[]")}catch{return []}}
function writeHistory(rows){localStorage.setItem(historyKey(),JSON.stringify(rows.slice(0,80)));renderHistory()}
function addHistory(row){
  const rows=readHistory();
  rows.unshift({id:crypto.randomUUID(),at:Date.now(),...row});
  writeHistory(rows);
}
function renderHistory(){
  const box=$("#callsList");if(!box)return;
  const q=($("#callsSearchInput")?.value||"").trim().toLowerCase();
  const rows=readHistory().filter(x=>!q||((x.name||"")+" "+(x.direction||"")+" "+(x.mode||"")+" "+(x.status||"")).toLowerCase().includes(q));
  box.innerHTML=rows.length?rows.map(x=>`<div class="callHistoryRow">
    <div class="callHistoryIcon">${x.mode==="video"?"📹":"📞"}</div>
    <div><b>${escapeHtml(x.name||"Contact")}</b><small>${x.direction==="incoming"?"Entrant":"Sortant"} • ${escapeHtml(x.status||"terminé")} • ${new Date(x.at).toLocaleString()}</small></div>
    <button type="button" data-redial="${escapeHtml(x.chatId||"")}" data-peer="${escapeHtml(x.peerUid||"")}" data-name="${escapeHtml(x.name||"Contact")}" data-mode="${escapeHtml(x.mode||"voice")}">↗</button>
  </div>`).join(""):'<p class="muted">Aucun appel récent.</p>';
  box.querySelectorAll("[data-redial]").forEach(b=>b.onclick=()=>startOutgoing(b.dataset.mode,{chatId:b.dataset.redial,uid:b.dataset.peer,name:b.dataset.name}));
}
function escapeHtml(s){return String(s??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]))}

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
  $("#callOverlay")?.classList.add("hidden");
  $("#callOverlay")?.setAttribute("aria-hidden","true");
  $("#incomingCallActions")?.classList.add("hidden");
  $("#activeCallActions")?.classList.add("hidden");
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
  if(!user||!chatId||!to)throw new Error("call/missing-peer");
  await addDoc(collection(db,"chats",chatId,"messages"),{
    senderId:user.uid,type:"document",readBy:[user.uid],
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
    sendSignal(activeCall.chatId,activeCall.peerUid,{kind:"candidate",callId:activeCall.callId,candidate:e.candidate.toJSON()}).catch(console.warn);
  };
  pc.onconnectionstatechange=()=>{
    const s=pc?.connectionState;
    if(s==="connected")$("#callStatus").textContent="En appel";
    if(["failed","disconnected"].includes(s||""))$("#callStatus").textContent="Connexion interrompue";
    if(s==="failed")toast("Connexion directe impossible. Yon sèvè TURN nesesè sou kèk rezo.");
  };
}
async function getCallMedia(mode){
  if(!navigator.mediaDevices?.getUserMedia)throw new Error("media-unsupported");
  return navigator.mediaDevices.getUserMedia({audio:true,video:mode==="video"});
}
async function startOutgoing(mode,detail={}){
  if(!user)return toast("Konekte dabò.");
  if(!window.RTCPeerConnection)return toast("Navigatè sa pa sipòte apèl entènèt.");
  if(activeCall||pendingOffer)return toast("Gen yon apèl ki deja an kou.");
  const chatId=detail.chatId||currentChat,peerUid=detail.uid||currentPeer,name=detail.name||currentName;
  if(!chatId||!peerUid)return toast("Kontak apèl la pa disponib.");
  try{
    localStream=await getCallMedia(mode);
    const callId=crypto.randomUUID();
    activeCall={callId,chatId,peerUid,name,mode,role:"caller"};
    addHistory({chatId,peerUid,name,mode,direction:"outgoing",status:"appelé"});
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
    addHistory({chatId:p.chatId,peerUid:p.from,name:activeCall.name,mode:p.mode,direction:"incoming",status:"accepté"});
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
  const p=pendingOffer;
  if(p)addHistory({chatId:p.chatId,peerUid:p.from,name:p.name||"Contact",mode:p.mode,direction:"incoming",status:"refusé"});
  if(p)await sendSignal(p.chatId,p.from,{kind:"decline",callId:p.callId}).catch(()=>{});
  cleanupCall();
}
async function endActive(notify=true){
  const call=activeCall;
  if(call&&notify)await sendSignal(call.chatId,call.peerUid,{kind:"end",callId:call.callId}).catch(()=>{});
  if(call)addHistory({chatId:call.chatId,peerUid:call.peerUid,name:call.name,mode:call.mode,direction:call.role==="callee"?"incoming":"outgoing",status:"terminé"});
  cleanupCall();
}
async function peerNameFromChat(chatId,uid){
  if(currentChat===chatId&&currentName)return currentName;
  try{
    const p=await getDoc(doc(db,"publicProfiles",uid));
    return p.exists()?(p.data().displayName||p.data().username||"Contact"):"Contact";
  }catch{return "Contact"}
}
async function handleSignal(chatId,sig){
  if(!user||!sig||sig.to!==user.uid||sig.from===user.uid)return;
  if(Date.now()-Number(sig.sentAt||0)>180000)return;
  if(sig.kind==="offer"){
    if(activeCall||pendingOffer){
      await sendSignal(chatId,sig.from,{kind:"decline",callId:sig.callId,reason:"busy"}).catch(()=>{});
      return;
    }
    const name=await peerNameFromChat(chatId,sig.from);
    pendingOffer={...sig,chatId,name};
    showOverlay(name,sig.mode==="video"?"Appel vidéo entrant":"Appel vocal entrant",sig.mode,true);
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
    await pc.setRemoteDescription(sig.sdp);await flushCandidates(sig.callId);$("#callStatus").textContent="Connexion…";
  }else if(sig.kind==="decline"){
    toast(sig.reason==="busy"?"Kontak la okipe.":"Apèl la refize.");cleanupCall();
  }else if(sig.kind==="end"){
    toast("Apèl la fini.");cleanupCall();
  }
}
function watchChatSignals(chatId){
  if(!chatId||signalOffs.has(chatId)||!db)return;
  const q=query(collection(db,"chats",chatId,"messages"),orderBy("createdAt","desc"),limit(16));
  const off=onSnapshot(q,s=>{
    for(const d of s.docs){
      if(seenSignals.has(d.id))continue;
      const sig=d.data()?.callSignal;if(!sig)continue;
      seenSignals.add(d.id);
      handleSignal(chatId,sig).catch(console.error);
    }
  },e=>console.warn("call watcher",chatId,e?.code||e));
  signalOffs.set(chatId,off);
}
function clearSignalWatchers(){signalOffs.forEach(off=>{try{off()}catch{}});signalOffs.clear()}

async function prepareInviteCall(targetUid){
  if(!user||!targetUid||targetUid===user.uid)return;
  try{
    const [meSnap,pSnap]=await Promise.all([getDoc(doc(db,"publicProfiles",user.uid)),getDoc(doc(db,"publicProfiles",targetUid))]);
    if(!pSnap.exists())return toast("Kontak lyen apèl la pa disponib.");
    const myName=meSnap.data()?.displayName||user.displayName||"User";
    const peerName=pSnap.data()?.displayName||pSnap.data()?.username||"Contact";
    const chatId=roomId(user.uid,targetUid);
    const chatRef=doc(db,"chats",chatId);
    const existing=await getDoc(chatRef);
    if(!existing.exists()){
      await setDoc(chatRef,{
        type:"direct",participants:[user.uid,targetUid].sort(),
        participantNames:{[user.uid]:myName,[targetUid]:peerName},
        lastMessage:"",updatedAt:serverTimestamp()
      });
    }
    watchChatSignals(chatId);
    if(confirm("Kòmanse yon apèl vokal ak "+peerName+" ?"))startOutgoing("voice",{chatId,uid:targetUid,name:peerName});
  }catch(e){console.error(e);toast("Lyen apèl la pa t ka louvri.");}
}
async function createCallLink(){
  if(!user)return toast("Konekte dabò.");
  const url=location.origin+location.pathname+"#call="+encodeURIComponent(user.uid);
  try{
    if(navigator.share)await navigator.share({title:"Whatsapp Business Pro",text:"Rele mwen sou Whatsapp Business Pro",url});
    else{await navigator.clipboard.writeText(url);toast("Lyen apèl la kopye.");}
  }catch(e){if(e?.name!=="AbortError")toast("Pataj lyen an pa disponib.");}
}

window.addEventListener("wbp-chat-open",e=>{
  currentChat=e.detail?.chatId||"";currentPeer=e.detail?.uid||"";currentName=e.detail?.name||"Contact";
  if(currentChat)watchChatSignals(currentChat);
});
window.addEventListener("wbp-start-call",e=>startOutgoing(e.detail?.mode||"voice",e.detail||{}));
window.addEventListener("wbp-call-signal",e=>{
  const d=e.detail||{};
  if(d.docId){
    if(seenSignals.has(d.docId))return;
    seenSignals.add(d.docId);
  }
  handleSignal(d.chatId,d.signal).catch(console.error);
});

$("#acceptCallBtn")?.addEventListener("click",acceptIncoming);
$("#declineCallBtn")?.addEventListener("click",declineIncoming);
$("#endCallBtn")?.addEventListener("click",()=>endActive(true));
$("#toggleCallMuteBtn")?.addEventListener("click",()=>{
  const tracks=localStream?.getAudioTracks()||[];if(!tracks.length)return;
  const enabled=!tracks[0].enabled;tracks.forEach(t=>t.enabled=enabled);
  $("#toggleCallMuteBtn").textContent=enabled?"🎙️":"🔇";
});
$("#toggleCallCameraBtn")?.addEventListener("click",()=>{
  const tracks=localStream?.getVideoTracks()||[];if(!tracks.length)return;
  const enabled=!tracks[0].enabled;tracks.forEach(t=>t.enabled=enabled);
  $("#toggleCallCameraBtn").textContent=enabled?"📹":"🚫";
});
$("#callsSearchBtn")?.addEventListener("click",()=>$("#callsSearchInput")?.classList.toggle("hidden"));
$("#callsSearchInput")?.addEventListener("input",renderHistory);
$("#callsMenuBtn")?.addEventListener("click",()=>window.WBP_ROUTE?.("settings"));
$("#createCallLinkBtn")?.addEventListener("click",createCallLink);

async function watchChatsFallbackForCalls(uid){
  try{
    const s=await new Promise((resolve,reject)=>{
      const off=onSnapshot(collection(db,"users",uid,"contacts"),snap=>{off();resolve(snap)},reject);
    });
    const peers=[...new Set(s.docs.map(d=>d.data()?.contactUid).filter(Boolean))].slice(0,40);
    peers.forEach(peer=>watchChatSignals(roomId(uid,peer)));
  }catch(e){console.warn("call fallback",e?.code||e)}
}

if(configured())onAuthStateChanged(auth,u=>{
  user=u;clearSignalWatchers();seenSignals.clear();
  chatsOff?.();chatsOff=null;renderHistory();
  if(!u){cleanupCall();return}
  const q=query(collection(db,"chats"),where("participants","array-contains",u.uid),limit(60));
  chatsOff=onSnapshot(q,s=>{
    for(const d of s.docs)watchChatSignals(d.id);
  },e=>{
    console.warn("call chats",e?.code||e);
    watchChatsFallbackForCalls(u.uid);
  });
  const m=location.hash.match(/^#call=([^&]+)/);
  if(m){
    history.replaceState(null,"",location.pathname+location.search);
    setTimeout(()=>prepareInviteCall(decodeURIComponent(m[1])),350);
  }
});