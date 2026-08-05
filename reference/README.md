# Reference material

Source material the simulations were built against. **Internal reference only — do not
redistribute, and do not embed any of it in a deliverable.**

## Provenance and rights

These are Bitfocus, Inc.'s own product documentation images and article, captured from
the public Clarity Human Services help centre and supplied by the project owner. They are
kept here so future work on fidelity can check the real interface without re-sourcing
them, and because `help.bitfocus.com` is unreachable from the build environment.

Copyright remains with Bitfocus, Inc. Nothing here is reproduced in the built lessons —
the simulations are rebuilt in code, and ship no vendor assets. If this repository ever
stops being private, remove this directory first.

## What's here

`How Do I Search for a Client (New Clarity Interface).pdf`
: The help-centre article, exported to PDF. The page renders are cropped at the right
  margin, but the **embedded images are intact at native resolution** and can be pulled
  out with PyMuPDF — see the extraction note below.

`help-centre-images/`
: The article's images as originally served, at full width and with the animated GIFs
  intact. Better source than the PDF for anything on the right-hand side of the screen.

### The ones that answered real questions

| File | What it settles |
|---|---|
| `Column Selector.6.gif` | Full-width search page — top bar, ⊕ add control, filter + column icons, the column selector panel with its locked **Client** row and **Collapsed Fields** section |
| `google-1745250606670.gif` | The row chevron expanding: **Client ID** (numeric, distinct from the alphanumeric unique identifier), Veteran Status, and **Household Members** listed with avatars and relationships |
| `google-1745250606670.webp` | The column selector's full field list and default checked state |
| `google-1745250391263.webp` | The filter menu — **First Name, Last Name, Alias**, and nothing else |
| `google-1745250451984.webp` | The filter chip value popover (`Search by First Name` → arrow to apply) |
| `Filter Icon.1.webp` | The shipped default column order: **Client · DOB · SSN · ROI** |
| `image4.webp` | Search-as-you-type: `ann gla` matching across first *and* last name |

## HUD Exchange — HMIS Fundamentals Curriculum

`hud-exchange-fundamentals.md` holds extracts from HUD Exchange's own HMIS Fundamentals
course, supplied as screenshots by the project owner and captured as text. It is context for
the lessons, not interface fidelity material.

The owner's filter is recorded there and governs what gets used: **our training is for the
HMIS end user**, so governance, policy, history and federal-reporting structure are dropped
however good the copy is.

## Client Location — modelled without the source, and it shows

`help.bitfocus.com/introduction-to-client-location-data` is still unreachable from here
(403 on CONNECT, same as the search article). The Location feature was built from a guess,
and two frames of a GIF supplied by the owner show the guess was wrong in shape:

| What we built | What the product does |
|---|---|
| A field on the Profile card | **Its own page**, headed `CLIENT LOCATION` |
| A dated list of place names | A **map with lettered pins** — A, B, D, G — plus a red one |
| Free-text places, e.g. "6th Street bridge" | **Addresses**, entered through an address field with suggestions |
| No way to add one | `ADD ADDRESS ⊕`, opening an `ADD LOCATION` dialog with an Address field, a map, a **Current location** control and a **Limit geographic area address suggestions** toggle |

Still unknown, and needed before this is rebuilt properly: whether locations carry dates,
what the pin letters signify and whether they are ordered, whether there is a list view
alongside the map, and what the red pin means as against the lettered ones.

Until that is settled the simulation's Location display is **provisional and known to be
wrong** — not a fidelity reference. The underlying task is sound: two records the
identifiers cannot separate, told apart by where the person has been contacted.

## Still missing

- The **Add Client form** — needed for `HMIS BNTS - Create`.
- The **no-results empty state** — the sim's wording is designed, not copied.
- The **client record page** image. It was shared inline in chat and never became a file,
  so it could not be archived. `client-record-page.md` transcribes everything it showed —
  replace that with the real image if it can be re-shared as a file.

## Pulling images out of the PDF

```python
import fitz                                    # pip install pymupdf
d = fitz.open("How Do I Search for a Client (New Clarity Interface).pdf")
for pi, page in enumerate(d):
    for ii, info in enumerate(page.get_images(full=True)):
        px = fitz.Pixmap(d, info[0])
        if px.n - px.alpha > 3:
            px = fitz.Pixmap(fitz.csRGB, px)
        px.save(f"p{pi+1:02d}_{ii}.png")
```

Sample frames from an animated GIF with `PIL.ImageSequence` — the useful content is often
late in the animation, well past the first frame.
