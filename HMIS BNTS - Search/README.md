# HMIS Training Simulation

An interactive sandbox for practicing work in an HMIS, modelled on the redesigned
Clarity Human Services interface.

**Lesson 1 — Finding a Client** is built. Lesson 2 will cover Add Client.

The point is not button locations. It's the judgment that prevents duplicate client
records, which is the error that corrupts a CoC's unduplicated count in HUD reporting.

---

## Build

```bash
./build.sh            # dist/lesson1-client-search.html
./build.sh --scorm    # also dist/lesson1-client-search-scorm.zip
```

SCORM packaging is **opt-in and currently off**. The standalone HTML is the working
deliverable; run with `--scorm` when the course is ready for an LMS.

The HTML inside the zip is byte-identical to the standalone file — the zip only adds
`imsmanifest.xml`. The page finds the LMS API at runtime and reports progress; run
standalone, the SCORM layer silently no-ops. There is no separate "LMS build" to keep in sync.

Reports `cmi.core.lesson_status` and `cmi.core.score.raw` (0–100). Mastery score **80**.
Each lesson ships as its own package so LMS admins can assign and report on them separately.

`build.sh` also produces **`dist/knowledge-check.html`** and its Rise zip — slide 13.1, the
six questions dealt as cards. Its questions come from `script/kc_data.py`, which is the same
list `script/make_script.py` renders into the docx, so the page and the script cannot drift.
It reports nothing but completion, and withholds even that until the learner has 80% right —
five of six, rounded up to a whole question. There is no score: see `docs/embedding.md`.

---

## Lesson 1 tasks

Twelve tasks, scored 10 for a first-attempt success and 5 after a wrong attempt or a
revealed hint. There is no skip — a hint is always available instead. Every task ends
with a teaching point, right or wrong. After the last task the sim unlocks for free
exploration.

The **task panel sits on the left**, the simulated interface on the right.

Narration says **participant**, matching LAHSA usage; the simulated product says
**Client**, matching Clarity. The script names that difference once, deliberately.

**Every task traces to the vetted LAHSA draft** (`script_finding_a_participant_v3`). Nothing
here is invented. Tasks that were ours rather than the draft's — date-separator formats and
reading the ROI column — were removed.

*Searching* — tasks 1 to 8:

| # | Task | From the draft |
|---|---|---|
| 1 | The name he gave you | Alternate names and nicknames |
| 2 | When the last name may have changed | Search by year of birth alone |
| 3 | Starting from the last four of the SSN | Search by last four digits |
| 4 | A name you cannot spell | First letters of first and last name (*kat joh*) |
| 5 | Too many results | Narrow by adding a term |
| 6 | Nothing comes back | Replace one term with another piece of information |
| 7 | Spelled the way someone else heard it | Alternate spellings, C↔K and I↔Y |
| 8 | A surname typed as one word | Second last names and compound surnames |

*Checkpoint — from finding to verifying.* Non-scored beat on the seam, mirroring the draft's
own split between Search and Verify.

*Verifying* — tasks 9 to 12:

| # | Task | From the draft |
|---|---|---|
| 9 | Two people, one name | Two of three identifiers must match |
| 10 | When the identifiers are thin | Confirm household, program history, case notes |
| 11 | More than one record matches | Choose the most complete; else the oldest enrollment |
| 12 | Finding the same person twice | Report to HMIS Support — never merge or delete |

**Add Client** stays visible because it's on the real screen, but it defers to Lesson 2.
If the current task's client already exists, it also points that out — the duplicate-prevention
beat survives without the form being built.

---

## Simulated functionality

Modelled on screenshots of the current interface:

- **Left icon rail** and top bar; **Clients / Search for a client** card with a persistent **⊕**
- **Search-as-you-type**, debounced. Built for partial information: the bar is
  whitespace-separated, every token must match, but each token may match a *different*
  field and there is **no minimum length**. `mi tor`, `mi t`, `m t` and `tor mi` all find
  Michael Torres. Enter and the magnifier still work.
- A token matches a **name prefix**, a **date-of-birth fragment**, or an **SSN fragment**:
  - dates: `1977`, `77`, `3/14`, `3/14/79`, `03/14/1979`, with `/`, `.` or `-`
  - SSN: any run of digits inside it — `4471`, `941` and `33` all hit `941-33-4471`.
    Partial SSNs are stored HMIS-style, with segments the client couldn't recall filled
    as **X or 0 at the segment's width** (`XXX`/`000` area, `XX`/`00` group,
    `XXXX`/`0000` serial). The digits they *do* remember stay searchable; a masked
    segment blocks matching across the gap, so `1447` will not hit `941-XX-4471`.
    Zero-filled segments are real stored digits and remain searchable as such.
  - combine freely: `wilson 4471`
- Names render **"Last, First (Pronouns)"** with an **alphanumeric client ID** beneath
- **Filter chips inside the search bar** — First Name, Last Name, Alias — each with a
  value popover and a remove control
- Default columns **Client · DOB · SSN · ROI**, plus optional Alias, Household Members,
  Veteran Status. Missing values render `(No value)`. Several help-centre captures show
  `Client · SSN · ROI · DOB` — that is a demo account that had already dragged DOB to the
  end, not the shipped default.
- **ROI as a results column**: `Yes` / `Missing` / `No` pills
- **SSN** shows last 4 in results and the full number on the profile
- **Column selector** with a field search, checkboxes, drag-to-reorder, a locked **Client**
  column, and a **Collapsed Fields** section revealed by the row chevron: **Client ID**,
  **Veteran Status**, **Household Members**, **Updated by**
