# Project memory — LAHSA training simulations

Context for anyone (human or agent) picking this up cold, on any machine.

## What this is

Interactive, sandboxed simulations of the **Clarity Human Services HMIS** interface,
used to train LAHSA staff. Each module is one lesson. They are built to teach
*judgment*, not button locations — specifically the judgment that prevents duplicate
client records, which is the error that corrupts a CoC's unduplicated count in HUD
reporting.

Built with Claude Code. Modelled on screenshots of the real interface supplied by the
user; `help.bitfocus.com` is unreachable from the build environment (egress policy), so
screenshots are the source of truth, not the vendor's docs. Those screenshots are archived
in `reference/` — read `reference/README.md` before doing fidelity work, and note the
restriction: internal reference only, never redistributed or embedded in a deliverable.

## Layout

```
HMIS BNTS - Search/       built    — finding an existing client
HMIS BNTS - Why/          part     — the Why HMIS prologue; three Copperfield boxes ship
HMIS BNTS - Create/       planned  — adding a new client record
tools/kc-maker/           built    — knowledge checks and Copperfield boxes
tools/scene-editor/       built    — the photo+narration openers
tools/job-aid-builder/    built    — printable step-by-step guides, PDF out
tools/lashes-builder/     built    — a Lashes message block for Rise
index.html                built    — the front door: every tool and every block, linked
```

**The repo publishes as a static site**, and `tools/build_site.mjs` is what Vercel runs —
see `DEPLOY.md`. One manifest in that script produces two things: `public/` (the site, clean
URLs, gitignored because it is output) and the committed root `index.html` (the same front
door with repo-relative links, for opening off disk with no server). Add a tool → add a row
in `MANIFEST`; nothing else knows their names.

**The deploy collects and renames. It never builds a lesson.** `dist/` is committed on
purpose, so the build image needs Node and nothing else — no Python, no `zip`, no Playwright,
nothing that can drift between machines. The cost is that *a change is not live until it is
built and committed*: pushing source alone republishes the old page.

The front door is generated rather than kept by hand for the same reason the script docx is:
an index that lies about what exists is worse than none, so nothing is listed unless the file
is on disk and a missing one is greyed with the command that builds it.

**Not everything we built for LAHSA is in this repo.** `42Ronin/LAHSA` carries the brand
assets and **`Training Tools/Family Feud/`** — a game-shaped board with its own build and
tests, on the `brand-square` and `…training-tools-subrepo` branches rather than that repo's
`main`. The index lists it under Elsewhere because it cannot be linked from here.

One folder per lesson, self-contained: own source, roster, build, tests, SCORM package.
Naming is `HMIS BNTS - <Verb>`. New lessons become sibling folders.

## Build and test

```bash
cd "HMIS BNTS - Search"
./build.sh                    # -> dist/*.html   (regenerates the roster first)
./build.sh --scorm            # also the SCORM 1.2 zip. OFF by default, by request.
npm i playwright && node test.mjs
```

The lesson source is `src/*.template.html` with a `/*__ROSTER__*/` token that `build.sh`
replaces with `src/roster.json`. **Never edit `dist/` by hand** — it is generated, and
committed only so the working lesson is recoverable without a build step.

## Non-negotiables

- **All client data is fictional.** Never introduce real client information, not even as
  an example.
- **Every unique identifier is `UID#` + four digits + five letters** (`UID#7615QHFVR`).
  Ours used to be nine hex characters, which is the shape the *real* system uses — close
  enough that a screenshot of this simulation could be taken for real data, and close enough
  that an invented one could collide with a real person's. The marker and the digits-then-
  letters grouping make that impossible: nothing in the live product is written that way.
  No `I` or `O` — they read as 1 and 0 when an identifier is said aloud. Asserted in
  `test.mjs` beside the SSN check, because it is the same class of promise.
  **`new_id()` still draws nine values from the main stream and reshapes them.** Drawing a
  different number would shift every later draw and reshuffle the whole roster — names,
  dates, the collision statistics the lesson is tuned on. Keep the draw, change the shape.
- **Every SSN area segment is 900–999 or a placeholder (`XXX`/`000`).** The SSA has never
  issued 900–999, so nothing displayed can collide with a real person's number. This is
  what makes it safe to show SSNs unmasked. If you change SSN generation, preserve this.
- **The training banner and the non-affiliation disclaimer stay.** The sim is deliberately
  convincing, which means it must never be mistaken for the live system. Not affiliated
  with, endorsed by, or connected to Bitfocus, Inc. No Bitfocus code, assets, or
  screenshots are redistributed in this repo.

## How search works (get this right before changing it)

Whitespace-separated tokens. **Every token must match, but each may match a different
field, and there is no minimum length.** `mi tor`, `mi t`, `m t`, `tor mi` all find
Michael Torres. A token matches:

- a **name prefix** — first, last, alias, or any word of a multi-word surname
- a **DOB fragment** — `1977`, `77`, `3/14`, `3/14/79`, `03/14/1979`, with `/` `.` or `-`
- an **SSN fragment** — any digit run inside it. **The token must be numeric**: letters used
  to be stripped before matching, so a unique identifier searched as `UID#3906EMKLW` came back
  as every record whose SSN happened to contain `3906`
- the **unique identifier**, whole, with or without the `UID#` in front. Whole codes only —
  a fragment of one is not something anybody reads off a screen and types, and matching
  fragments would let a stray four digits collide with an SSN

Partial SSNs are stored HMIS-style with unrecalled segments filled `X` or `0` at the
segment's width. A masked segment collapses to a marker so a search cannot match *across*
the gap (`1447` must not hit `941-XX-4471`). Zero-filled segments are real stored digits
and stay searchable.

Earlier versions had a 3-letter minimum and no SSN search. Both came from the *old*
interface's help article and were wrong. Don't reintroduce them.

## The rule that governs task design

**A task must not be solved by the first thing a trainee would type.** It must either
dead-end or narrow to a set they have to choose from.

This has broken twice, both times because live prefix matching quietly dissolved a trap:
`Mi` surfaced Michael Torres before the learner finished typing the nickname, and `Cruz`
matched `de la Cruz` through surname tokenisation. Fixes were to change the *data* (he
now introduces himself as "Lefty"; she is filed as one word, `Delacruz`), not to weaken
the matcher.

`test.mjs` runs the naive search for every task and asserts the outcome. **If you change
the matcher or the roster, that section is the canary — read its failures carefully rather
than adjusting the expectations.**

## Roster

`tools/gen_roster.py` — 300 clients, deterministic from a fixed seed, so every lesson
shows the same people with the same identifiers. Regenerated by `build.sh`.

- Scenario clients are pinned first; generated records are **rejected** if they would make
  a task answer ambiguous (see `violates()`).
- **Names repeat on purpose.** Most records draw from a small `COMMON_F`/`COMMON_L` pool
  (`COMMON_RATE`), and up to `MAX_TWINS` records share a full name outright. A roster of
  unique names makes search look far more decisive than it is — the first thing a learner
  types finds one person and they stop thinking. Now a surname alone identifies one person
  15% of the time, a first name 23%, and 18% of people share a full name with somebody.
  Pinned answers cannot pick up a twin: only common-pool names may collide, and every
  generated record still goes through `violates()`.
- **Section 11's cast is pinned**: Dezmond Ellery (the answer, the only record contacted at
  the Alameda St underpass) and Dezmond Achebe, both 1974 and neither with an SSN, plus
  Dezirae, Dezra and Dezhawn so `Dez` returns five. Nobody is filed under Carrow and no
  first name begins `Des`, so both searches he leads with reach nobody.
