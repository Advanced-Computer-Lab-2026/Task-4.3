# Dorm Room Booking UI/UX Rescue Report

## 1. User scenario and goal

A student needs to compare availability across 18 common rooms, reserve a suitable date range, understand whether the request succeeded, and later find and adjust only their own reservation. The rescue keeps the existing React/localStorage architecture and booking rules.

## 2. Before-state summary

The original interface displayed the full directory and preserved booking data, but three parts of the journey were unreliable or unnecessarily error-prone. Reserved calendar cells looked and behaved like selectable controls; submission replaced specific validation findings with a generic error; and the “My bookings”/edit journey did not reliably move the viewport or focus to the intended content. In particular, the navigation attempted to scroll immediately, and editing changed the form off-screen without announcing the context.

## 3. Usability problems, alternatives, and decisions

### 1. Reserved dates behaved like valid starting points

**Student goal:** Find a genuinely available room/day and use it to start a reservation.

**Problem and impact:** Every cell—including a reserved one—was a clickable button. Selecting a booked day populated the form as if it were a reasonable choice, postponing the failure until validation. “Open” also sounded like status rather than an action. This created a false affordance and avoidable rework.

**Alternative A:** Keep every cell clickable and show a modal explaining conflicts. This retains access to booking details, but adds interruption and still treats an unavailable date as a primary action.

**Alternative B:** Disable reserved cells, give each cell a complete accessible name, and label available cells “Select.” This prevents the invalid first step and works with mouse, keyboard, and assistive technology. The trade-off is that disabled cells cannot receive keyboard focus; their visible state and nearby legend still communicate availability.

**Selected improvement:** Alternative B. Reserved cells are disabled, use a non-interactive cursor, retain ownership text (“Your booking” versus “Reserved”), and have descriptive names. Available cells say “Select,” populate a one-day range, move focus to the form heading, and provide a next-step message. The horizontal calendar container is keyboard focusable and named for narrow layouts.

### 2. Validation and availability feedback did not help recovery

**Student goal:** Complete the required fields, verify the entire range, and fix a failed request without guessing.

**Problem and impact:** The validation function could identify a missing field, invalid date order, or overlap, but form submission discarded that information and always showed “Reservation failed. Review the selected dates.” Missing room input was therefore described as a date problem, and an overlap gave no conflicting range or recovery instruction. The exclusive meaning of the end date was also unclear.

**Alternative A:** Use only native browser validation. This is compact, but its messages vary by browser and it cannot explain the conflicting reservation range.

**Alternative B:** Preserve central validation rules while mapping failures to inline fields and a range-level status. This requires more state and copy, but provides consistent, specific recovery guidance without changing rules.

**Selected improvement:** Alternative B. Required markers, `aria-invalid`, associated inline messages, an end-date minimum, a live range summary, exact conflict dates, and corrective instructions now share one validation result. Feedback clears when relevant values change so stale success/error messages do not linger. Success names the room and range. A submission lock guards against duplicate handling.

### 3. Finding and editing “My bookings” lacked reliable orientation

**Student goal:** Find an existing personal reservation, enter edit mode, confidently save or cancel, and know other students’ bookings are protected.

**Problem and impact:** The “My bookings” control changed only its selected styling and attempted to scroll before the state update; it did not reliably orient the student. “Change” silently filled a form that could be outside the viewport. The form’s edit state, ownership boundary, cancel result, and booking count were easy to miss.

**Alternative A:** Create a separate My bookings page. This gives strong separation, but duplicates layout/routing work and removes the useful availability context from a small standalone app.

**Alternative B:** Keep the single-page architecture and make the existing anchors dependable: show a personal-booking count, move viewport and focus to the bookings/edit headings, label edit mode, explain ownership, and confirm cancel/save outcomes. This is conservative and preserves context, though the page remains vertically long.

**Selected improvement:** Keep one Availability page and add explicit internal workflow navigation. “Make a reservation” focuses create mode; “Change reservation” focuses a selected edit or guides the student to the written records; “My reservations” highlights personal bookings in the schedule and links onward to the written list. Card actions move focus to a clearly labelled edit form, while other-user bookings remain excluded from edit controls.

## 4. AI suggestion refined or rejected

**Original suggestion:** Replace the calendar/form with a multi-step wizard: choose a room, choose dates, then confirm.

**Decision:** Rejected.

**Why:** A wizard would hide the 18-room comparison that is central to finding availability, add navigation/state complexity, and feel like an unrelated redesign. The final decision keeps the existing grid and side-panel design, but turns the grid into a reliable starting point and the form into a clear validation/confirmation step.

## 5. Visual-clarity refinement

This refinement builds on—rather than replaces—the original three usability improvements.

### Calendar state mapping

