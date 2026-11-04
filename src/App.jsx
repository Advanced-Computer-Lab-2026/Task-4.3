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
function nights(a,b){return Math.round((new Date(`${b}T12:00:00Z`)-new Date(`${a}T12:00:00Z`))/864e5);}
// Two ranges overlap when each starts before the other ends (end dates are exclusive).
function clashes(b,room,start,end,id){return b.id!==id&&b.roomNumber.toLowerCase()===room.toLowerCase()&&start<b.endDate&&end>b.startDate;}

// UX FIX 1: validation now says WHAT is wrong and WHERE (per field), and names the conflicting booking.
function validate(form,bookings,id){
 const fields={};
 const room=form.roomNumber.trim();
 if(!room)fields.roomNumber='Enter a room number, for example B2-104.';
 if(!form.startDate)fields.startDate='Choose a start date.';
 if(!form.endDate)fields.endDate='Choose an end date.';
 if(form.startDate&&form.endDate&&form.endDate<=form.startDate)fields.endDate='End date must be after the start date.';
 const valid=Object.keys(fields).length===0;
 const conflict=valid?bookings.find(b=>clashes(b,room,form.startDate,form.endDate,id))||null:null;
 return {fields,conflict,valid,ok:valid&&!conflict};
}
// Same length of stay, moved to the nearest free slot in the same room (looks up to 60 days ahead).
function suggestDates(form,bookings,id){
 const len=nights(form.startDate,form.endDate);
 for(let i=1;i<=60;i++){const s=addDays(form.startDate,i),e=addDays(s,len);
  if(!bookings.some(b=>clashes(b,form.roomNumber.trim(),s,e,id)))return {startDate:s,endDate:e};}
 return null;
}
// Other rooms that are free for exactly the requested dates.
function freeRooms(form,bookings,id){
 return rooms.filter(r=>r.toLowerCase()!==form.roomNumber.trim().toLowerCase()&&!bookings.some(b=>clashes(b,r,form.startDate,form.endDate,id)));
}
const fieldOrder=['roomNumber','startDate','endDate'];

