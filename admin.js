import {firebaseConfig,appSettings} from "./firebase-config.js";
import {initializeApp,getApps,getApp} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import {getAuth,onAuthStateChanged,signOut} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import {getFirestore,doc,getDoc,getDocs,setDoc,addDoc,updateDoc,collection,query,where,orderBy,limit,serverTimestamp,runTransaction,onSnapshot} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const esc=s=>String(s??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]));
const money=(n,c)=>Number(n||0).toLocaleString(undefined,{maximumFractionDigits:2})+" "+(c||"HTG");
const toast=t=>{const e=$("#toast");if(!e)return;e.textContent=t;e.classList.add("show");setTimeout(()=>e.classList.remove("show"),2200)};
const configured=()=>firebaseConfig.apiKey&&!String(firebaseConfig.apiKey).includes("YOUR_");

if(!configured()) throw new Error("Configure firebase-config.js first.");
const app=getApps().length?getApp():initializeApp(firebaseConfig),auth=getAuth(app),db=getFirestore(app);

let admin=null,supportOff=null;
let data={users:[],profiles:[],products:[],requests:[],exchanges:[],orders:[],videos:[],investments:[],cases:[],levels:[]};

$$("[data-admin]").forEach(b=>b.onclick=()=>{
  $$("[data-admin]").forEach(x=>x.classList.remove("active"));
  $$(".adminSection").forEach(x=>x.classList.remove("active"));
  b.classList.add("active");
  $("#"+b.dataset.admin+"Admin")?.classList.add("active");
});
$("#adminLogout").onclick=()=>signOut(auth);
$("#refreshAdmin").onclick=()=>loadAll();
$("#adminLogin").onclick=()=>location.href="./index.html";

async function hasAdmin(u){if(!u)return false;const s=await getDoc(doc(db,"admins",u.uid));return s.exists()&&s.data().active!==false}
onAuthStateChanged(auth,async u=>{
  if(!u||!(await hasAdmin(u))){
    admin=null;$("#adminGate").classList.remove("hidden");$("#adminApp").classList.add("hidden");
    $("#adminGateMsg").textContent=u?"Kont sa pa gen dwa admin.":"Konekte nan app prensipal la ak kont admin an.";
    return;
  }
  admin=u;$("#adminGate").classList.add("hidden");$("#adminApp").classList.remove("hidden");
  $("#adminIdentity").textContent=u.phoneNumber||u.email||u.uid;
  loadAll();
});

async function all(name){const s=await getDocs(collection(db,name));return s.docs.map(d=>({id:d.id,...d.data()}))}
function profile(uid){return data.profiles.find(x=>x.id===uid)||{}}
function label(uid){const p=profile(uid),u=data.users.find(x=>x.id===uid)||{};return p.displayName||p.username||u.phone||uid}
function stamp(x){try{return x?.toDate?.().toLocaleString()||""}catch{return ""}}

async function loadAll(){
  if(!admin)return;
  try{
    const [users,profiles,products,requests,exchanges,orders,videos,investments,cases,levels]=await Promise.all([
      all("users"),all("publicProfiles"),all("products"),all("financialRequests"),all("exchangeRequests"),
      all("orders"),all("shortVideos"),all("investments"),all("moderationCases"),all("investmentLevels")
    ]);
    data={users,profiles,products,requests,exchanges,orders,videos,investments,cases,levels};
    $("#aUsers").textContent=users.length;$("#aProducts").textContent=products.length;$("#aVideos").textContent=videos.length;
    $("#aPending").textContent=requests.filter(x=>x.status==="pending").length+exchanges.filter(x=>x.status==="pending").length;
    $("#aOrders").textContent=orders.length;$("#aInvestments").textContent=investments.length;
    renderUsers();renderRequests();renderOrders();renderVideos();renderInvestments();renderCases();renderLevels();renderSupportUsers();
  }catch(e){console.error(e);toast("Done admin yo pa t chaje.");}
}

