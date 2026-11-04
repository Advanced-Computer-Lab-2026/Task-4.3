import React from 'react';

export default function AvailabilityView({
  rooms,
  bookings,
  week,
  setWeek,
  view,
  setView,
  onPick
}) {
  const addDays = (iso, days) => {
    const t = new Date(`${iso}T12:00:00Z`);
    t.setUTCDate(t.getUTCDate() + days);
    return t.toISOString().slice(0, 10);
  };

  const human = (iso) => {
    return new Date(`${iso}T12:00:00Z`).toLocaleDateString('en-GB', { timeZone: 'UTC', day: 'numeric', month: 'short' });
  };

  const weekDay = (iso) => {
    return new Date(`${iso}T12:00:00Z`).toLocaleDateString('en-GB', { timeZone: 'UTC', weekday: 'short' });
  };

  const days = Array.from({ length: 7 }, (_, i) => addDays(week, i));
  const roomList = view === 'All rooms' ? rooms : rooms.filter(r => r === view);
  const occupied = (room, date) => bookings.find(b => b.roomNumber === room && date >= b.startDate && date < b.endDate);

  return (
    <section className="calendar-pane">
      <div className="calendar-head">
        <div>
          <span className="eyebrow">AVAILABILITY CALENDAR</span>
          <h2>Rooms by day</h2>
        </div>
        <div className="weeknav">
          <button aria-label="Previous week" onClick={() => setWeek(addDays(week, -7))}>←</button>
          <strong>{human(week)} – {human(addDays(week, 6))}</strong>
          <button aria-label="Next week" onClick={() => setWeek(addDays(week, 7))}>→</button>
        </div>
      </div>
      <div className="calendar-controls">
        <label>Location
          <select value={view} onChange={e => setView(e.target.value)}>
            <option>All rooms</option>
            {rooms.map(r => <option key={r}>{r}</option>)}
          </select>
        </label>
        <span className="legend"><i className="booked"/> Reserved</span>
        <span className="legend"><i className="free"/> Available</span>
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
          {roomList.map((room) => (
            <React.Fragment key={room}>
              <div className="roomname">
                <strong>{room}</strong>
                <small>Study room · {room[0]}</small>
              </div>
              {days.map(day => {
                const b = occupied(room, day);
                return (
                  <button
                    key={room + day}
                    title={`${room}, ${day}: ${b ? 'Reserved' : 'Available'}`}
                    className={'slot ' + (b ? 'taken' : 'available')}
                    onClick={() => onPick(room, day)}
                  >
                    <span>{b ? 'Booked' : 'Open'}</span>
                    {b && <small>{b.owner === 'you' ? 'Your booking' : 'Reserved'}</small>}
                  </button>
                );
              })}
            </React.Fragment>
          ))}
        </div>
      </div>
      <p className="calendar-note">Cells show individual dates. Reservations may span several dates; a day marked "Open" does not guarantee the full range you choose will be available.</p>
    </section>
  );
}
