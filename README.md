# Campus Life Planner

An accessible, offline-first planner for student tasks and events — track **what** something is, **when** it's due, **how long** it takes, and find it again with regex search. Built with semantic HTML, mobile-first CSS, and modular vanilla JavaScript. No frameworks, no build step, no server: your data lives in your browser's `localStorage`.

**Theme:** Campus Life Planner (Option 2)
**Live demo:** `https://<your-username>.github.io/campus-life-planner/`  ← _replace after deploying_

---

## Features

- **Five sections:** Dashboard/Stats, Records, Add/Edit form, Settings, About.
- **Records** with a unique `id` and `createdAt` / `updatedAt` timestamps.
- **Regex-powered validation** on every field, plus an advanced back-reference rule (see catalog below).
- **Live regex search** across title and tag, with a case-insensitive toggle, a safe compiler (invalid patterns never crash the app), and accessible `<mark>` highlighting.
- **Sorting** by due date, title (A↔Z), and duration (↑↓).
- **Stats dashboard:** total records, total planned time, top tag, and a last-7-days "week ribbon" chart drawn in CSS/JS.
- **Weekly cap / target** with an ARIA live message — *polite* when under, *assertive* when exceeded.
- **Units conversion:** show durations in minutes or hours & minutes (Settings).
- **Inline edit** and **confirm-before-delete** (native accessible `<dialog>`), both updating state, UI, stats, and `updatedAt`.
- **Persistence + JSON import/export** with structural validation before anything loads.
- **Light/dark theme** toggle (persisted).
- **Responsive** mobile-first layout with three breakpoints (~360 / 768 / 1024 px): the records table reflows into cards on small screens and becomes a real table on desktop.

---

## Project structure

```
campus-life-planner/
├── index.html            # semantic markup, all five sections, ARIA live regions
├── tests.html            # in-browser assertion suite
├── seed.json             # 12 sample records (edge cases)
├── styles/
│   └── main.css          # mobile-first, 3 breakpoints, light/dark, reduced-motion
├── scripts/
│   ├── storage.js        # localStorage + import/export validation
│   ├── state.js          # single source of truth: CRUD, sorting, derived stats
│   ├── validators.js     # regex catalog + field validation (pure)
│   ├── search.js         # safe regex compiler + accessible highlighter (pure)
│   ├── ui.js             # all DOM rendering + the ARIA announcer
│   └── app.js            # entry point: wires events to state/ui
└── assets/
    └── favicon.svg
```

---

## How to run locally

Because the app uses **ES modules**, browsers block them over `file://`. Serve the folder over HTTP:

```bash
# from the project root
python3 -m http.server 8000
# then open http://localhost:8000
```

(Any static server works — `npx serve`, the VS Code Live Server extension, etc.)

To load the sample data, open **Settings → Load sample data**.

## How to run the tests

Start the local server as above, then open **`http://localhost:8000/tests.html`**. The page runs assertions against the validators, the regex search/highlighter, and the sorting logic, and prints a pass/fail summary. (You can also run the pure modules under Node.)

---

## Regex catalog

| Field / use | Pattern | Matches | Rejects |
|---|---|---|---|
| Title | `^\S(?:.*\S)?$` (+ a `\s{2,}` double-space check) | `Read chapter 3` | `" Read"`, `"Read "`, `"Read  notes"` |
| Duration | `^(0\|[1-9]\d*)(\.\d{1,2})?$` | `90`, `1.5`, `12.25` | `01`, `1.555`, `-5`, `abc` |
| Due date | `^\d{4}-(0[1-9]\|1[0-2])-(0[1-9]\|[12]\d\|3[01])$` (+ real-calendar check) | `2026-06-15` | `2026-13-01`, `2026-02-30` |
| Tag | `^[A-Za-z]+(?:[ -][A-Za-z]+)*$` | `Study`, `Self-Study`, `Group Work` | `Study1`, `--`, `" Study"` |
| **Advanced — duplicate word** (back-reference) | `\b(\w+)\s+\1\b` | `the the`, `review review` | `lecture notes` |
| Search hint — time token | `\b\d{2}:\d{2}\b` | finds `14:30` in a title | — |

The advanced rule uses a **back-reference** (`\1`) to flag an accidentally repeated word in the title. It's a soft warning, not a hard block.

**Search examples to try:** `(lab|exam)` · `\b\d{2}:\d{2}\b` (titles with a time) · `^Read` · `coffee` with case-insensitive on/off · `(` (shows the safe-compiler error without crashing).

---

## Keyboard map

| Key | Action |
|---|---|
| `Tab` / `Shift+Tab` | Move between all controls in logical order |
| `Enter` (first focus) | Activate the "Skip to content" link |
| `Enter` / `Space` | Activate a focused button or link |
| `Enter` (in the form) | Submit / save the record |
| `Arrow` keys | Move within the sort dropdown and radio groups |
| `Esc` | Close the delete-confirmation dialog |
| Visible focus ring | A 3px outline marks the focused element everywhere |

The whole flow — add, search, sort, edit, delete, import/export — is operable without a mouse.

---

## Accessibility notes

- Semantic landmarks: `header`, `nav`, `main`, `section`, `footer`, with one `h1` and a logical heading hierarchy.
- A **skip-to-content** link is the first focusable element.
- Every input has a bound `<label>`; errors use `aria-describedby` and `aria-invalid`.
- Status and errors are announced through two live regions: `role="status"` `aria-live="polite"` for routine updates, and `role="alert"` `aria-live="assertive"` for the cap-exceeded warning and destructive actions.
- The week-ribbon chart has a `visually-hidden` text alternative.
- Color contrast meets WCAG AA in both light and dark themes; `prefers-reduced-motion` is respected.
- Delete uses a native `<dialog>`, which manages focus trapping and `Esc` for free.

---

## Data model

```json
{
  "id": "evt_0001",
  "title": "Linear algebra problem set",
  "dueDate": "2026-06-15",
  "duration": 90,
  "tag": "Study",
  "createdAt": "2026-06-10T08:00:00.000Z",
  "updatedAt": "2026-06-10T08:00:00.000Z"
}
```

All changes auto-save to `localStorage`. Import validates that the file is a JSON array and that every record has the required keys with sane types before replacing state.

---

## Deploying to GitHub Pages

1. Push this repo to GitHub.
2. **Settings → Pages → Build and deployment → Source: Deploy from a branch**, branch `main`, folder `/ (root)`.
3. Wait for the green check, then put the resulting URL at the top of this README.

---

## Build roadmap (milestones)

This repo was built in the milestone order from the brief: M1 spec & data model → M2 semantic HTML + base CSS → M3 forms & regex validation + tests → M4 render/sort/search → M5 stats + cap → M6 persistence + import/export + settings → M7 polish, a11y pass, README, demo. Commit history reflects that progression.
