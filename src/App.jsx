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
const DEFAULT_WEEK='2026-11-09';
// Room codes look like "A1-203": letter = building, digit after it = sub-building.
const buildingOf=r=>r[0];
const subOf=r=>r.split('-')[0].slice(1);
const buildings=[...new Set(rooms.map(buildingOf))].sort();
const matchesFilters=(r,building,sub)=>(building==='All'||buildingOf(r)===building)&&(sub==='All'||subOf(r)===sub);

function read(){try{let a=JSON.parse(localStorage.getItem(STORAGE));return Array.isArray(a)?a:seed;}catch{return seed;}}
function addDays(iso,days){const t=new Date(`${iso}T12:00:00Z`);t.setUTCDate(t.getUTCDate()+days);return t.toISOString().slice(0,10);}
function human(iso){return new Date(`${iso}T12:00:00Z`).toLocaleDateString('en-GB',{timeZone:'UTC',day:'numeric',month:'short'});}
function weekDay(iso){return new Date(`${iso}T12:00:00Z`).toLocaleDateString('en-GB',{timeZone:'UTC',weekday:'short'});}
function longDate(iso){return `${weekDay(iso)} ${human(iso)}`;}
function dayCount(start,end){return Math.round((Date.parse(end)-Date.parse(start))/864e5);}
function plural(n,word){return `${n} ${word}${n===1?'':'s'}`;}
/** Monday of the week containing iso. */
function weekStart(iso){const dow=(new Date(`${iso}T12:00:00Z`).getUTCDay()+6)%7;return addDays(iso,-dow);}
/** Booking range exactly as entered: start date → end date (the end date is the day the room is free again). */
function usedRange(start,end){return `${longDate(start)} → ${longDate(end)}`;}

function issue(form,bookings,id){
 const room=form.roomNumber.trim();
 if(!room||!form.startDate||!form.endDate)return 'Choose a room and complete both dates before booking.';
 if(!rooms.some(r=>r.toLowerCase()===room.toLowerCase()))return `"${room}" is not in the room directory. Pick a room from the list.`;
 if(form.endDate<=form.startDate)return 'End date must be after the start date.';
 const conflict=bookings.find(b=>b.id!==id&&b.roomNumber.toLowerCase()===room.toLowerCase()&&form.startDate<b.endDate&&form.endDate>b.startDate);
 if(conflict)return `${room} is already booked ${usedRange(conflict.startDate,conflict.endDate)}. Choose dates outside that range or another room.`;
 return '';
}

function Header({page,onAvailability,onMyBookings,onReset}){
 return <header className="topbar">
  <div className="mark"><span className="mark-sq">R</span><span><strong>room<span>grid</span></strong><small>Campus spaces</small></span></div>
  <nav aria-label="Main">
   <button className={page==='calendar'?'selected':''} aria-current={page==='calendar'?'page':undefined} onClick={onAvailability}>Availability</button>
   <button className={page==='mine'?'selected':''} aria-current={page==='mine'?'page':undefined} onClick={onMyBookings}>My bookings</button>
   <button className="nav-reset" onClick={onReset}>Reset sample data</button>
  </nav>
  <div className="member"><span>Signed in as You</span><div className="profile" aria-hidden="true">YOU</div></div>
 </header>;
}

