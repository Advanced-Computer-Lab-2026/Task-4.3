# UI/UX Rescue Challenge — Dorm Room Booking

**Scenario:** A student needs to find dates for a common room, reserve it, and later adjust their own reservation.

**Modified files:** [`src/App.jsx`](../src/App.jsx), [`src/styles.css`](../src/styles.css). New styles are in one marked block at the end of `styles.css`.

**Preserved:** browsing 18 rooms by week, filtering by room, creating and editing bookings, all date-range and overlap validation (the original `issue()` function is unchanged and still decides whether a booking is valid), the "Check availability" button, `localStorage` persistence, and "Reset demo".

---

## Improvement 1: Errors that say what is wrong and how to fix it

| | |
|---|---|
| **User goal** | Get a booking through, and recover quickly when it fails. |
| **Problem** | Every failed submit showed the same message: *"Reservation failed. Review the selected dates."* This appeared even when the room field was empty, or when the dates were valid but the room was taken. The app already knew the exact reason but threw it away. Students had to guess, change something at random, and retry. |
| **Fix** | The alert now gives the exact cause: which fields are missing, that the end date must be after the start date, or which booking clashes and on which days. Only the fields at fault are outlined in red (`aria-invalid`). For a clash, it offers one-click fixes: the **next free dates of the same length** in that room, or **the same dates in up to 3 other free rooms**. |
| **Screenshots** | Before: `before-3-vague-error.png`, `before-4-range-overlap-vague-error.png` · After: `after-3-specific-error-with-fixes.png` |

## Improvement 2: Calendar cells show what you can actually do

| | |
|---|---|
| **User goal** | Pick a free day, and find your own reservation to change it. |
| **Problem** | Cells booked by other people could still be clicked, and clicking one filled the form with a date you could never book (`before-2-booked-cell-fills-form.png`), leading straight to a failure. Your own bookings had the same colour as everyone else's (only small grey text was different), and clicking them did not open them for editing. |
| **Fix** | Cells booked by other people are disabled. Their tooltip shows the booked range. Your own bookings have their own colour and the label **"Yours · Change"**, and clicking one opens it for editing. When you edit a booking, the calendar jumps to that booking's week and the room field gets focus. The booking is highlighted in both the form and the "Your bookings" list. Every state has a text label as well as a colour, and the legend lists all five states. |
| **Screenshots** | Before: `before-1-overview.png`, `before-2-booked-cell-fills-form.png` · After: `after-1-overview.png`, `after-5-editing-own-booking.png` |

## Improvement 3: Pick a date range in the calendar, with live feedback

| | |
|---|---|
| **User goal** | Find **dates** (usually more than one day) when a room is free. |
| **Problem** | You could only click one day, which set a one-day booking. For longer stays you had to type the end date yourself and submit to learn whether it worked. The page itself warned that *"a day marked 'Open' does not guarantee the full range you choose will be available"*, so students had to check by trial and error. On wide screens the form scrolled out of view while you browsed the lower rooms. |
| **Fix** | Click a start day, then a later day in the same row, to set the range. The chosen days turn dark teal and any clashing days turn red, **before you submit**. Under the date fields, a live status says either "A3-209 is free Thu 12 Nov – Sat 14 Nov (3 days)…" or names the clash. On wide screens the form stays in view while you scroll. On narrow screens a summary bar stays at the bottom with a "Review booking" button. |
| **Screenshots** | After: `after-2-range-selected.png`, `after-7-mobile-selection-bar.png` |

## Improvement 4 (extra): Dates that mean what they say

| | |
|---|---|
| **User goal** | Know exactly which days you have booked. |
| **Problem** | End dates are exclusive (the room is free again on the end date), but nothing said so. "Your bookings" showed *"9 Nov – 10 Nov"* for a booking that only covers 9 Nov, so students could book an extra day by mistake or think a day was taken. |
| **Fix** | Bookings now show the days actually booked, with weekday and length: "Mon 9 Nov · 1 day", "Tue 17 Nov – Thu 19 Nov · 3 days". The end field is labelled **"End date (free again)"**, and the status repeats it in words. |
| **Screenshots** | Before: `before-5-your-bookings-dates.png` · After: `after-6-my-bookings-page.png` |

## Improvement 5 (extra): Navigation that does what it says, and a safe Reset

