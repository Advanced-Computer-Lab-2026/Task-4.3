
import React, { useEffect, useMemo, useState } from "react";

const STORAGE = "acl-roomgrid-18rooms-v1";

const rooms = [
  "A1-203", "A2-106", "A2-107", "A3-208", "A3-209",
  "B1-205", "B1-206", "B1-207", "B2-104", "B2-105",
  "B3-301", "C1-102", "C1-103", "C2-201", "C2-202",
  "C3-101", "C3-102", "D1-101"
];

const sampleRows = [
  ["A1-203","2026-11-09","2026-11-11","Peer tutoring","other"],
  ["A1-203","2026-11-13","2026-11-15","Architecture workshop","other"],
  ["A1-203","2026-11-17","2026-11-19","Group assignment","you"],
  ["A2-106","2026-11-10","2026-11-13","Seminar preparation","other"],
  ["A2-106","2026-11-16","2026-11-19","Study circle","other"],
  ["A2-107","2026-11-09","2026-11-10","Student club planning","you"],
  ["A2-107","2026-11-12","2026-11-15","Project demo rehearsal","other"],
  ["A2-107","2026-11-16","2026-11-19","Study meeting","other"],
  ["A3-208","2026-11-11","2026-11-14","Presentation practice","other"],
  ["A3-208","2026-11-16","2026-11-18","Tutorial group","other"],
  ["A3-209","2026-11-10","2026-11-12","Study session","other"],
  ["B1-205","2026-11-09","2026-11-11","Meeting","other"],
  ["B1-205","2026-11-13","2026-11-15","Team discussion","other"],
  ["B1-205","2026-11-16","2026-11-18","Course project","other"],
  ["B1-206","2026-11-11","2026-11-13","Exam revision","other"],
  ["B1-206","2026-11-17","2026-11-20","Debate practice","you"],
  ["B1-207","2026-11-10","2026-11-12","Group study","you"],
  ["B1-207","2026-11-16","2026-11-19","Engineering project","other"],
  ["B2-104","2026-11-09","2026-11-11","Weekly study group","you"],
  ["B2-104","2026-11-13","2026-11-15","Team planning","other"],
  ["B2-104","2026-11-17","2026-11-19","Workshop preparation","other"],
  ["B2-105","2026-11-12","2026-11-15","Club meeting","other"],
  ["B2-105","2026-11-16","2026-11-18","Student committee","other"],
  ["B3-301","2026-11-09","2026-11-10","Debate practice","other"],
  ["B3-301","2026-11-11","2026-11-13","Group preparation","other"],
  ["B3-301","2026-11-18","2026-11-20","Portfolio review","other"],
  ["C1-102","2026-11-10","2026-11-14","Capstone meeting","other"],
  ["C1-102","2026-11-16","2026-11-19","Revision session","other"],
  ["C1-103","2026-11-09","2026-11-12","Group project","other"],
  ["C1-103","2026-11-14","2026-11-16","Student society","you"],
  ["C2-201","2026-11-12","2026-11-15","Project sprint","other"],
  ["C2-201","2026-11-16","2026-11-19","Robotics club","other"],
  ["C2-202","2026-11-09","2026-11-11","Lab preparation","other"],
  ["C2-202","2026-11-18","2026-11-20","Teaching assistant session","other"],
  ["C3-101","2026-11-12","2026-11-14","Presentation rehearsal","you"],
  ["C3-101","2026-11-14","2026-11-16","Design workshop","other"],
  ["C3-101","2026-11-18","2026-11-20","Study group","other"],
  ["C3-102","2026-11-11","2026-11-15","Research meeting","other"],
  ["D1-101","2026-11-10","2026-11-13","Team check-in","other"],
  ["D1-101","2026-11-16","2026-11-18","Group assignment","you"]
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
  roomNumber: "",
  startDate: "",
  endDate: "",
  purpose: ""
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
    "en-GB",
    { timeZone: "UTC", day: "numeric", month: "short" }
  );
}

function weekDay(iso) {
  return new Date(`${iso}T12:00:00Z`).toLocaleDateString(
    "en-GB",
    { timeZone: "UTC", weekday: "short" }
  );
}

