/**
 * Tests for the knowledge-check maker.
 *   npm i playwright && node test.mjs
 *
 * Two halves, and the second is the one that matters. The first drives the editor.
 * The second authors a check, presses Export, catches the download, writes it out,
 * then opens *that file* and plays it — with a hard assertion that it makes no
 * network request. That is what makes "one self-contained file" a fact rather
 * than a claim, and it is the same discipline as tools/scene-editor.
 */
import { chromium } from 'playwright';
import { readFileSync, writeFileSync, mkdtempSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';

const MAKER = 'file://' + new URL('./kc-maker.html', import.meta.url).pathname;
const work = mkdtempSync(join(tmpdir(), 'kc-maker-'));
let pass = 0, fail = 0;
const ok = (n, c, extra = '') => {
  c ? (pass++, console.log('  PASS  ' + n))
    : (fail++, console.log('  FAIL  ' + n + (extra ? '  -> ' + extra : '')));
};

const b = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium' });
const p = await b.newPage({ viewport: { width: 1280, height: 900 } });
const errs = [];
p.on('pageerror', e => errs.push(String(e)));
p.on('console', m => { if (m.type() === 'error') errs.push('console: ' + m.text()); });
await p.goto(MAKER);
await p.evaluate(() => { try { localStorage.clear(); } catch (e) {} });
await p.reload();

console.log('\n— the editor —');

ok('it opens on one blank question with three answers',
   await p.$$eval('.qitem', e => e.length) === 1 &&
   await p.$$eval('.ans', e => e.length) === 3);
ok('...and refuses to export until it is filled in',
   await p.$eval('#expHTML', e => e.disabled) && await p.$eval('#expZIP', e => e.disabled));
ok('...saying what is missing rather than just going grey',
   (await p.textContent('#probs')).includes('no question written') &&
   (await p.textContent('#probs')).includes('no feedback written'));

/* Total questions is a field, and it must not quietly eat writing. */
await p.fill('#total', '4');
await p.dispatchEvent('#total', 'change');
ok('setting the total adds blank questions', await p.$$eval('.qitem', e => e.length) === 4);
await p.fill('#total', '2');
await p.dispatchEvent('#total', 'change');
ok('...and trims them back when they are empty', await p.$$eval('.qitem', e => e.length) === 2);

/* Answers are bounded at three and five. */
await p.click('.qitem[data-i="0"]');
ok('the remove button is off at the minimum',
   await p.$eval('.ans .kill', e => e.disabled));
for (let i = 0; i < 3; i++) await p.click('#addA');
ok('answers stop at five', await p.$$eval('.ans', e => e.length) === 5);
ok('...and the sixth is refused rather than accepted and dropped later',
   await p.$$eval('.ans', e => e.length) === 5);
await p.click('.ans[data-i="4"] .kill');
ok('an answer can be removed again', await p.$$eval('.ans', e => e.length) === 4);

/* Exactly one correct answer, always — it is a radio, not a checkbox. */
await p.click('.ans[data-i="2"] input[type=radio]');
ok('marking one correct clears the others',
   await p.$$eval('.ans.correct', e => e.length) === 1 &&
   await p.$eval('.ans[data-i="2"]', e => e.classList.contains('correct')));

/* Author a real two-question check. */
const QS = [
  { q: 'What does an empty result tell you?',
    a: ['Very little on its own', 'That they are new', 'That you should create a record'],
    ok: 0, fb: 'An empty result means your search has not found them yet.' },
  { q: 'Two records share a name. What next?',
    a: ['Compare a second identifier', 'Take the first one', 'Assume they are the same'],
    ok: 0, fb: 'A name on its own is never enough.' },
];
const fillQuestion = async (i, spec) => {
  await p.click(`.qitem[data-i="${i}"]`);
  while (await p.$$eval('.ans', e => e.length) > spec.a.length)
    await p.click(`.ans[data-i="${await p.$$eval('.ans', e => e.length) - 1}"] .kill`);
  while (await p.$$eval('.ans', e => e.length) < spec.a.length) await p.click('#addA');
  await p.fill('#qtext', spec.q);
  for (let j = 0; j < spec.a.length; j++) await p.fill(`.ans[data-i="${j}"] textarea`, spec.a[j]);
  await p.click(`.ans[data-i="${spec.ok}"] input[type=radio]`);
  await p.fill('#fbtext', spec.fb);
};
for (let i = 0; i < QS.length; i++) await fillQuestion(i, QS[i]);
await p.fill('#name', 'Lesson 4 Knowledge Check');

ok('a finished check reports itself ready', await p.$eval('#okline', e => !e.hidden));
ok('...and says what the pass mark works out to in whole questions',
   (await p.textContent('#okline')).includes('needs 2 of 2'),
   await p.textContent('#okline'));
await p.fill('#pass', '50');
ok('...recomputed when the pass mark changes',
   (await p.textContent('#okline')).includes('needs 1 of 2'),
   await p.textContent('#okline'));
await p.fill('#pass', '80');

/* The work must survive a refresh — an authoring tool that loses a morning's
   writing to a stray reload is not a tool. */
await p.reload();
ok('the work survives a reload', await p.$$eval('.qitem', e => e.length) === 2 &&
   await p.inputValue('#name') === 'Lesson 4 Knowledge Check');

console.log('\n— export —');

const grab = async (selector) => {
  const [dl] = await Promise.all([p.waitForEvent('download'), p.click(selector)]);
  const path = join(work, dl.suggestedFilename());
  await dl.saveAs(path);
  return { name: dl.suggestedFilename(), path };
};

const html = await grab('#expHTML');
ok('the name becomes the html filename', html.name === 'lesson-4-knowledge-check.html', html.name);
const zip = await grab('#expZIP');
ok('...and the zip filename', zip.name === 'lesson-4-knowledge-check.zip', zip.name);

/* Rise wants index.html inside the zip whatever the zip is called. */
const zbytes = readFileSync(zip.path);
const entry = zbytes.slice(30, 30 + zbytes.readUInt16LE(26)).toString('utf8');
ok('the file inside the zip is index.html, whatever the zip is called',
   zbytes.readUInt32LE(0) === 0x04034b50 && entry === 'index.html', entry);
const declared = zbytes.readUInt32LE(18);
const stored = zbytes.slice(30 + entry.length, 30 + entry.length + declared);
ok('...and it is the same bytes as the html export',
   stored.equals(readFileSync(html.path)), `${stored.length} vs ${readFileSync(html.path).length}`);
/* A zip a real unzipper will open, not just one our own reader round-trips. */
ok('...and the archive has a central directory and an end record',
   zbytes.includes(Buffer.from([0x50, 0x4b, 0x01, 0x02])) &&
   zbytes.includes(Buffer.from([0x50, 0x4b, 0x05, 0x06])));

console.log('\n— the exported page —');

const out = await b.newPage({ viewport: { width: 1000, height: 900 } });
const net = [];
out.on('request', r => { if (!r.url().startsWith('file://')) net.push(r.url()); });
const outErrs = [];
out.on('pageerror', e => outErrs.push(String(e)));
out.on('console', m => { if (m.type() === 'error') outErrs.push('console: ' + m.text()); });
await out.goto('file://' + html.path);
await out.waitForTimeout(1800);

ok('it carries the questions that were written', await out.evaluate(() =>
  KC.questions.map(q => q.q).join('|')) === QS.map(q => q.q).join('|'));
ok('...and the name became the page title and its heading',
   (await out.title()) === 'Lesson 4 Knowledge Check' &&
   (await out.textContent('.head h1')) === 'Lesson 4 Knowledge Check');
ok('...and the pass mark, as whole questions', await out.evaluate(() => NEED) === 2);
ok('the cards are dealt and go live', await out.evaluate(() =>
  document.querySelector('#hand').classList.contains('live') &&
  document.querySelectorAll('.card').length === 3));

await out.evaluate(() => [...document.querySelectorAll('.card')].find(c => c.dataset.ok === '1').click());
await out.waitForTimeout(1000);
ok('a correct pick is marked and the authored feedback is what comes back',
   (await out.textContent('#verdict')).includes('That is the one') &&
   (await out.textContent('#fb')).trim() === QS[0].fb);
await out.click('#next'); await out.waitForTimeout(1800);
await out.evaluate(() => [...document.querySelectorAll('.card')].find(c => c.dataset.ok === '1').click());
await out.waitForTimeout(1000);
await out.click('#next'); await out.waitForTimeout(900);
ok('clearing the mark finishes it', (await out.textContent('#score')).includes('2 of 2'),
   await out.textContent('#score'));

/* The claim the whole tool rests on. */
ok('the exported page fetches nothing at all', net.length === 0, net.join(', '));
ok('...and runs without throwing', outErrs.length === 0, outErrs.join(' | '));
ok('the maker itself ran clean too', errs.length === 0, errs.join(' | '));

await b.close();
console.log(`\n${pass} passed, ${fail} failed\n`);
process.exit(fail ? 1 : 0);
