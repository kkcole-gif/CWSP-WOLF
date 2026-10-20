# C2TC participant copy layouts: one entry per workbook.
# notes: Part 1, instructor-facing, headings in the participant's own voice.
# student: Part 2, student-facing pieces, each on its own page.
#   course: field id(s) whose text names the course (first non-empty wins)
#   framing: a fixed line written once for the activity type (Kirsti reviews)
#   blocks: (field ids in fallback order, student-facing subhead or None)
import json

L = {}

L['wc-module1'] = {
 'notes_title': 'My teaching notes',
 'notes': [
  ('Assumptions audit', [
    ('f-a1-q1', 'What I assume students bring to my course'),
    ('f-a1-q2', 'Where my standards for good writing come from'),
    ('f-a1-q3', 'An expectation I had not stated'),
    ('f-a1-q4', 'How my course handles writing now'),
    ('f-a1-q5', 'One assignment, process or product'),
    ('f-a1-reflection', 'What the audit showed me')]),
  ('Transfer map', [
    ('f-a3-skills', 'Writing skills my course requires'),
    ('f-a3-prior', 'Where students met them before'),
    ('f-a3-explicit', 'What I will teach explicitly'),
    ('f-a3-interference', 'Where earlier habits get in the way')]),
  ('Plans', [
    ('f-a3-change', 'What I will change'),
    ('f-a2-reflection', 'What I will give up to make room for low-stakes writing'),
    ('f-a2-commit', 'My commitment: the activity I will use first, and when')])],
 'student_title': 'Low-stakes writing for my students',
 'student': [
  {'title': 'Exit ticket', 'course': ['f-a2-course'],
   'framing': 'Take 3 to 5 minutes at the end of class.',
   'blocks': [(['f-a2-activity1'], None)]},
  {'title': 'Weekly reading response', 'course': ['f-a2-course'],
   'framing': 'One page or less, written outside class each week.',
   'blocks': [(['f-a2-activity2'], None)]},
  {'title': 'Reflection', 'course': ['f-a2-course'],
   'framing': 'Write for about 10 minutes.',
   'blocks': [(['f-a2-activity3'], None)]}]}

L['wc-module2'] = {
 'notes_title': 'My feedback notes',
 'notes': [
  ('Feedback types', [
    ('f-a1-compare', 'What each feedback type asks of a student'),
    ('f-a1-own', 'Feedback I gave recently, and how I would revise it'),
    ('f-a1-barriers', 'What makes a shift in my practice hard')]),
  ('Screencast feedback', [
    ('f-a2-experience', 'What recording feedback was like'),
    ('f-a2-student', 'What the student said'),
    ('f-a2-integrate', 'Where screencast feedback fits in my course'),
    ('f-a2-commit', 'My commitment: where I will use screencast response next')]),
  ('Rubric audit', [
    ('f-a3-rubric', 'The rubric I audited'),
    ('f-a3-audit', 'What the audit found')])],
 'student_title': 'For my students',
 'student': [
  {'title': 'Revised rubric criterion', 'course': [],
   'framing': 'This criterion describes what strong work does. Read it before you draft, and again before you revise.',
   'blocks': [(['f-a3-redesign'], None)]}]}

L['wc-module3'] = {
 'notes_title': 'My genre and assignment notes',
 'notes': [
  ('Genre analysis', [
    ('f-a1-genre', 'The genre, and why it matters in my field'),
    ('f-a1-purpose', 'What the genre does for its readers and writers'),
    ('f-a1-features', 'Its features, and the purpose behind each'),
    ('f-a1-invisible', 'What experts know that students do not yet'),
    ('f-a1-teach', 'What this means for my teaching')]),
  ('Assignment reverse-engineering', [
    ('f-a2-assignment', 'The assignment I analyzed'),
    ('f-a2-dapoe', 'The assignment through DAPOE'),
    ('f-a2-gaps', 'Where students go wrong, and why'),
    ('f-a2-revised', 'One revision to the prompt')]),
  ('Teaching the new assignment', [
    ('f-a3-commit', 'My commitment: where and when I will assign it')]),
  ('Capstone', [
    ('cert-parta', 'Course description and writing context'),
    ('cert-partb', 'Redesigned assignment sequence'),
    ('cert-partc', 'Feedback and assessment plan'),
    ('cert-partd', 'Reflective rationale'),
    ('cert-elective-use', 'Elective work I will use, and where')])],
 'student_title': 'Assignment sheet',
 'student': [
  {'title': 'Assignment', 'course': ['f-a3-context'], 'framing': None,
   'blocks': [
    (['f-a3-discover'], 'The task'),
    (['f-a3-ask'], 'Who will read your writing'),
    (['f-a3-produce'], 'Why this writing matters'),
    (['f-a3-own'], 'What you will learn'),
    (['f-a3-evaluate'], 'How your work will be assessed'),
    (['f-a3-scaffold'], 'Steps before the final draft')]}]}

