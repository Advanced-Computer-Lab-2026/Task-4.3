import React from 'react';

export default function MyBookingsView({ bookings, onEdit }) {
  const myBookings = bookings.filter(b => b.owner === 'you').sort((a, b) => a.startDate.localeCompare(b.startDate));

  const human = (iso) => {
    return new Date(`${iso}T12:00:00Z`).toLocaleDateString('en-GB', { timeZone: 'UTC', day: 'numeric', month: 'short' });
  };

  return (
    <section className="reservations">
      <div className="reservations-head">
        <h2>Your bookings</h2>
        <span>{myBookings.length} current records</span>
      </div>
      <div className="reservations-list">
        {myBookings.map(b => (
          <article key={b.id} className="reservation">
            <div className="room-chip">{b.roomNumber}</div>
            <div className="reservation-body">
              <strong>{human(b.startDate)} – {human(b.endDate)}</strong>
              <small>{b.purpose || 'No purpose entered'}</small>
            </div>
            <button onClick={() => onEdit(b)}>Change</button>
          </article>
        ))}
        {myBookings.length === 0 && <p>No reservations.</p>}
      </div>
    </section>
  );
}
