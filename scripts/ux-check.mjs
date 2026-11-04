const endpoint = await fetch('http://127.0.0.1:9222/json/list').then(response => response.json());
const page = endpoint.find(item => item.type === 'page' && item.url.startsWith('http://localhost:5174'));
if (!page) throw new Error('No headless browser page found.');

const socket = new WebSocket(page.webSocketDebuggerUrl);
await new Promise((resolve, reject) => {
  socket.addEventListener('open', resolve, { once: true });
  socket.addEventListener('error', reject, { once: true });
});

let sequence = 0;
const pending = new Map();
socket.addEventListener('message', event => {
  const message = JSON.parse(event.data);
  if (!message.id || !pending.has(message.id)) return;
  const { resolve, reject } = pending.get(message.id);
  pending.delete(message.id);
  if (message.error) reject(new Error(message.error.message));
  else resolve(message.result);
});

function command(method, params = {}) {
  return new Promise((resolve, reject) => {
    const id = ++sequence;
    pending.set(id, { resolve, reject });
    socket.send(JSON.stringify({ id, method, params }));
  });
}

async function evaluate(expression) {
  const result = await command('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.text);
  return result.result.value;
}

async function waitFor(test, message) {
  for (let attempt = 0; attempt < 60; attempt += 1) {
    if (await evaluate(test)) return;
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  throw new Error(message);
}

async function setField(selector, value) {
  await evaluate(`(() => { const element=document.querySelector(${JSON.stringify(selector)}); const setter=Object.getOwnPropertyDescriptor(element instanceof HTMLTextAreaElement?HTMLTextAreaElement.prototype:HTMLInputElement.prototype,'value').set; setter.call(element,${JSON.stringify(value)}); element.dispatchEvent(new Event('input',{bubbles:true})); })()`);
}

function check(condition, message) {
  if (!condition) throw new Error(message);
  console.log(`PASS: ${message}`);
}

await command('Page.enable');
await command('Runtime.enable');
await evaluate(`localStorage.clear(); location.reload()`);
await waitFor(`document.querySelectorAll('.slot').length===126`, 'Application did not render the 18-room calendar.');
check(await evaluate(`document.querySelectorAll('.roomname').length===18`), 'all 18 rooms and availability render');
check(await evaluate(`(() => { const labels=[...document.querySelector('.topbar nav').querySelectorAll('button')].map(button=>button.textContent.trim()); return labels.length===2&&labels[0]==='Availability'&&labels[1]==='Reset demo'; })()`), 'top header contains only Availability and Reset demo');
check(await evaluate(`document.querySelector('.topbar nav [aria-current="page"]').textContent.trim()==='Availability'`), 'Availability has the active top-navigation state');
check(await evaluate(`document.querySelectorAll('.internal-nav button').length===3 && document.querySelector('.internal-nav').textContent.includes('Make a reservation') && document.querySelector('.internal-nav').textContent.includes('Change reservation') && document.querySelector('.internal-nav').textContent.includes('My reservations')`), 'single page has all three requested internal navigation controls');
check(await evaluate(`document.querySelectorAll('.reservation-card').length===8 && [...document.querySelectorAll('.reservation-card')].every(card=>card.textContent.includes('Room')&&card.textContent.includes('Dates')&&card.textContent.includes('Purpose')&&card.textContent.includes('Change reservation'))`), 'written list remains below the schedule with eight labelled personal cards');
check(await evaluate(`document.querySelector('#booking-form').compareDocumentPosition(document.querySelector('#availability-schedule')) & Node.DOCUMENT_POSITION_FOLLOWING`), 'vertical reservation form appears before the schedule');
check(await evaluate(`getComputedStyle(document.querySelector('#booking-form form')).flexDirection==='column'`), 'reservation form uses a vertical layout');
await evaluate(`[...document.querySelectorAll('.internal-nav button')].find(button=>button.textContent==='Change reservation').click()`);
await waitFor(`document.querySelector('.internal-status')?.textContent.includes('Choose Change reservation on one of your bookings below.')`, 'Unselected Change reservation guidance did not render.');
check(await evaluate(`document.querySelector('.internal-nav button[aria-pressed="true"]').textContent==='Change reservation'`), 'unselected Change reservation control remains visibly active while guiding the user');
await evaluate(`[...document.querySelectorAll('.internal-nav button')].find(button=>button.textContent==='My reservations').click()`);
await waitFor(`document.querySelector('.schedule-highlight-mine')?.textContent.includes('Highlighted')`, 'My reservations highlight mode did not render.');
check(await evaluate(`document.querySelector('.internal-status').textContent.includes('Your reservations are highlighted in the schedule.') && document.querySelector('.internal-status button').textContent.includes('View written My reservations')`), 'highlight mode explains the state and links to the written list');
check(await evaluate(`document.querySelectorAll('.schedule-highlight-mine .slot.personal').length>0 && [...document.querySelectorAll('.schedule-highlight-mine .slot.personal')].every(slot=>slot.textContent.includes('Highlighted')) && ![...document.querySelectorAll('.schedule-highlight-mine .slot.reserved')].some(slot=>slot.textContent.includes('Highlighted'))`), 'My reservations mode highlights only the current user schedule slots');
await evaluate(`[...document.querySelectorAll('.internal-nav button')].find(button=>button.textContent==='Make a reservation').click()`);
await waitFor(`document.activeElement.id==='booking-heading'`, 'Make a reservation did not focus the form heading.');
check(await evaluate(`document.querySelector('.internal-nav button[aria-pressed="true"]').textContent==='Make a reservation' && Boolean(document.querySelector('.create-mode'))`), 'Make a reservation activates focused create mode');

const originalWeek = await evaluate(`document.querySelector('.weeknav strong').textContent`);
await evaluate(`document.querySelector('[aria-label="Next week"]').click()`);
await waitFor(`document.querySelector('.weeknav strong').textContent!==${JSON.stringify(originalWeek)}`, 'Next week did not update.');
await evaluate(`document.querySelector('[aria-label="Previous week"]').click()`);
check(await evaluate(`document.querySelector('.weeknav strong').textContent===${JSON.stringify(originalWeek)}`), 'previous and next week navigation work');
check(await evaluate(`document.querySelector('.slot.reserved').disabled && document.querySelector('.slot.personal').disabled && !document.querySelector('.slot.available').disabled`), 'reserved and personal dates are disabled while available dates are actionable');
check(await evaluate(`document.querySelector('.slot.available').textContent.includes('Available') && document.querySelector('.slot.available').textContent.includes('Select') && document.querySelector('.slot.reserved').textContent.includes('Booked') && document.querySelector('.slot.reserved').textContent.includes('Reserved') && document.querySelector('.slot.personal').textContent.includes('Your booking')`), 'available, reserved, and personal slots have distinct state text');
check(await evaluate(`(() => { const states=['.slot.available','.slot.reserved','.slot.personal'].map(selector=>getComputedStyle(document.querySelector(selector)).backgroundColor); return new Set(states).size===3; })()`), 'available, reserved, and personal slots use three distinct backgrounds');
check(await evaluate(`document.querySelector('.calendar-controls').textContent.includes('Available') && document.querySelector('.calendar-controls').textContent.includes('Reserved') && document.querySelector('.calendar-controls').textContent.includes('Your booking') && document.querySelector('.calendar-controls').textContent.includes('Selected')`), 'legend names all four calendar states');
await evaluate(`document.querySelector('.slot.available').click()`);
await waitFor(`document.querySelector('.slot.slot-selected')?.textContent.includes('Selected')`, 'Selected slot state did not render.');
check(await evaluate(`document.querySelector('.slot.slot-selected').getAttribute('aria-pressed')==='true' && document.querySelector('.slot.slot-selected').textContent.includes('✓')`), 'selected slot has a check indicator and programmatic pressed state');
check(await evaluate(`getComputedStyle(document.querySelector('.slot.slot-selected')).outlineStyle!=='none'`), 'selected slot has a strong non-color-only outline');
await setField('input[list="rooms"]', '');
await setField('input[type="date"]', '');
await evaluate(`(() => { const field=document.querySelectorAll('input[type="date"]')[1]; const setter=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set; setter.call(field,''); field.dispatchEvent(new Event('input',{bubbles:true})); })()`);

await evaluate(`document.querySelector('.availability-check').click()`);
await waitFor(`document.querySelectorAll('.field-error').length===3`, 'Required field errors did not render.');
check(await evaluate(`JSON.parse(localStorage.getItem('acl-roomgrid-18rooms-v1')).length===40`), 'missing required fields are rejected without creating a booking');

await setField('input[list="rooms"]', 'A1-203');
await setField('input[type="date"]', '2026-11-12');
await setField('input[type="date"]:nth-of-type(1)', '2026-11-12').catch(() => {});
await evaluate(`(() => { const fields=document.querySelectorAll('input[type="date"]'); const setter=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set; setter.call(fields[1],'2026-11-12'); fields[1].dispatchEvent(new Event('input',{bubbles:true})); })()`);
await evaluate(`document.querySelector('.availability-check').click()`);
await waitFor(`document.querySelector('#end-error')?.textContent.includes('after')`, 'Date ordering error did not render.');
check(await evaluate(`JSON.parse(localStorage.getItem('acl-roomgrid-18rooms-v1')).length===40`), 'equal start and end dates are rejected without altering bookings');

await evaluate(`(() => { const fields=document.querySelectorAll('input[type="date"]'); const setter=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set; setter.call(fields[1],'2026-11-11'); fields[1].dispatchEvent(new Event('input',{bubbles:true})); })()`);
await evaluate(`document.querySelector('.availability-check').click()`);
await waitFor(`document.querySelector('#end-error')?.textContent.includes('after')`, 'Earlier end date error did not render.');
check(await evaluate(`JSON.parse(localStorage.getItem('acl-roomgrid-18rooms-v1')).length===40`), 'end date earlier than start date is rejected without altering bookings');

await evaluate(`(() => { const fields=document.querySelectorAll('input[type="date"]'); const setter=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set; setter.call(fields[0],'2026-11-09'); fields[0].dispatchEvent(new Event('input',{bubbles:true})); setter.call(fields[1],'2026-11-11'); fields[1].dispatchEvent(new Event('input',{bubbles:true})); })()`);
await evaluate(`document.querySelector('.availability-check').click()`);
await waitFor(`document.querySelector('.error')?.textContent.includes('reserved from')`, 'Overlap details did not render.');
check(await evaluate(`JSON.parse(localStorage.getItem('acl-roomgrid-18rooms-v1')).length===40`), 'overlapping reservation is rejected without altering bookings');

await setField('input[list="rooms"]', 'D1-101');
await evaluate(`(() => { const fields=document.querySelectorAll('input[type="date"]'); const setter=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set; setter.call(fields[0],'2026-11-18'); fields[0].dispatchEvent(new Event('input',{bubbles:true})); setter.call(fields[1],'2026-11-20'); fields[1].dispatchEvent(new Event('input',{bubbles:true})); })()`);
await setField('textarea', 'Automated UX check');
check(await evaluate(`document.querySelector('.reserve-button').disabled`), 'confirmation remains disabled before availability is checked');
await evaluate(`document.querySelector('.availability-check').click()`);
await waitFor(`document.querySelector('.success')?.textContent.includes('You can now confirm this booking')`, 'Successful availability guidance did not render.');
check(await evaluate(`!document.querySelector('.reserve-button').disabled`), 'successful availability check enables confirmation');
await evaluate(`(() => { const field=document.querySelectorAll('input[type="date"]')[1]; const setter=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set; setter.call(field,'2026-11-21'); field.dispatchEvent(new Event('input',{bubbles:true})); })()`);
check(await evaluate(`document.querySelector('.reserve-button').disabled`), 'changing a checked date invalidates the check and disables confirmation');
await evaluate(`(() => { const field=document.querySelectorAll('input[type="date"]')[1]; const setter=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set; setter.call(field,'2026-11-20'); field.dispatchEvent(new Event('input',{bubbles:true})); document.querySelector('.availability-check').click(); })()`);
await waitFor(`!document.querySelector('.reserve-button').disabled`, 'Recheck did not enable confirmation.');
await evaluate(`document.querySelector('form').requestSubmit()`);
await waitFor(`JSON.parse(localStorage.getItem('acl-roomgrid-18rooms-v1')).length===41`, 'Valid booking was not created.');
check(await evaluate(`document.querySelector('.success')?.textContent.includes('reserved')`), 'valid non-overlapping reservation succeeds with clear confirmation');
await waitFor(`document.querySelectorAll('.reservation-card').length===9`, 'Created reservation did not appear in My bookings.');
check(await evaluate(`document.querySelector('.reservations-list').textContent.includes('Automated UX check')`), 'created reservation appears in the written My reservations list');

await evaluate(`[...document.querySelectorAll('.reservation-card')].find(card=>card.textContent.includes('Weekly study group')).querySelector('.change-reservation').click()`);
await waitFor(`Boolean(document.querySelector('.edit-mode'))`, 'Cancel-edit test did not open edit mode.');
check(await evaluate(`document.querySelector('input[list="rooms"]').value==='B2-104' && document.querySelectorAll('input[type="date"]')[0].value==='2026-11-09' && document.querySelectorAll('input[type="date"]')[1].value==='2026-11-11' && document.querySelector('textarea').value==='Weekly study group'`), 'edit form is pre-filled with the selected booking');
await setField('textarea', 'Should not be saved');
await evaluate(`document.querySelector('.cancel-edit').click()`);
await waitFor(`!document.querySelector('.edit-mode')`, 'Cancel editing did not close the edit panel.');
check(await evaluate(`document.querySelector('.reservations-list').textContent.includes('Weekly study group') && !document.querySelector('.reservations-list').textContent.includes('Should not be saved')`), 'cancel editing leaves the booking unchanged');

await evaluate(`location.reload()`);
await waitFor(`document.querySelectorAll('.slot').length===126`, 'Availability did not render after refresh.');
await waitFor(`document.querySelectorAll('.reservation-card').length===9`, 'Created booking did not persist after reload.');
check(true, 'created booking persists in localStorage after refresh');
await evaluate(`[...document.querySelectorAll('.reservation-card')].find(card=>card.textContent.includes('Automated UX check')).querySelector('.change-reservation').click()`);
await waitFor(`document.querySelector('.panel-tag').textContent.includes('EDIT RESERVATION')`, 'Edit mode did not open.');
await waitFor(`document.activeElement.id==='booking-heading'`, 'Edit action did not move focus to the form heading.');
check(true, 'edit action moves focus to the clearly identified edit form');
check(await evaluate(`document.querySelector('input[list="rooms"]').value==='D1-101' && document.querySelectorAll('input[type="date"]')[0].value==='2026-11-18' && document.querySelectorAll('input[type="date"]')[1].value==='2026-11-20' && document.querySelector('textarea').value==='Automated UX check'`), 'Change reservation opens the correct pre-filled booking');
check(await evaluate(`document.querySelector('.internal-nav button[aria-pressed="true"]').textContent==='Change reservation'`), 'editing activates Change reservation in the internal navigation');
await evaluate(`document.querySelector('[aria-label="Next week"]').click()`);
await waitFor(`document.querySelectorAll('.slot.booking-selected').length>0`, 'Selected edit booking was not highlighted when its week became visible.');
check(true, 'selected edit booking is highlighted in the schedule when visible');
check(await evaluate(`document.querySelector('.reserve-button').disabled`), 'save changes is disabled until edited dates are checked');
await evaluate(`document.querySelector('.availability-check').click()`);
await waitFor(`!document.querySelector('.reserve-button').disabled`, 'Availability check did not enable Save changes.');
await setField('textarea', 'Updated UX check');
await evaluate(`document.querySelector('form').requestSubmit()`);
await waitFor(`document.querySelector('.reservations-list').textContent.includes('Updated UX check')`, 'Booking edit did not save.');
check(await evaluate(`document.querySelectorAll('.reservation-card').length===9 && JSON.parse(localStorage.getItem('acl-roomgrid-18rooms-v1')).length===41`), 'saving an edit updates the existing booking without creating a duplicate');
await evaluate(`location.reload()`);
await waitFor(`document.querySelectorAll('.slot').length===126`, 'Availability did not return after edit refresh.');
check(await evaluate(`document.querySelectorAll('.slot.personal').length>0 && document.querySelectorAll('.slot.reserved').length>0`), 'own and other-user reservations remain distinguishable');
await waitFor(`document.querySelector('.reservations-list')?.textContent.includes('Updated UX check')`, 'Edited booking did not persist.');
check(true, 'current user can edit a booking and the edit persists after refresh');
check(await evaluate(`![...document.querySelectorAll('.reservation-card')].some(card=>card.textContent.includes('Peer tutoring'))`), 'other users bookings have no edit control in My bookings');

await command('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Tab', code: 'Tab' });
await command('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Tab', code: 'Tab' });
check(await evaluate(`document.activeElement.matches('button,select,input,textarea,[tabindex="0"]')`), 'keyboard Tab reaches an interactive control');
check(await evaluate(`getComputedStyle(document.activeElement).outlineStyle!=='none'`), 'keyboard-focused control has a visible focus outline');

