/* Author the three Why-HMIS Copperfield boxes THROUGH the maker, so what ships is
   byte-for-byte what pressing Export ZIP produces — not something assembled beside
   the tool that only looks like its output. */
import { chromium } from 'playwright';
import { writeFileSync, mkdirSync } from 'fs';
import { fileURLToPath } from 'url';

/* fileURLToPath, not `.pathname` — every directory above this one has spaces in
   its name and `.pathname` keeps them percent-encoded, so the first version of
   this wrote three zips into a literal `HMIS%20BNTS%20-%20Why/` beside the real
   one and reported success. */
const OUT = fileURLToPath(new URL('../boxes', import.meta.url));
const MAKER = fileURLToPath(new URL('../../tools/kc-maker/kc-maker.html', import.meta.url));
mkdirSync(OUT, { recursive: true });

const BOXES = [
  {
    name: 'How Many People',
    q: 'How many people are experiencing homelessness in Los Angeles County tonight?',
    a: ['Whatever the shelters counted last night',
        "Every agency's number, added together",
        'Whatever the outreach teams saw on the street'],
    fb: 'Every agency could tell you how many people they served. Nobody could add those numbers together, because the same person might appear in five of them. Add them up and you’d overcount badly. Don’t add them up and you’d have no number at all.\n\n' +
        'Without a number, you cannot plan. You don’t know how many beds to fund, how many outreach workers to hire, or which parts of the county need them most. Every decision about where to send help becomes an educated guess — and the cost of guessing wrong is paid by the people still outside.'
  },
  {
    name: 'Already Offered Help',
    q: 'Has this person already been offered help somewhere else?',
    a: ['Ask them, and hope they remember where',
        'Call around the other agencies',
        "Check whether there's a file on them here"],
    fb: 'There was no way to know. A person could be assessed at one agency on Monday and assessed again, from scratch, at another on Thursday — repeating the same difficult history to a second stranger, while the work already done on their behalf sat in a filing cabinet across town.\n\n' +
        'That costs twice. It costs the person, who is asked to relive the hardest parts of their life for no reason, which is draining enough that some people simply stop asking for help. And it costs staff, who spend hours rebuilding information that already existed — hours that could have gone toward actually housing someone.'
  },
  {
    name: 'Did Any Of This Work',
    q: 'Did any of this actually work?',
    a: ['Count how many people the program served',
        'Ask the staff whether it felt like it was working',
        'See whether anyone came back'],
    fb: 'Without a way to follow what happened after someone left a program, there was no honest way to tell which approaches housed people and which ones didn’t. Good ideas and bad ideas looked identical from the outside.\n\n' +
        'So programs were judged on how they sounded rather than on what they achieved. Approaches that genuinely worked struggled to prove it and stayed small. Approaches that didn’t work could continue for years without anyone being able to say so. And people cycled through services that were never going to get them housed, losing time that nobody could give back.'
  },
];

const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const p = await b.newPage({ viewport: { width: 1400, height: 900 } });
const errs = [];
p.on('pageerror', e => errs.push(String(e)));
p.on('console', m => { if (m.type() === 'error') errs.push('console: ' + m.text()); });
await p.goto('file://' + MAKER);
await p.evaluate(() => { try { localStorage.clear(); } catch (e) {} });
await p.reload();
await p.waitForTimeout(300);

for (const box of BOXES) {
  await p.evaluate(() => { try { localStorage.clear(); } catch (e) {} });
  await p.reload();
  await p.waitForTimeout(250);
  await p.selectOption('#kind', 'copperfield');
  await p.waitForTimeout(200);

  await p.fill('#name', box.name);
  await p.fill('#qtext', box.q);
  const tas = await p.$$('#answers textarea');
  for (let i = 0; i < box.a.length; i++) await tas[i].fill(box.a[i]);
  await p.fill('#fbtext', box.fb);
  await p.waitForTimeout(350);

  /* `validate()` HIDES the problem list rather than emptying it, so the list items
     are still in the DOM when everything is fine. Ask whether it is showing. */
  const probs = await p.evaluate(() => document.querySelector('#probs').hidden ? null
    : [...document.querySelectorAll('#probs li')].map(x => x.textContent));
  if (probs) { console.log(`!! ${box.name}:`, probs.join(' ; ')); continue; }

  /* The tool's own export path, called directly rather than clicked, so the bytes
     are the tool's and only the save is ours. */
  const { slug, zip } = await p.evaluate(() => ({
    slug: slug(),
    zip: Array.from(zipOne('index.html', new TextEncoder().encode(pageHTML()))),
  }));
  writeFileSync(`${OUT}/${slug}.zip`, Buffer.from(zip));
  console.log(`  ${slug}.zip  ${zip.length.toLocaleString()} bytes   "${await p.textContent('#okline')}"`);
}

console.log('errors:', errs.join(' | ') || 'none');
await b.close();
