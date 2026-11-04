# UX changes — draft justifications

**User goal:** a student finds free dates for a room, reserves it, and later adjusts their own reservation.

## 1. Rooms separated by building (tabs)
**Problem:** all 18 rooms from four buildings (A–D) were in one long table, so finding a room meant scrolling past rooms in other buildings, and the "Location" dropdown only listed individual rooms.
**Fix:** a Building A / B / C / D tab bar above the calendar shows one building at a time, with a room count on each tab. The room dropdown now lists only that building's rooms ("All rooms in Building A").
**Trade-off:** you can't compare buildings side by side, but each table is short, which suits looking for a room in one building.

## 2. "Your booking" stands out
**Problem:** your bookings used the same pale fill and "Booked" label as everyone else's. Only a 9px "Your booking" caption set them apart, so you couldn't spot your own reservations at a glance.
**Fix:** your cells keep the pale fill but get a thick teal border, a ★ icon, a bold "Your booking" label and the booking's purpose. There's also a matching "Your booking" legend entry.
**Why this option:** shape and icon cues work without relying on colour alone, which is better for colour-blind users, and they match the existing palette.

## 3. Changing a booking opens a dialog
**Problem:** "Change" silently turned the side form into "Change reservation". The form was often off-screen, so nothing visibly happened, and the same form was used for both new and edited bookings.
**Fix:** "Change" opens a dialog titled "Change booking — {room}" that shows the current dates, with Check availability, Cancel, Save changes and ✕ buttons. Escape or clicking outside closes it, and focus goes back to the Change button. After saving, a "Booking updated: …" message appears above Your bookings. The side panel is now only for new bookings.
**Preserved:** the same validation (required fields, end after start, no overlap, the booking itself excluded from the overlap check) and localStorage saving.

## 4. Clearer summary numbers
**Problem:** "Rooms in directory 18 / Current reservations 40" didn't say what the numbers counted. "Current reservations" counted every booking on every date, not the week on screen.
**Fix:** "Rooms you can book: 18 (across 4 buildings)" and "Bookings this week: N (9–15 Nov, all buildings)". The second number follows the week arrows.

## AI suggestion I refined or rejected
- For #2 the AI recommended a **solid dark teal fill + white text + "YOU" badge**. I rejected it for **border + ★ icon on the pale fill**: it's less loud, keeps the calendar visually calm, and doesn't rely on colour alone.
- For #4 the AI recommended a **personal summary** ("Your bookings: 8 / Next up: …"). I chose **clearer labels** instead: keep the same two facts but say exactly what they count.

## Testing done
- Building tabs switch tables; the room dropdown is limited to the selected building.
- Your bookings are marked in every building.
- Change → dialog; an overlapping edit is rejected with the dialog kept open; a valid edit saves and confirms; Escape closes it and returns focus.
- A new booking from a calendar cell still saves ("Room reserved.") and shows as yours.
- Reset demo restores the example data, Building A, and closes the dialog.
