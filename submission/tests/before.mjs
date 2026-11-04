import { launch, H } from './cdp.mjs';
const out = process.argv[2];
const b = await launch(out);
const URL = 'http://localhost:5173/';
try {
  await b.size(1440);
  await b.goto(URL);
  await b.eval(`localStorage.clear();`); await b.goto(URL);
  await b.shot('before-1-overview');

  // Problem: a booked cell can be clicked and fills the form; submit gives a vague error.
  await b.eval(H + `$('[title="A1-203, 2026-11-09: Reserved"]').click();await wait(300);`);
  await b.shot('before-2-booked-cell-fills-form', '.booking-pane');
  await b.eval(H + `$('.reserve-button').click();await wait(300);`);
  await b.shot('before-3-vague-error', '.booking-pane');

  // Problem: range check — an "Open" start day whose range overlaps a booking.
  await b.eval(H + `$('[title="A2-106, 2026-11-09: Available"]').click();await wait(200);setVal($$('.booking-pane input[type=date]')[1],'2026-11-12');await wait(200);$('.reserve-button').click();await wait(300);`);
  await b.shot('before-4-range-overlap-vague-error', '.pagegrid');

  // Problem: exclusive end date shown as if inclusive in "Your bookings".
  await b.shot('before-5-your-bookings-dates', '#my-reservations');

} finally { await b.close(); }
