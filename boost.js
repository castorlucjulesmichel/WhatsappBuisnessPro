import {firebaseConfig} from "./firebase-config.js";
import {getApps,getApp,initializeApp} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import {getAuth,onAuthStateChanged} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import {getFirestore,doc,getDoc,collection,query,where,onSnapshot,addDoc,serverTimestamp} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";
import {getStorage,ref,uploadBytes,getDownloadURL} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-storage.js";

const $=s=>document.querySelector(s);
const toast=t=>{const e=$("#toast");if(!e)return;e.textContent=t;e.classList.add("show");setTimeout(()=>e.classList.remove("show"),2200)};
const configured=()=>firebaseConfig.apiKey && !String(firebaseConfig.apiKey).includes("YOUR_");
if(!configured()) console.warn("Boost module waiting for independent Firebase configuration.");

let auth,db,storage,user=null,ownItems=[],unsubs=[];
if(configured()){
  const app=getApps().length?getApp():initializeApp(firebaseConfig);
  auth=getAuth(app); db=getFirestore(app); storage=getStorage(app);
}

function money(v,c){return Number(v||0).toLocaleString(undefined,{maximumFractionDigits:2})+" "+c}
function esc(s=""){return String(s).replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]))}
function safeName(n){return String(n||"file").replace(/[^a-zA-Z0-9._-]/g,"_")}
function clear(){unsubs.forEach(u=>u&&u());unsubs=[]}
function total(){
  const d=Number($("#boostDailyBudget")?.value||0),days=Number($("#boostDays")?.value||0),c=$("#boostCurrency")?.value||"HTG";
  if($("#boostSummary")) $("#boostSummary").textContent="Total: "+money(d*days,c);
}
$("#boostDailyBudget")?.addEventListener("input",total);
$("#boostDays")?.addEventListener("input",total);
$("#boostCurrency")?.addEventListener("change",total);
$("#boostAudience")?.addEventListener("change",()=>$("#customAudienceBox")?.classList.toggle("hidden",$("#boostAudience").value!=="custom"));
$("#toggleAdTopup")?.addEventListener("click",()=>$("#adTopupForm")?.classList.toggle("hidden"));

async function uploadProof(file){
  if(!file) return "";
  if(file.size>8*1024*1024) throw new Error("Prèv la twò gwo.");
  const r=ref(storage,`whatssap-business-pro/ad-proofs/${user.uid}/${crypto.randomUUID()}-${safeName(file.name)}`);
  const up=await uploadBytes(r,file,{contentType:file.type});
  return getDownloadURL(up.ref);
}

function watchWallet(){
  const off=onSnapshot(doc(db,"users",user.uid),s=>{
    const d=s.data()||{},b=d.adBalances||{};
    if($("#adBalanceHTG")) $("#adBalanceHTG").textContent=money(b.HTG||0,"HTG");
    if($("#adBalanceUSD")) $("#adBalanceUSD").textContent=money(b.USD||0,"USD");
  });
  unsubs.push(off);
}

function watchTargets(){
  let products=[],clips=[],statuses=[];
  const render=()=>{
    ownItems=[
      ...products.map(x=>({id:x.id,type:"product",label:"🛍️ "+(x.name||"Pwodwi")})),
      ...clips.map(x=>({id:x.id,type:"clip",label:"▶️ "+(x.caption||"Clip")})),
      ...statuses.map(x=>({id:x.id,type:"status",label:"⭕ "+((x.text||"Status").slice(0,45))}))
    ];
    if($("#boostTarget")) $("#boostTarget").innerHTML='<option value="">Chwazi pwodwi, clip oswa status...</option>'+ownItems.map(x=>`<option value="${x.type}:${x.id}">${esc(x.label)}</option>`).join("");
  };
  unsubs.push(onSnapshot(query(collection(db,"products"),where("sellerId","==",user.uid)),s=>{products=s.docs.map(d=>({id:d.id,...d.data()}));render()}));
  unsubs.push(onSnapshot(query(collection(db,"shortVideos"),where("ownerId","==",user.uid)),s=>{clips=s.docs.map(d=>({id:d.id,...d.data()}));render()}));
  unsubs.push(onSnapshot(query(collection(db,"statuses"),where("ownerId","==",user.uid)),s=>{
    const now=Date.now();
    statuses=s.docs.map(d=>({id:d.id,...d.data()})).filter(x=>(x.expiresAt?.toMillis?.()||0)>now);
    render();
  }));
}

