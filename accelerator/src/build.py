"""Builds one combined AI literacy and AI policy workbook per unit from units/<slug>.json.

Run:  python3 build.py            (all units)
      python3 build.py sts        (one unit)
Each unit's page is written to accelerator/<slug>.html.
"""
import json, sys, html, pathlib

ROOT = pathlib.Path(__file__).parent
OUT = ROOT.parent  # pages are served from accelerator/, sources live in accelerator/src/
SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxNTj5zUq93DTE6M8zV73jibkZ4-rnYqhK5uHd8lNby9M62XzuXvttBMZTSAYTQWqTE/exec'
e = lambda s: html.escape(str(s or ''), quote=True)

PRODUCTS = [
    ('prod-outcome', 'Revised outcome',
     'Students will [act] [object] for [audience], and will state the reasons for their decisions about AI use in doing so.',
     'For an outcome naming only the thinking. Name the act, the object, the audience, and the student\'s accountability for AI decisions.'),
    ('prod-policy', 'Assignment-level AI policy',
     'Assignment: [ ].\nPermitted: [function].\nLimited: [function], because [ ].\nRefused: [function], because [ ].\nDisclosure: students note what was used and how, as a source is cited.\nAccommodation: [path, from the start].\nIn effect for [term]. Reviewed [date]. Revised when [trigger].',
     'Write one policy for each assignment, with its reason, since a general syllabus clause gives students no reason tied to the task.'),
    ('prod-rubric', 'Rubric criterion for reasoning about use',
     'Criteria: names the function used, gives reasons tied to the task, identifies what the output left out, states what the student did and why.\nLevels: [ ].',
     'The criterion grades the student\'s reasoning about use, so a student who refuses AI and gives reasons meets it.'),
    ('prod-philosophy', 'Program philosophy of use',
     'In [program], [acts] are the judgment the degree certifies. We [use, limit, refuse] AI for [acts] because [reasons grounded in the discipline]. Students are accountable for [ ]. Reviewed [when].',
     'One page recording the program\'s decisions and their reasons, kept as the Lab\'s written record.'),
]

GLOSSARY = [
    ('Learning outcome (as filed)', 'The statement a program submitted to the university\'s assessment system, quoted word for word.'),
    ('Baseline', 'CWSP\'s reading of the unit\'s filed outcomes, prepared before any session.'),
    ('Counted as communication', 'CWSP\'s code for an outcome naming writing, speaking, an audience, or visual and multimodal work.'),
    ('The act', 'What a student writes, says, builds, or presents where an outcome is assessed, such as a seminar paper, a literature review, or a capstone talk.'),
    ('The judgment the degree certifies', 'The part of an act faculty grade as evidence a student does the discipline\'s work, such as choosing which evidence matters.'),
    ('Model', 'A generative AI system, such as Gemini, Copilot, ChatGPT, or Claude, producing text from patterns in prior writing.'),
    ('Map', 'The record, for each outcome, of where students show it, who assesses it, what students do, and what a model does to the act.'),
    ('Lab', 'The AI Policy Lab sessions in February and March, where the working group decides.'),
    ('Use, Limit, Refuse', 'The three decisions the Lab records for each outcome, defined in Part 5.'),
    ('Product', 'The written result of a decision: a revised outcome, an assignment policy, a rubric criterion, or a program statement.'),
    ('Where the language breaks', 'A place in a policy where wording hedges, contradicts itself, or falls silent, which shows what its authors left unresolved.'),
    ('Department head', 'The head of the unit, who convenes the working group and names its recorder.'),
    ('Recorder', 'The working group member who keeps the unit\'s copy of this workbook and types for the group.'),
]

PRINCIPLES = [
    ('Scope terms by function', 'Define AI by what it does (generates text, produces images, automates tasks), since product names date within a term.'),
    ('Date the policy', 'State the term the policy covers and commit to revision.'),
    ('Name the revision trigger', 'Say what would prompt an update: new tools, new institutional guidance, or evidence of the policy producing the wrong outcomes.'),
    ('Separate principle from prohibition', 'State the commitment (what the program develops and assesses) apart from the rule (which functions are barred this term), because the commitment outlasts any one term\'s rule.'),
    ('Give the reason', 'A policy with its reason is easier to follow, and a later reviewer knows what to keep when the tools change.'),
]


