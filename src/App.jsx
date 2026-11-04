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
function validate(form,bookings,id){
 const fields={};
 if(!form.roomNumber.trim())fields.roomNumber='Choose a room.';
 if(!form.startDate)fields.startDate='Choose a start date.';
 if(!form.endDate)fields.endDate='Choose an end date.';
 if(form.startDate&&form.endDate&&form.endDate<=form.startDate)fields.endDate='End date must be after the start date.';
 const conflict=!Object.keys(fields).length&&bookings.find(b=>b.id!==id&&b.roomNumber.toLowerCase()===form.roomNumber.trim().toLowerCase()&&form.startDate<b.endDate&&form.endDate>b.startDate);
 if(conflict)fields.form=`${conflict.roomNumber} is reserved from ${human(conflict.startDate)} until ${human(conflict.endDate)}. Choose different dates or another room.`;
 return fields;
}
export default function App(){
 const [bookings,setBookings]=useState(read);
 const [week,setWeek]=useState('2026-11-09');
 const [view,setView]=useState('All rooms');
 const [form,setForm]=useState({...formEmpty});
 const [editing,setEditing]=useState(null);
 const [error,setError]=useState('');
 const [notice,setNotice]=useState('');
 const [tab,setTab]=useState('Make a reservation');
 const [navMessage,setNavMessage]=useState('');
 const [submitted,setSubmitted]=useState(false);
 const [availabilityChecked,setAvailabilityChecked]=useState(false);
 const formHeadingRef=useRef(null);
 const bookingsHeadingRef=useRef(null);
 const submittingRef=useRef(false);
 useEffect(()=>localStorage.setItem(STORAGE,JSON.stringify(bookings)),[bookings]);
 const days=useMemo(()=>Array.from({length:7},(_,i)=>addDays(week,i)),[week]);
 const myBookings=bookings.filter(b=>b.owner==='you').sort((a,b)=>a.startDate.localeCompare(b.startDate));
 const roomList=view==='All rooms'?rooms:rooms.filter(r=>r===view);
 const occupied=(room,date)=>bookings.find(b=>b.roomNumber===room&&date>=b.startDate&&date<b.endDate);
 const validation=useMemo(()=>validate(form,bookings,editing),[form,bookings,editing]);
 const selectionReady=form.roomNumber&&form.startDate&&form.endDate;
 function focusForm(){requestAnimationFrame(()=>{document.getElementById('booking-form')?.scrollIntoView({behavior:'smooth',block:'start'});formHeadingRef.current?.focus({preventScroll:true});});}
 function updateField(field,value){setForm(current=>({...current,[field]:value}));if(field!=='purpose'){setAvailabilityChecked(false);setSubmitted(false);setError('');setNotice('');}}
 function pick(room,date){setTab('Make a reservation');setNavMessage('');setForm({roomNumber:room,startDate:date,endDate:addDays(date,1),purpose:''});setEditing(null);setAvailabilityChecked(false);setSubmitted(false);setError('');setNotice(`${room} selected for ${human(date)}. Check availability to continue.`);focusForm();}
 function edit(row){if(row.owner!=='you')return;setTab('Change reservation');setNavMessage('');setEditing(row.id);setForm({roomNumber:row.roomNumber,startDate:row.startDate,endDate:row.endDate,purpose:row.purpose});setAvailabilityChecked(false);setSubmitted(false);setError('');setNotice(`Editing your ${row.roomNumber} booking. Check availability before saving changes.`);focusForm();}
 function submit(e){e.preventDefault();if(submittingRef.current)return;setSubmitted(true);setNotice('');if(Object.keys(validation).length){setAvailabilityChecked(false);setError(validation.form||'Please correct the highlighted fields, then try again.');return;}if(!availabilityChecked){setError('Check availability before confirming this booking.');return;}submittingRef.current=true;const payload={roomNumber:form.roomNumber.trim(),startDate:form.startDate,endDate:form.endDate,purpose:form.purpose.trim(),owner:'you'};
 if(editing){setBookings(current=>current.map(b=>b.id===editing?{...b,...payload}:b));setNotice(`Booking updated for ${payload.roomNumber}, ${human(payload.startDate)}–${human(payload.endDate)}.`);setTab('My reservations');setNavMessage('Your reservations are highlighted in the schedule.');}else{setBookings(current=>[...current,{...payload,id:'b-'+Date.now()}]);setNotice(`Room ${payload.roomNumber} reserved for ${human(payload.startDate)}–${human(payload.endDate)}.`);}setForm({...formEmpty});setEditing(null);setAvailabilityChecked(false);setSubmitted(false);setError('');submittingRef.current=false;}
 function reset(){if(!window.confirm('Reset all changes and restore the original example bookings?'))return;setBookings(seed);setForm({...formEmpty});setEditing(null);setAvailabilityChecked(false);setSubmitted(false);setWeek('2026-11-09');setNotice('Example bookings restored.');setNavMessage('');setError('');setView('All rooms');setTab('Make a reservation');focusForm();}
 function check(){setSubmitted(true);setNotice('');if(Object.keys(validation).length){setAvailabilityChecked(false);setError(validation.form||'Complete the highlighted fields to check availability.');}else{setAvailabilityChecked(true);setError('');setNotice('Room is available. You can now confirm this booking.');}}
 function clearDraft(){setForm({...formEmpty});setEditing(null);setAvailabilityChecked(false);setSubmitted(false);setError('');}
 function activateCreate(){clearDraft();setTab('Make a reservation');setNavMessage('');setNotice('Create mode ready. Choose a room and dates to begin.');focusForm();}
 function activateChange(){setTab('Change reservation');if(editing){setNavMessage('');focusForm();return;}setNavMessage('Choose Change reservation on one of your bookings below.');setNotice('');requestAnimationFrame(()=>{document.getElementById('my-reservations')?.scrollIntoView({behavior:'smooth',block:'start'});bookingsHeadingRef.current?.focus({preventScroll:true});});}
 function activateMyReservations(){setTab('My reservations');setNavMessage('Your reservations are highlighted in the schedule.');requestAnimationFrame(()=>{document.getElementById('availability-schedule')?.scrollIntoView({behavior:'smooth',block:'start'});document.getElementById('schedule-heading')?.focus({preventScroll:true});});}
 function jumpToReservations(){document.getElementById('my-reservations')?.scrollIntoView({behavior:'smooth',block:'start'});requestAnimationFrame(()=>bookingsHeadingRef.current?.focus({preventScroll:true}));}
 function cancelEditing(){setEditing(null);setForm({...formEmpty});setAvailabilityChecked(false);setSubmitted(false);setError('');setTab('Make a reservation');setNavMessage('');setNotice('Editing cancelled. No changes were saved.');focusForm();}
 const editingBooking=editing?bookings.find(b=>b.id===editing):null;
 function bookingPanel(){return <section className={`booking-pane form-section ${editing?'edit-mode':'create-mode'}`} id="booking-form" aria-labelledby="booking-heading"><div className="mode-header"><div className="panel-tag"><span>{editing?'EDIT RESERVATION':'NEW RESERVATION'}</span><span>{editing?'EDIT MODE':'CREATE MODE'}</span></div><h2 id="booking-heading" ref={formHeadingRef} tabIndex="-1">{editing?'Change reservation':'Make a reservation'}</h2><p className="booking-description">{editing?'Adjust the room, dates or purpose, then check availability before saving.':'Choose a room and enter the dates you need. Check the complete range before confirming your reservation.'}</p>{editingBooking&&<p className="editing-context">Editing your <strong>{editingBooking.roomNumber}</strong> reservation for <strong>{human(editingBooking.startDate)} – {human(editingBooking.endDate)}</strong>.</p>}</div>{notice&&<div className="success" role="status">{notice}</div>}{error&&<div className="error" role="alert">{error}</div>}<form onSubmit={submit} noValidate>
    <label><span>Room number <b aria-hidden="true">*</b></span><input list="rooms" placeholder="e.g., B2-104" value={form.roomNumber} aria-invalid={submitted&&Boolean(validation.roomNumber)} aria-describedby={submitted&&validation.roomNumber?'room-error':undefined} onChange={e=>updateField('roomNumber',e.target.value)}/><datalist id="rooms">{rooms.map(r=><option key={r} value={r}/>)}</datalist>{submitted&&validation.roomNumber&&<small className="field-error" id="room-error">{validation.roomNumber}</small>}</label>
    <label><span>Start date <b aria-hidden="true">*</b></span><input type="date" value={form.startDate} aria-invalid={submitted&&Boolean(validation.startDate)} aria-describedby={submitted&&validation.startDate?'start-error':undefined} onChange={e=>updateField('startDate',e.target.value)}/>{submitted&&validation.startDate&&<small className="field-error" id="start-error">{validation.startDate}</small>}</label>
    <label><span>End date <b aria-hidden="true">*</b></span><input type="date" min={form.startDate?addDays(form.startDate,1):undefined} value={form.endDate} aria-invalid={submitted&&Boolean(validation.endDate)} aria-describedby={submitted&&validation.endDate?'end-error':undefined} onChange={e=>updateField('endDate',e.target.value)}/>{submitted&&validation.endDate&&<small className="field-error" id="end-error">{validation.endDate}</small>}</label>
    <label><span>Purpose <em>Optional</em></span><textarea rows="4" placeholder="Meeting, group study..." value={form.purpose} onChange={e=>updateField('purpose',e.target.value)}/></label>
    <div className={'range-status '+(selectionReady?(Object.keys(validation).length?'range-conflict':availabilityChecked?'range-open':'range-ready'):'')} aria-live="polite"><strong>{!selectionReady?'Complete the room and dates to check the full range.':Object.keys(validation).length?'Range needs attention':availabilityChecked?'Room is available':'Ready to check availability'}</strong>{selectionReady&&<span>{validation.form||validation.endDate||(availabilityChecked?'You can now confirm this booking.':`${human(form.startDate)} to ${human(form.endDate)} · check before confirming`)}</span>}</div>
    <p className="helper">Required fields are marked *. Reservations cannot overlap an existing booking for the same room.</p><div className="form-actions"><button className="availability-check" type="button" onClick={check}>Check availability</button><button className="reserve-button" type="submit" disabled={!availabilityChecked}>{editing?'Save changes':'Confirm booking'}</button>{editing&&<button className="cancel-edit" type="button" onClick={cancelEditing}>Cancel editing</button>}</div></form><div className="right-foot"><span>✦</span> {editing?'Check the updated range, then save your changes.':'Select a green day, check the full range, then confirm your booking.'}</div></section>}
 return <div className="room-app"><header className="topbar"><div className="mark"><span className="mark-sq">R</span><span><strong>room<span>grid</span></strong><small>Campus spaces</small></span></div><nav aria-label="Primary navigation"><button className="selected" aria-current="page" onClick={()=>document.getElementById('availability-heading')?.focus()}>Availability</button><button className="reset-button" onClick={reset}>Reset demo</button></nav><div className="member"><span>Student dashboard</span><div className="profile" aria-label="Signed in as You">YOU</div></div></header>
  <main><section className="availability-view" aria-labelledby="availability-heading"><section className="intro"><div><span className="eyebrow">SPACES / RESERVATIONS</span><h1 id="availability-heading" tabIndex="-1">Find room availability</h1><p>Choose a room, reserve an available range and manage your reservations on one page.</p></div><div className="intro-summary"><span>ROOMS IN DIRECTORY</span><strong>{rooms.length.toString().padStart(2,'0')}</strong><span>CURRENT RESERVATIONS</span><strong>{bookings.length.toString().padStart(2,'0')}</strong></div></section>
   <nav className="internal-nav" aria-label="Availability page sections"><button aria-pressed={tab==='Make a reservation'} onClick={activateCreate}>Make a reservation</button><button aria-pressed={tab==='Change reservation'} onClick={activateChange}>Change reservation</button><button aria-pressed={tab==='My reservations'} onClick={activateMyReservations}>My reservations</button></nav>{navMessage&&<div className={`internal-status ${tab==='My reservations'?'highlight-status':''}`} role="status"><span>{navMessage}</span>{tab==='My reservations'&&<button type="button" onClick={jumpToReservations}>View written My reservations</button>}</div>}
   {bookingPanel()}
   <section className={`calendar-pane schedule-section ${tab==='My reservations'?'schedule-highlight-mine':''}`} id="availability-schedule" aria-labelledby="schedule-heading"><div className="calendar-head"><div><span className="eyebrow">AVAILABILITY SCHEDULE</span><h2 id="schedule-heading" tabIndex="-1">Rooms by day</h2></div><div className="weeknav"><button aria-label="Previous week" onClick={()=>setWeek(addDays(week,-7))}>←</button><strong>{human(week)} – {human(addDays(week,6))}</strong><button aria-label="Next week" onClick={()=>setWeek(addDays(week,7))}>→</button></div></div>
    <div className="calendar-controls"><label>Show room <select value={view} onChange={e=>setView(e.target.value)}><option>All rooms</option>{rooms.map(r=><option key={r}>{r}</option>)}</select></label><span className="legend"><i className="free"/> Available</span><span className="legend"><i className="booked"/> Reserved</span><span className="legend"><i className="yours"/> Your booking</span><span className="legend"><i className="chosen">✓</i> Selected</span><p>Select an available day to start a one-day reservation.</p></div>
    <div className="calendar-scroll" tabIndex="0" aria-label="Room availability calendar; scroll horizontally to see all dates"><div className="room-cal"><div className="corner">ROOM / DATE</div>{days.map(d=><div className="dayhead" key={d}><strong>{weekDay(d)}</strong><span>{human(d)}</span></div>)}{roomList.map(room=><React.Fragment key={room}><div className="roomname"><strong>{room}</strong><small>Study room · {room[0]}</small></div>{days.map(day=>{const b=occupied(room,day);const selected=!b&&form.roomNumber===room&&form.startDate===day;const selectedBooking=b?.owner==='you'&&editing===b.id;const state=b?(b.owner==='you'?'personal':'reserved'):(selected?'slot-selected':'available');const label=selectedBooking?`${room} on ${human(day)} is your selected reservation`:b?(b.owner==='you'?`${room} on ${human(day)} is your booking`:`${room} is reserved on ${human(day)} by another user`):(selected?`${room} on ${human(day)} is selected`:`${room} is available on ${human(day)}; select this date`);return <button key={room+day} aria-label={label} aria-pressed={b?undefined:selected} title={label} className={`slot ${state} ${selectedBooking?'booking-selected':''}`} disabled={Boolean(b)} onClick={()=>pick(room,day)}>{selectedBooking?<><span>✓ Your booking</span><small>Selected to edit</small></>:b?.owner==='you'?<><span>Your booking</span><small>{tab==='My reservations'?'★ Highlighted':'Booked'}</small></>:b?<><span>Booked</span><small>Reserved</small></>:selected?<><span><b aria-hidden="true">✓</b> Selected</span><small>Review dates</small></>:<><span>Available</span><small>Select</small></>}</button>})}</React.Fragment>)}</div></div>
    <p className="calendar-note">Cells show individual dates. Reservations may span several dates; review the full-range status before confirming.</p></section>
   <section id="my-reservations" className="reservations written-reservations" aria-labelledby="my-bookings-heading"><div className="reservations-head"><div><span className="eyebrow">YOUR RESERVATIONS</span><h2 id="my-bookings-heading" ref={bookingsHeadingRef} tabIndex="-1">My reservations</h2><p>Only your reservations are listed here and available to edit. Other students’ bookings remain protected.</p></div><span>{myBookings.length} current {myBookings.length===1?'reservation':'reservations'}</span></div><div className="reservations-list">{myBookings.map(b=><article key={b.id} className={`reservation-card ${editing===b.id?'is-selected':''}`}><div className="booking-field room-field"><span className="field-label">Room</span><strong className="room-badge">{b.roomNumber}</strong></div><div className="booking-field dates-field"><span className="field-label">Dates</span><strong>{human(b.startDate)} – {human(b.endDate)}</strong></div><div className="booking-field purpose-field"><span className="field-label">Purpose</span><span>{b.purpose||'No purpose provided.'}</span></div><button className="change-reservation" aria-label={`Change reservation for ${b.roomNumber} from ${human(b.startDate)} to ${human(b.endDate)}`} onClick={()=>edit(b)}>Change reservation</button></article>)}{myBookings.length===0&&<p className="empty-bookings">No reservations yet. Use the form above to reserve a room.</p>}</div></section></section></main><footer>ROOMGRID / Academic campus demo — local browser data only.</footer>
 </div>;
}
