// scripts/state.js
// Single source of truth. Mutations go through here, then persist + notify.

import { loadRecords, saveRecords, loadSettings, saveSettings } from './storage.js';

let records = loadRecords();
let settings = loadSettings();
let seq = computeSeq();
const listeners = new Set();

function computeSeq() {
  // Continue the evt_#### counter past whatever is already stored.
  return records.reduce((max, r) => {
    const n = parseInt(String(r.id).replace(/\D/g, ''), 10);
    return Number.isFinite(n) ? Math.max(max, n) : max;
  }, 0);
}

function notify() {
  saveRecords(records);
  listeners.forEach((fn) => fn());
}

export function subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); }

/* ---- Reads ---- */
export function getRecords() { return records.slice(); }
export function getById(id) { return records.find((r) => r.id === id) || null; }
export function getSettings() { return { ...settings }; }

/* ---- Writes ---- */
export function addRecord({ title, dueDate, duration, tag }) {
  const now = new Date().toISOString();
  seq += 1;
  const rec = {
    id: `evt_${String(seq).padStart(4, '0')}`,
    title: title.trim(),
    dueDate,
    duration: Number(duration),
    tag: tag.trim(),
    createdAt: now,
    updatedAt: now,
  };
  records.push(rec);
  notify();
  return rec;
}

export function updateRecord(id, { title, dueDate, duration, tag }) {
  const rec = getById(id);
  if (!rec) return null;
  rec.title = title.trim();
  rec.dueDate = dueDate;
  rec.duration = Number(duration);
  rec.tag = tag.trim();
  rec.updatedAt = new Date().toISOString();
  notify();
  return rec;
}

export function deleteRecord(id) {
  const before = records.length;
  records = records.filter((r) => r.id !== id);
  if (records.length !== before) notify();
}

export function replaceAll(newRecords) {
  records = newRecords;
  seq = computeSeq();
  notify();
}

export function clearAll() { records = []; seq = 0; notify(); }

export function updateSettings(patch) {
  settings = { ...settings, ...patch };
  saveSettings(settings);
  listeners.forEach((fn) => fn());
}

/* ---- Sorting ---- */
export function sortRecords(list, key, dir) {
  const sign = dir === 'desc' ? -1 : 1;
  return list.slice().sort((a, b) => {
    let cmp;
    if (key === 'duration') cmp = a.duration - b.duration;
    else cmp = String(a[key]).localeCompare(String(b[key]), undefined, { numeric: true });
    return cmp * sign;
  });
}

/* ---- Derived stats ---- */
export function getStats() {
  const count = records.length;
  const totalDuration = records.reduce((s, r) => s + r.duration, 0);

  const byTag = {};
  records.forEach((r) => { byTag[r.tag] = (byTag[r.tag] || 0) + 1; });
  let topTag = null, topCount = 0;
  Object.entries(byTag).forEach(([t, c]) => { if (c > topCount) { topTag = t; topCount = c; } });

  // Last 7 days (today back 6), keyed by YYYY-MM-DD.
  const days = [];
  const today = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    const minutes = records
      .filter((r) => r.dueDate === key)
      .reduce((s, r) => s + r.duration, 0);
    days.push({ key, label: d.toLocaleDateString(undefined, { weekday: 'short' }).slice(0, 2), minutes });
  }
  const last7Total = days.reduce((s, d) => s + d.minutes, 0);

  return { count, totalDuration, topTag, topCount, days, last7Total };
}
