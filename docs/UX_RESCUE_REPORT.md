# UX rescue report: Dorm Room Booking

**Independent review, 4 November 2026:** the original implementation notes and test claims below are historical. See [FINAL_INDEPENDENT_AUDIT.md](FINAL_INDEPENDENT_AUDIT.md) and [audit/results.json](audit/results.json) for the independently executed corrective pass. Final desktop/mobile captures are in [audit/](audit/), and supersede the older after screenshots where they differ. The original before/after files are retained.

Branch: `feat/acl-uiux-rescue`. No commit, push, or pull request was made.

## Student goal and scenario

A student signed in as **you** needs a common room for a study group. They must find a room that is free for the whole stay, reserve a valid date range, understand a failed attempt, and later find and edit their own reservation. The app is a single React screen. Bookings stay in `localStorage` under `acl-roomgrid-18rooms-v1`. There is no backend.

## Three original problems

### 1. The week grid did not answer “free for my whole stay”

The grid marked each day Open or Booked, and the page said an Open day does not mean the stay is free. The only filter was “Location,” one room at a time. Clicking a booked day started a new one-day request instead of explaining the reservation. Clicking A1-203 on 9 Nov 2026 filled room `A1-203`, start `2026-11-09`, end `2026-11-10`, while the heading stayed “Make a reservation.” Those dates conflict with the existing Peer tutoring booking.

The end date is exclusive (`date < endDate`). Cards printed both dates as if both were occupied. B2-104 read “9 Nov – 11 Nov,” but Wednesday 11 Nov was Open. Only Monday and Tuesday were “Your booking.”

### 2. Confirm booking hid the real validation failure

`issue()` already returned three specific reasons. **Check availability** showed them. **Confirm booking** discarded them and always showed “Reservation failed. Review the selected dates.” Nothing was marked invalid, and focus did not move.

| Situation | Confirm booking | Check availability |
|---|---|---|
| A1-203, 9–10 Nov, already booked | Reservation failed. Review the selected dates. | This room is already booked for some of those dates. |
| Empty room and dates | Reservation failed. Review the selected dates. | Complete the room and both dates. |
| D1-101, 20 Nov to 20 Nov | Reservation failed. Review the selected dates. | End date must follow start date. |

### 3. Own bookings were buried, and Change did not reveal the form

The eight bookings owned by `you` sat under the 18-room grid. On a 1440×900 window that list started about 1,400 pixels down. **Change** was a small underlined link. Clicking Change on A2-107 filled the form (“Change reservation,” A2-107, 9–10 Nov, “Student club planning”) but left the scroll position unchanged. The form was about 1,158 pixels above the viewport. On a 390px-wide screen the page was about 3,500 pixels tall; the list started near 2,100 pixels and the form near 2,700. The header “My bookings” control only scrolled to the list.

## Baseline evidence

Original screenshots are in `docs/screenshots/before/`. All 15 files exist and are readable PNGs. Desktop shots are 1440×900, except the full-page shot at 1440×2314. Mobile shots are 390×844.

- `01-desktop-availability-and-form.png` — week grid and empty reservation form.
- `02-desktop-full-page.png` — the long page, including the list below the grid.
- `03-calendar-end-date-not-occupied.png` — B2-104 booked Monday–Tuesday; Wednesday 11 Nov is Open.
- `04-booked-day-starts-a-new-request.png` — a booked cell starts a new request.
- `05-confirm-shows-generic-error.png` — overlap, generic Confirm message.
- `06-check-shows-specific-overlap-error.png` — the same overlap, specific Check message.
- `07-missing-room-blames-the-dates.png` — empty room still blamed “the selected dates.”
- `08-same-day-confirm-is-generic.png` and `09-same-day-check-is-specific.png` — same-day stay.
- `10-your-bookings-below-the-calendar.png` and `11-change-leaves-the-form-offscreen.png` — SHA-256 `d40ce3dcc4d9bea95c9674665d412332db439e810582013be4bb16470ffcab3f` for both. Change did not move the viewport.
- `12-edit-form-only-after-manual-scroll.png` — the filled form only after scrolling back.
- `13-mobile-top.png`, `14-mobile-your-bookings.png`, `15-mobile-booking-form.png`.

