/**
 * Frame capture for the script's [GIF] placeholders.
 *
 *   node tools/capture.mjs [name ...]      -> gifs/frames/<name>/*.png + steps.json
 *
 * Drives the built simulation and screenshots it a frame at a time, then
 * `tools/gifs.py` assembles each folder into a GIF. Two halves rather than one so
 * the timing can be retuned without re-driving the browser, and so a bad frame can
 * be looked at rather than guessed at.
 *
 * The chrome is stripped at capture time rather than in a separate build: the
 * training panel, the character and the docked column are hidden with injected CSS,
 * so what is filmed is the product surface a learner will meet in the live system,
 * not our teaching furniture around it.
 *
 * Every recipe is search-screen only, which is what the script asks for — nothing
 * here opens a record.
 */
import { chromium } from 'playwright';
import { mkdirSync, rmSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const HERE = dirname(fileURLToPath(import.meta.url));
const PAGE = 'file://' + join(HERE, '..', 'dist', 'simulator-1.html');
const OUT = join(HERE, '..', 'gifs', 'frames');

/* Capture-only styling. Nothing here ships. */
const BARE = `
  #coachWin,#lzLayer,#stepPane{display:none !important}
  html{--dock:0px !important}
  .app{right:0 !important}
  /* the caret keeps blinking through a screenshot run, which reads as flicker
     across frames — hold it on instead */
  #q{caret-color:#3f3d9e}
`;

/* One entry per [GIF] in the script, in the order the script uses them. */
const RECIPES = {
  /* "Results appear as you type" */
  'as-you-type': async (c) => {
    await c.hold(700);
    await c.type('kat joh', { per: 2 });
    await c.hold(1800);
  },
  /* "Every word you add must match" */
  'every-word-matches': async (c) => {
    await c.type('johnson', { per: 3 });
    await c.hold(1100);
    await c.type(' kat', { per: 3 });
    await c.hold(1800);
  },
  /* fragments beat full names */
  'fragments': async (c) => {
    await c.type('katherine johnson', { per: 4 });
    await c.hold(1400);
    await c.clear();
    await c.type('kat joh', { per: 3 });
    await c.hold(1800);
  },
  /* the date of birth, written several ways */
  'date-of-birth': async (c) => {
    for (const q of ['9/26/1976', '09/26/1976', '9.26.1976', '9-26-1976']) {
      await c.clear();
      await c.type(q, { per: 3 });
      await c.hold(1200);
    }
    await c.clear();
    await c.type('1976', { per: 4 });
    await c.hold(1800);
  },
  /* the last four, and a partly recalled number */
  'ssn': async (c) => {
    await c.type('4471', { per: 5 });
    await c.hold(1600);
    await c.clear();
    await c.type('941', { per: 5 });
    await c.hold(1800);
  },
  /* the unique identifier: a name that returns two, then the code alone */
  'unique-identifier': async (c) => {
    await c.type('dez 1974', { per: 3 });
    await c.hold(1800);
    await c.clear();
    await c.type('UID#3906EMKLW', { per: 2 });
    await c.hold(1900);
  },
  /* the chevron, which opens a row without leaving the list */
  'expand-a-row': async (c) => {
    await c.type('dez 1974', { per: 3 });
    await c.hold(900);
    await c.pointTo('[data-exp]');
    await c.click('[data-exp]');
    await c.hold(2000);
  },
  /* a long list, narrowed rather than scrolled */
  'narrow-a-long-list': async (c) => {
    await c.type('garcia', { per: 4 });
    await c.hold(1500);
    await c.type(' esp', { per: 4 });
    await c.hold(1900);
  },
};

const wanted = process.argv.slice(2);
const names = Object.keys(RECIPES).filter(n => !wanted.length || wanted.includes(n));

const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });

for (const name of names) {
  const dir = join(OUT, name);
  rmSync(dir, { recursive: true, force: true });
  mkdirSync(dir, { recursive: true });

  const p = await b.newPage({ viewport: { width: 1180, height: 760 }, deviceScaleFactor: 2 });
  await p.goto(PAGE);
  await p.addStyleTag({ content: BARE });
  await p.waitForTimeout(500);
  /* A synthetic pointer: Playwright's mouse does not render, so a click-driven
     capture would show a row opening on its own. */
  await p.evaluate(() => {
    const d = document.createElement('div');
    d.id = '__cur';
    d.style.cssText = 'position:fixed;z-index:9999;width:22px;height:22px;pointer-events:none;' +
      'opacity:0;transition:left .28s ease,top .28s ease;' +
      'background:no-repeat center/contain url("data:image/svg+xml;utf8,' +
      encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">' +
        '<path d="M5 2l14 10-6 1 3.5 7-3 1.4L10 14l-5 3z" fill="%23fff" stroke="%23222" stroke-width="1.4"/></svg>') + '")';
    document.body.appendChild(d);
  });

  const frames = [];
  const box = await clip(p);
  let n = 0;
  const shot = async (ms) => {
    const file = String(n++).padStart(3, '0') + '.png';
    await p.screenshot({ path: join(dir, file), clip: box });
    frames.push({ file, ms });
  };

  const c = {
    hold: async (ms) => { await p.waitForTimeout(120); await shot(ms); },
    clear: async () => { await p.fill('#q', ''); await p.waitForTimeout(300); await shot(420); },
    /* One frame per character: a GIF of typing is the list moving, and the list
       only moves when a character lands. Far fewer frames than filming at a rate. */
    type: async (text, { per = 3 } = {}) => {
      for (const ch of text) {
        await p.type('#q', ch, { delay: 0 });
        await p.waitForTimeout(260);            // the search debounce is 220ms
        if (n % 1 === 0) await shot(per * 40);
      }
    },
    pointTo: async (sel) => {
      const box = await (await p.$(sel)).boundingBox();
      await p.evaluate(([x, y]) => {
        const d = document.querySelector('#__cur');
        d.style.left = x + 'px'; d.style.top = y + 'px'; d.style.opacity = '1';
      }, [box.x + box.width / 2 - 4, box.y + box.height / 2 - 2]);
      await p.waitForTimeout(360);
      await shot(520);
    },
    click: async (sel) => { await p.click(sel); await p.waitForTimeout(420); await shot(360); },
  };

  await RECIPES[name](c);
  writeFileSync(join(dir, 'steps.json'), JSON.stringify({ name, frames }, null, 1));
  console.log(`${name}: ${frames.length} frames`);
  await p.close();
}
await b.close();

/* The card, plus a little of the ground it sits on. Tight enough to stay legible in
   a Rise column, wide enough that it still reads as the product.
   
   Measured ONCE and reused for every frame: the card grows as results arrive, and a
   clip that tracked it would emit frames of differing size, which a GIF cannot hold.
   The first `.card` in the document is the hidden record card at 0x0 — the one to
   film is the one the search field lives in. */
async function clip(p) {
  return await p.evaluate(() => {
    const r = document.querySelector('#q').closest('.card').getBoundingClientRect();
    const pad = 14;
    return {
      x: Math.max(0, Math.round(r.left - pad)),
      y: Math.max(0, Math.round(r.top - pad)),
      width: Math.round(r.width + pad * 2),
      height: 560,
    };
  });
}
