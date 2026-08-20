import { useEffect, useMemo, useState } from "react";
import {
  createUserWithEmailAndPassword, onAuthStateChanged, sendPasswordResetEmail,
  signInWithEmailAndPassword, signOut, updateProfile
} from "firebase/auth";
import {
  addDoc, collection, deleteDoc, doc, onSnapshot, orderBy, query,
  serverTimestamp, updateDoc
} from "firebase/firestore";
import { auth, db, firebaseConfigured, firebaseConfigError } from "./firebase";

const initialStudents = [
  { id: "ST001", name: "Sok Dara", gender: "Male", age: 21, major: "Computer Science", year: 3, phone: "012345678", email: "sokdara@gmail.com", status: "Active", gpa: 3.4 },
  { id: "ST002", name: "Chan Sreypich", gender: "Female", age: 20, major: "Information Technology", year: 2, phone: "098765432", email: "sreypich@gmail.com", status: "Active", gpa: 3.7 },
  { id: "ST003", name: "Chea Vuthy", gender: "Male", age: 22, major: "Business", year: 4, phone: "097111222", email: "vuthy@gmail.com", status: "Active", gpa: 3.1 },
  { id: "ST004", name: "Kim Lina", gender: "Female", age: 21, major: "Computer Science", year: 3, phone: "096333444", email: "lina@gmail.com", status: "Inactive", gpa: 3.8 }
];


const emptyStudent = { id:"", name:"", gender:"Male", age:"", major:"Computer Science", year:"1", phone:"", email:"", status:"Active", gpa:"0" };

