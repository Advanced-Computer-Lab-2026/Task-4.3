import React,{useEffect,useMemo,useState} from 'react';
import Navbar from './components/Navbar';
import AvailabilityView from './components/AvailabilityView';
import MyBookingsView from './components/MyBookingsView';
import ReservationView from './components/ReservationView';
import ProfileView from './components/ProfileView';

const STORAGE='acl-roomgrid-18rooms-v1';
const rooms=['A1-203', 'A2-106', 'A2-107', 'A3-208', 'A3-209', 'B1-205', 'B1-206', 'B1-207', 'B2-104', 'B2-105', 'B3-301', 'C1-102', 'C1-103', 'C2-201', 'C2-202', 'C3-101', 'C3-102', 'D1-101'];
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
  const [currentPage,setCurrentPage]=useState('availability');

  useEffect(()=>localStorage.setItem(STORAGE,JSON.stringify(bookings)),[bookings]);

  function pick(room,date){
    setForm({roomNumber:room,startDate:date,endDate:addDays(date,1),purpose:''});
    setEditing(null);
    setError('');
    setCurrentPage('reserve');
  }

  function edit(row){
    if(row.owner!=='you')return;
    setEditing(row.id);
    setForm({roomNumber:row.roomNumber,startDate:row.startDate,endDate:row.endDate,purpose:row.purpose});
    setError('');
    setNotice('');
    setCurrentPage('reserve');
  }

  function submit(e){
    e.preventDefault();
    setNotice('');
    const err=issue(form,bookings,editing);
    if(err){
      setError('Reservation failed. Review the selected dates.');
      return;
    }
    const payload={roomNumber:form.roomNumber.trim(),startDate:form.startDate,endDate:form.endDate,purpose:form.purpose.trim(),owner:'you'};
    if(editing){
      setBookings(bookings.map(b=>b.id===editing?{...b,...payload}:b));
      setNotice('Booking updated.');
    }else{
      setBookings([...bookings,{...payload,id:'b-'+Date.now()}]);
      setNotice('Room reserved.');
    }
    setForm({...formEmpty});
    setEditing(null);
    setError('');
    // Redirect to bookings after a short delay or immediately
    setTimeout(() => setCurrentPage('my-bookings'), 1500);
  }

  function check(){
    setNotice('');
    setError('');
    let e=issue(form,bookings,editing);
    if(e){
      setError(e);
    }else setNotice('No conflict detected for the selected dates.');
  }

  function reset(){
    setBookings(seed);
    setForm({...formEmpty});
    setEditing(null);
    setWeek('2026-11-09');
    setView('All rooms');
    setCurrentPage('availability');
    setNotice('Example bookings restored.');
    setError('');
  }

  return (
    <div className="room-app">
      <Navbar currentPage={currentPage} setCurrentPage={setCurrentPage} />
      <main>
        <div className="page-container">
          {currentPage === 'availability' && (
            <div className="view-wrapper">
              <section className="intro">
                <div>
                  <span className="eyebrow">SPACES / RESERVATIONS</span>
                  <h1>Find room availability</h1>
                  <p>Review campus rooms, dates and existing reservations in one view.</p>
                </div>
                <div className="intro-summary">
                  <span>ROOMS IN DIRECTORY</span>
                  <strong>{rooms.length.toString().padStart(2,'0')}</strong>
                  <span>CURRENT RESERVATIONS</span>
                  <strong>{bookings.length.toString().padStart(2,'0')}</strong>
                </div>
              </section>
              <AvailabilityView
                rooms={rooms}
                bookings={bookings}
                week={week}
                setWeek={setWeek}
                view={view}
                setView={setView}
                onPick={pick}
              />
            </div>
          )}
          {currentPage === 'my-bookings' && (
            <div className="view-wrapper">
               <section className="intro">
                <div>
                  <span className="eyebrow">MY RESERVATIONS</span>
                  <h1>Your Bookings</h1>
                  <p>Manage and edit your reserved campus spaces.</p>
                </div>
              </section>
              <MyBookingsView
                bookings={bookings}
                onEdit={edit}
              />
            </div>
          )}
          {currentPage === 'reserve' && (
            <div className="view-wrapper">
               <section className="intro">
                <div>
                  <span className="eyebrow">MAKE A RESERVATION</span>
                  <span className="eyebrow" style={{marginLeft: '10px'}}>FORM 01</span>
                  <h1>{editing ? 'Update Reservation' : 'Book a Space'}</h1>
                  <p>Enter the details below to request a room for your study group or meeting.</p>
                </div>
              </section>
              <ReservationView
                form={form}
                setForm={setForm}
                editing={editing}
                rooms={rooms}
                error={error}
                setError={setError}
                notice={notice}
                setNotice={setNotice}
                onSubmit={submit}
                onCheck={check}
                onCancel={() => {
                  setEditing(null);
                  setForm({...formEmpty});
                  setError('');
                  setCurrentPage('availability');
                }}
              />
            </div>
          )}
          {currentPage === 'profile' && (
            <div className="view-wrapper">
              <ProfileView bookings={bookings} />
            </div>
          )}
        </div>
      </main>
      <footer>ROOMGRID / Academic campus demo — local browser data only.</footer>
    </div>
  );
}
