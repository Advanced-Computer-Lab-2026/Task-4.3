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
function read(){try{let a=JSON.parse(localStorage.getItem(STORAGE));return Array.isArray(a)?a:seed;}catch{return seed;}}
function addDays(iso,days){const t=new Date(`${iso}T12:00:00Z`);t.setUTCDate(t.getUTCDate()+days);return t.toISOString().slice(0,10);}
function human(iso){return new Date(`${iso}T12:00:00Z`).toLocaleDateString('en-GB',{timeZone:'UTC',day:'numeric',month:'short'});}
function weekDay(iso){return new Date(`${iso}T12:00:00Z`).toLocaleDateString('en-GB',{timeZone:'UTC',weekday:'short'});}
// Number of booked days. End date is exclusive (the day the room is free again).
function dayCount(start,end){return Math.round((new Date(`${end}T12:00:00Z`)-new Date(`${start}T12:00:00Z`))/86400000);}
// Human-readable span that shows the days actually occupied, e.g. "Mon 9 Nov · 1 day".
function spanText(start,end){const n=dayCount(start,end);const last=addDays(end,-1);
 return n===1?`${weekDay(start)} ${human(start)} · 1 day`:`${weekDay(start)} ${human(start)} – ${weekDay(last)} ${human(last)} · ${n} days`;}
