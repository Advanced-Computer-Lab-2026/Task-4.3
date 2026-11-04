# UX Rescue — Notes

**User goal:** a student wants to find free dates for a common room, book it, and later change that booking.

## 1. Error messages that explain what went wrong
**Problem:** Every failed submit showed the same message: "Reservation failed. Review the selected dates." This appeared even when the room was empty or misspelled, and it never said *which* booking caused a clash. The student had to guess and try again.
**Fix:** The form now shows the real reason, for example: *"B2-104 is already reserved for Fri 13 Nov – Sat 14 Nov (2 days). Choose days outside that range."* The field at fault gets a red outline (`aria-invalid`), and a **Show in calendar** link jumps to the conflicting booking. Room names are matched without regard to case. Rooms that aren't in the directory are rejected, because a booking like that would never show in the calendar.

## 2. A calendar you can trust and pick dates from
**Problem:** Booked and open cells were two very similar pale colours. "Your booking" looked the same as other people's bookings. Clicking a **booked** cell still put that date into the form, so the student was set up to fail. You could also only pick one day at a time.
**Fix:** The calendar now has four clearly different states: open (green), reserved (grey stripes, can't be clicked), your booking (amber), and your selection (solid teal). Each has a legend entry and its own text label, so colour isn't the only signal. Click an open day to start, then click a later open day in the same row to extend the range. A range that would cross another booking is refused, with the reason shown. A selection bar under the calendar shows the chosen range and a **Continue to booking** button. Clicking one of your own bookings opens it for changes.

## 3. Changing your own booking
**Problem:** **Change** filled the form but didn't scroll to it or show which booking you were editing. Worse, clicking a calendar day while editing quietly left edit mode, so **Save** created a *second* booking instead of moving the first one.
**Fix:** Edit mode now stays on while you pick new days in the calendar. **Change** scrolls to the form and moves the calendar to that booking's week. An amber banner shows the booking's original room and dates, and the list marks it as "Editing". The booking's current days have a dashed outline in the calendar. **Cancel editing** now looks like a real button.

**Supporting fix (layout):** "Your bookings" used to sit below all 18 calendar rows, so changing a booking meant scrolling past the whole calendar. Once you scrolled, the day headers were gone too, so it was hard to tell which column was which date. The calendar now has a fixed height and its own scrolling. The day headers and room names stay pinned in place, and "Your bookings" sits right below the calendar. Clicking **Change** or **Show in calendar** also scrolls the calendar to the right room.

**Supporting fix (dates):** The end date is the day the room is free again, and it isn't part of the booking, but nothing said so. The form now labels it *(not included)* and shows a live summary: "Covers Tue 17 Nov – Wed 18 Nov (2 days). The room is free again on Thu 19 Nov." The end date picker won't offer days on or before the start date. Lists show the actual days booked.

## Preserved behaviour
Create, edit, saving in localStorage, Reset demo, the room filter, week navigation and Check availability all still work. The validation rules are the same: room required, end date strictly after start, no overlaps in the same room (your own booking is ignored while you edit it). The stored data format hasn't changed.

## AI suggestion I refined or rejected
- **Rejected:** replace "End date" with an inclusive "Last day" field. The page would be clearer, but the stored meaning of `endDate` from the earlier lab would change. Instead, I kept the field and added the *(not included)* label and the live summary.
- **Refined:** an early version scrolled to the form after every calendar click, like the original code. On narrow screens that pulled the user away before their second click, which broke range picking. I replaced it with the selection bar under the calendar, which has its own **Continue to booking** button.

## Test checklist (for the demo)
1. **Main action:** click A3-209 on Fri 13 Nov, then Sat 14 Nov, choose Continue, then Confirm. The booking appears in Your bookings and in the calendar.
2. **Failed action:** type B2-104 with dates 14 Nov → 16 Nov and choose Confirm. You get a specific clash message, red date fields, and the Show in calendar link.
3. **Edit:** click Change on A1-203. Click open days in that row and choose Save changes. The booking moves, with no duplicate.
4. **Reset demo** restores the sample data.
