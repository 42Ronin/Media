/**
 * Browser tests for Lesson 1: Finding a Client.
 *   npm i playwright && node test.mjs
 */
import { chromium } from 'playwright';

const FILE = 'file://' + new URL('./dist/lesson1-client-search.html', import.meta.url).pathname;
let pass = 0, fail = 0;
const ok = (n, c, extra = '') => {
  c ? (pass++, console.log('  PASS  ' + n))
    : (fail++, console.log('  FAIL  ' + n + (extra ? '  -> ' + extra : '')));
};

const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const p = await b.newPage({ viewport: { width: 1500, height: 950 } });
const errs = [];
p.on('pageerror', e => errs.push(String(e)));
p.on('console', m => { if (m.type() === 'error') errs.push('console: ' + m.text()); });
await p.goto(FILE);

// type into the search bar and wait out the debounce — never press Enter
const type = async (q) => { await p.fill('#q', q); await p.waitForTimeout(330); };
// strip the inline pronouns span so assertions compare on the name itself
const names = () => p.$$eval('#tb tr[data-row] .cname', els => els.map(e => e.textContent.replace(/\s*\(.*?\)\s*$/, '').trim()));
const zero = () => p.$eval('#zero', e => e.hidden ? '' : e.textContent.trim());
const closeAll = () => p.keyboard.press('Escape');

console.log('\n— initial state —');
ok('nothing is shown before the first search', (await names()).length === 0);
ok('no results table on load', await p.$eval('#pager', e => e.hidden));
ok('no recently-accessed hint on load', await p.$eval('#hintRow', e => e.hidden));

console.log('\n— partial / mixed-fragment search —');
const q = (s) => p.evaluate(x => search(x, []).rows.map(c => c.l + ', ' + c.f), s);
ok('"mi tor" (2 + 3 letters) finds Michael Torres', (await q('mi tor')).includes('Torres, Michael'));
ok('"mi t" (2 + 1) finds Michael Torres', (await q('mi t')).includes('Torres, Michael'));
ok('"m t" (1 + 1) finds Michael Torres', (await q('m t')).includes('Torres, Michael'));
ok('"m to" (1 + 2) finds Michael Torres', (await q('m to')).includes('Torres, Michael'));
ok('fragments may match either name in any order',
   (await q('tor mi')).includes('Torres, Michael'));
ok('a single letter is allowed (no minimum length)', (await q('t')).length > 0);

console.log('\n— partial dates —');
ok('4-digit year 1977 works', await p.evaluate(() => search('1977', []).rows.every(c => c.d.slice(0,4) === '1977')));
ok('2-digit year 77 finds the same people', await p.evaluate(() =>
   search('77', []).rows.filter(c => c.d.slice(0,4) === '1977').length === search('1977', []).rows.length));
ok('month/day fragment 12/05 finds both Dec-5 clients',
   (await q('12/05')).includes('Whitfield, Andre') && (await q('12/05')).includes('Underwood, Jamal'));
ok('short form 3/14/79 finds Michael Torres', (await q('3/14/79')).includes('Torres, Michael'));
ok('full form 03/14/1979 finds him too', (await q('03/14/1979')).includes('Torres, Michael'));
ok('dots and dashes work as separators',
   (await q('3.14.79')).includes('Torres, Michael') && (await q('3-14-79')).includes('Torres, Michael'));

console.log('\n— partial SSN —');
ok('last 4 "4471" finds the 1968 James Wilson',
   (await q('4471')).includes('Wilson, James') &&
   await p.evaluate(() => search('4471', []).rows.some(c => c.d === '1968-09-02')));
ok('leading fragment "941" also finds him',
   await p.evaluate(() => search('941', []).rows.some(c => c.i === '3DF1DF674')));
ok('middle fragment "33" matches inside the SSN',
   await p.evaluate(() => search('33', []).rows.some(c => c.i === '3DF1DF674')));
ok('name + SSN fragment combine', (await q('wilson 4471')).length === 1, JSON.stringify(await q('wilson 4471')));

console.log('\n— live search (no Enter key pressed) —');
await type('Mike');
ok('nickname "Mike" returns nothing — the trap holds', (await names()).length === 0);
ok('empty state is plain: No clients found', (await zero()) === 'No clients found');
ok('the coach drawer raises the real lesson instead',
   (await p.textContent('#fb')).includes('not proof'));

await type('Tor');
ok('3-letter surname fragment finds Michael Torres',
   (await names()).includes('Torres, Michael'), JSON.stringify(await names()));

