
import React, { useEffect, useMemo, useState } from 'react';

const STORAGE = 'acl-roomgrid-18rooms-v1';

const rooms = [
  'A1-203', 'A2-106', 'A2-107', 'A3-208', 'A3-209',
  'B1-205', 'B1-206', 'B1-207', 'B2-104', 'B2-105',
  'B3-301', 'C1-102', 'C1-103', 'C2-201', 'C2-202',
  'C3-101', 'C3-102', 'D1-101'
];

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
  ['D1-101','2026-11-16','2026-11-18','Group assignment','you']
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

const emptyForm = {
  roomNumber: '',
  startDate: '',
  endDate: '',
  purpose: ''
};

function readBookings() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE));
    return Array.isArray(saved) ? saved : seed;
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

function validateBooking(form, bookings, editingId) {
  if (!form.roomNumber.trim() || !form.startDate || !form.endDate) {
    return 'Complete the room number and both dates.';
  }

  if (!rooms.includes(form.roomNumber.trim().toUpperCase())) {
    return 'Choose a room from the room directory.';
  }

  if (form.endDate <= form.startDate) {
    return 'End date must be after the start date.';
  }

  const overlaps = bookings.some(booking =>
    booking.id !== editingId &&
    booking.roomNumber.toLowerCase() === form.roomNumber.trim().toLowerCase() &&
    form.startDate < booking.endDate &&
    form.endDate > booking.startDate
  );

  return overlaps
    ? 'This room is already booked for some of those dates.'
    : '';
}

