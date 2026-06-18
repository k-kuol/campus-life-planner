# Campus Life Planner

An offline-first planner for student tasks and events. Track what needs doing, when it's due, and how long it'll take — all saved in your browser, nothing to sign up for.

**Theme:** Campus Life Planner (Option 2)  
**Live demo:** https://k-kuol.github.io/campus-life-planner/  
**Demo video:** https://youtu.be/your-video-id

---

## What it does

- Five sections: Dashboard, Records, Add/Edit form, Settings, About
- Add tasks with a title, due date, duration, and tag
- Live regex search with case-insensitive toggle and `<mark>` highlighting
- Sort by due date, title, or duration
- Stats dashboard: total records, planned time, top tag, last-7-days chart
- Weekly time cap with live warnings when you go over
- Show durations in minutes or hours & minutes
- Edit and delete records (with confirmation dialog)
- Light/dark theme toggle
- Saves everything to `localStorage` — works offline
- Import/export as JSON, load sample data from Settings

---

## Project structure

```
campus-life-planner/
├── index.html
├── tests.html
├── seed.json
├── styles/
│   └── main.css
├── scripts/
│   ├── storage.js
│   ├── state.js
│   ├── validators.js
│   ├── search.js
│   ├── ui.js
│   └── app.js
└── assets/
    └── favicon.svg
```

---

## Running locally

The app uses ES modules so you need a local server:

```bash
python3 -m http.server 8000
# open http://localhost:8000
```

## Running the tests

Start the server then open `http://localhost:8000/tests.html`. It runs assertions on validators, search, and sorting and shows a pass/fail summary.

---

## Regex catalog

| Field | Pattern | Matches | Rejects |
|---|---|---|---|
| Title | `^\S(?:.*\S)?$` + double-space check | `Read chapter 3` | `" Read"`, `"Read  notes"` |
| Duration | `^(0\|[1-9]\d*)(\.\d{1,2})?$` | `90`, `1.5` | `01`, `1.555`, `-5` |
| Due date | `^\d{4}-(0[1-9]\|1[0-2])-(0[1-9]\|[12]\d\|3[01])$` + calendar check | `2026-06-15` | `2026-13-01`, `2026-02-30` |
| Tag | `^[A-Za-z]+(?:[ -][A-Za-z]+)*$` | `Study`, `Self-Study` | `Study1`, `--` |
| **Duplicate word** (back-reference) | `\b(\w+)\s+\1\b` | `the the` | `lecture notes` |
| Time token (search) | `\b\d{2}:\d{2}\b` | finds `14:30` in a title | — |

The duplicate word rule is a soft warning, not a hard block.

**Search examples:** `(Meeting|Study)` · `\b\d{2}:\d{2}\b` · `^Read` · `(` (triggers the safe-compiler error)

---

## Keyboard map

| Key | Action |
|---|---|
| `Tab` / `Shift+Tab` | Move between controls |
| `Enter` (first focus) | Activate skip-to-content link |
| `Enter` / `Space` | Activate a button or link |
| `Enter` (in form) | Submit the record |
| `Arrow` keys | Navigate dropdowns and radio groups |
| `Esc` | Close the delete dialog |

---

## Accessibility notes

- Semantic landmarks and a single `h1` with logical heading hierarchy
- Skip-to-content link as the first focusable element
- Every input has a bound label; errors use `aria-describedby` and `aria-invalid`
- Two ARIA live regions: polite for routine updates, assertive for cap warnings and deletions
- Week ribbon chart has a visually-hidden text alternative
- Visible 3px focus ring on all interactive elements
- Color contrast meets WCAG AA in both themes
- `prefers-reduced-motion` respected

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

---

## Deploying to GitHub Pages

1. Push the repo to GitHub
2. Go to **Settings → Pages → Deploy from a branch**, pick `main` and `/ (root)`
3. Wait for the green check and update the live demo link at the top of this file

---

## Contact

- **GitHub:** https://github.com/k-kuol
- **Email:** k.kuol@alustudent.com
