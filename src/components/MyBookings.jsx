import React from 'react';
import {human,stayLabel} from '../booking.js';

export default function MyBookings({bookings,onEdit,onFindRoom}){
  return <section className="reservations" aria-labelledby="my-bookings-title">
    <div className="reservations-head"><h2 id="my-bookings-title">Your bookings</h2><span className="muted">{bookings.length} current {bookings.length===1?'record':'records'}</span></div>
    {bookings.length===0?<div className="empty"><p>No reservations yet.</p><button className="button primary" type="button" onClick={onFindRoom}>Find a room</button></div>:
    <ul className="reservations-list">{bookings.map(b=><li key={b.id} className="reservation">
      <div className="room-chip">{b.roomNumber}</div>
      <div className="reservation-body">
        <strong>{human(b.startDate)} – {human(b.endDate)}</strong>
        <small>{stayLabel(b.startDate,b.endDate)}</small>
        <small>{b.purpose||'No purpose entered'}</small>
      </div>
      <button className="button" type="button" aria-label={`Change ${b.roomNumber}, ${human(b.startDate)} to ${human(b.endDate)}`} onClick={()=>onEdit(b)}>Change</button>
    </li>)}</ul>}
  </section>;
}
