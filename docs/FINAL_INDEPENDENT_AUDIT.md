# Final independent audit — Dorm Room Booking

Audit date: 4 November 2026 (Africa/Cairo). This report supersedes earlier PASS claims where they differ. No commit, push, merge, or PR was made.

## A. Overall verdict

**PASS — 86/86 browser assertions passed**, with machine-readable evidence in [audit/results.json](audit/results.json). The implementation preserves the README functional brief and the three approved improvements. Verified defects were corrected and the production build and Chrome regression checks were rerun. This is tested Chrome behavior, not a claim of exhaustive compatibility or WCAG certification.

The starter baseline is `63583cd3f8ecce3f32ae85bfb0ba9fee1d764b77`. `git log --all`, `git rev-list --max-parents=0 HEAD`, `git show`, and the working diff establish that this is the sole root/starter commit. At audit entry only `src/App.jsx`, `src/styles.css`, and untracked `docs/` differed. Package files, README, entry point, and dev launcher match the starter. The audit did not treat a branch name or Cursor's report as proof.

## B. Assignment compliance

| Requirement | Status | Evidence |
|---|---|---|
| Exactly 18 rooms | PASS | Browser counts 18 grid room rows; directory equals starter |
| Existing seed reservations display | PASS | All 40 records compared field-for-field with `git show` starter; 8 owned; occupied/open cells and detail text exercised |
| Create a valid reservation | PASS | Real Confirm action; persisted row and confirmation; `audit/desktop-success.png` |
| Required room number | PASS | Missing/whitespace validation; focus moves to room control; unchanged storage |
| YYYY-MM-DD dates | PASS | Native date controls; strict four-digit calendar-date validation; extended years rejected |
| End strictly after start | PASS | Equal and reversed dates rejected by both actions |
| Optional purpose | PASS | Blank purpose successfully saved |
| Same-room overlap rejected | PASS | One-day, contained, containing, case/whitespace, edit-conflict cases |
| Nonoverlapping reservations accepted | PASS | Gap between adjacent A1-203 reservations accepted at both ends |
| Different rooms do not falsely conflict | PASS | A1-203 and C2-202 successfully reserved on identical dates |
| Only `you` can modify owned records | PASS | Other-owner details expose no Edit; owned list filtered; Edit and submit owner guards inspected |
| Edit existing and new reservations | PASS | Seed and newly created row updated; unchanged edit preserves ID/count |
| Changes survive refresh | PASS | Reload after create and edit retains saved records |
| Original storage key maintained | PASS | `acl-roomgrid-18rooms-v1`, unchanged array schema |
| Reset restores original seed | PASS | Full record equality with starter, including IDs/owners/purposes; persists after reload |
| Reset clears modified state | PASS | Form, edit, search, filter, detail, week, and view reset; saved changes removed |
| No backend/API introduced | PASS | Source/package diff; browser requests are local assets and existing Google Fonts only |
| No accidental corruption/loss in tested flows | PASS | Failed validation leaves raw stored string unchanged; malformed records/JSON retained; write failure retains draft and prior saved records |
| No new runtime errors | PASS | Chrome Runtime exceptions and console error/warning collection empty in final run |
| Production build | PASS | `npm.cmd run build`, Vite exit 0; no lint/test npm scripts configured |
| Three meaningful UX problems | PASS | Whole-stay uncertainty; generic validation; difficult discovery/editing, explained in UX report |
| Student goal and problem impact | PASS | UX report “Student goal and scenario” and three original problems |
| AI alternatives and trade-offs | PASS — documented | Two options per improvement, advantages, disadvantages, and effort; historical timing of the AI discussion is not established by source files |
| Chosen solutions and explanations | PASS | Approved 1A, 2A, 3A, implementation reasons, three brief justifications |
| Modified React files | PASS | `src/App.jsx`; supporting `src/styles.css` |
| Before/after screenshots | PASS | 15 original before, 13 original after, plus final audit captures; decoded/hash inventory |
| Refined/rejected AI suggestion | PASS — documented | Occupancy dashboard/popularity charts/drag-to-paint rejected with task-specific reasons |
| Successful action demonstration | PASS | Executed create, saved record, visible confirmation, `audit/desktop-success.png`; TA steps in UX report |
| Unsuccessful action demonstration | PASS | Executed overlap rejection, preserved storage, `audit/desktop-overlap-error.png` |
| All three improvement demonstrations | PASS | Search selection, inline error/focus, My bookings/Edit; desktop/mobile captures and executable audit |
| Preserved functionality | PASS | Functional and boundary matrix below; no dependency or backend changes |

