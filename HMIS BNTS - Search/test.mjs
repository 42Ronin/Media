/**
 * Browser tests for Lesson 1: Finding a Client.
 *   npm i playwright && node test.mjs
 */
import { chromium } from 'playwright';
import { createServer } from 'http';
import { readFileSync } from 'fs';

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
const closeAll = async () => { await p.keyboard.press('Escape'); await p.waitForTimeout(120); };

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
ok('month/day fragment 3/14 reaches Michael Torres', (await q('3/14')).includes('Torres, Michael'));
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
await type('Lefty');
ok('street name "Lefty" returns nothing — the trap holds', (await names()).length === 0);
ok('"Lefty Torres" also returns nothing: extra words narrow, never widen',
   await p.evaluate(() => search('lefty torres', []).rows.length === 0));
ok('nobody in the roster answers to Lefty',
   await p.evaluate(() => CLIENTS.every(c =>
     !/^left/i.test(c.f) && !/^left/i.test(c.l) && !/^left/i.test(c.a || ''))));
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

for (const d of ['3/14/1979', '3.14.1979', '3-14-1979']) {
  await type(d);
  const n = await names();
  ok(`separator ${d} gives the same result`, n.length === 1 && n[0] === 'Torres, Michael', JSON.stringify(n));
}
await type('13/45/1990');
ok('an impossible date simply matches nobody', (await zero()) === 'No clients found');

await type('Cruz');
ok('"Cruz" finds nobody — the surname was filed as one word', (await names()).length === 0);
await type('dela');
ok('the shared fragment "dela" reaches Maria Delacruz',
   (await names()).includes('Delacruz, Maria'), JSON.stringify(await names()));

const multi = await p.evaluate(() => search('mar del', []).rows.map(c => c.l + ', ' + c.f));
ok('two fragments match across first AND last name', multi.includes('Delacruz, Maria'), JSON.stringify(multi));

console.log('\n— no task is solved by the naive search —');
/* Every task must either dead-end or narrow to a set the learner has to choose
   from. A task solved outright by the first thing a trainee would type teaches
   nothing — that is what happened when "Mike" prefix-matched Michael. */
const PROBES = [
  ['task 1  alt names',    'Lefty',                '357BF6714', 'dead'],
  ['task 1  full phrase',  'Lefty Torres',         '357BF6714', 'dead'],
  ['task 2  nickname',     'Kate',                 'F565C146B', 'dead'],
  ['task 3  last four',    '7742',                 'D41A7C930', 'choose'],
  ['task 4  misspelling',  'Kristof Wojiechowski', 'B8F0D3771', 'dead'],
  ['task 5  common name',  'Garcia',               'A50C9E214', 'choose'],
  ['task 6  stated DOB',   '04/12/1988',           '72B6F1C08', 'dead'],
  ['task 7  C spelling',   'Cathleen',             'E19D4A6B3', 'dead'],
  ['task 8  Cruz',         'Cruz',                 '2A8189B34', 'dead'],
  ['task 8  as spoken',    'Maria Cruz',           '2A8189B34', 'dead'],
  ['task 9  the name',     'James Wilson',         '3DF1DF674', 'choose'],
  ['task 10 the surname',  'Amari',                'C4E7B2019', 'choose'],
  ['task 11 the surname',  'Nguyen',               '6C2D91B47', 'choose'],
  ['task 11 full name',    'David Nguyen',         '6C2D91B47', 'choose'],
  ['task 12 as spoken',    'Smoke',                'A19F4C2E8', 'dead'],
  ['task 12 wrong spell',  'Reyes',                'A19F4C2E8', 'choose'],
  ['task 12 the fragment', 'Rey',                  'A19F4C2E8', 'choose'],
  ['task 13 the surname',  'Vega',                 'F2A6C8D40', 'choose'],
];
for (const [label, query, target, want] of PROBES) {
  const rows = await p.evaluate(q => search(q, []).rows.map(c => c.i), query);
  const got = rows.length === 0 ? 'dead'
            : (rows.includes(target) && rows.length === 1) ? 'instant' : 'choose';
  ok(`${label}: "${query}" ${want === 'dead' ? 'dead-ends' : 'narrows without solving'}`,
     got === want, `got ${got} (${rows.length} rows)`);
}

