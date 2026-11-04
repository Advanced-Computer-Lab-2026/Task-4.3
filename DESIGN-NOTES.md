# RoomGrid redesign notes

## User goal

A student needs to find an open date range for a common room, reserve it, and later adjust their own reservation. The interface must keep room browsing, local demo storage, reset, create/edit, and overlap validation.

## Problems, options, and decisions

1. **The end date's meaning was hidden.** The system treats the end date as exclusive, so a reservation from Nov 9 to Nov 11 uses Nov 9 and 10. Without that explanation, students may reserve too many or too few days. An alternative is to change the app to inclusive end dates, which matches many people's expectations but changes overlap behavior and how existing records are interpreted. The redesign preserves the existing rule and explains it beside the fields.
2. **Reserved cells were clickable.** Choosing one filled the form with a known conflict, and submitting replaced the useful validation detail with a generic failure message. Leaving cells clickable supports conflict discovery, but creates an avoidable dead end. The redesign disables reserved cells, labels their state for assistive technology, and displays the specific validation message when manual date entry finds a conflict.
3. **Changing a booking required finding a list below the full room grid.** The “My bookings” control only scrolled down, which is especially costly on smaller screens. Moving the list above the calendar would make it faster to reach but would clutter availability browsing. The redesign makes “My bookings” a dedicated view, separate from Availability. Each booking's Change action opens an editor inside that booking card, with visible save and cancel actions.

## AI suggestion refined

An initial design suggestion was to make the end date inclusive because that may be more familiar. I rejected the data-rule change and refined the suggestion into a visible “first day not included” label plus a concrete date example. That improves understanding without changing stored dates, overlap checks, or existing reservations.

## Verification

The Vite production build succeeds with `npm.cmd run build`. I could not capture before/after screenshots or complete a browser-based end-user walkthrough in this session because no browser or computer-use control tool was available. The findings above are based on the rendered interface structure and the booking interactions implemented in `src/App.jsx`.

