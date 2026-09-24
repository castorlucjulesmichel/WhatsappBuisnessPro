import {firebaseConfig,appSettings} from "./firebase-config.js";
import {initializeApp} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import {getAuth,onAuthStateChanged,GoogleAuthProvider,signInWithPopup,signInWithRedirect,getRedirectResult,signOut,useDeviceLanguage} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import {getFirestore,doc,getDoc,setDoc,addDoc,updateDoc,deleteDoc,collection,query,where,onSnapshot,getDocs,orderBy,serverTimestamp,limit} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";
import {getStorage,ref,uploadBytes,getDownloadURL} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-storage.js";

const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const configured=()=>firebaseConfig.apiKey && !String(firebaseConfig.apiKey).includes("YOUR_");
const esc=s=>String(s??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]));
const toast=t=>{const e=$("#toast");e.textContent=t;e.classList.add("show");setTimeout(()=>e.classList.remove("show"),2300)};
const norm=s=>String(s||"").trim().toLowerCase().replace(/[^a-z0-9_.-]/g,"");
const normalizeMobile=v=>{let p=String(v||"").trim().replace(/[^0-9+]/g,"");if(p.startsWith("00"))p="+"+p.slice(2);return p};
const validMobile=p=>/^\+[1-9]\d{7,14}$/.test(normalizeMobile(p));
async function phoneLookupId(phone){
  const p=normalizeMobile(phone);
  if(!p)return "";
  const bytes=new TextEncoder().encode(p);
  const hash=await crypto.subtle.digest("SHA-256",bytes);
  return "phone_"+[...new Uint8Array(hash)].map(b=>b.toString(16).padStart(2,"0")).join("").slice(0,32);
}
async function syncPhoneDirectory(phone,oldPhone="",meta={}){
  if(!S.user||!validMobile(phone))return;
  const newId=await phoneLookupId(phone);
  const refNew=doc(db,"phoneDirectory",newId);
  const existing=await getDoc(refNew);
  if(existing.exists()&&existing.data()?.uid&&existing.data().uid!==S.user.uid){
    const err=new Error("Ce numéro est déjà associé à un autre compte.");
    err.code="phone/already-in-use";
    throw err;
  }
  await setDoc(refNew,{
    uid:S.user.uid,
    displayName:meta.displayName||S.profile?.displayName||S.user.displayName||"",
    username:meta.username||S.profile?.username||"",
    updatedAt:serverTimestamp()
  },{merge:true});
  const old=normalizeMobile(oldPhone);
  if(old&&old!==normalizeMobile(phone)){
    try{
      const oldId=await phoneLookupId(old),oldRef=doc(db,"phoneDirectory",oldId),oldSnap=await getDoc(oldRef);
      if(oldSnap.exists()&&oldSnap.data()?.uid===S.user.uid)await deleteDoc(oldRef);
    }catch(e){console.warn("old phone directory cleanup",e)}
  }
}
const safe=s=>String(s||"file").replace(/[^a-zA-Z0-9._-]/g,"_");
const money=(n,c)=>Number(n||0).toLocaleString(undefined,{maximumFractionDigits:2})+" "+(c||"HTG");
const S={user:null,profile:{},account:{},chatId:null,chatOtherUid:null,chatOtherName:"",chatRows:[],chatFilter:"all",products:[],clips:[],boosts:[],cart:[],unsubs:[]};

if(!configured()){
  $("#authScreen").classList.add("hidden");
  $("#setupScreen").classList.remove("hidden");
  throw new Error("Configure independent Firebase in firebase-config.js");
}

const app=initializeApp(firebaseConfig),auth=getAuth(app),db=getFirestore(app),storage=getStorage(app);
useDeviceLanguage(auth);

function addOff(f){if(typeof f==="function")S.unsubs.push(f)}
function clearOffs(){S.unsubs.forEach(f=>{try{f()}catch{}});S.unsubs=[]}
function go(name){
  document.body.classList.toggle("waMainTab",name==="chat"||name==="calls");
  $$(".page").forEach(x=>x.classList.remove("active"));
  $$("nav button").forEach(x=>x.classList.remove("active"));
  $("#"+name+"Page")?.classList.add("active");
  const parent={
    status:"actus", clips:"actus",
    contactPicker:"chat", newContact:"chat",
    market:"tools", orders:"tools", stats:"tools", business:"tools", profile:"tools", settings:"tools",
    invest:"wallet"
  }[name] || name;
  document.querySelector('nav button[data-page="'+parent+'"]')?.classList.add("active");
}
$$("nav button[data-page]").forEach(b=>b.onclick=()=>go(b.dataset.page));
$$("[data-go]").forEach(b=>b.onclick=()=>go(b.dataset.go));
$$("[data-market-mode]").forEach(b=>b.addEventListener("click",()=>{
  const sell=$("#sellBox");
  if(!sell)return;
  if(b.dataset.marketMode==="sell"){
    sell.classList.remove("hidden");
    setTimeout(()=>sell.scrollIntoView({behavior:"smooth",block:"start"}),80);
  }else{
    sell.classList.add("hidden");
  }
}));
$("#socialAccountsBtn")?.addEventListener("click",()=>toast("Connexion Facebook/Instagram ap disponib lè API sosyal yo konekte."));


function fillCurrencies(){
  ["#pCurrency","#walletCurrency","#exchangeFrom","#exchangeTo","#adCurrency","#levelCurrency"].forEach(sel=>{
    const e=$(sel); if(!e)return;
    e.innerHTML=appSettings.currencies.map(c=>'<option>'+c+'</option>').join("");
  });
}
fillCurrencies();

const googleProvider=new GoogleAuthProvider();
googleProvider.setCustomParameters({prompt:"select_account"});