function renderUsers(){
  const term=($("#userSearch").value||"").trim().toLowerCase();
  const rows=data.users.filter(u=>{
    const p=profile(u.id);return !term||[u.phone,p.displayName,p.username,p.role,u.id].join(" ").toLowerCase().includes(term);
  });
  $("#adminUsers").innerHTML=rows.map(u=>{
    const p=profile(u.id);
    return `<div class="adminRow"><b>${esc(p.displayName||p.username||u.phone||u.id)}</b><br>
    <span class="muted">@${esc(p.username||"—")} • ${esc(p.role||"user")} • ${u.blocked?"BLOKE":"AKTIF"}</span>
    <div class="actions"><button data-block="${u.id}" data-next="${!u.blocked}">${u.blocked?"Debloke":"Bloke"}</button></div></div>`;
  }).join("")||'<p class="muted">Pa gen itilizatè.</p>';
  $$("[data-block]").forEach(b=>b.onclick=async()=>{
    const blocked=b.dataset.next==="true";
    await updateDoc(doc(db,"users",b.dataset.block),{blocked,updatedAt:serverTimestamp()});
    await addDoc(collection(db,"notifications"),{recipientId:b.dataset.block,title:blocked?"Kont bloke":"Kont debloke",message:blocked?"Administrasyon bloke kont ou.":"Administrasyon reaktive kont ou.",read:false,createdAt:serverTimestamp()});
    toast("Kont mete ajou.");loadAll();
  });
}
$("#userSearch").oninput=renderUsers;

function renderRequests(){
  const rows=[
    ...data.requests.map(x=>({...x,source:"financialRequests",kind:x.type||"operation"})),
    ...data.exchanges.map(x=>({...x,source:"exchangeRequests",kind:"exchange"}))
  ].sort((a,b)=>(b.createdAt?.seconds||0)-(a.createdAt?.seconds||0));
  $("#adminRequests").innerHTML=rows.map(r=>`<div class="adminRow"><b>${esc(r.kind)} • ${money(r.amount,r.currency||r.from)}</b><br>
    <span class="muted">${esc(label(r.userId))} • ${esc(r.method||((r.from||"")+" → "+(r.to||"")))} • ${esc(r.status||"pending")}</span>
    ${r.mode==="manual"?'<div><span class="status">Manuel</span></div>':""}
    ${r.destination?`<div class="muted">Destination: ${esc(r.destination)}</div>`:""}
    ${r.reference?`<div class="muted">Référence: ${esc(r.reference)}</div>`:""}
    ${r.note?`<div class="muted">Note: ${esc(r.note)}</div>`:""}
    ${r.proofUrl?`<div><a href="${esc(r.proofUrl)}" target="_blank" rel="noopener">Gade prèv</a></div>`:""}
    ${r.status==="pending"?`<div class="actions"><button data-request="${r.id}" data-src="${r.source}" data-decision="approved">Apwouve</button><button class="danger" data-request="${r.id}" data-src="${r.source}" data-decision="rejected">Rejte</button></div>`:""}
  </div>`).join("")||'<p class="muted">Pa gen demand.</p>';
  $$("[data-request]").forEach(b=>b.onclick=()=>decideRequest(b.dataset.src,b.dataset.request,b.dataset.decision));
}

