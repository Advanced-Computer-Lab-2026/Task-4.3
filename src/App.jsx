import { addDays, startOfWeek, localToday, human, changeStart, isDate } from './dates.js';
import { issue } from './booking.js';
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
function weekDay(iso){return new Date(`${iso}T12:00:00Z`).toLocaleDateString('en-GB',{timeZone:'UTC',weekday:'short'});}
export default function App(){
 const [bookings,setBookings]=useState(read);
 const [week,setWeek]=useState(()=>startOfWeek(localToday()));
 const [view,setView]=useState('All rooms');
 const [building,setBuilding]=useState('All buildings');
 const [form,setForm]=useState({...formEmpty});
 const [editing,setEditing]=useState(null);
 const [error,setError]=useState('');
 const [notice,setNotice]=useState('');
 const [tab,setTab]=useState('Availability');
 const [selectedBooking,setSelectedBooking]=useState(null);
 const [resetPending,setResetPending]=useState(false);
 function showForm(){requestAnimationFrame(()=>{const heading=document.getElementById('form-heading');heading?.focus({preventScroll:true});heading?.scrollIntoView({behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'start'});});}
 useEffect(()=>localStorage.setItem(STORAGE,JSON.stringify(bookings)),[bookings]);
 const days=useMemo(()=>Array.from({length:7},(_,i)=>addDays(week,i)),[week]);
 const myBookings=bookings.filter(b=>b.owner==='you').sort((a,b)=>a.startDate.localeCompare(b.startDate));
 const buildingRooms=building==='All buildings'?rooms:rooms.filter(room=>room.startsWith(building));
 const roomList=view==='All rooms'?buildingRooms:buildingRooms.filter(room=>room===view);
 const today=localToday();
 const selectedDay=(room,day)=>form.roomNumber.trim().toUpperCase()===room&&form.startDate&&form.endDate&&day>=form.startDate&&day<form.endDate;
 const occupied=(room,date)=>bookings.find(b=>b.roomNumber===room&&date>=b.startDate&&date<b.endDate);
 function pick(room,date){setForm({roomNumber:room,startDate:date,endDate:addDays(date,1),purpose:''});setEditing(null);setSelectedBooking(null);setError('');setNotice('');showForm();}
 function edit(row){if(row.owner!=='you')return;setWeek(startOfWeek(row.startDate));setEditing(row.id);setForm({roomNumber:row.roomNumber,startDate:row.startDate,endDate:row.endDate,purpose:row.purpose});setError('');setNotice('');setSelectedBooking(null);showForm();}
 function submit(e){e.preventDefault();setNotice('');const err=issue(form,bookings,editing);if(err){setError(err);showForm();return;}const payload={roomNumber:form.roomNumber.trim(),startDate:form.startDate,endDate:form.endDate,purpose:form.purpose.trim(),owner:'you'};
 if(editing){setBookings(bookings.map(b=>b.id===editing?{...b,...payload}:b));setNotice('Booking updated.');}else{setBookings([...bookings,{...payload,id:'b-'+Date.now()}]);setNotice('Room reserved.');}setForm({...formEmpty});setEditing(null);setError('');}
 function reset(){document.getElementById('reset-demo')?.focus();setResetPending(false);setSelectedBooking(null);setBookings(seed);setForm({...formEmpty});setEditing(null);setWeek(startOfWeek(localToday()));setNotice('Example bookings restored.');setError('');setView('All rooms');setBuilding('All buildings');}
 function check(){setNotice('');setError('');let e=issue(form,bookings,editing);if(e){setError(e);}else setNotice('No conflict detected for the selected dates.');}
 return <div className="room-app"><header className="topbar"><div className="mark"><span className="mark-sq">R</span><span><strong>room<span>grid</span></strong><small>Campus spaces</small></span></div><nav><button className={tab==='Availability'?'selected':''} aria-current={tab==='Availability'?'page':undefined} onClick={()=>setTab('Availability')}>Availability</button><button className={tab==='My bookings'?'selected':''} aria-current={tab==='My bookings'?'page':undefined} onClick={()=>setTab('My bookings')}>My bookings <span className="booking-count">{myBookings.length}</span></button></nav><div className="member"><span>Student dashboard</span><div className="profile">YOU</div></div></header>
  <main><section className="intro"><div><span className="eyebrow">SPACES / RESERVATIONS</span><h1>{tab==='Availability'?'Find room availability':'My bookings'}</h1><p>{tab==='Availability'?'Choose a room and date to make a reservation.':'Review your reservations and change their dates or details.'}</p></div><div className="intro-summary"><span>ROOMS IN DIRECTORY</span><strong>{rooms.length.toString().padStart(2,'0')}</strong><span>CURRENT RESERVATIONS</span><strong>{bookings.length.toString().padStart(2,'0')}</strong></div></section>
   <div className="pagegrid"><section className="calendar-pane" id="availability" hidden={tab!=='Availability'}><div className="calendar-head"><div><span className="eyebrow">AVAILABILITY CALENDAR</span><h2>Weekly schedule</h2></div><div className="weeknav"><button aria-label="Previous week" onClick={()=>setWeek(addDays(week,-7))}>←</button><strong aria-live="polite">{human(week)} – {human(addDays(week,6))}</strong><button aria-label="Next week" onClick={()=>setWeek(addDays(week,7))}>→</button></div></div>
    <div className="schedule-toolbar"><button onClick={()=>setWeek(startOfWeek(today))}>This week</button><label>Jump to date <input type="date" value={week} onChange={e=>{if(isDate(e.target.value))setWeek(startOfWeek(e.target.value));}}/></label><span>{roomList.length} rooms · Monday–Sunday</span></div>
    <div className="calendar-controls"><label>Building <select value={building} onChange={e=>{setBuilding(e.target.value);setView('All rooms');setSelectedBooking(null);}}><option>All buildings</option>{['A','B','C','D'].map(letter=><option key={letter} value={letter}>Building {letter}</option>)}</select></label><label>Room <select value={view} onChange={e=>{setView(e.target.value);setSelectedBooking(null);}}><option>All rooms</option>{buildingRooms.map(r=><option key={r}>{r}</option>)}</select></label><span className="legend"><i className="booked"/> Reserved</span><span className="legend"><i className="free"/> Available</span><span className="legend"><i className="mine"/> Your booking</span><span className="legend"><i className="selection"/> Selected dates</span><p>Select Open to book, or Booked for details.</p></div>
    <p id="calendar-help" className="calendar-help">Scroll within the schedule to see all rooms and dates. Room names and date headers stay visible.</p><div className="calendar-scroll" tabIndex={0} role="region" aria-label="Weekly room availability" aria-describedby="calendar-help"><div className="room-cal"><div className="corner">ROOM / DATE</div>{days.map(d=><div className={"dayhead"+(d===today?" today":"")} key={d} aria-current={d===today?"date":undefined}><span>{weekDay(d)}</span><strong>{Number(d.slice(-2))}</strong><small>{new Date(`${d}T12:00:00Z`).toLocaleDateString("en-GB",{month:"short",timeZone:"UTC"})}{d===today?" · Today":""}</small></div>)}{roomList.map((room,i)=><React.Fragment key={room}><div className="roomname"><strong>{room}</strong><small>Study room · {room[0]}</small></div>{days.map(day=>{const b=occupied(room,day);return <button key={room+day} title={`${room}, ${day}: ${b?'Reserved':'Available'}`} aria-pressed={Boolean(selectedDay(room,day))} className={'slot '+(b?(b.owner==='you'?'taken own':'taken'):'available')+(selectedDay(room,day)?' range-selected':'')} aria-label={`${room}, ${day}: ${b?(b.owner==='you'?'Your booking, view or edit':'Reserved, view details'):'Available, book room'}`} onClick={()=>{if(b){setSelectedBooking(b);requestAnimationFrame(()=>{const details=document.getElementById('selected-booking');details?.focus({preventScroll:true});details?.scrollIntoView({block:'nearest'});});}else pick(room,day);}}><span>{b?'Booked':'Open'}</span>{b&&<small>{b.owner==='you'?'Your booking':'Reserved'}</small>}</button>})}</React.Fragment>)}</div></div>
    {selectedBooking&&<section id="selected-booking" tabIndex={-1} className="booking-details" aria-label="Selected reservation"><h3>{selectedBooking.roomNumber} · {selectedBooking.owner==='you'?'Your booking':'Reserved'}</h3><p>{human(selectedBooking.startDate)} – {human(selectedBooking.endDate)} (end date excluded)</p><p>{selectedBooking.purpose||'No purpose entered'}</p>{selectedBooking.owner==='you'?<button onClick={()=>edit(selectedBooking)}>Edit this booking</button>:<p>Choose an Open date to make a reservation.</p>}<button onClick={()=>setSelectedBooking(null)}>Close details</button></section>}<p className="calendar-note">Cells show individual dates. Reservations may span several dates; a day marked "Open" does not guarantee the full range you choose will be available.</p>
    </section><section id="my-reservations" className="reservations calendar-pane bookings-view" hidden={tab!=='My bookings'}><div className="reservations-head"><h2>Your bookings</h2><span>{myBookings.length} reservations</span></div><div className="reservations-list">{myBookings.map(b=><article key={b.id} className="reservation"><div className="room-chip">{b.roomNumber}</div><div className="reservation-body"><strong>{human(b.startDate)} – {human(b.endDate)}</strong><small>{b.purpose||'No purpose entered'}</small></div><button aria-label={`Edit booking for ${b.roomNumber}, ${human(b.startDate)} to ${human(b.endDate)}`} onClick={()=>edit(b)}>Edit booking</button></article>)}{myBookings.length===0&&<div className="empty-bookings"><p>You have no reservations yet.</p><button onClick={()=>setTab('Availability')}>Find an available room</button></div>}</div></section>
    <aside className="booking-pane" id="booking-form"><div className="panel-tag"><span>BOOK A ROOM</span><span>FORM 01</span></div><h2 id="form-heading" tabIndex={-1}>{editing?'Change reservation':'Make a reservation'}</h2><p className="booking-description">Use this panel to request a room for your study group, meeting or activity.</p>{notice&&<div className="success" role="status">{notice}</div>}{error&&<div className="error" role="alert">{error}</div>}<form onSubmit={submit}><label><span>Room number</span><input aria-required="true" list="rooms" placeholder="e.g., B2-104" value={form.roomNumber} onChange={e=>setForm(f=>({...f,roomNumber:e.target.value}))}/><datalist id="rooms">{rooms.map(r=><option key={r} value={r}/>)}</datalist></label><div className="date-pair"><label><span>Start date</span><input aria-required="true" type="date" value={form.startDate} onChange={e=>{const date=e.target.value;setForm(f=>changeStart(f,date));if(isDate(date))setWeek(startOfWeek(date));setError('');setNotice('');}}/></label><label><span>End date</span><input aria-required="true" aria-describedby="end-date-help" min={form.startDate&&isDate(form.startDate)?addDays(form.startDate,1):undefined} type="date" value={form.endDate} onChange={e=>setForm(f=>({...f,endDate:e.target.value}))}/><small id="end-date-help">Room available again on this date; this date is not included.</small></label></div>{form.startDate&&form.endDate&&form.endDate>form.startDate&&<p className="date-summary">{human(form.startDate)} – {human(form.endDate)} · {Math.round((new Date(form.endDate)-new Date(form.startDate))/86400000)} {addDays(form.startDate,1)===form.endDate?'day':'days'}, end date excluded</p>}<label><span>Purpose / optional</span><textarea rows="5" placeholder="Meeting, group study..." value={form.purpose} onChange={e=>setForm(f=>({...f,purpose:e.target.value}))}/></label><p className="helper">Start and end dates are required. Reservations cannot overlap existing bookings for the same room.</p><button className="availability-check" type="button" onClick={check}>Check availability</button><button className="reserve-button" type="submit">{editing?'Save booking':'Confirm booking'}</button>{editing&&<button className="cancel-edit" type="button" onClick={()=>{setEditing(null);setForm({...formEmpty});setError('')}}>Cancel editing</button>}</form><div className="demo-actions"><button id="reset-demo" className="reset-demo-button" type="button" onClick={()=>setResetPending(true)} aria-expanded={resetPending} aria-controls={resetPending?"reset-confirmation":undefined}>Reset demo</button>{resetPending&&<section id="reset-confirmation" className="reset-confirmation" aria-labelledby="reset-title"><h2 id="reset-title">Restore example bookings?</h2><p>This removes bookings you created and changes you made in this browser. This cannot be undone.</p><button autoFocus onClick={()=>{setResetPending(false);document.getElementById('reset-demo')?.focus();}}>Keep my changes</button><button className="danger-button" onClick={reset}>Restore example bookings</button></section>}</div><div className="right-foot"><span>✦</span> Need a room for a group? Find an open date and submit your request.</div></aside></div>
  </main><footer>ROOMGRID / Academic campus demo — local browser data only.</footer>
 </div>;
}
