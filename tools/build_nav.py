"""Writes the shared CWSP site header into every root and C²TC page that has one.

Run from the repository root: python3 tools/build_nav.py
The header is static HTML. Dropdowns are <details> elements, so they open without
JavaScript; css/nav.js only closes other open menus and collapses the list on phones.
"""
import re
import pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent

GROUPS = [
    ("WOLF", [
        ("WOLF overview", "wolf.html"),
        ("About WOLF", "about.html"),
        ("For liaisons", "liaisons.html"),
        ("How WOLF works", "get-started.html"),
    ]),
    ("C²TC", [
        ("C²TC overview", "c2tc/index.html"),
        ("Written Communication", "c2tc/written.html"),
        ("Digital Communication", "c2tc/digital.html"),
        ("Oral Communication", "c2tc/oral.html"),
        ("Cohort", "c2tc/cohort.html"),
        ("Repository", "c2tc/repository.html"),
        ("Apply", "c2tc/apply.html"),
    ]),
    ("AI programs", [
        ("AI Literacies", "ai-literacies.html"),
        ("The framework", "ai_literacy_unified.html"),
        ("AI Policy Lab", "ai-policy-lab.html"),
        ("AI Practice Adventure", "cyoa.html"),
    ]),
]
TOP = [
    ("Events", "index.html#events"),
]
# Groups drawn after the top links, so Research keeps its place beside Events.
TRAILING_GROUPS = [
    ("Research", [
        ("Research and presentations", "research.html"),
        ("The State of Writing and Speaking", "state-of-writing-and-speaking.html"),
    ]),
]
CTA = ("Talk with CWSP", "contact.html")

# Pages that belong to a group without appearing in its menu.
EXTRA_MEMBERS = {
    "wolf-workbook.html": "WOLF",
    "CWSP_AI_Literacies_Workbook.html": "AI programs",
    "ai-policy-workbook.html": "AI programs",
    "ai-policy-lab-guide.html": "AI programs",
    "unmediated-writer.html": "Research",
}


def header(page, prefix):
    def link(label, href, cls=""):
        current = ' aria-current="page"' if href == page else ""
        c = f' class="{cls}"' if cls else ""
        return f'<a href="{prefix}{href}"{c}{current}>{label}</a>'

    group_of = {href: g for g, items in GROUPS + TRAILING_GROUPS for _, href in items}
    group_of.update(EXTRA_MEMBERS)
    active_group = group_of.get(page)

    def group(name, items):
        active = ' class="gnav-active"' if name == active_group else ""
        lis = "".join(f"<li>{link(l, h)}</li>" for l, h in items)
        return (f'<li class="gnav-group"><details><summary{active}>{name}</summary>'
                f'<ul class="gnav-sub">{lis}</ul></details></li>')

    parts = [group(name, items) for name, items in GROUPS]
    for label, href in TOP:
        cls = "gnav-active" if label == active_group else ""
        parts.append(f"<li>{link(label, href, cls)}</li>")
    parts += [group(name, items) for name, items in TRAILING_GROUPS]
    parts.append(f'<li class="gnav-cta">{link(CTA[0], CTA[1])}</li>')

    return (
        '<header class="site-header">\n'
        '  <nav class="gnav" aria-label="Main navigation">\n'
        f'    <a class="nav-logo" href="{prefix}index.html">CWSP <span>·</span> NC State</a>\n'
        '    <button type="button" class="gnav-toggle" aria-expanded="false" aria-controls="gnav-list">Menu</button>\n'
        f'    <ul class="gnav-list" id="gnav-list">{"".join(parts)}</ul>\n'
        '  </nav>\n'
        f'  <script src="{prefix}css/nav.js" defer></script>\n'
        '</header>')


HEADER_RE = re.compile(r'<header class="site-header">.*?</header>', re.S)


def main():
    pages = [(p, "") for p in sorted(ROOT.glob("*.html"))]
    pages += [(p, "../") for p in sorted((ROOT / "c2tc").glob("*.html"))]
    for path, prefix in pages:
        s = path.read_text(encoding="utf-8")
        if not HEADER_RE.search(s):
            continue
        page = path.relative_to(ROOT).as_posix()
        s = HEADER_RE.sub(lambda m: header(page, prefix), s, count=1)
        path.write_text(s, encoding="utf-8")
        print("nav", page)


if __name__ == "__main__":
    main()