await type('1985');
ok('bare year finds Katherine Morrison', (await names()).includes('Morrison, Katherine'));
ok('year search returns only 1985 births',
   await p.evaluate(() => S.rows.every(c => c.d.slice(0, 4) === '1985')));

for (const d of ['12/05/1990', '12.05.1990', '12-05-1990']) {
  await type(d);
  const n = await names();
  ok(`date format ${d} returns the same 2 people`,
     n.length === 2 && n.includes('Whitfield, Andre') && n.includes('Underwood, Jamal'), JSON.stringify(n));
}
await type('13/45/1990');
ok('an impossible date simply matches nobody', (await zero()) === 'No clients found');

await type('Cruz');
ok('surname token "Cruz" finds Maria de la Cruz',
   (await names()).includes('de la Cruz, Maria'), JSON.stringify(await names()));

const multi = await p.evaluate(() => search('mar del', []).rows.map(c => c.l + ', ' + c.f));
ok('two fragments match across first AND last name', multi.includes('Delgado, Marcus'), JSON.stringify(multi));

console.log('\n— scenario data integrity (guards) —');
const uniq = await p.evaluate(() => {
  const grab = q => search(q, []).rows.map(c => c.i);
  return {
    torres: grab('Tor'),
    kate: grab('1985').filter(i => CLIENTS.find(c => c.i === i).f === 'Katherine'),
    dec5: grab('12/05/1990'), wilson: grab('Wilson'), beckett: grab('Beckett'),
    delgado: grab('Delgado'), naka: grab('Nakashima'), cruz: grab('Cruz')
  };
});
ok('exactly one Torres reachable by "Tor"', uniq.torres.length === 1, JSON.stringify(uniq.torres));
ok('exactly one Katherine born 1985', uniq.kate.length === 1);
ok('exactly two people born 12/05/1990', uniq.dec5.length === 2);
ok('exactly two James Wilsons', uniq.wilson.length === 2);
ok('exactly two Becketts', uniq.beckett.length === 2);
ok('exactly three Delgados', uniq.delgado.length === 3);
ok('exactly two Nakashimas', uniq.naka.length === 2);
ok('exactly one Cruz', uniq.cruz.length === 1);
ok('every SSN is in the never-issued 900-999 range',
   await p.evaluate(() => CLIENTS.every(c => !c.s || /^9\d\d-\d\d-\d{4}$/.test(c.s))));
ok('roster is 300 clients', await p.evaluate(() => CLIENTS.length) === 300);
ok('SSN data-quality codes present (refused records exist)',
   await p.evaluate(() => CLIENTS.filter(c => c.q === 'refused').length) > 5);

console.log('\n— default column order —');
const hdr = await p.$$eval('#thr th', ts => ts.map(t => t.textContent.replace(/[↑↓]/g,'').trim()).filter(Boolean));
ok('default column order is Client, DOB, SSN, ROI',
   JSON.stringify(hdr) === JSON.stringify(['Client','DOB','SSN','ROI']), JSON.stringify(hdr));

console.log('\n— ROI + SSN columns —');
await type('Delgado');
ok('recently-accessed hint disappears once a search is active',
   await p.$eval('#hintRow', e => getComputedStyle(e).display === 'none'));
ok('client ID renders on its own line under the name',
   await p.$eval('#tb .cid', e => getComputedStyle(e).display === 'block'));
const roi = await p.$$eval('#tb tr[data-row]', rs => rs.map(r => ({
  name: r.querySelector('.cname').textContent.trim(),
  roi: r.querySelector('.roi') ? r.querySelector('.roi').textContent.trim() : null
})));
ok('three Delgados, exactly one ROI Missing',
   roi.length === 3 && roi.filter(r => r.roi === 'Missing').length === 1, JSON.stringify(roi));

await type('Nakashima');
// locate the SSN cell by header position so column reordering can't break this
const nk = await p.evaluate(() => {
  const hdrs = [...document.querySelectorAll('#thr th')].map(t => t.textContent.replace(/[↑↓]/g,'').trim());
  const col = hdrs.indexOf('SSN');
  return [...document.querySelectorAll('#tb tr[data-row]')].map(r => r.children[col].textContent.trim());
});
ok('one Nakashima shows (No value) for SSN', nk.some(t => t.includes('No value')), JSON.stringify(nk));

