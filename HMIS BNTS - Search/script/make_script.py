#!/usr/bin/env python3
"""Builds the Lesson 1 script in the format the team established (see NHO.docx)."""
import json
import os
import re as _re

import docx
from docx.shared import Pt, RGBColor, Inches
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT

GREEN  = RGBColor(0x1E, 0x7A, 0x33)   # correct answer
ORANGE = RGBColor(0xC0, 0x60, 0x00)   # incorrect answer
BLUE   = RGBColor(0x1F, 0x4E, 0xD8)   # sources
RED    = RGBColor(0xC0, 0x1C, 0x1C)   # requested information by the course author

d = docx.Document()
st = d.styles["Normal"]
st.font.name = "Calibri"
st.font.size = Pt(11)
for s in d.sections:
    s.left_margin = s.right_margin = Inches(1)

def para(text="", bold=False, italic=False, underline=False, color=None,
         style=None, space_after=6):
    p = d.add_paragraph(style=style)
    if text:
        r = p.add_run(text)
        r.bold, r.italic, r.underline = bold, italic, underline
        if color is not None:
            r.font.color.rgb = color
    p.paragraph_format.space_after = Pt(space_after)
    return p

def title(t):        return para(t, bold=True, underline=True, space_after=12)
def section(t):
    d.add_paragraph()
    return para(t, bold=True, underline=True, space_after=8)
def topic(t):        return para(t, bold=True, space_after=4)
def sub(t):          return para(t, underline=True, space_after=4)
def body(t):         return para(t, space_after=8)
def note(t):         return para(t, italic=True, space_after=8)
def ask(t):          return para(t, color=RED, space_after=8)
def bullet(t, lvl=0):
    p = d.add_paragraph(t, style="List Bullet" if lvl == 0 else "List Bullet 2")
    p.paragraph_format.space_after = Pt(2)
    return p
def num(t):
    p = d.add_paragraph(t, style="List Number")
    p.paragraph_format.space_after = Pt(2)
    return p
def answer(t, correct):
    p = d.add_paragraph(style="List Bullet 2")
    r = p.add_run(t)
    r.font.color.rgb = GREEN if correct else ORANGE
    p.paragraph_format.space_after = Pt(2)
    return p

# ---- the simulation's own task definitions --------------------------------
# Transcribed straight from the built lesson so the script and the thing the
# learner actually sees cannot drift. Regenerate with extract_tasks.mjs.
TASKS = json.load(open(os.path.join(os.path.dirname(os.path.abspath(__file__)),
                                    "tasks.json")))["tasks"]

def plain(html):
    """The lesson marks copy up for the screen; the script wants the words."""
    s = _re.sub(r"<[^>]+>", "", html)
    s = (s.replace("&amp;", "&").replace("&lt;", "<").replace("&gt;", ">")
          .replace("&nbsp;", " ").replace("&#39;", "'").replace("&quot;", '"'))
    return _re.sub(r"\s+", " ", s).strip()

MONTHS = ("January February March April May June July August September "
          "October November December").split()

def longdate(iso):
    y, m, day = iso.split("-")
    return f"{int(day)} {MONTHS[int(m) - 1]} {y}"

# Every task traces to a paragraph of the vetted draft. The reference is carried
# here so the mapping can be checked without reading the build.
DRAFT_REF = {
    "nickname":  "alternate names and nicknames",
    "year":      "search by year of birth alone",
    "last4":     "search by the last four digits of the Social Security Number",
    "fragments": "search the first letters of the first and last name, as in kat joh",
    "narrow":    "narrowing an over-broad result set by adding a term",
    "swap":      "replacing one search term with another piece of information",
    "spelling":  "alternate spellings, C and K, I and Y",
    "surname":  "second last names and compound surnames",
    "samename":"a record is a match when at least two of name, date of birth and SSN agree",
    "household": "confirming other information in the record — household members, program "
                 "history, case notes, location, veteran status",
    "several":   "choosing which matching record to work from",
    "duplicate": "reporting duplicates to HMIS Support",
}

HEADINGS = {
    "nickname":  "The Name He Gave You",
    "year":      "When the Last Name May Have Changed",
    "last4":     "Starting From the Last Four of the SSN",
    "fragments": "A Name You Cannot Spell",
    "narrow":    "Too Many Results",
    "swap":      "Nothing Comes Back",
    "spelling":  "Spelled the Way Someone Else Heard It",
    "surname":  "A Surname Typed as One Word",
    "samename":"Two People, One Name",
    "household": "When the Identifiers Are Thin",
    "several":   "More Than One Record Matches",
    "duplicate": "Finding the Same Person Twice",
}

