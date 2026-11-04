import React, { useState } from 'react';

export default function ReservationView({
  form,
  setForm,
  editing,
  rooms,
  error,
  setError,
  notice,
  setNotice,
  onSubmit,
  onCheck,
  onCancel
}) {
  const [showConfirm, setShowConfirm] = useState(false);

  return (
    <aside className="booking-pane">
      <div className="panel-tag">
        <span>BOOK A ROOM</span>
        <span>FORM 01</span>
      </div>
      <h2>{editing ? 'Change reservation' : 'Make a reservation'}</h2>
      <p className="booking-description">Use this panel to request a room for your study group, meeting or activity.</p>
      {notice && <div className="success" role="status">{notice}</div>}
      {error && <div className="error" role="alert">{error}</div>}
      <form onSubmit={onSubmit}>
        <label>
          <span>Room number</span>
          <input
            list="rooms"
            placeholder="e.g., B2-104"
            value={form.roomNumber}
            onChange={e => setForm(f => ({ ...f, roomNumber: e.target.value }))}
          />
          <datalist id="rooms">
            {rooms.map(r => <option key={r} value={r} />)}
          </datalist>
        </label>
        <div className="date-pair">
          <label>
            <span>Start date</span>
            <input
              type="date"
              value={form.startDate}
              onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))}
            />
          </label>
          <label>
            <span>End date</span>
            <input
              type="date"
              value={form.endDate}
              onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))}
            />
          </label>
        </div>
        <label>
          <span>Purpose / optional</span>
          <textarea
            rows="5"
            placeholder="Meeting, group study..."
            value={form.purpose}
            onChange={e => setForm(f => ({ ...f, purpose: e.target.value }))}
          />
        </label>
        <p className="helper">Start and end dates are required. Reservations cannot overlap existing bookings for the same room.</p>
        <button className="availability-check" type="button" onClick={onCheck}>Check availability</button>

        <div className="form-actions">
          <button className="reserve-button" type="submit">{editing ? 'Save booking' : 'Confirm booking'}</button>
          {editing && (
            <button
              className="cancel-reserve-button"
              type="button"
              onClick={() => setShowConfirm(true)}
            >
              Cancel editing
            </button>
          )}
        </div>
      </form>
      <div className="right-foot">
        <span>✦</span> Need a room for a group? Find an open date and submit your request.
      </div>

      {showConfirm && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 className="modal-title">Confirm Cancellation</h3>
            <p>Are you sure you want to cancel your booking request?</p>
            <div className="modal-actions">
              <button className="modal-btn-secondary" onClick={() => setShowConfirm(false)}>No, keep editing</button>
              <button className="modal-btn-primary" onClick={() => { setShowConfirm(false); onCancel(); }}>Yes, cancel</button>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
