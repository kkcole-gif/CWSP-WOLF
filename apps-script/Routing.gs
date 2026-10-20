/**
 * C²TC submission routing.
 *
 * Add this file to the "RED-ACI Certificate Pipeline" Apps Script project
 * (File > New > Script, name it Routing), then add one line inside doPost,
 * after the payload is parsed:
 *
 *     try { C2TC_route(payload, null); } catch (routeErr) { console.error('C2TC routing error:', routeErr); }
 *
 * What it does with each submission:
 *   1. Finds the participant's folder in C2TC / 01 Participants by Unity ID.
 *      A participant with no folder (a new registrant) gets one, and a roster row.
 *   2. Files the submission Doc into a certificate subfolder:
 *      "Written Certificate" or "Digital Certificate".
 *      If docId is null, it writes a new Doc from the payload.
 *   3. Names the Doc so it sorts by date: "2026-10-20 · Written · Module 1".
 *   4. Adds one row to the "Structured Log" tab of C2TC Submissions:
 *      date, certificate, component, Unity ID, fields completed, fields total, Doc link.
 *      The "Counts" tab totals the log by component with no identifiers.
 */

var C2TC = {
  PARTICIPANTS_FOLDER_ID: '1SuzqeMNZo6FOOFf601H0omJf0DMgLgqK',
  ROSTER_SHEET_ID: '13jxHAkZ1m4aZSMyB-x2DTyBd7s0OP-05QlEhJ2Db52M',
  SUBMISSIONS_SHEET_ID: '1aEYJC5WoewMUbqEAqRBp1YdUcb0c4uPn8VxdGkHYfGk',
  LOG_TAB: 'Structured Log',
  COUNTS_TAB: 'Counts',
  META_KEYS: ['module', 'timestamp', 'certificate_name', 'certificate_email', 'participant_name', 'participant_email', 'cert-name', 'cert-email', 'cert-department', 'cert-role', 'type', 'submission_type']
};

function C2TC_route(payload, docId) {
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    var who = C2TC_identity_(payload);
    /* dc-capstone.html sends module 'dc-module3' with submission_type 'capstone'. */
    var where = C2TC_component_(payload.submission_type === 'capstone'
                                ? (payload.module || '').replace(/module\d*$/, 'capstone')
                                : (payload.module || ''));
    var folder = C2TC_certificateFolder_(C2TC_participantFolder_(who), where.certificate);
    var stamp = Utilities.formatDate(new Date(payload.timestamp || Date.now()),
                                     'America/New_York', 'yyyy-MM-dd');
    var title = stamp + ' · ' + where.certificate.replace(' Certificate', '') + ' · ' + where.component;

    var file = docId ? DriveApp.getFileById(docId) : DriveApp.getFileById(C2TC_writeDoc_(title, who, where, payload));
    file.setName(title);
    file.moveTo(folder);

    var counts = C2TC_fieldCounts_(payload);
    C2TC_log_([stamp, where.certificate, where.component, who.unityId,
               counts.completed, counts.total, file.getUrl()]);
    return file.getUrl();
  } finally {
    lock.releaseLock();
  }
}

/* ---------- helpers ---------- */

function C2TC_identity_(p) {
  var email = String(p['cert-email'] || p.certificate_email || p.participant_email || '').trim().toLowerCase();
  var name = String(p['cert-name'] || p.certificate_name || p.participant_name || '').trim();
  return { email: email, name: name, unityId: email.split('@')[0] || 'unknown' };
}

function C2TC_component_(module) {
  var m = module.toLowerCase();
  var certificate = /^dc-/.test(m) ? 'Digital Certificate'
                  : /^(wc|written)-/.test(m) ? 'Written Certificate'
                  : 'Other';
  var n = (m.match(/(\d+)$/) || [])[1] || '';
  var component = /capstone/.test(m) ? 'Capstone'
                : /elective/.test(m) ? 'Elective ' + n
                : /module/.test(m) ? 'Module ' + n
                : module;
  return { certificate: certificate, component: component };
}