def field(id_, label, hint='', rows=4, value='', req=False, placeholder=''):
    star = '<span class="req" aria-hidden="true">*</span>' if req else ''
    h = f'<p class="hint" id="{id_}-hint">{hint}</p>' if hint else ''
    desc = f' aria-describedby="{id_}-hint"' if hint else ''
    ph = f' placeholder="{e(placeholder)}"' if placeholder else ''
    return (f'<div class="field"><label for="{id_}">{label}{star}</label>{h}'
            f'<textarea id="{id_}" rows="{rows}"{desc}{ph} data-default="{e(value)}">{e(value)}</textarea></div>')


def short(t, n=120):
    return t if len(t) <= n else t[:n - 3].rsplit(' ', 1)[0] + '…'


def wrap(k, kind, title, body, collapse, prog):
    """One outcome card. Units with many outcomes get closed cards the reader opens one at a time."""
    if collapse:
        return (f'<details class="outcome" id="{kind}{k}" data-program="{e(prog)}"><summary>'
                f'<span class="o-text">{e(short(title))}</span><span class="o-state" id="{kind}{k}-state"></span></summary><div class="o-body">{body}</div></details>')
    return f'<section class="outcome" id="{kind}{k}" data-program="{e(prog)}" aria-labelledby="{kind}{k}-h"><h3 id="{kind}{k}-h">{'Outcome ' + str(k) if kind == 'o' else 'Outcome ' + str(k) + ': decision'}</h3>{body}</section>'


def outcome_block(i, o, n, collapse):
    k = i + 1
    body = f'''
    <dl class="asfiled">
      <div><dt>As filed</dt><dd class="filed">{e(o["text"])}</dd></div>
      <div><dt>Program</dt><dd>{e(o["program"])}</dd></div>
      <div><dt>Counted as communication</dt><dd>{e(o["counted"])}. {e(o["codes"])}</dd></div>
    </dl>
    <button type="button" class="btn-small" onclick="copyExample({k})">Start from the worked example</button>
    {field(f"m{k}-site", "1. Where do students show this outcome?", "Name the course and the assignment, for example a capstone paper in a 400-level course.", 2, o.get("site", ""))}
    {field(f"m{k}-who", "Who grades it?", "The instructor, a committee, a program review, or someone else.", 2)}
    {field(f"m{k}-act", "2. What do students produce or perform there?", "Describe the work in a sentence, for example a ten-page paper presented to the class. Where the outcome names only thinking (analyze, explain), this sentence supplies what it leaves out.", 3)}
    {field(f"m{k}-model", "3. What does an AI tool do with this kind of work?", "Use your notes from the exercise at the start of Part 3. Say what the tool did well and what it got wrong or left out, and, where EAB's findings on AI skills in your graduates' occupations apply, what they show.", 4)}'''
    return wrap(k, 'o', o['text'], body, collapse, o['program'])


def decision_block(i, o, collapse):
    k = i + 1
    body = f'''
    <p class="filed-small">{e(o["program"])}: {e(short(o["text"], 160))}</p>
    <p class="mirror" id="d{k}-act-mirror" aria-live="polite"></p>
    <div class="field"><label for="d{k}-decision">4. The decision</label>
      <select id="d{k}-decision"><option value="">Not yet decided</option><option>Use</option><option>Limit</option><option>Refuse</option></select><p class="hint">Use, Limit, and Refuse are defined above the first decision in Part 5.</p></div>
    {field(f"d{k}-reason", "Why, in your discipline's terms", "The Lab treats a decision as finished once it has a reason.", 4)}
    {field(f"d{k}-product", "What the decision becomes", "A revised outcome, a policy for one assignment, a rubric criterion, or a line in the program's statement.", 2)}
    {field(f"d{k}-owner", "Who writes it, and by when", "", 1)}'''
    return wrap(k, 'd', o['text'], body, collapse, o['program'])


