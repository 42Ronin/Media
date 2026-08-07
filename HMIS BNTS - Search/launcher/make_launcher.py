#!/usr/bin/env python3
"""Build the Rise Code-block launcher.

    python3 launcher/make_launcher.py

`template.html` is the shell: Lashes on a slim card, a title, a Begin button.
Begin mounts the lesson into a srcdoc iframe and goes full screen. The lesson
itself is not in the template — it is base64'd into the empty `#payload` script
at build time, so the launcher can never ship a stale build by accident.

Output is `dist/lesson1launcher.zip`, which is what Rise wants:
Code block -> Upload project. Re-import after any change; Rise runs the copy it
imported, not the file on disk.
"""

import base64
import pathlib
import re
import zipfile

HERE = pathlib.Path(__file__).resolve().parent
LESSON = HERE.parent / "dist" / "lesson1-client-search.html"
TEMPLATE = HERE / "template.html"
OUT_DIR = HERE / "dist"
OUT_HTML = OUT_DIR / "index.html"
OUT_ZIP = OUT_DIR / "lesson1launcher.zip"

if not LESSON.exists():
    raise SystemExit(f"no build to wrap — run ./build.sh first ({LESSON} missing)")

shell = TEMPLATE.read_text(encoding="utf-8")
lesson = LESSON.read_bytes()
payload = base64.b64encode(lesson).decode("ascii")

out, n = re.subn(
    r'(<script id="payload" type="text/plain">)[^<]*(</script>)',
    lambda m: m.group(1) + payload + m.group(2),
    shell,
)
if n != 1:
    raise SystemExit(f"expected exactly one #payload script in the template, found {n}")

# Her lens is solid in the lesson; the launch card is the same character and has
# to match. The bible has it at .85, which reads as see-through rather than glass.
out = out.replace(".m-glass{fill:#dceaee;opacity:.85}", ".m-glass{fill:#e0eff5;opacity:1}")

OUT_DIR.mkdir(exist_ok=True)
OUT_HTML.write_text(out, encoding="utf-8")
with zipfile.ZipFile(OUT_ZIP, "w", zipfile.ZIP_DEFLATED) as z:
    z.write(OUT_HTML, "index.html")

print(f"  lesson   {len(lesson):>9,} bytes")
print(f"  payload  {len(payload):>9,} bytes base64")
print(f"  {OUT_HTML.name:<10} {OUT_HTML.stat().st_size:>9,} bytes")
print(f"  {OUT_ZIP.name:<10} {OUT_ZIP.stat().st_size:>9,} bytes")