function C2TC_participantFolder_(who) {
  var parent = DriveApp.getFolderById(C2TC.PARTICIPANTS_FOLDER_ID);
  var suffix = '(' + who.unityId + ')';
  var it = parent.getFolders();
  while (it.hasNext()) {
    var f = it.next();
    if (f.getName().slice(-suffix.length).toLowerCase() === suffix.toLowerCase()) return f;
  }
  /* New registrant: "Last, First (unityid)" folder plus a roster row. */
  var parts = who.name.split(/\s+/);
  var last = parts.length > 1 ? parts.pop() : '';
  var display = last ? last + ', ' + parts.join(' ') : (who.name || who.unityId);
  var folder = parent.createFolder(display + ' ' + suffix);
  SpreadsheetApp.openById(C2TC.ROSTER_SHEET_ID).getSheets()[0].appendRow(
    [last, parts.join(' '), who.unityId, who.email, '', '',
     Utilities.formatDate(new Date(), 'America/New_York', 'yyyy-MM-dd'), folder.getUrl()]);
  return folder;
}

function C2TC_certificateFolder_(participantFolder, certificate) {
  var it = participantFolder.getFoldersByName(certificate);
  return it.hasNext() ? it.next() : participantFolder.createFolder(certificate);
}

function C2TC_writeDoc_(title, who, where, p) {
  var doc = DocumentApp.create(title);
  var body = doc.getBody();
  body.appendParagraph(where.certificate + ', ' + where.component)
      .setHeading(DocumentApp.ParagraphHeading.HEADING1);
  body.appendParagraph(who.name + ' (' + who.email + ')');
  body.appendParagraph('Submitted ' + (p.timestamp || new Date().toISOString()));
  Object.keys(p).forEach(function (k) {
    if (C2TC.META_KEYS.indexOf(k) !== -1) return;
    body.appendParagraph(k).setHeading(DocumentApp.ParagraphHeading.HEADING3);
    body.appendParagraph(String(p[k]));
  });
  doc.saveAndClose();
  return doc.getId();
}

function C2TC_fieldCounts_(p) {
  var total = 0, completed = 0;
  Object.keys(p).forEach(function (k) {
    if (C2TC.META_KEYS.indexOf(k) !== -1 || typeof p[k] !== 'string') return;
    total++;
    if (p[k].trim()) completed++;
  });
  return { completed: completed, total: total };
}

function C2TC_log_(row) {
  var ss = SpreadsheetApp.openById(C2TC.SUBMISSIONS_SHEET_ID);
  var log = ss.getSheetByName(C2TC.LOG_TAB);
  if (!log) {
    log = ss.insertSheet(C2TC.LOG_TAB);
    log.appendRow(['Date', 'Certificate', 'Component', 'Unity ID',
                   'Fields completed', 'Fields total', 'Doc']);
    log.setFrozenRows(1);
  }
  log.appendRow(row);
  if (!ss.getSheetByName(C2TC.COUNTS_TAB)) {
    var c = ss.insertSheet(C2TC.COUNTS_TAB);
    c.getRange('A1').setFormula(
      "=QUERY('" + C2TC.LOG_TAB + "'!A:F," +
      "\"select B, C, count(A), sum(E), sum(F) where A is not null group by B, C " +
      "label count(A) 'Submissions', sum(E) 'Fields completed', sum(F) 'Fields total'\", 1)");
  }
}

/** Run once from the editor to confirm the folders and sheets resolve. */
function C2TC_selfTest() {
  Logger.log(DriveApp.getFolderById(C2TC.PARTICIPANTS_FOLDER_ID).getName());
  Logger.log(SpreadsheetApp.openById(C2TC.ROSTER_SHEET_ID).getName());
  Logger.log(SpreadsheetApp.openById(C2TC.SUBMISSIONS_SHEET_ID).getName());
  Logger.log(JSON.stringify(C2TC_component_('wc-module1')));
  Logger.log(JSON.stringify(C2TC_component_('dc-capstone')));
}