console.log('\n— scenario data integrity (guards) —');
const uniq = await p.evaluate(() => {
  const grab = q => search(q, []).rows.map(c => c.i);
  return {
    torres: grab('Tor'), lefty: grab('Lefty'), morrison: grab('Morr'),
    last4: grab('7742'), woj: grab('woj'), garcia: grab('Garcia'),
    fenwick: grab('Fen'), brennan: grab('Brennan'), cath: grab('Cath'),
    cruz: grab('Cruz'), delacruz: grab('Delacruz'), wilson: grab('Wilson'),
    amari: grab('Amari'), vega: grab('Vega'),
    nguyen: grab('Nguyen'), rey: grab('Rey'), smoke: grab('Smoke')
  };
});
ok('exactly one Torres, and nobody answers to Lefty', uniq.torres.length === 1 && uniq.lefty.length === 0);
ok('exactly one Morrison', uniq.morrison.length === 1);
ok('exactly two records end 7742', uniq.last4.length === 2);
ok('exactly one Wojciechowski', uniq.woj.length === 1);
ok('twelve Garcias — more than one page', uniq.garcia.length === 12);
ok('exactly one Fenwick', uniq.fenwick.length === 1);
ok('one Brennan, and no first name starting Cath', uniq.brennan.length === 1 && uniq.cath.length === 0);
ok('nobody matches "Cruz"; exactly one Delacruz', uniq.cruz.length === 0 && uniq.delacruz.length === 1);
ok('exactly two James Wilsons', uniq.wilson.length === 2);
ok('exactly two Amaris — mother and daughter', uniq.amari.length === 2);
// Task 10's whole method is "identify her by her household". The hint names Iris,
// so Iris has to actually be on the record — a household size alone is not enough.
const amariHh = await p.evaluate(() => {
  const m = search('Amari', []).rows.find(c => c.f === 'Yolanda');
  const d = search('Amari', []).rows.find(c => c.f === 'Iris');
  return { size: m.h, roll: m.hm.map(x => x.i), rel: m.hm, dSize: d.h, dRoll: d.hm.map(x => x.i) };
});
ok('Yolanda\'s record really lists a household, not just a count',
   amariHh.size === 2 && amariHh.roll.length === 2, JSON.stringify(amariHh));
ok('and Iris is the member named on it',
   amariHh.roll.includes('9B3F5D6C7'), JSON.stringify(amariHh.roll));
ok('the household is reciprocal, so opening either resolves',
   amariHh.dSize === 2 && amariHh.dRoll.includes('C4E7B2019'), JSON.stringify(amariHh.dRoll));
ok('Iris is shown as the daughter',
   amariHh.rel.some(x => x.i === '9B3F5D6C7' && x.rel === 'Daughter'), JSON.stringify(amariHh.rel));
ok('exactly three Vegas, all the same person', uniq.vega.length === 3 &&
   await p.evaluate(() => search('Vega', []).rows.every(c => c.f === 'Rosalind' && c.d === '1983-04-11')));
ok('exactly two Nguyens, both David', uniq.nguyen.length === 2 &&
   await p.evaluate(() => search('Nguyen', []).rows.every(c => c.f === 'David')));
ok('nobody answers to Smoke', uniq.smoke.length === 0);
ok('"Rey" reaches several, so the fragment alone cannot decide it', uniq.rey.length >= 4,
   String(uniq.rey.length));
ok('exactly one veteran born 1971 among them', await p.evaluate(() =>
   search('Rey', []).rows.filter(c => c.d.slice(0,4) === '1971' && c.v === 'Yes').length === 1));
ok('every SSN area is either 9xx or a placeholder — none can be real',
   await p.evaluate(() => CLIENTS.every(c => {
     if (!c.s) return true;
     const a = c.s.split('-')[0];
     return /^9\d\d$/.test(a) || a === 'XXX' || a === '000';
   })));
