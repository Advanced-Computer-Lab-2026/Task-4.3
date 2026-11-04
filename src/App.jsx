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
function roomIsAvailable(room,startDate,endDate,bookings,id){
 return rooms.some(r=>r.toLowerCase()===room.trim().toLowerCase())&&Boolean(startDate&&endDate&&endDate>startDate)&&!bookings.some(b=>b.id!==id&&b.roomNumber.toLowerCase()===room.trim().toLowerCase()&&startDate<b.endDate&&endDate>b.startDate);
}
function issue(form,bookings,id){
 if(!form.roomNumber.trim()||!form.startDate||!form.endDate)return 'Complete the room and both dates.';
 if(form.endDate<=form.startDate)return 'End date must follow start date.';
 if(!rooms.some(room=>room.toLowerCase()===form.roomNumber.trim().toLowerCase()))return 'Choose a room from the campus directory.';
 if(!roomIsAvailable(form.roomNumber,form.startDate,form.endDate,bookings,id))return 'This room is already booked for some of those dates.';
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
 const editingBooking=bookings.find(b=>b.id===editing&&b.owner==='you');
 const hasValidDateRange=form.startDate&&form.endDate&&form.endDate>form.startDate;
 const availableRooms=hasValidDateRange?rooms.filter(room=>roomIsAvailable(room,form.startDate,form.endDate,bookings,editing)):rooms;
 const roomList=view==='All rooms'?rooms:rooms.filter(r=>r===view);
 const occupied=(room,date)=>bookings.find(b=>b.roomNumber===room&&date>=b.startDate&&date<b.endDate);
 function changeField(field,value){setForm(current=>({...current,[field]:value}));setError('');setNotice('');}
 function pick(room,date){setForm({roomNumber:room,startDate:date,endDate:addDays(date,1),purpose:''});setEditing(null);setError('');setNotice('');document.getElementById('booking-form')?.scrollIntoView({behavior:'smooth',block:'nearest'});}
 function edit(row){if(row.owner!=='you')return;setEditing(row.id);setForm({roomNumber:row.roomNumber,startDate:row.startDate,endDate:row.endDate,purpose:row.purpose});setError('');setNotice('');document.getElementById('booking-form')?.scrollIntoView({behavior:'smooth',block:'nearest'});}
 function submit(e){e.preventDefault();setNotice('');const err=issue(form,bookings,editing);if(err){setError(err);return;}const payload={roomNumber:form.roomNumber.trim(),startDate:form.startDate,endDate:form.endDate,purpose:form.purpose.trim(),owner:'you'};
 if(editing){setBookings(bookings.map(b=>b.id===editing?{...b,...payload}:b));setNotice('Booking updated.');}else{setBookings([...bookings,{...payload,id:'b-'+Date.now()}]);setNotice('Room reserved.');}setForm({...formEmpty});setEditing(null);setError('');}
 function reset(){setBookings(seed);setForm({...formEmpty});setEditing(null);setWeek('2026-11-09');setNotice('Example bookings restored.');setError('');setView('All rooms');}
 function check(){setNotice('');setError('');const err=issue(form,bookings,editing);if(err){setError(err);}else setNotice('No conflict detected for the selected dates.');}
 return <div className="room-app">
  <header className="topbar">
   <div className="mark"><span className="mark-sq">R</span><span><strong>room<span>grid</span></strong><small>Campus spaces</small></span></div>
   <nav><button className={tab==='Availability'?'selected':''} onClick={()=>setTab('Availability')}>Availability</button><button className={tab==='My bookings'?'selected':''} onClick={()=>{setTab('My bookings');document.getElementById('my-reservations')?.scrollIntoView({behavior:'smooth'});}}>My bookings</button><button onClick={reset}>Reset demo</button></nav>
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
      <label>Location <select value={view} onChange={e=>setView(e.target.value)}><option>All rooms</option>{rooms.map(r=><option key={r}>{r}</option>)}</select></label>
      <span className="legend"><i className="booked"/> Reserved</span><span className="legend"><i className="free"/> Available</span><span className="legend"><i className="mine"/> Your booking</span>
      <p>Choose an open date to start a one-day booking.</p>
     </div>
     <div className="calendar-scroll">
      <div className="room-cal">
       <div className="corner">ROOM / DATE</div>
       {days.map(d=><div className="dayhead" key={d}><strong>{weekDay(d)}</strong><span>{human(d)}</span></div>)}
       {roomList.map(room=><React.Fragment key={room}>
        <div className="roomname"><strong>{room}</strong><small>Study room · {room[0]}</small></div>
        {days.map(day=>{const b=occupied(room,day);const mine=b?.owner==='you';return <button key={room+day} title={`${room}, ${day}: ${mine?'Your booking, select to modify':b?'Reserved':'Available'}`} aria-label={`${room}, ${day}: ${mine?'Your booking, select to modify':b?'Reserved':'Available'}`} className={'slot '+(mine?'own-booking':b?'taken':'available')} disabled={Boolean(b&&!mine)} onClick={()=>mine?edit(b):pick(room,day)}><span>{b?'Booked':'Open'}</span>{b&&<small>{mine?'Your booking':'Reserved'}</small>}</button>})}
       </React.Fragment>)}
      </div>
     </div>
     <p className="calendar-note">A day marked Open is only a starting point; the full date range is checked before you reserve. Bookings include the start date and exclude the end date.</p>
     <section id="my-reservations" className="reservations">
      <div className="reservations-head"><h2>Your bookings</h2><span>{myBookings.length} current records</span></div>
      <div className="reservations-list">{myBookings.map(b=><article key={b.id} className="reservation">
       <button className="reservation-select" aria-label={`Edit booking for room ${b.roomNumber}, ${human(b.startDate)} to ${human(addDays(b.endDate,-1))}`} onClick={()=>edit(b)}>
        <div className="room-chip">{b.roomNumber}</div>
        <div className="reservation-body"><strong>{human(b.startDate)} – {human(addDays(b.endDate,-1))}</strong><small>{Math.round((Date.parse(`${b.endDate}T00:00:00Z`)-Date.parse(`${b.startDate}T00:00:00Z`))/86400000)} days · {b.purpose||'No purpose entered'}</small></div>
       </button>
      </article>)}{myBookings.length===0&&<p>No reservations.</p>}</div>
     </section>
    </section>
    <aside className="booking-pane" id="booking-form">
     <div className="panel-tag"><span>BOOK A ROOM</span><span>FORM 01</span></div>
     <h2>{editing?'Change reservation':'Make a reservation'}</h2>
     <p className="booking-description">Use this panel to request a room for your study group, meeting or activity.</p>
     {notice&&<div className="success" role="status">{notice}</div>}{error&&<div className="error" role="alert">{error}</div>}
     <form onSubmit={submit}>
      <label><span>Room number</span><input list="rooms" required placeholder="e.g., B2-104" value={form.roomNumber} onChange={e=>changeField('roomNumber',e.target.value)}/><datalist id="rooms">{availableRooms.map(room=><option key={room} value={room}/>)}</datalist><small className="field-note">{hasValidDateRange?`${availableRooms.length} room${availableRooms.length===1?'':'s'} available for the full date range. Enter a room from the list.`:'Choose a suggested room or type a room number.'}</small></label>
      <div className="date-pair">
       <label><span>Start date</span><input type="date" required value={form.startDate} onChange={e=>changeField('startDate',e.target.value)}/></label>
       <label><span>End date <span className="exclusive-label">(not included)</span></span><input type="date" required min={form.startDate?addDays(form.startDate,1):undefined} value={form.endDate} onChange={e=>changeField('endDate',e.target.value)}/></label>
      </div>
      <label><span>Purpose / optional</span><textarea rows="4" placeholder="Meeting, group study..." value={form.purpose} onChange={e=>changeField('purpose',e.target.value)}/></label>
      <p className="helper">Your start date is reserved; the room becomes available again on the end date. Choose a valid date range with no overlapping booking.</p>
      <button className="availability-check" type="button" onClick={check}>Check availability</button>
      <button className="reserve-button" type="submit">{editing?'Save booking':'Confirm booking'}</button>
      {editingBooking&&<button className="cancel-edit" type="button" onClick={()=>{setEditing(null);setForm({...formEmpty});setError('');setNotice('');}}>Stop editing</button>}
     </form>
     <div className="right-foot"><span>✦</span> Select an open day in the calendar to prefill a one-day reservation.</div>
    </aside>
   </div>
  </main>
  <footer>ROOMGRID / Academic campus demo — local browser data only.</footer>
 </div>;
}
