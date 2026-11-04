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
const buildings=['All',...Array.from(new Set(rooms.map(r=>r[0])))];
const formEmpty={roomNumber:'',startDate:'',endDate:'',purpose:''};
const FIRST_DAY='2026-11-09';

function read(){try{let a=JSON.parse(localStorage.getItem(STORAGE));return Array.isArray(a)?a:seed;}catch{return seed;}}
function addDays(iso,days){const t=new Date(`${iso}T12:00:00Z`);t.setUTCDate(t.getUTCDate()+days);return t.toISOString().slice(0,10);}
function human(iso){return new Date(`${iso}T12:00:00Z`).toLocaleDateString('en-GB',{timeZone:'UTC',day:'numeric',month:'short'});}
function weekDay(iso){return new Date(`${iso}T12:00:00Z`).toLocaleDateString('en-GB',{timeZone:'UTC',weekday:'short'});}
function dayCount(start,end){return Math.round((new Date(`${end}T12:00:00Z`)-new Date(`${start}T12:00:00Z`))/86400000);}
// Show ranges by their last occupied day so "9–10 Nov" means the room is held on the 9th and 10th.
function rangeText(start,end){const last=addDays(end,-1);return start===last?`${weekDay(start)} ${human(start)}`:`${weekDay(start)} ${human(start)} – ${weekDay(last)} ${human(last)}`;}
function mondayOf(iso){const dow=new Date(`${iso}T12:00:00Z`).getUTCDay();return addDays(iso,-((dow+6)%7));}
function plural(n,word){return `${n} ${word}${n===1?'':'s'}`;}
function sameRoom(a,b){return a.trim().toLowerCase()===b.trim().toLowerCase();}
function canonicalRoom(name){return rooms.find(r=>sameRoom(r,name));}
function overlaps(b,start,end){return start<b.endDate&&end>b.startDate;}

function issue(form,bookings,id){
 if(!form.roomNumber.trim())return 'Choose a room.';
 if(!form.startDate||!form.endDate)return 'Choose both a start date and an end date.';
 const room=canonicalRoom(form.roomNumber);
 if(!room)return `"${form.roomNumber.trim()}" is not a room in the directory. Pick one from the list.`;
 if(form.endDate<=form.startDate)return 'End date must be after the start date.';
 const clash=bookings.find(b=>b.id!==id&&sameRoom(b.roomNumber,room)&&overlaps(b,form.startDate,form.endDate));
 if(clash)return `${room} is already booked ${rangeText(clash.startDate,clash.endDate)}${clash.owner==='you'?' by you':''}. Choose other dates or another room.`;
 return '';
}

