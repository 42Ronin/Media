#!/usr/bin/env bash
# Builds the standalone HTML simulations, one per section.
#
#   ./build.sh            -> dist/section-7.html, dist/section-10.html, ...
#   ./build.sh --scorm    -> also a SCORM zip per section
#
# Each section ships on its own and gets its own launcher, because that is how
# they go into Rise: one Code block per section, in the place the script puts it.
# The template is shared — build.sh stamps the section number in and the lesson
# reads it, so there is one source and no copies to keep in step.
#
# SCORM packaging is opt-in and stays off until the course is ready to load into
# an LMS. The HTML inside a zip is byte-identical to the standalone file.
set -euo pipefail
cd "$(dirname "$0")"

SECTIONS=(7 10 11)
# 0 is the combined page the test suite walks. Not a deliverable; prefixed so it
# never gets mistaken for one.
TEST_BUILD=0
TEMPLATE="src/lesson1.template.html"
OUT="dist"
WITH_SCORM=0
[ "${1:-}" = "--scorm" ] && WITH_SCORM=1

python3 tools/gen_roster.py

rm -rf "$OUT"; mkdir -p "$OUT"

for SEC in "${SECTIONS[@]}" "$TEST_BUILD"; do
  [ "$SEC" = "0" ] && NAME="_all" || NAME="section-$SEC"
  python3 - "$TEMPLATE" "src/roster.json" "$OUT/$NAME.html" "$SEC" <<'PY'
import sys
tpl, roster, out, sec = sys.argv[1], sys.argv[2], sys.argv[3], sys.argv[4]
html = open(tpl).read()
data = open(roster).read().strip()
for token, value in (("/*__ROSTER__*/", data), ("/*__SECTION__*/", sec)):
    if token not in html:
        raise SystemExit(f"{token} missing from template")
    html = html.replace(token, value)
open(out, "w").write(html)
PY

  if [ "$WITH_SCORM" = "1" ] && [ "$SEC" != "0" ]; then
    mkdir -p "$OUT/_pkg"
    cp "$OUT/section-$SEC.html" "$OUT/_pkg/index.html"
    sed "s/__SECTION__/$SEC/g" scorm/imsmanifest.xml > "$OUT/_pkg/imsmanifest.xml"
    ( cd "$OUT/_pkg" && zip -q -r "../section-$SEC-scorm.zip" . )
    rm -rf "$OUT/_pkg"
  fi
done

[ "$WITH_SCORM" = "1" ] || echo "scorm packaging skipped (run with --scorm to produce the zips)"

echo "built:"
ls -1sh "$OUT" | tail -n +2 | awk '{printf "  %-38s %s\n", $2, $1}'
