# Dorm Room Booking — ACL UI/UX Lab

This is a **standalone React demo** for one session of the UI/UX Rescue Challenge. It uses realistic example records stored in this browser; it does not connect to MongoDB or the previous lab API.

## Run

```bash
npm install
npm run dev
```

The terminal prints **one local URL**. Open that link in your normal external browser. The development server will **not** open a browser automatically. Press `Ctrl+C` to stop it.

## Functional brief

Users can browse bookings across an example directory of 18 rooms, create and change their own bookings. Date ranges must be valid and overlapping bookings for the same room are rejected.

### Fields from the prior lab

- `roomNumber` — Room number: type or choose a room; suggestions show rooms available for the selected date range, and unknown room numbers are rejected
- `startDate` — Start date: YYYY-MM-DD
- `endDate` — End date: YYYY-MM-DD, strictly after start
- `purpose` — Purpose: optional

The demo supports create/edit and stores your updates in browser `localStorage` for this browser. **Reset demo** restores the example records. You can assume the current signed-in user is `You`.
In **Your bookings**, select a booking card to edit it. You can also select your highlighted **Your booking** cells in the calendar to edit that reservation. Other reserved cells stay unavailable.

## User scenario for this session

A student needs to find dates for a common room, reserve it, and later adjust their own reservation.

Your redesign should support the scenario above without removing or weakening the existing features.

## UI/UX Rescue Challenge (25–30 minutes)

**Your mission:** use this interface as an end user, find **at least three distinct, meaningful UI/UX problems**, and fix all three with AI assistance.

- Explain the user's goal and why each issue hurts usability.
- Ask AI to suggest alternatives and compare trade-offs before you implement a solution.
- Choose your own changes; there is no prescribed visual redesign.
- Preserve all working behavior and relevant validation.
- Demonstrate the main action, one unsuccessful action, and your three improvements.

**Submit:** the modified React files, before/after screenshots, three brief justifications, and one example of an AI design suggestion you refined or rejected.

**Evaluation:** We assess usability reasoning, design consistency, preserved functionality, and testing. Using AI is allowed and expected. Cosmetic changes alone are not sufficient.

## Rescue changes

The user's goal is to find an uninterrupted date range for a shared room, reserve it, and later change their own reservation.

### Three usability problems addressed

1. **Booked calendar cells could be clicked.** That interaction prefilled dates already known to be unavailable, making a failed attempt likely. Reserved cells are now disabled, and the calendar explains that an open day only selects a one-day starting point; the full range is still validated.
2. **The end date was easy to read as the last reserved day.** The stored end date is exclusive, but both the form and the booking list looked inclusive. The form now marks the end date as not included, explains when the room becomes available, and the booking list displays the last reserved day and duration.
3. **A failed submission hid the useful validation reason.** The existing validator already distinguishes missing values, invalid date order, and overlaps, but submit replaced each result with the same vague error. The form now shows the specific reason and clears stale feedback when a field changes.

### Alternatives considered

An AI suggestion was to replace the weekly grid with a full date-range finder and a separate list of matching rooms. That would make multi-day availability easier to compare, but it would duplicate date entry, substantially reshape the interface, and make the 18-room overview less immediate. I refined that idea rather than adopting it: the weekly grid remains the starting point, reserved cells are no longer selectable, and the form explicitly explains that the entire requested range is checked before booking. This keeps the familiar browse-and-book flow while addressing the misleading interaction.

### Demonstration checklist

- **Successful action:** choose an open calendar date, adjust the end date, enter a purpose, and confirm the booking.
- **Unsuccessful action:** enter an existing room/date overlap in the form and submit; the reason is shown without removing or weakening overlap validation.
- **Edit action:** select a booking under **Your bookings**, update its details, and save.
- **Persistence:** refresh the page to confirm changes remain in this browser; use **Reset demo** to restore the examples.

The initial **before** screenshot is attached earlier in the task conversation. The saved after screenshots are [screenshots/after.png](./screenshots/after.png) and [screenshots/after-validation.png](./screenshots/after-validation.png). Cosmetic changes alone are not sufficient.