export default function App() {
  const [bookings, setBookings] = useState(readBookings);
  const [week, setWeek] = useState('2026-11-09');
  const [roomFilter, setRoomFilter] = useState('All rooms');
  const [form, setForm] = useState({ ...emptyForm });
  const [editing, setEditing] = useState(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [page, setPage] = useState('availability');

  useEffect(() => {
    localStorage.setItem(STORAGE, JSON.stringify(bookings));
  }, [bookings]);

  useEffect(() => {
    if (page === 'bookings' && editing) {
      document.getElementById('edit-booking-form')?.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }
  }, [page, editing]);

  const days = useMemo(
    () => Array.from({ length: 7 }, (_, index) => addDays(week, index)),
    [week]
  );

  const myBookings = bookings
    .filter(booking => booking.owner === 'you')
    .sort((a, b) => a.startDate.localeCompare(b.startDate));

  const visibleRooms = roomFilter === 'All rooms'
    ? rooms
    : rooms.filter(room => room === roomFilter);

  const occupied = (room, date) =>
    bookings.find(
      booking =>
        booking.roomNumber === room &&
        date >= booking.startDate &&
        date < booking.endDate
    );

  function startNewBooking(room, date) {
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
      block: 'start'
    });
  }

  function startEditing(booking) {
    if (booking.owner !== 'you') return;

    setForm({
      roomNumber: booking.roomNumber,
      startDate: booking.startDate,
      endDate: booking.endDate,
      purpose: booking.purpose || ''
    });

    setEditing(booking.id);
    setError('');
    setNotice('');
    setPage('bookings');
  }

  function submitBooking(event) {
    event.preventDefault();
    setNotice('');

    const validationError = validateBooking(form, bookings, editing);

    if (validationError) {
      setError(validationError);
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
      setBookings(current =>
        current.map(booking =>
          booking.id === editing
            ? { ...booking, ...payload }
            : booking
        )
      );

      setNotice('Your booking has been updated.');
    } else {
      setBookings(current => [
        ...current,
        { ...payload, id: `booking-${Date.now()}` }
      ]);

      setNotice('Your room has been reserved.');
    }

    setForm({ ...emptyForm });
    setEditing(null);
    setError('');
  }

  function checkAvailability() {
    setNotice('');

    const validationError = validateBooking(form, bookings, editing);

    if (validationError) {
      setError(validationError);
    } else {
      setError('');
      setNotice('No booking conflict found for the selected dates.');
    }
  }

  function cancelEditing() {
    setEditing(null);
    setForm({ ...emptyForm });
    setError('');
    setNotice('');
  }

  function resetDemo() {
    setBookings(seed);
    setForm({ ...emptyForm });
    setEditing(null);
    setWeek('2026-11-09');
    setNotice('Example bookings restored.');
    setError('');
    setRoomFilter('All rooms');
    setPage('availability');
  }

  function renderBookingForm(editMode = false) {
    return (
      <section
        className="booking-pane"
        id={editMode ? 'edit-booking-form' : 'booking-form'}
      >
        <div className="panel-tag">
          <span>{editMode ? 'MANAGE RESERVATION' : 'BOOK A ROOM'}</span>
          <span>FORM 01</span>
        </div>

        <h2>{editing ? 'Change reservation' : 'Make a reservation'}</h2>

        <p className="booking-description">
          {editing
            ? 'Update the details of your existing reservation below.'
            : 'Use this panel to request a room for your study group, meeting or activity.'}
        </p>

        {notice && <div className="success" role="status">{notice}</div>}
        {error && <div className="error" role="alert">{error}</div>}

        <form onSubmit={submitBooking}>
          <label>
            <span>Room number</span>
            <input
              list="rooms"
              placeholder="e.g., B2-104"
              value={form.roomNumber}
              onChange={event =>
                setForm(current => ({
                  ...current,
                  roomNumber: event.target.value
                }))
              }
              required
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
                onChange={event =>
                  setForm(current => ({
                    ...current,
                    startDate: event.target.value
                  }))
                }
                required
              />
            </label>

            <label>
              <span>End date</span>
              <input
                type="date"
                value={form.endDate}
                min={form.startDate || undefined}
                onChange={event =>
                  setForm(current => ({
                    ...current,
                    endDate: event.target.value
                  }))
                }
                required
              />
            </label>
          </div>

          <label>
            <span>Purpose / optional</span>
            <textarea
              rows="4"
              placeholder="Meeting, group study..."
              value={form.purpose}
              onChange={event =>
                setForm(current => ({
                  ...current,
                  purpose: event.target.value
                }))
              }
            />
          </label>

          <p className="helper">
            Start and end dates are required. Reservations cannot overlap
            existing bookings for the same room.
          </p>

          <button
            className="availability-check"
            type="button"
            onClick={checkAvailability}
          >
            Check availability
          </button>

          <button className="reserve-button" type="submit">
            {editing ? 'Save changes' : 'Confirm booking'}
          </button>

          {editing && (
            <button
              className="cancel-edit"
              type="button"
              onClick={cancelEditing}
            >
              Cancel editing
            </button>
          )}
        </form>

        <div className="right-foot">
          <span>✦</span>{' '}
          {editing
            ? 'Your changes will update this reservation.'
            : 'Need a room for a group? Find an open date and submit your request.'}
        </div>
      </section>
    );
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

        <nav aria-label="Main navigation">
          <button
            className={page === 'availability' ? 'selected' : ''}
            onClick={() => {
              setPage('availability');
              setNotice('');
              setError('');
            }}
          >
            Availability
          </button>

          <button
            className={page === 'bookings' ? 'selected' : ''}
            onClick={() => {
              setPage('bookings');
              setNotice('');
              setError('');
            }}
          >
            Your bookings
          </button>

          <button onClick={resetDemo}>Reset demo</button>
        </nav>

        <div className="member">
          <span>Student dashboard</span>
          <div className="profile">YOU</div>
        </div>
      </header>

      <main>
        {page === 'availability' ? (
          <>
            <section className="intro">
              <div>
                <span className="eyebrow">SPACES / RESERVATIONS</span>
                <h1>Find room availability</h1>
                <p>Browse campus rooms and choose an open date to make a reservation.</p>
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
                      value={roomFilter}
                      onChange={event => setRoomFilter(event.target.value)}
                    >
                      <option>All rooms</option>
                      {rooms.map(room => <option key={room}>{room}</option>)}
                    </select>
                  </label>

                  <span className="legend"><i className="booked" /> Reserved</span>
                  <span className="legend"><i className="free" /> Available</span>
                  <p>Click an available day to start a booking.</p>
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

                    {visibleRooms.map(room => (
                      <React.Fragment key={room}>
                        <div className="roomname">
                          <strong>{room}</strong>
                          <small>Study room · {room[0]}</small>
                        </div>

                        {days.map(day => {
                          const booking = occupied(room, day);

                          return (
                            <button
                              key={`${room}-${day}`}
                              type="button"
                              title={`${room}, ${day}: ${booking ? 'Reserved' : 'Available'}`}
                              className={`slot ${booking ? 'taken' : 'available'}`}
                              disabled={Boolean(booking)}
                              onClick={() => startNewBooking(room, day)}
                            >
                              <span>{booking ? 'Booked' : 'Open'}</span>
                              {booking && (
                                <small>
                                  {booking.owner === 'you' ? 'Your booking' : 'Reserved'}
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
                  Reservations may span several dates. A day marked Open does
                  not guarantee the full range you choose will be available.
                </p>
              </section>

              {renderBookingForm(false)}
            </div>
          </>
        ) : (
          <>
            <section className="intro">
              <div>
                <span className="eyebrow">SPACES / RESERVATIONS</span>
                <h1>Your bookings</h1>
                <p>
                  View and manage your reservations. Changes are saved
                  automatically in this browser.
                </p>
              </div>

              <div className="intro-summary">
                <span>YOUR RESERVATIONS</span>
                <strong>{myBookings.length.toString().padStart(2, '0')}</strong>
              </div>
            </section>

            <section className="my-bookings-page">
              <div className="reservations-head">
                <div>
                  <span className="eyebrow">PERSONAL RESERVATIONS</span>
                  <h2>Manage your bookings</h2>
                </div>
                <span>{myBookings.length} current records</span>
              </div>

              {notice && !editing && (
                <div className="success" role="status">{notice}</div>
              )}

              {myBookings.length > 0 ? (
                <div className="reservations-list">
                  {myBookings.map(booking => (
                    <article
                      key={booking.id}
                      className={`reservation ${
                        editing === booking.id ? 'reservation-editing' : ''
                      }`}
                    >
                      <div className="room-chip">{booking.roomNumber}</div>

                      <div className="reservation-body">
                        <strong>
                          {human(booking.startDate)} – {human(booking.endDate)}
                        </strong>
                        <small>{booking.purpose || 'No purpose entered'}</small>
                      </div>

                      <button
                        type="button"
                        className="change-button"
                        onClick={() => startEditing(booking)}
                        aria-label={`Change booking for ${booking.roomNumber}`}
                      >
                        {editing === booking.id ? 'Editing' : 'Change'}
                      </button>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="empty-bookings">
                  <h3>No bookings yet</h3>
                  <p>
                    When you reserve a room, it will appear here so you can
                    manage it.
                  </p>
                  <button
                    type="button"
                    className="reserve-button"
                    onClick={() => setPage('availability')}
                  >
                    Find an available room
                  </button>
                </div>
              )}

              {editing && (
                <div className="edit-form-wrap">
                  {renderBookingForm(true)}
                </div>
              )}
            </section>
          </>
        )}
      </main>

      <footer>
        ROOMGRID / Academic campus demo — local browser data only.
      </footer>
    </div>
  );
}