async function decideRequest(source,id,decision){
  try{
    if(decision==="rejected"){
      await updateDoc(doc(db,source,id),{status:"rejected",reviewedBy:admin.uid,reviewedAt:serverTimestamp()});
      const rs=await getDoc(doc(db,source,id));
      if(rs.exists()) await addDoc(collection(db,"notifications"),{recipientId:rs.data().userId,title:"Demann rejte",message:"Operasyon an pa valide.",read:false,createdAt:serverTimestamp()});
      toast("Demand rejte.");return loadAll();
    }
    await runTransaction(db,async tx=>{
      const rr=doc(db,source,id),rs=await tx.get(rr);
      if(!rs.exists())throw new Error("Demand pa jwenn.");
      const r=rs.data();if(r.status!=="pending")throw new Error("Demand sa deja trete.");
      const ur=doc(db,"users",r.userId),us=await tx.get(ur);
      if(!us.exists())throw new Error("Itilizatè pa jwenn.");
      const balances={...(us.data().walletBalances||{})};

      if(source==="exchangeRequests"){
        const rate=Number(prompt("To echanj: 1 "+r.from+" = konbyen "+r.to+" ?"));
        if(!(rate>0))throw new Error("Taux pa valab.");
        const amount=Number(r.amount||0),have=Number(balances[r.from]||0);
        if(have<amount)throw new Error("Balans ensifizan.");
        balances[r.from]=have-amount;balances[r.to]=Number(balances[r.to]||0)+amount*rate;
        tx.update(ur,{walletBalances:balances,updatedAt:serverTimestamp()});
        tx.update(rr,{status:"approved",rate,reviewedBy:admin.uid,reviewedAt:serverTimestamp()});
        tx.set(doc(collection(db,"walletTransactions")),{userId:r.userId,type:"exchange",amount,currency:r.from,toAmount:amount*rate,toCurrency:r.to,rate,createdAt:serverTimestamp()});
      }else{
        const amount=Number(r.amount||0),cur=r.currency||"HTG",type=r.type;
        if(type==="deposit")balances[cur]=Number(balances[cur]||0)+amount;
        else if(["withdrawal","transfer","payout"].includes(type)){
          if(Number(balances[cur]||0)<amount)throw new Error("Balans ensifizan.");
          balances[cur]=Number(balances[cur]||0)-amount;
        }
        tx.update(ur,{walletBalances:balances,updatedAt:serverTimestamp()});
        tx.update(rr,{status:"approved",reviewedBy:admin.uid,reviewedAt:serverTimestamp()});
        tx.set(doc(collection(db,"walletTransactions")),{userId:r.userId,type,amount,currency:cur,method:r.method||"",reference:r.reference||"",createdAt:serverTimestamp()});
      }
    });
    const rs=await getDoc(doc(db,source,id));
    if(rs.exists()) await addDoc(collection(db,"notifications"),{recipientId:rs.data().userId,title:"Demann apwouve",message:"Operasyon "+(rs.data().type||"exchange")+" la valide.",read:false,createdAt:serverTimestamp()});
    toast("Demand apwouve.");loadAll();
  }catch(e){console.error(e);toast(e.message||"Demand pa t trete.");}
}

function renderOrders(){
  const rows=[...data.orders].sort((a,b)=>(b.createdAt?.seconds||0)-(a.createdAt?.seconds||0));
  $("#adminOrders").innerHTML=rows.map(o=>`<div class="adminRow"><b>${money(o.total,o.currency)} • ${esc(o.status||"pending")}</b><br>
  <span class="muted">Achtè: ${esc(label(o.buyerId))} • Vandè: ${esc(label(o.sellerId))} • Komisyon: ${money(o.platformCommission||0,o.currency)}</span>
  ${o.status==="pending"?`<div class="actions"><button data-order="${o.id}" data-os="approved">Valide vant</button><button class="danger" data-order="${o.id}" data-os="rejected">Rejte</button></div>`:""}</div>`).join("")||'<p class="muted">Pa gen kòmand.</p>';
  $("[data-order]").forEach(b=>b.onclick=async()=>{const r=doc(db,"orders",b.dataset.order),s=await getDoc(r);await updateDoc(r,{status:b.dataset.os,reviewedBy:admin.uid,reviewedAt:serverTimestamp()});if(s.exists()){await addDoc(collection(db,"notifications"),{recipientId:s.data().buyerId,title:"Kòmand mete ajou",message:"Estati kòmand ou: "+b.dataset.os,read:false,createdAt:serverTimestamp()});await addDoc(collection(db,"notifications"),{recipientId:s.data().sellerId,title:"Vant mete ajou",message:"Estati vant la: "+b.dataset.os,read:false,createdAt:serverTimestamp()})}toast("Kòmand mete ajou.");loadAll()});
}

function renderVideos(){
  $("#adminVideos").innerHTML=data.videos.map(v=>`<div class="adminRow"><b>@${esc(v.username||"user")}</b> • ${esc(v.caption||"")}:<br><span class="muted">${v.active===false?"KACHE":"AKTIF"}</span><div class="actions"><button data-video="${v.id}" data-active="${v.active!==false}">${v.active===false?"Reaktive":"Kache"}</button></div></div>`).join("")||'<p class="muted">Pa gen videyo.</p>';
  $$("[data-video]").forEach(b=>b.onclick=async()=>{await updateDoc(doc(db,"shortVideos",b.dataset.video),{active:b.dataset.active!=="true",moderatedBy:admin.uid,updatedAt:serverTimestamp()});toast("Videyo mete ajou.");loadAll()});
}

