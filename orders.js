import {firebaseConfig} from "./firebase-config.js";
import {getApps,getApp,initializeApp} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import {getAuth,onAuthStateChanged} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import {getFirestore,collection,query,where,onSnapshot,doc,updateDoc,serverTimestamp} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const esc=s=>String(s??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]));
const money=(n,c)=>Number(n||0).toLocaleString(undefined,{maximumFractionDigits:2})+" "+(c||"HTG");
const configured=()=>firebaseConfig.apiKey&&!String(firebaseConfig.apiKey).includes("YOUR_");
if(configured()){
 const app=getApps().length?getApp():initializeApp(firebaseConfig),auth=getAuth(app),db=getFirestore(app);
 let user=null,buy=[],sell=[],offs=[];
 function clear(){offs.forEach(f=>f&&f());offs=[]}
 function itemsText(items=[]){return items.map(i=>(i.qty||1)+"× "+(i.name||"Pwodwi")).join(", ")}
 function render(){
   if($("#buyerOrders")) $("#buyerOrders").innerHTML=buy.length?buy.map(o=>`<div class="orderCard"><b>${money(o.total,o.currency)}</b> • <span class="status ${esc(o.status||"pending")}">${esc(o.status||"pending")}</span><div class="orderItems">${esc(itemsText(o.items))}</div><small class="muted">Peman: ${esc(o.paymentStatus||"unpaid")}</small></div>`).join(""):'<p class="muted">Pa gen kòmand kòm achtè.</p>';
   if($("#sellerOrders")) $("#sellerOrders").innerHTML=sell.length?sell.map(o=>`<div class="orderCard"><b>${money(o.total,o.currency)}</b> • <span class="status ${esc(o.status||"pending")}">${esc(o.status||"pending")}</span><div class="orderItems">${esc(itemsText(o.items))}</div><div class="actions">${o.status==="approved"||o.status==="pending"?`<button data-order-status="${o.id}" data-next="processing">Ap prepare</button>`:""}${o.status==="processing"?`<button data-order-status="${o.id}" data-next="shipped">Voye</button>`:""}${o.status==="shipped"?`<button data-order-status="${o.id}" data-next="completed">Fini</button>`:""}</div></div>`).join(""):'<p class="muted">Pa gen vant ankò.</p>';
   $$("[data-order-status]").forEach(b=>b.onclick=async()=>{await updateDoc(doc(db,"orders",b.dataset.orderStatus),{status:b.dataset.next,updatedAt:serverTimestamp()})});
   renderStats();
 }
 function renderStats(){
   if($("#statOrders")) $("#statOrders").textContent=buy.length;
   const completed=sell.filter(o=>o.status==="completed");
   if($("#statSales")) $("#statSales").textContent=completed.length;
   const sums={};completed.forEach(o=>sums[o.currency||"HTG"]=(sums[o.currency||"HTG"]||0)+Number(o.sellerNet??o.total??0));
   if($("#salesByCurrency")) $("#salesByCurrency").innerHTML=Object.keys(sums).length?Object.entries(sums).map(([c,v])=>`<div class="historyRow"><b>${money(v,c)}</b></div>`).join(""):'<p class="muted">Pa gen vant fini.</p>';
   if($("#statRevenue")){
     const htg=sums.HTG||0;$("#statRevenue").textContent=money(htg,"HTG");
   }
   if($("#statProducts")){
     onSnapshot(query(collection(db,"products"),where("sellerId","==",user.uid)),s=>$("#statProducts").textContent=s.size,{onlyOnce:true});
   }
 }
 onAuthStateChanged(auth,u=>{
   clear();user=u;if(!u)return;
   offs.push(onSnapshot(query(collection(db,"orders"),where("buyerId","==",u.uid)),s=>{buy=s.docs.map(d=>({id:d.id,...d.data()})).sort((a,b)=>(b.createdAt?.seconds||0)-(a.createdAt?.seconds||0));render()}));
   offs.push(onSnapshot(query(collection(db,"orders"),where("sellerId","==",u.uid)),s=>{sell=s.docs.map(d=>({id:d.id,...d.data()})).sort((a,b)=>(b.createdAt?.seconds||0)-(a.createdAt?.seconds||0));render()}));
 });
}