The first screenshot run exited with `EBUSY` while deleting `CrashpadMetrics-active.pma` in a temporary Chrome profile. Chrome still held that file when the script deleted the profile. The 15 PNGs were already written. The original UI was not changed to recapture them. The later capture script waits for Chrome to exit before removing the profile. The final after run reported no cleanup error.

## Alternatives and the decision

**Availability**

- **1A — Stay search on the existing grid.** Start and end dates above the grid, rooms marked free for the whole stay, selecting a free room fills the shared form, and a booked cell opens details. Same overlap rule. Advantage: answers the student’s question without a new library. Disadvantage: the week grid remains, so a stay outside the visible week needs an explicit note and a way to jump to that week. Effort: medium.
- **1B — Replace the grid with a month-calendar library.** Advantage: a familiar month view. Disadvantage: a new dependency, a larger rewrite, and it still would not explain conflicts or surface the student’s own bookings. Effort: high.

**Validation**

- **2A — Show the existing validation on the field that failed.** Confirm uses the same sentences as Check, with `aria-invalid` and focus on the first invalid control. Advantage: the rules stay identical and the failure is obvious. Disadvantage: the message needs a stable place in the form. Effort: low.
- **2B — Disable Confirm until Check passes.** Advantage: fewer failed submits. Disadvantage: a disabled button does not say why, a conflict can appear after the check, and the unsuccessful booking is harder to demonstrate. Effort: low.

**Editing**

- **3A — My bookings as its own view, Edit opening the shared form.** Advantage: one form and one validation path. Disadvantage: the grid and the list are not on screen together. Effort: medium.
- **3B — Edit inside each booking card.** Advantage: no trip to a side panel. Disadvantage: a second copy of the form, so the date and overlap rules can drift. Effort: medium-high.

**Rejected.** An occupancy dashboard with popularity charts and a drag-to-paint calendar. It does not help a student find a free stay, understand a failed booking, or edit their own reservation, and it adds interface this demo does not need.

## Approval

The reviewer explicitly approved **1A**, **2A**, and **3A**, and explicitly approved rejecting the occupancy dashboard, popularity charts, and drag-to-paint calendar.

## What was implemented, and why

1. **Stay search uses the one overlap function.** `conflictingBooking()` is the only overlap check. A room is free for the stay when that function finds no other booking with `start < booking.endDate && end > booking.startDate`. While editing, the current booking is ignored, so the room can be offered as “Fits this edit” instead of looking busy because of itself. Selecting a free room copies that room and those dates into the existing form. A booked cell opens a read-only detail. Another student’s reservation has no Edit action. Cards and the form say the end date is the first morning the room is free. A stay outside the visible week is still calculated, and the page says so.
2. **Confirm shows the real reason.** Missing fields, `end <= start`, and a same-room overlap keep the original sentences: “Complete the room and both dates.”, “End date must follow start date.”, and “This room is already booked for some of those dates.” The message is an alert, invalid controls get `aria-invalid`, and focus moves to the first relevant control. Confirm stays enabled. A successful create or update shows a status message that includes the exclusive-end wording.
3. **My bookings is a tab, and Edit uses the same form.** The tab lists only `owner === "you"`. Edit fills that form, titles it “Editing {room},” scrolls it into view, and focuses the heading. Cancel returns focus to the current view. Submit refuses a row that is missing or not owned by `you`. There is no second form.

## Screenshot references

Original after screenshots are in `docs/screenshots/after/`. Their PNG dimensions are 1440×900 or 390×844. Independent review found that the two older mobile availability screenshots contain a shrunk page caused by layout overflow; their image dimensions alone do not establish a correct 390px CSS viewport. Use `docs/audit/mobile-availability.png` and `docs/audit/mobile-stay-search.png` for the corrected mobile evidence. The final production captures are listed in the independent audit.

