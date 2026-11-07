import React, { useEffect, useMemo, useState } from 'react';

const STORAGE = 'acl-roomgrid-18rooms-v1';
const rooms = ['A1-203', 'A2-106', 'A2-107', 'A3-208', 'A3-209', 'B1-205', 'B1-206', 'B1-207', 'B2-104', 'B2-105', 'B3-301', 'C1-102', 'C1-103', 'C2-201', 'C2-202', 'C3-101', 'C3-102', 'D1-101'];
const sampleRows = [
  ['A1-203', '2026-11-09', '2026-11-11', 'Peer tutoring', 'other'], ['A1-203', '2026-11-13', '2026-11-15', 'Architecture workshop', 'other'], ['A1-203', '2026-11-17', '2026-11-19', 'Group assignment', 'you'],
  ['A2-106', '2026-11-10', '2026-11-13', 'Seminar preparation', 'other'], ['A2-106', '2026-11-16', '2026-11-19', 'Study circle', 'other'], ['A2-107', '2026-11-09', '2026-11-10', 'Student club planning', 'you'], ['A2-107', '2026-11-12', '2026-11-15', 'Project demo rehearsal', 'other'], ['A2-107', '2026-11-16', '2026-11-19', 'Study meeting', 'other'],
  ['A3-208', '2026-11-11', '2026-11-14', 'Presentation practice', 'other'], ['A3-208', '2026-11-16', '2026-11-18', 'Tutorial group', 'other'], ['A3-209', '2026-11-10', '2026-11-12', 'Study session', 'other'],
  ['B1-205', '2026-11-09', '2026-11-11', 'Meeting', 'other'], ['B1-205', '2026-11-13', '2026-11-15', 'Team discussion', 'other'], ['B1-205', '2026-11-16', '2026-11-18', 'Course project', 'other'], ['B1-206', '2026-11-11', '2026-11-13', 'Exam revision', 'other'], ['B1-206', '2026-11-17', '2026-11-20', 'Debate practice', 'you'], ['B1-207', '2026-11-10', '2026-11-12', 'Group study', 'you'], ['B1-207', '2026-11-16', '2026-11-19', 'Engineering project', 'other'],
  ['B2-104', '2026-11-09', '2026-11-11', 'Weekly study group', 'you'], ['B2-104', '2026-11-13', '2026-11-15', 'Team planning', 'other'], ['B2-104', '2026-11-17', '2026-11-19', 'Workshop preparation', 'other'], ['B2-105', '2026-11-12', '2026-11-15', 'Club meeting', 'other'], ['B2-105', '2026-11-16', '2026-11-18', 'Student committee', 'other'], ['B3-301', '2026-11-09', '2026-11-10', 'Debate practice', 'other'], ['B3-301', '2026-11-11', '2026-11-13', 'Group preparation', 'other'], ['B3-301', '2026-11-18', '2026-11-20', 'Portfolio review', 'other'],
  ['C1-102', '2026-11-10', '2026-11-14', 'Capstone meeting', 'other'], ['C1-102', '2026-11-16', '2026-11-19', 'Revision session', 'other'], ['C1-103', '2026-11-09', '2026-11-12', 'Group project', 'other'], ['C1-103', '2026-11-14', '2026-11-16', 'Student society', 'you'], ['C2-201', '2026-11-12', '2026-11-15', 'Project sprint', 'other'], ['C2-201', '2026-11-16', '2026-11-19', 'Robotics club', 'other'], ['C2-202', '2026-11-09', '2026-11-11', 'Lab preparation', 'other'], ['C2-202', '2026-11-18', '2026-11-20', 'Teaching assistant session', 'other'], ['C3-101', '2026-11-12', '2026-11-14', 'Presentation rehearsal', 'you'], ['C3-101', '2026-11-14', '2026-11-16', 'Design workshop', 'other'], ['C3-101', '2026-11-18', '2026-11-20', 'Study group', 'other'], ['C3-102', '2026-11-11', '2026-11-15', 'Research meeting', 'other'], ['D1-101', '2026-11-10', '2026-11-13', 'Team check-in', 'other'], ['D1-101', '2026-11-16', '2026-11-18', 'Group assignment', 'you'],
];
const seed = sampleRows.map(([roomNumber, startDate, endDate, purpose, owner], index) => ({ id: `demo-${index + 1}`, roomNumber, startDate, endDate, purpose, owner }));
const emptyForm = { roomNumber: '', startDate: '', endDate: '', purpose: '' };
function read() { try { const saved = JSON.parse(localStorage.getItem(STORAGE)); return Array.isArray(saved) ? saved : seed; } catch { return seed; } }
function addDays(iso, days) { const date = new Date(`${iso}T12:00:00Z`); date.setUTCDate(date.getUTCDate() + days); return date.toISOString().slice(0, 10); }
function human(iso, year = false) { return new Date(`${iso}T12:00:00Z`).toLocaleDateString('en-GB', { timeZone: 'UTC', day: 'numeric', month: 'short', ...(year ? { year: 'numeric' } : {}) }); }
function weekDay(iso) { return new Date(`${iso}T12:00:00Z`).toLocaleDateString('en-GB', { timeZone: 'UTC', weekday: 'short' }); }
function issue(form, bookings, id) {
  if (!form.roomNumber.trim() || !form.startDate || !form.endDate) return 'Complete the room and both dates.';
  if (form.endDate <= form.startDate) return 'End date must follow start date.';
  if (bookings.some(b => b.id !== id && b.roomNumber.toLowerCase() === form.roomNumber.trim().toLowerCase() && form.startDate < b.endDate && form.endDate > b.startDate)) return 'This room is already booked for some of those dates.';
  return '';
}