console.log('\n— recents, pagination, sorting —');
await type('Torres');
await p.click('#tb tr[data-row]'); await p.waitForTimeout(150);
await p.keyboard.press('Escape');
await type('');
ok('an opened client lands in recently accessed', (await names()).includes('Torres, Michael'));
ok('the recently-accessed hint appears once there are recents',
   !(await p.$eval('#hintRow', e => e.hidden)));

// ask the page's own engine which 3-letter prefix returns the most rows
const prefix = await p.evaluate(() => {
  const seen = new Set(); let best = null;
  CLIENTS.forEach(c => {
    const k = c.l.slice(0, 3).toLowerCase();
    if (seen.has(k)) return;
    seen.add(k);
    const n = search(k, []).rows.length;
    if (!best || n > best[1]) best = [k, n];
  });
  return best;
});
await type(prefix[0]);
const cnt = await p.textContent('#resultCount');
ok(`pagination caps at 10 rows ("${prefix[0]}" -> ${prefix[1]} matches)`,
   (await names()).length <= 10 && cnt.includes('of ' + prefix[1]), cnt);
if (prefix[1] > 10) {
  await p.click('#nextBtn2'); await p.waitForTimeout(100);
  ok('next page advances', (await p.textContent('#resultCount')).trim().startsWith('11'));
}

await type('1990');
const before = (await names())[0];
await p.click('#thr th[data-sort="dob"]'); await p.waitForTimeout(100);
ok('clicking a column header sorts',
   (await names())[0] !== before || (await p.textContent('#thr')).includes('↑'));

console.log('\n— filter chips —');
await type('');
await p.click('#filterBtn'); await p.waitForTimeout(150);
const ff = await p.$$eval('#filterPop [data-ff]', bs => bs.map(x => x.textContent.trim()));
ok('filter menu offers exactly First Name, Last Name, Alias',
   JSON.stringify(ff) === JSON.stringify(['First Name', 'Last Name', 'Alias']), JSON.stringify(ff));
await p.click('#filterPop [data-ff="last"]'); await p.waitForTimeout(200);
ok('choosing a field creates a chip', (await p.textContent('#chips')).includes('Last Name'));
await p.fill('#chipVal', 'Delgado');
await p.click('#chipGo'); await p.waitForTimeout(250);
ok('chip value narrows the results', (await names()).length === 3, JSON.stringify(await names()));
ok('chip displays its applied value', (await p.textContent('#chips')).includes('Delgado'));
await p.click('#chips [data-chipdel="0"]'); await p.waitForTimeout(250);
ok('removing the chip clears the search', await p.evaluate(() => S.rows === null));

console.log('\n— column selector —');
await p.click('#colBtn'); await p.waitForTimeout(150);
ok('Client column is locked', await p.$eval('#cb_client', e => e.disabled));
const collapsed = await p.textContent('#colCollapsed');
ok('Collapsed Fields lists Client ID and Updated by',
   collapsed.includes('Client ID') && collapsed.includes('Updated by'));
const cols0 = await p.$$eval('#thr th', t => t.length);
await p.click('#cb_alias'); await p.waitForTimeout(150);
ok('toggling Alias adds a column', (await p.$$eval('#thr th', t => t.length)) === cols0 + 1);
await p.fill('#colQ', 'vet'); await p.waitForTimeout(120);
ok('field search filters the selector list', (await p.$$eval('#colVisible li', l => l.length)) === 1);
await p.fill('#colQ', ''); await p.waitForTimeout(100);
await p.click('#cb_alias'); await p.waitForTimeout(150);
ok('column choice persists to localStorage',
   await p.evaluate(() => !!localStorage.getItem('hmisSim.l1.columns.v3')));
await closeAll();

console.log('\n— row expand —');
await type('Torres');
await p.click('#tb [data-exp]'); await p.waitForTimeout(150);
const exp = await p.textContent('.expand');
ok('chevron reveals the collapsed fields',
   exp.includes('Client ID') && exp.includes('Updated by'), exp.slice(0, 60));
await p.click('#tb [data-exp]');

console.log('\n— guided flow —');
await p.reload(); await p.waitForTimeout(200);
ok('lesson opens on task 1', (await p.textContent('#tTitle')).includes('nickname'));
ok('progress reads task 1 of 8', (await p.textContent('#taskNo')).includes('1 of 8'));

await p.click('#addBtn'); await p.waitForTimeout(150);
const nt = await p.textContent('#ntBody');
ok('Add Client defers to Lesson 2', nt.includes('Lesson 2'));
ok('...and still flags the duplicate risk', nt.includes('already has a record'));
await closeAll();

