import React,{useEffect,useMemo,useRef,useState} from 'react';

const STORAGE='acl-roomgrid-18rooms-v1';
const rooms=['A1-203', 'A2-106', 'A2-107', 'A3-208', 'A3-209', 'B1-205', 'B1-206', 'B1-207', 'B2-104', 'B2-105', 'B3-301', 'C1-102', 'C1-103', 'C2-201', 'C2-202', 'C3-101', 'C3-102', 'D1-101'];
const buildings=[...new Set(rooms.map(room=>room.split('-')[0]))];
// Sample reservations were authored with exclusive end dates; convert them to inclusive dates.
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
const seed=sampleRows.map(([roomNumber,startDate,endDate,purpose,owner],index)=>({id:`demo-${index+1}`,roomNumber,startDate,endDate:addDays(endDate,-1),purpose,owner}));
const formEmpty={roomNumber:'',startDate:'',endDate:'',purpose:''};
function read(){try{let a=JSON.parse(localStorage.getItem(STORAGE));return Array.isArray(a)?a:seed;}catch{return seed;}}
function addDays(iso,days){const t=new Date(`${iso}T12:00:00Z`);t.setUTCDate(t.getUTCDate()+days);return t.toISOString().slice(0,10);}
function human(iso){return new Date(`${iso}T12:00:00Z`).toLocaleDateString('en-GB',{timeZone:'UTC',day:'numeric',month:'short'});}
function weekDay(iso){return new Date(`${iso}T12:00:00Z`).toLocaleDateString('en-GB',{timeZone:'UTC',weekday:'short'});}
function issue(form,bookings,id){
 if(!form.roomNumber.trim()||!form.startDate||!form.endDate)return 'Complete the room and both dates.';
 if(form.endDate<form.startDate)return 'End date cannot be before start date.';
 if(bookings.some(b=>b.id!==id&&b.roomNumber.toLowerCase()===form.roomNumber.trim().toLowerCase()&&form.startDate<=b.endDate&&form.endDate>=b.startDate))return 'This room is already booked for some of those dates.';
 return '';
}
export default function App(){
 const [bookings,setBookings]=useState(read);
 const [week,setWeek]=useState('2026-11-09');
 const [building,setBuilding]=useState('All buildings');
 const [view,setView]=useState('All rooms');
 const [roomSearch,setRoomSearch]=useState('');
 const [availableOnly,setAvailableOnly]=useState(false);
 const [form,setForm]=useState({...formEmpty});
 const [editing,setEditing]=useState(null);
 const [selectedSlot,setSelectedSlot]=useState(null);
 const [confirmDelete,setConfirmDelete]=useState(false);
 const previousFocus=useRef(null);
 const [error,setError]=useState('');
 const [notice,setNotice]=useState('');
 const [tab,setTab]=useState('Availability');
 const modalOpen=selectedSlot!==null||editing!==null;
 useEffect(()=>localStorage.setItem(STORAGE,JSON.stringify(bookings)),[bookings]);
 const days=useMemo(()=>Array.from({length:7},(_,i)=>addDays(week,i)),[week]);
 const myBookings=bookings.filter(b=>b.owner==='you').sort((a,b)=>a.startDate.localeCompare(b.startDate));
 const occupied=(room,date)=>bookings.find(b=>b.roomNumber===room&&date>=b.startDate&&date<=b.endDate);
 const buildingRooms=rooms.filter(room=>building==='All buildings'||room.startsWith(`${building}-`));
 const roomList=buildingRooms.filter(room=>(view==='All rooms'||room===view)&&room.toLowerCase().includes(roomSearch.trim().toLowerCase())&&(!availableOnly||days.some(day=>!occupied(room,day))));
 useEffect(()=>{if(!modalOpen)return;const previousOverflow=document.body.style.overflow;document.body.style.overflow='hidden';function handleDialogKeys(event){if(event.key==='Escape'){if(confirmDelete){setConfirmDelete(false);return;}closeReservation();return;}if(event.key!=='Tab')return;const pane=document.getElementById('booking-form');const focusable=pane?.querySelectorAll('button:not([disabled]), input:not([disabled]), textarea:not([disabled])');if(!focusable?.length)return;const first=focusable[0];const last=focusable[focusable.length-1];if(!pane.contains(document.activeElement)||event.shiftKey&&document.activeElement===first){event.preventDefault();(event.shiftKey?last:first).focus();}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}}window.addEventListener('keydown',handleDialogKeys);return()=>{document.body.style.overflow=previousOverflow;window.removeEventListener('keydown',handleDialogKeys);};},[modalOpen,confirmDelete]);
 function closeReservation(){setSelectedSlot(null);setEditing(null);setConfirmDelete(false);requestAnimationFrame(()=>previousFocus.current?.focus());}
 function pick(room,date){previousFocus.current=document.activeElement;setForm({roomNumber:room,startDate:date,endDate:date,purpose:''});setEditing(null);setConfirmDelete(false);setSelectedSlot({room,date});setError('');setNotice('');requestAnimationFrame(()=>document.getElementById('room-number')?.focus({preventScroll:true}));}
 function edit(row){if(row.owner!=='you')return;previousFocus.current=document.activeElement;setEditing(row.id);setConfirmDelete(false);setSelectedSlot(null);setForm({roomNumber:row.roomNumber,startDate:row.startDate,endDate:row.endDate,purpose:row.purpose});setError('');setNotice('');requestAnimationFrame(()=>document.getElementById('room-number')?.focus({preventScroll:true}));}
 function deleteReservation(){const deletedId=editing;if(!deletedId)return;setBookings(current=>current.filter(booking=>booking.id!==deletedId));setEditing(null);setConfirmDelete(false);setError('');setNotice('');requestAnimationFrame(()=>document.getElementById('availability')?.focus());}
 function submit(e){e.preventDefault();setNotice('');const err=issue(form,bookings,editing);if(err){setError(err);return;}const payload={roomNumber:form.roomNumber.trim(),startDate:form.startDate,endDate:form.endDate,purpose:form.purpose.trim(),owner:'you'};
 if(editing){setBookings(bookings.map(b=>b.id===editing?{...b,...payload}:b));setNotice('Booking updated.');}else{setBookings([...bookings,{...payload,id:'b-'+Date.now()}]);setNotice('Room reserved.');}setForm({...formEmpty});setEditing(null);setSelectedSlot(null);setConfirmDelete(false);setError('');}
 function reset(){setBookings(seed);setForm({...formEmpty});setEditing(null);setSelectedSlot(null);setConfirmDelete(false);setWeek('2026-11-09');setNotice('Example bookings restored.');setError('');setBuilding('All buildings');setView('All rooms');setRoomSearch('');setAvailableOnly(false);}
 function check(){setNotice('');setError('');let e=issue(form,bookings,editing);if(e){setError(e);}else setNotice('No conflict detected for the selected dates.');}
 return <div className="room-app"><header className="topbar"><div className="mark"><span className="mark-sq">R</span><span><strong>room<span>grid</span></strong><small>Campus spaces</small></span></div><nav aria-label="Main navigation"><button className={tab==='Availability'?'selected':''} aria-current={tab==='Availability'?'page':undefined} onClick={()=>{setTab('Availability');document.getElementById('availability')?.scrollIntoView({behavior:'smooth'});}}>Availability</button><button className={tab==='My bookings'?'selected':''} aria-current={tab==='My bookings'?'page':undefined} onClick={()=>{setTab('My bookings');document.getElementById('my-reservations')?.scrollIntoView({behavior:'smooth'});}}>My bookings</button><button onClick={reset}>Reset demo</button></nav><div className="member"><span>Student dashboard</span><div className="profile">YOU</div></div></header>
  <main><section className="intro"><div><span className="eyebrow">SPACES / RESERVATIONS</span><h1>Find room availability</h1><p>Review campus rooms, dates and existing reservations in one view.</p></div><div className="intro-summary"><span>ROOMS IN DIRECTORY</span><strong>{rooms.length.toString().padStart(2,'0')}</strong><span>CURRENT RESERVATIONS</span><strong>{bookings.length.toString().padStart(2,'0')}</strong></div></section>
   <div className="pagegrid"><section className="calendar-pane" id="availability" tabIndex="-1"><div className="calendar-head"><div><span className="eyebrow">AVAILABILITY CALENDAR</span><h2>Rooms by day</h2><p className="calendar-subtitle">Choose an open date to start a reservation.</p></div><div className="weeknav"><button aria-label="Previous week" onClick={()=>setWeek(addDays(week,-7))}>←</button><strong>{human(week)} – {human(addDays(week,6))}</strong><button aria-label="Next week" onClick={()=>setWeek(addDays(week,7))}>→</button></div></div>
    <div className="calendar-controls"><label>Building <select aria-label="Filter by building" value={building} onChange={e=>{setBuilding(e.target.value);setView('All rooms');}}><option>All buildings</option>{buildings.map(name=><option key={name} value={name}>Building {name}</option>)}</select></label><label>Location <select aria-label="Filter by room" value={view} onChange={e=>setView(e.target.value)}><option>All rooms</option>{buildingRooms.map(room=><option key={room} value={room}>{room}</option>)}</select></label><label className="room-search">Search rooms<input type="search" value={roomSearch} onChange={e=>setRoomSearch(e.target.value)} placeholder="e.g. A2-106" aria-label="Search rooms by room number"/></label><label className="availability-filter"><input type="checkbox" checked={availableOnly} onChange={e=>setAvailableOnly(e.target.checked)}/>Show rooms with open dates</label><span className="legend"><i className="booked"/> Reserved</span><span className="legend"><i className="free"/> Available</span><p>{roomList.length} of {buildingRooms.length} rooms</p></div>
    <div className="calendar-scroll"><div className="room-cal" role="grid" aria-label={`Room availability, ${human(week)} to ${human(addDays(week,6))}`}><div className="calendar-row" role="row"><div className="corner" role="columnheader">ROOM / DATE</div>{days.map(d=><div className="dayhead" role="columnheader" key={d}><strong>{weekDay(d)}</strong><span>{human(d)}</span></div>)}</div>{roomList.map(room=><div className="calendar-row" role="row" key={room}><div className="roomname" role="rowheader"><strong>{room}</strong><small>Study room · {room[0]}</small></div>{days.map(day=>{const b=occupied(room,day);return b?(b.owner==='you'?<div key={room+day} role="gridcell" className="slot taken own-booking"><button type="button" aria-label={`Edit or delete your reservation for ${room} on ${weekDay(day)} ${human(day)}`} title={`${b.purpose||'Your reservation'} · Click to edit or delete`} className="slot-action own-booking-action" onClick={()=>edit(b)}><span>Reserved</span><small>Your booking · Edit</small></button></div>:<div key={room+day} role="gridcell" aria-label={`${room}, ${weekDay(day)} ${human(day)}: reserved`} title={b.purpose||'Reserved'} className="slot taken"><span>Reserved</span><small>Unavailable</small></div>):<div key={room+day} role="gridcell" className="slot available"><button type="button" aria-label={`Book ${room} on ${weekDay(day)}`} title={`Book ${room} on ${weekDay(day)}`} className="slot-action" onClick={()=>pick(room,day)}><span>Open</span><small>Select date</small></button></div>})}</div>)}</div>{roomList.length===0&&<p className="empty-rooms">No rooms match these filters. Try a different room or turn off the open-dates filter.</p>}</div>
    <p className="calendar-note">Cells show individual dates. Reservations may span several dates; a day marked "Open" does not guarantee the full range you choose will be available.</p>
    <section id="my-reservations" className="reservations"><div className="reservations-head"><h2>Your bookings</h2><span>{myBookings.length} current records</span></div><div className="reservations-list">{myBookings.map(b=><article key={b.id} className="reservation"><div className="room-chip">{b.roomNumber}</div><div className="reservation-body"><strong>{human(b.startDate)} – {human(b.endDate)}</strong><small>{b.purpose||'No purpose entered'}</small></div><button onClick={()=>edit(b)}>Change</button></article>)}{myBookings.length===0&&<p>No reservations.</p>}</div></section></section></div>
    {modalOpen&&<div className="booking-layer booking-layer-open" onMouseDown={event=>{if(event.target===event.currentTarget)closeReservation();}}><aside className="booking-pane booking-pane-selected" id="booking-form" role="dialog" aria-modal="true" aria-labelledby="booking-title"><div className="panel-tag"><span>BOOK A ROOM</span><span>FORM 01</span><button className="close-booking" type="button" aria-label="Close reservation form" onClick={closeReservation}>×</button></div><h2 id="booking-title">{editing?'Change reservation':'Make a reservation'}</h2><p className="booking-description">Use this panel to request a room for your study group, meeting or activity.</p>{selectedSlot&&<div className="selection-prompt" role="status">Selected <strong>{selectedSlot.room}</strong> for <strong>{human(selectedSlot.date)}</strong>. Review your details, then confirm below.</div>}{notice&&<div className="success" role="status">{notice}</div>}{error&&<div className="error" role="alert">{error}</div>}<form onSubmit={submit}><label><span>Room number</span><input id="room-number" list="rooms" placeholder="e.g., B2-104" value={form.roomNumber} onChange={e=>setForm(f=>({...f,roomNumber:e.target.value}))}/><datalist id="rooms">{rooms.map(r=><option key={r} value={r}/>)}</datalist></label><div className="date-pair"><label><span>Start date</span><input type="date" value={form.startDate} onChange={e=>setForm(f=>({...f,startDate:e.target.value}))}/></label><label><span>End date</span><input type="date" value={form.endDate} onChange={e=>setForm(f=>({...f,endDate:e.target.value}))}/></label></div><label><span>Purpose / optional</span><textarea rows="5" placeholder="Meeting, group study..." value={form.purpose} onChange={e=>setForm(f=>({...f,purpose:e.target.value}))}/></label><p className="helper">The end date is included. Reservations cannot overlap existing bookings for the same room.</p>{confirmDelete&&<div className="delete-confirm" role="alert"><strong>Delete this reservation?</strong><span>This can’t be undone.</span><div><button type="button" className="cancel-delete" onClick={()=>setConfirmDelete(false)}>Keep reservation</button><button type="button" className="delete-button" onClick={deleteReservation}>Delete reservation</button></div></div>}<button className="availability-check" type="button" onClick={check}>Check availability</button><button className="reserve-button" type="submit">{editing?'Save changes':'Confirm reservation'}</button>{editing&&!confirmDelete&&<button className="delete-trigger" type="button" onClick={()=>setConfirmDelete(true)}>Delete reservation</button>}</form><div className="right-foot"><span>✦</span> Need a room for a group? Find an open date and submit your request.</div></aside></div>}
  </main><footer>ROOMGRID / Academic campus demo — local browser data only.</footer>
 </div>;
}
