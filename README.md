# HMIS Client Search — Training Simulation

An interactive sandbox that lets learners practice **client search in an HMIS** first-hand,
modelled on the redesigned Clarity Human Services client-search screen.

It is a teaching tool, not a clone. The point is the judgment that prevents duplicate client
records — the error that corrupts a CoC's unduplicated count in HUD reporting.

---

## Deliverables

Run `./build.sh` to produce both from the single source file:

| File | Use |
|---|---|
| `dist/hmis-client-search-sim.html` | Standalone. Open in any browser, drop on a shared drive, or `<iframe>` into an LMS page. No server, no build, no dependencies. |
| `dist/hmis-client-search-sim-scorm.zip` | SCORM 1.2 package. Upload as a course in Cornerstone, Docebo, Moodle, SCORM Cloud, etc. |

Both contain **byte-identical HTML**. The SCORM zip just adds `imsmanifest.xml`.
The page detects the LMS API at runtime and reports progress when present; run standalone,
the SCORM layer silently no-ops. There is no separate "LMS build" to keep in sync.

**SCORM reporting:** `cmi.core.lesson_status` (`incomplete` → `passed`/`failed`),
`cmi.core.score.raw` as a 0–100 percentage, mastery score **80**.

---

## The learner experience

**Guided mode** (default) walks through 7 tasks; **Sandbox mode** is free exploration
against the same roster. Progress is kept when switching modes.

Scoring: 10 points for a first-attempt success, 5 after a wrong attempt or a revealed hint,
0 if skipped. Every task ends with a teaching point, right or wrong.

| # | Task | Skill |
|---|---|---|
| 1 | The nickname problem | A zero-result search is not proof the client is new |
| 2 | Year of birth only | Year search when the surname is unreliable |
| 3 | Date formats | `/`, `.`, `-` all parse; a shared birthday is not a match |
| 4 | Same name, different people | Confirm identity on a second identifier |
| 5 | A real duplicate | Recognize and escalate — never merge or delete |
| 6 | Multi-word surnames | Search the distinctive fragment |
| 7 | Genuinely new | Search-before-add is the gate; ROI required to save |

Clicking **Add Client** while the task's client already exists triggers a duplicate warning
and costs points. That interstitial is the core teaching moment of the whole module.

---

## Simulated functionality

- Search by **first or last name**, full or **first 3 letters** (shorter is rejected with a message)
- **Date of birth** in `12/12/1985`, `12.12.1985`, `12-12-1985`; malformed dates are rejected
- **Year of birth** alone (`1985`); 6-digit **client ID**
- Multi-word surnames match on any token (`Cruz` → `Maria de la Cruz`)
- Alias matching, where an alias is recorded — most records have none, deliberately
- **Filters** panel: Client ID, Last 4 of SSN, Date of Birth
- **Column selector**: toggle, drag to reorder, persists to `localStorage`; the
  *Client (Name and Unique Identifier)* column is locked and cannot be removed
- **Recently accessed** list
- Client profile with ROI status; **Flag possible duplicate** action
- **Add Client** with required fields and a required Release of Information

Out of scope: enrollments, services, assessments, referrals, reports. Those tabs are visibly disabled.

---

## The roster

40 fictional clients seeded with the traps that actually cause duplicates in the field:

- `Michael Torres` — presents as "Mike", **no alias recorded**, so nickname search returns nothing
- `Katherine Morrison` — goes by "Kate", possible former married name, born 1985
- `James Wilson` ×2 — genuinely different people, different DOB and SSN
- `Shauna` / `Shawna Beckett` — same DOB, same last-4 SSN: a true duplicate pair
- `Maria de la Cruz` — compound surname
- `Andre Whitfield` / `Jamal Underwood` — share a date of birth, unrelated

Every name, ID, DOB, and SSN fragment is invented. Nothing here is real client data,
and none of it should ever be replaced with real client data.

---

## Fidelity status

Built from **documented** behavior (Bitfocus help center, HUD, and published CoC user
guides), not from screenshots — none were available when this was built, and the host was
unreachable from the build environment.

Confirmed against documentation: 3-letter minimum, the three DOB formats, year-of-birth
search, the filter icon opening three filters, the column selector's toggle/drag/persist
behavior and locked Client column, recently-accessed, search-before-add, ROI-before-save.

**Needs confirmation from screenshots:** exact filter labels, the full default column set,
placeholder text, brand palette, iconography, and spacing. The visual layer is an
approximation and is expected to change once screenshots exist. Search logic, scenarios,
and scoring are independent of that pass.

---

## Verification

41 automated browser tests cover the search engine, filters, column selector, all scenario
paths including failure branches, the add-client guard, and accessibility basics.

```
npm i playwright && node test.mjs   # see repo history for the harness
```

Accessibility: labelled controls, `aria-live` result count, keyboard-navigable result rows,
focus-visible outlines, `role="dialog"` modals, Escape to close, semantic headings.
The real product's redesign targets Section 508 compliance, so the sim aims there too.

---

## Legal

Independent training simulation. **Not affiliated with, endorsed by, or connected to
Bitfocus, Inc.** No Bitfocus code, assets, or screenshots are included or redistributed.
Product names are referenced only to describe what the training covers.
Screens, labels, and required fields in any live system are configured per-CoC and will differ —
learners should be told this explicitly.
