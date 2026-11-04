
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

const seed = sampleRows.map(
  ([roomNumber, startDate, endDate, purpose, owner], index) => ({
    id: `demo-${index + 1}`,
    roomNumber,
    startDate,
    endDate,
    purpose,
    owner
  })
);

const formEmpty = {
  roomNumber: '',
  startDate: '',
  endDate: '',
  purpose: ''
};

function read() {
  try {
    const data = JSON.parse(localStorage.getItem(STORAGE));
    return Array.isArray(data) ? data : seed;
  } catch {
    return seed;
  }
}

function addDays(iso, days) {
  const date = new Date(`${iso}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
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

// Validate individual fields and booking conflicts.
function validate(form, bookings, id) {
  const fieldErrors = {
    roomNumber: '',
    startDate: '',
    endDate: ''
  };

  const roomNumber = form.roomNumber.trim();

  if (!roomNumber) {
    fieldErrors.roomNumber = 'Room number is required.';
  } else if (
    !rooms.some(room => room.toLowerCase() === roomNumber.toLowerCase())
  ) {
    fieldErrors.roomNumber = 'Choose a room from the room directory.';
  }

  if (!form.startDate) {
    fieldErrors.startDate = 'Start date is required.';
  }

  if (!form.endDate) {
    fieldErrors.endDate = 'End date is required.';
  }

  if (
    form.startDate &&
    form.endDate &&
    form.endDate <= form.startDate
  ) {
    fieldErrors.endDate = 'End date must be after the start date.';
  }

  const hasFieldErrors = Object.values(fieldErrors).some(Boolean);

  const generalError =
    !hasFieldErrors &&
    bookings.some(
      booking =>
        booking.id !== id &&
        booking.roomNumber.toLowerCase() === roomNumber.toLowerCase() &&
        form.startDate < booking.endDate &&
        form.endDate > booking.startDate
    )
      ? 'This room is already booked for some of those dates. Choose another date range.'
      : '';

  return {
    fieldErrors,
    generalError,
    valid: !hasFieldErrors && !generalError
  };
}

export default function App() {
  const [bookings, setBookings] = useState(read);
  const [week, setWeek] = useState('2026-11-09');
  const [view, setView] = useState('All rooms');
  const [form, setForm] = useState({ ...formEmpty });
  const [editing, setEditing] = useState(null);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({
    roomNumber: '',
    startDate: '',
    endDate: ''
  });
  const [checkState, setCheckState] = useState('');
  const [notice, setNotice] = useState('');
  const [tab, setTab] = useState('Availability');

  useEffect(() => {
    localStorage.setItem(STORAGE, JSON.stringify(bookings));
  }, [bookings]);

  const days = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(week, i)),
    [week]
  );

  const myBookings = bookings
    .filter(booking => booking.owner === 'you')
    .sort((a, b) => a.startDate.localeCompare(b.startDate));

  const roomList =
    view === 'All rooms' ? rooms : rooms.filter(room => room === view);

  const occupied = (room, date) =>
    bookings.find(
      booking =>
        booking.roomNumber === room &&
        date >= booking.startDate &&
        date < booking.endDate
    );

  function pick(room, date) {
    setForm({
      roomNumber: room,
      startDate: date,
      endDate: addDays(date, 1),
      purpose: ''
    });

    setEditing(null);
    setError('');
    setFieldErrors({
      roomNumber: '',
      startDate: '',
      endDate: ''
    });
    setCheckState('');

    document.getElementById('booking-form')?.scrollIntoView({
      behavior: 'smooth',
      block: 'nearest'
    });
  }

  function updateField(field, value) {
    setForm(previous => ({
      ...previous,
      [field]: value
    }));

    setFieldErrors(previous => ({
      ...previous,
      [field]: ''
    }));

    setError('');
    setNotice('');
    setCheckState('');
  }

  function edit(row) {
    if (row.owner !== 'you') return;

    setEditing(row.id);

    setForm({
      roomNumber: row.roomNumber,
      startDate: row.startDate,
      endDate: row.endDate,
      purpose: row.purpose
    });

    setError('');
    setFieldErrors({
      roomNumber: '',
      startDate: '',
      endDate: ''
    });
    setCheckState('');
    setNotice('');
  }

  function submit(event) {
    event.preventDefault();
    setNotice('');
    setCheckState('');

    const result = validate(form, bookings, editing);

    setFieldErrors(result.fieldErrors);
    setError(result.generalError);

    if (!result.valid) return;

    const payload = {
      roomNumber: form.roomNumber.trim(),
      startDate: form.startDate,
      endDate: form.endDate,
      purpose: form.purpose.trim(),
      owner: 'you'
    };

    if (editing) {
      setBookings(previous =>
        previous.map(booking =>
          booking.id === editing
            ? { ...booking, ...payload }
            : booking
        )
      );

      setNotice('Booking updated.');
    } else {
      setBookings(previous => [
        ...previous,
        {
          ...payload,
          id: 'b-' + Date.now()
        }
      ]);

      setNotice('Room reserved.');
    }

    setForm({ ...formEmpty });
    setEditing(null);
    setError('');
    setFieldErrors({
      roomNumber: '',
      startDate: '',
      endDate: ''
    });
  }

  function reset() {
    setBookings(seed);
    setForm({ ...formEmpty });
    setEditing(null);
    setWeek('2026-11-09');
    setNotice('Example bookings restored.');
    setError('');

    setFieldErrors({
      roomNumber: '',
      startDate: '',
      endDate: ''
    });

    setCheckState('');
    setView('All rooms');
  }

  function check() {
    setNotice('');

    const result = validate(form, bookings, editing);

    setFieldErrors(result.fieldErrors);
    setError(result.generalError);

    if (result.valid) {
      setCheckState('checked');
      setNotice('No conflict detected for the selected dates.');
    } else {
      setCheckState('invalid');
    }
  }

  return (
    <div className="room-app">
      <header className="topbar">
        <div className="mark">
          <span className="mark-sq">R</span>
          <span>
            <strong>room<span>grid</span></strong>
            <small>Campus spaces</small>
          </span>
        </div>

        <nav>
          <button
            className={tab === 'Availability' ? 'selected' : ''}
            onClick={() => setTab('Availability')}
          >
            Availability
          </button>

          <button
            className={tab === 'My bookings' ? 'selected' : ''}
            onClick={() => {
              setTab('My bookings');
              document.getElementById('my-reservations')?.scrollIntoView({
                behavior: 'smooth'
              });
            }}
          >
            My bookings
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
            <p>
              Review campus rooms, dates and existing reservations in one view.
            </p>
          </div>

          <div className="intro-summary">
            <span>ROOMS IN DIRECTORY</span>
            <strong>{rooms.length.toString().padStart(2, '0')}</strong>
            <span>CURRENT RESERVATIONS</span>
            <strong>{bookings.length.toString().padStart(2, '0')}</strong>
          </div>
        </section>

        <div className="pagegrid">
          <section className="calendar-pane">
            <div className="calendar-head">
              <div>
                <span className="eyebrow">AVAILABILITY CALENDAR</span>
                <h2>Rooms by day</h2>
              </div>

              <div className="weeknav">
                <button
                  aria-label="Previous week"
                  onClick={() => setWeek(addDays(week, -7))}
                >
                  ←
                </button>

                <strong>
                  {human(week)} – {human(addDays(week, 6))}
                </strong>

                <button
                  aria-label="Next week"
                  onClick={() => setWeek(addDays(week, 7))}
                >
                  →
                </button>
              </div>
            </div>

            <div className="calendar-controls">
              <label>
                Location
                <select
                  value={view}
                  onChange={event => setView(event.target.value)}
                >
                  <option>All rooms</option>
                  {rooms.map(room => (
                    <option key={room}>{room}</option>
                  ))}
                </select>
              </label>

              <span className="legend">
                <i className="booked" /> Reserved
              </span>

              <span className="legend">
                <i className="free" /> Available
              </span>

              <p>Click a day to enter it in the form.</p>
            </div>

            <div className="calendar-scroll">
              <div className="room-cal">
                <div className="corner">ROOM / DATE</div>

                {days.map(day => (
                  <div className="dayhead" key={day}>
                    <strong>{weekDay(day)}</strong>
                    <span>{human(day)}</span>
                  </div>
                ))}

                {roomList.map(room => (
                  <React.Fragment key={room}>
                    <div className="roomname">
                      <strong>{room}</strong>
                      <small>Study room · {room[0]}</small>
                    </div>

                    {days.map(day => {
                      const booking = occupied(room, day);

                      return (
                        <button
                          key={room + day}
                          title={`${room}, ${day}: ${
                            booking ? 'Reserved' : 'Available'
                          }`}
                          className={
                            'slot ' +
                            (booking ? 'taken' : 'available')
                          }
                          onClick={() => pick(room, day)}
                        >
                          <span>{booking ? 'Booked' : 'Open'}</span>

                          {booking && (
                            <small>
                              {booking.owner === 'you'
                                ? 'Your booking'
                                : 'Reserved'}
                            </small>
                          )}
                        </button>
                      );
                    })}
                  </React.Fragment>
                ))}
              </div>
            </div>

            <p className="calendar-note">
              Cells show individual dates. Reservations may span several dates;
              a day marked "Open" does not guarantee the full range you choose
              will be available.
            </p>

            <section id="my-reservations" className="reservations">
              <div className="reservations-head">
                <h2>Your bookings</h2>
                <span>{myBookings.length} current records</span>
              </div>

              <div className="reservations-list">
                {myBookings.map(booking => (
                  <article key={booking.id} className="reservation">
                    <div className="room-chip">
                      {booking.roomNumber}
                    </div>

                    <div className="reservation-body">
                      <strong>
                        {human(booking.startDate)} – {human(booking.endDate)}
                      </strong>
                      <small>
                        {booking.purpose || 'No purpose entered'}
                      </small>
                    </div>

                    <button onClick={() => edit(booking)}>
                      Change
                    </button>
                  </article>
                ))}

                {myBookings.length === 0 && <p>No reservations.</p>}
              </div>
            </section>
          </section>

          <aside className="booking-pane" id="booking-form">
            <div className="panel-tag">
              <span>BOOK A ROOM</span>
              <span>FORM 01</span>
            </div>

            <h2>
              {editing ? 'Change reservation' : 'Make a reservation'}
            </h2>

            <p className="booking-description">
              Use this panel to request a room for your study group, meeting or
              activity.
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
                  aria-invalid={!!fieldErrors.roomNumber}
                  aria-describedby={
                    fieldErrors.roomNumber ? 'room-error' : undefined
                  }
                  className={
                    fieldErrors.roomNumber ? 'field-invalid' : ''
                  }
                  list="rooms"
                  placeholder="e.g., B2-104"
                  value={form.roomNumber}
                  onChange={event =>
                    updateField('roomNumber', event.target.value)
                  }
                />

                {fieldErrors.roomNumber && (
                  <small className="field-error" id="room-error">
                    {fieldErrors.roomNumber}
                  </small>
                )}

                <datalist id="rooms">
                  {rooms.map(room => (
                    <option key={room} value={room} />
                  ))}
                </datalist>
              </label>

              <div className="date-pair">
                <label>
                  <span>Start date</span>

                  <input
                    type="date"
                    aria-invalid={!!fieldErrors.startDate}
                    className={
                      fieldErrors.startDate ? 'field-invalid' : ''
                    }
                    value={form.startDate}
                    onChange={event =>
                      updateField('startDate', event.target.value)
                    }
                  />

                  {fieldErrors.startDate && (
                    <small className="field-error">
                      {fieldErrors.startDate}
                    </small>
                  )}
                </label>

                <label>
                  <span>End date (checkout)</span>

                  <input
                    type="date"
                    aria-invalid={!!fieldErrors.endDate}
                    className={
                      fieldErrors.endDate ? 'field-invalid' : ''
                    }
                    value={form.endDate}
                    onChange={event =>
                      updateField('endDate', event.target.value)
                    }
                  />

                  {fieldErrors.endDate && (
                    <small className="field-error">
                      {fieldErrors.endDate}
                    </small>
                  )}
                </label>
              </div>

              <label>
                <span>Purpose / optional</span>

                <textarea
                  rows="5"
                  placeholder="Meeting, group study..."
                  value={form.purpose}
                  onChange={event =>
                    setForm(previous => ({
                      ...previous,
                      purpose: event.target.value
                    }))
                  }
                />
              </label>

              <p className="helper">
                Start and checkout dates are required. The checkout date is not
                included in your reservation. For example, Nov 9 to Nov 12
                reserves Nov 9, 10 and 11. Reservations cannot overlap existing
                bookings for the same room.
              </p>

              <button
                className={`availability-check ${checkState}`}
                type="button"
                onClick={check}
                aria-pressed={checkState === 'checked'}
              >
                Check availability
              </button>

              <button className="reserve-button" type="submit">
                {editing ? 'Save booking' : 'Confirm booking'}
              </button>

              {editing && (
                <button
                  className="cancel-edit"
                  type="button"
                  onClick={() => {
                    setEditing(null);
                    setForm({ ...formEmpty });
                    setError('');
                    setFieldErrors({
                      roomNumber: '',
                      startDate: '',
                      endDate: ''
                    });
                    setCheckState('');
                  }}
                >
                  Cancel editing
                </button>
              )}
            </form>

            <div className="right-foot">
              <span>✦</span> Need a room for a group? Find an open date and
              submit your request.
            </div>
          </aside>
        </div>
      </main>

      <footer>
        ROOMGRID / Academic campus demo — local browser data only.
      </footer>
    </div>
  );
}
