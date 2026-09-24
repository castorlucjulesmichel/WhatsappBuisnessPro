import {firebaseConfig,appSettings} from "./firebase-config.js";
import {initializeApp} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import {getAuth,onAuthStateChanged,signInWithPhoneNumber,RecaptchaVerifier,signOut} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import {getFirestore,doc,getDoc,setDoc,addDoc,updateDoc,collection,query,where,onSnapshot,getDocs,orderBy,serverTimestamp,limit} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";
import {getStorage,ref,uploadBytes,getDownloadURL} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-storage.js";

const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const configured=()=>firebaseConfig.apiKey && !String(firebaseConfig.apiKey).includes("YOUR_");
const esc=s=>String(s??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]));
const toast=t=>{const e=$("#toast");e.textContent=t;e.classList.add("show");setTimeout(()=>e.classList.remove("show"),2300)};
const norm=s=>String(s||"").trim().toLowerCase().replace(/[^a-z0-9_.-]/g,"");
const safe=s=>String(s||"file").replace(/[^a-zA-Z0-9._-]/g,"_");
const money=(n,c)=>Number(n||0).toLocaleString(undefined,{maximumFractionDigits:2})+" "+(c||"HTG");
const S={user:null,profile:{},chatId:null,products:[],clips:[],boosts:[],cart:[],unsubs:[]};

if(!configured()){
  $("#authScreen").classList.add("hidden");
  $("#setupScreen").classList.remove("hidden");
  throw new Error("Configure independent Firebase in firebase-config.js");
}

const app=initializeApp(firebaseConfig),auth=getAuth(app),db=getFirestore(app),storage=getStorage(app);
auth.useDeviceLanguage();

