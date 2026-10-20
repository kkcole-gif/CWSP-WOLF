/**
 * C²TC submission routing.
 *
 * Installed in the "RED-ACI Certificate Pipeline" Apps Script project as Routing.gs.
 * doPost calls it once, directly after logSubmission:
 *
 *     try { C2TC_route(payload, null); } catch (routeErr) { console.error('C2TC routing error:', routeErr); }
 *
 * What it does with each submission:
 *   1. Finds the participant's folder in C2TC / 01 Participants by Unity ID.
 *      A participant with no folder (a new registrant) gets one, and a roster row.
 *   2. Writes a formatted Doc of the responses, with each question in its own words
 *      under its activity, and files it in "Written Certificate" or "Digital Certificate".
 *      The Doc is named so it sorts by date: "2026-10-20 · Written · Module 1".
 *   3. Emails the participant a copy as an editable Word file and a PDF.
 *   4. Adds one row to the "Structured Log" tab of RED-ACI Submissions:
 *      date, certificate, component, Unity ID, fields completed, fields total, Doc link,
 *      copy sent. The "Counts" tab totals the log by component with no identifiers.
 *
 * Saved drafts ("Save and email me a link" on each workbook):
 *   doPost sends payloads with action 'save_draft' to C2TC_saveDraft, which stores the
 *   draft as a JSON file in the participant's folder, records it on the "Drafts" tab,
 *   and emails a private link. doGet answers ?resume=KEY through C2TC_loadDraft.
 *   Code.gs holds two lines for this, at the top of doPost and of doGet(e).
 */

var C2TC = {
  PARTICIPANTS_FOLDER_ID: '1SuzqeMNZo6FOOFf601H0omJf0DMgLgqK',
  ROSTER_SHEET_ID: '13jxHAkZ1m4aZSMyB-x2DTyBd7s0OP-05QlEhJ2Db52M',
  /* RED-ACI Submissions, the sheet logSubmission in Code.gs already writes to. */
  SUBMISSIONS_SHEET_ID: '142ncgm-k-LRFi1TxGe7XQt95cIqqcYEfgf5_-ESv-6Q',
  LOG_TAB: 'Structured Log',
  COUNTS_TAB: 'Counts',
  SEND_COPY: true,
  REPLY_TO: 'kkcole2@ncsu.edu',
  SITE: 'https://cwspwolf.com/acicertificate/',
  META_KEYS: ['module', 'timestamp', 'certificate_name', 'certificate_email',
              'participant_name', 'participant_email', 'cert-name', 'cert-email',
              'cert-department', 'cert-role', 'type', 'submission_type',
              'workbook_title', 'field_labels', 'field_sections']
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
    var when = new Date(payload.timestamp || Date.now());
    var stamp = Utilities.formatDate(when, 'America/New_York', 'yyyy-MM-dd');
    var title = stamp + ' · ' + where.certificate.replace(' Certificate', '') + ' · ' + where.component;

    var file = docId ? DriveApp.getFileById(docId)
                     : DriveApp.getFileById(C2TC_writeDoc_(title, who, where, payload, when));
    file.setName(title);
    file.moveTo(folder);

    var sent = 'no';
    if (C2TC.SEND_COPY && who.email) {
      try { C2TC_sendCopy_(file, who, where, payload, when); sent = 'yes'; }
      catch (mailErr) { console.error('C2TC copy not sent:', mailErr); sent = 'failed'; }
    }

    var counts = C2TC_fieldCounts_(payload);
    C2TC_log_([stamp, where.certificate, where.component, who.unityId,
               counts.completed, counts.total, file.getUrl(), sent]);
    return file.getUrl();
  } finally {
    lock.releaseLock();
  }
}

/* ---------- identity and placement ---------- */

