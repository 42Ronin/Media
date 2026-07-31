# HUD Exchange — HMIS Fundamentals Curriculum

Source notes from the HUD Exchange course (`learn.hudexchange.info`, HMIS Fundamentals
Curriculum), captured from screenshots supplied by the project owner. Federal training
material, gathered here as context for the LAHSA lessons — extracts only, for reference.

**The filter, from the owner:** our training is for the **HMIS end user**. Governance,
policy, history and federal-reporting structure are out of scope, however good the copy is.
What survives is what changes what an end user does at the keyboard, or what tells them why
it matters to the person in front of them.

Batches 1–3, fourteen screenshots. Extend if more arrive.

---

## Keep

### HMIS as third-party documentation of homelessness — the strongest find

> HMIS can be considered a third-party source of documentation for a person's homeless
> status based on the type of project the person is enrolled in. An individual can use
> their HMIS record as third-party documentation of homelessness if they are enrolled in a
> Safe Haven or Entry/Exit emergency shelter, or have an active record in a Night-by-Night
> shelter or Street Outreach project, as shown by a bed night or contact, respectively.

*Why it matters to Lesson 1:* this is the concrete answer to "why does the right record
matter to the participant." The record is not just a record — it is **evidence of their
homelessness**, and that evidence is what qualifies them. A duplicate splits it: the bed
nights and contacts that prove their history sit on the record you did not find. That is a
far better motivation for searching thoroughly than data hygiene, and it lands exactly
where the owner asked the lesson to land — on services provided.

### What HMIS is, in end-user terms

> HMIS is the local data system used by the CoC to collect client-level information on the
> housing and services provided to people experiencing homelessness or at risk of
> homelessness. Simply put, HMIS is the tool communities use to turn individual client
> records into system-wide reports.

> HMIS can help local communities understand how many people are residing in shelters and
> in places not meant for habitation; how many people are chronically or episodically
> homeless; the characteristics and service needs of those served, and which programs are
> most effective at reducing and ending homelessness.

*Why it matters:* "turn individual client records into system-wide reports" is the
one-sentence version of the unduplicated-count argument Lesson 1 already makes. Worth
borrowing the phrasing — it explains the stake without a detour through HUD reporting.

### Learning Objectives as a format element

The HUD Exchange lessons open with numbered learning objectives — four, in a numbered list,
before any content:

> 1. Describe the purpose and history of HMIS.
> 2. Define HMIS participation requirements.
> 3. Identify comparable database requirements and uses.
> 4. Identify data element types and collection requirements for HMIS participation.

*Why it matters:* our script has none, and NHO does not have them either, so I had left them
out as consistent with house style. This is evidence the audience is used to seeing them.
**Open question for the owner** — see below.

---

## Dropped, per the end-user filter

| Content | Why it goes |
|---|---|
| The HMIS Lead role — training users, overseeing data quality, supporting federal reporting | Governance. An end user does not need the org chart. |
| HUD's four categories of the homelessness definition, and misclassification risk | Eligibility policy. Real, but it belongs to an enrollment lesson, not a search one. |
| Federal Partners (HHS, VA), standardising data across federal programs | Policy structure. No keyboard consequence. |
| "HMIS also helps HUD and Congress understand…" | Federal reporting. The local half of the same idea is kept above; this half is not ours. |
| Brief HMIS history | History, explicitly out of scope. |
| Each CoC must choose software meeting HUD standards | Procurement. Interesting, irrelevant here. |

---

## What this changes in the Lesson 1 script

1. **Rework *Why Searching Thoroughly Matters* around third-party documentation.** The
   current copy leads on wait time, enrollments and queue position. Bed nights and contacts
   as *proof of homelessness* is stronger and more concrete, and it is sourced.
2. **Decide on learning objectives.** If they are added, Lesson 1's would be roughly: search
   on partial information; recover when a search returns nothing or too much; verify that a
   record belongs to the person in front of you; and recognise and report a duplicate.

Both are held until the remaining screenshots arrive, so the script is revised once rather
than four times.

---

# Batch 2 — the HMIS Data Standards themselves