- Two identifiers, as in the product: an alphanumeric **unique identifier** (`UID#7615QHFVR`)
  under the name in results, and a numeric **Client ID** (`17248`) on the record page.
- 35% of clients are in a household. Members are other clients from the roster;
  membership is reciprocal and every member resolves.
- SSN data-quality codes: full / approximate / client refused / client doesn't know /
  data not collected. Records coded approximate carry a genuinely partial SSN.

## Fidelity: verified vs designed

Verified against user-supplied screenshots — left icon rail, `Clients / Search for a
client`, in-bar filter chips (First Name / Last Name / Alias only), column selector with
locked Client column and Collapsed Fields, pagination, ROI as a results column, the client
record page, the expanded-row household list.

Default column order is **Client · DOB · SSN**. ROI was dropped from the default view on the
owner's instruction — it is not blurred, it is simply not there. Some captures show
`Client · SSN · ROI · DOB` — that is a demo account that had dragged DOB to the end.

**August 2026 — the owner got access to the live interface** and supplied their own captures,
archived in `reference/live-account-2026-08/` with a README saying what each one settles. Same
restriction as the rest of `reference/`: internal only, and **the account holder's name and the
test client in those captures must never appear in a build.** Four things changed as a result,
and two were deliberately left alone:

- **The no-results state was guessed, and guessed wrong.** It is `No results yet!` over
  *Results will be displayed here when they are available.*, beside a magnifier-with-x. It is
  now pinned in `test.mjs` as `EMPTY_STATE` so a drift back to invented wording fails loudly.
  Section 11 is built on this state, so its step copy was updated with it.
- **SSN is masked** on the record page — `***-**-####`, via `maskSSN()`. The earlier decision
  to show it unmasked was reversed once the product's behaviour was confirmed. Every stored
  SSN is still 900–999, so masking is fidelity, not protection.
- **Date of Birth is real.** The old capture showed *Quality of DOB* alone; the live account
  carries both. Our version was right — this is no longer an open question.
- **Client Location is a table**, columns `Address · Date · Type · Created by` plus a scope chip
  and a star, with pagination under it and the map in its own bordered panel below. Address is two
  lines (place over city/state/country/ZIP); Type is two lines (what created the record over the
  field it came from). **Pins are plain teardrops and the Address cell carries a red pin glyph** —
  the lettered A/B/C pins came from the old help article and the live product does not letter them.
  **Map zoom works** (svg and pins share one wrapper so they scale together); layers is the one
  control we do not implement and it says so.
- **A breadcrumb** — `Client Search › Name › Profile` — sits at the left of the top bar, and
  **only on the record page**: capture 01 shows that side of the bar empty on the search
  landing. That is what makes it navigation rather than decoration, so don't render it on
  search. The first crumb returns to Client Search, the name crumb is a step *up* to the
  record's own first page (not a way out), and the last crumb tracks the open tab and is text
  rather than a link. It is the third way back; the orientation still calls out only the
  magnifier and the Clients icon, because those are the two the tour can point at from the
  search page, and adding a third would mean inventing copy the script does not have.
- **Point of Contacts** runs full width below the profile grid: a guidance paragraph, then
  three blocks (First / Second / Third), each with date, name, phone, extension, email,
  supervisor name / phone / extension / email, and category. All three always render — the
  guidance is about what to do when all three are taken, which only reads correctly if the
  learner can see how many are used. An empty date shows *nothing*, not "No value"; an empty
  category falls back to `Select`. The captured account had all three empty; ours carry
  invented staff, because an empty section teaches nothing and *which staff member already
  has the relationship* is a real reason to open the record.
  **PoC people are staff, not participants, and the safety rule matches the SSN one:** phones
  are `213-555-01xx` (555-0100–0199 is the block reserved for fiction) and emails are at
  `example.org` (IANA-reserved, unregisterable). `test.mjs` asserts both ranges and that no
  PoC borrows a participant's name. Preserve this if you change PoC generation.
- **The search card, from captures 01, 08 and 09.** The field has **no placeholder and no
  floating label** — it is plain, empty or full. The card head carries the ⊕ *and a kebab*.
  The **recents hint** ("Showing recently accessed clients…") sits on the landing whether or
  not anyone has been opened yet, with the column header above an empty table. On a search
  that found nobody the **column header disappears entirely** — title, field, empty state, and
  nothing else. The empty state's two lines stack beside the icon.
- **The expanded row is derived, not listed.** It is the collapsed-only fields (Client ID,
  Updated by, Updated on, Gender, Race and Ethnicity) plus **every column currently switched
  off**. That is what explains capture 02: ROI and Household Members were on as columns there,
  so the row showed Alias and Veteran Status, the two that account had off. A field appearing
  in both halves of the column selector is this model working, not a bug. **ROI is the one
  override** — the owner asked for it gone from the view rather than dimmed, so it never falls
  into the expander — **no longer true:** dropping ROI from the default columns was only ever safe
  because columns are switchable, so a switched-off ROI belongs in the expander like any other.
  *Updated by* is a person (avatar chip, name over role); *Updated on* is its
  own field with a date **and a time**.
- **The profile grid follows capture 03's order**, including Middle name, Suffix, Legacy HMIS
  ID, Maiden Name, Pronoun(s) and a **Demographics** subheading. Two date formats on purpose:
  the results table abbreviates (`4/26/93`), the record spells it out (`04/26/1993`). **Age is
  its own field**, not a suffix on the DOB. Empty reads `No value`, no brackets.
  Demographics continues past the detail field with Primary Language, TB Clearance Date, Clinic,
  DPSS ID, *Reviewed for Covid-19 vulnerability and Project Room Key?* and **FEMA Registration
  Number, which is the section's last field and not a section of its own** — we had invented a
  FEMA heading. **Client ID, Unique Identifier, Release of Information and Earliest enrollment are
  NOT on this page**; the identifiers live in the results row and its expander, ROI is a column,
  and Earliest enrollment was ours entirely. Task 13 still works (it is scored on SSN completeness
  and the alias) but its teaching sentence about the oldest enrollment now points at something the
  profile does not show — open with the owner.
- **Point of Contacts: the first block is open, the second and third fold.** Three blocks of
  ten fields is two and a half screens at the end of an already long page; folding took the
  record from 3135px to 2064px. All three headings still show, because the guidance above them
  is about what to do when all three are taken, and a folded block names who is in it so the
  learner can tell whether to open it. Folding is ours, the same trade as capture 04's
  sections — but unlike those, **nothing in Point of Contacts is obstructed**: it is real
  content a learner may want, not a feature the lesson withholds.
- **Capture 04's sections are built but closed** — FEMA, ADA Information, Veteran Information,
  For Veteran Case Conferencing, TLS Ramp Down Exit Pathway (with its amber read-only callout
  quoted as the product words it), Encampment Resolution. Their bodies are obstructed like
  everything else the lesson does not teach. **Collapsing them is ours, not the product's** —
  the owner's explicit trade, so the record reads as the long form it is without pushing Point
  of Contacts off the bottom. Don't "fix" it by opening them.
- **Avatars stay varied**, confirmed by the owner against the live account — the single navy in
  the captures is one client, not the rule. Real records can also carry **photos**; ours stay on
  initials, because a fictional participant cannot be given a real face.