def grouped(u, fn, kind):
    """Outcome cards under a heading per program, in the order the programs first appear."""
    progs = list(dict.fromkeys(o['program'] for o in u['outcomes']))
    collapse = len(u['outcomes']) > 6
    out = ''
    for p in progs:
        idx = [i for i, o in enumerate(u['outcomes']) if o['program'] == p]
        if len(progs) > 1:
            out += f'<h3 class="prog-h" id="{kind}-{slug(p)}" data-program="{e(p)}">{e(p)} <span class="prog-count">{len(idx)} outcome{"s" if len(idx) > 1 else ""}</span></h3>'
        out += ''.join(fn(i, u['outcomes'][i], collapse) for i in idx)
    return out


def slug(p):
    import re
    return re.sub(r'[^a-z0-9]+', '-', p.lower()).strip('-')


def policy_card(p):
    gov = f'<div><dt>Governs</dt><dd>{e(p["governs"])}</dd></div>' if p.get('governs') else ''
    return f'''
    <article class="policy">
      <h3 class="policy-h">{e(p["inst"])}</h3>
      <p class="policy-meta">{e(p["unit"])}{'' if p['peer'] == p['unit'] else ' · ' + e(p['peer'])}</p>
      <dl>
        <div><dt>Document</dt><dd><a href="{e(p["url"])}" target="_blank" rel="noopener">{e(p["doc"])}<span class="sr-only"> (opens in a new window)</span></a>, {e(p["date"])}</dd></div>
        {gov}
        <div><dt>What it says</dt><dd>{e(p["says"])}</dd></div>
        <div><dt>Where the language breaks</dt><dd>{e(p["glitch"])}</dd></div>
      </dl>
    </article>'''


