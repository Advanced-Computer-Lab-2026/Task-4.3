# UI/UX Rescue — Dorm Room Booking

**User goal (scenario):** a student wants to find free dates for a common room, reserve it, and later adjust their own reservation, without guessing whether a request will be accepted.

Modified files: `src/App.jsx`, `src/styles.css`. Screenshots are in `screenshots/` (`before-*` = original starter, `after-*` = redesign).

| View | Before | After |
|---|---|---|
| Overview | `before-desktop.png` | `after-desktop.png` |
| Unsuccessful booking (B2-104, 13 → 15 Nov) | `before-failed-booking-page.png` | `after-failed-booking-page.png` |
| Changing an own booking | `before-editing.png` | `after-editing.png` |
| Phone (390 px) | `before-mobile.png` | `after-mobile.png` |

---

## Issue 1: A failed booking does not say why or what to do next

**Problem.** When you press *Confirm booking*, every failure shows the same message: "Reservation failed. Review the selected dates." That message appears when the room is empty, when the room doesn't exist, when the end date is before the start date, and when the dates overlap another booking. The real reason only appears if you press *Check availability* first. You can't tell which field is wrong. If the dates clash, you still have to search the calendar for a free slot yourself.

**Why it hurts usability.** It breaks Nielsen's heuristic "help users recognise, diagnose and recover from errors". The student has to guess, and the most common failure (an overlap) needs the most guessing.

**Fix.**
- Each failure has its own message and points at the field that caused it. That field gets `aria-invalid` and receives focus. For an overlap, the message names the booking it clashes with, e.g. "B2-104 is already reserved 13 Nov → 15 Nov".
- One click fixes a clash: **"Use next free dates: Sun 15 Nov → Tue 17 Nov · 2 nights"** fills in the next free slot of the same length.
- Availability is checked live once room and both dates are filled in: "✓ A3-209 is free …". The *Check availability* button still works.
- The end date picker cannot be set before the start date. Room names that are not in the 18-room directory are rejected. Before, a booking for a room that doesn't exist was saved and never appeared on the calendar. All the original validation still applies.

## Issue 2: The calendar hides which days you can actually book

**Problem.**
- "Booked / Your booking" and "Booked / Reserved" used the same grey cell, so your own bookings were hard to spot.
- The legend colours didn't match the cells.
- Clicking a reserved cell still copied it into the form, which led straight to a failure.
- Only single days could be selected, and a note warned that "Open" might not mean your whole range was free.
- Dates in the form were never shown on the grid.

**Why it hurts usability.** It breaks "visibility of system status" and "error prevention". Finding free dates is the first step of the scenario, and the grid offered actions that could only fail.

**Fix.**
- Each cell shows one of four states, and the legend matches them:
  - **Open**: green
  - **Yours**: amber, showing the booking's purpose
  - **Reserved by others**: hatched grey and disabled
  - **Your selection**: teal outline
- Overlapping days in your selection turn red and read **Conflict**, so a clash is visible before you submit.
- **Range selection:** click a start day, then a later day in the same row. The form fills in, and the grid shows the whole range. A hint line explains this.
- Clicking one of your own cells opens it for editing.
- The calendar jumps to the week of the date you type or edit.
- The note now explains that the end date is exclusive, and ranges are shown as "Thu 12 Nov → Sun 15 Nov · 3 nights". This avoids the off-by-one confusion between the form and the grid.

## Issue 3: Changing a booking had no clear context, and navigation was misleading

**Problem.**
- Clicking *Change* filled the form silently. The page didn't scroll, and on narrow screens the form is below the whole calendar.
- The calendar stayed on whatever week was showing.
- There was no sign of which booking was being changed, and "Cancel editing" looked like plain text.
- The top bar had *Availability* / *My bookings* tabs that looked like tabs but switched nothing.
- **Reset demo** sat beside those tabs and wiped all your changes in one click, with no confirmation.

