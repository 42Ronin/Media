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

    # Outer first: each of these carries a slot the next pass fills.
    html = stamp(html, "PANEL_HTML", "html", read(HERE / "panel.html"), src.name)
    html = stamp(html, "PANEL_BODY", "html", read(body), body.name)
    html = stamp(html, "RIG_HTML", "html", read(HERE / "rig.html"), src.name)
    html = stamp(html, "PANEL_CSS", "css", read(HERE / "panel.css"), src.name)
    html = stamp(html, "RIG_CSS", "css", read(HERE / "rig.css"), src.name)
    html = stamp(html, "PANEL_JS", "js", read(HERE / "panel.js"), src.name)
    html = stamp(html, "RIG_JS", "js", read(HERE / "rig.js"), src.name)
    # Her drawing, last, into the slots rig.css and rig.js just brought with them.
    html = stamp(html, "LASHES_CSS", "css", read(LASHES / "face.css"), "rig.css")
    html = stamp(html, "LASHES_JS", "js", read(LASHES / "face.js"), "rig.js")

    out.write_text(html, encoding="utf-8")


if __name__ == "__main__":
    if len(sys.argv) != 4:
        raise SystemExit(__doc__)
    main(*sys.argv[1:4])
