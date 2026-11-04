import React,{useEffect,useMemo,useRef,useState} from 'react';

const STORAGE='acl-roomgrid-18rooms-v1';
const rooms=['A1-203', 'A2-106', 'A2-107', 'A3-208', 'A3-209', 'B1-205', 'B1-206', 'B1-207', 'B2-104', 'B2-105', 'B3-301', 'C1-102', 'C1-103', 'C2-201', 'C2-202', 'C3-101', 'C3-102', 'D1-101'];
// End dates are exclusive; all sample reservations use non-overlapping date ranges.
const sampleRows=[
 ['A1-203','2026-11-09','2026-11-11','Peer tutoring','other'],
 ['A1-203','2026-11-13','2026-11-15','Architecture workshop','other'],
 ['A1-203','2026-11-17','2026-11-19','Group assignment','you'],
 ['A2-106','2026-11-10','2026-11-13','Seminar preparation','other'],
 ['A2-106','2026-11-16','2026-11-19','Study circle','other'],
 ['A2-107','2026-11-09','2026-11-10','Student club planning','you'],
 ['A2-107','2026-11-12','2026-11-15','Project demo rehearsal','other'],
 ['A2-107','2026-11-16','2026-11-19','Study meeting','other'],
 ['A3-208','2026-11-11','2026-11-14','Presentation practice','other'],
 ['A3-208','2026-11-16','2026-11-18','Tutorial group','other'],
 ['A3-209','2026-11-10','2026-11-12','Study session','other'],
 ['B1-205','2026-11-09','2026-11-11','Meeting','other'],
 ['B1-205','2026-11-13','2026-11-15','Team discussion','other'],
 ['B1-205','2026-11-16','2026-11-18','Course project','other'],
 ['B1-206','2026-11-11','2026-11-13','Exam revision','other'],
 ['B1-206','2026-11-17','2026-11-20','Debate practice','you'],
 ['B1-207','2026-11-10','2026-11-12','Group study','you'],
 ['B1-207','2026-11-16','2026-11-19','Engineering project','other'],
 ['B2-104','2026-11-09','2026-11-11','Weekly study group','you'],
 ['B2-104','2026-11-13','2026-11-15','Team planning','other'],
 ['B2-104','2026-11-17','2026-11-19','Workshop preparation','other'],
 ['B2-105','2026-11-12','2026-11-15','Club meeting','other'],
 ['B2-105','2026-11-16','2026-11-18','Student committee','other'],
 ['B3-301','2026-11-09','2026-11-10','Debate practice','other'],
 ['B3-301','2026-11-11','2026-11-13','Group preparation','other'],
 ['B3-301','2026-11-18','2026-11-20','Portfolio review','other'],
 ['C1-102','2026-11-10','2026-11-14','Capstone meeting','other'],
 ['C1-102','2026-11-16','2026-11-19','Revision session','other'],
 ['C1-103','2026-11-09','2026-11-12','Group project','other'],
 ['C1-103','2026-11-14','2026-11-16','Student society','you'],
 ['C2-201','2026-11-12','2026-11-15','Project sprint','other'],
 ['C2-201','2026-11-16','2026-11-19','Robotics club','other'],
 ['C2-202','2026-11-09','2026-11-11','Lab preparation','other'],
 ['C2-202','2026-11-18','2026-11-20','Teaching assistant session','other'],
 ['C3-101','2026-11-12','2026-11-14','Presentation rehearsal','you'],
 ['C3-101','2026-11-14','2026-11-16','Design workshop','other'],
 ['C3-101','2026-11-18','2026-11-20','Study group','other'],
 ['C3-102','2026-11-11','2026-11-15','Research meeting','other'],
 ['D1-101','2026-11-10','2026-11-13','Team check-in','other'],
 ['D1-101','2026-11-16','2026-11-18','Group assignment','you'],
];
const seed=sampleRows.map(([roomNumber,startDate,endDate,purpose,owner],index)=>({id:`demo-${index+1}`,roomNumber,startDate,endDate,purpose,owner}));
const formEmpty={roomNumber:'',startDate:'',endDate:'',purpose:''};
const FIELD_NAMES={roomNumber:'a room',startDate:'a start date',endDate:'an end date'};

