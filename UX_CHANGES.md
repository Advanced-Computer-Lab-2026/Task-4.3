# UI/UX Rescue: Changes and Justifications

## 1. Unclear booking errors and an unnecessary "Check availability" button

When I tried to book a room that was already taken, all I got was "Reservation failed. Review the selected dates." I got the exact same message when I left the room field empty, which has nothing to do with dates. The only way to find out what was actually wrong was to press "Check availability", and as a user I didn't realise I had to do that first. Having to guess what went wrong is frustrating, and two buttons that basically do the same job is confusing.

What I changed: the form now checks availability while you're filling it in. Under the dates there's a small status box that either says the room is free (e.g. "✓ C3-102 is available 9 Nov – 10 Nov · 2 days") or explains the problem (e.g. "already booked… reserved 9 Nov – 10 Nov"). If you submit anyway, you get the same specific message. Since this covers everything the Check availability button did, I removed it. The validation rules themselves (required fields, end after start, no overlaps) are the same as before.

Screenshots: `before-2-generic-error.png` → `after-2-specific-error.png`

## 2. Editing a booking

Changing a booking is part of the scenario, but it didn't work well:

- When I clicked "Change", the form filled in but the page didn't move. On a smaller screen the form is underneath the calendar, so it looked like nothing happened.
- There was nothing to show which booking I was editing.
- The worst part: while editing, if I clicked a day in the calendar to pick a new date, it quietly left edit mode. Pressing save then made a second booking instead of moving the original one. I only noticed because I ended up with two bookings.
- The "Change" link was tiny and easy to miss.

What I changed: clicking Change now brings the form into view, and the form shows a banner like "Editing A2-107, 9 Nov · 1 day". The booking card you're editing is also highlighted in the list. Clicking the calendar while editing now updates that booking instead of cancelling the edit, and clicking one of your own bookings in the calendar opens it for editing. Change and Cancel editing are now normal buttons, so they're easier to see and click.

Screenshots: `before-3-edit-lost.png` → `after-4-editing.png`

## 3. Confusing dates and no way to select a range

End dates are actually check-out days, so a booking from 9 to 11 Nov only covers the 9th and 10th. The list still showed it as "9 Nov – 11 Nov", which made me think it was three days. Clicking the calendar only ever selected one day, nothing showed what I'd selected, and a note on the page admitted that "Open" didn't mean your whole range was free. You could also click other people's reserved days, which just filled the form with a date that was guaranteed to fail.

What I changed:

- Bookings now show the days you actually have plus a count, e.g. "9 Nov – 10 Nov · 2 days", and the end field is labelled "End date (check-out)".
- In the calendar, the first click sets the start day and a second click in the same row sets the last day. The selected days are highlighted, and a short hint tells you what to click next.
- Other people's reserved days can't be clicked anymore and have a striped look. Your own bookings have their own colour, and the legend shows all four states.
- On desktop the form stays visible while you scroll down the room list, so you can see the result right next to your selection.

How bookings are stored didn't change; the end date still works the same way underneath.

Screenshot: `after-3-range-selected.png`

## 4. Fonts, random values and small text

The page mixed two fonts (DM Sans and Space Grotesk), and the CSS had around 40 different hard-coded colours. Most text was 9–11px, and some grey text was very low contrast (around 2:1, while WCAG asks for 4.5:1), so the helper text and legend were hard to read. That's a problem because those are the parts that explain how to use the page.

What I changed: I switched to just DM Sans and moved colours, font sizes, spacing and border radius into CSS variables (design tokens) at the top of `styles.css`, so the whole page uses the same set of values. The smallest text is now 12px, the grey text is darker so it passes contrast, and there's a visible focus outline for keyboard users.

## An AI suggestion I rejected and refined

For the date problem (#3), the AI's first idea was to replace the End date field with a "Last day" field and convert it to the check-out date behind the scenes. I didn't go with that. The brief defines `endDate` as a date strictly after the start, and changing what the field means could easily cause off-by-one mistakes in validation that already worked.

What I did instead was keep the real field, make its label clearer, and show every booking as the days you actually have. In the calendar you still pick the last day you need, and the check-out date is filled in for you. Users get the simpler "last day" way of thinking, and the data and validation stay exactly the same.
