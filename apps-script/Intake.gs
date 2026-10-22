/**
 * CWSP intake form for WOLF, AI Literacies, and the AI Policy Lab.
 *
 * Installed in the "RED-ACI Certificate Pipeline" Apps Script project as Intake.gs.
 * Run CWSP_buildIntakeForm once from the editor. It creates the form (NC State sign-in),
 * a responses sheet beside the C2TC Participants folder, and a submit trigger that emails
 * the requester a confirmation and sends Kirsti a copy. The log prints the public link,
 * which goes into get-started.html and the "Talk with CWSP" links across the site.
 */

var CWSP_INTAKE = {
  TITLE: 'Talk with CWSP: WOLF, AI Literacies, AI Policy Lab',
  SHEET_TITLE: 'CWSP Intake Requests',
  PROP_FORM_ID: 'CWSP_INTAKE_FORM_ID',
  INTRO: 'This form starts a conversation with the NC State Campus Writing and Speaking Program. It commits you to nothing.\n\n' +
    'WOLF builds writing and speaking into a curriculum. It works with departments, programs, and colleges over two to three years, and with groups of faculty who teach related courses. ' +
    'The AI Literacies extension and the AI Policy Lab run on their own or alongside WOLF.\n\n' +
    'Kirsti Cole reads every request and writes back within two business days to set a first conversation. The form takes about three minutes.'
};

function CWSP_buildIntakeForm() {
  var props = PropertiesService.getScriptProperties();
  var existing = props.getProperty(CWSP_INTAKE.PROP_FORM_ID);
  if (existing) {
    var old = FormApp.openById(existing);
    Logger.log('The intake form already exists: ' + old.getPublishedUrl());
    return old.getPublishedUrl();
  }

  var form = FormApp.create(CWSP_INTAKE.TITLE);
  form.setDescription(CWSP_INTAKE.INTRO);
  form.setRequireLogin(true);
  form.setCollectEmail(true);
  form.setAllowResponseEdits(true);
  form.setShowLinkToRespondAgain(false);
  form.setConfirmationMessage('Thank you. A confirmation is on its way to your NC State email, and Kirsti Cole will write within two business days.');

  form.addTextItem().setTitle('Your name').setRequired(true);
  form.addMultipleChoiceItem()
    .setTitle('Your role')
    .setChoiceValues(['Department head or chair', 'Associate head, or director of a program', 'Faculty member', 'College leadership'])
    .showOtherOption(true)
    .setRequired(true);
  form.addTextItem().setTitle('Department, program, or college').setRequired(true);
  form.addCheckboxItem()
    .setTitle('What would you like to talk about?')
    .setChoiceValues([
      'WOLF for a department, program, or college',
      'WOLF for a group of faculty',
      'AI Literacies extension',
      'AI Policy Lab workshop',
      'Not sure yet'])
    .setRequired(true);
  form.addParagraphTextItem()
    .setTitle('What prompted this now?')
    .setHelpText('A program review, a curriculum revision, accreditation, AI policy, or something else. A sentence or two is plenty.');
  form.addMultipleChoiceItem()
    .setTitle('When would you like to start?')
    .setChoiceValues(['This semester', 'Next semester', 'Next academic year', 'Not sure yet'])
    .setRequired(true);
  form.addParagraphTextItem().setTitle('Anything else we should know?');

  var sheet = SpreadsheetApp.create(CWSP_INTAKE.SHEET_TITLE);
  form.setDestination(FormApp.DestinationType.SPREADSHEET, sheet.getId());
  try {
    var parents = DriveApp.getFolderById(C2TC.PARTICIPANTS_FOLDER_ID).getParents();
    if (parents.hasNext()) {
      var home = parents.next();
      DriveApp.getFileById(form.getId()).moveTo(home);
      DriveApp.getFileById(sheet.getId()).moveTo(home);
    }
  } catch (err) {
    Logger.log('Could not move the form and sheet: ' + err);
  }

  ScriptApp.newTrigger('CWSP_intakeReceived').forForm(form).onFormSubmit().create();
  props.setProperty(CWSP_INTAKE.PROP_FORM_ID, form.getId());

  Logger.log('Form (edit): ' + form.getEditUrl());
  Logger.log('Form (public link for the site): ' + form.getPublishedUrl());
  Logger.log('Responses sheet: ' + sheet.getUrl());
  return form.getPublishedUrl();
}

/* Submit trigger. Confirms to the requester and sends Kirsti a copy. */
function CWSP_intakeReceived(e) {
  var email = e.response.getRespondentEmail();
  var answers = {};
  e.response.getItemResponses().forEach(function (r) {
    var v = r.getResponse();
    answers[r.getItem().getTitle()] = Array.isArray(v) ? v.join(', ') : String(v);
  });
  var name = answers['Your name'] || '';
  var first = name.split(/\s+/)[0] || 'there';
  var topics = answers['What would you like to talk about?'] || '';
  var unit = answers['Department, program, or college'] || '';

  if (email) {
    MailApp.sendEmail({
      to: email,
      replyTo: C2TC.REPLY_TO,
      name: 'NC State CWSP',
      subject: 'Your request to CWSP',
      body:
        'Hi ' + first + ',\n\n' +
        'CWSP has your request about: ' + topics + (unit ? ', for ' + unit : '') + '.\n\n' +
        'Kirsti Cole will write within two business days to set a first conversation. ' +
        'In the meantime, the WOLF pages at https://cwspwolf.com describe how an engagement runs.\n\n' +
        'NC State Campus Writing and Speaking Program'
    });
  }

  MailApp.sendEmail({
    to: C2TC.REPLY_TO,
    subject: 'New CWSP request: ' + name + (unit ? ', ' + unit : ''),
    body: 'From ' + (email || 'unknown email') + '\n\n' +
      Object.keys(answers).map(function (k) { return k + ': ' + answers[k]; }).join('\n')
  });
}
