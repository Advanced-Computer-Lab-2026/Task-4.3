# Task 4.3 — UX audit, design decisions, and test report

## UX audit

### 1. A day looked bookable even when the chosen date was occupied

- **User goal:** Pick a room and dates that are actually free.
- **Original problem:** Every calendar cell was clickable, including reserved dates. Clicking an occupied cell silently filled a one-day booking in the form, leaving the user to discover the conflict only after submitting. Multi-day reservations appeared as repeated isolated cells, with no visible end date.
- **Why it hurt:** The calendar encouraged an action that could not succeed and hid how long a reservation lasted.
- **Options considered:**
  1. Keep cells clickable and rely on the submit error. This needs no calendar behavior change, but repeats the frustrating failed action.
  2. Disable occupied dates and show their reservation end date. This prevents a known-bad selection and makes the occupied span easier to read, though it still cannot determine whether a longer custom range is entirely free.
  3. Replace the calendar with a list of reservations. This can present full ranges clearly, but makes week-by-week room comparison harder.
- **Selected and implemented:** Option 2. Reserved cells are disabled and show their end date; the explanatory note states that end dates are exclusive. The range finder (improvement 2) handles full custom ranges.

### 2. There was no way to find a room for a complete date range

- **User goal:** Find any common room available for the whole stay, then reserve it.
- **Original problem:** The “Location” control filtered the calendar to one room, while clicking an open day only entered a one-day range. The interface gave no direct way to compare all 18 rooms for the student's chosen start and end dates.
- **Why it hurt:** Students had to inspect rooms and dates manually, and an open day could still be part of a conflicting multi-day reservation.
- **Options considered:**
  1. Add a room search box. This speeds up finding a known room, but does not answer which rooms are free for the requested dates.
  2. Add start/end date search across all rooms and let the student transfer a result into the booking form. This directly answers the task and keeps the final booking under the user's control, at the cost of one extra date-entry step.
  3. Automatically reserve the first matching room. This is fast, but hides the room choice and could submit a reservation before the student has reviewed it.
- **Selected and implemented:** Option 2. “Find rooms” checks the entire requested range against all 18 rooms and returns selectable room results that prefill the form. The end-exclusive date convention is stated beside the controls.

### 3. Booking failures did not explain what to fix

- **User goal:** Correct a booking and complete it without guessing which field or date caused a failure.
- **Original problem:** The validation helper returned actionable reasons, but form submission replaced every reason with “Reservation failed. Review the selected dates.” The conflict-check button did not identify the conflicting reservation either.
- **Why it hurt:** Users lost useful context and had to infer whether a missing field, reversed date range, or room conflict caused the failure.
- **Options considered:**
  1. Keep one generic error. It is concise, but does not help the user recover.
  2. Show the validation reason inline, with conflicting room dates and a route to search again. This is clearer and preserves the existing validation rules, though conflict messages are slightly longer.
  3. Show a confirmation dialog for every failure. It attracts attention, but interrupts correction and adds extra clicks.
- **Selected and implemented:** Option 2. Submission now shows the actual validation message; overlaps identify the room's reserved dates and suggest trying another range or using the finder. The date rule remains strictly `endDate > startDate` and same-room overlaps remain rejected.

## TA feedback follow-up: selecting an open calendar cell

- **Problem:** Open calendar cells looked clickable but did not make the result of clicking clear enough.
- **Implemented:** Clicking an open cell fills the booking form's room, selected date, and following day as its exclusive end date. The cell receives a teal outline and selected state; the form shows a confirmation such as “A1-203 selected for 11 Nov.” Open cells now say “Click to select” and provide hover and keyboard-focus feedback. Reserved cells remain disabled, and the click handler also guards against selecting an occupied date.
- **Verification:** Browser interaction checks confirmed the form values, following-day end date, selected-cell styling, confirmation message, and that clicking a disabled reserved cell leaves the form and selection unchanged. The updated `screenshots/after.png` shows this selected state.

## AI design suggestion refined/rejected

An AI-generated suggestion was to remove the calendar and automatically book the first room that matches a date search. That would shorten the flow, but it would take room choice away from the student and make it harder to compare the alternatives before committing. I rejected automatic booking and kept the calendar while adding a date-range finder whose results prefill, but do not submit, the booking form.

## Testing report

Environment: Vite production build plus automated interactions in local headless Microsoft Edge. The browser checks used the actual rendered React interface and its browser `localStorage`.

| Scenario | Result |
| --- | --- |
| Browse the room directory | Pass — all 18 rooms rendered. |
| Navigate to the next and previous calendar week | Pass. |
| Filter the directory to one room and restore all rooms | Pass. |
| Search for rooms available across a chosen date range and transfer a result to the form | Pass. |
| Create a valid booking | Pass. |
| Edit an existing booking owned by “You” | Pass. |
| Reject an end date on or before the start date | Pass — specific inline error shown. |
| Reject an overlapping booking for the same room | Pass — conflicting reserved dates identified. |
| Book a different room for dates that overlap another room's booking | Pass. |
| Refresh and confirm the new booking persists in localStorage | Pass. |
| Reset demo and confirm the original 40 example records return | Pass. |
| Click an available calendar cell and verify room/start/end fields, confirmation, and highlight | Pass — selected A1-203 for 11 Nov; form dates were 11–12 Nov. |
| Attempt to select a reserved calendar cell | Pass — cell is disabled and the active selection/form values remain unchanged. |
| `npm run build` | Pass — Vite production build completed. |

## Screenshots

- After: [`screenshots/after.png`](screenshots/after.png) — genuine headless browser capture of the implemented page.
- Before: [`screenshots/before.png`](screenshots/before.png) — genuine headless browser capture rendered from the untouched initial commit.

## Submission follow-up

No manual code changes or additional verification are required for the listed scenarios. The assignment report and both screenshot artifacts are included.
