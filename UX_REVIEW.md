# UI/UX rescue notes

## User goal

Find an available common room date, reserve a valid range, and later change that reservation. The calendar and form should make the booking rules understandable before submission.

## Issues and changes

1. **The room field looked like free text.** It accepted a room number outside the 18-room directory, leaving users to discover that mismatch only after submitting. The form now identifies the directory and validation rejects room numbers that are not in it. I kept the editable field with its datalist so users can type or select a room.
2. **The end-date rule was hidden.** The stored rule treats the end date as exclusive, which is surprising when the form says only “End date.” The field label and helper text now explain that the end date is the first day the room is no longer in use; the calendar note repeats the rule. This adds a little explanatory text but prevents a one-day range misunderstanding.
3. **Failed submissions gave a generic error.** The form discarded the reason and always displayed “Review the selected dates.” It now shows the specific validation message (missing fields, invalid date order, unknown room, or an overlap) so the student can recover without guessing.

## Alternatives considered with AI

- For room selection, an AI suggestion was to replace the text input with a dropdown. That would guarantee valid choices, but it makes a list of 18 rooms slower to scan and removes quick typing. I kept the familiar type-ahead field and added explicit guidance plus validation.
- For explaining date ranges, an AI suggestion was to add a calendar tooltip. Tooltips can be missed, especially on touch devices. I placed the rule beside the field and in the calendar note instead.
- For validation, an AI suggestion was to show a toast and preserve the generic error. A transient toast can disappear before users read it. I chose the existing inline alert and now pass through the specific reason.

## Evidence and verification

The React changes are in `src/App.jsx` and the related field hint styling is in `src/styles.css`. The local development server started at `http://localhost:5174/`. I could not capture before/after screenshots or demonstrate the booking flow in the browser because the browser automation host was unavailable (`The browser access host is unavailable`). No screenshot files are included; this remains to be completed in a browser-enabled session.
