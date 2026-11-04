# Submission Notes — Dorm Room Booking UI/UX Rescue

Scenario: *A student needs to find dates for a common room, reserve it, and later adjust their own reservation.*

## Problems found while using the app

1. **Errors on submit are generic.** "Confirm booking" always says "Reservation failed. Review the selected dates.", even when the room is missing. An overlap never says which booking conflicts.
2. **You can't tell whether a date range is free.** The calendar only picks one day at a time, the form's range isn't shown on the calendar, and the page itself warns that "Open" doesn't guarantee the full range. The end date is exclusive, but nothing tells the user that.
3. **Your own bookings and the edit flow are hard to follow.** Your bookings look the same as everyone else's (same grey cell). Clicking your own booking in the calendar starts a *new* booking on those dates, which is certain to fail as an overlap. On narrower screens "Change" fills a form that is off-screen, with no sign that anything happened or which booking is being edited.

Other issues noticed but not chosen: the "My bookings" tab stays highlighted after scrolling, and many labels are very small (9–10px) and low-contrast.

---

## Fix 1 — Specific, field-level error messages

- **User goal:** Book a room. If it fails, understand why and fix it quickly.
- **Why it hurts usability:** `issue()` already worked out the exact problem, but `submit()` threw that away and showed one generic sentence. The user had to guess, or find the separate "Check availability" button. An overlap didn't name the conflicting booking, so the user had to scan 18 rows to find it.
- **Alternatives considered:**
  - A. Show the specific message on submit, name the conflicting booking(s), mark and focus the invalid field. *Low cost, and it keeps the existing submit/check flow.*
  - B. Live validation on every keystroke. *Catches problems early, but it's noisy while the user is still typing a room number or picking the first date.*
  - C. Disable "Confirm booking" until the form is valid. *Stops bad submits, but the user isn't told why the button is disabled. That's worse for accessibility and for understanding the rules.*
- **Chosen:** A. `issue()` now returns `{field, message}`:
  - Missing room → "Enter a room number, or click an Open day in the calendar."
  - End not after start → "End date must be after the start date. Choose 21 Nov or later."
  - Overlap → "B2-104 is already booked 13 Nov – 15 Nov by another student ("Team planning"). It is free again from 15 Nov."

  The bad input gets `aria-invalid`, a red border and `aria-describedby` pointing at the alert, and it receives focus. The error clears as soon as the user edits the form. The success message now repeats what was booked: "Room reserved: B2-104, 12 Nov – 13 Nov."
- **Justification:** It tells the user what is wrong, where, and how to fix it ("free again from…"), without changing a single validation rule.

## Fix 2 — Range selection and live availability preview on the calendar

- **User goal:** Find dates when a room is free for the whole stay.
- **Why it hurts usability:** The calendar could only drop in a one-day booking, so a longer range had to be typed and checked blindly. The exclusive end date ("9–11 Nov" really means 9 and 10) was never explained.
- **Alternatives considered:**
  - A. Click a start day, then a later day in the same room to set the range. The selected cells are outlined on the calendar, and any overlapping cells turn red ("Conflict"). *It's direct and visual, and it reuses the existing grid.*
  - B. A "find free rooms for these dates" filter that hides rooms with conflicts. *Good for "any room" searches, but it adds a new feature and hides context about the room the student actually wants.*
  - C. Replace the date inputs with a custom date-range picker. *Familiar pattern, but it needs a new dependency or a lot of custom code, and it duplicates the calendar.*
- **Chosen:** A, plus a plain-language summary under the dates. With no conflict it reads "4 days: Wed 11 Nov to Sat 14 Nov; the room is free again on 15 Nov. No overlap with other bookings for C2-202." With a conflict it reads "4 days: Thu 12 Nov to Sun 15 Nov (the end date itself is not included). Conflicts with an existing booking, see calendar." It deliberately shows no second date there, so it never contradicts the "free again from…" date in the submit error. The end date input gets `min = start + 1`, so the native picker greys out invalid end dates. The form uses `noValidate`, so our own messages from Fix 1 still appear. Typed room numbers are matched to the directory spelling (`b2-104` → `B2-104`); before this, a lowercase booking was saved but never appeared in the calendar.
- **Justification:** Students can now see whether the whole range is free before submitting, which is the core of "find dates".

## Fix 3 — Clear "my bookings" and an obvious edit mode