| State | Visual treatment | Non-color cue and behavior |
|---|---|---|
| Available | Light mint `#e7f7ee` with a strong green `#2f8c5c` inset edge | “Available / Select,” descriptive accessible name, enabled pointer behavior, and a stronger green hover boundary. |
| Reserved by another user | Blue-gray `#dde7ed` with neutral blue-gray boundaries | “Booked / Reserved,” disabled and non-interactive, with no green indicator. |
| Current user’s booking | Light amber `#fff1d2` with amber `#b77918` inset edge | “Your booking / Booked,” disabled, and explicitly distinguished from another student’s reservation. |
| Selected available slot | Light teal `#d8f1ef` with a strong teal `#0b6f72` outline | Check mark, “Selected / Review dates,” `aria-pressed="true"`, and a separate amber keyboard-focus outline. |

The legend now names and illustrates Available, Reserved, Your booking, and Selected. Slot meaning is never communicated by color alone.

### Button hierarchy and booking sequence

- **Primary:** Confirm booking / Save changes uses a strong filled teal treatment and remains disabled until a successful availability check.
- **Secondary:** Check availability uses a high-contrast teal outline.
- **Neutral:** Cancel editing uses a neutral filled/outlined treatment and clearly reports that no changes were saved.
- **Warning:** Reset demo is visually separated in muted red and opens a confirmation before any data is restored.
- **Disabled:** Reduced-contrast fill, readable muted text, and `cursor: not-allowed` are consistent across buttons.
- **Interaction:** Buttons provide hover, pressed, focus-visible, and disabled states; keyboard focus remains distinct from calendar selection.

The sequence is now enforced: enter or select room/dates → Check availability → receive “Room is available. You can now confirm this booking.” → Confirm booking or Save changes. Changing room, start date, or end date invalidates the check and disables the primary action again. Optional purpose edits do not invalidate a valid room/date check. Existing detailed required-field, date-order, and overlap feedback remains intact.

### Final single-page workflow refinement

The final structure deliberately keeps all tasks on one Availability page: heading/statistics → internal workflow navigation → reservation form → availability schedule → written My reservations list. A separate My bookings page was rejected because students benefit from seeing the same room/date context while creating, locating and editing reservations.

My reservations remain represented twice for complementary reasons. The schedule highlight answers “where does my booking sit among other availability?” without falsely highlighting another user’s records. The written cards answer “what exactly did I reserve?” with labelled Room, Dates and Purpose fields plus an explicit Change reservation action. The highlight state includes a direct control to continue to the written list, so the two presentations form one journey rather than duplicate destinations.

The form moved above the schedule because it is the primary action and edit destination. A centred maximum width, vertical field order, larger labels, stronger input boundaries and generous spacing make it easier to scan and ensure Start date and End date are never visually conflated. Create mode uses a restrained cyan treatment; edit mode uses a separate indigo treatment and identifies the selected reservation in text. Typography was strengthened across internal navigation, form instructions, schedule legend/status, card room/date values and buttons while retaining the existing font family and compact visual language.

## 6. Modified files

- `src/App.jsx` — accessible availability actions, detailed validation/status, focus management, improved personal-booking/edit flow, and duplicate-submit guard.
- `src/styles.css` — visible focus, disabled/actionable slot states, feedback and field-error styling, stronger readable contrast, and narrow-width form/navigation adjustments.
- `scripts/ux-check.mjs` — repeatable headless-browser functional journey covering data, rules, persistence, ownership, reset, and keyboard reachability.
- `submission-evidence/README.md` — evidence scope and baseline-capture disclosure.
- `submission-evidence/after-availability-desktop.png` — genuine 1440px after-state capture.
- `submission-evidence/after-availability-mobile.png` — genuine 390px narrow after-state capture.
- `UX_RESCUE_REPORT.md` — design reasoning, test record, and screenshot checklist.

## 7. Testing performed and results

