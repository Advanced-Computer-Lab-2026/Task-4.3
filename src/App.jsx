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
// endDate stays exclusive in storage; the form and lists show the inclusive last day.
function dayCount(start,end){return Math.round((new Date(`${end}T12:00:00Z`)-new Date(`${start}T12:00:00Z`))/864e5);}
function range(start,end){const last=addDays(end,-1);return start===last?human(start):`${human(start)} – ${human(last)}`;}
function span(start,end){const n=dayCount(start,end);return `${range(start,end)} · ${n} ${n===1?'day':'days'}`;}
// Returns [message, field] so the form can say what is wrong and mark where.
function issue(form,bookings,id){
 if(!form.roomNumber.trim())return ['Choose a room.','roomNumber'];
 if(!form.startDate)return ['Pick the first day.','startDate'];
 if(!form.endDate)return ['Pick the last day.','endDate'];
 if(!rooms.includes(form.roomNumber.trim().toUpperCase()))return ['Choose a room from the directory.','roomNumber'];
 if(form.endDate<=form.startDate)return ['The last day cannot be before the first day.','endDate']; const clash=bookings.find(b=>b.id!==id&&b.roomNumber.toLowerCase()===form.roomNumber.trim().toLowerCase()&&form.startDate<b.endDate&&form.endDate>b.startDate);
 if(clash)return [`${clash.roomNumber} is already booked ${range(clash.startDate,clash.endDate)}${clash.owner==='you'?' by you':''}. Choose days outside that range or another room.`,'dates'];
 return ['',''];
}
export default function App(){
 const [bookings,setBookings]=useState(read);
 const [week,setWeek]=useState('2026-11-09');
 const [view,setView]=useState('All rooms');
 const [form,setForm]=useState({...formEmpty});
 const [editing,setEditing]=useState(null);
 const [error,setError]=useState('');
 const [bad,setBad]=useState('');
 const [confirmDelete,setConfirmDelete]=useState(false);
 const [notice,setNotice]=useState('');
 const [saved,setSaved]=useState(null);
 const [tab,setTab]=useState('Availability');
 useEffect(()=>localStorage.setItem(STORAGE,JSON.stringify(bookings)),[bookings]);
 const days=useMemo(()=>Array.from({length:7},(_,i)=>addDays(week,i)),[week]);
 const myBookings=bookings.filter(b=>b.owner==='you').sort((a,b)=>a.startDate.localeCompare(b.startDate));
 const roomList=view==='All rooms'?rooms:rooms.filter(r=>r===view);
 const occupied=(room,date)=>bookings.find(b=>b.roomNumber===room&&date>=b.startDate&&date<b.endDate);
 function pick(room,date){setForm({roomNumber:room,startDate:date,endDate:addDays(date,1),purpose:''});setEditing(null);setError('');document.getElementById('booking-form')?.scrollIntoView({behavior:'smooth',block:'nearest'});}
 function edit(row){if(row.owner!=='you')return;setEditing(row.id);setForm({roomNumber:row.roomNumber,startDate:row.startDate,endDate:row.endDate,purpose:row.purpose});setError('');setNotice('');setSaved(null);setConfirmDelete(false);document.getElementById('booking-form')?.scrollIntoView({behavior:'smooth',block:'start'});document.getElementById('room-field')?.focus({preventScroll:true});}
 function submit(e){e.preventDefault();setNotice('');setSaved(null);const [err,field]=issue(form,bookings,editing);if(err){setError('Booking not saved. '+err);setBad(field);return;}const payload={roomNumber:form.roomNumber.trim().toUpperCase(),startDate:form.startDate,endDate:form.endDate,purpose:form.purpose.trim(),owner:'you'};
 const what=`${payload.roomNumber}, ${span(payload.startDate,payload.endDate)}`,id=editing||'b-'+Date.now();
 if(editing){setBookings(bookings.map(b=>b.id===editing?{...b,...payload}:b));setNotice(`Booking updated: ${what}.`);}else{setBookings([...bookings,{...payload,id}]);setNotice(`Room reserved: ${what}.`);}setSaved(id);setForm({...formEmpty});setEditing(null);setError('');}
 function remove(){setBookings(bookings.filter(b=>b.id!==editing));setForm({...formEmpty});setEditing(null);setError('');setConfirmDelete(false);setSaved(null);setNotice('Booking deleted.');}
 function reset(){setBookings(seed);setForm({...formEmpty});setEditing(null);setWeek('2026-11-09');setNotice('Example bookings restored.');setSaved(null);setError('');setView('All rooms');}
 function check(){setNotice('');setSaved(null);setError('');const [e,field]=issue(form,bookings,editing);if(e){setError(e);setBad(field);}else setNotice('No conflict detected for the selected dates.');}
 const flag=f=>error&&(bad===f||(bad==='dates'&&f!=='roomNumber'))?{className:'invalid','aria-invalid':true}:{};
 return <div className="room-app"><header className="topbar"><div className="mark"><span className="mark-sq">R</span><span><strong>room<span>grid</span></strong><small>Campus spaces</small></span></div><nav><button className={tab==='Availability'?'selected':''} onClick={()=>setTab('Availability')}>Availability</button><button className={tab==='My bookings'?'selected':''} onClick={()=>{setTab('My bookings');document.getElementById('my-reservations')?.scrollIntoView({behavior:'smooth'});}}>My bookings</button><button onClick={reset}>Reset demo</button></nav><div className="member"><span>Student dashboard</span><div className="profile">YOU</div></div></header>
  <main><section className="intro"><div><span className="eyebrow">SPACES / RESERVATIONS</span><h1>Find room availability</h1><p>Review campus rooms, dates and existing reservations in one view.</p></div><div className="intro-summary"><span>ROOMS IN DIRECTORY</span><strong>{rooms.length.toString().padStart(2,'0')}</strong><span>CURRENT RESERVATIONS</span><strong>{bookings.length.toString().padStart(2,'0')}</strong></div></section>
   <div className="pagegrid"><section className="calendar-pane"><div className="calendar-head"><div><span className="eyebrow">AVAILABILITY CALENDAR</span><h2>Rooms by day</h2></div><div className="weeknav"><button aria-label="Previous week" onClick={()=>setWeek(addDays(week,-7))}>←</button><strong>{human(week)} – {human(addDays(week,6))}</strong><button aria-label="Next week" onClick={()=>setWeek(addDays(week,7))}>→</button></div></div>
    <div className="calendar-controls"><label>Location <select value={view} onChange={e=>setView(e.target.value)}><option>All rooms</option>{rooms.map(r=><option key={r}>{r}</option>)}</select></label><span className="legend"><i className="mine"/> Your booking</span><span className="legend"><i className="booked"/> Reserved</span><span className="legend"><i className="free"/> Available</span><p>Click a day to enter it in the form.</p></div>
    <div className="calendar-scroll"><div className="room-cal"><div className="corner">ROOM / DATE</div>{days.map(d=><div className="dayhead" key={d}><strong>{weekDay(d)}</strong><span>{human(d)}</span></div>)}{roomList.map((room,i)=><React.Fragment key={room}><div className="roomname"><strong>{room}</strong><small>Study room · {room[0]}</small></div>{days.map(day=>{const b=occupied(room,day);return <button key={room+day} title={`${room}, ${day}: ${b?'Reserved':'Available'}`} className={'slot '+(b?(b.owner==='you'?'taken mine':'taken'):'available')} onClick={()=>pick(room,day)}><span>{b?'Booked':'Open'}</span>{b&&<small>{b.owner==='you'?'Your booking':'Reserved'}</small>}</button>})}</React.Fragment>)}</div></div>
    <p className="calendar-note">Cells show individual dates. Reservations may span several dates; a day marked "Open" does not guarantee the full range you choose will be available.</p>
    <section id="my-reservations" className="reservations"><div className="reservations-head"><h2>Your bookings</h2><span>{myBookings.length} current records</span></div><div className="reservations-list">{myBookings.map(b=><article key={b.id} id={'booking-'+b.id} className={'reservation'+(editing===b.id?' editing':'')+(saved===b.id?' just-saved':'')}><div className="room-chip">{b.roomNumber}</div><div className="reservation-body"><strong>{span(b.startDate,b.endDate)}</strong><small>{b.purpose||'No purpose entered'}</small></div>{saved===b.id&&<span className="saved-tag">Just saved</span>}<button onClick={()=>edit(b)}>{editing===b.id?'Editing…':'Change'}</button></article>)}{myBookings.length===0&&<p>No reservations.</p>}</div></section></section>
    <aside className={'booking-pane'+(editing?' editing':'')} id="booking-form"><div className="panel-tag"><span>{editing?'EDITING YOUR BOOKING':'BOOK A ROOM'}</span><span>FORM 01</span></div><h2>{editing?'Change reservation':'Make a reservation'}</h2><p className="booking-description">Use this panel to request a room for your study group, meeting or activity.</p><form onSubmit={submit}><label><span>Room number</span><select id="room-field" {...flag('roomNumber')} value={form.roomNumber} onChange={e=>setForm(f=>({...f,roomNumber:e.target.value}))}><option value="">Choose a room…</option>{rooms.map(r=><option key={r}>{r}</option>)}</select></label><div className="date-pair"><label><span>First day</span><input type="date" {...flag('startDate')} value={form.startDate} onChange={e=>setForm(f=>({...f,startDate:e.target.value}))}/></label><label><span>Last day (included)</span><input type="date" {...flag('endDate')} value={form.endDate?addDays(form.endDate,-1):''} onChange={e=>{const v=e.target.value;setForm(f=>({...f,endDate:v?addDays(v,1):''}));}}/></label></div>{form.startDate&&form.endDate>form.startDate&&<p className="date-summary">You are booking <strong>{span(form.startDate,form.endDate)}</strong></p>}<label><span>Purpose / optional</span><textarea rows="5" placeholder="Meeting, group study..." value={form.purpose} onChange={e=>setForm(f=>({...f,purpose:e.target.value}))}/></label><p className="helper">Pick the first and last day you need the room; both days are included. Reservations cannot overlap existing bookings for the same room.</p>{notice&&<div className="success" role="status">{notice}{saved&&<button type="button" className="notice-link" onClick={()=>document.getElementById('booking-'+saved)?.scrollIntoView({behavior:'smooth',block:'center'})}>Show in Your bookings ↓</button>}</div>}{error&&<div className="error" role="alert">{error}</div>}<button className="availability-check" type="button" onClick={check}>Check availability</button><button className="reserve-button" type="submit">{editing?'Save booking':'Confirm booking'}</button>{editing&&<button className="cancel-edit" type="button" onClick={()=>{setEditing(null);setForm({...formEmpty});setError('')}}>Cancel editing</button>}{editing&&(confirmDelete?<div className="delete-confirm" role="alert"><span>Delete this booking? This cannot be undone.</span><div><button type="button" className="delete-yes" onClick={remove}>Yes, delete</button><button type="button" className="delete-no" onClick={()=>setConfirmDelete(false)}>Keep it</button></div></div>:<button type="button" className="delete-booking" onClick={()=>setConfirmDelete(true)}>Delete booking</button>)}</form><div className="right-foot"><span>✦</span> Need a room for a group? Find an open date and submit your request.</div></aside></div>
  </main><footer>ROOMGRID / Academic campus demo — local browser data only.</footer>
 </div>;
}