| | |
|---|---|
| **User goal** | Come back later, find your own reservations, and change one without losing your place or your data. |
| **Problem** | "My bookings" looked like a tab, but it only scrolled down the same long page, below 18 calendar rows, and the tab underline did not match what was on screen. "Reset demo" sat in the main navigation as if it were a page. One click wiped every change with no warning. |
| **Fix** | **My bookings is now its own page.** It shows a list of your bookings, with the booking form still beside it, so **Change** edits right there. Each booking has a **Show in calendar** link that opens Availability at that booking's week. The tab shows how many bookings you have. The page is stored in the URL (`#my-bookings`), so reload and the browser Back button work. **Reset demo** has moved to a separate "Demo data" section at the bottom of the booking panel, explains what it does, and asks you to confirm on the page first ("Yes, reset" / "Keep my changes"), with no browser popup. The "restored" message appears next to it. |
| **Screenshots** | After: `after-6-my-bookings-page.png`, `after-8-reset-confirm.png` |

Smaller supporting changes: the 9–10px light-grey helper text is now 11–12px and darker, for contrast. The success message names the room and dates. A room typed in lowercase (for example "b2-104") is saved with the directory spelling, so it appears in the calendar. Before this, it was saved but never shown in the grid.

---

## AI suggestions I refined or rejected

**Rejected: "Make the end date inclusive (rename it *Last day*) so it matches how people think."**
This matches how people think about dates, but it changes the data contract from the earlier lab (`endDate` must be strictly after `startDate`), the overlap rule, and every sample record. That would weaken the existing validation and break compatibility. **Refined version:** keep the stored data exactly as it is, and change only what people see. The display shows the last booked day, and the label and status explain that the end date is when the room is free again.

**Refined: "Disable *Confirm booking* until the form is valid."**
This prevents failed submits, but a disabled button doesn't say *why* it's disabled. Students would be stuck with a dead button and no explanation, which is the original problem in a new form. **Refined version:** keep the button enabled, show the problem live as the form changes, and on submit show a specific alert with one-click fixes.

### Alternatives compared before choosing

| Problem | Options considered | Chosen and why |
|---|---|---|
| Vague error | (a) show the existing short `issue()` text; (b) specific text plus field highlighting; (c) b plus one-click alternatives | **(c)**: names the problem *and* gets the student to a valid booking in one click. It costs a small search over 60 days and 18 rooms, which is trivial. |
| Booked cells | (a) hide the button; (b) keep it clickable but show a warning; (c) disable it, with a tooltip | **(c)**: you can't click into a guaranteed failure, and the day is still visible and labelled "Booked". |
| Range picking | (a) drag across cells; (b) click start, then click end; (c) a separate "find free dates" search | **(b)**: works with mouse, touch and keyboard, and needs no new screens. Drag is unreliable on touch, and (c) means building a new screen. |
| Form out of view | (a) scroll to the form on every click (old behaviour); (b) keep the form in view on wide screens plus a summary bar on narrow ones | **(b)**: scrolling away after the first click would break two-click range picking on phones. |

---

## Testing

`submission/tests/after.mjs` drives the app in headless Chrome and runs **35 checks, all passing**. It covers: booked cells disabled, own bookings clickable, two-click range selection, live status, clash highlighting, a specific error on a failed submit with nothing saved, one-click fixes, a successful booking, the missing-field and end-before-start messages, "Check availability", editing from the calendar, saving an edit, the separate My bookings page (URL, reload, Back button), editing from that page, focus, "Show in calendar" jumping to the right week, data kept after reload, the Reset confirmation (cancel and confirm), and the mobile summary bar.

Run it with the dev server on port 5173: `node submission/tests/after.mjs submission/screenshots`.

## Demo script (about 2 minutes)

1. **Main action:** in row A3-209, click Thu 12 Nov, then Sat 14 Nov. The status shows it's free for 3 days. Add a purpose, click **Confirm booking**, and it appears in "Your bookings".
2. **Unsuccessful action:** in row A2-106, click Mon 9 Nov, then set the end date to 12 Nov. Tue and Wed turn red. Click **Confirm booking** anyway: the alert names the clashing booking and nothing is saved. Click **"Same dates in B2-105"**, then confirm to show the recovery.
3. **Adjust a reservation:** open the **My bookings** page and click **Change** on A2-107. Extend the end date to 12 Nov and click **Save booking**. The list now shows "Mon 9 Nov – Wed 11 Nov · 3 days". (You can also click a **Yours** cell in the calendar.)
4. Point out the disabled booked cells, the legend, and the "End date (free again)" label.
5. Click **Reset demo** at the bottom of the panel to show the confirmation, then choose **Keep my changes**.

### Not changed (noted for future work)
- On phones the week grid scrolls sideways, and the room column doesn't stay in place.
