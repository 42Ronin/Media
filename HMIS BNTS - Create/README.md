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
| `src/bobbi.template.html` | The guided walkthrough. Conversation on the left, a Clarity Add Client replica on the right that fills in as each exchange lands, then Save reveals the profile and the Unique Identifier |
| `src/add-client.template.html` | A working Add Client replica with the v1 task set. Task panel on the left; the two-stage conversation, the "Ask them" gate, the Consent Refused auto-fill and the Documentation-dependent consent section all work |

Both came from a Fable 5.1 prototype built against real Clarity screenshots, and
the replica is the part worth keeping: Clarity's own palette (indigo `#5055AD`,
surface `#FCF8FD`, Open Sans) for the form, Lashes' teal for the coaching panel,
so the two worlds read as different things on one screen.

## Lashes comes from one place now

`tools/lashes/face.js` and `face.css` are the only copy of her drawing.
`build.sh` inlines them at the `LASHES_JS` and `LASHES_CSS` tokens, checking each
appears **exactly once** — the rule the knowledge check learned the hard way,
where a token named twice stamped the payload into a comment.

Before this she was copied by hand into the lesson, three knowledge-check
stagings and the block builder, and "if her face changes, change it in both" was
a note in `CLAUDE.md` rather than something a build enforced. The prototype's
stand-in avatar is gone; a page now asks for her with `<span class="lashes-av"
data-face></span>` and `paintFaces()` fills it.

**The other pages have not been migrated yet.** The Search lesson and the three
knowledge-check stagings still carry their own copies. That is the next tidy-up,
and it is mechanical.

## Two defects found in the prototype, both fixed

**Two elements shared `id="start"`** — the Start button in the task panel and the
Release of Information Start Date input. `getElementById` returns the first in
document order, so the button won, and **the consent Start Date never filled**
while End Date did. The field is `#roiStart` now. The reset list deliberately
excludes both dates: they are computed once, they are read-only, and a reset must
not blank them.

**Her bubble was teal on teal.** The stand-in avatar was drawn in pale ink for a
teal background; her real drawing has a teal rim, which vanished into it. The
bubble is light with a teal left border now, which is also how she is presented
everywhere else in the series.

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
