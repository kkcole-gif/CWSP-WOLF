/**
 * AI Policy Lab, Part V: Submit to the Policy Repository.
 *
 * ai-policy-workbook.html posts to the CWSP archive script (the deployment the literacies
 * workbook and the Adventure beta also post to), tagged source: 'ai-policy-lab'. A submission
 * holds the participant's Part III templates and Part IV drafts (when they chose to include them),
 * four tags (discipline, institution type, policy level drafted, how they worked), and up to
 * three corpus documents (institution, title, url, date, wave, stance, notes). No name or email.
 *
 * To install, add this file to the archive script's Apps Script project, then put one line at
 * the top of its doPost, after the payload is parsed and before any other handling
 * (beside the AdventureBeta line, in either order):
 *
 *     if (PolicyRepository_handle(payload)) return ContentService.createTextOutput('ok');
 *
 * Then redeploy the web app as a new version under the same deployment, so the URL stays the same.
 *
 * What it does: the first submission creates a spreadsheet named "AI Policy Lab, Repository
 * Submissions" in the script owner's Drive with two tabs, Submissions (one row per submission,
 * the work as JSON in the last column) and Corpus Documents (one row per document, for the next
 * collection sweep to verify and index). The sheet ID is stored in Script Properties.
 */

var POLICY_REPO = {
  SOURCE: 'ai-policy-lab',
  SHEET_NAME: 'AI Policy Lab, Repository Submissions',
  PROP_KEY: 'POLICY_REPO_SHEET_ID',
  SUBMISSIONS: ['Received', 'Discipline', 'Institution type', 'Policy level drafted', 'How they worked',
                'Included templates and drafts', 'Documents added', 'Page', 'Work (JSON)'],
  DOCUMENTS: ['Received', 'Institution', 'Document title', 'Link', 'Date', 'Wave', 'Stance', 'Notes',
              'Submitter discipline', 'Submitter institution type', 'Verified', 'In index']
};

function PolicyRepository_handle(payload) {
  if (!payload || payload.source !== POLICY_REPO.SOURCE) return false;
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    var ss = PolicyRepository_sheet_();
    var subs = ss.getSheetByName('Submissions');
    var docsTab = ss.getSheetByName('Corpus Documents');
    var when = new Date(payload.timestamp || Date.now());
    var docs = Array.isArray(payload.documents) ? payload.documents : [];
    var work = {};
    Object.keys(payload).forEach(function (k) {
      if (/^(t[1-4]-|p4-)/.test(k) && typeof payload[k] === 'string' && payload[k].trim()) work[k] = payload[k];
    });
    subs.appendRow([when, payload['sub-discipline'] || '', payload['sub-inst-type'] || '', payload['sub-level'] || '',
                    payload['sub-engagement'] || '', payload['sub-include-work'] ? 'Yes' : 'No', docs.length,
                    payload.page || '', JSON.stringify(work)]);
    docs.forEach(function (d) {
      docsTab.appendRow([when, d.institution || '', d.title || '', d.url || '', d.date || '', d.wave || '',
                         d.stance || '', d.notes || '', payload['sub-discipline'] || '', payload['sub-inst-type'] || '', '', '']);
    });
    return true;
  } finally {
    lock.releaseLock();
  }
}

function PolicyRepository_sheet_() {
  var props = PropertiesService.getScriptProperties();
  var id = props.getProperty(POLICY_REPO.PROP_KEY);
  if (id) { try { return SpreadsheetApp.openById(id); } catch (e) {} }
  var ss = SpreadsheetApp.create(POLICY_REPO.SHEET_NAME);
  var subs = ss.getSheets()[0]; subs.setName('Submissions');
  subs.appendRow(POLICY_REPO.SUBMISSIONS); subs.setFrozenRows(1);
  var docsTab = ss.insertSheet('Corpus Documents');
  docsTab.appendRow(POLICY_REPO.DOCUMENTS); docsTab.setFrozenRows(1);
  props.setProperty(POLICY_REPO.PROP_KEY, ss.getId());
  return ss;
}
