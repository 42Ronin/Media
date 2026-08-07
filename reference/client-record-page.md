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

## Two open questions — both settled, August 2026

Both were resolved against the owner's own live account. The captures are in
`live-account-2026-08/`; this section records the answers so neither gets re-litigated.

1. **SSN masking — settled, and the sim now matches.** The product masks it as
   `***-**-####`, and captures 03–06 confirm the older screenshot was not a crop or a
   permission quirk. The sim previously showed the full number by an explicit decision;
   the owner reversed that once the live account confirmed the product's behaviour, so
   `maskSSN()` now renders the same mask. Every stored SSN is still in the never-issued
   900–999 range, so masking is fidelity rather than protection.

2. **Date of Birth — settled in our favour.** The earlier capture showed *Quality of DOB*
   with no Date of Birth field, which looked like our version might be invented. The live
   account carries **both**, so the sim was right. No change needed.

## Deliberately not reproduced

Two things visible in the August captures are left out on the owner's instruction, and
their absence is a decision rather than an omission:

- the four **stat cards** above the results table, and
- the **right-hand rail** on the record page.

Both belong to features these lessons do not teach, and the standing rule is to dim or
drop what the lesson does not need. They can arrive with the lesson that earns them.
