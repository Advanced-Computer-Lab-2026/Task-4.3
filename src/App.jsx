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
// Monday of the week containing iso (the calendar shows Monday–Sunday weeks).
function weekStart(iso){const d=new Date(`${iso}T12:00:00Z`).getUTCDay();return addDays(iso,-((d+6)%7));}
// End dates are exclusive, so the last day a booking actually covers is endDate - 1.
function dayCount(start,end){return Math.round((new Date(`${end}T12:00:00Z`)-new Date(`${start}T12:00:00Z`))/864e5);}
function covers(start,end){const last=addDays(end,-1),n=dayCount(start,end);const first=`${weekDay(start)} ${human(start)}`;return (start===last?first:`${first} – ${weekDay(last)} ${human(last)}`)+` · ${n} day${n===1?'':'s'}`;}
// Returns {field,msg} describing the first problem, or '' when the booking is valid.
// field is 'roomNumber', 'startDate', 'endDate' or 'dates' (both date inputs).
function issue(form,bookings,id){
 const room=form.roomNumber.trim();
 if(!room)return {field:'roomNumber',msg:'Enter a room number, e.g. B2-104.'};
 if(!form.startDate)return {field:'startDate',msg:'Choose a start date.'};
 if(!form.endDate)return {field:'endDate',msg:'Choose an end date.'};
 if(form.endDate<=form.startDate)return {field:'endDate',msg:`End date must be after the start date. For a one-day booking on ${human(form.startDate)}, set the end date to ${human(addDays(form.startDate,1))}.`};
 const clash=bookings.find(b=>b.id!==id&&b.roomNumber.toLowerCase()===room.toLowerCase()&&form.startDate<b.endDate&&form.endDate>b.startDate);
 if(clash)return {field:'dates',msg:clash.owner==='you'
  ?`You already have ${clash.roomNumber} on ${covers(clash.startDate,clash.endDate)}. To move that booking, use “Change” on it instead.`
  :`${clash.roomNumber} is already reserved on ${covers(clash.startDate,clash.endDate)}. Choose dates outside that range or another room.`};
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
 const [freeOnly,setFreeOnly]=useState(false);
 useEffect(()=>localStorage.setItem(STORAGE,JSON.stringify(bookings)),[bookings]);
 const days=useMemo(()=>Array.from({length:7},(_,i)=>addDays(week,i)),[week]);
 const myBookings=bookings.filter(b=>b.owner==='you').sort((a,b)=>a.startDate.localeCompare(b.startDate));
 const roomList=view==='All rooms'?rooms:rooms.filter(r=>r===view);
 const occupied=(room,date)=>bookings.find(b=>b.roomNumber===room&&date>=b.startDate&&date<b.endDate);
 const roomInput=useRef(null);
 const editRow=bookings.find(b=>b.id===editing);
 const draftOk=form.startDate&&form.endDate&&form.endDate>form.startDate;
 const bad=name=>!!error&&(error.field===name||(error.field==='dates'&&(name==='startDate'||name==='endDate')));
 // Changing a field the error points at clears that error; editing the purpose does not.
 // "Only rooms free for my dates": reuse the form's own validation so the filter and submit always agree.
 const filtering=freeOnly&&draftOk;
 const shownRooms=filtering?roomList.filter(r=>!issue({...form,roomNumber:r},bookings,editing)):roomList;
 useEffect(()=>{if(freeOnly&&form.startDate)setWeek(weekStart(form.startDate));},[freeOnly,form.startDate]);
 function chooseRoom(room){setField('roomNumber',room);setNotice('');showForm();}
 function setField(k,v){setForm(f=>({...f,[k]:v}));if(k!=='purpose')setError('');}
 function showForm(){document.getElementById('booking-form')?.scrollIntoView({behavior:'smooth',block:'start'});requestAnimationFrame(()=>roomInput.current?.focus({preventScroll:true}));}
 function pick(room,date){const b=occupied(room,date);if(b){if(b.owner==='you')edit(b);return;}setForm({roomNumber:room,startDate:date,endDate:addDays(date,1),purpose:''});setEditing(null);setError('');setNotice('');showForm();}
 function edit(row){if(row.owner!=='you')return;setEditing(row.id);setForm({roomNumber:row.roomNumber,startDate:row.startDate,endDate:row.endDate,purpose:row.purpose});setError('');setNotice('');showForm();}
 function submit(e){e.preventDefault();setNotice('');const err=issue(form,bookings,editing);if(err){setError(err);return;}const payload={roomNumber:form.roomNumber.trim(),startDate:form.startDate,endDate:form.endDate,purpose:form.purpose.trim(),owner:'you'};
 if(editing){setBookings(bookings.map(b=>b.id===editing?{...b,...payload}:b));setNotice('Booking updated.');}else{setBookings([...bookings,{...payload,id:'b-'+Date.now()}]);setNotice('Room reserved.');}setForm({...formEmpty});setEditing(null);setError('');}
 function reset(){setBookings(seed);setForm({...formEmpty});setEditing(null);setWeek('2026-11-09');setNotice('Example bookings restored.');setError('');setView('All rooms');setFreeOnly(false);}
 function check(){setNotice('');setError('');let e=issue(form,bookings,editing);if(e){setError(e);}else setNotice(`${form.roomNumber.trim()} is free on ${covers(form.startDate,form.endDate)}.`);}
 return <div className="room-app"><header className="topbar"><div className="mark"><span className="mark-sq">R</span><span><strong>room<span>grid</span></strong><small>Campus spaces</small></span></div><nav><button className={tab==='Availability'?'selected':''} onClick={()=>setTab('Availability')}>Availability</button><button className={tab==='My bookings'?'selected':''} onClick={()=>{setTab('My bookings');document.getElementById('my-reservations')?.scrollIntoView({behavior:'smooth'});}}>My bookings</button><button onClick={reset}>Reset demo</button></nav><div className="member"><span>Student dashboard</span><div className="profile">YOU</div></div></header>
  <main><section className="intro"><div><span className="eyebrow">SPACES / RESERVATIONS</span><h1>Find room availability</h1><p>Review campus rooms, dates and existing reservations in one view.</p></div><div className="intro-summary"><span>ROOMS IN DIRECTORY</span><strong>{rooms.length.toString().padStart(2,'0')}</strong><span>CURRENT RESERVATIONS</span><strong>{bookings.length.toString().padStart(2,'0')}</strong></div></section>
   <div className="pagegrid"><section className="calendar-pane"><div className="calendar-head"><div><span className="eyebrow">AVAILABILITY CALENDAR</span><h2>Rooms by day</h2></div><div className="weeknav"><button aria-label="Previous week" onClick={()=>setWeek(addDays(week,-7))}>←</button><strong>{human(week)} – {human(addDays(week,6))}</strong><button aria-label="Next week" onClick={()=>setWeek(addDays(week,7))}>→</button></div></div>
    <div className="calendar-controls"><label>Location <select value={view} onChange={e=>setView(e.target.value)}><option>All rooms</option>{rooms.map(r=><option key={r}>{r}</option>)}</select></label><label className="free-toggle"><input type="checkbox" checked={freeOnly} onChange={e=>setFreeOnly(e.target.checked)}/> Only rooms free for my dates</label><span className="legend"><i className="booked"/> Reserved</span><span className="legend"><i className="mine"/> Yours</span><span className="legend"><i className="free"/> Available</span><p>Click an open day to book it, or your booking to change it.</p></div>{freeOnly&&<p className="filter-status" role="status">{!draftOk?'Choose a start and end date in the booking form to see which rooms are free.':shownRooms.length?<><strong>{shownRooms.length} of {roomList.length}</strong> room{roomList.length===1?'':'s'} free on {covers(form.startDate,form.endDate)}. Pick one with “Use this room”.</>:<>No rooms are free on {covers(form.startDate,form.endDate)}. Try different dates or turn off the filter.</>}</p>}
    <div className="calendar-scroll"><div className="room-cal"><div className="corner">ROOM / DATE</div>{days.map(d=><div className="dayhead" key={d}><strong>{weekDay(d)}</strong><span>{human(d)}</span></div>)}{shownRooms.map((room,i)=><React.Fragment key={room}><div className="roomname"><strong>{room}</strong><small>Study room · {room[0]}</small>{filtering&&<button type="button" className="use-room" onClick={()=>chooseRoom(room)}>Use this room</button>}</div>{days.map(day=>{const b=occupied(room,day);const mine=b&&b.owner==='you';return <button key={room+day} title={`${room}, ${human(day)}: ${!b?'Available — click to book':mine?'Your booking — click to change it':'Reserved by someone else'}`} aria-disabled={b&&!mine?'true':undefined} className={'slot '+(!b?'available':mine?'mine':'taken')+(mine&&b.id===editing?' editing':'')} onClick={()=>pick(room,day)}><span>{b?'Booked':'Open'}</span>{b&&<small>{mine?(b.id===editing?'Editing':'Your booking'):'Reserved'}</small>}</button>})}</React.Fragment>)}</div></div>
    <p className="calendar-note">Cells show individual dates. Reservations may span several dates; a day marked "Open" does not guarantee the full range you choose will be available.</p>
    <section id="my-reservations" className="reservations"><div className="reservations-head"><h2>Your bookings</h2><span>{myBookings.length} current records</span></div><div className="reservations-list">{myBookings.map(b=><article key={b.id} className={'reservation'+(b.id===editing?' editing':'')}><div className="room-chip">{b.roomNumber}</div><div className="reservation-body"><strong>{covers(b.startDate,b.endDate)}</strong><small>{b.purpose||'No purpose entered'}</small></div>{b.id===editing?<span className="editing-tag">Editing</span>:<button onClick={()=>edit(b)}>Change</button>}</article>)}{myBookings.length===0&&<p>No reservations.</p>}</div></section></section>
    <aside className="booking-pane" id="booking-form"><div className="panel-tag"><span>BOOK A ROOM</span><span>FORM 01</span></div><h2>{editing?'Change reservation':'Make a reservation'}</h2>{editRow?<p className="editing-banner">Changing your booking for <strong>{editRow.roomNumber}</strong>, {covers(editRow.startDate,editRow.endDate)}. Save to apply your changes, or cancel to keep it as it is.</p>:<p className="booking-description">Use this panel to request a room for your study group, meeting or activity.</p>}{notice&&<div className="success" role="status">{notice}</div>}{error&&<div className="error" role="alert" id="form-error">{error.msg}</div>}<form onSubmit={submit} noValidate><label><span>Room number</span><input ref={roomInput} list="rooms" placeholder="e.g., B2-104" value={form.roomNumber} aria-invalid={bad('roomNumber')} aria-describedby={bad('roomNumber')?'form-error':undefined} onChange={e=>setField('roomNumber',e.target.value)}/><datalist id="rooms">{rooms.map(r=><option key={r} value={r}/>)}</datalist></label><div className="date-pair"><label><span>Start date</span><input type="date" value={form.startDate} aria-invalid={bad('startDate')} aria-describedby={'date-summary'+(bad('startDate')?' form-error':'')} onChange={e=>setField('startDate',e.target.value)}/></label><label><span>End date <em>(not included)</em></span><input type="date" min={form.startDate?addDays(form.startDate,1):undefined} value={form.endDate} aria-invalid={bad('endDate')} aria-describedby={'date-summary'+(bad('endDate')?' form-error':'')} onChange={e=>setField('endDate',e.target.value)}/></label></div><p className="date-summary" id="date-summary" aria-live="polite">{draftOk?<>Reserves <strong>{covers(form.startDate,form.endDate)}</strong>. The room is free again on {weekDay(form.endDate)} {human(form.endDate)}.</>:<>The end date is the day the room is free again. To book Mon–Wed, set the end date to Thursday.</>}</p><label><span>Purpose / optional</span><textarea rows="5" placeholder="Meeting, group study..." value={form.purpose} onChange={e=>setField('purpose',e.target.value)}/></label><p className="helper">Room and both dates are required. Reservations cannot overlap existing bookings for the same room.</p><button className="availability-check" type="button" onClick={check}>Check availability</button><button className="reserve-button" type="submit">{editing?'Save booking':'Confirm booking'}</button>{editing&&<button className="cancel-edit" type="button" onClick={()=>{setEditing(null);setForm({...formEmpty});setError('')}}>Cancel editing</button>}</form><div className="right-foot"><span>✦</span> Need a room for a group? Find an open date and submit your request.</div></aside></div>
  </main><footer>ROOMGRID / Academic campus demo — local browser data only.</footer>
 </div>;
}