## C. UX improvement audit

### 1. Date-range availability

The finder accepts start/end dates, marks whole-stay availability, and offers free rooms that populate the shared form with the exact searched dates. Search, day occupancy, Check, and Confirm share `conflictingBooking()`: `start < existing.endDate && end > existing.startDate`. This solves the misleading inference that an individual Open cell guarantees an entire stay.

Independent expected search results are calculated by expanding requested stays into occupied calendar days, rather than calling the app's overlap helper. Searches for 11–13 November, 18–21 November, 8–22 November, and 1–4 December match this independent oracle. The first returns exactly A1-203, B1-205, B2-104, and C2-202. Results remain correct beyond the visible week and after the week jump. Editing ignores its own row while retaining conflicts with other rows.

Booked cells show reservation purpose, ownership and exclusive-end dates without replacing the draft. Other students' details are read-only. Closing or pressing Escape now returns focus to the originating cell. End dates are explicitly described as the first free morning on the finder, form, details, and booking cards. No remaining failure was observed in tested scenarios.

### 2. Inline validation

Check and Confirm use the same `assess()` result. Missing room/start/end, reversed/equal dates, and overlaps produce the specific original messages. Invalid controls reference `form-error`, expose `aria-invalid`, and receive focus. Date format validation rejects values outside the four-digit YYYY-MM-DD contract before formatting or persistence. Edits to inputs clear stale errors and notices.

Valid submissions confirm the room and first free morning. Failed attempts leave persisted data unchanged. A storage failure now shows a separate accessible error, retains the draft, and cannot report success. This solves the original generic failure message and makes the required corrective action discoverable. Confirm remains enabled, allowing an unsuccessful action to be explained.

### 3. My bookings/Edit

The prominent My bookings view contains only `owner === 'you'` records and explicit Edit buttons. Edit fills the shared form, identifies the reservation, scrolls it into view, and focuses its heading. Cancel drops only the draft, preserves the saved row, and focuses the current view's heading. Refresh during editing drops the unsaved draft and keeps saved reservations, which matches the starter's persistence scope.

Seed and newly created reservations were edited successfully. Unchanged saves exclude their own ID; extensions into another booking are rejected. The mobile navigation remains within 390px, has measured 56px-high targets, and supports pointer and keyboard activation. Arrow keys, Home, and End now implement the ARIA tab pattern. No remaining failure was observed in tested scenarios.

## D. Functional test matrix

Environment: Windows, Node 22.23.1, installed Google Chrome headless via Chrome DevTools Protocol, production preview at `http://127.0.0.1:4175/`. Browser plugin and Playwright were unavailable; no dependencies were installed. Every run used a new temporary Chrome user-data directory. Chrome is closed before profile cleanup. Version metadata and observed requests are in `audit/results.json`.

The test harness is [../scripts/independent-audit.mjs](../scripts/independent-audit.mjs). Form filling uses native DOM setters plus input/change events. Buttons use actual pointer events; keyboard tests use actual key events. Storage mutation is used only for isolated corruption/failure tests. Viewports are actual emulated CSS viewports at **1440×900** and **390×844**, not dimensions inferred from PNGs.

| Executed group | Result | Evidence |
|---|---|---|
| Build | PASS | `npm.cmd run build`, final JS `index-BvSoxOy2.js`, CSS `index-s0wKgYHZ.css` |
| Page identity/nonblank/overlay | PASS | Expected title and heading; no Vite overlay |
| Starter integrity | PASS | Original 40 rows compared directly with Git root; 18 rooms; 8 owned |
| Required fields | PASS | All empty; separately missing room/start/end; specific errors/focus/ARIA; unchanged raw storage |
| Invalid chronology/format | PASS | Equal, reversed, extended years; no saved row |
| Conflict rules | PASS | One-day overlap, fully inside, fully containing, normalized room names |
| Create/purpose/duplicate submit | PASS | Valid create; empty purpose; second submit adds no duplicate |
| Different-room behavior | PASS | Same dates accepted in another free room; occupied other room still correctly rejected |
| Whole-stay search | PASS | Four ranges including multiple weeks, off-grid dates, and all-free December |
| Form population/details | PASS | Exact dates copied; booked day shows useful information and no unauthorized Edit |
| Ownership/edit | PASS | Only owned list; unchanged seed save; new row edit; rejected edit conflict; first/last-day edits |
| Refresh/reset | PASS | New/edited rows retained; unsaved draft dropped; exact reset data retained after reload |
| Accessibility | PASS within tested scope | Error references, focus targets, tab navigation, actual Tab traversal in both views and sizes, rendered contrast check |
| Mobile | PASS | `innerWidth=390`, `innerHeight=844`, document width 390; form/Cancel headings clear sticky header |
| Timezone | PASS | Identical date-only detail text in America/Los_Angeles, Pacific/Kiritimati, Africa/Cairo |
| Storage recovery | PASS | `[null]` and invalid JSON preserved with recovery feedback; simulated quota failure retains saved records/draft |
| Runtime/console | PASS | No final application exceptions, console errors, or warnings |

