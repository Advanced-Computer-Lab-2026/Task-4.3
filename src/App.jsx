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
const findEmpty={startDate:'',endDate:''};
function read(){try{let a=JSON.parse(localStorage.getItem(STORAGE));return Array.isArray(a)?a:seed;}catch{return seed;}}
function addDays(iso,days){const t=new Date(`${iso}T12:00:00Z`);t.setUTCDate(t.getUTCDate()+days);return t.toISOString().slice(0,10);}
function human(iso){return new Date(`${iso}T12:00:00Z`).toLocaleDateString('en-GB',{timeZone:'UTC',day:'numeric',month:'short'});}
function weekDay(iso){return new Date(`${iso}T12:00:00Z`).toLocaleDateString('en-GB',{timeZone:'UTC',weekday:'short'});}
function mondayOf(iso){const day=new Date(`${iso}T12:00:00Z`).getUTCDay();return addDays(iso,-((day+6)%7));}
function isDay(iso){return /^\d{4}-\d{2}-\d{2}$/.test(iso);}
function validRange(start,end){return isDay(start)&&isDay(end)&&end>start;}
function dayCount(start,end){return Math.round((Date.parse(`${end}T12:00:00Z`)-Date.parse(`${start}T12:00:00Z`))/864e5);}
// End dates are exclusive, so the last reserved day is the one before the end date.
function span(start,end){const last=addDays(end,-1);return last===start?human(start):`${human(start)} – ${human(last)}`;}
function directoryName(room){return rooms.find(r=>r.toLowerCase()===room.trim().toLowerCase());}
function clashOf(room,start,end,bookings,id){return bookings.find(b=>b.id!==id&&b.roomNumber.toLowerCase()===room.trim().toLowerCase()&&start<b.endDate&&end>b.startDate);}
function nextFree(room,start,end,bookings,id){const len=dayCount(start,end);let s=start;for(let i=0;i<60;i++){const e=addDays(s,len),c=clashOf(room,s,e,bookings,id);if(!c)return {startDate:s,endDate:e};s=c.endDate;}return null;}
function issue(form,bookings,id){
 const fields={},room=form.roomNumber.trim();
 if(!room)fields.roomNumber='Enter a room number.';
 else if(!directoryName(room))fields.roomNumber=`${room} is not in the room directory. Choose a room from the list.`;
 if(!isDay(form.startDate))fields.startDate='Choose a start date.';
 if(!isDay(form.endDate))fields.endDate='Choose an end date.';
 else if(isDay(form.startDate)&&form.endDate<=form.startDate)fields.endDate='End date must be after the start date.';
 if(Object.keys(fields).length)return {fields};
 const clash=clashOf(room,form.startDate,form.endDate,bookings,id);
 if(!clash)return null;
 return {fields,clash,next:nextFree(room,form.startDate,form.endDate,bookings,id),others:rooms.filter(r=>r!==directoryName(room)&&!clashOf(r,form.startDate,form.endDate,bookings,id)).slice(0,3)};
}
export default function App(){
 const [bookings,setBookings]=useState(read);
 const [week,setWeek]=useState('2026-11-09');
 const [view,setView]=useState('All rooms');
 const [find,setFind]=useState({...findEmpty});
 const [form,setForm]=useState({...formEmpty});
 const [editing,setEditing]=useState(null);
 const [problem,setProblem]=useState(null);
 const [notice,setNotice]=useState('');
 const [tab,setTab]=useState('Availability');
 useEffect(()=>localStorage.setItem(STORAGE,JSON.stringify(bookings)),[bookings]);
 const days=useMemo(()=>Array.from({length:7},(_,i)=>addDays(week,i)),[week]);
 const myBookings=bookings.filter(b=>b.owner==='you').sort((a,b)=>a.startDate.localeCompare(b.startDate));
 const findValid=validRange(find.startDate,find.endDate);
 const inFind=date=>findValid&&date>=find.startDate&&date<find.endDate;
 const viewRooms=view==='All rooms'?rooms:rooms.filter(r=>r===view);
 const roomList=findValid?viewRooms.filter(r=>!clashOf(r,find.startDate,find.endDate,bookings,editing)):viewRooms;
 const findMessage=findValid?`${roomList.length} of ${viewRooms.length} ${viewRooms.length===1?'room':'rooms'} free for ${span(find.startDate,find.endDate)}.`:find.startDate&&find.endDate?'End date must be after the start date.':find.startDate||find.endDate?'Choose both dates to see which rooms are free.':'Enter your dates to see only the rooms free for all of them.';
 const occupied=(room,date)=>bookings.find(b=>b.roomNumber===room&&date>=b.startDate&&date<b.endDate);
 function change(field,value){setForm(f=>({...f,[field]:value}));setNotice('');if(field!=='purpose')setProblem(p=>{if(!p)return p;const {[field]:_,...fields}=p.fields;return Object.keys(fields).length?{fields}:null;});}
 function report(found){setProblem(found);const first=found&&['roomNumber','startDate','endDate'].find(f=>found.fields[f]);if(first)document.getElementById(first)?.focus();}
 // Measures after React renders, because messages change the height of the form.
 function showForm(){document.getElementById('booking-title').focus({preventScroll:true});setTimeout(()=>{const el=document.getElementById('booking-form'),top=el.getBoundingClientRect().top,over=document.querySelector('.reserve-button').getBoundingClientRect().bottom-innerHeight+16;if(top<0||top>innerHeight/3)el.scrollIntoView({behavior:'smooth',block:'start'});else if(over>0)window.scrollBy({top:Math.min(over,top),behavior:'smooth'});});}
 function fill(room,startDate,endDate){const next={...form,roomNumber:room,startDate,endDate};setForm(next);setNotice('');setProblem(issue(next,bookings,editing));showForm();}
 function pick(room,date){
  const b=occupied(room,date);
  if(b&&b.id===editing)return showForm();
  if(b?.owner==='you'&&!editing)return edit(b);
  if(inFind(date))return fill(room,find.startDate,find.endDate);
  // Moving a booking keeps its length.
  fill(room,date,addDays(date,editing&&validRange(form.startDate,form.endDate)?dayCount(form.startDate,form.endDate):1));
 }
 function openTab(name){setTab(name);window.scrollTo(0,0);}
 function changeFind(field,value){const next={...find,[field]:value};setFind(next);if(validRange(next.startDate,next.endDate))setWeek(mondayOf(next.startDate));}
 function edit(row){if(row.owner!=='you')return;setEditing(row.id);setForm({roomNumber:row.roomNumber,startDate:row.startDate,endDate:row.endDate,purpose:row.purpose});setProblem(null);setNotice('');if(!findValid)setWeek(mondayOf(row.startDate));showForm();}
 function cancelEdit(){setEditing(null);setForm({...formEmpty});setProblem(null);setNotice('');document.getElementById('booking-title').focus();}
 function accept(changes){const next={...form,...changes};setForm(next);setProblem(null);setWeek(mondayOf(next.startDate));setNotice(`${directoryName(next.roomNumber)} is free for ${span(next.startDate,next.endDate)}.`);}
 function submit(e){e.preventDefault();setNotice('');const found=issue(form,bookings,editing);report(found);if(found)return;const payload={roomNumber:directoryName(form.roomNumber),startDate:form.startDate,endDate:form.endDate,purpose:form.purpose.trim(),owner:'you'},where=`${payload.roomNumber}, ${span(payload.startDate,payload.endDate)}`;
 if(editing){setBookings(bookings.map(b=>b.id===editing?{...b,...payload}:b));setNotice(`Booking updated: ${where}.`);}else{setBookings([...bookings,{...payload,id:'b-'+Date.now()}]);setNotice(`Room booked: ${where}.`);}setForm({...formEmpty});setEditing(null);setFind({...findEmpty});setWeek(mondayOf(payload.startDate));}
 function reset(){setBookings(seed);setForm({...formEmpty});setFind({...findEmpty});setEditing(null);setWeek('2026-11-09');setNotice('Example bookings restored.');setProblem(null);setView('All rooms');}
 function check(){setNotice('');const found=issue(form,bookings,editing);report(found);if(!found)setNotice(`${directoryName(form.roomNumber)} is free for ${span(form.startDate,form.endDate)}.`);}
 const editRow=bookings.find(b=>b.id===editing);
 const inForm=(room,day)=>room===directoryName(form.roomNumber)&&validRange(form.startDate,form.endDate)&&day>=form.startDate&&day<form.endDate;
 const calendarHint=editRow?`Click a day to move your ${editRow.roomNumber} booking.`:findValid?'Click a highlighted day, or Use these dates, to fill in the form.':'Click an open day to start a booking, or your own booking to change it.';
 const fieldProps=name=>({id:name,'aria-invalid':!!problem?.fields[name],'aria-describedby':problem?.fields[name]?`${name}-error`:undefined});
 const fieldError=name=>problem?.fields[name]&&<small className="field-error" id={`${name}-error`}>{problem.fields[name]}</small>;
 return <div className="room-app"><header className="topbar"><div className="mark"><span className="mark-sq">R</span><span><strong>room<span>grid</span></strong><small>Campus spaces</small></span></div><nav>{['Availability','My bookings'].map(name=><button key={name} className={tab===name?'selected':''} aria-current={tab===name?'page':undefined} onClick={()=>openTab(name)}>{name}</button>)}<button onClick={reset}>Reset demo</button></nav><div className="member"><span>Student dashboard</span><div className="profile">YOU</div></div></header>
  <main><section className="intro"><div><span className="eyebrow">SPACES / BOOKINGS</span><h1>{tab==='Availability'?'Find room availability':'My bookings'}</h1><p>{tab==='Availability'?'Review campus rooms, dates and existing bookings in one view.':'Review your bookings and change their room or dates.'}</p></div><div className="intro-summary"><span>ROOMS IN DIRECTORY</span><strong>{rooms.length.toString().padStart(2,'0')}</strong><span>CURRENT BOOKINGS</span><strong>{bookings.length.toString().padStart(2,'0')}</strong></div></section>
   <div className="pagegrid"><section className="calendar-pane">{tab==='Availability'&&<><div className="calendar-head"><div><span className="eyebrow">AVAILABILITY CALENDAR</span><h2>Rooms by day</h2></div><div className="weeknav"><button aria-label="Previous week" onClick={()=>setWeek(addDays(week,-7))}>←</button><strong>{human(week)} – {human(addDays(week,6))}</strong><button aria-label="Next week" onClick={()=>setWeek(addDays(week,7))}>→</button></div></div>
    <div className="finder"><strong>Find a free room</strong><div className="finder-fields"><label>Start date<input id="find-start" type="date" value={find.startDate} onChange={e=>changeFind('startDate',e.target.value)}/></label><label>End date<input id="find-end" type="date" value={find.endDate} onChange={e=>changeFind('endDate',e.target.value)}/></label>{(find.startDate||find.endDate)&&<button type="button" onClick={()=>setFind({...findEmpty})}>Clear dates</button>}</div><p role="status" className={find.startDate&&find.endDate&&!findValid?'invalid':''}>{findMessage}</p></div>
    <div className="calendar-controls"><label>Room <select value={view} onChange={e=>setView(e.target.value)}><option>All rooms</option>{rooms.map(r=><option key={r}>{r}</option>)}</select></label><span className="legend"><i className="free"/> Open</span><span className="legend"><i className="booked"/> Booked</span><span className="legend"><i className="mine"/> Your booking</span><p>{calendarHint}</p></div>
    <div className="calendar-scroll">{roomList.length?<div className="room-cal"><div className="corner">ROOM / DATE</div>{days.map(d=><div className={'dayhead'+(inFind(d)?' in-range':'')} key={d}><strong>{weekDay(d)}</strong><span>{human(d)}</span></div>)}{roomList.map(room=><React.Fragment key={room}><div className="roomname"><strong>{room}</strong><small>Study room · {room[0]}</small>{findValid&&<button type="button" className="use-dates" aria-label={`Use these dates for ${room}`} onClick={()=>fill(room,find.startDate,find.endDate)}>Use these dates</button>}</div>{days.map(day=>{const b=occupied(room,day),label=!b?'Open':b.id===editing?'Editing':b.owner==='you'?'Your booking':'Booked';return <button key={room+day} title={`${room}, ${day}: ${label}`} aria-label={`${room}, ${weekDay(day)} ${human(day)}: ${label}`} className={'slot '+(b?'taken':'available')+(b?.owner==='you'?' mine':'')+(b&&b.id===editing?' being-edited':'')+(inFind(day)?' in-range':'')+(inForm(room,day)?' selected':'')} onClick={()=>pick(room,day)}><span>{label}</span></button>})}</React.Fragment>)}</div>:<p className="no-rooms">No room is free for all of those dates. Try fewer days or different dates.</p>}</div>
    <p className="calendar-note">Each cell is one day. To check a longer booking, enter both dates above.</p></>}
    {tab==='My bookings'&&<section id="my-reservations" className="reservations"><div className="reservations-head"><h2>Your bookings</h2><span>{myBookings.length} current records</span></div><div className="reservations-list">{myBookings.map(b=><article key={b.id} className={'reservation'+(b.id===editing?' current':'')}><div className="room-chip">{b.roomNumber}</div><div className="reservation-body"><strong>{span(b.startDate,b.endDate)}</strong><small>{b.purpose||'No purpose entered'}</small></div><button disabled={b.id===editing} aria-label={`${b.id===editing?'Editing':'Change'} ${b.roomNumber}, ${span(b.startDate,b.endDate)}`} onClick={()=>edit(b)}>{b.id===editing?'Editing':'Change'}</button></article>)}{myBookings.length===0&&<p>No bookings.</p>}</div></section>}</section>
    <aside className="booking-pane" id="booking-form"><div className="panel-tag"><span>{editing?'CHANGE A BOOKING':'BOOK A ROOM'}</span><span>FORM 01</span></div><h2 id="booking-title" tabIndex={-1}>{editing?'Change booking':'Make a booking'}</h2>
     {editRow?<div className="edit-banner"><strong>Changing {editRow.roomNumber}, {span(editRow.startDate,editRow.endDate)}</strong><span>Update the fields below{tab==='Availability'?', or click a day on the calendar':''}. Nothing changes until you save.</span>{tab!=='Availability'&&<button type="button" onClick={()=>openTab('Availability')}>Pick new dates on the calendar</button>}</div>:<p className="booking-description">Use this panel to book a room for your study group, meeting or activity.</p>}
     {notice&&<div className="success" role="status">{notice}</div>}<form onSubmit={submit}><label><span>Room number</span><input {...fieldProps('roomNumber')} list="rooms" placeholder="e.g., B2-104" value={form.roomNumber} onChange={e=>change('roomNumber',e.target.value)}/><datalist id="rooms">{rooms.map(r=><option key={r} value={r}/>)}</datalist>{fieldError('roomNumber')}</label><div className="date-pair"><label><span>Start date</span><input {...fieldProps('startDate')} type="date" value={form.startDate} onChange={e=>change('startDate',e.target.value)}/>{fieldError('startDate')}</label><label><span>End date</span><input {...fieldProps('endDate')} type="date" value={form.endDate} onChange={e=>change('endDate',e.target.value)}/>{fieldError('endDate')}</label></div>
     {!problem?.clash&&(validRange(form.startDate,form.endDate)?<p className="range-summary">Books {dayCount(form.startDate,form.endDate)===1?'1 day':`${dayCount(form.startDate,form.endDate)} days`}: {span(form.startDate,form.endDate)}. The room is free again on {human(form.endDate)}.</p>:<p className="helper">The end date is the day the room becomes free again, so it must be after the start date. Bookings for the same room cannot overlap.</p>)}
     {problem?.clash&&<div className="error" role="alert"><strong>{problem.clash.owner==='you'?`You already have ${problem.clash.roomNumber} booked`:`${problem.clash.roomNumber} is already booked`} for {span(problem.clash.startDate,problem.clash.endDate)}.</strong> It is free again on {human(problem.clash.endDate)}.{(problem.next||problem.others.length>0)&&<div className="suggestions"><span>Try instead:</span>{problem.next&&<button type="button" onClick={()=>accept(problem.next)}>{problem.clash.roomNumber}, {span(problem.next.startDate,problem.next.endDate)}</button>}{problem.others.map(r=><button key={r} type="button" onClick={()=>accept({roomNumber:r})}>{r}, {span(form.startDate,form.endDate)}</button>)}</div>}</div>}
     <label><span>Purpose / optional</span><textarea rows="3" placeholder="Meeting, group study..." value={form.purpose} onChange={e=>change('purpose',e.target.value)}/></label><button className="availability-check" type="button" onClick={check}>Check availability</button><button className="reserve-button" type="submit">{editing?'Save booking':'Confirm booking'}</button>{editing&&<button className="cancel-edit" type="button" onClick={cancelEdit}>Cancel editing</button>}</form><div className="right-foot"><span>✦</span> Need a room for a group? Find free dates, then confirm your booking.</div></aside></div>
  </main><footer>ROOMGRID / Academic campus demo — local browser data only.</footer>
 </div>;
}
