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
 const [building,setBuilding]=useState('All buildings');
 const [subBuilding,setSubBuilding]=useState('All sub-buildings');
 const [route,setRoute]=useState(()=>window.location.pathname==='/reserve'?'reserve':window.location.pathname==='/my-bookings'?'my-bookings':'availability');
 const [form,setForm]=useState(()=>{const params=new URLSearchParams(window.location.search);return {roomNumber:params.get('room')||'',startDate:params.get('startDate')||'',endDate:params.get('endDate')||'',purpose:params.get('purpose')||''};});
 const [editing,setEditing]=useState(()=>new URLSearchParams(window.location.search).get('edit'));
 const [error,setError]=useState('');
 const [notice,setNotice]=useState('');
 const [tab,setTab]=useState('Availability');
 useEffect(()=>localStorage.setItem(STORAGE,JSON.stringify(bookings)),[bookings]);
 useEffect(()=>{
  function syncRoute(){const params=new URLSearchParams(window.location.search);const path=window.location.pathname;setRoute(path==='/reserve'?'reserve':path==='/my-bookings'?'my-bookings':'availability');if(path==='/reserve'){setForm({roomNumber:params.get('room')||'',startDate:params.get('startDate')||'',endDate:params.get('endDate')||'',purpose:params.get('purpose')||''});setEditing(params.get('edit'));}}
  window.addEventListener('popstate',syncRoute);return ()=>window.removeEventListener('popstate',syncRoute);
 },[]);
 const days=useMemo(()=>Array.from({length:7},(_,i)=>addDays(week,i)),[week]);
 const myBookings=bookings.filter(b=>b.owner==='you').sort((a,b)=>a.startDate.localeCompare(b.startDate));
 const subBuildings=[...new Set(rooms.filter(r=>building==='All buildings'||r.startsWith(building)).map(r=>r.slice(0,2)))].sort();
 const roomList=rooms.filter(room=>(building==='All buildings'||room.startsWith(building))&&(subBuilding==='All sub-buildings'||room.startsWith(subBuilding)));
 const occupied=(room,date)=>bookings.find(b=>b.roomNumber===room&&date>=b.startDate&&date<b.endDate);
 const openSlots=roomList.reduce((total,room)=>total+days.filter(day=>!occupied(room,day)).length,0);
 function openAvailability(){window.history.pushState({},'','/');setRoute('availability');setTab('Availability');}
 function openMyBookings(){window.history.pushState({},'','/my-bookings');setRoute('my-bookings');setTab('My bookings');window.scrollTo({top:0,behavior:'smooth'});}
 function openReservation(nextForm,editId=null){setForm(nextForm);setEditing(editId);setError('');setNotice('');const params=new URLSearchParams();Object.entries(nextForm).forEach(([key,value])=>{if(value)params.set(key==='roomNumber'?'room':key,value);});if(editId)params.set('edit',editId);window.history.pushState({},'',`/reserve?${params.toString()}`);setRoute('reserve');setTab('Availability');window.scrollTo({top:0,behavior:'smooth'});}
 function clearFilters(){setBuilding('All buildings');setSubBuilding('All sub-buildings');}
 function pick(room,date){openReservation({roomNumber:room,startDate:date,endDate:addDays(date,1),purpose:''});}
 function edit(row){if(row.owner!=='you')return;openReservation({roomNumber:row.roomNumber,startDate:row.startDate,endDate:row.endDate,purpose:row.purpose},row.id);}
 function submit(e){e.preventDefault();setNotice('');const err=issue(form,bookings,editing);if(err){setError(err);return;}const payload={roomNumber:form.roomNumber.trim(),startDate:form.startDate,endDate:form.endDate,purpose:form.purpose.trim(),owner:'you'};
 if(editing){setBookings(bookings.map(b=>b.id===editing?{...b,...payload}:b));}else{setBookings([...bookings,{...payload,id:'b-'+Date.now()}]);}setForm({...formEmpty});setEditing(null);setError('');openMyBookings();setNotice(editing?'Booking updated.':'Room reserved.');}
 function reset(){setBookings(seed);setForm({...formEmpty});setEditing(null);setWeek('2026-11-09');setNotice('Example bookings restored.');setError('');setBuilding('All buildings');setSubBuilding('All sub-buildings');openAvailability();}
 function check(){setNotice('');setError('');let e=issue(form,bookings,editing);if(e){setError(e);}else setNotice('No conflict detected for the selected dates.');}
 return <div className="room-app"><header className="topbar"><button className="mark" onClick={openAvailability} aria-label="Roomgrid home"><span className="mark-sq">R</span><span><strong>room<span>grid</span></strong><small>Campus spaces</small></span></button><nav aria-label="Main navigation"><button className={route==='availability'?'selected':''} onClick={openAvailability}>Availability</button><button className={route==='my-bookings'?'selected':''} onClick={openMyBookings}>My bookings</button><button onClick={reset}>Reset demo</button></nav><div className="member"><span>Student dashboard</span><div className="profile">YOU</div></div></header>
  {route==='reserve'?<main className="reserve-page"><button className="back-link" onClick={openAvailability}>‹ <span>Back to availability</span></button><section className="reserve-intro"><span className="eyebrow">CAMPUS SPACES <span className="eyebrow-divider">/</span> {editing?'EDIT BOOKING':'NEW BOOKING'}</span><h1>{editing?'Edit your reservation':'Reserve a study room'}</h1><p>{editing?'Update the room, dates, or purpose for your reservation.':'Choose your details below. You can review availability before confirming.'}</p></section><div className="reserve-layout"><section className="booking-pane reserve-form"><div className="panel-tag"><span>{editing?'YOUR RESERVATION':'BOOK A ROOM'}</span><span className="panel-step">{editing?'EDIT':'STEP 1'}</span></div><h2>{editing?'Update booking details':'Your booking details'}</h2><p className="booking-description">Fields marked required must be completed before you can confirm.</p>{notice&&<div className="success" role="status">{notice}</div>}{error&&<div className="error" role="alert">{error}</div>}<form onSubmit={submit}><label><span>Room number <small>(required)</small></span><input list="rooms" placeholder="e.g., B2-104" value={form.roomNumber} onChange={e=>setForm(f=>({...f,roomNumber:e.target.value}))} aria-label="Room number"/><datalist id="rooms">{rooms.map(r=><option key={r} value={r}/>)}</datalist></label><div className="date-pair"><label><span>Start date <small>(required)</small></span><input type="date" value={form.startDate} onChange={e=>setForm(f=>({...f,startDate:e.target.value}))} aria-label="Start date"/></label><label><span>End date <small>(exclusive)</small></span><input type="date" value={form.endDate} onChange={e=>setForm(f=>({...f,endDate:e.target.value}))} aria-label="End date, not included"/></label></div><p className="helper">End date is exclusive, so a booking ending on Friday makes the room available again from Friday.</p><label><span>Purpose <small>(optional)</small></span><textarea rows="3" placeholder="e.g., Group study" value={form.purpose} onChange={e=>setForm(f=>({...f,purpose:e.target.value}))}/></label><div className="form-actions"><button className="availability-check" type="button" onClick={check}>Check availability</button><button className="reserve-button" type="submit">{editing?'Save changes':'Confirm booking'}</button></div>{editing&&<button className="cancel-edit" type="button" onClick={openMyBookings}>Cancel editing</button>}</form></section><aside className="booking-guidance"><span className="guide-icon">✓</span><span className="eyebrow">GOOD TO KNOW</span><h2>{editing?'Your booking, your choice.':'A room that works for you.'}</h2><p>{editing?'Your existing reservation is excluded from conflict checks, so you can keep or change its dates and details.':'Choose an open date on the availability calendar to pre-fill your room and start date.'}</p><div className="guide-summary"><strong>{editing?'Your reservation':'Booking basics'}</strong><span>{form.roomNumber||'Choose a room'}{form.startDate?` · ${human(form.startDate)} – ${human(form.endDate)}`:''}</span></div><div className="right-foot"><span>i</span> Your bookings are saved in this browser.</div></aside></div></main>:route==='my-bookings'?<main className="my-bookings-page"><button className="back-link" onClick={openAvailability}>‹ <span>Back to availability</span></button><section className="reserve-intro"><span className="eyebrow">CAMPUS SPACES <span className="eyebrow-divider">/</span> ACCOUNT</span><h1>My bookings</h1><p>Review and edit your room reservations.</p></section><section className="my-bookings-panel"><div className="reservations-head"><h2>Your reservations</h2><span>{myBookings.length} {myBookings.length===1?'booking':'bookings'}</span></div><div className="reservations-list">{myBookings.map(b=><article key={b.id} className="reservation"><div className="room-chip">{b.roomNumber}</div><div className="reservation-body"><strong>{human(b.startDate)} – {human(b.endDate)}</strong><small>{b.purpose||'No purpose entered'}</small></div><button onClick={()=>edit(b)}>Edit</button></article>)}{myBookings.length===0&&<p className="empty-bookings">You don’t have any bookings yet. Choose an available day to reserve a room.</p>}</div></section>{notice&&<div className="success page-notice" role="status">{notice}</div>}</main>:<main><section className="intro"><div><span className="eyebrow">CAMPUS SPACES <span className="eyebrow-divider">/</span> RESERVATIONS</span><h1>Find your next study space.</h1><p>Browse room availability, choose your dates, and book in a few steps.</p></div><div className="intro-summary"><div className="summary-item"><span>ROOMS</span><strong>{rooms.length.toString().padStart(2,'0')}</strong></div><div className="summary-item"><span>RESERVATIONS</span><strong>{bookings.length.toString().padStart(2,'0')}</strong></div></div></section>{notice&&<div className="success page-notice" role="status">{notice}</div>}
   <section className="calendar-pane"><div className="calendar-head"><div><span className="eyebrow">PLAN YOUR VISIT</span><h2>Room availability</h2><p>Select an open day to start a booking.</p></div><div className="weeknav"><button aria-label="Previous week" onClick={()=>setWeek(addDays(week,-7))}>‹</button><strong>{human(week)} – {human(addDays(week,6))}</strong><button aria-label="Next week" onClick={()=>setWeek(addDays(week,7))}>›</button></div></div>
    <div className="calendar-controls"><div className="room-filters"><label><span>Building</span><select aria-label="Building" value={building} onChange={e=>{setBuilding(e.target.value);setSubBuilding('All sub-buildings');}}><option>All buildings</option>{['A','B','C','D'].map(b=><option key={b} value={b}>Building {b}</option>)}</select></label><label><span>Sub-building</span><select aria-label="Sub-building" value={subBuilding} onChange={e=>setSubBuilding(e.target.value)}><option>All sub-buildings</option>{subBuildings.map(b=><option key={b} value={b}>{b}</option>)}</select></label><button className="clear-filters" onClick={clearFilters} disabled={building==='All buildings'&&subBuilding==='All sub-buildings'}>Clear filters</button></div><div className="calendar-meta"><span className="legend"><i className="booked"/> Reserved</span><span className="legend"><i className="mine"/> Your booking</span><span className="legend"><i className="free"/> Available</span><span className="open-count">{openSlots} open {openSlots===1?'day':'days'}</span></div></div>
    <div className="calendar-scroll" role="region" aria-label="Room availability by day" tabIndex="0"><div className="room-cal"><div className="corner">ROOM</div>{days.map(d=><div className="dayhead" key={d}><strong>{weekDay(d)}</strong><span>{human(d)}</span></div>)}{roomList.map(room=><React.Fragment key={room}><div className="roomname"><strong>{room}</strong><small>Study room</small></div>{days.map(day=>{const b=occupied(room,day);const mine=b?.owner==='you';return <button key={room+day} title={`${room}, ${day}: ${b?(mine?'Your booking — click to edit':'Reserved'):'Available — click to book'}`} aria-label={`${room}, ${weekDay(day)} ${human(day)}: ${b?(mine?'your booking, click to edit':'reserved'):'available, click to book'}`} className={'slot '+(b?(mine?'mine':'taken'):'available')} disabled={Boolean(b&&!mine)} onClick={()=>mine?edit(b):!b&&pick(room,day)}><span>{b?(mine?'Your booking':'Reserved'):'Available'}</span></button>})}</React.Fragment>)}</div></div>
    <p className="calendar-note">Each cell represents one day. A multi-day booking is only confirmed after you check the full date range.</p>
    </section>
  </main>}
  <footer>ROOMGRID / Academic campus demo — local browser data only.</footer>
 </div>;
}
