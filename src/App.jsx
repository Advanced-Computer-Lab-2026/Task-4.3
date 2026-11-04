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
// Buildings are derived from the first letter of each room number (A, B, C, D).
const buildings=[...new Set(rooms.map(r=>r[0]))];
const roomsIn=building=>rooms.filter(r=>r[0]===building);
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
// Shared field set used by both the "Make a reservation" panel and the "Change booking" dialog.
function BookingFields({value,onChange,idPrefix,autoFocus}){
 const set=key=>e=>onChange(f=>({...f,[key]:e.target.value}));
 return <><label htmlFor={idPrefix+'-room'}><span>Room number</span><input id={idPrefix+'-room'} list="rooms" placeholder="e.g., B2-104" autoFocus={autoFocus} value={value.roomNumber} onChange={set('roomNumber')}/></label><div className="date-pair"><label htmlFor={idPrefix+'-start'}><span>Start date</span><input id={idPrefix+'-start'} type="date" value={value.startDate} onChange={set('startDate')}/></label><label htmlFor={idPrefix+'-end'}><span>End date</span><input id={idPrefix+'-end'} type="date" value={value.endDate} onChange={set('endDate')}/></label></div><label htmlFor={idPrefix+'-purpose'}><span>Purpose / optional</span><textarea id={idPrefix+'-purpose'} rows="4" placeholder="Meeting, group study..." value={value.purpose} onChange={set('purpose')}/></label></>;
}
export default function App(){
 const [bookings,setBookings]=useState(read);
 const [week,setWeek]=useState('2026-11-09');
 const [building,setBuilding]=useState(buildings[0]);
 const [view,setView]=useState('All rooms');
 const [form,setForm]=useState({...formEmpty});
 const [error,setError]=useState('');
 const [notice,setNotice]=useState('');
 const [tab,setTab]=useState('Availability');
 // Editing state lives in its own dialog, separate from the new-booking panel.
 const [editing,setEditing]=useState(null);
 const [editForm,setEditForm]=useState({...formEmpty});
 const [editError,setEditError]=useState('');
 const [editNotice,setEditNotice]=useState('');
 const [listNotice,setListNotice]=useState('');
 const editTrigger=useRef(null);
 useEffect(()=>localStorage.setItem(STORAGE,JSON.stringify(bookings)),[bookings]);
 useEffect(()=>{if(!editing)return;const onKey=e=>{if(e.key==='Escape')closeEdit();};document.addEventListener('keydown',onKey);return()=>document.removeEventListener('keydown',onKey);},[editing]);
 const days=useMemo(()=>Array.from({length:7},(_,i)=>addDays(week,i)),[week]);
 const myBookings=bookings.filter(b=>b.owner==='you').sort((a,b)=>a.startDate.localeCompare(b.startDate));
 const buildingRooms=roomsIn(building);
 const roomList=view==='All rooms'?buildingRooms:buildingRooms.filter(r=>r===view);
 const weekEnd=addDays(week,7);
 const bookingsThisWeek=bookings.filter(b=>b.startDate<weekEnd&&b.endDate>week).length;
 const editingRow=bookings.find(b=>b.id===editing);
 const occupied=(room,date)=>bookings.find(b=>b.roomNumber===room&&date>=b.startDate&&date<b.endDate);
 function pick(room,date){setForm({roomNumber:room,startDate:date,endDate:addDays(date,1),purpose:''});setError('');document.getElementById('booking-form')?.scrollIntoView({behavior:'smooth',block:'nearest'});}
 function chooseBuilding(b){setBuilding(b);setView('All rooms');}
 function edit(row,trigger){if(row.owner!=='you')return;editTrigger.current=trigger||null;setEditing(row.id);setEditForm({roomNumber:row.roomNumber,startDate:row.startDate,endDate:row.endDate,purpose:row.purpose});setEditError('');setEditNotice('');setListNotice('');}
 function closeEdit(){setEditing(null);setEditForm({...formEmpty});setEditError('');setEditNotice('');editTrigger.current?.focus();}
 function submit(e){e.preventDefault();setNotice('');const err=issue(form,bookings,null);if(err){setError('Reservation failed. Review the selected dates.');return;}
 setBookings([...bookings,{roomNumber:form.roomNumber.trim(),startDate:form.startDate,endDate:form.endDate,purpose:form.purpose.trim(),owner:'you',id:'b-'+Date.now()}]);setNotice('Room reserved.');setForm({...formEmpty});setError('');}
 function saveEdit(e){e.preventDefault();setEditNotice('');const err=issue(editForm,bookings,editing);if(err){setEditError('Reservation failed. Review the selected dates.');return;}const payload={roomNumber:editForm.roomNumber.trim(),startDate:editForm.startDate,endDate:editForm.endDate,purpose:editForm.purpose.trim(),owner:'you'};
 setBookings(bookings.map(b=>b.id===editing?{...b,...payload}:b));setListNotice(`Booking updated: ${payload.roomNumber}, ${human(payload.startDate)} – ${human(payload.endDate)}.`);closeEdit();}
 function reset(){setBookings(seed);setForm({...formEmpty});setEditing(null);setWeek('2026-11-09');setNotice('Example bookings restored.');setError('');setListNotice('');setBuilding(buildings[0]);setView('All rooms');}
 function check(){setNotice('');setError('');let e=issue(form,bookings,null);if(e){setError(e);}else setNotice('No conflict detected for the selected dates.');}
 function checkEdit(){setEditNotice('');setEditError('');let e=issue(editForm,bookings,editing);if(e){setEditError(e);}else setEditNotice('No conflict detected for the selected dates.');}
 return <div className="room-app"><header className="topbar"><div className="mark"><span className="mark-sq">R</span><span><strong>room<span>grid</span></strong><small>Campus spaces</small></span></div><nav><button className={tab==='Availability'?'selected':''} onClick={()=>setTab('Availability')}>Availability</button><button className={tab==='My bookings'?'selected':''} onClick={()=>{setTab('My bookings');document.getElementById('my-reservations')?.scrollIntoView({behavior:'smooth'});}}>My bookings</button><button onClick={reset}>Reset demo</button></nav><div className="member"><span>Student dashboard</span><div className="profile">YOU</div></div></header>
  <main><section className="intro"><div><span className="eyebrow">SPACES / RESERVATIONS</span><h1>Find room availability</h1><p>Review campus rooms, dates and existing reservations in one view.</p></div><div className="intro-summary"><div><span>ROOMS YOU CAN BOOK</span><small>Across {buildings.length} buildings</small></div><strong>{rooms.length}</strong><div><span>BOOKINGS THIS WEEK</span><small>{human(week)} – {human(addDays(week,6))}, all buildings</small></div><strong>{bookingsThisWeek}</strong></div></section>
   <div className="pagegrid"><section className="calendar-pane"><div className="calendar-head"><div><span className="eyebrow">AVAILABILITY CALENDAR</span><h2>Rooms by day</h2></div><div className="weeknav"><button aria-label="Previous week" onClick={()=>setWeek(addDays(week,-7))}>←</button><strong>{human(week)} – {human(addDays(week,6))}</strong><button aria-label="Next week" onClick={()=>setWeek(addDays(week,7))}>→</button></div></div>
    <div className="building-tabs" role="tablist" aria-label="Buildings">{buildings.map(bd=>{const n=roomsIn(bd).length;return <button key={bd} role="tab" aria-selected={building===bd} className={building===bd?'active':''} onClick={()=>chooseBuilding(bd)}>Building {bd}<small>{n} room{n===1?'':'s'}</small></button>;})}</div>
    <div className="calendar-controls"><label>Room <select value={view} onChange={e=>setView(e.target.value)}><option value="All rooms">All rooms in Building {building}</option>{buildingRooms.map(r=><option key={r}>{r}</option>)}</select></label><span className="legend"><i className="booked"/> Reserved</span><span className="legend"><i className="mine"/> Your booking</span><span className="legend"><i className="free"/> Available</span><p>Click a day to enter it in the form.</p></div>
    <div className="calendar-scroll"><div className="room-cal"><div className="corner">ROOM / DATE</div>{days.map(d=><div className="dayhead" key={d}><strong>{weekDay(d)}</strong><span>{human(d)}</span></div>)}{roomList.map(room=><React.Fragment key={room}><div className="roomname"><strong>{room}</strong><small>Study room · {room[0]}</small></div>{days.map(day=>{const b=occupied(room,day);const mine=b&&b.owner==='you';return <button key={room+day} title={`${room}, ${day}: ${mine?'Your booking':b?'Reserved':'Available'}`} className={'slot '+(mine?'taken mine':b?'taken':'available')} onClick={()=>pick(room,day)}>{mine?<><span><b aria-hidden="true">★</b> Your booking</span><small>{b.purpose||'No purpose entered'}</small></>:<><span>{b?'Booked':'Open'}</span>{b&&<small>Reserved</small>}</>}</button>})}</React.Fragment>)}</div></div>
    <p className="calendar-note">Cells show individual dates. Reservations may span several dates; a day marked "Open" does not guarantee the full range you choose will be available.</p>
    <section id="my-reservations" className="reservations"><div className="reservations-head"><h2>Your bookings</h2><span>{myBookings.length} current records</span></div>{listNotice&&<div className="success" role="status">{listNotice}</div>}<div className="reservations-list">{myBookings.map(b=><article key={b.id} className="reservation"><div className="room-chip">{b.roomNumber}</div><div className="reservation-body"><strong>{human(b.startDate)} – {human(b.endDate)}</strong><small>{b.purpose||'No purpose entered'}</small></div><button aria-haspopup="dialog" onClick={e=>edit(b,e.currentTarget)}>Change</button></article>)}{myBookings.length===0&&<p>No reservations.</p>}</div></section></section>
    <aside className="booking-pane" id="booking-form"><div className="panel-tag"><span>BOOK A ROOM</span><span>FORM 01</span></div><h2>Make a reservation</h2><p className="booking-description">Use this panel to request a room for your study group, meeting or activity.</p>{notice&&<div className="success" role="status">{notice}</div>}{error&&<div className="error" role="alert">{error}</div>}<form onSubmit={submit}><BookingFields value={form} onChange={setForm} idPrefix="new"/><p className="helper">Start and end dates are required. Reservations cannot overlap existing bookings for the same room.</p><button className="availability-check" type="button" onClick={check}>Check availability</button><button className="reserve-button" type="submit">Confirm booking</button></form><div className="right-foot"><span>✦</span> Need a room for a group? Find an open date and submit your request.</div></aside></div>
  </main><footer>ROOMGRID / Academic campus demo — local browser data only.</footer>
  <datalist id="rooms">{rooms.map(r=><option key={r} value={r}/>)}</datalist>
  {editing&&editingRow&&<div className="modal-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)closeEdit();}}><div className="modal booking-pane" role="dialog" aria-modal="true" aria-labelledby="edit-title"><div className="modal-head"><div><span className="eyebrow">CHANGE RESERVATION</span><h2 id="edit-title">Change booking — {editingRow.roomNumber}</h2><p className="booking-description">Currently {human(editingRow.startDate)} – {human(editingRow.endDate)}{editingRow.purpose?` · ${editingRow.purpose}`:''}</p></div><button type="button" className="modal-close" aria-label="Close without saving" onClick={closeEdit}>✕</button></div>{editNotice&&<div className="success" role="status">{editNotice}</div>}{editError&&<div className="error" role="alert">{editError}</div>}<form onSubmit={saveEdit}><BookingFields value={editForm} onChange={setEditForm} idPrefix="edit" autoFocus/><p className="helper">Start and end dates are required. Reservations cannot overlap existing bookings for the same room.</p><button className="availability-check" type="button" onClick={checkEdit}>Check availability</button><div className="modal-actions"><button className="cancel-button" type="button" onClick={closeEdit}>Cancel</button><button className="reserve-button" type="submit">Save changes</button></div></form></div></div>}
 </div>;
}
