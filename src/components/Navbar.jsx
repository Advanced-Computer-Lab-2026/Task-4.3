import React from 'react';

export default function Navbar({ currentPage, setCurrentPage }) {
  const navItems = [
    { id: 'availability', label: 'Availability' },
    { id: 'my-bookings', label: 'My bookings' },
    { id: 'reserve', label: 'Make Reservation' },
    { id: 'profile', label: 'Profile' },
  ];

  return (
    <header className="topbar">
      <div className="mark" onClick={() => setCurrentPage('availability')} style={{ cursor: 'pointer' }}>
        <span className="mark-sq">R</span>
        <span>
          <strong>room<span>grid</span></strong>
          <small>Campus spaces</small>
        </span>
      </div>
      <nav>
        {navItems.map(item => (
          <button
            key={item.id}
            className={currentPage === item.id ? 'selected' : ''}
            onClick={() => setCurrentPage(item.id)}
          >
            {item.label}
          </button>
        ))}
      </nav>
      <div className="member">
        <span>Student dashboard</span>
        <div className="profile" onClick={() => setCurrentPage('profile')} style={{ cursor: 'pointer' }}>YOU</div>
      </div>
    </header>
  );
}
