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
import { readFileSync, writeFileSync, mkdtempSync, mkdirSync } from 'fs';
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

/* Feedback is per question, and switching it off must not lose the writing. */
console.log('\n— feedback, per question —');
await p.click('.qitem[data-i="0"]');
await p.uncheck('#fbon');
ok('switching feedback off disables the box rather than clearing it',
   await p.$eval('#fbtext', e => e.disabled) &&
   (await p.inputValue('#fbtext')) === QS[0].fb);
ok('...and it is no longer required to export',
   await p.$eval('#okline', e => !e.hidden));
await p.reload();
await p.click('.qitem[data-i="0"]');
ok('...and the switch survives a reload with the writing intact',
   !(await p.$eval('#fbon', e => e.checked)) && (await p.inputValue('#fbtext')) === QS[0].fb);
const offExport = await (async () => {
  const [dl] = await Promise.all([p.waitForEvent('download'), p.click('#expHTML')]);
  const dir = join(work, 'off'); mkdirSync(dir);
  const path = join(dir, dl.suggestedFilename()); await dl.saveAs(path); return path;
})();
{
  const out = await b.newPage();
  await out.goto('file://' + offExport);
  await out.waitForTimeout(1500);
  ok('...and that question ships with no feedback at all',
     await out.evaluate(() => KC.questions[0].fb) === '' &&
     await out.evaluate(() => KC.questions[1].fb) !== '');
  await out.evaluate(() => [...document.querySelectorAll('.card,.tcard')].find(c => c.dataset.ok === '1').click());
  await out.waitForTimeout(1300);
  ok('...showing no empty box where the paragraph would have been',
     await out.$eval('#fb', e => e.offsetParent === null || !e.textContent.trim()));
  ok('...and the learner can still go on', await out.$eval('#next', e => !e.hidden && e.offsetParent !== null));
  await out.close();
}
await p.check('#fbon');

console.log('\n— themes —');

const THEMES = await p.$$eval('#theme option', o => o.map(x => x.value));
ok('the themes on offer are the ones the build embedded',
   THEMES.join(',') === 'standard,teller,dealer', THEMES.join(','));
ok('...one page carried per theme, each with its own KC token to fill',
   await p.$$eval('script.page', e => e.length) === THEMES.length &&
   await p.$$eval('script.page', e => e.every(x => x.textContent.trim().length > 1000)));
ok('it opens on the standard one', await p.inputValue('#theme') === 'standard');

/* The preview is the only place the selector shows its work. */
await p.click('#preview');
ok('preview opens the page it would export', await p.$eval('#prevwrap', e => !e.hidden));
const inFrame = async (sel) => {
  const f = await (await p.$('#prevframe')).contentFrame();
  return await f.$$eval(sel, e => e.length);
};
await p.waitForTimeout(1500);
ok('...and it is the standard staging', await inFrame('.head h1') === 1 && await inFrame('#hand') === 1);
await p.selectOption('#theme', 'teller');
await p.waitForTimeout(1800);
ok('changing the theme re-renders an open preview rather than leaving it stale',
   await inFrame('#orb') === 1 && await inFrame('.head h1') === 0);
await p.keyboard.press('Escape');
ok('...and Escape closes it', await p.$eval('#prevwrap', e => e.hidden));
ok('...and stops the page running behind the editor',
   await p.$eval('#prevframe', e => e.getAttribute('srcdoc') === ''));

/* The work must survive a refresh — an authoring tool that loses a morning's
   writing to a stray reload is not a tool. */
await p.reload();
ok('the work survives a reload', await p.$$eval('.qitem', e => e.length) === 2 &&
   await p.inputValue('#name') === 'Lesson 4 Knowledge Check');
ok('...and so does the theme', await p.inputValue('#theme') === 'teller');
await p.selectOption('#theme', 'standard');

console.log('\n— export —');

/* Saved under a per-grab folder: every export is called the same thing — that is
   the point of the Name field — so a shared directory means the second silently
   overwrites the first, and a comparison between them then compares a file with
   itself. That is exactly how a broken theme selector would have passed. */