function C2TC_identity_(p) {
  var email = String(p['cert-email'] || p.certificate_email || p.participant_email || '').trim().toLowerCase();
  var name = String(p['cert-name'] || p.certificate_name || p.participant_name || '').trim();
  return { email: email, name: name, first: name.split(/\s+/)[0] || '',
           unityId: email.split('@')[0] || 'unknown' };
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

/* ---------- the formatted Doc ---------- */

function C2TC_writeDoc_(title, who, where, p, when) {
  var labels = p.field_labels || {};
  var sections = p.field_sections || {};
  var doc = DocumentApp.create(title);
  var body = doc.getBody();
  body.setMarginTop(54).setMarginBottom(54).setMarginLeft(72).setMarginRight(72);

  var heading = p.workbook_title || (where.certificate + ', ' + where.component);
  var first = body.getParagraphs()[0];
  first.setText(heading);
  first.setHeading(DocumentApp.ParagraphHeading.TITLE);
  body.appendParagraph('C²TC · ' + where.certificate + ' · ' + where.component)
      .setHeading(DocumentApp.ParagraphHeading.SUBTITLE);
  body.appendParagraph(who.name + ' · ' + who.email + ' · Submitted ' +
      Utilities.formatDate(when, 'America/New_York', 'MMMM d, yyyy'));

  var shared = [];
  var current = null;
  Object.keys(p).forEach(function (k) {
    if (C2TC.META_KEYS.indexOf(k) !== -1) return;
    var v = p[k];
    var base = k.indexOf('activity_') === 0 ? k.slice(9) : k;
    if (typeof v === 'boolean') {
      if (v && /^repo-/.test(k)) shared.push(sections[base] || base.replace(/^repo-/, ''));
      return;
    }
    if (base === 'cert-doc-link') {
      if (String(v).trim()) {
        body.appendParagraph('Capstone document').setHeading(DocumentApp.ParagraphHeading.HEADING2);
        body.appendParagraph(String(v).trim()).setLinkUrl(String(v).trim());
      }
      return;
    }
    if (typeof v !== 'string') return;
    var section = sections[base] || '';
    if (section && section !== current) {
      body.appendParagraph(section).setHeading(DocumentApp.ParagraphHeading.HEADING1);
      current = section;
    }
    body.appendParagraph(labels[base] || base).setHeading(DocumentApp.ParagraphHeading.HEADING3);
    var text = v.trim();
    if (!text) {
      body.appendParagraph('(No response)').setItalic(true);
    } else {
      text.split(/\n+/).forEach(function (line) { body.appendParagraph(line).setItalic(false); });
    }
  });

  if (shared.length) {
    body.appendParagraph('Repository sharing').setHeading(DocumentApp.ParagraphHeading.HEADING2);
    body.appendParagraph('You agreed to share the themes of these activities with the C²TC Teaching Materials Repository: ' +
        shared.join(', ') + '.');
  }
  body.appendHorizontalRule();
  body.appendParagraph('Campus Writing and Speaking Program, NC State University. ' + C2TC.SITE)
      .setFontSize(9);

  body.editAsText().setFontFamily('Georgia');
  doc.saveAndClose();
  return doc.getId();
}

/* ---------- the participant's copy ---------- */

function C2TC_sendCopy_(file, who, where, p, when) {
  var id = file.getId();
  var base = (p.workbook_title || where.component).replace(/[\\\/:*?"<>|·]+/g, ' ').replace(/\s+/g, ' ').trim();
  var pdf = file.getAs('application/pdf').setName(base + '.pdf');
  var docx = UrlFetchApp.fetch('https://docs.google.com/document/d/' + id + '/export?format=docx', {
    headers: { Authorization: 'Bearer ' + ScriptApp.getOAuthToken() }
  }).getBlob().setName(base + '.docx');

  var what = where.certificate + ', ' + (p.workbook_title || where.component);
  var date = Utilities.formatDate(when, 'America/New_York', 'MMMM d, yyyy');
  var html =
    '<div style="font-family: Garamond, \'EB Garamond\', Georgia, serif; font-size: large; line-height: 1.45;">' +
    '<p>Dear ' + (who.first || 'colleague') + ',</p>' +
    '<p>Attached is a copy of your responses to ' + what + ', submitted ' + date + '.</p>' +
    '<p>The Word file is yours to edit. Move a low-stakes activity into your syllabus, revise a draft prompt ' +
    'into an assignment sheet, or keep the file as a record of your teaching development for annual review. ' +
    'The PDF keeps your responses as you submitted them.</p>' +
    '<p>CWSP keeps a copy in your C²TC folder. To continue, return to the ' +
    '<a href="' + C2TC.SITE + '">C²TC site</a>. Questions come to me by reply.</p>' +
    '<p>Best,<br>Kirsti</p>' +
    '<p>Kirsti K. Cole<br>Co-Director, Campus Writing and Speaking Program<br>NC State University</p></div>';

  MailApp.sendEmail({
    to: who.email,
    subject: 'Your C²TC responses: ' + where.certificate + ', ' + where.component,
    htmlBody: html,
    body: 'Attached is a copy of your responses to ' + what + ', submitted ' + date + '.',
    attachments: [docx, pdf],
    name: 'C²TC, Campus Writing and Speaking Program',
    replyTo: C2TC.REPLY_TO
  });
}

/* ---------- counts and log ---------- */

function C2TC_fieldCounts_(p) {
  var total = 0, completed = 0;
  Object.keys(p).forEach(function (k) {
    if (C2TC.META_KEYS.indexOf(k) !== -1 || k === 'cert-doc-link' || typeof p[k] !== 'string') return;
    total++;
    if (p[k].trim()) completed++;
  });
  return { completed: completed, total: total };
}

function C2TC_log_(row) {
  var ss = SpreadsheetApp.openById(C2TC.SUBMISSIONS_SHEET_ID);
  var log = ss.getSheetByName(C2TC.LOG_TAB);
  if (!log) {
    log = ss.insertSheet(C2TC.LOG_TAB, 0);
    log.appendRow(['Date', 'Certificate', 'Component', 'Unity ID',
                   'Fields completed', 'Fields total', 'Doc', 'Copy sent']);
    log.getRange(1, 1, 1, 8).setFontWeight('bold');
    log.setFrozenRows(1);
  }
  log.appendRow(row);
  if (!ss.getSheetByName(C2TC.COUNTS_TAB)) {
    var c = ss.insertSheet(C2TC.COUNTS_TAB, 1);
    c.getRange('A1').setFormula(
      "=QUERY('" + C2TC.LOG_TAB + "'!A:F," +
      "\"select B, C, count(A), sum(E), sum(F) where A is not null group by B, C " +
      "label count(A) 'Submissions', sum(E) 'Fields completed', sum(F) 'Fields total'\", 1)");
  }
}

/* ---------- saved drafts and resume links ---------- */

var C2TC_DRAFTS_TAB = 'Drafts';
var C2TC_DRAFT_HEADERS = ['Key', 'Last saved', 'Certificate', 'Component', 'Unity ID', 'Page',
                          'Fields completed', 'Fields total', 'Draft file'];

function C2TC_draftsSheet_() {
  var ss = SpreadsheetApp.openById(C2TC.SUBMISSIONS_SHEET_ID);
  var sh = ss.getSheetByName(C2TC_DRAFTS_TAB);
  if (!sh) {
    sh = ss.insertSheet(C2TC_DRAFTS_TAB, 2);
    sh.appendRow(C2TC_DRAFT_HEADERS);
    sh.getRange(1, 1, 1, C2TC_DRAFT_HEADERS.length).setFontWeight('bold');
    sh.setFrozenRows(1);
  }
  return sh;
}

/** Saves a workbook in progress and emails the participant a link to continue. */
function C2TC_saveDraft(payload) {
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    var who = C2TC_identity_(payload);
    if (!who.email) throw new Error('No email on draft');
    var where = C2TC_component_(payload.module || '');
    var page = String(payload.page || '').replace(/[^a-z0-9.\-]/gi, '');
    var fields = payload.fields || {};
    var now = new Date();
    var json = JSON.stringify({ savedAt: now.toISOString(), module: payload.module, page: page,
                                name: who.name, fields: fields });

    var completed = 0, total = 0;
    Object.keys(fields).forEach(function (k) {
      if (typeof fields[k] !== 'string') return;
      total++;
      if (fields[k].trim()) completed++;
    });

    var sh = C2TC_draftsSheet_();
    var rows = sh.getDataRange().getValues();
    var rowIndex = -1, key = '', fileId = '';
    for (var i = 1; i < rows.length; i++) {
      if (rows[i][4] === who.unityId && rows[i][2] === where.certificate && rows[i][3] === where.component) {
        rowIndex = i + 1; key = rows[i][0]; fileId = rows[i][8]; break;
      }
    }
    var file;
    if (fileId) {
      try { file = DriveApp.getFileById(fileId); file.setContent(json); } catch (e) { file = null; }
    }
    if (!file) {
      var folder = C2TC_certificateFolder_(C2TC_participantFolder_(who), where.certificate);
      file = folder.createFile('Draft in progress · ' + where.component + '.json', json, 'application/json');
    }
    if (!key) key = Utilities.getUuid().replace(/-/g, '');
    var row = [key, now, where.certificate, where.component, who.unityId, page, completed, total, file.getId()];
    if (rowIndex > 0) sh.getRange(rowIndex, 1, 1, row.length).setValues([row]);
    else sh.appendRow(row);

    C2TC_sendResumeLink_(who, where, payload, page, key, now, completed, total);
    return key;
  } finally {
    lock.releaseLock();
  }
}

/** Returns the saved fields for a resume key, for doGet. */
function C2TC_loadDraft(key) {
  if (!/^[a-f0-9]{32}$/.test(String(key))) return { status: 'not_found' };
  var rows = C2TC_draftsSheet_().getDataRange().getValues();
  for (var i = 1; i < rows.length; i++) {
    if (rows[i][0] === key) {
      var d = JSON.parse(DriveApp.getFileById(rows[i][8]).getBlob().getDataAsString());
      return { status: 'ok', savedAt: d.savedAt, module: d.module, name: d.name, fields: d.fields };
    }
  }
  return { status: 'not_found' };
}

function C2TC_sendResumeLink_(who, where, p, page, key, when, completed, total) {
  var link = C2TC.SITE + page + '?resume=' + key;
  var what = where.certificate + ', ' + (p.workbook_title || where.component);
  var date = Utilities.formatDate(when, 'America/New_York', "MMMM d, yyyy 'at' h:mm a");
  var html =
    '<div style="font-family: Garamond, \'EB Garamond\', Georgia, serif; font-size: large; line-height: 1.45;">' +
    '<p>Dear ' + (who.first || 'colleague') + ',</p>' +
    '<p>Your work on ' + what + ' is saved as of ' + date + ', with ' + completed + ' of ' + total +
    ' responses started.</p>' +
    '<p><a href="' + link + '">Continue where you left off</a></p>' +
    '<p>The link opens the workbook with your responses filled in, on any computer or browser. ' +
    'Each time you select "Save and email me a link," the same link updates to your latest work. ' +
    'Keep this email, and keep the link to yourself, since anyone with it sees your responses.</p>' +
    '<p>When you finish, select Submit at the bottom of the workbook. CWSP then sends you a copy of your responses.</p>' +
    '<p>Best,<br>Kirsti</p>' +
    '<p>Kirsti K. Cole<br>Co-Director, Campus Writing and Speaking Program<br>NC State University</p></div>';
  MailApp.sendEmail({
    to: who.email,
    subject: 'Continue your C²TC work: ' + where.certificate + ', ' + where.component,
    htmlBody: html,
    body: 'Continue where you left off: ' + link,
    name: 'C²TC, Campus Writing and Speaking Program',
    replyTo: C2TC.REPLY_TO
  });
}

/** Run once from the editor to confirm the folders and sheets resolve, and to grant permissions. */
function C2TC_selfTest() {
  Logger.log(DriveApp.getFolderById(C2TC.PARTICIPANTS_FOLDER_ID).getName());
  Logger.log(SpreadsheetApp.openById(C2TC.ROSTER_SHEET_ID).getName());
  Logger.log(SpreadsheetApp.openById(C2TC.SUBMISSIONS_SHEET_ID).getName());
  Logger.log(JSON.stringify(C2TC_component_('wc-module1')));
  Logger.log(JSON.stringify(C2TC_component_('dc-capstone')));
  Logger.log('Mail quota remaining today: ' + MailApp.getRemainingDailyQuota());
  Logger.log('Export reachable: ' + (typeof UrlFetchApp.fetch === 'function'));
}
