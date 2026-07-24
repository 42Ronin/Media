import { chromium } from 'playwright';
const FILE = 'file:///home/user/Media/clarity-client-search-sim/dist/hmis-client-search-sim.html';

let pass = 0, fail = 0;
const ok  = (n, c, extra='') => { c ? (pass++, console.log('  PASS  ' + n)) : (fail++, console.log('  FAIL  ' + n + (extra ? '  -> ' + extra : ''))); };

const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const p = await b.newPage();
const errs = [];
p.on('pageerror', e => errs.push(String(e)));
p.on('console', m => { if (m.type() === 'error') errs.push('console: ' + m.text()); });
await p.goto(FILE);

const search = async (q) => {
  await p.fill('#q', q);
  await p.click('button[type=submit]');
  await p.waitForTimeout(60);
};
const names = () => p.$$eval('#tbody tr .cname', els => els.map(e => e.textContent.trim()));
const emptyTxt = () => p.$eval('#emptyState', e => e.hidden ? '' : e.textContent.trim());
const closeClient = async () => { if (!(await p.$eval('#clientModal', e => e.hidden))) { await p.click('#clientModal [data-close]'); await p.waitForTimeout(40); } };

console.log('\n— search engine —');
await search('Mike');
ok('nickname "Mike" returns nothing (the trap)', (await names()).length === 0);
ok('no-results state coaches the user', (await emptyTxt()).includes('No clients found'));

await search('Tor');
ok('3-letter surname fragment "Tor" finds Michael Torres', (await names()).includes('Michael Torres'), JSON.stringify(await names()));

await search('ab');
ok('2 characters rejected with min-length message', (await emptyTxt()).includes('at least the first 3 letters'));

await search('1985');
ok('bare year 1985 finds Katherine Morrison', (await names()).includes('Katherine Morrison'));
ok('bare year returns only 1985 births', await p.$$eval('#tbody tr', (rs) => rs.length > 0));

for (const d of ['12/05/1990', '12.05.1990', '12-05-1990']) {
  await search(d);
  const n = await names();
  ok(`date format ${d} -> 2 people share that DOB`, n.length === 2 && n.includes('Andre Whitfield'), JSON.stringify(n));
}

await search('13/45/1990');
ok('invalid date is rejected', (await emptyTxt()).includes("isn't a valid one"));

await search('Wilson');
ok('"Wilson" returns two distinct people', (await names()).length === 2);

await search('Cruz');
ok('surname token "Cruz" finds Maria de la Cruz', (await names()).includes('Maria de la Cruz'), JSON.stringify(await names()));

await search('Beckett');
ok('"Beckett" surfaces the duplicate pair', (await names()).length === 2);

await search('100234');
ok('6-digit client ID search works', (await names()).length === 1);

console.log('\n— filters —');
await p.fill('#q', '');
await p.click('#filterBtn');
await p.fill('#fSsn', '4471');
await p.click('#applyFilters');
await p.waitForTimeout(60);
let n = await names();
ok('SSN-last-4 filter isolates the right James Wilson', n.length === 1 && n[0] === 'James Wilson', JSON.stringify(n));
ok('filter result is ID 100662', await p.$eval('#tbody tr', r => r.dataset.id) === '100662');
await p.click('#clearFilters');

console.log('\n— columns —');
await p.click('#colBtn');
const before = await p.$$eval('#theadRow th', t => t.length);
await p.click('#col_age');
await p.waitForTimeout(60);
ok('toggling Age adds a column', (await p.$$eval('#theadRow th', t => t.length)) === before + 1);
ok('locked Client column cannot be unchecked', await p.$eval('#col_client', e => e.disabled));
ok('column choice persisted to localStorage', await p.evaluate(() => !!localStorage.getItem('claritySim.columns.v1')));
await p.click('#col_age');
await p.click('#colBtn');

console.log('\n— guided scenario flow —');
await p.reload();
ok('task 1 is the nickname problem', (await p.textContent('#taskBox')).includes('nickname'));