ACTION = {"open": "Open the record.", "choose": "Choose a record."}

# ───────────────────────────────── title + key ────────────────────────────
title("HMIS Basic New Trainee Series")
para("Lesson 1: Finding a Participant — Elearning Course Script", bold=True, space_after=10)
body("The key below displays the function of various text attributes of the following script.")

key = d.add_table(rows=5, cols=2)
key.style = "Table Grid"
key.alignment = WD_TABLE_ALIGNMENT.LEFT
rows = [
    ("Italics", "Ideas for video, images, and interactivity. Italics text will not be included in the course."),
    ("Blue",    "Sources"),
    ("Green",   "Correct answer(s) from a knowledge check"),
    ("Orange",  "Incorrect answer(s) from a knowledge check"),
    ("Red",     "Requested information by the course author"),
]
for i, (a, b) in enumerate(rows):
    key.rows[i].cells[0].width = Inches(1.2)
    key.rows[i].cells[1].width = Inches(5.3)
    ra = key.rows[i].cells[0].paragraphs[0].add_run(a)
    ra.bold = True
    if a == "Blue":   ra.font.color.rgb = BLUE
    if a == "Green":  ra.font.color.rgb = GREEN
    if a == "Orange": ra.font.color.rgb = ORANGE
    if a == "Red":    ra.font.color.rgb = RED
    if a == "Italics": ra.italic = True
    key.rows[i].cells[1].paragraphs[0].add_run(b)

d.add_paragraph()
note("Second pass. Every task in the practice simulation is now documented in full — the situation, "
     "the instruction, the hint, the correct record and the feedback — so this can be reviewed "
     "without opening the simulation. External links and sources are intentionally omitted at this stage and "
     "will be added in a later pass. Interactivity notes describe the interaction rather than a "
     "specific authoring-tool feature, because this lesson is built in code rather than in Rise.")

# ───────────────────────────────── contents ───────────────────────────────
section("Table of Contents")
toc = [
    ("Introduction", ["Course Overview", "Someone Asks You for an Update",
                      "Why Searching Thoroughly Matters"]),
    ("Two Rules Before You Touch the Keyboard", ["Assume a Record Already Exists",
                                                 "Never Create Before You Search"]),
    ("Preparing to Search", ["What to Collect First", "The Order to Ask In", "Confirm the Spelling"]),
    ("How Search Works", ["One Bar, Many Kinds of Information", "Searching by Name",
                          "Searching by Date of Birth", "Searching by Social Security Number",
                          "Reading the Results"]),
    ("When Search Comes Up Empty", ["Alternate Names", "Alternate Spellings",
                                    "Start Over From a Different Fact",
                                    "Street Outreach: Searching by Location", "Ask Your Data Staff",
                                    "Only Then, Create a Record"]),
    ("Practice: Finding a Participant",
     ["How the Practice Works"] +
     [f"Task {t['n']} — {HEADINGS[t['id']]}" for t in TASKS[:8]] +
     ["Checkpoint: From Finding to Verifying"]),
    ("Verify: Is This the Right Person?", ["First Level: Photo and Documents",
                                           "Second Level: Two of Three", "Still Unsure",
                                           "If You Later Find You Were Wrong",
                                           "Record the Match, Then Keep Looking"]),
    ("What You Found", ["No Matching Record", "One Matching Record", "Several Matching Records",
                        "Choosing Which Record to Work From"]),
    ("Practice: Verifying a Record",
     [f"Task {TASKS[8]['n']} — {HEADINGS[TASKS[8]['id']]}",
      f"Task {TASKS[9]['n']} — {HEADINGS[TASKS[9]['id']]}",
      "Task 11 — Where They Have Been Staying",
      f"Task 12 — {HEADINGS[TASKS[10]['id']]}",
      f"Task 13 — {HEADINGS[TASKS[11]['id']]}"]),
    ("When You Are Short on Time", ["In the Field"]),
    ("Knowledge Check", []),
    ("Take This With You", ["The One-Page Version"]),
    ("Summary", ["What You Practiced", "Survey"]),
]
for sec, tops in toc:
    para(sec, bold=True, space_after=2)
    for t in tops:
        para(t, space_after=1)

