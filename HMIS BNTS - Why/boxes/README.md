# The three Copperfield boxes

One Rise **Code block** each. Upload the zip; Rise looks for the `index.html` inside it,
which is the whole box — it fetches nothing and carries no score.

| Zip | Question |
|---|---|
| `how-many-people.zip` | How many people are experiencing homelessness in Los Angeles County tonight? |
| `already-offered-help.zip` | Has this person already been offered help somewhere else? |
| `did-any-of-this-work.zip` | Did any of this actually work? |

The learner rests on each answer in turn and it disintegrates; when the last one has gone
the question goes with it and the writing underneath is what is left. Every answer is a
plausible way of trying, and none of them works — that is the teaching, and it is why
nothing here is marked right or wrong.

The block reports itself complete once every answer has been taken, so Rise can mark it
done. It sends nothing else and never a score.

**No heading is rendered inside the block** — the Rise slide above it is already titled,
and repeating that inside says the same thing twice.

## Rebuilding them

Authored through `tools/kc-maker` (Type → Copperfield) rather than by hand, so these are
byte-for-byte what pressing *Export ZIP* produces — it drives the real editor and calls the
tool's own export, so the zips cannot drift from what the maker would give you. The copy
lives in `../tools/make_boxes.mjs`; edit it there and re-run:

```bash
cd "HMIS BNTS - Why/tools"
npm i playwright        # once — same as the other tools here
node make_boxes.mjs
```

The questions and the two paragraphs under each are the owner's, verbatim. The three
answers on each card were written to fit them.

**The first box deliberately carries routes to a number, not numbers.** Three invented
counts would put fake statistics inside a LAHSA training, and at that scale one of them
would land near the real published figure — a learner reads a card before it dusts, and
that is what they would carry out. Routes keep the mechanic and invent no statistic.