ok('partial SSNs exist, X- and 0-filled',
   await p.evaluate(() => {
     const s = CLIENTS.filter(c => c.s).map(c => c.s);
     return s.some(x => x.includes('XXX') || x.includes('XX')) &&
            s.some(x => /(^000|-00-|0000$)/.test(x));
   }));
ok('roster is 300 clients', await p.evaluate(() => CLIENTS.length) === 300);
ok('SSN data-quality codes present (refused records exist)',
   await p.evaluate(() => CLIENTS.filter(c => c.q === 'refused').length) > 5);

console.log('\n— default column order —');
const hdr = await p.$$eval('#thr th', ts => ts.map(t => t.textContent.replace(/[↑↓]/g,'').trim()).filter(Boolean));
ok('default column order is Client, DOB, SSN, ROI',
   JSON.stringify(hdr) === JSON.stringify(['Client','DOB','SSN','ROI']), JSON.stringify(hdr));

console.log('\n— ROI + SSN columns —');
await type('Vega');
ok('recently-accessed hint disappears once a search is active',
   await p.$eval('#hintRow', e => getComputedStyle(e).display === 'none'));
ok('client ID renders on its own line under the name',
   await p.$eval('#tb .cid', e => getComputedStyle(e).display === 'block'));
const roi = await p.$$eval('#tb tr[data-row]', rs => rs.map(r => ({
  name: r.querySelector('.cname').textContent.trim(),
  roi: r.querySelector('.roi') ? r.querySelector('.roi').textContent.trim() : null
})));
ok('every row renders a valid ROI pill',
   roi.length === 3 && roi.every(r => ['Yes','Missing','No'].includes(r.roi)), JSON.stringify(roi));

await type('Vega');
// locate the SSN cell by header position so column reordering can't break this
const nk = await p.evaluate(() => {
  const hdrs = [...document.querySelectorAll('#thr th')].map(t => t.textContent.replace(/[↑↓]/g,'').trim());
  const col = hdrs.indexOf('SSN');
  return [...document.querySelectorAll('#tb tr[data-row]')].map(r => r.children[col].textContent.trim());
});
ok('a record with no SSN renders (No value)', nk.some(t => t.includes('No value')), JSON.stringify(nk));

console.log('\n— partial SSNs (X / 0 filled) —');
const pssn = await p.evaluate(() => {
  const c = CLIENTS.find(x => x.s && x.s.startsWith('XXX'));
  return c ? { id: c.i, ssn: c.s, last4: c.s.slice(-4), q: c.q } : null;
});
ok('a client exists whose area segment is XXX', !!pssn, JSON.stringify(pssn));
if (pssn) {
  ok('partial SSN carries the approximate/partial quality code', pssn.q === 'approx');
  ok('the known digits are still searchable',
     await p.evaluate(id => search(CLIENTS.find(c => c.i === id).s.slice(-4), []).rows.some(c => c.i === id), pssn.id));
  ok('searching the placeholder itself finds nobody by accident',
     await p.evaluate(() => search('xxx', []).rows.length === 0));
}
ok('a search cannot match across a masked segment', await p.evaluate(() => {
  const c = CLIENTS.find(x => x.s && /^9\d\d-XX-\d{4}$/.test(x.s));
  if (!c) return true;
  const straddle = c.s.slice(1, 3) + c.s.slice(7, 9);   // last 2 of area + first 2 of serial
  return !search(straddle, []).rows.some(r => r.i === c.i) ||
         ssnPlain(c.s).indexOf(straddle) === -1;
}));
ok('zero-filled segments remain searchable as digits', await p.evaluate(() => {
  const c = CLIENTS.find(x => x.s && x.s.split('-')[0] === '000');
  return !c || search('000', []).rows.some(r => r.i === c.i);
}));

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
await p.fill('#chipVal', 'Garcia');
await p.click('#chipGo'); await p.waitForTimeout(250);
ok('chip value narrows the results', (await names()).length === 10 &&
   await p.evaluate(() => S.rows.length === 12), JSON.stringify(await names()));
ok('chip displays its applied value', (await p.textContent('#chips')).includes('Garcia'));
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

