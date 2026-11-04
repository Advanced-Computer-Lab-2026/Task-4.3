import React, { useEffect, useMemo, useRef, useState } from 'react';

const STORAGE = 'acl-roomgrid-18rooms-v1';
const rooms = ['A1-203', 'A2-106', 'A2-107', 'A3-208', 'A3-209', 'B1-205', 'B1-206', 'B1-207', 'B2-104', 'B2-105', 'B3-301', 'C1-102', 'C1-103', 'C2-201', 'C2-202', 'C3-101', 'C3-102', 'D1-101'];
// End dates are exclusive; all sample reservations use non-overlapping date ranges.
const sampleRows = [
  ['A1-203', '2026-11-09', '2026-11-11', 'Peer tutoring', 'other'],
  ['A1-203', '2026-11-13', '2026-11-15', 'Architecture workshop', 'other'],
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
  ['B1-205', '2026-11-16', '2026-11-18', 'Course project', 'other'],
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
const seed = sampleRows.map(([roomNumber, startDate, endDate, purpose, owner], index) => ({ id: `demo-${index + 1}`, roomNumber, startDate, endDate, purpose, owner }));
const formEmpty = { roomNumber: '', startDate: '', endDate: '', purpose: '' };

function read() { try { const a = JSON.parse(localStorage.getItem(STORAGE)); return Array.isArray(a) ? a : seed; } catch { return seed; } }
function addDays(iso, days) { const t = new Date(`${iso}T12:00:00Z`); t.setUTCDate(t.getUTCDate() + days); return t.toISOString().slice(0, 10); }
function human(iso) { return new Date(`${iso}T12:00:00Z`).toLocaleDateString('en-GB', { timeZone: 'UTC', day: 'numeric', month: 'short' }); }
function weekDay(iso) { return new Date(`${iso}T12:00:00Z`).toLocaleDateString('en-GB', { timeZone: 'UTC', weekday: 'short' }); }
function mondayOf(iso) { const dow = new Date(`${iso}T12:00:00Z`).getUTCDay(); return addDays(iso, -((dow + 6) % 7)); }
function dayCount(start, end) { return Math.round((new Date(`${end}T12:00:00Z`) - new Date(`${start}T12:00:00Z`)) / 86400000); }
// End dates are exclusive, so the last day the room is actually held is endDate - 1.
function rangeLabel(start, end) {
  const last = addDays(end, -1);
  const n = dayCount(start, end);
  return `${start === last ? human(start) : `${human(start)} – ${human(last)}`} · ${n} day${n === 1 ? '' : 's'}`;
}

// FIX 1: validation returns WHICH field is wrong and a specific, actionable message
// (same rules as before: room + both dates required, end strictly after start, no overlap).
function issue(form, bookings, id) {
  if (!form.roomNumber.trim()) return { field: 'roomNumber', message: 'Choose a room number (pick one from the list or click a day in the calendar).' };
  if (!form.startDate) return { field: 'startDate', message: 'Choose a start date.' };
  if (!form.endDate) return { field: 'endDate', message: 'Choose an end date.' };
  if (form.endDate <= form.startDate) return { field: 'endDate', message: `End date must be after the start date. Pick ${human(addDays(form.startDate, 1))} or later.` };
  const clash = bookings.find(b => b.id !== id && b.roomNumber.toLowerCase() === form.roomNumber.trim().toLowerCase() && form.startDate < b.endDate && form.endDate > b.startDate);
  if (clash) return { field: 'dates', message: `${clash.roomNumber} is already ${clash.owner === 'you' ? 'booked by you' : 'reserved'} for ${rangeLabel(clash.startDate, clash.endDate)}. Choose dates outside that range or another room.` };
  return null;
}

export default function App() {
  const [bookings, setBookings] = useState(read);
  const [week, setWeek] = useState('2026-11-09');
  const [view, setView] = useState('All rooms');
  const [form, setForm] = useState({ ...formEmpty });
  const [editing, setEditing] = useState(null);
  const [error, setError] = useState(null); // { field, message }
  const [notice, setNotice] = useState('');
  const [tab, setTab] = useState('Availability');
  const [rangeStart, setRangeStart] = useState(null); // { room, date } while picking a range in the calendar
  const [justSaved, setJustSaved] = useState(null);
  const formRef = useRef(null);
  const roomInput = useRef(null);
  const startInput = useRef(null);
  const endInput = useRef(null);

  useEffect(() => localStorage.setItem(STORAGE, JSON.stringify(bookings)), [bookings]);
  const days = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(week, i)), [week]);
  const myBookings = bookings.filter(b => b.owner === 'you').sort((a, b) => a.startDate.localeCompare(b.startDate));
  const roomList = view === 'All rooms' ? rooms : rooms.filter(r => r === view);
  const occupied = (room, date) => bookings.find(b => b.roomNumber === room && date >= b.startDate && date < b.endDate);
  const validRange = form.startDate && form.endDate && form.endDate > form.startDate;
  const inSelection = (room, day) => validRange && form.roomNumber.trim().toLowerCase() === room.toLowerCase() && day >= form.startDate && day < form.endDate;

  function showForm(focusEl) {
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setTimeout(() => focusEl?.current?.focus({ preventScroll: true }), 350);
  }

  // FIX 3: calendar click behaviour
  //  - someone else's reservation: not selectable (button is disabled)
  //  - your own reservation: opens it for editing
  //  - open day: first click sets start, a second click on a later day in the same room sets the end
  function pick(room, date) {
    const b = occupied(room, date);
    if (b && b.owner !== 'you') return;
    if (b && b.owner === 'you' && b.id !== editing) { edit(b); return; }
    setError(null); setNotice('');
    const keepEditing = editing && form.roomNumber === room ? editing : null;
    if (rangeStart && rangeStart.room === room && date >= rangeStart.date) {
      setForm(f => ({ ...f, roomNumber: room, startDate: rangeStart.date, endDate: addDays(date, 1) }));
      setRangeStart(null);
    } else {
      setForm(f => ({ roomNumber: room, startDate: date, endDate: addDays(date, 1), purpose: keepEditing ? f.purpose : '' }));
      setRangeStart({ room, date });
    }
    setEditing(keepEditing);
  }

  // FIX 2: "Change" brings the form into view, jumps the calendar to that booking's week and focuses the dates
  function edit(row) {
    if (row.owner !== 'you') return;
    setEditing(row.id); setRangeStart(null);
    setForm({ roomNumber: row.roomNumber, startDate: row.startDate, endDate: row.endDate, purpose: row.purpose });
    setWeek(mondayOf(row.startDate));
    setError(null); setNotice('');
    showForm(startInput);
  }

  function cancelEdit() { setEditing(null); setRangeStart(null); setForm({ ...formEmpty }); setError(null); setNotice(''); }

  function focusField(field) {
    const map = { roomNumber: roomInput, startDate: startInput, endDate: endInput, dates: startInput };
    map[field]?.current?.focus();
  }

  function submit(e) {
    e.preventDefault(); setNotice('');
    const err = issue(form, bookings, editing);
    if (err) { setError(err); focusField(err.field); return; }
    const payload = { roomNumber: form.roomNumber.trim(), startDate: form.startDate, endDate: form.endDate, purpose: form.purpose.trim(), owner: 'you' };
    const label = `${payload.roomNumber}, ${rangeLabel(payload.startDate, payload.endDate)}`;
    if (editing) {
      setBookings(bookings.map(b => b.id === editing ? { ...b, ...payload } : b));
      setNotice(`Booking updated: ${label}.`); setJustSaved(editing);
    } else {
      const id = 'b-' + Date.now();
      setBookings([...bookings, { ...payload, id }]);
      setNotice(`Room reserved: ${label}. It now appears under "Your bookings".`); setJustSaved(id);
    }
    setWeek(mondayOf(payload.startDate));
    setForm({ ...formEmpty }); setEditing(null); setError(null); setRangeStart(null);
  }

  function reset() {
    if (!window.confirm('Reset the demo? This removes all bookings you created or changed and restores the example data.')) return;
    setBookings(seed); setForm({ ...formEmpty }); setEditing(null); setRangeStart(null); setWeek('2026-11-09');
    setNotice('Example bookings restored.'); setError(null); setView('All rooms');
  }

  function check() {
    setNotice(''); setError(null);
    const e = issue(form, bookings, editing);
    if (e) { setError(e); focusField(e.field); }
    else setNotice(`${form.roomNumber.trim()} is free for ${rangeLabel(form.startDate, form.endDate)}.`);
  }

  const update = key => e => { setForm(f => ({ ...f, [key]: e.target.value })); setRangeStart(null); if (error) setError(null); };
  const bad = field => error && (error.field === field || (error.field === 'dates' && (field === 'startDate' || field === 'endDate')));
  const editingRow = bookings.find(b => b.id === editing);

  return <div className="room-app">
    <header className="topbar">
      <div className="mark"><span className="mark-sq">R</span><span><strong>room<span>grid</span></strong><small>Campus spaces</small></span></div>
      <nav>
        <button className={tab === 'Availability' ? 'selected' : ''} onClick={() => { setTab('Availability'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>Availability</button>
        <button className={tab === 'My bookings' ? 'selected' : ''} onClick={() => { setTab('My bookings'); document.getElementById('my-reservations')?.scrollIntoView({ behavior: 'smooth' }); }}>My bookings</button>
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
            <div className="weeknav">
              <button aria-label="Previous week" onClick={() => setWeek(addDays(week, -7))}>←</button>
              <strong>{human(week)} – {human(addDays(week, 6))}</strong>
              <button aria-label="Next week" onClick={() => setWeek(addDays(week, 7))}>→</button>
            </div>
          </div>
          <div className="calendar-controls">
            <label>Location <select value={view} onChange={e => setView(e.target.value)}><option>All rooms</option>{rooms.map(r => <option key={r}>{r}</option>)}</select></label>
            <span className="legend"><i className="free" /> Available</span>
            <span className="legend"><i className="booked" /> Reserved by others</span>
            <span className="legend"><i className="mine" /> Your booking</span>
            <span className="legend"><i className="picked" /> Your selection</span>
          </div>
          <p className="calendar-hint" aria-live="polite">
            {rangeStart
              ? <>Start set to <strong>{weekDay(rangeStart.date)} {human(rangeStart.date)}</strong> in <strong>{rangeStart.room}</strong>. Click a later day in the same row to set the last day, or adjust the dates in the form.</>
              : <>Click an open day to start a booking, then click a later day in the same row to extend it. Click one of your bookings to change it.</>}
          </p>
          <div className="calendar-scroll">
            <div className="room-cal">
              <div className="corner">ROOM / DATE</div>
              {days.map(d => <div className="dayhead" key={d}><strong>{weekDay(d)}</strong><span>{human(d)}</span></div>)}
              {roomList.map(room => <React.Fragment key={room}>
                <div className="roomname"><strong>{room}</strong><small>Study room · {room[0]}</small></div>
                {days.map(day => {
                  const b = occupied(room, day);
                  const isMine = b && b.owner === 'you';
                  const isEditingThis = b && b.id === editing;
                  const selected = inSelection(room, day);
                  const conflict = selected && b && !isEditingThis;
                  const state = isEditingThis ? 'available' : b ? (isMine ? 'mine' : 'taken') : 'available';
                  const label = isEditingThis ? 'Your booking being changed' : b ? (isMine ? 'Your booking — click to change' : 'Reserved by someone else') : 'Available — click to select';
                  return <button key={room + day}
                    className={`slot ${state}${selected ? ' picked' : ''}${conflict ? ' conflict' : ''}`}
                    disabled={state === 'taken' && !selected}
                    aria-label={`${room}, ${weekDay(day)} ${human(day)}: ${label}`}
                    title={label}
                    onClick={() => pick(room, day)}>
                    <span>{conflict ? '✕ Conflict' : selected ? '● Selected' : state === 'taken' ? 'Reserved' : state === 'mine' ? '★ Yours' : 'Open'}</span>
                    {state === 'mine' && !selected && <small>Click to change</small>}
                  </button>;
                })}
              </React.Fragment>)}
            </div>
          </div>
          <p className="calendar-note">End dates are exclusive: a booking ending on 12 Nov frees the room that day. Ranges in your bookings list show the last day you hold the room.</p>
          <section id="my-reservations" className="reservations">
            <div className="reservations-head"><h2>Your bookings</h2><span>{myBookings.length} current records</span></div>
            <div className="reservations-list">
              {myBookings.map(b => <article key={b.id} className={`reservation${b.id === editing ? ' is-editing' : ''}${b.id === justSaved ? ' just-saved' : ''}`}>
                <div className="room-chip">{b.roomNumber}</div>
                <div className="reservation-body"><strong>{rangeLabel(b.startDate, b.endDate)}</strong><small>{b.purpose || 'No purpose entered'}</small></div>
                <button type="button" className="change-btn" onClick={() => edit(b)} disabled={b.id === editing}>{b.id === editing ? 'Editing…' : 'Change'}</button>
              </article>)}
              {myBookings.length === 0 && <p>No reservations.</p>}
            </div>
          </section>
        </section>
        <aside className={`booking-pane${editing ? ' editing' : ''}`} id="booking-form" ref={formRef}>
          <div className="panel-tag"><span>{editing ? 'CHANGE BOOKING' : 'BOOK A ROOM'}</span><span>FORM 01</span></div>
          <h2>{editing ? 'Change reservation' : 'Make a reservation'}</h2>
          {editing && editingRow
            ? <p className="editing-banner">You are changing <strong>{editingRow.roomNumber}</strong>, {rangeLabel(editingRow.startDate, editingRow.endDate)}. Save to apply or cancel to keep it as it is.</p>
            : <p className="booking-description">Pick a day in the calendar or fill in the form to request a room for your study group, meeting or activity.</p>}
          {notice && <div className="success" role="status">{notice}</div>}
          {error && <div className="error" role="alert"><strong>Couldn't {editing ? 'save' : 'reserve'}:</strong> {error.message}</div>}
          <form onSubmit={submit} noValidate>
            <label><span>Room number</span>
              <input ref={roomInput} list="rooms" placeholder="e.g., B2-104" value={form.roomNumber} onChange={update('roomNumber')} aria-invalid={bad('roomNumber') || undefined} className={bad('roomNumber') ? 'invalid' : ''} />
              <datalist id="rooms">{rooms.map(r => <option key={r} value={r} />)}</datalist>
            </label>
            <div className="date-pair">
              <label><span>Start date</span><input ref={startInput} type="date" value={form.startDate} onChange={update('startDate')} aria-invalid={bad('startDate') || undefined} className={bad('startDate') ? 'invalid' : ''} /></label>
              <label><span>End date</span><input ref={endInput} type="date" min={form.startDate ? addDays(form.startDate, 1) : undefined} value={form.endDate} onChange={update('endDate')} aria-invalid={bad('endDate') || undefined} className={bad('endDate') ? 'invalid' : ''} /></label>
            </div>
            {validRange && <p className="range-summary">You'll hold the room <strong>{rangeLabel(form.startDate, form.endDate)}</strong>; it frees up on {human(form.endDate)}.</p>}
            <label><span>Purpose / optional</span><textarea rows="4" placeholder="Meeting, group study..." value={form.purpose} onChange={update('purpose')} /></label>
            <p className="helper">Start and end dates are required. Reservations cannot overlap existing bookings for the same room.</p>
            <button className="availability-check" type="button" onClick={check}>Check availability</button>
            <button className="reserve-button" type="submit">{editing ? 'Save changes' : 'Confirm booking'}</button>
            {editing && <button className="cancel-edit" type="button" onClick={cancelEdit}>Cancel editing</button>}
          </form>
          <div className="right-foot"><span>✦</span> Need a room for a group? Find an open date and submit your request.</div>
        </aside>
      </div>
    </main>
    <footer>ROOMGRID / Academic campus demo — local browser data only.</footer>
  </div>;
}
