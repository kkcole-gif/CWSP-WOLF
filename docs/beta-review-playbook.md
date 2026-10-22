# Beta Review Playbook for cwspwolf.com

How CWSP reviews a section of cwspwolf.com before participants use it, built from the October 2026 C²TC beta. Run it one section at a time: C²TC, WOLF, or the AI literacy and policy pages.

The process has six stages. Each stage ends in something concrete, so a review can stop after any stage and resume later.

1. Walk the section as a participant.
2. Flag what you find against the checklist.
3. Sort the flags and list the decisions only Kirsti can make.
4. Fix in small batches on a branch.
5. Verify before merging.
6. Release and confirm live.

---

## 1. Walk the section as a participant

Pick one persona and stay in it. For C²TC the persona was an instructional faculty member outside rhetoric, arriving from the homepage with no briefing. For WOLF, use a department chair or liaison meeting the program for the first time. For the AI pages, use a faculty member drafting a course AI policy the week before classes.

Record the walk in order, as "where I stalled." Each stall gets one line: what the persona expected, what happened, and a severity.

| Severity | Meaning |
|---|---|
| P0 | Blocks or misdirects a participant |
| P1 | Breaks trust, or makes a deliverable impossible to finish |
| P2 | Friction |
| P3 | Polish |

Scope the walk before starting. List every page, form, workbook, and script endpoint in the section, and note which you will test interactively. Do not send test submissions to a live endpoint without deciding to.

**Output:** a stall list in order, with severities.

---

## 2. Flag against the checklist

Go page by page. Each flag names the page, what the page says, what conflicts with it, and a proposed fix.

### Identity and naming
- [ ] One program name everywhere: title tags, header, body copy, footers, form titles, email subjects.
- [ ] Retired names gone. For C²TC, search the repo for RED-ACI, RED Core, Reflective Educational Design.
- [ ] One URL per destination: one CWSP link, one nav on every page in the section.
- [ ] Back links and Next links use one wording, and every module has a Next link.
- [ ] Headings on a module page match the title the certificate or program page gives it.
- [ ] One citation string per source, with no placeholder DOIs.

### Stale and contradictory facts
- [ ] Every date is current, or undated on purpose.
- [ ] Prerequisites, eligibility, and costs agree across pages.
- [ ] Time estimates add up from the parts, and one figure appears everywhere.
- [ ] Review and issuance processes agree. Nothing claims "automatic" where a person reviews.
- [ ] Standards are named at one version (WCAG 2.2 AA).
- [ ] Optional versus expected is stated once, without hedging between them.

### Entry and application
- [ ] The Apply or Start button opens the form the page describes, with the fields the page lists.
- [ ] The page says what applying does and what happens after.
- [ ] Sign-in requirements are stated under the button.
- [ ] Every field has a stated reason, especially IDs and payment details.
- [ ] A confirmation reaches the applicant and the coordinator.

### Completability
- [ ] Every deliverable a participant is told to finish can be finished with what the site provides.
- [ ] Every resource an activity names exists, is linked, and carries the name the repository gives it.
- [ ] Module work and capstone work submit separately.
- [ ] Sample materials exist for each track an activity sends participants to.

### Workbook mechanics
- [ ] The Save control is visible on the top bar and confirms with a time.
- [ ] Name and email are reachable from the top of the page.
- [ ] Required-prompt validation jumps to the first missing prompt in page order and shows its reason on screen.
- [ ] The length rule for required prompts is stated before failure.
- [ ] Builder previews say what is missing when empty.
- [ ] "Clear my work from this browser" exists for shared machines.
- [ ] Resume links state that anyone holding the link sees the draft.
- [ ] Network calls cannot report success silently. With `no-cors` fetches, an emailed copy is the proof of arrival, and the page says so.
- [ ] One success message and one consent sentence across the section.
- [ ] Progress counts required prompts only.

### Workload
- [ ] Count required prompts against visible text boxes per page. If the visible count runs far above the required count, collapse optional prompts under "Go further."
- [ ] Each module header splits activity time from reading time.
- [ ] Elective or stage requirements match what a beta participant can finish in the stated weeks.

### Review and capstone clarity
- [ ] Rubrics give full-weight and half-weight descriptors per part.
- [ ] Google Doc submissions include sharing instructions.
- [ ] A downloadable template exists.
- [ ] Events named in copy carry a date or a link.

### Repository and supporting files
- [ ] Item titles match file contents.
- [ ] Empty categories say when they open.
- [ ] Only CWSP-owned or licensed material is hosted. Commercial articles are cited, not posted.
- [ ] PDFs carry a CWSP header, a source line, and alt text.

### Accessibility
- [ ] Contrast passes on every control, top bars included.
- [ ] Alerts appear in the viewport, not off-screen.
- [ ] Skip links on every page.
- [ ] Interactive panels operate by keyboard.
- [ ] Run the accessibility-compliance skill over the heaviest pages before release.

