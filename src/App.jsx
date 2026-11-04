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

// UX FIX 1: validation returns one message per field so each error is shown under the field
// that caused it (instead of one vague "Reservation failed" message). Rules are unchanged.
function issues(form,bookings,id){
 const e={};
 if(!form.roomNumber.trim())e.roomNumber='Enter a room number.';
 if(!form.startDate)e.startDate='Choose a start date.';
 if(!form.endDate)e.endDate='Choose an end date.';
 if(form.startDate&&form.endDate&&form.endDate<=form.startDate)e.endDate='End date must be after the start date.';
 if(Object.keys(e).length===0&&bookings.some(b=>b.id!==id&&b.roomNumber.toLowerCase()===form.roomNumber.trim().toLowerCase()&&form.startDate<b.endDate&&form.endDate>b.startDate))e.dates='This room is already booked for some of those dates.';
 return e;
}

export default function App(){
 const [bookings,setBookings]=useState(read);
 const [week,setWeek]=useState('2026-11-09');
 const [view,setView]=useState('All rooms');
 const [form,setForm]=useState({...formEmpty});
 const [editing,setEditing]=useState(null);
 const [error,setError]=useState('');
 const [fieldErrors,setFieldErrors]=useState({});
 const [notice,setNotice]=useState('');
 const [tab,setTab]=useState('Availability');
 const [confirmDelete,setConfirmDelete]=useState(null);
 useEffect(()=>localStorage.setItem(STORAGE,JSON.stringify(bookings)),[bookings]);
 const days=useMemo(()=>Array.from({length:7},(_,i)=>addDays(week,i)),[week]);
 const myBookings=bookings.filter(b=>b.owner==='you').sort((a,b)=>a.startDate.localeCompare(b.startDate));
 const roomList=view==='All rooms'?rooms:rooms.filter(r=>r===view);
 const occupied=(room,date)=>bookings.find(b=>b.roomNumber===room&&date>=b.startDate&&date<b.endDate);
 const editingRow=bookings.find(b=>b.id===editing);

 function clearErrors(){setError('');setFieldErrors({});}
 // Updates one field and removes its error as soon as the user starts fixing it.
 function update(field,value){setForm(f=>({...f,[field]:value}));setFieldErrors(fe=>({...fe,[field]:'',dates:''}));}
 function goToForm(){setTimeout(()=>{document.getElementById('booking-form')?.scrollIntoView({behavior:'smooth',block:'start'});document.getElementById('room-input')?.focus({preventScroll:true});},0);}

 function pick(room,date){setForm({roomNumber:room,startDate:date,endDate:addDays(date,1),purpose:''});setEditing(null);clearErrors();setNotice('');goToForm();}
 // UX FIX 2: "Change" now visibly takes the user to the form (scroll + focus) and marks what is being edited.
 function edit(row){if(row.owner!=='you')return;setEditing(row.id);setForm({roomNumber:row.roomNumber,startDate:row.startDate,endDate:row.endDate,purpose:row.purpose});clearErrors();setNotice('');setConfirmDelete(null);goToForm();}
 // UX FIX 3: users can delete their own booking (after confirming).
 function remove(id){
  setBookings(bookings.filter(b=>b.id!==id));
  if(editing===id){setEditing(null);setForm({...formEmpty});clearErrors();}
  setConfirmDelete(null);setNotice('Booking deleted.');
 }
 function submit(e){
  e.preventDefault();setNotice('');
  const errs=issues(form,bookings,editing);
  setFieldErrors(errs);
  if(Object.keys(errs).length){setError('Please fix the highlighted fields.');return;}
  const payload={roomNumber:form.roomNumber.trim(),startDate:form.startDate,endDate:form.endDate,purpose:form.purpose.trim(),owner:'you'};
  if(editing){setBookings(bookings.map(b=>b.id===editing?{...b,...payload}:b));setNotice('Booking updated.');}else{setBookings([...bookings,{...payload,id:'b-'+Date.now()}]);setNotice('Room reserved.');}
  setForm({...formEmpty});setEditing(null);clearErrors();
 }
 function reset(){setBookings(seed);setForm({...formEmpty});setEditing(null);setConfirmDelete(null);setWeek('2026-11-09');setNotice('Example bookings restored.');clearErrors();setView('All rooms');}
 function check(){
  setNotice('');clearErrors();
  const errs=issues(form,bookings,editing);
  setFieldErrors(errs);
  if(Object.keys(errs).length){setError('Please fix the highlighted fields.');}else setNotice('No conflict detected for the selected dates.');
 }
 return <div className="room-app"><header className="topbar"><div className="mark"><span className="mark-sq">R</span><span><strong>room<span>grid</span></strong><small>Campus spaces</small></span></div><nav><button className={tab==='Availability'?'selected':''} onClick={()=>setTab('Availability')}>Availability</button><button className={tab==='My bookings'?'selected':''} onClick={()=>{setTab('My bookings');document.getElementById('my-reservations')?.scrollIntoView({behavior:'smooth'});}}>My bookings</button><button onClick={reset}>Reset demo</button></nav><div className="member"><span>Student dashboard</span><div className="profile">YOU</div></div></header>
  <main><section className="intro"><div><span className="eyebrow">SPACES / RESERVATIONS</span><h1>Find room availability</h1><p>Review campus rooms, dates and existing reservations in one view.</p></div><div className="intro-summary"><span>ROOMS IN DIRECTORY</span><strong>{rooms.length.toString().padStart(2,'0')}</strong><span>CURRENT RESERVATIONS</span><strong>{bookings.length.toString().padStart(2,'0')}</strong></div></section>
   <div className="pagegrid"><section className="calendar-pane"><div className="calendar-head"><div><span className="eyebrow">AVAILABILITY CALENDAR</span><h2>Rooms by day</h2></div><div className="weeknav"><button aria-label="Previous week" onClick={()=>setWeek(addDays(week,-7))}>←</button><strong>{human(week)} – {human(addDays(week,6))}</strong><button aria-label="Next week" onClick={()=>setWeek(addDays(week,7))}>→</button></div></div>
    <div className="calendar-controls"><label>Location <select value={view} onChange={e=>setView(e.target.value)}><option>All rooms</option>{rooms.map(r=><option key={r}>{r}</option>)}</select></label><span className="legend"><i className="booked"/> Reserved</span><span className="legend"><i className="free"/> Available</span><p>Click a day to enter it in the form.</p></div>
    <div className="calendar-scroll"><div className="room-cal"><div className="corner">ROOM / DATE</div>{days.map(d=><div className="dayhead" key={d}><strong>{weekDay(d)}</strong><span>{human(d)}</span></div>)}{roomList.map((room,i)=><React.Fragment key={room}><div className="roomname"><strong>{room}</strong><small>Study room · {room[0]}</small></div>{days.map(day=>{const b=occupied(room,day);const mine=b&&b.owner==='you';return <button key={room+day} title={mine?`${room}, ${day}: Your booking – click to change`:`${room}, ${day}: ${b?'Reserved':'Available'}`} className={'slot '+(b?'taken':'available')} onClick={()=>mine?edit(b):pick(room,day)}><span>{b?'Booked':'Open'}</span>{b&&<small>{mine?'Your booking':'Reserved'}</small>}</button>})}</React.Fragment>)}</div></div>
    <p className="calendar-note">Cells show individual dates. Reservations may span several dates; a day marked "Open" does not guarantee the full range you choose will be available.</p>
    <section id="my-reservations" className="reservations"><div className="reservations-head"><h2>Your bookings</h2><span>{myBookings.length} current records</span></div><div className="reservations-list">{myBookings.map(b=><article key={b.id} className={'reservation'+(editing===b.id?' is-editing':'')}><div className="room-chip">{b.roomNumber}</div><div className="reservation-body"><strong>{human(b.startDate)} – {human(b.endDate)}</strong><small>{b.purpose||'No purpose entered'}</small></div>
     <div className="reservation-actions">{confirmDelete===b.id
      ?<><span className="confirm-text">Delete this booking?</span><button className="danger" onClick={()=>remove(b.id)}>Yes, delete</button><button onClick={()=>setConfirmDelete(null)}>Keep</button></>
      :<><button onClick={()=>edit(b)}>{editing===b.id?'Editing…':'Change'}</button><button className="danger" onClick={()=>setConfirmDelete(b.id)}>Delete</button></>}
     </div></article>)}{myBookings.length===0&&<p>No reservations.</p>}</div></section></section>
    <aside className={'booking-pane'+(editing?' is-editing':'')} id="booking-form"><div className="panel-tag"><span>{editing?'EDIT BOOKING':'BOOK A ROOM'}</span><span>FORM 01</span></div><h2>{editing?'Change reservation':'Make a reservation'}</h2>
     {editingRow?<p className="editing-banner">You are changing your <strong>{editingRow.roomNumber}</strong> booking ({human(editingRow.startDate)} – {human(editingRow.endDate)}). Save your changes or cancel below.</p>:<p className="booking-description">Use this panel to request a room for your study group, meeting or activity.</p>}
     {notice&&<div className="success" role="status">{notice}</div>}{error&&<div className="error" role="alert">{error}</div>}
     <form onSubmit={submit} noValidate>
      <label><span>Room number</span><input id="room-input" list="rooms" placeholder="e.g., B2-104" value={form.roomNumber} aria-invalid={!!fieldErrors.roomNumber} onChange={e=>update('roomNumber',e.target.value)}/><datalist id="rooms">{rooms.map(r=><option key={r} value={r}/>)}</datalist>{fieldErrors.roomNumber&&<small className="field-error">{fieldErrors.roomNumber}</small>}</label>
      <div className="date-pair">
       <label><span>Start date</span><input type="date" value={form.startDate} aria-invalid={!!fieldErrors.startDate||!!fieldErrors.dates} onChange={e=>update('startDate',e.target.value)}/>{fieldErrors.startDate&&<small className="field-error">{fieldErrors.startDate}</small>}</label>
       <label><span>End date</span><input type="date" value={form.endDate} aria-invalid={!!fieldErrors.endDate||!!fieldErrors.dates} onChange={e=>update('endDate',e.target.value)}/>{fieldErrors.endDate&&<small className="field-error">{fieldErrors.endDate}</small>}</label>
      </div>
      {fieldErrors.dates&&<p className="field-error">{fieldErrors.dates}</p>}
      <label><span>Purpose / optional</span><textarea rows="5" placeholder="Meeting, group study..." value={form.purpose} onChange={e=>setForm(f=>({...f,purpose:e.target.value}))}/></label>
      <p className="helper">Start and end dates are required. Reservations cannot overlap existing bookings for the same room.</p>
      <button className="availability-check" type="button" onClick={check}>Check availability</button>
      <button className="reserve-button" type="submit">{editing?'Save booking':'Confirm booking'}</button>
      {editing&&<button className="cancel-edit" type="button" onClick={()=>{setEditing(null);setForm({...formEmpty});clearErrors();}}>Cancel editing</button>}
     </form>
     <div className="right-foot"><span>✦</span> Need a room for a group? Find an open date and submit your request.</div></aside></div>
  </main><footer>ROOMGRID / Academic campus demo — local browser data only.</footer>
 </div>;
}