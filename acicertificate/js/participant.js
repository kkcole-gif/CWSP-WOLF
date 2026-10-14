/* C²TC participant identity for module and elective submissions.
   Adds name and NC State email fields above each submit button,
   remembers them in this browser, and attaches them to every payload. */
(function () {
  var KEY_NAME = 'c2tc-participant-name';
  var KEY_EMAIL = 'c2tc-participant-email';

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
      '.participant-error{color:#990000;font-size:.85rem;margin:.25rem 0 0}';
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
    }
    var n = document.getElementById('p-name') || document.getElementById('cert-name');
    var e = document.getElementById('p-email') || document.getElementById('cert-email');
    if (n && !n.value) n.value = get(KEY_NAME);
    if (e && !e.value) e.value = get(KEY_EMAIL);
    if (n) n.addEventListener('input', function () { set(KEY_NAME, n.value.trim()); });
    if (e) e.addEventListener('input', function () { set(KEY_EMAIL, e.value.trim()); });
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

  window.C2TC = { attach: attach };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
