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
function dayCount(start,end){return Math.round((new Date(`${end}T12:00:00Z`)-new Date(`${start}T12:00:00Z`))/864e5);}
// The stored end date is exclusive (check-out day). Users see the days they actually hold.
function stayLabel(start,end){
 const last=addDays(end,-1),n=dayCount(start,end);
 return `${start===last?human(start):`${human(start)} – ${human(last)}`} · ${n} day${n===1?'':'s'}`;
}
// Same rules as before; the conflict case now names the clashing booking.
function issue(form,bookings,id){
 if(!form.roomNumber.trim()||!form.startDate||!form.endDate)return 'Complete the room and both dates.';
 if(form.endDate<=form.startDate)return 'End date must follow start date.';
 const clash=bookings.find(b=>b.id!==id&&b.roomNumber.toLowerCase()===form.roomNumber.trim().toLowerCase()&&form.startDate<b.endDate&&form.endDate>b.startDate);
 if(clash)return `This room is already booked for some of those dates: ${clash.owner==='you'?'your booking':'reserved'} ${stayLabel(clash.startDate,clash.endDate)}.`;
 return '';
}
export default function App(){
 const [bookings,setBookings]=useState(read);
 const [week,setWeek]=useState('2026-11-09');
 const [view,setView]=useState('All rooms');
 const [form,setForm]=useState({...formEmpty});
 const [editing,setEditing]=useState(null);
 const [attempted,setAttempted]=useState(false);
 const [anchor,setAnchor]=useState(null);
 const [notice,setNotice]=useState('');
 const [tab,setTab]=useState('Availability');
 const formRef=useRef(null);
 useEffect(()=>localStorage.setItem(STORAGE,JSON.stringify(bookings)),[bookings]);
 const days=useMemo(()=>Array.from({length:7},(_,i)=>addDays(week,i)),[week]);
 const myBookings=bookings.filter(b=>b.owner==='you').sort((a,b)=>a.startDate.localeCompare(b.startDate));
 const roomList=view==='All rooms'?rooms:rooms.filter(r=>r===view);
 const editingRow=bookings.find(b=>b.id===editing);
 const occupied=(room,date)=>bookings.find(b=>b.id!==editing&&b.roomNumber===room&&date>=b.startDate&&date<b.endDate);
 const complete=form.roomNumber.trim()&&form.startDate&&form.endDate;
 const problem=issue(form,bookings,editing);
 const inSelection=(room,day)=>form.roomNumber.trim().toLowerCase()===room.toLowerCase()&&form.startDate&&day>=form.startDate&&(form.endDate>form.startDate?day<form.endDate:day===form.startDate);
 function focusForm(){revealForm();formRef.current?.focus({preventScroll:true});}
 function update(patch){setForm(f=>({...f,...patch}));setNotice('');}
 // First click picks the start day, a second click on a later day in the same row picks the last day.
 // Selecting days never leaves edit mode, so a change can be made straight from the calendar.
 function pick(room,date){
  const b=occupied(room,date);
  if(b){if(b.owner==='you')edit(b);return;}
  if(anchor&&anchor.room===room&&date>=anchor.date){update({endDate:addDays(date,1)});setAnchor(null);revealForm();}
  else{update({roomNumber:room,startDate:date,endDate:addDays(date,1)});setAnchor({room,date});}
 }
 // Only scroll when the form is off-screen (stacked layout) — never mid-selection.
 function revealForm(){const r=formRef.current?.getBoundingClientRect();if(r&&(r.top>window.innerHeight||r.bottom<0))formRef.current.scrollIntoView({behavior:'smooth',block:'start'});}
 function edit(row){if(row.owner!=='you')return;setEditing(row.id);setForm({roomNumber:row.roomNumber,startDate:row.startDate,endDate:row.endDate,purpose:row.purpose});setAttempted(false);setAnchor(null);setNotice('');setWeek(w=>row.startDate>=w&&row.startDate<addDays(w,7)?w:row.startDate);focusForm();}
 function clearForm(){setForm({...formEmpty});setEditing(null);setAttempted(false);setAnchor(null);}
 function submit(e){e.preventDefault();setNotice('');if(problem){setAttempted(true);return;}const payload={roomNumber:form.roomNumber.trim(),startDate:form.startDate,endDate:form.endDate,purpose:form.purpose.trim(),owner:'you'};
  const label=`${payload.roomNumber}, ${stayLabel(payload.startDate,payload.endDate)}`;
  if(editing){setBookings(bookings.map(b=>b.id===editing?{...b,...payload}:b));setNotice(`Booking updated: ${label}.`);}else{setBookings([...bookings,{...payload,id:'b-'+Date.now()}]);setNotice(`Room reserved: ${label}.`);}clearForm();}
 function reset(){setBookings(seed);clearForm();setWeek('2026-11-09');setNotice('Example bookings restored.');setView('All rooms');}
 const status=!complete&&!attempted
  ?{kind:'hint',text:'Pick a room and dates — availability is checked as you go.'}
  :problem?{kind:'error',text:problem}
  :{kind:'ok',text:`${form.roomNumber.trim()} is available ${stayLabel(form.startDate,form.endDate)}.`};
 return <div className="room-app"><header className="topbar"><div className="mark"><span className="mark-sq">R</span><span><strong>room<span>grid</span></strong><small>Campus spaces</small></span></div><nav><button className={tab==='Availability'?'selected':''} onClick={()=>setTab('Availability')}>Availability</button><button className={tab==='My bookings'?'selected':''} onClick={()=>{setTab('My bookings');document.getElementById('my-reservations')?.scrollIntoView({behavior:'smooth'});}}>My bookings</button><button onClick={reset}>Reset demo</button></nav><div className="member"><span>Student dashboard</span><div className="profile">YOU</div></div></header>
  <main><section className="intro"><div><span className="eyebrow">SPACES / RESERVATIONS</span><h1>Find room availability</h1><p>Review campus rooms, dates and existing reservations in one view.</p></div><div className="intro-summary"><span>ROOMS IN DIRECTORY</span><strong>{rooms.length.toString().padStart(2,'0')}</strong><span>CURRENT RESERVATIONS</span><strong>{bookings.length.toString().padStart(2,'0')}</strong></div></section>
   <div className="pagegrid"><section className="calendar-pane"><div className="calendar-head"><div><span className="eyebrow">AVAILABILITY CALENDAR</span><h2>Rooms by day</h2></div><div className="weeknav"><button aria-label="Previous week" onClick={()=>setWeek(addDays(week,-7))}>←</button><strong>{human(week)} – {human(addDays(week,6))}</strong><button aria-label="Next week" onClick={()=>setWeek(addDays(week,7))}>→</button></div></div>
    <div className="calendar-controls"><label>Location <select value={view} onChange={e=>setView(e.target.value)}><option>All rooms</option>{rooms.map(r=><option key={r}>{r}</option>)}</select></label><span className="legend"><i className="free"/> Available</span><span className="legend"><i className="booked"/> Reserved</span><span className="legend"><i className="mine"/> Yours</span><span className="legend"><i className="picked"/> Your selection</span></div>
    <p className="calendar-hint" aria-live="polite">{anchor?<>Start set to <strong>{anchor.room}, {human(anchor.date)}</strong>. Click the last day you need in the same row, or another day to start over.</>:<>Click a day to set the start, then click the last day you need. Click one of your bookings to change it.</>}</p>
    <div className="calendar-scroll"><div className="room-cal"><div className="corner">ROOM / DATE</div>{days.map(d=><div className="dayhead" key={d}><strong>{weekDay(d)}</strong><span>{human(d)}</span></div>)}{roomList.map(room=><React.Fragment key={room}><div className="roomname"><strong>{room}</strong><small>Study room · {room[0]}</small></div>{days.map(day=>{const b=occupied(room,day),mine=b&&b.owner==='you',sel=!b&&inSelection(room,day);
     const state=sel?(editing?'Your change':'Selected'):b?(mine?'Your booking':'Reserved'):'Open';
     return <button key={room+day} type="button" disabled={b&&!mine} aria-pressed={sel} title={`${room}, ${human(day)}: ${state}${mine?' — click to change':''}`} className={'slot '+(b?(mine?'mine':'taken'):'available')+(sel?' picked':'')} onClick={()=>pick(room,day)}><span>{state}</span>{mine&&<small>{b.purpose||'Click to change'}</small>}</button>})}</React.Fragment>)}</div></div>
    <section id="my-reservations" className="reservations"><div className="reservations-head"><h2>Your bookings</h2><span>{myBookings.length} current records</span></div><div className="reservations-list">{myBookings.map(b=><article key={b.id} className={'reservation'+(b.id===editing?' is-editing':'')}><div className="room-chip">{b.roomNumber}</div><div className="reservation-body"><strong>{stayLabel(b.startDate,b.endDate)}</strong><small>{b.purpose||'No purpose entered'}</small></div>{b.id===editing?<span className="editing-badge">Editing</span>:<button className="edit-button" onClick={()=>edit(b)} aria-label={`Change booking ${b.roomNumber}, ${stayLabel(b.startDate,b.endDate)}`}>Change</button>}</article>)}{myBookings.length===0&&<p>No reservations.</p>}</div></section></section>
    <aside className={'booking-pane'+(editing?' is-editing':'')} id="booking-form" ref={formRef} tabIndex={-1} aria-labelledby="form-title"><div className="panel-tag"><span>{editing?'CHANGE BOOKING':'BOOK A ROOM'}</span><span>FORM 01</span></div><h2 id="form-title">{editing?'Change reservation':'Make a reservation'}</h2>
     {editingRow?<div className="editing-banner"><span>Editing <strong>{editingRow.roomNumber}</strong>, {stayLabel(editingRow.startDate,editingRow.endDate)}</span><small>Change the fields or click new days in the calendar.</small></div>:<p className="booking-description">Use this panel to request a room for your study group, meeting or activity.</p>}
     {notice&&<div className="success" role="status">{notice}</div>}
     <form onSubmit={submit} noValidate><label><span>Room number</span><input list="rooms" placeholder="e.g., B2-104" value={form.roomNumber} onChange={e=>{update({roomNumber:e.target.value});setAnchor(null);}}/><datalist id="rooms">{rooms.map(r=><option key={r} value={r}/>)}</datalist></label><div className="date-pair"><label><span>Start date</span><input type="date" value={form.startDate} onChange={e=>{update({startDate:e.target.value});setAnchor(null);}}/></label><label><span>End date <em>(check-out)</em></span><input type="date" value={form.endDate} onChange={e=>{update({endDate:e.target.value});setAnchor(null);}}/></label></div>
      <div className={'live-status '+status.kind} role={status.kind==='error'&&attempted?'alert':'status'} aria-live="polite">{status.kind==='ok'?'✓ ':status.kind==='error'?'✕ ':''}{status.text}</div>
      <label><span>Purpose <em>(optional)</em></span><textarea rows="4" placeholder="Meeting, group study..." value={form.purpose} onChange={e=>update({purpose:e.target.value})}/></label><button className="reserve-button" type="submit">{editing?'Save changes':'Confirm booking'}</button>{editing&&<button className="cancel-edit" type="button" onClick={clearForm}>Cancel editing</button>}</form><div className="right-foot"><span>✦</span> Need a room for a group? Find an open date and submit your request.</div></aside></div>
  </main><footer>ROOMGRID / Academic campus demo — local browser data only.</footer>
 </div>;
}
