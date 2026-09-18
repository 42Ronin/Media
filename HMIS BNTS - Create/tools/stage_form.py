#!/usr/bin/env python3
"""Stamp the shared Clarity Add Client replica into a Lesson 3 template.

    stage_form.py <in.html> <out.html> <form.html>

The replica is one thing in three files — its markup, its own look, and the
product behaviour that belongs to neither lesson — and both pages take all three.
It used to be two copies: the practice sim had a working form and the walkthrough
had a display-only mock built of divs, which could not take input at all. That is
how a replica quietly stops matching the captures it was built from, and it stopped
being tenable the moment the walkthrough asked the learner to fill the form in.

Runs before tools/coach/assemble.py, which does the same job for the training
panel. Same rule as there: every token must appear EXACTLY ONCE — not at least
once, which is what the knowledge check paid for when a token named a second time
in a header comment stamped the payload into the comment and left the real one
empty.
"""
import pathlib, sys

# The markup is PER PAGE; the look and the behaviour are shared. The walkthrough
# needs Quality of Name after the name fields and Quality of DOB after Date of Birth,
# because it teaches the order — capture the value, then mark how good it is — and
# the practice sim was not in scope for that change. src/<page>-form.html is the
# markup; if the two ever agree again they collapse back into one file.
PARTS = (("FORM_CSS", "css",  "src/add-client-form.css"),
         ("FORM_JS",  "js",   "src/add-client-form.js"))


def token(name, kind):
    # Assembled, so this file never contains the literals it searches for.
    return ("<!--" + "__%s__" + "-->") % name if kind == "html" else ("/*" + "__%s__" + "*/") % name


def main(src, out, form):
    here = pathlib.Path(__file__).resolve().parent.parent
    src, out = pathlib.Path(src), pathlib.Path(out)
    html = src.read_text(encoding="utf-8")
    for name, kind, rel in (("FORM", "html", form),) + PARTS:
        t = token(name, kind)
        hits = html.count(t)
        if hits != 1:
            raise SystemExit("%s: expected exactly one %s token, found %d"
                             % (src.name, name, hits))
        html = html.replace(t, (here / rel).read_text(encoding="utf-8").rstrip("\n"))
    out.write_text(html, encoding="utf-8")


if __name__ == "__main__":
    if len(sys.argv) != 4:
        raise SystemExit(__doc__)
    main(*sys.argv[1:4])