d.add_page_break()

# ───────────────────────────────── introduction ───────────────────────────
section("Introduction")

topic("Course Overview")
body("This lesson is about one thing: finding out whether the person in front of you already has a "
     "record in HMIS, and making sure you are looking at the right one.")
body("Set aside about fifty minutes. Roughly half of that is hands on: you will work in a "
     "practice version of Clarity — the same screens you use at work, with invented people in "
     "them. Nothing you do in the practice affects real records, and none of the people in it "
     "are real.")
body("You can return to this lesson any time after you finish it.")
note("Thirteen scored tasks and a knowledge check is a long single sitting. If the series would "
     "rather run shorter lessons, the natural cut is the checkpoint between task 8 and task 9 — "
     "eight tasks on searching, four on verifying.")
note("Opening screen. Course title, estimated time, and a Begin button. The Begin button also "
     "satisfies the browser requirement that the learner interact with the page before audio can play.")

topic("Before You Start")
body("One question before the lesson begins: which Continuum of Care do you work with?")
note("Single-select, asked on the opening screen and stored for the rest of the course. It "
     "decides which CoC the lesson names when it talks about the unduplicated count, and it is "
     "worth knowing who is taking this training.")
ask("Author question: is a pre-survey required for this course, or is this an enrollment "
     "question rather than a lesson question? If enrollment already captures the learner's CoC, "
     "this screen should be dropped rather than asking for it twice.")

topic("Someone Asks You for an Update")
body("There is a cleanup on the block this morning. People are moving their things, and your team "
     "is working the encampment.")
body("Someone walks up to you. Not a stranger exactly — you have seen him here before. He wants to "
     "know whether there is any news about interim housing for him.")
body("It is a fair question and it deserves a real answer. To give him one you need his record.")
body("So the first thing you do is not paperwork and it is not a form. It is a search.")
body("Get it right and everything he is already owed comes with him — the time he has waited, the "
     "programs he is enrolled in, the place he holds on a list. Get it wrong and he starts again "
     "from nothing in a second record, while the first one sits somewhere with his history in it.")
note("Opening sequence. Photographs with slow pan and zoom, narration over the top, captions on "
     "screen throughout. Roughly 60 to 90 seconds. Ends on a Continue button rather than running "
     "straight into the next screen.")
ask("Author question: is there an approved participant persona and photo set we should use here, or "
     "should this stay illustrative? Photographs of people experiencing homelessness carry consent "
     "considerations even when licensed, and an illustrative style avoids that entirely.")
ask("Author question: this opener now matches the way outreach staff describe it — a city cleanup, "
     "and the participant approaches asking for an update on interim housing. Confirm that is "
     "representative, and give the participant a name if the team has a persona it already uses.")

topic("Why Searching Thoroughly Matters")
body("Searching thoroughly is how a participant keeps what they have already earned. Their wait "
     "time, their enrollments, their referrals and their place in a queue all live on the record, "
     "so finding the right one is the difference between continuing their case and restarting it.")
body("It also avoids duplicate records, keeps a participant's full history available, and prevents "
     "delays later. When records are split or incomplete, participants can lose access to services "
     "or housing opportunities, and staff spend time afterwards repairing the data.")
sub("What a thorough search protects")
bullet("Continuity of care across every provider the participant has worked with")
bullet("A complete history when they are being qualified for services or housing")
bullet("Time — yours and your colleagues' — that would otherwise go into merging records later")
body("There is one more reason, and it reaches past your agency. Your Continuum of Care reports an "
     "unduplicated count of everyone served. A duplicate record counts one person twice. Enough of "
     "them and the region's picture of homelessness stops matching reality.")
note("Consider a short animated figure: one person, two record cards, and the count reading 2. "
     "Static illustration is fine if animation is out of scope.")

# ───────────────────────────────── two rules ──────────────────────────────
section("Two Rules Before You Touch the Keyboard")

topic("Assume a Record Already Exists")
body("The goal of search is to find a record that is already there.")
body("Start from the assumption that the participant already has one. It is unlikely that you are "
     "the first homeless services staff member this person has ever spoken to — and if they have "
     "spoken to anyone, there is probably a record.")

topic("Never Create Before You Search")
body("Never create a new HMIS record for a participant until you have thoroughly searched for an "
     "existing one.")
body("This is the rule the rest of the lesson serves. Everything that follows is about what "
     "\"thoroughly\" actually means.")
