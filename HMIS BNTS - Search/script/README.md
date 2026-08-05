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

`snippet_s8.py` builds section 8 on its own — the eight search tasks as one wide landscape
table, a row per task and a column per field, for pasting into a draft someone is editing by
hand:

```bash
python3 snippet_s8.py        # -> section-8-tasks-as-columns.docx
```

The output is gitignored; regenerate it rather than tracking it. It reads the same
`tasks.json` as the script, so a snippet cannot drift from the lesson.

**When someone is hand-editing the draft, do not regenerate and send the whole script.**
Make the change in `make_script.py` so it is there at the next rebuild, or cut a snippet like
this one. Sending a fresh full document risks overwriting work that is not in the generator.
