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
// FIX #9: derive useful info from the room code (A1-203 → Block A1, Floor 2) instead of decorative filler.
function roomInfo(room){const [block,num]=room.split('-');return `Block ${block} · Floor ${num[0]}`;}
function weekDay(iso){return new Date(`${iso}T12:00:00Z`).toLocaleDateString('en-GB',{timeZone:'UTC',weekday:'short'});}

// FIX #1: validation now returns a specific, actionable message instead of one generic sentence.
function issue(form,bookings,id){
 const room=form.roomNumber.trim();
 const missing=[];
 if(!room)missing.push('a room number');
 if(!form.startDate)missing.push('a start date');
 if(!form.endDate)missing.push('an end date');
 if(missing.length)return `Please enter ${missing.join(', ').replace(/, ([^,]*)$/,' and $1')}.`;
 if(!rooms.some(r=>r.toLowerCase()===room.toLowerCase()))return `Room "${room}" is not in the directory. Pick one from the list (e.g. B2-104).`;
 if(form.endDate<=form.startDate)return `End date (${human(form.endDate)}) must be after the start date (${human(form.startDate)}).`;
 const clash=bookings.find(b=>b.id!==id&&b.roomNumber.toLowerCase()===room.toLowerCase()&&form.startDate<b.endDate&&form.endDate>b.startDate);
 if(clash)return `${clash.roomNumber} is already reserved ${human(clash.startDate)} – ${human(clash.endDate)}${clash.owner==='you'?' (your own booking)':''}. Choose different dates or another room.`;
 return '';
}