function addOff(f){if(typeof f==="function")S.unsubs.push(f)}
function clearOffs(){S.unsubs.forEach(f=>{try{f()}catch{}});S.unsubs=[]}
function go(name){
  $(".page").forEach(x=>x.classList.remove("active"));
  $("nav button").forEach(x=>x.classList.remove("active"));
  $("#"+name+"Page")?.classList.add("active");
  const parent={
    status:"actus", clips:"actus",
    market:"tools", orders:"tools", stats:"tools", business:"tools", profile:"tools",
    invest:"wallet"
  }[name] || name;
  document.querySelector('nav button[data-page="'+parent+'"]')?.classList.add("active");
}
$$("nav button[data-page]").forEach(b=>b.onclick=()=>go(b.dataset.page));
$("[data-go]").forEach(b=>b.onclick=()=>go(b.dataset.go));
$("[data-market-mode]").forEach(b=>b.addEventListener("click",()=>{
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

async function recaptcha(){
  if(window._wbpRc)return window._wbpRc;
  window._wbpRc=new RecaptchaVerifier(auth,"recaptcha-container",{size:"normal"});
  await window._wbpRc.render();return window._wbpRc;
}
$("#sendOtp").onclick=async()=>{try{const p=$("#phone").value.trim();if(!p.startsWith("+"))return toast("Mete kòd peyi a, egzanp +509.");S.confirm=await signInWithPhoneNumber(auth,p,await recaptcha());$("#otpBox").classList.remove("hidden");toast("Kòd OTP voye.")}catch(e){console.error(e);toast("OTP pa t voye.");try{window._wbpRc?.clear();window._wbpRc=null}catch{}}};
$("#verifyOtp").onclick=async()=>{try{if(!S.confirm)return toast("Voye OTP an dabò.");await S.confirm.confirm($("#otp").value.trim())}catch(e){console.error(e);toast("Kòd la pa valab.")}};
$("#logout").onclick=()=>signOut(auth);

async function ensureUser(u){
  const r=doc(db,"users",u.uid),s=await getDoc(r);
  if(!s.exists()){
    const wallet={},ads={HTG:0,USD:0};appSettings.currencies.forEach(c=>wallet[c]=0);
    await setDoc(r,{phone:u.phoneNumber||"",blocked:false,walletBalances:wallet,adBalances:ads,createdAt:serverTimestamp()});
    return true;
  }
  if(s.data().blocked===true){toast("Kont sa bloke pa administrasyon.");await signOut(auth);return false}
  return true;
}
async function loadProfile(){
  const s=await getDoc(doc(db,"publicProfiles",S.user.uid));S.profile=s.exists()?s.data():{};
  $("#displayName").value=S.profile.displayName||"";$("#username").value=S.profile.username||"";$("#bio").value=S.profile.bio||"";$("#country").value=S.profile.country||"";$("#birthYear").value=S.profile.birthYear||"";$("#role").value=S.profile.role||"buyer";
  $("#avatarPreview").src=S.profile.photoUrl||"";
  $("#headerUser").textContent=S.profile.displayName||S.profile.username||S.user.phoneNumber||"User";
}
async function upload(file,path,max,typePrefix){
  if(!file)return "";
  if(file.size>max)throw new Error("Fichye a twò gwo.");
  if(typePrefix&&!file.type.startsWith(typePrefix))throw new Error("Kalite fichye pa bon.");
  const rr=ref(storage,path+"/"+S.user.uid+"/"+crypto.randomUUID()+"-"+safe(file.name));
  const up=await uploadBytes(rr,file,{contentType:file.type});return getDownloadURL(up.ref);
}
$("#profileForm").onsubmit=async e=>{e.preventDefault();try{
  const username=norm($("#username").value);if(username.length<3)return toast("Username dwe gen omwen 3 karaktè.");
  const q=query(collection(db,"publicProfiles"),where("username","==",username),limit(2)),m=await getDocs(q);
  if(m.docs.some(d=>d.id!==S.user.uid))return toast("Username sa deja itilize.");
  let photoUrl=S.profile.photoUrl||"";const f=$("#avatarFile").files[0];if(f)photoUrl=await upload(f,"whatssap-business-pro/avatars",8*1024*1024,"image/");
  await setDoc(doc(db,"publicProfiles",S.user.uid),{displayName:$("#displayName").value.trim()||username,username,bio:$("#bio").value.trim(),country:$("#country").value.trim(),birthYear:Number($("#birthYear").value||0),role:$("#role").value,photoUrl,updatedAt:serverTimestamp()},{merge:true});
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
$("#startChatBtn").onclick=async()=>{try{const un=norm($("#targetUsername").value),q=query(collection(db,"publicProfiles"),where("username","==",un),limit(1)),s=await getDocs(q);if(s.empty)return toast("Username pa jwenn.");const o=s.docs[0];if(o.id===S.user.uid)return toast("Ou pa ka chat ak tèt ou.");const ids=[S.user.uid,o.id].sort(),id=ids.join("__"),names={[S.user.uid]:S.profile.displayName||S.profile.username||"User",[o.id]:o.data().displayName||o.data().username||"User"};await setDoc(doc(db,"chats",id),{participants:ids,participantNames:names,lastMessage:"",updatedAt:serverTimestamp()},{merge:true});openChat(id,names[o.id]);$("#newChatBox").classList.add("hidden")}catch(x){console.error(x);toast("Chat la pa kreye.");}};
function watchChats(){const q=query(collection(db,"chats"),where("participants","array-contains",S.user.uid));addOff(onSnapshot(q,s=>{const rows=s.docs.map(d=>({id:d.id,...d.data()})).sort((a,b)=>(b.updatedAt?.seconds||0)-(a.updatedAt?.seconds||0));$("#chatList").innerHTML=rows.map(c=>{const oid=c.participants.find(x=>x!==S.user.uid)||S.user.uid,n=c.participantNames?.[oid]||"Chat";return `<div class="chatItem" data-chat="${c.id}" data-name="${esc(n)}"><b>${esc(n)}</b><br><small>${esc(c.lastMessage||"")}</small></div>`}).join("")||'<div class="chatItem muted">Pa gen chat.</div>';$$("[data-chat]").forEach(x=>x.onclick=()=>openChat(x.dataset.chat,x.dataset.name))}))}
function openChat(id,name){S.chatId=id;$("#chatTitle").innerHTML=esc(name)+' <button id="reportChatBtn" class="ghost">Rapòte</button>';$("#messageForm").classList.remove("hidden");$("#reportChatBtn").onclick=()=>reportChat(id,name);const q=query(collection(db,"chats",id,"messages"),orderBy("createdAt","asc"),limit(300));addOff(onSnapshot(q,s=>{$("#messages").innerHTML=s.docs.map(d=>{const m=d.data();return `<div class="msg ${m.senderId===S.user.uid?"me":""}">${esc(m.text||"")}</div>`}).join("");$("#messages").scrollTop=$("#messages").scrollHeight}))}
$("#messageForm").onsubmit=async e=>{e.preventDefault();const t=$("#messageText").value.trim();if(!t||!S.chatId)return;await addDoc(collection(db,"chats",S.chatId,"messages"),{senderId:S.user.uid,text:t,createdAt:serverTimestamp()});await updateDoc(doc(db,"chats",S.chatId),{lastMessage:t.slice(0,120),updatedAt:serverTimestamp()});$("#messageText").value=""};
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
async function loadBusiness(){const [b,s]=await Promise.all([getDoc(doc(db,"businesses",S.user.uid)),getDoc(doc(db,"userSettings",S.user.uid))]);if(b.exists()){const x=b.data();$("#businessName").value=x.name||"";$("#businessDescription").value=x.description||"";$("#businessHours").value=x.hours||"";$("#businessWebsite").value=x.website||""}if(s.exists()){const x=s.data().businessTools||{};$("#greetingMessage").value=x.greetingMessage||"";$("#awayMessage").value=x.awayMessage||"";$("#quickReplies").value=x.quickReplies||""}}

$("#adForm")?.addEventListener("submit",async e=>{e.preventDefault();await addDoc(collection(db,"adRequests"),{userId:S.user.uid,product:$("#adProduct")?.value||"",country:$("#adCountry")?.value||"",budget:Number($("#adBudget")?.value||0),currency:$("#adCurrency")?.value||"HTG",goal:$("#adGoal")?.value||"Sales",description:$("#adDescription")?.value||"",status:"pending",createdAt:serverTimestamp()});toast("Kanpay piblisite voye.")});

async function reportCase(type,targetId,title){await addDoc(collection(db,"moderationCases"),{reporterId:S.user.uid,type,targetId,title,status:"open",createdAt:serverTimestamp()});toast("Rapò voye.")}

$("#assistantForm").onsubmit=e=>{e.preventDefault();const t=$("#assistantInput").value.trim();if(!t)return;const low=t.toLowerCase();let a="Mwen ka ede w ak chat, marketplace, wallet, envestisman, Business Pro ak boost.";if(low.includes("depo"))a="Ale nan Wallet pou fè depo/retrè. Pou Boost, ale Business Pro > Boost & Ads epi chwazi MonCash oswa NatCash.";else if(low.includes("boost")||low.includes("piblisite"))a="Nan Business Pro, depoze nan Ad Wallet an HTG oswa USD, chwazi pwodwi/clip, bidjè pa jou, dire ak odyans, epi voye boost la pou validasyon.";else if(low.includes("vann"))a="Ale Marketplace > + Vann pou mete pwodwi a.";$("#assistantMessages").innerHTML+=`<div class="msg me">${esc(t)}</div><div class="msg">${esc(a)}</div>`;$("#assistantInput").value=""};

function watchOrders(){const q=query(collection(db,"orders"),where("buyerId","==",S.user.uid));addOff(onSnapshot(q,s=>$("#mOrders").textContent=s.size))}
const dict={ht:{welcome:"Byenvini"},fr:{welcome:"Bienvenue"},en:{welcome:"Welcome"},es:{welcome:"Bienvenido"}};
function applyLang(){const l=$("#lang").value;localStorage.setItem("wbp_lang",l);$$("[data-i18n]").forEach(e=>e.textContent=dict[l]?.[e.dataset.i18n]||dict.ht[e.dataset.i18n]||e.textContent)}
$("#lang").value=localStorage.getItem("wbp_lang")||"ht";$("#lang").onchange=applyLang;applyLang();

onAuthStateChanged(auth,async u=>{
  clearOffs();S.user=u;
  if(!u){$("#authScreen").classList.remove("hidden");$("#appShell").classList.add("hidden");return}
  if(!(await ensureUser(u)))return;
  $("#authScreen").classList.add("hidden");$("#appShell").classList.remove("hidden");
  await loadProfile();loadCart();await loadBusiness();
  watchProducts();watchBoosts();watchClips();watchChats();watchSupport();watchWallet();watchLevels();watchInvestments();watchOrders();
});

if("serviceWorker" in navigator)window.addEventListener("load",()=>navigator.serviceWorker.register("./sw.js").catch(console.error));
