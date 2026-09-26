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
const S={user:null,profile:{},account:{},chatId:null,chatOtherUid:null,chatOtherName:"",chatPresenceOff:null,presenceTimer:null,chatRows:[],chatFilter:"all",chatFallbackOffs:[],chatPrefs:{},currentClipId:null,products:[],clips:[],boosts:[],cart:[],unsubs:[]};

if(!configured()){
  $("#authScreen").classList.add("hidden");
  $("#setupScreen").classList.remove("hidden");
  throw new Error("Configure independent Firebase in firebase-config.js");
}

const app=initializeApp(firebaseConfig),auth=getAuth(app),db=getFirestore(app),storage=getStorage(app);
useDeviceLanguage(auth);

function addOff(f){if(typeof f==="function")S.unsubs.push(f)}
function presenceDate(v){
  if(!v)return null;
  if(typeof v?.toDate==="function")return v.toDate();
  if(v instanceof Date)return v;
  const d=new Date(v);
  return Number.isNaN(d.getTime())?null:d;
}
function presenceText(data={}){
  const seen=presenceDate(data.lastSeen);
  const age=seen?Date.now()-seen.getTime():Infinity;
  if(data.online===true&&age<70000)return "en ligne";
  if(!seen)return "";
  const now=new Date();
  const hhmm=new Intl.DateTimeFormat("fr",{hour:"2-digit",minute:"2-digit"}).format(seen);
  const sameDay=seen.getFullYear()===now.getFullYear()&&seen.getMonth()===now.getMonth()&&seen.getDate()===now.getDate();
  if(sameDay)return "vu aujourd’hui à "+hhmm;
  const y=new Date(now);y.setDate(now.getDate()-1);
  const yesterday=seen.getFullYear()===y.getFullYear()&&seen.getMonth()===y.getMonth()&&seen.getDate()===y.getDate();
  if(yesterday)return "vu hier à "+hhmm;
  const dm=new Intl.DateTimeFormat("fr",{day:"2-digit",month:"2-digit"}).format(seen);
  return "vu le "+dm+" à "+hhmm;
}
async function writePresence(online){
  if(!S.user)return;
  try{
    await setDoc(doc(db,"publicProfiles",S.user.uid),{
      presenceOnline:online===true,
      lastSeen:serverTimestamp()
    },{merge:true});
  }catch(e){console.warn("presence write",e?.code||e)}
}
function startPresence(){
  clearInterval(S.presenceTimer);
  if(!S.user)return;
  writePresence(document.visibilityState==="visible"&&navigator.onLine);
  S.presenceTimer=setInterval(()=>{
    if(S.user)writePresence(document.visibilityState==="visible"&&navigator.onLine);
  },25000);
}
function stopPresence(){
  clearInterval(S.presenceTimer);S.presenceTimer=null;
}
function watchPeerPresence(uid){
  S.chatPresenceOff?.();S.chatPresenceOff=null;
  const statusEl=()=>$("#chatContactInfoBtn .waChatHeaderIdentity small");
  if(!uid){const el=statusEl();if(el)el.textContent="";return}
  let latest={};
  const render=()=>{
    const el=statusEl();if(!el)return;
    el.textContent=presenceText({online:latest.presenceOnline,lastSeen:latest.lastSeen});
  };
  const unsub=onSnapshot(doc(db,"publicProfiles",uid),snap=>{
    latest=snap.exists()?snap.data():{};
    render();
  },err=>{
    console.warn("presence watch",err?.code||err);
    latest={};render();
  });
  const timer=setInterval(render,10000);
  S.chatPresenceOff=()=>{try{unsub()}catch{}clearInterval(timer)};
}
function clearChatFallback(){
  S.chatFallbackOffs.forEach(f=>{try{f()}catch{}});
  S.chatFallbackOffs=[];
}
function clearOffs(){S.unsubs.forEach(f=>{try{f()}catch{}});S.unsubs=[];clearChatFallback()}
function go(name){
  if(typeof window.WBP_ROUTE==="function")return window.WBP_ROUTE(name);
  const target=$("#"+name+"Page");if(!target)return false;
  $$(".page").forEach(x=>x.classList.remove("active"));
  target.classList.add("active");
  return true;
}
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

function openWalletAction(type){
  go("wallet");
  if($("#walletType"))$("#walletType").value=type;
  setTimeout(()=>{
    $("#walletRequestForm")?.scrollIntoView({behavior:"smooth",block:"start"});
    $("#walletAmount")?.focus();
  },80);
}
$$("[data-wallet-action]").forEach(b=>b.addEventListener("click",()=>openWalletAction(b.dataset.walletAction)));
$$("[data-create-action]").forEach(b=>b.addEventListener("click",()=>{
  const action=b.dataset.createAction;
  if(action==="product"){
    go("market");$("#sellBox")?.classList.remove("hidden");
    setTimeout(()=>$("#sellBox")?.scrollIntoView({behavior:"smooth",block:"start"}),80);
  }else if(action==="video"){
    go("clips");$("#clipForm")?.classList.remove("hidden");
    setTimeout(()=>$("#clipForm")?.scrollIntoView({behavior:"smooth",block:"start"}),80);
  }else if(action==="status"){
    go("status");$("#statusForm")?.classList.remove("hidden");
  }else if(action==="deposit"||action==="withdrawal"){
    openWalletAction(action);
  }else if(action==="boost"){
    go("business");
    setTimeout(()=>$("#boostForm")?.scrollIntoView({behavior:"smooth",block:"start"}),80);
  }else if(action==="calls"){
    go("calls");
  }else if(action==="tools"){
    go("tools");
  }
}));