export default function App(){
 const [bookings,setBookings]=useState(read);
 const [week,setWeek]=useState('2026-11-09');
 const [view,setView]=useState('All rooms');
 const [form,setForm]=useState({...formEmpty});
 const [editing,setEditing]=useState(null);
 const [error,setError]=useState('');
 const [notice,setNotice]=useState('');
 const [tab,setTab]=useState('Availability');
 const [confirmReset,setConfirmReset]=useState(false);  // FIX #7: two-step reset
 const [hint,setHint]=useState('');                      // FIX #3b: why a calendar click was refused
 const roomInput=useRef(null);
 useEffect(()=>localStorage.setItem(STORAGE,JSON.stringify(bookings)),[bookings]);
 useEffect(()=>{if(!confirmReset)return;const t=setTimeout(()=>setConfirmReset(false),5000);return()=>clearTimeout(t);},[confirmReset]);
 const days=useMemo(()=>Array.from({length:7},(_,i)=>addDays(week,i)),[week]);
 const myBookings=bookings.filter(b=>b.owner==='you').sort((a,b)=>a.startDate.localeCompare(b.startDate));
 const roomList=view==='All rooms'?rooms:rooms.filter(r=>r===view);
 const occupied=(room,date)=>bookings.find(b=>b.roomNumber===room&&date>=b.startDate&&date<b.endDate);
 const editingRow=editing?bookings.find(b=>b.id===editing):null;
 const selRoom=rooms.find(r=>r.toLowerCase()===form.roomNumber.trim().toLowerCase());

 function goTo(id,focus){const el=document.getElementById(id);el?.scrollIntoView({behavior:'smooth',block:'start'});if(focus)setTimeout(()=>roomInput.current?.focus({preventScroll:true}),400);}
 function showTab(name){setTab(name);goTo(name==='My bookings'?'my-reservations':'availability');}
 // FIX #3: click a start night, then click the last night in the same room to select a whole range.
 // FIX #3b: clashing selections are impossible from the calendar — reserved nights can't start a range
 // and a range can't be extended across a reserved night. The hint explains why instead of failing later.
 function pick(room,date){
  setError('');setNotice('');
  const b=occupied(room,date);
  if(b){
   if(b.owner==='you'&&b.id!==editing){edit(b);return;}
   setHint(`${room} is reserved on ${human(date)}${b.owner==='you'?' (your booking)':''}. Pick an Open night, or start from a different room.`);
   return;
  }
  setHint('');
  const sameRoom=form.roomNumber.trim().toLowerCase()===room.toLowerCase();
  if(sameRoom&&form.startDate&&date>form.startDate){
   const limit=nextReserved(room,form.startDate);
   if(limit&&date>=limit){setHint(`Can't extend to ${human(date)} — ${room} is reserved from ${human(limit)}. The latest night you can book is ${human(addDays(limit,-1))}.`);return;}
   setForm(f=>({...f,endDate:addDays(date,1)}));return;
  }
  setForm(f=>({roomNumber:room,startDate:date,endDate:addDays(date,1),purpose:editing?'':f.purpose}));
  if(editing)setEditing(null);
 }
 // first reserved date in this room on/after `from` (ignoring the booking being edited)
 function nextReserved(room,from){const after=bookings.filter(b=>b.id!==editing&&b.roomNumber===room&&b.endDate>from).map(b=>b.startDate>from?b.startDate:from).sort();return after[0]||null;}
 const limitDate=selRoom&&form.startDate?nextReserved(selRoom,form.startDate):null;
 const unreachable=(room,day)=>!!selRoom&&room===selRoom&&!!form.startDate&&!!limitDate&&day>=limitDate&&!occupied(room,day);
 function clearSelection(){setForm(f=>({...f,roomNumber:'',startDate:'',endDate:''}));setError('');setNotice('');setHint('');}
 const inRange=(room,day)=>!!selRoom&&room===selRoom&&!!form.startDate&&!!form.endDate&&day>=form.startDate&&day<form.endDate;
 const nights=form.startDate&&form.endDate&&form.endDate>form.startDate?Math.round((new Date(form.endDate)-new Date(form.startDate))/864e5):0;
 const selectionIssue=selRoom&&form.startDate&&form.endDate?issue(form,bookings,editing):'';
 // FIX #2: editing now scrolls to the form, focuses it, and the selected card is highlighted.
 function edit(row){if(row.owner!=='you')return;setHint('');setEditing(row.id);setForm({roomNumber:row.roomNumber,startDate:row.startDate,endDate:row.endDate,purpose:row.purpose});setError('');setNotice('');goTo('booking-form',true);}
 function stopEditing(){setEditing(null);setForm({...formEmpty});setError('');}
 function submit(e){e.preventDefault();setNotice('');const err=issue(form,bookings,editing);if(err){setError(err);return;}
  const payload={roomNumber:rooms.find(r=>r.toLowerCase()===form.roomNumber.trim().toLowerCase()),startDate:form.startDate,endDate:form.endDate,purpose:form.purpose.trim(),owner:'you'};
  if(editing){setBookings(bookings.map(b=>b.id===editing?{...b,...payload}:b));setNotice(`Booking updated: ${payload.roomNumber}, ${human(payload.startDate)} – ${human(payload.endDate)}.`);}
  else{setBookings([...bookings,{...payload,id:'b-'+Date.now()}]);setNotice(`Room reserved: ${payload.roomNumber}, ${human(payload.startDate)} – ${human(payload.endDate)}. It now appears under "Your bookings".`);}
  setForm({...formEmpty});setEditing(null);setError('');}
 function reset(){if(!confirmReset){setConfirmReset(true);return;}setConfirmReset(false);setHint('');setBookings(seed);setForm({...formEmpty});setEditing(null);setWeek('2026-11-09');setNotice('Example bookings restored.');setError('');setView('All rooms');}
 function check(){setNotice('');setError('');let e=issue(form,bookings,editing);if(e){setError(e);}else setNotice('No conflict detected for the selected dates.');}

 return <div className="room-app">
  <header className="topbar">
   <div className="mark"><span className="mark-sq">R</span><span><strong>room<span>grid</span></strong><small>Campus spaces</small></span></div>
   {/* FIX #7: nav holds only real navigation; Reset demo moved out and made deliberate */}
   <nav aria-label="Sections"><button className={tab==='Availability'?'selected':''} onClick={()=>showTab('Availability')}>Availability</button><button className={tab==='My bookings'?'selected':''} onClick={()=>showTab('My bookings')}>My bookings <span className="count">{myBookings.length}</span></button></nav>
   <div className="member"><button className={'reset-button'+(confirmReset?' confirm':'')} onClick={reset} title="Restore the example bookings and discard your changes">{confirmReset?'Click again to confirm reset':'Reset demo'}</button><span className="signed-in">Signed in as <strong>You</strong></span></div>
  </header>
  <main>
   <section className="intro"><div><span className="eyebrow">SPACES / RESERVATIONS</span><h1>Find room availability</h1><p>Review campus rooms, dates and existing reservations in one view.</p></div><div className="intro-summary"><span>ROOMS IN DIRECTORY</span><strong>{rooms.length.toString().padStart(2,'0')}</strong><span>CURRENT RESERVATIONS</span><strong>{bookings.length.toString().padStart(2,'0')}</strong></div></section>
   <div className="pagegrid">
    <section className="calendar-pane" id="availability">
     <div className="calendar-head"><div><span className="eyebrow">AVAILABILITY CALENDAR</span><h2>Rooms by day</h2></div><div className="weeknav"><button aria-label="Previous week" onClick={()=>setWeek(addDays(week,-7))}>←</button><strong>{human(week)} – {human(addDays(week,6))}</strong><button aria-label="Next week" onClick={()=>setWeek(addDays(week,7))}>→</button></div></div>
     <div className="calendar-controls"><label>Location <select value={view} onChange={e=>setView(e.target.value)}><option>All rooms</option>{rooms.map(r=><option key={r}>{r}</option>)}</select></label><span className="legend"><i className="booked"/> Reserved</span><span className="legend"><i className="mine"/> Your booking</span><span className="legend"><i className="free"/> Available</span></div>
     <div className={'selection-bar'+(hint?' bad':selRoom&&form.startDate?(selectionIssue?' bad':' good'):'')} aria-live="polite">
      {hint
       ? <><span>⚠ {hint}</span><span className="selection-actions"><button type="button" onClick={()=>setHint('')}>OK</button></span></>
       : !(selRoom&&form.startDate)
       ? <span>Click a day to start, then click the last night in the same room to select a range.</span>
       : <><span><strong>{selRoom}</strong> · {human(form.startDate)} – {form.endDate>form.startDate?human(form.endDate):'…'} ({nights} night{nights===1?'':'s'}) — {selectionIssue?`✗ ${selectionIssue}`:'✓ Available. Click a later day to extend, or confirm in the form.'}</span>
          <span className="selection-actions"><button type="button" onClick={()=>goTo('booking-form',true)}>Go to form →</button><button type="button" onClick={clearSelection}>Clear</button></span></>}
     </div>
     <div className="calendar-scroll"><div className="room-cal"><div className="corner">ROOM / DATE</div>{days.map(d=><div className="dayhead" key={d}><strong>{weekDay(d)}</strong><span>{human(d)}</span></div>)}{roomList.map(room=><React.Fragment key={room}><div className="roomname"><strong>{room}</strong><small>{roomInfo(room)}</small></div>{days.map(day=>{const b=occupied(room,day);const sel=inRange(room,day);return <button key={room+day} title={`${room}, ${day}: ${b?(b.owner==='you'?'Your booking — click to change it':'Reserved'):unreachable(room,day)?'Not reachable — a reservation is in the way':'Available'}`} aria-pressed={sel} className={'slot '+(b?'taken':'available')+(b&&b.owner==='you'?' mine':'')+(sel?' selected':'')+(sel&&b?' conflict':'')+(unreachable(room,day)?' unreachable':'')} onClick={()=>pick(room,day)}><span>{b?'Booked':'Open'}</span>{b&&<small>{b.owner==='you'?'Your booking':'Reserved'}</small>}</button>})}</React.Fragment>)}</div></div>
     <p className="calendar-note">Each cell is one night. Select a range above to check the whole stay at once.</p>
     <section id="my-reservations" className="reservations">
      <div className="reservations-head"><h2>Your bookings</h2><span>{myBookings.length} current records</span></div>
      <div className="reservations-list">
       {myBookings.map(b=><article key={b.id} className={'reservation'+(editing===b.id?' editing':'')}>
        <div className="room-chip">{b.roomNumber}</div>
        <div className="reservation-body"><strong>{human(b.startDate)} – {human(b.endDate)}</strong><small>{editing===b.id?'Editing in the form →':b.purpose||'No purpose entered'}</small></div>
        <div className="reservation-actions"><button onClick={()=>edit(b)} disabled={editing===b.id}>{editing===b.id?'Editing':'Change'}</button></div>
       </article>)}
       {myBookings.length===0&&<p>No reservations.</p>}
      </div>
     </section>
    </section>
    {/* FIX #4: the form is sticky on wide screens so it stays beside the calendar while scrolling */}
    <aside className={'booking-pane'+(editing?' is-editing':'')} id="booking-form">
     <div className="panel-tag"><span>{editing?'CHANGE A BOOKING':'BOOK A ROOM'}</span>{editing&&<span className="editing-badge">EDITING</span>}</div>
     <h2>{editing?'Change reservation':'Make a reservation'}</h2>
     {editingRow
      ? <p className="booking-description">You are editing <strong>{editingRow.roomNumber}</strong>, {human(editingRow.startDate)} – {human(editingRow.endDate)}. Adjust the fields and save, or cancel editing to leave it unchanged.</p>
      : <p className="booking-description">Use this panel to request a room for your study group, meeting or activity.</p>}
     {notice&&<div className="success" role="status">{notice}</div>}
     {error&&<div className="error" role="alert">{error}</div>}
     <form onSubmit={submit} noValidate>
      <label><span>Room number</span><input ref={roomInput} list="rooms" placeholder="e.g., B2-104" value={form.roomNumber} onChange={e=>setForm(f=>({...f,roomNumber:e.target.value}))}/><datalist id="rooms">{rooms.map(r=><option key={r} value={r}/>)}</datalist></label>
      <div className="date-pair"><label><span>Start date</span><input type="date" value={form.startDate} onChange={e=>setForm(f=>({...f,startDate:e.target.value}))}/></label><label><span>End date</span><input type="date" min={form.startDate?addDays(form.startDate,1):undefined} value={form.endDate} onChange={e=>setForm(f=>({...f,endDate:e.target.value}))}/></label></div>
      <label><span>Purpose / optional</span><textarea rows="4" placeholder="Meeting, group study..." value={form.purpose} onChange={e=>setForm(f=>({...f,purpose:e.target.value}))}/></label>
      <p className="helper">Start and end dates are required. Reservations cannot overlap existing bookings for the same room.</p>
      <button className="availability-check" type="button" onClick={check}>Check availability</button>
      <button className="reserve-button" type="submit">{editing?'Save changes':'Confirm booking'}</button>
      {editing&&<button className="cancel-edit" type="button" onClick={stopEditing}>Cancel editing (keep booking as it was)</button>}
     </form>
    </aside>
   </div>
  </main>
  <footer>ROOMGRID / Academic campus demo — local browser data only.</footer>
 </div>;
}