function App() {
  const [user,setUser]=useState(null);
  const [authReady,setAuthReady]=useState(false);
  const [students,setStudents]=useState([]);
  const [page,setPage]=useState("Dashboard");
  const [authMode,setAuthMode]=useState("login");
  const [authForm,setAuthForm]=useState({email:"",password:"",name:""});
  const [authMsg,setAuthMsg]=useState("");
  const [search,setSearch]=useState("");
  const [showForm,setShowForm]=useState(false);
  const [editingId,setEditingId]=useState(null);
  const [selected,setSelected]=useState(null);
  const [form,setForm]=useState(emptyStudent);
  const [settings,setSettings]=useState({notifications:true,compact:false,dark:false});
  const [loading,setLoading]=useState(false);

  useEffect(()=>{
    if(!auth){ setUser(null); setAuthReady(true); return; }
    return onAuthStateChanged(auth,u=>{setUser(u);setAuthReady(true)});
  },[]);

  useEffect(()=>{
    if(!user || !firebaseConfigured){ setStudents([]); return; }
    const q=query(collection(db,"students"),orderBy("createdAt","desc"));
    return onSnapshot(q,
      snap=>setStudents(snap.docs.map(d=>({idDoc:d.id,...d.data()}))),
      err=>console.error(err)
    );
  },[user]);

  const filtered=useMemo(()=>{
    const q=search.toLowerCase().trim();
    return q?students.filter(s=>`${s.studentId} ${s.name} ${s.major} ${s.email} ${s.phone}`.toLowerCase().includes(q)):students;
  },[students,search]);

  const avg=students.length?(students.reduce((a,s)=>a+Number(s.gpa||0),0)/students.length).toFixed(2):"0.00";
  const active=students.filter(s=>s.status==="Active").length;
  const male=students.filter(s=>s.gender==="Male").length;
  const female=students.filter(s=>s.gender==="Female").length;

  async function submitAuth(e){
    e.preventDefault(); setAuthMsg(""); setLoading(true);
    try{
      if(!firebaseConfigured) throw new Error(
        firebaseConfigError==="invalid-api-key-format"
          ? "Your VITE_FIREBASE_API_KEY in .env doesn't look like a real Firebase key (it should start with 'AIza' and be 39 characters, with no quotes or extra spaces). Recheck it in Firebase Console \u2192 Project settings \u2192 General \u2192 Your apps \u2192 SDK setup and configuration."
          : "Firebase is not configured. Copy .env.example to .env and add your Firebase Web App values."
      );
      if(authMode==="register"){
        const cred=await createUserWithEmailAndPassword(auth,authForm.email,authForm.password);
        await updateProfile(cred.user,{displayName:authForm.name});
      }else{
        await signInWithEmailAndPassword(auth,authForm.email,authForm.password);
      }
    }catch(err){setAuthMsg(err.message.replace("Firebase: ",""))}
    finally{setLoading(false)}
  }

  async function resetPassword(){
    if(!authForm.email){setAuthMsg("Enter your email first.");return}
    if(!firebaseConfigured){
      setAuthMsg(
        firebaseConfigError==="invalid-api-key-format"
          ? "Your VITE_FIREBASE_API_KEY in .env doesn't look like a real Firebase key. Recheck it in Firebase Console → Project settings → General → Your apps → SDK setup and configuration."
          : "Firebase is not configured. Copy .env.example to .env and add your Firebase Web App values."
      );
      return;
    }
    try{await sendPasswordResetEmail(auth,authForm.email);setAuthMsg("Password reset email sent.")}catch(e){setAuthMsg(e.message.replace("Firebase: ",""))}
  }

  async function saveStudent(e){
    e.preventDefault(); setLoading(true);
    const data={studentId:form.id,name:form.name,gender:form.gender,age:Number(form.age),major:form.major,year:Number(form.year),phone:form.phone,email:form.email,status:form.status,gpa:Number(form.gpa)};
    try{
      if(editingId) await updateDoc(doc(db,"students",editingId),data);
      else await addDoc(collection(db,"students"),{...data,createdAt:serverTimestamp()});
      setShowForm(false);setEditingId(null);setForm(emptyStudent);setPage("Students");
    }catch(e){alert(e.message)}
    finally{setLoading(false)}
  }

  async function removeStudent(id){
    if(!confirm("Delete this student permanently?")) return;
    try{await deleteDoc(doc(db,"students",id)); if(selected?.idDoc===id)setSelected(null)}catch(e){alert(e.message)}
  }

  function openAdd(){
    setEditingId(null);
    setForm({...emptyStudent,id:`ST${String(students.length+1).padStart(3,"0")}`});
    setShowForm(true);
  }
  function openEdit(s){
    setEditingId(s.idDoc);
    setForm({id:s.studentId||"",name:s.name||"",gender:s.gender||"Male",age:String(s.age||""),major:s.major||"Computer Science",year:String(s.year||1),phone:s.phone||"",email:s.email||"",status:s.status||"Active",gpa:String(s.gpa??0)});
    setShowForm(true);
  }

  if(!authReady) return <div className="center">Loading...</div>;
  if(!user) return <Auth mode={authMode} setMode={setAuthMode} form={authForm} setForm={setAuthForm} submit={submitAuth} reset={resetPassword} msg={authMsg} loading={loading}/>;

  const nav=["Dashboard","Students","Reports","Settings"];
  return <div className={`app ${settings.dark?"dark":""} ${settings.compact?"compact":""}`}>
    <aside className="sidebar">
      <div className="brand"><div className="logo">SMS</div><div><b>Student</b><span>Management</span></div></div>
      <nav>{nav.map(n=><button key={n} className={page===n?"nav active":"nav"} onClick={()=>setPage(n)}>{icon(n)}<span>{n}</span></button>)}</nav>
      <div className="sidebar-bottom"><div className="user-mini"><div className="avatar">{(user.displayName||user.email||"A").charAt(0).toUpperCase()}</div><div><b>{user.displayName||"Administrator"}</b><small>{user.email}</small></div></div><button className="logout" onClick={()=>signOut(auth)}>Log out</button></div>
    </aside>

    <main className="content">
      <header className="topbar"><div><p className="eyebrow">ADMIN PANEL</p><h1>{page}</h1><p className="muted">{page==="Dashboard"?"Overview of your student management system.":page==="Students"?"Manage student records with full CRUD.":page==="Reports"?"Statistics and export tools.":"System and administrator preferences."}</p></div>{(page==="Dashboard"||page==="Students")&&<button onClick={openAdd}>+ Add Student</button>}</header>

      {page==="Dashboard"&&<Dashboard students={students} active={active} avg={avg} onAdd={openAdd} onPage={setPage} onView={setSelected}/>}
      {page==="Students"&&<Students students={filtered} search={search} setSearch={setSearch} onAdd={openAdd} onEdit={openEdit} onDelete={removeStudent} onView={setSelected}/>}
      {page==="Reports"&&<Reports students={students} male={male} female={female} avg={avg}/>}
      {page==="Settings"&&<Settings settings={settings} setSettings={setSettings} user={user}/>}

      {selected&&<StudentModal student={selected} close={()=>setSelected(null)} edit={()=>{setSelected(null);openEdit(selected)}}/>}
      {showForm&&<StudentForm form={form} setForm={setForm} editing={!!editingId} close={()=>setShowForm(false)} save={saveStudent} loading={loading}/>}
    </main>
  </div>
}