L['wc-elective1'] = {
 'notes_title': 'My multimodal analysis notes',
 'notes': [
  ('A multimodal text in my field', [
    ('f-a1-text', 'The text'),
    ('f-a1-rhetorical', 'What it does, and for whom'),
    ('f-a1-modes', 'How its modes work together'),
    ('f-a1-conventions', 'The conventions of my field it follows'),
    ('f-a1-student', 'What students would need to learn to make one')])],
 'student_title': 'Assignment sheet',
 'student': [
  {'title_field': 'art-title', 'title': 'Multimodal assignment', 'course': ['art-course'], 'framing': None,
   'blocks': [
    (['art-task'], 'The task'),
    (['art-reflection'], 'Reflection'),
    (['art-criteria'], 'How your work will be assessed')]}]}

L['wc-elective2'] = {
 'notes_title': 'My WAC planning notes',
 'notes': [
  ('Activity design', [
    ('f-a1-course', 'Where the activity sits in my course'),
    ('f-a1-type', 'Activity type and WAC category'),
    ('f-a1-rationale', 'The learning it supports')]),
  ('Anticipating problems', [
    ('f-a2-logistics', 'Logistical obstacles, and my plan for each'),
    ('f-a2-obstacle', 'What might go wrong with the activity itself'),
    ('f-a2-evidence', 'How I will know it is working')]),
  ('My WAC plan', [
    ('art-title', 'Plan title'),
    ('art-goals', 'Learning goals writing will serve'),
    ('art-activities', 'Activities, timing, and grading'),
    ('art-grading', 'How the activities count'),
    ('art-evidence', 'How I will track their effect')])],
 'student_title': 'For my students',
 'student': [
  {'title': 'Writing activity', 'course': ['art-course', 'f-a1-course'], 'framing': None,
   'blocks': [
    (['f-a1-prompt'], 'Prompt'),
    (['f-a1-logistics'], 'Time and format'),
    (['f-a1-grading'], 'How this counts')]}]}

L['wc-elective3'] = {
 'notes_title': 'My AI and writing notes',
 'notes': [
  ('WITH and FOR: the same task twice', [
    ('f-a1-with', 'Writing WITH AI: the decisions I kept'),
    ('f-a1-for', 'Writing FOR AI: where my thinking stopped'),
    ('f-a1-compare', 'What this means for assignment design')]),
  ('Redesign', [
    ('f-a2-course', 'The course'),
    (['art-original', 'f-a2-original'], 'The original assignment'),
    ('f-a2-vulnerability', 'How a student could hand the work to AI')]),
  ('A case to think through', [
    ('f-a3-policy', 'Whether my policy covers the case'),
    ('f-a3-detect', 'What detection tools measure and miss'),
    ('f-a3-response', 'How I would respond to the student')]),
  ('Reflection', [
    ('art-reflection', 'What this elective changed or confirmed')])],
 'student_title': 'For my students',
 'student': [
  {'title': 'Course AI policy', 'course': ['art-course', 'f-a2-course'],
   'framing': 'This applies to all work in this course.',
   'blocks': [(['art-policy', 'f-a2-policy'], None)]},
  {'title': 'Assignment', 'course': ['art-course', 'f-a2-course'], 'framing': None,
   'blocks': [(['art-redesign', 'f-a2-redesign'], None)]}]}

L['wc-elective4'] = {
 'notes_title': 'My notes on multilingual writers',
 'notes': [
  ('Reading three excerpts', [
    ('f-a1-e1-rhetorical', 'Excerpt 1: what the writer does well'),
    ('f-a1-e1-surface', 'Excerpt 1: surface features'),
    ('f-a1-e1-response', 'Excerpt 1: my feedback, in order'),
    ('f-a1-e2-rhetorical', 'Excerpt 2: the rhetorical moves'),
    ('f-a1-e2-surface', 'Excerpt 2: transfer or rhetorical choice'),
    ('f-a1-e2-asset', 'Excerpt 2: an asset-based reading'),
    ('f-a1-e3-rhetorical', 'Excerpt 3: what the writer does well'),
    ('f-a1-e3-minimal', 'Excerpt 3: minimal marking')]),
  ('My support plan', [
    ('f-a2-course', 'The course'),
    ('f-a2-genres', 'The genres my course requires'),
    ('f-a2-asset-practices', 'Asset-based practices I will use'),
    ('f-a2-marking', 'How I will handle surface error'),
    ('f-a2-resources', 'Campus resources, built into the course'),
    ('art-support-plan', 'Summary of my support plan')]),
  ('Responding to a writer', [
    ('f-a3-excerpt', 'The excerpt I chose'),
    ('f-a3-response', 'My response to the student'),
    ('f-a3-reflect', 'What was hard about responding this way'),
    ('art-reflection', 'What shifted in how I read multilingual writing')])],
 'student_title': 'For my students',
 'student': [
  {'title': 'For multilingual writers in this course', 'course': ['art-course', 'f-a2-course'],
   'framing': None,
   'blocks': [(['art-student-statement', 'f-a2-student-statement'], None)]}]}