note("Consider holding these two rules on screen together, with the learner clicking Continue to "
     "proceed. They are referred back to repeatedly.")

# ───────────────────────────────── preparing ──────────────────────────────
section("Preparing to Search")

topic("What to Collect First")
body("Before you search, note down the participant's full name and either their date of birth or "
     "the last four digits of their Social Security Number.")
body("Write it down. You will refer back to it several times, and asking someone to repeat their "
     "date of birth four times does not build trust.")
body("Keep the note to what you need — a name and a date of birth. Do not write down a Social "
     "Security Number, use an agency device rather than a personal one where you can, and get rid "
     "of the note once the information is in HMIS. It is a participant's identifying information "
     "and it is your responsibility for as long as you are carrying it.")
ask("Author question: confirm this matches LAHSA's data-handling policy for field notes. The "
     "earlier draft says to note the name and DOB or SSN on paper or in a phone's Notes app; the "
     "wording above deliberately stops short of the SSN.")

topic("The Order to Ask In")
body("First name, last name, date of birth. That is the order, and it is the order because it is "
     "the order people will answer in.")
body("Social Security Number comes later, if you need it. Asking a stranger for their SSN in the "
     "first minute of a conversation costs you more than it gets you, and you can search perfectly "
     "well without it.")
body("Date of birth tends to be accurate and people hesitate over it far less than they do over a "
     "Social Security Number.")
body("If someone does not want to give you their SSN, that is a legitimate answer and you can work "
     "without it. You will practice exactly that situation later in this lesson.")

topic("Confirm the Spelling")
body("Confirm the spelling of the full name before you move on.")
body("If they have any identification or written documentation, ask to see it. Documents often "
     "reveal a middle name, a second last name, or a spelling that nobody would have guessed.")

# ───────────────────────────────── how search works ───────────────────────
section("How Search Works")

topic("One Bar, Many Kinds of Information")
body("Clarity has a single search bar, and it accepts several different kinds of information at "
     "once. You can type part of a name, a date of birth, a year, or part of a Social Security "
     "Number — and you can combine them.")
body("Two things are worth knowing before you start, because they surprise people.")
sub("Results appear as you type")
body("You do not need to press Enter. The list updates with every character.")
sub("Every word you add must match")
body("Adding a word narrows the search — it never widens it. If you type a first name and a last "
     "name and get nothing, one of the two is wrong. Try each on its own.")
note("Guided walkthrough, not a passive recording. The search text types itself on screen a "
     "character at a time, a tooltip explains what is happening, the result list narrows "
     "underneath, and the learner clicks to advance when they are ready. This is the pattern the "
     "RoninWrite tutorial uses and it should be lifted from there rather than reinvented.")

topic("Searching by Name")
body("You do not need a whole name. The first few letters of a first and last name are usually "
     "enough — for Katherine Johnson, typing kat joh will find her.")
body("Short fragments are often better than full names, because a full name has to be spelled the "
     "way somebody else typed it, and fragments do not.")

topic("Searching by Date of Birth")
body("A date of birth can be written several ways and all of them work: 9/26/1976, 09/26/1976, "
     "9.26.1976, or 9-26-1976.")
body("You can also search a year on its own. If the participant knows they were born in 1976 but "
     "not the exact date, 1976 is a perfectly good search.")

topic("Searching by Social Security Number")
body("You can search the last four digits on their own, or the full number.")
body("Some records hold only part of an SSN. When a participant could not recall all of it, the "
     "missing parts were stored as X's or zeros — so a record might read XXX-XX-6789. The digits "
     "that were recorded are still searchable.")

topic("Reading the Results")
body("Each result shows the participant's name, their date of birth and age, and the last four "
     "digits of their SSN. That is what you need to tell one person from another.")
body("There is a further column, ROI, which you will see but do not need for this lesson. It is "
     "covered where it belongs, alongside consent and data sharing.")
note("ROI is deliberately not taught here — it has not been introduced anywhere in the series "
     "yet, and consent deserves explaining properly rather than in passing. The column stays "
     "visible in the simulation because it is on the real screen; the narration does not lean "
     "on it.")
ask("Author question: which lesson introduces ROI and Release of Information? This one should "
     "point forward to it by name once that is settled.")
body("A word about wording. This lesson says participant. The software says Client. They mean the "
     "same person.")
ask("Author question: confirm the team wants participant used in narration throughout, with the "
     "software's own label acknowledged once here.")

