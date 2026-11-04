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
function RoomSelect({value,onChange,rooms}){
 const [query,setQuery]=useState(value);
 const [open,setOpen]=useState(false);
 const [activeIndex,setActiveIndex]=useState(0);
 const filteredRooms=rooms.filter(room=>room.toLowerCase().includes(query.trim().toLowerCase()));
 useEffect(()=>{if(!open)setQuery(value);},[value,open]);
 function choose(room){onChange(room);setQuery(room);setOpen(false);}
 function handleKeyDown(e){
  if(e.key==='ArrowDown'&&filteredRooms.length){e.preventDefault();setOpen(true);setActiveIndex(i=>(i+1)%filteredRooms.length);}
  else if(e.key==='ArrowUp'&&filteredRooms.length){e.preventDefault();setOpen(true);setActiveIndex(i=>(i-1+filteredRooms.length)%filteredRooms.length);}
  else if(e.key==='Enter'&&open&&filteredRooms.length){e.preventDefault();choose(filteredRooms[activeIndex]);}
  else if(e.key==='Escape'){setOpen(false);setQuery(value);}
 }
 return <div className="room-select">
  <input role="combobox" aria-autocomplete="list" aria-expanded={open} aria-controls="room-options" aria-activedescendant={open&&filteredRooms[activeIndex]?`room-option-${activeIndex}`:undefined} autoComplete="off" placeholder="Type to filter rooms..." value={query} onFocus={()=>setOpen(true)} onBlur={()=>setTimeout(()=>setOpen(false),100)} onKeyDown={handleKeyDown} onChange={e=>{setQuery(e.target.value);onChange('');setActiveIndex(0);setOpen(true);}}/>
  {open&&<ul className="room-options" id="room-options" role="listbox" aria-label="Available rooms">
   {filteredRooms.map((room,index)=><li id={`room-option-${index}`} key={room} role="option" aria-selected={value===room} className={index===activeIndex?'active':''} onMouseDown={e=>e.preventDefault()} onClick={()=>choose(room)}>{room}</li>)}
   {filteredRooms.length===0&&<li className="no-rooms">No matching rooms</li>}
  </ul>}
 </div>;
}
function RoomFilter({value,onChange,rooms}){
  const options=['All rooms',...rooms];
  const [query,setQuery]=useState(value);
  const [open,setOpen]=useState(false);
  const [activeIndex,setActiveIndex]=useState(0);
  const filteredOptions=options.filter(room=>room.toLowerCase().includes(query.trim().toLowerCase()));
  useEffect(()=>{if(!open)setQuery(value);},[value,open]);
  function choose(room){onChange(room);setQuery(room);setOpen(false);}
  function handleKeyDown(e){
   if(e.key==='ArrowDown'&&filteredOptions.length){e.preventDefault();setOpen(true);setActiveIndex(i=>(i+1)%filteredOptions.length);}
   else if(e.key==='ArrowUp'&&filteredOptions.length){e.preventDefault();setOpen(true);setActiveIndex(i=>(i-1+filteredOptions.length)%filteredOptions.length);}
   else if(e.key==='Enter'&&open&&filteredOptions.length){e.preventDefault();choose(filteredOptions[activeIndex]);}
   else if(e.key==='Escape'){setOpen(false);setQuery(value);}
  }
  return <div className="room-select">
   <input id="location-room-filter" role="combobox" aria-label="Search rooms" aria-autocomplete="list" aria-expanded={open} aria-controls="location-room-options" aria-activedescendant={open&&filteredOptions[activeIndex]?`location-room-option-${activeIndex}`:undefined} autoComplete="off" placeholder="Search rooms..." value={query} onFocus={e=>{setOpen(true);e.target.select();}} onBlur={()=>setTimeout(()=>setOpen(false),100)} onKeyDown={handleKeyDown} onChange={e=>{setQuery(e.target.value);setActiveIndex(0);setOpen(true);}}/>
   {open&&<ul className="room-options" id="location-room-options" role="listbox" aria-label="Filter availability by room">
    {filteredOptions.map((room,index)=><li id={`location-room-option-${index}`} key={room} role="option" aria-selected={value===room} className={index===activeIndex?'active':''} onMouseDown={e=>e.preventDefault()} onClick={()=>choose(room)}>{room}</li>)}
    {filteredOptions.length===0&&<li className="no-rooms">No matching rooms</li>}
   </ul>}
  </div>;
}
function issue(form,bookings,id){
 if(!form.roomNumber.trim()||!form.startDate||!form.endDate)return 'Choose a room and complete both dates.';
 if(!rooms.includes(form.roomNumber))return 'Choose a room from the dropdown list.';
 if(form.endDate<=form.startDate)return 'End date must follow start date.';
 if(bookings.some(b=>b.id!==id&&b.roomNumber.toLowerCase()===form.roomNumber.trim().toLowerCase()&&form.startDate<b.endDate&&form.endDate>b.startDate))return 'This room is already booked for some of those dates.';
 return '';
}
export default function App(){
 const [bookings,setBookings]=useState(read);
 const [week,setWeek]=useState('2026-11-09');
 const [view,setView]=useState('All rooms');
 const [roomPage,setRoomPage]=useState(0);
 const [form,setForm]=useState({...formEmpty});
 const [editing,setEditing]=useState(null);
 const [error,setError]=useState('');
 const [notice,setNotice]=useState('');
 const getPage=()=>['availability','bookings','reserve'].includes(window.location.hash.slice(2))?window.location.hash.slice(2):'availability';
 const [page,setPage]=useState(getPage);
 useEffect(()=>localStorage.setItem(STORAGE,JSON.stringify(bookings)),[bookings]);
 useEffect(()=>{
  const syncPage=()=>setPage(getPage());
  window.addEventListener('hashchange',syncPage);
  if(!window.location.hash)window.location.hash='#/availability';
  return ()=>window.removeEventListener('hashchange',syncPage);
 },[]);
 const days=useMemo(()=>Array.from({length:7},(_,i)=>addDays(week,i)),[week]);
 const myBookings=bookings.filter(b=>b.owner==='you').sort((a,b)=>a.startDate.localeCompare(b.startDate));
 const roomList=view==='All rooms'?rooms:rooms.filter(r=>r===view);
 const roomsPerPage=6;
 const pageCount=Math.ceil(roomList.length/roomsPerPage);
 const visibleRooms=roomList.slice(roomPage*roomsPerPage,(roomPage+1)*roomsPerPage);
 const occupied=(room,date)=>bookings.find(b=>b.roomNumber===room&&date>=b.startDate&&date<b.endDate);
 function navigate(destination){setPage(destination);window.location.hash=`#/${destination}`;window.scrollTo(0,0);}
 function pick(room,date){setForm({roomNumber:room,startDate:date,endDate:addDays(date,1),purpose:''});setEditing(null);setError('');setNotice('');navigate('reserve');}
 function edit(row){if(row.owner!=='you')return;setEditing(row.id);setForm({roomNumber:row.roomNumber,startDate:row.startDate,endDate:row.endDate,purpose:row.purpose});setError('');setNotice('');navigate('reserve');}
 function submit(e){e.preventDefault();setNotice('');const err=issue(form,bookings,editing);if(err){setError('Reservation failed. Review the selected dates.');return;}const payload={roomNumber:form.roomNumber.trim(),startDate:form.startDate,endDate:form.endDate,purpose:form.purpose.trim(),owner:'you'};
 if(editing){setBookings(bookings.map(b=>b.id===editing?{...b,...payload}:b));setNotice('Booking updated.');}else{setBookings([...bookings,{...payload,id:'b-'+Date.now()}]);setNotice('Room reserved.');}setForm({...formEmpty});setEditing(null);setError('');}
 function reset(){setBookings(seed);setForm({...formEmpty});setEditing(null);setWeek('2026-11-09');setNotice('Example bookings restored.');setError('');setView('All rooms');setRoomPage(0);}
 function check(){setNotice('');setError('');let e=issue(form,bookings,editing);if(e){setError(e);}else setNotice('No conflict detected for the selected dates.');}
 return <div className="room-app"><header className="topbar"><div className="mark"><span className="mark-sq">R</span><span><strong>room<span>grid</span></strong><small>Campus spaces</small></span></div><nav aria-label="Main navigation"><button className={page==='availability'?'selected':''} aria-current={page==='availability'?'page':undefined} onClick={()=>navigate('availability')}>Availability</button><button className={page==='bookings'?'selected':''} aria-current={page==='bookings'?'page':undefined} onClick={()=>navigate('bookings')}>My bookings</button><button className={page==='reserve'?'selected':''} aria-current={page==='reserve'?'page':undefined} onClick={()=>{if(page!=='reserve'){setEditing(null);setForm({...formEmpty});setError('');setNotice('');}navigate('reserve');}}>Make reservation</button><button onClick={reset}>Reset demo</button></nav><div className="member"><span>Student dashboard</span><div className="profile">YOU</div></div></header>
  <main>
   <section className="intro"><div><span className="eyebrow">SPACES / RESERVATIONS</span><h1>{page==='availability'?'Find room availability':page==='bookings'?'Your bookings':editing?'Change reservation':'Make a reservation'}</h1><p>{page==='availability'?'Browse campus rooms and select an open date.':page==='bookings'?'Review and update your reservations.':'Choose a room and date range for your reservation.'}</p></div><div className="intro-summary"><span>ROOMS IN DIRECTORY</span><strong>{rooms.length.toString().padStart(2,'0')}</strong><span>CURRENT RESERVATIONS</span><strong>{bookings.length.toString().padStart(2,'0')}</strong></div></section>
   {page==='availability'&&<section className="calendar-pane"><div className="calendar-head"><div><span className="eyebrow">AVAILABILITY CALENDAR</span><h2>Rooms by day</h2></div><div className="weeknav"><button aria-label="Previous week" onClick={()=>setWeek(addDays(week,-7))}>←</button><strong>{human(week)} – {human(addDays(week,6))}</strong><button aria-label="Next week" onClick={()=>setWeek(addDays(week,7))}>→</button></div></div>
    <div className="calendar-controls"><div className="location-filter"><label htmlFor="location-room-filter">Location</label><RoomFilter value={view} rooms={rooms} onChange={room=>{setView(room);setRoomPage(0);}}/></div><span className="legend"><i className="booked"/> Reserved</span><span className="legend"><i className="free"/> Available</span><p>Click a day to start a reservation.</p></div>
    <div className="calendar-scroll"><div className="room-cal"><div className="corner">ROOM / DATE</div>{days.map(d=><div className="dayhead" key={d}><strong>{weekDay(d)}</strong><span>{human(d)}</span></div>)}{visibleRooms.map(room=><React.Fragment key={room}><div className="roomname"><strong>{room}</strong><small>Study room · {room[0]}</small></div>{days.map(day=>{const b=occupied(room,day);return <button key={room+day} type="button" disabled={Boolean(b)} title={`${room}, ${day}: ${b?'Reserved':'Available'}`} aria-label={`${room}, ${day}: ${b?'Reserved':'Available'}`} className={'slot '+(b?'taken':'available')} onClick={()=>pick(room,day)}><span>{b?'Booked':'Open'}</span>{b&&<small>{b.owner==='you'?'Your booking':'Reserved'}</small>}</button>})}</React.Fragment>)}</div></div>
    {pageCount>1&&<div className="room-pagination" aria-label="Room pages"><span aria-live="polite">Showing {roomPage*roomsPerPage+1}–{Math.min((roomPage+1)*roomsPerPage,roomList.length)} of {roomList.length} rooms</span><div><button type="button" disabled={roomPage===0} onClick={()=>setRoomPage(page=>page-1)}>Previous</button><span>Page {roomPage+1} of {pageCount}</span><button type="button" disabled={roomPage===pageCount-1} onClick={()=>setRoomPage(page=>page+1)}>Next</button></div></div>}
    <p className="calendar-note">Cells show individual dates. Reservations may span several dates; a day marked "Open" does not guarantee the full range you choose will be available.</p>
   </section>}
   {page==='bookings'&&<section className="reservations bookings-page"><div className="reservations-head"><h2>Your bookings</h2><span>{myBookings.length} current records</span></div><div className="reservations-list">{myBookings.map(b=><article key={b.id} className="reservation"><div className="room-chip">{b.roomNumber}</div><div className="reservation-body"><strong>{human(b.startDate)} – {human(b.endDate)}</strong><small>{b.purpose||'No purpose entered'}</small></div><button onClick={()=>edit(b)}>Change</button></article>)}{myBookings.length===0&&<p>No reservations yet. <button className="inline-link" onClick={()=>navigate('reserve')}>Make a reservation</button></p>}</div></section>}
   {page==='reserve'&&<aside className="booking-pane booking-page"><div className="panel-tag"><span>BOOK A ROOM</span><span>FORM 01</span></div><h2>{editing?'Change reservation':'Make a reservation'}</h2><p className="booking-description">Use this form to request a room for your study group, meeting or activity.</p>{notice&&<div className="success" role="status">{notice}</div>}{error&&<div className="error" role="alert">{error}</div>}<form onSubmit={submit}><label><span>Room number</span><RoomSelect value={form.roomNumber} rooms={rooms} onChange={room=>setForm(f=>({...f,roomNumber:room}))}/></label><div className="date-pair"><label><span>Start date</span><input type="date" value={form.startDate} onChange={e=>setForm(f=>({...f,startDate:e.target.value}))}/></label><label><span>End date</span><input type="date" value={form.endDate} onChange={e=>setForm(f=>({...f,endDate:e.target.value}))}/></label></div><label><span>Purpose / optional</span><textarea rows="5" placeholder="Meeting, group study..." value={form.purpose} onChange={e=>setForm(f=>({...f,purpose:e.target.value}))}/></label><p className="helper">Start and end dates are required. Reservations cannot overlap existing bookings for the same room.</p><button className="availability-check" type="button" onClick={check}>Check availability</button><button className="reserve-button" type="submit">{editing?'Save booking':'Confirm booking'}</button>{editing&&<button className="cancel-edit" type="button" onClick={()=>{setEditing(null);setForm({...formEmpty});setError('');}}>Cancel editing</button>}</form><div className="right-foot"><span>✦</span> Need a room for a group? Browse availability to find an open date.</div></aside>}
  </main><footer>ROOMGRID / Academic campus demo — local browser data only.</footer>
 </div>;
}