The final JSON enumerates all **86 passing regression assertions**. A subsequent focused evidence run passed **8/8 checks**, including mobile open-day selection, changing the actual room filter/week, and Reset after actively modifying search/detail/edit state; see `audit/capture-results.json`. `git diff --check` passes. No npm lint/test command exists, so none is represented as executed. Earlier exploratory failures remain in `audit/probe-results.json` as defect evidence; they are not final test results.

## E. Edge cases

| Boundary | Observed outcome |
|---|---|
| Start equals end / end before start | Rejected; end field focused; original records retained |
| Adjacent bookings | A1-203 11–13 Nov accepted between records ending 11 Nov and starting 13 Nov |
| One-day overlap / fully inside / fully containing | Rejected with the overlap message |
| Identical dates in different room | C2-202 accepted alongside A1-203 |
| Edit retaining original dates | Saved without self-conflict or duplicate row |
| Edit first day | B2-104 start moved 9→8 Nov successfully |
| Edit exclusive last boundary | B2-104 end moved 11→13 Nov adjacent to next reservation; 14 Nov rejected |
| Multiple weeks / outside visible week | Full-stay search correct; explanatory note and week jump work |
| Refresh during edit / after save | Unsaved draft discarded; stored reservations retained |
| Repeated submission | First creates once; subsequent empty draft rejected |
| Reset after modifications | Exact original records and browsing/edit state restored |
| Broken stored JSON/rows | Original string retained; preview examples and explicit recovery message displayed |
| Failed storage write | No success message; original stored records and draft remain available |

## F. Accessibility and responsiveness

Actual findings corrected: missing ARIA tab keyboard support; focus loss on detail dismissal; inconsistent outer date-input focus ring; mobile Cancel heading obscured by sticky header; mobile calendar widening the layout to 816px and shrinking the rendered surface.

Actual checks: visible labels and descriptive calendar button names; `aria-invalid` and valid `aria-describedby` references; error alerts and success status; focus on invalid field/Edit/Cancel/detail dismissal; tab arrows/Home/End; native Enter activation; actual Tab traversal through both views at both requested sizes. Each traversal reaches Confirm, with controls in view and focus styling present. Horizontal calendar content stays within its scroll container rather than overflowing the document. Navigation targets measure 56px high in the tested mobile layout.

Computed foreground/background contrast for 282 rendered text elements in the desktop availability DOM meets AA thresholds (4.5:1 normal text, 3:1 large text); details are in `audit/contrast.json`. This check does not include placeholder text, every alternate state, assistive technology announcements, or a full WCAG audit. The desktop form's internal scroll remains keyboard traversable. No invalid hook use or unnecessary runtime package was found.

## G. Screenshots and documentation

All 15 files under `screenshots/before/` and 13 under `screenshots/after/` decode as PNG and match their documented broad interface states. Original dimensions are 1440×900, one 1440×2314 full-page capture, or 390×844. Their hashes and dimensions are in `audit/screenshot-inventory.json`. The before images are consistent with the exact starter source. Historical capture provenance cannot be independently proved from PNG files alone; no images have been fabricated or recreated as historical evidence.

The reported original Chrome cleanup failure is not evidence of missing screenshots: all 15 before files exist. Before files 10/11 have the same hash, consistent with the reported unchanged viewport; they are explicitly identified as duplicates. The two original after mobile availability captures show the layout scaling defect and are superseded, not used to claim mobile success.

These **new final PNGs were captured directly from production Chrome by this audit**:

