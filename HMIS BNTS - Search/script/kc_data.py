"""The knowledge check, in one place.

`make_script.py` renders these into the docx and `build.sh` emits them as JSON for
the card page, so the questions cannot drift between the script and the build. The
script is still the authority: change the copy here, rebuild both.

Each question is (prompt, [(answer, correct), ...], feedback). The feedback is
written for the question as a whole — it is what the learner reads once they have
answered, whichever way they answered.
"""

QUESTIONS = [
    (
        "You search a participant's name and get no results. What does that tell you?",
        [
            ("Very little on its own — the record may be under a different name or spelling", True),
            ("That the participant has never received services before", False),
            ("That you should create a new record", False),
        ],
        "An empty result is the single most misread signal in HMIS. It usually means the record "
        "is under a name, a spelling or an identifier you have not tried yet.",
    ),
    (
        "A participant says she was born in 1985 but cannot remember the exact date. "
        "What can you search?",
        [
            ("The year on its own", True),
            ("Nothing — a full date of birth is required", False),
            ("Only the first three letters of her name", False),
        ],
        "A year on its own is a valid search. So is a fragment of a date. You do not need the "
        "whole thing to start narrowing.",
    ),
    (
        "Two records share a name, but you have not compared anything else yet. "
        "What is your next step?",
        [
            ("Compare a second identifier — date of birth, or the SSN fragment", True),
            ("Treat them as the same person, because the name matches", False),
            ("Work from whichever record you opened first", False),
        ],
        "A name on its own is never enough. Two of the three — name, date of birth, SSN — have "
        "to agree before you treat a record as a match. Deciding on the name alone is how one "
        "person ends up with two records, and how two people end up sharing one.",
    ),
    (
        "A participant will not give you their Social Security Number. What can you still do?",
        [
            ("Search on name and date of birth — the SSN is one route in, not the only one", True),
            ("Nothing until they provide it", False),
            ("Create a new record, since you cannot confirm the old one", False),
        ],
        "Refusing is a legitimate answer, and it is recorded as one. Plenty of records hold no "
        "SSN at all, or only part of one. Name and date of birth will find most people, and the "
        "rest of the record — household, program history, case notes — can confirm the match.",
    ),
    (
        "Two records look like they could be the same person, and you cannot tell them apart on "
        "name, date of birth or SSN alone. What do you do?",
        [
            ("Keep looking at the rest of each record — household, program history, location — "
             "until one of them fits the person in front of you", True),
            ("Pick whichever record you opened first", False),
            ("Assume they are different people, because there are two records", False),
        ],
        "The identifiers are where you start, not where you stop. When they will not settle it, "
        "the rest of the record usually will — and it is worth the extra minute, because the "
        "alternative is working from somebody else's history.",
    ),
    (
        "When is it correct to create a new record?",
        [
            ("Only after you have worked the whole list — alternate names and spellings, a "
             "different identifier, and your data staff if you have them — and still found "
             "nothing", True),
            ("After the participant's name returns no results", False),
            ("Whenever the participant says they have not received services before", False),
        ],
        "Creating a record is the last step, not the second one. An empty result means your "
        "search has not found them yet — it is not evidence that they are new. And when you do "
        "create one, send the Unique Identifier to HMIS Support and ask them to double-check.",
    ),
]

# The learner has to clear this before the block reports itself complete to Rise.
# Nothing is reported to Rise but the completion itself — there is no score, by
# decision, and Rise could not receive one anyway.
PASS_MARK = 0.8


def as_json() -> str:
    """The same questions, shaped for the card page.

    `build.sh` writes this to `src/kc.json` and stamps it into the template, so
    the page and the docx are rendered from one list. Answer order is *not*
    shuffled here — the page shuffles per deal, and a fixed order on disk keeps
    the diff readable and the docx stable.
    """
    import json

    return json.dumps(
        {
            "pass": PASS_MARK,
            "questions": [
                {
                    "q": prompt,
                    "a": [{"t": text, "ok": correct} for text, correct in answers],
                    "fb": feedback,
                }
                for prompt, answers, feedback in QUESTIONS
            ],
        },
        indent=2,
    )


if __name__ == "__main__":
    print(as_json())
