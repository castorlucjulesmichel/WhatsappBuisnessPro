import {firebaseConfig} from "./firebase-config.js";
import {getApps,getApp,initializeApp} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import {getAuth,onAuthStateChanged} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import {getFirestore,collection,query,where,onSnapshot,doc,updateDoc,serverTimestamp} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const esc=s=>String(s??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]));
const configured=()=>firebaseConfig.apiKey&&!String(firebaseConfig.apiKey).includes("YOUR_");
if(configured()){
 const app=getApps().length?getApp():initializeApp(firebaseConfig),auth=getAuth(app),db=getFirestore(app);
 let off=null;
 $("#notificationBtn")?.addEventListener("click",()=>$("#notificationPanel")?.classList.toggle("hidden"));
 $("#closeNotifications")?.addEventListener("click",()=>$("#notificationPanel")?.classList.add("hidden"));
 onAuthStateChanged(auth,u=>{
   off?.();if(!u)return;
   off=onSnapshot(query(collection(db,"notifications"),where("recipientId","==",u.uid)),s=>{
     const rows=s.docs.map(d=>({id:d.id,...d.data()})).sort((a,b)=>(b.createdAt?.seconds||0)-(a.createdAt?.seconds||0));
     const unread=rows.filter(x=>x.read!==true).length;
     const badge=$("#notificationBadge");if(badge){badge.textContent=unread;badge.classList.toggle("hidden",unread===0)}
     if($("#notificationList")) $("#notificationList").innerHTML=rows.length?rows.map(n=>`<div class="notificationItem ${n.read===true?"":"unread"}" data-notification="${n.id}" role="button" tabindex="0"><div>${esc(n.title||"Notifikasyon")}</div><small>${esc(n.message||"")}</small></div>`).join(""):'<p class="muted">Pa gen notifikasyon.</p>';
     $("[data-notification]").forEach(el=>{
       const mark=async()=>{
         try{
           await updateDoc(doc(db,"notifications",el.dataset.notification),{read:true,readAt:serverTimestamp()});
           window.WBP_ACTIVITY?.("notification_read","notifications",{notificationId:el.dataset.notification});
         }catch(e){console.warn("notification read",e?.code||e)}
       };
       el.onclick=mark;
       el.onkeydown=e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();mark()}};
     });
   });
 });
}