| Final capture | Demonstration |
|---|---|
| `audit/desktop-stay-search.png` | Whole-stay free/busy results and exclusive-end copy |
| `audit/desktop-overlap-error.png` | Failed overlap, specific inline error, invalid dates |
| `audit/desktop-my-bookings.png` | Dedicated owned-record list and Edit actions |
| `audit/desktop-edit.png` | Explicit editing context in shared form |
| `audit/desktop-success.png` | Successful action and visible saved confirmation |
| `audit/mobile-availability.png` | Correct 390×844 layout and readable navigation |
| `audit/mobile-stay-search.png` | Whole-stay result at actual mobile CSS width |
| `audit/mobile-my-bookings.png` | Owned cards and mobile navigation |
| `audit/mobile-edit.png` | Visible editing form below the sticky header |

`UX_RESCUE_REPORT.md` contains the required student scenario, three usability problems and impacts, AI alternatives/trade-offs, chosen solutions, three justifications, rejected suggestion, screenshot references, and TA demonstration steps. Its historical validation sections are now explicitly distinguished from independent results.

## H. Problems found and fixed

| Priority | Finding and correction | Files |
|---|---|---|
| P0 | Malformed saved arrays crashed rendering; invalid JSON could be overwritten with seed. Validate records, preserve unreadable data, show recovery feedback. Persist before state/success changes so failed writes preserve data and draft. | `src/App.jsx` |
| P1 | Harden exact date contract before lexicographic overlap/formatting; normalize known room names and replace timestamp IDs with UUIDs. Free-text rooms remain supported. | `src/App.jsx` |
| P2 | Old mobile evidence was misleading; add fresh production captures, assertion log, image inventory, and corrected report references. | `docs/`, `scripts/independent-audit.mjs` |
| P3 | Calendar's mobile grid min-content width enlarged the page. Use a zero minimum grid track. Increase mobile heading/form scroll clearance. | `src/styles.css` |
| P3 | Tab roles lacked arrow/Home/End behavior and roving tab stops. Detail dismissal lost focus. Add standard keyboard behavior and source-cell focus restoration. | `src/App.jsx` |
| P3 | Native date segments did not consistently expose the app's outer focus outline. Add `:focus-within` date focus styling. | `src/styles.css` |

Storage-write and strict-date handling are explicit defensive corrections; not every unusual storage/browser state existed in the original seeded UI. The initial independently reproduced defects are recorded in `audit/probe-results.json`. The first broader keyboard attempt also exposed a test-harness false positive: the skip link sits above the header via z-index and should not be classified as hidden solely by vertical coordinates. That assertion was corrected; the product skip link was not altered.

A supplemental mobile pointer attempt initially centered a calendar cell beneath the sticky room-name column. The harness now scrolls the target to the visible edge and checks `elementFromPoint` before clicking. The real open-day interaction then passed; the application did not need an additional change for that harness issue.

## I. Remaining manual checks

No outstanding manual check blocks the README submission. Optional broader coverage: NVDA/VoiceOver announcements, Firefox/Safari, real touch hardware, browser zoom and text scaling. Those were not executed and are not represented as passed. This local-storage demo does not claim cross-tab transaction coordination or backend security, neither of which the assignment requests.

## J. Final modified files

- `src/App.jsx`: original UX rescue plus focused validation, storage, naming/ID, and keyboard/focus corrections.
- `src/styles.css`: original UX rescue plus mobile grid/scroll and date focus corrections.
- `scripts/independent-audit.mjs`: reproducible dependency-free isolated Chrome audit.
- `docs/UX_RESCUE_REPORT.md`: existing submission report, corrected evidence/scope statements.
- `docs/FINAL_INDEPENDENT_AUDIT.md`: this independent report.
- `docs/audit/`: final result JSON, contrast results, screenshot inventory, final production captures, and clearly named exploratory defect evidence.
- Existing `docs/screenshots/before/` and `docs/screenshots/after/`: retained unchanged; already untracked at audit start.

`package.json`, `package-lock.json`, README, `src/main.jsx`, `index.html`, and the dev launcher are unchanged from the starter. No unrelated files were removed.

## K. Final submission verdict

The corrected implementation meets the README brief and the requested three approved UX improvements, with demonstrated successful/unsuccessful actions, preserved booking semantics, original seed/storage compatibility, before/after evidence, and independently executed functional/browser checks. It is ready for TA review. Use the final audit captures for corrected mobile evidence; keep the original screenshots as historical comparisons.

To reproduce: run `npm run build`, then `npm run preview -- --port 4175 --strictPort`, then in another terminal `node scripts/independent-audit.mjs http://127.0.0.1:4175/`. The audit requires the installed Windows Chrome executable named in the script and writes evidence under `docs/audit/`; it uses only its own temporary browser profile.