console.log('\n— row expand + household —');
const hoh = await p.evaluate(() => {
  const c = CLIENTS.find(x => x.hm && x.hm.length >= 3);
  return { id: c.i, q: c.f, cid: c.cid, size: c.hm.length };
});
await type(hoh.q);
await p.click(`#tb tr[data-row="${hoh.id}"] [data-exp]`); await p.waitForTimeout(200);
const exp = await p.textContent('.expand');
ok('chevron reveals the collapsed fields',
   exp.includes('Client ID') && exp.includes('Veteran Status') &&
   exp.includes('Household Members') && exp.includes('Updated by'), exp.slice(0, 80));
ok('expanded row shows the NUMERIC client id, not the unique identifier',
   exp.includes(String(hoh.cid)) && !exp.includes(hoh.id));
const mem = await p.$$eval('.expand .hm', hs => hs.map(h => ({
  name: h.querySelector('b').textContent.replace(/\s*\(.*?\)\s*$/, '').trim(),
  rel: h.querySelector('.nm > span').textContent.trim()
})));
ok('household members render with names and relationships',
   mem.length === hoh.size && mem.every(m => m.name && m.rel), JSON.stringify(mem));
ok('exactly one member is the head of household',
   mem.filter(m => m.rel === 'Parent').length === 1, JSON.stringify(mem.map(m => m.rel)));
ok('the client themselves appears in their own household',
   await p.evaluate(id => byId(id).hm.some(m => m.i === id), hoh.id));
ok('every household member resolves to a real client in the roster',
   await p.evaluate(() => CLIENTS.every(c => (c.hm || []).every(m => !!byId(m.i)))));
ok('the Household Members count matches the household size',
   await p.evaluate(() => CLIENTS.every(c => c.h === (c.hm && c.hm.length ? c.hm.length : 1))));
ok('about 35% of clients are in a household, the rest are individuals',
   await p.evaluate(() => {
     const share = CLIENTS.filter(c => c.hm.length).length / CLIENTS.length;
     return share > 0.32 && share < 0.38;
   }));
ok('household membership is reciprocal', await p.evaluate(() =>
   CLIENTS.filter(c => c.hm && c.hm.length).every(c =>
     c.hm.every(m => { const o = byId(m.i); return o.hm && o.hm.some(x => x.i === c.i); }))));
await p.click(`#tb tr[data-row="${hoh.id}"] [data-exp]`);

ok('the search page carries no stat tiles', await p.$$eval('.tile', t => t.length === 0));

console.log('\n— client record page —');
await type('Vega');
await p.click('#tb tr[data-row="F2A6C8D40"]'); await p.waitForTimeout(250);
ok('opening a row navigates to the record page', !(await p.$eval('#recordView', e => e.hidden)));
ok('the search screen is replaced, not overlaid',
   await p.$eval('#searchView', e => getComputedStyle(e).display === 'none'));
ok('Public Alert is not shown for a client with no alert',
   await p.$eval('#alertBtn', e => getComputedStyle(e).display === 'none'));
ok('header names the client', (await p.textContent('#recName')).includes('Rosalind Vega'));
ok('header carries the "viewing the Client Record pages" line',
   (await p.textContent('#recSub')).includes('Client Record pages'));
const nav = await p.$$eval('#recNav button', bs => bs.map(x => x.textContent.trim()));
ok('client nav has all 16 sections with Profile active',
   nav.length === 16 && nav[0] === 'Profile' &&
   await p.$eval('#recNav button', e => e.getAttribute('aria-current') === 'page'), JSON.stringify(nav));
const grid = await p.textContent('#profGrid');
ok('profile shows earliest enrollment (the tiebreaker in task 13)',
   (await p.textContent('#profGrid')).includes('Earliest enrollment'));
ok('profile shows the three data-quality fields',
   grid.includes('Quality of SSN') && grid.includes('Quality of Name') && grid.includes('Quality of DOB'));
ok('profile shows Consent Refused and Race and Ethnicity',
   grid.includes('Consent Refused') && grid.includes('Race and Ethnicity'));
ok('missing values read "No value"', grid.includes('No value'));
const rail = await p.$$eval('#recRail .rc b', bs => bs.map(x => x.textContent.trim()));
ok('right rail lists all eight record sections',
   rail.length === 8 && rail[0] === 'Program referrals' && rail.includes('Care Team'), JSON.stringify(rail));
