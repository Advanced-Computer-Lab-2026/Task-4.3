
import React, { useEffect, useMemo, useState } from 'react';

const STORAGE = 'acl-roomgrid-18rooms-v1';

const rooms = [
  'A1-203', 'A2-106', 'A2-107', 'A3-208', 'A3-209',
  'B1-205', 'B1-206', 'B1-207', 'B2-104', 'B2-105',
  'B3-301', 'C1-102', 'C1-103', 'C2-201', 'C2-202',
  'C3-101', 'C3-102', 'D1-101'
];

// End dates are exclusive.
// Example: Nov 11 to Nov 14 occupies Nov 11, 12 and 13.
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
  ['D1-101', '2026-11-16', '2026-11-18', 'Group assignment', 'you']
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
  return new Date(`${iso}T12:00:00Z`).toLocaleDateString(
    'en-GB',
    {
      timeZone: 'UTC',
      day: 'numeric',
      month: 'short'
    }
  );
}

function weekDay(iso) {
  return new Date(`${iso}T12:00:00Z`).toLocaleDateString(
    'en-GB',
    {
      timeZone: 'UTC',
      weekday: 'short'
    }
  );
}

// Validate booking details and detect overlapping reservations.
function issue(form, bookings, id) {
  const room = form.roomNumber.trim().toUpperCase();

  if (!room || !form.startDate || !form.endDate) {
    return 'Please complete the room number, start date and end date.';
  }

  if (!rooms.includes(room)) {
    return `Room ${room} does not exist. Please choose a room from the directory.`;
  }

  if (form.endDate <= form.startDate) {
    return 'The end date must be after the start date.';
  }

  // Find every existing booking that overlaps the requested dates.
  const conflicts = bookings.filter(b =>
    b.id !== id &&
    b.roomNumber.trim().toUpperCase() === room &&
    form.startDate < b.endDate &&
    form.endDate > b.startDate
  );

  if (conflicts.length > 0) {
    const conflictDetails = conflicts.map(conflict => {
      const overlapStart =
        form.startDate > conflict.startDate
          ? form.startDate
          : conflict.startDate;

      const overlapEnd =
        form.endDate < conflict.endDate
          ? form.endDate
          : conflict.endDate;

      // Convert the exclusive end to the last occupied date.
      const lastOccupiedDate = addDays(overlapEnd, -1);

      const dates = overlapStart === lastOccupiedDate
        ? human(overlapStart)
        : `${human(overlapStart)} – ${human(lastOccupiedDate)}`;

      return dates;
    });

    const uniqueDates = [...new Set(conflictDetails)];

    return `Room ${room} is already reserved on ${uniqueDates.join(', ')}. Please choose different dates or another room.`;
  }

  return '';
}

