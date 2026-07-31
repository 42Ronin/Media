import { chromium } from 'playwright';
import { writeFileSync } from 'fs';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const p = await b.newPage();
await p.goto('file://' + process.cwd() + '/dist/lesson1-client-search.html');
const data = await p.evaluate(() => {
  const byId = i => CLIENTS.find(c => c.i === i);
  const nm = c => c ? (c.f + ' ' + c.l) : null;
  return {
    tasks: TASKS.map((t, n) => {
      const target = t.expect && t.expect.id ? byId(t.expect.id) : null;
      return {
        n: n + 1, id: t.id, title: t.title, note: !!t.note,
        brief: t.brief || '', ask: t.ask || '', hint: t.hint || '', teach: t.teach || '',
        expectType: t.expect ? t.expect.type : null,
        answerId: t.expect ? (t.expect.id || null) : null,
        answerName: nm(target),
        answerDob: target ? target.d : null,
        answerSsn: target ? target.s : null,
        answerSet: (t.expect && t.expect.ids || []).map(i => {
          const c = byId(i);
          return { id: i, name: nm(c), dob: c ? c.d : null, ssn: c ? c.s : null };
        })
      };
    }),
    interstitials: typeof INTERSTITIALS === 'undefined' ? {} : INTERSTITIALS
  };
});
writeFileSync('/tmp/claude-0/-home-user-Media/6315a6fc-311a-5bd3-ae63-49c3647996b2/scratchpad/tasks.json',
              JSON.stringify(data, null, 2));
console.log('tasks:', data.tasks.length, '| interstitials:', Object.keys(data.interstitials).join(','));
await b.close();
