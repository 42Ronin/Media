#!/usr/bin/env python3
"""Build the front door.

    python3 tools/make_index.py     -> index.html

One page listing every tool and every built block, with a link to each. It is
GENERATED rather than written by hand for the same reason the script docx is: a
hand-kept index goes stale the first time somebody adds a tool and forgets, and
an index that lies about what exists is worse than none.

Nothing is listed unless the file is actually on disk. An entry whose file is
missing is shown greyed with the command that builds it, so the page doubles as
a check on what still needs a build.

The page itself fetches nothing and is safe to open straight off the filesystem.
"""

import html
import pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / "index.html"

# section title, blurb, [(path, name, what it is, how it is built)]
SECTIONS = [
    ("Authoring tools",
     "Open in a browser. Nothing is installed and nothing you write leaves the machine.",
     [("tools/kc-maker/kc-maker.html", "Knowledge check maker",
       "Two kinds — the scored card check (a deck, one right answer, a pass mark) and the "
       "Copperfield (one box, no right answer, the answers disintegrate as you take them). "
       "Rich text, three themes for the check, exports a Rise-ready zip.",
       "python3 tools/kc-maker/make_maker.py"),
      ("tools/scene-editor/scene-editor.html", "Scene editor",
       "The photos-and-narration openers. Ken Burns motion over stills against the audio "
       "clock, keyframes per scene. Exports one self-contained page that fetches nothing.",
       "no build — the tool is the source"),
      ("tools/job-aid-builder/job-aid-builder.html", "Job aid builder",
       "Printable step-by-step guides. Steps and substeps, a screenshot per step with a "
       "choice of frame and border, page breaks, a table of contents, your own logo. "
       "Download PDF; projects save and reopen. jsPDF is vendored in, not fetched.",
       "no build — the tool is the source"),
      ("tools/lashes-builder/lashes-builder.html", "Lashes block builder",
       "A Lashes message block for Rise — her, a line and a button. Four expressions, "
       "either side of the message, plus a Launcher shape. Downloads an "
       "<code>index.html</code> or copies the code out.",
       "no build — the tool is the source"),
      ]),

    ("Lesson 2 — Search &middot; Rise blocks",
     "Each zip holds an <code>index.html</code>, which is what a Rise Code block looks for.",
     [("HMIS BNTS - Search/launcher/dist/simulator-1-launcher.zip", "Simulation 1 — Finding a Participant",
       "Eight scored situations, with the orientation tour. Launches full screen from a Begin card.",
       "python3 'HMIS BNTS - Search/launcher/make_launcher.py'"),
      ("HMIS BNTS - Search/launcher/dist/simulator-2-launcher.zip", "Simulation 2 — Verifying a Record",
       "Five scored situations on telling near-identical records apart.",
       "python3 'HMIS BNTS - Search/launcher/make_launcher.py'"),
      ("HMIS BNTS - Search/dist/task-embed-1.zip", "Task embed 1",
       "Searches Desmond Carrow, then Carrow alone, and finds nobody. Interface only.",
       "cd 'HMIS BNTS - Search' && ./build.sh"),
      ("HMIS BNTS - Search/dist/task-embed-2.zip", "Task embed 2",
       "Searches the fragment Dez with the year 1974 and lands on two records.",
       "cd 'HMIS BNTS - Search' && ./build.sh"),
      ("HMIS BNTS - Search/dist/task-embed-3.zip", "Task embed 3",
       "Settles which Dezmond it is, by Location or by the Point of Contact.",
       "cd 'HMIS BNTS - Search' && ./build.sh"),
      ("HMIS BNTS - Search/dist/search-practice.zip", "Free-play search",
       "Search and results only. They can type anything; there is no way into a record.",
       "cd 'HMIS BNTS - Search' && ./build.sh"),
      ("HMIS BNTS - Search/dist/knowledge-check.zip", "Knowledge check",
       "Six questions, five to pass. Completion is withheld until the mark is cleared.",
       "cd 'HMIS BNTS - Search' && ./build.sh"),
      ]),

    ("Lesson 1 — Why HMIS &middot; Rise blocks",
     "One Copperfield per slide. Rest on each answer and it disintegrates; when the last "
     "has gone the question goes with it and the writing underneath assembles out of the dust.",
     [("HMIS BNTS - Why/boxes/how-many-people.zip", "How many people",
       "&ldquo;How many people are experiencing homelessness in Los Angeles County tonight?&rdquo;",
       "cd 'HMIS BNTS - Why/tools' && node make_boxes.mjs"),
      ("HMIS BNTS - Why/boxes/already-offered-help.zip", "Already offered help",
       "&ldquo;Has this person already been offered help somewhere else?&rdquo;",
       "cd 'HMIS BNTS - Why/tools' && node make_boxes.mjs"),
      ("HMIS BNTS - Why/boxes/did-any-of-this-work.zip", "Did any of this work",
       "&ldquo;Did any of this actually work?&rdquo;",
       "cd 'HMIS BNTS - Why/tools' && node make_boxes.mjs"),
      ]),

    ("Open in a browser",
     "The same things as standalone pages, for looking at without unzipping. "
     "Note these only report completion when embedded, so a top-level open will not mark a "
     "Rise block done.",
     [("HMIS BNTS - Search/dist/simulator-1.html", "Simulation 1", "", ""),
      ("HMIS BNTS - Search/dist/simulator-2.html", "Simulation 2", "", ""),
      ("HMIS BNTS - Search/dist/task-embed-1.html", "Task embed 1", "", ""),
      ("HMIS BNTS - Search/dist/task-embed-2.html", "Task embed 2", "", ""),
      ("HMIS BNTS - Search/dist/task-embed-3.html", "Task embed 3", "", ""),
      ("HMIS BNTS - Search/dist/search-practice.html", "Free-play search", "", ""),
      ("HMIS BNTS - Search/dist/knowledge-check.html", "Knowledge check", "", ""),
      ]),

    ("Prototypes and alternate stagings",
     "Built from the same questions and the same gate as the shipped check. "
     "The Card Dealer was rejected on sight and is parked, not approved.",
     [("HMIS BNTS - Search/dist/kc-copperfield-prototype.html", "Copperfield",
       "The disappearing-answers box, on the lesson&rsquo;s first question.", ""),
      ("HMIS BNTS - Search/dist/kc-teller-prototype.html", "Fortune Teller",
       "The check staged as a reading, with the crystal ball.", ""),
      ("HMIS BNTS - Search/dist/kc-dealer-prototype.html", "Card Dealer",
       "Parked. Her design was the teller&rsquo;s in green and nothing about it read as a dealer.", ""),
      ]),
]