async function signInGoogle(){
  try{
    await signInWithPopup(auth,googleProvider);
  }catch(e){
    console.error("Google sign-in",e);
    if(["auth/popup-blocked","auth/popup-closed-by-user","auth/operation-not-supported-in-this-environment"].includes(e?.code)){
      if(e?.code==="auth/popup-closed-by-user")return;
      await signInWithRedirect(auth,googleProvider);
      return;
    }
    if(e?.code==="auth/operation-not-allowed"){
      return toast("Activez le fournisseur Google dans Firebase Authentication.");
    }
    if(e?.code==="auth/unauthorized-domain"){
      return toast("Ajoutez ce domaine dans Firebase Authentication > Domaines autorisés.");
    }
    toast("Connexion Google impossible: "+(e?.code||e?.message||"erreur"));
  }
}
$("#googleSignInBtn")?.addEventListener("click",signInGoogle);
getRedirectResult(auth).catch(e=>console.error("Google redirect",e));
$("#logout").onclick=()=>signOut(auth);
$("#phoneSetupLogout")?.addEventListener("click",()=>signOut(auth));
$("#saveMobilePhoneBtn")?.addEventListener("click",async()=>{
  if(!S.user)return;
  const phone=normalizeMobile($("#mobilePhoneSetup")?.value||"");
  if(!validMobile(phone))return toast("Mete nimewo a ak kòd peyi a, egzanp +509XXXXXXXX.");
  try{
    try{await syncPhoneDirectory(phone,"",{displayName:S.user.displayName||""})}
    catch(e){
      if(e?.code==="phone/already-in-use")return toast(e.message);
      console.warn("phone directory setup",e);
    }
    await setDoc(doc(db,"users",S.user.uid),{phone,updatedAt:serverTimestamp()},{merge:true});
    location.reload();
  }catch(e){
    console.error(e);toast("Nimewo a pa t sove.");
  }
});

async function ensureUser(u){
  const r=doc(db,"users",u.uid),s=await getDoc(r);
  if(!s.exists()){
    const wallet={},ads={HTG:0,USD:0};appSettings.currencies.forEach(c=>wallet[c]=0);
    await setDoc(r,{phone:u.phoneNumber||"",email:u.email||"",authProvider:"google",displayName:u.displayName||"",blocked:false,walletBalances:wallet,adBalances:ads,createdAt:serverTimestamp()});
    return true;
  }
  if(s.data().blocked===true){toast("Kont sa bloke pa administrasyon.");await signOut(auth);return false}
  await setDoc(r,{email:u.email||s.data().email||"",authProvider:"google",displayName:u.displayName||s.data().displayName||"",lastLoginAt:serverTimestamp()},{merge:true});
  return true;
}
async function loadProfile(){
  const [s,a]=await Promise.all([getDoc(doc(db,"publicProfiles",S.user.uid)),getDoc(doc(db,"users",S.user.uid))]);
  S.profile=s.exists()?s.data():{};
  S.account=a.exists()?a.data():{};
  $("#displayName").value=S.profile.displayName||"";$("#username").value=S.profile.username||"";$("#bio").value=S.profile.bio||"";$("#country").value=S.profile.country||"";$("#birthYear").value=S.profile.birthYear||"";$("#role").value=S.profile.role||"buyer";
  $("#avatarPreview").src=S.profile.photoUrl||"";
  $("#headerUser").textContent=S.profile.displayName||S.profile.username||S.user.displayName||S.user.email||"User";
  if($("#mobilePhoneProfile"))$("#mobilePhoneProfile").value=S.account.phone||"";
  if($("#profilePhoneDisplay"))$("#profilePhoneDisplay").textContent=S.user.email||S.user.displayName||"Compte Google";
}
async function upload(file,path,max,typePrefix){
  if(!file)return "";
  if(file.size>max)throw new Error("Fichye a twò gwo.");
  if(typePrefix&&!file.type.startsWith(typePrefix))throw new Error("Kalite fichye pa bon.");
  const rr=ref(storage,path+"/"+S.user.uid+"/"+crypto.randomUUID()+"-"+safe(file.name));
  const up=await uploadBytes(rr,file,{contentType:file.type});return getDownloadURL(up.ref);
}
$("#profileForm").onsubmit=async e=>{e.preventDefault();try{
  const mobile=normalizeMobile($("#mobilePhoneProfile")?.value||"");if(!validMobile(mobile))return toast("Mete yon nimewo mobil entènasyonal valab, egzanp +509XXXXXXXX.");
  const previousMobile=S.account.phone||"";
  const username=norm($("#username").value);if(username.length<3)return toast("Username dwe gen omwen 3 karaktè.");
  const q=query(collection(db,"publicProfiles"),where("username","==",username),limit(2)),m=await getDocs(q);
  if(m.docs.some(d=>d.id!==S.user.uid))return toast("Username sa deja itilize.");
  let photoUrl=S.profile.photoUrl||"";const f=$("#avatarFile").files[0];if(f)photoUrl=await upload(f,"whatssap-business-pro/avatars",8*1024*1024,"image/");
  try{
    await syncPhoneDirectory(mobile,previousMobile,{displayName:$("#displayName").value.trim()||username,username});
  }catch(e){
    if(e?.code==="phone/already-in-use")return toast(e.message);
    console.warn("phone directory profile",e);
  }
  await setDoc(doc(db,"users",S.user.uid),{phone:mobile,updatedAt:serverTimestamp()},{merge:true});
  S.account={...S.account,phone:mobile};window.dispatchEvent(new CustomEvent("wbp-phone-updated",{detail:{phone:mobile}}));
  await setDoc(doc(db,"publicProfiles",S.user.uid),{displayName:$("#displayName").value.trim()||username,username,bio:$("#bio").value.trim(),country:$("#country").value.trim(),birthYear:Number($("#birthYear").value||0),role:$("#role").value,photoUrl,updatedAt:serverTimestamp()},{merge:true});
  await setDoc(doc(db,"businesses",S.user.uid),{
    ownerId:S.user.uid,
    username,
    name:$("#displayName").value.trim()||username,
    description:$("#bio").value.trim(),
    hours:$("#businessHoursProfile")?.value.trim()||"",
    website:$("#businessWebsiteProfile")?.value.trim()||"",
    instagram:$("#instagramProfile")?.value.trim()||"",
    facebook:$("#facebookProfile")?.value.trim()||"",
    email:$("#businessEmailProfile")?.value.trim()||"",
    active:true,
    updatedAt:serverTimestamp()
  },{merge:true});
  await loadProfile();toast("Profil sove.");
}catch(x){console.error(x);toast(x.message||"Profil pa t sove.");}};
$("#shareLocation").onclick=()=>{if(!navigator.geolocation)return toast("Lokalizasyon pa disponib.");$("#locationStatus").textContent="Ap chèche...";navigator.geolocation.getCurrentPosition(async p=>{const loc={lat:p.coords.latitude,lng:p.coords.longitude,accuracy:p.coords.accuracy,sharedAt:serverTimestamp()};await setDoc(doc(db,"userSettings",S.user.uid),{location:loc},{merge:true});$("#locationStatus").textContent="Lokalizasyon pataje avèk presizyon "+Math.round(p.coords.accuracy)+" m.";toast("Lokalizasyon sove.")},()=>{$("#locationStatus").textContent="Pèmisyon lokalizasyon refize.";},{enableHighAccuracy:true,timeout:12000})};