function fillCurrencies(){
  ["#pCurrency","#walletCurrency","#exchangeFrom","#exchangeTo","#levelCurrency"].forEach(sel=>{
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
$("#logout").onclick=async()=>{await writePresence(false);stopPresence();await signOut(auth)};
$("#phoneSetupLogout")?.addEventListener("click",async()=>{await writePresence(false);stopPresence();await signOut(auth)});
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
  $("#avatarPreview").src=S.profile.photoUrl||S.user.photoURL||"assets/logo.webp";
  const publicName=S.profile.displayName||S.profile.username||S.user.displayName||"Mon profil";
  if($("#profileHeroName"))$("#profileHeroName").textContent=publicName;
  if($("#profileHeroUsername"))$("#profileHeroUsername").textContent=S.profile.username?("@"+S.profile.username):"@utilisateur";
  if($("#profileHeroRole")){
    const roles={buyer:"Acheteur",seller:"Vendeur",business:"Entreprise",investor:"Investisseur"};
    $("#profileHeroRole").textContent=roles[S.profile.role]||"Compte";
  }
  $("#headerUser").textContent=S.profile.displayName||S.profile.username||S.user.displayName||S.user.email||"User";
  if($("#mobilePhoneProfile"))$("#mobilePhoneProfile").value=S.account.phone||"";
  if($("#profilePhoneDisplay"))$("#profilePhoneDisplay").textContent=S.user.email||S.user.displayName||"Compte Google";
}
let profilePreviewUrl="";
$("#avatarFile")?.addEventListener("change",e=>{
  const f=e.target.files?.[0];
  if(!f)return;
  if(!f.type.startsWith("image/"))return toast("Chwazi yon foto.");
  if(f.size>8*1024*1024){e.target.value="";return toast("Foto a twò gwo. Maksimòm 8 MB.");}
  if(profilePreviewUrl)URL.revokeObjectURL(profilePreviewUrl);
  profilePreviewUrl=URL.createObjectURL(f);
  $("#avatarPreview").src=profilePreviewUrl;
});
$("#profileSettingsBtn")?.addEventListener("click",()=>go("settings"));
$("#profileEditBtn")?.addEventListener("click",()=>$("#displayName")?.focus());
$("#profileAssistantBtn")?.addEventListener("click",()=>$("#profileAssistantBox")?.classList.toggle("hidden"));
$("#profileShareBtn")?.addEventListener("click",async()=>{
  const url=location.origin+location.pathname;
  const text=(S.profile.displayName||S.profile.username||"Profil")+" — Whatsapp Business Pro";
  try{
    if(navigator.share)await navigator.share({title:"Whatsapp Business Pro",text,url});
    else{await navigator.clipboard.writeText(url);toast("Lyen profil la kopye.");}
  }catch(e){if(e?.name!=="AbortError")toast("Pataj la pa disponib.");}
});

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
  await loadProfile();
  if(profilePreviewUrl){URL.revokeObjectURL(profilePreviewUrl);profilePreviewUrl="";}
  window.WBP_ACTIVITY?.("profile_saved","profile",{role:$("#role")?.value||""});
  toast("Profil sove.");
}catch(x){console.error(x);window.WBP_ACTIVITY?.("profile_save_failed","profile",{code:x?.code||""});toast(x.message||"Profil pa t sove.");}};
$("#shareLocation").onclick=()=>{
  if(!navigator.geolocation)return toast("Lokalizasyon pa disponib.");
  $("#locationStatus").textContent="Ap chèche...";
  navigator.geolocation.getCurrentPosition(async p=>{
    try{
      const loc={lat:p.coords.latitude,lng:p.coords.longitude,accuracy:p.coords.accuracy,sharedAt:serverTimestamp()};
      await setDoc(doc(db,"userSettings",S.user.uid),{location:loc},{merge:true});
      $("#locationStatus").textContent="Lokalizasyon pataje avèk presizyon "+Math.round(p.coords.accuracy)+" m.";
      window.WBP_ACTIVITY?.("location_saved","profile",{accuracy:Math.round(p.coords.accuracy)});
      toast("Lokalizasyon sove.");
    }catch(e){
      console.error(e);$("#locationStatus").textContent="Lokalizasyon pa t sove.";toast("Lokalizasyon pa t sove.");
    }
  },()=>{$("#locationStatus").textContent="Pèmisyon lokalizasyon refize.";window.WBP_ACTIVITY?.("location_denied","profile");},{enableHighAccuracy:true,timeout:12000});
};

$("#sellBtn").onclick=()=>$("#sellBox").classList.toggle("hidden");
$("#productForm").onsubmit=async e=>{e.preventDefault();try{
  const files=[...($("#pImage")?.files||[])].slice(0,6);
  const imageUrls=[];
  for(const f of files)imageUrls.push(await upload(f,"whatssap-business-pro/products",8*1024*1024,"image/"));
  const imageUrl=imageUrls[0]||"";
  await addDoc(collection(db,"products"),{sellerId:S.user.uid,sellerUsername:S.profile.username||"",sellerName:S.profile.displayName||"",name:$("#pName").value.trim(),price:Number($("#pPrice").value),currency:$("#pCurrency").value,category:$("#pCategory").value,stock:Number($("#pStock").value||0),description:$("#pDesc").value.trim(),imageUrl,imageUrls,active:true,createdAt:serverTimestamp()});
  e.target.reset();$("#sellBox").classList.add("hidden");window.WBP_ACTIVITY?.("product_published","market",{currency:$("#pCurrency")?.value||""});toast("Pwodwi pibliye.");
}catch(x){console.error(x);window.WBP_ACTIVITY?.("product_publish_failed","market",{code:x?.code||""});toast(x.message||"Pwodwi pa pibliye.");}};

function renderProducts(){
  const term=$("#marketSearch").value.trim().toLowerCase(),cat=$("#marketCategory").value;
  const sponsored=new Set(S.boosts.filter(b=>b.status==="active"&&b.targetType==="product").map(b=>b.targetId));
  const list=S.products.filter(p=>p.active!==false&&(!term||((p.name||"")+" "+(p.description||"")).toLowerCase().includes(term))&&(!cat||p.category===cat))
    .sort((a,b)=>Number(sponsored.has(b.id))-Number(sponsored.has(a.id)));
  $("#mProducts").textContent=list.length;
  $("#productGrid").innerHTML=list.length?list.map(p=>`<article class="product">${p.imageUrl?`<img src="${esc(p.imageUrl)}" alt="">`:""}<div class="productBody">${sponsored.has(p.id)?'<span class="status approved">Sponsored</span>':""}<h3>${esc(p.name)}</h3><p>${esc(p.description||"")}</p><b>${money(p.price,p.currency)}</b><div class="productActions"><button data-cart="${p.id}">Ajoute</button><button class="ghost" data-seller="${esc(p.sellerUsername||"")}">Chat</button></div></div></article>`).join(""):'<p class="muted">Pa gen pwodwi.</p>';
  $$("[data-cart]").forEach(b=>b.onclick=()=>addCart(b.dataset.cart));
  $$("[data-seller]").forEach(b=>b.onclick=async()=>{
    const un=norm(b.dataset.seller||"");
    if(!un)return toast("Vandè a pa gen username.");
    try{
      const s=await getDocs(query(collection(db,"publicProfiles"),where("username","==",un),limit(1)));
      if(s.empty)return toast("Vandè a pa jwenn.");
      const o=s.docs[0];
      if(o.id===S.user.uid)return toast("Sa se pwòp kont pa w.");
      const ids=[S.user.uid,o.id].sort(),id=ids.join("__");
      const names={[S.user.uid]:S.profile.displayName||S.profile.username||"User",[o.id]:o.data().displayName||o.data().username||"User"};
      const ref=doc(db,"chats",id);
      try{
        await setDoc(ref,{type:"direct",participants:ids,participantNames:names},{merge:true});
      }catch(writeErr){
        if(writeErr?.code!=="permission-denied")throw writeErr;
        const existing=await getDoc(ref);
        if(!existing.exists())throw writeErr;
      }
      go("chat");await openChat(id,names[o.id]);
    }catch(e){console.error(e);toast("Chat vandè a pa ouvri.");}
  });
}
$("#marketSearch").oninput=renderProducts;$("#marketCategory").onchange=renderProducts;
function watchProducts(){addOff(onSnapshot(query(collection(db,"products"),limit(150)),s=>{S.products=s.docs.map(d=>({id:d.id,...d.data()}));renderProducts();refreshClipProductOptions()}))}
function watchBoosts(){addOff(onSnapshot(query(collection(db,"adCampaigns"),where("status","==","active")),s=>{S.boosts=s.docs.map(d=>({id:d.id,...d.data()}));renderProducts();renderClips()}))}

function cartKey(){return "wbp_cart_"+S.user.uid}
function loadCart(){try{S.cart=JSON.parse(localStorage.getItem(cartKey())||"[]")}catch{S.cart=[]}renderCart()}
function saveCart(){localStorage.setItem(cartKey(),JSON.stringify(S.cart));renderCart()}
function addCart(id){const p=S.products.find(x=>x.id===id);if(!p)return;const x=S.cart.find(i=>i.id===id);if(x)x.qty++;else S.cart.push({id:p.id,name:p.name,price:p.price,currency:p.currency,sellerId:p.sellerId,qty:1});saveCart();window.WBP_ACTIVITY?.("cart_add","market",{productId:id});toast("Ajoute nan panier.")}
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
  const orderCount=Object.keys(groups).length;S.cart=[];saveCart();$("#cartBox").classList.add("hidden");window.WBP_ACTIVITY?.("order_created","market",{orders:orderCount});toast("Kòmand kreye.");
}catch(x){console.error(x);window.WBP_ACTIVITY?.("order_create_failed","market",{code:x?.code||""});toast(x.message||"Kòmand pa kreye.");}};

