# Lesson 3 — Production Notes
### Companion to `hmis-basicnav-lesson-3-script.md`

Editorial and build direction only. Nothing in this document goes into Rise.

**Follows:** Lesson 2, "Searching with HMIS"
**Hands off to:** Lesson 4, program enrollment
**Scope:** full create flow including the Release of Information and the Consent Refused toggle, since the v2 deck makes ROI a required part of the Add Client form. Duplicate merges and household grouping remain separate lessons.

---

## Learning objectives

Design documentation, not learner facing. Lessons 1 and 2 do not present objectives on screen, so this stays behind the curtain unless the series changes. Levels are Bloom's revised taxonomy.

By the end of this lesson, a learner will be able to:

| | Objective | Level |
|---|---|---|
| 1 | **Recall** the data quality options available for Name, Date of Birth, and Social Security Number | Remember |
| 2 | **Distinguish** between "Data not collected," "Client doesn't know," and "Client prefers not to answer," and describe what each one tells the next worker | Understand |
| 3 | **Select** the data quality code that matches what a participant actually reported | Apply |
| 4 | **Complete** a client profile in Clarity, including alias and self-reported demographic information | Apply |
| 5 | **Determine** whether the conditions for creating a new profile have been met, given a search history | Analyze |
| 6 | **Record** a participant's consent to share using the documentation type that matches how consent was actually given | Apply |
| 7 | **Differentiate** a Permission of No from the Consent Refused toggle, and choose the one that matches what the participant asked for | Analyze |
| 8 | **Justify** recording an incomplete answer honestly rather than closing the gap with an assumption | Evaluate |

**A note on the top of the ladder.** Creating a profile in software is procedural, so it sits at Apply, not at Bloom's Create. This lesson tops out at Evaluate, which is the right ceiling for it. The judgment calls that carry real weight here are choosing between three codes that look identical and deciding when a record is honest, and both of those are evaluation.

### Where each level lives

| Block | Level |
|---|---|
| Opening, Nobody's Record, Somebody Typed All of That | Understand (context) |
| Create, or Keep Looking? | Analyze |
| Two Questions, Not One | Understand |
| Tutorial five-find hunt (replaces the form graphic and the order block) | Remember, then Analyze on the order beat |
| The Codes, From the Other Side | Remember, then Understand |
| When There Is No Answer to Put in the Box (Tabs) | Remember, then Apply |
| Permission to Share | Remember, then Understand, then Analyze (the No versus Consent Refused distinction) |
| Warmup matching | Understand, then Apply |
| Interactive tutorial (Bobbi) | Understand, then Apply with immediate correction |
| Identity Tasks 1 to 7, 11 | Apply |
| Identity Tasks 8, 9, 10 | Apply, then Evaluate |
| Consent Tasks 1, 2, 3, 6 | Apply |
| Consent Tasks 4, 5 | Analyze |
| Bobbi Comes Back, mini-sims 1 to 4 | Apply, then Evaluate on mini-sim 4 |
| Why This Matters, What You Practiced | Evaluate |
| Knowledge check | Understand through Evaluate |

The ladder climbs and does not skip. Nothing asks a learner to apply a code before they have distinguished the codes, and nothing asks them to justify a choice before they have made a few.

---

## Build notes

**Notation, checked against Lessons 1 and 2**

These bracket terms are used exactly as the built lessons use them: `[Task Scenario]`, `[Task Instruction]`, `[Task Hint]`, `[Feedback: Correct]`, `[Feedback: Incorrect — ...]`, `[Answer: Correct]`, `[Answer: Incorrect]`, `[Feedback]`, `[Tasks for Completion by User]`, `[Script for Above Simulator]`, `[Simulator Complete Message]`, `[Tutorial: Walking User Through Interface]`, `[This is a Lashes Animated Block]`, and the `[User Clicks ...]` markers.

**Em dash exception.** The no-em-dash rule applies to all learner-facing copy. It does not apply inside production markup. `[Feedback: Incorrect — chose Data not collected]` matches the house format set in Lesson 2 (`[Feedback: Incorrect — opened Marcus Pell]`). Em dashes appear nowhere else in this script.

**Block-type tags are new to this lesson.** `[Text block]`, `[Statement block]`, `[Accordion, 3 panels]`, `[Callout]`, and `[Custom Code Block: ...]` do not appear in Lessons 1 and 2, where only unbuilt assets get tagged and native Rise blocks are just copy under a heading. Kept here by decision, so the script stands alone for whoever builds it. If Lessons 1 and 2 are ever revised, worth backfilling them the same way rather than stripping these.