// IMPROVEMENT 3: Specific form validation
function issue(form, bookings, id) {
  const room = form.roomNumber.trim().toUpperCase();

  if (!room) {
    return "Please select a room.";
  }

  if (!rooms.includes(room)) {
    return "Invalid room number. Choose a room from the directory.";
  }

  if (!form.startDate) {
    return "Please select a start date.";
  }

  if (!form.endDate) {
    return "Please select an end date.";
  }

  if (form.endDate <= form.startDate) {
    return "End date must be after the start date.";
  }

  const conflict = bookings.some(b =>
    b.id !== id &&
    b.roomNumber.toUpperCase() === room &&
    form.startDate < b.endDate &&
    form.endDate > b.startDate
  );

  if (conflict) {
    return "This room is already booked during the selected dates.";
  }

  return "";
}

export default function App() {
  const [bookings, setBookings] = useState(read);
  const [week, setWeek] = useState("2026-11-09");
  const [view, setView] = useState("All rooms");
  const [form, setForm] = useState({ ...formEmpty });
  const [editing, setEditing] = useState(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [tab, setTab] = useState("Availability");

  // IMPROVEMENT 2: Remember selected calendar cell
  const [selectedCell, setSelectedCell] = useState(null);

  useEffect(() => {
    localStorage.setItem(STORAGE, JSON.stringify(bookings));
  }, [bookings]);

  const days = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(week, i)),
    [week]
  );

  const myBookings = bookings
    .filter(b => b.owner === "you")
    .sort((a, b) => a.startDate.localeCompare(b.startDate));

  const roomList =
    view === "All rooms"
      ? rooms
      : rooms.filter(r => r === view);

  const occupied = (room, date) =>
    bookings.find(
      b =>
        b.roomNumber === room &&
        date >= b.startDate &&
        date < b.endDate
    );

  function scrollToForm() {
    document.getElementById("booking-form")?.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  }

  // IMPROVEMENT 2: Select only available dates
  function pick(room, date) {
    if (occupied(room, date)) return;

    setSelectedCell(`${room}-${date}`);

    setForm({
      roomNumber: room,
      startDate: date,
      endDate: addDays(date, 1),
      purpose: ""
    });

    setEditing(null);
    setError("");

    setNotice(
      `Selected ${room} on ${human(date)}. Choose your end date and check availability.`
    );

    scrollToForm();
  }

  // IMPROVEMENT 1: Fix Change button
  function edit(row) {
    if (row.owner !== "you") return;

    setEditing(row.id);
    setSelectedCell(null);

    setForm({
      roomNumber: row.roomNumber,
      startDate: row.startDate,
      endDate: row.endDate,
      purpose: row.purpose
    });

    setError("");
    setNotice(
      `Editing your booking for ${row.roomNumber}. Update the details and click Save changes.`
    );

    scrollToForm();
  }

  function cancelEdit() {
    setEditing(null);
    setForm({ ...formEmpty });
    setSelectedCell(null);
    setError("");
    setNotice("Editing cancelled. Your original booking is unchanged.");
  }

  function submit(e) {
    e.preventDefault();
    setNotice("");

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
      owner: "you"
    };

    if (editing) {
      setBookings(prev =>
        prev.map(b =>
          b.id === editing
            ? { ...b, ...payload }
            : b
        )
      );
      setNotice("Booking updated successfully!");
    } else {
      setBookings(prev => [
        ...prev,
        { ...payload, id: "b-" + Date.now() }
      ]);
      setNotice("Room reserved successfully!");
    }

    setForm({ ...formEmpty });
    setEditing(null);
    setSelectedCell(null);
    setError("");
  }

  function reset() {
    setBookings(seed);
    setForm({ ...formEmpty });
    setEditing(null);
    setWeek("2026-11-09");
    setSelectedCell(null);
    setNotice("Example bookings restored.");
    setError("");
    setView("All rooms");
    setTab("Availability");
  }

  function check() {
    setNotice("");
    setError("");

    const err = issue(form, bookings, editing);

    if (err) {
      setError(err);
    } else {
      setNotice(
        "This room is available for your selected dates. You can now confirm your booking."
      );
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
            type="button"
            className={tab === "Availability" ? "selected" : ""}
            onClick={() => {
              setTab("Availability");
              document.getElementById("calendar")?.scrollIntoView({
                behavior: "smooth"
              });
            }}
          >
            Availability
          </button>

          <button
            type="button"
            className={tab === "My bookings" ? "selected" : ""}
            onClick={() => {
              setTab("My bookings");
              document.getElementById("my-reservations")?.scrollIntoView({
                behavior: "smooth"
              });
            }}
          >
            My bookings
          </button>

          <button type="button" onClick={reset}>
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
            <strong>{String(rooms.length).padStart(2, "0")}</strong>
            <span>CURRENT RESERVATIONS</span>
            <strong>{String(bookings.length).padStart(2, "0")}</strong>
          </div>
        </section>

        <div className="pagegrid">
          <section className="calendar-pane" id="calendar">
            <div className="calendar-head">
              <div>
                <span className="eyebrow">AVAILABILITY CALENDAR</span>
                <h2>Rooms by day</h2>
              </div>

              <div className="weeknav">
                <button
                  type="button"
                  aria-label="Previous week"
                  onClick={() => setWeek(addDays(week, -7))}
                >
                  ←
                </button>

                <strong>
                  {human(week)} – {human(addDays(week, 6))}
                </strong>

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
                Location
                <select
                  value={view}
                  onChange={e => setView(e.target.value)}
                >
                  <option value="All rooms">All rooms</option>
                  {rooms.map(room => (
                    <option key={room} value={room}>
                      {room}
                    </option>
                  ))}
                </select>
              </label>

              <span className="legend">
                <i className="booked" /> Reserved
              </span>

              <span className="legend">
                <i className="free" /> Available
              </span>

              <p>
                Click a green Open cell to start a reservation.
              </p>
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
                      const isSelected =
                        selectedCell === `${room}-${day}`;

                      return (
                        <button
                          key={room + day}
                          type="button"
                          disabled={!!booking}
                          aria-pressed={!booking && isSelected}
                          title={
                            booking
                              ? "Reserved — unavailable"
                              : "Available — click to book"
                          }
                          className={
                            "slot " +
                            (booking ? "taken" : "available") +
                            (isSelected ? " chosen" : "")
                          }
                          onClick={() => pick(room, day)}
                        >
                          <span>
                            {booking ? "Booked" : "Open"}
                          </span>

                          {booking && (
                            <small>
                              {booking.owner === "you"
                                ? "Your booking"
                                : "Reserved"}
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
              Green cells are available and blue cells are reserved.
              Click an open date to fill in the booking form.
              Reservations may span several dates, so check the
              complete date range before confirming.
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
                        {booking.purpose || "No purpose entered"}
                      </small>
                    </div>

                    <button
                      type="button"
                      onClick={() => edit(booking)}
                    >
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

          <aside
            className={`booking-pane ${editing ? "editing-mode" : ""}`}
            id="booking-form"
          >
            <div className="panel-tag">
              <span>
                {editing ? "EDIT YOUR BOOKING" : "BOOK A ROOM"}
              </span>
              <span>
                {editing ? "EDIT MODE" : "FORM 01"}
              </span>
            </div>

            <h2>
              {editing
                ? "✏️ Edit Your Booking"
                : "Make a reservation"}
            </h2>

            <p className="booking-description">
              {editing
                ? "You are editing an existing reservation. Make your changes and click Save changes, or cancel to keep the original booking."
                : "Choose a room and date, check availability, then confirm your reservation."}
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

            <form onSubmit={submit} noValidate>
              <label>
                <span>Room number</span>

                <select
                  value={form.roomNumber}
                  onChange={e => {
                    setForm(f => ({
                      ...f,
                      roomNumber: e.target.value
                    }));
                    setError("");
                    setNotice("");
                  }}
                >
                  <option value="">Select a room</option>
                  {rooms.map(room => (
                    <option key={room} value={room}>
                      {room}
                    </option>
                  ))}
                </select>
              </label>

              <div className="date-pair">
                <label>
                  <span>Start date</span>
                  <input
                    type="date"
                    value={form.startDate}
                    onChange={e => {
                      setForm(f => ({
                        ...f,
                        startDate: e.target.value
                      }));
                      setError("");
                      setNotice("");
                    }}
                  />
                </label>

                <label>
                  <span>End date</span>
                  <input
                    type="date"
                    value={form.endDate}
                    onChange={e => {
                      setForm(f => ({
                        ...f,
                        endDate: e.target.value
                      }));
                      setError("");
                      setNotice("");
                    }}
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
                Start and end dates are required.
                The end date is not included in the reservation.
                Bookings cannot overlap for the same room.
              </p>

              <button
                className="availability-check"
                type="button"
                onClick={check}
              >
                Check availability
              </button>

              <button className="reserve-button" type="submit">
                {editing ? "Save changes" : "Confirm booking"}
              </button>

              {editing && (
                <button
                  className="cancel-edit"
                  type="button"
                  onClick={cancelEdit}
                >
                  Cancel editing
                </button>
              )}
            </form>

            <div className="right-foot">
              <span>✦</span>
              Need a room for a group? Find an open date and
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