function Auth({mode,setMode,form,setForm,submit,reset,msg,loading}){
 return <div className="auth-page"><div className="auth-card"><div className="auth-logo">SMS</div><p className="eyebrow">STUDENT MANAGEMENT SYSTEM</p><h1>{mode==="login"?"Welcome Back":mode==="register"?"Create Account":"Reset Password"}</h1><p className="muted">{mode==="login"?"Sign in to access the administrator dashboard.":mode==="register"?"Create an administrator account.":"Enter your email to receive a reset link."}</p>{!firebaseConfigured&&firebaseConfigError==="invalid-api-key-format"&&<div className="message" style={{marginTop:14}}>Your Firebase API key in <b>.env</b> looks invalid (should start with <b>AIza</b>, 39 characters, no quotes/spaces). Double-check it in Firebase Console → Project settings → General → Your apps → SDK setup and configuration, then restart <b>npm run dev</b>.</div>}
        {!firebaseConfigured&&firebaseConfigError==="missing-values"&&<div className="message" style={{marginTop:14}}>Firebase is not connected yet. Copy <b>.env.example</b> to <b>.env</b>, add your Firebase Web App values, then restart <b>npm run dev</b>.</div>}
 <form onSubmit={submit}>
 {mode==="register"&&<label>Full Name<input required value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/></label>}
 <label>Email<input required type="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})}/></label>
 {mode!=="forgot"&&<label>Password<input required minLength="6" type="password" value={form.password} onChange={e=>setForm({...form,password:e.target.value})}/></label>}
 {msg&&<div className="message">{msg}</div>}
 {mode==="forgot"?<button type="button" onClick={reset}>Send Reset Email</button>:<button disabled={loading}>{loading?"Please wait...":mode==="login"?"Login":"Register"}</button>}
 </form>
 {mode==="login"&&<button className="link-btn" onClick={()=>setMode("forgot")}>Forgot password?</button>}
 {mode!=="login"&&<button className="link-btn" onClick={()=>setMode("login")}>Back to Login</button>}
 {mode==="login"&&<button className="link-btn" onClick={()=>setMode("register")}>Create an account</button>}
 </div></div>
}

function Dashboard({students,active,avg,onAdd,onPage,onView}){
 return <><section className="stats"><Stat title="Total Students" value={students.length}/><Stat title="Active Students" value={active}/><Stat title="Average GPA" value={avg}/><Stat title="Majors" value={new Set(students.map(s=>s.major)).size}/></section>
 <section className="grid-2"><div className="panel"><Title title="Recent Students" sub="Latest records from Firestore"/><div className="mini-list">{students.slice(0,5).map(s=><button className="mini" key={s.idDoc} onClick={()=>onView(s)}><div className="avatar">{(s.name||"?").charAt(0)}</div><div><b>{s.name}</b><small>{s.studentId} · {s.major}</small></div><span>›</span></button>)}</div>{!students.length&&<div className="empty">No student records yet. Click Add Student.</div>}</div>
 <div className="panel"><Title title="Quick Actions" sub="Common administrator tasks"/><div className="quick-actions"><button onClick={onAdd}>＋ Add Student</button><button onClick={()=>onPage("Students")}>👨‍🎓 Manage Students</button><button onClick={()=>onPage("Reports")}>▥ View Reports</button><button onClick={()=>onPage("Settings")}>⚙ Settings</button></div></div></section>
 <section className="panel"><Title title="System Status" sub="Firebase-connected application"/><div className="info-grid"><Info label="Authentication" value="Firebase Auth" status="Connected"/><Info label="Database" value="Cloud Firestore" status="Connected"/><Info label="Records" value={`${students.length} students`} status="Live"/><Info label="Account" value="Administrator" status="Signed in"/></div></section></>
}