export default function App(){
 const [bookings,setBookings]=useState(read);
 const [week,setWeek]=useState('2026-11-09');
 const [view,setView]=useState('All rooms');
 const [form,setForm]=useState({...formEmpty});
 const [editing,setEditing]=useState(null);
 const [attempted,setAttempted]=useState(false);
 const [notice,setNotice]=useState('');
 const [tab,setTab]=useState('Availability');
 const [flash,setFlash]=useState(false);
 useEffect(()=>localStorage.setItem(STORAGE,JSON.stringify(bookings)),[bookings]);
 const days=useMemo(()=>Array.from({length:7},(_,i)=>addDays(week,i)),[week]);
 const myBookings=bookings.filter(b=>b.owner==='you').sort((a,b)=>a.startDate.localeCompare(b.startDate));
 const roomList=view==='All rooms'?rooms:rooms.filter(r=>r===view);
 const occupied=(room,date)=>bookings.find(b=>b.roomNumber===room&&date>=b.startDate&&date<b.endDate);
 const result=useMemo(()=>validate(form,bookings,editing),[form,bookings,editing]);
 const fields=attempted?result.fields:{};
 const hasFieldErrors=Object.keys(fields).length>0;
 const alt=useMemo(()=>result.conflict?{dates:suggestDates(form,bookings,editing),rooms:freeRooms(form,bookings,editing)}:null,[result.conflict,form,bookings,editing]);
 const editingRow=editing?bookings.find(b=>b.id===editing):null;
 const formRoom=form.roomNumber.trim().toLowerCase();

 function update(patch){setNotice('');setForm(f=>({...f,...patch}));}
 function changeStart(v){setNotice('');setForm(f=>({...f,startDate:v,endDate:v&&(!f.endDate||f.endDate<=v)?addDays(v,1):f.endDate}));}
 function scrollToForm(){document.getElementById('booking-form')?.scrollIntoView({behavior:'smooth',block:'nearest'});setFlash(true);setTimeout(()=>setFlash(false),1200);}
 function focusField(id){setTimeout(()=>document.getElementById('f-'+id)?.focus({preventScroll:false}),0);}
 function pick(room,date){setForm({roomNumber:room,startDate:date,endDate:addDays(date,1),purpose:''});setEditing(null);setAttempted(false);setNotice('');scrollToForm();}
 function edit(row){if(row.owner!=='you')return;setEditing(row.id);setForm({roomNumber:row.roomNumber,startDate:row.startDate,endDate:row.endDate,purpose:row.purpose});setAttempted(false);setNotice('');scrollToForm();focusField('roomNumber');}
 function submit(e){
  e.preventDefault();setNotice('');
  if(!result.ok){setAttempted(true);focusField(fieldOrder.find(k=>result.fields[k])||'startDate');return;}
  const room=rooms.find(r=>r.toLowerCase()===formRoom)||form.roomNumber.trim();
  const payload={roomNumber:room,startDate:form.startDate,endDate:form.endDate,purpose:form.purpose.trim(),owner:'you'};
  if(editing){setBookings(bookings.map(b=>b.id===editing?{...b,...payload}:b));setNotice(`Booking updated: ${room}, ${human(payload.startDate)} – ${human(payload.endDate)}.`);}
  else{setBookings([...bookings,{...payload,id:'b-'+Date.now()}]);setNotice(`Room reserved: ${room}, ${human(payload.startDate)} – ${human(payload.endDate)}.`);}
  setWeek(w=>(payload.startDate<w||payload.startDate>=addDays(w,7))?payload.startDate:w);
  setForm({...formEmpty});setEditing(null);setAttempted(false);
 }
 function reset(){setBookings(seed);setForm({...formEmpty});setEditing(null);setWeek('2026-11-09');setNotice('Example bookings restored.');setAttempted(false);setView('All rooms');}
 function check(){
  setNotice('');setAttempted(true);
  if(result.ok)setNotice('No conflict detected for the selected dates.');
  else focusField(fieldOrder.find(k=>result.fields[k])||'startDate');
 }
 function cancelEdit(){setEditing(null);setForm({...formEmpty});setAttempted(false);setNotice('');}
 const err=(k)=>fields[k]?<span className="field-error" id={'e-'+k}>{fields[k]}</span>:null;
 const inv=(k)=>({id:'f-'+k,'aria-invalid':fields[k]?'true':undefined,'aria-describedby':fields[k]?'e-'+k:undefined});

 return <div className="room-app"><header className="topbar"><div className="mark"><span className="mark-sq">R</span><span><strong>room<span>grid</span></strong><small>Campus spaces</small></span></div><nav><button className={tab==='Availability'?'selected':''} onClick={()=>{setTab('Availability');window.scrollTo({top:0,behavior:'smooth'});}}>Availability</button><button className={tab==='My bookings'?'selected':''} onClick={()=>{setTab('My bookings');document.getElementById('my-reservations')?.scrollIntoView({behavior:'smooth'});}}>My bookings</button><button onClick={reset}>Reset demo</button></nav><div className="member"><span>Student dashboard</span><div className="profile">YOU</div></div></header>
  <main><section className="intro"><div><span className="eyebrow">SPACES / RESERVATIONS</span><h1>Find room availability</h1><p>Review campus rooms, dates and existing reservations in one view.</p></div><div className="intro-summary"><span>ROOMS IN DIRECTORY</span><strong>{rooms.length.toString().padStart(2,'0')}</strong><span>CURRENT RESERVATIONS</span><strong>{bookings.length.toString().padStart(2,'0')}</strong></div></section>
   <div className="pagegrid"><section className="calendar-pane"><div className="calendar-head"><div><span className="eyebrow">AVAILABILITY CALENDAR</span><h2>Rooms by day</h2></div><div className="weeknav"><button aria-label="Previous week" onClick={()=>setWeek(addDays(week,-7))}>←</button><strong>{human(week)} – {human(addDays(week,6))}</strong><button aria-label="Next week" onClick={()=>setWeek(addDays(week,7))}>→</button></div></div>
    <div className="calendar-controls"><label>Location <select value={view} onChange={e=>setView(e.target.value)}><option>All rooms</option>{rooms.map(r=><option key={r}>{r}</option>)}</select></label><span className="legend"><i className="available-key"/> Open</span><span className="legend"><i className="booked"/> Booked by others</span><span className="legend"><i className="mine-key"/> Your booking</span><span className="legend"><i className="picked-key"/> Selected in form</span><p>Click an open day to start a booking, or your own booking to change it.</p></div>
    <div className="calendar-scroll"><div className="room-cal"><div className="corner">ROOM / DATE</div>{days.map(d=><div className="dayhead" key={d}><strong>{weekDay(d)}</strong><span>{human(d)}</span></div>)}{roomList.map((room)=><React.Fragment key={room}><div className="roomname"><strong>{room}</strong><small>Study room · {room[0]}</small></div>{days.map(day=>{
      const b=occupied(room,day);const mine=b&&b.owner==='you';
      // UX FIX 2: cells now show who/what/until-when, others' bookings are not clickable, the form selection is highlighted.
      const sel=formRoom===room.toLowerCase()&&!!form.startDate&&!!form.endDate&&day>=form.startDate&&day<form.endDate;
      const label=`${room}, ${weekDay(day)} ${human(day)}: `+(b?(mine?`your booking until ${human(b.endDate)}. Select to change it.`:`booked by another student until ${human(b.endDate)}. Not available.`):'open. Select to start a booking.')+(sel?' Currently selected in the form.':'');
      return <button type="button" key={room+day} title={label} aria-label={label} aria-pressed={sel} aria-disabled={b&&!mine?'true':undefined} className={'slot '+(b?(mine?'mine':'taken'):'available')+(sel?' picked':'')} onClick={()=>{if(b){if(mine)edit(b);}else pick(room,day);}}><span>{b?(mine?'Yours':'Booked'):(sel?'Selected':'Open')}</span>{b&&<small>until {human(b.endDate)}</small>}</button>})}</React.Fragment>)}</div></div>
    <p className="calendar-note">Cells show individual dates. Reservations may span several dates; a day marked "Open" does not guarantee the full range you choose will be available. The form below tells you straight away if your dates clash.</p>
    <section id="my-reservations" className="reservations"><div className="reservations-head"><h2>Your bookings</h2><span>{myBookings.length} current records</span></div><div className="reservations-list">{myBookings.map(b=><article key={b.id} className={'reservation'+(editing===b.id?' is-editing':'')}><div className="room-chip">{b.roomNumber}</div><div className="reservation-body"><strong>{human(b.startDate)} – {human(b.endDate)}</strong><small>{editing===b.id?'Editing in the form':(b.purpose||'No purpose entered')}</small></div><button type="button" aria-label={`Change booking ${b.roomNumber}, ${human(b.startDate)} to ${human(b.endDate)}`} onClick={()=>edit(b)}>Change</button></article>)}{myBookings.length===0&&<p>No reservations.</p>}</div></section></section>
    <aside className={'booking-pane'+(flash?' flash':'')} id="booking-form"><div className="panel-tag"><span>BOOK A ROOM</span><span>FORM 01</span></div><h2>{editing?'Change reservation':'Make a reservation'}</h2>
     {editingRow?<div className="editing-banner">Editing your booking for <strong>{editingRow.roomNumber}</strong>, {human(editingRow.startDate)} – {human(editingRow.endDate)}. Your own booking is ignored when checking for clashes.</div>:<p className="booking-description">Use this panel to request a room for your study group, meeting or activity.</p>}
     <div aria-live="polite">{notice&&<div className="success" role="status">{notice}</div>}</div>
     {attempted&&hasFieldErrors&&<div className="error" role="alert">Reservation not saved. Please fix the {Object.keys(fields).length===1?'highlighted field':'highlighted fields'} below.</div>}
     <form onSubmit={submit} noValidate><label><span>Room number <em>required</em></span><input list="rooms" placeholder="e.g., B2-104" value={form.roomNumber} onChange={e=>update({roomNumber:e.target.value})} {...inv('roomNumber')}/>{err('roomNumber')}<datalist id="rooms">{rooms.map(r=><option key={r} value={r}/>)}</datalist></label>
      <div className="date-pair"><label><span>Start date <em>required</em></span><input type="date" value={form.startDate} onChange={e=>changeStart(e.target.value)} {...inv('startDate')}/>{err('startDate')}</label><label><span>End date <em>required</em></span><input type="date" min={form.startDate?addDays(form.startDate,1):undefined} value={form.endDate} onChange={e=>update({endDate:e.target.value})} {...inv('endDate')}/>{err('endDate')}</label></div>
      {result.ok&&<div className="live ok" role="status">✓ {form.roomNumber.trim()} is free for {nights(form.startDate,form.endDate)} {nights(form.startDate,form.endDate)===1?'night':'nights'} ({human(form.startDate)} – {human(form.endDate)}).</div>}
      {result.conflict&&<div className="live conflict" role={attempted?'alert':'status'}><strong>{form.roomNumber.trim()} is already booked {human(result.conflict.startDate)} – {human(result.conflict.endDate)}</strong> {result.conflict.owner==='you'?'(by you).':'(by another student).'}
       {alt&&alt.dates&&<div className="alt"><span>Nearest free dates, same length:</span><button type="button" onClick={()=>update({startDate:alt.dates.startDate,endDate:alt.dates.endDate})}>{human(alt.dates.startDate)} – {human(alt.dates.endDate)}</button></div>}
       {alt&&alt.rooms.length>0&&<div className="alt"><span>Free on your dates:</span>{alt.rooms.slice(0,5).map(r=><button type="button" key={r} onClick={()=>update({roomNumber:r})}>{r}</button>)}{alt.rooms.length>5&&<em>+{alt.rooms.length-5} more</em>}</div>}
       {alt&&!alt.dates&&alt.rooms.length===0&&<div className="alt"><span>No free alternatives found. Try different dates.</span></div>}
      </div>}
      <label><span>Purpose / optional</span><textarea rows="4" placeholder="Meeting, group study..." value={form.purpose} onChange={e=>update({purpose:e.target.value})}/></label><p className="helper">Start and end dates are required. Reservations cannot overlap existing bookings for the same room. The end date is the day you leave, so it is not counted as booked.</p><button className="availability-check" type="button" onClick={check}>Check availability</button><button className="reserve-button" type="submit">{editing?'Save booking':'Confirm booking'}</button>{editing&&<button className="cancel-edit" type="button" onClick={cancelEdit}>Cancel editing</button>}</form><div className="right-foot"><span>✦</span> Need a room for a group? Find an open date and submit your request.</div></aside></div>
  </main><footer>ROOMGRID / Academic campus demo — local browser data only.</footer>
 </div>;
}