$("#sellBtn").onclick=()=>$("#sellBox").classList.toggle("hidden");
$("#productForm").onsubmit=async e=>{e.preventDefault();try{
  const f=$("#pImage").files[0],imageUrl=await upload(f,"whatssap-business-pro/products",8*1024*1024,"image/");
  await addDoc(collection(db,"products"),{sellerId:S.user.uid,sellerUsername:S.profile.username||"",sellerName:S.profile.displayName||"",name:$("#pName").value.trim(),price:Number($("#pPrice").value),currency:$("#pCurrency").value,category:$("#pCategory").value,stock:Number($("#pStock").value||0),description:$("#pDesc").value.trim(),imageUrl,active:true,createdAt:serverTimestamp()});
  e.target.reset();$("#sellBox").classList.add("hidden");toast("Pwodwi pibliye.");
}catch(x){console.error(x);toast(x.message||"Pwodwi pa pibliye.");}};

function renderProducts(){
  const term=$("#marketSearch").value.trim().toLowerCase(),cat=$("#marketCategory").value;
  const sponsored=new Set(S.boosts.filter(b=>b.status==="active"&&b.targetType==="product").map(b=>b.targetId));
  const list=S.products.filter(p=>p.active!==false&&(!term||((p.name||"")+" "+(p.description||"")).toLowerCase().includes(term))&&(!cat||p.category===cat))
    .sort((a,b)=>Number(sponsored.has(b.id))-Number(sponsored.has(a.id)));
  $("#mProducts").textContent=list.length;
  $("#productGrid").innerHTML=list.length?list.map(p=>`<article class="product">${p.imageUrl?`<img src="${esc(p.imageUrl)}" alt="">`:""}<div class="productBody">${sponsored.has(p.id)?'<span class="status approved">Sponsored</span>':""}<h3>${esc(p.name)}</h3><p>${esc(p.description||"")}</p><b>${money(p.price,p.currency)}</b><div class="productActions"><button data-cart="${p.id}">Ajoute</button><button class="ghost" data-seller="${esc(p.sellerUsername||"")}">Chat</button></div></div></article>`).join(""):'<p class="muted">Pa gen pwodwi.</p>';
  $$("[data-cart]").forEach(b=>b.onclick=()=>addCart(b.dataset.cart));
  $$("[data-seller]").forEach(b=>b.onclick=()=>{$("#targetUsername").value=b.dataset.seller;go("chat");$("#newChatBox").classList.remove("hidden")});
}
$("#marketSearch").oninput=renderProducts;$("#marketCategory").onchange=renderProducts;
function watchProducts(){addOff(onSnapshot(collection(db,"products"),s=>{S.products=s.docs.map(d=>({id:d.id,...d.data()}));renderProducts()}))}
function watchBoosts(){addOff(onSnapshot(query(collection(db,"adCampaigns"),where("status","==","active")),s=>{S.boosts=s.docs.map(d=>({id:d.id,...d.data()}));renderProducts();renderClips()}))}

function cartKey(){return "wbp_cart_"+S.user.uid}
function loadCart(){try{S.cart=JSON.parse(localStorage.getItem(cartKey())||"[]")}catch{S.cart=[]}renderCart()}
function saveCart(){localStorage.setItem(cartKey(),JSON.stringify(S.cart));renderCart()}
function addCart(id){const p=S.products.find(x=>x.id===id);if(!p)return;const x=S.cart.find(i=>i.id===id);if(x)x.qty++;else S.cart.push({id:p.id,name:p.name,price:p.price,currency:p.currency,sellerId:p.sellerId,qty:1});saveCart();toast("Ajoute nan panier.")}
function renderCart(){
  $("#cartCount").textContent=S.cart.reduce((a,x)=>a+x.qty,0);
  $("#cartItems").innerHTML=S.cart.length?S.cart.map(x=>`<div class="historyRow"><b>${esc(x.name)}</b> • x${x.qty} • ${money(x.price,x.currency)} <button class="danger" data-rm="${x.id}">Retire</button></div>`).join(""):'<p class="muted">Panier vid.</p>';
  $$("[data-rm]").forEach(b=>b.onclick=()=>{S.cart=S.cart.filter(x=>x.id!==b.dataset.rm);saveCart()});
}
$("#cartBtn").onclick=()=>$("#cartBox").classList.toggle("hidden");
$("#checkoutBtn").onclick=async()=>{if(!S.cart.length)return toast("Panier vid.");try{
  const groups={};for(const i of S.cart){const k=i.sellerId+"|"+i.currency;(groups[k]??=[]).push(i)}
  for(const items of Object.values(groups)){
    const total=items.reduce((s,i)=>s+Number(i.price)*i.qty,0),currency=items[0].currency,min=Number(appSettings.orderMinimums[currency]||0);
    if(total<min)throw new Error("Minimòm kòmand pou "+currency+" se "+min+" "+currency+".");
    const commission=total*Number(appSettings.platformCommissionRate||0);
    await addDoc(collection(db,"orders"),{buyerId:S.user.uid,sellerId:items[0].sellerId,items,total,currency,platformCommission:commission,sellerNet:total-commission,status:"pending",paymentStatus:"unpaid",createdAt:serverTimestamp()});
  }
  S.cart=[];saveCart();$("#cartBox").classList.add("hidden");toast("Kòmand kreye.");
}catch(x){console.error(x);toast(x.message||"Kòmand pa kreye.");}};

