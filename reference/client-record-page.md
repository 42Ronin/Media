# Client Record page — transcription

The record page was built from a screenshot the owner shared **inline in chat**, which
never became a file, so it could not be archived alongside the other captures. This is a
written transcription of everything that screenshot showed, recorded so the evidence
behind `HMIS BNTS - Search`'s record page survives.

**Replace this with the actual image if it can be re-shared as a file.**

Example client in the capture: *Rosa Monroe*.

## Client header

- Round avatar (a photo, not initials — our sim uses initials, since no photos exist)
- Client name, large
- Subtitle: *"You are currently viewing the Client Record pages for Rosa Monroe."*
- Right side, in order: a **Public Alert** pill (bell icon, red count badge showing `1`),
  a padlock icon, an ⓘ icon, and a chevron

## Left client nav — 16 items, Profile active

Profile · Privacy · Household · History · Programs · Services · Assessments · Care Team ·
Notes · Alerts · Files · Forms · Contact · Location · Referrals · Restrictions

Each has a leading icon. The active item is highlighted in pale indigo.

## Profile card

Heading is the client's name in indigo, subtitle *"Client profile information"*, with a
pencil (edit) and a kebab (⋮) at the top right.

Two-column field grid, label above value, in this order:

| Left | Right |
|---|---|
| Social Security Number — `***-**-` then the last four **obscured** | Quality of SSN — `Full SSN Reported` |
| First name — `Rosa` | Last name — `Monroe` |
| Quality of Name — `Full name reported` | Quality of DOB — `Full DOB Reported` |
| Consent Refused — `No` | |
| Race and Ethnicity — `American Indian, Alaska Native, or Indigenous` | |
| Additional Race and Ethnicity Detail — `No value` | |
| Veteran Status — `No` | |

Empty values render as **`No value`**.

## Right rail — eight cards

Each card: title in indigo, one-line description, a count badge, and a chevron.

| Card | Description | Count |
|---|---|---|
| Program referrals | View programs that the client is currently referred to | 6 |
| Community queues | View community queues that the client is currently referred to | 1 |
| Household | View clients that are currently in the same household | 2 |
| Active programs | View programs that the client is currently enrolled in | 1 |
| Active services | View services that the client is currently receiving | 0 |
| Recent Services and Events | View services and events that the client has recently received | 3 |
| Active Contacts | View active contacts for this client | 1 |
| Care Team | View care team for this client | 3 |

## Two things our build diverges on — both deliberate, both worth revisiting

1. **SSN masking.** The real page masks it as `***-**-####`. Our sim shows the full number,
   per an explicit decision by the owner. Safe either way, because every generated SSN uses
   the never-issued 900–999 range — but it *is* a divergence from the product.

2. **Date of Birth.** The capture shows **Quality of DOB** but no Date of Birth field on
   the profile card. That may be a crop, a permission, or a per-CoC configuration. Our sim
   shows Date of Birth there, because a record page without a DOB would be strange in
   training. Confirm against a live account before treating our version as correct.
