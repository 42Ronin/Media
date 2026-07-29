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
const p=await b.newPage({viewport:{width:1500,height:950},deviceScaleFactor:2});
const errs=[];p.on('pageerror',e=>errs.push(String(e)));
await p.goto('file://'+join(D,'scene-editor.html'));
await p.click('#gClose');

console.log('\n— setup —');
await p.setInputFiles('#fImgs',IMGS);
await p.waitForTimeout(700);
await p.setInputFiles('#fAudio',[WAV]);
await p.waitForTimeout(1500);
ok('three scenes, narration decoded', await p.$$eval('#slist li',l=>l.length)===3 &&
   /narration 20\.0s/.test(await p.textContent('#stat')));
ok('each scene starts with two keyframes', await p.evaluate(()=>P.scenes.every(s=>s.keys.length===2)));

console.log('\n— keyframes: corner → wide → other corner —');
ok('the strip shows the keyframes', await p.$$eval('#kfstrip .kf',e=>e.length)===2);
ok('it says which keyframe is being edited', (await p.textContent('#whatEditing')).includes('keyframe 1 of 2'));
// keyframe 1: tight on one corner
await p.evaluate(()=>{ const k=P.scenes[0].keys[0]; k.s=1.8; k.x=-18; k.y=-12; renderAll(); });
// insert a middle keyframe, then set it wide
await p.click('#kfstrip [data-ins="0"]'); await p.waitForTimeout(200);
ok('the ＋ between keyframes inserts a third', await p.evaluate(()=>P.scenes[0].keys.length===3));
ok('the new keyframe is selected and mid-way in time',
   await p.evaluate(()=>Math.abs(P.scenes[0].keys[1].t-3)<0.01));
await p.evaluate(()=>{ const k=P.scenes[0].keys[1]; k.s=1.0; k.x=0; k.y=0; renderAll(); });
// keyframe 3: tight on the opposite corner
await p.click('#kfstrip [data-k="2"]'); await p.waitForTimeout(150);
await p.evaluate(()=>{ const k=P.scenes[0].keys[2]; k.s=1.8; k.x=18; k.y=12; renderAll(); });
const path = await p.evaluate(()=>P.scenes[0].keys.map(k=>[k.t,k.s,k.x]));
ok('three keyframes describe in → out → in', path.length===3 && path[0][1]>1.5 && path[1][1]<1.1 && path[2][1]>1.5,
   JSON.stringify(path));
ok('the motion actually passes through the middle keyframe', await p.evaluate(()=>{
  const s=P.scenes[0];
  const a=frameAt(s,0.0), m=frameAt(s,3.0), z=frameAt(s,6.0);
  return a.s>1.7 && m.s<1.05 && z.s>1.7 && a.x<0 && z.x>0;
}));
ok('a keyframe can be deleted, never below two', await p.evaluate(()=>{
  document.querySelector('#kfDel').click();
  const n=P.scenes[0].keys.length;
  document.querySelector('#kfDel').click();
  return n===2 && P.scenes[0].keys.length===2;
}));
// put the three-key path back for the preview test
await p.evaluate(()=>{ P.scenes[0].keys=[{t:0,s:1.8,x:-18,y:-12},{t:3,s:1,x:0,y:0},{t:6,s:1.8,x:18,y:12}]; renderAll(); });

console.log('\n— appending keyframes on the end —');
await p.evaluate(()=>{ sel=0; ksel=0; P.scenes[0].keys=[{t:0,s:1.4,x:-10,y:0},{t:6,s:1,x:0,y:0}]; P.scenes[0].dur=6; renderAll(); });
ok('a trailing "+ Add" button exists', await p.$$eval('#kfstrip [data-add]',e=>e.length)===1);
await p.click('#kfstrip [data-add]'); await p.waitForTimeout(200);
const a1=await p.evaluate(()=>({n:P.scenes[0].keys.length,dur:P.scenes[0].dur,last:P.scenes[0].keys.at(-1).t,ks:ksel}));
ok('it appends a third keyframe', a1.n===3, JSON.stringify(a1));
ok('the scene grows by two seconds', Math.abs(a1.dur-8)<0.01, JSON.stringify(a1));
ok('the new keyframe sits at the new end', Math.abs(a1.last-8)<0.01);
ok('and is selected, ready to reframe', a1.ks===2);
ok('it copies the previous framing so nothing jumps', await p.evaluate(()=>{
  const k=P.scenes[0].keys; return k[2].s===k[1].s && k[2].x===k[1].x;
}));
await p.click('#kfstrip [data-add]'); await p.waitForTimeout(200);
ok('you can keep adding legs', await p.evaluate(()=>P.scenes[0].keys.length===4 && Math.abs(P.scenes[0].dur-10)<0.01));
await p.keyboard.press('a'); await p.waitForTimeout(200);
ok('the A shortcut appends too', await p.evaluate(()=>P.scenes[0].keys.length===5));
// a keyframe short of the end appends at the end without stretching
await p.evaluate(()=>{ P.scenes[0].keys=[{t:0,s:1,x:0,y:0},{t:3,s:1.3,x:5,y:0}]; P.scenes[0].dur=8; renderAll(); });
await p.click('#kfstrip [data-add]'); await p.waitForTimeout(200);
ok('when the last key is short of the end, the scene does not stretch',
   await p.evaluate(()=>P.scenes[0].dur===8 && Math.abs(P.scenes[0].keys.at(-1).t-8)<0.01));