# things that are not files you open
COMMANDS = [
    ("Build the lesson", "cd 'HMIS BNTS - Search' && ./build.sh",
     "Regenerates the roster, then every page and zip. <code>--scorm</code> also writes the "
     "SCORM packages, which are off by default."),
    ("Run the lesson tests", "cd 'HMIS BNTS - Search' && node test.mjs",
     "The whole contract: search behaviour, the fictional-data promises, the embeds, the "
     "knowledge check, and that nothing fetches anything."),
    ("Run the maker tests", "cd tools/kc-maker && node test.mjs",
     "Drives the editor, then plays every theme&rsquo;s export in a frame."),
    ("Check the build against the script", "SCRIPT_DOCX='&hellip;' node 'HMIS BNTS - Search/script/check_copy.mjs'",
     "Fails if any learner-facing block differs in wording, in either direction. Needs the "
     "current script docx."),
    ("Check no task gives itself away", "node 'HMIS BNTS - Search/tools/obviousness.mjs'",
     "Runs the naive search for every task and fails if the first thing a trainee would type "
     "hands over the answer."),
    ("Rebuild this page", "python3 tools/make_index.py", ""),
]

ELSEWHERE = [
    ("Family Feud", "42Ronin/LAHSA &mdash; <code>Training Tools/Family Feud/</code>",
     "A game-shaped board for a room, with its own build, tests and README. On the "
     "<code>brand-square</code> and <code>&hellip;training-tools-subrepo</code> branches; not on "
     "that repo&rsquo;s <code>main</code>."),
]

CSS = """
:root{--teal:#066888;--teal-dk:#044e66;--ink:#14222b;--mut:#5f7f8f;--line:#dbe8ef;
  --panel:#f2f8fb;--bg:#fbfdfe;--gold:#b99c00}
*{box-sizing:border-box}
html,body{margin:0;padding:0}
body{font:16px/1.6 "Segoe UI",-apple-system,BlinkMacSystemFont,Roboto,Helvetica,Arial,sans-serif;
  color:var(--ink);background:var(--bg);-webkit-font-smoothing:antialiased}
.wrap{max-width:1000px;margin:0 auto;padding:40px 24px 72px}
header{border-bottom:3px solid var(--teal);padding-bottom:18px;margin-bottom:34px}
h1{margin:0 0 6px;font-size:30px;letter-spacing:-.01em;color:var(--teal-dk)}
header p{margin:0;color:var(--mut);max-width:62ch}
h2{margin:38px 0 4px;font-size:13px;letter-spacing:.11em;text-transform:uppercase;color:var(--teal)}
h2 + p.blurb{margin:0 0 16px;color:var(--mut);font-size:14.5px;max-width:76ch}
ul{list-style:none;margin:0;padding:0;display:grid;gap:10px}
ul.compact{grid-template-columns:repeat(auto-fill,minmax(210px,1fr))}
li{background:#fff;border:1px solid var(--line);border-radius:12px;padding:14px 16px;
  box-shadow:0 1px 2px rgba(20,34,43,.04)}
li.gone{background:var(--panel);border-style:dashed;box-shadow:none}
a.name{font-weight:700;color:var(--teal);text-decoration:none;font-size:16.5px;
  text-underline-offset:3px}
a.name:hover{text-decoration:underline}
span.name{font-weight:700;color:var(--mut);font-size:16.5px}
.what{margin:3px 0 0;color:var(--ink);font-size:14.5px}
.how{margin:7px 0 0;font-size:12.5px;color:var(--mut)}
code{font:13px/1.5 ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;
  background:var(--panel);border:1px solid var(--line);border-radius:5px;padding:1px 5px}
.cmd{display:block;margin:5px 0 0;padding:9px 12px;background:#0d2b38;color:#d7ecf4;
  border-radius:8px;border:0;overflow-x:auto;white-space:pre}
.note{margin-top:44px;padding:16px 18px;border-left:4px solid var(--gold);
  background:#fffdf2;border-radius:0 10px 10px 0;font-size:14.5px;color:#4a4326}
footer{margin-top:46px;padding-top:16px;border-top:1px solid var(--line);
  color:var(--mut);font-size:13px}
"""