$("#clipBtn").onclick=()=>{
  refreshClipProductOptions();
  $("#clipForm").classList.toggle("hidden");
};
function refreshClipProductOptions(){
  const sel=$("#clipProduct");if(!sel)return;
  const current=sel.value;
  const mine=S.products.filter(p=>p.sellerId===S.user?.uid&&p.active!==false);
  sel.innerHTML='<option value="">Aucun produit associé</option>'+mine.map(p=>'<option value="'+esc(p.id)+'">'+esc(p.name||"Produit")+'</option>').join("");
  if([...sel.options].some(o=>o.value===current))sel.value=current;
}
$("#clipForm").onsubmit=async e=>{e.preventDefault();try{
  const f=$("#clipFile").files[0];
  if(!f)return toast("Chwazi yon videyo.");
  const videoUrl=await upload(f,"whatssap-business-pro/clips",80*1024*1024,"video/");
  const productId=$("#clipProduct")?.value||"";
  const product=S.products.find(p=>p.id===productId)||null;
  await addDoc(collection(db,"shortVideos"),{
    ownerId:S.user.uid,
    username:S.profile.username||"",
    displayName:S.profile.displayName||"",
    caption:$("#clipCaption").value.trim(),
    videoUrl,productId,
    productName:product?.name||"",
    active:true,createdAt:serverTimestamp()
  });
  e.target.reset();$("#clipForm").classList.add("hidden");window.WBP_ACTIVITY?.("video_published","clips",{productLinked:!!productId});toast("Vidéo publiée.");
}catch(x){console.error(x);window.WBP_ACTIVITY?.("video_publish_failed","clips",{code:x?.code||""});toast(x.message||"Vidéo non publiée.");}};

