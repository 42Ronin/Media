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

A later pass audited all nine captures against the build screen by screen and closed
what was left: the no-results header row, the stacked empty state, the plain search
field, the record's full date format and its separate Age field, the stray person icon
on a row, the missing card kebab, the flush location empty state, and popovers clamping
to the window instead of the app. Four larger calls went to the owner and are recorded
in `../../CLAUDE.md`: reproduce **all** of capture 04's sections but closed and dimmed;
match capture 02's expanded row exactly; show the recents hint and real recents on the
landing; keep avatars varied (they confirmed the live account varies them, and also
carries photos — ours stay on initials, since an invented participant cannot be given a
real face).

Two more were built from these captures afterwards:

- **The breadcrumb** (capture 03), on the record page only — capture 01 shows that side of
  the top bar empty on the search landing, which is what keeps it honest as navigation.
- **Point of Contacts** (captures 05 and 06), full width below the profile grid. The captured
  account's test client had all three blocks empty; ours carry invented staff, on fictional
  `213-555-01xx` numbers and `example.org` addresses, because an empty section teaches nothing.

## A second batch, same session

Five more captures the owner supplied after an adversarial fidelity review. They are
described here rather than filed as images, because they arrived in conversation:

| What it showed | What it settled |
|---|---|
| Client Location **with a row in it** | It is a table — `Address` (street over city/state/country/ZIP), `Date`, `Type` (record type over the field it came from), `Created by` (person over organisation), a scope chip and a star, with pagination beneath. Locations **do** carry dates; the earlier "no dates" note came from an article that did not show the column. |
| The Location kebab **open** | Two items: **Add Address**, **Add Field Interaction**. The only product menu we have ever seen open. |
| The profile between Demographics and ADA | Demographics continues with Primary Language, TB Clearance Date, Clinic, DPSS ID, *Reviewed for Covid-19 vulnerability and Project Room Key?* and **FEMA Registration Number** — which is the section's last field, not a heading of its own. Our invented `FEMA` section is gone. |
| The filter menu, and the column selector | Filter order is **Alias, First Name, Last Name**. The selector's headings are sentence case, Client carries a padlock, and **Race and Ethnicity is a column**, not a collapsed-only field. |
| Point of Contacts, in full | First block filled, second and third empty. **Category shows `Select` even on a filled block.** Dates are written out in full (`04/03/2026`) where the Location table abbreviates. |
| The profile in **edit** mode, and the **Add Client** panel | Neither is taught in this lesson. The Add Client panel is a right-hand slide-over with the same fields, Cancel/Save — **the screenshot Lesson 2 has been waiting for.** |

A sixth capture followed: the **results-row kebab open** — *View Enrollments*, *View
Services*, *View History*, a rule, then *Delete Client* in red. Built, obstructed. The
same image also shows a **household glyph before the kebab**, present on clients who
have a household and absent on those who do not; we had removed it.

Two more closed it out: the **Clients-card kebab** (one item, *Restore Deleted Data*)
and the **Point of Contact Category dropdown** — six real LAHSA and DHS programme
names, used verbatim, and left unset on rather more than half of blocks, which is why
`Select` is the ordinary sight there.

## Nothing outstanding

Every kebab in the interface has now been captured open and built. The one thing
found and deliberately **not** built is the *Client refused* name state: the Add
Client capture shows a record filed as **`Refused, 6CD53CE9A`** — surname "Refused",
the unique identifier standing in for a given name. It is real, but it belongs with a
later lesson on participants declining to share data, and reproducing it here would
change what a search finds. Leave it until that lesson exists.

## What they confirm we already had right

- The record's left nav list and its order.
- **Date of Birth is a real field**, listed beside Age — this was an open question in
  `../client-record-page.md` and is now answered.
- The recents hint wording, the filter and column controls beside the search field.
