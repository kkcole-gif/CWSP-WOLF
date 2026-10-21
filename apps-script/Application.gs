/**
 * C²TC application form.
 *
 * Installed in the "RED-ACI Certificate Pipeline" Apps Script project as Application.gs.
 *
 * Run C2TC_buildApplicationForm once from the editor. It:
 *   1. Creates the Google Form "C²TC Application", restricted to NC State sign-in,
 *      asking for the fields the Apply page (cwspwolf.com/c2tc/apply.html) lists.
 *   2. Sends responses to a new sheet, "C²TC Applications".
 *   3. Files the form and the sheet beside the C2TC Participants folder.
 *   4. Installs a submit trigger that emails each applicant a confirmation and copies Kirsti.
 * The log prints the form's public link, which goes into apply.html.
 *
 * Applying involves no selection. The form registers a participant with CWSP so that
 * CWSP knows which certificate they are working on, can send cohort session dates,
 * and can process the beta mini-grant.
 */

var C2TC_APP = {
  TITLE: 'C²TC Application',
  SHEET_TITLE: 'C²TC Applications',
  PROP_FORM_ID: 'C2TC_APPLICATION_FORM_ID'
};

function C2TC_buildApplicationForm() {
  var props = PropertiesService.getScriptProperties();
  var existing = props.getProperty(C2TC_APP.PROP_FORM_ID);
  if (existing) {
    var old = FormApp.openById(existing);
    Logger.log('The application form already exists: ' + old.getPublishedUrl());
    return old.getPublishedUrl();
  }

  var form = FormApp.create(C2TC_APP.TITLE);
  form.setDescription(
    'The C²TC Communication Teaching Certificate is free for NC State instructional faculty and graduate instructors. ' +
    'There is no selection process. This form registers you with the Campus Writing and Speaking Program, so that we know ' +
    'which certificate you are working on, can send you cohort session dates, and can process the $500 mini-grant for beta participants. ' +
    'Every workbook is open now at cwspwolf.com/c2tc, so you can start before or after you apply. The form takes about five minutes.');
  form.setRequireLogin(true);
  form.setCollectEmail(true);
  form.setLimitOneResponsePerUser(false);
  form.setAllowResponseEdits(true);
  form.setShowLinkToRespondAgain(false);
  form.setConfirmationMessage(
    'Thank you. CWSP has your registration, and a confirmation is on its way to your NC State email. ' +
    'Start any workbook at cwspwolf.com/c2tc. Questions go to Kirsti Cole, kkcole2@ncsu.edu.');

  form.addTextItem().setTitle('Your name').setRequired(true);
  form.addTextItem().setTitle('Department').setRequired(true);
  form.addMultipleChoiceItem()
    .setTitle('Faculty status')
    .setChoiceValues(['Tenure-track faculty', 'Professional-track faculty', 'Part-time faculty', 'Graduate student instructor'])
    .showOtherOption(true)
    .setRequired(true);
  form.addTextItem()
    .setTitle('Faculty ID')
    .setHelpText('Your NC State employee ID. CWSP uses it only to process the $500 mini-grant payment for beta participants.')
    .setRequired(true);
  form.addCheckboxItem()
    .setTitle('Which certificate or certificates do you plan to start?')
    .setChoiceValues([
      'Written Communication Instruction',
      'Digital Communication Instruction',
      'Oral Communication Instruction (in development, join the waitlist)'])
    .setRequired(true);
  form.addParagraphTextItem()
    .setTitle('What do you hope to gain from the program?')
    .setHelpText('Two or three sentences. Name a course you teach if one comes to mind.')
    .setRequired(true);

  var sheet = SpreadsheetApp.create(C2TC_APP.SHEET_TITLE);
  form.setDestination(FormApp.DestinationType.SPREADSHEET, sheet.getId());

  try {
    var participants = DriveApp.getFolderById(C2TC.PARTICIPANTS_FOLDER_ID);
    var parents = participants.getParents();
    if (parents.hasNext()) {
      var home = parents.next();
      DriveApp.getFileById(form.getId()).moveTo(home);
      DriveApp.getFileById(sheet.getId()).moveTo(home);
    }
  } catch (err) {
    Logger.log('Could not move the form and sheet beside the Participants folder: ' + err);
  }

  ScriptApp.newTrigger('C2TC_applicationReceived').forForm(form).onFormSubmit().create();
  props.setProperty(C2TC_APP.PROP_FORM_ID, form.getId());

  Logger.log('Form (edit): ' + form.getEditUrl());
  Logger.log('Form (public link for apply.html): ' + form.getPublishedUrl());
  Logger.log('Responses sheet: ' + sheet.getUrl());
  return form.getPublishedUrl();
}

/* Submit trigger. Emails the applicant a confirmation and sends Kirsti a copy. */
function C2TC_applicationReceived(e) {
  var email = e.response.getRespondentEmail();
  var answers = {};
  e.response.getItemResponses().forEach(function (r) {
    var v = r.getResponse();
    answers[r.getItem().getTitle()] = Array.isArray(v) ? v.join(', ') : String(v);
  });
  var name = answers['Your name'] || '';
  var certs = answers['Which certificate or certificates do you plan to start?'] || '';
  var first = name.split(/\s+/)[0] || 'there';

  if (email) {
    MailApp.sendEmail({
      to: email,
      replyTo: C2TC.REPLY_TO,
      name: 'NC State CWSP',
      subject: 'Your C²TC registration',
      body:
        'Hi ' + first + ',\n\n' +
        'CWSP has your C²TC registration for: ' + certs + '.\n\n' +
        'Every workbook is open now at ' + C2TC.SITE + '. Each module saves in your browser as you work, ' +
        'and "Save and email me a link" lets you continue on another computer.\n\n' +
        'Cohort session dates for the Spring 2027 cohort will come by email. If you are a beta participant, ' +
        'Kirsti will write separately about the mini-grant.\n\n' +
        'Questions go to Kirsti Cole, ' + C2TC.REPLY_TO + '.\n\n' +
        'NC State Campus Writing and Speaking Program'
    });
  }

  var lines = Object.keys(answers).map(function (k) {
    return k === 'Faculty ID' ? k + ': (in the responses sheet)' : k + ': ' + answers[k];
  });
  MailApp.sendEmail({
    to: C2TC.REPLY_TO,
    subject: 'New C²TC application: ' + name,
    body: 'From ' + (email || 'unknown email') + '\n\n' + lines.join('\n')
  });
}