# ───────────────────────────────── empty search ───────────────────────────
section("When Search Comes Up Empty")
body("You have searched and found nothing. Before you conclude the participant is new, work through "
     "this list.")

topic("Alternate Names")
body("Ask the participant what else they have been called: a middle name, a second last name, a "
     "nickname, a shortened name. Confirm the spelling of each one.")
body("Ask to see any identification or written documentation. It is the fastest way to discover a "
     "name nobody thought to mention.")

topic("Alternate Spellings")
body("Try the spellings a previous provider might have used by mistake. For Katherine Johnson: "
     "catherine, cat, jonson, jon.")

topic("Start Over From a Different Fact")
body("Go back to the beginning and start from a different piece of information. If you began with "
     "the date of birth, begin this time with the first three letters of the first and last name.")

topic("Street Outreach: Searching by Location")
body("If you are working in street outreach, search using the Outreach module. Enter the location "
     "where you have met this participant — an address or a cross street — and look at the records "
     "at or near that location.")
note("The Outreach module is not part of this lesson's practice simulation. Consider a short "
     "screen recording, or defer it to a later lesson.")
ask("Author question: should the Outreach module be demonstrated here, or held for a dedicated "
     "outreach lesson? It is the one step in this list the practice cannot cover.")

topic("Ask Your Data Staff")
body("If you have time and your organisation has data staff, ask them. They search differently and "
     "they find things.")

topic("Only Then, Create a Record")
body("If you have worked through all of the above and still cannot find a candidate record, create "
     "a new one. At that point it is the right thing to do.")
body("When you get the chance afterwards, submit a ticket to HMIS Support with the Unique "
     "Identifier of the record you created and ask them to double-check that you did not miss an "
     "existing one.")
note("Creating a record is Lesson 2. In this lesson the Add button acknowledges the learner and "
     "explains that it is covered next — and points out when the participant in the current task "
     "already has a record.")

# ───────────────────────────────── practice ───────────────────────────────
section("Practice: Finding a Participant")

topic("How the Practice Works")
body("What follows is a practice version of Clarity. It behaves the way the real system behaves. "
     "Everyone in it is invented — nothing you do here touches a real record.")
body("You will be given thirteen situations. Each one is a person standing in front of you and "
     "something they have told you. Your job is to find their record — and, later, to prove it is "
     "the right one.")
body("The practice roster holds three hundred people. The live system holds hundreds of "
     "thousands. A search that returns a readable handful here can return pages there — so the "
     "habit to build is to narrow before you scan, not to scroll.")
note("Interactive simulation begins. The lesson panel sits to the left of the simulated interface "
     "and carries the task, feedback and score. Each task is scored: full marks first time, partial "
     "marks after a wrong attempt or a revealed hint. There is no skip; a hint is always available.")
note("Every task below traces to a paragraph of script_finding_a_participant_v3; the reference is "
     "given under each so the mapping can be checked. Each task is documented in full — the "
     "situation, the instruction, the hint, the record that is correct, and the feedback — so this "
     "script can be reviewed without opening the simulation.")
note("Scoring, which is the same for every task: ten points if they find it first time without a "
     "hint, five otherwise. Eighty per cent passes. There is no skip, and the hint is always "
     "available.")
ask("Author question: the pass mark and the cost of a hint need confirming together. As it stands "
     "a learner who takes a hint on six of the thirteen tasks cannot reach eighty per cent no "
     "matter how well they do on the rest — and the lesson does not tell them. Options are to "
     "lower the pass mark, make hints free, or make the practice unscored and let the knowledge "
     "check carry the grade.")

def emit_task(t, num=None):
    """One task, documented the way a reviewer needs to read it: the situation the
    learner is put in, what they are asked to do, the help available, the record
    that is correct, and the words they get back when they find it."""
    topic(f"Task {num or t['n']} — {HEADINGS[t['id']]}")
    note(f"Draft reference: {DRAFT_REF[t['id']]}.")
    sub("The situation, as the learner sees it")
    body(plain(t["brief"]))
    sub("What the learner is asked to do")
    body(plain(t["ask"]))
    sub("Hint, if they ask for one")
    body(plain(t["hint"]))
    def describe(name, cid, dob, ssn):
        bits = [name, f"unique identifier {cid}"]
        if dob:
            bits.append(f"born {longdate(dob)}")
        bits.append("SSN " + (ssn if ssn else "none on file"))
        return " · ".join(bits) + "."

    if t.get("answerSet"):
        sub("The correct records — both of them")
        for r in t["answerSet"]:
            bullet(describe(r["name"], r["id"], r["dob"], r["ssn"]))
        note("Scored on flagging either record as a possible duplicate, not on which one they open.")
    else:
        sub("The correct record")
        body(describe(t["answerName"], t["answerId"], t["answerDob"], t["answerSsn"]))
    sub("Feedback when they get it right")
    body(plain(t["teach"]))

