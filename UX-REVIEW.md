# Eight usability improvements

Student goal: find an available common room, reserve it, and later adjust their reservation. Findings below were confirmed in the original source code; they are not claims from a user study.

| Problem | User impact | Alternatives and trade-off | Implemented solution |
| --- | --- | --- | --- |
| All failed submissions displayed the same generic error, discarding the validator's specific explanation. | Students did not know what to correct. | Inline errors offer more precision but require additional field-level validation state; a specific alert is a smaller improvement using existing validation. | Show the actual missing-field, date-order, or conflict message; preserve entries and bring the form into view. |
| Booked cells started a new reservation for an occupied date. | Students were guided toward a guaranteed conflict. | Disable booked cells, or let them show useful details. Disabling also removes a route to editing one's own booking. | Booked cells open details; students can edit their own booking, while other reservations offer guidance to choose an Open date. Cell names identify room, date, and action for assistive technology. |
| The end date was exclusive but the form did not explain it. | A student could reserve fewer days than intended. | Change to inclusive dates, or explain the existing rule. Changing the rule would alter existing validation and records. | Keep exclusive dates, explain the rule by the field, and show the selected range and duration. |
| Change populated the form without scrolling or moving focus to it. | On the stacked layout the form could remain far off-screen, making the action appear ineffective. | Use a modal editor, or move focus to the existing form. A modal needs additional focus management and duplicates context. | Focus the form heading and bring it into view when creating or editing; respect reduced motion for this transition. |
| Reset immediately replaced all browser-stored changes. | One accidental click lost the student's work. | Provide undo, or require confirmation. Undo needs a saved snapshot; confirmation is simpler for this demo. | Explain what will be removed and provide Keep my changes and Restore example bookings before changing data. |
| The calendar is at least 790px wide and room labels scrolled out of view. | On a small screen students could lose track of which room a date belongs to. | Replace with cards, or keep the comparison grid and pin the room column. Cards make comparing rooms across dates harder. | Keep room names visible during sideways scrolling; add a scroll hint and a keyboard-focusable calendar region. |
| All 18 room rows made the schedule very long. | Students had to scroll the page extensively, losing the date context. | Paginate rooms, or contain the schedule in a scroll area. Pagination breaks continuous comparison. | Bound the schedule to 55% of viewport height, capped at 480px; keep date headers and room labels visible while scrolling. All rooms remain accessible. |
| Personal bookings were below the entire schedule; My bookings only scrolled down the page. | A frequent task was buried beneath unrelated content. | Move the list above the schedule, or give it a dedicated view. Moving it above pushes availability down instead. | Make Availability and My bookings separate navigation views. Show the personal booking count in navigation, clear Edit booking actions, and an empty-state route back to availability. Preserve the form when switching views. |

## References

- [GOV.UK error-message guidance](https://design-system.service.gov.uk/components/error-message/): supports clear messages explaining how to correct an error.
- [GOV.UK Design of the Year award](https://www.gov.uk/government/news/govuk-wins-design-of-the-year-2013): documented design recognition in 2013, rather than a claimed current numeric UX rating.
- [Booking.com UX benchmark](https://baymard.com/ux-benchmark/case-studies/booking-com): Baymard documents 151 best-practice examples across 18 desktop pages. This is evidence for studying individual patterns, not a claim that every interaction is ideal.
- [Baymard date-picker examples](https://baymard.com/ecommerce-design-examples/date-picker): research-based date-selection references.
- [Baymard accommodation research](https://baymard.com/research-articles/new-research-travel-accommodations): background for date-first booking flows.

These sources inform the choices; the exact solutions are adaptations for this campus demo.

## AI suggestion refined

Suggestion: disable every booked calendar cell to prevent booking conflicts. Refined: booked cells show details and an Edit action for the student's own booking. This prevents the misleading new-booking action while retaining access to useful information and editing.

## Demonstration and manual checks

1. Start with the sample data. Choose A1-203 on 12 November 2026, an Open date, and confirm the one-day booking ending 13 November. Verify the success message and updated calendar; refresh to check persistence.
2. Enter A1-203 from 9 to 10 November 2026. Confirm booking and verify the specific conflict message; entered values must remain intact.
3. Submit missing dates, then an end date before the start date. Verify that the errors explain different causes.
4. Select a Booked cell. Verify details appear rather than a new reservation form. Select Your booking and edit it. Verify that the form is brought into view and saving updates the existing booking.
5. Verify the end-date explanation and a two-day summary for 9–11 November.
6. Select Reset demo, then Keep my changes. Verify the records stay intact. Only confirm restore when you intend to discard demo changes.
7. At a narrow browser width, scroll the calendar horizontally. Verify room names remain visible and the page itself fits the viewport. Use Tab to reach the calendar region and arrow keys to scroll.
8. Scroll the schedule vertically to the last room; date headers should stay visible and the full page should not grow to the height of all 18 rows.
9. Select My bookings. Verify personal reservations replace the schedule immediately, the count matches, and Edit booking opens the populated form. Switch back to Availability and verify the selected week and room filter are preserved.

## Verification

- `npm run build`: passed.
- `node --test scripts/booking.test.mjs`: eight tests passed, covering valid reservations, required fields, equal/reversed dates, overlapping ranges, adjacent reservations, room comparison, different rooms, and editing conflict checks.
- Browser interaction, visual checks, and before/after screenshots remain manual steps; no screenshots are included in this change.

## Schedule and date refinements

The schedule now uses compact status chips, larger day numbers, separate weekday/month labels, a Today marker, distinct styling for personal bookings, and a visible selection matching the form's exclusive date range. Sticky headers and the bounded scroll area remain in place.

The initial week and reset week now use the current local calendar week, rather than a fixed November 2026 week. Weeks run Monday–Sunday. This week returns to the current week; Jump to date opens the week containing any chosen date. Week ranges and reservation labels include the year, including when crossing New Year. Existing sample reservations retain their original dates and remain accessible through navigation or Jump to date.

Changing the form start date moves the calendar to its week and advances an empty or earlier end date to the following day. A valid later end date is preserved. Editing an existing booking opens its week. Invalid calendar dates are rejected by validation, and the end-date picker has a minimum of the day after the selected start date. Historical booking dates remain editable; no new ban on past reservations is imposed.

Additional automated verification: `node --test scripts/booking.test.mjs scripts/dates.test.mjs` passes all 13 tests, including Monday/Sunday week boundaries, New Year, leap days, invalid dates, end-date adjustment, and year labels. Production build passes. Browser visual verification remains pending.
