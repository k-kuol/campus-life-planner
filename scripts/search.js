// scripts/search.js
// Safe regex search + highlight. No DOM mutation of live nodes here — we return
// strings the UI layer inserts, and we always escape user text first.

/* Compile a user-supplied pattern. Invalid patterns return { re:null, error }. */
export function compileRegex(input, caseInsensitive = true) {
  const trimmed = (input || '').trim();
  if (!trimmed) return { re: null, error: '' };
  const flags = caseInsensitive ? 'gi' : 'g';
  try {
    return { re: new RegExp(trimmed, flags), error: '' };
  } catch (err) {
    return { re: null, error: err.message.replace(/^Invalid regular expression: ?/, '') || 'Invalid pattern.' };
  }
}

/* Escape HTML so injected record text can never become live markup. */
function escapeHTML(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/* Return HTML-safe text with matches wrapped in <mark>. */
export function highlight(text, re) {
  const safe = escapeHTML(text);
  if (!re) return safe;
  // Rebuild a global regex on the escaped string so indices line up.
  const g = new RegExp(re.source, re.flags.includes('g') ? re.flags : re.flags + 'g');
  return safe.replace(g, (m) => (m ? `<mark>${m}</mark>` : m));
}

/* Filter records whose title OR tag matches. Empty pattern -> everything. */
export function filterRecords(records, re) {
  if (!re) return records;
  return records.filter((r) => {
    re.lastIndex = 0;
    const hitTitle = re.test(r.title);
    re.lastIndex = 0;
    const hitTag = re.test(r.tag);
    return hitTitle || hitTag;
  });
}
