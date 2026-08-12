import { chromium } from 'playwright';
import { existsSync, writeFileSync, statSync, mkdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const D = dirname(fileURLToPath(import.meta.url));
const SAMPLE = join(D, 'sample');
const IMGS = [1,2,3].map(n => join(SAMPLE, `photo-${n}.jpg`));
const WAV  = join(SAMPLE, 'narration.wav');

/* 20 s of quiet placeholder narration, written with no dependencies so the
   tests run on a clean checkout. Not committed — it is 900 KB of nothing. */
function makeWav(path, secs = 20, rate = 22050) {
  const n = secs * rate, d = Buffer.alloc(n * 2);
  for (let i = 0; i < n; i++) {
    const t = i / rate;
    const v = Math.sin(2 * Math.PI * 220 * t) * 0.06 * (0.5 + 0.5 * Math.sin(t * 1.7));
    d.writeInt16LE(Math.round(v * 32767), i * 2);
  }
  const h = Buffer.alloc(44);
  h.write('RIFF', 0); h.writeUInt32LE(36 + d.length, 4); h.write('WAVE', 8);
  h.write('fmt ', 12); h.writeUInt32LE(16, 16); h.writeUInt16LE(1, 20);
  h.writeUInt16LE(1, 22); h.writeUInt32LE(rate, 24); h.writeUInt32LE(rate * 2, 28);
  h.writeUInt16LE(2, 32); h.writeUInt16LE(16, 34);
  h.write('data', 36); h.writeUInt32LE(d.length, 40);
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, Buffer.concat([h, d]));
}
if (!existsSync(WAV)) makeWav(WAV);

const CHROME = process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium';

let pass=0,fail=0;
const ok=(n,c,x='')=>{c?(pass++,console.log('  PASS  '+n)):(fail++,console.log('  FAIL  '+n+(x?'  -> '+x:'')));};
const b=await chromium.launch({executablePath:CHROME,args:['--autoplay-policy=no-user-gesture-required']});

/* ---------- author a project in the editor, then export ---------- */
const ed=await b.newPage({viewport:{width:1500,height:950}});
const edErrs=[]; ed.on('pageerror',e=>edErrs.push(String(e)));
await ed.goto('file://'+join(D,'scene-editor.html'));
await ed.click('#gClose');
await ed.setInputFiles('#fImgs',IMGS);
await ed.waitForTimeout(700);
await ed.setInputFiles('#fAudio',[WAV]);
await ed.waitForTimeout(1500);
await ed.evaluate(()=>{
  P.scenes[0].keys=[{t:0,s:1.8,x:-18,y:-12},{t:3,s:1.0,x:0,y:0},{t:6,s:1.8,x:18,y:12}];
  P.scenes[0].lines=[{t:0.4,text:'A cold morning on the corner of 6th and San Pedro.'},
                     {t:3.2,text:'Someone is sleeping in a doorway.'}];
  P.scenes[1].lines=[{t:0.4,text:'You have met him before, but you are not sure of his name.'}];
  P.scenes[1].hold=true;
  P.scenes[2].lines=[{t:0.4,text:'Before you add a record, you search.'}];
  renderAll();
});
console.log('\n— the editor exports —');
ok('an Export HTML button is on the toolbar', await ed.$$eval('#exportHtml',e=>e.length)===1);
const html=await ed.evaluate(()=>buildHTML());
writeFileSync(join(D,'intro-export.html'),html);
const kb=Math.round(statSync(join(D,'intro-export.html')).size/1024);
ok('it produced one HTML document', /^<!doctype html>/i.test(html) && /<\/html>/.test(html.trim()), html.slice(0,40));
console.log('        file is '+kb+' KB');

console.log('\n— it is genuinely self-contained —');
const srcs=[...html.matchAll(/(?:src|href)\s*=\s*"([^"]*)"/g)].map(m=>m[1]);
ok('every src/href is a data: URL, nothing remote or relative',
   srcs.every(s=>s===''||s.startsWith('data:')), JSON.stringify(srcs.map(s=>s.slice(0,24))));
