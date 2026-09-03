#!/usr/bin/env bash
# Builds Lesson 3, Creating a Profile.
#
#   ./build.sh    -> dist/*.html and dist/*.zip
#
# Collect-and-inline, like the other lessons: each page must stand alone with no
# network, so everything it needs goes inside it.
#
# What it inlines comes from ONE SOURCE per thing: the training panel and the
# Lashes rig from tools/coach, her drawing from tools/lashes. Her face used to be
# copied by hand into every page that showed her, with "if her face changes,
# change it in both" as a note in CLAUDE.md rather than something a build
# enforced. tools/coach/assemble.py does the stamping and checks every token
# appears exactly once.
set -euo pipefail
cd "$(dirname "$0")"

OUT="dist"
# Every page wears the shared training panel from tools/coach — a movable window
# docked to a reserved column on the right, white with a teal title bar, draggable,
# poppable and collapsible, and nothing it does reflows the interface. That is the
# series' look, and it is a build step now rather than something three files agree
# on until one drifts. Each page supplies its own src/panel-body-<name>.html.
PAGES=(add-client bobbi)

rm -rf "$OUT"; mkdir -p "$OUT"

for NAME in "${PAGES[@]}"; do
  python3 ../tools/coach/assemble.py "src/$NAME.template.html" "$OUT/sim-$NAME.html" \
    "src/panel-body-$NAME.html"
  mkdir -p "$OUT/_pkg"
  cp "$OUT/sim-$NAME.html" "$OUT/_pkg/index.html"
  ( cd "$OUT/_pkg" && zip -q -r "../sim-$NAME.zip" index.html )
  rm -rf "$OUT/_pkg"
done

echo "built:"
ls -1sh "$OUT" | tail -n +2 | awk '{printf "  %-34s %s\n", $2, $1}'
