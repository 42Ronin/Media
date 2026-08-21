# Knowledge check maker

An authoring tool for the card knowledge check — the one Lashes deals at the end of a
lesson. Write the questions, press Export, drop the result into Rise as a Code block.

It is one HTML file. Open `kc-maker.html` in a browser; nothing is installed, nothing is
uploaded, and no question you write ever leaves the machine.

```bash
python3 tools/kc-maker/make_maker.py    # rebuild after changing the editor or the page
npm i && npm test                       # playwright, then the suite
```

## What you get out of it

| Button | Produces | Use it for |
|---|---|---|
| **Preview** | The exported page, in a frame, over the editor | Seeing the theme before you ship it. Esc closes it |
| **Export HTML** | `<name>.html` — one self-contained page | Opening it yourself, or hosting it anywhere |
| **Export ZIP** | `<name>.zip`, holding `index.html` | Rise: **Code block → Upload project** |
| **Save project** | `<name>-project.json` | Your working file. **The only thing the maker can reopen.** |

The **Name** field is what all three are called. The file *inside* the zip is always
`index.html`, whatever the zip itself is named, because that is what Rise looks for.

Work is kept in `localStorage` as you type, so a stray reload does not cost you the
morning — but that is a safety net, not a backup. Use **Save project** if the work needs
to survive a cleared browser or move to another machine.

## Two kinds

**Type** is the first thing in the bar, and it is the only control that changes the
editor rather than just the export.

| Type | What it is |
|---|---|
| **Knowledge check** | The scored card check: a deck of questions, one correct answer each, a pass mark to clear |
| **Copperfield** | One interactive box that only looks like a question. Two or three answers, none of them right or wrong; **resting on one disintegrates it**, and when the last has gone the question goes with it and what you wrote underneath is what is left |

Answers are taken by **hover**, on a short dwell — a mouse crossing the row does not take
anything with it, and the moment it takes to rest on a card is the moment it takes to read
it. A click and the keyboard take one outright, because a pointer is not something every
learner has and a box that cannot be finished is worse than one finished the ordinary way.

A Copperfield has no mark, no right answer and no deck, so the pass mark, the correct-answer
marks and the question list are not shown for it — they are not hidden work, there is
nothing there to set. It reports itself complete when the learner has taken every answer,
and like everything else here it never sends a score.

**It is one box, not a series.** A run of them is several exports, each embedded on its own
slide. That is deliberate: a deck implies a mark, and there is no mark here.

Switching type keeps your writing. It trims to fit the new kind's rules — a Copperfield
takes at most three answers and one question — so switching to it and back can leave a
fourth answer behind. Save first if that would cost you something.

## What it lets you set

- **Total questions**, as a number, or one at a time with *Add question* — knowledge check only
- **The question**, and its **answers**: three to five with one marked correct for a
  knowledge check, two or three with none correct for a Copperfield
- **Feedback**, written for the question as a whole — it is what the learner reads once
  they have answered, whichever way they answered — **switchable per question**. Off, the
  cards are still marked right and wrong and the learner goes straight on; what is written
  is kept, so switching it back does not cost you the paragraph. On a Copperfield it is
  what is under the answers, so it cannot be switched off
- **The pass mark**, as a percentage — knowledge check only
- **The theme** — which staging the exported page uses, where the type has more than one

## Themes

The same authored check ships in more than one staging.

| Theme | What it looks like |
|---|---|
| **Standard** | The plain card table the lesson ships. She arrives beside the feedback |
| **Fortune Teller** | The same hand on a transparent ground; she appears in a crystal ball with the reading |
| **Card Dealer** | A felt table with a rail. She is the dealer, at the table throughout, and speaks in one bubble that holds the question and then the reading |

The theme changes the exported page and nothing else. The questions, the answers, the
feedback and the pass mark are the same work whichever staging carries them — which is
why it is a selector in the bar and not a mode the editor runs in. Switching it and
exporting again gives you the same check in the other staging, under the same name.

Every theme keeps the three rules below without exception: no picking a face-down card,
no score ever leaving the page, completion withheld until the pass mark. `test.mjs` plays
*every* theme's export through to completion rather than only the first one.

Adding one is a row in `PAGES` in `make_maker.py` — the kind it belongs to, a key, a label,
and the page template it ships. The editor does not know any of their names: it reads both
the kinds and the themes off the pages the build put in it, and a type with only one
staging shows no theme selector at all, because a list of one invites somebody to go
looking for the others. A page qualifies if it carries exactly one `/*__KC__*/` token and
one `/*__LOGO__*/` token; the build refuses it otherwise rather than shipping a page with
the questions missing.

The Copperfield is deliberately Standard-only. A disappearing-answer trick has no obvious
form inside the teller's crystal ball or on the dealer's felt, and three stagings times two
kinds is six renderings to keep true.

Answer order is shuffled on every deal, so it does not matter which one you write first.

**Her expressions are fixed** — asking, pleased, unimpressed — and are not settings. Nor
is anything about scoring: see below.

## What it deliberately will not do

**No score is ever reported.** The exported page sends exactly two messages to its host:
`ready` when it loads, and `complete` once the learner has cleared the pass mark. There is
no score in these activities, and Rise has no scripting to receive one with. The tally on
screen is for the learner, so the gate makes sense to the person facing it.

**Withholding `complete` is the whole mechanism.** Below the mark, the questions they
missed are dealt back in a different order, and there is no other way past it.

**A card cannot be clicked while it is face down.** The deal is the theatre, but a blank
card the learner can pick is an invitation to guess. The hand goes live only once every
card has turned over. That is not configurable either.

## How it is built

`kc-maker.template.html` is the editor and **carries no payload**. `make_maker.py` base64s
the knowledge-check page into its empty `#page` script, so the maker cannot ship a stale
copy of the page it exports. The page keeps its build token; the maker is what fills it,
in the browser, with whatever you wrote.

**The token is written out exactly once in the page, beside `var KC`.** Both the maker and
the lesson build assert that count rather than assuming it — naming it a second time in a
comment is what previously stamped the questions into a comment and left the real one
empty.

The page template still lives with the lesson that first needed it
(`HMIS BNTS - Search/src/kc.template.html`). If a second lesson wants a knowledge check,
move it here and have the lessons read it from the tool — the dependency should run
lesson → tool, the way it does for the scene editor.

## Tests

`test.mjs` drives real Chromium in two halves. The first covers the editing model — the
question total, the three-to-five bound on answers, exactly one correct, the validation
that names what is missing, and that the work survives a reload.

The second is the one that matters: it authors a check, presses Export, catches both
downloads, and then **opens the exported page and plays it** — the cards deal, the authored
feedback comes back, the pass mark is honoured — with a hard assertion that it makes **no
network request at all**. That is what makes "one self-contained file" a fact rather than a
claim. The zip is checked with a real unzipper as well as by reading its bytes.

Set `CHROMIUM_PATH` if your Chromium is not at `/opt/pw-browsers/chromium`.
