/* CHASS Accelerator workbooks. One script for every unit page. The page sets SCRIPT_URL, KEY, MODULE,
   UNIT, OUTCOMES, and EXAMPLE before loading this file. Submissions and saved drafts go to the CWSP
   Apps Script, the same pipeline as WOLF and C2TC (see apps-script/ACCELERATOR_PATCH.md). */

const PAGE = location.pathname.split('/').pop() || 'index.html';
const RETURN_URL = location.origin + location.pathname;

function fields() { return Array.prototype.slice.call(document.querySelectorAll('main textarea[id], main input[id], main select[id]')); }
function workFields() { return fields().filter(el => el.id !== 'p-name' && el.id !== 'p-email'); }
function get(k) { try { const v = localStorage.getItem(k); return v === null ? null : v; } catch (e) { return null; } }
function set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
function val(id) { const el = document.getElementById(id); return el ? (el.type === 'checkbox' ? el.checked : (el.value || '').trim()) : ''; }
function esc(t) { return String(t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }

function save() {
  fields().forEach(el => set(KEY + el.id, el.type === 'checkbox' ? String(el.checked) : el.value));
  updateProgress(); mirrorActs(); markStates();
}
function load() {
  fields().forEach(el => {
    const v = get(KEY + el.id);
    if (v === null) return;
    if (el.type === 'checkbox') el.checked = v === 'true'; else el.value = v;
  });
  const f = document.getElementById('prog-filter'); if (f) { f.value = get(KEY + 'filter') || ''; filterPrograms(); }
  updateProgress(); mirrorActs(); markStates();
}

/* Closed outcome cards show their state on the summary line, so the group sees what is left. */
function markStates() {
  OUTCOMES.forEach((_, i) => {
    const k = i + 1, o = document.getElementById('o' + k + '-state'), d = document.getElementById('d' + k + '-state');
    if (o) { const n = ['site', 'who', 'act', 'model'].filter(f => String(val('m' + k + '-' + f)).length > 15).length; o.textContent = n === 4 ? 'Mapped' : n ? n + ' of 4' : ''; o.className = 'o-state' + (n === 4 ? ' done' : ''); }
    if (d) { const dec = val('d' + k + '-decision'), r = String(val('d' + k + '-reason')).length > 15; d.textContent = dec ? dec + (r ? '' : ', reason needed') : ''; d.className = 'o-state' + (dec && r ? ' done' : ''); }
  });
}
/* One program at a time, for working groups that divide the outcomes. */
function filterPrograms() {
  const f = document.getElementById('prog-filter'); if (!f) return;
  set(KEY + 'filter', f.value);
  document.querySelectorAll('main [data-program]').forEach(el => { el.hidden = !!f.value && el.dataset.program !== f.value; });
}

/* Progress counts the map and the decisions: four map boxes and two decision fields per outcome. */
function progressIds() {
  const ids = [];
  OUTCOMES.forEach((_, i) => { const k = i + 1; ids.push('m' + k + '-site', 'm' + k + '-who', 'm' + k + '-act', 'm' + k + '-model', 'd' + k + '-decision', 'd' + k + '-reason'); });
  return ids;
}
function updateProgress() {
  const ids = progressIds();
  const done = ids.filter(id => { const v = val(id); return id.indexOf('decision') > -1 ? !!v : String(v).length > 15; }).length;
  const pct = ids.length ? Math.round(done / ids.length * 100) : 0;
  document.getElementById('progress-fill').style.width = pct + '%';
  document.getElementById('progress-label').textContent = pct + '%';
}

/* The act written in Part 3 appears above the decision in Part 5, so the Lab decides on the act. */
function mirrorActs() {
  OUTCOMES.forEach((_, i) => {
    const k = i + 1, m = document.getElementById('d' + k + '-act-mirror');
    if (!m) return;
    const act = val('m' + k + '-act');
    m.textContent = act ? 'The act: ' + act : 'The act for this outcome is not yet mapped in Part 3.';
  });
}

function copyExample(k) {
  const card = document.getElementById('o' + k); if (card && card.tagName === 'DETAILS') card.open = true;
  const map = { site: 'm' + k + '-site', who: 'm' + k + '-who', act: 'm' + k + '-act', model: 'm' + k + '-model' };
  let n = 0;
  Object.keys(map).forEach(f => { const el = document.getElementById(map[f]); if (el && !el.value.trim()) { el.value = EXAMPLE[f]; n++; } });
  save();
  toast(n ? 'The example fills ' + n + ' empty box' + (n > 1 ? 'es' : '') + ' for outcome ' + k + '. Rewrite each one for this outcome.' : 'Every box for outcome ' + k + ' already has text, so nothing changed.');
}
function insertFrame(id) {
  const el = document.getElementById(id);
  if (el.value.trim()) { el.value = el.value.replace(/\s+$/, '') + '\n\n' + el.dataset.frame; } else { el.value = el.dataset.frame; }
  save(); el.focus();
}

/* Worksheet rows, in the column order of the unit's Google Sheet. */
const HEADERS = ['Outcome as filed', 'Where students show it', 'Who assesses it', 'The act', 'What a model now does to this act', 'Decision', 'Reason', 'Product', 'Owner and date'];
function rows() {
  return OUTCOMES.map((t, i) => { const k = i + 1; return [t, val('m' + k + '-site'), val('m' + k + '-who'), val('m' + k + '-act'), val('m' + k + '-model'), val('d' + k + '-decision'), val('d' + k + '-reason'), val('d' + k + '-product'), val('d' + k + '-owner')]; });
}
function renderRows() {
  const h = '<table><caption>Worksheet rows, ' + esc(UNIT) + '</caption><thead><tr>' + HEADERS.map(x => '<th scope="col">' + esc(x) + '</th>').join('') + '</tr></thead><tbody>' +
    rows().map(r => '<tr>' + r.map(c => '<td>' + (c ? esc(c) : '<span class="empty">Not yet</span>') + '</td>').join('') + '</tr>').join('') + '</tbody></table>';
  document.getElementById('rows-table').innerHTML = h;
}
function downloadRows() {
  const q = c => '"' + String(c).replace(/"/g, '""') + '"';
  const csv = [HEADERS].concat(rows()).map(r => r.map(q).join(',')).join('\r\n');
  const blob = new Blob(['﻿' + csv], { type: 'text/csv' });
  dl(blob, 'Accelerator worksheet rows - ' + UNIT + '.csv');
}
function dl(blob, name) {
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name.replace(/[^\w\s.,-]/g, '');
  document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
}

/* Labels and sections travel with the answers, so CWSP's copy reads as a document. */
function sectionOf(el) {
  const h2s = [...document.querySelectorAll('main h2')];
  const h2 = h2s.reverse().find(x => x.compareDocumentPosition(el) & Node.DOCUMENT_POSITION_FOLLOWING);
  const h3holder = el.closest('section, .level, .product');
  const h3 = h3holder && h3holder.querySelector('h3');
  const t = h2 ? (h2.lastChild.textContent || h2.textContent).trim() : 'Start';
  return t + (h3 ? ': ' + h3.textContent.trim() : '');
}
function labelOf(el) { const l = document.querySelector('label[for="' + el.id + '"]'); return l ? l.textContent.replace(/\*$/, '').trim() : el.id; }
function describe(data) {
  const labels = {}, sections = {};
  workFields().forEach(el => { labels[el.id] = labelOf(el); sections[el.id] = sectionOf(el); });
  data.workbook_title = 'CHASS Accelerator Workbook, ' + UNIT;
  data.field_labels = labels; data.field_sections = sections;
  data.return_url = RETURN_URL;
  data.permission_cwsp_use = val('p-permission') === true;
  return data;
}
function identity() {
  const name = val('p-name'), email = val('p-email');
  if (!name || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    const t = document.getElementById(!name ? 'p-name' : 'p-email');
    t.scrollIntoView({ behavior: 'smooth', block: 'center' }); t.focus({ preventScroll: true });
    toast('Enter your name and NC State email under "Who you are" first.');
    return null;
  }
  return { name, email };
}
function answers() { const f = {}; workFields().forEach(el => { f[el.id] = el.type === 'checkbox' ? el.checked : el.value; }); return f; }
function setStatus(text, busy) { document.getElementById('save-status').textContent = text; document.getElementById('save-btn').disabled = !!busy; }

function saveDraft() {
  const who = identity(); if (!who) { setStatus('Enter your name and email under "Who you are", then save again.'); return; }
  const data = describe({ action: 'save_draft', module: MODULE, page: PAGE, certificate_name: who.name, certificate_email: who.email, timestamp: new Date().toISOString(), fields: answers() });
  setStatus('Saving…', true);
  fetch(SCRIPT_URL, { method: 'POST', mode: 'no-cors', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
    .then(() => setStatus('Saved at ' + new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) + '. A link to continue is on its way to ' + who.email + '. Anyone holding the link sees the draft.'))
    .catch(() => setStatus('Saving failed. Your work is still in this browser. Try again, or email kkcole2@ncsu.edu.'));
}
function submitWork() {
  const note = document.getElementById('req-note'), st = document.getElementById('submit-status'), btn = document.getElementById('submit-btn');
  const who = identity(); if (!who) { note.textContent = 'Enter your name and NC State email under "Who you are" first.'; return; }
  const mapped = OUTCOMES.some((_, i) => val('m' + (i + 1) + '-act').length > 15);
  if (!mapped) { note.textContent = 'Map at least one outcome in Part 3 before submitting.'; toast(note.textContent); const c = document.getElementById('o1'); if (c && c.tagName === 'DETAILS') c.open = true; document.getElementById('m1-act').focus(); return; }
  note.textContent = '';
  const data = describe({ certificate_name: who.name, certificate_email: who.email, module: MODULE, page: PAGE, timestamp: new Date().toISOString(), program: 'CHASS Accelerator', unit: UNIT });
  Object.assign(data, answers());
  data.worksheet_rows = [HEADERS].concat(rows());
  btn.disabled = true; btn.textContent = 'Submitting…'; st.textContent = '';
  fetch(SCRIPT_URL, { method: 'POST', mode: 'no-cors', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
    .then(() => { st.textContent = 'Sent to CWSP. A copy is on its way to ' + who.email + '. Your work also stays in this browser.'; btn.textContent = 'Submitted'; set(KEY + 'submitted', new Date().toISOString()); })
    .catch(() => { st.textContent = 'Submission failed. Try again, or email kkcole2@ncsu.edu.'; btn.disabled = false; btn.textContent = 'Submit to CWSP'; });
}

function banner(text, button) {
  const b = document.createElement('div'); b.className = 'resume-banner'; b.setAttribute('role', 'status'); b.textContent = text;
  if (button) { const x = document.createElement('button'); x.type = 'button'; x.textContent = button.label; x.addEventListener('click', button.onclick); b.appendChild(x); }
  const slot = document.getElementById('banner-slot'); slot.innerHTML = ''; slot.appendChild(b); return b;
}
function restoreFromLink() {
  const key = new URLSearchParams(location.search).get('resume');
  if (!key || !/^[a-f0-9]{32}$/.test(key)) return;
  fetch(SCRIPT_URL + '?resume=' + key).then(r => r.json()).then(d => {
    if (!d || d.status !== 'ok') { banner('This link has no saved work attached. Email kkcole2@ncsu.edu if you expected some.'); return; }
    const saved = new Date(d.savedAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });
    const apply = () => {
      Object.keys(d.fields || {}).forEach(id => { const el = document.getElementById(id); if (!el) return; if (el.type === 'checkbox') el.checked = !!d.fields[id]; else el.value = d.fields[id]; });
      if (d.name && !val('p-name')) document.getElementById('p-name').value = d.name;
      save(); set(KEY + 'restored-' + key, d.savedAt);
    };
    if (get(KEY + 'restored-' + key) === d.savedAt) {
      const b = banner('The work saved ' + saved + ' is already in this browser. ', { label: 'Load it again', onclick: () => { apply(); b.textContent = 'The work saved ' + saved + ' is restored.'; } });
      return;
    }
    apply(); banner('The work saved ' + saved + ' is restored. Pick up where you left off.');
  }).catch(() => banner('The saved work did not load. Refresh the page to try again.'));
}

/* A Word-compatible file of every answer, labeled, built in the browser. */
function downloadAnswers() {
  const when = new Date().toLocaleDateString([], { year: 'numeric', month: 'long', day: 'numeric' });
  let h = '<h1>CHASS Accelerator Workbook: ' + esc(UNIT) + '</h1><p><i>' + esc(val('p-name')) + ' · ' + when + '</i></p>';
  let current = '';
  workFields().forEach(el => {
    const v = el.type === 'checkbox' ? (el.checked ? 'Yes' : '') : (el.value || '').trim();
    if (!v || (el.dataset.default && v === el.dataset.default.trim() && el.id !== 'p-unit')) return;
    const sec = sectionOf(el);
    if (sec !== current) { current = sec; h += '<h2>' + esc(sec) + '</h2>'; }
    h += '<h3>' + esc(labelOf(el)) + '</h3><p>' + esc(v).replace(/\n/g, '<br>') + '</p>';
  });
  h += '<h2>Worksheet rows</h2><table border="1" cellpadding="4" style="border-collapse:collapse"><tr>' + HEADERS.map(x => '<th>' + esc(x) + '</th>').join('') + '</tr>' + rows().map(r => '<tr>' + r.map(c => '<td>' + esc(c) + '</td>').join('') + '</tr>').join('') + '</table>';
  const doc = '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word"><head><meta charset="utf-8"><title>CHASS Accelerator Workbook</title><style>body{font-family:Arial,Helvetica,sans-serif;font-size:11pt;line-height:1.45;color:#000}h1{font-size:18pt}h2{font-size:13pt;margin-top:16pt}h3{font-size:11pt;margin:10pt 0 2pt}td,th{font-size:9pt;vertical-align:top}</style></head><body>' + h + '</body></html>';
  dl(new Blob(['﻿', doc], { type: 'application/msword' }), 'Accelerator Workbook - ' + UNIT + '.doc');
}

function toast(text) {
  let t = document.querySelector('.toast');
  if (!t) {
    t = document.createElement('div'); t.className = 'toast'; t.setAttribute('role', 'alert');
    t.innerHTML = '<span></span><button type="button" aria-label="Close message">×</button>';
    t.querySelector('button').addEventListener('click', () => { t.hidden = true; });
    document.body.appendChild(t);
  }
  t.querySelector('span').textContent = text; t.hidden = false;
  clearTimeout(t._h); t._h = setTimeout(() => { t.hidden = true; }, 8000);
}
function clearWork() {
  if (!confirm('Remove your answers, name, and email from this browser? Work you have submitted or saved by email stays with CWSP.')) return;
  try { Object.keys(localStorage).filter(k => k.indexOf(KEY) === 0).forEach(k => localStorage.removeItem(k)); } catch (e) {}
  fields().forEach(el => { if (el.type === 'checkbox') el.checked = false; else el.value = el.dataset.default || ''; });
  updateProgress(); mirrorActs(); setStatus('Cleared from this browser.');
}

function updateSidebar() {
  const links = document.querySelectorAll('.wb-sidebar nav a'); let current = '';
  links.forEach(a => { const s = document.getElementById(a.getAttribute('href').slice(1)); if (s && window.scrollY >= s.getBoundingClientRect().top + window.scrollY - 120) current = s.id; });
  links.forEach(a => a.classList.toggle('active', a.getAttribute('href') === '#' + current));
}
window.addEventListener('scroll', updateSidebar, { passive: true });
window.addEventListener('beforeprint', () => {
  renderRows();
  document.querySelectorAll('details').forEach(d => { d.dataset.wasOpen = d.open ? '1' : ''; d.open = true; });
  document.querySelectorAll('textarea').forEach(t => { t.dataset.h = t.style.height; t.style.height = 'auto'; t.style.height = (t.scrollHeight + 4) + 'px'; });
});
window.addEventListener('afterprint', () => {
  document.querySelectorAll('details').forEach(d => { d.open = d.dataset.wasOpen === '1'; });
  document.querySelectorAll('textarea').forEach(t => { t.style.height = t.dataset.h || ''; });
});
document.addEventListener('DOMContentLoaded', () => {
  fields().forEach(el => { el.addEventListener('input', save); el.addEventListener('change', save); });
  load(); restoreFromLink(); updateSidebar(); renderRows();
});
