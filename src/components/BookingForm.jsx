import React from 'react';
import {human,isKnownRoom,stayLabel} from '../booking.js';
import {rooms} from '../data.js';

function fieldProps(errors,field,extraIds=[]){
  const ids=[...(errors[field]?[`${field}-error`]:[]),...extraIds];
  return {'aria-invalid':ids.some(id=>id.endsWith('-error'))?true:undefined,'aria-describedby':ids.join(' ')||undefined};
}

export default function BookingForm({form,errors,notice,editingBooking,onChange,onSubmit,onCheck,onCancel,onShowFreeRooms}){
  const hasErrors=Object.keys(errors).length>0;
  const datesReady=form.startDate&&form.endDate&&form.endDate>form.startDate;
  const unknownRoom=form.roomNumber.trim()&&!isKnownRoom(form.roomNumber);
  const clashIds=errors.dates?['dates-error']:[];
  return <aside className={editingBooking?'booking-pane editing':'booking-pane'} id="booking-form" aria-labelledby="booking-form-title">
    <h2 id="booking-form-title" tabIndex={-1}>{editingBooking?'Change reservation':'Make a reservation'}</h2>
    {editingBooking&&<p className="editing-banner"><strong>Editing {editingBooking.roomNumber}, {human(editingBooking.startDate)} until {human(editingBooking.endDate)}.</strong> Saving replaces this booking. Choose new dates below or in the calendar.</p>}
    {notice&&<div className="success" role="status">{notice}</div>}
    {hasErrors&&<div className="error" role="alert">Nothing was saved. Fix the highlighted fields below.</div>}
    <form onSubmit={onSubmit} noValidate>
      <label className="field"><span>Room number</span>
        <input id="room-number" list="rooms" placeholder="e.g. B2-104" autoComplete="off" aria-required="true" value={form.roomNumber} onChange={e=>onChange('roomNumber',e.target.value)} {...fieldProps(errors,'roomNumber',unknownRoom?['room-warning']:[])}/>
        <datalist id="rooms">{rooms.map(r=><option key={r} value={r}/>)}</datalist>
        {errors.roomNumber&&<small id="roomNumber-error" className="field-error">{errors.roomNumber}</small>}
        {unknownRoom&&<small id="room-warning" className="field-note">This room isn't in the directory, so it won't appear in the calendar.</small>}
      </label>
      <div className="date-pair">
        <label className="field"><span>Start date</span>
          <input id="start-date" type="date" aria-required="true" value={form.startDate} onChange={e=>onChange('startDate',e.target.value)} {...fieldProps(errors,'startDate',clashIds)}/>
          {errors.startDate&&<small id="startDate-error" className="field-error">{errors.startDate}</small>}
        </label>
        <label className="field"><span>End date</span>
          <input id="end-date" type="date" aria-required="true" value={form.endDate} onChange={e=>onChange('endDate',e.target.value)} {...fieldProps(errors,'endDate',clashIds)}/>
          {errors.endDate&&<small id="endDate-error" className="field-error">{errors.endDate}</small>}
        </label>
      </div>
      {errors.dates&&<div className="clash"><p id="dates-error" className="field-error">{errors.dates}</p><button className="button quiet" type="button" onClick={onShowFreeRooms}>Show rooms free for these dates</button></div>}
      {datesReady&&!errors.dates&&<p className="stay-summary">{stayLabel(form.startDate,form.endDate)}</p>}
      {!datesReady&&!errors.endDate&&<p className="muted field-help">The room is free again on the end date.</p>}
      <label className="field"><span>Purpose (optional)</span>
        <textarea rows="3" placeholder="Meeting, group study..." value={form.purpose} onChange={e=>onChange('purpose',e.target.value)}/>
      </label>
      <div className="form-actions">
        <button className="button primary" type="submit">{editingBooking?'Save changes':'Confirm booking'}</button>
        <button className="button" type="button" onClick={onCheck}>Check availability</button>
        {editingBooking&&<button className="button quiet" type="button" onClick={onCancel}>Cancel editing</button>}
      </div>
    </form>
  </aside>;
}
