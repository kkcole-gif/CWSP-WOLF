/* C²TC participant identity for module and elective submissions.
   Adds name and NC State email fields above each submit button,
   remembers them in this browser, and attaches them to every payload. */
(function () {
  var KEY_NAME = 'c2tc-participant-name';
  var KEY_EMAIL = 'c2tc-participant-email';
  var SCRIPT = 'https://script.google.com/macros/s/AKfycbxNTj5zUq93DTE6M8zV73jibkZ4-rnYqhK5uHd8lNby9M62XzuXvttBMZTSAYTQWqTE/exec';

  function get(k) { try { return localStorage.getItem(k) || ''; } catch (e) { return ''; } }
  function set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }

  function buildFields() {
    var wrap = document.createElement('div');
    wrap.className = 'participant-fields';
    wrap.innerHTML =
      '<p class="participant-note">CWSP records your progress by name and email. These fields are remembered in this browser for later modules.</p>' +
      '<label for="p-name">Your name</label>' +
      '<input type="text" id="p-name" class="p-identity" autocomplete="name">' +
      '<label for="p-email">Your NC State email</label>' +
      '<input type="email" id="p-email" class="p-identity" autocomplete="email" placeholder="unityid@ncsu.edu">' +
      '<p class="participant-error" role="alert" hidden>Enter your name and NC State email before submitting.</p>';
    return wrap;
  }

  function addStyles() {
    var css = '.participant-fields{display:grid;gap:.35rem;max-width:28rem;margin:0 0 1rem}' +
      '.participant-fields label{font-size:.85rem;font-weight:600}' +
      '.participant-fields input{font:inherit;padding:.5rem .6rem;border:1px solid #bbb;border-radius:3px}' +
      '.participant-note{font-size:.85rem;margin:0 0 .25rem}' +
      '.participant-error{color:#990000;font-size:.85rem;margin:.25rem 0 0}' +
      '.resume-row{display:flex;flex-wrap:wrap;align-items:center;gap:.75rem;margin:0 0 1rem}' +
      '.btn-resume{font:inherit;font-size:.85rem;padding:.5rem .9rem;border:1px solid #888;border-radius:3px;background:#fff;color:#222;cursor:pointer}' +
      '.btn-resume:hover{border-color:#222}' +
      '.resume-status{font-size:.85rem;margin:0}' +
      '.resume-banner{background:#e8f5e9;border:1px solid #a5d6a7;border-radius:3px;padding:.75rem 1rem;margin:0 0 1rem;font-size:.9rem}' +
      '.resume-banner button{margin-left:.5rem}' +
      '.sidebar-save{padding:0 1rem 1rem;border-bottom:1px solid #e0e0e0;margin-bottom:1rem}' +
      '.sidebar-save .btn-resume{width:100%;text-align:left;font-size:.82rem;padding:.45rem .75rem}' +
      '.sidebar-save .resume-status{font-size:.75rem;color:#5a5a5a;margin:.4rem .25rem 0;line-height:1.35}' +
      'textarea.needs-answer{border-color:#990000;box-shadow:0 0 0 2px rgba(153,0,0,.15)}' +
      '.required-note{color:#990000;font-size:.88rem;margin:.5rem 0 1rem}' +
      '.certificate-submit .required-note{color:#ffb4b4}' +
      '.req-mark{color:#990000;font-weight:700;margin-left:.2rem}';
    var el = document.createElement('style');
    el.textContent = css;
    document.head.appendChild(el);
  }

  function init() {
    addStyles();
    var buttons = document.querySelectorAll('.btn-submit');
    buttons.forEach(function (btn) { btn.dataset.label = btn.textContent; });
    if (buttons.length) {
      var first = buttons[0];
      first.parentNode.insertBefore(buildFields(), first);
      first.parentNode.insertBefore(buildResumeRow(), first);
      addSidebarSave();
    }
    var n = document.getElementById('p-name') || document.getElementById('cert-name');
    var e = document.getElementById('p-email') || document.getElementById('cert-email');
    if (n && !n.value) n.value = get(KEY_NAME);
    if (e && !e.value) e.value = get(KEY_EMAIL);
    if (n) n.addEventListener('input', function () { set(KEY_NAME, n.value.trim()); });
    if (e) e.addEventListener('input', function () { set(KEY_EMAIL, e.value.trim()); });
    restoreFromLink();
  }

  /* ---------- Save and email me a link ---------- */

  function moduleId() {
    try { if (typeof MODULE !== 'undefined') return MODULE; } catch (err) {}
    return location.pathname.split('/').pop().replace('.html', '');
  }

  function workFields() {
    return Array.prototype.filter.call(
      document.querySelectorAll('textarea[id], input[id], select[id]'),
      function (el) {
        return !el.classList.contains('p-identity') && el.type !== 'email' &&
               ['p-name', 'cert-name', 'cert-email'].indexOf(el.id) === -1 &&
               (el.tagName === 'TEXTAREA' || el.tagName === 'SELECT' || el.type === 'text' || el.type === 'checkbox');
      });
  }

  function buildResumeRow() {
    var row = document.createElement('div');
    row.className = 'resume-row';
    row.innerHTML =
      '<button type="button" class="btn-resume">Save and email me a link</button>' +
      '<p class="resume-status" role="status">Not finished? Save your work and continue later on any computer.</p>';
    row.querySelector('button').addEventListener('click', saveDraft);
    return row;
  }

  /* The same save, pinned at the top of the left sidebar so it stays in reach while scrolling. */
  function addSidebarSave() {
    var nav = document.querySelector('nav.sidebar');
    if (!nav) return;
    var box = document.createElement('div');
    box.className = 'sidebar-save';
    box.innerHTML =
      '<span class="sidebar-label">Your progress</span>' +
      '<button type="button" class="btn-resume">Save and email me a link</button>' +
      '<p class="resume-status" role="status">Continue later on any computer.</p>';
    box.querySelector('button').addEventListener('click', saveDraft);
    nav.insertBefore(box, nav.firstChild);
  }

  function setStatus(text, busy) {
    document.querySelectorAll('.resume-status').forEach(function (el) { el.textContent = text; });
    document.querySelectorAll('.btn-resume').forEach(function (b) { b.disabled = !!busy; });
  }

  function saveDraft() {
    var n = document.getElementById('p-name') || document.getElementById('cert-name');
    var e = document.getElementById('p-email') || document.getElementById('cert-email');
    var name = n ? n.value.trim() : '';
    var email = e ? e.value.trim() : '';
    var err = document.querySelector('.participant-error');
    if (!name || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      if (err) err.hidden = false;
      var target = name ? e : n;
      if (target) { target.scrollIntoView({ behavior: 'smooth', block: 'center' }); target.focus({ preventScroll: true }); }
      setStatus('Enter your name and NC State email at the bottom of the workbook, then save again.');
      return;
    }
    if (err) err.hidden = true;
    var fields = {};
    workFields().forEach(function (el) { fields[el.id] = el.type === 'checkbox' ? el.checked : el.value; });
    var data = {
      action: 'save_draft',
      module: moduleId(),
      page: location.pathname.split('/').pop(),
      certificate_name: name,
      certificate_email: email,
      timestamp: new Date().toISOString(),
      fields: fields
    };
    describe(data);
    setStatus('Saving…', true);
    fetch(SCRIPT, { method: 'POST', mode: 'no-cors', headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data) })
      .then(function () {
        setStatus('Saved at ' + new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) +
          '. A link to continue is on its way to ' + email + '. Save again any time, and the same link opens your latest work.');
      })
      .catch(function () {
        setStatus('Saving failed. Your work is still in this browser. Try again, or email kkcole2@ncsu.edu.');
      });
  }

  function fillFields(fields) {
    Object.keys(fields || {}).forEach(function (id) {
      var el = document.getElementById(id);
      if (!el) return;
      if (el.type === 'checkbox') el.checked = !!fields[id];
      else el.value = fields[id];
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
    });
  }

  function banner(html) {
    var b = document.createElement('div');
    b.className = 'resume-banner';
    b.setAttribute('role', 'status');
    b.innerHTML = html;
    var main = document.querySelector('main') || document.body;
    var head = main.querySelector('.module-header');
    if (head && head.nextSibling) head.parentNode.insertBefore(b, head.nextSibling);
    else main.insertBefore(b, main.firstChild);
    return b;
  }

  function restoreFromLink() {
    var key = new URLSearchParams(location.search).get('resume');
    if (!key || !/^[a-f0-9]{32}$/.test(key)) return;
    fetch(SCRIPT + '?resume=' + key)
      .then(function (r) { return r.json(); })
      .then(function (d) {
        if (!d || d.status !== 'ok') {
          banner('This link has no saved work attached. Email kkcole2@ncsu.edu if you expected some.');
          return;
        }
        var saved = new Date(d.savedAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });
        var mark = 'c2tc-restored-' + key;
        var apply = function () {
          fillFields(d.fields);
          if (d.name) set(KEY_NAME, d.name);
          var n = document.getElementById('p-name'); if (n && !n.value && d.name) n.value = d.name;
          set(mark, d.savedAt);
        };
        if (get(mark) === d.savedAt) {
          var b = banner('Your saved work from ' + saved + ' is already in this browser.' +
            '<button type="button" class="btn-resume">Load it again</button>');
          b.querySelector('button').addEventListener('click', function () {
            apply(); b.textContent = 'Your saved work from ' + saved + ' is restored.';
          });
          return;
        }
        apply();
        banner('Your saved work from ' + saved + ' is restored. Pick up where you left off.');
      })
      .catch(function () {
        banner('Your saved work did not load. Refresh the page to try again.');
      });
  }

  function reset() {
    document.querySelectorAll('.btn-submit').forEach(function (btn) {
      btn.disabled = false;
      if (btn.dataset.label) btn.textContent = btn.dataset.label;
    });
    var st = document.getElementById('submit-status');
    if (st) st.textContent = '';
  }

  /* Adds participant_name and participant_email to a payload.
     Returns false, and restores the submit button, when either is missing. */
  function attach(data) {
    var n = document.getElementById('p-name');
    var e = document.getElementById('p-email');
    var name = n ? n.value.trim() : '';
    var email = e ? e.value.trim() : '';
    var err = document.querySelector('.participant-error');
    if (!name || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      if (err) err.hidden = false;
      reset();
      (name ? e : n).focus();
      return false;
    }
    if (err) err.hidden = true;
    set(KEY_NAME, name);
    set(KEY_EMAIL, email);
    /* certificate_name and certificate_email are the keys the CWSP Apps Script
       writes to the Name and Email columns of the submissions sheet. They go first
       so they also appear in the sheet's 500-character payload preview. */
    var rest = {};
    Object.keys(data).forEach(function (k) { rest[k] = data[k]; delete data[k]; });
    data.certificate_name = name;
    data.certificate_email = email;
    Object.keys(rest).forEach(function (k) { data[k] = rest[k]; });
    return true;
  }

  /* Adds the wording of every question on the page, the activity each one
     sits under, and the workbook title, so CWSP can return a readable copy. */
  function describe(data) {
    var labels = {}, sections = {};
    document.querySelectorAll('textarea[id], input[id]').forEach(function (el) {
      if (el.type === 'email' || el.classList.contains('p-identity')) return;
      var lab = document.querySelector('label[for="' + el.id + '"]');
      if (lab) labels[el.id] = lab.textContent.replace(/\s+/g, ' ').trim();
      var block = el.closest('.activity-block, .content-section, section');
      if (block) {
        var a = block.querySelector('.activity-label');
        var h = block.querySelector('h4, h3, h2');
        var name = [a && a.textContent.trim(), h && h.textContent.trim()].filter(Boolean).join(': ');
        if (name) sections[el.id] = name;
      }
    });
    var t = document.querySelector('.module-header h2, main h2, h1');
    data.workbook_title = t ? t.textContent.replace(/\s+/g, ' ').trim() : document.title;
    data.field_labels = labels;
    data.field_sections = sections;
    return data;
  }

  /* Required prompts. Each id names a prompt tied to a stated objective.
     Marks the prompt in the page, then blocks submission until each one
     holds a response of at least min characters. */
  function markRequired(ids) {
    ids.forEach(function (id) {
      var lab = document.querySelector('label[for="' + id + '"]');
      if (lab && !lab.querySelector('.req-mark')) {
        var m = document.createElement('span');
        m.className = 'req-mark';
        m.setAttribute('aria-hidden', 'true');
        m.textContent = '*';
        m.title = 'Required: at least one full sentence';
        lab.insertBefore(m, lab.firstChild.nextSibling);
      }
      var el = document.getElementById(id);
      if (el) {
        el.setAttribute('aria-required', 'true');
        el.addEventListener('input', function () { el.classList.remove('needs-answer'); });
      }
    });
  }

  function requireFields(ids, min, button) {
    min = min || 40;
    var missing = ids.map(function (id) { return document.getElementById(id); })
      .filter(function (el) { return el && el.value.trim().length < min; });
    var note = document.querySelector('.required-note');
    if (!missing.length) { if (note) note.hidden = true; return true; }
    missing.forEach(function (el) { el.classList.add('needs-answer'); });
    if (!note) {
      note = document.createElement('p');
      note.className = 'required-note';
      note.setAttribute('role', 'alert');
      var btn = button || document.querySelector('.btn-submit');
      if (btn) btn.parentNode.parentNode.insertBefore(note, btn.parentNode);
    }
    note.hidden = false;
    note.textContent = (missing.length === 1
      ? 'One required prompt, marked in red above, needs a longer response.'
      : missing.length + ' required prompts, marked in red above, need longer responses.') +
      ' Each required prompt takes at least ' + min + ' characters, about one full sentence.';
    missing[0].scrollIntoView({ behavior: 'smooth', block: 'center' });
    missing[0].focus({ preventScroll: true });
    return false;
  }

  /* End-of-module reaction items. Sent on their own, with no name or email,
     so CWSP reads them as program feedback apart from the participant's work. */
  function sendReactions(ids) {
    var items = {}, labels = {}, any = false;
    ids.forEach(function (id) {
      var el = document.getElementById(id);
      if (!el) return;
      items[id] = el.value || '';
      if (items[id].trim()) any = true;
      var lab = document.querySelector('label[for="' + id + '"]');
      if (lab) labels[id] = lab.textContent.replace(/\s+/g, ' ').trim();
    });
    if (!any) return;
    fetch(SCRIPT, {
      method: 'POST', mode: 'no-cors',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'reaction', module: moduleId(),
                             timestamp: new Date().toISOString(), items: items, labels: labels })
    }).catch(function () {});
  }

  /* One call per page for the elective pattern: marks required prompts, keeps
     reaction answers and extra fields in this browser, and adds the extra
     fields to the submission. */
  var EXTRA = [];
  function setup(opts) {
    opts = opts || {};
    var store = function (id) { return moduleId() + '-' + id; };
    var keep = (opts.reactions || []).concat(opts.extra || []);
    EXTRA = opts.extra || [];
    keep.forEach(function (id) {
      var el = document.getElementById(id);
      if (!el) return;
      var v = get(store(id));
      if (v && !el.value) el.value = v;
      ['input', 'change'].forEach(function (t) {
        el.addEventListener(t, function () { set(store(id), el.value); });
      });
    });
    if (opts.required) markRequired(opts.required);
  }
  function addExtra(data) {
    EXTRA.forEach(function (id) {
      var el = document.getElementById(id);
      if (el) data[id] = el.value || '';
    });
  }

  window.C2TC = {
    attach: function (data) { var ok = attach(data); if (ok) { addExtra(data); describe(data); } return ok; },
    setup: setup,
    describe: describe,
    markRequired: markRequired,
    requireFields: requireFields,
    sendReactions: sendReactions
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
