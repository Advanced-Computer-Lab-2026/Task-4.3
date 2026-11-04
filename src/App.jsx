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
 const clash=bookings.filter(b=>b.id!==id&&b.roomNumber.toLowerCase()===form.roomNumber.trim().toLowerCase()&&form.startDate<b.endDate&&form.endDate>b.startDate).sort((a,b)=>a.startDate.localeCompare(b.startDate));
 if(clash.length){
  // End dates are exclusive, so the last booked day is the day before the overlap ends.
  const day=iso=>`${weekDay(iso)} ${human(iso)}`;
  const spans=clash.map(b=>{const from=b.startDate>form.startDate?b.startDate:form.startDate;const to=addDays(b.endDate<form.endDate?b.endDate:form.endDate,-1);return (from===to?day(from):`${day(from)} – ${day(to)}`)+(b.owner==='you'?' (your booking)':'');});
  return `${clash[0].roomNumber} is already booked on ${spans.join(', ')}. Pick different dates or another room.`;
 }
 return '';
}
export default function App(){
 const [bookings,setBookings]=useState(read);
 const [week,setWeek]=useState('2026-11-09');
 const [view,setView]=useState('All rooms');
 const [form,setForm]=useState({...formEmpty});
 const [editing,setEditing]=useState(null);
 const [editForm,setEditForm]=useState({...formEmpty});
 const [error,setError]=useState('');
 const [notice,setNotice]=useState('');
 const [editError,setEditError]=useState('');
 const [editNotice,setEditNotice]=useState('');
 const [tab,setTab]=useState('Availability');
 useEffect(()=>localStorage.setItem(STORAGE,JSON.stringify(bookings)),[bookings]);
 useEffect(()=>{if(!editing)return;const onKey=e=>{if(e.key==='Escape')closeEdit();};document.addEventListener('keydown',onKey);document.body.style.overflow='hidden';return()=>{document.removeEventListener('keydown',onKey);document.body.style.overflow='';};},[editing]);
 const days=useMemo(()=>Array.from({length:7},(_,i)=>addDays(week,i)),[week]);
 const myBookings=bookings.filter(b=>b.owner==='you').sort((a,b)=>a.startDate.localeCompare(b.startDate));
 const roomList=view==='All rooms'?rooms:rooms.filter(r=>r===view);
 const occupied=(room,date)=>bookings.find(b=>b.roomNumber===room&&date>=b.startDate&&date<b.endDate);
 function pick(room,date){const b=occupied(room,date);if(b&&b.owner==='you'){edit(b);return;}setForm({roomNumber:room,startDate:date,endDate:addDays(date,1),purpose:''});setError('');document.getElementById('booking-form')?.scrollIntoView({behavior:'smooth',block:'nearest'});}
 function edit(row){if(row.owner!=='you')return;setEditing(row.id);setEditForm({roomNumber:row.roomNumber,startDate:row.startDate,endDate:row.endDate,purpose:row.purpose});setEditError('');setEditNotice('');setNotice('');}
 function closeEdit(){setEditing(null);setEditForm({...formEmpty});setEditError('');setEditNotice('');}
 const payloadOf=f=>({roomNumber:f.roomNumber.trim(),startDate:f.startDate,endDate:f.endDate,purpose:f.purpose.trim(),owner:'you'});
 function submit(e){e.preventDefault();setNotice('');const err=issue(form,bookings,null);if(err){setError(err);return;}
 setBookings([...bookings,{...payloadOf(form),id:'b-'+Date.now()}]);setNotice('Room reserved.');setForm({...formEmpty});setError('');}
 function submitEdit(e){e.preventDefault();setEditNotice('');const err=issue(editForm,bookings,editing);if(err){setEditError(err);return;}
 setBookings(bookings.map(b=>b.id===editing?{...b,...payloadOf(editForm)}:b));closeEdit();setNotice('Booking updated.');}
 function reset(){setBookings(seed);setForm({...formEmpty});closeEdit();setWeek('2026-11-09');setNotice('Example bookings restored.');setError('');setView('All rooms');}
 function check(){setNotice('');setError('');let e=issue(form,bookings,null);if(e){setError(e);}else setNotice('No conflict detected for the selected dates.');}
 function checkEdit(){setEditNotice('');setEditError('');let e=issue(editForm,bookings,editing);if(e){setEditError(e);}else setEditNotice('No conflict detected for the selected dates.');}
 const fields=(f,set,listId)=><><label><span>Room number</span><input list={listId} placeholder="e.g., B2-104" value={f.roomNumber} onChange={e=>set(x=>({...x,roomNumber:e.target.value}))} autoFocus={listId==='rooms-edit'}/><datalist id={listId}>{rooms.map(r=><option key={r} value={r}/>)}</datalist></label><div className="date-pair"><label><span>Start date</span><input type="date" value={f.startDate} onChange={e=>set(x=>({...x,startDate:e.target.value}))}/></label><label><span>End date</span><input type="date" value={f.endDate} onChange={e=>set(x=>({...x,endDate:e.target.value}))}/></label></div><label><span>Purpose / optional</span><textarea rows="5" placeholder="Meeting, group study..." value={f.purpose} onChange={e=>set(x=>({...x,purpose:e.target.value}))}/></label><p className="helper">Start and end dates are required. Reservations cannot overlap existing bookings for the same room.</p></>;
 return <div className="room-app"><header className="topbar"><div className="mark"><span className="mark-sq">R</span><span><strong>room<span>grid</span></strong><small>Campus spaces</small></span></div><nav><button className={tab==='Availability'?'selected':''} onClick={()=>setTab('Availability')}>Availability</button><button className={tab==='My bookings'?'selected':''} onClick={()=>{setTab('My bookings');document.getElementById('my-reservations')?.scrollIntoView({behavior:'smooth'});}}>My bookings</button><button onClick={reset}>Reset demo</button></nav><div className="member"><span>Student dashboard</span><div className="profile">YOU</div></div></header>
  <main><section className="intro"><div><span className="eyebrow">SPACES / RESERVATIONS</span><h1>Find room availability</h1><p>Review campus rooms, dates and existing reservations in one view.</p></div><div className="intro-summary"><span>ROOMS IN DIRECTORY</span><strong>{rooms.length.toString().padStart(2,'0')}</strong><span>CURRENT RESERVATIONS</span><strong>{bookings.length.toString().padStart(2,'0')}</strong></div></section>
   <div className="pagegrid"><section className="calendar-pane"><div className="calendar-head"><div><span className="eyebrow">AVAILABILITY CALENDAR</span><h2>Rooms by day</h2></div><div className="weeknav"><button aria-label="Previous week" onClick={()=>setWeek(addDays(week,-7))}>←</button><strong>{human(week)} – {human(addDays(week,6))}</strong><button aria-label="Next week" onClick={()=>setWeek(addDays(week,7))}>→</button></div></div>
    <div className="calendar-controls"><label>Location <select value={view} onChange={e=>setView(e.target.value)}><option>All rooms</option>{rooms.map(r=><option key={r}>{r}</option>)}</select></label><span className="legend"><i className="booked"/> Reserved</span><span className="legend"><i className="free"/> Available</span><p>Click a day to enter it in the form.</p></div>
    <div className="calendar-scroll"><div className="room-cal"><div className="corner">ROOM / DATE</div>{days.map(d=><div className="dayhead" key={d}><strong>{weekDay(d)}</strong><span>{human(d)}</span></div>)}{roomList.map((room,i)=><React.Fragment key={room}><div className="roomname"><strong>{room}</strong><small>Study room · {room[0]}</small></div>{days.map(day=>{const b=occupied(room,day);const mine=b&&b.owner==='you';return <button key={room+day} title={`${room}, ${day}: ${mine?'Your booking – click to change':b?'Reserved':'Available'}`} className={'slot '+(b?'taken':'available')+(mine?' mine':'')} onClick={()=>pick(room,day)}><span>{b?'Booked':'Open'}</span>{b&&<small>{mine?'Your booking · change':'Reserved'}</small>}</button>})}</React.Fragment>)}</div></div>
    <p className="calendar-note">Cells show individual dates. Reservations may span several dates; a day marked "Open" does not guarantee the full range you choose will be available.</p>
    <section id="my-reservations" className="reservations"><div className="reservations-head"><h2>Your bookings</h2><span>{myBookings.length} current records</span></div><div className="reservations-list">{myBookings.map(b=><article key={b.id} className="reservation"><div className="room-chip">{b.roomNumber}</div><div className="reservation-body"><strong>{human(b.startDate)} – {human(b.endDate)}</strong><small>{b.purpose||'No purpose entered'}</small></div><button onClick={()=>edit(b)}>Change</button></article>)}{myBookings.length===0&&<p>No reservations.</p>}</div></section></section>
    <aside className="booking-pane" id="booking-form"><div className="panel-tag"><span>BOOK A ROOM</span><span>FORM 01</span></div><h2>Make a reservation</h2><p className="booking-description">Use this panel to request a room for your study group, meeting or activity.</p>{notice&&<div className="success" role="status">{notice}</div>}{error&&<div className="error" role="alert">{error}</div>}<form onSubmit={submit}>{fields(form,setForm,'rooms')}<button className="availability-check" type="button" onClick={check}>Check availability</button><button className="reserve-button" type="submit">Confirm booking</button></form><div className="right-foot"><span>✦</span> Need a room for a group? Find an open date and submit your request.</div></aside></div>
  </main>
  {editing&&<div className="modal-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)closeEdit();}}><div className="modal" role="dialog" aria-modal="true" aria-labelledby="edit-title"><div className="panel-tag"><span>CHANGE RESERVATION</span><button type="button" className="modal-close" aria-label="Close" onClick={closeEdit}>×</button></div><h2 id="edit-title">Change your booking</h2><p className="booking-description">Update the room, dates or purpose. Other people's bookings stay protected — overlaps are still rejected.</p>{editNotice&&<div className="success" role="status">{editNotice}</div>}{editError&&<div className="error" role="alert">{editError}</div>}<form onSubmit={submitEdit}>{fields(editForm,setEditForm,'rooms-edit')}<button className="availability-check" type="button" onClick={checkEdit}>Check availability</button><button className="reserve-button" type="submit">Save booking</button><button className="cancel-edit" type="button" onClick={closeEdit}>Cancel</button></form></div></div>}<footer>ROOMGRID / Academic campus demo — local browser data only.</footer>
 </div>;
}
