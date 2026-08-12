#!/usr/bin/env python3
"""Build the knowledge-check maker.

    python3 tools/kc-maker/make_maker.py     -> tools/kc-maker/kc-maker.html

`kc-maker.template.html` is the editor and **carries no payload**. The
knowledge-check page is base64'd into its empty `#page` script here, so the maker
can never ship a stale copy of the page it exports. The page keeps its
`/*__KC__*/` token — the maker is what fills it, in the browser, with whatever
was written in the editor.

The page template currently lives with the lesson that first needed it. If a
second lesson wants a knowledge check, move `kc.template.html` here and have the
lessons read it from the tool instead — the dependency should run lesson → tool,
the way it does for the scene editor.
"""

import base64
import pathlib
import re
import sys

HERE = pathlib.Path(__file__).resolve().parent
PAGE = HERE.parent.parent / "HMIS BNTS - Search" / "src" / "kc.template.html"
TEMPLATE = HERE / "kc-maker.template.html"
OUT = HERE / "kc-maker.html"


def build() -> None:
    if not PAGE.exists():
        raise SystemExit(f"no knowledge-check page template to embed ({PAGE} missing)")
    page = PAGE.read_text(encoding="utf-8")
    if "/*__KC__*/" not in page:
        raise SystemExit("the page template has no /*__KC__*/ token for the maker to fill")

    # The LAHSA logo, if the lesson has it, inlined the same way build.sh does —
    # used whole and unaltered. Absent, the card back keeps its abstract crest.
    logo = "null"
    for ext, mime in ((".svg", "image/svg+xml"), (".png", "image/png")):
        f = PAGE.parent / ("lahsa-logo" + ext)
        if f.exists():
            logo = '"data:%s;base64,%s"' % (mime, base64.b64encode(f.read_bytes()).decode())
            break
    token = "/*" + "__LOGO__" + "*/"
    if page.count(token) != 1:
        raise SystemExit("expected exactly one LOGO token in the page template")
    page = page.replace(token, logo)

    payload = base64.b64encode(page.encode("utf-8")).decode("ascii")
    shell = TEMPLATE.read_text(encoding="utf-8")
    out, n = re.subn(
        r'(<script id="page" type="text/plain">)[^<]*(</script>)',
        lambda m: m.group(1) + payload + m.group(2),
        shell,
    )
    if n != 1:
        raise SystemExit(f"expected exactly one #page script in the template, found {n}")

    OUT.write_text(out, encoding="utf-8")
    print(f"  {OUT.name:<26} {OUT.stat().st_size:>9,} bytes   (page {PAGE.stat().st_size:,})")


if __name__ == "__main__":
    build()
    sys.exit(0)