export default function App(){
 const [bookings,setBookings]=useState(read);
 const [week,setWeek]=useState(DEFAULT_WEEK);
 const [view,setView]=useState('All rooms');
 const [building,setBuilding]=useState('All');
 const [sub,setSub]=useState('All');
 const [form,setForm]=useState({...formEmpty});
 const [editing,setEditing]=useState(null);
 const [error,setError]=useState('');
 const [notice,setNotice]=useState('');
 const [toast,setToast]=useState(null);
 const [highlight,setHighlight]=useState(null);
 const [page,setPage]=useState('calendar'); // 'calendar' | 'mine' | 'booking'
 const [returnTo,setReturnTo]=useState('calendar'); // page the booking form goes back to
 const pendingScroll=useRef(null);

 useEffect(()=>localStorage.setItem(STORAGE,JSON.stringify(bookings)),[bookings]);
 useEffect(()=>{if(!toast)return;const t=setTimeout(()=>setToast(null),6000);return()=>clearTimeout(t);},[toast]);
 useEffect(()=>{if(!highlight)return;const t=setTimeout(()=>setHighlight(null),4000);return()=>clearTimeout(t);},[highlight]);
 // Scroll handling when switching pages: start at the top unless a target row was requested.
 useEffect(()=>{
  const target=pendingScroll.current;pendingScroll.current=null;
  if(!target){window.scrollTo({top:0});return;}
  requestAnimationFrame(()=>document.getElementById(target)?.scrollIntoView({behavior:'smooth',block:'center'}));
 },[page]);

 const days=useMemo(()=>Array.from({length:7},(_,i)=>addDays(week,i)),[week]);
 const myBookings=bookings.filter(b=>b.owner==='you').sort((a,b)=>a.startDate.localeCompare(b.startDate));
 const subOptions=[...new Set(rooms.filter(r=>building==='All'||buildingOf(r)===building).map(subOf))].sort();
 const filteredRooms=rooms.filter(r=>matchesFilters(r,building,sub));
 const roomList=view==='All rooms'?filteredRooms:filteredRooms.filter(r=>r===view);
 const filtersActive=building!=='All'||sub!=='All'||view!=='All rooms';
 function changeBuilding(b){
  // Drop a sub-building / room choice that no longer exists in the new building.
  const nextSub=sub!=='All'&&!rooms.some(r=>matchesFilters(r,b,sub))?'All':sub;
  setBuilding(b);setSub(nextSub);
  if(view!=='All rooms'&&!matchesFilters(view,b,nextSub))setView('All rooms');
 }
 function changeSub(s){setSub(s);if(view!=='All rooms'&&!matchesFilters(view,building,s))setView('All rooms');}
 function clearFilters(){setBuilding('All');setSub('All');setView('All rooms');}
 const occupied=(room,date)=>bookings.find(b=>b.roomNumber===room&&date>=b.startDate&&date<b.endDate);

 // Live validation on the booking page.
 const liveIssue=issue(form,bookings,editing);
 const formRoom=rooms.find(r=>r.toLowerCase()===form.roomNumber.trim().toLowerCase());
 const roomBookings=formRoom?bookings.filter(b=>b.roomNumber===formRoom&&b.id!==editing).sort((a,b)=>a.startDate.localeCompare(b.startDate)):[];
 const rangeValid=form.startDate&&form.endDate&&form.endDate>form.startDate;

 function showToast(text,kind='success'){setToast({text,kind,key:Date.now()});}
 function openBooking(){setReturnTo(page==='mine'?'mine':'calendar');setError('');setNotice('');setPage('booking');}
 function pick(room,date){
  const existing=occupied(room,date);
  if(existing&&existing.owner!=='you'){showToast(`${room} is reserved by another student on ${human(date)}. Pick an available day instead.`,'error');return;}
  if(existing){edit(existing);return;}
  setForm({roomNumber:room,startDate:date,endDate:addDays(date,1),purpose:''});setEditing(null);openBooking();
 }
 function edit(row){
  if(row.owner!=='you'){showToast('You can only edit your own reservation.','error');return;}
  setEditing(row.id);setForm({roomNumber:row.roomNumber,startDate:row.startDate,endDate:row.endDate,purpose:row.purpose});openBooking();
 }
 function setStart(value){
  // Keep the range valid: if the end date is now on/before the start, move it to the next day.
  setForm(f=>({...f,startDate:value,endDate:value&&(!f.endDate||f.endDate<=value)?addDays(value,1):f.endDate}));
  setNotice('');
 }
 function submit(e){
  e.preventDefault();setNotice('');
  const err=issue(form,bookings,editing);
  if(err){setError(err);return;}
  const room=rooms.find(r=>r.toLowerCase()===form.roomNumber.trim().toLowerCase());
  const payload={roomNumber:room,startDate:form.startDate,endDate:form.endDate,purpose:form.purpose.trim(),owner:'you'};
  const id=editing||'b-'+Date.now();
  if(editing)setBookings(bookings.map(b=>b.id===editing?{...b,...payload}:b));
  else setBookings([...bookings,{...payload,id}]);
  showToast(`${editing?'Booking updated':'Room reserved'}: ${room}, ${usedRange(payload.startDate,payload.endDate)}.`);
  setForm({...formEmpty});setEditing(null);setError('');
  // Return to where the user came from and point at the saved booking there.
  if(returnTo==='mine'){setHighlight(id);pendingScroll.current=`booking-${id}`;setPage('mine');}
  else showInCalendar({...payload,id});
 }
 /** Open the calendar on the booking's week, make its room visible, and flash it. */
 function showInCalendar(b){
  setHighlight(b.id);setWeek(weekStart(b.startDate));
  if(!matchesFilters(b.roomNumber,building,sub)){setBuilding('All');setSub('All');}
  if(view!=='All rooms'&&view!==b.roomNumber)setView('All rooms');
  pendingScroll.current=`row-${b.roomNumber}`;
  setPage('calendar');
 }
 function reset(){
  if(!window.confirm('Reset to the example bookings? Any bookings you made or changed in this browser will be lost.'))return;
  setBookings(seed);setForm({...formEmpty});setEditing(null);setWeek(DEFAULT_WEEK);setError('');setNotice('');clearFilters();setPage(page==='booking'?'calendar':page);
  showToast('Example bookings restored.');
 }
 function check(){setNotice('');setError('');const e=issue(form,bookings,editing);if(e)setError(e);else setNotice(`${form.roomNumber.trim()} is available ${usedRange(form.startDate,form.endDate)}.`);}
 function leaveForm(){setEditing(null);setForm({...formEmpty});setError('');setNotice('');}
 function backToCalendar(){leaveForm();setPage('calendar');}
 function goMyBookings(){leaveForm();setPage('mine');}
 function backFromForm(){leaveForm();setPage(returnTo);}

 const header=<Header page={page} onAvailability={backToCalendar} onMyBookings={goMyBookings} onReset={reset}/>;
 const toastEl=toast&&<div key={toast.key} className={'toast '+toast.kind} role={toast.kind==='error'?'alert':'status'}><span>{toast.text}</span><button aria-label="Dismiss message" onClick={()=>setToast(null)}>×</button></div>;
 const footer=<footer>ROOMGRID / Academic campus demo — local browser data only.</footer>;

 if(page==='booking'){
  return <div className="room-app">{header}
   <main className="booking-shell"><section className="booking-page-panel booking-pane">
    <div className="booking-page-header">
     <button className="back-button" onClick={backFromForm}>← Back to {returnTo==='mine'?'my bookings':'schedule'}</button>
     <div><span className="eyebrow">RESERVATION</span><h1>{editing?'Edit your reservation':'Make a reservation'}</h1></div>
    </div>
    {notice&&<div className="success" role="status">{notice}</div>}
    {error&&<div className="error" role="alert">{error}</div>}
    <form onSubmit={submit} className="booking-form-page" noValidate>
     <label><span>Room number</span>
      <select value={formRoom||form.roomNumber} onChange={e=>{setForm(f=>({...f,roomNumber:e.target.value}));setNotice('');setError('');}} aria-invalid={!formRoom&&!!form.roomNumber}>
       <option value="">Select a room…</option>
       {rooms.map(r=><option key={r} value={r}>{r}</option>)}
      </select>
     </label>
     <div className="date-pair">
      <label><span>Start date</span><input type="date" value={form.startDate} onChange={e=>setStart(e.target.value)}/></label>
      <label><span>End date <em>(room is free again this day)</em></span><input type="date" min={form.startDate?addDays(form.startDate,1):undefined} value={form.endDate} onChange={e=>{setForm(f=>({...f,endDate:e.target.value}));setNotice('');}}/></label>
     </div>
     <div className={'live-check '+(liveIssue?'bad':'ok')} aria-live="polite">
      {liveIssue
       ? <><strong>Can't book yet</strong><span>{liveIssue}</span></>
       : <><strong>✓ Available</strong><span>{formRoom} · {usedRange(form.startDate,form.endDate)} · {plural(dayCount(form.startDate,form.endDate),'night')}</span></>}
     </div>
     {formRoom&&<div className="room-bookings">
      <span className="room-bookings-title">Existing bookings for {formRoom}{editing?' (excluding this one)':''}</span>
      {roomBookings.length===0?<p>No other bookings — every date is available.</p>:<ul>{roomBookings.map(b=>{const clash=rangeValid&&form.startDate<b.endDate&&form.endDate>b.startDate;return <li key={b.id} className={clash?'clash':''}><span>{usedRange(b.startDate,b.endDate)}</span><small>{b.owner==='you'?'Your booking':'Reserved'}{clash?' · overlaps your dates':''}</small></li>;})}</ul>}
     </div>}
     <label><span>Purpose (optional)</span><textarea rows="4" placeholder="Project meeting, group study, revision session..." value={form.purpose} onChange={e=>setForm(f=>({...f,purpose:e.target.value}))}/></label>
     <div className="booking-actions">
      <button className="reserve-button" type="submit">{editing?'Save changes':'Confirm booking'}</button>
      <button className="availability-check" type="button" onClick={check}>Check room availability</button>
      <button className="cancel-edit" type="button" onClick={backFromForm}>{editing?'Cancel edit':'Cancel'}</button>
     </div>
    </form>
   </section></main>{footer}{toastEl}</div>;
 }

 if(page==='mine'){
  const totalDays=myBookings.reduce((n,b)=>n+dayCount(b.startDate,b.endDate),0);
  return <div className="room-app">{header}
   <main>
    <section className="intro"><div><span className="eyebrow">SPACES / MY BOOKINGS</span><h1>My bookings</h1><p>Every room you have reserved, in date order. Edit a booking to change its room, dates or purpose.</p></div>
     <div className="intro-summary"><span>YOUR BOOKINGS</span><strong>{myBookings.length.toString().padStart(2,'0')}</strong><span>NIGHTS RESERVED</span><strong>{totalDays.toString().padStart(2,'0')}</strong><button type="button" className="summary-link" onClick={backToCalendar}>+ Book another room</button></div></section>
    <section className="calendar-pane reservations reservations-page" aria-labelledby="mine-title">
     <div className="reservations-head"><h2 id="mine-title">Your bookings</h2><span>{plural(myBookings.length,'booking')}</span></div>
     <div className="reservations-list">{myBookings.length===0
      ? <div className="empty-state"><strong>No bookings yet</strong><p>You have not reserved a space yet.</p><button type="button" className="reserve-button empty-cta" onClick={backToCalendar}>Find an available room</button></div>
      : myBookings.map(b=><article key={b.id} id={`booking-${b.id}`} className={'reservation'+(b.id===highlight?' just-saved':'')}>
        <div className="room-chip">{b.roomNumber}</div>
        <div className="reservation-body"><strong>{usedRange(b.startDate,b.endDate)}</strong><small>{plural(dayCount(b.startDate,b.endDate),'night')} · {b.purpose||'No purpose entered'}</small></div>
        <div className="reservation-actions">
         <button className="reservation-link" onClick={()=>showInCalendar(b)} aria-label={`Show ${b.roomNumber}, ${usedRange(b.startDate,b.endDate)} in the calendar`}>Show in calendar</button>
         <button className="reservation-edit" onClick={()=>edit(b)} aria-label={`Edit booking for ${b.roomNumber}, ${usedRange(b.startDate,b.endDate)}`}>Edit</button>
        </div>
       </article>)}
     </div>
    </section>
   </main>{footer}{toastEl}</div>;
 }

 return <div className="room-app">{header}
  <main>
   <section className="intro"><div><span className="eyebrow">SPACES / RESERVATIONS</span><h1>Book a study room</h1><p>Find an available day in the calendar and click it to book. Manage your reservations under My bookings.</p></div>
    <div className="intro-summary"><span>ROOMS IN DIRECTORY</span><strong>{rooms.length.toString().padStart(2,'0')}</strong><span>YOUR BOOKINGS</span><strong>{myBookings.length.toString().padStart(2,'0')}</strong></div></section>
   <section className="calendar-pane">
    <div className="calendar-head"><div><span className="eyebrow">AVAILABILITY CALENDAR</span><h2>Rooms by day</h2></div>
     <div className="weeknav"><button aria-label="Previous week" onClick={()=>setWeek(addDays(week,-7))}>←</button><strong aria-live="polite">{human(week)} – {human(addDays(week,6))}</strong><button aria-label="Next week" onClick={()=>setWeek(addDays(week,7))}>→</button>{week!==DEFAULT_WEEK&&<button className="weeknav-today" onClick={()=>setWeek(DEFAULT_WEEK)}>This week</button>}</div></div>
    <div className="calendar-controls">
     <label>Building <select value={building} onChange={e=>changeBuilding(e.target.value)}><option value="All">All buildings</option>{buildings.map(b=><option key={b} value={b}>Building {b}</option>)}</select></label>
     <label>Sub-building <select value={sub} onChange={e=>changeSub(e.target.value)}><option value="All">All</option>{subOptions.map(s=><option key={s} value={s}>{building==='All'?`Sub-building ${s}`:`${building}${s}`}</option>)}</select></label>
     <label>Room <select value={view} onChange={e=>setView(e.target.value)}><option>All rooms</option>{filteredRooms.map(r=><option key={r}>{r}</option>)}</select></label>
     {filtersActive&&<button type="button" className="clear-filters" onClick={clearFilters}>Clear filters</button>}
     <span className="legend legend-first"><i className="free"/> Available</span>
     <span className="legend"><i className="mine"/> Your booking</span>
     <span className="legend"><i className="booked"/> Reserved by others</span>
    </div>
    <p className="filter-count" aria-live="polite">Showing {plural(roomList.length,'room')}</p>
    <div className="calendar-scroll"><div className="room-cal" role="grid" aria-label="Room availability">
     <div className="corner">ROOM / DATE</div>
     {days.map(d=><div className="dayhead" key={d}><strong>{weekDay(d)}</strong><span>{human(d)}</span></div>)}
     {roomList.map(room=>{const openCount=days.filter(d=>!occupied(room,d)).length;return <React.Fragment key={room}>
      <div className="roomname" id={`row-${room}`}><strong>{room}</strong><small>Building {buildingOf(room)} · Sub {subOf(room)}</small><small>{openCount===7?'Available all week':`${openCount} of 7 days available`}</small></div>
      {days.map(day=>{
       const b=occupied(room,day);const state=!b?'available':b.owner==='you'?'mine':'taken';
       const label=state==='available'?`${room}, ${longDate(day)}: available. Book this day.`:state==='mine'?`${room}, ${longDate(day)}: your booking (${b.purpose||'no purpose'}). Edit.`:`${room}, ${longDate(day)}: reserved by another student.`;
       return <button key={room+day} title={label} aria-label={label} aria-disabled={state==='taken'||undefined} className={`slot ${state}${b&&b.id===highlight?' just-saved':''}`} onClick={()=>pick(room,day)}>
        <span>{state==='available'?'Available':state==='mine'?'Yours':'Reserved'}</span>
        {state==='mine'&&<small>{b.purpose||'Edit'}</small>}
        {state==='available'&&<small className="slot-cta">+ Book</small>}
       </button>;})}
     </React.Fragment>;})}
    </div></div>
    <p className="calendar-note">Clicking an available day books it for one day — you can extend the end date on the next screen, where any clashing bookings for that room are listed.</p>
   </section>
  </main>{footer}{toastEl}</div>;
}
