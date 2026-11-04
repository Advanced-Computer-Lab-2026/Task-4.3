import React, { useEffect, useMemo, useState } from 'react';

const STORAGE = 'acl-roomgrid-18rooms-v1';
const rooms = [
  'A1-203', 'A2-106', 'A2-107', 'A3-208', 'A3-209',
  'B1-205', 'B1-206', 'B1-207', 'B2-104', 'B2-105',
  'B3-301', 'C1-102', 'C1-103', 'C2-201', 'C2-202',
  'C3-101', 'C3-102', 'D1-101'
];

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

const seed = sampleRows.map(([roomNumber, startDate, endDate, purpose, owner], index) => ({
  id: `demo-${index + 1}`,
  roomNumber,
  startDate,
  endDate,
  purpose,
  owner
}));

const formEmpty = { roomNumber: '', startDate: '', endDate: '', purpose: '' };

function read() {
  try {
    let a = JSON.parse(localStorage.getItem(STORAGE));
    return Array.isArray(a) ? a : seed;
  } catch {
    return seed;
  }
}

function addDays(iso, days) {
  const t = new Date(`${iso}T12:00:00Z`);
  t.setUTCDate(t.getUTCDate() + days);
  return t.toISOString().slice(0, 10);
}

// Aligns any ISO date to the Monday of its week so the calendar can jump to edited bookings (Fix #5)
function getMonday(iso) {
  if (!iso) return '2026-11-09';
  const t = new Date(`${iso}T12:00:00Z`);
  const day = t.getUTCDay();
  const diff = day === 0 ? -6 : 1 - day;
  t.setUTCDate(t.getUTCDate() + diff);
  return t.toISOString().slice(0, 10);
}

function human(iso) {
  return new Date(`${iso}T12:00:00Z`).toLocaleDateString('en-GB', {
    timeZone: 'UTC',
    day: 'numeric',
    month: 'short'
  });
}

function weekDay(iso) {
  return new Date(`${iso}T12:00:00Z`).toLocaleDateString('en-GB', {
    timeZone: 'UTC',
    weekday: 'short'
  });
}

function issue(form, bookings, id) {
  if (!form.roomNumber.trim() || !form.startDate || !form.endDate)
    return 'Complete the room and both dates.';
  if (form.endDate <= form.startDate)
    return 'End date must follow start date.';
  if (
    bookings.some(
      b =>
        b.id !== id &&
        b.roomNumber.toLowerCase() === form.roomNumber.trim().toLowerCase() &&
        form.startDate < b.endDate &&
        form.endDate > b.startDate
    )
  )
    return 'This room is already booked for some of those dates.';
  return '';
}

