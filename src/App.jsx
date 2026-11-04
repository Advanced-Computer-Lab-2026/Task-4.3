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
const norm=t=>t.toLowerCase().replace(/[^a-z0-9]/g,'');
function validate(form,bookings,id){
 const e={};const room=form.roomNumber.trim();const {startDate:start,endDate:end}=form;
 const known=rooms.find(r=>r.toLowerCase()===room.toLowerCase());
 if(!room)e.room='Enter a room number, e.g. B2-104.';
 else if(!known){const m=rooms.find(r=>norm(r)===norm(room));e.room=m?`"${room}" is not in the directory. Did you mean ${m}?`:`"${room}" is not in the room directory. Choose one of the ${rooms.length} listed rooms.`;}
 if(!start)e.start='Choose a start date.';
 if(!end)e.end='Choose an end date.';
 if(start&&end&&end<=start)e.end=`End date (${human(end)}) must be after the start date (${human(start)}).`;
 if(known&&start&&end&&end>start){
  const clash=bookings.filter(b=>b.id!==id&&b.roomNumber===known&&start<b.endDate&&end>b.startDate).sort((x,y)=>x.startDate.localeCompare(y.startDate));
  if(clash.length){
   const c=clash[0];const free=(x,y)=>!bookings.some(b=>b.id!==id&&b.roomNumber===known&&x<b.endDate&&y>b.startDate);const len=Math.round((new Date(end)-new Date(start))/864e5);let d=start;for(let i=0;i<120&&!free(d,addDays(d,len));i++)d=addDays(d,1);
   e.range=`${known} is already booked ${human(c.startDate)} – ${human(c.endDate)}${c.purpose?` (${c.purpose})`:''}${c.owner==='you'?', by you':''}${clash.length>1?` and ${clash.length-1} more overlapping booking${clash.length>2?'s':''}`:''}. Next free ${len} night${len>1?'s':''}: ${human(d)} – ${human(addDays(d,len))}.`;
  }
 }
 return {errs:e,room:known||room};
}
export default function App(){
 const [bookings,setBookings]=useState(read);
 const [week,setWeek]=useState('2026-11-09');
 const [view,setView]=useState('All rooms');
 const [form,setForm]=useState({...formEmpty});
 const [editing,setEditing]=useState(null);
 const [errors,setErrors]=useState({});
 const [anchor,setAnchor]=useState(null);
 const [confirmId,setConfirmId]=useState(null);
 const [notice,setNotice]=useState('');
 const [tab,setTab]=useState('Availability');
 useEffect(()=>localStorage.setItem(STORAGE,JSON.stringify(bookings)),[bookings]);
 useEffect(()=>{if(!confirmId)return;const k=e=>{if(e.key==='Escape')setConfirmId(null)};window.addEventListener('keydown',k);return()=>window.removeEventListener('keydown',k);},[confirmId]);
 const days=useMemo(()=>Array.from({length:7},(_,i)=>addDays(week,i)),[week]);
 const myBookings=bookings.filter(b=>b.owner==='you').sort((a,b)=>a.startDate.localeCompare(b.startDate));
 const roomList=view==='All rooms'?rooms:rooms.filter(r=>r===view);
 const occupied=(room,date)=>bookings.find(b=>b.roomNumber===room&&date>=b.startDate&&date<b.endDate);
 function scrollToForm(){if(window.innerWidth<=1200)document.getElementById('booking-form')?.scrollIntoView({behavior:'smooth',block:'start'});}
 const selected=(room,date)=>form.startDate&&form.endDate&&form.endDate>form.startDate&&form.roomNumber.trim().toLowerCase()===room.toLowerCase()&&date>=form.startDate&&date<form.endDate;
 function pick(room,date){
  setNotice('');
  if(anchor&&anchor.room===room){
   const a=anchor.date<=date?anchor.date:date,z=anchor.date<=date?date:anchor.date;
   for(let d=a;d<=z;d=addDays(d,1)){if(occupied(room,d)){setErrors({range:`${room} is reserved on ${weekDay(d)} ${human(d)}, so that range cannot be selected. Pick dates that avoid reserved days.`});setAnchor({room,date});setForm(f=>({...f,roomNumber:room,startDate:date,endDate:addDays(date,1)}));return;}}
   setForm(f=>({...f,roomNumber:room,startDate:a,endDate:addDays(z,1)}));setAnchor(null);setErrors({});scrollToForm();return;
  }
  setAnchor({room,date});setForm({roomNumber:room,startDate:date,endDate:addDays(date,1),purpose:''});setEditing(null);setErrors({});scrollToForm();
 }
 function edit(row){if(row.owner!=='you')return;setEditing(row.id);setAnchor(null);setForm({roomNumber:row.roomNumber,startDate:row.startDate,endDate:row.endDate,purpose:row.purpose});setErrors({});setNotice('');scrollToForm();}
 function clearForm(){setEditing(null);setAnchor(null);setForm({...formEmpty});setErrors({});}
 function submit(e){e.preventDefault();setNotice('');const {errs,room}=validate(form,bookings,editing);if(Object.keys(errs).length){setErrors({...errs,summary:`Reservation not saved. Fix ${Object.keys(errs).length>1?'the highlighted fields':'the highlighted field'} below.`});return;}const payload={roomNumber:room,startDate:form.startDate,endDate:form.endDate,purpose:form.purpose.trim(),owner:'you'};
 if(editing){setBookings(bookings.map(b=>b.id===editing?{...b,...payload}:b));setNotice('Booking updated.');}else{setBookings([...bookings,{...payload,id:'b-'+Date.now()}]);setNotice('Room reserved.');}clearForm();}
 function reset(){setBookings(seed);clearForm();setWeek('2026-11-09');setNotice('Example bookings restored.');setView('All rooms');}
 function check(){setNotice('');const {errs,room}=validate(form,bookings,editing);if(Object.keys(errs).length){setErrors({...errs,summary:'Availability check failed.'});return;}setErrors({});setNotice(`${room} is free ${human(form.startDate)} – ${human(form.endDate)}. You can confirm the booking.`);}
 function cancelBooking(){const id=confirmId;setBookings(bookings.filter(b=>b.id!==id));if(editing===id)clearForm();setConfirmId(null);setNotice('Booking cancelled.');}
 const toCancel=bookings.find(b=>b.id===confirmId);
 return <div className="room-app"><header className="topbar"><div className="mark"><span className="mark-sq">R</span><span><strong>room<span>grid</span></strong><small>Campus spaces</small></span></div><nav><button className={tab==='Availability'?'selected':''} onClick={()=>setTab('Availability')}>Availability</button><button className={tab==='My bookings'?'selected':''} onClick={()=>{setTab('My bookings');document.getElementById('my-reservations')?.scrollIntoView({behavior:'smooth'});}}>My bookings</button><button onClick={reset}>Reset demo</button></nav><div className="member"><span>Student dashboard</span><div className="profile">YOU</div></div></header>
  <main><section className="intro"><div><span className="eyebrow">SPACES / RESERVATIONS</span><h1>Find room availability</h1><p>Review campus rooms, dates and existing reservations in one view.</p></div><div className="intro-summary"><span>ROOMS IN DIRECTORY</span><strong>{rooms.length.toString().padStart(2,'0')}</strong><span>CURRENT RESERVATIONS</span><strong>{bookings.length.toString().padStart(2,'0')}</strong></div></section>
   <div className="pagegrid"><section className="calendar-pane"><div className="calendar-head"><div><span className="eyebrow">AVAILABILITY CALENDAR</span><h2>Rooms by day</h2></div><div className="weeknav"><button aria-label="Previous week" onClick={()=>setWeek(addDays(week,-7))}>←</button><strong>{human(week)} – {human(addDays(week,6))}</strong><button aria-label="Next week" onClick={()=>setWeek(addDays(week,7))}>→</button></div></div>
    <div className="calendar-controls"><label>Location <select value={view} onChange={e=>setView(e.target.value)}><option>All rooms</option>{rooms.map(r=><option key={r}>{r}</option>)}</select></label><span className="legend"><i className="free"/> Available</span><span className="legend"><i className="booked"/> Reserved</span><span className="legend"><i className="mine"/> Your booking</span><span className="legend"><i className="sel"/> Selected</span><p>{anchor?`Click another day in ${anchor.room} to select a range, or the same day to keep one night.`:'Click a day to start a selection; click a second day in the same room for a range.'}</p></div>
    <div className="calendar-scroll"><div className="room-cal"><div className="corner">ROOM / DATE</div>{days.map(d=><div className="dayhead" key={d}><strong>{weekDay(d)}</strong><span>{human(d)}</span></div>)}{roomList.map((room,i)=><React.Fragment key={room}><div className="roomname"><strong>{room}</strong><small>Study room · {room[0]}</small></div>{days.map(day=>{const b=occupied(room,day);const mine=b&&b.owner==='you';const sel=selected(room,day);const state=sel?'Selected':b?(mine?'Your booking':'Reserved'):'Available';return <button key={room+day} type="button" disabled={b&&!mine} aria-pressed={sel} aria-label={`${room}, ${weekDay(day)} ${human(day)}: ${state}${mine?', click to change':''}`} title={`${room}, ${day}: ${state}${mine&&b.purpose?' – '+b.purpose:''}`} className={'slot '+(b?(mine?'mine':'taken'):'available')+(sel?' selected':'')} onClick={()=>mine?edit(b):pick(room,day)}><span>{sel?'Selected':b?(mine?'Yours':'Reserved'):'Open'}</span>{b&&<small>{mine?(b.purpose||'Your booking'):'Unavailable'}</small>}</button>})}</React.Fragment>)}</div></div>
    <p className="calendar-note">Cells show individual dates. Reservations may span several dates; a day marked "Open" does not guarantee the full range you choose will be available.</p>
    <section id="my-reservations" className="reservations"><div className="reservations-head"><h2>Your bookings</h2><span>{myBookings.length} current records</span></div><div className="reservations-list">{myBookings.map(b=><article key={b.id} className="reservation"><div className="room-chip">{b.roomNumber}</div><div className="reservation-body"><strong>{human(b.startDate)} – {human(b.endDate)}</strong><small>{b.purpose||'No purpose entered'}</small></div><div className="reservation-actions"><button type="button" onClick={()=>edit(b)}>Change</button><button type="button" className="danger" onClick={()=>setConfirmId(b.id)}>Cancel</button></div></article>)}{myBookings.length===0&&<p>No reservations.</p>}</div></section></section>
    <aside className="booking-pane" id="booking-form"><div className="panel-tag"><span>BOOK A ROOM</span><span>FORM 01</span></div><h2>{editing?'Change reservation':'Make a reservation'}</h2><p className="booking-description">Use this panel to request a room for your study group, meeting or activity.</p>{notice&&<div className="success" role="status">{notice}</div>}{errors.summary&&<div className="error" role="alert">{errors.summary}</div>}<form onSubmit={submit}><label><span>Room number</span><input list="rooms" placeholder="e.g., B2-104" value={form.roomNumber} aria-invalid={!!errors.room} aria-describedby={errors.room?'err-room':undefined} className={errors.room?'invalid':''} onChange={e=>{setAnchor(null);setForm(f=>({...f,roomNumber:e.target.value}))}}/><datalist id="rooms">{rooms.map(r=><option key={r} value={r}/>)}</datalist>{errors.room&&<small className="field-error" id="err-room">{errors.room}</small>}</label><div className="date-pair"><label><span>Start date</span><input type="date" value={form.startDate} aria-invalid={!!(errors.start||errors.range)} aria-describedby={errors.start?'err-start':undefined} className={errors.start||errors.range?'invalid':''} onChange={e=>{setAnchor(null);setForm(f=>({...f,startDate:e.target.value}))}}/>{errors.start&&<small className="field-error" id="err-start">{errors.start}</small>}</label><label><span>End date</span><input type="date" value={form.endDate} aria-invalid={!!(errors.end||errors.range)} aria-describedby={errors.end?'err-end':undefined} className={errors.end||errors.range?'invalid':''} onChange={e=>{setAnchor(null);setForm(f=>({...f,endDate:e.target.value}))}}/>{errors.end&&<small className="field-error" id="err-end">{errors.end}</small>}</label></div>{errors.range&&<p className="field-error range-error" id="err-range" role="alert">{errors.range}</p>}<label><span>Purpose / optional</span><textarea rows="5" placeholder="Meeting, group study..." value={form.purpose} onChange={e=>setForm(f=>({...f,purpose:e.target.value}))}/></label><p className="helper">Start and end dates are required. Reservations cannot overlap existing bookings for the same room.</p><button className="availability-check" type="button" onClick={check}>Check availability</button><button className="reserve-button" type="submit">{editing?'Save booking':'Confirm booking'}</button>{editing&&<button className="cancel-edit" type="button" onClick={clearForm}>Discard changes</button>}{editing&&<button className="cancel-booking" type="button" onClick={()=>setConfirmId(editing)}>Cancel this reservation</button>}</form><div className="right-foot"><span>✦</span> Need a room for a group? Find an open date and submit your request.</div></aside></div>
  </main>{toCancel&&<div className="modal-backdrop" onClick={()=>setConfirmId(null)}><div className="modal" role="alertdialog" aria-modal="true" aria-labelledby="cancel-title" aria-describedby="cancel-desc" onClick={e=>e.stopPropagation()}><h2 id="cancel-title">Cancel this reservation?</h2><p id="cancel-desc">{toCancel.roomNumber}, {human(toCancel.startDate)} – {human(toCancel.endDate)}{toCancel.purpose?` (${toCancel.purpose})`:''}. The room will become available to others. This cannot be undone.</p><div className="modal-actions"><button type="button" autoFocus onClick={()=>setConfirmId(null)}>Keep booking</button><button type="button" className="confirm-cancel" onClick={cancelBooking}>Yes, cancel reservation</button></div></div></div>}<footer>ROOMGRID / Academic campus demo — local browser data only.</footer>
 </div>;
}
