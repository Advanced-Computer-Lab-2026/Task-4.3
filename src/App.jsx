import React, { useEffect, useRef, useState } from 'react';

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
const FIELD_IDS = { roomNumber: 'room-number', startDate: 'start-date', endDate: 'end-date' };

function read() {
  try {
    const raw = localStorage.getItem(STORAGE);
    if (raw === null) return { bookings: seed.map(row => ({ ...row })), needsInitialSave: true };
    const saved = JSON.parse(raw);
    const ids = new Set();
    if (!Array.isArray(saved) || !saved.every(row => {
      if (!row || typeof row.id !== 'string' || !row.id || ids.has(row.id) ||
          typeof row.roomNumber !== 'string' || !row.roomNumber.trim() ||
          !isDate(row.startDate) || !isDate(row.endDate) || row.endDate <= row.startDate ||
          (row.purpose !== undefined && typeof row.purpose !== 'string') || typeof row.owner !== 'string') return false;
      ids.add(row.id);
      return true;
    })) throw new Error('Invalid saved reservations');
    return { bookings: saved };
  } catch {
    // Preserve unreadable data for recovery; only an explicit reset may replace it.
    return {
      bookings: seed.map(row => ({ ...row })),
      storageBlocked: true,
      storageError: 'Saved bookings could not be read. Example rooms are shown for reference. Your stored data has been kept unchanged. Use Reset demo to replace it with the examples.',
    };
  }
}

function isDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value) || value.startsWith('0000')) return false;
  const date = new Date(`${value}T12:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function addDays(iso, days) {
  const date = new Date(`${iso}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function shortDate(iso) {
  return new Date(`${iso}T12:00:00Z`).toLocaleDateString('en-GB', { timeZone: 'UTC', day: 'numeric', month: 'short' });
}

function fullDate(iso) {
  return new Date(`${iso}T12:00:00Z`).toLocaleDateString('en-GB', { timeZone: 'UTC', day: 'numeric', month: 'short', year: 'numeric' });
}

function weekDay(iso) {
  return new Date(`${iso}T12:00:00Z`).toLocaleDateString('en-GB', { timeZone: 'UTC', weekday: 'short' });
}

function weekContaining(iso) {
  const date = new Date(`${iso}T12:00:00Z`);
  const weekday = date.getUTCDay();
  const delta = weekday === 0 ? -6 : 1 - weekday;
  return addDays(iso, delta);
}

function describeStay(start, end) {
  const lastUsed = addDays(end, -1);
  if (lastUsed <= start) return `In use on ${fullDate(start)}. Free from ${fullDate(end)}.`;
  return `In use ${fullDate(start)} – ${fullDate(lastUsed)}. Free from ${fullDate(end)}.`;
}

// One overlap rule for search, the calendar, and submit. End dates are exclusive.
function conflictingBooking(bookings, roomNumber, startDate, endDate, ignoreId) {
  const room = roomNumber.trim().toLowerCase();
  return bookings.find(booking => booking.id !== ignoreId && booking.roomNumber.toLowerCase() === room && startDate < booking.endDate && endDate > booking.startDate);
}

function assess(form, bookings, ignoreId) {
  const fields = [];
  if (!form.roomNumber.trim()) fields.push('roomNumber');
  if (!form.startDate) fields.push('startDate');
  if (!form.endDate) fields.push('endDate');
  if (fields.length) return { message: 'Complete the room and both dates.', fields };
  const invalidDates = ['startDate', 'endDate'].filter(field => !isDate(form[field]));
  if (invalidDates.length) return { message: 'Enter valid dates in YYYY-MM-DD format.', fields: invalidDates };
  if (form.endDate <= form.startDate) return { message: 'End date must follow start date.', fields: ['endDate'] };
  if (conflictingBooking(bookings, form.roomNumber, form.startDate, form.endDate, ignoreId)) {
    return { message: 'This room is already booked for some of those dates.', fields: ['startDate', 'endDate'] };
  }
  return { message: '', fields: [] };
}

function classes(...parts) {
  return parts.filter(Boolean).join(' ');
}

export default function App() {
  const [storage, setStorage] = useState(read);
  const { bookings, storageError, storageBlocked } = storage;
  const [week, setWeek] = useState('2026-11-09');
  const [roomFilter, setRoomFilter] = useState('All rooms');
  const [form, setForm] = useState({ ...formEmpty });
  const [editing, setEditing] = useState(null);
  const [error, setError] = useState('');
  const [invalidFields, setInvalidFields] = useState([]);
  const [notice, setNotice] = useState('');
  const [tab, setTab] = useState('Availability');
  const [stayStart, setStayStart] = useState('');
  const [stayEnd, setStayEnd] = useState('');
  const [inspectedId, setInspectedId] = useState(null);
  const [focusTarget, setFocusTarget] = useState('');
  const inspectedTrigger = useRef(null);

  useEffect(() => {
    if (!storage.needsInitialSave) return;
    try {
      localStorage.setItem(STORAGE, JSON.stringify(bookings));
      setStorage({ bookings });
    } catch {
      setStorage({ bookings, storageError: 'Bookings could not be saved in this browser. Check browser storage and try again. No reservation was saved.' });
    }
  }, [storage, bookings]);

  useEffect(() => {
    if (!focusTarget) return;
    const target = document.getElementById(focusTarget);
    const formTarget = focusTarget === 'booking-heading' || focusTarget === 'form-notice' || focusTarget === 'room-number' || focusTarget === 'start-date' || focusTarget === 'end-date';
    const anchor = formTarget ? document.getElementById('booking-form') : target;
    anchor?.scrollIntoView({ behavior: 'auto', block: 'start' });
    target?.focus();
    setFocusTarget('');
  }, [focusTarget]);

  useEffect(() => {
    if (!inspectedId) return undefined;
    function onKey(event) {
      if (event.key === 'Escape') closeInspection();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [inspectedId]);

  const days = Array.from({ length: 7 }, (_, index) => addDays(week, index));
  const myBookings = bookings.filter(booking => booking.owner === 'you').sort((a, b) => a.startDate.localeCompare(b.startDate));
  const visibleRooms = roomFilter === 'All rooms' ? rooms : rooms.filter(room => room === roomFilter);
  const stayReady = Boolean(isDate(stayStart) && isDate(stayEnd) && stayEnd > stayStart);
  const stayInvalid = Boolean(stayStart && stayEnd && !stayReady);
  const stayState = Object.fromEntries(rooms.map(room => {
    if (!stayReady) return [room, ''];
    if (conflictingBooking(bookings, room, stayStart, stayEnd, editing)) return [room, 'busy'];
    if (editing && conflictingBooking(bookings, room, stayStart, stayEnd, null)) return [room, 'current'];
    return [room, 'free'];
  }));
  const freeRooms = stayReady ? rooms.filter(room => stayState[room] === 'free' || stayState[room] === 'current') : [];
  const stayOutsideWeek = stayReady && (stayStart < week || stayEnd > addDays(week, 7));
  const inspected = bookings.find(booking => booking.id === inspectedId) || null;
  const editingBooking = bookings.find(booking => booking.id === editing) || null;

  function updateField(field, value) {
    setForm(current => ({ ...current, [field]: value }));
    setError('');
    setInvalidFields([]);
    setNotice('');
  }

  function applyResult(result) {
    if (!result.message) {
      setError('');
      setInvalidFields([]);
      return true;
    }
    setNotice('');
    setError(result.message);
    setInvalidFields(result.fields);
    setFocusTarget(FIELD_IDS[result.fields[0]] || 'form-error');
    return false;
  }

  function chooseRoom(room) {
    setForm(current => ({ ...current, roomNumber: room, startDate: stayStart, endDate: stayEnd }));
    setError('');
    setInvalidFields([]);
    setNotice('');
    setInspectedId(null);
    setFocusTarget('booking-heading');
  }

  function useOpenDay(room, date) {
    setForm(current => ({
      roomNumber: room,
      startDate: date,
      endDate: addDays(date, 1),
      purpose: editing ? current.purpose : '',
    }));
    setError('');
    setInvalidFields([]);
    setNotice('');
    setInspectedId(null);
    setFocusTarget('booking-heading');
  }

  function inspectBooking(booking, trigger) {
    inspectedTrigger.current = trigger;
    setInspectedId(booking.id);
    setFocusTarget('reservation-detail-heading');
  }

  function closeInspection() {
    setInspectedId(null);
    inspectedTrigger.current?.focus();
  }

  function navigateTabs(event) {
    const order = ['Availability', 'My bookings'];
    let next;
    if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') next = order[1 - order.indexOf(tab)];
    else if (event.key === 'Home') next = order[0];
    else if (event.key === 'End') next = order[1];
    else return;
    event.preventDefault();
    setTab(next);
    document.getElementById(next === 'Availability' ? 'availability-tab' : 'my-bookings-tab')?.focus();
  }

  function saveBookings(next, resetStorage = false) {
    if (storageBlocked && !resetStorage) return false;
    try {
      // Persist before reporting success so a failed write leaves the draft and data intact.
      localStorage.setItem(STORAGE, JSON.stringify(next));
      setStorage({ bookings: next });
      return true;
    } catch {
      setStorage(current => ({ ...current, needsInitialSave: false, storageError: 'Bookings could not be saved in this browser. Check browser storage and try again. No reservation was saved.' }));
      setNotice('');
      setFocusTarget('storage-error');
      return false;
    }
  }

  function edit(row) {
    if (!row || row.owner !== 'you') return;
    setEditing(row.id);
    setForm({ roomNumber: row.roomNumber, startDate: row.startDate, endDate: row.endDate, purpose: row.purpose || '' });
    setError('');
    setInvalidFields([]);
    setNotice('');
    setInspectedId(null);
    setFocusTarget('booking-heading');
  }

  function cancelEdit() {
    setEditing(null);
    setForm({ ...formEmpty });
    setError('');
    setInvalidFields([]);
    setNotice('');
    setFocusTarget(tab === 'My bookings' ? 'my-bookings-heading' : 'availability-heading');
  }

  function submit(event) {
    event.preventDefault();
    const result = assess(form, bookings, editing);
    if (!applyResult(result)) return;
    if (editing) {
      const current = bookings.find(booking => booking.id === editing);
      if (!current || current.owner !== 'you') {
        setNotice('');
        setError('You can only change your own bookings.');
        setInvalidFields([]);
        setFocusTarget('booking-heading');
        return;
      }
    }
    const roomNumber = rooms.find(room => room.toLowerCase() === form.roomNumber.trim().toLowerCase()) || form.roomNumber.trim();
    const payload = { roomNumber, startDate: form.startDate, endDate: form.endDate, purpose: form.purpose.trim(), owner: 'you' };
    const next = editing
      ? bookings.map(booking => booking.id === editing ? { ...booking, ...payload } : booking)
      : [...bookings, { ...payload, id: `b-${crypto.randomUUID()}` }];
    if (!saveBookings(next)) return;
    setNotice(`${editing ? 'Booking updated.' : 'Room reserved.'} ${payload.roomNumber}: ${describeStay(payload.startDate, payload.endDate)}`);
    setForm({ ...formEmpty });
    setEditing(null);
    setError('');
    setInvalidFields([]);
    setFocusTarget('form-notice');
  }

  function check() {
    const result = assess(form, bookings, editing);
    if (!applyResult(result)) return;
    setNotice(`No conflict detected for the selected dates. ${describeStay(form.startDate, form.endDate)}`);
    setFocusTarget('form-notice');
  }

  function reset() {
    if (!saveBookings(seed.map(row => ({ ...row })), true)) return;
    setForm({ ...formEmpty });
    setEditing(null);
    setWeek('2026-11-09');
    setRoomFilter('All rooms');
    setTab('Availability');
    setStayStart('');
    setStayEnd('');
    setInspectedId(null);
    setNotice('Example bookings restored.');
    setError('');
    setInvalidFields([]);
    setFocusTarget('form-notice');
  }

  function describedBy(field) {
    const ids = [];
    if (error && invalidFields.includes(field)) ids.push('form-error');
    if (field === 'endDate') ids.push('end-date-hint');
    ids.push('booking-help');
    return ids.join(' ');
  }

  return (
    <div className="room-app">
      <a className="skip" href="#main">Skip to content</a>
      <header className="topbar">
        <div className="mark">
          <span className="mark-sq" aria-hidden="true">R</span>
          <span>
            <strong>room<span>grid</span></strong>
            <small>Campus spaces</small>
          </span>
        </div>
        <nav className="main-nav" aria-label="Primary">
          <div className="view-switch" role="tablist" aria-label="Booking views" onKeyDown={navigateTabs}>
            <button type="button" role="tab" id="availability-tab" tabIndex={tab === 'Availability' ? 0 : -1} aria-selected={tab === 'Availability'} aria-controls={tab === 'Availability' ? 'availability-panel' : undefined} className={tab === 'Availability' ? 'selected' : ''} onClick={() => setTab('Availability')}>Availability</button>
            <button type="button" role="tab" id="my-bookings-tab" tabIndex={tab === 'My bookings' ? 0 : -1} aria-selected={tab === 'My bookings'} aria-controls={tab === 'My bookings' ? 'my-bookings-panel' : undefined} className={tab === 'My bookings' ? 'selected' : ''} onClick={() => setTab('My bookings')}>
              My bookings <span className="tab-count">{myBookings.length}</span>
            </button>
          </div>
          <button type="button" className="reset-demo" onClick={reset}>Reset demo</button>
        </nav>
        <p className="member"><span>Signed in as you</span><span className="profile" aria-hidden="true">YOU</span></p>
      </header>
      <main id="main">
        <div className="pagegrid">
          <div className="primary">
            {tab === 'Availability' ? (
              <section role="tabpanel" id="availability-panel" aria-labelledby="availability-tab" className="panel">
                <div className="intro">
                  <div>
                    <p className="eyebrow">Spaces / reservations</p>
                    <h1 id="availability-heading" tabIndex={-1}>Find room availability</h1>
                    <p>Choose the whole stay first, then select a room that is free for every day of it.</p>
                  </div>
                  <dl className="intro-summary">
                    <div><dt>Rooms in directory</dt><dd>{rooms.length}</dd></div>
                    <div><dt>Current reservations</dt><dd>{bookings.length}</dd></div>
                  </dl>
                </div>
                <section className="finder" aria-labelledby="finder-heading">
                  <div className="finder-copy">
                    <h2 id="finder-heading">Find a room for your dates</h2>
                    <p>The end date is the first morning the room is free again. A stay ending 11 Nov uses the room through 10 Nov.</p>
                  </div>
                  <div className="date-pair">
                    <div className="field">
                      <label htmlFor="stay-start">Start date</label>
                      <input id="stay-start" type="date" value={stayStart} aria-invalid={stayInvalid || undefined} aria-describedby={stayInvalid ? 'stay-error' : undefined} onChange={event => setStayStart(event.target.value)} />
                    </div>
                    <div className="field">
                      <label htmlFor="stay-end">End date</label>
                      <input id="stay-end" type="date" value={stayEnd} aria-invalid={stayInvalid || undefined} aria-describedby={stayInvalid ? 'stay-error stay-end-hint' : 'stay-end-hint'} onChange={event => setStayEnd(event.target.value)} />
                      <span className="field-hint" id="stay-end-hint">First morning the room is free</span>
                    </div>
                  </div>
                  {stayInvalid && <p className="field-error" id="stay-error" role="alert">{isDate(stayStart) && isDate(stayEnd) ? 'End date must follow start date.' : 'Enter valid dates in YYYY-MM-DD format.'}</p>}
                  {!stayStart || !stayEnd ? <p className="finder-prompt">Choose both dates to see which rooms are free for the entire stay.</p> : null}
                  {stayReady && (
                    <div className="finder-results">
                      <p className="result-count" role="status">{freeRooms.length} of {rooms.length} rooms can be reserved for the whole stay.</p>
                      <p>{describeStay(stayStart, stayEnd)}</p>
                      {stayOutsideWeek && (
                        <p className="range-note">
                          This stay includes dates outside {shortDate(days[0])} – {shortDate(days[6])}. The result above still covers the full stay, including days not shown in the week grid.
                          <button type="button" onClick={() => setWeek(weekContaining(stayStart))}>Show the week of {shortDate(stayStart)}</button>
                        </p>
                      )}
                      {freeRooms.length === 0 ? <p>No room is free for every day of this stay. Try different dates.</p> : (
                        <ul className="room-choices">
                          {freeRooms.map(room => (
                            <li key={room}>
                              <button type="button" className="room-choice" onClick={() => chooseRoom(room)} aria-label={stayState[room] === 'current' ? `Use ${room} for this edit. It does not conflict with another booking.` : `Select ${room}, free for the whole stay`}>
                                <strong>{room}</strong>
                                <span>{stayState[room] === 'current' ? 'Use for this edit' : 'Select'}</span>
                              </button>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}
                </section>
                <section className="calendar-pane" aria-labelledby="calendar-heading">
                  <div className="calendar-head">
                    <div>
                      <p className="eyebrow">Availability calendar</p>
                      <h2 id="calendar-heading">Rooms by day</h2>
                    </div>
                    <div className="weeknav">
                      <button type="button" aria-label="Previous week" onClick={() => setWeek(addDays(week, -7))}>←</button>
                      <p>{shortDate(days[0])} – {shortDate(days[6])}</p>
                      <button type="button" aria-label="Next week" onClick={() => setWeek(addDays(week, 7))}>→</button>
                    </div>
                  </div>
                  <div className="calendar-controls">
                    <div className="field inline-field">
                      <label htmlFor="calendar-room">Show room</label>
                      <select id="calendar-room" value={roomFilter} onChange={event => setRoomFilter(event.target.value)}>
                        <option>All rooms</option>
                        {rooms.map(room => <option key={room}>{room}</option>)}
                      </select>
                    </div>
                    <ul className="legend">
                      <li><span className="swatch free" aria-hidden="true" />Available</li>
                      <li><span className="swatch busy" aria-hidden="true" />Reserved</li>
                    </ul>
                  </div>
                  {inspected && (
                    <section className="reservation-detail" id="reservation-detail" aria-labelledby="reservation-detail-heading">
                      <div>
                        <h3 id="reservation-detail-heading" tabIndex={-1}>{inspected.roomNumber} is reserved</h3>
                        <p>{describeStay(inspected.startDate, inspected.endDate)}</p>
                        <p>{inspected.purpose || 'No purpose entered'}</p>
                        <p>{inspected.owner === 'you' ? 'This is your booking.' : 'Reserved by another student. You can view it, but only your own bookings can be changed.'}</p>
                      </div>
                      <div className="detail-actions">
                        {inspected.owner === 'you' && <button type="button" id="edit-inspected" onClick={() => edit(inspected)}>Edit this booking</button>}
                        <button type="button" onClick={closeInspection}>Close</button>
                      </div>
                    </section>
                  )}
                  <p className="swipe-hint">Swipe sideways to see the rest of the week. Room names stay visible.</p>
                  <div className="calendar-scroll">
                    <div className="room-cal">
                      <div className="corner">Room / date</div>
                      {days.map(day => <div className="dayhead" key={day}><strong>{weekDay(day)}</strong><span>{shortDate(day)}</span></div>)}
                      {visibleRooms.map(room => {
                        const state = stayState[room];
                        const badge = state === 'free' ? 'Free for your dates' : state === 'current' ? 'Fits this edit' : state === 'busy' ? 'Busy for your dates' : '';
                        return (
                          <React.Fragment key={room}>
                            <div className={classes('roomname', state === 'free' && 'is-free', state === 'current' && 'is-current', state === 'busy' && 'is-busy')}>
                              <strong>{room}</strong>
                              <small>Study room · {room[0]}</small>
                              {badge && <span className="range-badge">{badge}</span>}
                            </div>
                            {days.map(day => {
                              const booking = conflictingBooking(bookings, room, day, addDays(day, 1), null);
                              const inStay = stayReady && day >= stayStart && day < stayEnd;
                              const label = booking
                                ? `${room}, ${fullDate(day)}, booked, ${booking.owner === 'you' ? 'your booking' : 'reserved by another student'}. View reservation`
                                : `${room}, ${fullDate(day)}, available. Add this day to the form`;
                              return (
                                <button
                                  key={room + day}
                                  type="button"
                                  data-room={room}
                                  data-date={day}
                                  aria-label={label}
                                  className={classes('slot', booking ? 'taken' : 'available', inStay && 'in-stay')}
                                  onClick={event => booking ? inspectBooking(booking, event.currentTarget) : useOpenDay(room, day)}
                                >
                                  <span>{booking ? 'Booked' : 'Open'}</span>
                                  {booking && <small>{booking.owner === 'you' ? 'Your booking' : 'Reserved'}</small>}
                                </button>
                              );
                            })}
                          </React.Fragment>
                        );
                      })}
                    </div>
                  </div>
                  <p className="calendar-note">A booked day opens that reservation and does not start another request on top of it. The end date is the first free morning, so that morning is shown as Open. Select a free room above to reserve the whole stay, or choose an Open day to start from that single day.</p>
                </section>
              </section>
            ) : (
              <section role="tabpanel" id="my-bookings-panel" aria-labelledby="my-bookings-tab" className="panel">
                <div className="intro">
                  <div>
                    <p className="eyebrow">Signed in as you</p>
                    <h1 id="my-bookings-heading" tabIndex={-1}>Your bookings</h1>
                    <p>These are only your reservations. Edit one to change the room or dates. Another student’s booking cannot be changed here.</p>
                  </div>
                  <button type="button" className="secondary-button" onClick={() => setTab('Availability')}>Browse availability</button>
                </div>
                <p className="record-count">{myBookings.length} {myBookings.length === 1 ? 'booking' : 'bookings'}</p>
                {myBookings.length === 0 ? <p className="empty-state">No reservations yet. Browse availability to reserve a room.</p> : (
                  <div className="reservations-list">
                    {myBookings.map(booking => (
                      <article key={booking.id} className={classes('reservation', editing === booking.id && 'is-editing')}>
                        <p className="room-id">{booking.roomNumber}</p>
                        <p className="stay-range">{fullDate(booking.startDate)} – {fullDate(booking.endDate)}</p>
                        <p className="stay-note">{describeStay(booking.startDate, booking.endDate)}</p>
                        <p className="purpose">{booking.purpose || 'No purpose entered'}</p>
                        {editing === booking.id && <p className="editing-flag">Currently editing</p>}
                        <button type="button" className="edit-button" onClick={() => edit(booking)} aria-label={`Edit your booking for ${booking.roomNumber}, ${fullDate(booking.startDate)} to ${fullDate(booking.endDate)}`}>Edit</button>
                      </article>
                    ))}
                  </div>
                )}
              </section>
            )}
          </div>
          <aside className={classes('booking-pane', editing && 'is-editing')} id="booking-form" aria-labelledby="booking-heading">
            <p className="panel-tag"><span>{editing ? 'Edit your booking' : 'Book a room'}</span><span>Signed in as you</span></p>
            <h2 id="booking-heading" tabIndex={-1}>{editing ? `Editing ${editingBooking?.roomNumber || form.roomNumber}` : 'Make a reservation'}</h2>
            {storageError && <p className="field-error" id="storage-error" role="alert" tabIndex={-1}>{storageError}</p>}
            {editing && (
              <p className="editing-banner">
                You are editing your own booking{form.roomNumber ? ` for ${form.roomNumber}` : ''}.
                {form.startDate && form.endDate && form.endDate > form.startDate ? ` ${describeStay(form.startDate, form.endDate)}` : ''}
              </p>
            )}
            <form onSubmit={submit} noValidate>
              {notice && <p className="success" id="form-notice" role="status" tabIndex={-1}>{notice}</p>}
              <div className="field">
                <label htmlFor="room-number">Room number</label>
                <input id="room-number" list="rooms" placeholder="e.g., B2-104" value={form.roomNumber} aria-required="true" aria-invalid={invalidFields.includes('roomNumber') || undefined} aria-describedby={describedBy('roomNumber')} onChange={event => updateField('roomNumber', event.target.value)} />
                <datalist id="rooms">{rooms.map(room => <option key={room} value={room} />)}</datalist>
              </div>
              <div className="date-pair">
                <div className="field">
                  <label htmlFor="start-date">Start date</label>
                  <input id="start-date" type="date" value={form.startDate} aria-required="true" aria-invalid={invalidFields.includes('startDate') || undefined} aria-describedby={describedBy('startDate')} onChange={event => updateField('startDate', event.target.value)} />
                </div>
                <div className="field">
                  <label htmlFor="end-date">End date</label>
                  <span className="field-hint" id="end-date-hint">First morning the room is free</span>
                  <input id="end-date" type="date" value={form.endDate} aria-required="true" aria-invalid={invalidFields.includes('endDate') || undefined} aria-describedby={describedBy('endDate')} onChange={event => updateField('endDate', event.target.value)} />
                </div>
              </div>
              {error && <p className="field-error" id="form-error" role="alert">{error}</p>}
              <div className="field">
                <label htmlFor="purpose">Purpose, optional</label>
                <textarea id="purpose" rows="3" placeholder="Meeting, group study..." value={form.purpose} onChange={event => updateField('purpose', event.target.value)} />
              </div>
              <p className="helper" id="booking-help">Start and end dates are required and saved as YYYY-MM-DD. The end date must be after the start date, and it is the first morning the room is free again. Reservations cannot overlap another booking for the same room. Purpose can be left blank.</p>
              <button className="availability-check" id="check-availability" type="button" onClick={check}>Check availability</button>
              <button className="reserve-button" id="reserve-button" type="submit">{editing ? 'Save booking' : 'Confirm booking'}</button>
              {editing && <button className="cancel-edit" type="button" onClick={cancelEdit}>Cancel editing and keep browsing</button>}
            </form>
          </aside>
        </div>
      </main>
      <footer>Roomgrid / Academic campus demo — local browser data only.</footer>
    </div>
  );
}
