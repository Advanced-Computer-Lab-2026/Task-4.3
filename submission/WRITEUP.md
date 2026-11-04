# UI/UX Rescue Challenge — Dorm Room Booking (RoomGrid)

**Scenario:** A student needs to find dates for a common room, reserve it, and later adjust their own reservation.

**Deliverables in this folder**

| Item | Where |
|---|---|
| Modified React files | `../src/App.jsx`, `../src/styles.css` |
| Before / after screenshots | `screenshots/before/`, `screenshots/after/` (1366×768 laptop viewport) |
| Justifications + AI suggestion refined/rejected | this file |

All original behaviour and validation is preserved: room and both dates required, end date strictly after start, no overlapping bookings for the same room, users can only change their own bookings, data stored in `localStorage`, Reset demo restores the sample records.

---

## The three core problems and fixes

### 1. Every failed booking showed the same generic error

**User goal:** understand why a reservation was refused so they can fix it and try again.

**Why it hurt:** whether the form was empty, the end date was before the start, or the room was already taken, "Confirm booking" always said *Reservation failed. Review the selected dates.* The user had to guess. The code actually computed the real reason (the "Check availability" button showed it) but `submit()` threw it away.

**Fix:** `issue()` now returns a specific, actionable message and `submit()` shows it:
- *Please enter a room number, a start date and an end date.* (lists only what's missing)
- *End date (11 Nov) must be after the start date (12 Nov).*
- *A1-203 is already reserved 9 Nov – 11 Nov. Choose different dates or another room.*
- *Room "X" is not in the directory…* (new guard for typos; previously a typo silently created a booking for a non-existent room)

Success messages were given the same treatment (*Room reserved: A2-106, 13 Nov – 16 Nov. It now appears under "Your bookings".*).

Screenshots: `before/03`, `before/04` → `after/08`, `after/09`, `after/10`.

### 2. Editing a booking gave no feedback

**User goal:** change their own reservation with confidence about what they are changing.

**Why it hurt:** clicking "Change" filled the form, but the form was a full screen below the list, nothing scrolled, no card was highlighted, every card still said "Change", and the only cue was the heading quietly switching to "Change reservation". It was easy to edit the wrong booking or not notice edit mode had started at all.

**Fix:** clicking Change scrolls to the form and focuses the room field; the form gets a teal border and an **EDITING** badge; the text states *You are editing A2-106, 13 Nov – 16 Nov*; the selected card is highlighted and its button becomes a disabled "Editing" label with "Editing in the form →"; the submit button reads "Save changes" and the cancel link says *Cancel editing (keep booking as it was)*.

Screenshots: `before/05` → `after/11`, `after/12`.

### 3. The calendar could not answer "is this room free for my dates?"

**User goal:** find a room that is free for a whole multi-night stay.

**Why it hurt:** cells were single nights. Clicking one silently set a 1-night booking. A footnote even admitted *a day marked "Open" does not guarantee the full range you choose will be available* — the core question of the scenario was pushed onto the user to work out by eye, and they only found out about a clash after submitting.

**Fix:** click a start night, then click a later night in the same room to select the range. All nights highlight; a status bar reports *A2-106 · 13 Nov – 16 Nov (3 nights) — ✓ Available*. If the range crosses a reserved night, the clashing cells turn red and the bar shows the exact conflict before the user ever presses Confirm. The highlight is derived from the form values, so typing dates in the form highlights the grid too (one source of truth). Single-click still books one night as before. Reserved nights cannot start a range and a range cannot be extended across a reservation: the nights beyond the next reservation grey out, and a refused click explains why (*Can't extend to 15 Nov — A1-203 is reserved from 13 Nov. The latest night you can book is 12 Nov.*). Clicking one of your own booked nights opens that booking for editing. Typed dates in the form are still validated as a safety net.

Screenshots: `before/06` → `after/03`, `after/04`, `after/07a`–`07c`.

## Additional improvements

4. **Layout:** the booking form is sticky on wide screens and the calendar scrolls in its own box with sticky day headers, so the grid, "Your bookings" and the form are never a full page apart. Side-by-side layout now starts at 961 px instead of 1200 px.
5. **Navigation:** "Availability" and "My bookings" are real section tabs (with a count badge); "Reset demo" — a destructive action — was moved out of the nav and needs two clicks (*Click again to confirm reset*, auto-cancels after 5 s). `after/13`–`15`.
6. **Colour coding on the calendar:** reserved nights are now a darker, diagonally striped grey-blue so they read as "unavailable" rather than just "a different shade"; the user's own bookings are amber with a matching legend entry and room chip, so "which of these are mine?" is answered at a glance without reading the small label. Conflicting nights in a selected range remain red.
7. **Removed decorative noise:** "FORM 01", the "YOU" avatar circle, the "✦ Need a room?" blurb, and the "Study room · A" subtitle (which just repeated the first letter of the room code) were removed or replaced with derived information ("Block A1 · Floor 2").

---

## AI design suggestion I refined / rejected

**Rejected — drag-to-select on the calendar.** When I asked for ways to make multi-night selection easier, the first options offered were (a) click-start/click-end, (b) mouse drag across cells, (c) a "show only rooms free for my dates" filter. Drag-to-select is the most familiar pattern, but it needs pointer-down/move/up handling, degrades badly on touch screens and keyboards, and would have consumed most of the 30-minute budget. Click-click delivers ~90 % of the value with a fraction of the code and remains keyboard-accessible (cells are buttons with `aria-pressed`). I chose (a) and noted (c) as a future add-on.

**Refined — auto-scrolling to the form.** The original app (and my first instinct) scrolled to the form on every calendar click. With a two-click range selection that scroll fought the user: after the first click the grid jumped away before they could make the second. I replaced it with a status bar above the grid plus an explicit "Go to form →" button, and kept auto-scroll only for the edit flow, where a single click is the whole action.

**Refined — reset confirmation.** The suggested `window.confirm()` was swapped for an inline two-click button: it doesn't block the page, can't be dismissed accidentally with Enter, and matches the app's own visual language.

## Testing

Verified in the browser after every change: successful booking via calendar range; booking via typed dates; overlap rejected; end-before-start rejected; empty form rejected; unknown room rejected; edit own booking and save; cancel editing leaves booking unchanged; reset restores the 40 sample records; `localStorage` persistence across reload. No console errors.