| # | Required check | Method and result |
|---|---|---|
| 1 | Application starts with `npm run dev` | **Pass.** Vite served the app at `http://localhost:5174/`. The sandboxed server could serve HTML but Windows blocked Vite’s transform child process; the approved unrestricted run served the full app. |
| 2 | Production build | **Pass.** `npm run build`: 26 modules transformed; production assets emitted. The first sandboxed attempt failed with `spawn EPERM`; the identical approved unrestricted run passed. |
| 3 | Availability and example bookings display | **Pass.** Automated browser assertion found 18 room rows, 126 week cells, 40 seed reservations, and 8 current-user records. |
| 4 | Week navigation | **Pass.** Automated browser check verified next changes the displayed range and previous restores it. |
| 5 | Valid non-overlapping creation | **Pass.** Created D1-101 for 18–20 Nov with purpose “Automated UX check”; total records increased by one. |
| 6 | Created item under My reservations | **Pass.** New purpose and ninth personal card appeared in the written list below the schedule. |
| 7 | Current user can edit own reservation | **Pass.** Change entered edit mode and saved purpose “Updated UX check.” |
| 8 | Edited data persists after refresh | **Pass.** Reload retained the updated purpose from localStorage. |
| 9 | Missing required fields rejected | **Pass.** Three associated inline errors appeared; record count did not change. |
| 10 | Equal/earlier end date rejected | **Pass.** Equal and earlier cases each produced “End date must be after the start date”; records were unchanged. |
| 11 | Overlap rejected | **Pass.** A1-203, 9–11 Nov was rejected with the conflicting room/range; records were unchanged. |
| 12 | Failed submissions do not mutate data | **Pass.** Counts stayed unchanged after required, date-order, and overlap failures. |
| 13 | Other-user booking cannot be edited | **Pass.** Other-user calendar reservations remain disabled and marked Reserved; the written My reservations list contains only owner `you`, so no other-user edit control exists. The owner guard remains in `edit`. |
| 14 | Reset restores original data | **Pass.** Canceling the new confirmation preserved the edited data; accepting it removed the automated record, restored 40 seed records/eight personal cards, reset week/filter/form/edit state, and retained the original example records. |
| 15 | Three improvements | **Pass.** Reserved cells disabled/available cells actionable; specific inline and range feedback rendered; My bookings/edit navigation moved viewport/focus and exposed edit/cancel context. The later four-state clarity refinement also passed textual, class, and computed-style assertions. |
| 16 | Keyboard navigation | **Pass.** Browser key dispatch verified Tab reaches an interactive control and its computed outline remains visible; selected slots use a separate non-focus outline/check indicator. |
| 17 | Desktop and narrow widths | **Pass.** Genuine 1440×1200 and 390×1600 renders recaptured. Explicit device emulation verified no page-level overflow at 390px and confirmed Reset remains in the viewport. The wide comparison grid retains its own horizontal scrolling. |
| 18 | `git diff --check` | **Pass.** No whitespace errors. |
| 19 | Final status/review | **Pass.** Reviewed only the intended source, test, report, and evidence changes; final status recorded below at handoff. |

Automated journey command: `node scripts/ux-check.mjs` (against the running Vite server and an isolated headless-browser profile). The script starts by clearing only that isolated profile’s localStorage and ends by restoring demo seed data.

Additional refinement assertions passed for all four slot labels/classes/backgrounds, selected check and outline, legend completeness, confirmation disabled before checking, successful-check enablement, check invalidation after date changes, Save changes gating, visible keyboard focus, Reset cancellation/acceptance, and the 390px layout.

The final single-page suite also verifies that the top header contains only Availability and Reset demo; all three internal controls exist and expose active state; the form precedes the schedule and is vertically laid out; Change reservation guides when nothing is selected; My reservations highlights only owner `you`; the written list stays below the schedule; every card selects the correct booking; and a visible selected booking receives a schedule outline.

## 8. Screenshot checklist

- [ ] **Before: Availability page.** Remaining manual capture. From the unchanged baseline, reset the demo, open Availability at 1440px, and capture the calendar plus original form.
- [ ] **Before: Original written bookings area.** Remaining manual capture from the unchanged baseline.
- [x] **After: Complete Availability page and create form.** `submission-evidence/after-availability-desktop.png` is recaptured from the final single-page structure.
- [ ] **After: My reservations highlighted.** Activate My reservations and capture the status, highlighted amber personal cells and “View written My reservations” control.
- [ ] **After: Written My reservations list.** Continue to the list and capture its heading, count and labelled cards.
- [ ] **After: Change reservation mode.** Choose Change reservation on a card and capture the indigo edit form plus the selected schedule booking when its week is visible.
- [ ] **After: Successful update.** Check availability, save a purpose change and capture the named success message plus updated card.
- [ ] **After: Overlap validation.** Enter A1-203 for 9–11 Nov 2026, check availability and capture the exact conflict range and red range summary.
- [x] **After: Evidence of improvement 1 and improvement 2 starting state.** Desktop capture shows disabled Reserved cells, actionable Select cells, instructions, required labels, and range-status panel.
- [ ] **After: Evidence of improvement 3.** Use the edit-experience capture above.
- [x] **Narrow/mobile evidence.** `submission-evidence/after-availability-mobile.png`, recaptured for the final single-page layout.
- [ ] **After: Selected and successfully checked state.** Manual capture still recommended: select an Available cell, click Check availability, and capture the checked “Selected” cell, success instruction, and newly enabled primary button together. The states are covered by automated browser assertions, but the static default-state captures do not show this transient combination.

No before screenshot is claimed: screenshot tooling became available only after editing had begun. The unchecked items are intentionally precise manual instructions, not fabricated evidence.
