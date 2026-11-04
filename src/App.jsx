import React, {useEffect, useMemo, useState} from 'react';

const STORAGE = 'acl-roomgrid-18rooms-v1';
const rooms = [
  'A1-203', 'A2-106', 'A2-107', 'A3-208', 'A3-209', 'B1-205',
  'B1-206', 'B1-207', 'B2-104', 'B2-105', 'B3-301', 'C1-102',
  'C1-103', 'C2-201', 'C2-202', 'C3-101', 'C3-102', 'D1-101'
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
  ['D1-101', '2026-11-16', '2026-11-18', 'Group assignment', 'you']
];

const seed = sampleRows.map(([roomNumber, startDate, endDate, purpose, owner], index) => ({
  id: `demo-${index + 1}`,
  roomNumber,
  startDate,
  endDate,
  purpose,
  owner
}));
const formEmpty = {roomNumber: '', startDate: '', endDate: '', purpose: ''};

function read() {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE));
    return Array.isArray(stored) ? stored : seed;
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

function dateRangeLabel(startDate, exclusiveEndDate) {
  const lastDate = addDays(exclusiveEndDate, -1);
  return startDate === lastDate ? human(startDate) : `${human(startDate)} – ${human(lastDate)}`;
}

function issue(form, bookings, id) {
  if (!form.roomNumber.trim() || !form.startDate || !form.endDate) {
    return 'Enter a room number, start date, and end date before continuing.';
  }
  if (form.endDate <= form.startDate) {
    return 'Choose an end date that is after the start date.';
  }
  if (bookings.some(booking =>
    booking.id !== id &&
    booking.roomNumber.toLowerCase() === form.roomNumber.trim().toLowerCase() &&
    form.startDate < booking.endDate &&
    form.endDate > booking.startDate
  )) {
    return 'Those dates overlap an existing booking for this room. Choose another room or date range.';
  }
  return '';
}