export default function App(){
 const [bookings,setBookings]=useState(read);
 const [week,setWeek]=useState(FIRST_DAY);
 // Filters
 const [building,setBuilding]=useState('All');
 const [query,setQuery]=useState('');
 const [freeOn,setFreeOn]=useState('');
 const [freeFor,setFreeFor]=useState(1);
 const [cellInfo,setCellInfo]=useState('');
 const [form,setForm]=useState({...formEmpty});
 const [editing,setEditing]=useState(null);
 const [error,setError]=useState('');
 const [notice,setNotice]=useState('');
 const [confirmed,setConfirmed]=useState(null);
 const [flashId,setFlashId]=useState(null);
 const confirmRef=useRef(null);

 useEffect(()=>localStorage.setItem(STORAGE,JSON.stringify(bookings)),[bookings]);
 useEffect(()=>{if(!flashId)return;const t=setTimeout(()=>setFlashId(null),4000);return()=>clearTimeout(t);},[flashId]);
 useEffect(()=>{if(confirmed)confirmRef.current?.focus();},[confirmed]);

 const days=useMemo(()=>Array.from({length:7},(_,i)=>addDays(week,i)),[week]);
 const myBookings=bookings.filter(b=>b.owner==='you').sort((a,b)=>a.startDate.localeCompare(b.startDate));
 const occupied=(room,date)=>bookings.find(b=>sameRoom(b.roomNumber,room)&&date>=b.startDate&&date<b.endDate);
 const freeEnd=freeOn?addDays(freeOn,freeFor):'';
 const q=query.trim().toLowerCase();
 const roomList=rooms.filter(r=>
  (building==='All'||r[0]===building)&&
  r.toLowerCase().includes(q)&&
  (!freeOn||!bookings.some(b=>sameRoom(b.roomNumber,r)&&overlaps(b,freeOn,freeEnd))));
 const filtersActive=building!=='All'||q!==''||freeOn!=='';

 // The current form range, highlighted in the grid so the user sees what they picked.
 const selRoom=!confirmed&&canonicalRoom(form.roomNumber);
 const selValid=selRoom&&form.startDate&&form.endDate>form.startDate;
 const isSelected=(room,day)=>selValid&&room===selRoom&&day>=form.startDate&&day<form.endDate;

 const formDays=form.startDate&&form.endDate&&form.endDate>form.startDate?dayCount(form.startDate,form.endDate):0;

 function scrollTo(id){document.getElementById(id)?.scrollIntoView({behavior:'smooth',block:'start'});}
 function clearFilters(){setBuilding('All');setQuery('');setFreeOn('');setFreeFor(1);}
 function chooseFreeOn(day){setFreeOn(day);if(day)setWeek(mondayOf(day));}

 function pick(room,date){
  // If the "free on" filter is set and the clicked day is inside it, book that whole range.
  const useFilter=freeOn&&date>=freeOn&&date<freeEnd;
  setForm({roomNumber:room,startDate:useFilter?freeOn:date,endDate:useFilter?freeEnd:addDays(date,1),purpose:''});
  setEditing(null);setError('');setNotice('');setConfirmed(null);setCellInfo('');
  document.getElementById('booking-form')?.scrollIntoView({behavior:'smooth',block:'nearest'});
 }
 function cellClick(room,day,b){
  if(!b)return pick(room,day);
  if(b.owner==='you')return edit(b);
  setCellInfo(`${room} is reserved ${rangeText(b.startDate,b.endDate)}${b.purpose?` for “${b.purpose}”`:''}. Pick an open day or another room.`);
 }
 function edit(row){
  if(row.owner!=='you')return;
  setEditing(row.id);
  setForm({roomNumber:row.roomNumber,startDate:row.startDate,endDate:row.endDate,purpose:row.purpose});
  setError('');setNotice('');setConfirmed(null);setCellInfo('');
  scrollTo('booking-form');
 }
 function cancelEdit(){setEditing(null);setForm({...formEmpty});setError('');setNotice('');}
 function submit(e){
  e.preventDefault();setNotice('');
  const err=issue(form,bookings,editing);
  if(err){setError(err);return;}
  const payload={roomNumber:canonicalRoom(form.roomNumber),startDate:form.startDate,endDate:form.endDate,purpose:form.purpose.trim(),owner:'you'};
  let saved;
  if(editing){saved={...bookings.find(b=>b.id===editing),...payload};setBookings(bookings.map(b=>b.id===editing?saved:b));}
  else{saved={...payload,id:'b-'+Date.now()};setBookings([...bookings,saved]);}
  setConfirmed({booking:saved,mode:editing?'updated':'created'});
  setFlashId(saved.id);
  setForm({...formEmpty});setEditing(null);setError('');
  scrollTo('booking-form');
 }
 function check(){
  setNotice('');setError('');
  const e=issue(form,bookings,editing);
  if(e)setError(e);
  else setNotice(`${canonicalRoom(form.roomNumber)} is free ${rangeText(form.startDate,form.endDate)}.`);
 }
 function reset(){
  if(!window.confirm('Reset the demo? Your bookings and changes will be replaced with the example records.'))return;
  setBookings(seed);setForm({...formEmpty});setEditing(null);setConfirmed(null);setError('');
  setWeek(FIRST_DAY);clearFilters();setCellInfo('');
  setNotice('Example bookings restored.');
 }
 function bookAnother(){setConfirmed(null);scrollTo('find-room');}
 function viewMine(){setConfirmed(null);scrollTo('my-reservations');}

 return <div className="room-app">
  <header className="topbar">
   <div className="mark"><span className="mark-sq">R</span><span><strong>room<span>grid</span></strong><small>Campus spaces</small></span></div>
   <nav>
    <button onClick={()=>scrollTo('find-room')}>Availability</button>
    <button onClick={()=>scrollTo('my-reservations')}>My bookings <span className="count">{myBookings.length}</span></button>
    <button className="reset" onClick={reset}>Reset demo</button>
   </nav>
   <div className="member"><span>Student dashboard</span><div className="profile">YOU</div></div>
  </header>

  <main>
   <section className="intro"><div><span className="eyebrow">SPACES / RESERVATIONS</span><h1>Find room availability</h1><p>Review campus rooms, dates and existing reservations in one view.</p></div><div className="intro-summary"><span>ROOMS IN DIRECTORY</span><strong>{rooms.length.toString().padStart(2,'0')}</strong><span>CURRENT RESERVATIONS</span><strong>{bookings.length.toString().padStart(2,'0')}</strong></div></section>

   <div className="pagegrid">
    <section className="calendar-pane" id="find-room"><div className="calendar-head"><div><span className="eyebrow">AVAILABILITY CALENDAR</span><h2>Rooms by day</h2></div><div className="weeknav"><button aria-label="Previous week" onClick={()=>setWeek(addDays(week,-7))}>←</button><strong>{human(week)} – {human(addDays(week,6))}</strong><button aria-label="Next week" onClick={()=>setWeek(addDays(week,7))}>→</button></div></div>
     <div className="filters">
      <div className="filter-group" role="group" aria-label="Building">
       <span className="filter-label">Building</span>
       <div className="chips">{buildings.map(b=><button key={b} aria-pressed={building===b} className={'chip'+(building===b?' chosen':'')} onClick={()=>setBuilding(b)}>{b==='All'?'All':`Block ${b}`}</button>)}</div>
      </div>
      <label className="filter-group"><span className="filter-label">Room</span><input type="search" placeholder="e.g., 104 or B2" value={query} onChange={e=>setQuery(e.target.value)}/></label>
      <div className="filter-group">
       <span className="filter-label">Only rooms free on</span>
       <div className="inline">
        <input type="date" aria-label="Free from" value={freeOn} onChange={e=>chooseFreeOn(e.target.value)}/>
        <select aria-label="For how many days" value={freeFor} onChange={e=>setFreeFor(Number(e.target.value))}>{[1,2,3,4,5,6,7].map(n=><option key={n} value={n}>for {plural(n,'day')}</option>)}</select>
       </div>
      </div>
      {filtersActive&&<button className="link clear" onClick={clearFilters}>Clear filters</button>}
     </div>

     <div className="grid-bar">
      <span className="result-count" aria-live="polite">Showing <strong>{roomList.length}</strong> of {rooms.length} rooms{freeOn&&<> free <strong>{rangeText(freeOn,freeEnd)}</strong></>}</span>
      <span className="legends"><span className="legend"><i className="free"/> Open</span><span className="legend"><i className="booked"/> Reserved</span><span className="legend"><i className="mine"/> Yours</span><span className="legend"><i className="sel"/> Selected</span></span>
     </div>

     {cellInfo&&<div className="cell-info" role="status"><span>{cellInfo}</span><button aria-label="Dismiss" onClick={()=>setCellInfo('')}>×</button></div>}

     <div className="calendar-scroll"><div className="room-cal">
      <div className="corner">ROOM / DATE</div>
      {days.map(d=><div className={'dayhead'+(freeOn&&d>=freeOn&&d<freeEnd?' in-filter':'')} key={d}><strong>{weekDay(d)}</strong><span>{human(d)}</span></div>)}
      {roomList.length===0&&<div className="grid-empty">No rooms match these filters. <button className="link" onClick={clearFilters}>Clear filters</button></div>}
      {roomList.map(room=><React.Fragment key={room}>
       <div className="roomname"><strong>{room}</strong><small>Block {room[0]}</small></div>
       {days.map((day,i)=>{
        const b=occupied(room,day);const mine=b?.owner==='you';
        const first=b&&(day===b.startDate||i===0);
        const sel=isSelected(room,day);
        const label=b
         ?`${room}, ${weekDay(day)} ${human(day)}: ${mine?'your booking':'reserved'}${b.purpose?` (${b.purpose})`:''}. ${mine?'Select to change it.':'Select for details.'}`
         :`${room}, ${weekDay(day)} ${human(day)}: open. Select to book.`;
        return <button key={room+day} aria-label={label} title={label}
         className={'slot '+(b?(mine?'mine':'taken'):'available')+(b&&!first?' cont':'')+(sel?' selected':'')}
         onClick={()=>cellClick(room,day,b)}>
         {b?(first&&<><span>{mine?'Yours':'Reserved'}</span>{b.purpose&&<small>{b.purpose}</small>}</>):<span className="plus" aria-hidden="true">{sel?'✓':'+'}</span>}
        </button>;})}
      </React.Fragment>)}
     </div></div>
     <p className="calendar-note">Click an open cell to start a booking there. Click a reserved cell to see who has it, or one of yours to change it. Set “Only rooms free on” to see rooms open for a whole range.</p>

     <section id="my-reservations" className="reservations">
      <div className="reservations-head"><h2>Your bookings</h2><span>{plural(myBookings.length,'booking')}</span></div>
      <div className="reservations-list">
       {myBookings.map(b=><article key={b.id} className={'reservation'+(b.id===flashId?' flash':'')+(b.id===editing?' editing':'')}>
        <div className="room-chip">{b.roomNumber}</div>
        <div className="reservation-body"><strong>{rangeText(b.startDate,b.endDate)} <em>· {plural(dayCount(b.startDate,b.endDate),'day')}</em></strong><small>{b.purpose||'No purpose entered'}</small></div>
        {b.id===editing?<span className="editing-tag">Editing</span>:<button onClick={()=>edit(b)}>Change</button>}
       </article>)}
       {myBookings.length===0&&<p>No reservations yet.</p>}
      </div>
     </section>
    </section>

    <aside className="booking-pane" id="booking-form">
     {confirmed?<div className="confirm-card" role="status" tabIndex={-1} ref={confirmRef}>
      <div className="confirm-icon" aria-hidden="true">✓</div>
      <h2>{confirmed.mode==='created'?'Room booked':'Booking updated'}</h2>
      <dl>
       <dt>Room</dt><dd>{confirmed.booking.roomNumber}</dd>
       <dt>Dates</dt><dd>{rangeText(confirmed.booking.startDate,confirmed.booking.endDate)} · {plural(dayCount(confirmed.booking.startDate,confirmed.booking.endDate),'day')}</dd>
       <dt>Purpose</dt><dd>{confirmed.booking.purpose||'—'}</dd>
      </dl>
      <p>It’s saved under <strong>Your bookings</strong>. You can change it any time.</p>
      <button className="reserve-button" onClick={viewMine}>View my bookings</button>
      <button className="availability-check" onClick={bookAnother}>Book another room</button>
     </div>:<>
      <div className="panel-tag"><span>BOOK A ROOM</span>{editing&&<span>EDITING</span>}</div>
      <h2>{editing?'Change reservation':'Make a reservation'}</h2>
      <p className="booking-description">{editing?'Update the room, dates or purpose, then save.':'Use this panel to request a room for your study group, meeting or activity.'}</p>
      <form onSubmit={submit} noValidate>
       <label><span>Room number</span><input list="rooms" placeholder="e.g., B2-104" value={form.roomNumber} aria-invalid={!!error} onChange={e=>setForm(f=>({...f,roomNumber:e.target.value}))}/><datalist id="rooms">{rooms.map(r=><option key={r} value={r}/>)}</datalist></label>
       <div className="date-pair">
        <label><span>Start date</span><input type="date" value={form.startDate} onChange={e=>setForm(f=>({...f,startDate:e.target.value}))}/></label>
        <label><span>End date <small>(not included)</small></span><input type="date" value={form.endDate} onChange={e=>setForm(f=>({...f,endDate:e.target.value}))}/></label>
       </div>
       {formDays>0&&<p className="range-hint">You’ll have the room <strong>{rangeText(form.startDate,form.endDate)}</strong> · {plural(formDays,'day')}</p>}
       <label><span>Purpose / optional</span><textarea rows="5" placeholder="Meeting, group study..." value={form.purpose} onChange={e=>setForm(f=>({...f,purpose:e.target.value}))}/></label>
       {notice&&<div className="success" role="status">{notice}</div>}
       {error&&<div className="error" role="alert"><strong>Couldn’t book this.</strong> {error}</div>}
       <button className="availability-check" type="button" onClick={check}>Check availability</button>
       <button className="reserve-button" type="submit">{editing?'Save changes':'Confirm booking'}</button>
       {editing&&<button className="cancel-edit" type="button" onClick={cancelEdit}>Cancel editing</button>}
      </form>
     </>}
    </aside>
   </div>
  </main>
  <footer>ROOMGRID / Academic campus demo — local browser data only.</footer>
 </div>;
}
