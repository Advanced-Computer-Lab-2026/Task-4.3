# Dorm Room Booking UI/UX Rescue

## Student goal

A student needs to identify a room that is free for the intended dates, reserve it, and later adjust that reservation without guessing which calendar cells or date ranges are valid.

## Three improvements

1. **Reserved calendar cells are disabled.**
   - **Problem:** Every calendar cell looked selectable, even though choosing a reserved day could only lead to a rejected booking.
   - **Goal supported:** Quickly distinguish usable dates from unavailable dates.
   - **Solution:** Reserved cells now visibly remain unavailable and cannot be activated; available cells still populate the booking form.

2. **Range availability is explained before submission.**
   - **Problem:** A selected calendar day did not establish whether a student's entire requested range was free, and the exclusive end-date rule was easy to miss.
   - **Goal supported:** Check a complete room/date range before spending time in the form.
   - **Solution:** The form now checks the full range inline, explains the exclusive end date, and gives explicit available or conflict feedback.

3. **Conflicting reservations offer room alternatives.**
   - **Problem:** A conflict forced the student to leave the task, search the directory, and retry without guidance.
   - **Goal supported:** Recover from an unavailable room and continue planning.
   - **Solution:** The conflict state suggests up to three rooms that are free for the same range; selecting an alternative updates the form in place.

## AI suggestion that was refined

An initial suggestion was to replace the calendar grid with a room-picker wizard. That would reduce visual clutter, but it would remove useful week-at-a-glance comparison and add extra navigation steps. I refined it into smaller changes: keep the calendar, disable occupied cells, and add an inline range check plus alternatives.

## Verification performed

- Production build completed successfully with `npm run build`.
- Created a booking and confirmed the success state.
- Submitted a known conflicting range and confirmed the specific conflict, alternative-room suggestions, and alert.
- Edited an existing student booking and confirmed the updated purpose and success state.
- Reset demo data afterward so the repository returns to the original 40 sample records.
