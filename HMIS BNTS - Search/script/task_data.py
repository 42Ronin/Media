#!/usr/bin/env python3
"""One source of task copy for everything that renders it.

`tasks.json` is transcribed out of the built simulation by `extract_tasks.mjs`.
Two tasks are specified in the script but not built yet, and they live in
`proposed-tasks.json`. And where a review decision has changed the copy but the
build has not caught up, the change is recorded in OVERRIDES rather than being
applied by hand in each place that renders a task — which is how the script, the
snippets and the simulation drift apart.

Anything in OVERRIDES is a debt: the build has to follow, and until it does the
script is the one that is right.
"""
import json
import os
import re

HERE = os.path.dirname(os.path.abspath(__file__))


def _load(name):
    with open(os.path.join(HERE, name)) as fh:
        return json.load(fh)


def plain(html):
    """The lesson marks copy up for the screen; a document wants the words."""
    s = re.sub(r"<[^>]+>", "", html)
    s = (s.replace("&amp;", "&").replace("&lt;", "<").replace("&gt;", ">")
          .replace("&nbsp;", " ").replace("&#39;", "'").replace("&quot;", '"'))
    return re.sub(r"\s+", " ", s).strip()


MONTHS = ("January February March April May June July August September "
          "October November December").split()


def longdate(iso):
    y, m, d = iso.split("-")
    return f"{int(d)} {MONTHS[int(m) - 1]} {y}"


# --- copy the script has changed and the build has not yet -------------------
# Keyed by task id, then by field. Each carries the reason, so nobody deletes one
# without knowing what it was for.
OVERRIDES = {
    "several": {
        "teach": (
            "Work from the most complete record — full SSN, full date of birth, full name, "
            "full program history. Where that is unclear, take the one with the longest "
            "enrollment history, based on the oldest enrollment. Note the Unique Identifiers "
            "of the others as you go, so you are not starting from nothing if it comes up "
            "again."
        ),
        "_why": "Reporting duplicates was removed from this training. The built version still "
                "ends by sending the list to HMIS Support.",
    },
}

DRAFT_REF = {
    "nickname":  "alternate names and nicknames",
    "year":      "search by year of birth alone",
    "last4":     "search by the last four digits of the Social Security Number",
    "fragments": "search the first letters of the first and last name, as in kat joh",
    "narrow":    "narrowing an over-broad result set by adding a term",
    "swap":      "replacing one search term with another piece of information",
    "spelling":  "alternate spellings, C and K, I and Y",
    "surname":   "second last names and compound surnames",
    "samename":  "a record is a match when at least two of name, date of birth and SSN agree",
    "household": "confirming other information in the record — household members, program "
                 "history, case notes, location, veteran status",
    "several":   "choosing which matching record to work from",
}

HEADINGS = {
    "nickname":  "The Name He Gave You",
    "year":      "When the Last Name May Have Changed",
    "last4":     "Starting From the Last Four of the SSN",
    "fragments": "A Name You Cannot Spell",
    "narrow":    "Too Many Results",
    "swap":      "Nothing Comes Back",
    "spelling":  "Spelled the Way Someone Else Heard It",
    "surname":   "A Surname Typed as One Word",
    "samename":  "Two People, One Name",
    "household": "When the Identifiers Are Thin",
    "several":   "More Than One Record Matches",
}

# Tasks 12 and 14 of the build are gone — the duplicate-reporting task was cut —
# so the running order is the eight search tasks, then these five.
SEARCH_IDS = ["nickname", "year", "last4", "fragments",
              "narrow", "swap", "spelling", "surname"]
VERIFY_IDS = ["samename", "household", "location", "smoke", "several"]


def _describe(name, cid, dob, ssn):
    bits = [name, f"unique identifier {cid}"]
    if dob:
        bits.append(f"born {longdate(dob)}")
    bits.append("SSN " + (ssn if ssn else "none on file"))
    return " · ".join(bits) + "."


def specs():
    """Every task in running order, as plain text ready to render."""
    built = {t["id"]: t for t in _load("tasks.json")["tasks"]}
    proposed = {t["id"]: t for t in _load("proposed-tasks.json")}
    out = []
    for n, tid in enumerate(SEARCH_IDS + VERIFY_IDS, start=1):
        if tid in proposed:
            p = proposed[tid]
            out.append({
                "n": n, "id": tid, "built": False,
                "title": p["title"], "draft_ref": p["draft_ref"],
                "situation": p["situation"], "instruction": p["instruction"],
                "hint": p["hint"], "answer": p["answer"], "feedback": p["feedback"],
            })
            continue
        t = built[tid]
        ov = OVERRIDES.get(tid, {})
        if t.get("answerSet"):
            answer = [_describe(r["name"], r["id"], r["dob"], r["ssn"])
                      for r in t["answerSet"]]
        else:
            answer = _describe(t["answerName"], t["answerId"],
                               t["answerDob"], t["answerSsn"])
        out.append({
            "n": n, "id": tid, "built": True,
            "title": HEADINGS[tid], "draft_ref": DRAFT_REF[tid] + ".",
            "situation": plain(ov.get("brief", t["brief"])),
            "instruction": plain(ov.get("ask", t["ask"])),
            "hint": plain(ov.get("hint", t["hint"])),
            "answer": answer,
            "feedback": plain(ov.get("teach", t["teach"])),
        })
    return out


def debts():
    """What the build owes the script, for reporting rather than for rendering."""
    return {tid: v["_why"] for tid, v in OVERRIDES.items()}
