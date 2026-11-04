# UX Rescue Report: Dorm Room Booking

## Student scenario

A student needs to find dates for a common room, reserve it, and later adjust their own reservation. The signed-in user is "You".

The original app worked, but each of those three steps had a usability failure. Each improvement below targets one step.

## Original problems

Observed by using the original app in Chrome at 1440×900 and at an emulated 390×844 phone size.

### 1. Finding: no way to see which rooms are free for a date range

- **Observed:** the grid shows one room and one day per cell. The only filter picks a single room. A note warns that "Open" does not guarantee the full range.
- **Student's goal:** find a room free for all the dates they need.
- **Why it hurts:** for 13–15 Nov, 7 of 18 rooms were free, but finding them meant checking 54 cells by hand. On a phone, room names scrolled out of view, so rows could not be identified. Clicking a booked cell also filled in the form with no warning.

### 2. Booking: failures did not explain what went wrong

- **Observed:** Confirm showed "Reservation failed. Review the selected dates." for all four failure types, including a missing room. The real reason only appeared after pressing Check availability.
- **Student's goal:** fix the problem and finish booking.
- **Why it hurts:**
  - "No conflict detected" stayed on screen after the dates were changed to conflicting ones.
  - A booking shown as "9 Nov – 11 Nov" blocked only the 9th and 10th, because end dates are exclusive.
  - Typing `a3-209` reported "Room reserved", but the grid still showed Open.

### 3. Adjusting: Change looked broken and could create a duplicate

- **Observed:** on desktop, the form was 1,113 px above the screen when Change was clicked, so nothing visibly happened. On a phone it was off-screen below. My bookings only scrolled the page.
- **Student's goal:** move their existing booking to new dates.
- **Why it hurts:** clicking the calendar while editing silently left edit mode and wiped the purpose. Confirming then created a second booking (8 became 9) and left the original in place.

## AI alternatives and trade-offs

AI suggested these alternatives before any code was changed.

### Problem 1

| Option | Usability gain | Complexity | Risk |
|---|---|---|---|
| **A. Date-range search above the grid (selected)** | High: answers the question directly | Medium | A second set of date inputs, so they must feed the form |
| B. Drag across the grid to select dates | Medium: you still scan rooms | High | Poor with keyboard and touch |
| C. Pick a room first, then see its month calendar | Medium: good for one room | Medium | Loses the comparison across rooms |

### Problem 2

| Option | Usability gain | Complexity | Risk |
|---|---|---|---|
| **A. Errors beside each field, naming the clashing dates (selected)** | High | Medium | Must reuse the same validation rules |
| B. Validate while typing and disable Confirm | Medium: a disabled button does not explain itself | Medium | Shows errors on half-typed dates |
| C. Show the specific message in the existing banner | Low to medium | Very low | Leaves the stale message and end-date confusion |

### Problem 3

| Option | Usability gain | Complexity | Risk |
|---|---|---|---|
| **A. Keep the form, add a real My bookings view and clear edit mode (selected)** | High | Medium | Sticky form needs care on short screens |
| B. Edit in a pop-up dialog | Medium: it covers the calendar you need | Medium | Focus handling, cramped on phones |
| C. Edit inside the booking card | Medium | High | Duplicates the form and its validation |

## Selected improvements

1. **Room finder.** Enter two dates to see "7 of 18 rooms free" with a Book button for each. Matching rows are tagged "Free for your dates", and the calendar jumps to that week.
2. **Specific, recoverable errors.** Each error sits beside its field and focus moves there. A conflict names the clashing dates and offers "Show rooms free for these dates". Old messages clear when the input changes, and a summary explains the end date ("2 days reserved · free again from 11 Nov").
3. **Clear editing.** My bookings is a real view. Change shows the form on screen with an "Editing…" banner and opens the booking's week. Calendar clicks now move the booking, keeping its purpose and length. Your own days have a distinct colour and open for editing.

Supporting changes: readable text sizes, AA contrast, 44 px controls, a real table with row and column headers, a skip link, a room column that stays visible on phones, and a sticky form on desktop.

| Measure | Before | After |
|---|---|---|
| Text items under 12 px | 313 of 347 | 0 of 307 |
| Text items below 4.5:1 contrast | 197 | 0 |
| Key presses from page load to the room field | 141 Tabs | 3 (Tab, Enter, Tab) |
| Desktop page height | 2,348 px | 1,755 px |
| Form visible after Change (desktop and phone) | No | Yes |

Text size and contrast were measured on the default Availability view, not on every error or success state.

## Three brief justifications

1. **Room finder:** the student's question is about a date range, but the grid only answers one day at a time. Search does that comparison for them, and the grid stays for browsing. A drag selection would still mean scanning rooms and would be harder on touch and keyboard.
2. **Specific errors:** a failed booking is the moment the student most needs help. The app already knew the exact reason but hid it behind a second button. Showing it beside the field and offering free rooms turns a dead end into a next step.
3. **Clear editing:** the old flow could silently create a duplicate booking, the worst outcome for someone trying to adjust a reservation. A pop-up would have hidden the calendar needed to choose new dates, so the form stays visible beside it with edit mode made obvious.