$("#clipBtn").onclick=()=>$("#clipForm").classList.toggle("hidden");
$("#clipForm").onsubmit=async e=>{e.preventDefault();try{
  const f=$("#clipFile").files[0],videoUrl=await upload(f,"whatssap-business-pro/clips",80*1024*1024,"video/");
  await addDoc(collection(db,"shortVideos"),{ownerId:S.user.uid,username:S.profile.username||"",caption:$("#clipCaption").value.trim(),videoUrl,active:true,createdAt:serverTimestamp()});
  e.target.reset();$("#clipForm").classList.add("hidden");toast("Clip pibliye.");
}catch(x){console.error(x);toast(x.message||"Clip pa pibliye.");}};
function renderClips(){
  const sponsored=new Set(S.boosts.filter(b=>b.status==="active"&&b.targetType==="clip").map(b=>b.targetId));
  const list=[...S.clips].filter(v=>v.active!==false).sort((a,b)=>Number(sponsored.has(b.id))-Number(sponsored.has(a.id)));
  $("#clipFeed").innerHTML=list.length?list.map(v=>`<article class="clip"><video src="${esc(v.videoUrl)}" controls playsinline preload="metadata"></video><div class="clipOverlay">${sponsored.has(v.id)?'<span class="status approved">Sponsored</span>':""}<b>@${esc(v.username||"user")}</b><p>${esc(v.caption||"")}</p><div class="actions"><button data-like="${v.id}">♡ Like</button><button data-reportclip="${v.id}">⚑ Rapòte</button></div></div></article>`).join(""):'<p class="muted">Pa gen clip.</p>';
  $$("[data-like]").forEach(b=>b.onclick=()=>setDoc(doc(db,"shortVideos",b.dataset.like,"likes",S.user.uid),{createdAt:serverTimestamp()}).then(()=>toast("Like anrejistre.")));
  $$("[data-reportclip]").forEach(b=>b.onclick=()=>reportCase("clip",b.dataset.reportclip,"Videyo rapòte"));
}
function watchClips(){addOff(onSnapshot(collection(db,"shortVideos"),s=>{S.clips=s.docs.map(d=>({id:d.id,...d.data()}));$("#mProducts");renderClips()}))}

$("#newChatBtn").onclick=()=>$("#newChatBox").classList.toggle("hidden");
$("#startChatBtn").onclick=async()=>{try{const un=norm($("#targetUsername").value),q=query(collection(db,"publicProfiles"),where("username","==",un),limit(1)),s=await getDocs(q);if(s.empty)return toast("Username pa jwenn.");const o=s.docs[0];if(o.id===S.user.uid)return toast("Ou pa ka chat ak tèt ou.");const ids=[S.user.uid,o.id].sort(),id=ids.join("__"),names={[S.user.uid]:S.profile.displayName||S.profile.username||"User",[o.id]:o.data().displayName||o.data().username||"User"};await setDoc(doc(db,"chats",id),{type:"direct",participants:ids,participantNames:names,lastMessage:"",updatedAt:serverTimestamp()},{merge:true});openChat(id,names[o.id]);$("#newChatBox").classList.add("hidden")}catch(x){console.error(x);toast("Chat la pa kreye.");}};
function chatClock(ts){
  const d=ts?.toDate?.() || (ts?.seconds?new Date(ts.seconds*1000):null);
  if(!d)return "";
  return d.toLocaleTimeString([], {hour:"2-digit",minute:"2-digit"});
}
function renderChatList(){
  const term=($("#chatSearch")?.value||"").trim().toLowerCase();
  let rows=[...S.chatRows];
  if(term)rows=rows.filter(c=>{
    const oid=c.participants?.find(x=>x!==S.user.uid)||S.user.uid;
    const n=c.type==="group"?(c.groupName||"Gwoup"):(c.participantNames?.[oid]||"Chat");
    return (n+" "+(c.lastMessage||"")).toLowerCase().includes(term);
  });
  if(S.chatFilter==="groups")rows=rows.filter(c=>c.type==="group");
  if(S.chatFilter==="favorites")rows=rows.filter(c=>Array.isArray(c.favorites)&&c.favorites.includes(S.user.uid));
  if(S.chatFilter==="unread")rows=rows.filter(c=>Number(c.unreadCounts?.[S.user.uid]||0)>0);

  $("#chatList").innerHTML=rows.map(c=>{
    const oid=c.participants?.find(x=>x!==S.user.uid)||S.user.uid;
    const n=c.type==="group"?(c.groupName||"Gwoup"):(c.participantNames?.[oid]||"Chat");
    const unread=Number(c.unreadCounts?.[S.user.uid]||0);
    const initial=(n.trim()[0]||"?").toUpperCase();
    return `<div class="chatItem" data-chat="${c.id}" data-name="${esc(n)}">
      <div class="waChatAvatar">${c.type==="group"?"👥":esc(initial)}</div>
      <div class="waChatBody">
       <div class="waChatTop"><span class="waChatName">${esc(n)}</span><span class="waChatTime">${chatClock(c.updatedAt)}</span></div>
       <div class="waChatPreview"><span>${esc(c.lastMessage||"Nouvo konvèsasyon")}</span></div>
      </div>
      ${unread?'<span class="waUnread">'+unread+'</span>':"<span></span>"}
    </div>`;
  }).join("")||'<div class="chatItem muted">'+(window.WBP_T?.("No chats for this filter.")||"No chats for this filter.")+'</div>';
  $$("[data-chat]").forEach(x=>x.onclick=()=>openChat(x.dataset.chat,x.dataset.name));
}
function watchChats(){
  const q=query(collection(db,"chats"),where("participants","array-contains",S.user.uid));
  addOff(onSnapshot(q,s=>{
    S.chatRows=s.docs.map(d=>({id:d.id,...d.data()})).sort((a,b)=>(b.updatedAt?.seconds||0)-(a.updatedAt?.seconds||0));
    renderChatList();
  }));
}
$("#chatSearch")?.addEventListener("input",renderChatList);
$$("[data-chat-filter]").forEach(b=>b.addEventListener("click",()=>{
  S.chatFilter=b.dataset.chatFilter;
  $$("[data-chat-filter]").forEach(x=>x.classList.toggle("active",x===b));
  renderChatList();
}));
$("#closeNotificationPrompt")?.addEventListener("click",()=>{
  $("#notificationPrompt")?.classList.add("hidden");
  localStorage.setItem("wbp_hide_notification_prompt","1");
});
if(localStorage.getItem("wbp_hide_notification_prompt")==="1")$("#notificationPrompt")?.classList.add("hidden");
$("#enableChatNotifications")?.addEventListener("click",async()=>{
  if(!("Notification" in window))return toast("Notifikasyon pa sipòte sou navigatè sa a.");
  const p=await Notification.requestPermission();
  toast(p==="granted"?"Notifikasyon aktive.":"Pèmisyon notifikasyon pa aktive.");
  if(p==="granted")$("#notificationPrompt")?.classList.add("hidden");
});
$("#chatCameraBtn")?.addEventListener("click",()=>{
  go("status");
  $("#statusForm")?.classList.remove("hidden");
});
$("#chatMenuBtn")?.addEventListener("click",()=>go("settings"));

