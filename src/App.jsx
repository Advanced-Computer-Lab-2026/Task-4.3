import React,{useEffect,useMemo,useState} from 'react';
import BookingForm from './components/BookingForm.jsx';
import MyBookings from './components/MyBookings.jsx';
import RoomCalendar from './components/RoomCalendar.jsx';
import RoomFinder from './components/RoomFinder.jsx';
import {addDays,daysBetween,findFreeRooms,human,mondayOf,normalizeRoom,validateBooking,validateDates} from './booking.js';
import {DEMO_WEEK,STORAGE,read,rooms,seed} from './data.js';

const formEmpty={roomNumber:'',startDate:'',endDate:'',purpose:''};
const searchEmpty={startDate:'',endDate:''};
const FORM_TITLE='booking-form-title';
const fieldIds={roomNumber:'room-number',startDate:'start-date',endDate:'end-date',dates:'start-date'};

export default function App(){
  const [bookings,setBookings]=useState(read);
  const [week,setWeek]=useState(DEMO_WEEK);
  const [view,setView]=useState('All rooms');
  const [form,setForm]=useState({...formEmpty});
  const [editing,setEditing]=useState(null);
  const [errors,setErrors]=useState({});
  const [notice,setNotice]=useState('');
  const [tab,setTab]=useState('Availability');
  const [search,setSearch]=useState({...searchEmpty});
  const [searchErrors,setSearchErrors]=useState({});
  const [applied,setApplied]=useState(null);
  const [focusTarget,setFocusTarget]=useState(null);

  useEffect(()=>localStorage.setItem(STORAGE,JSON.stringify(bookings)),[bookings]);
  // Runs after render so screen readers hear the updated field state, and so the form is on screen on phones.
  useEffect(()=>{
    if(!focusTarget)return;
    const el=document.getElementById(focusTarget.id);
    if(!el)return;
    el.focus({preventScroll:true});
    const stacked=matchMedia('(max-width:1099px)').matches;
    const calm=matchMedia('(prefers-reduced-motion:reduce)').matches;
    const block=!stacked?'nearest':el.tagName==='H2'?'start':'center';
    el.scrollIntoView({behavior:calm?'auto':'smooth',block});
  },[focusTarget]);

  const days=useMemo(()=>Array.from({length:7},(_,i)=>addDays(week,i)),[week]);
  const myBookings=bookings.filter(b=>b.owner==='you').sort((a,b)=>a.startDate.localeCompare(b.startDate));
  const editingBooking=bookings.find(b=>b.id===editing)||null;
  const roomList=view==='All rooms'?rooms:rooms.filter(r=>r===view);
  const freeRooms=applied?findFreeRooms(bookings,applied.startDate,applied.endDate,editing):null;
  // A new object each time, so asking for the same element twice still moves focus.
  const focusOn=id=>setFocusTarget({id});

  function revealForm(){focusOn(FORM_TITLE);}
  function showErrors(next){setErrors(next);focusOn(fieldIds[['roomNumber','startDate','endDate','dates'].find(k=>next[k])]);}

  function change(field,value){
    setForm(f=>({...f,[field]:value}));
    setNotice('');
    setErrors(({dates,...rest})=>{
      const next={...rest};
      if(field==='roomNumber')delete next.roomNumber;
      if(field==='startDate'||field==='endDate'){delete next.startDate;delete next.endDate;}
      return next;
    });
  }
  function clearMessages(){setErrors({});setNotice('');}

  function openDay(room,date){
    // While editing, the calendar moves the booking: keep its purpose and length instead of starting a new one.
    const span=editingBooking?daysBetween(form.startDate||editingBooking.startDate,form.endDate||editingBooking.endDate):1;
    setForm(f=>({...f,roomNumber:room,startDate:date,endDate:addDays(date,Math.max(span,1))}));
    clearMessages();
    revealForm();
  }
  function chooseRoom(room){
    setForm(f=>({...f,roomNumber:room,startDate:applied.startDate,endDate:applied.endDate}));
    clearMessages();
    revealForm();
  }
  function edit(row){
    if(row.owner!=='you')return;
    setEditing(row.id);
    setForm({roomNumber:row.roomNumber,startDate:row.startDate,endDate:row.endDate,purpose:row.purpose});
    setTab('Availability');
    setView('All rooms');
    setWeek(mondayOf(row.startDate));
    clearMessages();
    revealForm();
  }
  function cancelEdit(){setEditing(null);setForm({...formEmpty});clearMessages();revealForm();}

  function submit(e){
    e.preventDefault();
    setNotice('');
    const next=validateBooking(form,bookings,editing);
    if(Object.keys(next).length){showErrors(next);return;}
    const payload={roomNumber:normalizeRoom(form.roomNumber),startDate:form.startDate,endDate:form.endDate,purpose:form.purpose.trim(),owner:'you'};
    const summary=`${payload.roomNumber}, ${human(payload.startDate)} until ${human(payload.endDate)}.`;
    if(editing){setBookings(bookings.map(b=>b.id===editing&&b.owner==='you'?{...b,...payload}:b));setNotice(`Booking updated: ${summary}`);}
    else{setBookings([...bookings,{...payload,id:'b-'+Date.now()}]);setNotice(`Room reserved: ${summary}`);}
    setWeek(mondayOf(payload.startDate));
    setForm({...formEmpty});
    setEditing(null);
    setErrors({});
    revealForm();
  }
  function check(){
    setNotice('');
    const next=validateBooking(form,bookings,editing);
    if(Object.keys(next).length){showErrors(next);return;}
    setErrors({});
    setNotice(`${normalizeRoom(form.roomNumber)} is free from ${human(form.startDate)} until ${human(form.endDate)}. Nothing is booked until you confirm.`);
  }
  function reset(){
    setBookings(seed);
    setForm({...formEmpty});
    setEditing(null);
    setWeek(DEMO_WEEK);
    setView('All rooms');
    setErrors({});
    clearSearch();
    setTab('Availability');
    setNotice('Example bookings restored.');
  }

  function changeSearch(field,value){setSearch(s=>({...s,[field]:value}));setSearchErrors({});setApplied(null);}
  function clearSearch(){setSearch({...searchEmpty});setSearchErrors({});setApplied(null);}
  function runSearch(startDate,endDate){
    const next=validateDates(startDate,endDate);
    setSearchErrors(next);
    if(Object.keys(next).length){setApplied(null);focusOn(next.startDate?'find-start':'find-end');return;}
    setApplied({startDate,endDate});
    setView('All rooms');
    setWeek(mondayOf(startDate));
  }
  function submitSearch(e){e.preventDefault();runSearch(search.startDate,search.endDate);}
  function showFreeRooms(){
    setSearch({startDate:form.startDate,endDate:form.endDate});
    setTab('Availability');
    runSearch(form.startDate,form.endDate);
    focusOn('finder-title');
  }

  const navButton=(name,label=name)=><button type="button" className={tab===name?'selected':''} aria-current={tab===name?'page':undefined} onClick={()=>setTab(name)}>{label}</button>;

  return <div className="room-app">
    <a className="skip-link" href={`#${FORM_TITLE}`}>Skip to booking form</a>
    <header className="topbar">
      <div className="mark"><span className="mark-sq" aria-hidden="true">R</span><span><strong>room<span>grid</span></strong><small>Campus spaces</small></span></div>
      <nav aria-label="Main">{navButton('Availability')}{navButton('My bookings',`My bookings (${myBookings.length})`)}</nav>
      <div className="member"><button type="button" className="reset" onClick={reset}>Reset demo</button><div className="profile" role="img" aria-label="Signed in as You">YOU</div></div>
    </header>
    <main>
      <div className="intro">
        <div><h1>{tab==='Availability'?'Find room availability':'Manage your bookings'}</h1><p className="muted">{tab==='Availability'?'Search your dates, compare rooms, then book.':'Change the dates, room or purpose of your own reservations.'}</p></div>
        <dl className="intro-summary"><div><dt>Rooms</dt><dd>{rooms.length}</dd></div><div><dt>Reservations</dt><dd>{bookings.length}</dd></div></dl>
      </div>
      <div className="pagegrid">
        <div className="main-pane">
          {tab==='Availability'?<>
            <RoomFinder search={search} errors={searchErrors} applied={applied} freeRooms={freeRooms||[]} total={rooms.length} editing={editing} onChange={changeSearch} onSearch={submitSearch} onClear={clearSearch} onChoose={chooseRoom}/>
            <RoomCalendar days={days} roomList={roomList} bookings={bookings} form={form} view={view} freeRooms={freeRooms} onView={setView} onWeek={n=>setWeek(addDays(week,n))} onOpenDay={openDay} onOwnBooking={edit}/>
          </>:<MyBookings bookings={myBookings} onEdit={edit} onFindRoom={()=>setTab('Availability')}/>}
        </div>
        <BookingForm form={form} errors={errors} notice={notice} editingBooking={editingBooking} onChange={change} onSubmit={submit} onCheck={check} onCancel={cancelEdit} onShowFreeRooms={showFreeRooms}/>
      </div>
    </main>
    <footer>ROOMGRID / Academic campus demo — local browser data only.</footer>
  </div>;
}