L['dc-module1'] = {
 'notes_title': 'My digital rhetoric notes',
 'notes': [
  ('A digital text in my field', [
    ('f-a1-text', 'The text and its audience'),
    ('f-a1-platform', 'What the platform does to it'),
    ('f-a1-modal', 'Its modes'),
    ('f-a1-rhetorical', 'Its appeals'),
    ('f-a1-implications', 'What students would need to learn')]),
  ('Digital genres in my field', [
    ('f-a2-genres', 'The main digital genres'),
    ('f-a2-changes', 'How they have changed'),
    ('f-a2-students', 'Where students learn them now')])],
 'student_title': 'Assignment sheet',
 'student': [
  {'title_field': 'art-title', 'title': 'Digital rhetorical analysis', 'course': ['art-course'], 'framing': None,
   'blocks': [
    (['art-context'], 'Why you are doing this assignment'),
    (['art-task'], 'The task'),
    (['art-modes'], 'What your analysis must address'),
    (['art-reflection'], 'Reflection'),
    (['art-criteria'], 'How your work will be assessed')]}]}

L['dc-module2'] = {
 'notes_title': 'My assessment design notes',
 'notes': [
  ('Criteria for a digital project', [
    ('f-a1-type', 'The project type'),
    ('f-a1-rhetorical', 'Excellent rhetorical work'),
    ('f-a1-content', 'Excellent disciplinary content'),
    ('f-a1-technical', 'Excellent technical execution'),
    ('f-a1-reflection-crit', 'An excellent reflection'),
    ('f-a1-failures', 'Where students most often go wrong')]),
  ('Testing the framework', [
    ('f-a2-strong', 'The stronger sample'),
    ('f-a2-weak', 'The weaker sample'),
    ('f-a2-revision', 'What I would revise in the framework')])],
 'student_title': 'Assignment sheet',
 'student': [
  {'title_field': 'art-title', 'title': 'Digital project', 'course': ['art-course'], 'framing': None,
   'blocks': [
    (['art-overview'], 'Why you are doing this project'),
    (['art-task'], 'The task'),
    (['art-type'], 'Format'),
    (['art-audience'], 'Audience and purpose'),
    (['art-rhetorical'], 'How your project will be assessed: rhetorical effectiveness'),
    (['art-content'], 'Disciplinary content'),
    (['art-technical'], 'Technical execution'),
    (['art-reflection'], 'Reflection')]}]}

L['dc-module3'] = {
 'notes_title': 'My AI literacy notes',
 'notes': [
  ('Conceptual inventory', [
    ('f-a1-tools', 'The three tools'),
    ('f-a1-t1', 'Tool 1'),
    ('f-a1-t2', 'Tool 2'),
    ('f-a1-t3', 'Tool 3'),
    ('f-a1-reflection', 'What the inventories showed me')]),
  ('Structural analysis', [
    ('f-a2-tool', 'The tool, and why I chose it'),
    ('f-a2-hierarchies', 'Hierarchies it reproduces'),
    ('f-a2-costs', 'Who bears the cost when it fails'),
    ('f-a2-interests', 'Whose interests the design serves'),
    ('f-a2-synthesis', 'What the analysis adds up to')]),
  ('My operative decision', [
    ('f-a3-decision', 'The decision'),
    ('f-a3-grounds', 'Its grounds'),
    ('f-a3-conditions', 'Conditions or evidence I will watch'),
    ('f-a3-rationale', 'Design rationale for the assignment')])],
 'student_title': 'Assignment sheet',
 'student': [
  {'title': 'Assignment', 'course': [], 'framing': None,
   'blocks': [
    (['f-a3-prompt'], 'The task'),
    (['f-a3-criteria'], 'How your work will be assessed')]}]}