function messageContent(m){
  if(m.type==="image"&&m.mediaUrl)return '<img class="chatMediaImage" src="'+esc(m.mediaUrl)+'" alt="">'+(m.text?'<div>'+esc(m.text)+'</div>':'');
  if(m.type==="audio"&&m.mediaUrl)return '<audio class="chatAudio" controls src="'+esc(m.mediaUrl)+'"></audio>';
  if(m.type==="document"&&m.mediaUrl)return '<a class="chatFile" href="'+esc(m.mediaUrl)+'" target="_blank" rel="noopener">📄 '+esc(m.fileName||"Dokiman")+'</a>'+(m.text?'<div>'+esc(m.text)+'</div>':'');
  return esc(m.text||"");
}
function closeChatView(){
  $("#chatPage .conversation")?.classList.remove("open");
  $("#chatPage")?.classList.remove("chat-open");
  document.body.classList.remove("chatConversationOpen");
  $("#messageForm")?.classList.add("hidden");
  $("#chatMoreMenu")?.classList.add("hidden");
  S.chatId=null;S.chatOtherUid=null;S.chatOtherName="";
  window.WBP_CURRENT_CHAT=null;
}
async function resolveChatPeer(id){
  let chat=S.chatRows.find(x=>x.id===id)||null;
  if(!chat){
    const snap=await getDoc(doc(db,"chats",id));
    if(snap.exists())chat={id:snap.id,...snap.data()};
  }
  const uid=chat?.participants?.find(x=>x!==S.user.uid)||null;
  return {chat,uid};
}
function callNotReady(type,name){
  const label=type==="video"?"Apèl vidéo":"Apèl vocal";
  toast(label+" ak "+(name||"kontak")+" ap parèt isit la; koneksyon WebRTC reyèl la poko aktive.");
}
async function showChatContactInfo(uid,name){
  if(!uid)return;
  try{
    const [pSnap,cSnap]=await Promise.all([
      getDoc(doc(db,"publicProfiles",uid)),
      getDocs(query(collection(db,"users",S.user.uid,"contacts"),where("contactUid","==",uid),limit(1)))
    ]);
    const p=pSnap.exists()?pSnap.data():{};
    const local=cSnap.empty?{}:cSnap.docs[0].data();
    const display=p.displayName||name||p.username||"Contact";
    $("#chatInfoName").textContent=display;
    $("#chatInfoUsername").textContent=p.username?("@"+p.username):"";
    $("#chatInfoPhone").textContent=local.phone||"—";
    $("#chatInfoBio").textContent=p.bio||"—";
    $("#chatInfoCountry").textContent=p.country||"—";
    $("#chatInfoRole").textContent=p.role||"—";
    const img=$("#chatInfoAvatar"),fallback=$("#chatInfoFallbackAvatar");
    if(p.photoUrl){
      img.src=p.photoUrl;img.classList.remove("hidden");fallback.classList.add("hidden");
    }else{
      img.removeAttribute("src");img.classList.add("hidden");fallback.classList.remove("hidden");
      fallback.textContent=(display.trim()[0]||"?").toUpperCase();
    }
    $("#chatContactInfoPanel").classList.remove("hidden");
    $("#chatContactInfoPanel").setAttribute("aria-hidden","false");
  }catch(e){console.error(e);toast("Info kontak la pa disponib.");}
}
$("#closeChatContactInfo")?.addEventListener("click",()=>{
  $("#chatContactInfoPanel")?.classList.add("hidden");
  $("#chatContactInfoPanel")?.setAttribute("aria-hidden","true");
});
$("#chatInfoMessageBtn")?.addEventListener("click",()=>$("#closeChatContactInfo")?.click());
$("#chatInfoVoiceBtn")?.addEventListener("click",()=>callNotReady("voice",S.chatOtherName));
$("#chatInfoVideoBtn")?.addEventListener("click",()=>callNotReady("video",S.chatOtherName));

async function blockCurrentPeer(){
  if(!S.chatOtherUid)return;
  try{
    await setDoc(doc(db,"users",S.user.uid,"blocks",S.chatOtherUid),{blockedAt:serverTimestamp()});
    toast("Kontak la bloke.");
    $("#chatMoreMenu")?.classList.add("hidden");
  }catch(e){console.error(e);toast("Blokaj la echwe.");}
}

