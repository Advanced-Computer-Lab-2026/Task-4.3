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
const filtersEmpty={query:'',building:'All',scope:'All rooms'};
const buildings=[...new Set(rooms.map(r=>r[0]))];
function read(){try{let a=JSON.parse(localStorage.getItem(STORAGE));return Array.isArray(a)?a:seed;}catch{return seed;}}
function addDays(iso,days){const t=new Date(`${iso}T12:00:00Z`);t.setUTCDate(t.getUTCDate()+days);return t.toISOString().slice(0,10);}
function human(iso){return new Date(`${iso}T12:00:00Z`).toLocaleDateString('en-GB',{timeZone:'UTC',day:'numeric',month:'short'});}
function weekDay(iso){return new Date(`${iso}T12:00:00Z`).toLocaleDateString('en-GB',{timeZone:'UTC',weekday:'short'});}
function dayCount(start,end){return Math.round((new Date(`${end}T12:00:00Z`)-new Date(`${start}T12:00:00Z`))/864e5);}
// End dates are stored exclusive; show users the last day they actually hold the room.
function span(start,end){const last=addDays(end,-1),n=dayCount(start,end);return `${weekDay(start)} ${human(start)}${last!==start?` – ${weekDay(last)} ${human(last)}`:''} · ${n} day${n===1?'':'s'}`;}
function weekOf(iso){const d=new Date(`${iso}T12:00:00Z`);return addDays(iso,-((d.getUTCDay()+6)%7));}
function conflictWith(form,bookings,id){return bookings.find(b=>b.id!==id&&b.roomNumber.toLowerCase()===form.roomNumber.trim().toLowerCase()&&form.startDate<b.endDate&&form.endDate>b.startDate);}
// Returns {field,message} so the form can say exactly what is wrong and where.
function issue(form,bookings,id){
 if(!form.roomNumber.trim())return {field:'roomNumber',message:'Choose a room number.'};
 if(!rooms.some(r=>r.toLowerCase()===form.roomNumber.trim().toLowerCase()))return {field:'roomNumber',message:`"${form.roomNumber.trim()}" is not in the room directory. Pick a room from the list.`};
 if(!form.startDate)return {field:'startDate',message:'Choose a start date.'};
 if(!form.endDate)return {field:'endDate',message:'Choose an end date.'};
 if(form.endDate<=form.startDate)return {field:'endDate',message:'End date must be after the start date.'};
 const c=conflictWith(form,bookings,id);
 if(c)return {field:'startDate',message:`${c.roomNumber} is already reserved ${span(c.startDate,c.endDate)}${c.owner==='you'?' (by you)':''}. Choose different dates or another room.`};
 return null;
}
export default function App(){
 const [bookings,setBookings]=useState(read);
 const [week,setWeek]=useState('2026-11-09');
 const [filters,setFilters]=useState({...filtersEmpty});
 const [form,setForm]=useState({...formEmpty});
 const [editing,setEditing]=useState(null);
 const [error,setError]=useState(null);
 const [notice,setNotice]=useState('');
 const [anchor,setAnchor]=useState(null);
 const [tab,setTab]=useState('Availability');
 const fields={roomNumber:useRef(null),startDate:useRef(null),endDate:useRef(null)};
 useEffect(()=>localStorage.setItem(STORAGE,JSON.stringify(bookings)),[bookings]);
 const days=useMemo(()=>Array.from({length:7},(_,i)=>addDays(week,i)),[week]);
 const myBookings=bookings.filter(b=>b.owner==='you').sort((a,b)=>a.startDate.localeCompare(b.startDate));
 const occupied=(room,date)=>bookings.find(b=>b.roomNumber===room&&date>=b.startDate&&date<b.endDate);
 const validRange=form.startDate&&form.endDate&&form.endDate>form.startDate;
 const selected=(room,date)=>validRange&&form.roomNumber.trim().toLowerCase()===room.toLowerCase()&&date>=form.startDate&&date<form.endDate;
 const liveConflict=validRange&&form.roomNumber.trim()?conflictWith(form,bookings,editing):null;
 const freeFor=room=>!conflictWith({roomNumber:room,startDate:form.startDate,endDate:form.endDate},bookings,editing);
 const roomList=rooms.filter(r=>r.toLowerCase().includes(filters.query.trim().toLowerCase())&&(filters.building==='All'||r[0]===filters.building)&&(
  filters.scope==='Rooms I booked'?myBookings.some(b=>b.roomNumber===r):
  filters.scope==='Open this week'?days.some(d=>!occupied(r,d)):
  filters.scope==='Free for my dates'&&validRange?freeFor(r):true));
 const filtered=filters.query.trim()||filters.building!=='All'||filters.scope!=='All rooms';
 function setFilter(key,value){setFilters(f=>({...f,[key]:value}));}
 function update(field,value){setForm(f=>({...f,[field]:value}));setAnchor(null);if(error?.field===field)setError(null);setNotice('');}
 function scrollToForm(){document.getElementById('booking-form')?.scrollIntoView({behavior:'smooth',block:'start'});}
 // First click picks the start day; a second click on a later day in the same room extends the range.
 function pick(room,date){
  setError(null);setNotice('');
  if(anchor&&anchor.room===room&&date>=anchor.date){setForm(f=>({...f,endDate:addDays(date,1)}));setAnchor(null);scrollToForm();return;}
  setForm(f=>({...f,roomNumber:room,startDate:date,endDate:addDays(date,1),purpose:editing?f.purpose:''}));setAnchor({room,date});
 }
 function edit(row){if(row.owner!=='you')return;setEditing(row.id);setForm({roomNumber:row.roomNumber,startDate:row.startDate,endDate:row.endDate,purpose:row.purpose});setAnchor(null);setError(null);setNotice('');setWeek(weekOf(row.startDate));scrollToForm();setTimeout(()=>fields.startDate.current?.focus({preventScroll:true}),300);}
 function cancelEdit(){setEditing(null);setForm({...formEmpty});setAnchor(null);setError(null);setNotice('');}
 function submit(e){e.preventDefault();setNotice('');const err=issue(form,bookings,editing);if(err){setError(err);fields[err.field]?.current?.focus();return;}
  const room=rooms.find(r=>r.toLowerCase()===form.roomNumber.trim().toLowerCase());
  const payload={roomNumber:room,startDate:form.startDate,endDate:form.endDate,purpose:form.purpose.trim(),owner:'you'};
  if(editing){setBookings(bookings.map(b=>b.id===editing?{...b,...payload}:b));setNotice(`Booking updated: ${room}, ${span(form.startDate,form.endDate)}.`);}else{setBookings([...bookings,{...payload,id:'b-'+Date.now()}]);setNotice(`Room reserved: ${room}, ${span(form.startDate,form.endDate)}.`);}
  setForm({...formEmpty});setEditing(null);setAnchor(null);setError(null);}
 function reset(){if(!window.confirm('Reset the demo? This removes every booking you created or changed and restores the example records.'))return;setBookings(seed);setForm({...formEmpty});setEditing(null);setAnchor(null);setWeek('2026-11-09');setNotice('Example bookings restored.');setError(null);setFilters({...filtersEmpty});}
 function check(){setNotice('');setError(null);let e=issue(form,bookings,editing);if(e){setError(e);fields[e.field]?.current?.focus();}else setNotice(`${form.roomNumber.trim().toUpperCase()} is available ${span(form.startDate,form.endDate)}.`);}
 function cell(room,day){
  const b=occupied(room,day),mine=b&&b.owner==='you',isEdited=b&&b.id===editing,sel=selected(room,day);
  const clash=sel&&b&&!isEdited;
  const blocked=b&&!mine&&!isEdited;
  let label='Open',sub='',cls='available';
  if(isEdited){label='Editing';sub='Your booking';cls='editing';}
  else if(mine){label='Yours';sub=b.purpose||'Your booking';cls='mine';}
  else if(b){label='Booked';sub='Reserved';cls='taken';}
  const title=blocked?`${room}, ${human(day)}: reserved by someone else (${span(b.startDate,b.endDate)})`:mine&&!isEdited?`${room}, ${human(day)}: your booking. Click to change it.`:`${room}, ${human(day)}: available. Click to ${anchor&&anchor.room===room&&day>=anchor.date?'set as last day':'select as start day'}.`;
  return <button key={room+day} type="button" title={title} aria-label={title} disabled={blocked&&!clash} className={`slot ${cls}${sel?' selected':''}${clash?' clash':''}${anchor&&anchor.room===room&&anchor.date===day?' anchor':''}`} onClick={()=>mine&&!isEdited?edit(b):pick(room,day)}><span>{clash?'Conflict':sel?'Selected':label}</span>{(clash||(!sel&&sub))&&<small>{clash?'Already booked':sub}</small>}</button>;
 }
 const err=f=>error?.field===f;
 return <div className="room-app"><header className="topbar"><div className="mark"><span className="mark-sq">R</span><span><strong>room<span>grid</span></strong><small>Campus spaces</small></span></div><nav><button className={tab==='Availability'?'selected':''} onClick={()=>{setTab('Availability');document.getElementById('calendar')?.scrollIntoView({behavior:'smooth'});}}>Availability</button><button className={tab==='My bookings'?'selected':''} onClick={()=>{setTab('My bookings');document.getElementById('my-reservations')?.scrollIntoView({behavior:'smooth'});}}>My bookings ({myBookings.length})</button><button className="reset" onClick={reset}>Reset demo</button></nav><div className="member"><span>Student dashboard</span><div className="profile">YOU</div></div></header>
  <main><section className="intro"><div><span className="eyebrow">SPACES / RESERVATIONS</span><h1>Find room availability</h1><p>Review campus rooms, dates and existing reservations in one view.</p></div><div className="intro-summary"><span>ROOMS IN DIRECTORY</span><strong>{rooms.length.toString().padStart(2,'0')}</strong><span>CURRENT RESERVATIONS</span><strong>{bookings.length.toString().padStart(2,'0')}</strong></div></section>
   <section className="filterbar" aria-label="Filter rooms"><label><span>Search room</span><input type="search" placeholder="e.g., B2 or 104" value={filters.query} onChange={e=>setFilter('query',e.target.value)}/></label><label><span>Building</span><select value={filters.building} onChange={e=>setFilter('building',e.target.value)}><option value="All">All buildings</option>{buildings.map(b=><option key={b} value={b}>Building {b}</option>)}</select></label><label><span>Availability</span><select value={filters.scope} onChange={e=>setFilter('scope',e.target.value)}><option>All rooms</option><option>Open this week</option><option disabled={!validRange}>Free for my dates</option><option>Rooms I booked</option></select></label><div className="filter-result"><strong>{roomList.length}</strong> of {rooms.length} rooms{filters.scope==='Free for my dates'&&validRange&&<small>free {span(form.startDate,form.endDate)}</small>}{filtered&&<button type="button" onClick={()=>setFilters({...filtersEmpty})}>Clear filters</button>}</div></section>
   <div className="pagegrid"><section className="calendar-pane" id="calendar"><div className="calendar-head"><div><span className="eyebrow">AVAILABILITY CALENDAR</span><h2>Rooms by day</h2></div><div className="weeknav"><button aria-label="Previous week" onClick={()=>setWeek(addDays(week,-7))}>←</button><strong>{human(week)} – {human(addDays(week,6))}</strong><button aria-label="Next week" onClick={()=>setWeek(addDays(week,7))}>→</button></div></div>
    <div className="calendar-controls"><span className="legend"><i className="free"/> Open</span><span className="legend"><i className="booked"/> Reserved</span><span className="legend"><i className="yours"/> Yours</span><span className="legend"><i className="sel"/> Your selection</span></div>
    <p className={'calendar-hint'+(anchor?' active':'')} aria-live="polite">{anchor?<>Start set to <strong>{anchor.room}, {weekDay(anchor.date)} {human(anchor.date)}</strong>. Click a later open day in the same row to choose the last day, or continue in the form.</>:'Click an open day to start a booking, then click a later day in the same row to extend it. Click one of your bookings to change it.'}</p>
    <div className="calendar-scroll"><div className="room-cal"><div className="corner">ROOM / DATE</div>{days.map(d=><div className="dayhead" key={d}><strong>{weekDay(d)}</strong><span>{human(d)}</span></div>)}{roomList.map(room=><React.Fragment key={room}><div className="roomname"><strong>{room}</strong><small>Study room · {room[0]}</small></div>{days.map(day=>cell(room,day))}</React.Fragment>)}</div>{roomList.length===0&&<p className="empty-filter">No rooms match these filters. <button type="button" onClick={()=>setFilters({...filtersEmpty})}>Clear filters</button></p>}</div>
    <section id="my-reservations" className="reservations"><div className="reservations-head"><h2>Your bookings</h2><span>{myBookings.length} current records</span></div><div className="reservations-list">{myBookings.map(b=><article key={b.id} className={'reservation'+(b.id===editing?' is-editing':'')}><div className="room-chip">{b.roomNumber}</div><div className="reservation-body"><strong>{span(b.startDate,b.endDate)}</strong><small>{b.purpose||'No purpose entered'}</small></div>{b.id===editing?<span className="editing-badge">Editing</span>:<button onClick={()=>edit(b)} aria-label={`Change booking for ${b.roomNumber}, ${span(b.startDate,b.endDate)}`}>Change</button>}</article>)}{myBookings.length===0&&<p>No reservations.</p>}</div></section></section>
    <aside className={'booking-pane'+(editing?' editing':'')} id="booking-form"><div className="panel-tag"><span>{editing?'EDITING YOUR BOOKING':'BOOK A ROOM'}</span><span>FORM 01</span></div><h2>{editing?'Change reservation':'Make a reservation'}</h2><p className="booking-description">{editing?'Adjust the room or dates below, then save. Your other bookings are not affected.':'Pick days on the calendar or fill in the form to request a room for your study group, meeting or activity.'}</p>{notice&&<div className="success" role="status">{notice}</div>}{error&&<div className="error" role="alert"><strong>{editing?'Could not save changes.':'Could not reserve.'}</strong> {error.message}</div>}<form onSubmit={submit} noValidate><label><span>Room number</span><input ref={fields.roomNumber} list="rooms" placeholder="e.g., B2-104" aria-invalid={err('roomNumber')} value={form.roomNumber} onChange={e=>update('roomNumber',e.target.value)}/><datalist id="rooms">{rooms.map(r=><option key={r} value={r}/>)}</datalist></label><div className="date-pair"><label><span>Start date</span><input ref={fields.startDate} type="date" aria-invalid={err('startDate')} value={form.startDate} onChange={e=>update('startDate',e.target.value)}/></label><label><span>End date <em>(not included)</em></span><input ref={fields.endDate} type="date" aria-invalid={err('endDate')} min={form.startDate?addDays(form.startDate,1):undefined} value={form.endDate} onChange={e=>update('endDate',e.target.value)}/></label></div>
     {validRange&&form.roomNumber.trim()&&<div className={'summary'+(liveConflict?' warn':'')} aria-live="polite">{liveConflict?<>Overlaps an existing booking ({span(liveConflict.startDate,liveConflict.endDate)}). Choose other dates.</>:<>You'll hold <strong>{form.roomNumber.trim().toUpperCase()}</strong>: {span(form.startDate,form.endDate)}. The room is free again on {human(form.endDate)}.</>}</div>}
     <label><span>Purpose / optional</span><textarea rows="4" placeholder="Meeting, group study..." value={form.purpose} onChange={e=>update('purpose',e.target.value)}/></label><p className="helper">The end date is the day you hand the room back, so it is not part of the booking. Reservations cannot overlap existing bookings for the same room.</p><button className="availability-check" type="button" onClick={check}>Check availability</button><button className="reserve-button" type="submit">{editing?'Save changes':'Confirm booking'}</button>{editing&&<button className="cancel-edit" type="button" onClick={cancelEdit}>Cancel editing</button>}</form><div className="right-foot"><span>✦</span> Need a room for a group? Find an open date and submit your request.</div></aside></div>
  </main><footer>ROOMGRID / Academic campus demo — local browser data only.</footer>
 </div>;
}