def build(u):
    n = len(u['outcomes'])
    ex = u['example']
    outcomes_js = json.dumps([o['text'] for o in u['outcomes']])
    example_js = json.dumps({k: ex[k] for k in ('site', 'who', 'act', 'model')})
    progs = list(dict.fromkeys(o['program'] for o in u['outcomes']))
    if len(progs) > 1:
        nav_o = ''.join(f'<a href="#map-{slug(p)}" class="sub">{e(p)}</a>' for p in progs)
        nav_d = ''.join(f'<a href="#lab-{slug(p)}" class="sub">{e(p)}</a>' for p in progs)
    else:
        nav_o = ''.join(f'<a href="#o{i+1}" class="sub">Outcome {i+1}</a>' for i in range(n))
        nav_d = ''.join(f'<a href="#d{i+1}" class="sub">Outcome {i+1}</a>' for i in range(n))
    prog_rows = ''.join(f'<tr><th scope="row">{e(r["program"])}</th><td>{r["on_file"]}</td><td>{r["learning"]}</td><td>{r["counted"]}</td></tr>' for r in u['program_rows'])
    readings = ''.join(f'<p class="reading"><strong>{e(r["program"])}.</strong> {e(r["reading"])}</p>' for r in u['program_rows'])
    filt = ''
    filt_note = ''
    if len(progs) > 1:
        opts = ''.join(f'<option>{e(p)}</option>' for p in progs)
        filt = f'<div class="filter"><label for="prog-filter">Your program</label><select id="prog-filter" onchange="filterPrograms()"><option value="">Every program</option>{opts}</select><p class="hint">Choose the program you work on, and the map and the Lab show only its outcomes. Choose Every program to see the whole department. Downloads and the submission always include every program.</p></div>'
        filt_note = '<p class="small">The map shows the program chosen under <a href="#who">Who you are</a>.</p>'
    stuck = '<p class="stuck">Stuck on this part? Email Kirsti Cole at <a href="mailto:kkcole2@ncsu.edu">kkcole2@ncsu.edu</a>.</p>'
    glossary = ''.join(f'<div><dt>{e(t)}</dt><dd>{e(d)}</dd></div>' for t, d in GLOSSARY)
    base_rows = ''.join(f'<tr><td>{i+1}</td><td>{e(o["program"])}</td><td>{e(o["text"])}</td><td>{e(o["counted"])}</td><td>{e(o["codes"])}</td></tr>' for i, o in enumerate(u['outcomes']))
    base_open = '' if n > 6 else ' open'
    products = ''.join(f'''
    <div class="product">
      <h3>{e(name)}</h3>
      <p class="hint">{e(when)}</p>
      <div class="field"><label for="{pid}">Your text</label>
      <textarea id="{pid}" rows="5" data-frame="{e(frame)}"></textarea></div>
      <button type="button" class="btn-small" onclick="insertFrame('{pid}')">Insert the frame to fill in</button>
    </div>''' for pid, name, frame, when in PRODUCTS)
    principles = ''.join(f'<li><strong>{e(a)}.</strong> {e(b)}</li>' for a, b in PRINCIPLES)

    return f'''<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="robots" content="noindex, nofollow">
<title>{e(u["short"])} Accelerator Workbook | CHASS Curriculum Accelerator · NC State CWSP</title>
<link rel="stylesheet" href="css/workbook.css">
</head>
<body>
<a class="skip" href="#main">Skip to content</a>
<header class="site-header">
  <p class="brand">CWSP · NC State</p>
  <p class="brand-sub">CHASS Curriculum Accelerator · {e(u["unit"])}</p>
</header>

<div class="wb-layout">
<aside class="wb-sidebar" aria-label="Progress and sections">
  <div class="sidebar-save">
    <p class="sidebar-part">Your progress</p>
    <div class="progress-bar"><span id="progress-label">0%</span><span class="progress-track"><span class="progress-fill" id="progress-fill"></span></span></div>
    <p class="sidebar-lead">Progress counts the map and the decisions. This browser saves your work as you type.</p>
    <button type="button" class="btn-sidebar btn-primary-side" id="save-btn" onclick="saveDraft()">Save and email me a link</button>
    <p class="sidebar-status" id="save-status" role="status"></p>
    <details class="save-more">
      <summary>Other ways to keep a copy</summary>
      <button type="button" class="btn-sidebar" onclick="window.print()">Download as PDF, or print</button>
      <button type="button" class="btn-sidebar" onclick="downloadAnswers()">Download my answers (Word)</button>
      <button type="button" class="btn-sidebar" onclick="downloadRows()">Download worksheet rows (spreadsheet)</button>
      <p class="sidebar-help">The emailed link opens your work on any computer. The spreadsheet file holds one row per outcome, in the column order of the unit worksheet, ready to paste.</p>
      <button type="button" class="btn-clear" onclick="clearWork()">Clear my work from this browser</button>
    </details>
  </div>
  <nav aria-label="Workbook sections">
    <p class="sidebar-part">Start here</p>
    <a href="#produces">What your unit produces</a>
    <a href="#about">How this works</a>
    <a href="#terms">Terms used here</a>
    <a href="#who">Who you are</a>
    <p class="sidebar-part">1 · Literacy</p>
    <a href="#literacy">Three levels, in {e(u["short"])}</a>
    <p class="sidebar-part">2 · Baseline</p>
    <a href="#baseline">Your record</a>
    <p class="sidebar-part">3 · Map</p>
    <a href="#tryit">Try one assignment</a>
    <a href="#example">Worked example</a>
    {nav_o}
    <p class="sidebar-part">4 · Policy</p>
    <a href="#policy">What peers and the field say</a>
    <a href="#policy-read">Your reading</a>
    <p class="sidebar-part">5 · Lab</p>
    {nav_d}
    <a href="#products">Products</a>
    <p class="sidebar-part">Finish</p>
    <a href="#rows">Your worksheet rows</a>
    <a href="#submit">Submit to CWSP</a>
  </nav>
</aside>

<main class="wb-main" id="main">
  <p class="eyebrow">Campus Writing and Speaking Program · CHASS Curriculum Accelerator</p>
  <h1>{e(u["unit"])}: AI Literacy and Policy Workbook</h1>
  <p class="lede">This workbook is for the {e(u["short"])} working group and its department head, including members who have not worked on learning outcomes or AI policy before. Working through it, the group decides what the program does about AI for each of its learning outcomes, and CWSP has already filled in the unit's record and the policy research.</p>
  <div id="banner-slot"></div>

  <h2 id="produces">What your unit produces</h2>
  <p>By the end of March, the working group will have decided, for each of the unit's learning outcomes, whether students use AI in the work showing the outcome and why, and each decision becomes a short written product. CWSP prepared the finished example below from {e(u["short"])} as an illustration, which the group's own decisions replace:</p>
  <table class="example"><caption>One finished outcome, as an illustration</caption><tbody>
    <tr><th scope="row">The outcome as the program wrote it</th><td>{e(ex["outcome"])}</td></tr>
    <tr><th scope="row">What the group decided</th><td>{e(ex["decision"])} (students use AI only for named parts of the work)</td></tr>
    <tr><th scope="row">Why</th><td>{e(ex["reason"])}</td></tr>
    <tr><th scope="row">How the outcome reads now</th><td>{e(ex["revised"])}</td></tr>
  </tbody></table>
  <p>Besides revised outcomes, the group writes AI policies for single assignments, rubric criteria for grading how students reason about AI, and a one-page statement of the program's position. Part 5 gives a fill-in frame for each.</p>

  <h2 id="about">How this works</h2>
  <p>Every program files learning outcomes with the university, short statements of what its students learn. In this workbook the working group takes those outcomes one at a time and answers four questions about each:</p>
  <ol class="questions">
    <li>Where do students show this outcome? (the course and the assignment)</li>
    <li>What do students produce or perform there? (a paper, a talk, a lab report, a poster)</li>
    <li>What does an AI tool do with this kind of work?</li>
    <li>What should the program decide about AI for it, and why?</li>
  </ol>
  <p>Many outcomes name a kind of thinking, such as "analyze" or "explain," without saying what students write or present to show it. When an outcome says only "analyze," a grader has nothing specific to check, so a student's analysis and one an AI tool generated look much the same against the outcome. The second question supplies what such an outcome leaves out, which is why the questions come in this order.</p>
  <h3>The five parts, and when to do them</h3>
  <ol class="steps">
    <li><strong>Part 1, Literacy.</strong> Read CWSP's short account of AI in your discipline and answer three questions. <span class="time">About 20 minutes, before the first session.</span></li>
    <li><strong>Part 2, Baseline.</strong> Look over the outcomes your programs filed and CWSP's notes on them. <span class="time">About 10 minutes, before the first session.</span></li>
    <li><strong>Part 3, Map.</strong> Try one of your own assignments in an AI tool, then, in the January session, answer the first three questions for each outcome. <span class="time">Ten minutes before January, then the session.</span></li>
    <li><strong>Part 4, Policy.</strong> Read a short summary of what other departments and the field's organizations have decided. <span class="time">About {u["policy_minutes"]} minutes, before the first session.</span></li>
    <li><strong>Part 5, Lab.</strong> Answer the fourth question for each outcome, give the reason, and write up the decision. <span class="time">The Lab sessions, February and March.</span></li>
  </ol>
  <p>CWSP and your department head set the session dates. To submit, the group needs answers for at least one outcome in Part 3.</p>
  <h3>One recorder, one copy</h3>
  <p>Because the workbook saves in one web browser at a time, the department head names one recorder (often the head), who keeps the unit's copy and types for the group during and between sessions. Everyone else reads the same pages. Members who want to jot down answers before a session do so in their own browser, where no one else sees them until they bring them to the session. After each session the recorder downloads the rows at the end of the page and pastes them into the unit's <a href="{e(u["worksheet_url"])}" target="_blank" rel="noopener">Google Sheet<span class="sr-only"> (opens in a new window)</span></a>, which holds what the group agreed.</p>
  <details class="panel"><summary>How saving works</summary><div class="panel-body">
    <p>Everything typed here stays in this browser until someone clears it. To continue on another computer, or to hand the copy to a new recorder, select Save and email me a link, and whoever opens the link sees the copy as it was left. When the group finishes, Submit sends the workbook to CWSP and emails the recorder a copy.</p>
  </div></details>
  {stuck}

  <h2 id="terms">Terms used here</h2>
  <dl class="glossary">{glossary}</dl>

  <h2 id="who">Who you are</h2>
  <div class="activity">
    <div class="grid2">
      <div class="field"><label for="p-name">Your name<span class="req" aria-hidden="true">*</span></label><input type="text" id="p-name" autocomplete="name"></div>
      <div class="field"><label for="p-email">Your NC State email<span class="req" aria-hidden="true">*</span></label><input type="email" id="p-email" autocomplete="email" placeholder="unityid@ncsu.edu"></div>
      <div class="field"><label for="p-unit">Unit</label><input type="text" id="p-unit" value="{e(u["unit"])}" data-default="{e(u["unit"])}"></div>
      <div class="field"><label for="p-role">Your role</label>
        <select id="p-role"><option value="">Choose one</option><option>Recorder</option><option>Department head</option><option>Department head and recorder</option><option>Working group member</option><option>Facilitator</option><option>Other</option></select></div>
    </div>
    <div class="field"><label for="p-others">The unit's recorder and others contributing to this copy</label><input type="text" id="p-others" placeholder="Names, separated by commas"></div>
    {filt}
  </div>

  <h2 id="literacy"><span class="part">Part 1 · Literacy</span>Three levels, in {e(u["short"])}</h2>
  <p class="time">About 20 minutes, before the first session.</p>
  <p>CWSP's framework reads AI at three levels, taken in order: describe what the system is and what it does to an act, analyze whose interests and labor it carries and what it leaves out, and decide what the program does about it. Above each prompt is CWSP's reading of the level in your discipline, which the working group corrects wherever it misdescribes the field.</p>
  <div class="level"><h3>Describe</h3><p class="reading">{e(u["literacy"]["describe"])}</p>
    {field("lit-acts", "Name the acts your outcomes ask of students", "List what students write, say, build, or present in the program, such as a seminar paper, a poster, a lab report, or a capstone talk. These acts return in Part 3, one per outcome.", 3)}</div>
  <div class="level"><h3>Analyze</h3><p class="reading">{e(u["literacy"]["analyze"])}</p>
    {field("lit-analyze", "What does a model carry into those acts, and what does it leave out?", "A sentence or two is enough. The exercise at the start of Part 3 gives the group evidence for this answer.", 3)}</div>
  <div class="level"><h3>Decide</h3><p class="reading">{e(u["literacy"]["decide"])}</p>
    {field("lit-certify", "Which acts are the judgment the degree certifies?", "Name two or three, which the Lab returns to. See Terms used here for what the phrase means.", 3)}</div>
  {stuck}

  <h2 id="baseline"><span class="part">Part 2 · Baseline</span>Your record</h2>
  <p class="time">About 10 minutes, before the first session.</p>
  <p>CWSP read every learning outcome the unit's programs filed with the university (SLO_Coded_2026, the coded export of the university assessment system, read under the CWSP Codebook 2026). {e(u["programs"])}. Because the codebook counts what the filed outcomes document, silence in the record shows what the outcomes leave unwritten and nothing about what the courses teach.</p>
  <details class="panel"><summary>How the codebook counts</summary><div class="panel-body">
    <p>CWSP counts an outcome as documenting communication when the outcome, or the objective above it, names explicit communication (write, present, audience, rhetoric) or visual and multimodal work (visual, media, design). Genres (thesis, report), curricular sites (capstone, conference), and cognitive verbs (analyze, explain) are recorded and never counted, since each names a product, a place, or a kind of thinking without the act in which a student communicates it.</p>
  </div></details>
  <table class="counts"><caption>Counts by program</caption>
    <thead><tr><th scope="col">Program</th><th scope="col">Statements on file</th><th scope="col">Learning outcomes</th><th scope="col">Counted as communication</th></tr></thead>
    <tbody>{prog_rows}</tbody></table>
  <h3>CWSP's reading</h3>
  {readings}
  <details class="panel"{base_open}><summary>Every outcome as filed ({n})</summary><div class="panel-body table-wrap" tabindex="0" role="region" aria-label="Every outcome as filed">
  <table class="baseline"><caption>Outcomes as filed</caption>
    <thead><tr><th scope="col">Row</th><th scope="col">Program</th><th scope="col">Outcome as filed</th><th scope="col">Counted</th><th scope="col">How the codebook reads it</th></tr></thead>
    <tbody>{base_rows}</tbody></table></div></details>
  <p class="small">Full baseline: <a href="{e(u["baseline_url"])}" target="_blank" rel="noopener">CWSP Unit Baseline, {e(u["short"])}<span class="sr-only"> (opens in a new window)</span></a>.</p>
  {field("base-hold", "Does the reading hold?", "Say where the reading matches the program you teach and where it misses.", 3)}
  {stuck}

  <h2 id="tryit"><span class="part">Part 3 · Map</span>Try one assignment</h2>
  <p class="time">About ten minutes, before the January session.</p>
  <p>Before mapping, each member tries one of their own assignments in the AI tool NC State provides (Gemini, signed in with your NC State account, or another tool on OIT's approved list, so the prompt stays within university data protections). Paste the assignment prompt as students receive it, read what comes back, and note what the response does well and what it gets wrong or leaves out for your discipline. The group brings these notes to the January session, where they become evidence for the column on what a model does to the act.</p>
  {field("try-prompt", "The assignment you tried", "Name the course and paste or summarize the prompt.", 3)}
  {field("try-output", "What came back", "Describe the response in a few sentences, or paste a short excerpt.", 4)}
  {field("try-missing", "What the response got wrong or left out", "For example, the reasoning your discipline grades, sources it invented, or the audience it ignored.", 3)}

  <h2 id="example">Worked example</h2>
  <p>The row below answers the four questions for one {e(u["short"])} outcome, the way the working group will answer them for its own. Read it before mapping, and use the button above each outcome to copy its first three answers in as a starting point.</p>
  <table class="example"><caption>Worked example: the four questions for one outcome</caption><tbody>
    <tr><th scope="row">The outcome as filed</th><td>{e(ex["outcome"])}</td></tr>
    <tr><th scope="row">Counted as communication in the record?</th><td>{e(ex["counted"])}</td></tr>
    <tr><th scope="row">1. Where students show it</th><td>{e(ex["site"])}</td></tr>
    <tr><th scope="row">Who grades it</th><td>{e(ex["who"])}</td></tr>
    <tr><th scope="row">2. What students produce there</th><td>{e(ex["act"])}</td></tr>
    <tr><th scope="row">3. What an AI tool does with this work</th><td>{e(ex["model"])}</td></tr>
    <tr><th scope="row">4. The decision (made in the Lab)</th><td>{e(ex["decision"])}</td></tr>
    <tr><th scope="row">Why</th><td>{e(ex["reason"])}</td></tr>
    <tr><th scope="row">How the outcome reads now</th><td>{e(ex["revised"])}</td></tr>
  </tbody></table>
  {filt_note}
  <p>In the January session, answer the first three questions for each outcome below. Do the first outcome together, with the facilitator, before dividing the rest. The Start from the worked example button copies the example's answers into any empty boxes, where the group rewrites them for the outcome at hand.</p>
  {grouped(u, lambda i, o, c: outcome_block(i, o, n, c), 'map')}
  {stuck}

  <h2 id="policy"><span class="part">Part 4 · Policy</span>What peers and the field say</h2>
  <p class="time">About {u["policy_minutes"]} minutes, before the first session.</p>
  <p>These readings let the working group see what other departments and the field's societies have written, and where their wording created problems for the people following it, so the unit's own statement avoids the same problems.</p>
  <p class="reading"><strong>In brief.</strong> {e(u["plain_finding"])}</p>
  <details class="panel"><summary>The full finding and each document ({len(u["policies"])})</summary><div class="panel-body">
    <p>{e(u["policy_intro"])}</p>
    <p class="reading">{e(u["policy_finding"])}</p>
    <div class="policies">{''.join(policy_card(p) for p in u["policies"])}</div>
  </div></details>
  <details class="panel"><summary>How to read a policy for where its language breaks</summary><div class="panel-body">
    <p>When authors write governance documents under institutional pressure, the language records more than they intended. Look for hedging (strongly discouraged), contradictions between sections or between two documents on one campus, silences where governance should be explicit, frameworks borrowed beyond their scope, and dates (language accurate when written and no longer true). The full method and the AI Governance Census are in the <a href="https://cwspwolf.com/ai-policy-workbook.html" target="_blank" rel="noopener">AI Policy Workbook<span class="sr-only"> (opens in a new window)</span></a>.</p>
  </div></details>
  <h3 id="policy-read">Your reading</h3>
  {field("pol-nearest", "Which document comes nearest to what your program would write, and why?", "Open the full finding above to see each document.", 3)}
  {field("pol-break", "Where does one of these documents break, in your reading?", "Choose one and name the sentence. The panel above lists what to look for.", 3)}
  {field("pol-genre", "What form should your unit's statement take?", "A set of rules, a clause added to an existing policy, a statement of principle, a policy for each assignment, or something else.", 3)}
  {stuck}

  <h2 id="lab"><span class="part">Part 5 · Lab</span>Decisions</h2>
  <p class="time">The Lab sessions, February and March.</p>
  {'<p class="small">The program chosen under Who you are applies here as well.</p>' if len(progs) > 1 else ''}
  <p>In the Lab, the group answers the fourth question for each outcome: a decision, the reason in the discipline's terms, and what the decision becomes in writing. The Lab counts refusal with a reason as a decision. The answer to question 2 from Part 3 appears above each decision for reference.</p>
  <dl class="decisions">
    <div><dt>Use</dt><dd>Students are permitted to use AI for the act, and they disclose what the tool did.</dd></div>
    <div><dt>Limit</dt><dd>Students are permitted to use AI for named parts of the act, do the rest themselves, and state what the tool supplied.</dd></div>
    <div><dt>Refuse</dt><dd>Students do the act without AI, and the program states its reason.</dd></div>
  </dl>
  {grouped(u, decision_block, 'lab')}

  <h2 id="products">Products</h2>
  <p>Each decision becomes one of four products. Insert a frame, then rewrite it in your program's words.</p>
  <details class="panel"><summary>Five principles for durable policy language</summary><div class="panel-body"><ol>{principles}</ol></div></details>
  {products}
  {stuck}

  <h2 id="rows">Your worksheet rows</h2>
  <p>The table assembles the map and the decisions in the column order of the unit worksheet. After each session, the recorder refreshes it, downloads it, and pastes the rows into the Google Sheet.</p>
  <button type="button" class="btn-small" onclick="renderRows()">Refresh the table</button>
  <button type="button" class="btn-small" onclick="downloadRows()">Download as spreadsheet</button>
  <div id="rows-table" class="table-wrap" tabindex="0" role="region" aria-label="Your worksheet rows"></div>

  <h2 id="submit">Submit to CWSP</h2>
  <div class="activity">
    {field("sub-notes", "Anything CWSP should know before the next session", "", 3)}
    <div class="consent">
      <input type="checkbox" id="p-permission">
      <label for="p-permission">CWSP has my permission to use what I submit, without my name, in its reports to CHASS and the AI Hub working group, in presentations and publications about the Accelerator, and as examples for other units. I withdraw this permission at any time by emailing kkcole2@ncsu.edu.</label>
    </div>
    <p class="hint">If the box stays empty, the submission still reaches CWSP, which then uses it only to support your unit.</p>
    <button type="button" class="btn-submit" id="submit-btn" onclick="submitWork()">Submit to CWSP</button>
    <p class="req-note" id="req-note" role="alert"></p>
    <p class="submit-status" id="submit-status" role="status"></p>
  </div>
</main>
</div>

<footer class="site-footer">
  <p>The CHASS Curriculum Accelerator is supported by the <a href="https://go.ncsu.edu/cwsp" target="_blank" rel="noopener">NC State Campus Writing and Speaking Program<span class="sr-only"> (opens in a new window)</span></a> · <a href="mailto:kkcole2@ncsu.edu">kkcole2@ncsu.edu</a></p>
</footer>

<script>
const SCRIPT_URL = '{SCRIPT_URL}';
const KEY = 'acc-{u["slug"]}:';
const MODULE = '{u["module"]}';
const UNIT = {json.dumps(u["unit"])};
const OUTCOMES = {outcomes_js};
const EXAMPLE = {example_js};
</script>
<script src="js/workbook.js"></script>
</body>
</html>
'''


if __name__ == '__main__':
    want = sys.argv[1:] or [p.stem for p in (ROOT / 'units').glob('*.json')]
    for name in want:
        u = json.loads((ROOT / "units" / f"{name}.json").read_text())
        (OUT / f"{name}.html").write_text(build(u))
        print("wrote", name + ".html")
