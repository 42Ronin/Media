/* Lesson 3 — Creating a Profile.
 *
 *   npm i playwright && node test.mjs
 *
 * Two things this suite is for. The first is the house rules that are promises
 * rather than preferences: the identifier shape, no score in any message, and one
 * self-contained file that fetches nothing. The second is the shared training
 * panel — that these pages actually wear it, and that wearing it did not cost them
 * the invariant it exists to protect, which is that NOTHING THE PANEL DOES MAY
 * REFLOW THE INTERFACE.
 *
 * Both pages are played IN A FRAME. They only speak when embedded — a top-level
 * play asserts the gate and silently skips the contract that marks the Rise block
 * done, which is exactly how a broken `complete` passes a green run.
 */
import { chromium } from "playwright";
import http from "http";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const DIST = path.join(HERE, "dist");
const PORT = 8123;

let pass = 0, fail = 0;
const ok = (name, cond, detail) => {
  if (cond) { pass++; console.log("  PASS  " + name); }
  else { fail++; console.log("  FAIL  " + name + (detail !== undefined ? "  -> " + JSON.stringify(detail) : "")); }
};
const head = t => console.log("\n— " + t + " —");

const wait = ms => new Promise(r => setTimeout(r, ms));

/* ---------------- the built files, before a browser is involved ------------ */
head("what the build produced");
const pages = ["sim-add-client", "sim-bobbi"];
for (const p of pages) {
  ok(p + ".html exists", fs.existsSync(path.join(DIST, p + ".html")));
  ok(p + ".zip exists", fs.existsSync(path.join(DIST, p + ".zip")));
}