| File | What it shows |
|---|---|
| `01-desktop-stay-search.png` | 11–13 Nov: 4 of 18 rooms free (A1-203, B1-205, B2-104, C2-202), exclusive-end copy |
| `02-desktop-range-beyond-week.png` | 18–21 Nov while the grid still shows 9–15 Nov; 7 rooms free |
| `03-desktop-booked-day-details.png` | A1-203 details, another student, no Edit, form still empty |
| `04-desktop-missing-fields-error.png` | “Complete the room and both dates.” |
| `05-desktop-same-day-error.png` | “End date must follow start date.” |
| `06-desktop-overlap-error.png` | “This room is already booked for some of those dates.” |
| `07-desktop-my-bookings.png` | Only the signed-in student’s cards, with Edit buttons |
| `08-desktop-editing.png` | “Editing A2-107,” Student club planning, shared form |
| `09-desktop-booking-confirmed.png` | “Room reserved. B1-205… Free from 13 Nov 2026.” Count 42 |
| `10-mobile-availability.png` | 390px availability layout |
| `11-mobile-stay-search.png` | Free and busy labels for the same 11–13 Nov search |
| `12-mobile-my-bookings.png` | Own bookings and Edit buttons |
| `13-mobile-editing.png` | Edit form on screen: “Editing A2-107” |

## Functional testing

`package.json` has `dev`, `build`, and `preview`. There is no test script, so no other npm check applies.

`npm run build` was run after the final stylesheet change. Result: **PASS**. Vite 5.4.21, exit 0, built in 1.94s. Output: `dist/assets/index-eGnzr0qK.css` (9.89 kB) and `dist/assets/index-Ck7X8iAS.js` (162.19 kB).

The preview of that build was served at `http://127.0.0.1:4173/`. A headless Chrome script drove the production page and recorded the results below. These were executed. They are not inferred from the code.

| Check | Result | Evidence |
|---|---|---|
| 18 rooms and 40 seed bookings | PASS | Directory 18; stored length 40 |
| 8 bookings owned by you | PASS | My bookings count 8 |
| Confirm stays enabled | PASS | Button not disabled |
| Stay search for 11–13 Nov matches the overlap rule | PASS | 4 rooms |
| Exclusive end is explained | PASS | Visible on the finder and cards |
| 18–21 Nov is correct while the grid still shows 9–15 Nov | PASS | Same free set as the overlap rule; note visible |
| Jumping to the week of 18 Nov keeps that result | PASS | Week text “16 Nov – 22 Nov” |
| Booked A1-203 on 9 Nov does not fill a conflicting request | PASS | Heading stayed “Make a reservation” |
| Another student’s reservation cannot be edited from the detail | PASS | No edit control; copy says only your bookings can be changed |
| Missing room and dates | PASS | “Complete the room and both dates.” Focus `room-number` |
| Same start and end, and end before start | PASS | “End date must follow start date.” Count stayed 40 |
| Overlap on A1-203, 9–10 Nov | PASS | “This room is already booked for some of those dates.” Focus `start-date`. Count stayed 40 |
| My bookings lists only the signed-in student | PASS | 8 Edit buttons; Peer tutoring is not in the list |
| Edit A2-107 reveals and focuses the shared form | PASS | “Editing A2-107,” form top 92px, purpose “Student club planning” |
| Saving that booking does not conflict with itself | PASS | While editing, the stay search offers A2-107 and still excludes A1-203 |
| Selecting a free room fills the form | PASS | A1-203 and the searched dates |
| Valid reservation, including a blank purpose | PASS | A1-203 “Evening review” reserved; B1-205 on the same dates stored with a blank purpose |
| Saving B2-104 unchanged does not conflict with itself | PASS | “Booking updated.” Exactly one stored row for 9–11 Nov, “Weekly study group” |
| Extending that edit through an existing booking is rejected | PASS | End `2026-11-14` rejected; the stored 9–11 Nov row remained |
| Refresh keeps new bookings | PASS | 42 stored, including “Evening review” |
| Reset demo restores the seed | PASS | 40 bookings, 8 owned by you, first purpose “Peer tutoring,” notice “Example bookings restored.” |
| No page runtime errors | PASS | No `Runtime.exceptionThrown`, no console error, empty `window.__pageErrors` |
| Desktop and mobile screenshots at the requested sizes | PASS | PNG headers: 1440×900 and 390×844 |
| Mobile Edit brings the form on screen | PASS | “Editing A2-107” at 92px in the 390×844 capture |
| `window.innerWidth` equals 390 after device emulation | NOT VERIFIED | The script read `window.innerWidth` 816 with page overflow 0. The saved PNGs are 390×844 and show the narrow layout (wrapped navigation, stacked dates, swipe hint). The JavaScript width did not match the captured surface. This is recorded as a harness mismatch, not as a passed width assertion. |