function watchBoosts(){
  unsubs.push(onSnapshot(query(collection(db,"adCampaigns"),where("ownerId","==",user.uid)),s=>{
    const a=s.docs.map(d=>({id:d.id,...d.data()})).sort((x,y)=>(y.createdAt?.seconds||0)-(x.createdAt?.seconds||0));
    if($("#myBoosts")) $("#myBoosts").innerHTML=a.length?'<h4>Kanpay mwen</h4>'+a.map(x=>`<div class="historyRow"><b>${esc(x.targetLabel||x.targetType||"Boost")}</b> • ${money(x.totalBudget,x.currency||"HTG")}<br><span class="status ${esc(x.status||"pending")}">${esc(x.status||"pending_review")}</span> <small class="muted">Reach: ${Number(x.metrics?.reach||0)} • Clicks: ${Number(x.metrics?.clicks||0)} • Chats: ${Number(x.metrics?.conversations||0)}</small></div>`).join(""):'<p class="muted">Pa gen boost ankò.</p>';
  }));
}

$("#adTopupForm")?.addEventListener("submit",async e=>{
  e.preventDefault();
  if(!user) return toast("Konekte dabò.");
  try{
    const amount=Number($("#adTopupAmount").value),currency=$("#adTopupCurrency").value,method=$("#adTopupMethod").value;
    if(!(amount>0)||!["HTG","USD"].includes(currency)||!["MonCash","NatCash"].includes(method)) return toast("Verifye enfòmasyon yo.");
    const proofUrl=await uploadProof($("#adTopupProof").files[0]);
    await addDoc(collection(db,"adTopups"),{
      userId:user.uid,amount,currency,method,
      reference:$("#adTopupReference").value.trim(),proofUrl,status:"pending",
      createdAt:serverTimestamp()
    });
    e.target.reset();$("#adTopupForm").classList.add("hidden");toast("Demann depo boost voye pou validasyon admin.");
  }catch(err){console.error(err);toast(err.message||"Depo boost la echwe.");}
});

$("#boostForm")?.addEventListener("submit",async e=>{
  e.preventDefault();
  if(!user) return toast("Konekte dabò.");
  const raw=$("#boostTarget").value;
  const item=ownItems.find(x=>raw===x.type+":"+x.id);
  if(!item) return toast("Chwazi sa w ap bouste.");
  const dailyBudget=Number($("#boostDailyBudget").value),days=Number($("#boostDays").value),currency=$("#boostCurrency").value;
  if(!(dailyBudget>0)||!(days>=1&&days<=90)||!["HTG","USD"].includes(currency)) return toast("Verifye bidjè ak dire.");
  if(item.type==="status" && days!==1) return toast("Yon Status dire 24 èdtan; Boost Status la dwe 1 jou.");
  const audience=$("#boostAudience").value;
  let audienceData={mode:audience};
  if(audience==="custom"){
    const min=Number($("#boostAgeMin").value||18),max=Number($("#boostAgeMax").value||65);
    if(min<18||max<min||max>65) return toast("Verifye laj odyans lan.");
    audienceData={mode:"custom",country:$("#boostCountry").value.trim(),ageMin:min,ageMax:max};
  }
  const u=await getDoc(doc(db,"users",user.uid)),balance=Number(u.data()?.adBalances?.[currency]||0),totalBudget=dailyBudget*days;
  if(balance<totalBudget) return toast("Ad Wallet ou pa gen ase lajan. Depoze ak MonCash/NatCash dabò.");
  await addDoc(collection(db,"adCampaigns"),{
    ownerId:user.uid,targetType:item.type,targetId:item.id,targetLabel:item.label,
    goal:$("#boostGoal").value,audience:audienceData,dailyBudget,days,totalBudget,currency,
    status:"pending_review",metrics:{reach:0,clicks:0,conversations:0},createdAt:serverTimestamp()
  });
  e.target.reset();total();toast("Boost la voye pou revizyon admin. Lajan ap retire sèlman lè li valide.");
});

if(configured()) onAuthStateChanged(auth,u=>{
  clear();user=u;
  if(!u) return;
  watchWallet();watchTargets();watchBoosts();total();
});
