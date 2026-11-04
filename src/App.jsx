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
function issue(form,bookings,id){
 if(!form.roomNumber.trim()||!form.startDate||!form.endDate)return 'Complete the room and both dates.';
 if(form.endDate<=form.startDate)return 'End date must follow start date.';
 if(bookings.some(b=>b.id!==id&&b.roomNumber.toLowerCase()===form.roomNumber.trim().toLowerCase()&&form.startDate<b.endDate&&form.endDate>b.startDate))return 'This room is already booked for some of those dates.';
 return '';
}
function monday(iso){const d=new Date(`${iso}T12:00:00Z`).getUTCDay();return addDays(iso,-((d+6)%7));}
export default function App(){
 const [bookings,setBookings]=useState(read);
 const [week,setWeek]=useState('2026-11-09');
 const [view,setView]=useState('All rooms');
 const [form,setForm]=useState({...formEmpty});
 const [editing,setEditing]=useState(null);
 const [mode,setMode]=useState('mine'); // 'mine' = my reservations calendar, 'book' = availability + form
 const [error,setError]=useState('');
 const [notice,setNotice]=useState('');
 useEffect(()=>localStorage.setItem(STORAGE,JSON.stringify(bookings)),[bookings]);
 const days=useMemo(()=>Array.from({length:7},(_,i)=>addDays(week,i)),[week]);
 const myBookings=bookings.filter(b=>b.owner==='you').sort((a,b)=>a.startDate.localeCompare(b.startDate));
 const booking=mode==='book';
 const roomList=view==='All rooms'?rooms:rooms.filter(r=>r===view);
 const occupied=(room,date)=>bookings.find(b=>b.roomNumber===room&&date>=b.startDate&&date<b.endDate);
 const original=editing?bookings.find(b=>b.id===editing):null;
 const inForm=(room,day)=>booking&&form.roomNumber.trim().toLowerCase()===room.toLowerCase()&&form.startDate&&form.endDate&&day>=form.startDate&&day<form.endDate;
 function toForm(){setTimeout(()=>document.getElementById('booking-form')?.scrollIntoView({behavior:'smooth',block:'start'}),50);}
 function startNew(){setEditing(null);setForm({...formEmpty});setError('');setNotice('');setMode('book');toForm();}
 function edit(row){if(row.owner!=='you')return;setEditing(row.id);setForm({roomNumber:row.roomNumber,startDate:row.startDate,endDate:row.endDate,purpose:row.purpose});setError('');setNotice('');setWeek(monday(row.startDate));setMode('book');toForm();}
 function close(){setEditing(null);setForm({...formEmpty});setError('');setMode('mine');}
 function pick(room,date){
  const b=occupied(room,date);
  if(!booking){if(b&&b.owner==='you')edit(b);return;}
  if(b){if(b.owner==='you'&&b.id!==editing)edit(b);return;}
  setError('');setNotice('');
  if(original){const len=Math.round((new Date(original.endDate)-new Date(original.startDate))/864e5);setForm(f=>({...f,roomNumber:room,startDate:date,endDate:addDays(date,len)}));}
  else setForm(f=>({...f,roomNumber:room,startDate:date,endDate:addDays(date,1)}));
 }
 function submit(e){e.preventDefault();setNotice('');const err=issue(form,bookings,editing);if(err){setError(err);return;}
  const payload={roomNumber:form.roomNumber.trim(),startDate:form.startDate,endDate:form.endDate,purpose:form.purpose.trim(),owner:'you'};
  const msg=`${payload.roomNumber}, ${human(payload.startDate)} – ${human(payload.endDate)}`;
  if(editing){setBookings(bookings.map(b=>b.id===editing?{...b,...payload}:b));setNotice(`Booking updated: ${msg}.`);}
  else{setBookings([...bookings,{...payload,id:'b-'+Date.now()}]);setNotice(`Room reserved: ${msg}.`);}
  setWeek(monday(payload.startDate));setForm({...formEmpty});setEditing(null);setError('');setMode('mine');}
 function reset(){setBookings(seed);setForm({...formEmpty});setEditing(null);setWeek('2026-11-09');setNotice('Example bookings restored.');setError('');setView('All rooms');setMode('mine');}
 function check(){setNotice('');setError('');const e=issue(form,bookings,editing);if(e)setError(e);else setNotice('No conflict for the selected dates.');}
 const filled=form.roomNumber.trim()&&form.startDate&&form.endDate;
 return <div className="room-app"><header className="topbar"><div className="mark"><span className="mark-sq">R</span><span><strong>room<span>grid</span></strong><small>Campus spaces</small></span></div><div className="profile" title="Signed in as You">YOU</div></header>
  <main>
   <section className="intro"><div><h1>My reservations</h1><p>{myBookings.length} reservation{myBookings.length===1?'':'s'} · click one of yours in the calendar to change it</p></div>{!booking&&<button className="reserve-button new-btn" onClick={startNew}>+ New reservation</button>}</section>
   {!booking&&notice&&<p className="success" role="status">{notice}</p>}

   {booking&&<section className="booking-pane" id="booking-form">
    <div className="booking-head"><h2>{editing?'Switch reservation':'Make a reservation'}</h2><p className="switch-hint">Click an open (green) slot in the calendar below to fill in the room and dates.</p></div>
    {original&&<div className="switch-box" aria-label="Switch summary"><div className="switch-cols"><div><span>Current</span><strong>{original.roomNumber}</strong><em>{human(original.startDate)} – {human(original.endDate)}</em></div><div className="arrow" aria-hidden="true">→</div><div className={filled?'':'unset'}><span>New</span><strong className={form.roomNumber.trim()!==original.roomNumber?'changed':''}>{form.roomNumber.trim()||'Choose a room'}</strong><em className={form.startDate!==original.startDate||form.endDate!==original.endDate?'changed':''}>{form.startDate&&form.endDate?`${human(form.startDate)} – ${human(form.endDate)}`:'Choose dates'}</em></div></div></div>}
    <form onSubmit={submit} noValidate>
     <div className="form-row">
      <label><span>Room number</span><input list="rooms" placeholder="e.g., B2-104" value={form.roomNumber} onChange={e=>setForm(f=>({...f,roomNumber:e.target.value}))}/><datalist id="rooms">{rooms.map(r=><option key={r} value={r}/>)}</datalist></label>
      <label><span>Start date</span><input type="date" value={form.startDate} onChange={e=>setForm(f=>({...f,startDate:e.target.value}))}/></label>
      <label><span>End date (exclusive)</span><input type="date" min={form.startDate?addDays(form.startDate,1):undefined} value={form.endDate} onChange={e=>setForm(f=>({...f,endDate:e.target.value}))}/></label>
      <label className="grow"><span>Purpose (optional)</span><input placeholder="Meeting, group study..." value={form.purpose} onChange={e=>setForm(f=>({...f,purpose:e.target.value}))}/></label>
     </div>
     <div aria-live="polite">{notice&&<p className="success" role="status">{notice}</p>}{error&&<p className="error" role="alert">{error}</p>}</div>
     <div className="form-actions"><button className="reserve-button" type="submit">{editing?'Save booking':'Confirm booking'}</button><button className="availability-check" type="button" onClick={check}>Check availability</button><button className="cancel-edit" type="button" onClick={close}>Cancel</button></div>
    </form>
   </section>}

   <section className="calendar-pane">
    <div className="calendar-head"><h2>Your calendar</h2><div className="weeknav"><button aria-label="Previous week" onClick={()=>setWeek(addDays(week,-7))}>←</button><strong>{human(week)} – {human(addDays(week,6))}</strong><button aria-label="Next week" onClick={()=>setWeek(addDays(week,7))}>→</button></div></div>
    <div className="calendar-controls"><label>Room <select value={view} onChange={e=>setView(e.target.value)}><option>All rooms</option>{rooms.map(r=><option key={r}>{r}</option>)}</select></label><span className="legend"><i className="mine"/>Yours</span>{booking&&<span className="legend"><i className="free"/>Open</span>}{booking&&<span className="legend"><i className="booked"/>Booked</span>}{booking&&<span className="legend"><i className="pick"/>Selected</span>}</div>
    <div className="room-cal"><div className="corner">Room</div>{days.map(d=><div className="dayhead" key={d}><strong>{weekDay(d)}</strong><span>{human(d)}</span></div>)}{roomList.map(room=><React.Fragment key={room}><div className="roomname">{room}</div>{days.map(day=>{const b=occupied(room,day);const mine=b&&b.owner==='you';
     const label=b?(mine?'Yours':'Booked'):'Open';
     const show=booking||mine;const disabled=booking?(b&&!mine):!mine;
     const cls=!show?'blank':(b?(mine?'mine':'taken'):'available');
     return <button key={room+day} disabled={disabled} aria-label={`${room}, ${human(day)}: ${show?label:'no booking'}`} title={show?`${room}, ${human(day)}: ${label}${b&&b.purpose?' – '+b.purpose:''}`:undefined} className={'slot '+cls+(inForm(room,day)?' chosen':'')} onClick={()=>pick(room,day)}><span className="full">{show?label:''}</span><span className="short" aria-hidden="true">{show?(b?(mine?'★':'✕'):'✓'):''}</span></button>})}</React.Fragment>)}</div>
    {myBookings.length>0?<ul className="reservations-list">{myBookings.map(b=><li key={b.id} className={'reservation'+(b.id===editing?' current':'')}><strong>{b.roomNumber}</strong><span>{human(b.startDate)} – {human(b.endDate)}</span><em>{b.purpose||'No purpose'}</em><button onClick={()=>edit(b)} disabled={b.id===editing}>{b.id===editing?'Changing…':'Change'}</button></li>)}</ul>:<p className="empty">No reservations yet. Press “New reservation” to book a room.</p>}
   </section>
  </main><footer>Local browser data only. <button onClick={reset}>Reset demo data</button></footer>
 </div>;
}