await type('Tor');
await p.click('#tb tr[data-row]'); await p.waitForTimeout(200);
ok('opening Michael Torres passes task 1', (await p.textContent('#fb')).includes('Correct'));
ok('teaching point appears', (await p.textContent('#fb')).includes('no alias'));
ok('score is no longer zero', !(await p.textContent('#scoreLbl')).includes('0%'));
await closeAll();
await p.click('#nextBtn'); await p.waitForTimeout(150);
ok('advances to task 2', (await p.textContent('#taskNo')).includes('2 of 8'));

await p.evaluate(() => { S.idx = 3; S.attempts = 0; S.hinted = false; renderCoach(); });
await type('Wilson');
await p.click('#tb tr[data-row]:has-text("4/17/91")'); await p.waitForTimeout(200);
ok('wrong James Wilson rejected with a specific reason',
   (await p.textContent('#fb')).includes('other James Wilson'));
await closeAll();
await p.click('#tb tr[data-row]:has-text("9/2/68")'); await p.waitForTimeout(200);
ok('correct James Wilson passes (partial credit)', (await p.textContent('#fb')).includes('Correct'));
await closeAll();

await p.evaluate(() => { S.idx = 4; S.attempts = 0; S.hinted = false; renderCoach(); });
await type('Delgado');
await p.click('#tb tr[data-row]:has-text("Marcus")'); await p.waitForTimeout(200);
ok('a Delgado with ROI Yes is rejected', (await p.textContent('#fb')).includes('consent is on file'));
await closeAll();
await p.click('#tb tr[data-row]:has-text("Elena")'); await p.waitForTimeout(200);
ok('the ROI-Missing Delgado passes', (await p.textContent('#fb')).includes('Correct'));
await closeAll();

await p.evaluate(() => { S.idx = 5; S.attempts = 0; S.hinted = false; renderCoach(); });
await type('Nakashima');
await p.click('#tb tr[data-row]:has-text("3/22/77")'); await p.waitForTimeout(200);
ok('record with an SSN but the wrong DOB is rejected',
   (await p.textContent('#fb')).includes("Don't pick a record"));
await closeAll();
await p.click('#tb tr[data-row]:has-text("11/9/82")'); await p.waitForTimeout(200);
ok('SSN-refused record with the right DOB passes', (await p.textContent('#fb')).includes('Correct'));
ok('its profile shows the SSN data-quality reason',
   (await p.evaluate(() => document.getElementById('pfBody').textContent)).includes('Client refused'));
await closeAll();

await p.evaluate(() => { S.idx = 7; S.attempts = 0; S.hinted = false; renderCoach(); });
await type('Beckett');
await p.click('#tb tr[data-row]'); await p.waitForTimeout(150);
await p.click('#flagBtn'); await p.waitForTimeout(200);
ok('flagging a Beckett passes the duplicate task', (await p.textContent('#fb')).includes('Correct'));
ok('teaching point says escalate, never merge', (await p.textContent('#fb')).includes('never merge'));
await p.click('#nextBtn'); await p.waitForTimeout(250);
ok('completion modal appears after the final task', !(await p.$eval('#done', e => e.hidden)));
ok('completion reports a percentage', (await p.textContent('#dnBody')).includes('%'));
ok('completion points forward to Lesson 2', (await p.textContent('#dnBody')).includes('Lesson 2'));
await closeAll();
ok('free exploration unlocks after the last task', (await p.textContent('#tTitle')).includes('complete'));

console.log('\n— accessibility / integrity —');
ok('result count is an aria-live region',
   await p.$eval('#resultCount', e => e.getAttribute('aria-live') === 'polite'));
ok('search input is labelled', await p.$$eval('label[for=q]', e => e.length === 1));
ok('training banner is present', (await p.textContent('#simBanner')).includes('Training Simulation'));
ok('non-affiliation disclaimer is present', (await p.textContent('.legal')).includes('Not affiliated'));
ok('SSN safety note is shown to the learner', (await p.textContent('.legal')).includes('900'));
ok('every rail button has an accessible name',
   await p.$$eval('.railbtn', bs => bs.every(x => x.getAttribute('aria-label'))));
ok('no JS errors during the entire run', errs.length === 0, errs.join(' | '));

await b.close();
console.log(`\n${pass} passed, ${fail} failed\n`);
process.exit(fail ? 1 : 0);
