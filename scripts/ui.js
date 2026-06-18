// scripts/ui.js
// The only module that touches the DOM for rendering. Takes data in, paints out.

import { highlight } from './search.js';

const $ = (sel) => document.querySelector(sel);

/* ---- Live-region announcements ---- */
export function announce(message, assertive = false) {
  const node = assertive ? $('#announcer-assertive') : $('#announcer-polite');
  node.textContent = '';            // reset so identical repeats are re-read
  requestAnimationFrame(() => { node.textContent = message; });
}

/* ---- Duration formatting (units conversion: minutes <-> hours) ---- */
export function formatDuration(minutes, units) {
  if (units === 'hours') {
    const h = Math.floor(minutes / 60);
    const m = Math.round(minutes % 60);
    if (h && m) return `${h}h ${m}m`;
    if (h) return `${h}h`;
    return `${m}m`;
  }
  return `${minutes} min`;
}

/* ---- Records table / cards ---- */
export function renderTable(records, re, units, { onEdit, onDelete }) {
  const body = $('#records-body');
  const empty = $('#empty-state');
  body.innerHTML = '';

  if (records.length === 0) {
    empty.hidden = false;
    return;
  }
  empty.hidden = true;

  const frag = document.createDocumentFragment();
  records.forEach((r) => {
    const tr = document.createElement('tr');

    const title = document.createElement('td');
    title.className = 'cell-title';
    title.dataset.label = 'Title';
    title.innerHTML = highlight(r.title, re);

    const date = document.createElement('td');
    date.className = 'cell-date';
    date.dataset.label = 'Due date';
    date.textContent = r.dueDate;

    const dur = document.createElement('td');
    dur.className = 'cell-duration';
    dur.dataset.label = 'Duration';
    dur.textContent = formatDuration(r.duration, units);

    const tag = document.createElement('td');
    tag.className = 'cell-tag';
    tag.dataset.label = 'Tag';
    tag.innerHTML = `<span class="tag-chip">${highlight(r.tag, re)}</span>`;

    const actions = document.createElement('td');
    actions.className = 'cell-actions';
    const editBtn = document.createElement('button');
    editBtn.type = 'button';
    editBtn.className = 'icon-btn edit';
    editBtn.textContent = 'Edit';
    editBtn.setAttribute('aria-label', `Edit ${r.title}`);
    editBtn.addEventListener('click', () => onEdit(r.id));
    const delBtn = document.createElement('button');
    delBtn.type = 'button';
    delBtn.className = 'icon-btn delete';
    delBtn.textContent = 'Delete';
    delBtn.setAttribute('aria-label', `Delete ${r.title}`);
    delBtn.addEventListener('click', () => onDelete(r.id));
    actions.append(editBtn, delBtn);

    tr.append(title, date, dur, tag, actions);
    frag.appendChild(tr);
  });
  body.appendChild(frag);
}

/* ---- Stats dashboard ---- */
export function renderStats(stats, settings) {
  $('#stat-count').textContent = stats.count;
  $('#stat-total').textContent = stats.totalDuration;
  $('#stat-total-unit').textContent = settings.units === 'hours' ? '' : 'min';
  $('#stat-total-hours').textContent = `${formatDuration(stats.totalDuration, 'hours')} total`;

  $('#stat-top-tag').textContent = stats.topTag || '—';
  $('#stat-top-tag-sub').textContent = stats.topTag
    ? `${stats.topCount} record${stats.topCount === 1 ? '' : 's'}`
    : 'no records yet';
}

/* ---- Week ribbon (signature visual) ---- */
export function renderWeekRibbon(days) {
  const ribbon = $('#week-ribbon');
  ribbon.innerHTML = '';
  const max = Math.max(...days.map((d) => d.minutes), 1);

  days.forEach((d) => {
    const col = document.createElement('div');
    col.className = 'ribbon-day';
    const bar = document.createElement('div');
    bar.className = 'ribbon-bar' + (d.minutes === 0 ? ' empty' : '');
    bar.style.height = `${Math.max((d.minutes / max) * 100, d.minutes ? 8 : 4)}%`;
    bar.title = `${d.label}: ${d.minutes} min`;
    const label = document.createElement('span');
    label.className = 'ribbon-label';
    label.textContent = d.label;
    col.append(bar, label);
    ribbon.appendChild(col);
  });

  // Text alternative for screen readers.
  $('#week-ribbon-text').textContent =
    'Minutes per day, last 7 days: ' + days.map((d) => `${d.label} ${d.minutes}`).join(', ') + '.';
}

/* ---- Cap meter + ARIA cap message (polite under, assertive over) ---- */
export function renderCap(stats, settings, { announceChange = false } = {}) {
  const fill = $('#cap-fill');
  const status = $('#cap-status');
  const cap = Number(settings.cap) || 0;
  const used = stats.last7Total;

  if (cap <= 0) {
    fill.style.width = '0%';
    fill.classList.remove('over');
    status.textContent = 'Set a cap in Settings';
    return;
  }

  const pct = Math.min((used / cap) * 100, 100);
  fill.style.width = `${pct}%`;
  const over = used > cap;
  fill.classList.toggle('over', over);

  const msg = over
    ? `Over cap by ${used - cap} min (${used} of ${cap}).`
    : `${cap - used} min remaining (${used} of ${cap}).`;
  status.textContent = msg;

  if (announceChange) announce(`Weekly cap: ${msg}`, over);
}

/* ---- Tag suggestions for the form datalist ---- */
export function renderTagSuggestions(records) {
  const list = $('#tag-suggestions');
  const tags = [...new Set(records.map((r) => r.tag))].sort();
  list.innerHTML = tags.map((t) => `<option value="${t}"></option>`).join('');
}

/* ---- Form helpers ---- */
export function fillForm(rec) {
  $('#field-id').value = rec.id;
  $('#field-title').value = rec.title;
  $('#field-dueDate').value = rec.dueDate;
  $('#field-duration').value = rec.duration;
  $('#field-tag').value = rec.tag;
  $('#submit-btn').textContent = 'Save changes';
  $('#edit-indicator').hidden = false;
}

export function clearForm() {
  $('#record-form').reset();
  $('#field-id').value = '';
  $('#submit-btn').textContent = 'Add task';
  $('#edit-indicator').hidden = true;
  ['title', 'dueDate', 'duration', 'tag'].forEach((f) => showFieldError(f, ''));
}

export function showFieldError(field, message) {
  const input = document.getElementById(`field-${field}`);
  const errEl = document.getElementById(`err-${field}`);
  if (errEl) errEl.textContent = message;
  if (input) {
    if (message) input.setAttribute('aria-invalid', 'true');
    else input.removeAttribute('aria-invalid');
  }
}

export function showErrors(errors, warnings = {}) {
  Object.entries(errors).forEach(([f, msg]) => {
    // Show the hard error if present, otherwise a soft warning if any.
    showFieldError(f, msg || warnings[f] || '');
  });
}
