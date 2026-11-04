import React from 'react';

export default function ProfileView({ bookings }) {
  const myBookings = bookings.filter(b => b.owner === 'you');

  return (
    <div className="profile-page">
      <div className="profile-container">
        <div className="profile-card">
          <div className="profile-header">
            <div className="profile-avatar">YOU</div>
            <div className="profile-info">
              <h2>Joudy Yasser</h2>
              <span className="student-id">ID: 2026-48291</span>
              <span className="major">Architecture & Urban Planning</span>
            </div>
          </div>
          <div className="profile-stats">
            <div className="stat-tile">
              <span className="stat-label">Total Bookings</span>
              <strong className="stat-value">{myBookings.length}</strong>
            </div>
            <div className="stat-tile">
              <span className="stat-label">Active This Week</span>
              <strong className="stat-value">{myBookings.filter(b => {
                const now = new Date();
                return new Date(b.startDate) >= new Date('2026-11-01') && new Date(b.endDate) <= new Date('2026-11-30');
              }).length}</strong>
            </div>
          </div>
          <div className="profile-details">
            <h3>Account Settings</h3>
            <div className="detail-row">
              <span>Notification Preferences</span>
              <span className="status-badge">Enabled</span>
            </div>
            <div className="detail-row">
              <span>Default Room Group</span>
              <span className="status-badge">Block A</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