This batch is far closer to Lesson 1 than batch 1, because it defines the fields the lesson
searches on and the data-quality codes the simulation already models.

## Universal Data Elements — the basis of the whole lesson

> HMIS Universal Data Elements are elements required to be collected by all projects
> participating in HMIS, regardless of funding source.
>
> The UDEs are the basis for producing **unduplicated estimates** of the number of people
> experiencing homelessness accessing services from homeless assistance projects…

The table splits them, and the left-hand column is the important one:

**Universal Identifier Elements — "One and Only One per Client Record"**
3.01 Name · 3.02 Social Security Number · 3.03 Date of Birth · 3.04 Race and Ethnicity ·
3.07 Veteran Status

**Universal Project Stay Elements — one value per project stay**
3.08 Disabling Condition · 3.10 Project Start Date · 3.11 Project Exit Date · 3.12
Destination · 3.15 Relationship to Head of Household · 3.16 Enrollment CoC · 3.20 Housing
Move-In Date · 3.917 Prior Living Situation

*Why this matters, and it matters a lot:* **the three things Lesson 1 teaches people to
search on — Name, SSN, Date of Birth — are exactly HUD's Universal Identifier Elements, and
HUD defines them as one and only one per client record.** That is the authoritative basis
for two things the lesson currently asserts on its own account:

- **Why a duplicate is a defect, not an inconvenience.** A second record gives one person a
  second set of elements that are specified to exist once.
- **Why "two of three" is the rule.** Name, DOB and SSN are the identifiers; everything else
  in the record belongs to a project stay and can legitimately vary.

Also worth noting: *Veteran Status* and *Relationship to Head of Household* are both UDEs,
and both are things the lesson already uses in verification.

Confirmed by the same page: the collection point *Record creation* means the element
"**have one and only one value for each client in an HMIS**".

## The data-quality codes, defined by HUD

The simulation already models these. Now they can be described in HUD's own terms:

> **"Client doesn't know"** – means that the client does not know the information.
> **"Client prefers not to answer"** – means the client knows the information but prefers not
> to provide the information to record in HMIS.
> **"Data not collected"** – means the worker did not record the information. This may be
> because the client was not available to provide the information, or the worker simply
> didn't ask.

And two rules that are directly a field worker's business:

> **It is not the intention of HUD or the federal partners that clients be denied assistance
> if they prefer not to or are unable to provide the information.**

> The "Client doesn't know" or "Client prefers not to answer" responses should not be used to
> indicate that the case manager or data entry person does not know the client's response.
> Nor are these responses to be assumed without first asking the client to provide the
> information. Some clients may decline to provide responses to some fields, but case
> managers or data entry staff may not make that decision for them.

*Why it matters:* Lesson 1 already tells learners that a refused SSN is a legitimate answer.
This makes that sourced and sharper — nobody is denied assistance for it, and a worker may
not record a refusal on a participant's behalf without asking. It also gives the learner a
way to *read* a record: "Data not collected" means nobody asked, which is a different thing
from the participant declining, and it tells you the gap may be fillable.

### A terminology mismatch to check

HUD's current wording is **"Client prefers not to answer."** Our simulation displays
**"Client refused"**, which is the older phrasing. Which one Clarity shows on the record page
needs checking against a live account — the lesson should use whatever the learner will
actually see. Raised as an author question in the script.

---

# Batch 3 — reporting

Almost all of this batch is HUD/CoC reporting structure — project level, system level and
custom reports, APR, SPM, LSA, AHAR, grant compliance, policy and advocacy. **Dropped in
full** under the end-user filter. Two clauses survive:

> HMIS enables agencies to coordinate services, **avoid duplication**, and allocate resources
> more effectively.

> HMIS allows agencies to track client progress across multiple services and supports
> referrals for **coordinated entry**.

*Why they matter:* avoiding duplication is named as a purpose of the system rather than as
our editorialising, and coordinated-entry referrals riding on the client record is the
concrete version of "their place in a queue lives on the record" — which is the services
framing the owner asked for.

Not used: the qualitative-data section ("HMIS data is an important source of information but
it is not the only one"), which is good writing and belongs to a different audience.
