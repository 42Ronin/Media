# The Rise launcher

`dist/lesson1launcher.zip` is what goes into Rise: **Code block → Upload project.**
Re-import after any change — Rise runs the copy it imported, not the file on disk.

```bash
cd "HMIS BNTS - Search"
./build.sh                          # the lesson
python3 launcher/make_launcher.py   # wrap it -> launcher/dist/lesson1launcher.zip
```

## What it is

A slim card: Lashes, the lesson title, a Begin button. Begin mounts the lesson into
a `srcdoc` iframe and requests full screen. Esc leaves full screen without unmounting
the frame, so the card comes back reading *Paused — your progress is saved* and Resume
genuinely resumes.

`template.html` is the shell and **carries no payload**. The lesson is base64'd into
its empty `#payload` script at build time, so the launcher cannot ship a stale build
by accident. The one thing the build script rewrites is her lens: solid here, to match
the sim, rather than the bible's `.85`.

## What the wrapper does to the lesson

Three consequences, all covered by the `— launched from the Rise shell —` section of
`../test.mjs`:

- **It boots at 0×0.** The frame is mounted while the stage is still `display:none`.
  Everything positioned against measured rectangles has to recover on the reveal — a
  `ResizeObserver` on `documentElement` is what catches it, and an auto-placed window
  is clamped wholly on screen rather than to the 90px a dragged one keeps.
- **`location.search` is empty**, so `?scorm=1` can never be set from here and SCORM
  stays off. The shell relays every `postMessage` up to Rise, and `type:"complete"` is
  what marks the block done.
- **Storage throws.** A `srcdoc` frame has an opaque origin. It is caught, the lesson
  runs on default columns, and column changes work for the session but are not persisted.

## Why only the zip is committed

`dist/index.html` is the same bytes as the zip's single entry, and it is 380KB of base64
duplicating a file already in the repo. It is gitignored; the zip is the deliverable.
