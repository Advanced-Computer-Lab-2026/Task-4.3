import React,{useEffect,useMemo,useState} from 'react';

const STORAGE='acl-roomgrid-18rooms-v1';
const rooms=['A1-203', 'A2-106', 'A2-107', 'A3-208', 'A3-209', 'B1-205', 'B1-206', 'B1-207', 'B2-104', 'B2-105', 'B3-301', 'C1-102', 'C1-103', 'C2-201', 'C2-202', 'C3-101', 'C3-102', 'D1-101'];
const buildings=['A','B','C','D'];
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

function read(){try{let a=JSON.parse(localStorage.getItem(STORAGE));return Array.isArray(a)?a:seed;}catch{return seed;}}
function addDays(iso,days){const t=new Date(`${iso}T12:00:00Z`);t.setUTCDate(t.getUTCDate()+days);return t.toISOString().slice(0,10);}
function human(iso){return new Date(`${iso}T12:00:00Z`).toLocaleDateString('en-GB',{timeZone:'UTC',day:'numeric',month:'short'});}
function weekDay(iso){return new Date(`${iso}T12:00:00Z`).toLocaleDateString('en-GB',{timeZone:'UTC',weekday:'short'});}
function isFreeForRange(room,start,end,bookings){return !bookings.some(b=>b.roomNumber===room&&start<b.endDate&&end>b.startDate);}

// Validation (unchanged rules, plus: the room must exist in the directory).
function issue(form,bookings,id){
 if(!form.roomNumber.trim()||!form.startDate||!form.endDate)return 'Complete the room and both dates.';
 if(!rooms.some(r=>r.toLowerCase()===form.roomNumber.trim().toLowerCase()))return `Room "${form.roomNumber.trim()}" is not in the directory. Pick one of the ${rooms.length} listed rooms.`;
 if(form.endDate<=form.startDate)return 'End date must follow start date.';
 if(bookings.some(b=>b.id!==id&&b.roomNumber.toLowerCase()===form.roomNumber.trim().toLowerCase()&&form.startDate<b.endDate&&form.endDate>b.startDate))return 'This room is already booked for some of those dates.';
 return '';
}