const pill = await p.$eval('#recRail .pillnum', e => {
  const r = e.getBoundingClientRect();
  return { w: Math.round(r.width), h: Math.round(r.height) };
});
ok('count pills stay circular (no class collision with the empty state)',
   pill.w === pill.h && pill.w < 30, JSON.stringify(pill));
await p.click('.railbtn[aria-current]'); await p.waitForTimeout(200);
ok('the global Clients button returns to search', !(await p.$eval('#searchView', e => e.hidden)));

// the top-bar magnifier is the documented way back
await p.click('#tb tr[data-row]:has-text("Rosa")'); await p.waitForTimeout(250);
ok('back on a record page', !(await p.$eval('#recordView', e => e.hidden)));
await p.click('#globalSearchBtn'); await p.waitForTimeout(250);
ok('the top-bar magnifier returns to client search from a record',
   !(await p.$eval('#searchView', e => e.hidden)) && await p.$eval('#recordView', e => e.hidden));
ok('and it puts the cursor in the search box',
   await p.evaluate(() => document.activeElement && document.activeElement.id === 'q'));
await p.click('#globalSearchBtn'); await p.waitForTimeout(200);
ok('clicking it on the search page explains what it is for',
   (await p.textContent('#ntTitle')).includes('back to Client Search'));
ok('...and says you are already there', (await p.textContent('#ntBody')).includes('already on'));
await closeAll();

console.log('\n— guided flow —');
await p.reload(); await p.waitForTimeout(200);
ok('lesson opens on task 1', (await p.textContent('#tTitle')).includes('name he gave'));
ok('progress reads task 1 of 13', (await p.textContent('#taskNo')).includes('1 of 13'));

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
ok('advances to task 2', (await p.textContent('#taskNo')).includes('2 of 13'));

await p.evaluate(() => { S.idx = 8; S.attempts = 0; S.hinted = false; renderCoach(); });
await type('Wilson');
await p.click('#tb tr[data-row]:has-text("4/17/91")'); await p.waitForTimeout(200);
ok('wrong James Wilson rejected with a specific reason',
   (await p.textContent('#fb')).includes('other James Wilson'));
await closeAll();
await p.click('#tb tr[data-row]:has-text("9/2/68")'); await p.waitForTimeout(200);
ok('correct James Wilson passes (partial credit)', (await p.textContent('#fb')).includes('Correct'));
await closeAll();

// task 10 — the household is the only way to tell mother from daughter
await p.evaluate(() => { S.idx = 9; S.attempts = 0; S.hinted = false; renderCoach(); });
await type('Amari');
await p.click('#tb tr[data-row="9B3F5D6C7"]'); await p.waitForTimeout(200);
ok('opening the daughter is rejected with a reason',
   (await p.textContent('#fb')).includes("daughter"));
await closeAll();
await p.click('#tb tr[data-row="C4E7B2019"]'); await p.waitForTimeout(200);
ok('opening the mother passes task 10', (await p.textContent('#fb')).includes('Correct'));
ok('her record is thin on identifiers, as the task requires',
   (await p.textContent('#profGrid')).includes('No value'));
await closeAll();

// task 11 — two records the identifiers cannot separate; location decides
await p.evaluate(() => { S.idx = 10; S.attempts = 0; S.hinted = false; renderCoach(); });
await type('Nguyen');
ok('two records, neither with an SSN', (await names()).length === 2 &&
   await p.evaluate(() => search('Nguyen', []).rows.every(c => !c.s)));
ok('only one of them has been at the 6th Street bridge', await p.evaluate(() =>
   search('Nguyen', []).rows.filter(c => (c.lo || []).some(e => e.p === '6th Street bridge')).length === 1));
ok('location records carry a type and a recording method, and no invented date',
   await p.evaluate(() => CLIENTS.filter(c => (c.lo || []).length).every(c => c.lo.every(e =>
     e.p && e.ty && ['Address', 'Field Interaction'].includes(e.k) && e.d === undefined))));