for _t in TASKS[:8]:
    emit_task(_t)

topic("Checkpoint: From Finding to Verifying")
body("That is the search half. You now have every documented way in: a name fragment, a year, four "
     "digits of an SSN, an alternate spelling, a term added to narrow, and a term swapped when "
     "nothing came back.")
body("Finding a candidate record is not the same as finding the right one. The rest of this lesson "
     "is verifying: proving a record belongs to the person in front of you, and deciding what to do "
     "when more than one does.")
note("Non-scored beat between the search tasks and the verification tasks. Continue button only.")

# ───────────────────────────────── verify ─────────────────────────────────
section("Verify: Is This the Right Person?")
body("Finding a candidate record is not the same as finding the right one. Verifying is a separate "
     "step and it has an order.")

topic("First Level: Photo and Documents")
body("The quickest check is visual. Look at the photo on the record, and look under the Files tab "
     "for identification or other documentation.")
body("These can tell you immediately whether the record belongs to the person in front of you.")
note("The practice simulation does not include photos or the Files tab. Consider a still screenshot "
     "walkthrough here, or note it as covered in a later lesson.")

topic("Second Level: Two of Three")
body("If there is no photo, work through the record with the participant and check whether the "
     "information is accurate for them.")
body("Start with name, date of birth, and Social Security Number. As a rule of thumb, if at least "
     "two of those three match, you can treat the record as a match.")
body("Know where that rule is weakest. Name and year of birth agreeing is the easiest pair to hit "
     "by coincidence — common surnames and a birth year will do it. When the two that match are "
     "the name and the date of birth, and the SSN is missing rather than different, look for a "
     "third thing before you commit: a household member, a program the participant remembers, a "
     "case note that fits.")

topic("Still Unsure")
body("Confirm anything else in the record with the participant:")
bullet("Case notes")
bullet("Program history")
bullet("Household members")
bullet("Location data")
bullet("Veteran status and other demographics")

topic("If You Later Find You Were Wrong")
body("Sometimes you work from a record for a while and then something does not fit — a program "
     "history they have no memory of, a household member who does not exist.")
body("Stop entering data into it. Note what you have entered and when, and send the Unique "
     "Identifier to HMIS Support with what you found. The longer a mistaken record is worked in, "
     "the harder it is to unpick, and a record that has been added to by two agencies is a much "
     "bigger job than one caught the same day.")
ask("Author question: is this the right route for a mis-identified record — the same HMIS Support "
     "ticket as a duplicate, or a different process? The draft does not cover it and it happens.")

topic("Record the Match, Then Keep Looking")
body("If you decide the record is a match, note it down — then go back to search and look for "
     "others. Finding one match does not mean there is only one.")

# ───────────────────────────────── outcomes ───────────────────────────────
section("What You Found")

topic("No Matching Record")
body("Create a new HMIS record for this participant.")

topic("One Matching Record")
body("Assume it is the correct one and work from it.")

topic("Several Matching Records")
body("Choose one to work from, and report the rest.")

topic("Choosing Which Record to Work From")
body("Choose the most complete record — full SSN, full date of birth, full name, full program "
     "history, a photo on the profile.")
body("Where that is unclear, choose the record with the longest enrollment history, based on the "
     "oldest enrollment.")
body("Then submit the full list of matching records to HMIS Support, including every Unique "
     "Identifier, so they can merge them.")

section("Practice: Verifying a Record")
body("Five more situations. This time finding a candidate record is the easy half — the "
     "question is whether it is the right person, and what to do when more than one record "
     "could be.")

emit_task(TASKS[8])       # 9  — two people, one name
emit_task(TASKS[9])       # 10 — thin identifiers, found by household

