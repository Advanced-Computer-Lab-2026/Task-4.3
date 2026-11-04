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
function full(iso){return `${weekDay(iso)} ${human(iso)}`;}
function mondayOf(iso){const d=(new Date(`${iso}T12:00:00Z`).getUTCDay()+6)%7;return addDays(iso,-d);}
function dayCount(start,end){return Math.round((Date.parse(end)-Date.parse(start))/864e5);}
// End dates are exclusive, so the last occupied day is the day before endDate.
function span(start,end){const last=addDays(end,-1);const n=dayCount(start,end);return `${last===start?full(start):`${full(start)} – ${full(last)}`} (${n} day${n===1?'':'s'})`;}
function findRoom(text){const t=text.trim().toLowerCase();return rooms.find(r=>r.toLowerCase()===t)||'';}
// Returns null when valid, otherwise {field, message, clash?} so the UI can say exactly what is wrong and where.
function issue(form,bookings,id){
 if(!form.roomNumber.trim())return {field:'room',message:'Choose a room number.'};
 const room=findRoom(form.roomNumber);
 if(!room)return {field:'room',message:`"${form.roomNumber.trim()}" is not in the room directory. Pick a room from the list (e.g. B2-104).`};
 if(!form.startDate)return {field:'start',message:'Choose a start date.'};
 if(!form.endDate)return {field:'end',message:'Choose an end date.'};
 if(form.endDate<=form.startDate)return {field:'end',message:'End date must be after the start date. The end date is the day the room becomes free again.'};
 const clash=bookings.find(b=>b.id!==id&&b.roomNumber.toLowerCase()===room.toLowerCase()&&form.startDate<b.endDate&&form.endDate>b.startDate);
 if(clash)return {field:'dates',clash,message:`${room} is already ${clash.owner==='you'?'booked by you':'reserved'} for ${span(clash.startDate,clash.endDate)}. Choose days outside that range.`};
 return null;
}
export default function App(){
 const [bookings,setBookings]=useState(read);
 const [week,setWeek]=useState('2026-11-09');
 const [view,setView]=useState('All rooms');
 const [query,setQuery]=useState('');
 const [form,setForm]=useState({...formEmpty});
 const [editing,setEditing]=useState(null);
 const [error,setError]=useState(null);
 const [notice,setNotice]=useState('');
 const [anchor,setAnchor]=useState(null);
 const [tab,setTab]=useState('Availability');
 useEffect(()=>localStorage.setItem(STORAGE,JSON.stringify(bookings)),[bookings]);
 const days=useMemo(()=>Array.from({length:7},(_,i)=>addDays(week,i)),[week]);
 const myBookings=bookings.filter(b=>b.owner==='you').sort((a,b)=>a.startDate.localeCompare(b.startDate));
 const q=query.trim().toLowerCase().replace(/\s+/g,'');
 const roomList=rooms.filter(r=>(view==='All rooms'||r===view)&&r.toLowerCase().includes(q));
 const occupied=(room,date)=>bookings.find(b=>b.roomNumber===room&&date>=b.startDate&&date<b.endDate);
 const editingRow=bookings.find(b=>b.id===editing);
 const selRoom=findRoom(form.roomNumber);
 const hasRange=!!(form.startDate&&form.endDate&&form.endDate>form.startDate);
 const bad=f=>!!error&&(error.field===f||(error.field==='dates'&&(f==='start'||f==='end')));
 const scrollToForm=()=>document.getElementById('booking-form')?.scrollIntoView({behavior:'smooth',block:'start'});
 function showInCalendar(room,date){setWeek(mondayOf(date));if(view!=='All rooms'&&view!==room)setView(room);if(q&&!room.toLowerCase().includes(q))setQuery('');
  // Bring that room's row into view inside the scrollable calendar.
  requestAnimationFrame(()=>{const sc=document.querySelector('.calendar-scroll');const row=sc?.querySelector(`[data-room="${room}"]`);const head=sc?.querySelector('.corner');if(sc&&row)sc.scrollTo({top:row.offsetTop-(head?.offsetHeight||0),behavior:'smooth'});});}
 function setField(key,value){setForm(f=>({...f,[key]:value}));setError(null);setNotice('');setAnchor(null);}
 // Calendar picking: first click sets a one-day booking; a second click on a later open day in the same row extends it.
 // Picking never leaves edit mode, so changing your own booking from the calendar edits it instead of creating a duplicate.
 function pickDay(room,day){
  setNotice('');
  if(anchor&&anchor.room===room&&day>anchor.date){
   const next={...form,roomNumber:room,startDate:anchor.date,endDate:addDays(day,1)};
   const err=issue(next,bookings,editing);
   if(err){setError({...err,message:`Can't extend to ${full(day)}: ${err.message}`});return;}
   setForm(next);setAnchor(null);setError(null);return;
  }
  setForm(f=>({...f,roomNumber:room,startDate:day,endDate:addDays(day,1)}));
  setAnchor({room,date:day});setError(null);
 }
 function edit(row){if(row.owner!=='you')return;setEditing(row.id);setForm({roomNumber:row.roomNumber,startDate:row.startDate,endDate:row.endDate,purpose:row.purpose});setError(null);setNotice('');setAnchor(null);showInCalendar(row.roomNumber,row.startDate);scrollToForm();}
 function cancelEdit(){setEditing(null);setForm({...formEmpty});setError(null);setAnchor(null);setNotice('');}
 function submit(e){e.preventDefault();setNotice('');const err=issue(form,bookings,editing);if(err){setError(err);return;}const room=findRoom(form.roomNumber);const payload={roomNumber:room,startDate:form.startDate,endDate:form.endDate,purpose:form.purpose.trim(),owner:'you'};const when=span(form.startDate,form.endDate);
 if(editing){setBookings(bookings.map(b=>b.id===editing?{...b,...payload}:b));setNotice(`Booking updated: ${room}, ${when}.`);}else{setBookings([...bookings,{...payload,id:'b-'+Date.now()}]);setNotice(`Room reserved: ${room}, ${when}.`);}setForm({...formEmpty});setEditing(null);setError(null);setAnchor(null);}
 function reset(){setBookings(seed);setForm({...formEmpty});setEditing(null);setWeek('2026-11-09');setNotice('Example bookings restored.');setError(null);setView('All rooms');setQuery('');setAnchor(null);}
 function check(){setNotice('');setError(null);let e=issue(form,bookings,editing);if(e){setError(e);}else setNotice(`${selRoom} is free for ${span(form.startDate,form.endDate)}. Confirm to keep it.`);}
 function cell(room,day){
  const b=occupied(room,day);
  const blocked=b&&b.id!==editing;
  if(blocked&&b.owner!=='you')return <div key={room+day} className="slot taken" title={`${room}, ${full(day)}: reserved by someone else`}><span>Reserved</span><small>Not available</small></div>;
  if(blocked)return <button key={room+day} type="button" className={'slot mine'} title={`${room}, ${full(day)}: your booking. Click to change it.`} onClick={()=>edit(b)}><span>Your booking</span><small>Click to change</small></button>;
  const inSel=hasRange&&room===selRoom&&day>=form.startDate&&day<form.endDate;
  const isAnchor=anchor&&anchor.room===room&&anchor.date===day;
  return <button key={room+day} type="button" aria-pressed={inSel} title={`${room}, ${full(day)}: available`} className={'slot available'+(inSel?' selected':'')+(b?' original':'')+(isAnchor?' anchor':'')} onClick={()=>pickDay(room,day)}><span>{inSel?'Selected':'Open'}</span>{b?<small>Current dates</small>:isAnchor?<small>Start</small>:null}</button>;
 }
 return <div className="room-app"><header className="topbar"><div className="mark"><span className="mark-sq">R</span><span><strong>room<span>grid</span></strong><small>Campus spaces</small></span></div><nav><button className={tab==='Availability'?'selected':''} onClick={()=>setTab('Availability')}>Availability</button><button className={tab==='My bookings'?'selected':''} onClick={()=>{setTab('My bookings');document.getElementById('my-reservations')?.scrollIntoView({behavior:'smooth'});}}>My bookings</button><button onClick={reset}>Reset demo</button></nav><div className="member"><span>Student dashboard</span><div className="profile">YOU</div></div></header>
  <main><section className="intro"><div><span className="eyebrow">SPACES / RESERVATIONS</span><h1>Find room availability</h1><p>Review campus rooms, dates and existing reservations in one view.</p></div><div className="intro-summary"><span>ROOMS IN DIRECTORY</span><strong>{rooms.length.toString().padStart(2,'0')}</strong><span>CURRENT RESERVATIONS</span><strong>{bookings.length.toString().padStart(2,'0')}</strong></div></section>
   <div className="pagegrid"><section className="calendar-pane"><div className="calendar-head"><div><span className="eyebrow">AVAILABILITY CALENDAR</span><h2>Rooms by day</h2></div><div className="weeknav"><button aria-label="Previous week" onClick={()=>setWeek(addDays(week,-7))}>←</button><strong>{human(week)} – {human(addDays(week,6))}</strong><button aria-label="Next week" onClick={()=>setWeek(addDays(week,7))}>→</button></div></div>
    <div className="calendar-controls"><label className="room-search">Search <span className="search-box"><input type="search" placeholder="Room, e.g. B1 or 104" aria-label="Search rooms" value={query} onChange={e=>setQuery(e.target.value)}/>{query&&<button type="button" aria-label="Clear search" onClick={()=>setQuery('')}>×</button>}</span></label><span className="match-count">{roomList.length} of {rooms.length} rooms</span><label>Location<select value={view} onChange={e=>setView(e.target.value)}><option>All rooms</option>{rooms.map(r=><option key={r}>{r}</option>)}</select></label><span className="legend"><i className="free"/> Open</span><span className="legend"><i className="booked"/> Reserved</span><span className="legend"><i className="yours"/> Your booking</span><span className="legend"><i className="sel"/> Your selection</span><p>Click an open day to start, then a later open day in the same row to extend.</p></div>
    <div className="calendar-scroll"><div className="room-cal"><div className="corner">ROOM / DATE</div>{days.map(d=><div className="dayhead" key={d}><strong>{weekDay(d)}</strong><span>{human(d)}</span></div>)}{roomList.map(room=><React.Fragment key={room}><div className="roomname" data-room={room}><strong>{room}</strong><small>Study room · {room[0]}</small></div>{days.map(day=>cell(room,day))}</React.Fragment>)}{roomList.length===0&&<div className="no-rooms">No rooms match "{query.trim()}"{view!=='All rooms'?` in ${view}`:''}. <button type="button" onClick={()=>{setQuery('');setView('All rooms');}}>Show all rooms</button></div>}</div></div>
    {(hasRange&&selRoom)?<div className="selection-bar" role="status"><div><strong>{editing?'New dates':'Selected'}: {selRoom}</strong><span>{span(form.startDate,form.endDate)}</span>{anchor&&<small>Click a later open day in this row to extend, or continue.</small>}</div><button type="button" onClick={scrollToForm}>{editing?'Review change':'Continue to booking'}</button></div>:<p className="calendar-note">Reserved days can't be selected. Click one of your own bookings to change it.</p>}
    <section id="my-reservations" className="reservations"><div className="reservations-head"><h2>Your bookings</h2><span>{myBookings.length} current records</span></div><div className="reservations-list">{myBookings.map(b=><article key={b.id} className={'reservation'+(b.id===editing?' is-editing':'')}><div className="room-chip">{b.roomNumber}</div><div className="reservation-body"><strong>{span(b.startDate,b.endDate)}</strong><small>{b.purpose||'No purpose entered'}</small></div>{b.id===editing?<span className="editing-badge">Editing</span>:<button onClick={()=>edit(b)}>Change</button>}</article>)}{myBookings.length===0&&<p>No reservations.</p>}</div></section></section>
    <aside className="booking-pane" id="booking-form"><div className="panel-tag"><span>BOOK A ROOM</span><span>FORM 01</span></div><h2>{editing?'Change reservation':'Make a reservation'}</h2>{editingRow?<div className="edit-banner">You're changing <strong>{editingRow.roomNumber}</strong>, {span(editingRow.startDate,editingRow.endDate)}. Edit the fields or click open days in the calendar.</div>:<p className="booking-description">Pick open days in the calendar, or fill in the form yourself.</p>}{notice&&<div className="success" role="status">{notice}</div>}{error&&<div className="error" role="alert"><strong>{editing?"Couldn't save the change.":"Couldn't reserve this room."}</strong> {error.message}{error.clash&&<button type="button" className="link" onClick={()=>showInCalendar(error.clash.roomNumber,error.clash.startDate)}>Show in calendar</button>}</div>}<form onSubmit={submit} noValidate><label><span>Room number</span><input className={bad('room')?'invalid':''} aria-invalid={bad('room')} list="rooms" placeholder="e.g., B2-104" value={form.roomNumber} onChange={e=>setField('roomNumber',e.target.value)}/><datalist id="rooms">{rooms.map(r=><option key={r} value={r}/>)}</datalist></label><div className="date-pair"><label><span>Start date</span><input className={bad('start')?'invalid':''} aria-invalid={bad('start')} type="date" value={form.startDate} onChange={e=>setField('startDate',e.target.value)}/></label><label><span>End date <em>(not included)</em></span><input className={bad('end')?'invalid':''} aria-invalid={bad('end')} type="date" min={form.startDate?addDays(form.startDate,1):undefined} value={form.endDate} onChange={e=>setField('endDate',e.target.value)}/></label></div><p className="range-summary">{hasRange?<>Covers <strong>{span(form.startDate,form.endDate)}</strong>. The room is free again on {full(form.endDate)}.</>:'The end date is the day the room becomes free again. For one day, choose the next day as the end date.'}</p><label><span>Purpose / optional</span><textarea rows="3" placeholder="Meeting, group study..." value={form.purpose} onChange={e=>setForm(f=>({...f,purpose:e.target.value}))}/></label><p className="helper">Room and both dates are required. Bookings can't overlap other bookings for the same room.</p><button className="availability-check" type="button" onClick={check}>Check availability</button><button className="reserve-button" type="submit">{editing?'Save changes':'Confirm booking'}</button>{editing&&<button className="cancel-edit" type="button" onClick={cancelEdit}>Cancel editing</button>}</form><div className="right-foot"><span>✦</span> Need a room for a group? Find an open date and submit your request.</div></aside></div>
  </main><footer>ROOMGRID / Academic campus demo — local browser data only.</footer>
 </div>;
}
