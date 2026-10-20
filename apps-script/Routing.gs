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
    if (where.component === 'Capstone') {
      payload.workbook_title = where.certificate.replace(' Certificate', '') + ' Communication Capstone';
    }
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

/* Layouts by workbook. Part 1 holds what the participant built for students, one piece
   per page. Part 2 holds their teaching notes, under headings in their own voice.
   Responses are never rewritten; only headings and framing lines are fixed text.
   Source: layouts.py in the C2TC review folder. */
var C2TC_LAYOUTS = {"wc-module1":{"notes_title":"My teaching notes","notes":[["Assumptions audit",[["f-a1-q1","What I assume students bring to my course"],["f-a1-q2","Where my standards for good writing come from"],["f-a1-q3","An expectation I had not stated"],["f-a1-q4","How my course handles writing now"],["f-a1-q5","One assignment, process or product"],["f-a1-reflection","What the audit showed me"]]],["Transfer map",[["f-a3-skills","Writing skills my course requires"],["f-a3-prior","Where students met them before"],["f-a3-explicit","What I will teach explicitly"],["f-a3-interference","Where earlier habits get in the way"]]],["Plans",[["f-a3-change","What I will change"],["f-a2-reflection","What I will give up to make room for low-stakes writing"]]]],"student_title":"Low-stakes writing for my students","student":[{"title":"Exit ticket","course":["f-a2-course"],"framing":"Take 3 to 5 minutes at the end of class.","blocks":[[["f-a2-activity1"],null]]},{"title":"Weekly reading response","course":["f-a2-course"],"framing":"One page or less, written outside class each week.","blocks":[[["f-a2-activity2"],null]]},{"title":"Reflection","course":["f-a2-course"],"framing":"Write for about 10 minutes.","blocks":[[["f-a2-activity3"],null]]}]},"wc-module2":{"notes_title":"My feedback notes","notes":[["Feedback types",[["f-a1-compare","What each feedback type asks of a student"],["f-a1-own","Feedback I gave recently, and how I would revise it"],["f-a1-barriers","What makes a shift in my practice hard"]]],["Screencast feedback",[["f-a2-experience","What recording feedback was like"],["f-a2-student","What the student said"],["f-a2-integrate","Where screencast feedback fits in my course"]]],["Rubric audit",[["f-a3-rubric","The rubric I audited"],["f-a3-audit","What the audit found"]]]],"student_title":"For my students","student":[{"title":"Revised rubric criterion","course":[],"framing":"This criterion describes what strong work does. Read it before you draft, and again before you revise.","blocks":[[["f-a3-redesign"],null]]}]},"wc-module3":{"notes_title":"My genre and assignment notes","notes":[["Genre analysis",[["f-a1-genre","The genre, and why it matters in my field"],["f-a1-purpose","What the genre does for its readers and writers"],["f-a1-features","Its features, and the purpose behind each"],["f-a1-invisible","What experts know that students do not yet"],["f-a1-teach","What this means for my teaching"]]],["Assignment reverse-engineering",[["f-a2-assignment","The assignment I analyzed"],["f-a2-dapoe","The assignment through DAPOE"],["f-a2-gaps","Where students go wrong, and why"],["f-a2-revised","One revision to the prompt"]]],["Capstone",[["cert-parta","Course description and writing context"],["cert-partb","Redesigned assignment sequence"],["cert-partc","Feedback and assessment plan"],["cert-partd","Reflective rationale"]]]],"student_title":"Assignment sheet","student":[{"title":"Assignment","course":["f-a3-context"],"framing":null,"blocks":[[["f-a3-discover"],"The task"],[["f-a3-ask"],"Who will read your writing"],[["f-a3-produce"],"Why this writing matters"],[["f-a3-own"],"What you will learn"],[["f-a3-evaluate"],"How your work will be assessed"],[["f-a3-scaffold"],"Steps before the final draft"]]}]},"wc-elective1":{"notes_title":"My multimodal analysis notes","notes":[["A multimodal text in my field",[["f-a1-text","The text"],["f-a1-rhetorical","What it does, and for whom"],["f-a1-modes","How its modes work together"],["f-a1-conventions","The conventions of my field it follows"],["f-a1-student","What students would need to learn to make one"]]]],"student_title":"Assignment sheet","student":[{"title_field":"art-title","title":"Multimodal assignment","course":["art-course"],"framing":null,"blocks":[[["art-task"],"The task"],[["art-reflection"],"Reflection"],[["art-criteria"],"How your work will be assessed"]]}]},"wc-elective2":{"notes_title":"My WAC planning notes","notes":[["Activity design",[["f-a1-course","Where the activity sits in my course"],["f-a1-type","Activity type and WAC category"],["f-a1-rationale","The learning it supports"]]],["Anticipating problems",[["f-a2-logistics","Logistical obstacles, and my plan for each"],["f-a2-obstacle","What might go wrong with the activity itself"],["f-a2-evidence","How I will know it is working"]]],["My WAC plan",[["art-title","Plan title"],["art-goals","Learning goals writing will serve"],["art-activities","Activities, timing, and grading"],["art-grading","How the activities count"],["art-evidence","How I will track their effect"]]]],"student_title":"For my students","student":[{"title":"Writing activity","course":["art-course","f-a1-course"],"framing":null,"blocks":[[["f-a1-prompt"],"Prompt"],[["f-a1-logistics"],"Time and format"],[["f-a1-grading"],"How this counts"]]}]},"wc-elective3":{"notes_title":"My AI and writing notes","notes":[["WITH and FOR: the same task twice",[["f-a1-with","Writing WITH AI: the decisions I kept"],["f-a1-for","Writing FOR AI: where my thinking stopped"],["f-a1-compare","What this means for assignment design"]]],["Redesign",[["f-a2-course","The course"],[["art-original","f-a2-original"],"The original assignment"],["f-a2-vulnerability","How a student could hand the work to AI"]]],["A case to think through",[["f-a3-policy","Whether my policy covers the case"],["f-a3-detect","What detection tools measure and miss"],["f-a3-response","How I would respond to the student"]]],["Reflection",[["art-reflection","What this elective changed or confirmed"]]]],"student_title":"For my students","student":[{"title":"Course AI policy","course":["art-course","f-a2-course"],"framing":"For the syllabus and the course site.","blocks":[[["art-policy","f-a2-policy"],null]]},{"title":"Assignment","course":["art-course","f-a2-course"],"framing":null,"blocks":[[["art-redesign","f-a2-redesign"],null]]}]},"wc-elective4":{"notes_title":"My notes on multilingual writers","notes":[["Reading three excerpts",[["f-a1-e1-rhetorical","Excerpt 1: what the writer does well"],["f-a1-e1-surface","Excerpt 1: surface features"],["f-a1-e1-response","Excerpt 1: my feedback, in order"],["f-a1-e2-rhetorical","Excerpt 2: the rhetorical moves"],["f-a1-e2-surface","Excerpt 2: transfer or rhetorical choice"],["f-a1-e2-asset","Excerpt 2: an asset-based reading"],["f-a1-e3-rhetorical","Excerpt 3: what the writer does well"],["f-a1-e3-minimal","Excerpt 3: minimal marking"]]],["My support plan",[["f-a2-course","The course"],["f-a2-genres","The genres my course requires"],["f-a2-asset-practices","Asset-based practices I will use"],["f-a2-marking","How I will handle surface error"],["f-a2-resources","Campus resources, built into the course"],["art-support-plan","Summary of my support plan"]]],["Responding to a writer",[["f-a3-excerpt","The excerpt I chose"],["f-a3-response","My response to the student"],["f-a3-reflect","What was hard about responding this way"],["art-reflection","What shifted in how I read multilingual writing"]]]],"student_title":"For my students","student":[{"title":"For multilingual writers in this course","course":["art-course","f-a2-course"],"framing":"For the syllabus and the course site.","blocks":[[["art-student-statement","f-a2-student-statement"],null]]}]},"dc-module1":{"notes_title":"My digital rhetoric notes","notes":[["A digital text in my field",[["f-a1-text","The text and its audience"],["f-a1-platform","What the platform does to it"],["f-a1-modal","Its modes"],["f-a1-rhetorical","Its appeals"],["f-a1-implications","What students would need to learn"]]],["Digital genres in my field",[["f-a2-genres","The main digital genres"],["f-a2-changes","How they have changed"],["f-a2-students","Where students learn them now"]]]],"student_title":"Assignment sheet","student":[{"title_field":"art-title","title":"Digital rhetorical analysis","course":["art-course"],"framing":null,"blocks":[[["art-context"],"Why you are doing this assignment"],[["art-task"],"The task"],[["art-modes"],"What your analysis must address"],[["art-reflection"],"Reflection"],[["art-criteria"],"How your work will be assessed"]]}]},"dc-module2":{"notes_title":"My assessment design notes","notes":[["Criteria for a digital project",[["f-a1-type","The project type"],["f-a1-rhetorical","Excellent rhetorical work"],["f-a1-content","Excellent disciplinary content"],["f-a1-technical","Excellent technical execution"],["f-a1-reflection-crit","An excellent reflection"],["f-a1-failures","Where students most often go wrong"]]],["Testing the framework",[["f-a2-strong","The stronger sample"],["f-a2-weak","The weaker sample"],["f-a2-revision","What I would revise in the framework"]]]],"student_title":"Assignment sheet","student":[{"title_field":"art-title","title":"Digital project","course":["art-course"],"framing":null,"blocks":[[["art-overview"],"Why you are doing this project"],[["art-task"],"The task"],[["art-type"],"Format"],[["art-audience"],"Audience and purpose"],[["art-rhetorical"],"How your project will be assessed: rhetorical effectiveness"],[["art-content"],"Disciplinary content"],[["art-technical"],"Technical execution"],[["art-reflection"],"Reflection"]]}]},"dc-module3":{"notes_title":"My AI literacy notes","notes":[["Conceptual inventory",[["f-a1-tools","The three tools"],["f-a1-t1","Tool 1"],["f-a1-t2","Tool 2"],["f-a1-t3","Tool 3"],["f-a1-reflection","What the inventories showed me"]]],["Structural analysis",[["f-a2-tool","The tool, and why I chose it"],["f-a2-hierarchies","Hierarchies it reproduces"],["f-a2-costs","Who bears the cost when it fails"],["f-a2-interests","Whose interests the design serves"],["f-a2-synthesis","What the analysis adds up to"]]],["My operative decision",[["f-a3-decision","The decision"],["f-a3-grounds","Its grounds"],["f-a3-conditions","Conditions or evidence I will watch"],["f-a3-rationale","Design rationale for the assignment"]]]],"student_title":"Assignment sheet","student":[{"title":"Assignment","course":[],"framing":null,"blocks":[[["f-a3-prompt"],"The task"],[["f-a3-criteria"],"How your work will be assessed"]]}]},"dc-elective1":{"notes_title":"My social media notes","notes":[["A post in my field",[["f-a1-content","The content"],["f-a1-rhetoric","Its claims, and how it makes them"],["f-a1-algorithm","Why the algorithm promotes it"],["f-a1-pedagogical","How I would use it in class"]]],["A platform decision",[["f-a2-platform","The platform, and how I use it"],["f-a2-hierarchies","Hierarchies its recommendations reproduce"],["f-a2-costs","Who bears the cost when it fails"],["f-a2-interests","Whose interests the design serves"],["f-a2-decision","My decision"],["f-a2-assignment","An assignment idea"]]]],"student_title":"Assignment sheet","student":[{"title_field":"art-title","title":"Social media analysis","course":["art-course"],"framing":null,"blocks":[[["art-overview"],"Overview"],[["art-task"],"The task"],[["art-platform"],"Platforms and content in scope"],[["art-ai"],"Using AI on this assignment"],[["art-criteria"],"How your work will be assessed"]]}]},"dc-elective2":{"notes_title":"My notes on digital ethics","notes":[["Structural analysis of a tool",[["f-a1-tool","The tool"],["f-a1-hierarchies","Hierarchies it reproduces"],["f-a1-costs","Who bears the cost when it fails"],["f-a1-interests","Whose interests the design serves"],["f-a1-synthesis","What the analysis shows"]]],["Governance case",[["f-a2-decision-path","The decision path in the case"],["f-a2-grounds","Its grounds"],["f-a2-conditions","Conditions or contingencies"]]],["My own decision",[["f-a2-own-decision","My decision on the tool"],["f-a2-own-grounds","Governance statement"],["f-a2-assignment","An assignment idea"]]]],"student_title":"Assignment sheet","student":[{"title_field":"art-title","title":"Structural analysis of a digital tool","course":["art-course"],"framing":null,"blocks":[[["art-overview"],"Overview"],[["art-task"],"The task"],[["art-operative"],"Your decision"],[["art-ai"],"Using AI on this assignment"],[["art-criteria"],"How your work will be assessed"]]}]},"dc-elective3":{"notes_title":"My accessibility notes","notes":[["Audit of a course asset",[["f-a1-asset","The asset"],["f-a1-technical","Technical accessibility"],["f-a1-communicative","Communicative accessibility"],["f-a1-revision","My revision plan"]]],["An AI accessibility tool",[["f-a2-tool","The tool"],["f-a2-hierarchies","Structural analysis"],["f-a2-operative","My decision and its conditions"]]],["Planning the assignment",[["f-a2-assignment","The assignment idea"],["f-a2-criteria","Accessibility as rhetorical criteria"],["f-a2-teach","What I need to teach first"]]]],"student_title":"Assignment sheet","student":[{"title_field":"art-title","title":"Accessible design","course":["art-course"],"framing":null,"blocks":[[["art-overview"],"Overview"],[["art-task"],"The task"],[["art-access-reqs"],"Accessibility requirements"],[["art-process"],"Process and checkpoints"],[["art-ai"],"Using AI on this assignment"],[["art-criteria"],"How your work will be assessed"]]}]},"dc-elective4":{"notes_title":"My multimodal design notes","notes":[["A multimodal text in my field",[["f-a1-text","The text"],["f-a1-modes","How its modes interact"],["f-a1-design","Its design choices"],["f-a1-conventions","Conventions it follows and breaks"],["f-a1-pedagogical","How I would use it in class"]]],["A generative AI tool",[["f-a2-tool","The tool"],["f-a2-structural","Structural analysis"],["f-a2-operative","When it belongs in my assignments"]]]],"student_title":"Assignment sheet","student":[{"title_field":"art-title","title":"Multimodal composition","course":["art-course"],"framing":null,"blocks":[[["art-overview"],"Overview"],[["art-task"],"The task"],[["art-modes"],"Modes and design"],[["art-process"],"Process and checkpoints"],[["art-resources"],"Resources"],[["art-ai"],"Using AI on this assignment"],[["art-criteria"],"How your work will be assessed"]]}]},"dc-capstone":{"notes_title":"Digital Communication capstone","notes":[["Capstone",[["cert-parta","Course and context"],["cert-partb","The assignment or module"],["cert-partc","Assessment and accessibility"],["cert-partd","Design rationale"]]]],"student_title":null,"student":[]}};