- **Household Members** expand into the real people in that household — avatar, name with
  pronouns, and relationship to the head of household. Members are other clients from the
  same roster, so every household resolves and membership is reciprocal. **35% of clients
  are in a household**; the rest are served as individuals.
- Two identifiers, as in the product: the **unique identifier** (`AD63C3FF2`) under the name
  in search results, and the numeric **Client ID** (`17248`) on the record and expanded row
- **Pagination** (`1 – 10 of 34`) and sortable headers
- No stat tiles on the search page — out of scope for this lesson
- **Recently accessed** clients, which start empty — the screen shows nothing until the
  learner searches, and records accumulate as they are opened
- **Client Record page** — opening a row navigates to the record, as it does live. Client
  header with the *"You are currently viewing the Client Record pages for…"* line and a
  **Public Alert** pill; the 16-item client nav (Profile … Restrictions) with Profile active;
  the profile card's two-column grid including **Quality of SSN / Name / DOB**, Consent
  Refused, Race and Ethnicity, Additional Detail, Veteran Status; and the eight right-rail
  cards with counts (Program referrals, Community queues, Household, Active programs, Active
  services, Recent Services and Events, Active Contacts, Care Team). The profile kebab carries
  **Flag possible duplicate**. Everything past Profile is out of scope and says so.
- The top-bar **magnifying glass** returns to Client Search from anywhere and focuses the
  search box. Clicked while already on Client Search, it explains that that's what it's for —
  a navigation habit worth teaching, since it saves backing out of a record.

---

## The roster

`tools/gen_roster.py` generates 300 fictional clients deterministically (fixed seed), so
Lesson 2 will show the same people with the same IDs. Regenerate with `./build.sh`.

**Every SSN area segment is either 900–999 or a placeholder.** The SSA has never issued
numbers in the 900–999 range, so no generated SSN can collide with a real person's even
though the sim displays them unmasked.

Records carry HMIS SSN **data-quality codes** — full, approximate, client refused, client
doesn't know, data not collected — because records with a refused or partial SSN are exactly
where duplicates breed. Records coded approximate carry a genuinely partial SSN, X- or
0-filled per HMIS convention.

Seeded traps, one per task: `Michael Torres` ("Lefty", no alias recorded) · `Katherine
Morrison` (goes by Kate) · `Danielle Whitmore` and `Marcus Pell` (both end 7742) ·
`Krzysztof Wojciechowski` (unspellable) · twelve `Garcia`s (overflows a page) ·
`Adrian Fenwick` (stated DOB is transposed) · `Kathleen Brennan` (introduces herself as
Cathleen) · `Maria Delacruz` (filed as one word, so "Cruz" matches nothing) · two
`James Wilson`s · `Yolanda` and `Iris Amari` (mother identified only by her household) ·
three `Rosalind Vega` records of differing completeness · the `Shauna`/`Shawna Beckett`
duplicate pair.

**Every trap is regression-tested.** For each task the suite runs the naive search a trainee
would actually type and asserts it either dead-ends or narrows to a set they must choose
from — never solves outright. This catches the failure mode where live prefix matching
quietly dissolves a trap: typing `Mi` used to surface Michael Torres before the learner
finished typing the nickname.

The generator **rejects** any random record that would make a scenario answer ambiguous, and
the test suite asserts each answer stays uniquely reachable — so regenerating the roster can
never silently break a task.

---

## Tests

```bash
npm i playwright && node test.mjs
```

444 browser tests: search engine, scenario-uniqueness guards, ROI and SSN columns, recents,
pagination, sorting, filter chips, column selector, row expand, every task path including
failure branches, and accessibility basics. Partial matching is covered directly: mixed
name fragments at 1 and 2 characters, 2- and 4-digit years, month/day fragments, all three
date separators, and SSN fragments at the start, middle and end. The record page is covered too: navigation
in and back out, all 16 nav sections, the data-quality fields, and the eight rail cards.

The orientation, the training panel and the knowledge check have their own sections. The
knowledge check is walked end to end through a real same-origin frame: the deal, the gate at
four of six, the re-deal of the missed questions, and the completion that only fires once the
mark is cleared — plus assertions that no message it sends ever carries a score.

Accessibility: labelled controls, `aria-live` result count, accessible names on every icon
button, focus-visible outlines, `role="dialog"` modals, Escape to close. The real product's
redesign targets Section 508, so the sim aims there too.

---

## Fidelity status

Built against screenshots of the current interface, so layout, labels, column names, the chip
filters, the column selector, pagination, and the ROI pills all match what was captured.

The no-results state is **No results yet!** over *Results will be displayed here when they are
available.*, beside a magnifier-with-x — verified against the live account in August 2026, having
been guessed (and guessed wrong) before that. The coaching that belongs with an empty result
("no results is not an answer") is raised once per task by Lashes instead, where coaching belongs.

The record page masks the SSN as `***-**-####`, as the live account does. Every stored SSN is in
the never-issued 900-999 range, so nothing real is exposed either way; masking is here because the
product does it, not because it has to.

Deliberately **not** reproduced from the August captures, per the course owner: the four stat
cards above the results table and the right-hand rail on the record page. Both belong to features
these lessons do not teach, and they can arrive with the lesson that needs them.

---

## Legal

Independent training simulation. **Not affiliated with, endorsed by, or connected to
Bitfocus, Inc.** No Bitfocus code, assets, or screenshots are included or redistributed.
Product names are referenced only to describe what the training covers. Screens, labels, and
required fields in any live system are configured per-CoC and will differ — tell learners so.
