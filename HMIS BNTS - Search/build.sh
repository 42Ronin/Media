#!/usr/bin/env bash
# Builds the standalone HTML simulations.
#
#   ./build.sh            -> dist/section-<n>.html and dist/step-<n>-<m>.html
#   ./build.sh --scorm    -> also a SCORM zip per section
#
# Two shapes, because two jobs.
#
#   A *section* build is a task bank: many situations, a training panel holding
#   one at a time, launched full screen from its own launcher card.
#
#   A *step* build is one slide's worth of interface, inline in a Rise block.
#   Rise carries the slide's own words above it; the block carries the doing.
#   No panel, no launcher, no full screen — and only ever one step's worth of
#   screen in front of the learner, so there is nothing to read ahead to.
#
# The template is shared. build.sh stamps the section number and, for a step, the
# step id; the lesson reads both. One source, no copies to keep in step.
set -euo pipefail
cd "$(dirname "$0")"

# The two simulators. Section 11 is retired: the script replaced its scenario with
# narration and three task embeds, so nothing ships that page any more.
SECTIONS=(7 10)
# Output names. The script dropped section numbers, so the files follow it.
name_of() { case "$1" in 7) echo simulator-1;; 10) echo simulator-2;; *) echo "section-$1";; esac; }
STEPS=(1 2 3)
KC_TEMPLATE="src/kc.template.html"
# 0 is the combined page the test suite walks. Not a deliverable; prefixed so it
# never gets mistaken for one.
TEST_BUILD=0
TEMPLATE="src/lesson1.template.html"
OUT="dist"
WITH_SCORM=0
[ "${1:-}" = "--scorm" ] && WITH_SCORM=1

python3 tools/gen_roster.py
# The knowledge check's questions live with the script, so the docx and the card
# page are rendered from one list. This is the copy the page gets.
python3 script/kc_data.py > src/kc.json

rm -rf "$OUT"; mkdir -p "$OUT"

# The training window, the placement solver and Lashes herself are shared with
# Lesson 3, so they live in tools/coach and are stamped in here. src/panel-body.html
# is the part of the window that is this lesson's: the progress bar, the task copy
# and the two buttons. Everything downstream builds from the assembled file.
ASSEMBLED="$OUT/_lesson1.assembled.html"
python3 ../tools/coach/assemble.py "$TEMPLATE" "$ASSEMBLED" "src/panel-body.html"
TEMPLATE="$ASSEMBLED"

# stamp(template, roster, out, section, step) — step is the JS literal, so "null"
# for a section build and a quoted id like "11.3" for a step build.
stamp() {
  python3 - "$@" <<'PY'
import sys
tpl, roster, out, sec, step = sys.argv[1:6]
play = sys.argv[6] if len(sys.argv) > 6 else "false"
html = open(tpl).read()
data = open(roster).read().strip()
for token, value in (("/*__ROSTER__*/", data), ("/*__SECTION__*/", sec),
                     ("/*__STEP__*/", step), ("/*__PLAY__*/", play)):
    if token not in html:
        raise SystemExit(f"{token} missing from template")
    html = html.replace(token, value)
open(out, "w").write(html)
PY
}

for SEC in "${SECTIONS[@]}" "$TEST_BUILD"; do
  [ "$SEC" = "0" ] && NAME="_all" || NAME="$(name_of "$SEC")"
  stamp "$TEMPLATE" "src/roster.json" "$OUT/$NAME.html" "$SEC" "null"

  if [ "$WITH_SCORM" = "1" ] && [ "$SEC" != "0" ]; then
    mkdir -p "$OUT/_pkg"
    cp "$OUT/$NAME.html" "$OUT/_pkg/index.html"
    sed "s/__SECTION__/$SEC/g" scorm/imsmanifest.xml > "$OUT/_pkg/imsmanifest.xml"
    ( cd "$OUT/_pkg" && zip -q -r "../$NAME-scorm.zip" . )
    rm -rf "$OUT/_pkg"
  fi
done

