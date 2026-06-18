// scripts/app.js
// Entry point. Wires the DOM to state, validation, search, and UI rendering.

import * as state from './state.js';
import { validateRecord } from './validators.js';
import { compileRegex, filterRecords } from './search.js';
import { validateImport, exportRecords } from './storage.js';
import * as ui from './ui.js';

const $ = (sel) => document.querySelector(sel);

/* ---------- central render ---------- */
function render({ announceCap = false } = {}) {
  const settings = state.getSettings();

  // search + sort pipeline
  const { re, error } = compileRegex($('#search-input').value, $('#search-flag-i').checked);
  $('#search-error').textContent = error ? `Invalid pattern: ${error}` : '';
  $('#search-input').setAttribute('aria-invalid', error ? 'true' : 'false');

  const [key, dir] = $('#sort-select').value.split('-');
  const visible = state.sortRecords(filterRecords(state.getRecords(), re), key, dir);

  ui.renderTable(visible, re, settings.units, { onEdit: startEdit, onDelete: askDelete });

  const stats = state.getStats();
  ui.renderStats(stats, settings);
  ui.renderWeekRibbon(stats.days);
  ui.renderCap(stats, settings, { announceChange: announceCap });
  ui.renderTagSuggestions(state.getRecords());
}

/* ---------- form ---------- */
function readForm() {
  return {
    id: $('#field-id').value,
    title: $('#field-title').value,
    dueDate: $('#field-dueDate').value,
    duration: $('#field-duration').value,
    tag: $('#field-tag').value,
  };
}

function handleSubmit(e) {
  e.preventDefault();
  const data = readForm();
  const { valid, errors, warnings } = validateRecord(data);
  ui.showErrors(errors, warnings);

  if (!valid) {
    ui.announce('Please fix the highlighted fields.', true);
    const firstBad = ['title', 'dueDate', 'duration', 'tag'].find((f) => errors[f]);
    if (firstBad) document.getElementById(`field-${firstBad}`).focus();
    return;
  }

  if (data.id) {
    state.updateRecord(data.id, data);
    ui.announce(`Updated "${data.title.trim()}".`);
  } else {
    state.addRecord(data);
    ui.announce(`Added "${data.title.trim()}".`);
  }
  ui.clearForm();
  $('#field-title').focus();
}

function startEdit(id) {
  const rec = state.getById(id);
  if (!rec) return;
  ui.fillForm(rec);
  ui.announce(`Editing "${rec.title}".`);
  $('#field-title').focus();
  $('#form').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/* live, non-blocking field validation on blur */
function wireLiveValidation() {
  ['title', 'dueDate', 'duration', 'tag'].forEach((f) => {
    document.getElementById(`field-${f}`).addEventListener('blur', () => {
      const { errors, warnings } = validateRecord(readForm());
      ui.showFieldError(f, errors[f] || warnings[f] || '');
    });
  });
}

/* ---------- delete (accessible dialog) ---------- */
let pendingDeleteId = null;
let pendingClearAll = false;
function askDelete(id) {
  const rec = state.getById(id);
  if (!rec) return;
  pendingDeleteId = id;
  $('#confirm-body').textContent = `"${rec.title}" will be removed. This can't be undone.`;
  $('#confirm-dialog').showModal();
}

function wireDeleteDialog() {
  const dialog = $('#confirm-dialog');
  dialog.addEventListener('close', () => {
    if (dialog.returnValue === 'confirm') {
      if (pendingClearAll) {
        state.clearAll();
        $('#data-status').textContent = 'All records deleted.';
        ui.announce('All records deleted.', true);
      } else if (pendingDeleteId) {
        const rec = state.getById(pendingDeleteId);
        state.deleteRecord(pendingDeleteId);
        ui.announce(`Deleted "${rec ? rec.title : 'record'}".`, true);
      }
    }
    pendingDeleteId = null;
    pendingClearAll = false;
  });
}

/* ---------- settings: cap, units, theme, data ---------- */
function wireSettings() {
  // cap
  $('#cap-input').value = state.getSettings().cap || '';
  $('#save-cap').addEventListener('click', () => {
    const raw = $('#cap-input').value.trim();
    if (raw !== '' && !/^\d+$/.test(raw)) {
      $('#data-status').textContent = 'Cap must be a whole number of minutes.';
      return;
    }
    state.updateSettings({ cap: Number(raw) || 0 });
    $('#data-status').textContent = 'Weekly cap saved.';
    render({ announceCap: true });
  });

  // units
  document.querySelectorAll('input[name="units"]').forEach((radio) => {
    radio.checked = radio.value === state.getSettings().units;
    radio.addEventListener('change', () => {
      if (radio.checked) { state.updateSettings({ units: radio.value }); render(); }
    });
  });

  // delete all
  $('#clear-btn').addEventListener('click', () => {
    if (state.getRecords().length === 0) { $('#data-status').textContent = 'Nothing to delete.'; return; }
    pendingClearAll = true;
    $('#confirm-body').textContent = 'All records will be permanently deleted. This can\'t be undone.';
    $('#confirm-dialog').showModal();
  });

  // export
  $('#export-btn').addEventListener('click', () => {
    const blob = new Blob([exportRecords(state.getRecords())], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `campus-planner-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    ui.announce('Exported your data as JSON.');
  });

  // import
  $('#import-btn').addEventListener('click', () => $('#import-file').click());
  $('#import-file').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const text = await file.text();
    const result = validateImport(text);
    if (!result.ok) {
      $('#data-status').textContent = `Import failed: ${result.error}`;
      ui.announce(`Import failed. ${result.error}`, true);
    } else {
      state.replaceAll(result.records);
      $('#data-status').textContent = `Imported ${result.records.length} records.`;
      ui.announce(`Imported ${result.records.length} records.`);
    }
    e.target.value = '';
  });


}

function wireTheme() {
  const btn = $('#theme-toggle');
  const apply = (theme) => {
    document.documentElement.dataset.theme = theme;
    btn.setAttribute('aria-pressed', theme === 'dark' ? 'true' : 'false');
  };
  apply(state.getSettings().theme || 'light');
  btn.addEventListener('click', () => {
    const next = (document.documentElement.dataset.theme === 'dark') ? 'light' : 'dark';
    state.updateSettings({ theme: next });
    apply(next);
  });
}

/* ---------- init ---------- */
function init() {
  $('#record-form').addEventListener('submit', handleSubmit);
  $('#reset-btn').addEventListener('click', () => { ui.clearForm(); ui.announce('Form cleared.'); });
  $('#search-input').addEventListener('input', () => render());
  $('#search-flag-i').addEventListener('change', () => render());
  $('#sort-select').addEventListener('change', () => render());

  wireLiveValidation();
  wireDeleteDialog();
  wireSettings();
  wireTheme();

  state.subscribe(() => render());
  render();
}

document.addEventListener('DOMContentLoaded', init);
