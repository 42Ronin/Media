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

- **Red paragraphs are the open questions.** There are nine. They are the point of this
  draft — each one is a decision only the author or the team can make.
- `python-docx` writes `<w:zoom>` without the `w:percent` the schema requires, so the
  build patches `word/settings.xml` after saving. Check with
  `python3 ~/.claude/skills/docx/scripts/office/validate.py script_l1_v3.docx`.