def entry(rel: str, name: str, what: str, how: str) -> str:
    there = (ROOT / rel).exists()
    href = html.escape(rel.replace(" ", "%20"))
    head = (f'<a class="name" href="{href}">{name}</a>' if there
            else f'<span class="name">{name}</span>')
    bits = [f'<li class="{"" if there else "gone"}">', head]
    if what:
        bits.append(f'<p class="what">{what}</p>')
    if not there:
        bits.append('<p class="how">Not built yet.</p>')
    if how and not there:
        bits.append(f'<code class="cmd">{html.escape(how)}</code>')
    elif how:
        bits.append(f'<p class="how">Rebuild: <code>{html.escape(how)}</code></p>')
    bits.append("</li>")
    return "".join(bits)


def build() -> None:
    out = ['<!doctype html>', '<html lang="en">', '<head>', '<meta charset="utf-8">',
           '<meta name="viewport" content="width=device-width, initial-scale=1">',
           '<title>LAHSA training tools</title>',
           '<!-- GENERATED by tools/make_index.py. Do not hand-edit: run the script. -->',
           f'<style>{CSS}</style>', '</head>', '<body><div class="wrap">',
           '<header><h1>LAHSA training tools</h1>',
           '<p>Everything built for the HMIS Basic Navigation series &mdash; the tools that '
           'author it and the blocks that ship. Every page here is self-contained and fetches '
           'nothing.</p></header>']

    for title, blurb, items in SECTIONS:
        compact = all(not w for _, _, w, _ in items)
        out.append(f"<h2>{title}</h2>")
        if blurb:
            out.append(f'<p class="blurb">{blurb}</p>')
        out.append(f'<ul class="{"compact" if compact else ""}">')
        out += [entry(*i) for i in items]
        out.append("</ul>")

    out.append("<h2>Build and check</h2>")
    out.append('<p class="blurb">Run from the repository root.</p><ul>')
    for name, cmd, what in COMMANDS:
        out.append(f'<li><span class="name">{name}</span>')
        if what:
            out.append(f'<p class="what">{what}</p>')
        out.append(f'<code class="cmd">{cmd}</code></li>')
    out.append("</ul>")

    out.append("<h2>Elsewhere</h2>")
    out.append('<p class="blurb">Built for LAHSA but living in the other repository, so not '
               'linkable from here.</p><ul>')
    for name, where, what in ELSEWHERE:
        out.append(f'<li><span class="name">{name}</span>'
                   f'<p class="what">{what}</p><p class="how">{where}</p></li>')
    out.append("</ul>")

    out.append('<div class="note"><b>Her drawing is duplicated.</b> The same geometry and the '
               'same expression library are copied into the lesson template, each '
               'knowledge-check staging and the Lashes builder &mdash; copied rather than '
               'imported, because each page has to stand alone with no network. Change her '
               'face and it has to change in all of them.</div>')

    out.append('<footer>Generated by <code>tools/make_index.py</code>. '
               'All client data in these lessons is fictional. Not affiliated with, endorsed by, '
               'or connected to Bitfocus, Inc.</footer>')
    out.append("</div></body></html>")

    OUT.write_text("\n".join(out), encoding="utf-8")
    missing = sum(1 for _, _, items in SECTIONS for i in items if not (ROOT / i[0]).exists())
    listed = sum(len(items) for _, _, items in SECTIONS)
    print(f"  {OUT.name:<26} {OUT.stat().st_size:>9,} bytes   "
          f"({listed} entries, {missing} not built)")


if __name__ == "__main__":
    build()