function Students({students,search,setSearch,onAdd,onEdit,onDelete,onView}){
 return <section className="panel"><Title title="Student Records" sub={`${students.length} record(s)`}/><div className="toolbar"><input className="search" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search by ID, name, major, email..."/><button onClick={onAdd}>+ Add Student</button></div><div className="table-wrap"><table><thead><tr><th>ID</th><th>Name</th><th>Gender</th><th>Major</th><th>Year</th><th>GPA</th><th>Status</th><th>Actions</th></tr></thead><tbody>{students.map(s=><tr key={s.idDoc}><td><b>{s.studentId}</b></td><td>{s.name}<small className="table-sub">{s.email}</small></td><td>{s.gender}</td><td>{s.major}</td><td>{s.year}</td><td>{s.gpa}</td><td><span className={`badge ${String(s.status).toLowerCase()}`}>{s.status}</span></td><td><button className="small" onClick={()=>onView(s)}>View</button><button className="small" onClick={()=>onEdit(s)}>Edit</button><button className="small danger" onClick={()=>onDelete(s.idDoc)}>Delete</button></td></tr>)}</tbody></table>{!students.length&&<div className="empty">No students found.</div>}</div></section>
}

function Reports({students,male,female,avg}){
 const total=students.length; const majors=[...new Set(students.map(s=>s.major))];
 function exportCSV(){const h=["Student ID","Name","Gender","Age","Major","Year","Phone","Email","Status","GPA"];const rows=students.map(s=>[s.studentId,s.name,s.gender,s.age,s.major,s.year,s.phone,s.email,s.status,s.gpa].map(v=>JSON.stringify(v??"")).join(","));const blob=new Blob([h.join(",")+"\n"+rows.join("\n")],{type:"text/csv"});const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="student-report.csv";a.click()}
 return <><section className="stats"><Stat title="Total Students" value={total}/><Stat title="Male" value={male}/><Stat title="Female" value={female}/><Stat title="Average GPA" value={avg}/></section><section className="grid-2"><div className="panel"><Title title="Gender Distribution" sub="Current student breakdown"/><Bar label="Male" value={male} total={total}/><Bar label="Female" value={female} total={total}/></div><div className="panel"><Title title="Major Distribution" sub="Students by major"/>{majors.map(m=><Bar key={m} label={m} value={students.filter(s=>s.major===m).length} total={total}/>)}{!majors.length&&<div className="empty">No data.</div>}</div></section><section className="panel"><div className="panel-title"><Title title="Student Report" sub="Export data for Excel"/><button onClick={exportCSV}>⇩ Export CSV</button></div><div className="report-table">{students.map(s=><div className="report-row" key={s.idDoc}><b>{s.studentId}</b><span>{s.name}</span><span>{s.major}</span><span>GPA {s.gpa}</span><span className={`badge ${String(s.status).toLowerCase()}`}>{s.status}</span></div>)}</div></section></>
}

function Settings({settings,setSettings,user}){
 const toggle=k=>setSettings({...settings,[k]:!settings[k]});
 return <section className="settings-grid"><div className="panel"><Title title="System Settings" sub="Application preferences"/><Setting title="Notifications" description="Show system notifications." value={settings.notifications} onChange={()=>toggle("notifications")}/><Setting title="Compact Mode" description="Reduce spacing in tables and panels." value={settings.compact} onChange={()=>toggle("compact")}/><Setting title="Dark Mode" description="Use a darker dashboard interface." value={settings.dark} onChange={()=>toggle("dark")}/></div><div className="panel"><Title title="Administrator Profile" sub="Current Firebase account"/><div className="profile"><div className="avatar big">{(user.displayName||user.email||"A").charAt(0).toUpperCase()}</div><div><h3>{user.displayName||"Administrator"}</h3><p>{user.email}</p><span className="badge active">Authenticated</span></div></div><hr/><div className="info-list"><div><span>User ID</span><b>{user.uid.slice(0,12)}...</b></div><div><span>Access</span><b>Administrator</b></div><div><span>Provider</span><b>Email / Password</b></div></div></div></section>
}