let grabs = 0;
const grab = async (selector) => {
  const dir = join(work, 'g' + (++grabs));
  mkdirSync(dir);
  const [dl] = await Promise.all([p.waitForEvent('download'), p.click(selector)]);
  const path = join(dir, dl.suggestedFilename());
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

/* Played for EVERY theme, not just the one that shipped first. A staging is only
   a staging if the authored questions, the feedback and the gate all come out the
   same; the selectors differ because the page is genuinely a different one. */
const STAGINGS = {
  standard: { card:'.card', hand:'#hand', tally:'#score', titled:true, verdict:true },
  /* No verdict line on a reading in either of these, by decision — the marked
     cards already say which way it went. */
  teller:   { card:'.tcard', hand:'#spread', tally:'#count', titled:false, verdict:false },
  dealer:   { card:'.tcard', hand:'#spread', tally:'#count', titled:false, verdict:false },
};

/* In a FRAME, not as a top-level page. These pages only speak when they are
   embedded — `window.parent === window` means nothing is ever posted — so playing
   the export directly would assert the gate and quietly skip the contract that
   makes Rise mark the block done. */
async function playExport(theme, file) {
  const S = STAGINGS[theme];
  const host = join(file.replace(/[^/]+$/, ''), 'host.html');
  writeFileSync(host,
    '<!doctype html><meta charset="utf-8"><title>host</title>' +
    '<script>window.SEEN=[];addEventListener("message",function(e){' +
    'try{SEEN.push(JSON.stringify(e.data))}catch(x){}});<\/script>' +
    '<iframe id="f" src="./' + file.replace(/^.*\//, '') + '" ' +
    'style="width:1000px;height:880px;border:0"></iframe>');

  const out = await b.newPage({ viewport: { width: 1040, height: 900 } });
  const net = [];
  out.on('request', r => { if (!r.url().startsWith('file://')) net.push(r.url()); });
  const outErrs = [];
  out.on('pageerror', e => outErrs.push(String(e)));
  out.on('console', m => { if (m.type() === 'error') outErrs.push('console: ' + m.text()); });
  await out.goto('file://' + host);
  const frame = out.frames().find(f => f !== out.mainFrame()) ||
                await (await out.$('#f')).contentFrame();
  await out.waitForTimeout(1900);
  const msgs = () => out.evaluate(() => window.SEEN);

  console.log(`  [${theme}]`);
  ok('it carries the questions that were written', await frame.evaluate(() =>
    KC.questions.map(q => q.q).join('|')) === QS.map(q => q.q).join('|'));
  ok('...and the name became the page title',
     (await frame.title()) === 'Lesson 4 Knowledge Check', await frame.title());
  if (S.titled) ok('...and its heading',
     (await frame.textContent('.head h1')) === 'Lesson 4 Knowledge Check');
  ok('...and the pass mark, as whole questions', await frame.evaluate(() => NEED) === 2);
  ok('the cards are dealt and go live', await frame.evaluate(s =>
    document.querySelector(s.hand).classList.contains('live') &&
    document.querySelectorAll(s.card).length === 3, S));

  await frame.evaluate(s => [...document.querySelectorAll(s.card)].find(c => c.dataset.ok === '1').click(), S);
  await out.waitForTimeout(1200);
  ok('a correct pick is marked and the authored feedback is what comes back',
     (S.verdict ? (await frame.textContent('#verdict')).includes('That is the one')
                : await frame.$eval('#verdict', e => e.hidden)) &&
     (await frame.textContent('#fb')).trim() === QS[0].fb);
  await frame.click('#next'); await out.waitForTimeout(2000);
  await frame.evaluate(s => [...document.querySelectorAll(s.card)].find(c => c.dataset.ok === '1').click(), S);
  await out.waitForTimeout(1200);
  await frame.click('#next'); await out.waitForTimeout(1200);
  ok('clearing the mark finishes it', (await frame.textContent(S.tally)).includes('2 of 2'),
     await frame.textContent(S.tally));
  const sent = await msgs();
  ok('...and that is when completion is reported',
     sent.some(m => m.includes('"complete"')), sent.join(' ; '));
  ok('...carrying no score, in any staging',
     !sent.some(m => /score|percent|correct|points/i.test(m)), sent.join(' ; '));

  /* The claim the whole tool rests on. */
  ok('the exported page fetches nothing at all', net.length === 0, net.join(', '));
  ok('...and runs without throwing', outErrs.length === 0, outErrs.join(' | '));
  await out.close();
}

await playExport('standard', html.path);

/* Export the same authored check again under the other theme. */
await p.selectOption('#theme', 'teller');
const tellerHTML = await grab('#expHTML');
ok('the filename does not change with the theme — the name does that',
   tellerHTML.name === 'lesson-4-knowledge-check.html', tellerHTML.name);
ok('...but the page does',
   readFileSync(tellerHTML.path, 'utf8') !== readFileSync(html.path, 'utf8'));
await playExport('teller', tellerHTML.path);

await p.selectOption('#theme', 'dealer');
const dealerHTML = await grab('#expHTML');
ok('...and again for the third staging',
   readFileSync(dealerHTML.path, 'utf8') !== readFileSync(tellerHTML.path, 'utf8'));
await playExport('dealer', dealerHTML.path);

ok('the maker itself ran clean too', errs.length === 0, errs.join(' | '));

await b.close();
console.log(`\n${pass} passed, ${fail} failed\n`);
process.exit(fail ? 1 : 0);