**No beat markers.** An earlier draft used `[Beat 1]` through `[Beat 6]` to number the exchanges in the guided walkthrough, and `[beat]` to mark pauses in Lashes dialogue. Both are gone. Lessons 1 and 2 use neither: Lashes pauses are paragraph breaks, and the walkthrough exchanges are separated by rules. The developer reads one exchange per block between horizontal rules, in order.

**Trauma-informed language rules applied here**

These are standing rules, not one-time fixes. They should hold across every lesson in the series, and reviewers should be able to check copy against them.

1. **Locate the deficiency in the record, never in the person.** A participant is never absent, invisible, unknown to the system, or yet to happen. Their record does not exist yet. The Statement block in "Nobody's Record" carries this explicitly: *"Bobbi has a history. HMIS does not have it yet. That is a gap in the record, not a gap in her."* An earlier draft of that line said she "has not happened yet," which put the deficiency on her and was wrong.
2. **Person first, and match Lesson 1's usage.** People experiencing homelessness, not homeless people. Participants, not clients, except where Clarity's own field labels say Client and the learner needs to recognize the word on screen.
3. **Declining is an answer, not an obstacle.** Every place a participant withholds information, the copy treats it as a legitimate choice that gets recorded accurately. Nowhere is a refusal framed as a problem for the worker to overcome. "Client prefers not to answer" exists so that nobody has to be asked twice.
4. **Do not use somebody's hardship as an emotional device.** The stakes in "Nobody's Record" are stated as consequences for her access to services, not as pathos about her circumstances. The reader should feel the cost of a missing record, not be moved by a description of her suffering.
5. **A participant tells their story. They do not explain or justify themselves.** The closing line was changed to *"she gets to decide how much of her story she tells again,"* which keeps the choice with her. Lesson 2 already established this framing.
6. **The name they give you is their name.** Other names are aliases. Never "real name" against anything else. The only place "legal name" appears is as an incorrect answer in the knowledge check, where it is the misconception being corrected.

**Bloom alignment**

Objectives and the level map are above. Two things to hold onto in review:

- Task instruction verbs match the intended level. Tasks 1 through 5, 7, and 8 say create, record, complete, and set, which are Apply. Task 6 says "create his profile so that the next worker can find him under either name," which asks the learner to judge a downstream consequence, and its feedback is written at Evaluate. Task 9 requires the learner to tell two similar-looking controls apart by what the participant actually asked for, which is Analyze.
- The warmup exists specifically to close the Understand-to-Apply gap. Before it, the codes have been explained but never chosen. It is the first block that asks for a decision, which is why it is ungraded.

**No Ken Burns blocks in this lesson**

Lessons 1 and 2 open their scenes with Ken Burns photo montages plus narration. Lesson 3 does not, to save the production. "Nobody's Record" is now three native Rise blocks: text, Statement, text. No motion work, no image sourcing beyond an optional single still, and no audio.

What that costs: the scene lands quieter than the equivalent moment in Lessons 1 and 2, and the learner reads it instead of being carried through it. What compensates is that the emotional weight of this lesson was never sitting in that block. It is in the Lefty Torres callback, which runs through "Somebody Typed All of That," marker 8, Task 6, and "Why This Matters." Those are all text and simulator work that was already budgeted.

If a montage is ever restored to this lesson, "Nobody's Record" is the place for it, and the copy above transfers to narration without rewriting.

**Warmup matching interaction**

- Sits after Permission to Share and immediately before the simulator on purpose. Eight pairs: six on the quality codes, two on consent. It rehearses the exact judgments Tasks 3 through 5, 8, and 9 exercise, so a learner who gets it wrong here gets it wrong cheaply.
- Ungraded and retryable. Nothing is recorded. It is the only block in the lesson with no consequence, and that is deliberate given what follows.
- Category labels use the Quality of Name and Quality of DOB wording. The five options are near enough identical across all three fields, but the exact strings differ slightly (Full name reported, Full DOB Reported, Full SSN Reported). Worth a one line note under the interaction if it causes confusion in review.
- Rise-native fallback if the custom build is not worth it: a Sorting Activity. With consent items now mixed in, the categories would be the five codes plus Verbal Consent plus Consent Refused, which is seven, and that is too many for a Sorting Activity to read well. If the fallback is needed, split it into two Sorting Activities, codes and consent.

