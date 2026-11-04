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
function mondayOf(iso){const d=new Date(`${iso}T12:00:00Z`).getUTCDay();return addDays(iso,-((d+6)%7));}
const longDay=iso=>`${weekDay(iso)} ${human(iso)}`;
// End dates are exclusive, so show the last day actually booked: 9–11 Nov reads "Mon 9 Nov – Tue 10 Nov".
function rangeLabel(start,end){const last=addDays(end,-1);return last===start?longDay(start):`${longDay(start)} – ${longDay(last)}`;}
function dayCount(start,end){const n=Math.round((Date.parse(end)-Date.parse(start))/864e5);return `${n} day${n===1?'':'s'}`;}
const sameRoom=(a,b)=>a.trim().toLowerCase()===b.trim().toLowerCase();
const clashes=(b,room,start,end,id)=>b.id!==id&&sameRoom(b.roomNumber,room)&&start<b.endDate&&end>b.startDate;

function issue(form,bookings,id){
 if(!form.roomNumber.trim()||!form.startDate||!form.endDate)return 'Complete the room and both dates.';
 if(form.endDate<=form.startDate)return 'End date must follow start date.';
 if(bookings.some(b=>b.id!==id&&b.roomNumber.toLowerCase()===form.roomNumber.trim().toLowerCase()&&form.startDate<b.endDate&&form.endDate>b.startDate))return 'This room is already booked for some of those dates.';
 return '';
}
// Same rules as issue(), plus what the student needs to fix it: the fields at fault,
// the booking that clashes, and free alternatives they can apply in one click.
function diagnose(form,bookings,id){
 if(!issue(form,bookings,id))return null;
 const missing=[['roomNumber','a room number'],['startDate','a start date'],['endDate','an end date']].filter(([k])=>!form[k].trim());
 if(missing.length){const names=missing.map(m=>m[1]);return {message:`Add ${names.length>1?names.slice(0,-1).join(', ')+' and '+names.at(-1):names[0]}.`,fields:missing.map(m=>m[0])};}
 if(form.endDate<=form.startDate)return {message:'The end date must be after the start date. It is the day the room becomes free again, so a one-day booking ends the next day.',fields:['endDate']};
 const room=form.roomNumber.trim();
 const conflict=bookings.find(b=>clashes(b,room,form.startDate,form.endDate,id));
 const len=Math.round((Date.parse(form.endDate)-Date.parse(form.startDate))/864e5);
 let nextDates=null;
 for(let s=addDays(form.startDate,1),i=0;i<60;i++,s=addDays(s,1)){const e=addDays(s,len);if(!bookings.some(b=>clashes(b,room,s,e,id))){nextDates={startDate:s,endDate:e};break;}}
 const otherRooms=rooms.filter(r=>!sameRoom(r,room)&&!bookings.some(b=>clashes(b,r,form.startDate,form.endDate,id))).slice(0,3);
 return {message:`${conflict.roomNumber} is already booked ${rangeLabel(conflict.startDate,conflict.endDate)}${conflict.owner==='you'?' (one of your bookings)':''}, which overlaps the dates you chose.`,fields:['startDate','endDate'],nextDates,otherRooms};
}

const tabFromHash=()=>location.hash==='#my-bookings'?'My bookings':'Availability';

