#!/usr/bin/env python3
"""Build the knowledge-check maker.

    python3 tools/kc-maker/make_maker.py     -> tools/kc-maker/kc-maker.html

`kc-maker.template.html` is the editor and **carries no payload**. Every
knowledge-check page it can export is base64'd into it here, one `<script
class="page" data-theme=...>` each, so the maker can never ship a stale copy of a
page it exports. Each page keeps its `/*__KC__*/` token — the maker is what fills
it, in the browser, with whatever was written in the editor.

THEMES is the whole list. A new staging is a new row: a key, a label for the
selector, and the template it ships. Nothing else in the maker knows their names.

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

# key, label in the selector, page template
THEMES = (
    ("standard", "Standard", SRC / "kc.template.html"),
    ("teller", "Fortune Teller", SRC / "kc-teller.template.html"),
    ("dealer", "Card Dealer", SRC / "kc-dealer.template.html"),
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

    blocks, options = [], []
    for key, label, page in THEMES:
        blocks.append('<script class="page" data-theme="%s" type="text/plain">%s</script>'
                      % (key, payload(page, logo)))
        options.append('<option value="%s">%s</option>' % (key, label))

    out, n = re.subn(r"<!--PAGES-->", lambda m: "\n".join(blocks), shell)
    if n != 1:
        raise SystemExit(f"expected exactly one PAGES slot in the template, found {n}")
    out, n = re.subn(r"<!--THEMES-->", lambda m: "".join(options), out)
    if n != 1:
        raise SystemExit(f"expected exactly one THEMES slot in the template, found {n}")

    OUT.write_text(out, encoding="utf-8")
    print(f"  {OUT.name:<26} {OUT.stat().st_size:>9,} bytes   "
          f"({len(THEMES)} themes: {', '.join(k for k, _, _ in THEMES)})")


if __name__ == "__main__":
    build()
    sys.exit(0)