async function openChat(id,name){
  S.chatId=id;S.chatOtherName=name||"Contact";
  window.WBP_CURRENT_CHAT=id;window.WBP_CURRENT_USER=S.user?.uid||"";
  const peer=await resolveChatPeer(id);
  S.chatOtherUid=peer.uid;
  $("#chatPage .conversation")?.classList.add("open");
  $("#chatPage")?.classList.add("chat-open");
  document.body.classList.add("chatConversationOpen");
  const initial=esc((S.chatOtherName.trim()[0]||"?").toUpperCase());
  $("#chatTitle").innerHTML=
    '<button id="closeChatViewBtn" class="waChatBackBtn" type="button">←</button>'+
    '<button id="chatContactInfoBtn" class="waChatContactBtn" type="button"><span class="waChatHeaderAvatar">'+initial+'</span><span class="waChatHeaderIdentity"><b>'+esc(S.chatOtherName)+'</b><small>en ligne</small></span></button>'+
    '<div class="waChatHeaderActions">'+
      '<button id="videoCallBtn" class="waChatHeaderIcon" type="button" aria-label="Appel vidéo">📹</button>'+
      '<button id="voiceCallBtn" class="waChatHeaderIcon" type="button" aria-label="Appel vocal">📞</button>'+
      '<button id="chatMoreBtn" class="waChatHeaderIcon" type="button" aria-label="Menu">⋮</button>'+
    '</div>'+
    '<div id="chatMoreMenu" class="waChatMoreMenu hidden">'+
      '<button id="showContactInfoMenu" type="button">Afficher le contact</button>'+
      '<button type="button" data-chat-menu-info="Recherche dans la discussion à ajouter.">Rechercher</button>'+
      '<button type="button" data-chat-menu-info="Médias, liens et documents seront regroupés ici.">Médias, liens et documents</button>'+
      '<button type="button" data-chat-menu-info="Mode silencieux enregistré dans Paramètres.">Mode silencieux</button>'+
      '<button type="button" data-chat-menu-info="Messages éphémères disponibles dans Paramètres > Discussions.">Messages éphémères</button>'+
      '<button type="button" data-chat-menu-info="Thèmes de discussion à connecter.">Thème de la discussion</button>'+
      '<button id="chatMenuReportBtn" type="button">Signaler</button>'+
      '<button id="chatMenuBlockBtn" type="button">Bloquer</button>'+
    '</div>';
  $("#messageForm").classList.remove("hidden");
  if(S.chatOtherUid){
    getDoc(doc(db,"publicProfiles",S.chatOtherUid)).then(pSnap=>{
      if(!pSnap.exists())return;
      const p=pSnap.data()||{};
      const display=p.displayName||S.chatOtherName;
      S.chatOtherName=display;
      const identity=$("#chatContactInfoBtn .waChatHeaderIdentity b");
      if(identity)identity.textContent=display;
      if(p.photoUrl){
        const avatar=$("#chatContactInfoBtn .waChatHeaderAvatar");
        if(avatar)avatar.innerHTML='<img src="'+esc(p.photoUrl)+'" alt="">';
      }
    }).catch(()=>{});
  }
  $("#closeChatViewBtn").onclick=closeChatView;
  $("#chatContactInfoBtn").onclick=()=>showChatContactInfo(S.chatOtherUid,S.chatOtherName);
  $("#showContactInfoMenu").onclick=()=>{ $("#chatMoreMenu").classList.add("hidden"); showChatContactInfo(S.chatOtherUid,S.chatOtherName); };
  $("#videoCallBtn").onclick=()=>callNotReady("video",S.chatOtherName);
  $("#voiceCallBtn").onclick=()=>callNotReady("voice",S.chatOtherName);
  $("#chatMoreBtn").onclick=()=>$("#chatMoreMenu").classList.toggle("hidden");
  $$("[data-chat-menu-info]").forEach(b=>b.onclick=()=>{toast(b.dataset.chatMenuInfo);$("#chatMoreMenu").classList.add("hidden")});
  $("#chatMenuReportBtn").onclick=()=>{ $("#chatMoreMenu").classList.add("hidden");reportChat(id,S.chatOtherName); };
  $("#chatMenuBlockBtn").onclick=blockCurrentPeer;
  window.dispatchEvent(new CustomEvent("wbp-chat-open",{detail:{chatId:id,name:S.chatOtherName,uid:S.chatOtherUid}}));
  const q=query(collection(db,"chats",id,"messages"),orderBy("createdAt","asc"),limit(300));
  addOff(onSnapshot(q,s=>{
    $("#messages").innerHTML=s.docs.map(d=>{const m=d.data();const receipt=Array.isArray(m.readBy)&&m.readBy.length>1?" ✓✓":(m.senderId===S.user.uid?" ✓":"");return '<div class="msg '+(m.senderId===S.user.uid?"me":"")+'">'+messageContent(m)+(m.senderId===S.user.uid?'<small class="msgReceipt">'+receipt+'</small>':'')+'</div>'}).join("");
    $("#messages").scrollTop=$("#messages").scrollHeight;
    window.dispatchEvent(new CustomEvent("wbp-messages-rendered",{detail:{chatId:id,messages:s.docs.map(d=>({id:d.id,...d.data()}))}}));
  }))
}
window.WBP_OPEN_CHAT=(id,name)=>openChat(id,name);
$("#messageForm").onsubmit=async e=>{
  e.preventDefault();
  const input=$("#messageText");
  const btn=$("#sendMessageBtn");
  const t=input?.value.trim()||"";
  if(!t||!S.chatId||!S.user)return;
  const messages=$("#messages");
  const tempId="pending_"+Date.now();
  if(btn)btn.disabled=true;
  if(input)input.value="";
  if(messages){
    messages.insertAdjacentHTML("beforeend",'<div class="msg me pendingMsg" data-pending="'+tempId+'">'+esc(t)+'<small class="msgReceipt"> …</small></div>');
    messages.scrollTop=messages.scrollHeight;
  }
  try{
    await addDoc(collection(db,"chats",S.chatId,"messages"),{
      senderId:S.user.uid,type:"text",text:t,readBy:[S.user.uid],createdAt:serverTimestamp()
    });
    await updateDoc(doc(db,"chats",S.chatId),{
      lastMessage:t.slice(0,120),updatedAt:serverTimestamp()
    });
  }catch(err){
    console.error("send message",err);
    document.querySelector('[data-pending="'+tempId+'"]')?.remove();
    if(input)input.value=t;
    toast("Mesaj la pa t voye: "+(err?.code||err?.message||"erè"));
  }finally{
    if(btn)btn.disabled=false;
    input?.focus();
  }
};
async function reportChat(id,name){const q=query(collection(db,"chats",id,"messages"),orderBy("createdAt","desc"),limit(20)),s=await getDocs(q),excerpt=s.docs.reverse().map(d=>({senderId:d.data().senderId,text:d.data().text||""}));await addDoc(collection(db,"moderationCases"),{reporterId:S.user.uid,type:"chat",targetId:id,title:"Chat ak "+name,excerpt,status:"open",createdAt:serverTimestamp()});toast("Dènye mesaj yo pataje ak moderasyon.")}