await evaluate(`window.confirm=()=>false; [...document.querySelectorAll('button')].find(button=>button.textContent.includes('Reset demo')).click()`);
check(await evaluate(`JSON.parse(localStorage.getItem('acl-roomgrid-18rooms-v1')).length===41 && document.querySelectorAll('.reservation-card').length===9`), 'canceling Reset demo confirmation preserves current data');
await evaluate(`window.confirm=()=>true`);
await evaluate(`[...document.querySelectorAll('button')].find(button=>button.textContent.includes('Reset demo')).click()`);
await waitFor(`JSON.parse(localStorage.getItem('acl-roomgrid-18rooms-v1')).length===40 && document.querySelectorAll('.slot').length===126`, 'Reset did not restore seed data or Availability view.');
await waitFor(`document.querySelectorAll('.reservation-card').length===8`, 'Reset did not restore eight personal bookings.');
check(await evaluate(`!document.body.textContent.includes('Updated UX check')`), 'Reset demo restores original example records and eight personal bookings');

await command('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
await new Promise(resolve => setTimeout(resolve, 150));
check(await evaluate(`document.documentElement.scrollWidth===390`), '390px layout has no page-level horizontal overflow');
check(await evaluate(`(() => { const rect=document.querySelector('.reset-button').getBoundingClientRect(); return rect.left>=0 && rect.right<=390; })()`), 'Reset demo remains visible at 390px');

await command('Browser.close');