export default function App(){
 const [bookings,setBookings]=useState(read);
 const [week,setWeek]=useState('2026-11-09');
 const [view,setView]=useState('All rooms');
 const [form,setForm]=useState({...formEmpty});
 const [editing,setEditing]=useState(null);
 const [error,setError]=useState(null);
 const [notice,setNotice]=useState('');
 // Each tab is its own page; the URL hash keeps it across reloads and supports the back button.
 const [tab,setTab]=useState(tabFromHash);
 const [confirmReset,setConfirmReset]=useState(false);
 const [resetDone,setResetDone]=useState(false);
 // 'end' after a first calendar click: the next click in the same row sets the last day.
 const [rangeStep,setRangeStep]=useState('start');
 const roomInput=useRef(null);
 useEffect(()=>localStorage.setItem(STORAGE,JSON.stringify(bookings)),[bookings]);
 useEffect(()=>{const sync=()=>setTab(tabFromHash());addEventListener('popstate',sync);addEventListener('hashchange',sync);return()=>{removeEventListener('popstate',sync);removeEventListener('hashchange',sync);};},[]);
 const days=useMemo(()=>Array.from({length:7},(_,i)=>addDays(week,i)),[week]);
 const myBookings=bookings.filter(b=>b.owner==='you').sort((a,b)=>a.startDate.localeCompare(b.startDate));
 const roomList=view==='All rooms'?rooms:rooms.filter(r=>r===view);
 const occupied=(room,date)=>bookings.find(b=>b.roomNumber===room&&date>=b.startDate&&date<b.endDate);
 const hasRange=form.roomNumber.trim()&&form.startDate&&form.endDate&&form.endDate>form.startDate;
 const status=useMemo(()=>{
  if(!form.roomNumber.trim()&&!form.startDate&&!form.endDate)return null;
  const d=diagnose(form,bookings,editing);
  if(d)return {tone:'warn',...d};
  return {tone:'ok',message:`${form.roomNumber.trim()} is free ${rangeLabel(form.startDate,form.endDate)} (${dayCount(form.startDate,form.endDate)}). The end date, ${longDay(form.endDate)}, is when the room is free again.`};
 },[form,bookings,editing]);

 function clearFeedback(){setError(null);setNotice('');setResetDone(false);}
 function update(field,value){setForm(f=>({...f,[field]:value}));setRangeStep('start');setError(null);}
 function pick(room,day){
  clearFeedback();
  const extend=rangeStep==='end'&&sameRoom(form.roomNumber,room)&&form.startDate&&day>=form.startDate;
  if(extend){setForm(f=>({...f,endDate:addDays(day,1)}));setRangeStep('start');}
  else{setForm(f=>({...f,roomNumber:room,startDate:day,endDate:addDays(day,1)}));setRangeStep('end');}
 }
 function showForm(){document.getElementById('booking-form')?.scrollIntoView({behavior:'smooth',block:'nearest'});}
 function edit(row){
  if(row.owner!=='you')return;
  setEditing(row.id);setForm({roomNumber:row.roomNumber,startDate:row.startDate,endDate:row.endDate,purpose:row.purpose});clearFeedback();setRangeStep('start');
  setWeek(mondayOf(row.startDate));
  if(view!=='All rooms'&&view!==row.roomNumber)setView('All rooms');
  requestAnimationFrame(()=>{showForm();roomInput.current?.focus({preventScroll:true});});
 }
 function goTo(next){setTab(next);const hash=next==='My bookings'?'#my-bookings':'#availability';if(location.hash!==hash)history.pushState(null,'',hash);scrollTo(0,0);}
 function showInCalendar(row){goTo('Availability');setWeek(mondayOf(row.startDate));setView('All rooms');setTimeout(()=>document.querySelector(`.roomname[data-room="${row.roomNumber}"]`)?.scrollIntoView({block:'center'}),50);}
 function applyFix(patch){setForm(f=>({...f,...patch}));setRangeStep('start');setError(null);if(patch.startDate)setWeek(mondayOf(patch.startDate));}
 function submit(e){e.preventDefault();setNotice('');setResetDone(false);const d=diagnose(form,bookings,editing);if(d){setError(d);return;}
  // Store the directory spelling so a typed "b2-104" still appears in the calendar.
  const roomNumber=rooms.find(r=>sameRoom(r,form.roomNumber))||form.roomNumber.trim();
  const payload={roomNumber,startDate:form.startDate,endDate:form.endDate,purpose:form.purpose.trim(),owner:'you'};
  const summary=`${roomNumber}, ${rangeLabel(form.startDate,form.endDate)}.`;
  if(editing){setBookings(bookings.map(b=>b.id===editing?{...b,...payload}:b));setNotice('Booking updated: '+summary);}else{setBookings([...bookings,{...payload,id:'b-'+Date.now()}]);setNotice('Room reserved: '+summary);}
  setForm({...formEmpty});setEditing(null);setError(null);setRangeStep('start');}
 function cancelEdit(){setEditing(null);setForm({...formEmpty});setError(null);setRangeStep('start');}
 function reset(){setBookings(seed);setForm({...formEmpty});setEditing(null);setWeek('2026-11-09');setNotice('Example bookings restored.');setError(null);setView('All rooms');setRangeStep('start');setConfirmReset(false);setNotice('');setResetDone(true);}
 function check(){setNotice('');setError(null);setResetDone(false);const d=diagnose(form,bookings,editing);if(d){setError(d);}else setNotice('No conflict detected for the selected dates.');}

 function cell(room,day){
  const b=occupied(room,day);
  const mine=b&&b.owner==='you';
  const beingEdited=b&&b.id===editing;
  const inRange=hasRange&&sameRoom(room,form.roomNumber)&&day>=form.startDate&&day<form.endDate;
  const clash=inRange&&b&&!beingEdited;
  const state=clash?'clash':inRange?'chosen':mine?'mine':b?'taken':'available';
  const label={clash:'Clash',chosen:'Selected',mine:'Yours',taken:'Booked',available:'Open'}[state];
  const sub=clash?(mine?'Your booking':'Reserved'):inRange?(day===form.startDate?'Start':''):beingEdited?'Editing':mine?'Change':b?'Reserved':'';
  const action=clash||(b&&!mine)?null:mine&&!beingEdited?'change this booking':'select';
  return <button key={room+day} type="button" data-room={room} data-day={day} disabled={!action}
   aria-label={`${room}, ${longDay(day)}: ${label}${b?(mine?', your booking':', reserved by someone else'):''}${action?`. Click to ${action}.`:''}`}
   title={b&&!mine?`Reserved: ${rangeLabel(b.startDate,b.endDate)}`:undefined}
   className={'slot '+state+(beingEdited&&!inRange?' editing':'')} onClick={()=>mine&&!beingEdited?edit(b):pick(room,day)}>
   <span>{label}</span>{sub&&<small>{sub}</small>}</button>;
 }
 const feedback=error?{...error,tone:'error'}:status;
 const invalid=f=>!!error?.fields?.includes(f);

 return <div className="room-app"><header className="topbar"><div className="mark"><span className="mark-sq">R</span><span><strong>room<span>grid</span></strong><small>Campus spaces</small></span></div><nav aria-label="Pages">{['Availability','My bookings'].map(t=><button key={t} className={tab===t?'selected':''} aria-current={tab===t?'page':undefined} onClick={()=>goTo(t)}>{t}{t==='My bookings'&&<span className="count">{myBookings.length}</span>}</button>)}</nav><div className="member"><span>Student dashboard</span><div className="profile">YOU</div></div></header>
  <main><section className="intro"><div>{tab==='Availability'?<><span className="eyebrow">SPACES / RESERVATIONS</span><h1>Find room availability</h1><p>Review campus rooms, dates and existing reservations in one view.</p></>:<><span className="eyebrow">SPACES / MY BOOKINGS</span><h1>My bookings</h1><p>Review your reservations and change their room or dates.</p></>}</div><div className="intro-summary"><span>ROOMS IN DIRECTORY</span><strong>{rooms.length.toString().padStart(2,'0')}</strong><span>CURRENT RESERVATIONS</span><strong>{bookings.length.toString().padStart(2,'0')}</strong></div></section>
   <div className="pagegrid">{tab==='Availability'?<section className="calendar-pane"><div className="calendar-head"><div><span className="eyebrow">AVAILABILITY CALENDAR</span><h2>Rooms by day</h2></div><div className="weeknav"><button aria-label="Previous week" onClick={()=>setWeek(addDays(week,-7))}>←</button><strong>{human(week)} – {human(addDays(week,6))}</strong><button aria-label="Next week" onClick={()=>setWeek(addDays(week,7))}>→</button></div></div>
    <div className="calendar-controls"><label>Location <select value={view} onChange={e=>setView(e.target.value)}><option>All rooms</option>{rooms.map(r=><option key={r}>{r}</option>)}</select></label>
     <span className="legend"><i className="free"/> Open</span><span className="legend"><i className="booked"/> Booked</span><span className="legend"><i className="yours"/> Yours</span><span className="legend"><i className="picked"/> Selected</span><span className="legend"><i className="clashed"/> Clash</span>
     <p><strong>Click an open day to start, then a later day in the same row to set the last day.</strong> Click one of your bookings to change it.</p></div>
    <div className="calendar-scroll"><div className="room-cal"><div className="corner">ROOM / DATE</div>{days.map(d=><div className="dayhead" key={d}><strong>{weekDay(d)}</strong><span>{human(d)}</span></div>)}{roomList.map(room=><React.Fragment key={room}><div data-room={room} className={'roomname'+(hasRange&&sameRoom(room,form.roomNumber)?' active':'')}><strong>{room}</strong><small>Study room · {room[0]}</small></div>{days.map(day=>cell(room,day))}</React.Fragment>)}</div></div>
    {hasRange&&<div className={'selection-bar '+(status?.tone||'ok')}><div><strong>{form.roomNumber.trim()} · {rangeLabel(form.startDate,form.endDate)}</strong><small>{status?.tone==='warn'?'Clashes with an existing booking':`${dayCount(form.startDate,form.endDate)} · available`}</small></div><button type="button" onClick={showForm}>Review booking</button></div>}
    <p className="calendar-note">Each cell is one day. Pick a range in one row and the calendar marks any clash in red before you submit.</p>
    </section>
    :<section id="my-reservations" className="calendar-pane reservations-page"><div className="reservations-head"><div><span className="eyebrow">YOUR RESERVATIONS</span><h2>Upcoming bookings</h2></div><span>{myBookings.length} current records</span></div>
     {myBookings.length>0?<div className="reservations-list">{myBookings.map(b=><article key={b.id} className={'reservation'+(b.id===editing?' is-editing':'')}><div className="room-chip">{b.roomNumber}</div><div className="reservation-body"><strong>{rangeLabel(b.startDate,b.endDate)}</strong><small>{dayCount(b.startDate,b.endDate)} · {b.purpose||'No purpose entered'}</small></div>
      <div className="reservation-actions"><button type="button" className="link" onClick={()=>showInCalendar(b)}>Show in calendar</button><button type="button" className="change" onClick={()=>edit(b)} aria-label={`Change booking for ${b.roomNumber}, ${rangeLabel(b.startDate,b.endDate)}`}>{b.id===editing?'Editing':'Change'}</button></div></article>)}</div>
     :<div className="empty-state"><p>You have no bookings yet.</p><button type="button" onClick={()=>goTo('Availability')}>Find a free room</button></div>}
     <p className="calendar-note">Click Change to edit a booking in the form. Its current dates never count as a clash with itself.</p></section>}
    <aside className={'booking-pane'+(editing?' is-editing':'')} id="booking-form"><div className="panel-tag"><span>{editing?'EDIT BOOKING':'BOOK A ROOM'}</span><span>FORM 01</span></div><h2>{editing?'Change reservation':'Make a reservation'}</h2><p className="booking-description">{editing?`Adjust the room or dates below${tab==='Availability'?', or click other days in the calendar':''}. Your original dates are not counted as a clash.`:tab==='Availability'?'Pick days in the calendar or fill in the fields below.':'Fill in the fields below, or use the Availability page to pick days.'}</p>
     <form onSubmit={submit}><label><span>Room number</span><input ref={roomInput} list="rooms" placeholder="e.g., B2-104" value={form.roomNumber} aria-invalid={invalid('roomNumber')} aria-describedby="form-feedback" onChange={e=>update('roomNumber',e.target.value)}/><datalist id="rooms">{rooms.map(r=><option key={r} value={r}/>)}</datalist></label>
      <div className="date-pair"><label><span>Start date</span><input type="date" value={form.startDate} aria-invalid={invalid('startDate')} aria-describedby="form-feedback" onChange={e=>update('startDate',e.target.value)}/></label><label><span>End date <em>(free again)</em></span><input type="date" value={form.endDate} aria-invalid={invalid('endDate')} aria-describedby="form-feedback" onChange={e=>update('endDate',e.target.value)}/></label></div>
      <div id="form-feedback" className="feedback-slot" aria-live="polite">{feedback?<div className={'feedback '+feedback.tone} role={feedback.tone==='error'?'alert':undefined}><p>{feedback.tone==='error'&&<strong>Not booked yet. </strong>}{feedback.message}</p>
       {(feedback.nextDates||feedback.otherRooms?.length>0)&&<div className="fixes">{feedback.nextDates&&<button type="button" onClick={()=>applyFix(feedback.nextDates)}>Use {rangeLabel(feedback.nextDates.startDate,feedback.nextDates.endDate)}</button>}{feedback.otherRooms?.map(r=><button type="button" key={r} onClick={()=>applyFix({roomNumber:r})}>Same dates in {r}</button>)}</div>}
       {feedback.tone==='ok'&&rangeStep==='end'&&<p className="tip">To book more days, click a later day in the {form.roomNumber.trim()} row.</p>}</div>
       :<p className="helper">Start and end dates are required. Reservations cannot overlap existing bookings for the same room.</p>}</div>
      <label><span>Purpose / optional</span><textarea rows="3" placeholder="Meeting, group study..." value={form.purpose} onChange={e=>setForm(f=>({...f,purpose:e.target.value}))}/></label>
      {notice&&<div className="success" role="status">{notice}</div>}
      <button className="availability-check" type="button" onClick={check}>Check availability</button><button className="reserve-button" type="submit">{editing?'Save booking':'Confirm booking'}</button>{editing&&<button className="cancel-edit" type="button" onClick={cancelEdit}>Cancel editing</button>}</form>
     <div className="reset-zone"><div><strong>Demo data</strong><small>Restores the 40 example bookings and removes every change you made.</small></div>
      {confirmReset?<div className="reset-confirm" role="group" aria-label="Confirm reset"><span>Remove all your changes?</span><button type="button" className="danger" onClick={reset}>Yes, reset</button><button type="button" onClick={()=>setConfirmReset(false)}>Keep my changes</button></div>
      :<button type="button" className="reset-button" onClick={()=>{setConfirmReset(true);setNotice('');setResetDone(false);}}>Reset demo</button>}
      {resetDone&&<p className="reset-done" role="status">Example bookings restored.</p>}</div></aside></div>
  </main><footer>ROOMGRID / Academic campus demo — local browser data only.</footer>
 </div>;
}