function findConflict(form,bookings,id){return bookings.find(b=>b.id!==id&&b.roomNumber.toLowerCase()===form.roomNumber.trim().toLowerCase()&&form.startDate<b.endDate&&form.endDate>b.startDate);}
// Same rules as before; now also says which field is wrong and which booking is in the way.
function issue(form,bookings,id){
 const missing=[];if(!form.roomNumber.trim())missing.push('room');if(!form.startDate)missing.push('start');if(!form.endDate)missing.push('end');
 if(missing.length){const names={room:'a room number',start:'a start date',end:'an end date'};return {msg:`Add ${missing.map(m=>names[m]).join(' and ')}.`,fields:missing};}
 if(form.endDate<=form.startDate)return {msg:'End date must be after the start date. The end date is the day the room becomes free again, so a 1-day booking on 9 Nov ends on 10 Nov.',fields:['end']};
 const c=findConflict(form,bookings,id);
 if(c)return {msg:`${c.roomNumber} is already ${c.owner==='you'?'booked by you':'reserved'} on ${spanText(c.startDate,c.endDate)}. Choose dates that end by ${human(c.startDate)} or start on ${human(c.endDate)} or later.`,fields:['start','end']};
 return null;
}
export default function App(){
 const [bookings,setBookings]=useState(read);
 const [week,setWeek]=useState('2026-11-09');
 const [view,setView]=useState('All rooms');
 const [form,setForm]=useState({...formEmpty});
 const [editing,setEditing]=useState(null);
 const [feedback,setFeedback]=useState(null); // {type:'error'|'success'|'info', text}
 const [badFields,setBadFields]=useState([]);
 const [tab,setTab]=useState('Availability');
 useEffect(()=>localStorage.setItem(STORAGE,JSON.stringify(bookings)),[bookings]);
 const days=useMemo(()=>Array.from({length:7},(_,i)=>addDays(week,i)),[week]);
 const myBookings=bookings.filter(b=>b.owner==='you').sort((a,b)=>a.startDate.localeCompare(b.startDate));
 const roomList=view==='All rooms'?rooms:rooms.filter(r=>r===view);
 const occupied=(room,date)=>bookings.find(b=>b.roomNumber===room&&date>=b.startDate&&date<b.endDate);
 const editingRow=bookings.find(b=>b.id===editing);
 const rangeValid=form.startDate&&form.endDate&&form.endDate>form.startDate;
 const inSelection=(room,day)=>rangeValid&&form.roomNumber.trim().toLowerCase()===room.toLowerCase()&&day>=form.startDate&&day<form.endDate;
 function setField(key,value){setForm(f=>({...f,[key]:value}));if(key!=='purpose')setFeedback(null);setBadFields(fs=>fs.filter(x=>x!==key&&!(key==='roomNumber'&&x==='room')&&!(key==='startDate'&&x==='start')&&!(key==='endDate'&&x==='end')));}
 function showForm(){const pane=document.getElementById('booking-form');pane?.scrollIntoView({behavior:'smooth',block:'nearest'});document.getElementById('room-input')?.focus({preventScroll:true});}
 function pick(room,date){
  const b=occupied(room,date);
  if(b&&b.owner==='you'){edit(b);return;}
  if(editing&&editingRow){ // moving your own booking: keep its length
   const len=dayCount(editingRow.startDate,editingRow.endDate);
   setForm(f=>({...f,roomNumber:room,startDate:date,endDate:addDays(date,len)}));setBadFields([]);setFeedback({type:'info',text:`Moved to ${room}, ${spanText(date,addDays(date,len))}. Press Save changes to keep it.`});showForm();return;}
  setForm({roomNumber:room,startDate:date,endDate:addDays(date,1),purpose:''});setEditing(null);setBadFields([]);setFeedback(null);showForm();
 }
 function edit(row){if(row.owner!=='you')return;setEditing(row.id);setForm({roomNumber:row.roomNumber,startDate:row.startDate,endDate:row.endDate,purpose:row.purpose});setBadFields([]);setFeedback(null);showForm();}
 function cancelEdit(){setEditing(null);setForm({...formEmpty});setBadFields([]);setFeedback(null);}
 function submit(e){e.preventDefault();const err=issue(form,bookings,editing);
  if(err){setFeedback({type:'error',text:`Not saved. ${err.msg}`});setBadFields(err.fields);return;}
  const payload={roomNumber:form.roomNumber.trim(),startDate:form.startDate,endDate:form.endDate,purpose:form.purpose.trim(),owner:'you'};
  const summary=`${payload.roomNumber}, ${spanText(payload.startDate,payload.endDate)}`;
  if(editing){setBookings(bookings.map(b=>b.id===editing?{...b,...payload}:b));setFeedback({type:'success',text:`Booking updated: ${summary}.`});}
  else{setBookings([...bookings,{...payload,id:'b-'+Date.now()}]);setFeedback({type:'success',text:`Room reserved: ${summary}. It is now listed under Your bookings.`});}
  setForm({...formEmpty});setEditing(null);setBadFields([]);}
 function reset(){setBookings(seed);setForm({...formEmpty});setEditing(null);setWeek('2026-11-09');setFeedback({type:'success',text:'Example bookings restored.'});setBadFields([]);setView('All rooms');}
 function check(){const e=issue(form,bookings,editing);if(e){setFeedback({type:'error',text:e.msg});setBadFields(e.fields);}else{setBadFields([]);setFeedback({type:'success',text:`${form.roomNumber.trim()} is free for ${spanText(form.startDate,form.endDate)}.`});}}
 const bad=f=>badFields.includes(f)?'invalid':'';
 return <div className="room-app"><header className="topbar"><div className="mark"><span className="mark-sq">R</span><span><strong>room<span>grid</span></strong><small>Campus spaces</small></span></div><nav><button className={tab==='Availability'?'selected':''} onClick={()=>setTab('Availability')}>Availability</button><button className={tab==='My bookings'?'selected':''} onClick={()=>{setTab('My bookings');document.getElementById('my-reservations')?.scrollIntoView({behavior:'smooth'});}}>My bookings</button><button onClick={reset}>Reset demo</button></nav><div className="member"><span>Student dashboard</span><div className="profile">YOU</div></div></header>
  <main><section className="intro"><div><span className="eyebrow">SPACES / RESERVATIONS</span><h1>Find room availability</h1><p>Review campus rooms, dates and existing reservations in one view.</p></div><div className="intro-summary"><span>ROOMS IN DIRECTORY</span><strong>{rooms.length.toString().padStart(2,'0')}</strong><span>CURRENT RESERVATIONS</span><strong>{bookings.length.toString().padStart(2,'0')}</strong></div></section>
   <div className="pagegrid"><section className="calendar-pane"><div className="calendar-head"><div><span className="eyebrow">AVAILABILITY CALENDAR</span><h2>Rooms by day</h2></div><div className="weeknav"><button aria-label="Previous week" onClick={()=>setWeek(addDays(week,-7))}>←</button><strong>{human(week)} – {human(addDays(week,6))}</strong><button aria-label="Next week" onClick={()=>setWeek(addDays(week,7))}>→</button></div></div>
    <div className="calendar-controls"><label>Location <select value={view} onChange={e=>setView(e.target.value)}><option>All rooms</option>{rooms.map(r=><option key={r}>{r}</option>)}</select></label><span className="legend"><i className="booked"/> Reserved</span><span className="legend"><i className="mine"/> Your booking</span><span className="legend"><i className="free"/> Available</span><span className="legend"><i className="picked"/> Your selection</span><p>Click an open day to start a booking, or one of your bookings to change it. Other reservations can't be selected.</p></div>
    <div className="calendar-scroll"><div className="room-cal"><div className="corner">ROOM / DATE</div>{days.map(d=><div className="dayhead" key={d}><strong>{weekDay(d)}</strong><span>{human(d)}</span></div>)}{roomList.map((room,i)=><React.Fragment key={room}><div className="roomname"><strong>{room}</strong><small>Study room · {room[0]}</small></div>{days.map(day=>{const b=occupied(room,day);const mine=b&&b.owner==='you';const sel=inSelection(room,day);const clash=sel&&b&&b.id!==editing;
     if(b&&!mine)return <div key={room+day} className={'slot taken locked'+(clash?' clash picked':'')} title={`${room}, ${day}: Reserved by another student`} aria-label={`${room}, ${weekDay(day)} ${human(day)}: reserved by another student`}><span>Booked</span><small>Reserved</small>{clash&&<small className="clash-tag">Conflict</small>}</div>;
     return <button key={room+day} title={`${room}, ${day}: ${b?(mine?'Your booking – click to change':'Reserved'):'Available'}`} className={'slot '+(b?'taken':'available')+(mine?' mine':'')+(sel?' picked':'')+(clash?' clash':'')} onClick={()=>pick(room,day)}><span>{b?'Booked':'Open'}</span>{b&&<small>{mine?'Your booking':'Reserved'}</small>}{clash&&<small className="clash-tag">Conflict</small>}</button>})}</React.Fragment>)}</div></div>
    <p className="calendar-note">Cells show individual dates. Reservations may span several dates; a day marked "Open" does not guarantee the full range you choose will be available. Your selected range is outlined in the grid, and any conflicting day is marked.</p>
    <section id="my-reservations" className="reservations"><div className="reservations-head"><h2>Your bookings</h2><span>{myBookings.length} current records</span></div><div className="reservations-list">{myBookings.map(b=><article key={b.id} className={'reservation'+(b.id===editing?' is-editing':'')}><div className="room-chip">{b.roomNumber}</div><div className="reservation-body"><strong>{spanText(b.startDate,b.endDate)}</strong><small>{b.purpose||'No purpose entered'}</small></div><button onClick={()=>edit(b)}>{b.id===editing?'Editing…':'Change'}</button></article>)}{myBookings.length===0&&<p>No reservations.</p>}</div></section></section>
    <aside className={'booking-pane'+(editing?' editing':'')} id="booking-form"><div className="panel-tag"><span>{editing?'CHANGE A BOOKING':'BOOK A ROOM'}</span><span>FORM 01</span></div><h2>{editing?'Change reservation':'Make a reservation'}</h2>
     {editingRow?<div className="edit-banner">You are changing <strong>{editingRow.roomNumber}</strong>, {spanText(editingRow.startDate,editingRow.endDate)}. Edit the fields or click a new day in the grid.</div>:<p className="booking-description">Use this panel to request a room for your study group, meeting or activity.</p>}
     <form onSubmit={submit} noValidate><label><span>Room number</span><input id="room-input" className={bad('room')} aria-invalid={!!bad('room')} list="rooms" placeholder="e.g., B2-104" value={form.roomNumber} onChange={e=>setField('roomNumber',e.target.value)}/><datalist id="rooms">{rooms.map(r=><option key={r} value={r}/>)}</datalist></label><div className="date-pair"><label><span>Start date</span><input type="date" className={bad('start')} aria-invalid={!!bad('start')} value={form.startDate} onChange={e=>setField('startDate',e.target.value)}/></label><label><span>End date <em>free again this day</em></span><input type="date" className={bad('end')} aria-invalid={!!bad('end')} value={form.endDate} onChange={e=>setField('endDate',e.target.value)}/></label></div>
      <p className="range-summary" aria-live="polite">{rangeValid?<>Books <strong>{form.roomNumber.trim()||'a room'}</strong> for <strong>{spanText(form.startDate,form.endDate)}</strong></>:'Pick a start and end date to see which days you will book.'}</p>
      <label><span>Purpose / optional</span><textarea rows="5" placeholder="Meeting, group study..." value={form.purpose} onChange={e=>setField('purpose',e.target.value)}/></label><p className="helper">Start and end dates are required. Reservations cannot overlap existing bookings for the same room.</p>
      {feedback&&<div className={feedback.type} role={feedback.type==='error'?'alert':'status'}>{feedback.text}</div>}
      <button className="availability-check" type="button" onClick={check}>Check availability</button><button className="reserve-button" type="submit">{editing?'Save changes':'Confirm booking'}</button>{editing&&<button className="cancel-edit" type="button" onClick={cancelEdit}>Cancel editing</button>}</form><div className="right-foot"><span>✦</span> Need a room for a group? Find an open date and submit your request.</div></aside></div>
  </main><footer>ROOMGRID / Academic campus demo — local browser data only.</footer>
 </div>;
}