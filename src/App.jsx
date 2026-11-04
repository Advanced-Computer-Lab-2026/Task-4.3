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
const START_WEEK='2026-11-09';
function weekStart(iso){const diff=Math.round((new Date(`${iso}T12:00:00Z`)-new Date(`${START_WEEK}T12:00:00Z`))/864e5);return addDays(START_WEEK,Math.floor(diff/7)*7);}
function nightsBetween(a,b){return Math.round((new Date(`${b}T12:00:00Z`)-new Date(`${a}T12:00:00Z`))/864e5);}
function sameRoom(a,b){return a.trim().toLowerCase()===b.trim().toLowerCase();}
// Below this width the booking panel stacks under the calendar instead of sitting beside it.
function stacked(){return window.matchMedia('(max-width:1200px)').matches;}
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
 const [drag,setDrag]=useState(null);
 const [target,setTarget]=useState(null);
 const [confirming,setConfirming]=useState(null);
 const ignoreClick=useRef(false);
 useEffect(()=>localStorage.setItem(STORAGE,JSON.stringify(bookings)),[bookings]);
 const dragRange=d=>d.current<d.anchor?[d.current,d.anchor]:[d.anchor,d.current];
 useEffect(()=>{if(!drag)return;
  const end=()=>{const [lo,hi]=dragRange(drag);chooseRange(drag.room,lo,hi);ignoreClick.current=true;setTimeout(()=>{ignoreClick.current=false;},0);setDrag(null);};
  window.addEventListener('pointerup',end);window.addEventListener('pointercancel',end);
  return()=>{window.removeEventListener('pointerup',end);window.removeEventListener('pointercancel',end);};
 },[drag]);
 useEffect(()=>{if(!target)return;document.querySelector(`.slot[data-room="${target.room}"][data-date="${target.date}"]`)?.scrollIntoView({behavior:'smooth',block:'center',inline:'nearest'});},[target]);
 const days=useMemo(()=>Array.from({length:7},(_,i)=>addDays(week,i)),[week]);
 const myBookings=bookings.filter(b=>b.owner==='you').sort((a,b)=>a.startDate.localeCompare(b.startDate));
 const roomList=view==='All rooms'?rooms:rooms.filter(r=>r===view);
 const occupied=(room,date)=>bookings.find(b=>b.roomNumber===room&&date>=b.startDate&&date<b.endDate);
 // Cells held by someone else (or by another of your bookings); the booking being edited does not block itself.
 const busy=(room,date)=>bookings.find(b=>b.id!==editing&&b.roomNumber===room&&date>=b.startDate&&date<b.endDate);
 function rangeFree(room,lo,hi){for(let d=lo;d<=hi;d=addDays(d,1))if(busy(room,d))return false;return true;}
 // The highlighted cells are derived from the form (or the live drag), so typing dates and clicking the calendar stay in sync.
 const shown=drag?{room:drag.room,start:dragRange(drag)[0],end:addDays(dragRange(drag)[1],1)}:{room:form.roomNumber,start:form.startDate,end:form.endDate};
 const selected=(room,date)=>!!shown.room.trim()&&!!shown.start&&!!shown.end&&sameRoom(shown.room,room)&&date>=shown.start&&date<shown.end;
 function chooseRange(room,lo,hi){setForm(f=>({roomNumber:room,startDate:lo,endDate:addDays(hi,1),purpose:editing?f.purpose:''}));setError('');setNotice('');if(stacked())document.getElementById('booking-form')?.scrollIntoView({behavior:'smooth',block:'start'});}
 function pick(room,date){chooseRange(room,date,date);}
 function dragStart(e,room,date){if(e.button!==0||e.pointerType!=='mouse'||busy(room,date))return;setDrag({room,anchor:date,current:date});}
 function dragOver(room,date){if(!drag||room!==drag.room)return;const [lo,hi]=date<drag.anchor?[date,drag.anchor]:[drag.anchor,date];if(rangeFree(room,lo,hi))setDrag({...drag,current:date});}
 function edit(row){if(row.owner!=='you')return;setEditing(row.id);setForm({roomNumber:row.roomNumber,startDate:row.startDate,endDate:row.endDate,purpose:row.purpose});setError('');setNotice('');setWeek(weekStart(row.startDate));setView(v=>v==='All rooms'||v===row.roomNumber?v:'All rooms');if(stacked())document.getElementById('booking-form')?.scrollIntoView({behavior:'smooth',block:'start'});else setTarget({room:row.roomNumber,date:row.startDate});}
 function submit(e){e.preventDefault();setNotice('');const err=issue(form,bookings,editing);if(err){setError('Reservation failed. Review the selected dates.');return;}const payload={roomNumber:form.roomNumber.trim(),startDate:form.startDate,endDate:form.endDate,purpose:form.purpose.trim(),owner:'you'};
 if(editing){setBookings(bookings.map(b=>b.id===editing?{...b,...payload}:b));setNotice('Booking updated.');}else{setBookings([...bookings,{...payload,id:'b-'+Date.now()}]);setNotice('Room reserved.');}setForm({...formEmpty});setEditing(null);setError('');}
 function cancelEdit(){setEditing(null);setForm({...formEmpty});setError('');setNotice('');setConfirming(null);}
 function cancelBooking(id){const gone=bookings.find(b=>b.id===id);setBookings(bookings.filter(b=>b.id!==id));if(editing===id){setEditing(null);setForm({...formEmpty});}setConfirming(null);setError('');setNotice(gone?`Booking cancelled: ${gone.roomNumber}, ${human(gone.startDate)} – ${human(gone.endDate)}.`:'Booking cancelled.');}
 const confirmBox=b=><div className="confirm-box" role="alertdialog" aria-label="Confirm cancellation"><span>Cancel {b.roomNumber}, {human(b.startDate)} – {human(b.endDate)}? This frees the room for others.</span><div><button type="button" className="danger-solid" onClick={()=>cancelBooking(b.id)}>Yes, cancel booking</button><button type="button" className="keep" onClick={()=>setConfirming(null)}>Keep it</button></div></div>;
 function reset(){setBookings(seed);setForm({...formEmpty});setEditing(null);setWeek('2026-11-09');setNotice('Example bookings restored.');setError('');setView('All rooms');}
 function check(){setNotice('');setError('');let e=issue(form,bookings,editing);if(e){setError(e);}else setNotice('No conflict detected for the selected dates.');}
 return <div className="room-app"><header className="topbar"><div className="mark"><span className="mark-sq">R</span><span><strong>room<span>grid</span></strong><small>Campus spaces</small></span></div><nav><button className={tab==='Availability'?'selected':''} onClick={()=>setTab('Availability')}>Availability</button><button className={tab==='My bookings'?'selected':''} onClick={()=>{setTab('My bookings');document.getElementById('my-reservations')?.scrollIntoView({behavior:'smooth'});}}>My bookings</button><button onClick={reset}>Reset demo</button></nav><div className="member"><span>Student dashboard</span><div className="profile">YOU</div></div></header>
  <main><section className="intro"><div><span className="eyebrow">SPACES / RESERVATIONS</span><h1>Find room availability</h1><p>Review campus rooms, dates and existing reservations in one view.</p></div><div className="intro-summary"><span>ROOMS IN DIRECTORY</span><strong>{rooms.length.toString().padStart(2,'0')}</strong><span>CURRENT RESERVATIONS</span><strong>{bookings.length.toString().padStart(2,'0')}</strong></div></section>
   <div className="pagegrid"><section className="calendar-pane"><div className="calendar-head"><div><span className="eyebrow">AVAILABILITY CALENDAR</span><h2>Rooms by day</h2></div><div className="weeknav"><button aria-label="Previous week" onClick={()=>setWeek(addDays(week,-7))}>←</button><strong>{human(week)} – {human(addDays(week,6))}</strong><button aria-label="Next week" onClick={()=>setWeek(addDays(week,7))}>→</button></div></div>
    <div className="calendar-controls"><label>Location <select value={view} onChange={e=>setView(e.target.value)}><option>All rooms</option>{rooms.map(r=><option key={r}>{r}</option>)}</select></label><span className="legend"><i className="booked"/> Reserved</span><span className="legend"><i className="free"/> Available</span><span className="legend"><i className="mine"/> Your booking</span><p>Click a day, or drag across days in one room, to choose your dates.</p></div>
    <div className="calendar-scroll"><div className="room-cal"><div className="corner">ROOM / DATE</div>{days.map(d=><div className="dayhead" key={d}><strong>{weekDay(d)}</strong><span>{human(d)}</span></div>)}{roomList.map((room,i)=><React.Fragment key={room}><div className="roomname"><strong>{room}</strong><small>Study room · {room[0]}</small></div>{days.map(day=>{const b=occupied(room,day),other=busy(room,day),sel=selected(room,day),locked=other&&other.owner!=='you';const label=sel?(other?'Conflict':editing?'Editing':'Selected'):b?'Booked':'Open';return <button key={room+day} type="button" data-room={room} data-date={day} aria-pressed={sel} aria-disabled={locked||undefined} title={`${room}, ${day}: ${label}${other&&!locked?' (click to change)':''}`} className={'slot '+(other||(b&&!sel)?'taken':'available')+(b&&b.owner==='you'&&!sel?' mine':'')+(sel?' selected':'')+(locked?' locked':'')} onPointerDown={e=>dragStart(e,room,day)} onPointerEnter={()=>dragOver(room,day)} onClick={()=>{if(ignoreClick.current)return;if(other){if(!locked)edit(other);return;}pick(room,day);}}><span>{label}</span>{sel&&other?<small>Already booked</small>:!sel&&b&&<small>{b.owner==='you'?'Your booking':'Reserved'}</small>}</button>})}</React.Fragment>)}</div></div>
    <p className="calendar-note">Cells show individual dates. Reservations may span several dates; a day marked "Open" does not guarantee the full range you choose will be available.</p>
    <section id="my-reservations" className="reservations"><div className="reservations-head"><h2>Your bookings</h2><span>{myBookings.length} current records</span></div><div className="reservations-list">{myBookings.map(b=><article key={b.id} className={'reservation'+(b.id===editing?' editing':'')+(confirming===b.id?' confirming':'')} aria-current={b.id===editing||undefined}><div className="room-chip">{b.roomNumber}</div><div className="reservation-body"><strong>{human(b.startDate)} – {human(b.endDate)}</strong><small>{b.purpose||'No purpose entered'}</small></div>{b.id===editing&&<span className="edit-badge">Editing</span>}{confirming===b.id?confirmBox(b):<><button onClick={()=>edit(b)}>Change</button><button className="danger-link" onClick={()=>setConfirming(b.id)}>Cancel booking</button></>}</article>)}{myBookings.length===0&&<p>No reservations.</p>}</div></section></section>
    <aside className={'booking-pane'+(editing?' is-editing':'')} id="booking-form"><div className="panel-tag"><span>BOOK A ROOM</span><span>FORM 01</span></div><h2>{editing?'Change reservation':'Make a reservation'}</h2>{editing?(()=>{const o=bookings.find(b=>b.id===editing);return o&&<div className="editing-banner"><strong>Editing {o.roomNumber}</strong><span>Currently {human(o.startDate)} – {human(o.endDate)}. Pick new dates below or on the calendar, then save.</span></div>;})():<p className="booking-description">Use this panel to request a room for your study group, meeting or activity. Click or drag across days in the calendar to fill in your dates.</p>}{notice&&<div className="success" role="status">{notice}</div>}{error&&<div className="error" role="alert">{error}</div>}<form onSubmit={submit}><label><span>Room number</span><input list="rooms" placeholder="e.g., B2-104" value={form.roomNumber} onChange={e=>setForm(f=>({...f,roomNumber:e.target.value}))}/><datalist id="rooms">{rooms.map(r=><option key={r} value={r}/>)}</datalist></label><div className="date-pair"><label><span>Start date</span><input type="date" value={form.startDate} onChange={e=>setForm(f=>({...f,startDate:e.target.value}))}/></label><label><span>End date</span><input type="date" value={form.endDate} onChange={e=>setForm(f=>({...f,endDate:e.target.value}))}/></label></div>{form.startDate&&form.endDate>form.startDate&&<p className="selection-summary">{weekDay(form.startDate)} {human(form.startDate)} → {weekDay(form.endDate)} {human(form.endDate)} · {nightsBetween(form.startDate,form.endDate)} night{nightsBetween(form.startDate,form.endDate)>1?'s':''}</p>}<label><span>Purpose / optional</span><textarea rows="5" placeholder="Meeting, group study..." value={form.purpose} onChange={e=>setForm(f=>({...f,purpose:e.target.value}))}/></label><p className="helper">Start and end dates are required. Reservations cannot overlap existing bookings for the same room.</p><button className="availability-check" type="button" onClick={check}>Check availability</button><button className="reserve-button" type="submit">{editing?'Save booking':'Confirm booking'}</button>{editing&&<div className="edit-actions"><button className="cancel-edit" type="button" onClick={cancelEdit}>Cancel editing</button>{(()=>{const o=bookings.find(b=>b.id===editing);return o&&(confirming===editing?confirmBox(o):<button className="danger-outline" type="button" onClick={()=>setConfirming(editing)}>Cancel this booking</button>);})()}</div>}</form><div className="right-foot"><span>✦</span> Need a room for a group? Find an open date and submit your request.</div></aside></div>
  </main><footer>ROOMGRID / Academic campus demo — local browser data only.</footer>
 </div>;
}
