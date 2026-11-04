  import React, {useEffect, useMemo, useRef, useState} from 'react';

  const STORAGE = 'acl-roomgrid-18rooms-v1';
  const rooms = ['A1-203', 'A2-106', 'A2-107', 'A3-208', 'A3-209', 'B1-205', 'B1-206', 'B1-207', 'B2-104', 'B2-105', 'B3-301', 'C1-102', 'C1-103', 'C2-201', 'C2-202', 'C3-101', 'C3-102', 'D1-101'];
  // End dates are exclusive; all sample reservations use non-overlapping date ranges.
  const sampleRows = [
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
  const seed = sampleRows.map(([roomNumber,startDate,endDate,purpose,owner],index)=>({id:`demo-${index+1}`,roomNumber,startDate,endDate,purpose,owner}));
  const formEmpty = {roomNumber:'',startDate:'',endDate:'',purpose:''};
  const FIRST_WEEK = '2026-11-09';
  const DEFAULT_HINT = 'Click an open day to start a booking. Click a later open day in the same row to extend it.';

  function read(){try{let a=JSON.parse(localStorage.getItem(STORAGE));return Array.isArray(a)?a:seed;}catch{return seed;}}
  function addDays(iso,days){const t=new Date(`${iso}T12:00:00Z`);t.setUTCDate(t.getUTCDate()+days);return t.toISOString().slice(0,10);}
  function human(iso){return new Date(`${iso}T12:00:00Z`).toLocaleDateString('en-GB',{timeZone:'UTC',day:'numeric',month:'short'});}
  function weekDay(iso){return new Date(`${iso}T12:00:00Z`).toLocaleDateString('en-GB',{timeZone:'UTC',weekday:'short'});}
  function dayCount(start,end){return Math.round((new Date(`${end}T12:00:00Z`)-new Date(`${start}T12:00:00Z`))/864e5);}
  function weekOf(iso){return addDays(FIRST_WEEK,Math.floor(dayCount(FIRST_WEEK,iso)/7)*7);}
  const isDate = s => /^\d{4}-\d{2}-\d{2}$/.test(s||'');

  // The end date is exclusive, so show the days the room is actually held ("Tue 17 – Wed 18 Nov").
  function heldSpan(start,end){
  const last=addDays(end,-1);
  return start===last?`${weekDay(start)} ${human(start)}`:`${weekDay(start)} ${human(start)} – ${weekDay(last)} ${human(last)}`;
  }
  function heldLabel(start,end){const n=dayCount(start,end);return `${heldSpan(start,end)} · ${n} day${n===1?'':'s'}`;}

  // Original validation rule — unchanged. Every save path still goes through it.
  function issue(form,bookings,id){
  if(!form.roomNumber.trim()||!form.startDate||!form.endDate)return 'Complete the room and both dates.';
  if(form.endDate<=form.startDate)return 'End date must follow start date.';
  if(bookings.some(b=>b.id!==id&&b.roomNumber.toLowerCase()===form.roomNumber.trim().toLowerCase()&&form.startDate<b.endDate&&form.endDate>b.startDate))return 'This room is already booked for some of those dates.';
  return '';
  }
  function clashes(room,start,end,bookings,id){
  return bookings.filter(b=>b.id!==id&&b.roomNumber.toLowerCase()===room.trim().toLowerCase()&&start<b.endDate&&end>b.startDate).sort((a,b)=>a.startDate.localeCompare(b.startDate));
  }
  // First free window of the same length in the same room, after the requested start.
  function nextFree(form,bookings,id){
  const len=dayCount(form.startDate,form.endDate);
  for(let i=1;i<=60;i++){const s=addDays(form.startDate,i),e=addDays(s,len);if(!clashes(form.roomNumber,s,e,bookings,id).length)return {startDate:s,endDate:e};}
  return null;
  }
  // Turns the original rule's verdict into a specific, actionable explanation.
  function explain(form,bookings,id){
  if(!issue(form,bookings,id))return null;
  if(!form.roomNumber.trim()||!form.startDate||!form.endDate){
    const missing=[!form.roomNumber.trim()&&'room number',!form.startDate&&'start date',!form.endDate&&'end date'].filter(Boolean);
    return {msg:`Add the ${missing.join(' and ')} to continue.`,fields:missing.map(m=>m.split(' ')[0])};
  }
  if(form.endDate<=form.startDate)return {msg:`The end date must be after the start date. The end date is the day you hand the room back, so a one-day booking on ${human(form.startDate)} ends on ${human(addDays(form.startDate,1))}.`,fields:['end']};
  const c=clashes(form.roomNumber,form.startDate,form.endDate,bookings,id)[0];
  return {msg:`${c.roomNumber} is already booked ${c.owner==='you'?'by you':'by another student'} on ${heldSpan(c.startDate,c.endDate)}, which overlaps your dates.`,fields:['start','end'],suggestion:nextFree(form,bookings,id)};
  }

  export default function App(){
  const [bookings,setBookings]=useState(read);
  const [week,setWeek]=useState(FIRST_WEEK);
  const [view,setView]=useState('All rooms');
  const [form,setForm]=useState({...formEmpty});
  const [editing,setEditing]=useState(null);
  const [error,setError]=useState(null); // {msg, fields, suggestion}
  const [notice,setNotice]=useState('');
  const [hint,setHint]=useState(DEFAULT_HINT);
  const [flash,setFlash]=useState(null);
  const [tab,setTab]=useState('Availability');
  const roomInput=useRef(null);
  const formTop=useRef(null);

  useEffect(()=>localStorage.setItem(STORAGE,JSON.stringify(bookings)),[bookings]);
  useEffect(()=>{if(!flash)return;const t=setTimeout(()=>setFlash(null),3000);return()=>clearTimeout(t);},[flash]);

  const days=useMemo(()=>Array.from({length:7},(_,i)=>addDays(week,i)),[week]);
  const myBookings=bookings.filter(b=>b.owner==='you').sort((a,b)=>a.startDate.localeCompare(b.startDate));
  const roomList=view==='All rooms'?rooms:rooms.filter(r=>r===view);
  const occupied=(room,date)=>bookings.find(b=>b.roomNumber===room&&date>=b.startDate&&date<b.endDate);
  const editingRow=bookings.find(b=>b.id===editing);
  const datesOk=isDate(form.startDate)&&isDate(form.endDate)&&form.endDate>form.startDate;
  const inSelection=(room,day)=>datesOk&&form.roomNumber.trim().toLowerCase()===room.toLowerCase()&&day>=form.startDate&&day<form.endDate;
  const bad=f=>error?.fields?.includes(f);

  function showForm(){
    setTimeout(()=>{formTop.current?.scrollIntoView({behavior:'smooth',block:'start'});roomInput.current?.focus({preventScroll:true});},0);
  }

  function pick(room,date){
    const b=occupied(room,date);
    // Your own booking → open it for editing.
    if(b&&b.owner==='you'&&b.id!==editing){edit(b);return;}
    // Someone else's booking → explain, instead of prefilling dates that are guaranteed to fail.
    if(b&&b.id!==editing){setHint(`${room} is reserved by another student on ${weekDay(date)} ${human(date)}. Pick a green "Open" day.`);return;}
    setError(null);setNotice('');
    const sameRoom=form.roomNumber.trim().toLowerCase()===room.toLowerCase();
    const verb=editing?'save your changes':'confirm the booking';
    // A later click in the same row extends the range, if nothing is booked in between.
    if(sameRoom&&isDate(form.startDate)&&date>=form.startDate&&!clashes(room,form.startDate,addDays(date,1),bookings,editing).length){
    const endDate=addDays(date,1);
    setForm(f=>({...f,roomNumber:room,endDate}));
    setHint(`Selected ${room}: ${heldLabel(form.startDate,endDate)}. Review the form and ${verb}.`);
    }else{
    setForm(f=>({...f,roomNumber:room,startDate:date,endDate:addDays(date,1),purpose:editing?f.purpose:''}));
    setHint(`Selected ${room}: ${weekDay(date)} ${human(date)}. Click a later open day in this row to extend, or ${verb}.`);
    }
    if(window.innerWidth<=1200)showForm();
  }

  function edit(row){
    if(row.owner!=='you')return;
    setEditing(row.id);
    setForm({roomNumber:row.roomNumber,startDate:row.startDate,endDate:row.endDate,purpose:row.purpose});
    setError(null);setNotice('');
    setHint(`Changing your ${row.roomNumber} booking. Click open days in its row, or edit the dates in the form.`);
    setWeek(weekOf(row.startDate));
    showForm();
  }

  function submit(e){
    e.preventDefault();setNotice('');
    const err=explain(form,bookings,editing);
    if(err){
    setError(err);
    const f=err.fields[0];
    setTimeout(()=>document.getElementById(f==='room'?'f-room':f==='start'?'f-start':'f-end')?.focus(),0);
    return;
    }
    const payload={roomNumber:form.roomNumber.trim(),startDate:form.startDate,endDate:form.endDate,purpose:form.purpose.trim(),owner:'you'};
    if(editing){
    setBookings(bookings.map(b=>b.id===editing?{...b,...payload}:b));
    setNotice(`Booking updated: ${payload.roomNumber}, ${heldLabel(payload.startDate,payload.endDate)}.`);
    setFlash(editing);
    }else{
    const id='b-'+Date.now();
    setBookings([...bookings,{...payload,id}]);
    setNotice(`Room reserved: ${payload.roomNumber}, ${heldLabel(payload.startDate,payload.endDate)}. You can change it under "Your bookings".`);
    setFlash(id);
    }
    setForm({...formEmpty});setEditing(null);setError(null);setHint(DEFAULT_HINT);
  }

  function reset(){setBookings(seed);setForm({...formEmpty});setEditing(null);setWeek(FIRST_WEEK);setNotice('Example bookings restored.');setError(null);setView('All rooms');setHint(DEFAULT_HINT);}

  function check(){
    setNotice('');setError(null);
    const e=explain(form,bookings,editing);
    if(e)setError(e);
    else setNotice(`No conflict: ${form.roomNumber.trim()} is free for ${heldLabel(form.startDate,form.endDate)}.`);
  }

  function applySuggestion(s){
    setForm(f=>({...f,...s}));
    setError(null);
    setNotice(`Dates changed to ${heldLabel(s.startDate,s.endDate)} — no conflict. ${editing?'Save':'Confirm'} to keep them.`);
    setWeek(weekOf(s.startDate));
  }

  function cancelEdit(){setEditing(null);setForm({...formEmpty});setError(null);setNotice('');setHint('Editing cancelled — your booking was not changed.');}

  return <div className="room-app">
    <header className="topbar">
    <div className="mark"><span className="mark-sq">R</span><span><strong>room<span>grid</span></strong><small>Campus spaces</small></span></div>
    <nav>
      <button className={tab==='Availability'?'selected':''} onClick={()=>setTab('Availability')}>Availability</button>
      <button className={tab==='My bookings'?'selected':''} onClick={()=>{setTab('My bookings');document.getElementById('my-reservations')?.scrollIntoView({behavior:'smooth'});}}>My bookings</button>
      <button onClick={reset}>Reset demo</button>
    </nav>
    <div className="member"><span>Student dashboard</span><div className="profile">YOU</div></div>
    </header>
    <main>
    <section className="intro">
      <div><span className="eyebrow">SPACES / RESERVATIONS</span><h1>Find room availability</h1><p>Review campus rooms, dates and existing reservations in one view.</p></div>
      <div className="intro-summary"><span>ROOMS IN DIRECTORY</span><strong>{rooms.length.toString().padStart(2,'0')}</strong><span>CURRENT RESERVATIONS</span><strong>{bookings.length.toString().padStart(2,'0')}</strong></div>
    </section>
    <div className="pagegrid">
      <section className="calendar-pane">
      <div className="calendar-head">
        <div><span className="eyebrow">AVAILABILITY CALENDAR</span><h2>Rooms by day</h2></div>
        <div className="weeknav"><button aria-label="Previous week" onClick={()=>setWeek(addDays(week,-7))}>←</button><strong>{human(week)} – {human(addDays(week,6))}</strong><button aria-label="Next week" onClick={()=>setWeek(addDays(week,7))}>→</button></div>
      </div>
      <div className="calendar-controls">
        <label>Room <select value={view} onChange={e=>setView(e.target.value)}><option>All rooms</option>{rooms.map(r=><option key={r}>{r}</option>)}</select></label>
        <span className="legend"><i className="free"/> Open — click to book</span>
        <span className="legend"><i className="booked"/> Reserved by others</span>
        <span className="legend"><i className="mine"/> Yours — click to change</span>
        <span className="legend"><i className="sel"/> Your selection</span>
      </div>
      <p className="calendar-hint" role="status" aria-live="polite">{hint}</p>
      <div className="calendar-scroll"><div className="room-cal">
        <div className="corner">ROOM / DATE</div>
        {days.map(d=><div className="dayhead" key={d}><strong>{weekDay(d)}</strong><span>{human(d)}</span></div>)}
        {roomList.map(room=><React.Fragment key={room}>
        <div className="roomname"><strong>{room}</strong><small>Study room · {room[0]}</small></div>
        {days.map(day=>{
          const b=occupied(room,day);
          const state=inSelection(room,day)?'selected':b&&b.id===editing?'moving':b&&b.owner==='you'?'mine':b?'taken':'available';
          const label={selected:'Selected',moving:'Old dates',mine:'Yours',taken:'Reserved',available:'Open'}[state];
          const sub={selected:editing?'New dates':'New booking',moving:'Being changed',mine:'Click to change',taken:'Not available',available:'+ Book'}[state];
          return <button key={room+day} type="button" className={'slot '+state}
          aria-disabled={state==='taken'||undefined}
          aria-label={`${room}, ${weekDay(day)} ${human(day)}: ${label}. ${sub}`}
          title={`${room}, ${human(day)}: ${label}`} onClick={()=>pick(room,day)}>
          <span>{label}</span><small>{sub}</small>
          </button>;
        })}
        </React.Fragment>)}
      </div></div>
      <p className="calendar-note">Each cell is one day. A booking holds the room from its start date up to, but not including, its end date — the end date is the day the room is handed back.</p>
      <section id="my-reservations" className="reservations">
        <div className="reservations-head"><h2>Your bookings</h2><span>{myBookings.length} current records</span></div>
        <div className="reservations-list">
        {myBookings.map(b=><article key={b.id} className={'reservation'+(b.id===editing?' is-editing':'')+(b.id===flash?' is-new':'')}>
          <div className="room-chip">{b.roomNumber}</div>
          <div className="reservation-body"><strong>{heldLabel(b.startDate,b.endDate)}</strong><small>{b.purpose||'No purpose entered'}</small></div>
          {b.id===editing?<span className="editing-pill">Editing…</span>
          :<button type="button" onClick={()=>edit(b)} aria-label={`Change booking ${b.roomNumber}, ${heldLabel(b.startDate,b.endDate)}`}>Change</button>}
        </article>)}
        {myBookings.length===0&&<p>No reservations.</p>}
        </div>
      </section>
      </section>
      <aside className={'booking-pane'+(editing?' editing':'')} id="booking-form" ref={formTop}>
      <div className="panel-tag"><span>{editing?'CHANGE A BOOKING':'BOOK A ROOM'}</span><span>FORM 01</span></div>
      <h2>{editing?'Change reservation':'Make a reservation'}</h2>
      {editingRow?<div className="edit-banner">You are changing <strong>{editingRow.roomNumber}</strong>, currently booked {heldLabel(editingRow.startDate,editingRow.endDate)}.</div>
        :<p className="booking-description">Use this panel to request a room for your study group, meeting or activity.</p>}
      {notice&&<div className="success" role="status">{notice}</div>}
      {error&&<div className="error" role="alert"><strong>Not booked yet.</strong> {error.msg}
        {error.suggestion&&<div className="suggest">
        <span>Next free {dayCount(error.suggestion.startDate,error.suggestion.endDate)}-day slot in {form.roomNumber.trim()}: <strong>{heldSpan(error.suggestion.startDate,error.suggestion.endDate)}</strong></span>
        <button type="button" onClick={()=>applySuggestion(error.suggestion)}>Use these dates</button>
        </div>}
      </div>}
      <form onSubmit={submit} noValidate>
        <label><span>Room number</span><input id="f-room" ref={roomInput} list="rooms" placeholder="e.g., B2-104" aria-invalid={bad('room')||undefined} value={form.roomNumber} onChange={e=>setForm(f=>({...f,roomNumber:e.target.value}))}/><datalist id="rooms">{rooms.map(r=><option key={r} value={r}/>)}</datalist></label>
        <div className="date-pair">
        <label><span>Start date</span><input id="f-start" type="date" aria-invalid={bad('start')||undefined} value={form.startDate} onChange={e=>setForm(f=>({...f,startDate:e.target.value}))}/></label>
        <label><span>End date <em>(hand-back day)</em></span><input id="f-end" type="date" min={isDate(form.startDate)?addDays(form.startDate,1):undefined} aria-invalid={bad('end')||undefined} value={form.endDate} onChange={e=>setForm(f=>({...f,endDate:e.target.value}))}/></label>
        </div>
        {datesOk&&<p className="date-summary">You'll hold the room <strong>{heldLabel(form.startDate,form.endDate)}</strong>. It's free again on {weekDay(form.endDate)} {human(form.endDate)}.</p>}
        <label><span>Purpose / optional</span><textarea rows="4" placeholder="Meeting, group study..." value={form.purpose} onChange={e=>setForm(f=>({...f,purpose:e.target.value}))}/></label>
        <p className="helper">Start and end dates are required. Reservations cannot overlap existing bookings for the same room.</p>
        <button className="availability-check" type="button" onClick={check}>Check availability</button>
        <button className="reserve-button" type="submit">{editing?'Save changes':'Confirm booking'}</button>
        {editing&&<button className="cancel-edit" type="button" onClick={cancelEdit}>Cancel editing — keep original dates</button>}
      </form>
      <div className="right-foot"><span>✦</span> Need a room for a group? Find an open date and submit your request.</div>
      </aside>
    </div>
    </main>
    <footer>ROOMGRID / Academic campus demo — local browser data only.</footer>
  </div>;
  }
