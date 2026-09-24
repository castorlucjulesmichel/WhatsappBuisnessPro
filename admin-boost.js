import {firebaseConfig} from "./firebase-config.js";
import {getApps,getApp,initializeApp} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import {getAuth,onAuthStateChanged} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import {getFirestore,doc,collection,onSnapshot,runTransaction,updateDoc,serverTimestamp,Timestamp} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const configured=()=>firebaseConfig.apiKey && !String(firebaseConfig.apiKey).includes("YOUR_");
const esc=s=>String(s??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]));
const toast=t=>{const e=$("#toast");if(!e)return;e.textContent=t;e.classList.add("show");setTimeout(()=>e.classList.remove("show"),2200)};
const money=(n,c)=>Number(n||0).toLocaleString(undefined,{maximumFractionDigits:2})+" "+(c||"HTG");

if(configured()){
 const app=getApps().length?getApp():initializeApp(firebaseConfig);
 const auth=getAuth(app),db=getFirestore(app);
 let admin=null,offs=[];

 async function requireAdmin(u){
   if(!u) return false;
   const token=await u.getIdTokenResult(true);
   return token.claims.admin===true;
 }

 function clear(){offs.forEach(f=>f&&f());offs=[]}

 function watchTopups(){
   offs.push(onSnapshot(collection(db,"adTopups"),s=>{
     const rows=s.docs.map(d=>({id:d.id,...d.data()})).sort((a,b)=>(b.createdAt?.seconds||0)-(a.createdAt?.seconds||0));
     $("#aAdTopups") && ($("#aAdTopups").textContent=rows.filter(x=>x.status==="pending").length);
     if($("#adminAdTopups")) $("#adminAdTopups").innerHTML=rows.length?rows.map(x=>`
       <div class="adminRow">
        <b>${esc(x.method)} • ${money(x.amount,x.currency)}</b><br>
        <span class="muted">User: ${esc(x.userId)} • Ref: ${esc(x.reference||"—")} • ${esc(x.status||"pending")}</span>
        ${x.proofUrl?`<div><a href="${esc(x.proofUrl)}" target="_blank" rel="noopener">Gade prèv</a></div>`:""}
        ${x.status==="pending"?`<div class="actions"><button class="ok" data-adtopup="${x.id}" data-decision="approved">Valide</button><button class="danger" data-adtopup="${x.id}" data-decision="rejected">Rejte</button></div>`:""}
       </div>`).join(""):'<p class="muted">Pa gen depo ads.</p>';
     $$("[data-adtopup]").forEach(b=>b.onclick=()=>decideTopup(b.dataset.adtopup,b.dataset.decision));
   }));
 }

 async function decideTopup(id,decision){
   if(!admin) return;
   try{
     await runTransaction(db,async tx=>{
       const r=doc(db,"adTopups",id),snap=await tx.get(r);
       if(!snap.exists()) throw new Error("Demann pa jwenn.");
       const d=snap.data();
       if(d.status!=="pending") throw new Error("Demann sa deja trete.");
       if(decision==="approved"){
         const uref=doc(db,"users",d.userId),us=await tx.get(uref);
         if(!us.exists()) throw new Error("Itilizatè pa jwenn.");
         const balances={...(us.data().adBalances||{})};
         balances[d.currency]=Number(balances[d.currency]||0)+Number(d.amount||0);
         tx.update(uref,{adBalances:balances,updatedAt:serverTimestamp()});
       }
       tx.update(r,{status:decision,reviewedBy:admin.uid,reviewedAt:serverTimestamp()});
     });
     toast(decision==="approved"?"Depo ads valide.":"Depo ads rejte.");
   }catch(e){console.error(e);toast(e.message||"Operasyon echwe.");}
 }

 function watchCampaigns(){
   offs.push(onSnapshot(collection(db,"adCampaigns"),s=>{
     const rows=s.docs.map(d=>({id:d.id,...d.data()})).sort((a,b)=>(b.createdAt?.seconds||0)-(a.createdAt?.seconds||0));
     $("#aCampaigns") && ($("#aCampaigns").textContent=rows.length);
     if($("#adminCampaigns")) $("#adminCampaigns").innerHTML=rows.length?rows.map(x=>`
      <div class="adminRow">
       <b>${esc(x.targetLabel||x.targetType||"Boost")}</b> • ${money(x.totalBudget,x.currency)}<br>
       <span class="muted">Objektif: ${esc(x.goal||"—")} • ${Number(x.days||0)} jou • ${esc(x.status||"pending_review")}</span><br>
       <small>Odyans: ${esc(x.audience?.mode||"automatic")} ${esc(x.audience?.country||"")}</small>
       ${x.status==="pending_review"?`<div class="actions"><button class="ok" data-campaign="${x.id}" data-action="approve">Valide & aktive</button><button class="danger" data-campaign="${x.id}" data-action="reject">Rejte</button></div>`:""}
       ${x.status==="active"?`<div class="actions"><button class="warn" data-campaign="${x.id}" data-action="pause">Poz</button></div>`:""}
       ${x.status==="paused"?`<div class="actions"><button class="ok" data-campaign="${x.id}" data-action="resume">Reprann</button></div>`:""}
      </div>`).join(""):'<p class="muted">Pa gen kanpay.</p>';
     $$("[data-campaign]").forEach(b=>b.onclick=()=>campaignAction(b.dataset.campaign,b.dataset.action));
   }));
 }

 async function campaignAction(id,action){
   if(!admin) return;
   try{
     if(action==="approve"){
       await runTransaction(db,async tx=>{
         const cref=doc(db,"adCampaigns",id),cs=await tx.get(cref);
         if(!cs.exists()) throw new Error("Kanpay pa jwenn.");
         const c=cs.data();
         if(c.status!=="pending_review") throw new Error("Kanpay sa deja trete.");
         const uref=doc(db,"users",c.ownerId),us=await tx.get(uref);
         if(!us.exists()) throw new Error("Itilizatè pa jwenn.");
         const balances={...(us.data().adBalances||{})};
         const currency=c.currency||"HTG",need=Number(c.totalBudget||0),have=Number(balances[currency]||0);
         if(!(need>0)||have<need) throw new Error("Ad Wallet itilizatè a pa gen ase lajan.");
         balances[currency]=have-need;
         const end=new Date(Date.now()+Number(c.days||1)*86400000);
         tx.update(uref,{adBalances:balances,updatedAt:serverTimestamp()});
         tx.update(cref,{status:"active",reviewedBy:admin.uid,reviewedAt:serverTimestamp(),startedAt:serverTimestamp(),endsAt:Timestamp.fromDate(end)});
       });
       toast("Boost valide epi aktive.");
       return;
     }
     if(action==="reject"){
       await updateDoc(doc(db,"adCampaigns",id),{status:"rejected",reviewedBy:admin.uid,reviewedAt:serverTimestamp()});
       toast("Boost rejte."); return;
     }
     if(action==="pause"){
       await updateDoc(doc(db,"adCampaigns",id),{status:"paused",pausedAt:serverTimestamp(),pausedBy:admin.uid});
       toast("Boost an poz."); return;
     }
     if(action==="resume"){
       await updateDoc(doc(db,"adCampaigns",id),{status:"active",resumedAt:serverTimestamp(),resumedBy:admin.uid});
       toast("Boost reprann."); return;
     }
   }catch(e){console.error(e);toast(e.message||"Kanpay la pa t ka trete.");}
 }

 onAuthStateChanged(auth,async u=>{
   clear();
   if(!(await requireAdmin(u))) return;
   admin=u;watchTopups();watchCampaigns();
 });
}
