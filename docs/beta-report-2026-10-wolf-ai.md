# Beta Review: WOLF, AI Literacy, AI Policy

October 21, 2026. Run with docs/beta-review-playbook.md, in order: WOLF, then AI literacy, then AI policy. The three sections are reviewed as parts of one site, so flags that cross sections are collected at the end.

**Method**
- Read every page in the repo (main).
- Walked the live site in Chrome as each persona.
- Clicked every control that sends nothing: empty submits, empty previews, copy buttons, anchors.
- Read the code of controls that open dialogs or download files.
- Checked sharing on every linked Google file.
- No test submissions went to any endpoint.

Severity key: P0 blocks or misdirects. P1 breaks trust or blocks a deliverable. P2 friction. P3 polish.

---

## 1. WOLF

**Persona:** a department chair meeting CWSP for the first time, arriving at the homepage.

### Where the chair stalled
1. **(P0)** The homepage, About, and Get Started pages describe a course-level service. A CWSP liaison works with one faculty member over four to six sessions in a semester. The For Liaisons page describes a different program. A department faculty member is the liaison, the work runs two to three years on the Minnesota Writing-Enriched Curriculum model, and it ends in certification and a $1,000 mini grant. The chair cannot tell which program WOLF is, or who the liaison is.
2. **(P0)** The word "liaison" means two people:
   - About: liaisons are CWSP-trained faculty, graduate students, or staff.
   - Get Started: CWSP matches you with a liaison.
   - For Liaisons: the liaison is your own department's faculty member, and pedagogy expertise is CWSP's job.
3. **(P1)** The homepage card "Departments & programs: Audit communication across a curriculum" sends the chair to About, which describes course work. The department path lives on For Liaisons, two clicks away under a label a chair would not click.
4. **(P1)** "Schedule the first consultation" on For Liaisons opens Get Started. Get Started offers only an email address. Nothing schedules anything.
5. **(P2)** Get Started says your WSCP Working Template "records the work" and "You keep it." For Liaisons says the plan belongs to the department and the chair approves it.
6. **(P2)** The phase names match across pages, but the phases do not. On the homepage, Inquiry, Design, and Evidence are course tasks. In the workbook they are curriculum stages spanning years.

### Workbook (wolf-workbook.html)
| Item | Observation | Fix |
|---|---|---|
| Missing name on Submit **(P1)** | The page jumps to the name field. The explanation appears beside the Submit button, 7,000 pixels below. | Show the note on screen (the C²TC toast) |
| Required prompts **(P1)** | It jumps correctly to the first missing prompt. The reason sits 2,800 pixels below. | Same |
| Department required mark **(P2)** | Marked required but not enforced | Enforce it, or drop the mark |
| Progress **(P2)** | Counts all 49 stage textareas. Only 14 are required. | Count required prompts |
| Visible load **(P2)** | 64 text boxes, 14 required | "Go further" disclosure |
| Time **(P2)** | Activities state hours. Stages state none. | Add a time line per stage |
| Shared computers **(P2)** | No clear control | "Clear my work from this browser" |
| Resume link **(P3)** | No warning that anyone holding the link sees the draft | Same sentence as C²TC |
| Saved drafts **(P3)** | Every draft is filed under Stage 1, whatever stage is current | Send the current stage |
| Survey templates **(P2)** | "CWSP has survey templates" with no link | Link them, or say how to request them |
| Print **(P3)** | The print stylesheet hides the sidebar and nav. Works. | None |
| Empty states | "Copy inventory" and "Preview the plan" explain themselves when empty. Anchors all resolve. | None |

### Links and downloads
- All seven linked Google files (WOLF 01 to 05, the Policy Lab deck, the facilitation guide) are readable by anyone with the link.
- No broken internal links or anchors.

### Design
- **(P2)** The nav carries seven items with no menu button. On a phone it wraps to two or three rows above every page.
- **(P3)** The homepage C²TC card repeats itself: "three certificate tracks cover written, digital, and oral" appears twice in a row. This came from the October C²TC edit.

### Simplification
Decide what WOLF is on the front pages, then let every page say it the same way. One reading of the current pages: WOLF is the department program (the For Liaisons model), and course-level help is one way a department starts. If that is right, the homepage leads with departments, the liaison is defined once, and Get Started becomes a short intake form, matching C²TC.

---

## 2. AI literacy

**Persona:** a faculty member drafting a course AI policy the week before classes. Pages: AI Literacies, the framework (ai_literacy_unified.html), and the AI Literacies faculty workbook.

### Where the faculty member stalled
1. **(P1)** "Open the AI Literacies workbook" leaves the site. The workbook has no site header or nav, a different visual design (dark blocks), and no link back to WOLF. Its only link out goes to the framework.
2. **(P1)** The workbook submits to an anonymous research archive. It collects no name or email, sends no copy, and offers no "save and email me a link." The AI Literacies page says liaisons keep "a written record of each decision." For Liaisons says each stage is filed and emailed. A faculty member working with a liaison gets no record of submitting.
3. **(P2)** The Submit button stays disabled until five metadata fields and consent are filled. The page never says why.
4. **(P2)** A red "Clear All" button sits fixed at the bottom corner of every screen. One click and a confirm erases the whole workbook.
5. **(P2)** "Connect with a liaison" opens Get Started, which offers only an email address. The same gap as WOLF item 4.

### Workbook mechanics
| Item | Observation | Fix |
|---|---|---|
| Storage **(P1)** | Answers are saved under bare field IDs (f-1, a-stage). Any other page on cwspwolf.com using the same IDs reads and overwrites them. | Prefix the keys (the WOLF pattern, "wolf:") |
| Progress **(P2)** | Counts every field above 10 characters | Count required prompts |
| Endpoint **(P2)** | Posts to the policy project's Apps Script, not the CWSP pipeline | Decision 3 |

