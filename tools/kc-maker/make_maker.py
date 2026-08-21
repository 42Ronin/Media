#!/usr/bin/env python3
"""Build the knowledge-check maker.

    python3 tools/kc-maker/make_maker.py     -> tools/kc-maker/kc-maker.html

`kc-maker.template.html` is the editor and **carries no payload**. Every page it
can export is base64'd into it here, one `<script class="page" data-kind=...
data-theme=...>` each, so the maker can never ship a stale copy of a page it
exports. Each page keeps its `/*__KC__*/` token — the maker is what fills it, in
the browser, with whatever was written in the editor.

PAGES is the whole list, and it has two axes.

**kind** is what the thing IS, and it changes the editor: `kc` is the scored card
check — a deck, a pass mark, one correct answer per question — and `copperfield`
is a single interactive box that only looks like a question, with no right
answer, no mark and no deck.

**theme** is only the staging, and it changes nothing but the page that ships. A
kind may have several; `copperfield` has one, deliberately, because a
disappearing-answer trick has no obvious form on the teller's orb or the
dealer's felt and three stagings times two kinds is six renderings to keep true.

A new staging is a new row. Nothing else in the maker names one.

The page templates currently live with the lesson that first needed them. If a
second lesson wants a knowledge check, move them here and have the lessons read
them from the tool instead — the dependency should run lesson → tool, the way it
does for the scene editor.
"""

import base64
import pathlib
import re
import sys

HERE = pathlib.Path(__file__).resolve().parent
SRC = HERE.parent.parent / "HMIS BNTS - Search" / "src"
TEMPLATE = HERE / "kc-maker.template.html"
OUT = HERE / "kc-maker.html"

# kind, theme key, label in the theme selector, page template
PAGES = (
    ("kc", "standard", "Standard", SRC / "kc.template.html"),
    ("kc", "teller", "Fortune Teller", SRC / "kc-teller.template.html"),
    ("kc", "dealer", "Card Dealer", SRC / "kc-dealer.template.html"),
    ("copperfield", "standard", "Standard", SRC / "kc-copperfield.template.html"),
)

# kind key, label in the type selector — the order the selector offers them in
KINDS = (
    ("kc", "Knowledge check"),
    ("copperfield", "Copperfield"),
)

LOGO_TYPES = ((".svg", "image/svg+xml"), (".png", "image/png"))


def token(name: str) -> str:
    # assembled so this file never contains the literal the tokens are searched by
    return "/*" + "__" + name + "__" + "*/"


def logo_uri() -> str:
    """The LAHSA logo, if the lesson has it, inlined the way build.sh does — used
    whole and unaltered. Absent, a card back keeps its abstract crest."""
    for ext, mime in LOGO_TYPES:
        f = SRC / ("lahsa-logo" + ext)
        if f.exists():
            return '"data:%s;base64,%s"' % (mime, base64.b64encode(f.read_bytes()).decode())
    return "null"


def payload(page: pathlib.Path, logo: str) -> str:
    if not page.exists():
        raise SystemExit(f"no knowledge-check page to embed ({page} missing)")
    html = page.read_text(encoding="utf-8")

    kc = token("KC")
    if html.count(kc) != 1:
        raise SystemExit(f"{page.name}: expected exactly one KC token for the maker to fill, "
                         f"found {html.count(kc)}")
    lg = token("LOGO")
    if html.count(lg) != 1:
        raise SystemExit(f"{page.name}: expected exactly one LOGO token, found {html.count(lg)}")

    return base64.b64encode(html.replace(lg, logo).encode("utf-8")).decode("ascii")


def build() -> None:
    logo = logo_uri()
    shell = TEMPLATE.read_text(encoding="utf-8")

    kinds = {k for k, _, _, _ in PAGES}
    missing = kinds.symmetric_difference(k for k, _ in KINDS)
    if missing:
        raise SystemExit(f"KINDS and PAGES disagree about: {', '.join(sorted(missing))}")

    blocks = ['<script class="page" data-kind="%s" data-theme="%s" data-label="%s" '
              'type="text/plain">%s</script>' % (kind, key, label, payload(page, logo))
              for kind, key, label, page in PAGES]
    options = ['<option value="%s">%s</option>' % (key, label) for key, label in KINDS]

    out, n = re.subn(r"<!--PAGES-->", lambda m: "\n".join(blocks), shell)
    if n != 1:
        raise SystemExit(f"expected exactly one PAGES slot in the template, found {n}")
    out, n = re.subn(r"<!--KINDS-->", lambda m: "".join(options), out)
    if n != 1:
        raise SystemExit(f"expected exactly one KINDS slot in the template, found {n}")

    OUT.write_text(out, encoding="utf-8")
    per_kind = ", ".join("%s×%d" % (k, sum(1 for p in PAGES if p[0] == k)) for k, _ in KINDS)
    print(f"  {OUT.name:<26} {OUT.stat().st_size:>9,} bytes   ({len(PAGES)} pages: {per_kind})")


if __name__ == "__main__":
    build()
    sys.exit(0)
