# Scene editor

An authoring tool for the photos-and-narration openers that set context before a lesson —
the outreach-worker intro that precedes `HMIS BNTS - Search`, for example. Ken Burns motion
over stills, timed to a narration track, with captions and optional stops.

It is one HTML file. Open `scene-editor.html` in a browser; nothing is installed, nothing
is uploaded, and no images or audio ever leave the machine. Press `?` inside the tool for
the full guide — this file covers only what the guide cannot: where things live and how the
output is meant to be used.

## What you get out of it

Two buttons, two very different things:

| Button | Produces | Use it for |
|---|---|---|
| **Save project** | `intro-project.json` — the whole project, media included, as data URLs | Your working file. Reopen it later and keep editing. **This is the only thing that round-trips.** |
| **Export HTML** | `intro.html` — one self-contained page: photos, narration, captions and the player all inside it | The deliverable. Double-click it and it plays. |
| **Export timeline** | `timeline.json` — the cue sheet only, no media | Handing timings to someone rebuilding this elsewhere |

`intro.html` runs from a file, a web server, or inside an LMS — it fetches nothing. Expect a
few megabytes, because the media is embedded rather than referenced. Neither export can be
loaded back into the editor; keep the project file.

### Putting it in front of a lesson

The exported page posts `{introComplete:true}` to `window.parent` when the learner clicks
Continue on the end card, so a host page (or a Storyline web object) can advance on that
message. Reduced-motion is honoured: `prefers-reduced-motion: reduce` holds each photo
still and keeps the captions.

## Tests

```bash
npm i          # playwright
npm test       # test.mjs (editor) then test-export.mjs (the exported page)
```

Both drive real Chromium. `test.mjs` covers the editing model — keyframes, insert, append,
delete, the combined preview, holds. `test-export.mjs` authors a three-scene project, calls
`buildHTML()`, writes `intro-export.html`, then opens *that* file and asserts it plays:
motion changes over time, captions land on cue, a hold stops and offers Continue, the end
card appears, and **no network request is made at all**. The self-contained claim is
verified, not assumed.

`sample/photo-*.jpg` are synthetic gradients. The narration `sample/narration.wav` is
generated on first run (20 s of a quiet tone) and is not committed.

Set `CHROMIUM_PATH` if your Chromium is not at `/opt/pw-browsers/chromium`.

## Where the motion model came from

Each scene owns a list of keyframes — `{t, s, x, y}`, time in seconds within the scene,
scale, and offset as a percentage of the frame. Motion between them is smoothstepped. Two
keyframes give the usual slow push; more than two let one photo go tight on a corner, pull
all the way out, then push into the opposite corner, which is what a single from/to pair
could not express. Old two-framing projects (`from`/`to`) are migrated on open.

Nothing here is HMIS-specific — it is a general tool, kept in the repo because the lessons
depend on it.
