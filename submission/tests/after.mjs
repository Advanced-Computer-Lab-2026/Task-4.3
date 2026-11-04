import { launch, H } from './cdp.mjs';
const out = process.argv[2];
const b = await launch(out);
const URL = 'http://localhost:5173/';
let failures = 0;
async function expect(name, expr) {
  const v = await b.eval(H + expr);
  console.log((v === true ? 'PASS ' : 'FAIL ') + name + (v === true ? '' : '  -> ' + JSON.stringify(v)));
  if (v !== true) failures++;
}
const cellSel = (room, day) => `[data-room="${room}"][data-day="${day}"]`;
const click = (room, day) => b.eval(H + `$('${cellSel(room, day)}').click();await wait(250);`);
const count = `JSON.parse(localStorage.getItem('acl-roomgrid-18rooms-v1')).length`;
const fb = `($('.feedback')?.textContent||'')`;

try {
  await b.size(1440);
  await b.goto(URL);
  await b.eval(`localStorage.clear();`); await b.goto(URL);
  await b.shot('after-1-overview');

  // Fix 2: others' bookings cannot be picked; own bookings look different.
  await expect('booked-by-others cell is disabled', `return $('${cellSel('A1-203', '2026-11-09')}').disabled===true`);
  await expect('own booking cell is marked "Yours" and clickable', `const c=$('${cellSel('A2-107', '2026-11-09')}');return c.classList.contains('mine')&&!c.disabled&&c.textContent.includes('Yours')`);
  await b.eval(H + `$('${cellSel('A1-203', '2026-11-09')}').click();await wait(200);`);
  await expect('clicking a disabled booked cell leaves the form empty', `return $('#booking-form input').value===''`);

  // Fix 3: two-click range selection with live availability.
  await click('A3-209', '2026-11-12');
  await expect('first click sets 1-day range', `const [s,e]=$$('.booking-pane input[type=date]');return s.value==='2026-11-12'&&e.value==='2026-11-13'||[s.value,e.value]`);
  await click('A3-209', '2026-11-14');
  await expect('second click extends to last day (end = day after)', `const [s,e]=$$('.booking-pane input[type=date]');return s.value==='2026-11-12'&&e.value==='2026-11-15'||[s.value,e.value]`);
  await expect('3 cells highlighted as selected', `return $$('.slot.chosen').length===3||$$('.slot.chosen').length`);
  await expect('live status says available, with inclusive dates', `return ${fb}.includes('free Thu 12 Nov – Sat 14 Nov (3 days)')||${fb}`);
  await b.shot('after-2-range-selected', '.pagegrid');

  // Fix 1 + 3: clash shown before submit, then a specific error on submit (unsuccessful action).
  await click('A2-106', '2026-11-09');
  await b.eval(H + `setVal($$('.booking-pane input[type=date]')[1],'2026-11-12');await wait(250);`);
  await expect('clash cells marked red in grid', `return $$('.slot.clash').length===2||$$('.slot.clash').length`);
  await expect('live warning names the clashing booking', `return ${fb}.includes('A2-106 is already booked Tue 10 Nov – Thu 12 Nov')||${fb}`);
  await b.eval(H + `$('.reserve-button').click();await wait(300);`);
  await expect('submit shows specific alert', `const a=$('[role=alert]');return !!a&&a.textContent.includes('Not booked yet.')&&a.textContent.includes('Tue 10 Nov – Thu 12 Nov')||a?.textContent`);
  await expect('date fields flagged invalid', `return $$('.booking-pane input[type=date]').every(i=>i.getAttribute('aria-invalid')==='true')`);
  await expect('nothing saved on failure', `return ${count}===40||${count}`);
  await expect('offers next free dates and other rooms', `const t=$$('.fixes button').map(b=>b.textContent);return t[0]==='Use Fri 13 Nov – Sun 15 Nov'&&t.length===4||t`);
  await b.shot('after-3-specific-error-with-fixes', '.pagegrid');

  // One-click fix then success (main action).
  await b.eval(H + `byText('.fixes button','Same dates in').click();await wait(250);`);
  await expect('after fix, status is available', `return $('.feedback.ok')!==null||${fb}`);
  await b.eval(H + `setVal($('.booking-pane textarea'),'Study group');$('.reserve-button').click();await wait(300);`);
  await expect('booking saved (41 records)', `return ${count}===41||${count}`);
  await expect('success notice names room and dates', `return ($('.success')?.textContent||'').startsWith('Room reserved:')||$('.success')?.textContent`);
  await b.shot('after-4-booked-success', '.booking-pane');

  // Other validation paths still work.
  await b.eval(H + `$('.reserve-button').click();await wait(250);`);
  await expect('empty submit lists missing fields', `return ($('[role=alert]')?.textContent||'').includes('Add a room number, a start date and an end date.')||$('[role=alert]')?.textContent`);
  await b.eval(H + `setVal($('.booking-pane input[list]'),'A3-209');const [s,e]=$$('.booking-pane input[type=date]');setVal(s,'2026-11-12');setVal(e,'2026-11-11');await wait(100);$('.reserve-button').click();await wait(250);`);
  await expect('end before start explained, end field flagged', `return ($('[role=alert]')?.textContent||'').includes('end date must be after the start date')&&$$('.booking-pane input[type=date]')[1].getAttribute('aria-invalid')==='true'`);
  await b.eval(H + `setVal($$('.booking-pane input[type=date]')[0],'2026-11-16');setVal($$('.booking-pane input[type=date]')[1],'2026-11-19');await wait(100);$('.availability-check').click();await wait(250);`);
  await expect('Check availability still reports no conflict', `return ($('.success')?.textContent||'')==='No conflict detected for the selected dates.'||$('.success')?.textContent`);
  await b.eval(H + `setVal($('.booking-pane input[list]'),'');const [s,e]=$$('.booking-pane input[type=date]');setVal(s,'');setVal(e,'');await wait(100);`);

  // Fix 2 + 4: click your own booking in the grid to edit; adjust it.
  await click('A2-107', '2026-11-09');
  await expect('own-cell click opens edit mode', `return $('#booking-form h2').textContent==='Change reservation'&&$('.booking-pane.is-editing')!==null`);
  await b.eval(H + `setVal($$('.booking-pane input[type=date]')[1],'2026-11-12');await wait(250);`);
  await b.shot('after-5-editing-own-booking', '.pagegrid');
  await b.eval(H + `$('.reserve-button').click();await wait(300);`);
  await expect('edit saved, still 41 records', `return ${count}===41&&($('.success')?.textContent||'').startsWith('Booking updated')`);

  // My bookings is its own page.
  await expect('nav has only the two pages (no Reset)', `return $$('.topbar nav button').map(b=>b.textContent).join('|')==='Availability|My bookings9'||$$('.topbar nav button').map(b=>b.textContent).join('|')`);
  await b.eval(H + `byText('.topbar nav button','My bookings').click();await wait(300);`);
  await expect('My bookings page replaces the calendar', `return location.hash==='#my-bookings'&&!$('.room-cal')&&$('#my-reservations')!==null&&$('.intro h1').textContent==='My bookings'`);
  await expect('booking form still beside the list', `return $('#booking-form')!==null`);
  await expect('list shows booked days, not checkout day', `return byText('.reservation','A2-107').textContent.includes('Mon 9 Nov – Wed 11 Nov')&&byText('.reservation','A2-107').textContent.includes('3 days')||byText('.reservation','A2-107').textContent`);

  // Change from the My bookings page edits in place.
  await b.eval(H + `byText('.reservation','B1-206').querySelector('.change').click();await wait(500);`);
  await expect('Change opens edit on the same page', `return location.hash==='#my-bookings'&&$('#booking-form h2').textContent==='Change reservation'&&byText('.reservation','B1-206').classList.contains('is-editing')`);
  await expect('room input focused', `return document.activeElement===$('.booking-pane input[list]')`);
  await expect('edited booking excluded from its own clash check', `return $('.feedback.ok')!==null||${fb}`);
  await b.shot('after-6-my-bookings-page');
  await b.eval(H + `byText('.cancel-edit','Cancel').click();await wait(200);`);

  // Show in calendar goes back to Availability at that booking's week.
  await b.eval(H + `byText('.reservation','B1-206').querySelector('.link').click();await wait(400);`);
  await expect('Show in calendar opens the booking week', `return location.hash==='#availability'&&$('.weeknav strong').textContent.includes('16 Nov')||[location.hash,$('.weeknav strong')?.textContent]`);
  await b.eval(H + `history.back();await wait(400);`);
  await expect('browser Back returns to My bookings', `return location.hash==='#my-bookings'&&$('#my-reservations')!==null`);

  // Persistence; page survives a reload.
  await b.goto(URL + '#my-bookings');
  await expect('reload keeps the page and the changes', `return $('#my-reservations')!==null&&${count}===41`);

  // Reset lives in the booking panel and asks first.
  await b.eval(H + `$('.booking-pane .reset-button').click();await wait(200);`);
  await expect('Reset asks for confirmation first', `return $('.reset-confirm')!==null&&${count}===41`);
  await b.shot('after-8-reset-confirm', '.booking-pane');
  await b.eval(H + `byText('.reset-confirm button','Keep my changes').click();await wait(200);`);
  await expect('"Keep my changes" cancels the reset', `return !$('.reset-confirm')&&${count}===41`);
  await b.eval(H + `$('.booking-pane .reset-button').click();await wait(200);byText('.reset-confirm button','Yes, reset').click();await wait(300);`);
  await expect('Reset demo restores 40 records, message next to it', `return ${count}===40&&($('.reset-zone [role=status]')?.textContent||'')==='Example bookings restored.'`);

  // Phone width: selection summary stays visible while browsing the grid.
  await b.size(390, 844);
  await b.goto(URL);
  await b.eval(H + `$('${cellSel('B3-301', '2026-11-10')}').scrollIntoView({block:'center'});await wait(200);$('${cellSel('B3-301', '2026-11-10')}').click();await wait(400);`);
  await expect('mobile selection bar visible in viewport', `const r=$('.selection-bar').getBoundingClientRect();return r.bottom<=innerHeight&&r.top>0||[r.top,r.bottom,innerHeight]`);
  const { data } = await b.send('Page.captureScreenshot', { format: 'png' });
  (await import('node:fs')).writeFileSync(out + '/after-7-mobile-selection-bar.png', Buffer.from(data, 'base64'));
  await b.eval(`localStorage.clear()`);
} finally { await b.close(); }
console.log(failures ? `${failures} FAILED` : 'ALL PASSED');
