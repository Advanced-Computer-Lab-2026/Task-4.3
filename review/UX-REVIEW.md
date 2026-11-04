# Roomgrid: major UI/UX improvements

The student's goal is to find a room for a complete date range, reserve it, and later change their reservation. Read alongside the original README.

| Major issue | Before | After | Why this helps |
| --- | --- | --- | --- |
| Finding a room requires manual scanning | An 18-room weekly grid shows individual days. An open start day can still lead to a conflicting multi-day booking. | Enter start and end dates first. Search returns only rooms free for the entire range; selecting a result copies its room and dates into the reservation form. The weekly calendar remains available in an expandable section. | Students can answer their actual question: which room is free for all my dates? |
| Failed bookings provide little recovery | Reserved cells start new reservations. Submission discards the precise validation error and shows a generic failure. | Other students' reserved cells are disabled; your own cells open editing. Submission explains the actual error. Conflicts offer up to three available rooms while keeping the dates and purpose. End-date exclusion is explained explicitly. | Prevents avoidable attempts and lets users recover without starting over. |
| Managing a reservation requires a long scroll | My bookings changes the navigation highlight and scrolls below all 18 calendar rows. Change fills a distant form without moving focus. | My bookings displays a dedicated list immediately. Change opens the populated editor, scrolls toward it and focuses the room field. Saving continues to update the same reservation. | Returning students can find and edit their records without navigating the whole availability grid. |

## Global website references

- [Airbnb: using search features](https://www.airbnb.com/help/article/3117) describes searching with travel dates and returning available listings. Adapted to full-range campus room search.
- [Booking.com customer service](https://www.booking.com/customer-service.html) provides booking management and date-change entry points. Adapted to a dedicated My bookings view.

These are workflow references, not claims that the demo reproduces those websites' interfaces.

## Alternatives and trade-offs

1. **Calendar-only versus date-first results:** a calendar is useful for flexible dates but requires scanning. Date-first results fit the stated scenario. Retained the calendar as a secondary option rather than removing its browsing capability.
2. **Disable every occupied cell versus preserve ownership actions:** disabling all occupied cells would prevent accidental attempts but also block a useful editing shortcut. Refined that suggestion: disable other people's bookings and let your own cells open editing.
3. **Edit modal versus existing form:** a modal would keep the selected record visible but adds focus trapping and small-screen complexity. Retained the form, with an explicit edit heading, cancel action, scrolling and input focus.

## Evidence

- [Original interface](before.jpg)
- [Date-range search results](after-search.jpg)
- [Rejected conflict and alternative rooms](after-conflict.jpg)
- [Dedicated booking management](after-bookings.jpg)

Screenshots are actual browser captures. The browser was resized during inspection; before and after captures have different window sizes. The original interface can be revisited during development at `/review/before.html`; it shares the demo's local browser records.

## Verification

- Production build: `npm run build` passed.
- Validation checks: `node review/validation.mjs` passed required-field rejection, equal-date rejection, case-insensitive overlap rejection, adjacent non-overlapping ranges, and editing without conflicting with the same record.
- Browser: searching 9–11 November 2026 returned six available rooms; selecting A3-208 populated both dates.
- Browser unsuccessful action: attempted A1-203 for those dates; rejected with the exact conflict message and three alternatives.
- Browser recovery and main action: selected an alternative and confirmed; reservation count increased from 40 to 41 and search results stopped offering the reserved room.
- Browser management: My bookings showed the new record; Change populated the editor; changing its purpose and saving displayed Booking updated and updated the list.
- A test reservation for A3-208, 9–11 November, remains in this browser, with purpose Study group · UX verification.

Create/edit, localStorage persistence, optional purpose, overlap checks, room browsing and Reset demo remain in place. Full phone-width interaction testing was not performed.