await p.click('#tb tr[data-row="6C2D91B47"]'); await p.waitForTimeout(250);
ok('opening the one at the bridge passes task 11', (await p.textContent('#fb')).includes('Correct'));
// Location is a tab on the record, the way the product has it — not a profile field
ok('the Location tab is reachable', await p.$$eval('#recNav [data-tab="Location"]', e => e.length === 1));
ok('the profile card does not carry location',
   !(await p.textContent('#profGrid')).includes('6th Street bridge'));
await p.click('#recNav [data-tab="Location"]'); await p.waitForTimeout(200);
ok('the Location tab shows a map with lettered pins',
   await p.$$eval('#locBody .pin', e => e.length === 2 && e[0].textContent.trim() === 'A'));
ok('and lists each location with its type', await p.evaluate(() => {
  const t = document.querySelector('#locBody').textContent;
  return /6th Street bridge/.test(t) && /Encampment/.test(t) && /Field Interaction/.test(t);
}));
ok('Add Address is present but obstructed, since adding is not this lesson',
   await p.$$eval('#locationPane .locbtn[data-locked]', e => e.length === 2));
ok('the teaching keeps location as one identifier among several',
   (await p.textContent('#fb')).includes('not as the answer on its own'));
await closeAll();

// task 12 — the hard one: street name, three spellings, year and veteran only
await p.evaluate(() => { S.idx = 11; S.attempts = 0; S.hinted = false; renderCoach(); });
await type('Smoke');
ok('the street name reaches nobody', (await names()).length === 0);
await type('Rey');
ok('the fragment narrows without deciding', (await names()).length >= 4);
await p.click('#tb tr[data-row="A19F4C2E8"]'); await p.waitForTimeout(250);
ok('opening Elias Reyez passes task 12', (await p.textContent('#fb')).includes('Correct'));
ok('the teaching names what closed it', (await p.textContent('#fb')).includes('Veteran status'));
await closeAll();

// task 13 — three matching records, choose the most complete
await p.evaluate(() => { S.idx = 12; S.attempts = 0; S.hinted = false; renderCoach(); });
await type('Vega');
ok('three records, all the same person', (await names()).length === 3);
await p.click('#tb tr[data-row="8D40A2F16"]'); await p.waitForTimeout(200);
ok('the emptiest record is rejected', (await p.textContent('#fb')).includes('no SSN on file'));
await closeAll();
await p.click('#tb tr[data-row="5C1B9E730"]'); await p.waitForTimeout(200);
ok('the partial record is rejected too', (await p.textContent('#fb')).includes('partial SSN'));
await closeAll();
await p.click('#tb tr[data-row="F2A6C8D40"]'); await p.waitForTimeout(200);
ok('the most complete record passes task 13', (await p.textContent('#fb')).includes('Correct'));
ok('teaching names the oldest-enrollment tiebreaker',
   (await p.textContent('#fb')).includes('longest enrollment history'));
await closeAll();

// Reporting duplicates was removed from this training, so nothing in the lesson
// may send the learner to HMIS Support or tell them to merge or delete.
ok('no task sends the learner to HMIS Support', await p.evaluate(() =>
  TASKS.every(t => !/HMIS Support/i.test((t.teach || '') + (t.hint || '') + (t.brief || '')))));
ok('nothing tells the learner to merge or delete a record', await p.evaluate(() =>
  TASKS.every(t => !/\b(merge|delete)\b/i.test((t.teach || '') + (t.hint || '')))));
ok('the flag control is present but obstructed, like the rest of what this lesson skips',
   await p.evaluate(async () => {
     document.getElementById('kebabBtn').click();
     await new Promise(r => setTimeout(r, 120));
     const items = [...document.querySelectorAll('#filterPop .menuitem')];
     const flag = items.find(x => /Flag possible duplicate/i.test(x.textContent));
     return !!flag && flag.hasAttribute('data-locked');
   }));