export default function App() {
  const [bookings, setBookings] = useState(read);
  const [week, setWeek] = useState('2026-11-09');
  const [view, setView] = useState('All rooms');
  const [form, setForm] = useState({ ...formEmpty });

  // Date-range availability search
  const [searchStart, setSearchStart] = useState('');
  const [searchEnd, setSearchEnd] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [searchError, setSearchError] = useState('');

  const [editing, setEditing] = useState(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [tab, setTab] = useState('Availability');

  // Persist bookings in localStorage.
  useEffect(() => {
    localStorage.setItem(STORAGE, JSON.stringify(bookings));
  }, [bookings]);

  const days = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(week, i)),
    [week]
  );

  const myBookings = bookings
    .filter(b => b.owner === 'you')
    .sort((a, b) => a.startDate.localeCompare(b.startDate));

  const roomList = view === 'All rooms'
    ? rooms
    : rooms.filter(r => r === view);

  // Check whether a room is occupied on a particular day.
  // The end date is exclusive.
  function occupied(room, date) {
    return bookings.find(b =>
      b.roomNumber.trim().toUpperCase() ===
        room.trim().toUpperCase() &&
      date >= b.startDate &&
      date < b.endDate
    );
  }

  // Clicking an available calendar cell fills the form.
  function pick(room, date) {
    setForm({
      roomNumber: room,
      startDate: date,
      endDate: addDays(date, 1),
      purpose: ''
    });

    setEditing(null);
    setError('');
    setNotice('');

    document.getElementById('booking-form')?.scrollIntoView({
      behavior: 'smooth',
      block: 'center'
    });
  }

  // Edit one of the current user's reservations.
  function edit(row) {
    if (row.owner !== 'you') return;

    setEditing(row.id);

    setForm({
      roomNumber: row.roomNumber,
      startDate: row.startDate,
      endDate: row.endDate,
      purpose: row.purpose || ''
    });

    setError('');
    setNotice('');

    document.getElementById('booking-form')?.scrollIntoView({
      behavior: 'smooth',
      block: 'center'
    });
  }

  // Check availability without submitting the booking.
  function check() {
    setNotice('');
    setError('');

    const err = issue(form, bookings, editing);

    if (err) {
      setError(err);
    } else {
      setNotice(
        'No booking conflicts found. This room is available for your selected dates.'
      );
    }
  }

  // Create a new booking or update an existing one.
  function submit(e) {
    e.preventDefault();

    setError('');
    setNotice('');

    const err = issue(form, bookings, editing);

    if (err) {
      setError(err);
      return;
    }

    const payload = {
      roomNumber: form.roomNumber.trim().toUpperCase(),
      startDate: form.startDate,
      endDate: form.endDate,
      purpose: form.purpose.trim(),
      owner: 'you'
    };

    if (editing) {
      setBookings(previous =>
        previous.map(b =>
          b.id === editing
            ? { ...b, ...payload }
            : b
        )
      );

      setNotice('Your booking has been updated.');
    } else {
      setBookings(previous => [
        ...previous,
        {
          ...payload,
          id: 'b-' + Date.now()
        }
      ]);

      setNotice('Your room has been reserved successfully.');
    }

    setForm({ ...formEmpty });
    setEditing(null);
  }

  // Restore the original example records.
  function reset() {
    setBookings(seed);
    setForm({ ...formEmpty });
    setEditing(null);
    setWeek('2026-11-09');
    setNotice('Example bookings restored.');
    setError('');
    setView('All rooms');

    setSearchStart('');
    setSearchEnd('');
    setSearchResults(null);
    setSearchError('');
  }

  // Search for rooms available throughout the requested date range.
  function findAvailableRooms() {
    setSearchError('');
    setSearchResults(null);

    if (!searchStart || !searchEnd) {
      setSearchError('Please select both start and end dates.');
      return;
    }

    if (searchEnd <= searchStart) {
      setSearchError('End date must be after start date.');
      return;
    }

    const available = rooms.filter(room =>
      !bookings.some(booking =>
        booking.roomNumber.trim().toUpperCase() === room &&
        searchStart < booking.endDate &&
        searchEnd > booking.startDate
      )
    );

    setSearchResults(available);
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
              document.getElementById('my-reservations')
                ?.scrollIntoView({ behavior: 'smooth' });
            }}
          >
            My bookings
          </button>

          <button onClick={reset}>
            Reset demo
          </button>
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

            {/* Date-range availability search */}
            <div className="availability-search">

              <div className="search-heading">
                <div>
                  <span className="eyebrow">PLAN YOUR VISIT</span>
                  <h3>Find an available room</h3>
                  <p>
                    Choose your dates to see rooms available
                    for the entire period.
                  </p>
                </div>
              </div>

              <div className="search-fields">

                <label>
                  Start date
                  <input
                    type="date"
                    value={searchStart}
                    onChange={e => {
                      setSearchStart(e.target.value);
                      setSearchResults(null);
                      setSearchError('');
                    }}
                  />
                </label>

                <label>
                  End date
                  <input
                    type="date"
                    value={searchEnd}
                    min={searchStart || undefined}
                    onChange={e => {
                      setSearchEnd(e.target.value);
                      setSearchResults(null);
                      setSearchError('');
                    }}
                  />
                </label>

                <button
                  type="button"
                  onClick={findAvailableRooms}
                >
                  Find available rooms
                </button>

              </div>

              <p className="search-date-note">
                The end date is not included in the reservation.
              </p>

              {searchError && (
                <div className="error" role="alert">
                  {searchError}
                </div>
              )}

              {searchResults !== null && (
                <div className="search-results">

                  <h4>
                    {searchResults.length} available
                    {searchResults.length === 1 ? ' room' : ' rooms'}
                  </h4>

                  {searchResults.length > 0 ? (
                    <div className="available-rooms">

                      {searchResults.map(room => (
                        <button
                          type="button"
                          key={room}
                          onClick={() => {
                            setForm({
                              roomNumber: room,
                              startDate: searchStart,
                              endDate: searchEnd,
                              purpose: ''
                            });

                            setEditing(null);
                            setError('');
                            setNotice('');

                            document.getElementById('booking-form')
                              ?.scrollIntoView({
                                behavior: 'smooth',
                                block: 'center'
                              });
                          }}
                        >
                          <strong>{room}</strong>
                          <span>Select room →</span>
                        </button>
                      ))}

                    </div>
                  ) : (
                    <p>
                      No rooms are available for the entire
                      selected date range. Try different dates.
                    </p>
                  )}

                </div>
              )}

            </div>

            <div className="calendar-controls">

              <label>
                Location

                <select
                  value={view}
                  onChange={e => setView(e.target.value)}
                >
                  <option>All rooms</option>
                  {rooms.map(r => (
                    <option key={r}>{r}</option>
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

                {days.map(d => (
                  <div className="dayhead" key={d}>
                    <strong>{weekDay(d)}</strong>
                    <span>{human(d)}</span>
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
                          title={`${room}, ${day}: ${booking ? 'Reserved' : 'Available'}`}
                          className={'slot ' + (booking ? 'taken' : 'available')}
                          onClick={() => pick(room, day)}
                        >
                          <span>
                            {booking ? 'Booked' : 'Open'}
                          </span>

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
              Cells show individual dates. Reservations may span several
              dates; a day marked "Open" does not guarantee the full range
              you choose will be available.
            </p>

            <section id="my-reservations" className="reservations">

              <div className="reservations-head">
                <h2>Your bookings</h2>
                <span>{myBookings.length} current records</span>
              </div>

              <div className="reservations-list">

                {myBookings.map(b => (
                  <article key={b.id} className="reservation">

                    <div className="room-chip">
                      {b.roomNumber}
                    </div>

                    <div className="reservation-body">
                      <strong>
                        {human(b.startDate)} – {human(b.endDate)}
                      </strong>

                      <small>
                        {b.purpose || 'No purpose entered'}
                      </small>
                    </div>

                    <button onClick={() => edit(b)}>
                      Change
                    </button>

                  </article>
                ))}

                {myBookings.length === 0 && (
                  <p>No reservations.</p>
                )}

              </div>
            </section>

          </section>

          {/* Booking form */}
          <aside className="booking-pane" id="booking-form">

            <div className="panel-tag">
              <span>BOOK A ROOM</span>
              <span>FORM 01</span>
            </div>

            <h2>
              {editing ? 'Change reservation' : 'Make a reservation'}
            </h2>

            <p className="booking-description">
              Use this panel to request a room for your study group,
              meeting or activity.
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
                  onChange={e =>
                    setForm(f => ({
                      ...f,
                      roomNumber: e.target.value
                    }))
                  }
                />

                <datalist id="rooms">
                  {rooms.map(r => (
                    <option key={r} value={r} />
                  ))}
                </datalist>
              </label>

              <div className="date-pair">

                <label>
                  <span>Start date</span>

                  <input
                    type="date"
                    value={form.startDate}
                    onChange={e =>
                      setForm(f => ({
                        ...f,
                        startDate: e.target.value
                      }))
                    }
                  />
                </label>

                <label>
                  <span>End date</span>

                  <input
                    type="date"
                    min={form.startDate || undefined}
                    value={form.endDate}
                    onChange={e =>
                      setForm(f => ({
                        ...f,
                        endDate: e.target.value
                      }))
                    }
                  />
                </label>

              </div>

              <label>
                <span>Purpose / optional</span>

                <textarea
                  rows="5"
                  placeholder="Meeting, group study..."
                  value={form.purpose}
                  onChange={e =>
                    setForm(f => ({
                      ...f,
                      purpose: e.target.value
                    }))
                  }
                />
              </label>

              <p className="helper">
                Start and end dates are required. Reservations cannot
                overlap existing bookings for the same room.
                The end date is exclusive.
              </p>

              <button
                className="availability-check"
                type="button"
                onClick={check}
              >
                Check availability
              </button>

              <button
                className="reserve-button"
                type="submit"
              >
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
                    setNotice('');
                  }}
                >
                  Cancel editing
                </button>
              )}

            </form>

            <div className="right-foot">
              <span>✦</span>
              Need a room for a group? Find an open date and submit your request.
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
