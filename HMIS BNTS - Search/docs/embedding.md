# Embedding the simulation in Articulate

The lesson is one self-contained HTML file. It will sit inside a Rise course as an
embedded block. This is what it can and cannot tell Rise, and how to wire it up.

Read the constraint first — it decides the whole design.

## The constraint: Rise cannot listen

Rise 360 has no JavaScript authoring. There is no trigger, no variable, no script block.
So **nothing embedded in Rise can report anything back to Rise** — not a score, not a
completion, not "the learner finished task 7." The embed is a one-way window.

That is not a limitation of this simulation. It is true of any embedded content in Rise.

It has one consequence worth stating plainly: **in Rise, the simulation is practice, not
assessment.** Rise's own quiz has to carry the score and the completion. That is a
reasonable place to land — it also fixes the double-assessment problem in the current
script, where twelve scored tasks and a six-question knowledge check both grade the same
material.

## Three routes, and what each one buys

| Route | Reports to the course? | Cost |
|---|---|---|
| **Rise Embed block** | No — ungraded practice | Needs the file hosted at a URL |
| **Storyline block inside Rise** | Yes — score, completion, gating | Build a one-slide Storyline project |
| **Its own SCORM package** | Yes — direct to the LMS | It is a separate course, not part of the Rise one |

Rise supports inserting a Storyline block into a Rise course, and Storyline *does* have
JavaScript triggers and variables. So if the score has to flow, the shape is:

```
Rise course
  └── Storyline block
        └── Web Object → this simulation
              └── postMessage → Storyline JS trigger → Storyline variable → gate / score
```

That is the only route that gets both Rise's authoring and a real score out of the
simulation. Verify the current Rise and Storyline behaviour before committing to it —
Articulate changes these products, and this note is written from the web platform's
constraints rather than from a live account.

## It will not touch the host course's SCORM session

This mattered enough to be worth calling out. The lesson used to climb the frame chain
looking for `window.API` — standard SCORM discovery, correct when it *is* the package.
Embedded in a Rise course served from the same origin, that would have found **Rise's**
API, reset the course's `lesson_status` to `incomplete`, and called `LMSFinish` on unload,
ending the host course's LMS session while the learner was still working.

It now talks to the LMS only when launched with `?scorm=1`, which only our own SCORM
manifest does. Embed it any other way and it will not go near the host's session. Four
tests in `test.mjs` assert this, including one that proves the host API really was
reachable — so the guard is what stopped it, not the browser.

## Messages it sends

Every message is posted to `window.parent` and looks like:

```js
{ source: "hmis-sim", lesson: "hmis-bnts-search", type: "…", … }
```

**Always check `source`.** A parent page hears from every frame on it, and from browser
extensions.

| `type` | Fired when | Carries |
|---|---|---|
| `ready` | the simulation has loaded | `tasks` — how many there are (12) |
| `task` | a task is answered correctly | `index`, `total`, `id`, `title`, `points` (10 or 5), `firstTry`, `percent` — the running score |
| `complete` | the last task is finished | `percent`, `passed`, `passMark` (80), `firstTry` — how many were clean, `total` |

The opening animation, if you use one, posts `{introComplete:true}` on its own end card —
a different shape, from a different file.

## The Storyline bridge

One **Execute JavaScript** trigger, on timeline start of the slide holding the web object.
Create three Storyline variables first: `simPercent` (Number), `simPassed` (True/False),
`simDone` (True/False).

```js
var player = GetPlayer();
window.addEventListener("message", function (e) {
  var m = e.data;
  if (!m || m.source !== "hmis-sim") return;

  if (m.type === "task") {
    player.SetVar("simPercent", m.percent);
  }
  if (m.type === "complete") {
    player.SetVar("simPercent", m.percent);
    player.SetVar("simPassed", m.passed);
    player.SetVar("simDone", true);          // gate the Next button on this
  }
});
```

Then a normal Storyline trigger — *when `simDone` changes, jump to the next slide*, or
*submit results* — and the Next button stays disabled until the simulation says so.

## Hosting

The Rise Embed block takes a URL, so the file has to live somewhere reachable:

- **HTTPS.** If the LMS is on HTTPS and the simulation is on HTTP, the browser blocks it
  and the block renders empty.
- **Iframe-able.** The host must not send `X-Frame-Options: DENY` or a restrictive
  `frame-ancestors`. SharePoint in particular often refuses to be framed — check before
  choosing it.
- **Stable.** The URL is baked into the published Rise course; moving the file breaks
  every published copy.

It is a single 212 KB file with no dependencies, so any static host will do.

Putting the file *inside* the published Rise package and pointing the embed at a relative
path does work, but the change is lost every time Rise is republished. Not recommended
unless someone owns that step.

## Two limits to know before you build around it

**Width.** The lesson lays out a 360px coaching drawer beside the simulated application.
Below roughly 900px wide it is cramped, and on a phone it is not usable. Given that the
real work happens on phones and tablets, this needs deciding: either the practice is a
desk activity and the course says so, or the layout needs a responsive pass. It is not a
small change, but it is a well-understood one.

**No resume.** The lesson keeps no progress. Close the tab at task 9 and it starts again
from zero. Inside Rise that is worse than it sounds, because Rise will happily remember
where the *learner* was in the course while the embedded simulation has forgotten
everything. Worth fixing before this ships either way.