- **Not reproduced, by decision:** the four stat cards above the results table, and the record
  page's right-hand rail. Both serve features these lessons do not teach. Don't add them back
  as a fidelity fix — they can arrive with the lesson that needs them.
- **Nothing in the product surface is invented.** All four kebabs are settled and built from
  captures, every item obstructed: **Clients card** (*Restore Deleted Data*), **results row**
  (*View Enrollments*, *View Services*, *View History*, a rule, then *Delete Client* in red),
  **Location** (*Add Address*, *Add Field Interaction*). The **profile card's** is the route into
  edit mode, which this lesson does not teach, so it names itself instead; Point of Contact Category renders the `Select` placeholder because its
  options are the six from the owner's capture of the dropdown open — real LAHSA and DHS
  programme names, verbatim — and it is left unset on rather more than half of blocks, which is
  why `Select` is the ordinary sight there.
- **Point of Contact dates are written out in full** (`04/03/2026`); the Location table
  abbreviates (`6/2/26`). Same split as the profile against the results table.
- **A household glyph sits before the row kebab, and only on a client who has a household.**
  It is not the Household Members column — that is further left and switches independently.
  Capture 01 shows an individual client without it; the row-menu capture shows it on two
  clients who have one.
- **Race and Ethnicity is a column**, not a collapsed-only field. Column order decides what a
  switched-off column looks like in the expander, which is why the order is `ROI · Household
  Members · Race and Ethnicity · Veteran Status · Alias` — it reproduces capture 02.
- **Counts to keep:** 12 rail icons + expand; 4 top-bar buttons (dark mode, search, new window,
  messages) plus the account chevron; 17 record-nav sections ending in Client Portal, plus a
  collapse control; 4 map controls. The filter menu is **Alias, First Name, Last Name** —
  alphabetical, which is the live order.
- **Popovers clamp to the app's right edge, not the window's.** The training panel is docked
  right; a popover allowed the full window width opens underneath it.
- **The Location map is drawn, not fetched** — the lesson is one self-contained file and makes
  no network requests, so there are no tiles. It is built the way a map tile reads: the
  background *is* the built-up ground and the streets are cut out of it in white, over a minor
  grid, with arterials cased, freeway ribbons carrying numbered shields, the river, parks, and
  a scale bar and zoom stack as furniture. Streets are **named after the ones `LOCATIONS`
  refers to**, so a learner reading "Vermont Ave & 8th" can find both on the map; if you add a
  location, add its streets. Zoom does nothing and is not meant to — a live zoom is a promise a
  drawn map cannot keep.
- **`data-locked="crisp"` is the escape hatch for small controls.** The blur reads as a
  rendering fault on anything the size of a 26px zoom button or a three-dot kebab, so those
  stay sharp and explain themselves on click instead. The point is that the lesson does not
  teach them, not that they have to be illegible.

The **Household Members** column renders properly now (member chips with relationships, or
*Individual client / No household members*), but ships **off by default** — the owner wants it
available, not present.

## Gotchas that cost time

- `[hidden]` loses to any `display:` value. There is one global
  `[hidden]{display:none !important}` — keep it, don't patch per-element.
- CSS class collisions: a `.zero` pill modifier inherited the empty state's `.zero`
  padding. Namespace modifier classes.
- Piping `git push` into `tail` masks its exit status — a failed push reported success.
  Capture the output, don't pipe, when the exit code matters.
- The `localStorage` key for saved columns is versioned. Bump it when the shipped default
  changes, or existing users keep the old layout forever. **This only matters outside the
  launcher** — a `srcdoc` frame has an opaque origin, so storage throws there and the lesson
  runs on defaults. The throw is caught; column changes still work for the session, they just
  are not persisted.
- **The arrow's side comes from her whole cluster, not her face.** Her bubble sits beside the
  face, so a side chosen from the face alone can be the side the bubble is on — the arrow then
  has to cross it, and to dodge it ends up laid along the anchor's own row, covering the
  anchor's neighbours in order to point at the anchor. That is what put it on top of the
  dark-mode button while explaining the magnifier. Measured against the cluster, the side it
  picks always has open space in it and the arrow lands there by construction.
- **She is drawn *below* the training panel**, so a bubble that strays over it goes behind
  rather than burying the task. The exception is a beat pointing at something *inside* the
  panel (`popout`, `minimise`, `task`): there is nowhere to stand that is not over it, and
  underneath it her own Next button cannot be clicked. Those beats add `.over-panel` to the
  layer and drop `#coachWin` from keep-clear — asking the solver for the impossible only made
  it pick the least-bad corner.
- **The top bar is keep-clear.** It is a packed row of small buttons; pointing at one used to
  park her cluster on its neighbours.
- **The `?` in the panel bar is a hover, not a button.** It used to replay the whole
  orientation, which is a lot to sit through when you only wanted to remember what the two
  icons beside it do. It has no click handler and starts nothing.
- **An obstructed control does nothing at all.** It used to open a modal explaining itself, which
  meant every stray click on the dimmed interface interrupted the task with a box to dismiss —
  and a control that answers back does not read as out of use. `bindLocked` swallows the click
  and nothing else. The orientation says it in words once, so it does not need saying again.
- **A tour beat can drive the interface** via `act:`. The orientation walks a record rather than
  describing one: it types a name, opens somebody, names the profile fields, opens Location, then
  hands everything back — search cleared, record closed, **recents cleared too**, because the
  learner did not open that person. `TOUR_DRIVING` makes the evaluator ignore it; without that
  guard, opening the demo record scored as an attempt at task one and tore the tour down
  mid-sentence. `demoClient()` picks somebody who is not the answer to any task, so the walk
  cannot hand over a record the learner is about to be asked to find.
- **Anchor a beat at something small.** `#profGrid` and `#locBody` are whole panels; an arrow
  cannot point at a 600×800 block and the solver has nowhere to stand beside one. The card heads
  work because they are small and sit at the top of the thing being described.
- **The orientation types its searches out**, a character at a time, through the real `input`
  event — so the demo goes down the same path a learner does, debounce and all, and the list
  narrows under the field instead of appearing all at once. It pauses at each space, which is
  what lets the 220ms debounce fire once per word. `stopTyping()`'s generation counter kills
  anything still in flight when the learner clicks Next, so two beats can never type into the
  box at once. Borrowed from the RoninWrite tutorial, which does the same thing with a script.
- **The task panel folds away for the walk** and comes back at the beat about the magnifier —
  not at the very end, because folded its title bar sits over the top-bar icons and the next
  two beats point at two of them. `setPanelMin` is the ONE entry point: the state lives in two
  places (`#coachWin.min` and `html.dock-min`, which reserves the dock column) and they used to
  be set in three, which drifted. The window came back while the column stayed reserved, so the
  results table kept full width and its last rows sat under the panel where nothing could click
  them. Asserted both ways in `test.mjs`.
- **It opens on a title card.** `hero:true` on a beat draws her at full size with the words
  beside her at title size and nothing round them, over a scrim. **Hero is a property of the
  line, not a mode** — `LZ.say` sets it from its options, so any ordinary line clears it. It was
  toggled on and never off once, and every feedback bubble for the rest of the lesson inherited
  the title styling *and its full-stage scrim*, which sat over the results table and swallowed
  clicks on it. The card greets without introducing her: they met her in the course intro.
- **The panel is draggable wherever it is**, docked or popped out, by its title bar. It used to
  be draggable only when popped out, on the reasoning that a docked panel that moves is a lie —
  that stopped being true once the dock column was reserved unconditionally, because moving it
  now costs the interface nothing.
