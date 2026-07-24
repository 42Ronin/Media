#!/usr/bin/env bash
# Builds the standalone HTML lesson.
#
#   ./build.sh            -> dist/<lesson>.html          (default)
#   ./build.sh --scorm    -> also dist/<lesson>-scorm.zip
#
# SCORM packaging is opt-in and stays off until the course is ready to load into
# an LMS. The HTML inside the zip is byte-identical to the standalone file, so
# turning it on later changes nothing about the lesson itself.
set -euo pipefail
cd "$(dirname "$0")"

LESSON="lesson1-client-search"
TEMPLATE="src/lesson1.template.html"
OUT="dist"
WITH_SCORM=0
[ "${1:-}" = "--scorm" ] && WITH_SCORM=1

python3 tools/gen_roster.py

rm -rf "$OUT"; mkdir -p "$OUT"

python3 - "$TEMPLATE" "src/roster.json" "$OUT/$LESSON.html" <<'PY'
import sys
tpl, roster, out = sys.argv[1], sys.argv[2], sys.argv[3]
html = open(tpl).read()
data = open(roster).read().strip()
token = "/*__ROSTER__*/"
if token not in html:
    raise SystemExit("roster token missing from template")
open(out, "w").write(html.replace(token, data))
print(f"injected {len(data):,} bytes of roster data")
PY

if [ "$WITH_SCORM" = "1" ]; then
  mkdir -p "$OUT/_pkg"
  cp "$OUT/$LESSON.html" "$OUT/_pkg/index.html"
  cp scorm/imsmanifest.xml "$OUT/_pkg/imsmanifest.xml"
  ( cd "$OUT/_pkg" && zip -q -r "../$LESSON-scorm.zip" . )
  rm -rf "$OUT/_pkg"
else
  echo "scorm packaging skipped (run with --scorm to produce the zip)"
fi

echo "built:"
ls -1sh "$OUT" | tail -n +2 | awk '{printf "  %-38s %s\n", $2, $1}'
