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
function read(){try{let a=JSON.parse(localStorage.getItem(STORAGE));return Array.isArray(a)?a:seed;}catch{return seed;}}
function addDays(iso,days){const t=new Date(`${iso}T12:00:00Z`);t.setUTCDate(t.getUTCDate()+days);return t.toISOString().slice(0,10);}
function human(iso){return new Date(`${iso}T12:00:00Z`).toLocaleDateString('en-GB',{timeZone:'UTC',day:'numeric',month:'short'});}
function weekDay(iso){return new Date(`${iso}T12:00:00Z`).toLocaleDateString('en-GB',{timeZone:'UTC',weekday:'short'});}
function nights(start,end){return Math.round((new Date(`${end}T12:00:00Z`)-new Date(`${start}T12:00:00Z`))/864e5);}
function span(start,end){const n=nights(start,end);return `${weekDay(start)} ${human(start)} → ${weekDay(end)} ${human(end)} · ${n} night${n===1?'':'s'}`;}
// Weeks in the calendar start on Monday.
function weekStart(iso){const d=new Date(`${iso}T12:00:00Z`).getUTCDay();return addDays(iso,-((d+6)%7));}
function canonicalRoom(text){return rooms.find(r=>r.toLowerCase()===text.trim().toLowerCase());}
function overlapping(bookings,room,start,end,id){return bookings.find(b=>b.id!==id&&b.roomNumber.toLowerCase()===room.toLowerCase()&&start<b.endDate&&end>b.startDate);}
// First later start date where a stay of the same length fits in that room.
function nextFree(bookings,room,start,end,id){const n=nights(start,end);for(let i=1;i<=60;i++){const s=addDays(start,i);if(!overlapping(bookings,room,s,addDays(s,n),id))return {startDate:s,endDate:addDays(s,n)};}return null;}
// Returns null when the form is valid, otherwise the field at fault and a message that says how to fix it.
function issue(form,bookings,id){
 const room=form.roomNumber.trim();
 if(!room)return {field:'roomNumber',message:'Choose a room: type its number or click an open day in the calendar.'};
 const match=canonicalRoom(room);
 if(!match)return {field:'roomNumber',message:`"${room}" is not in the room directory. Pick one from the list, e.g. B2-104.`};
 if(!form.startDate)return {field:'startDate',message:'Add a start date.'};
 if(!form.endDate)return {field:'endDate',message:'Add an end date (the day you leave the room).'};
 if(form.endDate<=form.startDate)return {field:'endDate',message:`End date must be after the start date. For one night, end on ${human(addDays(form.startDate,1))}.`};
 const clash=overlapping(bookings,match,form.startDate,form.endDate,id);
 if(clash)return {field:'startDate',message:`${match} is already reserved ${human(clash.startDate)} → ${human(clash.endDate)}${clash.owner==='you'?' by you':''}, which overlaps your dates.`,suggestion:nextFree(bookings,match,form.startDate,form.endDate,id)};
 return null;
}
export default function App(){
 const [bookings,setBookings]=useState(read);
 const [week,setWeek]=useState('2026-11-09');
 const [view,setView]=useState('All rooms');
 const [form,setForm]=useState({...formEmpty});
 const [editing,setEditing]=useState(null);
 const [showErrors,setShowErrors]=useState(false);
 const [notice,setNotice]=useState('');
 const [anchor,setAnchor]=useState(null);
 const fields={roomNumber:useRef(null),startDate:useRef(null),endDate:useRef(null)};
 useEffect(()=>localStorage.setItem(STORAGE,JSON.stringify(bookings)),[bookings]);
 const days=useMemo(()=>Array.from({length:7},(_,i)=>addDays(week,i)),[week]);
 // Keep the calendar on the week of the dates being booked.
 useEffect(()=>{if(/^\d{4}-\d{2}-\d{2}$/.test(form.startDate)&&!days.includes(form.startDate))setWeek(weekStart(form.startDate));},[form.startDate]);
 const myBookings=bookings.filter(b=>b.owner==='you').sort((a,b)=>a.startDate.localeCompare(b.startDate));
 const editingRow=bookings.find(b=>b.id===editing);
 const roomList=view==='All rooms'?rooms:rooms.filter(r=>r===view);
 const occupied=(room,date)=>bookings.find(b=>b.roomNumber===room&&date>=b.startDate&&date<b.endDate);
 const complete=form.roomNumber.trim()&&form.startDate&&form.endDate;
 const problem=issue(form,bookings,editing);
 const feedback=complete||showErrors?problem:null;
 const selRoom=canonicalRoom(form.roomNumber);
 const inSelection=(room,day)=>room===selRoom&&form.startDate&&form.endDate>form.startDate&&day>=form.startDate&&day<form.endDate;
 const isWide=()=>window.matchMedia('(min-width:1201px)').matches;
 function update(changes){setForm(f=>({...f,...changes}));setNotice('');}
 // First click on an open day starts a one-night selection; a later day in the same row extends it.
 function pick(room,date){
  const b=occupied(room,date);
  if(b&&b.id!==editing){if(b.owner==='you')edit(b);return;}
  setNotice('');
  if(anchor&&anchor.room===room&&date>anchor.date){setForm(f=>({...f,roomNumber:room,startDate:anchor.date,endDate:addDays(date,1)}));setAnchor(null);}
  else{setForm(f=>({...f,roomNumber:room,startDate:date,endDate:addDays(date,1)}));setAnchor({room,date});}
  if(!isWide())document.getElementById('booking-form')?.scrollIntoView({behavior:'smooth',block:'start'});
 }
 function edit(row){
  if(row.owner!=='you')return;
  setEditing(row.id);setForm({roomNumber:row.roomNumber,startDate:row.startDate,endDate:row.endDate,purpose:row.purpose});setShowErrors(false);setNotice('');setAnchor(null);
  setWeek(weekStart(row.startDate));if(view!=='All rooms'&&view!==row.roomNumber)setView(row.roomNumber);
  document.getElementById(isWide()?'calendar':'booking-form')?.scrollIntoView({behavior:'smooth',block:'start'});
  setTimeout(()=>fields.startDate.current?.focus({preventScroll:true}),300);
 }
 function stopEditing(){setEditing(null);setForm({...formEmpty});setShowErrors(false);setAnchor(null);}
 function submit(e){
  e.preventDefault();setNotice('');
  if(problem){setShowErrors(true);fields[problem.field]?.current?.focus();return;}
  const payload={roomNumber:canonicalRoom(form.roomNumber),startDate:form.startDate,endDate:form.endDate,purpose:form.purpose.trim(),owner:'you'};
  const summary=`${payload.roomNumber}, ${span(payload.startDate,payload.endDate)}`;
  if(editing){setBookings(bookings.map(b=>b.id===editing?{...b,...payload}:b));setNotice(`Booking updated: ${summary}.`);}else{setBookings([...bookings,{...payload,id:'b-'+Date.now()}]);setNotice(`Room reserved: ${summary}.`);}
  setForm({...formEmpty});setEditing(null);setShowErrors(false);setAnchor(null);
 }
 function reset(){
  if(!window.confirm('Reset the demo? All bookings you created or changed will be replaced by the example records.'))return;
  setBookings(seed);setForm({...formEmpty});setEditing(null);setWeek('2026-11-09');setNotice('Example bookings restored.');setShowErrors(false);setView('All rooms');setAnchor(null);
 }
 function check(){setShowErrors(true);setNotice('');if(!problem)setNotice('No conflict detected for the selected dates.');}
 const invalid=name=>feedback?.field===name?{'aria-invalid':true,'aria-describedby':'form-feedback'}:{};
 return <div className="room-app"><header className="topbar"><div className="mark"><span className="mark-sq">R</span><span><strong>room<span>grid</span></strong><small>Campus spaces</small></span></div><nav><a href="#calendar">Availability</a><a href="#my-reservations">My bookings <b>{myBookings.length}</b></a></nav><div className="member"><button className="reset-demo" onClick={reset}>Reset demo</button><span>Student dashboard</span><div className="profile">YOU</div></div></header>
  <main><section className="intro"><div><span className="eyebrow">SPACES / RESERVATIONS</span><h1>Find room availability</h1><p>Review campus rooms, dates and existing reservations in one view.</p></div><div className="intro-summary"><span>ROOMS IN DIRECTORY</span><strong>{rooms.length.toString().padStart(2,'0')}</strong><span>CURRENT RESERVATIONS</span><strong>{bookings.length.toString().padStart(2,'0')}</strong></div></section>
   <div className="pagegrid"><section className="calendar-pane" id="calendar"><div className="calendar-head"><div><span className="eyebrow">AVAILABILITY CALENDAR</span><h2>Rooms by day</h2></div><div className="weeknav"><button aria-label="Previous week" onClick={()=>setWeek(addDays(week,-7))}>←</button><strong>{human(week)} – {human(addDays(week,6))}</strong><button aria-label="Next week" onClick={()=>setWeek(addDays(week,7))}>→</button></div></div>
    <div className="calendar-controls"><label>Room <select value={view} onChange={e=>setView(e.target.value)}><option>All rooms</option>{rooms.map(r=><option key={r}>{r}</option>)}</select></label><span className="legend"><i className="free"/> Open</span><span className="legend"><i className="mine"/> Your booking</span><span className="legend"><i className="booked"/> Reserved by others</span><span className="legend"><i className="picked"/> Your selection</span></div>
    <p className="calendar-hint">{anchor?<>Start set to <b>{anchor.room}, {human(anchor.date)}</b>. Click a later open day in the same row to choose your last night, or adjust the dates in the form.</>:<>Click an open day to start a booking, then a later day in the same row to extend it. Click one of your bookings to change it.</>}</p>
    <div className="calendar-scroll"><div className="room-cal"><div className="corner">ROOM / DATE</div>{days.map(d=><div className="dayhead" key={d}><strong>{weekDay(d)}</strong><span>{human(d)}</span></div>)}{roomList.map(room=><React.Fragment key={room}><div className={'roomname'+(room===selRoom?' active':'')}><strong>{room}</strong><small>Study room · {room[0]}</small></div>{days.map(day=>{
     const b=occupied(room,day);const own=b&&b.id===editing;const state=!b||own?'available':b.owner==='you'?'mine':'taken';const sel=inSelection(room,day);const clash=sel&&state!=='available';
     const label=clash?'Conflict':state==='mine'?'Yours':state==='taken'?'Reserved':sel?'Selected':'Open';
     const detail=clash?'':state==='mine'?b.purpose||'Your booking':state==='taken'?'Unavailable':own?'Editing':'';
     return <button key={room+day} disabled={state==='taken'} aria-label={`${room}, ${weekDay(day)} ${human(day)}: ${label}${detail?`, ${detail}`:''}`} title={state==='mine'?'Click to change this booking':state==='taken'?'Reserved by someone else':'Click to select this day'} className={`slot ${state}${sel?' selected':''}${clash?' clash':''}`} onClick={()=>pick(room,day)}><span>{label}</span>{detail&&<small>{detail}</small>}</button>})}</React.Fragment>)}</div></div>
    <p className="calendar-note">Each cell is one night. A booking's end date is the day the room becomes free again, so a 13 → 15 Nov booking covers the nights of 13 and 14 Nov.</p>
    <section id="my-reservations" className="reservations"><div className="reservations-head"><h2>Your bookings</h2><span>{myBookings.length} current records</span></div><div className="reservations-list">{myBookings.map(b=><article key={b.id} className={'reservation'+(b.id===editing?' is-editing':'')}><div className="room-chip">{b.roomNumber}</div><div className="reservation-body"><strong>{span(b.startDate,b.endDate)}</strong><small>{b.purpose||'No purpose entered'}</small></div>{b.id===editing?<span className="editing-tag">Editing</span>:<button onClick={()=>edit(b)} aria-label={`Change booking for ${b.roomNumber}, ${human(b.startDate)}`}>Change</button>}</article>)}{myBookings.length===0&&<p>No reservations.</p>}</div></section></section>
    <aside className="booking-pane" id="booking-form"><div className="panel-tag"><span>BOOK A ROOM</span><span>FORM 01</span></div><h2>{editing?'Change reservation':'Make a reservation'}</h2>{editingRow?<p className="editing-banner">You are editing your booking <b>{editingRow.roomNumber}, {span(editingRow.startDate,editingRow.endDate)}</b>. Saving replaces it.</p>:<p className="booking-description">Use this panel to request a room for your study group, meeting or activity.</p>}{notice&&<div className="success" role="status">{notice}</div>}<form onSubmit={submit} noValidate><label><span>Room number</span><input ref={fields.roomNumber} {...invalid('roomNumber')} list="rooms" placeholder="e.g., B2-104" value={form.roomNumber} onChange={e=>{update({roomNumber:e.target.value});setAnchor(null);}}/><datalist id="rooms">{rooms.map(r=><option key={r} value={r}/>)}</datalist></label><div className="date-pair"><label><span>Start date</span><input ref={fields.startDate} {...invalid('startDate')} type="date" value={form.startDate} onChange={e=>{update({startDate:e.target.value});setAnchor(null);}}/></label><label><span>End date</span><input ref={fields.endDate} {...invalid('endDate')} type="date" min={form.startDate?addDays(form.startDate,1):undefined} value={form.endDate} onChange={e=>{update({endDate:e.target.value});setAnchor(null);}}/></label></div>
     <div id="form-feedback" aria-live="polite">{feedback?<div className="error" role="alert"><strong>{editing?'Can’t save this change.':'Can’t book these dates.'}</strong> {feedback.message}{feedback.suggestion&&<button type="button" className="suggestion" onClick={()=>update(feedback.suggestion)}>Use next free dates: {span(feedback.suggestion.startDate,feedback.suggestion.endDate)}</button>}</div>:complete&&<div className="available-note">✓ {selRoom} is free {span(form.startDate,form.endDate)}.</div>}</div>
     <label><span>Purpose / optional</span><textarea rows="3" placeholder="Meeting, group study..." value={form.purpose} onChange={e=>update({purpose:e.target.value})}/></label><p className="helper">The end date is the day you leave; it must be after the start date. Reservations cannot overlap existing bookings for the same room.</p><button className="availability-check" type="button" onClick={check}>Check availability</button><button className="reserve-button" type="submit">{editing?'Save changes':'Confirm booking'}</button>{editing&&<button className="cancel-edit" type="button" onClick={stopEditing}>Cancel editing (keep original booking)</button>}</form><div className="right-foot"><span>✦</span> Need a room for a group? Find an open date and submit your request.</div></aside></div>
  </main><footer>ROOMGRID / Academic campus demo — local browser data only.</footer>
 </div>;
}
