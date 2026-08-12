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

## Client Location — now sourced

`Introduction to Client Location Data (Bitfocus help article).pdf` is the article, supplied
by the owner because `help.bitfocus.com` is unreachable from here. It settles what two GIF
frames could not.

**Four ways location gets recorded**, and only the first two matter for a search lesson:

| Type | Recorded from | Shows in the Location tab |
|---|---|---|
| **Field Interaction** | the Location tab's locate button | yes |
| **Address** | `ADD ADDRESS` in the Location tab. Carries **name, address type and notes** | yes |
| Geolocation Field | a Geolocation field on a screen — Assessment, Profile, Status, Enrollment, Exit, Follow-up | only if Outreach is enabled |
| Geolocation-enabled Service Item | a service item with Enable Geolocation on | only if Outreach is enabled |

That last column matters: **Field Interaction and Address records show in the Location tab
without Outreach being enabled.** Since Outreach is out of scope for this lesson, those are
the two types the simulation should model, and it can show them honestly.

**Viewing.** Locations are seen collectively for one client from the **LOCATION tab**, or
across a Continuum through Outreach. The GIF frames show that tab: a map of the area with
**lettered pins**, `ADD ADDRESS ⊕` and a locate control in the header bar.

**Adding.** Anywhere you add location data you get the **ADD LOCATION** pop-up:

- Search manually by **latitude/longitude, or address details including cross-streets and
  landmarks**. Results sort by proximity to your device, or to your agency's address if the
  browser has no location permission.
- Or move and zoom the map and **drop a pin by clicking**.
- **CURRENT LOCATION** drops a pin from the device — most accurate on a phone with GPS.
- **LIMIT GEOGRAPHIC AREA ADDRESS SUGGESTIONS** restricts results to a radius when the
  administrator has enabled it. The learner can untoggle it.
- Where *Restrict User Visibility by CoC* is on, only users under that CoC's agencies see
  that CoC's **encampments** in the search field.

**One guess that turned out right:** searching by landmark and cross-street is supported,
and encampments are a named search category — so "6th Street bridge" is a legitimate
location value rather than the invention it looked like.

**Still not answered by the article:** whether location records carry a visible date, what
the pin letters signify or how they are ordered, and what the red pin means as against the
lettered ones. The simulation therefore shows locations without dates rather than inventing
them.

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
