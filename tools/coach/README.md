# `tools/coach` — the training panel and the Lashes rig

The movable training window, her drawing, her placement solver and her beat
runner, in one place, so every lesson wears the same clothes.

Before this they lived inside `HMIS BNTS - Search/src/lesson1.template.html`,
which meant Lesson 3's prototypes could not use them and built their own —
a fixed left column in a teal wash, immovable, with her parked in a corner.
That is what "moved away from our look and feel" was.

```
panel.css   the window: dock, drag, pop out, collapse, the title bar, the body chrome
panel.html  the window's shell, with a slot for the lesson's own body
panel.js    the mechanics: dragging, popping, collapsing, autoplacement, setPanelMin
rig.css     Lashes' layer: her char box, bubble, arrow, title card, movement classes
rig.html    that layer's markup
rig.js      LZ (placement, expressions, bubbles, the pointing arrow) and BEAT
assemble.py stamps all six into a lesson template, plus her face from tools/lashes
```

## Using it

A lesson template carries six tokens and supplies its own panel body:

```html
<style> … /*__PANEL_CSS__*/  /*__RIG_CSS__*/ … </style>
<!--__PANEL_HTML__-->        <!--__RIG_HTML__-->
<script> … /*__RIG_JS__*/ … /*__PANEL_JS__*/ … </script>
```

```bash
python3 ../tools/coach/assemble.py src/lesson.template.html out.html src/panel-body.html
```

`assemble.py` fills them, then fills the face tokens that `rig.css` and `rig.js`
bring with them from `tools/lashes/face.{js,css}`. **Every token must appear
exactly once** — the rule the knowledge check learned the expensive way, where a
token named a second time stamped the payload into a comment.

Order is fixed and nesting is why: `panel.html` carries the body slot, and
`rig.css`/`rig.js` each carry a face token, so the outer stamp has to land first.

## What the lesson still owns

The panel body — progress, the task copy, the buttons — and everything it says.
The shell gives you `#coachWin`, `#cwBar`, `#cwHelp`, `#cwPop`, `#cwMin` and an
empty `#secTitle` for the lesson's JS to fill. Shipping one lesson's section name
in the shared shell is a string waiting to be wrong in the lesson that forgets to
set it.

`panel.js` expects `$()`, `LZ` and — if the lesson has one — `setPanelMin`'s
callers. `rig.js` expects `#lzLayer`, `#lzChar`, `#lzBub`, `#lzCard` from
`rig.html` and the CSS custom properties Lesson 1's `:root` defines
(`--teal`, `--teal-dk`, `--coach*`, `--lens`, `--focus`).

## Two things this move fixed

**Her drop-in had never played.** `rig.css` carried a bare `.lzchar.still ` — a
selector with no block, left by an old edit. CSS reads on to the next `{`, so the
parser built `.lzchar.still .lzchar.mv-dropin .m-body`, which matches nothing, and
`animation-name` computed to `none`. Measured in a browser, not guessed. Every
checkpoint card in every shipped build arrived without its entrance.

**`tools/lashes/face.js` was a subset.** It had been assembled by hand and was
missing the `glance` and `smug` eyes. The library here is now copied verbatim out
of the rig, which is the same lesson the `.m-lash path` rule taught: copy the
block, do not re-derive it.

## One thing it did not fix

`svg()` takes a viewBox now because the rig genuinely needs a different one. Her
placement maths reads `FX/FY/FR` — fractions **of the 100-square she was authored
in** — so the rig asks for `BOX_FULL` and everything else takes the default crop.
Nothing else should pass it.
