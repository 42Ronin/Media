# The script's GIFs

Eight captures, one per `[GIF]` in the lesson script, plus the frames they were
built from.

```bash
node tools/capture.mjs            # drive the simulation -> gifs/frames/<name>/
python3 tools/gifs.py             # assemble            -> gifs/<name>.gif
```

Two halves on purpose: the timing lives in each capture's `steps.json`, so a GIF
can be retimed without re-driving the browser, and a frame that looks wrong can be
opened and looked at rather than guessed at.

| File | Where it goes in the script |
|---|---|
| `as-you-type.gif` | Results appear as you type |
| `every-word-matches.gif` | Every word you add must match |
| `fragments.gif` | Short fragments beat full names |
| `date-of-birth.gif` | Searching by Date of Birth |
| `ssn.gif` | Searching by Social Security Number |
| `unique-identifier.gif` | The Code Under the Name |
| `expand-a-row.gif` | Opening a Row Without Leaving the List |
| `narrow-a-long-list.gif` | When the List Is Long |

**No teaching furniture is filmed.** The training panel, the character and the
docked column are hidden with capture-only CSS, so what a learner sees in these is
the product surface they will meet in the live system.

**Captured at 2x and scaled to 1000px wide.** Text resampled from double size stays
legible in a way text rendered at final size does not. 1000px is about the Rise
content column; change `TARGET_W` in `tools/gifs.py` if that is wrong.

**One frame per thing that changes**, not a frame rate. A GIF of typing is the list
moving, and the list only moves when a character lands — so these run 9 to 51 frames
rather than the hundreds a video would need, and come out 170–860 KB.

**One palette for the whole run.** Quantising each frame on its own makes the flat
background shimmer between frames, which is the classic GIF artefact.

The pointer is drawn in. Playwright's mouse does not render, so a click-driven
capture would otherwise show a row opening on its own.