for (const p of pages) {
  const html = fs.readFileSync(path.join(DIST, p + ".html"), "utf8");

  /* Every unique identifier is UID# + four digits + five letters, and never the
     nine hex characters the real product uses — close enough to real data that a
     screenshot of this simulation could be mistaken for it. No I, no O: they read
     as 1 and 0 when an identifier is said aloud. */
  const ids = [...html.matchAll(/UID#([0-9A-Z]+)/g)].map(m => m[1]);
  ok(p + ": every identifier is UID# + 4 digits + 5 letters",
     ids.every(i => /^\d{4}[A-HJ-NP-Z]{5}$/.test(i)), ids);
  const hexish = [...html.matchAll(/>\s*([0-9A-F]{9})\s*</g)].map(m => m[1])
    .filter(s => /[A-F]/.test(s));
  ok(p + ": no nine-character hex identifier anywhere", hexish.length === 0, hexish);

  /* No token survives into a build: an unstamped one means a partial did not land. */
  ok(p + ": no unstamped build token", !/\/\*__[A-Z_]+__\*\//.test(html) &&
                                       !/<!--__[A-Z_]+__-->/.test(html));

  /* Her drawing has one source. The lash strokes are the canary — the first cut of
     face.css was derived by matching rule shapes and silently dropped
     `.m-lash path`, on a character named after them. */
  ok(p + ": carries the shared lash rule",
     html.includes(".m-lash path{fill:none;stroke:#14222b;stroke-width:2.2;stroke-linecap:round}"));

  /* The panel is the series' look, and it comes from tools/coach. */
  ok(p + ": wears the shared training window", html.includes('id="coachWin"') &&
     html.includes('id="cwBar"') && html.includes('id="cwPop"') && html.includes('id="cwMin"'));

  /* Lesson 1's narrow-viewport branch was removed on purpose: the simulation is
     launched full screen on a desktop. The prototypes reintroduced it. */
  ok(p + ": no narrow-viewport branch", !/@media\s*\(max-width/.test(html));

  /* Everything that animates has a way out of it. */
  ok(p + ": honours prefers-reduced-motion", html.includes("prefers-reduced-motion"));
}

/* ---------------- served, in a browser, in a frame ------------------------- */
const srv = http.createServer((q, r) => {
  const f = path.join(DIST, q.url.split("?")[0]);
  let body;
  try { body = fs.readFileSync(f); } catch { r.statusCode = 404; return r.end(); }
  r.setHeader("content-type", "text/html");
  r.end(body);
});
await new Promise(r => srv.listen(PORT, r));
const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });

/* Click through the page's own JS rather than through Playwright: both flows
   disable their buttons while a beat animates, and a driver that races them
   reports a stall the learner would never see. */
const tap  = (fr, s) => fr.evaluate(x => { const e = document.querySelector(x);
  if (e && !e.hidden && !e.disabled) { e.click(); return true; } return false; }, s);
const live = (fr, s) => fr.evaluate(x => { const e = document.querySelector(x);
  return !!e && !e.hidden && !e.disabled; }, s);
async function until(fr, s, ms = 25000) {
  const t = Date.now();
  while (Date.now() - t < ms) { if (await live(fr, s)) return true; await wait(180); }
  return false;
}

async function open(name) {
  const host = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const msgs = [], errs = [], requests = [];
  host.on("pageerror", e => errs.push(String(e)));
  host.on("request", r => {
    const u = r.url();
    /* about:, data: and the page itself are not the network. */
    if (u.startsWith("http://localhost:" + PORT) || u.startsWith("data:") || u === "about:blank") return;
    requests.push(u);
  });
  await host.exposeFunction("_m", o => msgs.push(o));
  await host.setContent(
    `<style>html,body{margin:0;height:100%}iframe{border:0;width:100vw;height:100vh}</style>` +
    `<iframe id="f" src="http://localhost:${PORT}/${name}.html"></iframe>` +
    `<script>addEventListener("message",e=>_m(e.data))<\/script>`);
  await host.waitForTimeout(700);
  return { host, msgs, errs, requests, fr: host.frames().find(f => f.url().includes(name)) };
}

for (const name of pages) {
  head(name + " — in a frame, as Rise embeds it");
  const { host, msgs, errs, requests, fr } = await open(name);

  /* The panel owns a reserved column on the right, and the interface ends at its
     edge. This is the whole difference from the prototypes, which put a solid
     teal column on the LEFT and could not move it. */
  const geom = await fr.evaluate(() => {
    const cw = document.querySelector("#coachWin").getBoundingClientRect();
    const app = document.querySelector(".app").getBoundingClientRect();
    const st = getComputedStyle(document.querySelector("#coachWin"));
    return { dock: getComputedStyle(document.documentElement).getPropertyValue("--dock").trim(),
             onRight: Math.round(cw.left) >= Math.round(app.right) - 2,
             bg: st.backgroundColor,
             bar: getComputedStyle(document.querySelector("#cwBar")).backgroundColor,
             title: document.querySelector("#secTitle").textContent.trim() };
  });
  ok("the window is docked to a reserved column", geom.dock === "428px", geom.dock);
  ok("...on the right, with the interface ending at its edge", geom.onRight);
  ok("...white, with the teal title bar", geom.bg === "rgb(255, 255, 255)" &&
     geom.bar === "rgb(6, 104, 136)", geom);
  /* The shared shell ships #secTitle empty: one lesson's section name baked into
     it is a string waiting to be wrong in the lesson that forgets to set it. */
  ok("...and the lesson has named it", geom.title.length > 0, geom.title);

  /* Nothing the panel does may reflow the interface. Not collapsing it, not
     popping it out — the dock column is reserved whatever state it is in, because
     a search field that changes width under the learner is not something the
     product would ever do. */
  const rects = await fr.evaluate(async () => {
    const R = () => { const a = document.querySelector(".app").getBoundingClientRect();
                      return [Math.round(a.width), Math.round(a.height)]; };
    const before = R();
    document.querySelector("#cwMin").click(); await new Promise(r => setTimeout(r, 330));
    const collapsed = R();
    document.querySelector("#cwMin").click(); await new Promise(r => setTimeout(r, 330));
    document.querySelector("#cwPop").click(); await new Promise(r => setTimeout(r, 330));
    const popped = R();
    document.querySelector("#cwPop").click(); await new Promise(r => setTimeout(r, 330));
    return { before, collapsed, popped, redocked: R() };
  });
  const same = JSON.stringify(rects.before);
  ok("collapsing the panel does not reflow the interface",
     JSON.stringify(rects.collapsed) === same, rects);
  ok("...nor popping it out", JSON.stringify(rects.popped) === same, rects);
  ok("...nor re-docking it", JSON.stringify(rects.redocked) === same, rects);
  ok("the page never scrolls sideways",
     await fr.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth));

  /* Play it to the end. */
  if (name === "sim-bobbi") {
    for (let i = 0; i < 14; i++) {
      if (await fr.evaluate(() => document.querySelector("#save").classList.contains("on"))) break;
      if (!await until(fr, "#next")) break;
      await tap(fr, "#next");
    }
    await until(fr, "#save");
    await tap(fr, "#save");
  } else {
    await tap(fr, "#start"); await wait(250);
    for (let i = 0; i < 9; i++) {
      await until(fr, "#save"); await tap(fr, "#save"); await wait(240);
      await until(fr, "#nextbtn"); await tap(fr, "#nextbtn"); await wait(200);
    }
  }
  await host.waitForTimeout(600);

  /* Her lashes, checked AFTER the play — she is not on screen at the same moment
     in both pages. In add-client she is in the floating layer from boot; in bobbi
     she arrives as a voice in the transcript, so at load there is none of her.
     6 strokes per drawing: the first cut of face.css was derived by matching rule
     shapes and dropped `.m-lash path`, on a character named after them. */
  const lash = await fr.evaluate(() => {
    const groups = [...document.querySelectorAll(".m-lash")];
    const p = groups[0] && groups[0].querySelector("path");
    const cs = p && getComputedStyle(p);
    return { drawings: groups.length,
             strokes: groups.length ? groups[0].querySelectorAll("path").length : 0,
             stroke: cs && cs.stroke, width: cs && cs.strokeWidth, fill: cs && cs.fill };
  });
  ok("she is drawn", lash.drawings > 0, lash);
  ok("...with her lashes, stroked and unfilled",
     lash.strokes === 6 && lash.stroke === "rgb(20, 34, 43)" &&
     lash.width === "2.2px" && lash.fill === "none", lash);

  const types = msgs.map(m => m && m.type);
  ok("it says ready when it is embedded", types.includes("ready"), types);
  ok("...and complete when the learner is done", types.includes("complete"), types);
  ok("...tagged as ours so a host can tell it apart",
     msgs.every(m => m && m.source === "hmis-sim" && m.lesson === "hmis-bnts-create"), msgs);
  /* No score, ever. There is none in these simulations and Rise could not
     receive one. */
  ok("...and carries no score, by decision",
     msgs.every(m => m && !["score", "percent", "correct", "points"].some(k => k in m)), msgs);
  ok("it fetches nothing — one file, as promised", requests.length === 0, requests);
  ok("and it does it without throwing", errs.length === 0, errs);

  await host.close();
}

