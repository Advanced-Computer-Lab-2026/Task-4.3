import React from 'react';
import {bookingOn,human,longDate,sameRoom,weekDay} from '../booking.js';
import {rooms} from '../data.js';

function Day({room,day,bookings,form,onOpenDay,onOwnBooking}){
  const booking=bookingOn(bookings,room,day);
  const selected=form.startDate&&form.endDate&&sameRoom(form.roomNumber,room)&&day>=form.startDate&&day<form.endDate;
  const cellClass=selected?'day selected':'day';
  if(booking&&booking.owner!=='you')return <td className={cellClass}><div className="slot taken"><span>Reserved</span><small>until {human(booking.endDate)}</small></div></td>;
  if(booking)return <td className={cellClass}><button type="button" className="slot mine" aria-label={`${room}, ${longDate(day)}: your booking. Change it`} onClick={()=>onOwnBooking(booking)}><span>Yours</span><small>Change</small></button></td>;
  return <td className={cellClass}><button type="button" className="slot available" aria-label={`${room}, ${longDate(day)}: open. Use this day`} onClick={()=>onOpenDay(room,day)}><span>Open</span></button></td>;
}

export default function RoomCalendar({days,roomList,bookings,form,view,freeRooms,onView,onWeek,onOpenDay,onOwnBooking}){
  return <section className="calendar" aria-labelledby="calendar-title">
    <div className="calendar-head">
      <h2 id="calendar-title">Rooms by day</h2>
      <div className="weeknav">
        <button type="button" aria-label="Previous week" onClick={()=>onWeek(-7)}>←</button>
        <strong aria-live="polite">{human(days[0])} – {human(days[6])}</strong>
        <button type="button" aria-label="Next week" onClick={()=>onWeek(7)}>→</button>
      </div>
    </div>
    <div className="calendar-controls">
      <label>Room <select value={view} onChange={e=>onView(e.target.value)}><option>All rooms</option>{rooms.map(r=><option key={r}>{r}</option>)}</select></label>
      <ul className="legend" aria-label="Legend">
        <li><i className="free"/>Open</li>
        <li><i className="booked"/>Reserved</li>
        <li><i className="own"/>Yours</li>
        <li><i className="chosen"/>In the form</li>
      </ul>
    </div>
    <p className="muted hint">Select an open day to start a booking, or one of your days to change it.</p>
    <div className="calendar-scroll" tabIndex={0} role="region" aria-labelledby="calendar-title">
      <table className="room-cal">
        <caption className="sr-only">Room availability from {human(days[0])} to {human(days[6])}</caption>
        <thead><tr><th scope="col" className="corner">Room</th>{days.map(d=><th scope="col" key={d}><strong>{weekDay(d)}</strong><span>{human(d)}</span></th>)}</tr></thead>
        <tbody>{roomList.map(room=><tr key={room}>
          <th scope="row" className="roomname"><strong>{room}</strong>{freeRooms?.includes(room)&&<small>Free for your dates</small>}</th>
          {days.map(day=><Day key={day} room={room} day={day} bookings={bookings} form={form} onOpenDay={onOpenDay} onOwnBooking={onOwnBooking}/>)}
        </tr>)}</tbody>
      </table>
    </div>
  </section>;
}