## AI recommendation rejected

The AI design tool (`ui-ux-pro-max`) recommended a Hero / Features / CTA page structure, a blue palette (`#2563EB`), Lexend fonts and GSAP scroll animations.

**I rejected this.** This is a working booking tool, not a landing page, so a hero section would push the task further down the page. A new palette and fonts would be the cosmetic change the brief warns against, and GSAP would add a package the app does not need. I kept the existing roomgrid identity and took only the tool's accessibility guidance: contrast, focus states, field-level errors and reduced motion.

**One idea was also refined.** The proposal said calendar clicks during editing would "only change the dates". While building it, that proved wrong: clicking an open day in another room's row would have kept the old room, and the student would have been checked against the wrong room. Clicks now also update the room, while the purpose, booking length and edit mode are kept.

## Functional test checklist

Run against the production build: 56 scripted Chrome checks and 11 unit tests (`npm test`), all passing. Full check results are in [browser-check-results.json](browser-check-results.json).

| Requirement | Result |
|---|---|
| View 18 rooms | PASS |
| Browse bookings, including week navigation and room filter | PASS |
| Create valid reservation | PASS |
| Reject missing room | PASS |
| Reject equal start and end dates | PASS |
| Reject reversed dates | PASS |
| Reject conflicting same-room dates | PASS |
| Accept valid different-room booking | PASS |
| Edit my own reservation, with no duplicate created | PASS |
| Prevent editing other users' reservations | PASS |
| Reject conflict introduced through editing | PASS |
| Purpose is optional | PASS |
| Refresh persistence | PASS |
| Reset demo | PASS |
| Responsive layout at 390, 768, 1024, 1100 and 1280 px | PASS |
| No new runtime errors | PASS |

The only console error is a missing `favicon.ico`, which the original app also has.

**Not tested:** real phones, Firefox or Safari, a real screen reader, and sessions with real students. Phone results come from Chrome's mobile emulation.

## Screenshots

### Before: `docs/screenshots/before/`

| File | Shows |
|---|---|
| `01-desktop-first-view.png`, `02-desktop-full-page.png` | Original interface |
| `03-failed-conflict-generic-error.png` | Generic failure message |
| `04-check-availability-specific-error.png` | Real reason hidden behind a second button |
| `05-desktop-change-clicked-form-offscreen.png` | Change clicked, nothing visible happens |
| `06-success-room-reserved.png` | Original success state |
| `07-booked-cell-prefills-form.png` | Booked cell fills in the form |
| `08-calendar-click-silently-exits-edit.png` | Edit mode lost after a calendar click |
| `09-lowercase-room-missing-from-grid.png` | Reserved `a3-209` still shows Open |
| `10` to `14` | Phone views, including lost room names |
| `15-stale-no-conflict-message.png` | "No conflict" shown beside conflicting dates |

### After: `docs/screenshots/after/`

| File | Shows |
|---|---|
| `01-desktop-first-view.png`, `02-desktop-full-page.png` | New interface |
| `03-finder-free-rooms.png` | Improvement 1: free rooms listed |
| `04-form-ready-with-summary.png` | End-date summary |
| `05-success-room-reserved.png` | **Successful action** |
| `06-failed-missing-room.png` | Field-level error |
| `07-failed-conflict-specific-error.png` | **Unsuccessful action**, improvement 2 |
| `08-my-bookings-view.png` | Real My bookings view |
| `09-editing-banner-form-visible.png` | Improvement 3: edit mode |
| `10-calendar-click-moves-booking.png` | Calendar click keeps edit mode |
| `11-edit-conflict-rejected.png` | Conflict rejected during editing |
| `12` to `17` | Phone views, including fixed room names |

## Demo walkthrough

Run `npm install`, then `npm run dev`, and press **Reset demo** first.

1. **Find:** in "Which rooms are free for my dates?", enter 13 Nov to 16 Nov and select **Find free rooms**. Result: 7 of 18 rooms.
2. **Successful booking:** select **Book** on A3-209, add a purpose if you like, and select **Confirm booking**. The success message appears and the days turn to "Yours".
3. **Unsuccessful booking:** enter room A1-203 from 10 Nov to 12 Nov and select **Confirm booking**. The error names the clash, 9 Nov until 11 Nov. Select **Show rooms free for these dates** to recover.
4. **Adjust:** open **My bookings** and select **Change** on A1-203. The form shows the "Editing…" banner. Select the open Fri 20 Nov cell in the A1-203 row, then **Save changes**. The booking moves and no duplicate appears.
5. **Persistence and reset:** refresh to show the change was kept, then select **Reset demo** to restore the original records.