- **Nothing the panel does may reflow the interface.** Not collapsing it, not popping it out.
  The dock column is reserved whatever state the panel is in, so a popped-out panel leaves an
  empty gutter behind — a stable layout is worth that, and a search field that changes width
  under the learner is not something the product would ever do. `--dock` is now constant;
  `test.mjs` compares rects across collapse, restore, pop-out and re-dock.
- **Section 7's orientation is sixteen beats**, the last of which points at the task box and
  says to start. Before that the tour simply stopped, leaving the learner facing an interface
  with no sign the work had begun. Beats 6 and 7 cover pop-out and collapse, because the panel
  is ours rather than the product's and nothing in the script describes it.
- **Lashes' pointing arrow: `side` names where the *anchor* is, relative to her.** It used to
  mean the opposite — which side of the anchor her cluster sat on — and when `placeArrow` was
  rewritten to derive the side from settled positions, the `POINT` degree map was left on the
  old meaning. Every arrow then pointed 180° out, back at her own face. The base drawing's tip
  is its bottom edge and CSS rotates clockwise, so reaching *right* is `-90`. `test.mjs` now
  measures the rendered rotation and asserts the tip is farther from her than the arrow's own
  centre; since the arrow always stands in the gap between her and the thing, that single
  invariant catches every way of getting the rotation wrong. Asserting "the arrow is visible"
  was what let it through the first time.

**`docs/on-screen-inventory.md` catalogues every box on screen** — which layer it belongs to,
who is speaking, and what each border colour on Lashes' bubble means. Read it before adding
anything new to the screen, and update it when you do.

## Delivery: Rise, with the simulation embedded

The plan is a Rise 360 course with this lesson embedded as an HTML block. `HMIS BNTS -
Search/docs/embedding.md` is the reference; the two things to keep in mind before
changing anything in this area:

- **Rise has no scripting, so nothing embedded in it can report back.** In Rise the
  simulation is practice and Rise's own quiz must carry the score. Only a Storyline block
  (which does have JS triggers) can receive the lesson's messages.
- **Talking to the LMS is opt-in via `?scorm=1`**, which only our own manifest sets.
  Without that guard the lesson's frame-walk would find the *host* course's SCORM API,
  reset its status and call `LMSFinish` on unload. Do not remove the guard, and do not
  make SCORM the default again.

Reporting to a host goes over `postMessage` as `{source:"hmis-sim", type, …}` — `ready`,
`task`, `complete`. Tests cover both halves: silent when embedded, reporting when launched
as the package.

**How it actually launches.** A Rise Code block holds a shell (`lesson1launcher.zip`): a slim
card with Lashes, a title and a Begin button. Begin mounts the lesson into a **`srcdoc` iframe
that is still `display:none`**, then reveals it and requests fullscreen on the shell's own
document. Three consequences the sim has to live with, all covered by tests:

- **It boots at 0×0.** Everything placed against measured rectangles — the movable window,
  Lashes, her bubble — has to recover when the stage is revealed. A `resize` inside the frame
  is what triggers that.
- **`location.search` is empty**, so `?scorm=1` can never be set from the launcher. SCORM stays
  off, which is correct: the shell relays every `postMessage` up to Rise, and `type:"complete"`
  is what marks the block done.
- **Esc leaves fullscreen but does not unmount the frame**, so the shell can show
  "Paused — your progress is saved" and Resume genuinely resumes. In-session state survives;
  a block reload still starts over.

**The task embeds are the interface and nothing else.** `task-embed-1/2/3` sit inline in the
Rise page rather than launching, and the slide above each one carries the instruction — so
there is no step pane, no side rail and no training panel inside the frame, and the app runs
edge to edge (`html.step .app{top:0;left:0;right:0;bottom:0}`). Repeating the slide's words
inside the block said the same thing twice, in a smaller font, in a box the learner had to
look past to reach what they were told to do. All that is left of the copy is the feedback
the script attached to a task, which **Lashes** says once it is done; an embed the script
gives nothing to say stays silent and simply completes. Two things follow:
- **She is placed in an embed, not solved.** The placement solver is built for the lesson's
  own stage — a tall window with a docked panel and keep-clear regions — and in a 600px Rise
  block it parked her bubble off the right-hand edge whatever it was anchored to. In `html.step`
  she is a fixed bottom-right cluster and the arrow, which has nothing to point at, does not draw.
- **Her bubble takes pointer events only when it is `.on`.** Silent, it still holds its box in
  that flex row, and an invisible 560px panel over the bottom-right of the results table eats
  clicks on the rows under it.
- **Completion leaves the block entirely** — it is a `postMessage`, not a line of text. So the
  embed tests play each one *in a frame*; a top-level page asserts the gate and silently skips
  the contract that marks the Rise block done.

## Where this lesson sits — HMIS Essentials

The existing course is **HMIS Essentials (v1.1.0)** on `cta.lahsa.org`. Its five training
objectives are the series' decomposition, and they were approved long before this project:

The series continuing on from this lesson is **HMIS Basic Navigation**, so objectives have to
be divided cleanly across it — this lesson must not spend objectives that later lessons need.

1. Identify the reasons why using HMIS correctly to enter data is important
2. **Search and find a participant's HMIS record to learn their back story** ← this lesson
3. Correctly create a new HMIS record for a participant that does not have one
4. Enroll a participant into a program and perform services, run an assessment, write a case
   note, and upload documents
5. Access the HMIS Knowledge Base to further expand your HMIS knowledge

Two consequences, both live questions in the script:

- **Objective 01 is not ours.** "Why entering data correctly matters" is most of what our
  Introduction and Key Terms slides do. If Essentials stays, we are teaching it twice.
- **Objective 02 is narrower than what we built.** Find the right person and read their
  history: clearly in. Choosing between three matching records and reporting duplicates to
  HMIS Support: probably not — those are the last two tasks.

**Styling is not in scope yet — don't write visual direction into the script.** The Essentials
screenshot was shared to check objective alignment across the series, not as a look. Production
notes say what a screen must do and what the learner does on it; how it looks is a later pass,
with sources and external links.

## Field practice, from the user — outranks the draft where they conflict

- **Search order is first name, last name, DOB. SSN comes later.** The vetted draft says to
  start with DOB *or SSN* because names get misspelled. That is not what staff do. Where the
  draft and the user disagree about practice, the user wins; the draft still governs policy.
- **The work happens on a phone or a tablet, standing up.** Not at a desk. That is a fact about
  the job the lesson depicts, and it shapes the *content* — what a worker can realistically do
  one-handed at a cleanup.
  **It is not a fact about taking the training.** The simulation is launched full screen on a
  desktop. It was built responsive on a misreading of the note above; the narrow-viewport branch
  has been removed rather than left in untested. Do not reintroduce it, and do not raise mobile
  layout as a gap again.
- **The usual opening is a city cleanup, and the participant approaches them** — most often
  asking whether there is an update on interim housing. It is not a quiet first contact
  initiated by the worker. The request for information is what makes pulling the record
  necessary, which is a better motivation for search than the current "Meeting Ana" opener.

## The script is the source of truth for copy

`HMIS BNTS - Search/Script - HMIS BNTS Lesson 1 - Finding a Participant.docx` is the
lesson script. **It is generated** — edit `HMIS BNTS - Search/script/make_script.py` and
rebuild; never hand-edit the docx. Every task in it is transcribed from the built lesson
via `script/extract_tasks.mjs`, so the script documents the situation, instruction, hint,
correct record and feedback exactly as the learner meets them. Authority still runs
script → build: the script is approved first and the build follows it.