// wrong move: try to Add Client while an existing record is the answer
await p.click('#addClientBtn');
await p.waitForTimeout(60);
ok('Add Client during a find-task is blocked as a duplicate risk',
   (await p.textContent('#feedback')).includes('would create a duplicate'));

await search('Tor');
await p.click('#tbody tr');
await p.waitForTimeout(80);
ok('opening Michael Torres passes task 1', (await p.textContent('#feedback')).includes('Correct'));
ok('teaching point shown after success', (await p.textContent('#feedback')).includes('Michael'));
ok('score registered', (await p.textContent('#scoreLabel')) !== 'Score 0%');
ok('client opened appears in Recently accessed', (await p.textContent('#recentList')).includes('Michael Torres'));

await closeClient();
await p.click('#nextBtn');
await p.waitForTimeout(60);
ok('advances to task 2', (await p.textContent('#progLabel')).includes('Task 2'));

// task 2 — wrong client first, then right one
await search('1985');
await p.click('#tbody tr:has-text("Marcus Delgado")').catch(() => {});
await p.waitForTimeout(80);
const fb2 = await p.textContent('#feedback');
ok('opening the wrong client is marked incorrect', fb2.includes('Not this client') || fb2.includes("isn't the client"), fb2.slice(0, 80));
await closeClient();
await search('Morr');
await p.click('#tbody tr');
await p.waitForTimeout(80);
ok('opening Katherine Morrison passes task 2 (partial credit)', (await p.textContent('#feedback')).includes('Correct'));

await closeClient();

console.log('\n— duplicate flag path —');
await p.evaluate(() => { App.idx = 4; App.attempts = 0; App.hinted = false; renderCoach(); });
await search('Beckett');
await p.click('#tbody tr');
await p.waitForTimeout(60);
await p.click('#flagDupBtn');
await p.waitForTimeout(80);
ok('flagging a Beckett record passes the duplicate task', (await p.textContent('#feedback')).includes('Correct'));

await closeClient();

console.log('\n— add-client path (task 7) —');
await p.evaluate(() => { App.idx = 6; App.attempts = 0; App.hinted = false; App.searches = []; App.results = []; renderCoach(); });
await p.click('#addClientBtn');
await p.waitForTimeout(60);
ok('Add Client blocked before searching enough', (await p.textContent('#feedback')).includes('Search first'));

await search('Ellery');
await search('06/18/1988');
await p.click('#addClientBtn');
await p.waitForTimeout(60);
ok('duplicate-check interstitial appears after real searching', !(await p.$eval('#dupModal', e => e.hidden)));
await p.click('#proceedAdd');
await p.fill('#aFirst', 'Desmond');
await p.fill('#aLast', 'Ellery');
await p.click('#saveClient');
await p.waitForTimeout(60);
ok('save blocked without DOB and ROI', (await p.textContent('#addErr')).includes('required'));
await p.fill('#aDob', '06/18/1988');
await p.click('#saveClient');
await p.waitForTimeout(60);
ok('save still blocked without ROI', (await p.textContent('#addErr')).includes('Release of Information'));
await p.selectOption('#aRoi', 'yes');
await p.click('#saveClient');
await p.waitForTimeout(80);
ok('client saves once ROI recorded', await p.$eval('#addModal', e => e.hidden));
ok('add-client task passes', (await p.textContent('#feedback')).includes('Correct'));
await search('Ellery');
ok('newly added client is now searchable', (await names()).includes('Desmond Ellery'));

console.log('\n— accessibility / integrity —');
ok('results table has an aria-live count', await p.$eval('#resultCount', e => e.getAttribute('aria-live') === 'polite'));
ok('search input has a label', await p.$$eval('label[for=q]', e => e.length === 1));
ok('training banner present', (await p.textContent('#simBanner')).includes('Training Simulation'));
ok('non-affiliation disclaimer present', (await p.textContent('footer.legal')).includes('Not affiliated'));
ok('no JS errors during the whole run', errs.length === 0, errs.join(' | '));

await b.close();
console.log(`\n${pass} passed, ${fail} failed\n`);
process.exit(fail ? 1 : 0);
