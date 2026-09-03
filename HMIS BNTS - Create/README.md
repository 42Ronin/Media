# Lesson 3 — Creating a Profile

Adding a client record, and adding it so the next person can find them.

```bash
cd "HMIS BNTS - Create"
./build.sh          # -> dist/sim-*.html and dist/sim-*.zip
```

`script/script.md` is the lesson script and `script/production-notes.md` is the
build direction that came with it. **The script is the authority on copy**, the
same rule the Search lesson runs on: change the script first, then the build.

## What is built

| | |
|---|---|
| `src/bobbi.template.html` | The guided walkthrough. The conversation runs in the training panel, a Clarity Add Client replica fills in as each exchange lands, then Save reveals the profile and the Unique Identifier |
| `src/add-client.template.html` | A working Add Client replica with the v1 task set. The two-stage conversation, the "Ask them" gate, the Consent Refused auto-fill and the Documentation-dependent consent section all work |

```bash
npm i playwright && node test.mjs      # 52 checks, ~3 minutes
```

It is slow because it plays both sims **at their real beat timings** rather than
skipping ahead — the Bobbi walkthrough alone is about ninety seconds of animation.
Both are played **in a frame**: these pages only speak when embedded, so a
top-level play asserts the gate and silently skips the `complete` contract that
marks the Rise block done, which is exactly how a broken one passes a green run.
Don't run two copies at once — they share port 8123.

## They wear the series' look now

The prototypes came from elsewhere and dressed themselves: a fixed **left** column
in a solid teal wash, immovable, Lashes parked in a corner, pill buttons, and a
narrow-viewport branch that Lesson 1 had removed on purpose. The owner's note was
that everything except the Clarity replica and the conversation bubbles was out of
line with what we had built, and it was right.

Both pages now take the training panel from **`tools/coach`** — the same movable
window Lesson 1 uses. Docked to a reserved 428px column on the **right**, white
with a teal `#066888` title bar, draggable by that bar, poppable and collapsible,
and **nothing it does reflows the interface**. `build.sh` stamps it in;
`tools/coach/README.md` is the reference.

What each page kept is the part that was working:

- **The Clarity replica is untouched.** It was built from the owner's own
  screenshots of the live product and it is the one thing here that has to be
  faithful to Clarity rather than to us. Where Lesson 1 and these captures
  disagree about a colour, the captures win.
- **Bobbi's conversation log is the panel's whole body.** It is what that page is,
  and it is genuinely new — Lessons 1–2 have Lashes saying one thing at a time
  beside an anchor and no transcript at all. A scrollable exchange is the right
  shape for a lesson about an interview. The bubbles inverted to suit a white
  panel: the worker solid teal on the right, the participant light on the left,
  which is the treatment the Search lesson already uses for an exchange.

What changed beyond the paint:

- **Feedback is hers, and it arrives beside what caused it** rather than in a box
  in the panel. A paragraph that appears on the far side of the screen from the
  field it is about makes the learner look away from the thing they got wrong.
  A task may name the field its feedback is about; otherwise she goes to Save,
  which is the control they just pressed.
- **The panel body is the lesson's, the shell is shared.** `src/panel-body-*.html`
  is what each page puts inside the window.
- **The `postMessage` contract is the house one** — `{source:"hmis-sim",
  lesson:"hmis-bnts-create", section, type}`, `ready` and `complete`, never a
  score.
- **A nine-hex Unique Identifier shipped in the Bobbi profile** (`3F8A2C1D9`),
  which is the shape the real product uses and the one thing the house rule
  forbids. It is `UID#7632JEWHR` now — four digits, five letters, no `I` or `O` —
  and `test.mjs` asserts the shape and asserts no nine-hex string survives.

## Lashes comes from one place

`tools/lashes/face.js` and `face.css` are the only copy of her drawing, and
`tools/coach/rig.js` and `rig.css` are the only copy of her rig — the floating
layer, the placement solver, the bubble and the pointing arrow. `assemble.py`
stamps both, checking every token appears **exactly once**.

Lesson 1's own template used to hold all of it. It does not any more, and the move
turned up two defects: her drop-in entrance had never played (a bare
`.lzchar.still ` selector swallowed the rule that drives it), and `face.js` was a
subset that had lost the `glance` and `smug` eyes. Both fixed, both in
`tools/coach/README.md`.

## Defects the prototype shipped with

**Two elements shared `id="start"`** — the Start button in the task panel and the
Release of Information Start Date input. `getElementById` returns the first in
document order, so the button won and **the consent Start Date never filled**
while End Date did. The field is `#roiStart`. The reset list deliberately excludes
both dates: they are computed once, they are read-only, and a reset must not blank
them.

**A nine-hex Unique Identifier**, covered above.

**Her bubble was teal on teal.** The stand-in avatar was drawn in pale ink for a
teal background; her real drawing has a teal rim, which vanished into it. Moot now
— she is in the shared rig and the panel is white — but it is the reason the
transcript's Lashes block carries a teal *edge* rather than a teal fill.

## What the v2 script still needs

The prototypes were built against script v1. v2 is substantially bigger, and
these are the gaps, roughly in build order:

1. **Tutorial: the five-find hunt.** Hotspot detection on the real form replica,
   with per-find wrong-click feedback. Replaces two text blocks.
2. **The Bobbi walkthrough becomes interactive.** The learner sets every code as
   the conversation unfolds and Lashes corrects wrong ones in the moment. Today
   it is watch-only.
3. **Identity simulator: 11 tasks**, up from the prototype's 9. New are the
   age-subtraction task, the last-four task, the chosen-name task and the
   brief-description task.
4. **Consent simulator: 6 tasks**, its own sim rather than two tasks on the end.
5. **Four mini-sims** (Bobbi comes back), which need records created earlier in
   the lesson to persist for the session, plus an edit path, a support-ticket
   form and a one-row dashboard warning.
6. **Warmup matching**, eight pairs.
7. **"Create, or Keep Looking?"** — three scenario cards.
8. **Knowledge check, nine questions.** This one needs no new code:
   `tools/kc-maker` already authors it. Same for any teaching block that suits a
   Copperfield.

## Open items that block building, not just polish

These come from `script/production-notes.md`, where they are listed in full. Three
of them decide what the simulator actually does, so they want answering before
the tasks above are wired.

- **Open item 10, Permission No versus Consent Refused.** The notes call this the
  highest-stakes open item in the lesson, and the script had to pick a reading:
  Permission No governs who can see identifying information, Consent Refused
  governs whether it is there at all. Consent tasks 4 and 5 and knowledge check
  question 7 are all built on that reading. If LAHSA's actual practice is that any
  refusal to share means the Consent Refused toggle, all three need rewriting.
- **Open items 17 and 18, the field when the code says doesn't-know or
  prefers-not.** The dashboard guide's error logic wants Date of Birth empty when
  the code is doesn't-know, and the name field empty or "Refused" — but both
  fields are required on the form. Something has to give, and the simulator has to
  know which. It decides Task 3's alternate path and what the Consent Refused
  auto-fill looks like.
- **Open item 15, the code that pairs with a brief description in the name
  fields.** The script teaches Partial because it is the only code that does not
  fire an error, which is an inference rather than something the guide states.
  Task 10 is built on it.

## House rules that apply here

All client data is fictional. SSN placeholders in this lesson are `XXX-XX-XXXX`
and `000-00-0000`, which are the conventions LAHSA teaches, not invented numbers —
and no generated SSN appears in this lesson at all, so the Search lesson's
900-999 rule does not come up. Nothing is scored anywhere: mark, explain,
continue. Typed text is never evaluated.