### Framework page
- The audience and checkpoint controls are real buttons with pressed states. They work by keyboard. The C²TC tester's open question is closed.
- It sits in the nav under AI Literacies, with breadcrumbs and an in-page menu.
- The citation now matches the C²TC string, and the DOI placeholder is gone.
- No flags.

---

## 3. AI policy

**Persona:** the same faculty member, moving from policy reading to drafting. Pages: AI Policy Lab, the policy repository workbook, the Unmediated Writer session page, and the AI Practice Adventure.

### Where the faculty member stalled
1. **(P2)** The Policy Lab page links the Unmediated Writer page as "Session page." That page appears in no nav and is not described on the Lab page. A reader cannot tell which session it belongs to.
2. **(P2)** "Print or save as PDF" in the policy workbook opens a popup window. With popups blocked, the participant gets a browser alert asking them to allow popups. The other workbooks print in place.
3. **(P2)** The repository submission is anonymous, like the AI Literacies archive. The page says so. It never says who reads the repository, or whether a submitter hears back.
4. **(P2)** The Adventure keeps answers in session storage. Closing the tab loses them. The Clear confirmation says to download the statement first. The opening screens do not.

### What works
- The policy workbook validates submissions with on-screen messages ("Each document needs an institution, a title, and a link." and "Nothing to send.").
- Its storage keys are prefixed.
- Its site header matches the rest of the site.
- The corpus modals close with Escape.
- The Lab's deck and facilitation guide are open to anyone with the link.

### Simplification
The Lab page, the workbook, and the Adventure each explain the four principles of functional policy, in slightly different words. One shared statement, quoted the same way on all three, would shorten each page and keep them from drifting apart.

---

## 4. Across the three sections

These flags only appear when the sections are read as one site.

1. **Five submission patterns.**

   | Section | Identity | Copy to participant | Save and email a link |
   |---|---|---|---|
   | C²TC (participant.js) | Yes | Emailed | Yes |
   | WOLF | Yes | Emailed | Yes |
   | AI Literacies workbook | Anonymous | None | No |
   | Policy repository | Anonymous | None | No |
   | Adventure | Anonymous | None | Session storage only |

   A faculty member who moves from C²TC to the AI workbook loses features without being told why.
2. **Five clear and reset patterns:**
   - C²TC: a sidebar link.
   - WOLF: none.
   - AI Literacies: a fixed red button.
   - Policy workbook: per-template "Clear."
   - Adventure: a confirm on restart.
3. **Two visual systems.** Every page uses the site header and the brand stylesheet except the AI Literacies workbook.
4. **One contact route.** Every "talk to us," "schedule," and "connect with a liaison" link ends at Kirsti's email. C²TC now has an intake form. WOLF and AI Literacies do not.
5. **The liaison definition** (WOLF item 2) carries into AI Literacies and the Policy Lab, which both say "liaisons facilitate."
6. **Two mini grants.** WOLF offers $1,000 per department and C²TC $500 per beta participant. The two pages never mention each other.
7. **The shared participant script** (c2tc/js/participant.js) already fixes most WOLF and AI Literacies mechanics flags: on-screen notes, Go further, clear control, sidebar identity. Moving those pages onto it fixes them at once, and future fixes reach every workbook.

---

## 5. Decisions for Kirsti

1. **What WOLF is.** Is it the department program on the For Liaisons page, the course-level service on the homepage, or both under one name with two entry points? *Blocks:* WOLF copy, the homepage, Get Started.
2. **Who the liaison is.** Is it CWSP-trained staff, or the department's own faculty member? If both, what is each called? *Blocks:* WOLF, AI Literacies, Policy Lab copy.
3. **AI Literacies submissions.** Should they stay an anonymous research archive, or become a participant record like WOLF, with an emailed copy and drafts? The workbook could also do both: an archive opt-in on top of a personal record. *Blocks:* the AI workbook rebuild and its endpoint.
4. **The AI Literacies workbook's design.** Bring it onto the site header and brand styles, or keep its separate look on purpose? *Blocks:* the rebuild.
5. **An intake form for WOLF and AI Literacies.** One form, like the C²TC application, or keep email? *Blocks:* Get Started and "Schedule the first consultation."
6. **The Unmediated Writer page.** Is it the Policy Lab session page, a standalone page, or retired? *Blocks:* nav and Lab copy.

---

## 6. Proposed batches

Each batch is one sitting, run in order and pushed to a branch. Batches 1, 2, and 6 wait on no decision.

1. **Copy that needs no decision.**
   - Remove the repeated C²TC card sentence.
   - Explain the disabled AI Literacies Submit button.
   - Tell Adventure readers on the first screen that closing the tab ends the session.
   - Link or explain the WOLF survey templates.
   - State a time line for each WOLF stage.
2. **WOLF workbook onto the shared participant script.**
   - On-screen notes.
   - Go further.
   - The clear control.
   - Progress counting required prompts only.
   - Department enforced.
   - Drafts filed by the current stage.
   - The resume warning.
3. **WOLF front pages,** after decisions 1, 2, and 5: one definition of the program and the liaison, the homepage department card, and Get Started.
4. **AI Literacies workbook,** after decisions 3 and 4:
   - The site header.
   - Prefixed storage keys.
   - The shared script.
   - The clear control moved into the sidebar.
   - The chosen submission model.
5. **Policy:**
   - Print in place.
   - One shared statement of the four principles.
   - The Unmediated Writer placement.
   - Who reads the repository.
6. **Design across the site:**
   - A menu button for the nav on phones.
   - An accessibility pass on wolf-workbook, CWSP_AI_Literacies_Workbook, ai-policy-workbook, and cyoa.