- **User goal:** Find your own reservation and adjust it.
- **Why it hurts usability:** Your bookings were indistinguishable from others in the grid. Clicking one started a conflicting new booking. "Change" gave no visible feedback when the form was off-screen, and nothing said which booking was being edited.
- **Alternatives considered:**
  - A. Make your bookings visually distinct ("Yours", solid teal plus a legend entry). Clicking one of your cells opens it for editing. "Change" scrolls to the form and focuses its heading. An "Editing your booking: …" banner shows the original values, the card is highlighted with "Editing…", and the calendar jumps to that booking's week.
  - B. Open editing in a modal dialog. *Clear focus, but it covers the calendar the student needs in order to pick new dates.*
  - C. Inline editing inside the "Your bookings" card. *Short path, but it duplicates the form and its validation.*
- **Chosen:** A. "Cancel editing" now looks like a real link and confirms "Changes discarded. Your booking was not modified." Clicking someone else's booked cell explains who has it and doesn't overwrite the form with a booking that can't succeed.
- **Justification:** It reuses the single form (one source of validation) and keeps the calendar visible while you adjust dates. The student always knows which booking they are changing.

---

## AI design suggestion that was refined or rejected

- **Rejected:** For Fix 1, the AI's first suggestion was option C: disable "Confirm booking" until the form is valid. We rejected it because a disabled button gives no reason. It's also skipped by keyboard and screen-reader users, so it hides exactly the information the student needs (which booking conflicts, and when the room is free again). We kept the button enabled and made the error message specific instead.
- **Refined:** The first version of Fix 2 kept the original behaviour where every calendar click scrolls the page to the form. In testing at a narrow width, the first click scrolled the calendar away, so the second click (to set the end date) landed somewhere else. We removed the auto-scroll on calendar clicks. The outlined "Selected" cells and the summary give feedback in place. Auto-scroll is kept only when editing starts, because the user does need to go to the form then.

## Modified files

- `src/App.jsx` — validation messages, range selection and preview, edit mode, room-name normalisation
- `src/styles.css` — styles for Yours / Selected / Conflict cells, invalid inputs, range summary, editing banner and card (same palette as before: teal `#0f7b86`, error `#ab4747` / `#fff1f0`)
- `SUBMISSION_NOTES.md` — this file

Nothing was removed: 18-room browsing, create, edit own booking, Reset demo, localStorage persistence, the "You" user, the "Check availability" button and all validation rules are unchanged.

## Manual test checklist

Run `npm install` then `npm run dev`, open the printed URL, and click **Reset demo** first.

- [ ] **Main action (create):** Click B2-104 · Thu 12 Nov. The cell shows "Selected" and the form fills in. Click **Confirm booking**. You should see "Room reserved: B2-104, 12 Nov – 13 Nov…", the cell turns teal "Yours", and the booking appears under Your bookings.
- [ ] **Failed action (overlap):** Click B2-104 · Thu 12 Nov, then B2-104 · Sun 15 Nov. Fri and Sat turn red "Conflict" and the summary says "Conflicts with an existing booking, see calendar". Click **Confirm booking**. The error names "13 Nov – 15 Nov by another student ("Team planning")… free again from 15 Nov" and focus moves to Start date.
- [ ] **Failed action (dates):** Set Start = End (e.g. 20 Nov for both). Confirm. You should see "End date must be after the start date. Choose 21 Nov or later.", with End date outlined in red and focused.
- [ ] **Fix 1:** Clear the room number and confirm. The room-specific message appears and the room field is focused. Type anything and the error disappears.
- [ ] **Fix 2:** Pick a two-click range in an open row (e.g. C2-202 Wed 11 → Sat 14). All four cells are outlined, and the summary reads "4 days: Wed 11 Nov to Sat 14 Nov; the room is free again on 15 Nov. No overlap…".
- [ ] **Fix 3 (edit):** Go to the next week, then click **Change** on "B2-104 9 Nov – 11 Nov". The calendar jumps back to 9 Nov, the form scrolls into view titled "Change reservation", the banner shows the original dates, and the card shows "Editing…". Set End = 12 Nov and click **Save booking**. You should see "Booking updated: B2-104, 9 Nov – 12 Nov."
- [ ] **Fix 3 (calendar):** Click a teal "Yours" cell (e.g. D1-101 Mon 16 Nov). The form opens in edit mode for that booking. Click **Cancel editing** and you should see "Changes discarded…". Click a grey "Booked" cell. A message names that booking and the form is left untouched.
- [ ] **Persistence:** Reload the page. Your new and edited bookings are still there. **Reset demo** restores the 40 example bookings.