# The task embeds. They run inline in the Rise page rather than full screen, so
# they get no launcher — just the page and its zip.
for ST in "${STEPS[@]}"; do
  SEC=11
  SLUG="task-embed-$ST"
  stamp "$TEMPLATE" "src/roster.json" "$OUT/$SLUG.html" "$SEC" "\"$ST\""
  mkdir -p "$OUT/_pkg"
  cp "$OUT/$SLUG.html" "$OUT/_pkg/index.html"
  ( cd "$OUT/_pkg" && zip -q -r "../$SLUG.zip" index.html )
  rm -rf "$OUT/_pkg"
done

# "Now You Try": the search bar and the results, nothing else. Its own Rise block,
# so the learner can type freely before the first task asks anything of them.
stamp "$TEMPLATE" "src/roster.json" "$OUT/search-practice.html" "7" "null" "true"
mkdir -p "$OUT/_pkg"
cp "$OUT/search-practice.html" "$OUT/_pkg/index.html"
( cd "$OUT/_pkg" && zip -q -r "../search-practice.zip" index.html )
rm -rf "$OUT/_pkg"

# The knowledge check is its own Rise Code block: one page, six questions dealt as
# cards, and the only thing it ever reports is completion — and only once the
# learner has cleared the pass mark.
python3 - "$KC_TEMPLATE" "src/kc.json" "$OUT/knowledge-check.html" <<'PY'
import base64, pathlib, sys
tpl, data, out = sys.argv[1:4]
html = open(tpl).read()

# The LAHSA logo, if it has been added. Used whole and unaltered; when it is
# absent the card back falls back to an abstract crest rather than a drawing of
# the logo. See CLAUDE.md — never redraw it.
LOGO_TYPES = {".svg": "image/svg+xml", ".png": "image/png"}
logo = "null"
for ext, mime in LOGO_TYPES.items():
    f = pathlib.Path("src/lahsa-logo" + ext)
    if f.exists():
        logo = '"data:%s;base64,%s"' % (mime, base64.b64encode(f.read_bytes()).decode())
        print("  logo: %s (%,d bytes)".replace(",", "") % (f.name, f.stat().st_size))
        break
if html.count("/*" + "__LOGO__" + "*/") != 1:
    raise SystemExit("expected exactly one LOGO token in the knowledge-check template")
html = html.replace("/*" + "__LOGO__" + "*/", logo)
token = "/*" + "__KC__" + "*/"
# Exactly one, not at least one. It used to be named in the page's own header
# comment too, and replacing every occurrence quietly stamped the questions into
# a comment as well as into the code.
hits = html.count(token)
if hits != 1:
    raise SystemExit(f"knowledge-check template has {hits} KC tokens, expected exactly 1")
# `</` escaped: this goes inside a <script>, and a literal </script> in an
# author's writing would close the block early. See tools/stamp_kc.py.
kc = open(data).read().strip().replace("</", "<\\/")
open(out, "w").write(html.replace(token, kc))
PY
mkdir -p "$OUT/_pkg"
cp "$OUT/knowledge-check.html" "$OUT/_pkg/index.html"
( cd "$OUT/_pkg" && zip -q -r "../knowledge-check.zip" index.html )
rm -rf "$OUT/_pkg"

# The other stagings, built from the same questions and the same gate. These are
# what tools/kc-maker offers as themes; built here too so they can be opened and
# looked at without going through the maker.
python3 tools/stamp_kc.py src/kc-teller.template.html src/kc.json "$OUT/kc-teller-prototype.html"
python3 tools/stamp_kc.py src/kc-dealer.template.html src/kc.json "$OUT/kc-dealer-prototype.html"
# The Copperfield is a different KIND rather than another staging of the check: one
# box, no right answer, no mark. It takes the first question here only so there is
# something to look at — the lesson does not ship one, the maker authors them.
python3 tools/stamp_kc.py src/kc-copperfield.template.html src/kc.json "$OUT/kc-copperfield-prototype.html"

rm -f "$ASSEMBLED"

[ "$WITH_SCORM" = "1" ] || echo "scorm packaging skipped (run with --scorm to produce the zips)"

echo "built:"
ls -1sh "$OUT" | tail -n +2 | awk '{printf "  %-38s %s\n", $2, $1}'
