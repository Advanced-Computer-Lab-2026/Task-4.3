import React, { useEffect, useMemo, useRef, useState } from 'react';

const STORAGE = 'acl-roomgrid-18rooms-v1';
const rooms = ['A1-203', 'A2-106', 'A2-107', 'A3-208', 'A3-209', 'B1-205', 'B1-206', 'B1-207', 'B2-104', 'B2-105', 'B3-301', 'C1-102', 'C1-103', 'C2-201', 'C2-202', 'C3-101', 'C3-102', 'D1-101'];
// End dates are exclusive; all sample reservations use non-overlapping date ranges.
const sampleRows = [
  ['A1-203', '2026-11-09', '2026-11-11', 'Peer tutoring', 'other'],
  ['A1-203', '2026-11-17', '2026-11-19', 'Group assignment', 'you'],
  ['A2-106', '2026-11-10', '2026-11-13', 'Seminar preparation', 'other'],
  ['A2-106', '2026-11-16', '2026-11-19', 'Study circle', 'other'],
  ['A2-107', '2026-11-09', '2026-11-10', 'Student club planning', 'you'],
  ['A2-107', '2026-11-12', '2026-11-15', 'Project demo rehearsal', 'other'],
  ['A2-107', '2026-11-16', '2026-11-19', 'Study meeting', 'other'],
  ['A3-208', '2026-11-11', '2026-11-14', 'Presentation practice', 'other'],
  ['A3-208', '2026-11-16', '2026-11-18', 'Tutorial group', 'other'],
  ['A3-209', '2026-11-10', '2026-11-12', 'Study session', 'other'],
  ['B1-205', '2026-11-09', '2026-11-11', 'Meeting', 'other'],
  ['B1-205', '2026-11-13', '2026-11-15', 'Team discussion', 'other'],
  ['B1-206', '2026-11-11', '2026-11-13', 'Exam revision', 'other'],
  ['B1-206', '2026-11-17', '2026-11-20', 'Debate practice', 'you'],
  ['B1-207', '2026-11-10', '2026-11-12', 'Group study', 'you'],
  ['B1-207', '2026-11-16', '2026-11-19', 'Engineering project', 'other'],
  ['B2-104', '2026-11-09', '2026-11-11', 'Weekly study group', 'you'],
  ['B2-104', '2026-11-13', '2026-11-15', 'Team planning', 'other'],
  ['B2-104', '2026-11-17', '2026-11-19', 'Workshop preparation', 'other'],
  ['B2-105', '2026-11-12', '2026-11-15', 'Club meeting', 'other'],
  ['B2-105', '2026-11-16', '2026-11-18', 'Student committee', 'other'],
  ['B3-301', '2026-11-09', '2026-11-10', 'Debate practice', 'other'],
  ['B3-301', '2026-11-11', '2026-11-13', 'Group preparation', 'other'],
  ['B3-301', '2026-11-18', '2026-11-20', 'Portfolio review', 'other'],
  ['C1-102', '2026-11-10', '2026-11-14', 'Capstone meeting', 'other'],
  ['C1-102', '2026-11-16', '2026-11-19', 'Revision session', 'other'],
  ['C1-103', '2026-11-09', '2026-11-12', 'Group project', 'other'],
  ['C1-103', '2026-11-14', '2026-11-16', 'Student society', 'you'],
  ['C2-201', '2026-11-12', '2026-11-15', 'Project sprint', 'other'],
  ['C2-201', '2026-11-16', '2026-11-19', 'Robotics club', 'other'],
  ['C2-202', '2026-11-09', '2026-11-11', 'Lab preparation', 'other'],
  ['C2-202', '2026-11-18', '2026-11-20', 'Teaching assistant session', 'other'],
  ['C3-101', '2026-11-12', '2026-11-14', 'Presentation rehearsal', 'you'],
  ['C3-101', '2026-11-14', '2026-11-16', 'Design workshop', 'other'],
  ['C3-101', '2026-11-18', '2026-11-20', 'Study group', 'other'],
  ['C3-102', '2026-11-11', '2026-11-15', 'Research meeting', 'other'],
  ['D1-101', '2026-11-10', '2026-11-13', 'Team check-in', 'other'],
  ['D1-101', '2026-11-16', '2026-11-18', 'Group assignment', 'you'],
];
const seed = sampleRows.map(([roomNumber, startDate, endDate, purpose, owner], index) => ({
  id: 'demo-' + (index + 1), roomNumber, startDate, endDate, purpose, owner,
}));
const formEmpty = { roomNumber: '', startDate: '', endDate: '', purpose: '' };

