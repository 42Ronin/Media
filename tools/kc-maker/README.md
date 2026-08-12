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
| **Export HTML** | `<name>.html` — one self-contained page | Opening it yourself, or hosting it anywhere |
| **Export ZIP** | `<name>.zip`, holding `index.html` | Rise: **Code block → Upload project** |
| **Save project** | `<name>-project.json` | Your working file. **The only thing the maker can reopen.** |

The **Name** field is what all three are called. The file *inside* the zip is always
`index.html`, whatever the zip itself is named, because that is what Rise looks for.

Work is kept in `localStorage` as you type, so a stray reload does not cost you the
morning — but that is a safety net, not a backup. Use **Save project** if the work needs
to survive a cleared browser or move to another machine.

## What it lets you set

- **Total questions**, as a number, or one at a time with *Add question*
- **The question**, and **three to five answers** with one marked correct
- **Feedback**, written for the question as a whole — it is what the learner reads once
  they have answered, whichever way they answered
- **The pass mark**, as a percentage

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
