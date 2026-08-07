# Live account captures — August 2026

Nine screenshots of the **current** Clarity interface, taken by the project owner from
their own live LAHSA account on 7 August 2026. Same restriction as the rest of
`reference/`: internal only, never redistributed, never embedded in a deliverable.

**The account holder's name and their test client's details appear in these images and
must not be reproduced anywhere in the build.** The simulation's roster stays fictional.

These supersede the help-centre article captures for anything they disagree on: the
article shows an older build of the product, these show what LAHSA staff see today.

| File | What it settles |
|---|---|
| `01-client-search-landing.png` | Default columns, the Household Members column, the right-hand stat cards, the icon rail |
| `02-row-expanded.png` | Which fields the chevron reveals, and in what order |
| `03-record-profile-top.png` | Breadcrumb bar, masked SSN, the Demographics subheading, the record's right rail |
| `04-record-profile-ada-veteran.png` | ADA / Veteran / TLS Ramp Down / Encampment Resolution sections |
| `05-record-profile-contact.png`, `06-...-2.png` | The Contact section's repeated point-of-contact blocks |
| `07-client-location.png` | Client Location: search field, empty state, then a real tile map below |
| `08-search-no-results.png` | **The no-results wording** — previously designed, now verified |
| `09-search-empty-recents.png` | The recents hint and the header row above it |

## What these change

Recorded in `../../CLAUDE.md` under fidelity. Four of them reverse an earlier decision
and were raised with the owner rather than applied silently:

- **No-results wording.** Ours says `No clients found`. The real one says
  *"No results yet! / Results will be displayed here when they are available."*
  CLAUDE.md had this flagged as designed-not-copied. Changing it invalidates a line of
  scripted copy in slide 11.1, which quotes the old wording.
- **SSN masking.** The real record page masks as `***-**-5330`. The sim shows SSNs in
  full by an explicit earlier decision, which the 900-999 range makes safe.
- **Search-page stat cards.** Active enrollments / Status due / Case manager / Navigator.
  These were removed from the sim in an earlier commit; they are real.
- **The record page's right rail.** Client Portal, then Household / Active programs /
  Active services / Recent Services and Events / Active Contacts / Care Team, each with a
  count and a chevron. Removed from the sim when the training panel took that column.

## Resolved, and how

All four were put to the owner rather than applied silently. The answers:

1. **No-results wording** — changed, in the sim *and* in slide 11.1's copy, which quoted
   the guess. Pinned in `test.mjs` as `EMPTY_STATE`.
2. **SSN masking** — the earlier decision reversed; the sim masks now, via `maskSSN()`.
3. **Stat cards** — stay removed. Not needed by anything these lessons teach.
4. **Right rail** — stays removed, same reason. Both can return with the lesson that uses them.

Two more were built from these captures afterwards:

- **The breadcrumb** (capture 03), on the record page only — capture 01 shows that side of
  the top bar empty on the search landing, which is what keeps it honest as navigation.
- **Point of Contacts** (captures 05 and 06), full width below the profile grid. The captured
  account's test client had all three blocks empty; ours carry invented staff, on fictional
  `213-555-01xx` numbers and `example.org` addresses, because an empty section teaches nothing.

## What they confirm we already had right

- The record's left nav list and its order.
- **Date of Birth is a real field**, listed beside Age — this was an open question in
  `../client-record-page.md` and is now answered.
- The recents hint wording, the filter and column controls beside the search field.