await p.click('#nextBtn'); await p.waitForTimeout(250);
ok('completion modal appears after the final task', !(await p.$eval('#done', e => e.hidden)));
ok('completion reports a percentage', (await p.textContent('#dnBody')).includes('%'));
ok('completion points forward to Lesson 2', (await p.textContent('#dnBody')).includes('Lesson 2'));
await closeAll();
ok('free exploration unlocks after the last task', (await p.textContent('#tTitle')).includes('complete'));

console.log('\n— script alignment —');
ok('lesson is titled Finding a Participant',
   (await p.textContent('.chead h2')).includes('Finding a Participant'));
ok('the Skip button is gone', await p.$$eval('#skipBtn', e => e.length === 0));
ok('the task panel sits on the left, the app on the right', await p.evaluate(() => {
  const c = document.querySelector('.coach').getBoundingClientRect();
  const a = document.querySelector('.app').getBoundingClientRect();
  return c.left < a.left && c.right <= a.left + 1;
}));
ok('coach copy uses "participant", not "client"', await p.evaluate(() =>
  TASKS.some(t => /participant/i.test(t.teach + t.brief + t.ask))));

console.log('\n— the seam between searching and verifying —');
await p.click('.railbtn[aria-current]'); await p.waitForTimeout(200);   // back to search
await p.evaluate(() => { S.idx = 7; S.attempts = 0; S.hinted = false; S.results = [
  {id:'nickname',p:10},{id:'year',p:10}]; renderCoach(); });
await type('dela');
await p.click('#tb tr[data-row="2A8189B34"]'); await p.waitForTimeout(200);
await closeAll();
await p.click('#nextBtn'); await p.waitForTimeout(200);
ok('a non-scored beat appears after task 8',
   (await p.textContent('#tTitle')).includes('From finding to verifying'));
ok('it marks the seam between searching and verifying',
   (await p.textContent('#tBrief')).includes('search half') &&
   (await p.textContent('#tBrief')).includes('not the same as finding the right one'));
ok('the progress label marks it as a checkpoint', (await p.textContent('#taskNo')).includes('Checkpoint'));
ok('the button says Continue', (await p.textContent('#nextBtn')).includes('Continue'));
ok('no hint is offered on a checkpoint', await p.$eval('#hintBtn', e => e.hidden));
const scoreAtCheckpoint = await p.textContent('#scoreLbl');
await p.click('#nextBtn'); await p.waitForTimeout(200);
ok('continuing lands on task 9', (await p.textContent('#taskNo')).includes('9 of 13'));
ok('the checkpoint scored nothing', (await p.textContent('#scoreLbl')) === scoreAtCheckpoint);

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

/* ------------------------------------------------------------------
   Embedding. The lesson is going into Rise as an HTML embed, so it must
   not touch the host course's SCORM session — and it must still be able
   to report to a Storyline block, which can listen. Both are asserted by
   loading the lesson inside a frame that fakes an LMS API.
   ------------------------------------------------------------------ */
console.log('\n— the recovery scenario (sandbox) —');
/* One person, worked end to end. Each step has to fail in the way the story says
   it fails, or the scenario teaches the wrong lesson. */
const ARC = [
  ['what she gives you dead-ends',        'Sylvia Marchetti', 0],
  ['the surname alone reaches nobody',    'Marchetti',        0],
  ['the nickname was never recorded',     'Syl',              0],
  ['the Y spelling finds nothing',        'Sylvia',           0],
  ['the I spelling opens it up',          'Sil',              5],
  ['adding the year narrows to two',      'Sil 1979',         2],
];
for (const [label, query, expected] of ARC) {
  const n = await p.evaluate(x => search(x, []).rows.length, query);
  ok(`${label}: "${query}" -> ${expected}`, n === expected, `got ${n}`);
}
ok('the two that remain cannot be told apart on identifiers', await p.evaluate(() => {
  const rows = search('Sil 1979', []).rows;
  return rows.length === 2 && rows.every(c => c.f === 'Silvia' && !c.s);
}));
ok('the household is what separates them', await p.evaluate(() => {
  const rows = search('Sil 1979', []).rows;
  const withHh = rows.filter(c => (c.hm || []).length);
  return withHh.length === 1 && withHh[0].i === '7E1D4A9C3' &&
         withHh[0].hm.some(m => m.i === '2B8F6E1D5');
}));
ok('and her son resolves to a real record',
   await p.evaluate(() => !!CLIENTS.find(c => c.i === '2B8F6E1D5' && c.f === 'Mateo')));

