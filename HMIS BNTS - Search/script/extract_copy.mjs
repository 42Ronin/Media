/**
 * Pull every piece of LEARNER-FACING text out of the built tools.
 *
 *   node script/extract_copy.mjs      ->  script/copy.json
 *
 * Sections 7, 10 and 11 plus the four step embeds. What comes out is the coaching
 * layer only: orientation, tasks, hints, feedback, the guided steps and the closing
 * screens. The simulated product's own chrome — menu items, column headings, field
 * labels, the empty state — is Clarity's wording, not ours, and is deliberately left
 * out.
 *
 * Read from the BUILT pages rather than the template, so what is transcribed is what
 * a learner actually meets. `script/make_copy_doc.py` renders the result.
 */
import { chromium } from 'playwright';
import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const HERE = dirname(fileURLToPath(import.meta.url));
const DIST = join(HERE, '..', 'dist');
const SECTIONS = [7, 10, 11];
const STEP_FILES = ['step-11-1', 'step-11-2', 'step-11-3', 'step-11-4'];

const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const p = await b.newPage();

/* ---- the structured copy, read out of each section in turn ---- */
const sections = [];
for (const n of SECTIONS) {
  await p.goto('file://' + join(DIST, `section-${n}.html`));
  sections.push(await p.evaluate((n) => {
    const clients = {};
    CLIENTS.forEach(c => { clients[c.i] = c.f + ' ' + c.l; });
    /* the tour writes this in at run time; the learner never sees the token */
    const fill = s => String(s || '').replace(/\{\{COUNT_LOWER\}\}/g,
      NUMBER_WORDS[TASKS.filter(t => !t.note).length].toLowerCase());
    const beats = list => (list || []).map((x, i) => ({
      n: i + 1, html: fill(x.html), next: x.next || null
    }));
    return {
      section: n,
      title: SECTION_TITLE,
      scenarioTitle: (typeof SCENARIO_META !== 'undefined' && SCENARIO_META[n])
        ? SCENARIO_META[n].title : null,
      scenarioSteps: (typeof SCENARIO_META !== 'undefined' && SCENARIO_META[n])
        ? SCENARIO_META[n].steps : [],
      orientation: beats(typeof TOURS !== 'undefined' ? TOURS[n] : null),
      scenarioOpen: beats(typeof SCENARIOS !== 'undefined' ? SCENARIOS[n] : null),
      scenarioClose: beats(typeof SCENARIO_CLOSE !== 'undefined' ? SCENARIO_CLOSE[n] : null),
      interstitial: (typeof INTERSTITIALS_ALL !== 'undefined' && INTERSTITIALS_ALL[n])
        ? { title: INTERSTITIALS_ALL[n].title, html: fill(INTERSTITIALS_ALL[n].html) } : null,
      closing: (typeof CLOSING !== 'undefined' && CLOSING[n]) ? fill(CLOSING[n]) : null,
      tasks: TASKS.filter(t => t.sec === n).map((t, i) => ({
        n: i + 1, id: t.id, title: t.title, note: !!t.note,
        situation: t.brief || '', instruction: t.ask || '',
        hint: t.hint || '', feedback: t.teach || '',
        answer: t.expect && t.expect.id
          ? { id: t.expect.id, name: clients[t.expect.id] || null } : null,
        wrong: Object.keys(t.wrong || {}).map(id => ({
          id, name: clients[id] || null, text: t.wrong[id]
        }))
      }))
    };
  }, n));
}

/* ---- the guided steps: one embed per slide, each with its own gate ---- */
await p.goto('file://' + join(DIST, 'step-11-1.html'));
const stepData = await p.evaluate(() => STEPS);
const steps = STEP_FILES.map(f => {
  const key = f.replace('step-', '').replace(/-/g, '.');
  const meta = stepData[key] || { phases: [] };
  return {
    key, file: f + '.html',
    phases: (meta.phases || []).map((ph, i) => ({
      n: i + 1, does: ph.does || '', happens: ph.html || ''
    }))
  };
});
await b.close();

/* ---- the strings written inline rather than into a table ----
   `say(kind, title, body)` is the feedback bubble. The call sites are scanned out
   of the template rather than retyped here, so this file cannot quietly drift from
   what the lesson says. Concatenated literals are joined; anything that is not a
   literal (a task's own feedback, a lookup) is dropped, because it is transcribed
   from the tasks above already. */
const src = readFileSync(join(HERE, '..', 'src', 'lesson1.template.html'), 'utf8');

function literalsIn(js) {
  const out = [];
  const re = /"((?:[^"\\]|\\.)*)"|'((?:[^'\\]|\\.)*)'/g;
  let m;
  while ((m = re.exec(js))) out.push(JSON.parse('"' + (m[1] ?? m[2]).replace(/"/g, '\\"') + '"'));
  return out.join('');
}
function callsTo(name) {
  const found = [];
  let at = 0;
  for (;;) {
    const i = src.indexOf(name + '(', at);
    if (i < 0) break;
    let depth = 0, j = i + name.length, args = [], cur = '', inStr = null;
    for (; j < src.length; j++) {
      const ch = src[j];
      if (inStr) { if (ch === '\\') { cur += ch + src[++j]; continue; } if (ch === inStr) inStr = null; cur += ch; continue; }
      if (ch === '"' || ch === "'") { inStr = ch; cur += ch; continue; }
      if (ch === '(') { depth++; if (depth === 1) continue; }
      if (ch === ')') { depth--; if (!depth) { args.push(cur); break; } }
      if (ch === ',' && depth === 1) { args.push(cur); cur = ''; continue; }
      cur += ch;
    }
    found.push(args.map(a => a.trim()));
    at = j;
  }
  return found;
}

const KIND = { good: 'Correct', bad: 'Incorrect', tip: 'Prompt' };
const feedback = callsTo('say')
  .filter(a => a.length >= 3 && /^"(good|bad|tip)"$/.test(a[0]))
  .map(a => ({
    kind: KIND[a[0].slice(1, -1)],
    title: literalsIn(a[1]),
    body: literalsIn(a[2])
  }))
  .filter(f => f.body);

/* The done screen's standing paragraph, which sits under whichever closing the
   section carries. It is written as joined literals, so the literals are what is
   read rather than the source between them. */
const habitSrc = (src.match(/The habit underneath all of it<\/b><br>'\+([\s\S]*?);\n/) || [])[1] || '';
const habit = literalsIn(habitSrc).replace(/<\/?div[^>]*>/g, '').trim();

/* The training panel is ours, not Clarity's, so its own words are learner-facing
   copy too — the hover that explains the two controls, and the two buttons. */
const hover = ((src.match(/id="cwTip" role="tooltip">([\s\S]*?)<\/span>/) || [])[1] || '')
  .replace(/\s+/g, ' ').trim();

writeFileSync(join(HERE, 'copy.json'), JSON.stringify({
  sections, steps, feedback,
  panel: {
    hint: (src.match(/id="hintBtn">([^<]+)</) || [])[1] || '',
    next: (src.match(/id="nextBtn"[^>]*>([^<]+)</) || [])[1] || '',
    hover: hover,
    habit: habit
  }
}, null, 2));

console.log('sections:', sections.map(s => `${s.section} (${s.tasks.length} tasks, ` +
  `${s.orientation.length + s.scenarioOpen.length + s.scenarioClose.length} beats)`).join(', '));
console.log('steps:', steps.map(s => `${s.key}:${s.phases.length}`).join(' '),
            '| shared feedback:', feedback.length);