function C2TC_layoutKey_(p) {
  var m = String(p.module || '');
  return (p.submission_type === 'capstone' && m === 'dc-module3') ? 'dc-capstone' : m;
}

/* Value for a field id, accepting the "activity_" prefix the Module 3 capstone uses. */
function C2TC_val_(p, id) {
  var v = p[id];
  if (v === undefined) v = p['activity_' + id];
  return typeof v === 'string' ? v.trim() : '';
}

function C2TC_first_(p, ids) {
  for (var i = 0; i < (ids || []).length; i++) { var v = C2TC_val_(p, ids[i]); if (v) return v; }
  return '';
}

function C2TC_style_(par, bold, italic) {
  var t = par.editAsText();
  if (t.getText().length) { t.setBold(bold); t.setItalic(italic); }
  return par;
}

function C2TC_text_(body, text) {
  text.split(/\n+/).forEach(function (line) { C2TC_style_(body.appendParagraph(line), false, false); });
}

function C2TC_writeDoc_(title, who, where, p, when) {
  var doc = DocumentApp.create(title);
  var body = doc.getBody();
  body.setMarginTop(54).setMarginBottom(54).setMarginLeft(72).setMarginRight(72);
  var H = DocumentApp.ParagraphHeading;

  var first = body.getParagraphs()[0];
  first.setText(p.workbook_title || (where.certificate + ', ' + where.component));
  first.setHeading(H.TITLE);
  body.appendParagraph('C²TC · ' + where.certificate + ' · ' + where.component).setHeading(H.SUBTITLE);
  body.appendParagraph(who.name + ' · ' + who.email + ' · Submitted ' +
      Utilities.formatDate(when, 'America/New_York', 'MMMM d, yyyy'));

  var lay = C2TC_LAYOUTS[C2TC_layoutKey_(p)];
  var used = {};
  var mark = function (ids) { (Array.isArray(ids) ? ids : [ids]).forEach(function (i) { used[i] = true; }); };
  ['module', 'timestamp'].concat(C2TC.META_KEYS).forEach(function (k) { used[k] = true; });

  if (lay) {
    /* Part 1: student-facing pieces. */
    var pieces = (lay.student || []).filter(function (it) {
      return it.blocks.some(function (b) { return C2TC_first_(p, b[0]); });
    });
    if (pieces.length) {
      body.appendParagraph('Part 1. ' + lay.student_title).setHeading(H.HEADING1);
      C2TC_style_(body.appendParagraph('Each piece below is written to students and starts on its own page. ' +
          'Copy a page into your syllabus, course site, or slides.'), false, true);
      pieces.forEach(function (it) {
        body.appendPageBreak();
        var t = (it.title_field && C2TC_val_(p, it.title_field)) || it.title;
        C2TC_style_(body.appendParagraph(t).setHeading(H.HEADING2), false, false);
        var course = C2TC_first_(p, it.course);
        if (course) C2TC_style_(body.appendParagraph(course.split(/\n/)[0]), true, false);
        if (it.framing) C2TC_style_(body.appendParagraph(it.framing), false, true);
        it.blocks.forEach(function (b) {
          var v = C2TC_first_(p, b[0]);
          if (!v) return;
          if (b[1]) C2TC_style_(body.appendParagraph(b[1]).setHeading(H.HEADING3), false, false);
          C2TC_text_(body, v);
        });
      });
      (lay.student || []).forEach(function (it) {
        mark(it.course || []); if (it.title_field) mark(it.title_field);
        it.blocks.forEach(function (b) { mark(b[0]); });
      });
      body.appendPageBreak();
    }

    /* Part 2: teaching notes. */
    C2TC_style_(body.appendParagraph((pieces.length ? 'Part 2. ' : '') + lay.notes_title).setHeading(H.HEADING1), false, false);
    (lay.notes || []).forEach(function (sec) {
      var items = sec[1].filter(function (it) {
        return C2TC_first_(p, Array.isArray(it[0]) ? it[0] : [it[0]]);
      });
      sec[1].forEach(function (it) { mark(it[0]); });
      if (!items.length) return;
      body.appendParagraph(sec[0]).setHeading(H.HEADING2);
      items.forEach(function (it) {
        body.appendParagraph(it[1]).setHeading(H.HEADING3);
        C2TC_text_(body, C2TC_first_(p, Array.isArray(it[0]) ? it[0] : [it[0]]));
      });
    });
  }

  /* Anything the layout does not place (or every field, for a workbook with no layout). */
  var labels = p.field_labels || {}, sections = p.field_sections || {};
  var rest = Object.keys(p).filter(function (k) {
    var base = k.indexOf('activity_') === 0 ? k.slice(9) : k;
    return !used[k] && !used[base] && typeof p[k] === 'string' && p[k].trim() && base !== 'cert-doc-link';
  });
  if (rest.length) {
    body.appendParagraph(lay ? 'Other responses' : 'Responses').setHeading(lay ? H.HEADING2 : H.HEADING1);
    var current = null;
    rest.forEach(function (k) {
      var base = k.indexOf('activity_') === 0 ? k.slice(9) : k;
      if (!lay && sections[base] && sections[base] !== current) {
        current = sections[base];
        body.appendParagraph(current).setHeading(H.HEADING2);
      }
      body.appendParagraph(labels[base] || base).setHeading(H.HEADING3);
      C2TC_text_(body, p[k].trim());
    });
  }

  var link = C2TC_val_(p, 'cert-doc-link');
  if (link) {
    body.appendParagraph('Capstone document').setHeading(H.HEADING2);
    body.appendParagraph(link).setLinkUrl(link);
  }
  var shared = Object.keys(p).filter(function (k) { return /^repo-/.test(k) && p[k] === true; })
    .map(function (k) { return sections[k] || k.replace(/^repo-/, ''); });
  if (shared.length) {
    body.appendParagraph('Repository sharing').setHeading(H.HEADING2);
    body.appendParagraph('You agreed to share the themes of these activities with the C²TC Teaching Materials Repository: ' +
        shared.join(', ') + '.');
  }
  body.appendHorizontalRule();
  body.appendParagraph('Campus Writing and Speaking Program, NC State University. ' + C2TC.SITE).editAsText().setFontSize(9);

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