console.log('\n— embedding in another course —');
/* Both pages have to share a real origin: a file:// or data:// frame is walled
   off by the browser, which would make "it never reached the host's API" pass
   for the wrong reason. A throwaway http server gives us a genuine same-origin
   embed, which is the case that can actually do damage. */
const LESSON_HTML = readFileSync(new URL('./dist/lesson1-client-search.html', import.meta.url), 'utf8');
const HOST_HTML = `<!doctype html><title>host course</title>
<script>
  window.hostCalls = [];
  window.API = {
    LMSInitialize: function(){ hostCalls.push('LMSInitialize'); return 'true'; },
    LMSSetValue:   function(k,v){ hostCalls.push('LMSSetValue:'+k+'='+v); return 'true'; },
    LMSGetValue:   function(){ return ''; },
    LMSCommit:     function(){ hostCalls.push('LMSCommit'); return 'true'; },
    LMSFinish:     function(){ hostCalls.push('LMSFinish'); return 'true'; },
    LMSGetLastError: function(){ return '0'; }
  };
  window.simMsgs = [];
  addEventListener('message', function(e){
    if (e.data && e.data.source === 'hmis-sim') simMsgs.push(e.data);
  });
</script>
<iframe id="f" src="/lesson.html" style="width:1460px;height:880px;border:0"></iframe>`;

const srv = createServer((req, res) => {
  const url = req.url.split('?')[0];
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(url === '/lesson.html' ? LESSON_HTML : HOST_HTML);
}).listen(0);
const PORT = srv.address().port;

const host = await b.newPage({ viewport: { width: 1500, height: 950 } });
await host.goto(`http://127.0.0.1:${PORT}/host.html`);
await host.waitForTimeout(1500);

ok('embedded, it never initialises the host course\'s SCORM session',
   await host.evaluate(() => window.hostCalls.length === 0),
   JSON.stringify(await host.evaluate(() => window.hostCalls)));
ok('the host API really was reachable — the guard is what stopped it, not the browser',
   await host.evaluate(() => { try { return !!document.querySelector('#f').contentWindow.parent.API; }
                               catch (e) { return false; } }));
ok('and it announces itself to the host instead',
   await host.evaluate(() => simMsgs.some(m => m.type === 'ready' && m.tasks === 13)),
   JSON.stringify(await host.evaluate(() => simMsgs)));

const f = host.frames().find(fr => fr.url().includes('lesson.html'));
await f.fill('#q', 'Tor'); await host.waitForTimeout(400);
await f.click('.cwrap'); await host.waitForTimeout(600);
const taskMsg = await host.evaluate(() => simMsgs.find(m => m.type === 'task'));
ok('a solved task is reported to the host', !!taskMsg && taskMsg.index === 1 && taskMsg.id === 'nickname',
   JSON.stringify(taskMsg));
ok('the report carries the score and whether it was first-try',
   !!taskMsg && taskMsg.points === 10 && taskMsg.firstTry === true && typeof taskMsg.percent === 'number',
   JSON.stringify(taskMsg));
ok('every message is tagged so a host can tell ours apart',
   await host.evaluate(() => simMsgs.every(m => m.source === 'hmis-sim' && m.lesson === 'hmis-bnts-search')));
ok('still no SCORM traffic after scoring a task',
   await host.evaluate(() => window.hostCalls.length === 0),
   JSON.stringify(await host.evaluate(() => window.hostCalls)));

await host.evaluate(() => { document.querySelector('#f').src = '/lesson.html?scorm=1'; });
await host.waitForTimeout(1500);
ok('with ?scorm=1 it does report to the LMS, which is how our own package launches',
   await host.evaluate(() => window.hostCalls.includes('LMSInitialize')),
   JSON.stringify(await host.evaluate(() => window.hostCalls)));
await host.close();
srv.close();

await b.close();
console.log(`\n${pass} passed, ${fail} failed\n`);
process.exit(fail ? 1 : 0);