**Format comes from two documents, and they are not the same.** `NHO.docx` supplies the
conventions — legend table, table of contents, bold+underline sections, italic production
notes, green/orange knowledge-check answers, red questions back to the author; the owner has
confirmed the colour code stays. The *final* AIAN Module 1 script and storyboard
(`reference/`) supplies the shape: **numbered slides, `Slide <section>.<slide> – Title`**,
narration written as spoken text, on-screen text inline, interactions described in place, and
standard front and closing slides — Course Navigation, Course Overview, Objectives ("By the
end of this lesson, you will…"), Lesson Structure, Lesson Closing. Our script is the two
combined.

**AIAN is a reference for presentation only, not for instructional approach.** It has no
knowledge check anywhere in Module 1; ours keeps its six questions. Don't raise that as a
discrepancy again — it was asked and answered. Task titles and teaching copy in the build track that script.
**Change the script first, then the build.**

It was developed from an earlier draft, `script_finding_a_participant_v3`, which is the
authority on LAHSA policy and was vetted internally before this project began.

**Two tasks are deliberately easy.** Task 6 (Adrian Fenwick) and Task 10 (Yolanda Amari)
name the participant outright, so typing the name finds the record and skips what the task
teaches. Closing that would mean inventing a second person with each name, turning both into
tasks about duplicates. The owner's call was to leave them: a couple of early wins gives the
learner hope in a lesson this long. `tools/obviousness.mjs` lists them under `ACCEPTED` with
the reason, so the check stays green and nobody quietly re-opens it.

**Every task must trace to a paragraph of that draft.** Two tasks that did not — searching a
date with different separators, and reading the ROI column — were built and then removed once
the provenance was checked. The separator behaviour is real, but it comes from Bitfocus's help
article rather than LAHSA's own documentation; ROI-in-results was our invention entirely. Both
are fine as *instruction*; neither earned a scored task. Apply the same test to anything new.

**Direction from the owner that overrides earlier passes:** do not talk about HUD standards —
say *data quality* instead; data-quality codes belong to the create-client lesson where the
learner sets them. And **never punt** ("we'll cover that later") — dim what the lesson does not
need, and where something cannot be skirted, give just enough to fill the blank. The simulation
dims unused controls and each lesson unlocks the part it teaches, as a visible reward.

The fourteen tasks split the way the draft does: eight on searching, a non-scored beat on the
seam, then six on verifying. **Task 11 (confirm the profile by location) is specified in the
script but not built** — it was requested in review, it traces to the draft's "Still Unsure"
list, and it needs location history on the client record page, which the simulation does not
show yet. The lesson's own `tools/gen_roster.py` carries a comment on each pinned client
naming the draft paragraph it serves.

Each task is documented as a **two-column table** — Draft reference, Situation, Instruction,
Hint, Correct record, Feedback — rather than a run of sub-headings. Thirteen tasks × six
headings was accurate and unreadable. `kv_table()` in `make_script.py` builds them; a cell
takes a list when it needs several paragraphs.

Two conventions to preserve:
- Narration says **participant**; the simulated product says **Client**. Both are correct, and
  the script names the difference once rather than hiding it.
- The lesson has no Skip. A hint is always available instead.

Two steps the simulation cannot cover, written as instruction in the script: the **Outreach
module** location search, and **first-level verification** (record photo and the Files tab).

## The knowledge check — slide 13.1, dealt as cards

The manager asked whether it was needed at all given the practice, and if it stayed, how it
could be gamified. It stays, as a card table: **`src/kc.template.html` → `dist/knowledge-check.html`**
plus a Rise zip, its own Code block. Lashes deals three answers face down, they turn over
together, the learner picks one, and the feedback is the sentence the script already carries.

- **`script/kc_data.py` is the single list.** `make_script.py` renders it into the docx and
  `build.sh` writes it to `src/kc.json` and stamps it into the page. Edit the questions
  there, rebuild both; the test compares the built page against `kc.json`.
- **No unscripted microcopy.** Instructional asides in my own voice — *Take the card you
  would act on*, *5 gets you through*, *you need 5* — were written into both knowledge
  checks and the owner struck them out. Copy in a KC comes from `script/kc_data.py`, or it is
  a button label, a card mark, or a bare count. Nothing narrates, nothing coaches, nothing
  explains the gate at you while you play. The fail screen states the requirement once,
  because otherwise the gate is arbitrary; that is the only exception.
- **A card cannot be clicked while it is face down.** The deal is the theatre, but a blank
  card you can pick is an invitation to guess, which is the one habit this lesson exists to
  break. The hand goes live only once every card has turned over.
- **The pass mark is whole questions, not a percentage.** `NEED = ceil(0.8 × 6) = 5`.
  Five of six is 83% and *passes* — that is not a bug, and the test fixture answers four to
  exercise the failing path. Below the mark it deals the missed questions back, reshuffled,
  and the learner cannot get past it any other way.
- **`complete` is withheld until they clear it**, and is the only thing the page ever sends
  besides `ready`. **No score, ever** — there is none in these simulations and Rise could not
  receive one. The tally on screen is for the learner, so the gate makes sense to the person
  facing it; `test.mjs` asserts no message carries `score`/`percent`/`correct`/`points`.
- **It is a card dealer, not a fortune teller.** The mechanic came from the manager's note;
  the framing did not follow. The lesson's whole argument is that you do not decide on one
  signal and you do not guess, and a deck that reads the future says the opposite — on
  records of people in homelessness, that is also a tone risk not worth taking.
- The character is drawn from the **same SVG and palette as the lesson**, copied rather than
  imported because the page is standalone. If her face changes, change it in both.
- **There is one of her and she moves.** Three slots can hold her — question, feedback,
  reading — and exactly one ever does; she poofs out of one and into the next (`lashesLeave`
  / `lashesArrive`, and `clearSlots` guarantees the invariant even if a move is interrupted).
  The first build drew her in two slots at once, which reads as two of her rather than one
  character crossing the panel. That is also why the end screen has no question bubble: it
  would be a second bubble with nobody beside it. `test.mjs` counts `.lashy svg` at every
  stage and it is always 1.
- **The feedback takes the question's slot, not the hand's.** It lays over the question and
  the question fades out beneath it, so **the cards stay on screen and marked** — the
  learner reads the reason and looks back at what they picked at the same time, which is
  the whole teaching value of marking them. It used to cover the cards and re-state them in
  words (*You took A…*); that line is gone, because it was a workaround for hiding the
  thing it was describing.
- **`.mark` belongs to the front of the card only.** The back's crest was briefly given the
  same class, and the back comes first in the DOM, so `querySelector('.mark')` wrote every
  *Your card* / *The one to take* label onto the face nobody was looking at. The lookup is
  `.front .mark` now and the back's element is `.crest`. `test.mjs` asserts the back holds
  no text.
- **The earlier arrangement, for the record: the feedback lay over the hand.** As a new row it grew the
  block ~150px on every pick, which shunts everything below it in Rise. `#said` is now
  absolutely positioned inside `#stage`, and the panel names the card taken in words
  (*You took A. The one to take was B.*) because the marks on the cards are behind it.
  `.ask` has a `min-height` for the same reason: a three-line question and a one-line one
  take the same room, so **the block is 402px in every state at every width**. `test.mjs`
  measures it before and after a pick; asserting the feedback is merely visible would pass
  either way.
- **The hand fades to nothing under the panel; the panel does not mask it.** A near-opaque
  panel still let the picked card's 10px lift and its coloured ring show past the panel's
  edge, which reads as a rendering fault. The invariant is that there is nothing behind the
  panel to show through, not that the panel is opaque enough — asserted on `#hand`'s
  computed opacity.
- **She is not present for the question.** Two slots, not three: she turns up for the
  feedback and for the reading. Her arrival *is* the answer landing, which is a stronger
  entrance than a face that was already sitting there, and the question pill takes the width
  she was using. `test.mjs` asserts zero of her while the cards are live.
- **The container is transparent and the bluish is on the popups.** It was the other way
  round — a tinted panel with white bubbles in it, which reads as a thing bolted onto the
  Rise page. Now the question pill, the feedback panel and the card faces carry `--panel`
  and the container carries nothing, so it sits on whatever Rise puts behind it.
- **The card back carries the real logo.** `src/lahsa-logo.png` is the official square
  lockup, scaled down from the 2000×2000 master in `42Ronin/LAHSA` — scaling is the whole
  of the permitted latitude. `build.sh` and `make_maker.py` both inline it as a data URI at
  the LOGO token; when the file is absent both emit `null` and the back falls back to an
  abstract crest. **Clear space is the height of the gold LAHSA bar on every side**, and
  that bar is 33.4% of the lockup's height — the CSS is sized so that holds at every column
  width, and `test.mjs` measures it rather than trusting the number.
  **Colours come from `brand/README.md` in the LAHSA repo, not from sampling the artwork**:
  teal `#006688`, gold `#b99c00`. Both are surfaces there, never inks.
  **Open question for the owner:** that style guide says there is no red in the palette, and
  this page uses one for a wrong answer. Ask before changing it — an answer check that
  cannot show red is a real instructional constraint, not just a colour swap.
- **Never draw the LAHSA logo.** The card back carried a hand-drawn approximation of it for
  one commit and that was wrong: an approximation of a real organisation's mark *is* a
  modified logo, and flagging it as approximate in a comment does not make it acceptable.
  The mark on the back is abstract, and stays that way. **The colours are a different
  question** — LAHSA blue and gold on the card back are fine, because a palette is not a
  mark. If the real artwork is added to the repo, inline it as a data URI; do not redraw it
  from a screenshot. The same rule covers the wordmark: setting "LAHSA" in some near-enough
  typeface is also a logo.
- **The pause between picking a card and the feedback arriving is 300ms.** It was 620 and
  read as twice as long as it should. The marked cards stay fully visible through the
  panel's own fade, so the pause only has to be long enough to register the card, not to
  read it.
- **`dist/kc-teller-prototype.html` is a different staging, not a theme.** Cards as objects on
  a table, laid in a fanned spread; the taken card rises and the others fall back; progress is
  six gold stones under the spread. Built from `src/kc-teller.template.html`
  and the same `src/kc.json`, so its copy cannot drift from the docx either.
  **The style guide does not govern it** — the owner said so explicitly, so it has its own
  palette (aubergine night, wine velvet, gold, parchment) and a serif. **The logo rule is
  separate and still absolute**: real artwork, whole, never redrawn.
  **The page background is transparent** and the scene is a bounded stage inside it, because
  this sits in a Rise course and the page around it belongs to Rise. `--stage-bg` is there if
  a block ever wants a ground colour; do not paint `body` directly.
  It keeps the three non-negotiables: no picking a face-down card, no score ever leaves the
  page, completion withheld until the pass mark.
  **The vessel is a crystal ball, and the ball is DARK.** That is the whole lesson of the
  Leota-style references: the glass is nearly black and the only lit thing is what is
  suspended inside it. Lighting the glass itself made it read as a glowing panel — the
  inner bloom was what killed it. Dark glass, a hard specular where the light source is, a
  rim catching light, and the contents glowing cyan-white.
  **The orb is an apparition, not the furniture.** The question is a plain pill — the light
  card with the teal left border, the way it read before any of this — and the ball poofs in
  over it with the reading and poofs out again on Next. It carries Lashes, the verdict, the
  reading and the button; nothing else is ever inside it. Her empty slot must `display:none`
  or the question sits 44px below the ball's centre. It was a wide panel that held everything
  for a while, and that is worth remembering: a full-width bar reads as a banner, not an
  object.
  **There is no label over the reading.** "THE READING" named what the learner was plainly
  looking at, and the room it took is better spent on her.
  **Her viewBox is cropped to her drawing.** Her ink measures 71.5 × 61 in the 100-square box
  the SVG was authored in, so a third of her was nothing — cropping is 1.3× of size for no
  layout at all, and the square keeps a margin the bob and the tilt move inside.
  **She cannot be doubled.** The ball's contents are centred in it, so growing her pushes the
  reading and the button toward the rim, and the ink leaves the glass somewhere past 110px.
  108 with the cropped box is about 1.6× what she was; a literal 2× needs a ball near 490,
  which would hang over the answers. Measured, not guessed — and measure the *ink* (line rects
  via a Range, the button's own box), never `.inner`'s corners: it is a full-width flex box, so
  its corners sit outside the circle while everything drawn in it is comfortably inside.
  **Where the reservation goes is the whole layout problem.** A 380 ball has to have 380 of
  room, and the page is mostly the state where she is *not* there. Reserved in flow it left
  one long drop to the cards; the question is **centred** in the slot instead, so the same
  room is two short gaps and neither reads as a hole. The ball covers the question either way
  — 380 over a 106 pill. The rest of it hangs over the row above the cards, and the tally
  moved *below* the spread because a count half-behind the glass reads as a mistake rather
  than as depth. Nothing moves between the two states; `orb.mjs` asserts it.
  **The overlap is measured against the first rendered line of every answer**, in every taken
  position — a Range over the text, not the box, because the box is flex-filled and says
  nothing. The floor is ~9px. One thing had eaten it invisibly: the **taken card rises**, and
  22px with scale 1.07 put its own first line inside the ball, on the one card the learner
  most wants to read. 12px and 1.04 now. It survived an earlier measuring pass because that
  pass always took the card in position A.
  **Where the answer sits in the card and how big the white gap is are the same number.** The
  ball has to clear the first line, so every pixel the text rises the whole spread drops.
  Measured on a 242px card: text hung from the bottom is 83px of gap, centred 106, set to the
  top 132. Bottom-set was tried and rejected — it puts the blank in the card's top half, which
  is the wrong half to spend it in. **Centred is the trade.** A shorter card does not help
  either: it walks its own top down and that room stops being card and becomes white gap, one
  for one. `.spread` keeps its height for the same reason — the cards are bottom-aligned in it,
  so shrinking the box walks every card upward.
  **Anything measuring the ball must wait for it to settle.** Its transition is a spring
  (`cubic-bezier(.3,1.5,.45,1)`), so it overshoots to ~471 on the way in; a guard that waited
  for "width > 375" measured mid-overshoot and every fit came back flattering. Wait for the
  rendered width to match `offsetWidth`.
  **Sizing is arithmetic.** The content box is 68% × 73% of the ball, and (0.34/0.5)² +
  (0.365/0.5)² = 0.997 — anything under 1 is inside the curve. The table screen carries a
  second button and does not fit that box, so `.orb.table` trades width for height at 59% ×
  79% (0.97). A circle spends most of its own area on nothing; every extra line costs width.
  **Next is a permanent child of the foot.** The table screen used to write its two buttons in
  with `innerHTML`, which deleted Next — so after *Lay those again* the next reading had no
  button and setting its label threw. The table's buttons get their own box beside it.
  **The cards sit on whatever Rise puts behind them**, and the page is transparent — but the
  composition assumes a LIGHT page, because the white is doing the work of the room.
  Two traps worth remembering: a `conic-gradient` converges to a hard star at its own
  centre — it showed as a crease until it was blurred, oversized and its centre pushed off —
  and the card the learner *should* have taken must not be dimmed with the rest, or the
  answer becomes the least legible thing on screen.
  **Her costume sits on the rim, never the glass.** A scarf over the glass covers her lashes,
  and she is called Lashes. The lesson's drawing is untouched.
- **The Card Dealer staging was rejected on sight and rebuilt.** The owner's words on the
  first attempt: *her design is just the fortune teller but green, and nothing about it makes
  sense as a card dealer.* Read that as the diagnosis it is — the theme was built by restaging the teller's
  furniture (her costume in the teller's own envelope, the same card fan, the same chips-for-
  stones swap) and recolouring it, which is exactly the "reskin, not a new approach" the owner
  ruled out when the teller itself was commissioned. **A dealer is a person doing a job**: the
  hands, the shoe, the cut card, how a card is actually dealt and turned, what a dealer does
  while you decide. None of that is in it. Whatever replaces it has to start from that, not
  from this file's palette. It is left in the tree and in the maker so there is something to
  argue with; do not treat it as approved.
- **`dist/kc-dealer-prototype.html` is the rebuild, and it is built round the CHIP.** The
  verdict arrives as a poker chip thrown onto the felt, **and Lashes is the chip's inlay** —
  that is the owner's idea and it is what makes the staging the table's own rather than the
  teller's furniture in green. A chip is what a table pays out in.
  **She is on the chip and nowhere else**, so she is absent for the question again, as she is
  in the other two: her arrival is the answer landing.
  **A question with feedback switched off gets a check or a cross in her place.** There is
  nothing for her to say, and a face with no words beside it is a character waiting for a line.
  Both are drawn, not typed — a glyph arrives in whatever the reader's font has for it.
  **The chip's edge spots are a `conic-gradient` with hard stops**, which converges to a star
  at its own centre. That is fine *here and nowhere else*: the inlay is an opaque disc over
  the middle, so the artefact is covered by construction rather than by blurring it away.
  **The rail is leather, all the way round.** It was a brown bar across the top only, because
  she stood behind it; she does not stand anywhere now, so it went back to being what a rail
  is — the edge of the table.
  **The question is glass on the felt**, not a parchment slab laid over it: the green reads
  through, which is what keeps the table one object.
  **The places are painted on the felt and the cards are square in them.** One outline per
  answer, generated with the hand, so a five-answer question gets five places. They frame the
  card 8px proud on every side. **The dealer's cards lost their tilt for this** — a tilted card
  leaves the outline showing as a sliver behind it, which reads as a misprint. The teller keeps
  its fan; there the cards are objects on a table, not a dealt hand.
  **One box holds the question and then the reading**, stacked in a single grid cell rather
  than swapped, so it is as tall as the taller of them and the table cannot move. Positioning
  the reading absolutely instead left the box at the question's height and put the Next button
  out on the felt.
  **The reading is written at the deal, not at the pick** — while it is still hidden — or the
  bubble grows by whatever the feedback needs and walks the whole spread down the table. The
  hidden layer uses `visibility` as well as opacity: it has to keep its box, but a merely
  transparent element is still in the accessibility tree, and the reading must not be readable
  before the card is taken.
  **Nothing hangs over the spread**, which is why this staging has none of the ball's clearance
  arithmetic: the answers are centred in their cards because there is nothing to clear.
  **She wears nothing at this table.** The teller dresses her because the ball is a scene she
  is inside; here she is the mark struck on a chip, and a chip's inlay is a face, not a
  character in a hat. The lesson's drawing, untouched. (If anything is ever put on her here,
  the teller's rule governs it: on the rim, never over the glass, above every lash at every x.
  She is called Lashes.)
- **`TILT[i]` was read straight and the maker allows five answers.** `TILT` has three entries,
  so a four-answer question set `--tilt:undefined`, which makes `rotate(var(--tilt))` an
  invalid transform — the whole declaration is dropped, **including the `rotateY(180deg)` that
  turns the card over**, so the fourth card never showed its face. The teller wraps with a
  modulo now; the dealer has no tilt at all. Anything that indexes a fixed array by card
  position has this bug waiting in it.
- **The shipped check's layout is still plain.** A dealer's-table scene was discussed and parked;
  hands or props on her would live in the character SVG, which is copied in **four** places
  now (lesson, page, teller, dealer) and should be extracted before anyone draws on it.

## `tools/kc-maker` — the knowledge check as a tool

The card check is now authorable. `tools/kc-maker/kc-maker.html` is one file you open in a
browser: set the question count, write questions with three to five answers and one marked
correct, write the feedback, set the pass mark, press Export.

- **The Name field names all three outputs**, and the file *inside* the zip is always
  `index.html` whatever the zip is called, because that is what Rise looks for.
- **Themes are a selector, not a mode.** The maker carries one page per theme — Standard,
  Fortune Teller and Card Dealer — and the selector changes **only what is
  previewed and what is exported**. The questions, answers, feedback and pass mark are the
  same work whichever staging ships them, so nothing else in the editor knows a theme exists.
  The editor reads the list off the pages the build embedded rather than naming any of them,
  and a page qualifies only if it carries exactly one KC token and one LOGO token.
- **Kind is the other axis, and unlike theme it DOES change the editor.** `PAGES` in
  `make_maker.py` is one row per kind-and-theme pair; `RULES` in the editor is the whole of
  the difference between kinds in one place, and everything else asks it rather than naming
  a kind. Two exist:
  - **`kc`** — the scored card check. A deck, one correct answer per question, a pass mark.
  - **`copperfield`** — an interactive box that only *looks* like a question. Two or three
    answers, **none of them right or wrong**; taking one disintegrates it, and when the last
    has gone the question goes with it and what was written underneath is what is left.
    Named by the owner. It exists to keep content fresh as a learner works through it, not
    to test — and making them clear every answer before the box opens is elimination, which
    is the habit the lesson is arguing for.
    **A card DUSTS, it does not poof.** The first cut reused the card check's shrink-and-spin
    and the owner's note was that it should be the Infinity War disintegration. So: a soft
    diagonal edge sweeps across the card (a `@property --dust` percentage animating a
    gradient mask, because a gradient's own stops cannot be animated) and ~170 fine motes
    carry off up-and-right, each one's delay taken from **where it sits along that sweep**.
    That last part is the whole effect — released together they read as a cloud let go from
    behind the card rather than the card coming apart. Motes are kept low and short: drifting
    far enough up, they cross the question above and read as litter.
    **It is taken by HOVER, and a hover COMMITS.** The card starts coming apart on the first
    frame the pointer is on it and goes whether the pointer stays or not — there is no
    pointerleave handler and no way back. It used to knit back if you left mid-fray, to stop
    a mouse crossing the row clearing the table; the owner's call was that the reversal read
    as the card recovering from a mistake, and an answer here is not a mistake but something
    taken. The ~420ms dwell is now only the length of the first phase, not a gate, and the
    accepted cost is that crossing the row does take what it crosses. Held as a pause with only a lift and a border highlight to
    show for it, the effect started late and the card seemed to sit there doing nothing
    before suddenly going — the owner's note was "start the disappearing act sooner", then
    "we don't need the lift and highlight, it can go right to it". There is now no hover
    styling at all: the card eroding under the pointer is the cue.
    **This is why `--dust` is driven by TRANSITIONS, not keyframes** — a transition runs from
    wherever the value currently is, which is what lets the fray reverse on leave and lets
    the commit carry on from however far it got instead of snapping back to the start.
    Motes trickle from the fraying edge during the dwell and the full burst goes on commit;
    **each mote removes itself on `animationend`**, or hovering on and off leaves a drift of
    dead spans in the slot.
    **The question goes the way the answers went, and it OVERLAPS the last one.** It is the
    last thing on the table once the cards have gone, and flipping it off with the rest of
    the live state read as a flash; it dusts on the same sweep, starting about halfway
    through the final answer's rather than waiting for it to settle — queued, the pause
    between them read as the box stalling before it got to the point.
    **Its class goes on before its motes are built.** Two hundred elements created in the
    same frame as the class left the transition waiting behind that work and the sweep did
    not start moving for about 200ms. The reveal has the same ordering for the same reason —
    words armed first, motes after.
    **And the writing overlaps the question in turn.** It starts a quarter of the way into
    the question's sweep, so half of it is in before the question has gone; both sweeps run
    left to right, so the words arrive in the WAKE of the erasure rather than over the top
    of it. The state the question is in is only switched off once its own sweep has
    finished, or the fade would cut the disintegration short.
    **Cost lives in `blur()`, not in the mote count.** Thirty words animating a 9px blur
    over the question's own motes starved the main thread for ~290ms; at 6px it is 116ms and
    reads the same. Measured by how badly a `setInterval` gets starved, which is a decent
    proxy for whether the animation itself is stuttering. **Click and the keyboard
    still take a card** — hover is the interaction, those are the floor, because a pointer is
    not something every learner has and a box that cannot be finished is worse than one
    finished the ordinary way. All three routes are asserted, as are the crossing mouse
    taking nothing and the cards it grazed knitting back.
    **It is ONE box, not a deck** — a series is several exports, each embedded on its own
    slide — so there is no mark, no question list, and the gate is *exhaustion*. It reports
    `complete` when every answer has been taken, and still no score.
    **Standard only, deliberately**: a disappearing-answer trick has no obvious form in the
    teller's orb or on the dealer's felt, and three stagings × two kinds is six renderings
    to keep true. A kind with one staging shows **no theme selector at all** — a list of one
    invites somebody to go looking for the others.
    **The vanished answer's slot keeps its box.** A card that took its space with it slid
    the answers still on the table under the cursor, so the next click landed on something
    that had moved — the same class of defect as the feedback panel growing the block.
    **Both states live in one grid cell** (`.stage > *{grid-area:1/1}`), so the block is the
    same height throughout and Rise never shunts the slide under it; the hidden one uses
    `visibility` as well as opacity, because a merely transparent element is still in the
    accessibility tree and the reveal must not be readable early. Asserted in the maker's
    `test.mjs`, which plays the export in a frame like every other.
- **Feedback is per question.** A question can ship with none: the cards are still marked
  right and wrong and the learner goes straight on. Switching it off **disables the box
  rather than clearing it**, and the writing round-trips through save/open and
  localStorage — someone who switches it off, exports, and switches it back must not find
  their paragraph gone. Validation stops asking for what is switched off, the export sends
  `fb:""`, and every page hides an empty feedback box so there is no hole where a paragraph
  would have been.
- **The preview is a `srcdoc` frame over the editor**, not a new tab: it gives the page an
  opaque origin, which is what the launcher gives it in Rise, so the preview meets the same
  storage limits the real thing does. Closing it clears `srcdoc` so the page is not still
  running behind the editor. The frame paints its own white — these pages are transparent
  on purpose, and previewing one over the editor's grey shows it on a ground it will never
  have.
- **`test.mjs` plays every theme's export, in a frame.** Two traps it now guards, both of
  which produced a green run while broken: every export is called the same thing, so saving
  two into one directory means the second overwrites the first and a comparison between them
  compares a file with itself — exactly how a dead theme selector would pass. And these pages
  only speak when embedded (`window.parent === window` sends nothing), so a top-level play
  asserts the gate and silently skips the `complete` contract that marks the Rise block done.
- **`make_maker.py` base64s the page into the editor**, exactly as `make_launcher.py` does
  for the lesson, so the maker cannot ship a stale copy of the page it exports.
- **The KC token appears exactly once in the page, beside `var KC`** — and both build paths
  assert that count. Naming it a second time in the page's own header comment is what
  stamped the questions into a comment and left the real one empty; Python's `replace` hit
  both, the maker's JS hit only the first, so the lesson build hid the bug.
- **The zip is written by hand**, stored not deflated: the tool fetches nothing, so a
  compression library is not an option, and one HTML file does not need one. Verified with
  a real `unzip`, not only by reading our own bytes back.
- Scoring is not a setting and never will be — see the tool's README.
- The page template still lives in `HMIS BNTS - Search/src/`. **Move it into the tool when a
  second lesson needs a check**, so the dependency runs lesson → tool as it does for the
  scene editor.

## Lesson 2 — Create

Scope is adding a client. The Add (⊕) button already exists in Search and defers to
Lesson 2, and it flags the duplicate risk when the current task's client already exists.
Reuse the chrome, roster, and search engine from Search rather than rebuilding.

Still needed from the user: a screenshot of the **Add Client form**. Households are a
natural place for duplicates to propagate and are now modelled, so that's available as
teaching material.

## The opening animation, and `tools/scene-editor`

The lessons open with a photos-and-narration beat (an outreach worker meeting someone who
may need services) rather than dropping the learner straight into the software. It is Ken
Burns motion over stills with timed captions — no Articulate, no video render, just a
player that interpolates a CSS transform against the audio clock.

`tools/scene-editor/scene-editor.html` is the authoring tool for those openers: one file,
opens in a browser, media never leaves the machine. Its own `?` guide is the manual; its
README covers only layout and output. Two things worth knowing before touching it:

- **Motion is a keyframe list per scene**, `{t,s,x,y}`, smoothstepped between. Not a
  from/to pair — that could not express "tight on one corner, pull out, push into the
  other", which the user asked for explicitly. Old from/to projects migrate on open.
- **Three outputs, one of which round-trips.** `Save project` (`intro-project.json`) is the
  working file and the only thing the editor can reopen. `Export HTML` (`intro.html`) is
  the deliverable: a single self-contained page, media as data URLs, a few MB, fetches
  nothing, and posts `{introComplete:true}` to `window.parent` when the learner finishes.
  `Export timeline` is the cue sheet alone. **Neither export is a backup.**

`test-export.mjs` builds a project, exports, then opens the *exported file* and asserts it
plays — motion, captions, holds, end card — with a hard assertion that **no network request
is made**. That assertion is the point: it is what makes "single HTML" a fact rather than a
claim. 37 editor tests + 35 export tests, all passing as of this note.

## Working preferences observed

- Ship the standalone HTML; keep SCORM packaging opt-in until asked.
- Prefers the app itself to stay faithful — coaching belongs in the training drawer, not
  in the product chrome.
- Wants correctness verified, not asserted. Run the tests and report real numbers.
