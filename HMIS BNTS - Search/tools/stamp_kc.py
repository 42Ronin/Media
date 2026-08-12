#!/usr/bin/env python3
"""Stamp the knowledge-check page.

    python3 tools/stamp_kc.py <template> <kc.json> <out.html> [theme]

Fills the page's two build tokens:

  KC    the questions, from `script/kc_data.py` via `src/kc.json`
  LOGO  `src/lahsa-logo.png` (or .svg) as a data URI, or null

Both are asserted to appear exactly once. The KC token used to be named in the
page's own header comment as well, and replacing every occurrence stamped the
questions into a comment while the maker — which replaces only the first — got
an empty page. Count, do not assume.

The logo is used whole and unaltered; scaling is the only permitted latitude and
that happens once, when the file is added, not here. With no logo file the page
falls back to an abstract crest — never a redrawn logo. See CLAUDE.md.
"""

import base64
import json
import pathlib
import sys

LOGO_TYPES = ((".svg", "image/svg+xml"), (".png", "image/png"))


def token(name: str) -> str:
    # assembled so this file never contains the literal the tokens are searched by
    return "/*" + "__" + name + "__" + "*/"


def logo_uri(src_dir: pathlib.Path) -> str:
    for ext, mime in LOGO_TYPES:
        f = src_dir / ("lahsa-logo" + ext)
        if f.exists():
            return '"data:%s;base64,%s"' % (mime, base64.b64encode(f.read_bytes()).decode())
    return "null"


def stamp(tpl: pathlib.Path, data: pathlib.Path, out: pathlib.Path, theme: str = "") -> None:
    html = tpl.read_text(encoding="utf-8")
    payload = json.loads(data.read_text(encoding="utf-8"))
    if theme:
        payload["theme"] = theme

    for name, value in (("KC", json.dumps(payload)), ("LOGO", logo_uri(tpl.parent))):
        t = token(name)
        hits = html.count(t)
        if hits != 1:
            raise SystemExit(f"{out.name}: expected exactly one {name} token, found {hits}")
        html = html.replace(t, value)

    out.write_text(html, encoding="utf-8")


if __name__ == "__main__":
    if not 4 <= len(sys.argv) <= 5:
        raise SystemExit(__doc__.strip().splitlines()[2].strip())
    stamp(pathlib.Path(sys.argv[1]), pathlib.Path(sys.argv[2]),
          pathlib.Path(sys.argv[3]), sys.argv[4] if len(sys.argv) == 5 else "")
