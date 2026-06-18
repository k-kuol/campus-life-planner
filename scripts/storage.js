// scripts/storage.js
// Owns everything that touches localStorage + JSON import/export validation.

const DATA_KEY = 'clp:data';
const SETTINGS_KEY = 'clp:settings';

const DEFAULT_SETTINGS = { cap: 0, units: 'minutes', theme: 'light' };

/* ---- Records ---- */
export function loadRecords() {
  try {
    const raw = localStorage.getItem(DATA_KEY);
    const parsed = JSON.parse(raw || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return []; // corrupted storage shouldn't crash the app
  }
}

export function saveRecords(records) {
  try {
    localStorage.setItem(DATA_KEY, JSON.stringify(records));
    return true;
  } catch {
    return false; // e.g. quota exceeded
  }
}

/* ---- Settings ---- */
export function loadSettings() {
  try {
    const parsed = JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}');
    return { ...DEFAULT_SETTINGS, ...parsed };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export function saveSettings(settings) {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    return true;
  } catch {
    return false;
  }
}

/* ---- Import / Export ----
   A record is well-formed if it carries the required keys with the right
   coarse types. We validate BEFORE letting anything into state. */
const REQUIRED = ['id', 'title', 'dueDate', 'duration', 'tag'];

export function validateImport(text) {
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    return { ok: false, error: 'That file is not valid JSON.' };
  }
  if (!Array.isArray(data)) {
    return { ok: false, error: 'Expected a JSON array of records.' };
  }

  const cleaned = [];
  for (let i = 0; i < data.length; i++) {
    const r = data[i];
    if (typeof r !== 'object' || r === null) {
      return { ok: false, error: `Record ${i + 1} is not an object.` };
    }
    for (const key of REQUIRED) {
      if (!(key in r)) {
        return { ok: false, error: `Record ${i + 1} is missing "${key}".` };
      }
    }
    const duration = Number(r.duration);
    if (!Number.isFinite(duration) || duration < 0) {
      return { ok: false, error: `Record ${i + 1} has an invalid duration.` };
    }
    cleaned.push({
      id: String(r.id),
      title: String(r.title),
      dueDate: String(r.dueDate),
      duration,
      tag: String(r.tag),
      createdAt: r.createdAt || new Date().toISOString(),
      updatedAt: r.updatedAt || new Date().toISOString(),
    });
  }
  return { ok: true, records: cleaned };
}

export function exportRecords(records) {
  return JSON.stringify(records, null, 2);
}
