import fs from "node:fs";
import {
  initializeTestEnvironment,
  assertSucceeds,
  assertFails
} from "@firebase/rules-unit-testing";
import {
  doc,setDoc,getDoc,addDoc,collection,updateDoc,serverTimestamp
} from "firebase/firestore";

const rules=fs.readFileSync("firestore.rules","utf8");
const projectId="whatsappbusinesspro-rules-test";
const env=await initializeTestEnvironment({projectId,firestore:{rules}});

const u1=env.authenticatedContext("user-one").firestore();
const u2=env.authenticatedContext("user-two").firestore();
const adminDb=env.authenticatedContext("admin-one").firestore();

await env.withSecurityRulesDisabled(async ctx=>{
  const db=ctx.firestore();
  await setDoc(doc(db,"admins","admin-one"),{active:true});
});

async function createUser(db,uid){
  await assertSucceeds(setDoc(doc(db,"users",uid),{
    blocked:false,walletBalances:{HTG:0,USD:0},adBalances:{HTG:0,USD:0},
    email:uid+"@test.local",createdAt:serverTimestamp()
  }));
}
await createUser(u1,"user-one");
await createUser(u2,"user-two");

await assertSucceeds(setDoc(doc(u1,"publicProfiles","user-one"),{
  displayName:"User One",username:"userone",role:"buyer",updatedAt:serverTimestamp()
}));
await assertSucceeds(setDoc(doc(u2,"publicProfiles","user-two"),{
  displayName:"User Two",username:"usertwo",role:"seller",updatedAt:serverTimestamp()
}));

await assertSucceeds(setDoc(doc(u1,"users","user-one","contacts","user-two"),{
  uid:"user-two",contactUid:"user-two",username:"usertwo",addedAt:serverTimestamp()
}));

const statusRef=doc(collection(u2,"statuses"));
await assertSucceeds(setDoc(statusRef,{
  ownerId:"user-two",ownerUsername:"usertwo",text:"status",mediaType:"text",
  mediaPath:"",boostActive:false,boostAudience:{mode:"contacts"},boostEndsAt:null,
  createdAt:serverTimestamp(),expiresAt:new Date(Date.now()+86400000)
}));
await assertSucceeds(getDoc(doc(u1,"statuses",statusRef.id)));

const chatId="user-one__user-two";
await assertSucceeds(setDoc(doc(u1,"chats",chatId),{
  type:"direct",participants:["user-one","user-two"],participantNames:{"user-one":"One","user-two":"Two"},
  lastMessage:"",updatedAt:serverTimestamp()
}));
await assertSucceeds(addDoc(collection(u1,"chats",chatId,"messages"),{
  senderId:"user-one",type:"text",text:"hello",readBy:["user-one"],createdAt:serverTimestamp()
}));
await assertSucceeds(setDoc(doc(u1,"users","user-one","chatPrefs",chatId),{
  theme:"green",disappearingDuration:"24h",updatedAt:serverTimestamp()
}));
await assertSucceeds(setDoc(doc(u1,"users","user-one","callHistory","call-1"),{
  userId:"user-one",chatId,peerUid:"user-two",name:"User Two",mode:"voice",
  direction:"outgoing",status:"terminé",clientAtMs:Date.now(),createdAt:serverTimestamp()
}));

await assertSucceeds(setDoc(doc(u1,"users","user-one","blocks","user-two"),{
  blockedUid:"user-two",blockedAt:serverTimestamp()
}));
await assertFails(addDoc(collection(u2,"chats",chatId,"messages"),{
  senderId:"user-two",type:"text",text:"blocked",readBy:["user-two"],createdAt:serverTimestamp()
}));

const product=doc(collection(u2,"products"));
await assertSucceeds(setDoc(product,{
  sellerId:"user-two",sellerUsername:"usertwo",name:"Product",price:1000,currency:"HTG",
  category:"Other",stock:2,description:"test",active:true,createdAt:serverTimestamp()
}));
await assertSucceeds(addDoc(collection(u1,"orders"),{
  buyerId:"user-one",sellerId:"user-two",items:[{id:product.id,name:"Product",price:1000,currency:"HTG",qty:1}],
  total:1000,currency:"HTG",platformCommission:100,sellerNet:900,status:"pending",
  paymentStatus:"unpaid",createdAt:serverTimestamp()
}));

const video=doc(collection(u2,"shortVideos"));
await assertSucceeds(setDoc(video,{
  ownerId:"user-two",username:"usertwo",caption:"clip",videoUrl:"https://example.invalid/video.mp4",
  productId:product.id,active:true,createdAt:serverTimestamp()
}));
await assertSucceeds(setDoc(doc(u1,"shortVideos",video.id,"likes","user-one"),{createdAt:serverTimestamp()}));
await assertSucceeds(addDoc(collection(u1,"shortVideos",video.id,"comments"),{
  userId:"user-one",username:"userone",text:"bon",createdAt:serverTimestamp()
}));

const financial=await assertSucceeds(addDoc(collection(u1,"financialRequests"),{
  userId:"user-one",type:"deposit",mode:"manual",amount:500,currency:"HTG",
  method:"MonCash",status:"pending",createdAt:serverTimestamp()
}));
await assertSucceeds(addDoc(collection(u1,"exchangeRequests"),{
  userId:"user-one",amount:100,from:"HTG",to:"USD",status:"pending",createdAt:serverTimestamp()
}));
await assertSucceeds(addDoc(collection(u1,"investments"),{
  userId:"user-one",levelId:"basic",levelName:"Basic",amount:100,currency:"HTG",
  rate:1,period:"monthly",status:"pending",createdAt:serverTimestamp()
}));
await assertSucceeds(addDoc(collection(u1,"adTopups"),{
  userId:"user-one",amount:100,currency:"HTG",method:"MonCash",status:"pending",createdAt:serverTimestamp()
}));
await assertSucceeds(addDoc(collection(u1,"adCampaigns"),{
  ownerId:"user-one",targetType:"product",targetId:product.id,targetLabel:"Product",
  goal:"sales",audience:{mode:"automatic"},dailyBudget:10,days:3,totalBudget:30,
  currency:"HTG",status:"pending_review",createdAt:serverTimestamp()
}));
await assertSucceeds(addDoc(collection(u1,"moderationCases"),{
  reporterId:"user-one",type:"clip",targetId:video.id,title:"report",status:"open",createdAt:serverTimestamp()
}));
await assertSucceeds(setDoc(doc(u1,"supportThreads","user-one"),{
  userId:"user-one",updatedAt:serverTimestamp()
},{merge:true}));
await assertSucceeds(addDoc(collection(u1,"supportThreads","user-one","messages"),{
  senderId:"user-one",text:"support",createdAt:serverTimestamp()
}));

const activity=await assertSucceeds(addDoc(collection(u1,"userActivity"),{
  userId:"user-one",action:"button_click",target:"market",page:"market",
  sessionId:"test",clientAtMs:Date.now(),clientAt:new Date().toISOString(),online:true,meta:{},
  createdAt:serverTimestamp()
}));
await assertSucceeds(getDoc(doc(adminDb,"userActivity",activity.id)));

await assertFails(updateDoc(doc(u1,"users","user-one"),{
  walletBalances:{HTG:999,USD:0}
}));
await assertSucceeds(updateDoc(doc(adminDb,"financialRequests",financial.id),{
  status:"approved",reviewedBy:"admin-one",reviewedAt:serverTimestamp()
}));

console.log("Firestore integration passed: chat, blocking, call history, status contacts, products, orders, video interactions, finance, boost, support, moderation and activity logs.");
await env.cleanup();