# ---- Task 11, requested in review: confirm the profile by location ---------
topic("Task 11 — Where They Have Been Staying")
note("Draft reference: confirming other information in the record — location data.")
sub("The situation, as the learner sees it")
body("A man gives his name as David Nguyen. Two records come back. Both are David Nguyen, both "
     "born in 1982. He does not know his Social Security Number and cannot remember which agency "
     "he last worked with. He does tell you he has been staying by the wash under the 6th Street "
     "bridge, and has been for about a year.")
sub("What the learner is asked to do")
body("Open the record whose location history matches where he has been staying.")
sub("Hint, if they ask for one")
body("Name and date of birth cannot separate these two. Open each record and look at Location — "
     "one of them was last contacted at the 6th Street bridge.")
sub("The correct record")
body("To be assigned when the roster is pinned for this task.")
sub("Feedback when they get it right")
body("When name and date of birth cannot separate two records, the rest of the record can. In "
     "outreach, location is often the fastest of them: where someone has been contacted before is "
     "a fact you can both check, and it does not ask the participant to remember an agency name "
     "or a date.")
body("Confirm it with them rather than assuming. People move, and a location recorded a year ago "
     "proves less than one recorded last month — treat it as one identifier among several, not as "
     "the answer on its own.")
ask("Author question: this task is new, requested in review, and is not built yet. It needs "
     "location history on the client record page, which the simulation does not show today. "
     "Confirm the scenario is realistic — in particular whether location in Clarity is granular "
     "enough to distinguish two people this way, or whether it is recorded loosely enough that "
     "this would mislead.")

emit_task(TASKS[10], num=12)   # more than one record matches
emit_task(TASKS[11], num=13)   # a genuine duplicate

# ───────────────────────────────── time pressure ──────────────────────────
section("When You Are Short on Time")

topic("In the Field")
body("Sometimes you cannot do all of this on the spot. In street outreach, under time pressure, you "
     "have two honest options.")
num("Write everything down — on paper or in your notes — and do the full search and verification "
    "later at the office. Then enter what you noted once you have found the right record.")
num("Create a record, if you need a Unique Identifier for the participant right away. Then report "
    "it to HMIS Support so they can check whether it duplicates an existing record, and tell you "
    "how to merge them if it does.")
body("What is not an option is creating a record and saying nothing.")

# ───────────────────────────────── knowledge check ────────────────────────
section("Knowledge Check")
note("Scored knowledge check. Correct answers in green, incorrect in orange. Randomise answer "
     "order. Every option needs feedback text, not just a right-or-wrong mark — the feedback for "
     "each question is given below it, and the wrong answers here are wrong for reasons worth "
     "saying out loud.")

body("1. You search a participant's name and get no results. What does that tell you?")
answer("Very little on its own — the record may be under a different name or spelling", True)
answer("That the participant has never received services before", False)
answer("That you should create a new record", False)
note("Feedback: an empty result is the single most misread signal in HMIS. It usually means the "
     "record is under a name, a spelling or an identifier you have not tried yet.")

body("2. A participant says she was born in 1985 but cannot remember the exact date. What can you search?")
answer("The year on its own", True)
answer("Nothing — a full date of birth is required", False)
answer("Only the first three letters of her name", False)
note("Feedback: a year on its own is a valid search. So is a fragment of a date. You do not need "
     "the whole thing to start narrowing.")

body("3. Two records share a name, but you have not compared anything else yet. What is your "
     "next step?")
answer("Compare a second identifier — date of birth, or the SSN fragment", True)
answer("Treat them as the same person, because the name matches", False)
answer("Work from whichever record you opened first", False)
note("Feedback: a name on its own is never enough. Two of the three — name, date of birth, SSN — "
     "have to agree before you treat a record as a match. Deciding on the name alone is how one "
     "person ends up with two records, and how two people end up sharing one.")

body("4. A participant will not give you their Social Security Number. What can you still do?")
answer("Search on name and date of birth — the SSN is one route in, not the only one", True)
answer("Nothing until they provide it", False)
answer("Create a new record, since you cannot confirm the old one", False)
note("Feedback: refusing is a legitimate answer, and it is recorded as one. Plenty of records hold "
     "no SSN at all, or only part of one. Name and date of birth will find most people, and the "
     "rest of the record — household, program history, case notes — can confirm the match.")

body("5. You find two records that clearly describe the same person. What is your next step?")
answer("Flag them and report them to HMIS Support with their Unique Identifiers", True)
answer("Merge the two records yourself", False)
answer("Delete the one with less information", False)
note("Feedback: merging and deleting are not yours to do, and doing them locally is how history "
     "gets lost. Report both Unique Identifiers to HMIS Support and they resolve it centrally, "
     "which is what keeps the CoC's unduplicated count honest.")

