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
function read(){try{let a=JSON.parse(localStorage.getItem(STORAGE));return Array.isArray(a)?a:seed;}catch{return seed;}}
function addDays(iso,days){const t=new Date(`${iso}T12:00:00Z`);t.setUTCDate(t.getUTCDate()+days);return t.toISOString().slice(0,10);}
function human(iso){return new Date(`${iso}T12:00:00Z`).toLocaleDateString('en-GB',{timeZone:'UTC',day:'numeric',month:'short'});}
function weekDay(iso){return new Date(`${iso}T12:00:00Z`).toLocaleDateString('en-GB',{timeZone:'UTC',weekday:'short'});}
function fullDate(iso){return new Date(`${iso}T12:00:00Z`).toLocaleDateString('en-GB',{timeZone:'UTC',day:'numeric',month:'short',year:'numeric'});}
function Modal({title,onClose,children}){
 const dialog=useRef(null);
 useEffect(()=>{const element=dialog.current;element.showModal();return ()=>element.close();},[]);
 return <dialog ref={dialog} className="details-dialog" aria-labelledby="dialog-title" onCancel={onClose} onClick={e=>{if(e.target===dialog.current)onClose();}}><div className="dialog-heading"><h2 id="dialog-title">{title}</h2><button type="button" className="dialog-close" aria-label="Close details" onClick={onClose}>×</button></div>{children}</dialog>;
}
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
 const [overlay,setOverlay]=useState(null);
 const [tab,setTab]=useState(()=>window.location.hash==='#/dashboard'?'My bookings':'Availability');
 useEffect(()=>{function syncPage(){setTab(window.location.hash==='#/dashboard'?'My bookings':'Availability');setEditing(null);setForm({...formEmpty});setError('');setNotice('');window.scrollTo(0,0);}window.addEventListener('hashchange',syncPage);return ()=>window.removeEventListener('hashchange',syncPage);},[]);
 useEffect(()=>localStorage.setItem(STORAGE,JSON.stringify(bookings)),[bookings]);
 useEffect(()=>{if(editing){document.getElementById('booking-form')?.scrollIntoView({behavior:'smooth',block:'nearest'});}},[editing]);
 const days=useMemo(()=>Array.from({length:7},(_,i)=>addDays(week,i)),[week]);
 const myBookings=bookings.filter(b=>b.owner==='you').sort((a,b)=>a.startDate.localeCompare(b.startDate));
 const roomList=view==='All rooms'?rooms:rooms.filter(r=>r===view);
 const occupied=(room,date)=>bookings.find(b=>b.roomNumber===room&&date>=b.startDate&&date<b.endDate);
 const selectedBooking=overlay?.kind==='room'?occupied(overlay.room,overlay.date):null;
 function pick(room,date){setForm({roomNumber:room,startDate:date,endDate:addDays(date,1),purpose:''});setEditing(null);setError('');document.getElementById('booking-form')?.scrollIntoView({behavior:'smooth',block:'nearest'});}
 function edit(row){if(row.owner!=='you')return;setEditing(row.id);setForm({roomNumber:row.roomNumber,startDate:row.startDate,endDate:row.endDate,purpose:row.purpose});setError('');setNotice('');}
 function submit(e){e.preventDefault();setNotice('');const err=issue(form,bookings,editing);if(err){setError('Reservation failed. Review the selected dates.');return;}const payload={roomNumber:form.roomNumber.trim(),startDate:form.startDate,endDate:form.endDate,purpose:form.purpose.trim(),owner:'you'};
 if(editing){setBookings(bookings.map(b=>b.id===editing?{...b,...payload}:b));setNotice('Booking updated.');}else{setBookings([...bookings,{...payload,id:'b-'+Date.now()}]);setNotice('Room reserved.');}setForm({...formEmpty});setEditing(null);setError('');}
 function reset(){setBookings(seed);setForm({...formEmpty});setEditing(null);setWeek('2026-11-09');setNotice('Example bookings restored.');setError('');setView('All rooms');}
 function check(){setNotice('');setError('');let e=issue(form,bookings,editing);if(e){setError(e);}else setNotice('No conflict detected for the selected dates.');}
 return <div className="room-app"><header className="topbar"><div className="mark"><span className="mark-sq">R</span><span><strong>room<span>grid</span></strong><small>Campus spaces</small></span></div><nav><a className={tab==='Availability'?'selected':''} aria-current={tab==='Availability'?'page':undefined} href="#/availability">Availability</a><a className={tab==='My bookings'?'selected':''} aria-current={tab==='My bookings'?'page':undefined} href="#/dashboard">My bookings</a></nav><div className="member"><span>Student dashboard</span><button type="button" className="profile" aria-label="Open my profile" aria-haspopup="dialog" onClick={()=>setOverlay({kind:'profile'})}>YOU</button></div></header>
  <main><section className="intro"><div><span className="eyebrow">{tab==='My bookings'?'STUDENT / DASHBOARD':'SPACES / RESERVATIONS'}</span><h1>{tab==='My bookings'?'My bookings dashboard':'Find room availability'}</h1><p>{tab==='My bookings'?'View your reservations and make changes to your bookings.':'Review campus rooms, dates and existing reservations in one view.'}</p></div><div className="intro-summary"><span>{tab==='My bookings'?'YOUR BOOKED ROOMS':'ROOMS IN DIRECTORY'}</span><strong>{(tab==='My bookings'?new Set(myBookings.map(b=>b.roomNumber)).size:rooms.length).toString().padStart(2,'0')}</strong><span>{tab==='My bookings'?'YOUR RESERVATIONS':'CURRENT RESERVATIONS'}</span><strong>{(tab==='My bookings'?myBookings.length:bookings.length).toString().padStart(2,'0')}</strong></div></section>
   <div className={'pagegrid'+(tab==='My bookings'&&!editing?' dashboard-wide':'')}>{tab==='Availability'?<section className="calendar-pane"><div className="calendar-head"><div><span className="eyebrow">AVAILABILITY CALENDAR</span><h2>Rooms by day</h2></div><div className="weeknav"><button aria-label="Previous week" onClick={()=>setWeek(addDays(week,-7))}>←</button><strong>{human(week)} – {human(addDays(week,6))}</strong><button aria-label="Next week" onClick={()=>setWeek(addDays(week,7))}>→</button></div></div>
    <div className="calendar-controls"><label>Location <select value={view} onChange={e=>setView(e.target.value)}><option>All rooms</option>{rooms.map(r=><option key={r}>{r}</option>)}</select></label><span className="legend"><i className="booked"/> Reserved</span><span className="legend"><i className="free"/> Available</span><p>Click a day for room and booking details.</p></div>
    <div className="calendar-scroll"><div className="room-cal"><div className="corner">ROOM / DATE</div>{days.map(d=><div className="dayhead" key={d}><strong>{weekDay(d)}</strong><span>{human(d)}</span></div>)}{roomList.map((room,i)=><React.Fragment key={room}><div className="roomname"><strong>{room}</strong><small>Study room · {room[0]}</small></div>{days.map(day=>{const b=occupied(room,day);return <button key={room+day} title={`${room}, ${day}: ${b?'Reserved':'Available'}`} className={'slot '+(b?'taken':'available')} aria-haspopup="dialog" aria-label={`${room}, ${fullDate(day)}: ${b?'Reserved, view booking details':'Available, view room details'}`} onClick={()=>setOverlay({kind:'room',room,date:day})}><span>{b?'Booked':'Open'}</span>{b&&<small>{b.owner==='you'?'Your booking':'Reserved'}</small>}</button>})}</React.Fragment>)}</div></div>
    <p className="calendar-note">Cells show individual dates. Reservations may span several dates; a day marked "Open" does not guarantee the full range you choose will be available.</p>
    </section>:<section id="my-reservations" className="dashboard-pane"><div className="dashboard-heading"><div><span className="eyebrow">YOUR RESERVATIONS</span><h2>My bookings</h2></div><a className="new-booking" href="#/availability">Book a room</a></div><div className="reservations-head"><p>Choose a reservation to update its room, dates or purpose.</p><span>{myBookings.length} current records</span></div><div className="reservations-list">{myBookings.map(b=><article key={b.id} className={'reservation'+(editing===b.id?' reservation-selected':'')}><div className="room-chip">{b.roomNumber}</div><div className="reservation-body"><strong>{human(b.startDate)} – {human(b.endDate)}</strong><small>{b.purpose||'No purpose entered'}</small></div><button aria-label={`Change reservation for ${b.roomNumber}`} onClick={()=>edit(b)}>Change</button></article>)}{myBookings.length===0&&<p>No reservations yet. Select “Book a room” to make your first booking.</p>}</div>{!editing&&notice&&<div className="success" role="status">{notice}</div>}</section>}
    {(tab==='Availability'||editing)&&<aside className="booking-pane" id="booking-form"><div className="panel-tag"><span>BOOK A ROOM</span><span>FORM 01</span></div><h2>{editing?'Change reservation':'Make a reservation'}</h2><p className="booking-description">Use this panel to request a room for your study group, meeting or activity.</p>{notice&&<div className="success" role="status">{notice}</div>}{error&&<div className="error" role="alert">{error}</div>}<form onSubmit={submit}><label><span>Room number</span><input list="rooms" placeholder="e.g., B2-104" value={form.roomNumber} onChange={e=>setForm(f=>({...f,roomNumber:e.target.value}))}/><datalist id="rooms">{rooms.map(r=><option key={r} value={r}/>)}</datalist></label><div className="date-pair"><label><span>Start date</span><input type="date" value={form.startDate} onChange={e=>setForm(f=>({...f,startDate:e.target.value}))}/></label><label><span>End date</span><input type="date" value={form.endDate} onChange={e=>setForm(f=>({...f,endDate:e.target.value}))}/></label></div><label><span>Purpose / optional</span><textarea rows="5" placeholder="Meeting, group study..." value={form.purpose} onChange={e=>setForm(f=>({...f,purpose:e.target.value}))}/></label><p className="helper">Start and end dates are required. Reservations cannot overlap existing bookings for the same room.</p><button className="availability-check" type="button" onClick={check}>Check availability</button><button className="reserve-button" type="submit">{editing?'Save booking':'Confirm booking'}</button>{editing&&<button className="cancel-edit" type="button" onClick={()=>{setEditing(null);setForm({...formEmpty});setError('')}}>Cancel editing</button>}<button className="reset-bookings" type="button" onClick={reset} title="Restore all example bookings">Rest</button></form><div className="right-foot"><span>✦</span> Need a room for a group? Find an open date and submit your request.</div></aside>}</div>
  </main><footer>ROOMGRID / Academic campus demo — local browser data only.</footer>
  {overlay&&<Modal title={overlay.kind==='profile'?'My profile':`Room ${overlay.room}`} onClose={()=>setOverlay(null)}>
   {overlay.kind==='profile'?<>
    <div className="profile-identity"><div className="profile-avatar">YOU</div><div><strong>You</strong><p>Student · Campus spaces</p></div></div>
    <div className="profile-total"><span>Your reservations</span><strong>{myBookings.length}</strong></div>
    <h3 className="dialog-subtitle">Reservation dates</h3>
    <div className="profile-bookings">{myBookings.map(b=><article key={b.id}><div className="profile-booking-head"><strong>{b.roomNumber}</strong><span>{b.purpose||'No purpose entered'}</span></div><p><time dateTime={b.startDate}>{fullDate(b.startDate)}</time> – <time dateTime={b.endDate}>{fullDate(b.endDate)}</time></p></article>)}{myBookings.length===0&&<p>You have no reservations yet.</p>}</div>
    <p className="dialog-note">End dates are exclusive: the room is available again on the end date.</p>
    <a className="dialog-primary" href="#/dashboard" onClick={()=>setOverlay(null)}>View my bookings</a>
   </>:<>
    <p className="dialog-date">{weekDay(overlay.date)}, {fullDate(overlay.date)}</p>
    <span className={'booking-status '+(selectedBooking?'status-reserved':'status-available')}>{selectedBooking?'Reserved':'Available'}</span>
    {selectedBooking?<>
     <dl className="booking-details"><div><dt>Booked by</dt><dd>{selectedBooking.owner==='you'?'You':'Another student'}</dd></div><div><dt>Start date</dt><dd>{fullDate(selectedBooking.startDate)}</dd></div><div><dt>End date (exclusive)</dt><dd>{fullDate(selectedBooking.endDate)}</dd></div><div><dt>Purpose</dt><dd>{selectedBooking.purpose||'No purpose entered'}</dd></div></dl>
     {selectedBooking.owner!=='you'&&<p className="dialog-note">Other students’ names are not included in this demo.</p>}
     {selectedBooking.owner==='you'&&<button type="button" className="dialog-primary" onClick={()=>{edit(selectedBooking);setOverlay(null);}}>Change reservation</button>}
    </>:<><p className="dialog-note">This room is open on the selected day. Check availability in the form if you need a longer stay.</p><button type="button" className="dialog-primary" onClick={()=>{pick(overlay.room,overlay.date);setOverlay(null);}}>Book this room</button></>}
   </>}
  </Modal>}
 </div>;
}
