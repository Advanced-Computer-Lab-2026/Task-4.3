import React,{useEffect,useMemo,useState} from 'react';

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
const SUGGEST_WINDOW=60; // how many days ahead "Use these dates" searches for a free slot
const fieldIds={roomNumber:'room-input',startDate:'start-input',endDate:'end-input',overlap:'start-input'};

function read(){try{let a=JSON.parse(localStorage.getItem(STORAGE));return Array.isArray(a)?a:seed;}catch{return seed;}}
function addDays(iso,days){const t=new Date(`${iso}T12:00:00Z`);t.setUTCDate(t.getUTCDate()+days);return t.toISOString().slice(0,10);}
function human(iso){return new Date(`${iso}T12:00:00Z`).toLocaleDateString('en-GB',{timeZone:'UTC',day:'numeric',month:'short'});}
function weekDay(iso){return new Date(`${iso}T12:00:00Z`).toLocaleDateString('en-GB',{timeZone:'UTC',weekday:'short'});}
function mondayOf(iso){const d=new Date(`${iso}T12:00:00Z`).getUTCDay();return addDays(iso,-((d+6)%7));}
function dayCount(start,end){return Math.round((new Date(`${end}T12:00:00Z`)-new Date(`${start}T12:00:00Z`))/864e5);}
function daysText(n){return `${n} ${n===1?'day':'days'}`;}
// "9–10 Nov" within one month, "30 Nov – 2 Dec" across months. End is shown as stored (exclusive).
function rangeLabel(start,end){return start.slice(0,7)===end.slice(0,7)?`${Number(start.slice(8))}–${human(end)}`:`${human(start)} – ${human(end)}`;}
function rangeWithDays(start,end){return `${rangeLabel(start,end)} · ${daysText(dayCount(start,end))}`;}
const sameRoom=(a,b)=>a.trim().toLowerCase()===b.trim().toLowerCase();

// Same overlap rule as before: same room (case-insensitive), ranges intersect, the booking being edited is ignored.
function findClash(bookings,room,start,end,id){
 return bookings.filter(b=>b.id!==id&&sameRoom(b.roomNumber,room)&&start<b.endDate&&end>b.startDate).sort((a,b)=>a.startDate.localeCompare(b.startDate))[0];
}
// Dates only: other students' purposes are never shown.
function clashText(b){return b.owner==='you'?`You already have ${b.roomNumber} booked ${rangeLabel(b.startDate,b.endDate)}.`:`${b.roomNumber} is booked ${rangeLabel(b.startDate,b.endDate)}.`;}
function nextFree(bookings,room,start,len,id){
 for(let i=1;i<=SUGGEST_WINDOW;i++){const s=addDays(start,i);if(!findClash(bookings,room,s,addDays(s,len),id))return s;}
 return null;
}
// Validation rules and their order are unchanged; the result now says which field failed and why.
function issue(form,bookings,id){
 const room=form.roomNumber.trim();
 if(!room||!form.startDate||!form.endDate){
  if(!room)return {field:'roomNumber',message:'Complete the room and both dates: enter a room number, e.g. B2-104.'};
  if(!form.startDate)return {field:'startDate',message:'Complete the room and both dates: choose a start date.'};
  return {field:'endDate',message:'Complete the room and both dates: choose an end date.'};
 }
 if(form.endDate<=form.startDate)return {field:'endDate',message:`End date must follow start date. Choose ${human(addDays(form.startDate,1))} or later.`};
 const conflict=findClash(bookings,room,form.startDate,form.endDate,id);
 if(conflict){
  const len=dayCount(form.startDate,form.endDate);
  const s=nextFree(bookings,room,form.startDate,len,id);
  const suggestion=s?{startDate:s,endDate:addDays(s,len)}:null;
  const tail=suggestion?` The room is free for ${daysText(len)} from ${human(s)}.`:` No free ${daysText(len)} found in the next ${SUGGEST_WINDOW} days.`;
  return {field:'overlap',message:clashText(conflict)+tail,conflict,suggestion};
 }
 return null;
}