function renderInvestments(){
  $("#adminInvestments").innerHTML=data.investments.map(x=>`<div class="adminRow"><b>${esc(x.levelName||"Envestisman")} • ${money(x.amount,x.currency)}</b><br><span class="muted">${esc(label(x.userId))} • ${esc(x.status||"pending")}</span>
  ${x.status==="pending"?`<div class="actions"><button data-investment="${x.id}" data-is="approved">Apwouve</button><button class="danger" data-investment="${x.id}" data-is="rejected">Rejte</button></div>`:""}</div>`).join("")||'<p class="muted">Pa gen demann envestisman.</p>';
  $("[data-investment]").forEach(b=>b.onclick=async()=>{const r=doc(db,"investments",b.dataset.investment),s=await getDoc(r);await updateDoc(r,{status:b.dataset.is,reviewedBy:admin.uid,reviewedAt:serverTimestamp()});if(s.exists())await addDoc(collection(db,"notifications"),{recipientId:s.data().userId,title:"Envestisman mete ajou",message:"Estati demann ou: "+b.dataset.is,read:false,createdAt:serverTimestamp()});toast("Envestisman mete ajou.");loadAll()});
}

function renderCases(){
  $("#adminCases").innerHTML=data.cases.map(c=>{
    const excerpt=Array.isArray(c.excerpt)?c.excerpt.map(x=>'<div class="msg">'+esc(x.text||"")+'</div>').join(""):"";
    return `<div class="adminRow"><b>${esc(c.title||c.type||"Rapò")}</b><br><span class="muted">${esc(c.status||"open")} • ${stamp(c.createdAt)}</span>${excerpt}</div>`;
  }).join("")||'<p class="muted">Pa gen ka moderasyon.</p>';
}

function renderLevels(){
  $("#levelCurrency").innerHTML=appSettings.currencies.map(c=>'<option>'+c+'</option>').join("");
  $("#adminLevels").innerHTML=data.levels.map(l=>`<div class="adminRow"><b>${esc(l.name)} • ${money(l.amount,l.currency)}</b><br><span class="muted">${Number(l.rate||0)}% • ${esc(l.period||"monthly")} • ${l.active===false?"INAKTIF":"AKTIF"}</span><div class="actions"><button data-level="${l.id}" data-next="${l.active===false}">${l.active===false?"Aktive":"Dezaktive"}</button></div></div>`).join("")||'<p class="muted">Pa gen nivo.</p>';
  $$("[data-level]").forEach(b=>b.onclick=async()=>{await updateDoc(doc(db,"investmentLevels",b.dataset.level),{active:b.dataset.next==="true",updatedAt:serverTimestamp()});loadAll()});
}
$("#levelForm").onsubmit=async e=>{e.preventDefault();await addDoc(collection(db,"investmentLevels"),{name:$("#levelName").value.trim(),amount:Number($("#levelAmount").value),currency:$("#levelCurrency").value,rate:Number($("#levelRate").value||0),period:$("#levelPeriod").value,active:true,createdAt:serverTimestamp()});e.target.reset();toast("Nivo kreye.");loadAll()};

function renderSupportUsers(){
  const opts=data.users.map(u=>`<option value="${u.id}">${esc(label(u.id))}</option>`).join("");
  $("#supportUser").innerHTML='<option value="">Chwazi itilizatè...</option>'+opts;
}
$("#openSupport").onclick=()=>{
  const uid=$("#supportUser").value;if(!uid)return toast("Chwazi itilizatè.");
  supportOff?.();
  const q=query(collection(db,"supportThreads",uid,"messages"),orderBy("createdAt","asc"),limit(300));
  supportOff=onSnapshot(q,s=>{
    const rows=s.docs.map(d=>({id:d.id,...d.data()}));
    $("#supportAdminMessages").innerHTML=rows.map(m=>`<div class="msg ${m.senderId===admin.uid?"me":""}">${esc(m.text||"")}</div>`).join("");
    $("#supportAdminMessages").scrollTop=$("#supportAdminMessages").scrollHeight;
  });
};
$("#supportAdminForm").onsubmit=async e=>{e.preventDefault();const uid=$("#supportUser").value,t=$("#supportAdminText").value.trim();if(!uid||!t)return;await addDoc(collection(db,"supportThreads",uid,"messages"),{senderId:admin.uid,text:t,createdAt:serverTimestamp()});await setDoc(doc(db,"supportThreads",uid),{userId:uid,updatedAt:serverTimestamp()},{merge:true});$("#supportAdminText").value=""};