function Status({ booking }) { return <span className={`status ${booking.owner === 'you' ? 'status-mine' : 'status-other'}`}>{booking.owner === 'you' ? 'Your booking' : 'Reserved'}</span>; }

export default function App() {
  const [bookings, setBookings] = useState(read);
  const [page, setPage] = useState('dashboard');
  const [week, setWeek] = useState('2026-11-09');
  const [roomFilter, setRoomFilter] = useState('All rooms');
  const [expanded, setExpanded] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState(null);
  const [selected, setSelected] = useState(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  useEffect(() => localStorage.setItem(STORAGE, JSON.stringify(bookings)), [bookings]);
  const days = useMemo(() => Array.from({ length: 7 }, (_, index) => addDays(week, index)), [week]);
  const mine = bookings.filter(b => b.owner === 'you').sort((a, b) => b.startDate.localeCompare(a.startDate));
  const recent = [...bookings].sort((a, b) => b.startDate.localeCompare(a.startDate)).slice(0, 6);
  const roomList = roomFilter === 'All rooms' ? rooms : rooms.filter(room => room === roomFilter);
  const occupied = (room, date) => bookings.find(b => b.roomNumber === room && date >= b.startDate && date < b.endDate);
  function navigate(nextPage) { setPage(nextPage); setSelected(null); setNotice(''); setError(''); }
  function openForm(booking = null) { setEditing(booking?.id || null); setForm(booking ? { roomNumber: booking.roomNumber, startDate: booking.startDate, endDate: booking.endDate, purpose: booking.purpose } : emptyForm); setError(''); setNotice(''); setPage('book'); }
  function pick(room, date) { openForm(); setForm({ roomNumber: room, startDate: date, endDate: addDays(date, 1), purpose: '' }); }
  function submit(event) {
    event.preventDefault(); const validation = issue(form, bookings, editing);
    if (validation) { setError(validation); return; }
    const payload = { roomNumber: form.roomNumber.trim(), startDate: form.startDate, endDate: form.endDate, purpose: form.purpose.trim(), owner: 'you' };
    if (editing) { setBookings(bookings.map(booking => booking.id === editing ? { ...booking, ...payload } : booking)); setNotice('Booking updated.'); }
    else { setBookings([...bookings, { ...payload, id: `b-${Date.now()}` }]); setNotice('Room reserved.'); }
    setForm(emptyForm); setEditing(null);
  }
  function reset() { setBookings(seed); setForm(emptyForm); setEditing(null); setWeek('2026-11-09'); setRoomFilter('All rooms'); setNotice('Example bookings restored.'); navigate('dashboard'); }

  return <div className={`room-app ${expanded ? 'sidebar-expanded' : ''}`}>
    <aside className="sidebar" onMouseEnter={() => setExpanded(true)} onMouseLeave={() => setExpanded(false)}>
      <div className="brand"><span className="brand-mark">R</span><span className="brand-copy"><strong>room<span>grid</span></strong><small>Campus spaces</small></span></div>
      <button className="sidebar-toggle" aria-label="Toggle navigation" onClick={() => setExpanded(value => !value)}>{expanded ? '‹' : '›'}</button>
      <nav className="side-nav" aria-label="Main navigation">
        {[['dashboard', '⌂', 'Dashboard'], ['book', '+', 'Book a room'], ['availability', '▦', 'Availability'], ['bookings', '≡', 'My bookings']].map(([key, icon, label]) => <button key={key} className={page === key ? 'active' : ''} onClick={() => navigate(key)}><b>{icon}</b><span>{label}</span></button>)}
      </nav>
      <div className="side-bottom"><button onClick={reset}><b>↺</b><span>Reset demo</span></button><button><b>?</b><span>Help</span></button></div>
    </aside>
    <div className="app-content">
      <header className="topbar"><div className="mobile-brand"><span className="brand-mark">R</span><strong>room<span>grid</span></strong></div><div className="breadcrumb">Campus spaces <span>/</span> {page === 'dashboard' ? 'Dashboard' : page === 'book' ? 'Book a room' : page === 'availability' ? 'Availability' : page === 'bookings' ? 'My bookings' : 'Booking details'}</div><div className="member"><span>Student dashboard</span><div className="profile">YOU</div></div></header>
      <main>
        {page === 'dashboard' && <Dashboard recent={recent} mine={mine} bookings={bookings} onNavigate={navigate} onView={booking => { setSelected(booking); setPage('details'); }} />}
        {page === 'bookings' && <Bookings bookings={bookings} onView={booking => { setSelected(booking); setPage('details'); }} onEdit={openForm} />}
        {page === 'availability' && <Availability days={days} week={week} setWeek={setWeek} roomList={roomList} roomFilter={roomFilter} setRoomFilter={setRoomFilter} occupied={occupied} pick={pick} />}
        {page === 'book' && <BookingForm form={form} setForm={setForm} editing={editing} error={error} notice={notice} submit={submit} check={() => { const validation = issue(form, bookings, editing); setError(validation); setNotice(validation ? '' : 'No conflict detected for the selected dates.'); }} cancel={() => { setEditing(null); setForm(emptyForm); setPage('dashboard'); }} />}
        {page === 'details' && selected && <Details booking={selected} onBack={() => navigate('bookings')} onEdit={() => openForm(selected)} />}
      </main>
    </div>
  </div>;
}

function Dashboard({ recent, mine, bookings, onNavigate, onView }) {
  return <><section className="welcome"><div><span className="eyebrow">STUDENT DASHBOARD</span><h1>Good morning, ready to find a room?</h1><p>See what is happening on campus and make your next reservation quickly.</p></div><button className="primary-action" onClick={() => onNavigate('book')}>＋ Book a room</button></section>
    <section className="summary-row" aria-label="Room summary"><div><span>MY ACTIVE BOOKINGS</span><strong>{mine.length}</strong></div><div><span>ROOMS IN DIRECTORY</span><strong>{rooms.length}</strong></div><div><span>CURRENT RESERVATIONS</span><strong>{bookings.length}</strong></div><div><span>NEXT RESERVATION</span><strong>{mine[0] ? human(mine[0].startDate) : 'None'}</strong></div></section>
    <section className="content-section"><div className="section-heading"><div><span className="eyebrow">RECENT ACTIVITY</span><h2>Recent bookings</h2></div><button className="text-button" onClick={() => onNavigate('bookings')}>View all bookings →</button></div><BookingList bookings={recent} onView={onView} /></section>
    <section className="quick-strip"><div><span className="quick-icon">✦</span><div><strong>Need a room for a group?</strong><p>Choose your room and dates, then confirm your reservation.</p></div></div><button className="outline-action" onClick={() => onNavigate('availability')}>Check availability</button></section>
  </>;
}

function BookingList({ bookings, onView }) {
  return <div className="booking-list"><div className="list-head"><span>ROOM</span><span>DATES</span><span>PURPOSE</span><span>STATUS</span><span></span></div>{bookings.map(booking => <div className="booking-row" key={booking.id}><strong className="room-chip">{booking.roomNumber}</strong><span>{human(booking.startDate, true)} – {human(booking.endDate, true)}</span><span className="purpose">{booking.purpose || 'No purpose entered'}</span><Status booking={booking} /><button className="view-button" onClick={() => onView(booking)}>View</button></div>)}</div>;
}

function Bookings({ bookings, onView, onEdit }) {
  const [query, setQuery] = useState('');
  const filtered = bookings.filter(booking => `${booking.roomNumber} ${booking.purpose}`.toLowerCase().includes(query.toLowerCase()));
  return <><section className="page-title"><div><span className="eyebrow">RESERVATION RECORDS</span><h1>My bookings</h1><p>Review recent activity and open a reservation for more details.</p></div><button className="primary-action" onClick={() => onEdit()}>＋ Book a room</button></section><div className="toolbar"><label>Search bookings<input value={query} onChange={event => setQuery(event.target.value)} placeholder="Room or purpose" /></label><span>{filtered.length} records</span></div><BookingList bookings={filtered} onView={onView} /></>;
}

function Availability({ days, week, setWeek, roomList, roomFilter, setRoomFilter, occupied, pick }) {
  return <><section className="page-title"><div><span className="eyebrow">ROOM DIRECTORY</span><h1>Check availability</h1><p>Select an open date to start a reservation.</p></div></section><section className="availability-panel"><div className="calendar-head"><div className="weeknav"><button aria-label="Previous week" onClick={() => setWeek(addDays(week, -7))}>←</button><strong>{human(week, true)} – {human(addDays(week, 6), true)}</strong><button aria-label="Next week" onClick={() => setWeek(addDays(week, 7))}>→</button></div><label className="filter-label">Room <select value={roomFilter} onChange={event => setRoomFilter(event.target.value)}><option>All rooms</option>{rooms.map(room => <option key={room}>{room}</option>)}</select></label></div><div className="calendar-scroll"><div className="room-cal"><div className="corner">ROOM / DATE</div>{days.map(day => <div className="dayhead" key={day}><strong>{weekDay(day)}</strong><span>{human(day)}</span></div>)}{roomList.map(room => <React.Fragment key={room}><div className="roomname"><strong>{room}</strong><small>Study room · {room[0]}</small></div>{days.map(day => { const booking = occupied(room, day); return <button key={room + day} title={`${room}, ${day}: ${booking ? 'Reserved' : 'Available'}`} className={`slot ${booking ? 'taken' : 'available'}`} onClick={() => !booking && pick(room, day)}><span>{booking ? 'Booked' : 'Open'}</span>{booking && <small>{booking.owner === 'you' ? 'Your booking' : 'Reserved'}</small>}</button>; })}</React.Fragment>)}</div></div><p className="calendar-note">Open a green date to begin a booking. Reservations can span multiple days.</p></section></>;
}

function BookingForm({ form, setForm, editing, error, notice, submit, check, cancel }) {
  return <section className="form-page"><div className="page-title"><div><span className="eyebrow">RESERVATION</span><h1>{editing ? 'Change reservation' : 'Book a room'}</h1><p>Reserve a room for your study group, meeting, or activity.</p></div></div><form className="booking-form" onSubmit={submit}>{notice && <div className="success" role="status">{notice}</div>}{error && <div className="error" role="alert">{error}</div>}<div className="form-grid"><label><span>Room number</span><input list="rooms" placeholder="e.g. B2-104" value={form.roomNumber} onChange={event => setForm(value => ({ ...value, roomNumber: event.target.value }))} /><datalist id="rooms">{rooms.map(room => <option key={room} value={room} />)}</datalist></label><label><span>Purpose <em>optional</em></span><input placeholder="Meeting, group study..." value={form.purpose} onChange={event => setForm(value => ({ ...value, purpose: event.target.value }))} /></label><label><span>Start date</span><input type="date" value={form.startDate} onChange={event => setForm(value => ({ ...value, startDate: event.target.value }))} /></label><label><span>End date</span><input type="date" value={form.endDate} onChange={event => setForm(value => ({ ...value, endDate: event.target.value }))} /></label></div><p className="helper">End date is exclusive. Reservations cannot overlap an existing booking for the same room.</p><div className="form-actions"><button className="outline-action" type="button" onClick={check}>Check availability</button><button className="primary-action" type="submit">{editing ? 'Save booking' : 'Confirm booking'}</button><button className="cancel-button" type="button" onClick={cancel}>Cancel</button></div></form></section>;
}

function Details({ booking, onBack, onEdit }) {
  return <section className="details-page"><button className="back-button" onClick={onBack}>← Back to bookings</button><div className="details-header"><div><span className="eyebrow">BOOKING DETAILS</span><h1>{booking.roomNumber}</h1><p>{booking.purpose || 'No purpose entered'}</p></div><Status booking={booking} /></div><div className="details-grid"><div><span>DATES</span><strong>{human(booking.startDate, true)} – {human(booking.endDate, true)}</strong></div><div><span>ROOM</span><strong>Study room · {booking.roomNumber[0]}</strong></div><div><span>BOOKED BY</span><strong>{booking.owner === 'you' ? 'You' : 'Campus member'}</strong></div></div>{booking.owner === 'you' && <button className="primary-action" onClick={onEdit}>Edit booking</button>}</section>;
}
