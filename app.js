import {configured,auth,db} from "./firebase-config.js";
const V="https://www.gstatic.com/firebasejs/10.12.0/";
const A=await import(V+"firebase-auth.js"), F=await import(V+"firebase-firestore.js");
const $=s=>document.querySelector(s);
const h=(t,c,x)=>{const e=document.createElement(t);if(c)e.className=c;if(x!=null)e.textContent=x;return e}; // textContent only: no HTML injection
if(!configured){$("#boot").hidden=true;$("#setup").hidden=false;throw new Error("Firebase not configured")}

let me=null,profile=null,mode="signin",tab="chats",conns=[],convs=[],active=null,unsubMsgs=null;
const cache={};
const friendly=e=>({"auth/invalid-credential":"Wrong email or password.","auth/email-already-in-use":"That email is already registered.","auth/weak-password":"Password needs at least 8 characters.","auth/invalid-email":"Enter a valid email address.","taken":"That username is taken.","badname":"Username: 3–20 characters, a–z, 0–9, underscore.","permission-denied":"You don't have permission to do that."}[e.code||e.message]||"Something went wrong. Try again.");

// ---------- AUTH ----------
function setMode(m){mode=m;$("#regFields").hidden=m!=="register";$("#authBtn").textContent=m==="register"?"Create account":"Sign in";$("#toggle").textContent=m==="register"?"I have an account":"Create account"}
$("#toggle").onclick=()=>setMode(mode==="signin"?"register":"signin");
$("#reset").onclick=async()=>{try{await A.sendPasswordResetEmail(auth,$("#email").value);$("#authErr").textContent="Reset email sent if the account exists."}catch(e){$("#authErr").textContent=friendly(e)}};
// Username uniqueness: usernames/{name} doc is created in a transaction; rules forbid overwriting it.
async function createProfile(user,username,displayName){
  const lower=username.toLowerCase();
  await F.runTransaction(db,async tx=>{
    const ref=F.doc(db,"usernames",lower);
    if((await tx.get(ref)).exists())throw new Error("taken");
    tx.set(ref,{uid:user.uid});
    tx.set(F.doc(db,"users",user.uid),{uid:user.uid,username:lower,usernameLowercase:lower,displayName:displayName||lower,photoURL:user.photoURL||"",bio:"",createdAt:F.serverTimestamp()});
  });
}
$("#authForm").onsubmit=async ev=>{ev.preventDefault();const err=$("#authErr");err.textContent="AUTHENTICATING...";
  const email=$("#email").value.trim(),pw=$("#password").value;
  try{
    if(mode==="register"){
      const u=$("#username").value.trim().toLowerCase();
      if(!/^[a-z0-9_]{3,20}$/.test(u))throw new Error("badname");
      if(pw.length<8)throw {code:"auth/weak-password"};
      const cred=await A.createUserWithEmailAndPassword(auth,email,pw);
      try{await createProfile(cred.user,u,$("#displayName").value.trim().slice(0,40))}
      catch(e){await A.deleteUser(cred.user);throw e}
      A.sendEmailVerification(cred.user).catch(()=>{});
    }else await A.signInWithEmailAndPassword(auth,email,pw);
    err.textContent="";
  }catch(e){err.textContent=friendly(e)}};
$("#google").onclick=async()=>{try{
  const r=await A.signInWithPopup(auth,new A.GoogleAuthProvider());
  if(!(await F.getDoc(F.doc(db,"users",r.user.uid))).exists()){
    const base=(r.user.email.split("@")[0].replace(/[^a-z0-9_]/gi,"").toLowerCase()+"_user").slice(0,14);
    await createProfile(r.user,base+Math.floor(Math.random()*900+100),r.user.displayName||base)}
}catch(e){$("#authErr").textContent=friendly(e)}};
$("#out").onclick=()=>A.signOut(auth);

A.onAuthStateChanged(auth,async u=>{
  $("#boot").hidden=true;me=u;
  if(!u){$("#app").hidden=true;$("#auth").hidden=false;[unsubC,unsubV].forEach(f=>f&&f());return}
  $("#auth").hidden=true;$("#app").hidden=false;
  profile=await user(u.uid);$("#meName").textContent="@"+(profile?.username||"…");
  listen();render();
});
async function user(uid){if(!cache[uid]){const s=await F.getDoc(F.doc(db,"users",uid));cache[uid]=s.exists()?s.data():{username:"unknown",displayName:"Unknown"}}return cache[uid]}