export default function App(){
 const [bookings,setBookings]=useState(read);
 const [week,setWeek]=useState('2026-11-09');
 const [view,setView]=useState('All rooms');
 const [form,setForm]=useState({...formEmpty});
 const [editing,setEditing]=useState(null);
 const [error,setError]=useState(null);
 const [notice,setNotice]=useState('');
 const [tab,setTab]=useState('Availability');
 const [anchor,setAnchor]=useState(null); // first clicked day of a range: {room,date}
 const [hint,setHint]=useState('');
 const [focusReq,setFocusReq]=useState(null);
 useEffect(()=>localStorage.setItem(STORAGE,JSON.stringify(bookings)),[bookings]);
 useEffect(()=>{if(!focusReq)return;const el=document.getElementById(focusReq.id);if(el){el.focus({preventScroll:true});el.scrollIntoView({behavior:'smooth',block:focusReq.block||'center'});}},[focusReq]);
 const focusOn=(id,block)=>setFocusReq({id,block});
 const days=useMemo(()=>Array.from({length:7},(_,i)=>addDays(week,i)),[week]);
 const myBookings=bookings.filter(b=>b.owner==='you').sort((a,b)=>a.startDate.localeCompare(b.startDate));
 const editRow=editing?bookings.find(b=>b.id===editing):null;
 const editRoom=editRow?rooms.find(r=>sameRoom(r,editRow.roomNumber)):null;
 // While editing, the edited room is pinned to the top so its highlighted days sit next to the form.
 const roomList=view==='All rooms'?(editRoom?[editRoom,...rooms.filter(r=>r!==editRoom)]:rooms):rooms.filter(r=>r===view);
 const hasRange=!!(form.roomNumber.trim()&&form.startDate&&form.endDate&&form.endDate>form.startDate);
 // The booking being edited counts as free, so its own days can be re-selected.
 const occupied=(room,date)=>bookings.find(b=>b.id!==editing&&sameRoom(b.roomNumber,room)&&date>=b.startDate&&date<b.endDate);

 function showError(r){setError(r);focusOn(fieldIds[r.field]);}
 function runCheck(f){setNotice('');setError(null);const r=issue(f,bookings,editing);if(r)showError(r);else setNotice('No conflict detected for the selected dates.');}
 function setField(field,value){
  setForm(f=>({...f,[field]:value}));setNotice('');
  if(field!=='purpose'){setAnchor(null);setHint('');}
  if(error&&(error.field===field||(error.field==='overlap'&&field!=='purpose')))setError(null);
 }
 function pick(room,date){
  setNotice('');setError(null);
  // Second click later in the same row: extend the selection (end date stays exclusive).
  if(anchor&&anchor.room===room&&date>anchor.date){
   const end=addDays(date,1);
   const clash=findClash(bookings,room,anchor.date,end,editing);
   if(clash){setHint(`${clashText(clash)} Your range can't cross it. Pick a last day before it, or start again.`);return;}
   setForm(f=>({...f,roomNumber:room,startDate:anchor.date,endDate:end}));setAnchor(null);setHint('');return;
  }
  const b=occupied(room,date);
  if(b){
   if(b.owner==='you'&&!anchor){edit(b);return;}
   setHint(`${clashText(b)} Pick an open day.`);return;
  }
  if(anchor&&anchor.room===room&&anchor.date===date){setAnchor(null);setHint('');return;}
  // First click: select this single day (same as before) and wait for an optional last day.
  setForm(f=>({...f,roomNumber:room,startDate:date,endDate:addDays(date,1)}));setAnchor({room,date});setHint('');
 }
 function clearSelection(){setForm(f=>({...f,roomNumber:'',startDate:'',endDate:''}));setAnchor(null);setHint('');setError(null);setNotice('');}
 function edit(row){
  if(row.owner!=='you')return;
  setEditing(row.id);setForm({roomNumber:row.roomNumber,startDate:row.startDate,endDate:row.endDate,purpose:row.purpose});setError(null);setNotice('');setAnchor(null);setHint('');
  setTab('Availability');setWeek(mondayOf(row.startDate));
  if(view!=='All rooms'&&view!==row.roomNumber)setView('All rooms');
  focusOn('edit-banner');
 }
 function cancelEdit(){setEditing(null);setForm({...formEmpty});setError(null);setAnchor(null);setHint('');}
 function submit(e){e.preventDefault();setNotice('');const err=issue(form,bookings,editing);if(err){showError(err);return;}const payload={roomNumber:form.roomNumber.trim(),startDate:form.startDate,endDate:form.endDate,purpose:form.purpose.trim(),owner:'you'};
  if(editing){setBookings(bookings.map(b=>b.id===editing?{...b,...payload}:b));setNotice('Booking updated.');}else{setBookings([...bookings,{...payload,id:'b-'+Date.now()}]);setNotice('Room reserved.');}setForm({...formEmpty});setEditing(null);setError(null);setAnchor(null);setHint('');}
 function reset(){setBookings(seed);setForm({...formEmpty});setEditing(null);setWeek('2026-11-09');setNotice('Example bookings restored.');setError(null);setView('All rooms');setAnchor(null);setHint('');setTab('Availability');}
 function check(){runCheck(form);}
 function applySuggestion(){const s=error.suggestion;const f={...form,startDate:s.startDate,endDate:s.endDate};setForm(f);setAnchor(null);setHint('');runCheck(f);focusOn('reserve-button');}
 function openTab(name){setTab(name);focusOn(name==='My bookings'?'my-bookings-title':'calendar-title','start');}

 function cell(room,day){
  const b=occupied(room,day);
  const wasEditing=editRow&&sameRoom(editRow.roomNumber,room)&&day>=editRow.startDate&&day<editRow.endDate;
  const selected=hasRange&&sameRoom(form.roomNumber,room)&&day>=form.startDate&&day<form.endDate;
  const isAnchor=anchor&&anchor.room===room&&anchor.date===day;
  const status=b?(b.owner==='you'?'mine':'booked'):wasEditing?'editing':'open';
  let main,sub,desc;
  if(status==='booked'){main='Booked';sub='Reserved';desc=`booked ${rangeLabel(b.startDate,b.endDate)}, not available`;}
  else if(status==='mine'){main='Your booking';sub='Edit';desc=`your booking ${rangeLabel(b.startDate,b.endDate)}, select to change it`;}
  else if(status==='editing'){main='Editing';sub='Current dates';desc='current dates of the booking you are changing, available';}
  else{main='Open';desc='available';}
  if(selected&&b){main='Clash';sub=status==='mine'?'Your booking':'Booked';desc+=', clashes with your selection';}
  else if(selected){main=isAnchor?'Start':'Selected';sub=isAnchor?'Pick last day':(status==='editing'?'Editing':undefined);desc+=isAnchor?', start of your selection, now select the last day':', selected';}
  const cls=['slot',status,selected&&'selected',selected&&b&&'clash',isAnchor&&'anchor'].filter(Boolean).join(' ');
  return {cls,main,sub,label:`${room}, ${weekDay(day)} ${human(day)}: ${desc}`,selected:!!selected,disabled:status==='booked'};
 }
 const errFor=f=>error&&(error.field===f||(error.field==='overlap'&&(f==='startDate'||f==='endDate')));
 const dateError=error&&error.field!=='roomNumber';

 const selectionBar=<div className={'selection-bar'+(hint?' has-hint':'')} aria-live="polite">
  {hint&&<p className="hint"><strong>!</strong> {hint}</p>}
  {hasRange?<p><span className="sel-label">{editing?'New dates':'Selected'}</span> <strong>{form.roomNumber.trim()} · {rangeWithDays(form.startDate,form.endDate)}</strong>{anchor&&<span className="sel-next"> Click a later day in this row to extend.</span>}</p>
   :<p className="sel-empty">Click an open day to start. Click a later day in the same row to choose a range.</p>}
  {hasRange&&<div className="sel-actions"><button type="button" className="sel-clear" onClick={clearSelection}>Clear</button><button type="button" className="to-form" onClick={()=>focusOn(editing?'edit-banner':'room-input')}>Continue to form ↓</button></div>}
 </div>;

 const calendar=<>
  <div className="calendar-head"><div><span className="eyebrow">AVAILABILITY CALENDAR</span><h2 id="calendar-title" tabIndex={-1}>Rooms by day</h2></div><div className="weeknav"><button aria-label="Previous week" onClick={()=>setWeek(addDays(week,-7))}>←</button><strong>{human(week)} – {human(addDays(week,6))}</strong><button aria-label="Next week" onClick={()=>setWeek(addDays(week,7))}>→</button></div></div>
  <div className="calendar-controls"><label>Location <select value={view} onChange={e=>setView(e.target.value)}><option>All rooms</option>{rooms.map(r=><option key={r}>{r}</option>)}</select></label><span className="legend"><i className="sw-open"/> Available</span><span className="legend"><i className="sw-booked"/> Booked</span><span className="legend"><i className="sw-mine"/> Your booking</span><span className="legend"><i className="sw-selected"/> Selected</span><p>Click a first and a last day to pick a range.</p></div>
  {selectionBar}
  <div className="calendar-scroll"><div className="room-cal"><div className="corner">ROOM / DATE</div>{days.map(d=><div className="dayhead" key={d}><strong>{weekDay(d)}</strong><span>{human(d)}</span></div>)}{roomList.map(room=><React.Fragment key={room}><div className={'roomname'+(room===editRoom?' is-editing':'')}><strong>{room}</strong><small>{room===editRoom?'Editing · pinned to top':`Study room · ${room[0]}`}</small></div>{days.map(day=>{const c=cell(room,day);return <button type="button" key={room+day} title={c.label} aria-label={c.label} aria-pressed={c.selected} aria-disabled={c.disabled||undefined} className={c.cls} onClick={()=>pick(room,day)}><span>{c.main}</span>{c.sub&&<small>{c.sub}</small>}</button>})}</React.Fragment>)}</div></div>
  <p className="calendar-note">Cells show individual dates. End dates are exclusive, so a booking shown as 9–10 Nov is 1 day. A day marked "Open" does not guarantee the full range you choose will be available; ranges that cross a booking are refused.</p>
 </>;

 const myList=<section className="reservations" aria-labelledby="my-bookings-title">
  <div className="reservations-head"><div><span className="eyebrow">MY BOOKINGS</span><h2 id="my-bookings-title" tabIndex={-1}>Your bookings</h2></div><span>{myBookings.length} current records</span></div>
  <p className="reservations-help">Choose Change to edit a booking next to the availability calendar.</p>
  <div className="reservations-list">{myBookings.map(b=><article key={b.id} className={'reservation'+(b.id===editing?' is-editing':'')}><div className="room-chip">{b.roomNumber}</div><div className="reservation-body"><strong>{rangeWithDays(b.startDate,b.endDate)}</strong><small>{b.purpose||'No purpose entered'}</small>{b.id===editing&&<em className="editing-tag">Editing now</em>}</div><button type="button" className="change-button" aria-label={`Change ${b.roomNumber} booking, ${rangeLabel(b.startDate,b.endDate)}`} onClick={()=>edit(b)}>Change</button></article>)}{myBookings.length===0&&<p>No reservations.</p>}</div>
 </section>;

 return <div className="room-app"><header className="topbar"><div className="mark"><span className="mark-sq">R</span><span><strong>room<span>grid</span></strong><small>Campus spaces</small></span></div><nav aria-label="Views"><button className={tab==='Availability'?'selected':''} aria-current={tab==='Availability'?'page':undefined} onClick={()=>openTab('Availability')}>Availability</button><button className={tab==='My bookings'?'selected':''} aria-current={tab==='My bookings'?'page':undefined} onClick={()=>openTab('My bookings')}>My bookings <span className="count">{myBookings.length}</span></button><button onClick={reset}>Reset demo</button></nav><div className="member"><span>Student dashboard</span><div className="profile">YOU</div></div></header>
  <main><section className="intro"><div><span className="eyebrow">SPACES / RESERVATIONS</span><h1>{tab==='My bookings'?'Manage your bookings':'Find room availability'}</h1><p>{tab==='My bookings'?'See every reservation you made and change one in a click.':'Review campus rooms, dates and existing reservations in one view.'}</p></div><div className="intro-summary"><span>ROOMS IN DIRECTORY</span><strong>{rooms.length.toString().padStart(2,'0')}</strong><span>CURRENT RESERVATIONS</span><strong>{bookings.length.toString().padStart(2,'0')}</strong></div></section>
   <div className="pagegrid"><section className="calendar-pane">{tab==='My bookings'?myList:calendar}</section>
    <aside className="booking-pane" id="booking-form"><div className="panel-tag"><span>BOOK A ROOM</span><span>FORM 01</span></div><h2>{editing?'Change reservation':'Make a reservation'}</h2><p className="booking-description">Use this panel to request a room for your study group, meeting or activity.</p>
     <form onSubmit={submit} noValidate>
      {editRow&&<div className="edit-banner" id="edit-banner" tabIndex={-1} role="status"><span>EDITING</span><strong>{editRow.roomNumber} · {rangeWithDays(editRow.startDate,editRow.endDate)}</strong><small>{editRow.purpose||'No purpose entered'}</small></div>}
      <label><span>Room number</span><input id="room-input" list="rooms" placeholder="e.g., B2-104" value={form.roomNumber} aria-invalid={errFor('roomNumber')||undefined} aria-describedby={errFor('roomNumber')?'room-error':undefined} onChange={e=>setField('roomNumber',e.target.value)}/><datalist id="rooms">{rooms.map(r=><option key={r} value={r}/>)}</datalist></label>
      {errFor('roomNumber')&&<p className="field-error" id="room-error" role="alert">{error.message}</p>}
      <div className="date-pair"><label><span>Start date</span><input id="start-input" type="date" value={form.startDate} aria-invalid={errFor('startDate')||undefined} aria-describedby={errFor('startDate')?'dates-error':undefined} onChange={e=>setField('startDate',e.target.value)}/></label><label><span>End date</span><input id="end-input" type="date" value={form.endDate} aria-invalid={errFor('endDate')||undefined} aria-describedby={errFor('endDate')?'dates-error':undefined} onChange={e=>setField('endDate',e.target.value)}/></label></div>
      {dateError&&<div className="field-error" id="dates-error" role="alert"><p>{error.message}</p>{error.suggestion&&<button type="button" className="suggest-button" onClick={applySuggestion}>Use these dates: {rangeWithDays(error.suggestion.startDate,error.suggestion.endDate)}</button>}</div>}
      {hasRange&&!dateError&&<p className="date-summary">{daysText(dayCount(form.startDate,form.endDate))} · the end date is not included.</p>}
      <label><span>Purpose / optional</span><textarea rows="5" placeholder="Meeting, group study..." value={form.purpose} onChange={e=>setField('purpose',e.target.value)}/></label>
      <p className="helper">Start and end dates are required. Reservations cannot overlap existing bookings for the same room.</p>
      {notice&&<div className="success" role="status">{notice}</div>}
      <button className="availability-check" type="button" onClick={check}>Check availability</button><button className="reserve-button" id="reserve-button" type="submit">{editing?'Save booking':'Confirm booking'}</button>{editing&&<button className="cancel-edit" type="button" onClick={cancelEdit}>Cancel editing</button>}
     </form><div className="right-foot"><span>✦</span> Need a room for a group? Find an open date and submit your request.</div></aside></div>
  </main><footer>ROOMGRID / Academic campus demo — local browser data only.</footer>
 </div>;
}