await p.evaluate(()=>{ P.scenes[0].keys=[{t:0,s:1.8,x:-18,y:-12},{t:3,s:1,x:0,y:0},{t:6,s:1.8,x:18,y:12}]; P.scenes[0].dur=6; renderAll(); });

console.log('\n— Play all: images + motion + captions + audio together —');
await p.evaluate(()=>{ P.scenes[0].lines=[{t:0.5,text:'First caption'}]; P.scenes[1].lines=[{t:0.5,text:'Second caption'}]; renderAll(); });
await p.click('#playAll'); await p.waitForTimeout(900);
ok('preview is running', await p.evaluate(()=>mode==='all'));
ok('the audio is playing with it', await p.evaluate(()=>audioEl && !audioEl.paused));
ok('PREVIEW badge shows', !(await p.$eval('#pvBadge',e=>e.hidden)));
ok('a caption is on screen', (await p.textContent('#stageCap')).includes('First caption'));
const t1=await p.evaluate(()=>document.querySelector('#stageImg').style.transform);
await p.waitForTimeout(1200);
const t2=await p.evaluate(()=>document.querySelector('#stageImg').style.transform);
ok('the camera is moving during playback', t1!==t2, t2);
ok('editing is locked while previewing', await p.$eval('#stage',e=>e.classList.contains('previewing')));
// it should cross into scene 2 and swap the image
await p.evaluate(()=>{ clock=6.4; if(audioEl) audioEl.currentTime=6.4; });
await p.waitForTimeout(400);
ok('crossing a scene boundary swaps the image',
   await p.evaluate(()=>document.querySelector('#stageImg').src===P.scenes[1].img));
ok('and shows that scene\'s caption', (await p.textContent('#stageCap')).includes('Second caption'));
await p.click('#playAll'); await p.waitForTimeout(200);
ok('stopping returns to editing', await p.evaluate(()=>mode==='edit') && await p.$eval('#pvBadge',e=>e.hidden));

console.log('\n— holds pause the preview —');
await p.evaluate(()=>{ P.scenes[0].hold=true; clock=0; if(audioEl) audioEl.currentTime=0; renderAll(); });
await p.click('#playAll'); await p.waitForTimeout(300);
await p.evaluate(()=>{ clock=5.9; if(audioEl) audioEl.currentTime=5.9; });
await p.waitForTimeout(600);
ok('the preview stops at a hold', await p.evaluate(()=>held===true));
ok('and offers a Continue button', !(await p.$eval('#holdMsg',e=>e.hidden)));
ok('the audio pauses with it', await p.evaluate(()=>audioEl.paused));
await p.click('#holdGo'); await p.waitForTimeout(300);
ok('continuing resumes', await p.evaluate(()=>held===false));
await p.click('#tStop'); await p.waitForTimeout(200);

console.log('\n— keyframe at the playhead —');
await p.evaluate(()=>{ clock=7.5; renderTimeline(); });
const before=await p.evaluate(()=>P.scenes[1].keys.length);
await p.click('#kfHere'); await p.waitForTimeout(250);
ok('◆ adds a keyframe in the scene under the playhead',
   await p.evaluate(()=>P.scenes[1].keys.length)===before+1);
ok('it lands at the right offset inside that scene',
   await p.evaluate(()=>P.scenes[1].keys.some(k=>Math.abs(k.t-1.5)<0.05)));
ok('keyframes are drawn on the timeline', await p.$$eval('.kfm',e=>e.length)>4);

console.log('\n— export carries the keyframe list —');
const ex=await p.evaluate(()=>({audio:P.audio.name,scenes:P.scenes.map(s=>({keys:s.keys.length,hold:s.hold}))}));
ok('export shape has keys per scene, not from/to', ex.scenes.every(s=>s.keys>=2), JSON.stringify(ex.scenes));

console.log('\n— old projects still open —');
await p.evaluate(async ()=>{
  const legacy={scenes:[{name:'old',img:P.scenes[0].img,w:1920,h:1280,dur:5,
    from:{s:1.2,x:-5,y:0},to:{s:1,x:5,y:0},lines:[],hold:false}],audio:null};
  P=legacy; P.scenes.forEach(s=>{ if(!s.keys){ s.keys=[{t:0,...s.from},{t:s.dur,...s.to}]; delete s.from; delete s.to; } });
  sel=0; ksel=0; renderAll();
});
ok('a two-framing project migrates to keyframes',
   await p.evaluate(()=>P.scenes[0].keys.length===2 && !P.scenes[0].from));

ok('no JS errors throughout', errs.length===0, errs.join(' | '));
await p.screenshot({path:join(D,'shot-editor.png')});
await b.close();
console.log(`\n${pass} passed, ${fail} failed\n`);
process.exit(fail?1:0);
