# CHASS Curriculum Accelerator workbooks (sources)

One combined AI literacy and AI policy workbook per unit, forked from the CWSP-WOLF workbooks for the CHASS Curriculum Accelerator. Each page carries the unit's baseline from SLO_Coded_2026, a worked mapping example, and the peer and disciplinary policy findings, prefilled.

## Files

- `../sts.html`, `../english.html`, `../psychology.html`: built pages, served at cwspwolf.com/accelerator/. Do not edit by hand.
- `units/<unit>.json`: each unit's data (outcomes, worked example, literacy readings, policy findings).
- `build.py`: writes the pages. Run `python3 accelerator/src/build.py` after changing any unit file.
- `../css/workbook.css`, `../js/workbook.js`: shared by every unit page.

The folder is unlisted: no site menu links to it, and every page carries a noindex tag. Anyone holding a link sees the page.

Campus Writing and Speaking Program, NC State. kkcole2@ncsu.edu