/* ---------------- the assembler's own rule --------------------------------- */
head("tools/coach/assemble.py");
{
  const { execFileSync } = await import("child_process");
  const tmp = path.join(DIST, "_tokencheck");
  fs.mkdirSync(tmp, { recursive: true });
  /* A token named twice is the failure the knowledge check paid for: Python's
     replace hits both, so the payload lands in a comment as well as in the code. */
  const T = n => "/*" + "__" + n + "__" + "*/";
  const H = n => "<!--" + "__" + n + "__" + "-->";
  const src = path.join(tmp, "twice.html");
  /* A whole panel group, with PANEL_CSS named twice — so this fails for the
     duplicate and not for a missing sibling. */
  fs.writeFileSync(src, "<style>" + T("PANEL_CSS") + T("PANEL_CSS") + "</style>" +
                        H("PANEL_HTML") + "<script>" + T("PANEL_JS") + "<\/script>");
  let failed = false, why = "";
  try {
    execFileSync("python3", [path.join(HERE, "../tools/coach/assemble.py"), src,
                             path.join(tmp, "out.html"),
                             path.join(HERE, "src/panel-body-bobbi.html")],
                 { stdio: ["ignore", "pipe", "pipe"] });
  } catch (e) { failed = true; why = String(e.stderr || e.stdout); }
  ok("a token named twice fails the build", failed && /exactly one/.test(why), why.slice(0, 120));

  /* All-or-nothing per group, so a typo'd token is caught rather than skipped. */
  const half = path.join(tmp, "half.html");
  fs.writeFileSync(half, "<style>" + T("PANEL_CSS") + "</style>");
  let halfFailed = false, halfWhy = "";
  try {
    execFileSync("python3", [path.join(HERE, "../tools/coach/assemble.py"), half,
                             path.join(tmp, "out2.html"),
                             path.join(HERE, "src/panel-body-bobbi.html")],
                 { stdio: ["ignore", "pipe", "pipe"] });
  } catch (e) { halfFailed = true; halfWhy = String(e.stderr || e.stdout); }
  ok("half a group fails the build", halfFailed && /half there/.test(halfWhy), halfWhy.slice(0, 120));
  fs.rmSync(tmp, { recursive: true, force: true });
}

await browser.close();
srv.close();
console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