function read() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE));
    return Array.isArray(saved) ? saved : seed;
  } catch {
    return seed;
  }
}
function addDays(iso, days) {
  const date = new Date(iso + 'T12:00:00Z');
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}
function human(iso) {
  return new Date(iso + 'T12:00:00Z').toLocaleDateString('en-GB', { timeZone: 'UTC', day: 'numeric', month: 'short' });
}
function weekDay(iso) {
  return new Date(iso + 'T12:00:00Z').toLocaleDateString('en-GB', { timeZone: 'UTC', weekday: 'short' });
}
function daysBetween(start, end) {
  return Math.round((new Date(end + 'T12:00:00Z') - new Date(start + 'T12:00:00Z')) / 86400000);
}
function rangeLabel(start, end) {
  const first = new Date(start + 'T12:00:00Z');
  const last = new Date(end + 'T12:00:00Z');
  const endMonth = last.toLocaleDateString('en-GB', { timeZone: 'UTC', month: 'short' });
  if (first.getUTCFullYear() === last.getUTCFullYear() && first.getUTCMonth() === last.getUTCMonth()) {
    return first.getUTCDate() + '–' + last.getUTCDate() + ' ' + endMonth;
  }
  return human(start) + '–' + human(end);
}
function bookingDates(row) {
  const length = daysBetween(row.startDate, row.endDate);
  return length === 1 ? human(row.startDate) + ' (1 day)' : rangeLabel(row.startDate, row.endDate) + ', ' + length + ' days';
}
function bookingSummary(form) {
  if (!form.roomNumber.trim() || !form.startDate || !form.endDate || form.endDate <= form.startDate) return '';
  const length = daysBetween(form.startDate, form.endDate);
  return form.roomNumber.trim() + ' · ' + rangeLabel(form.startDate, form.endDate) + ' (' + length + ' ' + (length === 1 ? 'day' : 'days') + ') · ends before ' + human(form.endDate);
}

// Keep the booking rules and messages in issue() as the authoritative validator.
function issue(form, bookings, id) {
  if (!form.roomNumber.trim() || !form.startDate || !form.endDate) return 'Complete the room and both dates.';
  if (form.endDate <= form.startDate) return 'End date must follow start date.';
  if (bookings.some(b => b.id !== id && b.roomNumber.toLowerCase() === form.roomNumber.trim().toLowerCase() && form.startDate < b.endDate && form.endDate > b.startDate)) return 'This room is already booked for some of those dates.';
  return '';
}
function conflictFor(form, bookings, id) {
  return bookings.find(b => b.id !== id &&
    b.roomNumber.toLowerCase() === form.roomNumber.trim().toLowerCase() &&
    form.startDate < b.endDate && form.endDate > b.startDate);
}
function nextFreeStart(form, bookings, id) {
  const length = daysBetween(form.startDate, form.endDate);
  const sameRoom = bookings.filter(b => b.id !== id && b.roomNumber.toLowerCase() === form.roomNumber.trim().toLowerCase());
  const lastEnd = sameRoom.reduce((latest, b) => b.endDate > latest ? b.endDate : latest, form.startDate);
  for (let candidate = addDays(form.startDate, 1); candidate <= addDays(lastEnd, length); candidate = addDays(candidate, 1)) {
    const candidateForm = { ...form, startDate: candidate, endDate: addDays(candidate, length) };
    if (!conflictFor(candidateForm, bookings, id)) return candidate;
  }
  return '';
}
function validation(form, bookings, id) {
  const message = issue(form, bookings, id);
  if (!message) return { message: '', fields: [] };
  if (!form.roomNumber.trim() || !form.startDate || !form.endDate) {
    const fields = [];
    if (!form.roomNumber.trim()) fields.push('roomNumber');
    if (!form.startDate) fields.push('startDate');
    if (!form.endDate) fields.push('endDate');
    return { message, fields };
  }
  if (form.endDate <= form.startDate) return { message, fields: ['endDate'] };
  const conflict = conflictFor(form, bookings, id);
  if (conflict) {
    const length = daysBetween(form.startDate, form.endDate);
    const next = nextFreeStart(form, bookings, id);
    const details = ' ' + conflict.roomNumber + ' is reserved ' + bookingDates(conflict) + ' (ends before ' + human(conflict.endDate) + ').';
    const suggestion = next ? ' Next free start for the same ' + length + '-day booking: ' + human(next) + '.' : '';
    return { message: message + details + suggestion, fields: ['roomNumber', 'startDate', 'endDate'] };
  }
  return { message, fields: ['roomNumber', 'startDate', 'endDate'] };
}

