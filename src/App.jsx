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
function issue(form,bookings,id){
 if(!form.roomNumber.trim()||!form.startDate||!form.endDate)return 'Complete the room and both dates.';
 if(form.endDate<=form.startDate)return 'End date must follow start date.';
 if(bookings.some(b=>b.id!==id&&b.roomNumber.toLowerCase()===form.roomNumber.trim().toLowerCase()&&form.startDate<b.endDate&&form.endDate>b.startDate))return 'This room is already booked for some of those dates.';
 return '';
}
export default function App(){
 const [bookings,setBookings]=useState(read);
 const [week,setWeek]=useState('2026-11-09');
 const [view,setView]=useState('All rooms');
 const [form,setForm]=useState({...formEmpty});
 const [editing,setEditing]=useState(null);
 const [error,setError]=useState('');
 const [notice,setNotice]=useState('');
 const [tab,setTab]=useState('Availability');
 const [roomSearch,setRoomSearch]=useState('');
 const [focusBooking,setFocusBooking]=useState(false);
 useEffect(()=>localStorage.setItem(STORAGE,JSON.stringify(bookings)),[bookings]);
 useEffect(()=>{if(tab==='My bookings'&&focusBooking){document.getElementById('booking-form')?.scrollIntoView({behavior:'smooth',block:'start'});document.getElementById('booking-room')?.focus({preventScroll:true});setFocusBooking(false);}},[tab,focusBooking]);
 const days=useMemo(()=>Array.from({length:7},(_,i)=>addDays(week,i)),[week]);
 const myBookings=bookings.filter(b=>b.owner==='you').sort((a,b)=>a.startDate.localeCompare(b.startDate));
 const roomList=rooms.filter(room=>(view==='All rooms'||room===view)&&room.toLowerCase().includes(roomSearch.trim().toLowerCase()));
 const openRooms=rooms.filter(room=>!bookings.some(b=>b.roomNumber===room&&days[0]>=b.startDate&&days[0]<b.endDate)).length;
 const occupied=(room,date)=>bookings.find(b=>b.roomNumber===room&&date>=b.startDate&&date<b.endDate);
 function pick(room,date){setForm({roomNumber:room,startDate:date,endDate:addDays(date,1),purpose:''});setEditing(null);setError('');setNotice('');setTab('My bookings');setFocusBooking(true);}
 function edit(row){if(row.owner!=='you')return;setEditing(row.id);setForm({roomNumber:row.roomNumber,startDate:row.startDate,endDate:row.endDate,purpose:row.purpose});setError('');setNotice('');}
 function submit(e){e.preventDefault();setNotice('');const err=issue(form,bookings,editing);if(err){setError(err);return;}const payload={roomNumber:form.roomNumber.trim(),startDate:form.startDate,endDate:form.endDate,purpose:form.purpose.trim(),owner:'you'};
 if(editing){setBookings(bookings.map(b=>b.id===editing?{...b,...payload}:b));setNotice('Booking updated successfully.');}else{setBookings([...bookings,{...payload,id:'b-'+Date.now()}]);setNotice('Room reserved successfully.');}setForm({...formEmpty});setEditing(null);setError('');}
 function reset(){setBookings(seed);setForm({...formEmpty});setEditing(null);setWeek('2026-11-09');setNotice('Sample schedule restored.');setError('');setView('All rooms');}
 function check(){setNotice('');setError('');let e=issue(form,bookings,editing);if(e){setError(e);}else setNotice('No conflicts detected for the selected dates.');}
 return <div className="room-app"><header className="topbar"><div className="brand"><span className="brand-mark">R</span><div className="brand-copy"><strong>Room<span>Grid</span></strong><small>Campus scheduling</small></div></div><nav className="topnav" aria-label="Primary navigation"><button className={tab==='Availability'?'selected':''} aria-current={tab==='Availability'?'page':undefined} onClick={()=>setTab('Availability')}>Availability</button><button className={tab==='My bookings'?'selected':''} aria-current={tab==='My bookings'?'page':undefined} onClick={()=>setTab('My bookings')}>My bookings</button><button className="reset-button" onClick={reset}>Reset demo</button></nav><div className="member"><span>Student dashboard</span><div className="profile" aria-label="Signed in as you">YOU</div></div></header>
  <main><section className="intro"><div className="intro-copy"><span className="eyebrow">Campus rooms</span><h1>{tab==='Availability'?'Find your next study space':'Your reservations'}</h1><p>{tab==='Availability'?'Compare room availability and plan your next study session with confidence.':'Review and manage your upcoming room reservations.'}</p></div></section>
   <section className="dashboard-stats" aria-label="Room booking overview"><article className="stat-card stat-primary"><div className="stat-icon">⌂</div><div><span>Available on {weekDay(days[0])}, {human(days[0])}</span><strong>{openRooms}<small> / {rooms.length} rooms</small></strong></div><span className="stat-caption">Based on selected week</span></article><article className="stat-card"><div className="stat-icon">▦</div><div><span>Rooms in directory</span><strong>{rooms.length.toString().padStart(2,'0')}</strong></div><span className="stat-caption">Across campus</span></article><article className="stat-card"><div className="stat-icon">✓</div><div><span>Your bookings</span><strong>{myBookings.length.toString().padStart(2,'0')}</strong></div><span className="stat-caption">Saved in this browser</span></article></section>
   {tab==='Availability'?<section className="calendar-pane availability-page"><div className="calendar-head"><div><span className="eyebrow">Availability calendar</span><h2>Explore rooms</h2><p className="section-description">Select an open day to start a reservation.</p></div><div className="weeknav"><button aria-label="Previous week" onClick={()=>setWeek(addDays(week,-7))}>←</button><strong>{human(week)} – {human(addDays(week,6))}</strong><button aria-label="Next week" onClick={()=>setWeek(addDays(week,7))}>→</button></div></div>
    <div className="calendar-controls"><label>Building / room<select value={view} onChange={e=>setView(e.target.value)}><option>All rooms</option>{rooms.map(r=><option key={r}>{r}</option>)}</select></label><label className="search-label">Search<input type="search" placeholder="Find a room..." value={roomSearch} onChange={e=>setRoomSearch(e.target.value)}/></label><span className="legend"><i className="booked"/>Reserved</span><span className="legend"><i className="free"/>Available</span></div>
    <div className="calendar-scroll"><div className="room-cal"><div className="corner">Room</div>{days.map(d=><div className="dayhead" key={d}><strong>{weekDay(d)}</strong><span>{human(d)}</span></div>)}{roomList.map((room)=><React.Fragment key={room}><div className="roomname"><strong>{room}</strong><small>Study room · Building {room[0]}</small></div>{days.map(day=>{const b=occupied(room,day);return <button key={room+day} type="button" disabled={Boolean(b)} title={`${room}, ${day}: ${b?'Reserved':'Available'}`} aria-label={`${room}, ${weekDay(day)} ${human(day)}: ${b?'Reserved':'Available'}`} className={'slot '+(b?'taken':'available')} onClick={()=>pick(room,day)}><span>{b?'Reserved':'Available'}</span>{b&&<small>{b.owner==='you'?'Your booking':'Booked'}</small>}</button>})}</React.Fragment>)}</div>{roomList.length===0&&<p className="empty-state">No rooms match your search. Try another room number or clear the location filter.</p>}</div>
    <p className="calendar-note">Availability is shown by day. An open day does not guarantee that the full date range you choose will be available.</p></section>
   :<div className="bookings-page"><section className="reservations reservations-page"><div className="reservations-head"><div><span className="eyebrow">My bookings</span><h2>Your reservations</h2></div><span>{myBookings.length} total</span></div><div className="reservations-list">{myBookings.map(b=><article key={b.id} className="reservation"><div className="room-chip">{b.roomNumber}</div><div className="reservation-body"><strong>{human(b.startDate)} – {human(b.endDate)}</strong><small>{b.purpose||'No purpose entered'}</small></div><button onClick={()=>{edit(b);window.scrollTo({top:0,behavior:'smooth'});}}>Edit</button></article>)}{myBookings.length===0&&<p className="empty-state">No reservations yet. Create one using the form.</p>}</div></section>
    <aside className="booking-pane" id="booking-form"><div className="panel-tag"><span>{editing?'Edit reservation':'New reservation'}</span><span>RoomGrid</span></div><h2>{editing?'Update reservation':'Reserve a room'}</h2><p className="booking-description">Tell us when and where you need a space. We’ll check for schedule conflicts before saving.</p>{notice&&<div className="success" role="status">{notice}</div>}{error&&<div className="error" role="alert">{error}</div>}<form onSubmit={submit}><label><span>Room</span><select id="booking-room" required value={form.roomNumber} onChange={e=>setForm(f=>({...f,roomNumber:e.target.value}))}><option value="">Select a room</option>{rooms.map(r=><option key={r} value={r}>{r} · Building {r[0]}</option>)}</select></label><div className="date-pair"><label><span>Start date</span><input required type="date" value={form.startDate} onChange={e=>setForm(f=>({...f,startDate:e.target.value}))}/></label><label><span>End date <small>(exclusive)</small></span><input required type="date" value={form.endDate} onChange={e=>setForm(f=>({...f,endDate:e.target.value}))}/></label></div><label><span>Purpose <small>(optional)</small></span><textarea rows="4" placeholder="Project discussion, revision session, group study..." value={form.purpose} onChange={e=>setForm(f=>({...f,purpose:e.target.value}))}/></label><p className="helper">The end date is not included in the reservation. Your booking cannot overlap another reservation for this room.</p><button className="availability-check" type="button" onClick={check}>Check availability</button><button className="reserve-button" type="submit">{editing?'Save changes':'Confirm reservation'}</button>{editing&&<button className="cancel-edit" type="button" onClick={()=>{setEditing(null);setForm({...formEmpty});setError('')}}>Cancel editing</button>}</form><div className="right-foot"><span>✦</span>Bookings are saved locally in this browser.</div></aside></div>}
  </main><footer>RoomGrid / Academic campus demo · Local browser data only</footer>
 </div>;
}
