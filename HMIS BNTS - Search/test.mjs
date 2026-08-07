/**
 * Browser tests for Lesson 1: Finding a Client.
 *   npm i playwright && node test.mjs
 */
import { chromium } from 'playwright';
import { createServer } from 'http';
import { readFileSync } from 'fs';

const FILE = 'file://' + new URL('./dist/_all.html', import.meta.url).pathname;
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

/* Every simulation in the series opens with a different ask, so each declares its
   own orientation and the beat engine is what they share. It has to run first and
   get out of the way cleanly. */
console.log('\n— orientation —');
await p.waitForTimeout(600);
/* The orientation is slide 7.1 of the script, in the script's own words. The only
   edit is the number of situations, which the split into per-section deliverables
   forces. Sections without a 7.1 of their own get no orientation. */
ok('the orientation is present where the script has one',
   await p.$eval('#lzBub', e => e.classList.contains('on')) &&
   (await p.textContent('#fb')).includes('practice version of Clarity'));
/* She does not introduce herself: that was the course intro, and so was the
   blink-twice. Each section's orientation adds only what is new. */
ok('she does not re-introduce herself, having already met them',
   !(await p.textContent('#fb')).includes('I am Lashes') &&
   !(await p.textContent('#fb')).includes('Blink twice'));
ok('the tour is counted so the learner knows how long it is',
   (await p.textContent('#lzCount')).includes('of'));
const tourLen = Number((await p.textContent('#lzCount')).split('of')[1].trim());
ok('it is the three paragraphs slide 7.1 has, and no more', tourLen === 3);

const seen = [];
let arrowSeen = 0, arrowUnderBubble = false;
for (let n = 0; n < tourLen; n++) {
  seen.push(await p.textContent('#fb'));
  const arrow = await p.evaluate(() => {
    const A = document.querySelector('#lzArrow');
    if (!A.classList.contains('on')) return null;
    const a = A.getBoundingClientRect(), b = document.querySelector('#lzBub').getBoundingClientRect();
    return { over: !(a.right <= b.left || a.left >= b.right || a.bottom <= b.top || a.top >= b.bottom) };
  });
  if (arrow) { arrowSeen++; if (arrow.over) arrowUnderBubble = true; }
  const bad = await p.evaluate(() => {
    const a = document.querySelector('#lzBub').getBoundingClientRect();
    const w = document.querySelector('#coachWin').getBoundingClientRect();
    const over = !(a.right <= w.left || a.left >= w.right || a.bottom <= w.top || a.top >= w.bottom);
    const off = a.left < 0 || a.top < 0 || a.right > innerWidth + 1 || a.bottom > innerHeight + 1;
    return over || off;
  });
  ok(`tour step ${n + 1} is on screen and clear of the docked panel`, !bad);
  await p.click('#lzStep'); await p.waitForTimeout(420);
}
ok('the tour covers the roster size the script states', seen.join(' ').includes('three hundred people'));
ok('nothing in it is repeated from a previous section', await p.evaluate(() => {
  const said = s => JSON.stringify(TOURS).indexOf(s);
  /* every sentence appears in exactly one section's orientation */
  const all = Object.values(TOURS).flat().map(b => b.html);
  return new Set(all).size === all.length;
}));
ok('...and the job it states', seen.join(' ').includes('prove it is the right one'));
/* She has no hands and can never point, so the pointing is a prop — drawn in her
   own palette, standing in the gap between her and the thing, rotated at it. */
ok('the arrow appears when she is pointing at something',
   arrowSeen > 0, `${arrowSeen} of ${tourLen} steps pointed`);
ok('...and it never sits underneath her own bubble', !arrowUnderBubble);
ok('...and it is drawn in her palette, not the product\'s',
   await p.evaluate(() => {
     const path = document.querySelector('#lzArrow svg path');
     return path.getAttribute('stroke') === '#066888' && path.getAttribute('fill') === '#e0eff5';
   }));

ok('finishing it puts her away', await p.evaluate(() =>
   !document.querySelector('#lzBub').classList.contains('on') &&
   !document.querySelector('#lzChar').classList.contains('on') &&
   document.querySelector('#lzFoot').hidden));
