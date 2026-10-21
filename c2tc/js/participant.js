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
      '.preview-note{color:#990000;font-size:.88rem;margin:.6rem 0 0}' +
      'input.needs-answer{border-color:#990000;box-shadow:0 0 0 2px rgba(153,0,0,.15)}' +
      'textarea.needs-answer{border-color:#990000;box-shadow:0 0 0 2px rgba(153,0,0,.15)}' +
      '.required-note{color:#990000;font-size:.88rem;margin:.5rem 0 1rem}' +
      '.certificate-submit .required-note{color:#ffb4b4}' +
      '.req-mark{color:#990000;font-weight:700;margin-left:.2rem}' +
      '.top-bar .btn-save{color:#fff;background:transparent;border:1px solid #9a9a9a;white-space:nowrap}' +
      '.top-bar .btn-save:hover,.top-bar .btn-save:focus{border-color:#fff;color:#fff}' +
      '.sidebar-save .side-id{display:grid;gap:.2rem;margin:.25rem .25rem .6rem}' +
      '.sidebar-save .side-id label{font-size:.72rem;font-weight:600;color:#3a3a3a}' +
      '.sidebar-save .side-id input{font:inherit;font-size:.8rem;padding:.35rem .45rem;border:1px solid #bbb;border-radius:3px;width:100%}' +
      '.sidebar-save .side-hint{font-size:.72rem;color:#5a5a5a;margin:.5rem .25rem 0;line-height:1.35}' +
      '.sidebar-save .btn-clear{background:none;border:0;padding:0;margin:.5rem .25rem 0;font:inherit;font-size:.72rem;color:#5a5a5a;text-decoration:underline;cursor:pointer}' +
      '.c2tc-toast{position:fixed;left:50%;transform:translateX(-50%);top:64px;z-index:200;max-width:34rem;width:calc(100% - 2rem);background:#fff;border:1px solid #990000;border-left:5px solid #990000;border-radius:3px;box-shadow:0 4px 18px rgba(0,0,0,.18);padding:.75rem 2.4rem .75rem 1rem;font-size:.9rem;color:#1a1a1a;line-height:1.45}' +
      '.c2tc-toast button{position:absolute;top:.35rem;right:.5rem;background:none;border:0;font-size:1.2rem;line-height:1;cursor:pointer;color:#5a5a5a}' +
      '.builder-empty{border-color:#990000 !important;box-shadow:0 0 0 2px rgba(153,0,0,.15)}' +
      '.builder-note{color:#990000;font-size:.88rem;margin:.5rem 0}' +
      'details.go-further{border-left:2px solid #c8c8c8;padding:.1rem 0 .1rem .9rem;margin:.75rem 0 1.25rem}' +
      'details.go-further>summary{cursor:pointer;font-size:.9rem;font-weight:600;color:#4d4d4d;padding:.35rem 0}' +
      'details.go-further>summary:focus-visible{outline:2px solid #1a1a1a;outline-offset:2px}' +
      'details.go-further[open]>summary{margin-bottom:.5rem}';
    var el = document.createElement('style');
    el.textContent = css;
    document.head.appendChild(el);
  }

  function init() {
    addStyles();
    guardPreview();
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
    syncSidebarIdentity();
    fixSaveButton();
    guardPreviews();
    restoreFromLink();
  }

  function visible(el) { return !!(el && el.offsetParent !== null); }
  function stamp() { return new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }); }

  /* A message pinned under the top bar, so it shows wherever the reader is on the page. */
  function toast(text) {
    var t = document.querySelector('.c2tc-toast');
    if (!t) {
      t = document.createElement('div');
      t.className = 'c2tc-toast';
      t.setAttribute('role', 'alert');
      t.innerHTML = '<span></span><button type="button" aria-label="Close message">×</button>';
      t.querySelector('button').addEventListener('click', function () { t.hidden = true; });
      document.body.appendChild(t);
    }
    t.querySelector('span').textContent = text;
    t.hidden = false;
  }

  /* The top-bar Save button. Work already saves to this browser as the participant types,
     so the button confirms that save with a time rather than doing anything new. */
  function fixSaveButton() {
    var pageSave = typeof window.saveAll === 'function' ? window.saveAll
                 : (typeof window.save === 'function' ? window.save : null);
    var btn = document.querySelector('.top-bar .btn-save');
    if (!btn && pageSave) {
      var wrap = document.querySelector('.top-bar .progress-wrap');
      if (wrap) {
        btn = document.createElement('button');
        btn.className = 'btn-save';
        wrap.appendChild(btn);
      }
    }
    if (!btn) return;
    btn.type = 'button';
    btn.removeAttribute('onclick');
    btn.textContent = 'Save';
    btn.title = 'Your work saves in this browser as you type';
    btn.addEventListener('click', function () {
      try { if (pageSave) pageSave(); } catch (err) {}
      btn.textContent = 'Saved ' + stamp();
    });
  }

  /* Builder previews. An empty builder opens nothing useful, so say what is missing. */
  function guardPreviews() {
    document.querySelectorAll('.btn-preview, .btn-artifact').forEach(function (btn) {
      btn.addEventListener('click', function (ev) {
        var box = btn.closest('.activity-block, .content-section, section') || document;
        var fields = Array.prototype.slice.call(box.querySelectorAll('[id^="art-"]'))
          .filter(function (el) { return el.tagName === 'TEXTAREA' || el.tagName === 'INPUT'; });
        if (!fields.length) return;
        var empty = fields.filter(function (el) { return !el.value.trim(); });
        var note = box.querySelector('.builder-note');
        if (empty.length < fields.length) { if (note) note.hidden = true; return; }
        ev.preventDefault();
        ev.stopImmediatePropagation();
        fields.forEach(function (el) {
          el.classList.add('builder-empty');
          el.addEventListener('input', function () { el.classList.remove('builder-empty'); }, { once: true });
        });
        if (!note) {
          note = document.createElement('p');
          note.className = 'builder-note';
          note.setAttribute('role', 'alert');
          btn.parentNode.insertBefore(note, btn);
        }
        note.hidden = false;
        note.textContent = 'Fill in the builder fields above to generate the sheet. The preview draws on what you write there.';
        fields[0].scrollIntoView({ behavior: 'smooth', block: 'center' });
        fields[0].focus({ preventScroll: true });
      }, true);
    });
  }


  /* Preview with an empty builder produced a blank sheet and no message.
     When every builder field is empty, stop the preview, outline the fields,
     and say what to fill. Builders that draw only on activity answers
     (no fields of their own) are left alone. */
  function guardPreview() {
    document.addEventListener('click', function (ev) {
      var btn = ev.target.closest && ev.target.closest('.btn-preview, .btn-artifact');
      if (!btn) return;
      var box = btn.closest('#artifact') || document.getElementById('artifact');
      if (!box) return;
      var fields = Array.prototype.filter.call(
        box.querySelectorAll('textarea, input[type=text]'),
        function (el) { return !el.classList.contains('p-identity'); });
      if (!fields.length) return;
      var note = box.querySelector('.preview-note');
      var empty = fields.every(function (el) { return !el.value.trim(); });
      if (!empty) { if (note) note.hidden = true; return; }
      ev.preventDefault();
      ev.stopImmediatePropagation();
      fields.forEach(function (el) {
        el.classList.add('needs-answer');
        el.addEventListener('input', function () { el.classList.remove('needs-answer'); }, { once: true });
      });
      if (!note) {
        note = document.createElement('p');
        note.className = 'preview-note';
        note.setAttribute('role', 'alert');
        btn.insertAdjacentElement('afterend', note);
      }
      note.hidden = false;
      note.textContent = 'The builder fields above are empty. Fill them in, starting with the title, then select Preview again.';
      fields[0].scrollIntoView({ behavior: 'smooth', block: 'center' });
      fields[0].focus({ preventScroll: true });
    }, true);
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
      '<div class="side-id">' +
      '<label for="sp-name">Your name</label>' +
      '<input type="text" id="sp-name" class="p-identity" autocomplete="name">' +
      '<label for="sp-email">NC State email</label>' +
      '<input type="email" id="sp-email" class="p-identity" autocomplete="email" placeholder="unityid@ncsu.edu">' +
      '</div>' +
      '<button type="button" class="btn-resume">Save and email me a link</button>' +
      '<p class="resume-status" role="status">Continue later on any computer.</p>' +
      '<p class="side-hint">Prompts marked * need about 40 characters, one full sentence, before you submit.</p>' +
      '<button type="button" class="btn-clear">Clear my work from this browser</button>';
    box.querySelector('.btn-resume').addEventListener('click', saveDraft);
    box.querySelector('.btn-clear').addEventListener('click', clearWork);
    nav.insertBefore(box, nav.firstChild);
  }

  /* The sidebar name and email mirror the fields above the submit button, so a participant
     can save a draft from the top of the page. Both pairs write to the same stored values. */
  function syncSidebarIdentity() {
    [['sp-name', 'p-name', KEY_NAME], ['sp-email', 'p-email', KEY_EMAIL]].forEach(function (pair) {
      var side = document.getElementById(pair[0]);
      var main = document.getElementById(pair[1]);
      if (!side || !main) return;
      side.value = main.value || get(pair[2]);
      side.addEventListener('input', function () { main.value = side.value; set(pair[2], side.value.trim()); });
      main.addEventListener('input', function () { side.value = main.value; });
    });
  }

  /* For shared or lab computers. Removes this workbook's answers and the remembered
     name and email from this browser. Work already sent to CWSP is untouched. */
  function clearWork() {
    if (!window.confirm('Remove your answers to this workbook, and your name and email, from this browser? Work you have already submitted or saved by email stays with CWSP.')) return;
    var id = moduleId();
    try {
      Object.keys(localStorage).forEach(function (k) {
        if (k.indexOf(id + '-') === 0 || k.indexOf(id + ':') === 0 || k === KEY_NAME || k === KEY_EMAIL) localStorage.removeItem(k);
      });
    } catch (err) {}
    document.querySelectorAll('textarea, input[type="text"], input[type="email"], select').forEach(function (el) { el.value = ''; });
    document.querySelectorAll('input[type="checkbox"]').forEach(function (el) { el.checked = false; });
    try { if (typeof window.updateProgress === 'function') window.updateProgress(); } catch (err) {}
    setStatus('Cleared from this browser.');
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
      var side = document.getElementById(name ? 'sp-email' : 'sp-name');
      var target = visible(side) ? side : (name ? e : n);
      if (target) { target.scrollIntoView({ behavior: 'smooth', block: 'center' }); target.focus({ preventScroll: true }); }
      setStatus('Enter your name and NC State email, then save again.');
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
        setStatus('Saved at ' + stamp() + '. A link to continue is on its way to ' + email +
          '. Save again any time, and the same link opens your latest work. Anyone holding the link sees your draft, so keep it to yourself. If no email arrives within an hour, write to kkcole2@ncsu.edu.');
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
    OPEN_FILLED();
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
      .filter(function (el) { return el && el.value.trim().length < min; })
      .sort(function (a, b) { return a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1; });
    var note = document.querySelector('.required-note');
    if (!missing.length) {
      if (note) note.hidden = true;
      var t = document.querySelector('.c2tc-toast'); if (t) t.hidden = true;
      return true;
    }
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
    toast((missing.length === 1 ? 'One required prompt needs' : missing.length + ' required prompts need') +
      ' a longer response (about ' + min + ' characters, one full sentence). The first one is outlined in red below.');
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
    if (opts.required) {
      markRequired(opts.required);
      collapseOptional(opts.required.concat(keep));
    }
  }

  /* Optional prompts sit inside a "Go further" disclosure, so a workbook opens showing
     only the responses its objectives require. Each run of adjacent optional prompts
     becomes one disclosure, in place, so the order of the activity stays as written.
     A disclosure opens by itself when any prompt inside it already holds work. */
  function collapseOptional(visibleIds) {
    var units = [];
    document.querySelectorAll('textarea[id^="f-"], input[type="text"][id^="f-"]').forEach(function (field) {
      if (visibleIds.indexOf(field.id) !== -1) return;
      var label = field.previousElementSibling;
      if (!label || label.tagName !== 'LABEL' || label.getAttribute('for') !== field.id) return;
      units.push({ label: label, field: field });
    });
    var groups = [];
    units.forEach(function (u) {
      var last = groups.length ? groups[groups.length - 1] : null;
      if (last && last[last.length - 1].field.nextElementSibling === u.label) last.push(u);
      else groups.push([u]);
    });
    groups.forEach(function (g) {
      var d = document.createElement('details');
      d.className = 'go-further';
      var s = document.createElement('summary');
      s.textContent = 'Go further: ' + (g.length === 1 ? 'one optional prompt' : g.length + ' optional prompts');
      d.appendChild(s);
      var start = g[0].label, end = g[g.length - 1].field;
      start.parentNode.insertBefore(d, start);
      var node = start;
      while (node) {
        var next = node.nextSibling;
        d.appendChild(node);
        if (node === end) break;
        node = next;
      }
    });
    var openFilled = function () {
      document.querySelectorAll('details.go-further').forEach(function (d) {
        var filled = Array.prototype.some.call(d.querySelectorAll('textarea, input'), function (el) { return el.value.trim(); });
        if (filled) d.open = true;
      });
    };
    document.addEventListener('DOMContentLoaded', function () { setTimeout(openFilled, 0); });
    window.addEventListener('load', openFilled);
    OPEN_FILLED = openFilled;
  }
  var OPEN_FILLED = function () {};
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