ok('no http(s) reference anywhere in the file', !/https?:\/\//.test(html),
   (html.match(/https?:\/\/[^"'\s)]{0,40}/)||[''])[0]);
ok('the three photos are embedded', (html.match(/data:image\//g)||[]).length>=3);
ok('the narration is embedded', /data:audio\//.test(html));
ok('the player script is inside it', /<script>/.test(html) && /requestAnimationFrame/.test(html));

/* ---------- drive the exported file ---------- */
const p=await b.newPage({viewport:{width:1280,height:800}});
const errs=[]; p.on('pageerror',e=>errs.push(String(e)));
const reqs=[]; p.on('request',r=>{ if(!r.url().startsWith('data:')&&!r.url().startsWith('file://')) reqs.push(r.url()); });
await p.goto('file://'+join(D,'intro-export.html'));
await p.waitForTimeout(600);

console.log('\n— opening it —');
ok('it opens behind a Begin gate', !(await p.$eval('#startGate',e=>e.hidden)) &&
   (await p.textContent('#startGate')).includes('Begin'));
ok('the first photo is already loaded', await p.$eval('#pic',e=>e.src.startsWith('data:image/')));
ok('the total run time is shown', /\/ 0:18/.test(await p.textContent('#time')), await p.textContent('#time'));

console.log('\n— it plays: images, motion, captions, audio —');
await p.click('#begin');
await p.waitForTimeout(900);
ok('the gate closes and it starts', await p.$eval('#startGate',e=>e.hidden) && await p.evaluate(()=>playing===true));
ok('the narration is playing', await p.evaluate(()=>!!A && !A.paused && A.currentTime>0.2));
ok('a caption is on screen', (await p.textContent('#cap')).includes('cold morning'));
const t1=await p.$eval('#pic',e=>e.style.transform+'|'+e.style.width);
await p.waitForTimeout(1300);
const t2=await p.$eval('#pic',e=>e.style.transform+'|'+e.style.width);
ok('the camera is moving', t1!==t2, t2);
ok('the progress bar is filling', await p.$eval('#fill',e=>parseFloat(e.style.width))>5,
   await p.$eval('#fill',e=>e.style.width));
await p.waitForTimeout(1400);
ok('the caption changes on cue', (await p.textContent('#cap')).includes('doorway'),
   await p.textContent('#cap'));
ok('motion passes through the middle keyframe (zoomed out at 3s)', await p.evaluate(()=>{
  const s=window.D.scenes[0];
  const a=frameAt(s,0), m=frameAt(s,3), z=frameAt(s,6);
  return a.s>1.7 && m.s<1.05 && z.s>1.7 && a.x<0 && z.x>0;
}));

console.log('\n— pause and scrub —');
await p.click('#pp');
await p.waitForTimeout(300);
ok('pause stops the clock and the audio', await p.evaluate(()=>playing===false && (!A||A.paused)));
const held1=await p.$eval('#pic',e=>e.style.transform);
await p.waitForTimeout(500);
ok('nothing moves while paused', await p.$eval('#pic',e=>e.style.transform)===held1);
// dragging the track back is what a learner does when they miss a line
const box = await p.$eval('#track', e => { const r = e.getBoundingClientRect();
  return {x:r.left, y:r.top + r.height/2, w:r.width}; });
await p.mouse.click(box.x + box.w * 0.25, box.y);
await p.waitForTimeout(300);
ok('clicking the track scrubs to that point', await p.evaluate(()=>Math.abs(clock-4.5)<0.6),
   await p.evaluate(()=>clock.toFixed(2)));
ok('and the frame repaints to match', (await p.textContent('#cap')).includes('doorway'),
   await p.textContent('#cap'));
await p.click('#pp'); await p.waitForTimeout(300);
ok('play resumes from where it was scrubbed to',
   await p.evaluate(()=>playing===true && clock>4 && clock<7), await p.evaluate(()=>clock.toFixed(2)));

console.log('\n— a hold stops for the learner —');
await p.evaluate(()=>{ clock=11.7; if(A) A.currentTime=11.7; });
await p.waitForTimeout(700);
ok('it stops at the end of the held scene', await p.evaluate(()=>held===true));
ok('a Continue button is offered', !(await p.$eval('#holdGate',e=>e.hidden)));
ok('the narration pauses with it', await p.evaluate(()=>A.paused));
const hp=await p.$eval('#pic',e=>e.style.transform);
await p.waitForTimeout(500);
ok('the picture is frozen', await p.$eval('#pic',e=>e.style.transform)===hp);
await p.click('#holdGo'); await p.waitForTimeout(600);
ok('Continue resumes playback', await p.evaluate(()=>held===false && playing===true && !A.paused));
ok('the third photo is now on screen',
   await p.evaluate(()=>document.querySelector('#pic').src===window.D.scenes[2].img));
ok('and its caption with it', (await p.textContent('#cap')).includes('you search'),
   await p.textContent('#cap'));

console.log('\n— it ends properly —');
await p.evaluate(()=>{ clock=17.9; if(A) A.currentTime=17.9; });
await p.waitForTimeout(700);
ok('an end card appears', !(await p.$eval('#endGate',e=>e.hidden)));
ok('the narration has stopped', await p.evaluate(()=>A.paused));
ok('Replay is offered', (await p.textContent('#endGate')).includes('Replay'));
await p.screenshot({path:join(D,'shot-export-end.png')});
await p.click('#replay'); await p.waitForTimeout(500);
ok('Replay starts it over from the top',
   await p.evaluate(()=>playing===true && clock<2 && cur===0));
ok('and the first photo is back', await p.evaluate(()=>document.querySelector('#pic').src===window.D.scenes[0].img));

console.log('\n— nothing was fetched, nothing threw —');
ok('no network requests at all', reqs.length===0, reqs.join(' | '));
ok('no JS errors in the exported player', errs.length===0, errs.join(' | '));
ok('no JS errors in the editor', edErrs.length===0, edErrs.join(' | '));

await p.evaluate(()=>{ pause(); seek(0.08); });   // seek takes a fraction of the whole
await p.waitForTimeout(400);
await p.screenshot({path:join(D,'shot-export-play.png')});
await b.close();
console.log(`\n${pass} passed, ${fail} failed\n`);
process.exit(fail?1:0);
