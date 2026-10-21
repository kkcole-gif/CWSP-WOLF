/**
 * AI Practice Adventure, beta feedback.
 *
 * cyoa.html posts reader feedback to the CWSP archive script (the deployment the
 * literacies workbook and the policy workbook also post to), tagged source: 'ai-practice-beta'.
 * The page sends feedback answers only. It never sends a reader's path answers or statement,
 * except an opt-in route (screen names, the checkpoint-two finding, the outcome chosen).
 *
 * To install, add this file to the archive script's Apps Script project, then put one line at
 * the top of its doPost, after the payload is parsed and before any other handling:
 *
 *     if (AdventureBeta_handle(payload)) return ContentService.createTextOutput('ok');
 *
 * Then redeploy the web app as a new version under the same deployment, so the URL stays the same.
 *
 * What it does: the first submission creates a spreadsheet named "AI Practice Adventure, Beta
 * Feedback" in the script owner's Drive and stores its ID in Script Properties. Each submission
 * adds one row. Nothing is emailed and no identifiers are asked for.
 */

var ADVENTURE_BETA = {
  SOURCE: 'ai-practice-beta',
  SHEET_NAME: 'AI Practice Adventure, Beta Feedback',
  PROP_KEY: 'ADVENTURE_BETA_SHEET_ID',
  COLUMNS: [
    ['timestamp', 'Received'],
    ['role', 'Reading as'],
    ['device', 'Device'],
    ['stall', 'Where they stalled'],
    ['next', 'Unsure what to do next'],
    ['made', 'Decision already made by the analysis'],
    ['postures', 'The three postures'],
    ['statement', 'The statement'],
    ['other', 'Anything else'],
    ['route', 'Route (opt-in)'],
    ['finding', 'Checkpoint two finding (opt-in)'],
    ['outcome', 'Outcome (opt-in)'],
    ['page', 'Page']
  ]
};

/** Returns true when the payload belonged to the beta and was recorded. */
function AdventureBeta_handle(payload) {
  if (!payload || payload.source !== ADVENTURE_BETA.SOURCE) return false;
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    var sheet = AdventureBeta_sheet_();
    sheet.appendRow(ADVENTURE_BETA.COLUMNS.map(function (c) {
      var v = payload[c[0]];
      if (c[0] === 'timestamp') return v ? new Date(v) : new Date();
      return v == null ? '' : String(v).slice(0, 5000);
    }));
  } finally {
    lock.releaseLock();
  }
  return true;
}

function AdventureBeta_sheet_() {
  var props = PropertiesService.getScriptProperties();
  var id = props.getProperty(ADVENTURE_BETA.PROP_KEY);
  var ss = null;
  if (id) { try { ss = SpreadsheetApp.openById(id); } catch (e) { ss = null; } }
  if (!ss) {
    ss = SpreadsheetApp.create(ADVENTURE_BETA.SHEET_NAME);
    props.setProperty(ADVENTURE_BETA.PROP_KEY, ss.getId());
    var first = ss.getSheets()[0];
    first.setName('Feedback');
    first.appendRow(ADVENTURE_BETA.COLUMNS.map(function (c) { return c[1]; }));
    first.setFrozenRows(1);
  }
  return ss.getSheetByName('Feedback') || ss.getSheets()[0];
}