### Deployment hygiene
- [ ] The tester saw what main holds. A cached or stale deployment produces false flags, so check main first.
- [ ] Site address constants in Apps Script match the live path (`SITE` in Routing.gs, `SITE_URL` in Code.gs).
- [ ] The Apps Script web app runs the latest saved code. Saving does not deploy. Publish a new version under Manage deployments.
- [ ] Moved pages leave redirect stubs that carry the query string, so emailed resume links survive.

**Output:** a flag list grouped by these headings.

---

## 3. Sort the flags and list decisions

Sort every flag into one of three kinds. The kind sets the order of work.

1. **Copy.** Stale or contradictory text. Fast to fix, and it removes most P0s.
2. **Missing pieces.** The site promises something the repo lacks. These usually wait on a decision.
3. **Mechanics.** Shared JavaScript and templates. One focused session fixes them everywhere.

Then write the decisions only Kirsti can make. Keep each to one line, and note what it blocks. October's list ran six items: elective policy, what applying does, the URL, the WCAG version, who the coordinator is, and whether sample materials existed. Answer these before the first commit.

**Output:** the three groups and the decision list.

---

## 4. Fix in small batches

Work on a branch, never on main. Size each batch to finish in one sitting, and commit each batch on its own so review stays readable.

Suggested order:

1. Copy fixes: prerequisites, dates, hours, issuance claims.
2. Naming pass across the repo.
3. Application or entry flow.
4. Structure: split submissions, missing links, missing resources.
5. Shared mechanics in the participant script and module CSS.
6. Endpoint behavior in Apps Script.
7. Template rebuilds for pages on an older pattern.
8. Capstone or final-deliverable support: templates, sharing, descriptors.
9. Repository and framework pages, then the accessibility pass.

Before changing any shared script, check how pages store work. C²TC keys saved drafts by file name, which let the folder move without losing anyone's work. Confirm the same for WOLF and the AI workbooks before moving or renaming them.

**Output:** a pushed branch and a pull request listing what changed and what waits outside the repo.

---

## 5. Verify before merging

- [ ] Internal link and anchor check across the whole site, including redirect stubs.
- [ ] Load every workbook in a simulated browser (jsdom), with layout calls stubbed, and confirm:
  - Save confirms with a time.
  - Sidebar identity mirrors the bottom fields.
  - Validation focuses the first missing prompt in page order and shows the toast.
  - Empty previews say what is missing.
  - Clear my work removes both key forms (`module-id` and `module:id`).
  - Go further hides no required prompt, and it reopens when it holds saved work.
  - No script errors on any page.
- [ ] Render any generated Word or PDF file and look at it.
- [ ] Grep new text for em dashes and banned phrasing.

**Output:** a test log attached to the pull request.

---

## 6. Release and confirm live

1. Merge the pull request.
2. Open the live section and confirm new text, using a hard reload if needed.
3. Open one old address and confirm the redirect, including a query string.
4. In each affected Apps Script project, save, then deploy a new version with a description of the change.
5. Submit each changed form once as a participant. Confirm every email arrives, then delete the test rows.
6. Update the Claude Project: the description, and file duplicates removed. Sessions receive only the 100 most recent files.

**Output:** a short release note with what is live and what remains.

---

## Section targets

### WOLF
- **Pages:** index.html (WOLF homepage), get-started.html, liaisons.html, wolf-workbook.html, about.html, unmediated-writer.html.
- **Endpoint:** wolf-workbook.html posts to the C²TC pipeline web app (deployment `AKfycbxNTj5…`). Stages arrive as `wolf-stage1` to `wolf-stage3`, and "Create a shared Google Doc" runs `C2TC_wolfDoc`. A WOLF fix touching Routing.gs needs a new deployment version, which also changes C²TC behavior. Test both.
- **Persona:** a department chair or liaison with no prior CWSP contact.
- **Flags to check first:**
  - Whether the workbook's three stages state their time.
  - Whether the WSCP output reads as a document a chair would sign.
  - Whether liaison names and Drive folders are current.
  - Whether the C²TC card on the homepage matches the C²TC section now.

### AI literacy and policy
- **Pages:** ai_literacy_unified.html (the framework), ai-literacies.html, CWSP_AI_Literacies_Workbook.html, ai-policy-lab.html, ai-policy-workbook.html, cyoa.html (AI Practice Adventure).
- **Endpoint:** ai-policy-workbook.html and cyoa.html post to a separate Apps Script project (deployment `AKfycbzAqe…`), handled by PolicyRepository.gs and AdventureBeta.gs. Find that project in Drive before testing. Its deployments are separate from the C²TC pipeline.
- **Persona:** a faculty member drafting a course AI policy the week before classes.
- **Flags to check first:**
  - The governance panel on the framework page, which was never keyboard-tested.
  - Whether the framework page is in the site nav.
  - Whether the four-option policy template, the policy lab, and the adventure agree on their options and their wording.
  - Whether each tool says where submissions go and who reads them.
  - Whether the framework citation matches the C²TC citation string.