export default function App() {
  const [bookings, setBookings] = useState(read);
  const [week, setWeek] = useState('2026-11-09');
  const [view, setView] = useState('All rooms');
  const [form, setForm] = useState({ ...formEmpty });
  const [editing, setEditing] = useState(null);
  const [selection, setSelection] = useState(null);
  const [error, setError] = useState({ message: '', fields: [] });
  const [notice, setNotice] = useState('');
  const [tab, setTab] = useState('Availability');
  const roomInput = useRef(null);

  useEffect(() => localStorage.setItem(STORAGE, JSON.stringify(bookings)), [bookings]);
  const days = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(week, i)), [week]);
  const myBookings = bookings.filter(b => b.owner === 'you').sort((a, b) => a.startDate.localeCompare(b.startDate));
  const roomList = view === 'All rooms' ? rooms : rooms.filter(r => r === view);
  const occupied = (room, date) => bookings.find(b => b.roomNumber === room && date >= b.startDate && date < b.endDate);
  const summary = bookingSummary(form);
  const invalid = field => error.fields.includes(field);

  function clearFeedback() {
    setError({ message: '', fields: [] });
    setNotice('');
  }
  function focusForm(focus = false) {
    document.getElementById('booking-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    if (focus) roomInput.current?.focus({ preventScroll: true });
  }
  function updateForm(field, value) {
    clearFeedback();
    setForm(current => ({ ...current, [field]: value }));
    if (field === 'roomNumber' || field === 'startDate' || field === 'endDate') setSelection(null);
  }
  function edit(row) {
    if (row.owner !== 'you') return;
    setEditing(row.id);
    setSelection(null);
    setForm({ roomNumber: row.roomNumber, startDate: row.startDate, endDate: row.endDate, purpose: row.purpose });
    clearFeedback();
    focusForm(true);
  }
  function startSelection(room, date) {
    setForm({ roomNumber: room, startDate: date, endDate: addDays(date, 1), purpose: '' });
    setEditing(null);
    setSelection({ room, start: date });
    clearFeedback();
    focusForm();
  }
  function selectCell(room, date, booking) {
    clearFeedback();
    if (booking) {
      if (booking.owner === 'you') {
        edit(booking);
      } else {
        setError({ message: room + ' is unavailable on ' + human(date) + '. It is reserved ' + bookingDates(booking) + '.', fields: [] });
      }
      return;
    }
    if (selection && selection.room === room) {
      const first = date < selection.start ? date : selection.start;
      const last = date < selection.start ? selection.start : date;
      const end = addDays(last, 1);
      const blocked = bookings.find(b => b.id !== editing && b.roomNumber.toLowerCase() === room.toLowerCase() && first < b.endDate && end > b.startDate);
      if (blocked) {
        const blockedDay = blocked.startDate > first ? blocked.startDate : first;
        setError({ message: "Can't select that range for " + room + ': ' + human(blockedDay) + ' is unavailable because it is reserved ' + bookingDates(blocked) + '.', fields: [] });
        return;
      }
      setForm(current => ({ ...current, roomNumber: room, startDate: first, endDate: end }));
      setEditing(null);
      setSelection(null);
      focusForm();
      return;
    }
    startSelection(room, date);
  }
  function submit(event) {
    event.preventDefault();
    setNotice('');
    const result = validation(form, bookings, editing);
    if (result.message) {
      setError(result);
      const first = result.fields[0];
      const refs = {
        roomNumber: roomInput.current,
        startDate: document.getElementById('start-date'),
        endDate: document.getElementById('end-date'),
      };
      if (first) refs[first]?.focus();
      else document.getElementById('booking-error')?.focus();
      return;
    }
    const payload = {
      roomNumber: form.roomNumber.trim(),
      startDate: form.startDate,
      endDate: form.endDate,
      purpose: form.purpose.trim(),
      owner: 'you',
    };
    if (editing) {
      setBookings(current => current.map(b => b.id === editing ? { ...b, ...payload } : b));
      setNotice('Booking updated: ' + bookingSummary(form) + '.');
    } else {
      const length = daysBetween(payload.startDate, payload.endDate);
      setBookings(current => [...current, { ...payload, id: 'b-' + Date.now() }]);
      setNotice('Room ' + payload.roomNumber + ' reserved for ' + rangeLabel(payload.startDate, payload.endDate) +
        ' (' + length + ' ' + (length === 1 ? 'day' : 'days') + '); ends before ' + human(payload.endDate) + '.');
    }
    setForm({ ...formEmpty });
    setEditing(null);
    setSelection(null);
    setError({ message: '', fields: [] });
  }
  function check() {
    setNotice('');
    const result = validation(form, bookings, editing);
    if (result.message) setError(result);
    else {
      setError({ message: '', fields: [] });
      setNotice('No conflict detected for ' + bookingSummary(form) + '.');
    }
  }
  function reset() {
    setBookings(seed);
    setForm({ ...formEmpty });
    setEditing(null);
    setSelection(null);
    setWeek('2026-11-09');
    setNotice('Example bookings restored.');
    setError({ message: '', fields: [] });
    setView('All rooms');
  }
  function changeWeek(amount) {
    setWeek(current => addDays(current, amount));
    setSelection(null);
    clearFeedback();
  }
  function changeView(value) {
    setView(value);
    setSelection(null);
    clearFeedback();
  }

  return <div className="room-app">
    <header className="topbar">
      <div className="mark"><span className="mark-sq">R</span><span><strong>room<span>grid</span></strong><small>Campus spaces</small></span></div>
      <nav>
        <button className={tab === 'Availability' ? 'selected' : ''} onClick={() => { setTab('Availability'); clearFeedback(); }}>Availability</button>
        <button className={tab === 'My bookings' ? 'selected' : ''} onClick={() => { setTab('My bookings'); clearFeedback(); document.getElementById('my-reservations')?.scrollIntoView({ behavior: 'smooth' }); }}>My bookings</button>
        <button onClick={reset}>Reset demo</button>
      </nav>
      <div className="member"><span>Student dashboard</span><div className="profile">YOU</div></div>
    </header>
    <main>
      <section className="intro">
        <div><span className="eyebrow">SPACES / RESERVATIONS</span><h1>Find room availability</h1><p>Review campus rooms, dates and existing reservations in one view.</p></div>
        <div className="intro-summary"><span>ROOMS IN DIRECTORY</span><strong>{rooms.length.toString().padStart(2, '0')}</strong><span>CURRENT RESERVATIONS</span><strong>{bookings.length.toString().padStart(2, '0')}</strong></div>
      </section>
      <div className="pagegrid">
        <section className="calendar-pane">
          <div className="calendar-head">
            <div><span className="eyebrow">AVAILABILITY CALENDAR</span><h2>Rooms by day</h2></div>
            <div className="weeknav"><button aria-label="Previous week" onClick={() => changeWeek(-7)}>←</button><strong>{human(week)} – {human(addDays(week, 6))}</strong><button aria-label="Next week" onClick={() => changeWeek(7)}>→</button></div>
          </div>
          <div className="calendar-controls">
            <label>Location <select value={view} onChange={event => changeView(event.target.value)}><option>All rooms</option>{rooms.map(room => <option key={room}>{room}</option>)}</select></label>
            <span className="legend"><i className="booked" /> Reserved</span>
            <span className="legend"><i className="free" /> Available</span>
            <span className="legend"><i className="mine" /> Your booking</span>
            <p>{selection ? 'Choose an end date for ' + selection.room + ', starting ' + human(selection.start) + '.' : 'Choose a start date, then an end date for the same room.'}</p>
          </div>
          <div className="calendar-range" aria-live="polite">{summary || 'Select dates to preview the full booking range and exclusive end date.'}</div>
          <div className="calendar-scroll"><div className="room-cal">
            <div className="corner">ROOM / DATE</div>
            {days.map(date => <div className="dayhead" key={date}><strong>{weekDay(date)}</strong><span>{human(date)}</span></div>)}
            {roomList.map(room => <React.Fragment key={room}>
              <div className="roomname"><strong>{room}</strong><small>Study room · {room[0]}</small></div>
              {days.map(date => {
                const booking = occupied(room, date);
                const selected = room === form.roomNumber && !!form.startDate && !!form.endDate &&
                  form.endDate > form.startDate && date >= form.startDate && date < form.endDate;
                const classes = [
                  'slot', booking ? 'taken' : 'available', booking?.owner === 'you' ? 'mine' : '',
                  selected ? 'selected-range' : '', selected && date === form.startDate ? 'selected-start' : '',
                  selected && date === addDays(form.endDate, -1) ? 'selected-end' : '',
                  booking?.id === editing ? 'editing-booking' : '',
                ].filter(Boolean).join(' ');
                const state = booking
                  ? (booking.owner === 'you'
                    ? 'Your booking, unavailable; ' + bookingDates(booking) + ', ends before ' + human(booking.endDate) + '. Select to edit.'
                    : 'Reserved and unavailable; ' + bookingDates(booking) + ', ends before ' + human(booking.endDate) + '.')
                  : (selected ? 'Selected in range ' + summary + '.' : 'Available; select as the start or end of a booking.');
                return <button key={room + date} type="button" title={room + ', ' + human(date) + ': ' + state}
                  aria-label={room + ', ' + human(date) + '. ' + state} aria-pressed={selected}
                  aria-disabled={booking && booking.owner !== 'you' ? true : undefined} className={classes}
                  onClick={() => selectCell(room, date, booking)}>
                  <span>{booking ? 'Booked' : 'Open'}</span>
                  {booking && <small>{booking.owner === 'you' ? '★ Your booking' : 'Reserved'}</small>}
                </button>;
              })}
            </React.Fragment>)}
          </div></div>
          <p className="calendar-note">A selected date range includes its start date and ends before the displayed end date. Booked days cannot be selected; a range that crosses a reservation will be blocked.</p>
          <section id="my-reservations" className="reservations">
            <div className="reservations-head"><h2>Your bookings</h2><span>{myBookings.length} current records</span></div>
            <div className="reservations-list">
              {myBookings.map(booking => <article key={booking.id} className={'reservation' + (editing === booking.id ? ' is-editing' : '')}>
                <div className="room-chip">{booking.roomNumber}</div>
                <div className="reservation-body"><strong>{bookingDates(booking)}</strong><small>{booking.purpose || 'No purpose entered'} · ends before {human(booking.endDate)}</small></div>
                <button type="button" onClick={() => edit(booking)}>Change</button>
              </article>)}
              {myBookings.length === 0 && <p>No reservations.</p>}
            </div>
          </section>
        </section>
        <aside className="booking-pane" id="booking-form">
          <div className="panel-tag"><span>BOOK A ROOM</span><span>FORM 01</span></div>
          <h2>{editing ? 'Change reservation' : 'Make a reservation'}</h2>
          <p className="booking-description">Use this panel to request a room for your study group, meeting or activity.</p>
          {editing && <p className="editing-line">Editing: {summary}</p>}
          {notice && <div className="success" role="status">{notice}</div>}
          {error.message && <div className="error" id="booking-error" role="alert" tabIndex="-1">{error.message}</div>}
          <form noValidate onSubmit={submit}>
            <label><span>Room number</span><input ref={roomInput} id="room-number" list="rooms" placeholder="e.g., B2-104"
              value={form.roomNumber} aria-required="true" aria-invalid={invalid('roomNumber') || undefined}
              aria-describedby={invalid('roomNumber') ? 'booking-error' : undefined}
              onChange={event => updateForm('roomNumber', event.target.value)} />
              <datalist id="rooms">{rooms.map(room => <option key={room} value={room} />)}</datalist>
            </label>
            <div className="date-pair">
              <label><span>Start date</span><input id="start-date" type="date" value={form.startDate}
                aria-required="true" aria-invalid={invalid('startDate') || undefined}
                aria-describedby={invalid('startDate') ? 'booking-error' : undefined}
                onChange={event => updateForm('startDate', event.target.value)} /></label>
              <label><span>End date</span><input id="end-date" type="date" min={form.startDate ? addDays(form.startDate, 1) : undefined}
                value={form.endDate} aria-required="true" aria-invalid={invalid('endDate') || undefined}
                aria-describedby={invalid('endDate') ? 'booking-error' : undefined}
                onChange={event => updateForm('endDate', event.target.value)} /></label>
            </div>
            <label><span>Purpose / optional</span><textarea rows="5" placeholder="Meeting, group study..." value={form.purpose} onChange={event => updateForm('purpose', event.target.value)} /></label>
            <div className="form-range-summary" aria-live="polite">{summary || 'The end date is exclusive: the room is free again on that date.'}</div>
            <p className="helper">Start and end dates are required. Reservations cannot overlap existing bookings for the same room.</p>
            <button className="availability-check" type="button" onClick={check}>Check availability</button>
            <button className="reserve-button" type="submit">{editing ? 'Save booking' : 'Confirm booking'}</button>
            {editing && <button className="cancel-edit" type="button" onClick={() => { setEditing(null); setSelection(null); setForm({ ...formEmpty }); clearFeedback(); }}>Cancel editing</button>}
          </form>
          <div className="right-foot"><span>✦</span> Need a room for a group? Find an open date and submit your request.</div>
        </aside>
      </div>
    </main>
    <footer>ROOMGRID / Academic campus demo — local browser data only.</footer>
  </div>;
}