body("6. When is it correct to create a new record?")
answer("Only after you have worked the whole list — alternate names and spellings, a different "
       "identifier, the Outreach module if you are in the field, and your data staff if you have "
       "them — and still found nothing", True)
answer("After the participant's name returns no results", False)
answer("Whenever the participant says they have not received services before", False)
note("Feedback: creating a record is the last step, not the second one. An empty result means your "
     "search has not found them yet — it is not evidence that they are new. And when you do create "
     "one, send the Unique Identifier to HMIS Support and ask them to double-check.")

ask("Author question: does the knowledge check carry the grade for this lesson, or the practice, "
     "or both? If the lesson is delivered in Rise with the simulation embedded, the simulation "
     "cannot report a score to the course — so the knowledge check would have to be the graded "
     "instrument, and the practice becomes ungraded rehearsal.")

# ───────────────────────────────── job aid ────────────────────────────────
section("Take This With You")

topic("The One-Page Version")
body("This work happens on a phone, standing up, usually while something else is going on. Nobody "
     "is going to reopen a fifty-minute course to remember the order to search in. So the lesson "
     "ends with a card you can keep.")
sub("What the card holds")
bullet("Ask in this order: first name, last name, date of birth. SSN later, if you need it.")
bullet("Search short. Two or three letters of each name beats a full name you might misspell.")
bullet("A year on its own is a valid search. So is a fragment of a date, or four digits of an SSN.")
bullet("Every word you type must match. If you get nothing, take a word away.")
bullet("Swaps worth trying: C and K, I and Y. Catherine and Katherine. Jonson and Johnson.")
bullet("Two of three — name, date of birth, SSN — before you call it a match.")
bullet("Empty result is not proof they are new.")
bullet("Never merge, never delete. Report both Unique Identifiers to HMIS Support.")
note("Downloadable one-page PDF, and the same content as an on-screen summary for anyone who will "
     "not download it. Sized to be readable on a phone.")
ask("Author question: is there a house format for job aids this should follow, and does anything "
     "need to go on it that is not in the list above?")

# ───────────────────────────────── summary ────────────────────────────────
section("Summary")

topic("What You Practiced")
body("You searched on a name fragment, on a year, on four digits of a Social Security Number, and "
     "on a name that had been typed a different way. You narrowed a search that returned too much, "
     "and you swapped an identifier when a search returned nothing.")
body("Then you verified. You told two people with the same name apart on a second identifier. You "
     "identified someone whose record held almost no identifiers, using her household. You chose "
     "between three records that all matched. And you recognised the same person entered twice, and "
     "reported it rather than fixing it yourself.")
body("The habit underneath all of it is one sentence: an empty result is not proof that someone is "
     "new. Search the surname fragment, search the year of birth, confirm on a second identifier — "
     "and only then create a record.")
body("Lesson 2 covers creating that record, where this habit is the only thing standing between you "
     "and a duplicate.")

topic("Survey")
body("Now that you have completed the lesson, we would appreciate your feedback. Please complete "
     "the short survey below.")
note("Survey embed.")

OUT = "script_l1_v3.docx"
d.save(OUT)

# python-docx emits <w:zoom/> with no w:percent, which fails XSD validation and
# makes some tools refuse the file. Fill it in rather than leaving it malformed.
import zipfile, shutil, tempfile
_tmp = tempfile.mkdtemp()
with zipfile.ZipFile(OUT) as z:
    z.extractall(_tmp)
_st = os.path.join(_tmp, "word", "settings.xml")
if os.path.exists(_st):
    _x = open(_st, encoding="utf-8").read()
    _new = _re.sub(r"<w:zoom(?![^>]*w:percent)([^>]*?)/>",
                   r'<w:zoom\1 w:percent="100"/>', _x)
    if _new != _x:
        open(_st, "w", encoding="utf-8").write(_new)
os.remove(OUT)
with zipfile.ZipFile(OUT, "w", zipfile.ZIP_DEFLATED) as z:
    for root, _, files in os.walk(_tmp):
        for f in files:
            full = os.path.join(root, f)
            z.write(full, os.path.relpath(full, _tmp))
shutil.rmtree(_tmp)
print("written:", OUT)
