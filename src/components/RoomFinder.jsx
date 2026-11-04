import React from 'react';
import {human} from '../booking.js';

export default function RoomFinder({search,errors,applied,freeRooms,total,editing,onChange,onSearch,onClear,onChoose}){
  const invalid=field=>errors[field]?{'aria-invalid':true,'aria-describedby':`find-${field}-error`}:{};
  return <section className="finder" aria-labelledby="finder-title">
    <h2 id="finder-title" tabIndex={-1}>Which rooms are free for my dates?</h2>
    <form className="finder-form" onSubmit={onSearch} noValidate>
      <label><span>From</span><input id="find-start" type="date" value={search.startDate} onChange={e=>onChange('startDate',e.target.value)} {...invalid('startDate')}/>{errors.startDate&&<small id="find-startDate-error" className="field-error">{errors.startDate}</small>}</label>
      <label><span>Until</span><input id="find-end" type="date" value={search.endDate} onChange={e=>onChange('endDate',e.target.value)} {...invalid('endDate')}/>{errors.endDate&&<small id="find-endDate-error" className="field-error">{errors.endDate}</small>}</label>
      <button className="button primary" type="submit">Find free rooms</button>
      {(applied||search.startDate||search.endDate)&&<button className="button quiet" type="button" onClick={onClear}>Clear</button>}
    </form>
    <div role="status">
      {applied&&<div className="finder-results">
        <p><strong>{freeRooms.length} of {total} rooms</strong> free from {human(applied.startDate)} until {human(applied.endDate)}</p>
        {freeRooms.length===0&&<p className="muted">Try a shorter stay or move your dates by a few days.</p>}
        <ul>{freeRooms.map(room=><li key={room}><button className="room-result" type="button" aria-label={`${editing?'Move booking to':'Book'} ${room}`} onClick={()=>onChoose(room)}><strong>{room}</strong><span>{editing?'Move here':'Book'}</span></button></li>)}</ul>
      </div>}
    </div>
  </section>;
}