function StudentForm({form,setForm,editing,close,save,loading}){
 return <div className="modal-bg"><form className="modal form-modal" onSubmit={save}><div className="modal-head"><div><p className="eyebrow">{editing?"UPDATE RECORD":"NEW RECORD"}</p><h2>{editing?"Edit Student":"Add Student"}</h2></div><button type="button" className="close" onClick={close}>×</button></div><div className="form-grid">
 {field("Student ID","id",form,setForm,true)}{field("Full Name","name",form,setForm)}
 <label>Gender<select value={form.gender} onChange={e=>setForm({...form,gender:e.target.value})}><option>Male</option><option>Female</option></select></label>{field("Age","age",form,setForm,false,"number")}
 <label>Major<select value={form.major} onChange={e=>setForm({...form,major:e.target.value})}>{["Computer Science","Information Technology","Business","English"].map(x=><option key={x}>{x}</option>)}</select></label>
 <label>Year<select value={form.year} onChange={e=>setForm({...form,year:e.target.value})}>{[1,2,3,4,5,6].map(x=><option key={x}>{x}</option>)}</select></label>
 {field("Phone","phone",form,setForm)}{field("Email","email",form,setForm,false,"email")}
 <label>Status<select value={form.status} onChange={e=>setForm({...form,status:e.target.value})}><option>Active</option><option>Inactive</option></select></label>{field("GPA","gpa",form,setForm,false,"number","0.1","0","4")}
 </div><div className="actions right"><button type="button" className="secondary" onClick={close}>Cancel</button><button disabled={loading}>{loading?"Saving...":editing?"Save Changes":"Add Student"}</button></div></form></div>
}
function field(label,key,form,setForm,disabled=false,type="text",step, min,max){return <label>{label}<input required={!["phone","email","gpa"].includes(key)} disabled={disabled} type={type} step={step} min={min} max={max} value={form[key]} onChange={e=>setForm({...form,[key]:e.target.value})}/></label>}
function StudentModal({student,close,edit}){return <div className="modal-bg" onClick={close}><div className="modal" onClick={e=>e.stopPropagation()}><div className="modal-head"><div><p className="eyebrow">STUDENT DETAILS</p><h2>{student.name}</h2></div><button className="close" onClick={close}>×</button></div><div className="detail-grid">{["studentId","gender","age","major","year","gpa","phone","email","status"].map(k=><Info key={k} label={k==="studentId"?"Student ID":k.charAt(0).toUpperCase()+k.slice(1)} value={student[k]}/>)}</div><div className="actions right"><button className="secondary" onClick={close}>Close</button><button onClick={edit}>Edit Student</button></div></div></div>}
function Stat({title,value}){return <div className="stat"><span>{title}</span><strong>{value}</strong></div>}
function Title({title,sub}){return <div className="panel-title"><div><h2>{title}</h2><p className="muted">{sub}</p></div></div>}
function Info({label,value,status}){return <div className="info"><span>{label}</span><b>{value??"-"}</b>{status&&<small>{status}</small>}</div>}
function Bar({label,value,total}){const p=total?Math.round(value/total*100):0;return <div className="bar-row"><div><span>{label}</span><b>{value} ({p}%)</b></div><div className="bar"><i style={{width:`${p}%`}}/></div></div>}
function Setting({title,description,value,onChange}){return <div className="setting"><div><b>{title}</b><p>{description}</p></div><button className={`switch ${value?"on":""}`} onClick={onChange}><i/></button></div>}
function icon(n){return n==="Dashboard"?"⌂":n==="Students"?"👨‍🎓":n==="Reports"?"▥":"⚙"}

export default App;