export default function App() {
  const [bookings, setBookings] = useState(read);
  const [week, setWeek] = useState('2026-11-09');
  const [view, setView] = useState('All rooms');
  const [form, setForm] = useState({ ...formEmpty });
  const [editing, setEditing] = useState(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [tab, setTab] = useState('Availability');

  useEffect(() => localStorage.setItem(STORAGE, JSON.stringify(bookings)), [bookings]);

  // Fix #5: Automatically sync active navigation tab with scroll position
  useEffect(() => {
    const onScroll = () => {
      const el = document.getElementById('my-reservations');
      if (!el) return;
      const rect = el.getBoundingClientRect();
      if (rect.top <= window.innerHeight * 0.45) {
        setTab('My bookings');
      } else {
        setTab('Availability');
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const days = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(week, i)), [week]);
  const myBookings = bookings
    .filter(b => b.owner === 'you')
    .sort((a, b) => a.startDate.localeCompare(b.startDate));
  const roomList = view === 'All rooms' ? rooms : rooms.filter(r => r === view);

  const occupied = (room, date) =>
    bookings.find(b => b.roomNumber === room && date >= b.startDate && date < b.endDate);

  // Fix #3: Check if a cell is currently part of the active form selection / edit range
  const isSelectedSlot = (room, date) => {
    if (!form.roomNumber || !form.startDate || !form.endDate) return false;
    return (
      form.roomNumber.trim().toLowerCase() === room.toLowerCase() &&
      date >= form.startDate &&
      date < form.endDate
    );
  };

  // Fix #3: Smart cell interaction — Open cells populate form; Your bookings open Edit mode; Others' bookings are blocked
  function handleCellClick(room, date, existingBooking) {
    if (existingBooking) {
      if (existingBooking.owner === 'you') {
        edit(existingBooking);
      }
      return;
    }
    setForm({
      roomNumber: room,
      startDate: date,
      endDate: addDays(date, 1),
      purpose: ''
    });
    setEditing(null);
    setError('');
    setNotice('');
    if (window.innerWidth <= 1200) {
      document.getElementById('booking-form')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }

  // Fix #2 & #5: Editing highlights the card, jumps calendar week to the booking's dates, and scrolls/focuses form
  function edit(row) {
    if (row.owner !== 'you') return;
    setEditing(row.id);
    setForm({
      roomNumber: row.roomNumber,
      startDate: row.startDate,
      endDate: row.endDate,
      purpose: row.purpose
    });
    setWeek(getMonday(row.startDate));
    setError('');
    setNotice('');
    if (window.innerWidth <= 1200) {
      document.getElementById('booking-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  function submit(e) {
    e.preventDefault();
    setNotice('');
    const err = issue(form, bookings, editing);
    if (err) {
      setError(err);
      return;
    }
    const payload = {
      roomNumber: form.roomNumber.trim(),
      startDate: form.startDate,
      endDate: form.endDate,
      purpose: form.purpose.trim(),
      owner: 'you'
    };
    if (editing) {
      setBookings(bookings.map(b => (b.id === editing ? { ...b, ...payload } : b)));
      setNotice(`Updated booking for ${payload.roomNumber} (${human(payload.startDate)} – ${human(payload.endDate)}).`);
    } else {
      setBookings([...bookings, { ...payload, id: 'b-' + Date.now() }]);
      setNotice(`Reserved ${payload.roomNumber} (${human(payload.startDate)} – ${human(payload.endDate)}).`);
    }
    setWeek(getMonday(payload.startDate));
    setForm({ ...formEmpty });
    setEditing(null);
    setError('');
  }

  function reset() {
    setBookings(seed);
    setForm({ ...formEmpty });
    setEditing(null);
    setWeek('2026-11-09');
    setNotice('Example bookings restored.');
    setError('');
    setView('All rooms');
  }

  function check() {
    setNotice('');
    setError('');
    let e = issue(form, bookings, editing);
    if (e) {
      setError(e);
    } else {
      setNotice('No conflict detected for the selected dates.');
    }
  }

  return (
    <div className="room-app">
      <header className="topbar">
        <div className="mark">
          <span className="mark-sq">R</span>
          <span>
            <strong>
              room<span>grid</span>
            </strong>
            <small>Campus spaces</small>
          </span>
        </div>
        <nav>
          <button
            className={tab === 'Availability' ? 'selected' : ''}
            onClick={() => {
              setTab('Availability');
              document.getElementById('calendar-section')?.scrollIntoView({ behavior: 'smooth' });
            }}
          >
            Availability
          </button>
          <button
            className={tab === 'My bookings' ? 'selected' : ''}
            onClick={() => {
              setTab('My bookings');
              document.getElementById('my-reservations')?.scrollIntoView({ behavior: 'smooth' });
            }}
          >
            My bookings ({myBookings.length})
          </button>
          <button onClick={reset}>Reset demo</button>
        </nav>
        <div className="member">
          <span>Student dashboard</span>
          <div className="profile">YOU</div>
        </div>
      </header>

      <main>
        <section className="intro">
          <div>
            <span className="eyebrow">SPACES / RESERVATIONS</span>
            <h1>Find room availability</h1>
            <p>Review campus rooms, dates and existing reservations in one view.</p>
          </div>
          <div className="intro-summary">
            <span>ROOMS IN DIRECTORY</span>
            <strong>{rooms.length.toString().padStart(2, '0')}</strong>
            <span>CURRENT RESERVATIONS</span>
            <strong>{bookings.length.toString().padStart(2, '0')}</strong>
          </div>
        </section>

        <div className="pagegrid">
          <section className="calendar-pane" id="calendar-section">
            <div className="calendar-head">
              <div>
                <span className="eyebrow">AVAILABILITY CALENDAR</span>
                <h2>Rooms by day</h2>
              </div>
              <div className="weeknav">
                <button aria-label="Previous week" onClick={() => setWeek(addDays(week, -7))}>
                  ←
                </button>
                <strong>
                  {human(week)} – {human(addDays(week, 6))}
                </strong>
                <button aria-label="Next week" onClick={() => setWeek(addDays(week, 7))}>
                  →
                </button>
              </div>
            </div>

            {/* Fix #4: 4-state visual legend including "Your booking" and "Selected in form" */}
            <div className="calendar-controls">
              <label>
                Location{' '}
                <select value={view} onChange={e => setView(e.target.value)}>
                  <option>All rooms</option>
                  {rooms.map(r => (
                    <option key={r}>{r}</option>
                  ))}
                </select>
              </label>
              <span className="legend">
                <i className="free" /> Available
              </span>
              <span className="legend">
                <i className="mine" /> Your booking (click to edit)
              </span>
              <span className="legend">
                <i className="booked" /> Reserved by others
              </span>
              <span className="legend">
                <i className="selected-swatch" /> Selected range
              </span>
              <p>Click an open day to book, or click your own booking to change it.</p>
            </div>

            {/* Fix #5: Sticky header scroll container so days remain visible across all 18 rooms */}
            <div className="calendar-scroll">
              <div className="room-cal">
                <div className="corner">ROOM / DATE</div>
                {days.map(d => (
                  <div className="dayhead" key={d}>
                    <strong>{weekDay(d)}</strong>
                    <span>{human(d)}</span>
                  </div>
                ))}
                {roomList.map(room => (
                  <React.Fragment key={room}>
                    <div className={'roomname ' + (form.roomNumber.trim() === room ? 'active-room-row' : '')}>
                      <strong>{room}</strong>
                      <small>Study room · {room[0]}</small>
                    </div>
                    {days.map(day => {
                      const b = occupied(room, day);
                      const isMine = b && b.owner === 'you';
                      const isOther = b && b.owner !== 'you';
                      const isSelected = isSelectedSlot(room, day);
                      const isBeingEdited = editing && b && b.id === editing;

                      let slotClass = 'slot ';
                      if (isMine) slotClass += 'mine ';
                      else if (isOther) slotClass += 'taken ';
                      else slotClass += 'available ';

                      if (isSelected) slotClass += 'selected-slot ';
                      if (isBeingEdited) slotClass += 'editing-slot ';

                      return (
                        <button
                          key={room + day}
                          type="button"
                          disabled={isOther}
                          title={
                            isMine
                              ? `${room}, ${day}: Your booking (${b.purpose || 'No purpose'}) — Click to change`
                              : isOther
                              ? `${room}, ${day}: Reserved (${b.purpose || 'Unavailable'})`
                              : `${room}, ${day}: Available — Click to select`
                          }
                          className={slotClass.trim()}
                          onClick={() => handleCellClick(room, day, b)}
                        >
                          <span>
                            {isMine ? 'Your Booking' : isOther ? 'Reserved' : isSelected ? 'Selected' : 'Open'}
                          </span>
                          {b ? (
                            <small>{isMine ? b.purpose || 'Click to change' : 'Unavailable'}</small>
                          ) : (
                            isSelected && <small>{editing ? 'Editing' : 'Draft'}</small>
                          )}
                        </button>
                      );
                    })}
                  </React.Fragment>
                ))}
              </div>
            </div>

            <p className="calendar-note">
              Cells show individual dates (end date is checkout/exclusive). Clicking "Your Booking" on the calendar or "Change" below loads it into the side panel and aligns the calendar week.
            </p>

            {/* Fix #2: Active card highlight & status badge when a booking is being edited */}
            <section id="my-reservations" className="reservations">
              <div className="reservations-head">
                <h2>Your bookings</h2>
                <span>{myBookings.length} current records</span>
              </div>
              <div className="reservations-list">
                {myBookings.map(b => {
                  const isEditingThis = editing === b.id;
                  return (
                    <article
                      key={b.id}
                      className={'reservation ' + (isEditingThis ? 'is-editing' : '')}
                    >
                      <div className="room-chip">{b.roomNumber}</div>
                      <div className="reservation-body">
                        <strong>
                          {human(b.startDate)} – {human(b.endDate)}
                        </strong>
                        <small>{b.purpose || 'No purpose entered'}</small>
                      </div>
                      <button
                        type="button"
                        className={isEditingThis ? 'editing-btn' : ''}
                        onClick={() => edit(b)}
                      >
                        {isEditingThis ? 'Editing…' : 'Change'}
                      </button>
                    </article>
                  );
                })}
                {myBookings.length === 0 && <p>No reservations.</p>}
              </div>
            </section>
          </section>

          {/* Fix #2: Sticky booking pane with clear "Editing Mode" visual state */}
          <aside className={'booking-pane ' + (editing ? 'editing-mode' : '')} id="booking-form">
            <div className="panel-tag">
              <span>{editing ? 'EDITING RESERVATION' : 'BOOK A ROOM'}</span>
              <span>{editing ? 'EDIT MODE' : 'FORM 01'}</span>
            </div>
            <h2>{editing ? `Change ${form.roomNumber}` : 'Make a reservation'}</h2>
            <p className="booking-description">
              {editing
                ? 'Adjust your dates, room, or purpose below. Your selected range is outlined on the calendar.'
                : 'Click an open cell on the calendar or enter details below to request a room.'}
            </p>

            {notice && (
              <div className="success" role="status">
                {notice}
              </div>
            )}
            {error && (
              <div className="error" role="alert">
                {error}
              </div>
            )}

            <form onSubmit={submit}>
              <label>
                <span>Room number</span>
                <input
                  list="rooms"
                  placeholder="e.g., B2-104"
                  value={form.roomNumber}
                  onChange={e => setForm(f => ({ ...f, roomNumber: e.target.value }))}
                />
                <datalist id="rooms">
                  {rooms.map(r => (
                    <option key={r} value={r} />
                  ))}
                </datalist>
              </label>

              <div className="date-pair">
                <label>
                  <span>Start date (check-in)</span>
                  <input
                    type="date"
                    value={form.startDate}
                    onChange={e => {
                      const val = e.target.value;
                      setForm(f => ({ ...f, startDate: val }));
                      if (val) setWeek(getMonday(val));
                    }}
                  />
                </label>
                <label>
                  <span>End date (checkout)</span>
                  <input
                    type="date"
                    value={form.endDate}
                    onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))}
                  />
                </label>
              </div>

              <label>
                <span>Purpose / optional</span>
                <textarea
                  rows="4"
                  placeholder="Meeting, group study..."
                  value={form.purpose}
                  onChange={e => setForm(f => ({ ...f, purpose: e.target.value }))}
                />
              </label>

              <p className="helper">
                Start and end dates are required. End date is exclusive (e.g., 9 Nov to 11 Nov reserves the 9th and 10th).
              </p>

              <button className="availability-check" type="button" onClick={check}>
                Check availability
              </button>
              <button className="reserve-button" type="submit">
                {editing ? 'Save changes' : 'Confirm booking'}
              </button>
              {editing && (
                <button
                  className="cancel-edit"
                  type="button"
                  onClick={() => {
                    setEditing(null);
                    setForm({ ...formEmpty });
                    setError('');
                  }}
                >
                  Cancel editing
                </button>
              )}
            </form>

            <div className="right-foot">
              <span>✦</span> Need a room for a group? Find an open date and submit your request.
            </div>
          </aside>
        </div>
      </main>

      <footer>ROOMGRID / Academic campus demo — local browser data only.</footer>
    </div>
  );
}