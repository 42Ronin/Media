#!/usr/bin/env python3
"""Stamp the shared coach panel and the Lashes rig into a lesson template.

    assemble.py <in.html> <out.html> <panel-body.html>

A lesson page carries six tokens and its own panel body; this fills them from
tools/coach/ and tools/lashes/, so the movable training window, the placement
solver, her drawing and her beat runner have ONE source across every lesson.

Nesting is why the order below is fixed: rig.css and rig.js each carry a face
token of their own, so they have to be in the page before the face is stamped
into them, and panel.html carries the body slot.

Every token must appear EXACTLY ONCE. Not at least once — the knowledge check
learned that the expensive way, where a token named a second time in a header
comment stamped the payload into the comment and left the real one empty. A
page that does not want the coach leaves all six out and does not come here.
"""
import pathlib, sys

HERE = pathlib.Path(__file__).resolve().parent
LASHES = HERE.parent / "lashes"


def token(name, kind):
    # Assembled, so this file never contains the literals it searches for.
    return ("<!--" + "__%s__" + "-->") % name if kind == "html" else ("/*" + "__%s__" + "*/") % name


def stamp(html, name, kind, text, where):
    t = token(name, kind)
    hits = html.count(t)
    if hits != 1:
        raise SystemExit("%s: expected exactly one %s token, found %d" % (where, name, hits))
    return html.replace(t, text)


def main(src, out, body):
    src, out, body = pathlib.Path(src), pathlib.Path(out), pathlib.Path(body)
    html = src.read_text(encoding="utf-8")
    read = lambda p: p.read_text(encoding="utf-8").rstrip("\n")

    # Two groups, and the rig is OPTIONAL. A page can take the window without the
    # floating character: the Bobbi walkthrough carries her inside its transcript,
    # where she is one voice in a conversation rather than something standing next
    # to the interface. All-or-nothing per group, so a typo'd token still fails.
    panel = [("PANEL_HTML", "html", read(HERE / "panel.html")),
             ("PANEL_CSS",  "css",  read(HERE / "panel.css")),
             ("PANEL_JS",   "js",   read(HERE / "panel.js"))]
    rig   = [("RIG_HTML", "html", read(HERE / "rig.html")),
             ("RIG_CSS",  "css",  read(HERE / "rig.css")),
             ("RIG_JS",   "js",   read(HERE / "rig.js"))]

    for name, group in (("panel", panel), ("rig", rig)):
        present = [n for n, k, _ in group if html.count(token(n, k))]
        if present and len(present) != len(group):
            raise SystemExit("%s: %s group is half there — has %s, missing %s" % (
                src.name, name, ", ".join(present),
                ", ".join(n for n, _, _ in group if n not in present)))

    # Outer first: each of these carries a slot a later pass fills.
    for name, kind, text in panel + rig:
        if html.count(token(name, kind)):
            html = stamp(html, name, kind, text, src.name)
    # PANEL_BODY is nested inside panel.html rather than written by the page, so it
    # is not part of the presence check above — it exists only once the panel is in.
    if html.count(token("PANEL_BODY", "html")):
        html = stamp(html, "PANEL_BODY", "html", read(body), body.name)

    # Her drawing, last — into the slots rig.css and rig.js brought with them, or
    # into the page's own if it took the panel without the rig.
    html = stamp(html, "LASHES_CSS", "css", read(LASHES / "face.css"), src.name)
    html = stamp(html, "LASHES_JS", "js", read(LASHES / "face.js"), src.name)

    out.write_text(html, encoding="utf-8")


if __name__ == "__main__":
    if len(sys.argv) != 4:
        raise SystemExit(__doc__)
    main(*sys.argv[1:4])
