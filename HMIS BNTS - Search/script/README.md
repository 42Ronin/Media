# The lesson script

`../Script - HMIS BNTS Lesson 1 - Finding a Participant.docx` is generated, not
hand-edited. Edit `make_script.py` and rebuild:

```bash
python3 make_script.py          # -> script_l1_v3.docx
```

Then copy it up to the lesson folder under its delivery name.

## Why it is generated

Every task in the script is transcribed from the simulation itself — the situation the
learner reads, the instruction, the hint, the record that is correct with its unique
identifier, and the feedback. Typing that by hand guarantees the two drift. `tasks.json`
is pulled straight out of the built lesson:

```bash
cd ..
node script/extract_tasks.mjs   # loads dist/*.html in a browser, dumps TASKS -> script/tasks.json
```

Re-run it whenever a task changes in the build, then rebuild the docx.

The direction of authority still runs the other way: **the script is approved first, and
the build follows it.** Extraction exists so the script can document what was built
without transcription errors — not so the build can quietly rewrite the script.

## Format

The team's format, taken from `NHO.docx`: a legend table, a table of contents, sections in
bold+underline, topics in bold, sub-headings underlined, production notes in italic, green
and orange for knowledge-check answers, and red for questions back to the course author.
The helpers at the top of `make_script.py` (`title`, `section`, `topic`, `sub`, `body`,
`note`, `ask`, `answer`, `bullet`, `num`) are that format and nothing else.

Two things worth knowing:

- **Red paragraphs are the open questions.** There are none at present — all twenty raised
  across the review rounds have been answered. The convention stays because it is the
  team's; new questions go in red and are also listed together in the front matter, both
  generated from `OPEN_QUESTIONS` so the list and the body cannot disagree.
- `python-docx` writes `<w:zoom>` without the `w:percent` the schema requires, so the
  build patches `word/settings.xml` after saving. Check with
  `python3 ~/.claude/skills/docx/scripts/office/validate.py script_l1_v3.docx`.

## Snippets

`snippet_tasks.py` cuts one section's tasks as a single wide landscape table — a row per
task, a column per field — for pasting into a draft someone is editing by hand:

```bash
python3 snippet_tasks.py 8      # the eight search tasks
python3 snippet_tasks.py 11     # the five verification tasks
```

The output is gitignored; regenerate it rather than tracking it.

**When someone is hand-editing the draft, do not regenerate and send the whole script.**
Make the change in `make_script.py` so it is there at the next rebuild, or cut a snippet.
Sending a fresh full document risks overwriting work that is not in the generator.

## Where task copy lives

`task_data.py` is the single source, and everything that renders a task reads it:

- `tasks.json` — transcribed out of the built simulation by `extract_tasks.mjs`
- `proposed-tasks.json` — the two tasks specified in the script but not built yet
  (location, and the hard one). Same shape, edited by hand.
- `OVERRIDES` in `task_data.py` — copy a review decision has changed where the build has
  not caught up yet

**An entry in `OVERRIDES` is a debt.** The script is right and the build owes it a change;
the entry carries the reason so nobody removes one without knowing what it was for.
`snippet_tasks.py` prints any that apply to the section it just cut. Clear a debt by fixing
the copy in `src/lesson1.template.html`, re-running `extract_tasks.mjs`, and deleting the
override.

Currently outstanding: **`several`** — the built feedback still ends by sending the list of
matching records to HMIS Support, and reporting duplicates was removed from this training.