async function toggleClipLike(id){
  if(!S.user)return;
  const localKey="wbp_clip_like_"+S.user.uid+"_"+id;
  const r=doc(db,"shortVideos",id,"likes",S.user.uid);
  try{
    const s=await getDoc(r);
    if(s.exists()){
      await deleteDoc(r);localStorage.removeItem(localKey);window.WBP_ACTIVITY?.("video_unliked","clips",{videoId:id});toast("Like retiré.");
    }else{
      await setDoc(r,{createdAt:serverTimestamp()});localStorage.setItem(localKey,"1");window.WBP_ACTIVITY?.("video_liked","clips",{videoId:id});toast("Like enregistré.");
    }
  }catch(e){
    console.warn("clip like remote",e?.code||e);
    const liked=localStorage.getItem(localKey)==="1";
    if(liked){localStorage.removeItem(localKey);toast("Like retiré localement.");}
    else{localStorage.setItem(localKey,"1");toast("Like enregistré localement.");}
  }
}
async function shareClip(id){
  const v=S.clips.find(x=>x.id===id);if(!v)return;
  const url=location.origin+location.pathname+"#video="+encodeURIComponent(id);
  const data={title:"Whatsapp Business Pro",text:(v.caption||"Vidéo").slice(0,160),url};
  try{
    if(navigator.share)await navigator.share(data);
    else{await navigator.clipboard.writeText(url);toast("Lien vidéo copié.");}
  }catch(e){if(e?.name!=="AbortError")toast("Partage indisponible.");}
}
function localClipComments(id){
  try{return JSON.parse(localStorage.getItem("wbp_clip_comments_"+id)||"[]")}catch{return []}
}
function saveLocalClipComments(id,rows){
  localStorage.setItem("wbp_clip_comments_"+id,JSON.stringify(rows.slice(-100)));
}
function renderClipCommentRows(rows=[]){
  const box=$("#clipCommentsList");if(!box)return;
  box.innerHTML=rows.length?rows.map(x=>{
    const when=x.createdAtMs?new Date(x.createdAtMs):x.createdAt;
    return '<div class="clipCommentRow"><b>@'+esc(x.username||"user")+'</b><p>'+esc(x.text||"")+'</p><small>'+esc(messageDayLabel(when))+' • '+esc(messageClock(when))+(x.localOnly?' • local':'')+'</small></div>';
  }).join(""):'<p class="muted">Aucun commentaire.</p>';
}
async function openClipComments(id){
  S.currentClipId=id;
  $("#clipCommentsPanel")?.classList.remove("hidden");
  $("#clipCommentsPanel")?.setAttribute("aria-hidden","false");
  const box=$("#clipCommentsList");if(box)box.innerHTML='<p class="muted">Chargement…</p>';
  const local=localClipComments(id);
  try{
    const s=await getDocs(query(collection(db,"shortVideos",id,"comments"),orderBy("createdAt","asc"),limit(150)));
    const remote=s.docs.map(d=>({id:d.id,...d.data()}));
    renderClipCommentRows([...remote,...local]);
  }catch(e){
    console.warn("clip comments remote",e?.code||e);
    renderClipCommentRows(local);
    if(!local.length&&box)box.innerHTML='<p class="muted">Aucun commentaire synchronisé.</p>';
  }
}
$("#closeClipComments")?.addEventListener("click",()=>{
  S.currentClipId=null;
  $("#clipCommentsPanel")?.classList.add("hidden");
  $("#clipCommentsPanel")?.setAttribute("aria-hidden","true");
});
$("#clipCommentForm")?.addEventListener("submit",async e=>{
  e.preventDefault();
  const id=S.currentClipId,text=$("#clipCommentText")?.value.trim()||"";
  if(!id||!text)return;
  const username=S.profile.username||S.profile.displayName||"user";
  try{
    await addDoc(collection(db,"shortVideos",id,"comments"),{
      userId:S.user.uid,username,text,createdAt:serverTimestamp()
    });
    $("#clipCommentText").value="";
    window.WBP_ACTIVITY?.("video_comment_created","clips",{videoId:id});
    await openClipComments(id);
  }catch(err){
    console.warn("clip comment remote",err?.code||err);
    const rows=localClipComments(id);
    rows.push({userId:S.user.uid,username,text,createdAtMs:Date.now(),localOnly:true});
    saveLocalClipComments(id,rows);
    $("#clipCommentText").value="";
    renderClipCommentRows(rows);
    toast("Commentaire enregistré sur cet appareil.");
  }
});
function openClipProduct(id){
  const v=S.clips.find(x=>x.id===id);
  if(!v?.productId)return toast("Aucun produit associé.");
  go("market");
  const p=S.products.find(x=>x.id===v.productId);
  if(p&&$("#marketSearch")){$("#marketSearch").value=p.name||"";renderProducts();}
}
function renderClips(){
  const sponsored=new Set(S.boosts.filter(b=>b.status==="active"&&b.targetType==="clip").map(b=>b.targetId));
  const list=[...S.clips].filter(v=>v.active!==false).sort((a,b)=>Number(sponsored.has(b.id))-Number(sponsored.has(a.id)));
  $("#clipFeed").innerHTML=list.length?list.map(v=>`<article class="clip">
    <video src="${esc(v.videoUrl)}" controls playsinline preload="metadata"></video>
    <div class="clipOverlay">
      ${sponsored.has(v.id)?'<span class="status approved">Sponsored</span>':""}
      <b>@${esc(v.username||"user")}</b>
      <p>${esc(v.caption||"")}</p>
      ${v.productId?'<button class="clipProductBtn" data-clip-product="'+v.id+'">🛍️ '+esc(v.productName||"Voir le produit")+'</button>':""}
      <div class="actions">
        <button data-like="${v.id}">♡ Like</button>
        <button data-comments="${v.id}">💬 Commentaires</button>
        <button data-shareclip="${v.id}">↗ Partager</button>
        <button data-reportclip="${v.id}">⚑ Signaler</button>
      </div>
    </div>
  </article>`).join(""):'<p class="muted">Aucune vidéo.</p>';
  $$("[data-like]").forEach(b=>b.onclick=()=>toggleClipLike(b.dataset.like));
  $$("[data-comments]").forEach(b=>b.onclick=()=>openClipComments(b.dataset.comments));
  $$("[data-shareclip]").forEach(b=>b.onclick=()=>shareClip(b.dataset.shareclip));
  $$("[data-clip-product]").forEach(b=>b.onclick=()=>openClipProduct(b.dataset.clipProduct));
  $$("[data-reportclip]").forEach(b=>b.onclick=()=>reportCase("clip",b.dataset.reportclip,"Vidéo signalée"));
}
function watchClips(){addOff(onSnapshot(query(collection(db,"shortVideos"),limit(80)),s=>{S.clips=s.docs.map(d=>({id:d.id,...d.data()}));renderClips()}))}
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
async function watchChatsFallback(){
  clearChatFallback();
  if(!S.user)return;
  try{
    const contactsSnap=await getDocs(collection(db,"users",S.user.uid,"contacts"));
    const uids=[...new Set(contactsSnap.docs.map(d=>d.data()?.contactUid).filter(Boolean))];
    if(!uids.length){S.chatRows=[];renderChatList();return}
    S.chatRows=[];
    const upsert=row=>{
      const i=S.chatRows.findIndex(x=>x.id===row.id);
      if(i>=0)S.chatRows[i]=row;else S.chatRows.push(row);
      S.chatRows.sort((a,b)=>(b.updatedAt?.seconds||0)-(a.updatedAt?.seconds||0));
      renderChatList();
    };
    const remove=id=>{
      S.chatRows=S.chatRows.filter(x=>x.id!==id);
      renderChatList();
    };
    uids.forEach(uid=>{
      const id=[S.user.uid,uid].sort().join("__");
      const off=onSnapshot(doc(db,"chats",id),snap=>{
        if(snap.exists())upsert({id:snap.id,...snap.data()});else remove(id);
      },err=>console.warn("direct chat fallback",id,err?.code||err));
      S.chatFallbackOffs.push(off);
    });
  }catch(e){
    console.error("chat fallback",e);
    const box=$("#chatList");
    if(box&&!S.chatRows.length)box.innerHTML='<div class="chatItem muted">Aucune discussion pour le moment.</div>';
  }
}
async function refreshChatsOnce(){
  if(!S.user)return;
  const q=query(collection(db,"chats"),where("participants","array-contains",S.user.uid));
  try{
    const s=await getDocs(q);
    S.chatRows=s.docs.map(d=>({id:d.id,...d.data()})).sort((a,b)=>(b.updatedAt?.seconds||0)-(a.updatedAt?.seconds||0));
    renderChatList();
  }catch(e){
    console.warn("refresh chats",e?.code||e);
    if(e?.code==="permission-denied")await watchChatsFallback();
    else if(!S.chatRows.length)renderChatList();
  }
}
function watchChats(){
  clearChatFallback();
  const q=query(collection(db,"chats"),where("participants","array-contains",S.user.uid));
  refreshChatsOnce();
  addOff(onSnapshot(q,s=>{
    clearChatFallback();
    S.chatRows=s.docs.map(d=>({id:d.id,...d.data()})).sort((a,b)=>(b.updatedAt?.seconds||0)-(a.updatedAt?.seconds||0));
    renderChatList();
  },e=>{
    console.warn("watch chats",e?.code||e);
    if(e?.code==="permission-denied")watchChatsFallback();
    else if(!S.chatRows.length)renderChatList();
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

function chatLocale(){
  const l=$("#lang")?.value||localStorage.getItem("wbp_lang")||"ht";
  return {ht:"ht-HT",fr:"fr-FR",en:"en-US",es:"es-ES"}[l]||"fr-FR";
}
function messageDate(v){
  if(!v)return null;
  if(v instanceof Date)return v;
  if(typeof v?.toDate==="function")return v.toDate();
  if(v?.seconds)return new Date(v.seconds*1000);
  const d=new Date(v);
  return Number.isNaN(d.getTime())?null:d;
}
function localDayKey(d){
  if(!d)return "";
  return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0");
}
function messageClock(v){
  const d=messageDate(v);if(!d)return "";
  return new Intl.DateTimeFormat(chatLocale(),{hour:"2-digit",minute:"2-digit"}).format(d);
}
function messageDayLabel(v){
  const d=messageDate(v);if(!d)return "";
  const now=new Date(),today=new Date(now.getFullYear(),now.getMonth(),now.getDate());
  const day=new Date(d.getFullYear(),d.getMonth(),d.getDate());
  const diff=Math.round((today-day)/86400000);
  const l=$("#lang")?.value||localStorage.getItem("wbp_lang")||"ht";
  const labels={
    ht:{today:"Jodi a",yesterday:"Yè"},
    fr:{today:"Aujourd’hui",yesterday:"Hier"},
    en:{today:"Today",yesterday:"Yesterday"},
    es:{today:"Hoy",yesterday:"Ayer"}
  }[l]||{today:"Aujourd’hui",yesterday:"Hier"};
  if(diff===0)return labels.today;
  if(diff===1)return labels.yesterday;
  if(diff>1&&diff<7){
    const s=new Intl.DateTimeFormat(chatLocale(),{weekday:"long"}).format(d);
    return s.charAt(0).toUpperCase()+s.slice(1);
  }
  return new Intl.DateTimeFormat(chatLocale(),{day:"numeric",month:"long",year:"numeric"}).format(d);
}
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
  document.documentElement.classList.remove("chatConversationOpen");
  $("#messageForm")?.classList.add("hidden");
  $("#chatMoreMenu")?.classList.add("hidden");
  closeChatActionPanel();
  S.chatPresenceOff?.();S.chatPresenceOff=null;
  S.chatId=null;S.chatOtherUid=null;S.chatOtherName="";
  window.WBP_CURRENT_CHAT=null;
  renderChatList();
  refreshChatsOnce();
}
window.WBP_CLOSE_CHAT=closeChatView;
async function resolveChatPeer(id){
  let chat=S.chatRows.find(x=>x.id===id)||null;
  if(!chat){
    const snap=await getDoc(doc(db,"chats",id));
    if(snap.exists())chat={id:snap.id,...snap.data()};
  }
  const uid=chat?.participants?.find(x=>x!==S.user.uid)||null;
  return {chat,uid};
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
$("#chatInfoVoiceBtn")?.addEventListener("click",()=>window.dispatchEvent(new CustomEvent("wbp-start-call",{detail:{mode:"voice",chatId:S.chatId,uid:S.chatOtherUid,name:S.chatOtherName}})));
$("#chatInfoVideoBtn")?.addEventListener("click",()=>window.dispatchEvent(new CustomEvent("wbp-start-call",{detail:{mode:"video",chatId:S.chatId,uid:S.chatOtherUid,name:S.chatOtherName}})));

function closeChatActionPanel(){
  $("#chatActionPanel")?.classList.add("hidden");
  $("#chatActionPanel")?.setAttribute("aria-hidden","true");
}
function openChatActionPanel(title,html){
  if($("#chatActionTitle"))$("#chatActionTitle").textContent=title||"Discussion";
  if($("#chatActionBody"))$("#chatActionBody").innerHTML=html||"";
  $("#chatActionPanel")?.classList.remove("hidden");
  $("#chatActionPanel")?.setAttribute("aria-hidden","false");
}
$("#closeChatActionPanel")?.addEventListener("click",closeChatActionPanel);

function chatPrefRef(){
  if(!S.user||!S.chatId)return null;
  return doc(db,"users",S.user.uid,"chatPrefs",S.chatId);
}
function chatPrefLocalKey(){
  return S.user&&S.chatId?"wbp_chatprefs_"+S.user.uid+"_"+S.chatId:"";
}
async function loadChatPrefs(){
  const key=chatPrefLocalKey();
  let local={};
  try{if(key)local=JSON.parse(localStorage.getItem(key)||"{}")}catch{}
  S.chatPrefs=local;
  const r=chatPrefRef();
  if(r){
    try{
      const s=await getDoc(r);
      if(s.exists()){
        S.chatPrefs={...local,...s.data()};
        if(key)localStorage.setItem(key,JSON.stringify(S.chatPrefs));
      }
    }catch(e){console.warn("chat prefs remote",e?.code||e)}
  }
  applyChatTheme();
  return S.chatPrefs;
}
async function saveChatPrefs(patch){
  S.chatPrefs={...S.chatPrefs,...patch};
  const key=chatPrefLocalKey();
  if(key)localStorage.setItem(key,JSON.stringify(S.chatPrefs));
  applyChatTheme();
  const r=chatPrefRef();
  if(r)setDoc(r,{...patch,updatedAt:serverTimestamp()},{merge:true}).catch(e=>console.warn("chat prefs remote save",e?.code||e));
  if("disappearingDuration" in patch && S.chatId && S.chatOtherUid){
    addDoc(collection(db,"chats",S.chatId,"messages"),{
      senderId:S.user.uid,type:"document",readBy:[S.user.uid],
      chatSignal:{kind:"ephemeral",value:patch.disappearingDuration,to:S.chatOtherUid,from:S.user.uid,sentAt:Date.now()},
      createdAt:serverTimestamp()
    }).catch(e=>console.warn("ephemeral sync",e?.code||e));
  }
}
function applyChatTheme(){
  const conv=$("#chatPage .conversation");
  if(conv)conv.dataset.chatTheme=S.chatPrefs.theme||"default";
}
async function currentChatMessages(){
  if(!S.chatId)return [];
  const s=await getDocs(query(collection(db,"chats",S.chatId,"messages"),orderBy("createdAt","asc"),limit(300)));
  return s.docs.map(d=>({id:d.id,...d.data()}));
}
async function openChatSearch(){
  closeChatActionPanel();
  openChatActionPanel("Rechercher",'<div class="chatActionSearch"><input id="chatActionSearchInput" placeholder="Rechercher dans cette discussion..." autofocus></div><div id="chatActionResults" class="chatActionResults"><p class="muted">Tapez un mot pour rechercher.</p></div>');
  const rows=await currentChatMessages().catch(()=>[]);
  const input=$("#chatActionSearchInput"),box=$("#chatActionResults");
  const render=()=>{
    const q=(input?.value||"").trim().toLowerCase();
    if(!q){box.innerHTML='<p class="muted">Tapez un mot pour rechercher.</p>';return}
    const found=rows.filter(m=>((m.text||"")+" "+(m.fileName||"")).toLowerCase().includes(q));
    box.innerHTML=found.length?found.map(m=>'<div class="chatActionResult"><div>'+esc(m.text||m.fileName||"Média")+'</div><small>'+esc(messageDayLabel(m.createdAt))+' • '+esc(messageClock(m.createdAt))+'</small></div>').join(""):'<p class="muted">Aucun résultat.</p>';
  };
  input?.addEventListener("input",render);
  setTimeout(()=>input?.focus(),60);
}
async function openChatMedia(){
  closeChatActionPanel();
  openChatActionPanel("Médias, liens et documents",'<div id="chatActionResults" class="chatActionResults"><p class="muted">Chargement…</p></div>');
  const rows=await currentChatMessages().catch(()=>[]);
  const items=rows.filter(m=>m.type==="image"||m.type==="audio"||m.type==="document"||/https?:\/\//i.test(m.text||""));
  const box=$("#chatActionResults");
  if(!items.length){box.innerHTML='<p class="muted">Aucun média, lien ou document.</p>';return}
  box.innerHTML=items.map(m=>{
    if(m.type==="image"&&m.mediaUrl)return '<a class="chatMediaRow" href="'+esc(m.mediaUrl)+'" target="_blank" rel="noopener"><img src="'+esc(m.mediaUrl)+'" alt=""><span>Photo</span><small>'+esc(messageClock(m.createdAt))+'</small></a>';
    if(m.type==="audio"&&m.mediaUrl)return '<div class="chatMediaRow"><span>🎤 Message vocal</span><audio controls src="'+esc(m.mediaUrl)+'"></audio></div>';
    if(m.type==="document"&&m.mediaUrl)return '<a class="chatMediaRow" href="'+esc(m.mediaUrl)+'" target="_blank" rel="noopener"><span>📄 '+esc(m.fileName||"Document")+'</span><small>'+esc(messageClock(m.createdAt))+'</small></a>';
    return '<div class="chatActionResult"><div>'+esc(m.text||"Lien")+'</div><small>'+esc(messageClock(m.createdAt))+'</small></div>';
  }).join("");
}
async function openMutePanel(){
  await loadChatPrefs();
  const muted=S.chatPrefs.muted===true;
  openChatActionPanel("Mode silencieux",'<div class="chatActionOption"><div><b>Notifications de cette discussion</b><small>'+ (muted?"Mode silencieux activé":"Notifications actives") +'</small></div><button id="toggleChatMute" type="button">'+(muted?"Réactiver":"Mettre en silencieux")+'</button></div>');
  $("#toggleChatMute")?.addEventListener("click",async()=>{
    await saveChatPrefs({muted:!muted});
    toast(!muted?"Discussion mise en silencieux.":"Notifications réactivées.");
    closeChatActionPanel();
  });
}
async function openEphemeralPanel(){
  await loadChatPrefs();
  const val=S.chatPrefs.disappearingDuration||"off";
  openChatActionPanel("Messages éphémères",'<div class="chatActionForm"><p class="muted">Choisissez la durée appliquée à cette discussion.</p><select id="chatDisappearSelect"><option value="off">Désactivé</option><option value="24h">24 heures</option><option value="7d">7 jours</option><option value="90d">90 jours</option></select><button id="saveChatDisappear" type="button">Enregistrer</button></div>');
  $("#chatDisappearSelect").value=val;
  $("#saveChatDisappear")?.addEventListener("click",async()=>{
    await saveChatPrefs({disappearingDuration:$("#chatDisappearSelect").value});
    toast("Durée des messages éphémères enregistrée.");
    closeChatActionPanel();
  });
}
async function openThemePanel(){
  await loadChatPrefs();
  const theme=S.chatPrefs.theme||"default";
  openChatActionPanel("Thème de la discussion",'<div class="chatThemeGrid"><button data-chat-theme-choice="default">Clair</button><button data-chat-theme-choice="green">Vert</button><button data-chat-theme-choice="blue">Bleu</button><button data-chat-theme-choice="rose">Rose</button><button data-chat-theme-choice="dark">Sombre</button></div>');
  $$("[data-chat-theme-choice]").forEach(b=>{
    b.classList.toggle("active",b.dataset.chatThemeChoice===theme);
    b.onclick=async()=>{
      await saveChatPrefs({theme:b.dataset.chatThemeChoice});
      toast("Thème de la discussion enregistré.");
      closeChatActionPanel();
    };
  });
}
function openReportPanel(){
  openChatActionPanel("Signaler",'<div class="chatActionForm"><p class="muted">Les derniers messages seront joints au signalement pour permettre la modération.</p><textarea id="chatReportReason" maxlength="500" placeholder="Pourquoi signalez-vous cette discussion ?"></textarea><button id="confirmChatReport" class="danger" type="button">Envoyer le signalement</button></div>');
  $("#confirmChatReport")?.addEventListener("click",async()=>{
    const reason=$("#chatReportReason")?.value.trim()||"";
    await reportChat(S.chatId,S.chatOtherName,reason);
    closeChatActionPanel();
  });
}

async function blockCurrentPeer(){
  if(!S.chatOtherUid)return;
  const key="wbp_block_"+S.user.uid+"_"+S.chatOtherUid;
  let blocked=localStorage.getItem(key)==="1";
  try{
    const r=doc(db,"users",S.user.uid,"blocks",S.chatOtherUid),s=await getDoc(r);
    blocked=s.exists()||blocked;
    if(blocked){
      localStorage.removeItem(key);
      window.WBP_CHAT_BLOCKED=false;
      deleteDoc(r).catch(e=>console.warn("remote unblock",e?.code||e));
      toast("Kontak la debloke.");
    }else{
      localStorage.setItem(key,"1");
      window.WBP_CHAT_BLOCKED=true;
      setDoc(r,{blockedUid:S.chatOtherUid,blockedAt:serverTimestamp()}).catch(e=>console.warn("remote block",e?.code||e));
      toast("Kontak la bloke.");
    }
    if(S.chatId){
      addDoc(collection(db,"chats",S.chatId,"messages"),{
        senderId:S.user.uid,type:"document",readBy:[S.user.uid],
        chatSignal:{kind:"block",blocked:!blocked,to:S.chatOtherUid,from:S.user.uid,sentAt:Date.now()},
        createdAt:serverTimestamp()
      }).catch(()=>{});
    }
    $("#chatMoreMenu")?.classList.add("hidden");
  }catch(e){
    console.error(e);
    if(blocked){localStorage.removeItem(key);window.WBP_CHAT_BLOCKED=false;toast("Kontak la debloke.");}
    else{localStorage.setItem(key,"1");window.WBP_CHAT_BLOCKED=true;toast("Kontak la bloke.");}
  }
}

async function openChat(id,name){
  S.chatId=id;S.chatOtherName=name||"Contact";
  window.WBP_CURRENT_CHAT=id;window.WBP_CURRENT_USER=S.user?.uid||"";
  const peer=await resolveChatPeer(id);
  S.chatOtherUid=peer.uid;
  if(peer.chat){
    const i=S.chatRows.findIndex(x=>x.id===id);
    if(i>=0)S.chatRows[i]=peer.chat;else S.chatRows.unshift(peer.chat);
  }
  $("#chatPage .conversation")?.classList.add("open");
  $("#chatPage")?.classList.add("chat-open");
  document.body.classList.add("chatConversationOpen");
  document.documentElement.classList.add("chatConversationOpen");
  const initial=esc((S.chatOtherName.trim()[0]||"?").toUpperCase());
  $("#chatTitle").innerHTML=
    '<button id="closeChatViewBtn" class="waChatBackBtn" type="button">←</button>'+
    '<button id="chatContactInfoBtn" class="waChatContactBtn" type="button"><span class="waChatHeaderAvatar">'+initial+'</span><span class="waChatHeaderIdentity"><b>'+esc(S.chatOtherName)+'</b><small></small></span></button>'+
    '<div class="waChatHeaderActions">'+
      '<button id="videoCallBtn" class="waChatHeaderIcon" type="button" aria-label="Appel vidéo">📹</button>'+
      '<button id="voiceCallBtn" class="waChatHeaderIcon" type="button" aria-label="Appel vocal">📞</button>'+
      '<button id="chatMoreBtn" class="waChatHeaderIcon" type="button" aria-label="Menu">⋮</button>'+
    '</div>'+
    '<div id="chatMoreMenu" class="waChatMoreMenu hidden">'+
      '<button id="showContactInfoMenu" type="button">Afficher le contact</button>'+
      '<button id="chatMenuSearchBtn" type="button">Rechercher</button>'+
      '<button id="chatMenuMediaBtn" type="button">Médias, liens et documents</button>'+
      '<button id="chatMenuMuteBtn" type="button">Mode silencieux</button>'+
      '<button id="chatMenuDisappearBtn" type="button">Messages éphémères</button>'+
      '<button id="chatMenuThemeBtn" type="button">Thème de la discussion</button>'+
      '<button id="chatMenuReportBtn" type="button">Signaler</button>'+
      '<button id="chatMenuBlockBtn" type="button">Bloquer / débloquer</button>'+
    '</div>';
  watchPeerPresence(S.chatOtherUid);
  await loadChatPrefs();
  window.WBP_CHAT_BLOCKED=localStorage.getItem("wbp_block_"+S.user.uid+"_"+S.chatOtherUid)==="1";
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
  $("#videoCallBtn").onclick=()=>window.dispatchEvent(new CustomEvent("wbp-start-call",{detail:{mode:"video",chatId:id,uid:S.chatOtherUid,name:S.chatOtherName}}));
  $("#voiceCallBtn").onclick=()=>window.dispatchEvent(new CustomEvent("wbp-start-call",{detail:{mode:"voice",chatId:id,uid:S.chatOtherUid,name:S.chatOtherName}}));
  $("#chatMoreBtn").onclick=()=>$("#chatMoreMenu").classList.toggle("hidden");
  $("#chatMenuSearchBtn").onclick=()=>{$("#chatMoreMenu").classList.add("hidden");openChatSearch()};
  $("#chatMenuMediaBtn").onclick=()=>{$("#chatMoreMenu").classList.add("hidden");openChatMedia()};
  $("#chatMenuMuteBtn").onclick=()=>{$("#chatMoreMenu").classList.add("hidden");openMutePanel()};
  $("#chatMenuDisappearBtn").onclick=()=>{$("#chatMoreMenu").classList.add("hidden");openEphemeralPanel()};
  $("#chatMenuThemeBtn").onclick=()=>{$("#chatMoreMenu").classList.add("hidden");openThemePanel()};
  $("#chatMenuReportBtn").onclick=()=>{$("#chatMoreMenu").classList.add("hidden");openReportPanel()};
  $("#chatMenuBlockBtn").onclick=blockCurrentPeer;
  window.dispatchEvent(new CustomEvent("wbp-chat-open",{detail:{chatId:id,name:S.chatOtherName,uid:S.chatOtherUid}}));
  const q=query(collection(db,"chats",id,"messages"),orderBy("createdAt","asc"),limit(300));
  addOff(onSnapshot(q,s=>{
    const allRows=s.docs.map(d=>({id:d.id,...d.data()}));
    for(const m of allRows){
      if(m.callSignal)window.dispatchEvent(new CustomEvent("wbp-call-signal",{detail:{chatId:id,signal:m.callSignal,docId:m.id}}));
      if(m.chatSignal?.kind==="ephemeral"&&m.chatSignal.to===S.user.uid){
        S.chatPrefs={...S.chatPrefs,disappearingDuration:m.chatSignal.value||"off"};
        const key=chatPrefLocalKey();if(key)localStorage.setItem(key,JSON.stringify(S.chatPrefs));
      }
      if(m.chatSignal?.kind==="block"&&m.chatSignal.to===S.user.uid){
        window.WBP_CHAT_BLOCKED_BY_PEER=m.chatSignal.blocked===true;
      }
    }
    const rows=allRows.filter(m=>!m.callSignal&&!m.chatSignal&&!(m.expiresAtMs&&Number(m.expiresAtMs)<=Date.now()));
    let previousDay="",html="";
    for(const m of rows){
      const d=messageDate(m.createdAt),dayKey=localDayKey(d);
      if(dayKey&&dayKey!==previousDay){
        html+='<div class="chatDateSeparator"><span>'+esc(messageDayLabel(d))+'</span></div>';
        previousDay=dayKey;
      }
      const mine=m.senderId===S.user.uid;
      const receipt=mine?(Array.isArray(m.readBy)&&m.readBy.length>1?"✓✓":"✓"):"";
      const time=messageClock(m.createdAt);
      html+='<div class="msg '+(mine?"me":"")+'"><div class="msgBody">'+messageContent(m)+'</div><div class="msgMeta">'+(time?'<span class="msgTime">'+esc(time)+'</span>':"")+(receipt?'<span class="msgReceipt">'+receipt+'</span>':"")+'</div></div>';
    }
    $("#messages").innerHTML=html;
    $("#messages").scrollTop=$("#messages").scrollHeight;
    window.dispatchEvent(new CustomEvent("wbp-messages-rendered",{detail:{chatId:id,messages:rows}}));
  }))
}
window.WBP_OPEN_CHAT=(id,name)=>openChat(id,name);
async function ensureCurrentChatExists(){
  if(!S.user||!S.chatId)return false;
  let snap=null;
  try{snap=await getDoc(doc(db,"chats",S.chatId))}catch{}
  if(snap?.exists())return true;
  if(!S.chatOtherUid)return false;
  const ids=[S.user.uid,S.chatOtherUid].sort();
  const names={
    [S.user.uid]:S.profile.displayName||S.profile.username||S.user.displayName||"User",
    [S.chatOtherUid]:S.chatOtherName||"Contact"
  };
  try{
    await setDoc(doc(db,"chats",S.chatId),{
      type:"direct",
      participants:ids,
      participantNames:names,
      lastMessage:"",
      updatedAt:serverTimestamp()
    });
    return true;
  }catch(e){
    console.error("ensure current chat",e);
    return false;
  }
}

function ephemeralDurationMs(){
  const v=S.chatPrefs?.disappearingDuration||"off";
  return v==="24h"?86400000:v==="7d"?604800000:v==="90d"?7776000000:0;
}
$("#messageForm").onsubmit=async e=>{
  e.preventDefault();
  if(window.WBP_CHAT_BLOCKED||window.WBP_CHAT_BLOCKED_BY_PEER)return toast("Mesaj bloke nan diskisyon sa a.");
  const input=$("#messageText");
  const btn=$("#sendMessageBtn");
  const t=input?.value.trim()||"";
  if(!t||!S.chatId||!S.user)return;
  if(!(await ensureCurrentChatExists())){
    toast("Chat la poko pare. Eseye ankò.");
    return;
  }
  const messages=$("#messages");
  const tempId="pending_"+Date.now();
  if(btn)btn.disabled=true;
  if(input)input.value="";
  if(messages){
    messages.insertAdjacentHTML("beforeend",'<div class="msg me pendingMsg" data-pending="'+tempId+'"><div class="msgBody">'+esc(t)+'</div><div class="msgMeta"><span class="msgTime">'+esc(messageClock(new Date()))+'</span><span class="msgReceipt">…</span></div></div>');
    messages.scrollTop=messages.scrollHeight;
  }
  try{
    await addDoc(collection(db,"chats",S.chatId,"messages"),{
      senderId:S.user.uid,type:"text",text:t,readBy:[S.user.uid],expiresAtMs:ephemeralDurationMs()?Date.now()+ephemeralDurationMs():0,createdAt:serverTimestamp()
    });
    await updateDoc(doc(db,"chats",S.chatId),{
      lastMessage:t.slice(0,120),updatedAt:serverTimestamp()
    });
    window.WBP_ACTIVITY?.("message_sent","chat",{chatId:S.chatId,type:"text"});
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
async function reportChat(id,name,reason=""){
  try{
    const q=query(collection(db,"chats",id,"messages"),orderBy("createdAt","desc"),limit(20));
    const s=await getDocs(q);
    const excerpt=s.docs.reverse().map(d=>({senderId:d.data().senderId,text:d.data().text||""})).filter(x=>x.text);
    const payload={reporterId:S.user.uid,type:"chat",targetId:id,title:"Chat ak "+name,reason,excerpt,status:"open",createdAt:serverTimestamp()};
    try{
      await addDoc(collection(db,"moderationCases"),payload);
    }catch(e){
      console.warn("moderation fallback",e?.code||e);
      await setDoc(doc(db,"supportThreads",S.user.uid),{userId:S.user.uid,updatedAt:serverTimestamp()},{merge:true});
      await addDoc(collection(db,"supportThreads",S.user.uid,"messages"),{
        senderId:S.user.uid,
        text:"[SIGNALEMENT] "+payload.title+(reason?" — "+reason:""),
        reportPayload:{targetId:id,reason,excerpt},
        createdAt:serverTimestamp()
      });
    }
    localStorage.setItem("wbp_last_report_"+id,JSON.stringify({reason,at:Date.now()}));
    window.WBP_ACTIVITY?.("chat_reported","chat",{chatId:id});
    toast("Signalement anrejistre.");
  }catch(e){
    console.error(e);
    toast("Signalement lan pa t anrejistre.");
  }
}

function watchSupport(){const r=doc(db,"supportThreads",S.user.uid);setDoc(r,{userId:S.user.uid,updatedAt:serverTimestamp()},{merge:true}).catch(()=>{});const q=query(collection(db,"supportThreads",S.user.uid,"messages"),orderBy("createdAt","asc"),limit(200));addOff(onSnapshot(q,s=>{$("#supportMessages").innerHTML=s.docs.map(d=>{const m=d.data();return `<div class="msg ${m.senderId===S.user.uid?"me":""}">${esc(m.text||"")}</div>`}).join("");$("#supportMessages").scrollTop=$("#supportMessages").scrollHeight}))}
$("#supportForm").onsubmit=async e=>{
  e.preventDefault();
  const t=$("#supportText").value.trim();if(!t)return;
  try{
    await addDoc(collection(db,"supportThreads",S.user.uid,"messages"),{senderId:S.user.uid,text:t,createdAt:serverTimestamp()});
    await setDoc(doc(db,"supportThreads",S.user.uid),{userId:S.user.uid,userLabel:S.profile.displayName||S.profile.username||S.user.phoneNumber||"",updatedAt:serverTimestamp()},{merge:true});
    $("#supportText").value="";
    window.WBP_ACTIVITY?.("support_message_sent","settings");
  }catch(err){console.error(err);toast("Mesaj sipò a pa t voye.");}
};

$("#walletRequestForm").onsubmit=async e=>{e.preventDefault();try{
  const type=$("#walletType").value,amount=Number($("#walletAmount").value),currency=$("#walletCurrency").value,method=$("#walletMethod").value;
  const destination=$("#walletDestination").value.trim(),reference=$("#walletReference").value.trim();
  if(!(amount>0))return toast("Montan an dwe pi gran pase 0.");
  if(type==="withdrawal"&&!destination)return toast("Mete nimewo oswa kont kote retrè a dwe ale.");
  let proofUrl="";const f=$("#walletProof").files[0];if(f)proofUrl=await upload(f,"whatssap-business-pro/proofs",8*1024*1024,"image/");
  if(type==="deposit"&&!reference&&!proofUrl)return toast("Pou depo manyèl, mete referans tranzaksyon an oswa yon prèv peman.");
  await addDoc(collection(db,"financialRequests"),{userId:S.user.uid,type,mode:"manual",amount,currency,method,destination,reference,proofUrl,note:$("#walletNote").value.trim(),status:"pending",createdAt:serverTimestamp()});
  e.target.reset();window.WBP_ACTIVITY?.("wallet_request_created","wallet",{type,currency,method});toast(type==="deposit"?"Demann depo manyèl voye pou validasyon admin.":type==="withdrawal"?"Demann retrè manyèl voye pou validasyon admin.":"Demann operasyon voye.");
}catch(x){console.error(x);toast(x.message||"Demann pa voye.");}};
$("#exchangeForm").onsubmit=async e=>{
  e.preventDefault();
  const amount=Number($("#exchangeAmount").value),from=$("#exchangeFrom").value,to=$("#exchangeTo").value;
  if(!(amount>0)||from===to)return toast("Verifye echanj la.");
  try{
    await addDoc(collection(db,"exchangeRequests"),{userId:S.user.uid,amount,from,to,status:"pending",createdAt:serverTimestamp()});
    e.target.reset();window.WBP_ACTIVITY?.("exchange_request_created","wallet",{from,to});toast("Demann echanj voye.");
  }catch(err){console.error(err);toast("Demann echanj la pa t voye.");}
};
function watchWallet(){
  addOff(onSnapshot(doc(db,"users",S.user.uid),s=>{const b=s.data()?.walletBalances||{};$("#walletBalances").innerHTML=appSettings.currencies.map(c=>`<div class="balanceCard"><b>${money(b[c]||0,c)}</b><small>Balans</small></div>`).join("");$("#mBalance").textContent=money(b.HTG||0,"HTG")}));
  const fq=query(collection(db,"financialRequests"),where("userId","==",S.user.uid)),eq=query(collection(db,"exchangeRequests"),where("userId","==",S.user.uid));
  let a=[],b=[];const render=()=>{$("#operationHistory").innerHTML=[...a,...b].sort((x,y)=>(y.createdAt?.seconds||0)-(x.createdAt?.seconds||0)).map(x=>`<div class="historyRow"><b>${esc(x.type||"exchange")}</b> • ${money(x.amount,x.currency||x.from)} <span class="status ${esc(x.status||"pending")}">${esc(x.status||"pending")}</span></div>`).join("")||'<p class="muted">Pa gen operasyon.</p>'};
  addOff(onSnapshot(fq,s=>{a=s.docs.map(d=>({id:d.id,...d.data()}));render()}));addOff(onSnapshot(eq,s=>{b=s.docs.map(d=>({id:d.id,type:"exchange",...d.data()}));render()}));
}

function watchLevels(){addOff(onSnapshot(collection(db,"investmentLevels"),s=>{const rows=s.docs.map(d=>({id:d.id,...d.data()})).filter(x=>x.active!==false);$("#investmentLevels").innerHTML=rows.length?rows.map(x=>`<div class="level"><h3>${esc(x.name)}</h3><b>${money(x.amount,x.currency)}</b><p>Pwofi: ${Number(x.rate||0)}% • ${esc(x.period||"monthly")}</p><button data-invest="${x.id}">Envesti</button></div>`).join(""):'<p class="muted">Pa gen nivo aktif.</p>';$$("[data-invest]").forEach(b=>b.onclick=()=>invest(rows.find(x=>x.id===b.dataset.invest))) }))}
async function invest(level){
  if(!level)return;
  try{
    await addDoc(collection(db,"investments"),{userId:S.user.uid,levelId:level.id,levelName:level.name,amount:Number(level.amount),currency:level.currency,rate:Number(level.rate||0),period:level.period||"monthly",status:"pending",createdAt:serverTimestamp()});
    window.WBP_ACTIVITY?.("investment_request_created","invest",{levelId:level.id,currency:level.currency});
    toast("Demann envestisman voye.");
  }catch(err){console.error(err);toast("Demann envestisman an pa t voye.");}
}
function watchInvestments(){const q=query(collection(db,"investments"),where("userId","==",S.user.uid));addOff(onSnapshot(q,s=>{const a=s.docs.map(d=>({id:d.id,...d.data()}));$("#mInvest").textContent=a.filter(x=>x.status==="active"||x.status==="approved").length;$("#myInvestments").innerHTML=a.map(x=>`<div class="historyRow"><b>${esc(x.levelName||"Envestisman")}</b> • ${money(x.amount,x.currency)} <span class="status ${esc(x.status||"pending")}">${esc(x.status||"pending")}</span></div>`).join("")||'<p class="muted">Pa gen envestisman.</p>'}))}

$("#businessForm").onsubmit=async e=>{
  e.preventDefault();
  try{
    await setDoc(doc(db,"businesses",S.user.uid),{ownerId:S.user.uid,username:S.profile.username||"",name:$("#businessName").value.trim(),description:$("#businessDescription").value.trim(),hours:$("#businessHours").value.trim(),website:$("#businessWebsite").value.trim(),active:true,updatedAt:serverTimestamp()},{merge:true});
    window.WBP_ACTIVITY?.("business_profile_saved","business");toast("Pwofil biznis sove.");
  }catch(err){console.error(err);toast("Pwofil biznis la pa t sove.");}
};
$("#businessToolsForm").onsubmit=async e=>{
  e.preventDefault();
  try{
    await setDoc(doc(db,"userSettings",S.user.uid),{businessTools:{greetingMessage:$("#greetingMessage").value.trim(),awayMessage:$("#awayMessage").value.trim(),quickReplies:$("#quickReplies").value.trim()},updatedAt:serverTimestamp()},{merge:true});
    window.WBP_ACTIVITY?.("business_tools_saved","business");toast("Zouti mesaj sove.");
  }catch(err){console.error(err);toast("Zouti mesaj yo pa t sove.");}
};
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

async function reportCase(type,targetId,title){
  const payload={reporterId:S.user.uid,type,targetId,title,status:"open",createdAt:serverTimestamp()};
  try{
    await addDoc(collection(db,"moderationCases"),payload);
    window.WBP_ACTIVITY?.("content_reported",type,{targetId});
    toast("Signalement anrejistre.");
  }catch(e){
    console.warn("moderation case fallback",e?.code||e);
    try{
      await setDoc(doc(db,"supportThreads",S.user.uid),{userId:S.user.uid,updatedAt:serverTimestamp()},{merge:true});
      await addDoc(collection(db,"supportThreads",S.user.uid,"messages"),{
        senderId:S.user.uid,text:"[SIGNALEMENT] "+title+" • "+type+" • "+targetId,
        createdAt:serverTimestamp()
      });
      toast("Signalement anrejistre.");
    }catch(x){console.error(x);toast("Signalement pa t anrejistre.");}
  }
}

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

document.addEventListener("visibilitychange",()=>{
  if(S.user)writePresence(document.visibilityState==="visible"&&navigator.onLine);
});
window.addEventListener("online",()=>{if(S.user)writePresence(document.visibilityState==="visible")});
window.addEventListener("offline",()=>{if(S.user)writePresence(false)});
window.addEventListener("pagehide",()=>{ if(S.user)writePresence(false); });
window.addEventListener("beforeunload",()=>{ if(S.user)writePresence(false); });

onAuthStateChanged(auth,async u=>{
  clearOffs();S.user=u;
  if(!u){
    stopPresence();
    S.chatPresenceOff?.();S.chatPresenceOff=null;
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
  startPresence();
  go("chat");
  await loadProfile();
  try{await syncPhoneDirectory(S.account.phone||"",S.account.phone||"",{displayName:S.profile.displayName||S.user.displayName||"",username:S.profile.username||""})}
  catch(e){console.warn("phone directory login sync",e)}
  loadCart();
  watchChats();
  const startSecondary=async()=>{
    try{await loadBusiness()}catch(e){console.warn("business preload",e?.code||e)}
    watchProducts();watchBoosts();watchClips();watchSupport();watchWallet();watchLevels();watchInvestments();watchOrders();
  };
  if("requestIdleCallback" in window)requestIdleCallback(()=>startSecondary(),{timeout:1200});
  else setTimeout(()=>startSecondary(),220);
});

if("serviceWorker" in navigator)window.addEventListener("load",()=>navigator.serviceWorker.register("./sw.js").catch(console.error));