function read(){try{let a=JSON.parse(localStorage.getItem(STORAGE));return Array.isArray(a)?a:seed;}catch{return seed;}}
function addDays(iso,days){const t=new Date(`${iso}T12:00:00Z`);t.setUTCDate(t.getUTCDate()+days);return t.toISOString().slice(0,10);}
function daysBetween(a,b){return Math.round((new Date(`${b}T12:00:00Z`)-new Date(`${a}T12:00:00Z`))/864e5);}
function mondayOf(iso){const d=new Date(`${iso}T12:00:00Z`).getUTCDay();return addDays(iso,-((d+6)%7));}
function human(iso){return new Date(`${iso}T12:00:00Z`).toLocaleDateString('en-GB',{timeZone:'UTC',day:'numeric',month:'short'});}
function weekDay(iso){return new Date(`${iso}T12:00:00Z`).toLocaleDateString('en-GB',{timeZone:'UTC',weekday:'short'});}
function full(iso){return `${weekDay(iso)} ${human(iso)}`;}
// Stored end dates are exclusive, so the last day actually used is end - 1.
function rangeLabel(start,end){const last=addDays(end,-1);return last===start?full(start):`${full(start)} – ${full(last)}`;}
function dayCount(start,end){const n=daysBetween(start,end);return `${n} day${n===1?'':'s'}`;}
const sameRoom=(a,b)=>a.trim().toLowerCase()===b.trim().toLowerCase();
const overlaps=(b,room,start,end,id)=>b.id!==id&&sameRoom(b.roomNumber,room)&&start<b.endDate&&end>b.startDate;

