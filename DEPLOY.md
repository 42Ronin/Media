# Publishing to Vercel

The repo builds a static site. Connect it once and every push republishes.

## Connecting it

In Vercel: **Add New → Project**, import `42Ronin/Media`, and it should read
`vercel.json` and need nothing else. If it asks, the settings are:

| | |
|---|---|
| Framework preset | **Other** |
| Build command | `node tools/build_site.mjs` |
| Output directory | `public` |
| Install command | *(leave empty — there are no dependencies)* |

Node is all the deploy needs. There is no `npm install` to run, no lock file, and
nothing is fetched at build time.

## What the deploy actually does

`tools/build_site.mjs` **collects and renames. It does not build a lesson.**

`dist/` is committed on purpose — the root `CLAUDE.md` explains why — so the deploy
copies the already-built pages and zips into `public/` under clean URLs and writes
the front page. That keeps the build image down to Node: no Python, no `zip`, no
Playwright, nothing that can drift between your machine and theirs.

**So a change is not live until it is built and committed.** Edit a lesson, run its
build, commit the `dist/`, push. Pushing source alone republishes the old page.

## URLs

```
/                                    the front door
/tools/knowledge-check-maker/        the maker
/tools/scene-editor/
/tools/job-aid-builder/
/tools/lashes-builder/
/lesson-2-search/simulation-1/       page, with its Rise zip beside it
/lesson-2-search/task-embed-1/
/lesson-1-why/how-many-people/       zip only
/prototypes/copperfield/
```

Each lesson page sits beside the zip that goes into Rise, so the front page can
offer both from one card.

## Two things to know

**These pages only report completion when embedded.** Opening one at its own URL
plays it, but `window.parent === window`, so nothing is posted and no Rise block
is marked done. That is deliberate and unrelated to hosting.

**Every page is self-contained.** No CDN, no fonts, no analytics — verified by
loading them from a real server and asserting zero off-origin requests. If a
future change adds a fetch, it will break offline use and the tests will say so.

## Locally

```bash
node tools/build_site.mjs      # writes public/ and index.html
cd public && python3 -m http.server 8000
```

`index.html` at the root is the same page with repo-relative links, committed so
there is something to open with no server at all. `public/` is generated and
gitignored.
