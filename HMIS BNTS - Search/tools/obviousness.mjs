/**
 * Is the answer too obvious?
 *
 *   node tools/obviousness.mjs            # every built section
 *   node tools/obviousness.mjs 7          # one section
 *
 * The rule the whole lesson rests on: a task must not be solved by the first
 * thing a trainee would type. test.mjs checks that for the one naive search each
 * task documents. This checks it much more widely — for every task it types the
 * things a learner reaches for without thinking:
 *
 *   the first three letters of the first name, and of the surname
 *   the first name alone, the surname alone, both together
 *   the year of birth, and the last four of the SSN
 *
 * and reports any that land on exactly one record. Landing on one is not always
 * wrong: several tasks are *about* a fragment resolving, and the taught route is
 * supposed to work. So each is judged against what the task teaches, and only the
 * ones that hand over the answer before the learner has done the thinking are
 * flagged.
 */
import { chromium } from 'playwright';
import { readdirSync } from 'fs';

const DIST = new URL('../dist/', import.meta.url);
const want = process.argv.slice(2).map(Number);
const sections = readdirSync(DIST)
  .map(f => /^section-(\d+)\.html$/.exec(f))
  .filter(Boolean)
  .map(m => Number(m[1]))
  .filter(n => !want.length || want.includes(n))
  .sort((a, b) => a - b);

if (!sections.length) {
  console.error('no section builds found — run ./build.sh first');
  process.exit(1);
}

/* Searches that are allowed to land on one record, and why. Two kinds qualify:
   the technique the task exists to teach, and anything the learner is never told
   — the answer's real name, when the participant gave them something else. */
const TAUGHT = {
  // he says "Lefty Torres"; the surname fragment is the technique, and Michael
  // is a name he never offers
  nickname:  ['tor', 'torres', 'michael', 'michael torres', '8802'],
  // she says "Kate", born 1985. Katherine Morrison is what the record says.
  year:      ['katherine', 'morrison', 'katherine morrison', '3145'],
  // she says "Danielle" and 7742; the surname is what she cannot vouch for
  last4:     ['whitmore', 'danielle whitmore', '7742'],
  // spelling it at all is the technique
  fragments: ['krz', 'woj', 'krzysztof', 'wojciechowski', 'krz woj',
              'krzysztof wojciechowski', '6053'],
  // she gives Garcia and Esperanza; both together is the narrowing being taught
  narrow:    ['esperanza garcia', '1180'],
  // swapping the date for the SSN fragment is the technique
  swap:      ['5518'],
  // she says "Cathleen"; Kathleen is the alternate spelling the task is about
  spelling:  ['kathleen', 'kathleen brennan', 'brennan', 'bre', '2076'],
  // she is asked for as "Maria de la Cruz"; Delacruz is the discovery
  surname:   ['dela', 'delacruz', 'maria delacruz', '5527'],
  // he gives the SSN fragment himself, and using it is the technique
  samename:  ['4471'],
  household: [],
  location:  [],
  // he says "Smoke"; Elias is on the record and nowhere in the conversation
  smoke:     ['eli', 'elias', 'elias reyez'],
  several:   ['1173'],
};

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
let flagged = 0, checked = 0;

for (const sec of sections) {
  const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
  await page.goto(new URL(`section-${sec}.html`, DIST).href);

  const rows = await page.evaluate(() => TASKS.map(t => {
    const c = CLIENTS.find(x => x.i === t.expect.id);
    const probes = [];
    const add = (why, q) => { if (q && q.trim()) probes.push({ why, q: q.trim() }); };
    add('first 3 of first name', c.f.slice(0, 3));
    add('first 3 of surname', c.l.slice(0, 3));
    add('first name', c.f);
    add('surname', c.l);
    add('full name', c.f + ' ' + c.l);
    add('year of birth', c.d.slice(0, 4));
    if (c.s && /^\d/.test(c.s.replace(/-/g, '').slice(-4))) add('last four of SSN', c.s.slice(-4));
    return {
      id: t.id, title: t.title, answer: c.f + ' ' + c.l,
      probes: probes.map(p => ({ ...p, n: search(p.q, []).rows.length })),
    };
  }));

  console.log(`\n— Section ${sec} — ${rows.length} tasks —`);
  for (const t of rows) {
    const allowed = new Set((TAUGHT[t.id] || []).map(s => s.toLowerCase()));
    const bad = t.probes.filter(p => p.n === 1 && !allowed.has(p.q.toLowerCase()));
    checked += t.probes.length;
    const worst = Math.min(...t.probes.filter(p => p.n > 0).map(p => p.n));
    console.log(`  ${bad.length ? 'TOO OBVIOUS' : '  ok       '}  ${t.title}`);
    console.log(`               answer ${t.answer} · narrowest honest search returns ${worst}`);
    for (const p of t.probes) {
      const mark = p.n === 1 ? (allowed.has(p.q.toLowerCase()) ? 'taught' : 'GIVES IT AWAY') : '';
      console.log(`               ${String(p.n).padStart(3)}  "${p.q}"  (${p.why}) ${mark}`);
    }
    flagged += bad.length;
  }
  await page.close();
}

await browser.close();
console.log(`\n${checked} searches checked, ${flagged} hand the answer over.`);
process.exit(flagged ? 1 : 0);
