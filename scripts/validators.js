// scripts/validators.js
// Pure validation — no DOM. Each rule returns a string error or '' (valid).

/* ---- Regex catalog ---------------------------------------------------------
   PATTERNS.title      no leading/trailing space, no collapsible doubles handled
                       separately; this just rejects edge whitespace.
   PATTERNS.duration   non-negative integer or up to 2 decimals.
   PATTERNS.date       strict YYYY-MM-DD with valid month/day ranges.
   PATTERNS.tag        letters, with single spaces or hyphens between words.
   PATTERNS.dupWord    ADVANCED — back-reference \1 catches a repeated word
                       ("the the", "lab lab"). Used as a soft warning.
   PATTERNS.timeToken  finds HH:MM time tokens (used by search hints, docs).
--------------------------------------------------------------------------- */
export const PATTERNS = {
  title:     /^\S(?:.*\S)?$/,
  duration:  /^(0|[1-9]\d*)(\.\d{1,2})?$/,
  date:      /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/,
  tag:       /^[A-Za-z]+(?:[ -][A-Za-z]+)*$/,
  dupWord:   /\b(\w+)\s+\1\b/i,           // advanced: back-reference
  timeToken: /\b\d{2}:\d{2}\b/,
};

/* Collapsible double spaces inside the title, e.g. "Lab  report". */
const DOUBLE_SPACE = /\s{2,}/;

export function validateTitle(value) {
  if (value === '') return 'Title is required.';
  if (!PATTERNS.title.test(value)) return 'Remove leading or trailing spaces.';
  if (DOUBLE_SPACE.test(value)) return 'Collapse the double spaces into one.';
  if (value.length > 120) return 'Keep the title under 120 characters.';
  return '';
}

export function validateDuration(value) {
  if (value === '') return 'Duration is required.';
  if (!PATTERNS.duration.test(value)) return 'Use a number like 45 or 1.5 (max 2 decimals).';
  if (Number(value) === 0) return 'Duration must be greater than zero.';
  return '';
}

export function validateDate(value) {
  if (value === '') return 'Due date is required.';
  if (!PATTERNS.date.test(value)) return 'Use the format YYYY-MM-DD.';
  // Reject impossible calendar dates the regex can't catch (e.g. 2025-02-30).
  const [y, m, d] = value.split('-').map(Number);
  const probe = new Date(Date.UTC(y, m - 1, d));
  if (probe.getUTCMonth() !== m - 1 || probe.getUTCDate() !== d) {
    return 'That date does not exist on the calendar.';
  }
  return '';
}

export function validateTag(value) {
  if (value === '') return 'Tag is required.';
  if (!PATTERNS.tag.test(value)) return 'Letters only, separated by single spaces or hyphens.';
  return '';
}

/* Soft, non-blocking advisory using the back-reference pattern. */
export function duplicateWordWarning(value) {
  const m = PATTERNS.dupWord.exec(value);
  return m ? `Repeated word "${m[1]}" — did you mean that?` : '';
}

/* Validate a whole form payload. Returns { valid, errors, warnings }. */
export function validateRecord({ title, dueDate, duration, tag }) {
  const errors = {
    title: validateTitle(title),
    dueDate: validateDate(dueDate),
    duration: validateDuration(duration),
    tag: validateTag(tag),
  };
  const warnings = { title: duplicateWordWarning(title) };
  const valid = Object.values(errors).every((e) => e === '');
  return { valid, errors, warnings };
}
