/**
 * Assert the simulation says what the script says.
 *
 *   SCRIPT_DOCX=<path to the script .docx> node script/check_copy.mjs
 *
 * The script is the authority on learner-facing copy — "change the script first,
 * then the build". This reads every [SIMULATOR-n.…] block out of the script, reads
 * the same blocks out of the BUILT pages, and fails if any pair differs once
 * markup and typographic niceties are set aside.
 *
 * It catches drift in both directions: a hand-edit to the template that never made
 * it back to the script, and a script revision that was never carried into the
 * build. Run it after either changes.
 *
 * Comparison ignores markup, curly quotes, dash style and non-breaking spaces,
 * because those are the template's business. It does NOT ignore wording.
 */
import { readFileSync, existsSync } from 'fs';
import { execFileSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const HERE = dirname(fileURLToPath(import.meta.url));
const DOCX = process.env.SCRIPT_DOCX;
if (!DOCX || !existsSync(DOCX)) {
  console.error('set SCRIPT_DOCX to the script .docx');
  process.exit(2);
}

/* The script's blocks, via python-docx — the same reader the sync uses. */
const py = `
import re, json, sys, docx
out = {}
for p in docx.Document(sys.argv[1]).paragraphs:
    m = re.match(r"^\\[(SIMULATOR-\\d+[^\\]]*?)\\]\\s*\\[(.*)\\]\\s*$", p.text.strip(), re.S)
    if not m: continue
    ref = m.group(1).split(" \\u2014")[0].strip()
    body = re.split(r"\\]\\s*\\[Button:", m.group(2).strip())[0].strip()
    out[ref] = " ".join(body.split())
print(json.dumps(out))
`;
const want = JSON.parse(execFileSync('python3', ['-c', py, DOCX], { encoding: 'utf8' }));

/* The built pages, via the extractor's own output. */
execFileSync('node', [join(HERE, 'extract_copy.mjs')], { stdio: 'ignore' });
const data = JSON.parse(readFileSync(join(HERE, 'copy.json'), 'utf8'));

const SIM = { 7: 'SIMULATOR-1', 10: 'SIMULATOR-2' };
const strip = h => (h || '').replace(/<\/p>\s*<p[^>]*>/g, ' ').replace(/<[^>]+>/g, '');
const got = {};
for (const s of data.sections) {
  const tag = SIM[s.section];
  if (!tag) continue;
  s.orientation.forEach(b => { got[`${tag}.INTRO.${String(b.n).padStart(2, '0')}`] = strip(b.html); });
  for (const t of s.tasks) {
    got[`${tag}.TASK.${t.n}.SITUATION`] = strip(t.situation);
    got[`${tag}.TASK.${t.n}.INSTRUCTION`] = strip(t.instruction);
    got[`${tag}.TASK.${t.n}.HINT`] = strip(t.hint);
    got[`${tag}.TASK.${t.n}.FEEDBACK`] = strip(t.feedback);
    t.wrong.forEach((w, i) => { got[`${tag}.TASK.${t.n}.WRONG.${i + 1}`] = strip(w.text); });
  }
  got[`${tag}.DONE`] = strip(s.closing);
  if (s.interstitial) got[`${tag}.INTERSTITIAL`] = strip(s.interstitial.html);
}

const norm = s => (s || '')
  .normalize('NFKD')
  .replace(/[‘’]/g, "'").replace(/[“”]/g, '"')
  .replace(/[—–]/g, '-').replace(/ /g, ' ')
  .replace(/\s+/g, ' ').trim().toLowerCase();

let same = 0;
const bad = [];
for (const ref of new Set([...Object.keys(want), ...Object.keys(got)])) {
  const a = want[ref], b = got[ref];
  if (a === undefined) { bad.push([ref, 'in the build, not in the script', '', b]); continue; }
  if (b === undefined) { bad.push([ref, 'in the script, not in the build', a, '']); continue; }
  if (norm(a) === norm(b)) { same++; continue; }
  bad.push([ref, 'wording differs', a, b]);
}

console.log(`\n  ${same} blocks match the script`);
if (!bad.length) {
  console.log('  0 differences\n');
  process.exit(0);
}
console.log(`  ${bad.length} to reconcile\n`);
for (const [ref, why, a, b] of bad) {
  console.log(`  ${ref}  —  ${why}`);
  if (a) console.log(`     script: ${a.slice(0, 150)}`);
  if (b) console.log(`     build : ${b.slice(0, 150)}`);
}
console.log('');
process.exit(1);
