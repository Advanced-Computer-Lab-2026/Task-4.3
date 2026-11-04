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
const ISO=/^\d{4}-\d{2}-\d{2}$/;
function weekStart(iso){const t=new Date(`${iso}T12:00:00Z`);return addDays(iso,-((t.getUTCDay()+6)%7));}
function dayCount(start,end){return Math.round((Date.parse(end)-Date.parse(start))/86400000);}
// Map "b2-104 " to the directory spelling so saved bookings always appear in the calendar row.
function canonicalRoom(value){const v=value.trim();return rooms.find(r=>r.toLowerCase()===v.toLowerCase())||v;}
function conflictsFor(form,bookings,id){const room=form.roomNumber.trim().toLowerCase();return bookings.filter(b=>b.id!==id&&b.roomNumber.toLowerCase()===room&&form.startDate<b.endDate&&form.endDate>b.startDate).sort((a,b)=>a.startDate.localeCompare(b.startDate));}
function nextFree(bookings,room,from,id){let d=from;for(let i=0;i<400;i++){const b=bookings.find(x=>x.id!==id&&x.roomNumber.toLowerCase()===room.toLowerCase()&&d>=x.startDate&&d<x.endDate);if(!b)return d;d=b.endDate;}return d;}
function describe(b){return `${human(b.startDate)} – ${human(b.endDate)} by ${b.owner==='you'?'you':'another student'}${b.purpose?` (“${b.purpose}”)`:''}`;}
// Returns null when valid, otherwise {field, message} so the form can point at the exact input.
function issue(form,bookings,id){
 if(!form.roomNumber.trim())return {field:'roomNumber',message:'Enter a room number, or click an Open day in the calendar.'};
 if(!form.startDate||!ISO.test(form.startDate))return {field:'startDate',message:'Choose a start date (YYYY-MM-DD).'};
 if(!form.endDate||!ISO.test(form.endDate))return {field:'endDate',message:'Choose an end date (YYYY-MM-DD).'};
 if(form.endDate<=form.startDate)return {field:'endDate',message:`End date must be after the start date. Choose ${human(addDays(form.startDate,1))} or later.`};
 const clash=conflictsFor(form,bookings,id);
 if(clash.length){const room=canonicalRoom(form.roomNumber);return {field:'startDate',message:`${room} is already booked ${clash.map(describe).join('; ')}. It is free again from ${human(nextFree(bookings,room,clash[0].startDate,id))}.`};}
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
 const fields=useRef({});
 const heading=useRef(null);
 useEffect(()=>localStorage.setItem(STORAGE,JSON.stringify(bookings)),[bookings]);
 // When an edit starts, bring the form into view and move focus to its heading.
 useEffect(()=>{if(!editing)return;document.getElementById('booking-form')?.scrollIntoView({behavior:'smooth',block:'start'});heading.current?.focus({preventScroll:true});},[editing]);
 const days=useMemo(()=>Array.from({length:7},(_,i)=>addDays(week,i)),[week]);
 const myBookings=bookings.filter(b=>b.owner==='you').sort((a,b)=>a.startDate.localeCompare(b.startDate));
 const roomList=view==='All rooms'?rooms:rooms.filter(r=>r===view);
 const occupied=(room,date)=>bookings.find(b=>b.roomNumber===room&&date>=b.startDate&&date<b.endDate);
 const editingRow=bookings.find(b=>b.id===editing);
 const selRoom=canonicalRoom(form.roomNumber);
 const rangeOk=ISO.test(form.startDate)&&ISO.test(form.endDate)&&form.endDate>form.startDate;
 const preview=rangeOk&&form.roomNumber.trim()?conflictsFor(form,bookings,editing):null;
 function update(field,value){setForm(f=>({...f,[field]:value}));if(error)setError(null);}
  function pick(room,date){const b=occupied(room,date);setNotice('');
  if(b&&b.owner==='you'){edit(b);return;}
  if(b){setError({field:'',message:`${room} is already booked ${describe(b)}. Pick an Open day instead.`});return;}
  setError(null);
  // Second click in the same room adjusts the range instead of starting over.
  if(selRoom===room&&ISO.test(form.startDate)){if(date>=form.startDate)setForm(f=>({...f,endDate:addDays(date,1)}));else setForm(f=>({...f,startDate:date,endDate:f.endDate>date?f.endDate:addDays(date,1)}));}
  else{setForm({roomNumber:room,startDate:date,endDate:addDays(date,1),purpose:''});setEditing(null);}}
 function edit(row){if(row.owner!=='you')return;setEditing(row.id);setForm({roomNumber:row.roomNumber,startDate:row.startDate,endDate:row.endDate,purpose:row.purpose});setError(null);setNotice('');setWeek(weekStart(row.startDate));}
 function submit(e){e.preventDefault();setNotice('');const err=issue(form,bookings,editing);if(err){setError(err);fields.current[err.field]?.focus();return;}const payload={roomNumber:canonicalRoom(form.roomNumber),startDate:form.startDate,endDate:form.endDate,purpose:form.purpose.trim(),owner:'you'};const summary=`${payload.roomNumber}, ${human(payload.startDate)} – ${human(payload.endDate)}`;
 if(editing){setBookings(bookings.map(b=>b.id===editing?{...b,...payload}:b));setNotice(`Booking updated: ${summary}.`);}else{setBookings([...bookings,{...payload,id:'b-'+Date.now()}]);setNotice(`Room reserved: ${summary}. It is now listed under Your bookings.`);}setForm({...formEmpty});setEditing(null);setError(null);}
 function reset(){setBookings(seed);setForm({...formEmpty});setEditing(null);setWeek('2026-11-09');setNotice('Example bookings restored.');setError(null);setView('All rooms');}
 function check(){setNotice('');setError(null);let e=issue(form,bookings,editing);if(e){setError(e);fields.current[e.field]?.focus();}else setNotice(`${selRoom} is free from ${human(form.startDate)} to ${human(form.endDate)}. No conflict detected.`);}
 function cancelEdit(){setEditing(null);setForm({...formEmpty});setError(null);setNotice('Changes discarded. Your booking was not modified.');}
 const invalid=f=>error?.field===f?{'aria-invalid':true,'aria-describedby':'form-error',className:'invalid'}:{};
 return <div className="room-app"><header className="topbar"><div className="mark"><span className="mark-sq">R</span><span><strong>room<span>grid</span></strong><small>Campus spaces</small></span></div><nav><button className={tab==='Availability'?'selected':''} onClick={()=>setTab('Availability')}>Availability</button><button className={tab==='My bookings'?'selected':''} onClick={()=>{setTab('My bookings');document.getElementById('my-reservations')?.scrollIntoView({behavior:'smooth'});}}>My bookings</button><button onClick={reset}>Reset demo</button></nav><div className="member"><span>Student dashboard</span><div className="profile">YOU</div></div></header>
  <main><section className="intro"><div><span className="eyebrow">SPACES / RESERVATIONS</span><h1>Find room availability</h1><p>Review campus rooms, dates and existing reservations in one view.</p></div><div className="intro-summary"><span>ROOMS IN DIRECTORY</span><strong>{rooms.length.toString().padStart(2,'0')}</strong><span>CURRENT RESERVATIONS</span><strong>{bookings.length.toString().padStart(2,'0')}</strong></div></section>
   <div className="pagegrid"><section className="calendar-pane"><div className="calendar-head"><div><span className="eyebrow">AVAILABILITY CALENDAR</span><h2>Rooms by day</h2></div><div className="weeknav"><button aria-label="Previous week" onClick={()=>setWeek(addDays(week,-7))}>←</button><strong>{human(week)} – {human(addDays(week,6))}</strong><button aria-label="Next week" onClick={()=>setWeek(addDays(week,7))}>→</button></div></div>
    <div className="calendar-controls"><label>Location <select value={view} onChange={e=>setView(e.target.value)}><option>All rooms</option>{rooms.map(r=><option key={r}>{r}</option>)}</select></label><span className="legend"><i className="booked"/> Reserved</span><span className="legend"><i className="mine"/> Yours</span><span className="legend"><i className="free"/> Available</span><span className="legend"><i className="sel"/> Your selection</span><p>Click a start day, then an end day.</p></div>
    <div className="calendar-scroll"><div className="room-cal"><div className="corner">ROOM / DATE</div>{days.map(d=><div className="dayhead" key={d}><strong>{weekDay(d)}</strong><span>{human(d)}</span></div>)}{roomList.map((room,i)=><React.Fragment key={room}><div className="roomname"><strong>{room}</strong><small>Study room · {room[0]}</small></div>{days.map(day=>{const b=occupied(room,day);const mine=b&&b.owner==='you';const selected=rangeOk&&selRoom===room&&day>=form.startDate&&day<form.endDate;const clash=selected&&b&&b.id!==editing;const label=clash?'Conflict':b?(b.id===editing?'Editing':mine?'Yours':'Booked'):selected?'Selected':'Open';const sub=b?(mine?'Your booking':'Reserved'):selected?'Your selection':'';const hint=b?(mine?' — click to change':''):' — click to select';return <button key={room+day} title={`${room}, ${day}: ${b?'Reserved':'Available'}`} aria-label={`${room}, ${weekDay(day)} ${human(day)}: ${label}${sub&&sub!==label?`, ${sub}`:''}${hint}`} className={'slot '+(b?(mine?'mine':'taken'):'available')+(selected?' selected':'')+(clash?' clash':'')} onClick={()=>pick(room,day)}><span>{label}</span>{sub&&<small>{sub}</small>}</button>})}</React.Fragment>)}</div></div>
    <p className="calendar-note">Click an Open day to start a booking, then a later day in the same room to extend it. Your selection is outlined; red cells overlap an existing booking. Click one of your own bookings to change it. The form shows the selected dates. End dates are not included: a booking ending 11 Nov frees the room on 11 Nov.</p>
    <section id="my-reservations" className="reservations"><div className="reservations-head"><h2>Your bookings</h2><span>{myBookings.length} current records</span></div><div className="reservations-list">{myBookings.map(b=><article key={b.id} className={'reservation'+(b.id===editing?' editing':'')}><div className="room-chip">{b.roomNumber}</div><div className="reservation-body"><strong>{human(b.startDate)} – {human(b.endDate)}</strong><small>{b.purpose||'No purpose entered'}</small></div><button aria-label={`Change booking for ${b.roomNumber}, ${human(b.startDate)} – ${human(b.endDate)}`} onClick={()=>edit(b)}>{b.id===editing?'Editing…':'Change'}</button></article>)}{myBookings.length===0&&<p>No reservations.</p>}</div></section></section>
    <aside className="booking-pane" id="booking-form"><div className="panel-tag"><span>BOOK A ROOM</span><span>FORM 01</span></div><h2 ref={heading} tabIndex={-1}>{editing?'Change reservation':'Make a reservation'}</h2><p className="booking-description">Use this panel to request a room for your study group, meeting or activity.</p>{editingRow&&<div className="editing-banner"><strong>Editing your booking:</strong> {editingRow.roomNumber}, {human(editingRow.startDate)} – {human(editingRow.endDate)}. Save to apply your changes, or cancel to keep it as it is.</div>}{notice&&<div className="success" role="status">{notice}</div>}{error&&<div className="error" role="alert" id="form-error">{error.message}</div>}<form onSubmit={submit} noValidate><label><span>Room number</span><input ref={el=>fields.current.roomNumber=el} list="rooms" placeholder="e.g., B2-104" value={form.roomNumber} onChange={e=>update('roomNumber',e.target.value)} {...invalid('roomNumber')}/><datalist id="rooms">{rooms.map(r=><option key={r} value={r}/>)}</datalist></label><div className="date-pair"><label><span>Start date</span><input ref={el=>fields.current.startDate=el} type="date" value={form.startDate} onChange={e=>update('startDate',e.target.value)} {...invalid('startDate')}/></label><label><span>End date</span><input ref={el=>fields.current.endDate=el} type="date" min={ISO.test(form.startDate)?addDays(form.startDate,1):undefined} value={form.endDate} onChange={e=>update('endDate',e.target.value)} {...invalid('endDate')}/></label></div>{rangeOk&&<p className={'range-summary'+(preview?.length?' clash':'')} aria-live="polite">{dayCount(form.startDate,form.endDate)} day{dayCount(form.startDate,form.endDate)>1?'s':''}: {weekDay(form.startDate)} {human(form.startDate)}{dayCount(form.startDate,form.endDate)>1&&` to ${weekDay(addDays(form.endDate,-1))} ${human(addDays(form.endDate,-1))}`}{preview?.length?' (the end date itself is not included). Conflicts with an existing booking, see calendar.':<>; the room is free again on {human(form.endDate)}.{preview&&` No overlap with other bookings for ${selRoom}.`}</>}</p>}<label><span>Purpose / optional</span><textarea rows="5" placeholder="Meeting, group study..." value={form.purpose} onChange={e=>update('purpose',e.target.value)}/></label><p className="helper">Start and end dates are required. Reservations cannot overlap existing bookings for the same room.</p><button className="availability-check" type="button" onClick={check}>Check availability</button><button className="reserve-button" type="submit">{editing?'Save booking':'Confirm booking'}</button>{editing&&<button className="cancel-edit" type="button" onClick={cancelEdit}>Cancel editing</button>}</form><div className="right-foot"><span>✦</span> Need a room for a group? Find an open date and submit your request.</div></aside></div>
  </main><footer>ROOMGRID / Academic campus demo — local browser data only.</footer>
 </div>;
}
