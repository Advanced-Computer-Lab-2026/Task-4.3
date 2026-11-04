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
function canonical(room){return rooms.find(r=>r===room.trim().toUpperCase())||'';}
function monday(date){return addDays(date,-((new Date(`${date}T12:00:00Z`).getUTCDay()+6)%7));}
function issue(form,bookings,id){
 const errors={};
 if(!form.roomNumber.trim())errors.roomNumber='Enter a room number.';
 else if(!canonical(form.roomNumber))errors.roomNumber='Choose a room from the 18-room directory.';
 if(!form.startDate)errors.startDate='Enter a start date.';
 if(!form.endDate)errors.endDate='Enter an end date.';
 if(form.startDate&&form.endDate&&form.endDate<=form.startDate)errors.endDate='End date must be after start date.';
 if(!Object.keys(errors).length){const b=bookings.find(b=>b.id!==id&&canonical(b.roomNumber)===canonical(form.roomNumber)&&form.startDate<b.endDate&&form.endDate>b.startDate);if(b)errors.startDate=`${canonical(form.roomNumber)} is booked ${human(b.startDate)} \u2013 ${human(b.endDate)}. Choose different dates.`;}
 return errors;
}
export default function App(){
 const [bookings,setBookings]=useState(read);
 const [week,setWeek]=useState('2026-11-09');
 const [view,setView]=useState('All rooms');
 const [show,setShow]=useState('All rooms');
 const [form,setForm]=useState({...formEmpty});
 const [editing,setEditing]=useState(null);
 const [error,setError]=useState({});
 const [focused,setFocused]=useState('');
 useEffect(()=>{if(form.startDate)setWeek(monday(form.startDate));},[form.startDate]);
 const [notice,setNotice]=useState('');
 const [tab,setTab]=useState('Availability');
 const [bookingQuery,setBookingQuery]=useState('');
 useEffect(()=>localStorage.setItem(STORAGE,JSON.stringify(bookings)),[bookings]);
 const days=useMemo(()=>Array.from({length:7},(_,i)=>addDays(week,i)),[week]);
 const today=new Date();
 const todayISO=`${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;
 const myBookings=bookings.filter(b=>b.owner==='you').sort((a,b)=>a.startDate.localeCompare(b.startDate));
 const listedBookings=myBookings.filter(b=>`${b.roomNumber} ${b.purpose}`.toLowerCase().includes(bookingQuery.trim().toLowerCase())).sort((a,b)=>Number(a.endDate<=todayISO)-Number(b.endDate<=todayISO)||a.startDate.localeCompare(b.startDate));
 const nights=form.startDate&&form.endDate?Math.round((new Date(form.endDate)-new Date(form.startDate))/86400000):0;
 const occupied=(room,date)=>bookings.find(b=>canonical(b.roomNumber)===room&&date>=b.startDate&&date<b.endDate);
 const roomList=rooms.filter(room=>(view==='All rooms'||room===view)&&(show==='All rooms'||(show==='Available only'?days.some(day=>!occupied(room,day)):days.some(day=>occupied(room,day)?.owner==='you'))));
 function clearFilters(){setView('All rooms');setShow('All rooms');}
 function thisWeek(){const now=new Date();setWeek(monday(`${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`));}
 function weekLabel(){const end=addDays(week,6);const start=new Date(`${week}T12:00:00Z`);const finish=new Date(`${end}T12:00:00Z`);if(week.slice(0,7)===end.slice(0,7))return `${start.getUTCDate()}\u2013${human(end)} ${finish.getUTCFullYear()}`;if(start.getUTCFullYear()===finish.getUTCFullYear())return `${human(week)}\u2013${human(end)} ${finish.getUTCFullYear()}`;return `${human(week)} ${start.getUTCFullYear()}\u2013${human(end)} ${finish.getUTCFullYear()}`;}

 function focusBookings(){setTab('My bookings');const section=document.getElementById('my-reservations');section?.scrollIntoView({behavior:'smooth',block:'start'});section?.focus({preventScroll:true});}
 function focusForm(){setTab('Availability');requestAnimationFrame(()=>{document.getElementById('booking-form')?.scrollIntoView({behavior:'smooth',block:'start'});document.getElementById('roomNumber')?.focus({preventScroll:true});});}
 function validate(){const errors=issue(form,bookings,editing);setError(errors);const first=['roomNumber','startDate','endDate'].find(key=>errors[key]);if(first)document.getElementById(first)?.focus();return !first;}
 function pick(room,date){focusForm();setNotice('');setForm({roomNumber:room,startDate:date,endDate:addDays(date,1),purpose:''});setEditing(null);setError({});document.getElementById('booking-form')?.scrollIntoView({behavior:'smooth',block:'nearest'});}
 function edit(row){if(row.owner!=='you')return;focusForm();setWeek(monday(row.startDate));clearFilters();setEditing(row.id);setForm({roomNumber:canonical(row.roomNumber),startDate:row.startDate,endDate:row.endDate,purpose:row.purpose});setError({});setNotice('');}
 function submit(e){e.preventDefault();setNotice('');if(!validate())return;if(editing&&!bookings.some(b=>b.id===editing&&b.owner==='you'))return;const payload={roomNumber:canonical(form.roomNumber),startDate:form.startDate,endDate:form.endDate,purpose:form.purpose.trim(),owner:'you'};
 if(editing){setBookings(bookings.map(b=>b.id===editing?{...b,...payload}:b));setNotice(`Changed: ${payload.roomNumber}, ${human(payload.startDate)} \u2013 ${human(payload.endDate)}.`);}else{setBookings([...bookings,{...payload,id:'b-'+Date.now()}]);setNotice(`Created: ${payload.roomNumber}, ${human(payload.startDate)} \u2013 ${human(payload.endDate)}.`);}setBookingQuery('');setForm({...formEmpty});setEditing(null);setError({});}
 function reset(){if(!window.confirm('Reset demo? This deletes your saved changes and restores example bookings.'))return;setBookings(seed);setForm({...formEmpty});setEditing(null);setWeek('2026-11-09');setNotice('Example bookings restored.');setError({});clearFilters();setBookingQuery('');}
 function check(){setNotice('');if(validate())setNotice(`Available: ${canonical(form.roomNumber)}, ${human(form.startDate)} \u2013 ${human(form.endDate)}.`);}
 function fieldError(field){return error[field]&&<span id={`${field}-error`} className="field-error" role="alert">{error[field]}</span>;}
 return <div className="room-app"><header className="topbar"><div className="mark"><span className="mark-sq">R</span><span><strong>room<span>grid</span></strong><small>Campus spaces</small></span></div><nav aria-label="Main navigation"><button className={tab==='Availability'?'selected':''} onClick={()=>{setTab('Availability');document.getElementById('availability')?.scrollIntoView({behavior:'smooth'});}}>Availability</button><button className={tab==='My bookings'?'selected':''} onClick={focusBookings}>My bookings</button></nav><div className="member"><span>Student dashboard</span><div className="profile">YOU</div></div></header>
  <main><section className="intro"><div><span className="eyebrow">SPACES / RESERVATIONS</span><h1>Find room availability</h1><p>Review campus rooms, dates and existing reservations in one view.</p></div></section>

   <div className="pagegrid"><section className="calendar-pane" id="availability"><div className="calendar-head"><div><span className="eyebrow">AVAILABILITY CALENDAR</span><h2>Rooms by day</h2><p className="calendar-stats">{rooms.length} rooms &middot; {bookings.length} bookings &middot; {myBookings.length} yours</p></div><div className="weeknav"><button className="button-secondary" aria-label="Show this week" onClick={thisWeek}>This week</button><div className="week-control" role="group" aria-label="Visible week"><button aria-label="Previous week" onClick={()=>{setWeek(addDays(week,-7));setFocused('');}}>&larr;</button><strong className="week-label" aria-live="polite">{weekLabel()}</strong><button aria-label="Next week" onClick={()=>{setWeek(addDays(week,7));setFocused('');}}>&rarr;</button></div></div></div>
    <div className="calendar-controls"><div className="show-control" role="group" aria-label="Show rooms"><span>Show:</span><div className="segments">{['All rooms','Available only','My bookings'].map(option=><button key={option} aria-pressed={show===option} onClick={()=>{setShow(option);setFocused('');}}>{option}</button>)}</div></div><label>Room <select value={view} onChange={e=>{setView(e.target.value);setFocused('');}}><option>All rooms</option>{rooms.map(r=><option key={r}>{r}</option>)}</select></label>{(show!=='All rooms'||view!=='All rooms')&&<button className="button-quiet clear-filters" onClick={()=>{clearFilters();setFocused('');}}>Clear filters</button>}<div className="calendar-legend" aria-label="Calendar legend"><span className="legend"><i className="free" aria-hidden="true"/>Available</span><span className="legend"><i className="yours" aria-hidden="true"/>Yours</span></div></div>
    <div className="calendar-scroll" role="region" aria-label="Room availability by day" tabIndex="0"><div className={'room-cal'+(show==='Available only'?' available-view':'')}><div className="corner">Room / date</div>{days.map(d=><div className="dayhead" key={d}><strong>{weekDay(d)}</strong><span>{human(d)}</span></div>)}{roomList.map((room,i)=><React.Fragment key={room}>{(i===0||roomList[i-1][0]!==room[0])&&<div className="building-header"><span>Building {room[0]}</span></div>}<div className="roomname"><strong>{room}</strong></div>{days.map((day,index)=>{const b=occupied(room,day);const own=b?.owner==='you';const continuation=b&&index>0&&occupied(room,days[index-1])?.id===b.id;const status=b?own?'Yours':'Booked':'Open';const details=b?`${status} \u2013 ${b.purpose||'No purpose entered'} (${own?'You':'Another student'}), ${human(b.startDate)} \u2013 ${human(b.endDate)}`:'available';const description=`${room}, ${weekDay(day)} ${human(day)}: ${details}`;const selected=canonical(form.roomNumber)===room&&day>=form.startDate&&day<form.endDate;return <button key={room+day} title={description} aria-label={description} aria-disabled={b&&!own?true:undefined} onFocus={()=>setFocused(description)} onBlur={()=>setFocused('')} className={'slot '+(b?own?'own':'taken':'available')+(continuation?' continuation':'')+(selected?' range-selected':'')} onClick={()=>{if(own)edit(b);else if(!b)pick(room,day);}}><span className={continuation?'sr-only':undefined}>{status}</span></button>})}</React.Fragment>)}</div>{!roomList.length&&<p className="calendar-empty" role="status">No rooms match this week</p>}</div>
    <p className="calendar-note">Click an open day to fill the form or Yours to edit. Outlined: selected range.</p><p className="calendar-details" aria-live="polite">{focused||'Open days are available individually; your full date range is checked before saving.'}</p>
</section>
    <aside className="booking-pane" id="booking-form"><div className="panel-tag"><span>BOOK A ROOM</span></div><h2>{editing?'Change reservation':'Make a reservation'}</h2>{editing&&<p className="editing">Editing: {form.roomNumber} {form.startDate&&human(form.startDate)} &ndash; {form.endDate&&human(form.endDate)}</p>}<p className="booking-description">Use this panel to request a room for your study group, meeting or activity.</p>{notice&&<div className="success" role="status">{notice}</div>}<form onSubmit={submit} noValidate><label><span>Room number</span><input id="roomNumber" aria-invalid={!!error.roomNumber} aria-describedby={error.roomNumber?'roomNumber-error':undefined} onBlur={()=>{const room=canonical(form.roomNumber);if(room)setForm(f=>({...f,roomNumber:room}));}} list="rooms" placeholder="e.g., B2-104" value={form.roomNumber} onChange={e=>{setError({});setNotice('');setForm(f=>({...f,roomNumber:e.target.value}));}}/>{fieldError('roomNumber')}<datalist id="rooms">{rooms.map(r=><option key={r} value={r}/>)}</datalist></label><div className="date-pair"><label><span>Start date</span><input id="startDate" aria-invalid={!!error.startDate} aria-describedby={`date-hint ${error.startDate?'startDate-error':''}`} type="date" value={form.startDate} onChange={e=>{setError({});setNotice('');setForm(f=>({...f,startDate:e.target.value}));}}/>{fieldError('startDate')}</label><label><span>End date</span><input id="endDate" aria-invalid={!!error.endDate} aria-describedby={`date-hint ${error.endDate?'endDate-error':''}`} type="date" value={form.endDate} onChange={e=>{setError({});setNotice('');setForm(f=>({...f,endDate:e.target.value}));}}/>{fieldError('endDate')}</label></div><p className="date-summary" role="status">{form.startDate&&form.endDate&&form.endDate>form.startDate?`${nights} ${nights===1?'night':'nights'}: ${human(form.startDate)} \u2013 ${human(form.endDate)}, check-out ${human(form.endDate)}`:'Choose dates to see your stay length.'}</p><p id="date-hint" className="helper">The end date is the day you leave and is not booked.</p><label><span>Purpose / optional</span><textarea rows="5" placeholder="Meeting, group study..." value={form.purpose} onChange={e=>{setError({});setNotice('');setForm(f=>({...f,purpose:e.target.value}));}}/></label><p className="helper">Start and end dates are required. Reservations cannot overlap existing bookings for the same room.</p><button className="availability-check button-secondary" type="button" onClick={check}>Check availability</button><button className="reserve-button button-primary" type="submit">{editing?'Save booking':'Confirm booking'}</button>{editing&&<button className="cancel-edit button-quiet" type="button" onClick={()=>{setEditing(null);setForm({...formEmpty});setError({})}}>Cancel editing</button>}</form><div className="right-foot"><span>✦</span> Need a room for a group? Find an open date and submit your request.</div></aside></div>

  <section id="my-reservations" className="reservations" tabIndex="-1" aria-labelledby="my-bookings-heading">
   <div className="reservations-head"><div><h2 id="my-bookings-heading">My bookings</h2><p className="reservations-description">All your bookings, including past stays.</p></div><span className="booking-count" aria-live="polite">{myBookings.length} {myBookings.length===1?'booking':'bookings'}</span></div>
   {myBookings.length>0&&<div className="booking-list-controls"><label className="booking-search"><span className="sr-only">Filter by room or purpose</span><input type="search" placeholder="Filter by room or purpose" value={bookingQuery} onChange={e=>setBookingQuery(e.target.value)}/></label>{bookingQuery&&<button className="button-quiet" onClick={()=>setBookingQuery('')}>Clear search</button>}</div>}
   <div id="my-bookings-list" className="reservations-list" role="region" aria-label="All my bookings">{listedBookings.map(b=><article key={b.id} className="reservation"><strong className="room-chip">{canonical(b.roomNumber)}</strong><div className="reservation-info"><span className="reservation-dates">{human(b.startDate)} &ndash; {human(b.endDate)}</span><span className="reservation-purpose" title={b.purpose||'No purpose entered'}>{b.purpose||'No purpose entered'}</span></div><span className={'booking-status'+(b.endDate<=todayISO?' past':'')}>{b.endDate<=todayISO?'Past':b.startDate<=todayISO?'Current':'Upcoming'}</span><button className="button-primary" aria-label={`Change ${b.roomNumber}, ${human(b.startDate)} to ${human(b.endDate)}`} onClick={()=>edit(b)}>Change</button></article>)}{!listedBookings.length&&<p className="bookings-empty">{!myBookings.length?'You have no bookings yet. Pick an open day in the calendar to reserve a room.':'No bookings match your filter.'}</p>}</div>
  </section>
  <section className="demo-settings" aria-label="Demo settings"><p>Demo data is saved in this browser.</p><button className="button-quiet" onClick={reset}>Reset demo</button></section></main><footer>ROOMGRID / Academic campus demo — local browser data only.</footer>
 </div>;
}