A full manual Tab walk of every control was not done. Focus movement for the first invalid field and for Edit was verified by the script above.

## TA demonstration walkthrough

1. Open the app. Availability shows 18 rooms and 40 reservations. Choose 11 Nov 2026 through 13 Nov 2026. Four rooms are offered. Select one and confirm. The status line says the room is reserved and names the morning it is free again.
2. Confirm an empty form. The message is “Complete the room and both dates.” Confirm A1-203 from 9 Nov through 10 Nov. The message is “This room is already booked for some of those dates.” The button stays enabled and the count does not change.
3. Open My bookings. Edit A2-107. The same form is titled “Editing A2-107” and already contains Student club planning. Save it, or cancel and return to browsing. Click a booked day belonging to another student: the detail can be read, and there is no Edit action.
4. Reset demo restores the original 40 bookings.

## Scope review

At the original implementation checkpoint, `git status` showed modifications only in `src/App.jsx` and `src/styles.css`, plus untracked `docs/`. The independent pass also adds `scripts/independent-audit.mjs`, this report's corrections, a final audit report, and evidence under `docs/audit/`. `package.json` and the lockfile remain unchanged; no dependency was added. The seed is still exactly 18 rooms and 40 rows, with the same storage key and a single overlap function.

One behavior worth knowing during review: clicking an **open** day while an edit is in progress updates that draft’s room and dates and keeps the edit. A **booked** day does not. Cancel editing clears the draft.

The independent pass subsequently executed real Chrome keyboard traversal through both views at 1440×900 and 390×844, corrected tab navigation and date-input focus styling, and reran the booking/storage regression suite. See the final audit for the resulting verdict and coverage limits.

## Independent corrections to the submission evidence

- The reliable starter baseline is the sole root commit, `63583cd3f8ecce3f32ae85bfb0ba9fee1d764b77`; the branch name alone was not used as a baseline.
- All 15 before and 13 original after PNGs decoded successfully. Their dimensions and SHA-256 hashes are recorded in `docs/audit/screenshot-inventory.json`. The identical before files 10 and 11 are not independent views: they illustrate the reported unchanged viewport, which also agrees with the starter's Edit handler lacking a scroll/focus action.
- The initial capture's reported cleanup error does not imply missing PNGs: all documented before files exist. The historical cleanup error itself was not independently reproduced.
- Malformed stored arrays previously crashed rendering. The corrective pass validates stored records, preserves unreadable original data, and offers explicit recovery through Reset demo. A failed storage write now keeps both the saved records and the unsaved form draft intact, with an error rather than a success message.
- Directory room names are saved in canonical case. Required free-text room entry remains supported, as in the starter. Strict calendar-date validation and collision-resistant booking IDs protect the existing contract.
- Mobile grid overflow, mobile heading clearance, ARIA tab keyboard behavior, date-input focus outlines, and focus return after closing reservation details were corrected.
- Final evidence uses an isolated headless Chrome profile and the production preview. Date input values are assigned using native input setters and bubbling input/change events; primary actions use actual DevTools pointer events, and keyboard checks use actual key events. No user browser data was used.
