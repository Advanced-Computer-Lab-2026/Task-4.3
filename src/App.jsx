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
 if(form.endDate<form.startDate)return 'The last day must be the same as or after the first day.';
 const endExclusive=addDays(form.endDate,1);
 if(bookings.some(b=>b.id!==id&&b.roomNumber.toLowerCase()===form.roomNumber.trim().toLowerCase()&&form.startDate<b.endDate&&endExclusive>b.startDate))return 'This room is already booked for some of those dates. Try another room or change the dates.';
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
 useEffect(()=>localStorage.setItem(STORAGE,JSON.stringify(bookings)),[bookings]);
 const days=useMemo(()=>Array.from({length:7},(_,i)=>addDays(week,i)),[week]);
 const myBookings=bookings.filter(b=>b.owner==='you').sort((a,b)=>a.startDate.localeCompare(b.startDate));
 const roomList=view==='All rooms'?rooms:rooms.filter(r=>r===view);
 const occupied=(room,date)=>bookings.find(b=>b.roomNumber===room&&date>=b.startDate&&date<b.endDate);
 function pick(room,date){setForm({roomNumber:room,startDate:date,endDate:date,purpose:''});setEditing(null);setError('');setNotice('');document.getElementById('booking-form')?.scrollIntoView({behavior:'smooth',block:'nearest'});}
 function edit(row){if(row.owner!=='you')return;setEditing(row.id);setForm({roomNumber:row.roomNumber,startDate:row.startDate,endDate:addDays(row.endDate,-1),purpose:row.purpose});setError('');setNotice('');setTab('Availability');requestAnimationFrame(()=>document.getElementById('booking-form')?.scrollIntoView({behavior:'smooth',block:'start'}));}
 function submit(e){e.preventDefault();setNotice('');const err=issue(form,bookings,editing);if(err){setError(err);return;}const payload={roomNumber:form.roomNumber.trim(),startDate:form.startDate,endDate:addDays(form.endDate,1),purpose:form.purpose.trim(),owner:'you'};
 if(editing){setBookings(bookings.map(b=>b.id===editing?{...b,...payload}:b));setNotice('Booking updated.');}else{setBookings([...bookings,{...payload,id:'b-'+Date.now()}]);setNotice('Room reserved.');}setForm({...formEmpty});setEditing(null);setError('');}
 function reset(){setBookings(seed);setForm({...formEmpty});setEditing(null);setWeek('2026-11-09');setNotice('Example bookings restored.');setError('');setView('All rooms');setTab('Availability');}
 function check(){setNotice('');setError('');let e=issue(form,bookings,editing);if(e){setError(e);}else setNotice('No conflict detected for the selected dates.');}
 const availableRooms=form.startDate&&form.endDate>=form.startDate?rooms.filter(room=>!bookings.some(b=>b.id!==editing&&b.roomNumber.toLowerCase()===room.toLowerCase()&&form.startDate<b.endDate&&addDays(form.endDate,1)>b.startDate)):[];
 const selectedRoomAvailable=availableRooms.some(room=>room.toLowerCase()===form.roomNumber.trim().toLowerCase());
 const profileLabel='My profile';
 const pageTitle=tab==='My bookings'?'My bookings':tab==='Profile'?'My profile':'Find room availability';
 const pageDescription=tab==='My bookings'?'View and update the rooms you have reserved.':tab==='Profile'?'Your student account and booking activity.':'Review campus rooms, dates and existing reservations in one view.';
 return <div className="room-app">
  <header className="topbar">
   <div className="mark"><span className="mark-sq">R</span><span><strong>room<span>grid</span></strong><small>Campus spaces</small></span></div>
   <nav>
    <button className={tab==='Availability'?'selected':''} onClick={()=>setTab('Availability')}>Availability</button>
    <button className={tab==='My bookings'?'selected':''} onClick={()=>setTab('My bookings')}>My bookings</button>
    <button onClick={reset}>Reset demo</button>
   </nav>
   <div className="member"><span>{profileLabel}</span><button className="profile" aria-label="Open your profile" title="Open your profile" onClick={()=>setTab('Profile')}>YOU</button></div>
  </header>
  <main>
   <section className="intro">
    <div><span className="eyebrow">{tab==='Availability'?'SPACES / RESERVATIONS':tab==='My bookings'?'YOUR RESERVATIONS':'ACCOUNT'}</span><h1>{pageTitle}</h1><p>{pageDescription}</p></div>
    <div className="intro-summary">
     <span>{tab==='My bookings'?'YOUR BOOKINGS':tab==='Profile'?'YOUR BOOKINGS':'ROOMS IN DIRECTORY'}</span><strong>{(tab==='Availability'?rooms.length:myBookings.length).toString().padStart(2,'0')}</strong>
     <span>{tab==='Availability'?'CURRENT RESERVATIONS':tab==='My bookings'?'ROOMS IN DIRECTORY':'ACCOUNT TYPE'}</span><strong>{tab==='Availability'?bookings.length.toString().padStart(2,'0'):tab==='My bookings'?rooms.length.toString().padStart(2,'0'):'STUDENT'}</strong>
    </div>
   </section>
   {tab==='Availability'&&<div className="pagegrid">
    <section className="calendar-pane">
     <div className="calendar-head"><div><span className="eyebrow">AVAILABILITY CALENDAR</span><h2>Rooms by day</h2></div><div className="weeknav"><button aria-label="Previous week" onClick={()=>setWeek(addDays(week,-7))}>←</button><strong>{human(week)} – {human(addDays(week,6))}</strong><button aria-label="Next week" onClick={()=>setWeek(addDays(week,7))}>→</button></div></div>
     <div className="calendar-controls"><label>Location <select value={view} onChange={e=>setView(e.target.value)}><option>All rooms</option>{rooms.map(r=><option key={r}>{r}</option>)}</select></label><span className="legend"><i className="booked"/> Reserved</span><span className="legend"><i className="free"/> Available</span><p>Click a day to enter it in the form.</p></div>
     <div className="calendar-scroll"><div className="room-cal"><div className="corner">ROOM / DATE</div>{days.map(d=><div className="dayhead" key={d}><strong>{weekDay(d)}</strong><span>{human(d)}</span></div>)}{roomList.map(room=><React.Fragment key={room}><div className="roomname"><strong>{room}</strong><small>Study room · {room[0]}</small></div>{days.map(day=>{const b=occupied(room,day);return <button key={room+day} title={`${room}, ${day}: ${b?'Reserved':'Available'}`} className={'slot '+(b?'taken':'available')} onClick={()=>pick(room,day)}><span>{b?'Booked':'Open'}</span>{b&&<small>{b.owner==='you'?'Your booking':'Reserved'}</small>}</button>})}</React.Fragment>)}</div></div>
     <p className="calendar-note">Cells show individual dates. Reservations may span several dates; a day marked "Open" does not guarantee the full range you choose will be available.</p>
    </section>
    <aside className="booking-pane" id="booking-form"><div className="panel-tag"><span>BOOK A ROOM</span><span>FORM 01</span></div><h2>{editing?'Change reservation':'Make a reservation'}</h2><p className="booking-description">Use this panel to request a room for your study group, meeting or activity.</p>{notice&&<div className="success" role="status">{notice}</div>}{error&&<div className="error" role="alert">{error}</div>}<form onSubmit={submit}><label><span>Room number</span><input list="rooms" placeholder="e.g., B2-104" value={form.roomNumber} onChange={e=>setForm(f=>({...f,roomNumber:e.target.value}))}/><datalist id="rooms">{rooms.map(r=><option key={r} value={r}/>)}</datalist></label><div className="date-pair"><label><span>First day</span><input type="date" required value={form.startDate} onChange={e=>setForm(f=>({...f,startDate:e.target.value}))}/></label><label><span>Last day (included)</span><input type="date" required min={form.startDate||undefined} value={form.endDate} onChange={e=>setForm(f=>({...f,endDate:e.target.value}))}/></label></div>{form.startDate&&form.endDate&&form.endDate>=form.startDate&&<div className="room-finder" aria-live="polite"><strong>{availableRooms.length} rooms available for these dates</strong>{availableRooms.length>0?<div className="room-options">{availableRooms.map(room=><button type="button" key={room} className={form.roomNumber.toLowerCase()===room.toLowerCase()?'active':''} onClick={()=>{setForm(f=>({...f,roomNumber:room}));setError('');setNotice('')}}>{room}</button>)}</div>:<p>Try a different date range to find an open room.</p>}{form.roomNumber&&!selectedRoomAvailable&&<p className="room-conflict">This room is booked for at least one of these dates. Choose an available room above.</p>}</div>}<label><span>Purpose / optional</span><textarea rows="5" placeholder="Meeting, group study..." value={form.purpose} onChange={e=>setForm(f=>({...f,purpose:e.target.value}))}/></label><p className="helper">Both dates are included. Bookings cannot overlap another reservation in the same room.</p><button className="availability-check" type="button" onClick={check}>Check availability</button><button className="reserve-button" type="submit">{editing?'Save booking':'Confirm booking'}</button>{editing&&<button className="cancel-edit" type="button" onClick={()=>{setEditing(null);setForm({...formEmpty});setError('')}}>Cancel editing</button>}</form><div className="right-foot"><span>✦</span> Need a room for a group? Find an open date and submit your request.</div></aside>
   </div>}
   {tab==='My bookings'&&<section className="dashboard-panel"><div className="dashboard-heading"><div><span className="eyebrow">MANAGE RESERVATIONS</span><h2>Your bookings</h2></div><span>{myBookings.length} {myBookings.length===1?'booking':'bookings'}</span></div><div className="reservations-list">{myBookings.map(b=><article key={b.id} className="reservation"><div className="room-chip">{b.roomNumber}</div><div className="reservation-body"><strong>{human(b.startDate)} – {human(addDays(b.endDate,-1))}</strong><small>{b.purpose||'No purpose entered'}</small></div><button onClick={()=>edit(b)}>Change</button></article>)}{myBookings.length===0&&<div className="empty-state"><h3>No bookings yet</h3><p>Find an available room and reserve it to see it here.</p><button onClick={()=>setTab('Availability')}>Browse availability</button></div>}</div></section>}
   {tab==='Profile'&&<section className="profile-dashboard">
    <article className="profile-card"><div className="profile-avatar">YOU</div><div><span className="eyebrow">STUDENT PROFILE</span><h2>You</h2><p>Signed in student</p></div></article>
    <section className="dashboard-panel profile-activity"><div className="dashboard-heading"><div><span className="eyebrow">YOUR ACCOUNT</span><h2>Booking activity</h2></div><button className="text-button" onClick={()=>setTab('My bookings')}>View my bookings</button></div><div className="profile-stats"><div><span>Total bookings</span><strong>{myBookings.length}</strong></div><div><span>Available rooms</span><strong>{rooms.length}</strong></div><div><span>All reservations</span><strong>{bookings.length}</strong></div></div></section>
   </section>}
  </main>
  <footer>ROOMGRID / Academic campus demo — local browser data only.</footer>
 </div>;
}