**Simulator**

- Add Client unlocks in the practice environment, consistent with the tutorial line in Lesson 2: "each lesson clears the part it teaches."
- The guided walkthrough needs the Quality of Name value to visibly change on beat 2 and Quality of DOB on beat 4. Watching a partial answer become a full one is the point of the block. Everything else can be a straight fill.
- **No grading anywhere in this lesson.** Tasks are not scored, not gated, and not retried. The learner makes a call, the feedback fires, the lesson moves forward. An incorrect answer is marked incorrect and explained, and that is the entire consequence. Nothing is recorded, nothing is tallied, and there is no pass mark to hold anyone back. The knowledge check runs on the same rule: mark, explain, continue.
- **Typed text is never evaluated. Anywhere.** Not names, not dates, not spelling, not capitalization. There is no correct string in this simulator. The only things feedback ever responds to are a code selection and a field left empty. A learner who types Okonkwo four different ways sees identical behavior every time, and is never told they got it wrong.
- Spelling appears in the lesson only as something you confirm with the participant: the tutorial at beat 2, and marker 3 in "What the Form Wants." It is never a validation rule, and the system never corrects anybody. The framing throughout is that confirming it now is cheap and it is what makes the record findable later.
- Task 1 feedback claims the form does not infer codes from what you typed. Confirm that is true in the practice build before shipping, since it is a deliberate teaching point.
- Tasks 4, 5, 6, 8, and 9 each need plausible wrong answers wired to the specific feedback written in the script. Task 4's is "Data not collected." Task 5's is "Client doesn't know." Task 6's is saving with Alias empty. Task 8 has two: choosing Electronic Signature with no device, and setting Permission to No. Task 9 has two: setting Permission to No while leaving identifying details in place, and not creating a profile at all.
- Task 9 needs the Consent Refused toggle to actually fire its auto-fill in the practice environment: name to Generated Refused, SSN to 000-00-0000, DOB to 01/01 plus year, codes to Client prefers not to answer. The feedback describes that happening, so it has to happen.
- The Bobbi walkthrough now has two more exchanges, demographics and consent. The consent exchange should show Permission, both dates, and Documentation filling in, with Verbal Consent selected. That is the model for Task 8.
- Simulator needs the Release of Information section to render conditionally by Documentation type: consent text and two signature pads for Electronic Signature, a File dropzone for Attached PDF, a Location text field for Signed Paper Document, nothing extra for Verbal Consent, and a Head of Household pointer for Household. Only Electronic Signature and Verbal Consent are exercised by tasks, so the other three can be static.

**Screenshots for "What the Form Wants"**

Purple Add Client slide-over, matching v2 deck pp. 60 to 83. Four captures needed: the identity section (SSN through Alias), the Demographics section, the First Point of Contact section (for the DO NOT USE marker), and the Release of Information section with the Documentation dropdown open. Plus one capture of the saved profile view (v2 p. 45) for the post-save moment.

---

## Script v2 (Sept 3): interactivity rebuilt to exceed Lesson 2

v1 had one simulator with nine tasks, a passive walkthrough, a warmup, and four teaching blocks that were pure text. Lesson 2 has two simulators (13 tasks), three Desmond mini-sims, and roughly ten custom-code interactions. v2 restructures Lesson 3 so hands-on carries the teaching rather than following it.

| | Lesson 2 (built) | Lesson 3 v1 | **Lesson 3 v2** |
|---|---|---|---|
| Simulator tasks | 13 (8 search + 5 verify) | 9 | **17** (11 identity + 6 consent) |
| Mini-sims after the tasks | 3 (Desmond) | 0 | **4** (Bobbi comes back) |
| Custom-code interactions outside the sims | ~10 | 4 | **8** |
| Tutorial | follow-along with clicks | watch-only walkthrough | **follow-along: learner sets every code themselves, Lashes reacts to wrong ones** |
| Knowledge check | 7 | 8 | **9** |

**What changed, block by block**