def dc_elective(notes_title, notes, default_title, extra_blocks):
    blocks = [(['art-overview'], 'Overview'), (['art-task'], 'The task')] + extra_blocks + \
             [(['art-ai'], 'Using AI on this assignment'), (['art-criteria'], 'How your work will be assessed')]
    return {'notes_title': notes_title, 'notes': notes, 'student_title': 'Assignment sheet',
            'student': [{'title_field': 'art-title', 'title': default_title, 'course': ['art-course'],
                         'framing': None, 'blocks': blocks}]}

L['dc-elective1'] = dc_elective('My social media notes', [
  ('A post in my field', [
    ('f-a1-content', 'The content'),
    ('f-a1-rhetoric', 'Its claims, and how it makes them'),
    ('f-a1-algorithm', 'Why the algorithm promotes it'),
    ('f-a1-pedagogical', 'How I would use it in class')]),
  ('A platform decision', [
    ('f-a2-platform', 'The platform, and how I use it'),
    ('f-a2-hierarchies', 'Hierarchies its recommendations reproduce'),
    ('f-a2-costs', 'Who bears the cost when it fails'),
    ('f-a2-interests', 'Whose interests the design serves'),
    ('f-a2-decision', 'My decision'),
    ('f-a2-assignment', 'An assignment idea')])],
  'Social media analysis', [(['art-platform'], 'Platforms and content in scope')])

L['dc-elective2'] = dc_elective('My notes on digital ethics', [
  ('Structural analysis of a tool', [
    ('f-a1-tool', 'The tool'),
    ('f-a1-hierarchies', 'Hierarchies it reproduces'),
    ('f-a1-costs', 'Who bears the cost when it fails'),
    ('f-a1-interests', 'Whose interests the design serves'),
    ('f-a1-synthesis', 'What the analysis shows')]),
  ('Governance case', [
    ('f-a2-decision-path', 'The decision path in the case'),
    ('f-a2-grounds', 'Its grounds'),
    ('f-a2-conditions', 'Conditions or contingencies')]),
  ('My own decision', [
    ('f-a2-own-decision', 'My decision on the tool'),
    ('f-a2-own-grounds', 'Governance statement'),
    ('f-a2-assignment', 'An assignment idea')])],
  'Structural analysis of a digital tool', [(['art-operative'], 'Your decision')])

L['dc-elective3'] = dc_elective('My accessibility notes', [
  ('Audit of a course asset', [
    ('f-a1-asset', 'The asset'),
    ('f-a1-technical', 'Technical accessibility'),
    ('f-a1-communicative', 'Communicative accessibility'),
    ('f-a1-revision', 'My revision plan')]),
  ('An AI accessibility tool', [
    ('f-a2-tool', 'The tool'),
    ('f-a2-hierarchies', 'Structural analysis'),
    ('f-a2-operative', 'My decision and its conditions')]),
  ('Planning the assignment', [
    ('f-a2-assignment', 'The assignment idea'),
    ('f-a2-criteria', 'Accessibility as rhetorical criteria'),
    ('f-a2-teach', 'What I need to teach first')])],
  'Accessible design', [(['art-access-reqs'], 'Accessibility requirements'), (['art-process'], 'Process and checkpoints')])

L['dc-elective4'] = dc_elective('My multimodal design notes', [
  ('A multimodal text in my field', [
    ('f-a1-text', 'The text'),
    ('f-a1-modes', 'How its modes interact'),
    ('f-a1-design', 'Its design choices'),
    ('f-a1-conventions', 'Conventions it follows and breaks'),
    ('f-a1-pedagogical', 'How I would use it in class')]),
  ('A generative AI tool', [
    ('f-a2-tool', 'The tool'),
    ('f-a2-structural', 'Structural analysis'),
    ('f-a2-operative', 'When it belongs in my assignments')])],
  'Multimodal composition', [(['art-modes'], 'Modes and design'), (['art-process'], 'Process and checkpoints'), (['art-resources'], 'Resources')])

L['dc-capstone'] = {
 'notes_title': 'Digital Communication capstone',
 'notes': [
  ('Capstone', [
    ('cert-parta', 'Course and context'),
    ('cert-partb', 'The assignment or module'),
    ('cert-partc', 'Assessment and accessibility'),
    ('cert-partd', 'Design rationale'),
    ('cert-elective-use', 'Elective work I will use, and where')])],
 'student_title': None, 'student': []}

for _k in L:
    if 'elective' in _k or _k in ('dc-module1', 'dc-module2', 'dc-module3'):
        L[_k]['notes'].append(('Using this work', [('f-commit', 'Where I will use this work')]))

if __name__ == '__main__':
    import sys
    json.dump(L, open(sys.argv[1], 'w'), ensure_ascii=False, indent=1)
    print(len(L), 'layouts')