function watchSupport(){const r=doc(db,"supportThreads",S.user.uid);setDoc(r,{userId:S.user.uid,updatedAt:serverTimestamp()},{merge:true}).catch(()=>{});const q=query(collection(db,"supportThreads",S.user.uid,"messages"),orderBy("createdAt","asc"),limit(200));addOff(onSnapshot(q,s=>{$("#supportMessages").innerHTML=s.docs.map(d=>{const m=d.data();return `<div class="msg ${m.senderId===S.user.uid?"me":""}">${esc(m.text||"")}</div>`}).join("");$("#supportMessages").scrollTop=$("#supportMessages").scrollHeight}))}
$("#supportForm").onsubmit=async e=>{e.preventDefault();const t=$("#supportText").value.trim();if(!t)return;await addDoc(collection(db,"supportThreads",S.user.uid,"messages"),{senderId:S.user.uid,text:t,createdAt:serverTimestamp()});await setDoc(doc(db,"supportThreads",S.user.uid),{userId:S.user.uid,userLabel:S.profile.displayName||S.profile.username||S.user.phoneNumber||"",updatedAt:serverTimestamp()},{merge:true});$("#supportText").value=""};

$("#walletRequestForm").onsubmit=async e=>{e.preventDefault();try{
  let proofUrl="";const f=$("#walletProof").files[0];if(f)proofUrl=await upload(f,"whatssap-business-pro/proofs",8*1024*1024,"image/");
  await addDoc(collection(db,"financialRequests"),{userId:S.user.uid,type:$("#walletType").value,amount:Number($("#walletAmount").value),currency:$("#walletCurrency").value,method:$("#walletMethod").value,destination:$("#walletDestination").value.trim(),reference:$("#walletReference").value.trim(),proofUrl,note:$("#walletNote").value.trim(),status:"pending",createdAt:serverTimestamp()});
  e.target.reset();toast("Demann operasyon voye.");
}catch(x){console.error(x);toast(x.message||"Demann pa voye.");}};
$("#exchangeForm").onsubmit=async e=>{e.preventDefault();const amount=Number($("#exchangeAmount").value),from=$("#exchangeFrom").value,to=$("#exchangeTo").value;if(!(amount>0)||from===to)return toast("Verifye echanj la.");await addDoc(collection(db,"exchangeRequests"),{userId:S.user.uid,amount,from,to,status:"pending",createdAt:serverTimestamp()});e.target.reset();toast("Demann echanj voye.")};
function watchWallet(){
  addOff(onSnapshot(doc(db,"users",S.user.uid),s=>{const b=s.data()?.walletBalances||{};$("#walletBalances").innerHTML=appSettings.currencies.map(c=>`<div class="balanceCard"><b>${money(b[c]||0,c)}</b><small>Balans</small></div>`).join("");$("#mBalance").textContent=money(b.HTG||0,"HTG")}));
  const fq=query(collection(db,"financialRequests"),where("userId","==",S.user.uid)),eq=query(collection(db,"exchangeRequests"),where("userId","==",S.user.uid));
  let a=[],b=[];const render=()=>{$("#operationHistory").innerHTML=[...a,...b].sort((x,y)=>(y.createdAt?.seconds||0)-(x.createdAt?.seconds||0)).map(x=>`<div class="historyRow"><b>${esc(x.type||"exchange")}</b> • ${money(x.amount,x.currency||x.from)} <span class="status ${esc(x.status||"pending")}">${esc(x.status||"pending")}</span></div>`).join("")||'<p class="muted">Pa gen operasyon.</p>'};
  addOff(onSnapshot(fq,s=>{a=s.docs.map(d=>({id:d.id,...d.data()}));render()}));addOff(onSnapshot(eq,s=>{b=s.docs.map(d=>({id:d.id,type:"exchange",...d.data()}));render()}));
}

function watchLevels(){addOff(onSnapshot(collection(db,"investmentLevels"),s=>{const rows=s.docs.map(d=>({id:d.id,...d.data()})).filter(x=>x.active!==false);$("#investmentLevels").innerHTML=rows.length?rows.map(x=>`<div class="level"><h3>${esc(x.name)}</h3><b>${money(x.amount,x.currency)}</b><p>Pwofi: ${Number(x.rate||0)}% • ${esc(x.period||"monthly")}</p><button data-invest="${x.id}">Envesti</button></div>`).join(""):'<p class="muted">Pa gen nivo aktif.</p>';$$("[data-invest]").forEach(b=>b.onclick=()=>invest(rows.find(x=>x.id===b.dataset.invest))) }))}
async function invest(level){if(!level)return;await addDoc(collection(db,"investments"),{userId:S.user.uid,levelId:level.id,levelName:level.name,amount:Number(level.amount),currency:level.currency,rate:Number(level.rate||0),period:level.period||"monthly",status:"pending",createdAt:serverTimestamp()});toast("Demann envestisman voye.")}
function watchInvestments(){const q=query(collection(db,"investments"),where("userId","==",S.user.uid));addOff(onSnapshot(q,s=>{const a=s.docs.map(d=>({id:d.id,...d.data()}));$("#mInvest").textContent=a.filter(x=>x.status==="active"||x.status==="approved").length;$("#myInvestments").innerHTML=a.map(x=>`<div class="historyRow"><b>${esc(x.levelName||"Envestisman")}</b> • ${money(x.amount,x.currency)} <span class="status ${esc(x.status||"pending")}">${esc(x.status||"pending")}</span></div>`).join("")||'<p class="muted">Pa gen envestisman.</p>'}))}