- **"Before You Click the Plus"** (checklist text) became **"Create, or Keep Looking?"**: three search histories, learner decides create or keep looking, feedback either way. Analyze-level, and it mirrors L2's checkpoint.
- **"The Form Asks in a Different Order"** and **"What the Form Wants"** (a comparison table and a labeled graphic) were folded into the **simulator tutorial as a five-find hunt** inside the real form replica: find the plus, the Alias field, the Point of Contact section, the second consent question, the Consent Refused toggle. The order-of-asking point is a Lashes beat when the form first opens. Two text blocks became one hands-on block.
- **"The Codes"** kept its three-way distinction and lost the accordion. The five options are now learned by setting them.
- **The Bobbi walkthrough** is now interactive. The learner types and sets every code as the conversation unfolds; each wrong choice gets a Lashes correction in the moment. Ends with a real Save and the Unique Identifier.
- **Identity simulator grew from 8 tasks to 11.** New: Task 4 (age subtraction to a year), Task 6 (last four digits with X's), Task 9 (chosen name Nadia, ID name to Alias), Task 10 (no name given, brief description with the Partial code). Every one of those is a convention the DQ Dashboard User Guide states.
- **Consent got its own simulator, six tasks**, instead of two tasks tacked onto the end. New: Task 1 (electronic signature with a photo-consent trap and a both-signatures check), Task 3 (signed paper document with Location), Task 4 (Permission No, still create, with Consent Refused as the trap), Task 6 (attached PDF).
- **"Bobbi Comes Back"** is the L2 Desmond pattern, four mini-sims: she found her card (edit SSN, move the code to Full); you have the tablet (upgrade Verbal Consent to Electronic Signature, the promise kept); send her Unique Identifier to HMIS Support (copy it into a ticket); resolve a Name warning on Dee Okonkwo from Task 2. The last one is the seed of the Spot the Problem game in the backlog.
- **Warmup** swapped its two consent rows for an age-subtraction row and an alias row, so it warms up the identity simulator it now sits directly in front of. Consent gets its own teaching immediately before its own simulator.
- **Knowledge check** added a chosen-name question.

**New simulator capabilities this script assumes** (beyond v1's write-capable Add Client form)

1. Hotspot detection on form elements for the five-find tutorial, with per-find wrong-click feedback.
2. A live tutorial where the learner's own selections are checked mid-conversation and Lashes responds before the conversation continues.
3. Search and open an existing record, then edit it via the pencil icon (mini-sims 1, 2, 4). The practice environment needs the records the learner created earlier in the lesson to persist within the session, at least Bobbi and Dee.
4. Editing the Release of Information on an existing profile (mini-sim 2).
5. A simplified HMIS Support ticket form beside the profile, with the Unique Identifier as the checked field (mini-sim 3).
6. A one-row Data Quality Dashboard warning that opens the flagged record (mini-sim 4).
7. Consent Task 1 checks three things at once: Documentation, both signature pads, and the photograph checkbox state.
8. Consent Task 6 needs a fake file picker that registers a file as attached.

**Open items this script adds or sharpens**

19. **Task 10 (brief description) depends on open item 15.** The task grades the Partial code with a description present, which is my inference from the guide's error logic. If HMIS Support says the description pairs with a different code, Task 10's correct path and its feedback change.
20. **Task 4 (age subtraction) uses "this year."** The feedback says "fifty-two from this year," deliberately not naming a year so the script does not date. The simulator computes it.
21. **Mini-sim 2 assumes ROI is editable from the profile after creation.** The v1 deck showed an ROI management area on the profile with an Add Release of Information button, and the sandbox has a Privacy entry in the left rail. Confirm the edit path in the current UI before building.
22. **Runtime.** This is now longer than Lesson 2. That was the ask. If it needs trimming, the cheapest cuts that lose nothing structural are consent Task 6 (attached PDF duplicates the file-handling idea) and identity Task 6 (last four, which the warmup and Lesson 2 both already cover).

---

## Sims built (Sept 3, against script v1)

**Superseded in part by script v2.** The Bobbi walkthrough is watch-only where v2 wants follow-along; the practice sim has v1's nine tasks where v2 has seventeen across two simulators plus four mini-sims; the warmup's two consent rows changed. All three still run and are useful as build references for the form replica and the task engine.

Three self-contained HTML files, each also zipped as `index.html` for a Rise Storyline/Web Object block. Each posts `{type:"complete"}` to the parent frame on finish, matching the existing embeds. No grading, no typing checks, feedback then forward.

| File | What it is | Script block |
|---|---|---|
| `sim-bobbi-walkthrough.html` | Guided walkthrough. Conversation on the left with Lashes commentary, a Clarity Add Client replica on the right that fills in as each exchange lands, then Save reveals the profile and the Unique Identifier | Guided Walkthrough: Meeting Bobbi |
| `sim-add-client-practice.html` | Working Add Client replica with all nine tasks. Task panel on the left with scenario, instruction, hint, and the scripted feedback. Task 2 has the two-stage conversation, Task 7 has an "Ask them" button that must be pressed before demographics are set, Task 9 has a "Don't create a profile" path, Consent Refused fires its real auto-fill, Documentation renders the consent text and signature pads for Electronic Signature | Tasks 1 to 9 |
| `sim-warmup-matching.html` | Eight-pair click-to-connect matching with the two scripted feedback states | Warmup |

Visual system: Clarity's own palette for the replica (indigo #5055AD, surface #FCF8FD, lavender #F1EFFF, error #BA1A1A, Open Sans), and Lashes teal #066888 for the coaching panel, so the two worlds read as different things on the same screen. The Lashes avatar is a simple lens-and-lashes SVG in her color, a stand-in until her real assets go in.

**What the training sandbox (la-train.clarityhs.com) settled**

- **Primary Language is on the Add Client form**, not required, under Demographics. Open item 6 closed. Not in the script's field list yet; add a marker if you want it called out.
- **Consent term is seven years and it is written in the consent form itself**: "This consent is valid for seven (7) years from the date the PPI was created or last changed." Start Date fills as today, End Date as today plus seven years. Open item 13 closed.
- **Consent Refused auto-fill confirmed exactly** as the team listed, plus one they did not mention: Suffix also flips to "Client prefers not to answer." Demographics are untouched by the toggle.
- **The sandbox still has Ethnicity and Race as separate required fields**, with the older Race list (no Middle Eastern or North African). The deck shows the current combined "Race and Ethnicity." The sims follow the deck, since the training site is behind production. Worth knowing before anyone screenshots the sandbox for the labeled graphic.
- **Three Point of Contact sections** (First, Second, Third), each with Date, Name, Phone, Extension, Email, Category, plus HMIS Notes. The practice sim collapses them into one "not used, skip" strip.
- LA-specific fields not in the deck: TB Clearance Date, Clinic, DPSS ID, a Veteran Status note citing FY2026 Data Standards 3.07, and "For Veteran Case Conferencing." None are in the script. Probably right to leave them out of Lesson 3, but they are on the form.
- Gender and Race are multi-select in the sandbox (no "Select" placeholder). The sims use single-select for simplicity; the production simulator should allow multiple.
- Escape closes the whole Add Client panel, not just an open dropdown. Small, but it is the kind of thing a learner will hit.

---

## Deck update (v2, 117 pp) — what changed for this lesson

The facilitator deck was revised after the script was written. The old-interface appendix (v1 pp. 93 to 154) is gone. "Creating the Profile" gained eleven slides. Lesson 4 material and a training plan were added. Delta that touches Lesson 3:

| v2 pages | What it is | Effect on the script |
|---|---|---|
| 74 | **Point of Contact section on Add Client: "DO NOT USE."** Visible but retired. Assigned Staff replaces it at enrollment | New marker needed in "What the Form Wants." Learners will see this section and must be told to skip it |
| 75 to 83 | **Permission – HMIS Consent.** Nine slides. Permission \*, Start Date \*, End Date \*, Documentation \* are all required on the Add Client form. Five documentation types: Electronic Signature (consent text renders in-form, participant signs by finger or pen on a touchscreen), Attached PDF (upload), Signed Paper Document (Location field), Verbal Consent (consent with follow-up plan for written consent), Household (minors tracked through Head of Household) | **Breaks "core create flow only."** The learner cannot save without completing ROI. Scope decision needed, see below |
| 84 | **Save (and Updates).** Quote: *"In order to save the Profile record, you will need to complete all required fields. This doesn't mean that the participant has to answer. It does mean that you need to record what happened in the interaction."* Plus: edit via the pencil icon | Resolves open item 4. This is LAHSA stating the lesson's thesis in its own words and it should be quoted in "Save, Then Say So." Add one line on the pencil icon |
| 45 | Saved profile view on the new UI. Field order confirmed. Left rail: Profile, Privacy, Household, History, Programs, Services, Assessments, Units/Beds, Care Team, Notes, Alerts, Files, Forms, Contacts, Location | Screenshot source for the post-save moment. No Primary Language field visible |
| 95 to 111 | Serving the Participant, Creating the Enrollment | Confirms Lesson 4. Handoff line stands |
| 112 to 116 | **HMIS New Interface Training Plan.** Two personas (existing HMIS user, non-HMIS user). Two tracks: BNTS, required, "what is this database and how do I use it"; Orientation, optional, "how is my workflow different." BNTS objectives include *"Explore data quality; understanding how a conversation becomes data"* | That phrase is the Lesson 3 thesis. Worth adopting verbatim somewhere. Also confirms the series audience is the non-HMIS-user persona |
| 22 | "navigation icons" became "application icons" | Cosmetic |

Bobbi dialogue (v2 pp. 87 to 94) is unchanged. The Borrone / Barrone inconsistency persists in the source (pp. 46 to 51 versus 88 to 94).

---

## Team and policy input (Sept 2026)

Two sources arrived after the v2 deck: an SME thread relayed by the team, and LAHSA's **Data Quality Monitoring Plan** (Appendix A, Policy and Procedure for Prioritization of Data Quality Issues, 32 pp). What each one settled:

**From the SME thread**

| Point | Effect on the script |
|---|---|
| Point of Contact on the profile: providers should no longer use it. Still used only for DHS/HSH, who will be transitioned off. PSH matching notifications are based on Assigned Staff on enrollments | Marker 11 wording tightened to "providers no longer use it" and now names the matching-notification reason. Open item 14 closed |
| Declined-field conventions from LAHSA docs: DOB is 01/01 plus best guess at the year; Name is a physical description; SSN was asked as "Xs or 0s?" and not resolved in the thread | DOB convention is now taught in the new block and used in Task 3. Physical description for name is taught in the same block with tight trauma-informed guardrails. SSN fully declined stays open |
| Consent Refused auto-fill, exact values: SSN 000-00-0000, Quality of SSN Client prefers not to answer, First name Generated, Last name Refused, Quality of Name Client prefers not to answer, DOB 01/01/____, **Quality of DOB Approximate or Partial DOB reported** | **Corrected an error in my script.** I had written that all codes set to Client prefers not to answer. Quality of DOB sets to Approximate or partial. Fixed in the Permission to Share callout and Task 9 feedback |
| "Guidance looks good to me" on the current best practices, with a data standards guide to follow | The conventions are treated as current. Watch for the follow-up guide |
| Data Quality Dashboard User Guide excerpt, DOB Warning Resolution Guidance (cites HUD Data Standards 3.03): if Missing or Data not collected, update to prefers-not or doesn't-know depending on the situation; if a DOB is entered but the code says doesn't-know, correct the code to Full or Approximate | Confirms Task 3's teaching exactly (year entered, code should be Approximate, not doesn't-know). Also reframes "Data not collected" as a **warning that expects resolution**, see below |

**From the Data Quality Monitoring Plan**

| Policy language | Effect on the script |
|---|---|
| "Collect data using a participant centered, trauma-informed approach that helps participants understand the questions being asked and allows them to determine what they feel safe sharing" | Direct policy backing for the lesson's consent framing and for the language rules in this document |
| "Collect data directly from participants; do not enter data about participants based on your observations. For information on how to record missing information, see the Data Quality User Guide" | Quoted in Task 7 feedback. Also creates a tension with the physical-description convention, see open item 15 |
| "Correct inaccurate information as soon as you become aware of it, but no later than within 3 business days" | Added to the Updating later block |
| Timeliness: "no later than 2 business days after information is known or collected" | Added to the Updating later block |
| "Purposefully recording inaccurate information is strictly prohibited. Engaging in the willful entry of incorrect data may result in revocation of access to HMIS" | Paraphrased once, in the callout under the new block, as the reason the placeholder-versus-guess distinction matters. Deliberately not made threatening |
| Errors versus warnings: errors are "not permitted by LAHSA data standards"; warnings "may be a data quality issue which should be fixed, or it may be an unexpected situation that reflects reality in which case the data should not be changed" | "Data not collected" surfaces as a warning, not an error. Task 5 feedback now says so: the record will show on the dashboard until someone asks, and that is the dashboard doing its job |

**From the Data Quality Dashboard User Guide (Name, Date of Birth, Social Security Number sections)**

The guide defines, per field, what fires an error, what fires a warning, and the best practice. This is the authority the DQMP points to for recording missing information, and it settled most of what was still open.

| Field | Priority | Error fires when | Warning fires when | Best practice, as written |
|---|---|---|---|---|
| Name | General | Quality is null or Data not collected. Or name is null / contains "Refused" but Quality says full or partial. Or name is real but Quality says doesn't-know or prefers-not | Quality is prefers-not or doesn't-know | Use the participant's full and accurate name whenever possible. If they do not associate with their legal name, enter the name they identify with, unless the funder requires legal. If you cannot get the common name, use a brief description. The HMIS name goes on the Universal Housing Application |
| Date of Birth | **High Priority** | Quality is null or Data not collected. Or DOB is null but Quality says full or partial. Or DOB is not null but Quality says doesn't-know or prefers-not | Quality is prefers-not or doesn't-know | If they do not know their DOB, ask their age, subtract from the current year, enter 01 for month and day |
| SSN | General | SSN is null, xxx-xx-xxxx, 000-00-0000, or Quality is Data not collected. Or SSN is a placeholder but Quality says Full | Quality is prefers-not or doesn't-know | Input an X for any unknown digit. If the participant does not have an SSN, enter XXX-XX-XXXX and select Client Doesn't Know |

Name Error Resolution Guidance adds: preferred name is acceptable over legal name unless the funder requires legal; in street outreach you may record a street, code, or modified name for security reasons, with the Partial code; if unable or prefers not, use doesn't-know or prefers-not, and *"these responses will continue to show on the dashboard as data quality issues but are appropriate if accurate."*

**What that changed in the script**

- **"Data not collected" is an error, not a warning, on all three identity fields.** Task 5 feedback rewritten. It now says error, explains why (a required question was never asked), and names the alternative (picking doesn't-know to clear the dashboard) as the lie it would be. The teaching holds; the consequence is stated accurately.
- **Brief description in the name fields pairs with the Partial code, not prefers-not.** I had written prefers-not. Per the error logic, a real string in the name field with a prefers-not code is an error. The guide does not state the code for a description explicitly; Partial is the only code that does not error, and it is the code the guide assigns to the adjacent street-name case. Fixed in the new block. Inference flagged in open item 15.
- **Chosen and preferred names are explicitly allowed** over legal names unless a funder requires legal. Taught in the new block. Open item 5 closed, and language rule 6 now has policy behind it.
- **The age-subtraction method** for an unknown DOB is now in the block and in Task 3 feedback.
- **SSN conventions** are now complete: X per unknown digit; XXX-XX-XXXX with doesn't-know when they have none; XXX-XX-XXXX with prefers-not when they decline. The last is by extension of the first two, not stated in the guide. Task 4 feedback updated.
- The block is now three Tabs (Name, Date of Birth, Social Security Number) instead of three paragraphs, because each field has three or four cases.

**"Data not collected" is honest and temporary.** This is the one place the new sources sharpened the teaching rather than confirming it. The lesson still says it is the correct code when you did not ask, and that is true. What it now also says is that it flags on the dashboard, and the resolution is to ask at the next contact. Honest at the moment, not meant to stay. Both halves are in Task 5.

---

## Open items

**Resolved by the v2 deck**

1. ~~Which UI generation~~ **Resolved.** The old interface is gone from the deck. Purple slide-over is the only UI. The script was written to it.
2. ~~Does ROI sit on the create screen~~ **Resolved, and the answer is yes.** Permission, Start Date, End Date, and Documentation are all required fields on the Add Client form. See the scope decision below.
~~4. Saving with an empty SSN field~~ **Resolved by the DQ Dashboard User Guide.** X for each unknown digit. XXX-XX-XXXX with Client doesn't know when the participant has no SSN. Declined is XXX-XX-XXXX with prefers-not by extension. Note that 000-00-0000 is the Consent Refused auto-fill and is otherwise flagged as a placeholder, so it should not be taught as a manual entry.
7. ~~Lesson 4 scope~~ **Resolved.** Creating the Enrollment. Handoff line stands.

**Still open**

~~3. Date of Birth entry when only the year is known~~ **Resolved by SME thread.** 01/01 plus best guess at the year. Taught in the new block and used in Task 3.

~~5. Chosen names~~ **Resolved by the DQ Dashboard User Guide.** "If the participant doesn't associate with their legal name, the name entered into HMIS should reflect the name the participant identifies with, unless the legal name is required by the funder." Taught in the Name tab of the new block. Legal name, if different and known, goes in Alias.

~~6. Primary Language~~ **Resolved in the sandbox.** It is on the Add Client form, under Demographics, not required. Add a marker to "What the Form Wants" if it should be called out.

**New**

~~8. ROI scope decision~~ **Decided: full teach.** New section "Permission to Share" covers Permission, dates, all five Documentation types, what No means, and the Consent Refused distinction. Two tasks and two knowledge check questions added. Script is now nine tasks and eight questions. Minimal fold-in and split were the alternatives considered.

~~9. Point of Contact~~ **Done.** Marker 11 in "What the Form Wants."

10. **Permission No versus Consent Refused.** The v2 deck is internally unclear here and the script had to pick a reading. Pp. 63 to 64 say: if the participant does not consent to sharing, click Consent Refused. But the Release of Information section has its own Permission field with a No option, and the v1 deck (p. 106, now dropped) explained that No means "we mark no and still create the profile, and only our co-workers could see the unredacted profile." The script teaches the two as distinct controls: Permission No governs who can see identifying information, Consent Refused governs whether it is there at all. Task 9 and Question 6 are built on that reading. **If LAHSA's actual practice is that a refusal to share always means the Consent Refused toggle, Task 9, Question 6, and the callout in Permission to Share all need rewriting.** This is the highest-stakes open item in the lesson and should be confirmed with HMIS Support before build.

11. **The "If the answer is No" paragraph** is sourced from the v1 deck only. V2 dropped that slide. The mechanics it describes (profile still created, unredacted view limited to own agency) are plausible and match the old Clarity behavior, but nothing in the current deck states them. Confirm.

12. **Signed Paper Document: the Location field.** The deck shows the field and does not say what goes in it. The script says "record where the paper copy is kept." Confirm that is the intent.

~~13. Seven-year consent term~~ **Resolved in the sandbox.** Stated in the consent form text itself, and the dates auto-fill today plus seven years.

~~14. Point of Contact wording~~ **Confirmed by SME.** Providers should not use it; DHS/HSH still do, and will be transitioned. Marker 11 wording updated. Still worth a check that the section is not removed from the form before ship.

15. **Brief description in the name fields: mostly resolved, one inference.** The DQ Dashboard User Guide confirms the practice in its own best-practice column: "If you cannot get the common name, use a brief description." That settles the source question and the tension with the DQMP, since the same guide the DQMP points to is the one endorsing it. What the guide does not state is which Quality of Name code goes with a description. The error logic makes Partial the only code that does not fire an error, and it is the code the guide assigns to the neighboring street-name case, so the script teaches Partial. Worth a one-line confirmation from HMIS Support that this is intended.

~~16. Data Quality User Guide~~ **Have the Name, DOB, and SSN sections.** They settled items 4, 5, and most of 15. The rest of the guide (demographics, ROI, and anything on Consent Refused) would still be worth having before the simulator is built.

17. **DOB field when the code is doesn't-know or prefers-not.** The guide's error logic says a non-null DOB with either of those codes is an error. That means the 01/01 placeholder pairs only with Approximate, and when the code is doesn't-know the DOB field has to be empty. But DOB is marked required on the Add Client form. Either the form allows an empty DOB when the code says doesn't-know, or there is a convention not in the excerpt. The simulator needs to know which. Small, but it decides what Task 3's alternate path and the Consent Refused auto-fill (01/01/____ with Approximate) actually look like.

18. **Name field when the code is doesn't-know or prefers-not.** Same shape as 17. The error logic wants the name field null or containing "Refused" when the code is doesn't-know or prefers-not, and the field is required. The Consent Refused auto-fill (Generated / Refused) is one answer. Whether a worker manually types "Refused" for a participant who declines a name but consents otherwise is not stated. Confirm.

**Sources for this section**
- LAHSA, How to Add a Client in HMIS: https://www.lahsa.org/documents?id=6460-how-to-add-a-client-in-hmis
- LAHSA, Creating a Profile in HMIS: https://www.lahsa.org/documents?id=6429-creating-a-profile-in-hmis
- LAHSA, Data Quality Dashboard User Guide: https://www.lahsa.org/documents?id=9412-data-quality-dashboard-user-guide.pdf
- LAHSA, Data Quality Monitoring Plan, Appendix A (uploaded to this session)
- HUD HMIS Data Standards Manual, Date of Birth 3.03 (cited by the dashboard guide)