export default function App() {
  const [bookings, setBookings] = useState(read);
  const [week, setWeek] = useState('2026-11-09');
  const [view, setView] = useState('All rooms');
  const [form, setForm] = useState({...formEmpty});
  const [editing, setEditing] = useState(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [tab, setTab] = useState('Availability');
  const [calendarMessage, setCalendarMessage] = useState('');
  const [rangeQuery, setRangeQuery] = useState({startDate: '', endDate: ''});
  const [rangeResult, setRangeResult] = useState(null);
  const [rangeError, setRangeError] = useState('');

  useEffect(() => {
    localStorage.setItem(STORAGE, JSON.stringify(bookings));
  }, [bookings]);

  const days = useMemo(() => Array.from({length: 7}, (_, index) => addDays(week, index)), [week]);
  const myBookings = bookings
    .filter(booking => booking.owner === 'you')
    .sort((a, b) => a.startDate.localeCompare(b.startDate));
  const roomList = view === 'All rooms' ? rooms : rooms.filter(room => room === view);
  const availableRooms = useMemo(() => {
    if (!rangeResult) return [];
    return rooms.filter(room => !bookings.some(booking =>
      booking.roomNumber === room &&
      rangeResult.startDate < booking.endDate &&
      rangeResult.endDate > booking.startDate
    ));
  }, [bookings, rangeResult]);

  function occupied(room, date) {
    return bookings.find(booking =>
      booking.roomNumber === room && date >= booking.startDate && date < booking.endDate
    );
  }

  function clearFeedback() {
    setError('');
    setNotice('');
  }

  function pick(room, date) {
    const booking = occupied(room, date);
    if (booking) {
      setCalendarMessage(`${room} is already booked for ${human(date)}. Choose an open date or use the date search to find another room.`);
      return;
    }
    setCalendarMessage('');
    setForm({roomNumber: room, startDate: date, endDate: addDays(date, 1), purpose: ''});
    setEditing(null);
    clearFeedback();
    document.getElementById('booking-form')?.scrollIntoView({behavior: 'smooth', block: 'nearest'});
  }

  function chooseRoom(room) {
    setForm({
      roomNumber: room,
      startDate: rangeResult.startDate,
      endDate: rangeResult.endDate,
      purpose: ''
    });
    setEditing(null);
    clearFeedback();
    document.getElementById('booking-form')?.scrollIntoView({behavior: 'smooth', block: 'nearest'});
  }

  function edit(booking) {
    if (booking.owner !== 'you') return;
    setEditing(booking.id);
    setForm({
      roomNumber: booking.roomNumber,
      startDate: booking.startDate,
      endDate: booking.endDate,
      purpose: booking.purpose
    });
    clearFeedback();
  }

  function cancelEdit() {
    setEditing(null);
    setForm({...formEmpty});
    clearFeedback();
  }

  function submit(event) {
    event.preventDefault();
    setNotice('');
    const validationMessage = issue(form, bookings, editing);
    if (validationMessage) {
      setError(validationMessage);
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
      setBookings(bookings.map(booking =>
        booking.id === editing ? {...booking, ...payload} : booking
      ));
      setNotice('Your booking has been updated.');
    } else {
      setBookings([...bookings, {...payload, id: `b-${Date.now()}`}]);
      setNotice('Your room has been reserved.');
    }

    setForm({...formEmpty});
    setEditing(null);
    setError('');
  }

  function reset() {
    setBookings(seed);
    setForm({...formEmpty});
    setEditing(null);
    setWeek('2026-11-09');
    setNotice('Example bookings restored.');
    setError('');
    setView('All rooms');
    setRangeQuery({startDate: '', endDate: ''});
    setRangeResult(null);
    setRangeError('');
  }

  function check() {
    setNotice('');
    const validationMessage = issue(form, bookings, editing);
    if (validationMessage) {
      setError(validationMessage);
    } else {
      setError('');
      setNotice('No conflict found for the selected dates.');
    }
  }

  function searchAvailability() {
    setRangeResult(null);
    if (!rangeQuery.startDate || !rangeQuery.endDate) {
      setRangeError('Choose both a start date and an end date to search.');
      return;
    }
    if (rangeQuery.endDate <= rangeQuery.startDate) {
      setRangeError('The end date must be after the start date.');
      return;
    }
    setRangeError('');
    setRangeResult({...rangeQuery});
  }

  const activeBooking = myBookings.find(booking => booking.id === editing);

  return (
    <div className="room-app">
      <header className="topbar">
        <a className="mark" href="#top" aria-label="Roomgrid home">
          <span className="mark-sq">R</span>
          <span>
            <strong>room<span>grid</span></strong>
            <small>Campus spaces</small>
          </span>
        </a>
        <nav aria-label="Main navigation">
          <button
            type="button"
            className={tab === 'Availability' ? 'selected' : ''}
            aria-current={tab === 'Availability' ? 'page' : undefined}
            onClick={() => {
              setTab('Availability');
              window.scrollTo({top: 0, behavior: 'smooth'});
            }}
          >
            Availability
          </button>
          <button
            type="button"
            className={tab === 'My bookings' ? 'selected' : ''}
            aria-current={tab === 'My bookings' ? 'page' : undefined}
            onClick={() => {
              setTab('My bookings');
              window.scrollTo({top: 0, behavior: 'smooth'});
            }}
          >
            My bookings
          </button>
          <button type="button" onClick={reset}>Reset demo</button>
        </nav>
        <div className="member">
          <span>Student dashboard</span>
          <div className="profile" aria-label="Signed in as You">YOU</div>
        </div>
      </header>

      <main id="top">
        {tab === 'Availability' ? (
          <>
            <section className="intro">
              <div>
                <span className="eyebrow">SPACES / RESERVATIONS</span>
                <h1>Find room availability</h1>
                <p>Find a room for your dates, reserve it, and manage your bookings.</p>
              </div>
              <div className="intro-summary" aria-label="Booking overview">
                <span>ROOMS IN DIRECTORY</span>
                <strong>{rooms.length.toString().padStart(2, '0')}</strong>
                <span>CURRENT RESERVATIONS</span>
                <strong>{bookings.length.toString().padStart(2, '0')}</strong>
              </div>
            </section>

            <div className="pagegrid" id="availability">
          <section className="calendar-pane" aria-labelledby="calendar-title">
            <section className="range-search" aria-labelledby="range-search-title">
              <div className="range-search-heading">
                <div>
                  <span className="eyebrow">PLAN YOUR VISIT</span>
                  <h2 id="range-search-title">Find a room for your dates</h2>
                </div>
                <span className="search-icon" aria-hidden="true">⌕</span>
              </div>
              <p>See rooms available for your entire stay, not just one day.</p>
              <div className="range-search-controls">
                <label>
                  <span>Start date</span>
                  <input
                    type="date"
                    value={rangeQuery.startDate}
                    onChange={event => {
                      setRangeQuery(query => ({...query, startDate: event.target.value}));
                      setRangeError('');
                      setRangeResult(null);
                    }}
                  />
                </label>
                <label>
                  <span>End date <small>(not included)</small></span>
                  <input
                    type="date"
                    value={rangeQuery.endDate}
                    onChange={event => {
                      setRangeQuery(query => ({...query, endDate: event.target.value}));
                      setRangeError('');
                      setRangeResult(null);
                    }}
                  />
                </label>
                <button className="search-button" type="button" onClick={searchAvailability}>
                  Find available rooms
                </button>
              </div>
              {rangeError && <p className="error" role="alert">{rangeError}</p>}
              {rangeResult && (
                <div className="availability-results" aria-live="polite">
                  <div className="results-heading">
                    <div>
                      <h3>
                        {availableRooms.length === 1
                          ? '1 room available'
                          : `${availableRooms.length} rooms available`}
                      </h3>
                      <p>
                        For {dateRangeLabel(rangeResult.startDate, rangeResult.endDate)}
                        {' · '}end date excluded
                      </p>
                    </div>
                    <span className="results-count">{availableRooms.length}/{rooms.length}</span>
                  </div>
                  {availableRooms.length > 0 ? (
                    <div className="available-room-list">
                      {availableRooms.map(room => (
                        <article className="available-room" key={room}>
                          <span className="room-check" aria-hidden="true">✓</span>
                          <div>
                            <strong>{room}</strong>
                            <small>Study room · {room[0]} building</small>
                          </div>
                          <button type="button" onClick={() => chooseRoom(room)}>
                            Reserve this room
                          </button>
                        </article>
                      ))}
                    </div>
                  ) : (
                    <p className="empty-results">
                      No rooms are free for this entire range. Try different dates.
                    </p>
                  )}
                </div>
              )}
            </section>

            <div className="calendar-head">
              <div>
                <span className="eyebrow">WEEKLY OVERVIEW</span>
                <h2 id="calendar-title">Rooms by day</h2>
              </div>
              <div className="weeknav" aria-label="Calendar week">
                <button
                  type="button"
                  aria-label="Previous week"
                  onClick={() => setWeek(addDays(week, -7))}
                >
                  ←
                </button>
                <strong>{human(week)} – {human(addDays(week, 6))}</strong>
                <button
                  type="button"
                  aria-label="Next week"
                  onClick={() => setWeek(addDays(week, 7))}
                >
                  →
                </button>
              </div>
            </div>
            <div className="calendar-controls">
              <label>
                <span>Room filter</span>
                <select value={view} onChange={event => setView(event.target.value)}>
                  <option>All rooms</option>
                  {rooms.map(room => <option key={room}>{room}</option>)}
                </select>
              </label>
              <span className="legend"><i className="booked" /> Reserved</span>
              <span className="legend"><i className="free" /> Available</span>
              <p>Select any date to start a booking.</p>
            </div>
            {calendarMessage && (
              <div className="calendar-booked-message" role="status" aria-live="polite">
                <span aria-hidden="true">!</span>
                <p>{calendarMessage}</p>
                <button type="button" aria-label="Dismiss message" onClick={() => setCalendarMessage('')}>
                  Dismiss
                </button>
              </div>
            )}
            <div className="calendar-scroll" role="region" aria-label="Weekly room availability" tabIndex="0">
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
                          type="button"
                          key={`${room}-${day}`}
                          title={`${room}, ${day}: ${booking ? 'Reserved' : 'Available'}`}
                          aria-label={`${room}, ${weekDay(day)} ${human(day)}: ${booking ? 'Reserved' : 'Available'}. Select date`}
                          className={`slot ${booking ? 'taken' : 'available'}`}
                          onClick={() => pick(room, day)}
                        >
                          <span>{booking ? 'Booked' : 'Open'}</span>
                          {booking && <small>{booking.owner === 'you' ? 'Your booking' : 'Reserved'}</small>}
                        </button>
                      );
                    })}
                  </React.Fragment>
                ))}
              </div>
            </div>
            <p className="calendar-note">
              The weekly grid shows individual days. Use the date search above to find rooms free
              across a full range.
            </p>

          </section>

          <aside className="booking-pane" id="booking-form" aria-labelledby="booking-title">
            <div className="panel-tag">
              <span>{editing ? 'EDIT IN YOUR BOOKINGS' : 'READY WHEN YOU ARE'}</span>
              <span>{editing ? 'EDIT' : 'NEW'}</span>
            </div>
            <h2 id="booking-title">{editing ? 'Update your booking' : 'Make a reservation'}</h2>
            {editing ? (
              <div className="edit-context">
                <span className="edit-indicator" aria-hidden="true">↗</span>
                <p>
                  {activeBooking
                    ? `${activeBooking.roomNumber} is open for editing in the booking card.`
                    : 'Your booking is open for editing in its card.'}
                </p>
                <p>Update it directly in the card under “Your bookings.”</p>
              </div>
            ) : (
              <>
                <p className="booking-description">
                  Choose a room and valid dates. Your purpose is optional.
                </p>
                {notice && <div className="success" role="status">{notice}</div>}
                {error && <div className="error" role="alert">{error}</div>}
                <form onSubmit={submit}>
                  <label>
                    <span>Room number</span>
                    <input
                      list="rooms"
                      placeholder="e.g., B2-104"
                      value={form.roomNumber}
                      onChange={event => setForm(current => ({...current, roomNumber: event.target.value}))}
                    />
                    <datalist id="rooms">
                      {rooms.map(room => <option key={room} value={room} />)}
                    </datalist>
                  </label>
                  <div className="date-pair">
                    <label>
                      <span>Start date</span>
                      <input
                        type="date"
                        value={form.startDate}
                        onChange={event => setForm(current => ({...current, startDate: event.target.value}))}
                      />
                    </label>
                    <label>
                      <span>End date</span>
                      <input
                        type="date"
                        value={form.endDate}
                        onChange={event => setForm(current => ({...current, endDate: event.target.value}))}
                      />
                    </label>
                  </div>
                  <label>
                    <span>Purpose <small>(optional)</small></span>
                    <textarea
                      rows="4"
                      placeholder="Meeting, group study..."
                      value={form.purpose}
                      onChange={event => setForm(current => ({...current, purpose: event.target.value}))}
                    />
                  </label>
                  <p className="helper">
                    Dates must be valid and cannot overlap another booking for the same room.
                  </p>
                  <button className="availability-check" type="button" onClick={check}>
                    Check availability
                  </button>
                  <button className="reserve-button" type="submit">Confirm booking</button>
                </form>
              </>
            )}
            <div className="right-foot">
              <span aria-hidden="true">✦</span>
              Your changes are saved in this browser. Reset demo restores the example bookings.
            </div>
          </aside>
            </div>
          </>
        ) : (
          <>
            <section className="intro">
              <div>
                <span className="eyebrow">STUDENT DASHBOARD / BOOKINGS</span>
                <h1>Your bookings</h1>
                <p>Review and update your room reservations in one place.</p>
              </div>
              <div className="intro-summary" aria-label="Your booking summary">
                <span>YOUR RESERVATIONS</span>
                <strong>{myBookings.length.toString().padStart(2, '0')}</strong>
                <span>ROOMS IN DIRECTORY</span>
                <strong>{rooms.length.toString().padStart(2, '0')}</strong>
              </div>
            </section>
            <section className="my-bookings-page">
              <div className="my-bookings-heading">
                <div>
                  <span className="eyebrow">MANAGE RESERVATIONS</span>
                  <h2>All your bookings</h2>
                  <p>Choose a booking to edit its room, dates, or purpose.</p>
                </div>
                <button
                  type="button"
                  className="search-button"
                  onClick={() => {
                    setTab('Availability');
                    window.scrollTo({top: 0, behavior: 'smooth'});
                  }}
                >
                  Find a room
                </button>
              </div>
              {notice && <div className="success page-notice" role="status">{notice}</div>}
              <section className="reservations" id="my-reservations" aria-labelledby="reservations-title">
                <div className="reservations-head">
                  <div>
                    <span className="eyebrow">YOUR SPACE</span>
                    <h2 id="reservations-title">Reservations</h2>
                  </div>
                  <span>{myBookings.length} {myBookings.length === 1 ? 'booking' : 'bookings'}</span>
                </div>
                <div className="reservations-list">
                  {myBookings.map(booking => (
                    <article
                      key={booking.id}
                      className={`reservation ${editing === booking.id ? 'reservation-editing' : ''}`}
                    >
                      {editing === booking.id ? (
                        <form className="inline-editor" onSubmit={submit}>
                          <div className="editor-heading">
                            <div>
                              <span className="eyebrow">EDITING YOUR BOOKING</span>
                              <h3>{booking.roomNumber}</h3>
                            </div>
                            <button type="button" className="text-button" onClick={cancelEdit}>
                              Cancel
                            </button>
                          </div>
                          {error && <div className="error" role="alert">{error}</div>}
                          {notice && <div className="success" role="status">{notice}</div>}
                          <label>
                            <span>Room number</span>
                            <input
                              list={`edit-rooms-${booking.id}`}
                              value={form.roomNumber}
                              onChange={event => setForm(current => ({...current, roomNumber: event.target.value}))}
                            />
                            <datalist id={`edit-rooms-${booking.id}`}>
                              {rooms.map(room => <option key={room} value={room} />)}
                            </datalist>
                          </label>
                          <div className="date-pair">
                            <label>
                              <span>Start date</span>
                              <input
                                type="date"
                                value={form.startDate}
                                onChange={event => setForm(current => ({...current, startDate: event.target.value}))}
                              />
                            </label>
                            <label>
                              <span>End date</span>
                              <input
                                type="date"
                                value={form.endDate}
                                onChange={event => setForm(current => ({...current, endDate: event.target.value}))}
                              />
                            </label>
                          </div>
                          <label>
                            <span>Purpose <small>(optional)</small></span>
                            <textarea
                              rows="3"
                              value={form.purpose}
                              onChange={event => setForm(current => ({...current, purpose: event.target.value}))}
                            />
                          </label>
                          <p className="helper">
                            End date must follow the start date. Overlapping bookings are not allowed.
                          </p>
                          <div className="editor-actions">
                            <button className="availability-check" type="button" onClick={check}>
                              Check availability
                            </button>
                            <button className="reserve-button" type="submit">Save changes</button>
                          </div>
                        </form>
                      ) : (
                        <>
                          <div className="room-chip">{booking.roomNumber}</div>
                          <div className="reservation-body">
                            <strong>{dateRangeLabel(booking.startDate, booking.endDate)}</strong>
                            <small>{booking.purpose || 'No purpose entered'}</small>
                          </div>
                          <button
                            type="button"
                            className="change-button"
                            aria-label={`Change booking for ${booking.roomNumber}`}
                            onClick={() => edit(booking)}
                          >
                            Change
                          </button>
                        </>
                      )}
                    </article>
                  ))}
                  {myBookings.length === 0 && (
                    <div className="empty-bookings">
                      <strong>No bookings yet</strong>
                      <p>Your room reservations will appear here after you make a booking.</p>
                      <button
                        type="button"
                        className="text-button"
                        onClick={() => {
                          setTab('Availability');
                          window.scrollTo({top: 0, behavior: 'smooth'});
                        }}
                      >
                        Browse available rooms
                      </button>
                    </div>
                  )}
                </div>
              </section>
            </section>
          </>
        )}
      </main>
      <footer>ROOMGRID / Academic campus demo — local browser data only.</footer>
    </div>
  );
}
