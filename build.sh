#!/usr/bin/env bash
# Builds both deliverables from the single source file in src/.
#   dist/hmis-client-search-sim.html       -> standalone, open in any browser
#   dist/hmis-client-search-sim-scorm.zip  -> SCORM 1.2 package for an LMS
set -euo pipefail
cd "$(dirname "$0")"

SRC="src/index.html"
OUT="dist"
NAME="hmis-client-search-sim"

[ -f "$SRC" ] || { echo "missing $SRC"; exit 1; }
rm -rf "$OUT"; mkdir -p "$OUT/_scorm"

# 1. standalone
cp "$SRC" "$OUT/$NAME.html"

# 2. scorm package (identical HTML + manifest, zipped at the root)
cp "$SRC" "$OUT/_scorm/index.html"
cp scorm/imsmanifest.xml "$OUT/_scorm/imsmanifest.xml"
( cd "$OUT/_scorm" && zip -q -r "../$NAME-scorm.zip" . )
rm -rf "$OUT/_scorm"

echo "built:"
ls -lh "$OUT" | tail -n +2 | awk '{printf "  %-38s %s\n", $9, $5}'
