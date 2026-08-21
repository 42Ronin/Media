# Job aid builder

Printable step-by-step guides. Open `job-aid-builder.html` in a browser; nothing is
installed and nothing you write leaves the machine.

Steps and substeps, a screenshot per step with a choice of frame width and border,
page breaks where you want them, a table of contents, and your own logo. Preview,
then **Download PDF**. Projects save and reopen.

**One file, and it stays that way.** jsPDF is vendored into the page rather than
fetched, which is most of its size — verified by loading it and asserting zero
network requests, the same bar the other tools here meet.

There is **no build step**: the HTML is the source. Edit it directly.

The logo is whatever you load into it. Nothing is drawn or approximated — see the
logo rule in the root `CLAUDE.md`.
