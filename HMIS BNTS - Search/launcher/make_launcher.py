#!/usr/bin/env python3
"""Build the Rise Code-block launchers, one per section.

    python3 launcher/make_launcher.py           # every section that has a build
    python3 launcher/make_launcher.py 7         # just section 7

`template.html` is the shell: Lashes on a slim card, a title, a Begin button.
Begin mounts the simulation into a srcdoc iframe and requests full screen. The
simulation itself is not in the template — it is base64'd into the empty
`#payload` script at build time, so a launcher can never ship a stale build.

Output is `dist/<simulator>-launcher.zip`, which is what Rise wants:
Code block -> Upload project, one block per section. Re-import after any change;
Rise runs the copy it imported, not the file on disk.
"""

import base64
import pathlib
import re
import sys
import zipfile

HERE = pathlib.Path(__file__).resolve().parent
BUILDS = HERE.parent / "dist"
TEMPLATE = HERE / "template.html"
OUT_DIR = HERE / "dist"

TITLE = "Section {n} \u2014 Hands-on Simulations"


def build(section: int, shell: str) -> None:
    src = BUILDS / f"{section}.html"
    if not src.exists():
        raise SystemExit(f"no build to wrap — run ./build.sh first ({src} missing)")

    payload = base64.b64encode(src.read_bytes()).decode("ascii")
    out, n = re.subn(
        r'(<script id="payload" type="text/plain">)[^<]*(</script>)',
        lambda m: m.group(1) + payload + m.group(2),
        shell,
    )
    if n != 1:
        raise SystemExit(f"expected exactly one #payload script in the template, found {n}")

    # The card, the browser tab and the JS constant all say the same thing.
    title = TITLE.format(n=section)
    out = out.replace("<title>Lesson 1 — Finding a Participant</title>", f"<title>{title}</title>")
    out = out.replace(
        '<h2 id="lTitle">Lesson 1 — Finding a Participant</h2>',
        f'<h2 id="lTitle">{title}</h2>')
    out, t = re.subn(r'var TITLE="[^"]*"', f'var TITLE="{title}"', out)
    if t != 1:
        raise SystemExit("could not stamp the title into the shell")

    # Her lens is solid in the simulation; the launch card is the same character
    # and has to match. The bible has it at .85, which reads as see-through.
    out = out.replace(".m-glass{fill:#dceaee;opacity:.85}", ".m-glass{fill:#e0eff5;opacity:1}")

    OUT_DIR.mkdir(exist_ok=True)
    page = OUT_DIR / f"{section}-index.html"
    zip_path = OUT_DIR / f"{section}-launcher.zip"
    page.write_text(out, encoding="utf-8")
    with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as z:
        z.write(page, "index.html")
    print(f"  {zip_path.name:<32} {zip_path.stat().st_size:>9,} bytes"
          f"   (simulation {src.stat().st_size:,})")


shell_html = TEMPLATE.read_text(encoding="utf-8")
wanted = [int(a) for a in sys.argv[1:]] or sorted(
    m.group(1) for m in (re.match(r"(simulator-\d+)\.html$", f.name) for f in BUILDS.glob("simulator-*.html")) if m
)
if not wanted:
    raise SystemExit("no section builds found in dist/ — run ./build.sh first")
for sec in wanted:
    build(sec, shell_html)