**Why it hurts usability.** Adjusting your own reservation is the last step of the scenario. Without visible context, users can't be sure they're changing the right record. Controls that pretend to be tabs break "consistency and standards", and an unguarded destructive action breaks "user control and freedom".

**Fix.**
- *Change* (or clicking your amber cell) opens a **"You are editing your booking A2-107, Mon 9 Nov → Tue 10 Nov"** banner. It also:
  - marks that card **Editing** in *Your bookings*;
  - moves the calendar to the booking's week and highlights it;
  - focuses the start date field.
- The buttons read **Save changes** and **Cancel editing (keep original booking)**.
- Success messages now say what happened, e.g. "Booking updated: B1-207, Tue 10 Nov → Fri 13 Nov · 3 nights".
- The fake tabs are now plain anchor links. *My bookings* shows a count badge.
- **Reset demo** moved away from navigation and now asks for confirmation.
- On wide screens the form stays in view (sticky) while you click through the calendar.

**Supporting change:** 9–11 px text in pale grey (about 2.3:1 contrast) is now 12–13 px in `#56707a`. That colour passes WCAG AA for normal text on white.

---

## Alternatives the AI suggested and how I compared them

| Problem | Options considered | Chosen and why |
|---|---|---|
| Error feedback | (a) toast pop-up; (b) inline message next to the fields plus field highlight; (c) block submit until valid | **(b)**. A toast disappears before the user reads a date range. (c) hides *why* the button is disabled. An inline message stays visible next to the field that needs fixing. |
| Clash recovery | (a) list all free ranges for the room; (b) one "next free dates" button | **(b)**. One action keeps the panel short. The calendar already shows the full picture. |
| Range picking | (a) drag across cells; (b) click start, then click end; (c) keep single-day click | **(b)**. Dragging is awkward on touch screens and inside a horizontally scrolling grid. Two clicks work with mouse, touch and keyboard. |
| Reset demo | (a) undo toast; (b) confirm dialog | **(b)**. It's a demo-only control, and `confirm()` is simple and impossible to miss. Undo would need a snapshot of state for little gain. |

## An AI suggestion I refined or rejected

- **Rejected:** the AI first suggested removing the *Check availability* button, because live checking makes it redundant. I kept it. The brief says not to remove existing features, and some users want an explicit "check" before committing. It now uses the same specific messages as submit.
- **Refined:** the AI suggested hiding booked cells completely, so only open days are clickable. I refined this to *disabled + hatched + labelled "Reserved"*. Hiding them would remove context: students need to see *when* a room is busy to plan around it. Disabling still stops the failing click.

## Testing

I ran an automated browser script (Playwright with Chrome) against `npm run dev`. All 25 checks passed:
- **Main action:** range-click A3-209 12 → 15 Nov, then confirm. The booking appears in *Your bookings* and as amber cells.
- **Unsuccessful actions:** each of these shows its own message:
  - unknown room `Z9-999`
  - end date before start date
  - empty room
  - B2-104 13 → 15 Nov, an overlap (room typed in lower case)
- The suggestion button fills in 15 → 17 Nov, and that booking saves.
- **Edit flow:** clicking your own cell opens it. Extending a booking over its own old dates is allowed. A clash during an edit is rejected. Saving updates the grid. Cancel leaves the original. *Change* jumps the calendar to the right week.
- **Still working:** *Check availability*, the room filter, week navigation, `localStorage` persistence after reload, and Reset (cancel keeps data, OK restores the 40 example records).
- `vite build` succeeds. At 390 px there is no horizontal page scroll.

## Demo script (2 minutes)

1. Click **Thu 12 Nov**, then **Sat 14 Nov** on A3-209. The selection shows on the grid and the form says the room is free. Click **Confirm booking**. *(main action)*
2. Type B2-104, 13 → 15 Nov, and click **Confirm**. A red message names the clash, the cells turn red, and **Use next free dates** fixes it in one click. *(unsuccessful action + improvement 1 and 2)*
3. Click one of your amber cells. The editing banner appears, the card is tagged, and the calendar moves to the right week. Change the end date and click **Save changes**. *(improvement 3)*
