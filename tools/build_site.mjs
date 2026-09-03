/**
 * Build the site.
 *
 *   node tools/build_site.mjs        -> public/  and  index.html
 *
 * This is what Vercel runs. It does NOT rebuild a lesson: `dist/` is committed on
 * purpose (see the root CLAUDE.md), so publishing is collect-and-rename, and the
 * deploy needs Node and nothing else — no Python, no `zip`, no Playwright.
 * Change a lesson, rebuild it locally, commit the dist, push.
 *
 * Two things come out of one manifest:
 *
 *   public/      the site — every tool and every block at its own clean URL
 *   index.html   the same front door with repo-relative links, for opening off
 *                the filesystem when there is no server
 *
 * `public/` is generated and gitignored. `index.html` is committed, because it is
 * the offline copy and there is no build to run before opening it.
 *
 * Adding a tool is a row in MANIFEST. Nothing else here knows any of their names.
 */

import { existsSync, mkdirSync, copyFileSync, writeFileSync, statSync, rmSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const OUT = join(ROOT, 'public');

const S = 'HMIS BNTS - Search';
const W = 'HMIS BNTS - Why';
const C = 'HMIS BNTS - Create';

/* src   where it is in the repo
   slug  where it goes on the site. A page becomes <slug>/index.html so the URL
         carries no extension; a zip keeps its filename so it downloads sensibly.
   zip   the Rise block that goes with the page, if there is one
   how   the command that rebuilds it, shown on the card                        */
const MANIFEST = [
  {
    title: 'Authoring tools',
    blurb: 'Open in a browser. Nothing is installed and nothing you write leaves the machine.',
    items: [
      { src: 'tools/kc-maker/kc-maker.html', slug: 'tools/knowledge-check-maker',
        name: 'Knowledge check maker',
        what: 'Two kinds — the scored card check (a deck, one right answer, a pass mark) and ' +
              'the Copperfield (one box, no right answer, the answers disintegrate as you take ' +
              'them). Rich text, three themes for the check, exports a Rise-ready zip.',
        how: 'python3 tools/kc-maker/make_maker.py' },
      { src: 'tools/scene-editor/scene-editor.html', slug: 'tools/scene-editor',
        name: 'Scene editor',
        what: 'The photos-and-narration openers. Ken Burns motion over stills against the audio ' +
              'clock, keyframes per scene. Exports one self-contained page that fetches nothing.' },
      { src: 'tools/job-aid-builder/job-aid-builder.html', slug: 'tools/job-aid-builder',
        name: 'Job aid builder',
        what: 'Printable step-by-step guides. Steps and substeps, a screenshot per step with a ' +
              'choice of frame and border, page breaks, a table of contents, your own logo. ' +
              'Download PDF; projects save and reopen. jsPDF is vendored in, not fetched.' },
      { src: 'tools/lashes-builder/lashes-builder.html', slug: 'tools/lashes-builder',
        name: 'Lashes block builder',
        what: 'A Lashes message block for Rise — her, a line and a button. Four expressions, ' +
              'either side of the message, plus a Launcher shape.' },
    ],
  },
  {
    title: 'Lesson 2 — Search',
    blurb: 'Open one to try it. The <b>Rise block</b> beside it is the zip that goes into a Code ' +
           'block — it holds an <code>index.html</code>, which is what Rise looks for.',
    items: [
      { src: `${S}/dist/simulator-1.html`, slug: 'lesson-2-search/simulation-1',
        name: 'Simulation 1 — Finding a Participant',
        what: 'Eight scored situations, with the orientation tour.',
        zip: `${S}/launcher/dist/simulator-1-launcher.zip`,
        how: `python3 '${S}/launcher/make_launcher.py'` },
      { src: `${S}/dist/simulator-2.html`, slug: 'lesson-2-search/simulation-2',
        name: 'Simulation 2 — Verifying a Record',
        what: 'Five scored situations on telling near-identical records apart.',
        zip: `${S}/launcher/dist/simulator-2-launcher.zip`,
        how: `python3 '${S}/launcher/make_launcher.py'` },
      { src: `${S}/dist/task-embed-1.html`, slug: 'lesson-2-search/task-embed-1',
        name: 'Task embed 1',
        what: 'Searches Desmond Carrow, then Carrow alone, and finds nobody. Interface only.',
        zip: `${S}/dist/task-embed-1.zip`, how: `cd '${S}' && ./build.sh` },
      { src: `${S}/dist/task-embed-2.html`, slug: 'lesson-2-search/task-embed-2',
        name: 'Task embed 2',
        what: 'Searches the fragment Dez with the year 1974 and lands on two records.',
        zip: `${S}/dist/task-embed-2.zip`, how: `cd '${S}' && ./build.sh` },
      { src: `${S}/dist/task-embed-3.html`, slug: 'lesson-2-search/task-embed-3',
        name: 'Task embed 3',
        what: 'Settles which Dezmond it is, by Location or by the Point of Contact.',
        zip: `${S}/dist/task-embed-3.zip`, how: `cd '${S}' && ./build.sh` },
      { src: `${S}/dist/search-practice.html`, slug: 'lesson-2-search/free-play',
        name: 'Free-play search',
        what: 'Search and results only. They can type anything; there is no way into a record.',
        zip: `${S}/dist/search-practice.zip`, how: `cd '${S}' && ./build.sh` },
      { src: `${S}/dist/knowledge-check.html`, slug: 'lesson-2-search/knowledge-check',
        name: 'Knowledge check',
        what: 'Six questions, five to pass. Completion is withheld until the mark is cleared.',
        zip: `${S}/dist/knowledge-check.zip`, how: `cd '${S}' && ./build.sh` },
    ],
  },
  {
    title: 'Lesson 1 — Why HMIS',
    blurb: 'One Copperfield per slide. Rest on each answer and it disintegrates; when the last ' +
           'has gone the question goes with it and the writing underneath assembles out of the ' +
           'dust.',
    items: [
      { src: `${W}/boxes/how-many-people.zip`, slug: 'lesson-1-why/how-many-people',
        zipOnly: true, name: 'How many people',
        what: '&ldquo;How many people are experiencing homelessness in Los Angeles County ' +
              'tonight?&rdquo;',
        how: `cd '${W}/tools' && node make_boxes.mjs` },
      { src: `${W}/boxes/already-offered-help.zip`, slug: 'lesson-1-why/already-offered-help',
        zipOnly: true, name: 'Already offered help',
        what: '&ldquo;Has this person already been offered help somewhere else?&rdquo;',
        how: `cd '${W}/tools' && node make_boxes.mjs` },
      { src: `${W}/boxes/did-any-of-this-work.zip`, slug: 'lesson-1-why/did-any-of-this-work',
        zipOnly: true, name: 'Did any of this work',
        what: '&ldquo;Did any of this actually work?&rdquo;',
        how: `cd '${W}/tools' && node make_boxes.mjs` },
    ],
  },
  {
    title: 'Lesson 3 — Creating a Profile',
    blurb: 'In build. The Add Client replica and the guided walkthrough, on the real Lashes. ' +
           'The v2 script is bigger than these two — see the lesson README for what is left.',
    items: [
      { src: `${C}/dist/sim-bobbi.html`, slug: 'lesson-3-create/meeting-bobbi',
        name: 'Guided walkthrough — Meeting Bobbi',
        what: 'The conversation on the left, the form filling in on the right, then Save and ' +
              'the Unique Identifier. Watch-only for now; the script wants it interactive.',
        zip: `${C}/dist/sim-bobbi.zip`, how: `cd '${C}' && ./build.sh` },
      { src: `${C}/dist/sim-add-client.html`, slug: 'lesson-3-create/add-client-practice',
        name: 'Add Client practice',
        what: 'A working Add Client replica with the task set: the two-stage conversation, the ' +
              '&ldquo;Ask them&rdquo; gate, the Consent Refused auto-fill, and the consent ' +
              'section rendering by Documentation type.',
        zip: `${C}/dist/sim-add-client.zip`, how: `cd '${C}' && ./build.sh` },
    ],
  },
  {
    title: 'Prototypes and alternate stagings',
    blurb: 'Built from the same questions and the same gate as the shipped check. The Card ' +
           'Dealer was rejected on sight and is parked, not approved.',
    items: [
      { src: `${S}/dist/kc-copperfield-prototype.html`, slug: 'prototypes/copperfield',
        name: 'Copperfield',
        what: 'The disappearing-answers box, on the lesson&rsquo;s first question.' },
      { src: `${S}/dist/kc-teller-prototype.html`, slug: 'prototypes/fortune-teller',
        name: 'Fortune Teller', what: 'The check staged as a reading, with the crystal ball.' },
      { src: `${S}/dist/kc-dealer-prototype.html`, slug: 'prototypes/card-dealer',
        name: 'Card Dealer',
        what: 'Parked. Her design was the teller&rsquo;s in green and nothing about it read as ' +
              'a dealer.' },
    ],
  },
];

const COMMANDS = [
  ['Build the lesson', `cd '${S}' && ./build.sh`,
   'Regenerates the roster, then every page and zip. <code>--scorm</code> also writes the ' +
   'SCORM packages, which are off by default.'],
  ['Run the lesson tests', `cd '${S}' && node test.mjs`,
   'The whole contract: search behaviour, the fictional-data promises, the embeds, the ' +
   'knowledge check, and that nothing fetches anything.'],
  ['Run the maker tests', 'cd tools/kc-maker && node test.mjs',
   'Drives the editor, then plays every theme&rsquo;s export in a frame.'],
  ['Check the build against the script', `SCRIPT_DOCX='…' node '${S}/script/check_copy.mjs'`,
   'Fails if any learner-facing block differs in wording, in either direction.'],
  ['Check no task gives itself away', `node '${S}/tools/obviousness.mjs'`,
   'Runs the naive search for every task and fails if the first thing a trainee would type ' +
   'hands over the answer.'],
  ['Rebuild this site', 'node tools/build_site.mjs',
   'What Vercel runs on every push. Collect and rename only — it never rebuilds a lesson, so ' +
   'a change has to be built and committed before it will appear here.'],
];

const ELSEWHERE = [
  ['Family Feud', '42Ronin/LAHSA &mdash; <code>Training Tools/Family Feud/</code>',
   'A game-shaped board for a room, with its own build, tests and README. On the ' +
   '<code>brand-square</code> and <code>…training-tools-subrepo</code> branches; not on that ' +
   'repo&rsquo;s <code>main</code>.'],
];

/* ------------------------------------------------------------------ */

const esc = s => String(s).replace(/&(?![a-z]+;|#\d+;)/gi, '&amp;').replace(/</g, '&lt;');
const kb = p => Math.round(statSync(p).size / 1024).toLocaleString();
const here = rel => existsSync(join(ROOT, rel));

function put(srcRel, destRel) {
  const dest = join(OUT, destRel);
  mkdirSync(dirname(dest), { recursive: true });
  copyFileSync(join(ROOT, srcRel), dest);
}

/* Two link modes off one manifest: the site's clean paths, and repo-relative
   paths for the copy opened straight off disk. */
function card(item, mode) {
  const zipRel = item.zipOnly ? item.src : item.zip;
  const pageHref = item.zipOnly ? null
    : mode === 'site' ? `/${item.slug}/` : encodeURI(item.src);
  const zipHref = !zipRel ? null
    : mode === 'site' ? `/${item.slug}/${zipRel.split('/').pop()}` : encodeURI(zipRel);

  const built = here(item.src) && (!item.zip || here(item.zip));
  const b = [`<li class="${built ? '' : 'gone'}">`];
  b.push(pageHref && built
    ? `<a class="name" href="${pageHref}">${item.name}</a>`
    : `<span class="name">${item.name}</span>`);
  if (item.what) b.push(`<p class="what">${item.what}</p>`);
  if (!built) b.push('<p class="how">Not built yet.</p>');
  if (zipHref && built) {
    b.push(`<p class="acts"><a class="zip" href="${zipHref}" download>Rise block` +
           `<span class="sz">${kb(join(ROOT, zipRel))} KB</span></a></p>`);
  }
  if (item.how) b.push(`<p class="how">Rebuild: <code>${esc(item.how)}</code></p>`);
  b.push('</li>');
  return b.join('');
}

const CSS = `
:root{--teal:#066888;--teal-dk:#044e66;--ink:#14222b;--mut:#5f7f8f;--line:#dbe8ef;
  --panel:#f2f8fb;--bg:#fbfdfe;--gold:#b99c00}
*{box-sizing:border-box}
html,body{margin:0;padding:0}
body{font:16px/1.6 "Segoe UI",-apple-system,BlinkMacSystemFont,Roboto,Helvetica,Arial,sans-serif;
  color:var(--ink);background:var(--bg);-webkit-font-smoothing:antialiased}
.wrap{max-width:1040px;margin:0 auto;padding:44px 24px 80px}
header{border-bottom:3px solid var(--teal);padding-bottom:20px}
h1{margin:0 0 6px;font-size:31px;letter-spacing:-.01em;color:var(--teal-dk)}
header p{margin:0;color:var(--mut);max-width:64ch}
h2{margin:40px 0 4px;font-size:13px;letter-spacing:.11em;text-transform:uppercase;color:var(--teal)}
p.blurb{margin:0 0 16px;color:var(--mut);font-size:14.5px;max-width:78ch}
ul{list-style:none;margin:0;padding:0;display:grid;gap:11px}
@media(min-width:760px){ul.two{grid-template-columns:1fr 1fr}}
li{background:#fff;border:1px solid var(--line);border-radius:12px;padding:15px 17px;
  box-shadow:0 1px 2px rgba(20,34,43,.04);display:flex;flex-direction:column}
li.gone{background:var(--panel);border-style:dashed;box-shadow:none}
a.name{font-weight:700;color:var(--teal);text-decoration:none;font-size:16.5px;
  text-underline-offset:3px}
a.name:hover{text-decoration:underline}
span.name{font-weight:700;color:var(--mut);font-size:16.5px}
.what{margin:4px 0 0;font-size:14.5px}
.acts{margin:auto 0 0;padding-top:12px}
a.zip{display:inline-flex;align-items:center;gap:9px;text-decoration:none;background:var(--teal);
  color:#fff;font-size:13.5px;font-weight:650;padding:7px 14px;border-radius:8px}
a.zip:hover{background:var(--teal-dk)}
a.zip .sz{font-weight:400;opacity:.75;font-size:12px}
.how{margin:9px 0 0;font-size:12.5px;color:var(--mut)}
code{font:13px/1.5 ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;background:var(--panel);
  border:1px solid var(--line);border-radius:5px;padding:1px 5px}
.cmd{display:block;margin:6px 0 0;padding:9px 12px;background:#0d2b38;color:#d7ecf4;
  border-radius:8px;border:0;overflow-x:auto;white-space:pre;font-size:12.5px}
.note{margin-top:44px;padding:16px 18px;border-left:4px solid var(--gold);background:#fffdf2;
  border-radius:0 10px 10px 0;font-size:14.5px;color:#4a4326}
footer{margin-top:46px;padding-top:16px;border-top:1px solid var(--line);color:var(--mut);
  font-size:13px}
`;

function page(mode) {
  const o = ['<!doctype html>', '<html lang="en">', '<head>', '<meta charset="utf-8">',
    '<meta name="viewport" content="width=device-width, initial-scale=1">',
    '<title>LAHSA training tools</title>',
    '<!-- GENERATED by tools/build_site.mjs. Do not hand-edit: run the script. -->',
    `<style>${CSS}</style>`, '</head>', '<body><div class="wrap">',
    '<header><h1>LAHSA training tools</h1>',
    '<p>Everything built for the HMIS Basic Navigation series — the tools that author it and ' +
    'the blocks that ship. Every page here is self-contained and fetches nothing.</p></header>'];

  for (const sec of MANIFEST) {
    o.push(`<h2>${sec.title}</h2>`);
    if (sec.blurb) o.push(`<p class="blurb">${sec.blurb}</p>`);
    o.push('<ul class="two">', ...sec.items.map(i => card(i, mode)), '</ul>');
  }

  o.push('<h2>Build and check</h2>',
         '<p class="blurb">Run from the repository root.</p><ul>');
  for (const [name, cmd, what] of COMMANDS) {
    o.push(`<li><span class="name">${name}</span>`);
    if (what) o.push(`<p class="what">${what}</p>`);
    o.push(`<code class="cmd">${esc(cmd)}</code></li>`);
  }
  o.push('</ul>');

  o.push('<h2>Elsewhere</h2>',
         '<p class="blurb">Built for LAHSA but living in the other repository, so not published ' +
         'here.</p><ul>');
  for (const [name, where, what] of ELSEWHERE) {
    o.push(`<li><span class="name">${name}</span><p class="what">${what}</p>` +
           `<p class="how">${where}</p></li>`);
  }
  o.push('</ul>');

  o.push('<div class="note"><b>Her drawing is duplicated.</b> The same geometry and the same ' +
    'expression library are copied into the lesson template, each knowledge-check staging and ' +
    'the Lashes builder — copied rather than imported, because each page has to stand alone ' +
    'with no network. Change her face and it has to change in all of them.</div>');

  o.push('<footer>Generated by <code>tools/build_site.mjs</code>. All client data in these ' +
    'lessons is fictional. Not affiliated with, endorsed by, or connected to Bitfocus, Inc.' +
    '</footer>', '</div></body></html>');
  return o.join('\n');
}

/* ---- build ---- */
rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });

let copied = 0;
const missing = [];
for (const sec of MANIFEST) {
  for (const it of sec.items) {
    if (!here(it.src)) { missing.push(it.src); continue; }
    if (it.zipOnly) {
      put(it.src, `${it.slug}/${it.src.split('/').pop()}`); copied++;
    } else {
      put(it.src, `${it.slug}/index.html`); copied++;
      if (it.zip && here(it.zip)) { put(it.zip, `${it.slug}/${it.zip.split('/').pop()}`); copied++; }
      else if (it.zip) missing.push(it.zip);
    }
  }
}
writeFileSync(join(OUT, 'index.html'), page('site'), 'utf8');
writeFileSync(join(ROOT, 'index.html'), page('local'), 'utf8');

console.log(`  public/         ${copied} files + index.html`);
console.log('  index.html      offline copy, repo-relative links');
if (missing.length) {
  console.log(`\n  NOT BUILT (${missing.length}) — the site links these as unavailable:`);
  for (const m of missing) console.log(`    ${m}`);
  console.log('  Build them and re-run, or push and the deploy will show them missing too.');
}