export default function App(){
 const [bookings,setBookings]=useState(read);
 const [week,setWeek]=useState(DEFAULT_WEEK);
 const [form,setForm]=useState({...formEmpty});
 const [editing,setEditing]=useState(null);
 const [error,setError]=useState('');
 const [notice,setNotice]=useState('');
 const [tab,setTab]=useState('Availability');
 // Search and filters
 const [query,setQuery]=useState('');
 const [building,setBuilding]=useState('All');
 const [freeFrom,setFreeFrom]=useState('');
 const [freeTo,setFreeTo]=useState('');
 // Reset confirmation
 const [confirmReset,setConfirmReset]=useState(false);

 useEffect(()=>localStorage.setItem(STORAGE,JSON.stringify(bookings)),[bookings]);
 useEffect(()=>{
  if(!confirmReset)return;
  const onKey=e=>{if(e.key==='Escape')setConfirmReset(false);};
  window.addEventListener('keydown',onKey);
  return()=>window.removeEventListener('keydown',onKey);
 },[confirmReset]);

 const days=useMemo(()=>Array.from({length:7},(_,i)=>addDays(week,i)),[week]);
 const myBookings=bookings.filter(b=>b.owner==='you').sort((a,b)=>a.startDate.localeCompare(b.startDate));

 const rangeActive=Boolean(freeFrom&&freeTo&&freeTo>freeFrom);
 const rangeError=(freeFrom||freeTo)&&!rangeActive
  ?(freeFrom&&freeTo?'The "free until" date must be after the "free from" date.':'Pick both dates to find rooms that are free for the whole stay.')
  :'';
 const filtersActive=Boolean(query.trim()||building!=='All'||freeFrom||freeTo);
 const roomList=rooms.filter(r=>
  r.toLowerCase().includes(query.trim().toLowerCase())&&
  (building==='All'||r[0]===building)&&
  (!rangeActive||isFreeForRange(r,freeFrom,freeTo,bookings))
 );
 const occupied=(room,date)=>bookings.find(b=>b.roomNumber===room&&date>=b.startDate&&date<b.endDate);

 function scrollToForm(){document.getElementById('booking-form')?.scrollIntoView({behavior:'smooth',block:'nearest'});}
 function pick(room,date){setForm({roomNumber:room,startDate:date,endDate:addDays(date,1),purpose:''});setEditing(null);setError('');setNotice('');scrollToForm();}
 function bookRange(room){setForm({roomNumber:room,startDate:freeFrom,endDate:freeTo,purpose:''});setEditing(null);setError('');setNotice('');scrollToForm();}
 function edit(row){if(row.owner!=='you')return;setEditing(row.id);setForm({roomNumber:row.roomNumber,startDate:row.startDate,endDate:row.endDate,purpose:row.purpose});setError('');setNotice('');scrollToForm();}
 function submit(e){
  e.preventDefault();setNotice('');
  const err=issue(form,bookings,editing);
  if(err){setError(err);return;}
  const canonicalRoom=rooms.find(r=>r.toLowerCase()===form.roomNumber.trim().toLowerCase());
  const payload={roomNumber:canonicalRoom,startDate:form.startDate,endDate:form.endDate,purpose:form.purpose.trim(),owner:'you'};
  if(editing){setBookings(bookings.map(b=>b.id===editing?{...b,...payload}:b));setNotice('Booking updated.');}
  else{setBookings([...bookings,{...payload,id:'b-'+Date.now()}]);setNotice('Room reserved.');}
  setForm({...formEmpty});setEditing(null);setError('');
 }
 function reset(){
  setBookings(seed);setForm({...formEmpty});setEditing(null);setWeek(DEFAULT_WEEK);
  setNotice('Example bookings restored.');setError('');
  setQuery('');setBuilding('All');setFreeFrom('');setFreeTo('');
  setConfirmReset(false);
 }
 function check(){setNotice('');setError('');const e=issue(form,bookings,editing);if(e){setError(e);}else setNotice('No conflict detected for the selected dates.');}
 function changeFreeFrom(v){
  setFreeFrom(v);
  if(v){
   setWeek(v);
   if(!freeTo||freeTo<=v)setFreeTo(addDays(v,1));
  }
 }
 function clearFilters(){setQuery('');setBuilding('All');setFreeFrom('');setFreeTo('');}

 const onBookings=tab==='My bookings';

 return <div className="room-app">
  <header className="topbar">
   <div className="mark"><span className="mark-sq">R</span><span><strong>room<span>grid</span></strong><small>Campus spaces</small></span></div>
   <nav>
    <button className={tab==='Availability'?'selected':''} aria-current={tab==='Availability'?'page':undefined} onClick={()=>setTab('Availability')}>Availability</button>
    <button className={onBookings?'selected':''} aria-current={onBookings?'page':undefined} onClick={()=>setTab('My bookings')}>My bookings{myBookings.length>0&&<span className="nav-count">{myBookings.length}</span>}</button>
   </nav>
   <div className="member"><span>Student dashboard</span><div className="profile">YOU</div></div>
  </header>

  <main>
   <section className="intro">
    <div>
     <span className="eyebrow">{onBookings?'SPACES / MY BOOKINGS':'SPACES / RESERVATIONS'}</span>
     <h1>{onBookings?'Your bookings':'Find room availability'}</h1>
     <p>{onBookings?'Review, change or add to the rooms you have reserved.':'Review campus rooms, dates and existing reservations in one view.'}</p>
    </div>
    <div className="intro-summary"><span>ROOMS IN DIRECTORY</span><strong>{rooms.length.toString().padStart(2,'0')}</strong><span>CURRENT RESERVATIONS</span><strong>{bookings.length.toString().padStart(2,'0')}</strong></div>
   </section>

   <div className="pagegrid">
    {!onBookings&&<section className="calendar-pane">
     <div className="calendar-head">
      <div><span className="eyebrow">AVAILABILITY CALENDAR</span><h2>Rooms by day</h2></div>
      <div className="weeknav"><button aria-label="Previous week" onClick={()=>setWeek(addDays(week,-7))}>←</button><strong>{human(week)} – {human(addDays(week,6))}</strong><button aria-label="Next week" onClick={()=>setWeek(addDays(week,7))}>→</button></div>
     </div>

     <div className="filters" role="search">
      <label className="filter-search"><span>Search room</span><input type="search" placeholder="e.g., B2 or 104" value={query} onChange={e=>setQuery(e.target.value)}/></label>
      <label><span>Building</span><select value={building} onChange={e=>setBuilding(e.target.value)}><option value="All">All buildings</option>{buildings.map(b=><option key={b} value={b}>Building {b}</option>)}</select></label>
      <label><span>Free from</span><input type="date" value={freeFrom} onChange={e=>changeFreeFrom(e.target.value)}/></label>
      <label><span>Free until</span><input type="date" value={freeTo} onChange={e=>setFreeTo(e.target.value)}/></label>
      <button type="button" className="clear-filters" onClick={clearFilters} disabled={!filtersActive}>Clear filters</button>
     </div>
     {rangeError&&<p className="filter-error" role="alert">{rangeError}</p>}

     <div className="results-line">
      <span aria-live="polite">
       Showing {roomList.length} of {rooms.length} rooms{rangeActive&&<> free for the whole stay, {human(freeFrom)} – {human(freeTo)}</>}
      </span>
      <span className="legend"><i className="booked"/> Reserved</span>
      <span className="legend"><i className="mine"/> Your booking</span>
      <span className="legend"><i className="free"/> Available</span>
      <p>Click a day to enter it in the form.</p>
     </div>

     {roomList.length===0
      ?<div className="empty"><strong>No rooms match these filters.</strong><p>Try a different building or date range, or clear the filters to see all rooms.</p><button type="button" onClick={clearFilters}>Clear filters</button></div>
      :<div className="calendar-scroll"><div className="room-cal">
        <div className="corner">ROOM / DATE</div>
        {days.map(d=><div className={'dayhead'+(rangeActive&&d>=freeFrom&&d<freeTo?' inrange':'')} key={d}><strong>{weekDay(d)}</strong><span>{human(d)}</span></div>)}
        {roomList.map(room=><React.Fragment key={room}>
         <div className="roomname"><strong>{room}</strong><small>Study room · {room[0]}</small>{rangeActive&&<button type="button" className="mini-book" onClick={()=>bookRange(room)}>Book these dates</button>}</div>
         {days.map(day=>{
          const b=occupied(room,day);
          const mine=b&&b.owner==='you';
          return <button key={room+day} title={`${room}, ${day}: ${b?(mine?'Your booking':'Reserved'):'Available'}`} className={'slot '+(b?(mine?'taken mine':'taken'):'available')} onClick={()=>pick(room,day)}>
           <span>{b?'Booked':'Open'}</span>{b&&<small>{mine?'Your booking':'Reserved'}</small>}
          </button>;
         })}
        </React.Fragment>)}
       </div></div>}
     <p className="calendar-note">Cells show individual dates. Reservations may span several dates; a day marked "Open" does not guarantee the full range you choose will be available. Use "Free from / until" above to list only rooms that are free for the whole stay.</p>
    </section>}

    {onBookings&&<section className="calendar-pane" id="my-reservations">
     <div className="reservations-head page-head"><div><span className="eyebrow">YOUR RESERVATIONS</span><h2>Your bookings</h2></div><span>{myBookings.length} current {myBookings.length===1?'record':'records'}</span></div>
     <div className="reservations-list single">
      {myBookings.map(b=><article key={b.id} className={'reservation'+(editing===b.id?' editing':'')}>
       <div className="room-chip">{b.roomNumber}</div>
       <div className="reservation-body"><strong>{weekDay(b.startDate)} {human(b.startDate)} – {weekDay(b.endDate)} {human(b.endDate)}</strong><small>{b.purpose||'No purpose entered'}</small></div>
       <button className="change-btn" onClick={()=>edit(b)} aria-label={`Change booking for ${b.roomNumber}, ${human(b.startDate)} to ${human(b.endDate)}`}>{editing===b.id?'Editing…':'Change'}</button>
      </article>)}
      {myBookings.length===0&&<div className="empty"><strong>You have no reservations yet.</strong><p>Find an open date on the availability page, then book it.</p><button type="button" onClick={()=>setTab('Availability')}>Find a room</button></div>}
     </div>
    </section>}

    <aside className="booking-pane" id="booking-form">
     <div className="panel-tag"><span>BOOK A ROOM</span><span>FORM 01</span></div>
     <h2>{editing?'Change reservation':'Make a reservation'}</h2>
     <p className="booking-description">Use this panel to request a room for your study group, meeting or activity.</p>
     {notice&&<div className="success" role="status">{notice}</div>}
     {error&&<div className="error" role="alert">{error}</div>}
     <form onSubmit={submit}>
      <label><span>Room number</span><input list="rooms" placeholder="e.g., B2-104" value={form.roomNumber} onChange={e=>setForm(f=>({...f,roomNumber:e.target.value}))}/><datalist id="rooms">{rooms.map(r=><option key={r} value={r}/>)}</datalist></label>
      <div className="date-pair">
       <label><span>Start date</span><input type="date" value={form.startDate} onChange={e=>setForm(f=>({...f,startDate:e.target.value}))}/></label>
       <label><span>End date</span><input type="date" value={form.endDate} onChange={e=>setForm(f=>({...f,endDate:e.target.value}))}/></label>
      </div>
      <label><span>Purpose / optional</span><textarea rows="5" placeholder="Meeting, group study..." value={form.purpose} onChange={e=>setForm(f=>({...f,purpose:e.target.value}))}/></label>
      <p className="helper">Start and end dates are required. Reservations cannot overlap existing bookings for the same room.</p>
      <button className="availability-check" type="button" onClick={check}>Check availability</button>
      <button className="reserve-button" type="submit">{editing?'Save booking':'Confirm booking'}</button>
      {editing&&<button className="cancel-edit" type="button" onClick={()=>{setEditing(null);setForm({...formEmpty});setError('')}}>Cancel editing</button>}
     </form>
     <div className="right-foot"><span>✦</span> Need a room for a group? Find an open date and submit your request.</div>
    </aside>
   </div>
  </main>

  <footer>
   <span>ROOMGRID / Academic campus demo — local browser data only.</span>
   <div className="demo-zone"><span>Demo settings</span><button type="button" className="danger-button" onClick={()=>setConfirmReset(true)}>Reset demo data</button></div>
  </footer>

  {confirmReset&&<div className="modal-backdrop" onClick={()=>setConfirmReset(false)}>
   <div className="modal" role="alertdialog" aria-modal="true" aria-labelledby="reset-title" aria-describedby="reset-desc" onClick={e=>e.stopPropagation()}>
    <h2 id="reset-title">Reset demo data?</h2>
    <p id="reset-desc">Are you sure you want to reset? All bookings you created or changed will be deleted and the {sampleRows.length} example bookings will be restored. This cannot be undone.</p>
    <div className="modal-actions">
     <button type="button" className="btn-ghost" autoFocus onClick={()=>setConfirmReset(false)}>Cancel</button>
     <button type="button" className="btn-danger" onClick={reset}>Yes, reset everything</button>
    </div>
   </div>
  </div>}
 </div>;
}