$("#businessForm").onsubmit=async e=>{e.preventDefault();await setDoc(doc(db,"businesses",S.user.uid),{ownerId:S.user.uid,username:S.profile.username||"",name:$("#businessName").value.trim(),description:$("#businessDescription").value.trim(),hours:$("#businessHours").value.trim(),website:$("#businessWebsite").value.trim(),active:true,updatedAt:serverTimestamp()},{merge:true});toast("Pwofil biznis sove.")};
$("#businessToolsForm").onsubmit=async e=>{e.preventDefault();await setDoc(doc(db,"userSettings",S.user.uid),{businessTools:{greetingMessage:$("#greetingMessage").value.trim(),awayMessage:$("#awayMessage").value.trim(),quickReplies:$("#quickReplies").value.trim()},updatedAt:serverTimestamp()},{merge:true});toast("Zouti mesaj sove.")};
async function loadBusiness(){const [b,s]=await Promise.all([getDoc(doc(db,"businesses",S.user.uid)),getDoc(doc(db,"userSettings",S.user.uid))]);if(b.exists()){
  const x=b.data();
  if($("#businessName"))$("#businessName").value=x.name||"";
  if($("#businessDescription"))$("#businessDescription").value=x.description||"";
  if($("#businessHours"))$("#businessHours").value=x.hours||"";
  if($("#businessWebsite"))$("#businessWebsite").value=x.website||"";
  if($("#businessHoursProfile"))$("#businessHoursProfile").value=x.hours||"";
  if($("#businessWebsiteProfile"))$("#businessWebsiteProfile").value=x.website||"";
  if($("#instagramProfile"))$("#instagramProfile").value=x.instagram||"";
  if($("#facebookProfile"))$("#facebookProfile").value=x.facebook||"";
  if($("#businessEmailProfile"))$("#businessEmailProfile").value=x.email||"";
}if(s.exists()){const x=s.data().businessTools||{};$("#greetingMessage").value=x.greetingMessage||"";$("#awayMessage").value=x.awayMessage||"";$("#quickReplies").value=x.quickReplies||""}}

$("#adForm")?.addEventListener("submit",async e=>{e.preventDefault();await addDoc(collection(db,"adRequests"),{userId:S.user.uid,product:$("#adProduct")?.value||"",country:$("#adCountry")?.value||"",budget:Number($("#adBudget")?.value||0),currency:$("#adCurrency")?.value||"HTG",goal:$("#adGoal")?.value||"Sales",description:$("#adDescription")?.value||"",status:"pending",createdAt:serverTimestamp()});toast("Kanpay piblisite voye.")});

async function reportCase(type,targetId,title){await addDoc(collection(db,"moderationCases"),{reporterId:S.user.uid,type,targetId,title,status:"open",createdAt:serverTimestamp()});toast("Rapò voye.")}

$("#assistantForm").onsubmit=e=>{e.preventDefault();const t=$("#assistantInput").value.trim();if(!t)return;const low=t.toLowerCase();let a="Mwen ka ede w ak chat, marketplace, wallet, envestisman, Business Pro ak boost.";if(low.includes("depo"))a="Ale nan Wallet pou fè depo/retrè. Pou Boost, ale Business Pro > Boost & Ads epi chwazi MonCash oswa NatCash.";else if(low.includes("boost")||low.includes("piblisite"))a="Nan Business Pro, depoze nan Ad Wallet an HTG oswa USD, chwazi pwodwi/clip, bidjè pa jou, dire ak odyans, epi voye boost la pou validasyon.";else if(low.includes("vann"))a="Ale Marketplace > + Vann pou mete pwodwi a.";$("#assistantMessages").innerHTML+=`<div class="msg me">${esc(t)}</div><div class="msg">${esc(a)}</div>`;$("#assistantInput").value=""};

function watchOrders(){const q=query(collection(db,"orders"),where("buyerId","==",S.user.uid));addOff(onSnapshot(q,s=>$("#mOrders").textContent=s.size))}
function applyLang(){
  const l=$("#lang")?.value||localStorage.getItem("wbp_lang")||"ht";
  window.WBP_SET_LANG?.(l);
}
if($("#lang")){
  $("#lang").value=localStorage.getItem("wbp_lang")||"ht";
  $("#lang").onchange=applyLang;
}
window.WBP_TRANSLATE?.();

onAuthStateChanged(auth,async u=>{
  clearOffs();S.user=u;
  if(!u){
    $("#authScreen").classList.remove("hidden");
    $("#phoneSetupScreen")?.classList.add("hidden");
    $("#appShell").classList.add("hidden");
    return;
  }
  if(!(await ensureUser(u)))return;
  const accountSnap=await getDoc(doc(db,"users",u.uid));
  S.account=accountSnap.exists()?accountSnap.data():{};
  $("#authScreen").classList.add("hidden");
  if(!validMobile(S.account.phone||"")){
    $("#appShell").classList.add("hidden");
    $("#phoneSetupScreen")?.classList.remove("hidden");
    if($("#mobilePhoneSetup"))$("#mobilePhoneSetup").value=S.account.phone||"";
    return;
  }
  $("#phoneSetupScreen")?.classList.add("hidden");
  $("#appShell").classList.remove("hidden");
  go("chat");
  await loadProfile();
  try{await syncPhoneDirectory(S.account.phone||"",S.account.phone||"",{displayName:S.profile.displayName||S.user.displayName||"",username:S.profile.username||""})}
  catch(e){console.warn("phone directory login sync",e)}
  loadCart();await loadBusiness();
  watchProducts();watchBoosts();watchClips();watchChats();watchSupport();watchWallet();watchLevels();watchInvestments();watchOrders();
});

if("serviceWorker" in navigator)window.addEventListener("load",()=>navigator.serviceWorker.register("./sw.js").catch(console.error));