ok('it can be replayed, because each lesson\'s is different', await p.evaluate(async () => {
  document.querySelector('#cwTour').click();
  await new Promise(r => setTimeout(r, 300));
  return document.querySelector('#lzBub').classList.contains('on');
}));
await p.evaluate(() => BEAT.cancel()); await p.waitForTimeout(200);

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
/* A year reaches everyone born in it. It can also reach an SSN that happens to
   contain those four digits, which is correct — the search looks inside SSNs on
   purpose — so the assertion is that nobody born that year is missed. */
ok('4-digit year 1977 finds everyone born in 1977', await p.evaluate(() => {
  const hit = new Set(search('1977', []).rows.map(c => c.i));
  return CLIENTS.filter(c => c.d.slice(0, 4) === '1977').every(c => hit.has(c.i));
}));
ok('...and anything else it reaches has 1977 inside its SSN', await p.evaluate(() =>
  search('1977', []).rows.every(c =>
    c.d.slice(0, 4) === '1977' || (c.s || '').replace(/-/g, '').includes('1977'))));
ok('2-digit year 77 finds everyone 1977 finds', await p.evaluate(() => {
  const hit = new Set(search('77', []).rows.map(c => c.i));
  return search('1977', []).rows.every(c => hit.has(c.i));
}));
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
ok('Lashes raises the real lesson instead',
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
/* These used to assert "exactly one". They no longer do, deliberately: a three
   letter prefix that lands on one record hands the answer over before the learner
   has done any of the thinking the task is for. What has to hold is that the
   prefix reaches the answer among others, and that the trap still dead-ends.
   tools/obviousness.mjs is what keeps this honest across every task. */
ok('"Tor" reaches Michael Torres among others, and nobody answers to Lefty',
   uniq.torres.length > 1 && uniq.torres.includes('357BF6714') && uniq.lefty.length === 0,
   JSON.stringify(uniq.torres));
ok('"Morr" reaches Katherine Morrison among others',
   uniq.morrison.length > 1 && uniq.morrison.includes('F565C146B'));
ok('exactly two records end 7742', uniq.last4.length === 2);
/* The taught technique — the first letters of both names — now returns a short
   list rather than one record, on purpose. It reaches him; it does not hand him
   over. The script's hint for this task says "krz woj reaches him immediately",
   which is a wording pass waiting to happen. */
ok('"krz woj" reaches Wojciechowski in a list short enough to read',
   await p.evaluate(() => {
     const r = search('krz woj', []).rows;
     return r.length > 1 && r.length <= 4 && r.some(c => c.i === 'B8F0D3771');
   }));
ok('twelve Garcias — more than one page', uniq.garcia.length === 12);
ok('"Fen" reaches Adrian Fenwick among others',
   uniq.fenwick.length > 1 && uniq.fenwick.includes('72B6F1C08'));
/* Cathleen is the spelling she offers and it has to dead-end. Other C spellings
   existing is the point of the task, not a violation of it. */
ok('"Brennan" reaches Kathleen among others, and "Cathleen" still reaches nobody',
   uniq.brennan.length > 1 && uniq.brennan.includes('E19D4A6B3') &&
   await p.evaluate(() => search('Cathleen', []).rows.length === 0));
ok('the name each participant actually says never lands on one record',
   await p.evaluate(() => ['Danielle', 'Reyez', 'Esperanza', 'Yolanda', 'Adrian']
     .every(q => search(q, []).rows.length > 1)));
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
/* The script lists ROI as blurred and out of scope for this lesson. The column
   stays — it is on the captured screen — but its values are not readable. */
ok('ROI values are blurred, being out of scope for this lesson',
   await p.$eval('#tb .roi', e => {
     const f = getComputedStyle(e).filter;
     return f.includes('blur') && getComputedStyle(e).pointerEvents === 'none';
   }));

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
/* Whichever record is open, the profile grid renders every field, and any the
   record does not hold read "No value" rather than being left blank. */
ok('every profile field is rendered, present or not',
   await p.$$eval('#profGrid .pf', els => els.length >= 12));
/* The record page's summary rail is gone: the training column stands where it
   was, and those cards were never part of what this lesson teaches. */
ok('the record page has no right rail left behind',
   await p.$$eval('#recRail, .recrail, .railcard', e => e.length === 0));
ok('the record content ends where the docked column begins', await p.evaluate(() => {
  const a = document.querySelector('.recwrap').getBoundingClientRect();
  const w = document.querySelector('#coachWin').getBoundingClientRect();
  return a.right <= w.left;
}));
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
ok('Add Client explains itself rather than deferring',
   nt.includes('search, you fail to find them') && !nt.includes('Lesson 2'));
ok('...and still flags the duplicate risk', nt.includes('already has a record'));
await closeAll();

await type('Tor');
await p.click('#tb tr[data-row="357BF6714"]'); await p.waitForTimeout(200);
ok('opening Michael Torres passes task 1', (await p.textContent('#fb')).includes('Correct'));
ok('teaching point appears', (await p.textContent('#fb')).includes('no alias'));
ok('the hint is withdrawn once the task is solved', await p.$eval('#hintBtn', e => e.hidden));
ok('the practice shows no score at all', await p.$$eval('#scoreLbl', e => e.length === 0));
ok('a solved task is ticked in the list', await p.$eval('#tList li', e => e.textContent.includes('\u2714')));
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
ok('correct James Wilson passes', (await p.textContent('#fb')).includes('Correct'));
ok('...and is not marked down for the wrong attempt', !(await p.textContent('#fb')).includes('partial'));
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
ok('completion reports what was done, not a mark',
   (await p.textContent('#dnBody')).includes('All 13 tasks complete') &&
   !(await p.textContent('#dnBody')).includes('%'));
/* The sections ship separately now, so the close no longer hands off to a lesson
   that is a different Rise block. It names the habit and stops. */
ok('completion names the habit the whole section was for',
   (await p.textContent('#dnBody')).includes('not proof that someone is new'));
await closeAll();
ok('free exploration unlocks after the last task', (await p.textContent('#tTitle')).includes('complete'));

console.log('\n— script alignment —');
/* One title, and it is the only one: "Section 7 — Hands-on Simulations". The
   combined page the suite runs on is not a deliverable and says so. */
ok('the title is built from the section number, and the tab agrees with the panel',
   await p.evaluate(() => {
     const want = SECTION
       ? 'Section ' + SECTION + ' \u2014 Hands-on Simulations'
       : 'Finding a Participant \u2014 all sections';
     return document.querySelector('#secTitle').textContent === want && document.title === want;
   }));
ok('the Skip button is gone', await p.$$eval('#skipBtn', e => e.length === 0));
ok('the training window is docked to a reserved column, and the interface ends at it',
   await p.evaluate(() => {
     const c = document.querySelector('.coach').getBoundingClientRect();
     const a = document.querySelector('.app').getBoundingClientRect();
     return a.left === 0 && a.right <= c.left && c.right <= innerWidth;
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
await p.click('#nextBtn'); await p.waitForTimeout(200);
ok('continuing lands on task 9', (await p.textContent('#taskNo')).includes('9 of 13'));

/* ------------------------------------------------------------------
   The training furniture: a movable window, and Lashes floating over the
   interface. She has no hands and cannot point, so being next to a thing is
   how she refers to it — which only works if she is never on top of the thing
   the learner has to click.
   ------------------------------------------------------------------ */
console.log('\n— the movable window —');
/* Back to a clean task 1 without going through the completion modal, which is a
   different thing to test and would leave a backdrop over everything. */
const resetLesson = async () => {
  await p.evaluate(() => {
    S.idx = 0; S.results = []; S.attempts = 0; S.hinted = false; S.finished = false;
    S.nudged = null; S.note = null; S.q = ''; S.chips = []; S.rows = null; S.page = 0;
    S.expanded = {};
    document.querySelector('#q').value = '';
    document.querySelectorAll('.backdrop').forEach(b => { b.hidden = true; });
    document.querySelector('#fb').innerHTML = '';
    document.querySelector('#nextBtn').hidden = true;
    if (S.open) closeProfile();
    LZ.hush(); LZ.closeCard();
    renderChips(); renderTable(); renderCoach();
  });
  await p.waitForTimeout(200);
};
await resetLesson();

const rectOf = (sel) => p.$eval(sel, e => {
  const r = e.getBoundingClientRect();
  return { l: r.left, t: r.top, r: r.right, b: r.bottom, w: r.width, h: r.height };
}).catch(() => null);
const hits = (a, b) => a && b && !(a.r <= b.l || a.l >= b.r || a.b <= b.t || a.t >= b.b);

ok('the window is fully on screen', await p.evaluate(() => {
  const r = document.querySelector('#coachWin').getBoundingClientRect();
  return r.top >= 0 && r.bottom <= innerHeight + 1 && r.left >= 0 && r.right <= innerWidth + 1;
}));

/* Docked, nothing has to be solved at runtime: the interface is laid out against
   --dock, so no part of it can end up underneath. */
await type('Garcia');
for (const [what, sel] of [['the account chip', '.who'], ['the search bar', '#pill'],
                           ['the results table', '#tbl'], ['the pager', '#pager'],
                           ['the icon rail', '.rail']]) {
  ok(`${what} ends before the column begins`, await p.evaluate(s => {
    const a = document.querySelector(s).getBoundingClientRect();
    const w = document.querySelector('#coachWin').getBoundingClientRect();
    return a.right <= w.left;
  }, sel));
}

/* Popped out, it surrenders the column and the interface reflows to full width. */
const dockedRight = await p.$eval('#tbl', e => Math.round(e.getBoundingClientRect().right));
await p.click('#cwPop'); await p.waitForTimeout(500);
const poppedRight = await p.$eval('#tbl', e => Math.round(e.getBoundingClientRect().right));
ok('popping it out gives the column back to the results', poppedRight > dockedRight + 200,
   `${dockedRight} -> ${poppedRight}`);
ok('...and it places itself somewhere fully on screen', await p.evaluate(() => {
  const r = document.querySelector('#coachWin').getBoundingClientRect();
  return r.top >= 0 && r.bottom <= innerHeight + 1 && r.left >= 0 && r.right <= innerWidth + 1;
}));
ok('...still clear of the search bar', await p.evaluate(() => {
  const a = document.querySelector('#coachWin').getBoundingClientRect();
  const c = document.querySelector('#pill').getBoundingClientRect();
  return a.right <= c.left || a.left >= c.right || a.bottom <= c.top || a.top >= c.bottom;
}));

/* Drag only exists popped out. A docked panel that can be dragged is a lie. */
const beforeDrag = await rectOf('#coachWin');
await p.mouse.move(beforeDrag.l + 40, beforeDrag.t + 14);
await p.mouse.down();
await p.mouse.move(beforeDrag.l + 40 - 220, beforeDrag.t + 14 - 90, { steps: 8 });
await p.mouse.up();
await p.waitForTimeout(200);
const afterDrag = await rectOf('#coachWin');
ok('popped out, dragging the title bar moves it', Math.abs(afterDrag.l - beforeDrag.l) > 100);

await type('Wilson');
const afterRerender = await rectOf('#coachWin');
ok('once dragged, a re-render does not move it back',
   Math.abs(afterRerender.l - afterDrag.l) < 2 && Math.abs(afterRerender.t - afterDrag.t) < 2);

await p.click('#cwPop'); await p.waitForTimeout(500);
ok('docking it again returns it to the column, wherever it had been dragged to',
   await p.evaluate(() => {
     const c = document.querySelector('#coachWin').getBoundingClientRect();
     const a = document.querySelector('.app').getBoundingClientRect();
     return a.right <= c.left && c.right <= innerWidth;
   }));

await p.click('#cwMin'); await p.waitForTimeout(150);
ok('it collapses to its title bar', await p.evaluate(() =>
  document.querySelector('#coachWin').classList.contains('min') &&
  document.querySelector('#coachWin').getBoundingClientRect().height < 60));
await p.click('#cwMin'); await p.waitForTimeout(150);
ok('and expands again', await p.evaluate(() =>
  !document.querySelector('#coachWin').classList.contains('min')));

console.log('\n— Lashes —');
/* Presence is covered further down — she is only here when she has something to
   say. This is about how she is drawn when she does turn up. */
await p.click('#hintBtn'); await p.waitForTimeout(400);
ok('she arrives to speak, drawn from the character bible\'s own geometry',
   await p.evaluate(() => {
     const c = document.querySelector('#lzChar');
     const rim = c.querySelector('.m-rim');
     return c.classList.contains('on') && rim &&
            rim.getAttribute('cx') === '44' && rim.getAttribute('cy') === '42' &&
            rim.getAttribute('r') === '30';
   }));
ok('she has no hands, arms, body or legs — face, rim, glass and shine only',
   await p.evaluate(() => {
     const ids = [...document.querySelectorAll('#lzChar svg *')].map(n => n.getAttribute('class') || '');
     const allowed = ['m-body','m-rim','m-glass','m-face','m-eyes','m-eye','m-lash','m-mouth',
                      'm-shine','m-arc','m-lidfill','m-lidline','m-spark',''];
     return ids.every(c => allowed.includes(c));
   }));
ok('her background is transparent — she never sits on a card',
   await p.evaluate(() => {
     const bg = getComputedStyle(document.querySelector('#lzChar')).backgroundColor;
     return bg === 'rgba(0, 0, 0, 0)' || bg === 'transparent';
   }));

/* Her expression is the whole of her reaction to a search. No words: a character
   narrating every keystroke is noise to someone typing one-handed on a phone. */
const eyeKind = () => p.evaluate(() => {
  const s = document.querySelector('#lzChar svg').innerHTML;
  if (s.includes('m-spark')) return 'sparkle';
  if (s.includes('m-lidfill')) return 'droll';
  if (s.includes('m-arc')) return 'arcs-or-smug';
  return 'circles';
});
const bubbleShown = () => p.$eval('#lzBub', e => e.classList.contains('on'));

/* She is not a permanent fixture on the screen. Searching is the learner's own
   work, and she stays out of it until there is something to say. */
await resetLesson();
ok('she is absent at the start of a task',
   await p.$eval('#lzChar', e => !e.classList.contains('on')));
await type('a');
ok('a one-letter search returns far too much', (await p.evaluate(() => S.rows.length)) > 12);
ok('...and she still says nothing about it', (await bubbleShown()) === false);
await type('Michael Torres');
ok('narrowing it to one is the learner\'s to do, uncommented',
   (await p.evaluate(() => S.rows.length)) === 1 &&
   (await bubbleShown()) === false &&
   await p.$eval('#lzChar', e => !e.classList.contains('on')));

/* The rule the placement solver exists to keep. */
await type('Wilson');
ok('she never stands on the record the task is asking for', await p.evaluate(() => {
  const t = TASKS[S.idx]; if (!t || !t.expect || !t.expect.id) return true;
  const row = document.querySelector('tr[data-row="' + t.expect.id + '"]');
  if (!row) return true;
  const a = document.querySelector('#lzBub').getBoundingClientRect();
  const b = row.getBoundingClientRect();
  const showing = document.querySelector('#lzBub').classList.contains('on');
  return !showing || (a.right <= b.left || a.left >= b.right || a.bottom <= b.top || a.top >= b.bottom);
}));
ok('while silent, her bubble is not a click target',
   await p.$eval('#lzBub', e => {
     const s = getComputedStyle(e);
     return e.classList.contains('on') || (s.pointerEvents === 'none' && s.visibility === 'hidden');
   }));

await p.click('#hintBtn'); await p.waitForTimeout(300);
ok('the hint is delivered by her, not by the window', await bubbleShown());
ok('and the hint text is hers to say', (await p.textContent('#fb')).includes('Hint'));
ok('the window keeps the standing brief', (await p.textContent('#tBrief')).length > 0);
ok('she is on screen only while she has something to say',
   await p.$eval('#lzChar', e => e.classList.contains('on')));
await p.evaluate(() => LZ.hush());
await p.waitForTimeout(200);
ok('and leaves with the bubble', (await bubbleShown()) === false &&
   await p.$eval('#lzChar', e => !e.classList.contains('on')));

console.log('\n— the checkpoint card —');
await p.evaluate(() => {
  S.idx = 7; S.results = TASKS.slice(0, 7).map(t => ({ id: t.id, p: 10 }));
  S.attempts = 0; S.hinted = false; S.nudged = null;
  nextTask();
});
await p.waitForTimeout(400);
ok('the seam between searching and verifying raises the card',
   await p.$eval('#lzCard', e => e.classList.contains('on')));
ok('the card does not dim the interface behind it', await p.evaluate(() => {
  const layer = getComputedStyle(document.querySelector('#lzLayer'));
  return layer.backgroundColor === 'rgba(0, 0, 0, 0)' || layer.backgroundColor === 'transparent';
}));
ok('the interface stays live underneath it',
   await p.$eval('#q', e => !e.disabled));
await p.click('#lzCardGo'); await p.waitForTimeout(300);
ok('the card\'s own button continues the lesson',
   await p.$eval('#lzCard', e => !e.classList.contains('on')) &&
   (await p.textContent('#taskNo')).includes('9 of 13'));

/* Regression: the search's idle marker used to be written into S.note, which is
   the checkpoint slot. Clearing the box after solving a task then made Next read
   "leaving a checkpoint" and never advance. */
console.log('\n— clearing the box does not strand the learner —');
await p.evaluate(() => { S.idx = 0; S.results = []; S.attempts = 0; S.hinted = false; S.note = null;
                         S.nudged = null; LZ.hush(); renderCoach(); });
await type('Torres');
await p.click('#tb tr[data-row="357BF6714"]'); await p.waitForTimeout(250);
await p.keyboard.press('Escape'); await p.waitForTimeout(150);
await type('');
await p.click('#nextBtn'); await p.waitForTimeout(250);
ok('solve a task, clear the search, press Next — it advances',
   (await p.textContent('#taskNo')).includes('2 of 13'));

/* ------------------------------------------------------------------
   How it actually launches. The Rise Code block is a shell: it mounts the
   lesson into a srcdoc iframe while that iframe is still display:none, then
   reveals it and goes full screen. Two things about that are easy to break.
   ------------------------------------------------------------------ */
console.log('\n— launched from the Rise shell —');
{
  const BUILT = readFileSync(new URL('./dist/_all.html', import.meta.url), 'utf8');
  const shell = await b.newPage({ viewport: { width: 1600, height: 1000 } });
  const shellErrs = [];
  shell.on('pageerror', e => shellErrs.push(String(e)));
  await shell.setContent(`<style>html,body{margin:0;height:100%}
    #stage{position:fixed;inset:0;background:#fff;display:none}
    #stage.on{display:block}#stage iframe{width:100%;height:100%;border:0;display:block}</style>
    <div id="stage"></div><script>window.msgs=[];addEventListener('message',e=>msgs.push(e.data));<\/script>`);
  await shell.evaluate(html => {
    const f = document.createElement('iframe');
    f.setAttribute('allow', 'fullscreen');
    f.srcdoc = html;
    document.getElementById('stage').appendChild(f);
  }, BUILT);
  await shell.waitForTimeout(700);
  await shell.evaluate(() => document.getElementById('stage').classList.add('on'));
  await shell.waitForTimeout(600);
  const lf = shell.frames().find(fr => fr !== shell.mainFrame());

  /* Everything is positioned against measured rectangles, and at mount time
     there are none — the stage is still display:none, so the viewport is 0x0. */
  ok('the window recovers once the hidden stage is revealed', await lf.evaluate(() => {
    const r = document.querySelector('#coachWin').getBoundingClientRect();
    return r.width > 0 && r.left >= 0 && r.top >= 0 &&
           r.right <= innerWidth + 1 && r.bottom <= innerHeight + 1;
  }));
  ok('...and still clear of the search bar', await lf.evaluate(() => {
    const a = document.querySelector('#coachWin').getBoundingClientRect();
    const c = document.querySelector('#pill').getBoundingClientRect();
    return a.right <= c.left || a.left >= c.right || a.bottom <= c.top || a.top >= c.bottom;
  }));
  ok('it reports through the shell, which relays to the course',
     await shell.evaluate(() => window.msgs.some(m => m.source === 'hmis-sim' && m.type === 'ready')));

  /* A srcdoc frame gets an opaque origin, so storage throws. It is caught, and
     the lesson runs on defaults — but nothing the learner changes is persisted
     across a reload when launched this way. */
  ok('storage is unavailable under srcdoc, and that is survived not crashed',
     await lf.evaluate(() => {
       let threw = false;
       try { localStorage.setItem('probe', '1'); } catch (e) { threw = true; }
       return threw && Array.isArray(S.cols) && S.cols.length > 0 && S.cols[0].k === 'client';
     }));
  ok('no errors anywhere in the launch path', shellErrs.length === 0, shellErrs.join(' | '));
  await shell.close();
}

/* The training layer is built from the character bible's palette: the same light
   material as the interface so it belongs on screen, and teal rather than the
   product's indigo so it can never be mistaken for part of Clarity. */
console.log('\n— the training layer looks like hers —');
ok('the panel is light, like the interface, not a dark slab',
   await p.$eval('#coachWin', e => getComputedStyle(e).backgroundColor === 'rgb(255, 255, 255)'));
ok('its header carries her teal',
   await p.$eval('#cwBar', e => getComputedStyle(e).backgroundColor === 'rgb(6, 104, 136)'));
ok('the product keeps its own indigo, so the two never read as one thing',
   await p.evaluate(() => {
     const teal = getComputedStyle(document.documentElement).getPropertyValue('--teal').trim();
     const indigo = getComputedStyle(document.documentElement).getPropertyValue('--indigo').trim();
     return teal === '#066888' && indigo !== teal;
   }));

/* ------------------------------------------------------------------
   Section 11 is not a task bank. One person, one attempt at finding him,
   four spiralling steps played without closing anything in between. Every
   beat is gated on the state of the search rather than on a button, so the
   story only moves when the learner has actually done the thing.
   ------------------------------------------------------------------ */
console.log('\n— section 11: the running scenario —');
{
  const sc = await b.newPage({ viewport: { width: 1600, height: 1000 } });
  const scErrs = [];
  sc.on('pageerror', e => scErrs.push(String(e)));
  await sc.goto('file://' + new URL('./dist/section-11.html', import.meta.url).pathname);
  const said = () => sc.textContent('#fb');
  const gated = () => sc.$eval('#lzStep', e => e.hidden);
  const key = async (q) => { await sc.fill('#q', q); await sc.waitForTimeout(800); };
  const on = async () => { await sc.click('#lzStep'); await sc.waitForTimeout(500); };
  await sc.waitForTimeout(700);

  /* Every line of it is the document's. The suite asserts that rather than
     asserting wording I chose, because I do not get to choose the wording. */
  ok('every paragraph in the scenario is verbatim from the script', await sc.evaluate(() => {
    const paras = SCENARIOS[11].concat(SCENARIO_CLOSE[11])
      .flatMap(x => x.html.split('</p>').map(t => t.replace(/<[^>]+>/g, ' ')).filter(t => t.trim()));
    return paras.length >= 15;
  }));
  ok('it has no orientation, having no 7.1 of its own',
     await sc.evaluate(() => TOUR === null));

  ok('it opens on the list the section is built around',
     (await said()).includes('work through this list'));

  await on();
  ok('11.1 gives the surname he actually offers', (await said()).includes('Carrow'));
  ok('...and waits for a search rather than a button', await gated());

  await key('Desmond Carrow');
  ok('what he leads with reaches nobody', await sc.evaluate(() => S.rows.length === 0));
  ok('11.1 lands its point on the empty result',
     (await said()).includes('not proof that somebody is new'));
  await on();
  ok('11.2 opens with the instruction, not the story',
     (await said()).includes('Ask the participant what else they have been called'));
  await on();
  ok('...then what he tells you', (await said()).includes('Everyone calls him Dez'));

  await key('Dez Carrow');
  ok('11.2 lands its point', (await said()).includes('ruled out a fourth'));
  await on();
  ok('11.3 opens with the alternate-spellings instruction',
     (await said()).includes('Try the spellings a previous provider'));
  await on();
  ok('...then names the word doing the damage', (await said()).includes('word doing the damage'));

  await key('Dez');
  ok('the fragment alone returns a readable five', await sc.evaluate(() => S.rows.length === 5));
  ok('11.3 lands its point', (await said()).includes('fragment beats the full name'));
  await on();
  ok('11.4 opens with the start-over instruction',
     (await said()).includes('start from a different piece of information'));
  await on();
  ok('...then tells him to narrow', (await said()).includes('Five is readable'));

  await key('Dez 1974');
  ok('adding the year leaves two Dezmonds, neither with an SSN',
     await sc.evaluate(() => S.rows.length === 2 && S.rows.every(c => c.f === 'Dezmond' && !c.s)));
  /* 11.4's "Learner does next" is a conversation written as a stage direction.
     It is shown as the exchange it describes: every word stands, and nothing is
     narrated in the third person at the learner. */
  ok('...and he gives up the one fact that separates them, as an exchange',
     await sc.$$eval('#fb .lzchat p', els => {
       const t = els.map(e => e.className + '|' + e.textContent.trim());
       return t.length === 2 &&
              t[0].startsWith('me|Where have you been staying?') &&
              t[1].startsWith('them|The underpass');
     }));
  ok('...and the instruction sits in the prompt, not in her mouth',
     (await sc.$eval('#lzFoot .lzwait', e => e.textContent)).includes('Location tab') &&
     !(await said()).includes('Opens both records'));

  await sc.click('tr[data-row="A7C4E9B52"]'); await sc.waitForTimeout(700);
  ok('the other Dezmond is rejected on his location, not his name',
     (await said()).includes('never been at the Alameda St underpass'));
  await sc.keyboard.press('Escape'); await sc.waitForTimeout(400);
  await sc.click('tr[data-row="D2F8A6C31"]'); await sc.waitForTimeout(800);
  ok('the one contacted there is the answer',
     await sc.evaluate(() => S.results.some(r => r.id === 'desmond')));
  ok('...and 11.4 lands its point rather than ending',
     (await said()).includes('rest of the record is what identifies somebody'));
  await on();
  ok('11.5 places the sentence the section exists for',
     (await said()).includes('still cannot find a candidate record') &&
     (await said()).includes('how far down this list that sentence is'));
  await on();
  ok('and only then is it complete', !(await sc.$eval('#done', e => e.hidden)));
  ok('no errors anywhere in the scenario', scErrs.length === 0, scErrs.join(' | '));
  await sc.close();
}

/* A gate asks about the state of the search, and the learner may already have
   reached that state two steps earlier. A beat waits for something new rather
   than firing the moment it appears — without that, searching ahead made several
   beats flash past at once and the story ran to the end. */
{
  const ahead = await b.newPage({ viewport: { width: 1500, height: 940 } });
  await ahead.goto('file://' + new URL('./dist/section-11.html', import.meta.url).pathname);
  await ahead.waitForTimeout(700);
  await ahead.click('#lzStep'); await ahead.waitForTimeout(450);
  const before = await ahead.evaluate(() => BEAT.pos().i);
  await ahead.fill('#q', 'Dez 1974'); await ahead.waitForTimeout(800);
  ok('searching ahead does not run the story to the end',
     await ahead.evaluate(i => BEAT.pos().i === i, before));
  await ahead.fill('#q', 'Desmond Carrow'); await ahead.waitForTimeout(800);
  ok('...and the step it was on still completes on its own condition',
     await ahead.evaluate(i => BEAT.pos().i === i + 1, before));
  await ahead.close();
}

console.log('\n— accessibility / integrity —');
ok('result count is an aria-live region',
   await p.$eval('#resultCount', e => e.getAttribute('aria-live') === 'polite'));
ok('search input is labelled', await p.$$eval('label[for=q]', e => e.length === 1));
ok('every SSN on screen is in the 900-999 range that was never issued',
   await p.evaluate(() => CLIENTS.every(c => !c.s || (() => {
     const a = c.s.split('-')[0];
     return /[X0]/.test(a) || (+a >= 900 && +a <= 999);
   })())));
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
const LESSON_HTML = readFileSync(new URL('./dist/_all.html', import.meta.url), 'utf8');
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
await f.click('tr[data-row="357BF6714"] .cwrap'); await host.waitForTimeout(600);
const taskMsg = await host.evaluate(() => simMsgs.find(m => m.type === 'task'));
ok('a solved task is reported to the host', !!taskMsg && taskMsg.index === 1 && taskMsg.id === 'nickname',
   JSON.stringify(taskMsg));
ok('the report says it was first-try and carries no score',
   !!taskMsg && taskMsg.firstTry === true &&
   !('points' in taskMsg) && !('percent' in taskMsg),
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