// ---------- CONNECTIONS & CONVERSATIONS (real-time) ----------
let unsubC,unsubV;
const other=c=>c.users.find(x=>x!==me.uid);
function listen(){
  unsubC=F.onSnapshot(F.query(F.collection(db,"connections"),F.where("users","array-contains",me.uid)),async s=>{
    conns=s.docs.map(d=>({id:d.id,...d.data()}));await Promise.all(conns.map(c=>user(other(c))));render()});
  unsubV=F.onSnapshot(F.query(F.collection(db,"conversations"),F.where("members","array-contains",me.uid)),async s=>{
    convs=s.docs.map(d=>({id:d.id,...d.data()})).sort((a,b)=>(b.updatedAt?.seconds||0)-(a.updatedAt?.seconds||0));
    await Promise.all(convs.map(c=>user(c.members.find(x=>x!==me.uid))));render()});
}
document.querySelectorAll("nav [data-tab]").forEach(b=>b.onclick=()=>{tab=b.dataset.tab;$("#app").classList.remove("inchat");render()});
function render(){
  document.querySelectorAll("nav [data-tab]").forEach(b=>b.classList.toggle("on",b.dataset.tab===tab));
  const inc=conns.filter(c=>c.status==="pending"&&c.requester!==me.uid);
  $("#badge").hidden=!inc.length;$("#badge").textContent=inc.length;
  const box=$("#items");box.replaceChildren();
  $("#listTitle").textContent=tab==="chats"?"CHATS":"CONNECTIONS";
  if(tab==="chats"){
    if(!convs.length)box.append(h("p","empty","No conversations yet.\nConnect with someone to start a private conversation."));
    convs.forEach(c=>{const p=cache[c.members.find(x=>x!==me.uid)];const r=h("div","row click");
      const l=h("div");l.append(h("b","",p.displayName),h("div","dim small mono","@"+p.username+" · "+(c.lastMessage||"")));r.append(l);
      r.tabIndex=0;r.onclick=r.onkeydown=e=>{if(e.type==="click"||e.key==="Enter")openChat(c,p)};box.append(r)});
  }else{
    if(!conns.length)box.append(h("p","empty","No connections or requests."));
    conns.forEach(c=>{const p=cache[other(c)];const r=h("div","row");r.append(h("span","mono","@"+p.username));const a=h("div","acts");
      if(c.status==="accepted"){const m=h("button","","Message");m.onclick=()=>{const cv=convs.find(x=>x.id===c.id);if(cv)openChat(cv,p)};a.append(m)}
      else if(c.requester===me.uid)a.append(h("span","dim small","Pending"));
      else{const ok=h("button","primary","Accept");ok.onclick=()=>accept(c);a.append(ok)}
      const rm=h("button","",c.status==="accepted"?"Remove":"Decline");rm.onclick=()=>F.deleteDoc(F.doc(db,"connections",c.id));a.append(rm);r.append(a);box.append(r)});
  }
}
// Search by EXACT username only (no directory listing is possible under the rules).
$("#q").onkeydown=async e=>{if(e.key!=="Enter")return;const res=$("#results");res.replaceChildren();
  const n=e.target.value.trim().replace(/^@/,"").toLowerCase();if(!n)return;
  const s=await F.getDoc(F.doc(db,"usernames",n)).catch(()=>null);
  if(!s?.exists()){res.append(h("p","dim small","No user found."));return}
  const uid=s.data().uid;if(uid===me.uid){res.append(h("p","dim small","That's you."));return}
  const p=await user(uid),ex=conns.find(c=>other(c)===uid);
  const r=h("div","row");r.append(h("span","",p.displayName+" @"+p.username));
  const b=h("button","primary",ex?(ex.status==="accepted"?"Connected":"Pending"):"Add Connection");b.disabled=!!ex;
  b.onclick=async()=>{const users=[me.uid,uid].sort();try{await F.setDoc(F.doc(db,"connections",users.join("_")),{users,requester:me.uid,status:"pending",createdAt:F.serverTimestamp()});res.replaceChildren()}catch(x){b.textContent=friendly(x)}};
  r.append(b);res.append(r)};
async function accept(c){
  await F.updateDoc(F.doc(db,"connections",c.id),{status:"accepted"});
  await F.setDoc(F.doc(db,"conversations",c.id),{members:c.users,createdAt:F.serverTimestamp(),updatedAt:F.serverTimestamp(),lastMessage:""}); // rules: only allowed once connection is accepted
}

// ---------- MESSAGING ----------
function openChat(c,p){
  active=c;$("#peer").textContent=p.displayName+" @"+p.username;$("#app").classList.add("inchat");
  $("#msgs").replaceChildren(h("p","empty","LOADING CHANNEL..."));unsubMsgs&&unsubMsgs();
  unsubMsgs=F.onSnapshot(F.query(F.collection(db,"conversations",c.id,"messages"),F.orderBy("createdAt"),F.limitToLast(100)),s=>{
    const box=$("#msgs");box.replaceChildren();if(s.empty)box.append(h("p","empty","No messages yet."));
    s.docs.forEach(d=>{const m=d.data(),mine=m.senderId===me.uid,e=h("div","msg"+(mine?" mine":""));
      if(mine){const x=h("button","del","✕");x.setAttribute("aria-label","Delete message");x.onclick=()=>F.deleteDoc(d.ref);e.append(x)}
      e.append(h("span","",m.text),h("small","",m.createdAt?m.createdAt.toDate().toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"}):"…"));box.append(e)});
    box.scrollTop=box.scrollHeight},()=>{$("#msgs").replaceChildren(h("p","empty","Can't load this channel."))});
}
$("#back").onclick=()=>$("#app").classList.remove("inchat");
$("#composer").onsubmit=async e=>{e.preventDefault();const t=$("#text").value.trim();if(!t||!active)return;$("#text").value="";
  try{await F.addDoc(F.collection(db,"conversations",active.id,"messages"),{senderId:me.uid,text:t,createdAt:F.serverTimestamp()});
    await F.updateDoc(F.doc(db,"conversations",active.id),{lastMessage:t.slice(0,80),updatedAt:F.serverTimestamp()})}
  catch(x){$("#text").value=t}};
setMode("signin");