// Same rules as before, but returns WHICH rule failed, which fields, and the clashing bookings.
function validate(form,bookings,id){
 const room=form.roomNumber.trim();
 const missing=['roomNumber','startDate','endDate'].filter(k=>!String(form[k]).trim());
 if(missing.length)return {message:`Add ${missing.map(k=>FIELD_NAMES[k]).join(' and ')} to continue.`,fields:missing,conflicts:[]};
 if(form.endDate<=form.startDate)return {message:'End date must be after the start date. For a one-day booking, set the end date to the following day.',fields:['endDate'],conflicts:[]};
 const conflicts=bookings.filter(b=>overlaps(b,room,form.startDate,form.endDate,id)).sort((a,b)=>a.startDate.localeCompare(b.startDate));
 if(conflicts.length){
  const clash=conflicts.map(b=>rangeLabel(b.startDate>form.startDate?b.startDate:form.startDate,b.endDate<form.endDate?b.endDate:form.endDate)).join(', ');
  return {message:`${room} is already booked on ${clash}.`,fields:['startDate','endDate'],conflicts};
 }
 return null;
}
export default function App(){
 const [bookings,setBookings]=useState(read);
 const [week,setWeek]=useState('2026-11-09');
 const [view,setView]=useState('All rooms');
 const [form,setForm]=useState({...formEmpty});
 const [editing,setEditing]=useState(null);
 const [showErrors,setShowErrors]=useState(false); // replaces the old `error` string
 const [notice,setNotice]=useState('');
 const [tab,setTab]=useState('Availability');
 const [anchor,setAnchor]=useState(null);          // first click of a range selection
 const formRef=useRef(null);
 useEffect(()=>localStorage.setItem(STORAGE,JSON.stringify(bookings)),[bookings]);

 const days=useMemo(()=>Array.from({length:7},(_,i)=>addDays(week,i)),[week]);
 const myBookings=bookings.filter(b=>b.owner==='you').sort((a,b)=>a.startDate.localeCompare(b.startDate));
 const roomList=view==='All rooms'?rooms:rooms.filter(r=>r===view);
 const editingRow=bookings.find(b=>b.id===editing);
 const result=validate(form,bookings,editing);                         // re-checked on every render
 const error=showErrors?result:null;                                   // only shown after a submit/check
 const liveConflict=result&&result.conflicts.length?result:null;       // conflicts are shown immediately
 const hasRange=form.startDate&&form.endDate&&form.endDate>form.startDate;
 const occupied=(room,date)=>bookings.find(b=>b.roomNumber===room&&date>=b.startDate&&date<b.endDate);
 const inSelection=(room,date)=>form.roomNumber&&sameRoom(room,form.roomNumber)&&hasRange&&date>=form.startDate&&date<form.endDate;
 const bad=f=>error&&error.fields.includes(f);

 
 function focusForm(){formRef.current?.scrollIntoView({behavior:'smooth',block:'nearest'});}
 function update(field,value){setForm(f=>({...f,[field]:value}));setNotice('');}
 // Click 1 sets a one-day booking; any later day in the same row extends (or shrinks) it from that start.
 function pick(room,date){
  setNotice('');setShowErrors(false);
  if(anchor&&anchor.room===room&&date>anchor.date){setForm(f=>({...f,roomNumber:room,startDate:anchor.date,endDate:addDays(date,1)}));}
  else{setForm(f=>({...f,roomNumber:room,startDate:date,endDate:addDays(date,1),purpose:editing?f.purpose:''}));setAnchor({room,date});}
  focusForm();
 }
 function edit(row){
  if(row.owner!=='you')return;
  setEditing(row.id);setForm({roomNumber:row.roomNumber,startDate:row.startDate,endDate:row.endDate,purpose:row.purpose});
  setShowErrors(false);setNotice('');setAnchor(null);setWeek(mondayOf(row.startDate));setView('All rooms');
  setTimeout(focusForm,0);
 }
 function cancelEdit(){setEditing(null);setForm({...formEmpty});setShowErrors(false);setAnchor(null);}
 function submit(e){
  e.preventDefault();setNotice('');
  if(result){setShowErrors(true);return;}
  const payload={roomNumber:form.roomNumber.trim(),startDate:form.startDate,endDate:form.endDate,purpose:form.purpose.trim(),owner:'you'};
  const summary=`${payload.roomNumber}, ${rangeLabel(payload.startDate,payload.endDate)}`;
  if(editing){setBookings(bookings.map(b=>b.id===editing?{...b,...payload}:b));setNotice(`Booking updated: ${summary}.`);}
  else{setBookings([...bookings,{...payload,id:'b-'+Date.now()}]);setNotice(`Room reserved: ${summary}.`);}
  setForm({...formEmpty});setEditing(null);setShowErrors(false);setAnchor(null);
 }
 function reset(){setBookings(seed);setForm({...formEmpty});setEditing(null);setWeek('2026-11-09');setNotice('Example bookings restored.');setShowErrors(false);setView('All rooms');setAnchor(null);}
 function check(){setNotice('');if(result){setShowErrors(true);}else{setShowErrors(false);setNotice(`${form.roomNumber.trim()} is free for ${dayCount(form.startDate,form.endDate)}: ${rangeLabel(form.startDate,form.endDate)}.`);}}


 
 const calendar=<>
  <div className="calendar-head"><div><span className="eyebrow">AVAILABILITY CALENDAR</span><h2>Rooms by day</h2></div><div className="weeknav"><button aria-label="Previous week" onClick={()=>setWeek(addDays(week,-7))}>←</button><strong>{human(week)} – {human(addDays(week,6))}</strong><button aria-label="Next week" onClick={()=>setWeek(addDays(week,7))}>→</button></div></div>
  <div className="calendar-controls"><label>Location <select value={view} onChange={e=>setView(e.target.value)}><option>All rooms</option>{rooms.map(r=><option key={r}>{r}</option>)}</select></label><span className="legend"><i className="free"/> Available</span><span className="legend"><i className="booked"/> Reserved</span><span className="legend"><i className="mine"/> Yours</span><span className="legend"><i className="sel"/> Your selection</span><p>Click a day to start, then later days in the same row to set the last day. Click an earlier day or another room to start over.</p></div>
  {anchor&&<div className="range-hint" role="status">Start set to <strong>{full(anchor.date)}</strong> in {anchor.room}. Click a later day in that row to extend, or use the form.</div>}
  <div className="calendar-scroll"><div className="room-cal"><div className="corner">ROOM / DATE</div>{days.map(d=><div className="dayhead" key={d}><strong>{weekDay(d)}</strong><span>{human(d)}</span></div>)}
   {roomList.map(room=><React.Fragment key={room}><div className="roomname"><strong>{room}</strong><small>Study room · {room[0]}</small></div>{days.map(day=>{
    const b=occupied(room,day);const sel=inSelection(room,day);const own=b&&b.id===editing;
    const blocked=b&&!own;const clash=sel&&blocked;
    const cls=['slot',own?'current':b?(b.owner==='you'?'mine':'taken'):'available',sel&&'selected',clash&&'clash'].filter(Boolean).join(' ');
    const label=clash?'Conflict':own?'Moving':sel?'Selected':b?(b.owner==='you'?'Yours':'Booked'):'Open';
    const sub=clash?'Already booked':own?'Current dates':b?(b.owner==='you'?'Click to change':'Not available'):'';
    if(blocked&&b.owner!=='you')return <div key={room+day} className={cls} title={`${room}, ${full(day)}: reserved`}><span>{label}</span>{sub&&<small>{sub}</small>}</div>;
    return <button key={room+day} className={cls} title={`${room}, ${full(day)}: ${b?(own?'your current dates':'your booking – click to change'):'available – click to select'}`} onClick={()=>blocked?edit(b):pick(room,day)}><span>{label}</span>{sub&&<small>{sub}</small>}</button>;
   })}</React.Fragment>)}</div></div>
 </>;

 
 const list=<section id="my-reservations" className="reservations"><div className="reservations-head"><h2>Your bookings</h2><span>{myBookings.length} current records</span></div><div className="reservations-list">{myBookings.map(b=><article key={b.id} className={'reservation'+(b.id===editing?' is-editing':'')}><div className="room-chip">{b.roomNumber}</div><div className="reservation-body"><strong>{rangeLabel(b.startDate,b.endDate)}</strong><small>{dayCount(b.startDate,b.endDate)} · {b.purpose||'No purpose entered'}</small></div>{b.id===editing?<span className="editing-tag">Editing</span>:<button onClick={()=>edit(b)}>Change</button>}</article>)}{myBookings.length===0&&<p>No reservations.</p>}</div></section>;

 
 return <div className="room-app"><header className="topbar"><div className="mark"><span className="mark-sq">R</span><span><strong>room<span>grid</span></strong><small>Campus spaces</small></span></div>
  <nav><button className={tab==='Availability'?'selected':''} onClick={()=>setTab('Availability')}>Availability</button><button className={tab==='My bookings'?'selected':''} onClick={()=>setTab('My bookings')}>My bookings</button><button onClick={reset}>Reset demo</button></nav>
  <div className="member"><span>Student dashboard</span><div className="profile">YOU</div></div></header>
  <main><section className="intro"><div><span className="eyebrow">SPACES / RESERVATIONS</span><h1>{tab==='Availability'?'Find room availability':'Your bookings'}</h1><p>{tab==='Availability'?'Review campus rooms, dates and existing reservations in one view.':'Change the room, dates or purpose of your reservations.'}</p></div><div className="intro-summary"><span>ROOMS IN DIRECTORY</span><strong>{rooms.length.toString().padStart(2,'0')}</strong><span>CURRENT RESERVATIONS</span><strong>{bookings.length.toString().padStart(2,'0')}</strong></div></section>
   <div className="pagegrid"><section className="calendar-pane">{tab==='Availability'?calendar:list}</section>
    <aside className={'booking-pane'+(editing?' editing':'')} id="booking-form" ref={formRef}><div className="panel-tag"><span>{editing?'CHANGE BOOKING':'BOOK A ROOM'}</span><span>FORM 01</span></div><h2>{editing?'Change reservation':'Make a reservation'}</h2>
     {editingRow?<div className="edit-banner">Editing <strong>{editingRow.roomNumber}</strong>, {rangeLabel(editingRow.startDate,editingRow.endDate)}. Pick new days in the calendar or edit the fields below.</div>:<p className="booking-description">Use this panel to request a room for your study group, meeting or activity.</p>}
     {notice&&<div className="success" role="status">{notice}</div>}
     {error&&!error.conflicts.length&&<div className="error" role="alert">{error.message}</div>}
     <form onSubmit={submit} noValidate>
      <label><span>Room number</span><input list="rooms" placeholder="e.g., B2-104" aria-invalid={bad('roomNumber')||undefined} className={bad('roomNumber')?'invalid':''} value={form.roomNumber} onChange={e=>update('roomNumber',e.target.value)}/><datalist id="rooms">{rooms.map(r=><option key={r} value={r}/>)}</datalist></label>
      <div className="date-pair"><label><span>Start date</span><input type="date" aria-invalid={bad('startDate')||undefined} className={bad('startDate')||liveConflict?'invalid':''} value={form.startDate} onChange={e=>update('startDate',e.target.value)}/></label><label><span>End date</span><input type="date" min={form.startDate?addDays(form.startDate,1):undefined} aria-invalid={bad('endDate')||undefined} className={bad('endDate')||liveConflict?'invalid':''} value={form.endDate} onChange={e=>update('endDate',e.target.value)}/></label></div>
      <p className="helper">Start and end dates are required. Reservations cannot overlap existing bookings for the same room. The end date is when the room is handed back, so it isn't included: 9 → 10 Nov books 9 Nov only.</p>
      {hasRange&&!liveConflict&&form.roomNumber.trim()&&<div className="summary">You'll have <strong>{form.roomNumber.trim()}</strong> for <strong>{dayCount(form.startDate,form.endDate)}</strong>: {rangeLabel(form.startDate,form.endDate)}.</div>}
      {liveConflict&&<div className={'conflict'+(showErrors?' loud':'')} role="alert"><strong>{showErrors?"Couldn't save: ":''}{liveConflict.message}</strong> Pick other days or another room.</div>}
      <label><span>Purpose / optional</span><textarea rows="5" placeholder="Meeting, group study..." value={form.purpose} onChange={e=>update('purpose',e.target.value)}/></label>
      <button className="availability-check" type="button" onClick={check}>Check availability</button>
      <button className="reserve-button" type="submit">{editing?'Save booking':'Confirm booking'}</button>
      {editing&&<button className="cancel-edit" type="button" onClick={cancelEdit}>Cancel editing</button>}
      {!editing&&(form.roomNumber||form.startDate||form.endDate)&&<button className="cancel-edit" type="button" onClick={cancelEdit}>Clear selection</button>}
     </form><div className="right-foot"><span>✦</span> Need a room for a group? Find an open date and submit your request.</div></aside></div>
  </main><footer>ROOMGRID / Academic campus demo — local browser data only.</footer>
 </div>;
}