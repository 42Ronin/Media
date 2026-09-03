#!/usr/bin/env bash
# Builds Lesson 3, Creating a Profile.
#
#   ./build.sh    -> dist/*.html and dist/*.zip
#
# Collect-and-inline, like the other lessons: each page must stand alone with no
# network, so everything it needs goes inside it.
#
# The one thing this build does that the others do not is inline LASHES FROM ONE
# SOURCE. Her drawing used to be copied by hand into every page that showed her,
# with "if her face changes, change it in both" as a note in CLAUDE.md rather
# than something the build enforced. Now `tools/lashes/face.{js,css}` is the only
# copy and the token is how a page gets her.
set -euo pipefail
cd "$(dirname "$0")"

LASHES="../tools/lashes"
OUT="dist"
PAGES=(add-client bobbi)

rm -rf "$OUT"; mkdir -p "$OUT"

for NAME in "${PAGES[@]}"; do
  python3 - "src/$NAME.template.html" "$LASHES" "$OUT/sim-$NAME.html" <<'PY'
import pathlib, sys
tpl, lashes, out = sys.argv[1:4]
html = pathlib.Path(tpl).read_text(encoding="utf-8")

# Assembled so this file never contains the literals it searches for.
def token(name): return "/*" + "__" + name + "__" + "*/"

for name, path in (("LASHES_JS",  pathlib.Path(lashes) / "face.js"),
                   ("LASHES_CSS", pathlib.Path(lashes) / "face.css")):
    t = token(name)
    hits = html.count(t)
    # Exactly one, not at least one — the same rule the knowledge check learned
    # the hard way, where a token named twice stamped the payload into a comment.
    if hits != 1:
        raise SystemExit(f"{pathlib.Path(tpl).name}: expected exactly one {name} token, found {hits}")
    html = html.replace(t, path.read_text(encoding="utf-8"))

pathlib.Path(out).write_text(html, encoding="utf-8")
PY
  # Each sim is its own Rise Code block, so each gets a zip holding index.html,
  # which is the name Rise looks for.
  mkdir -p "$OUT/_pkg"
  cp "$OUT/sim-$NAME.html" "$OUT/_pkg/index.html"
  ( cd "$OUT/_pkg" && zip -q -r "../sim-$NAME.zip" index.html )
  rm -rf "$OUT/_pkg"
done

echo "built:"
ls -1sh "$OUT" | tail -n +2 | awk '{printf "  %-34s %s\n", $2, $1}'
