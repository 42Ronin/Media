# HMIS Training Simulation

An interactive sandbox for practicing work in an HMIS, modelled on the redesigned
Clarity Human Services interface.

**Lesson 1 — Finding a Client** is built. Lesson 2 will cover Add Client.

The point is not button locations. It's the judgment that prevents duplicate client
records, which is the error that corrupts a CoC's unduplicated count in HUD reporting.

---

## Build

```bash
./build.sh
```

| Output | Use |
|---|---|
| `dist/lesson1-client-search.html` | Standalone. Open in any browser, put on a shared drive, or `<iframe>` into an LMS page. No server, no dependencies. |
| `dist/lesson1-client-search-scorm.zip` | SCORM 1.2 package. Upload as a course in Cornerstone, Docebo, Moodle, SCORM Cloud, etc. |

The HTML in both is byte-identical — the zip only adds `imsmanifest.xml`. The page
finds the LMS API at runtime and reports progress; run standalone, the SCORM layer
silently no-ops. There is no separate "LMS build" to keep in sync.

Reports `cmi.core.lesson_status` and `cmi.core.score.raw` (0–100). Mastery score **80**.
Each lesson ships as its own package so LMS admins can assign and report on them separately.

---

## Lesson 1 tasks

Eight tasks, scored 10 for a first-attempt success, 5 after a wrong attempt or a
revealed hint, 0 if skipped. Every task ends with a teaching point, right or wrong.
After the last task the sim unlocks for free exploration.

| # | Task | Skill |
|---|---|---|
| 1 | The nickname problem | An empty result is not proof the client is new |
| 2 | Year of birth only | Year search when the surname is unreliable |
| 3 | Date formats | `/`, `.`, `-` all parse; a shared birthday is not a match |
| 4 | Same name, different people | Confirm identity on a second identifier |
| 5 | Reading the ROI column | Consent status is visible before you open a record |
| 6 | When the SSN is refused | Fall back to DOB; more data ≠ the right record |
| 7 | Multi-word surnames | Search the distinctive fragment |
| 8 | A real duplicate | Recognize and escalate — never merge or delete |

**Add Client** stays visible because it's on the real screen, but it defers to Lesson 2.
If the current task's client already exists, it also points that out — the duplicate-prevention
beat survives without the form being built.

---

## Simulated functionality

Modelled on screenshots of the current interface:

- **Left icon rail** and top bar; **Clients / Search for a client** card with a persistent **⊕**
- **Search-as-you-type**, debounced, matching fragments across first *and* last name
  simultaneously (`ann gla` → Glass, Annie). Enter and the magnifier still work.
- Names render **"Last, First (Pronouns)"** with an **alphanumeric client ID** beneath
- **Filter chips inside the search bar** — First Name, Last Name, Alias — each with a
  value popover and a remove control
- Columns **Client · SSN · ROI · DOB**, plus optional Alias, Household Members,
  Veteran Status. Missing values render `(No value)`.
- **ROI as a results column**: `Yes` / `Missing` / `No` pills
- **SSN** shows last 4 in results and the full number on the profile
- **Column selector** with a field search, checkboxes, drag-to-reorder, a locked **Client**
  column, and a **Collapsed Fields** section (Client ID, Updated by) that the row chevron reveals
- **Pagination** (`1 – 10 of 34`) and sortable headers
- **Recently accessed** clients shown in the table by default, with the hint row
- Client profile with ROI banner and **SSN Data Quality**

Deliberately **not** searchable: SSN. In the real product SSN is a column you read, not a
field you query — which is what makes identity confirmation a judgment rather than a lookup,
and is the whole basis of tasks 4 and 6.

---

## The roster

`tools/gen_roster.py` generates 300 fictional clients deterministically (fixed seed), so
Lesson 2 will show the same people with the same IDs. Regenerate with `./build.sh`.

**Every SSN is in the 900–999 area range.** The SSA has never issued numbers in that range,
so no generated SSN can collide with a real person's even though the sim displays them unmasked.

Records carry HMIS SSN **data-quality codes** — full, approximate, client refused, client
doesn't know, data not collected — because records with a refused or missing SSN are exactly
where duplicates breed.

Seeded traps: `Michael Torres` (presents as "Mike", no alias recorded), `Katherine Morrison`
(goes by Kate, possible former married name), two different `James Wilson`s, the
`Shauna`/`Shawna Beckett` duplicate pair, `Maria de la Cruz`, three `Delgado`s with one ROI
missing, and two `Robert Nakashima`s where the right one has no SSN on file.

The generator **rejects** any random record that would make a scenario answer ambiguous, and
the test suite asserts each answer stays uniquely reachable — so regenerating the roster can
never silently break a task.

---

## Tests

```bash
npm i playwright && node test.mjs
```

71 browser tests: search engine, scenario-uniqueness guards, ROI and SSN columns, recents,
pagination, sorting, filter chips, column selector, row expand, every task path including
failure branches, and accessibility basics.

Accessibility: labelled controls, `aria-live` result count, accessible names on every icon
button, focus-visible outlines, `role="dialog"` modals, Escape to close. The real product's
redesign targets Section 508, so the sim aims there too.

---

## Fidelity status

Built against screenshots of the current interface, so layout, labels, column names, the chip
filters, the column selector, pagination, and the ROI pills all match what was captured.

**Unverified** — no screenshot was available, so these are designed rather than copied: the
no-results empty state, the client profile screen, and the exact contents of the expanded row
beyond Client ID and Updated by.

---

## Legal

Independent training simulation. **Not affiliated with, endorsed by, or connected to
Bitfocus, Inc.** No Bitfocus code, assets, or screenshots are included or redistributed.
Product names are referenced only to describe what the training covers. Screens, labels, and
required fields in any live system are configured per-CoC and will differ — tell learners so.
