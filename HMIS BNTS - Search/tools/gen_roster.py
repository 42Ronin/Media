#!/usr/bin/env python3
"""
Generates the shared fictional client roster used by every lesson in this course.

Deterministic: same seed -> same 300 people, so Lesson 1 and Lesson 2 show
identical records and IDs.

SAFETY: every generated SSN area segment is either 900-999 -- a range the Social
Security Administration has never issued -- or a placeholder (XXX / 000). So no
generated SSN can collide with a real person's, even displayed unmasked.

Partial SSNs follow HMIS convention: segments the client cannot recall are filled
with X or 0 at that segment's width, and carry the "approximate or partial"
data-quality code.

Scenario answers are pinned first, then generated records are rejected if they
would make a scenario answer ambiguous (see GUARDS).
"""
import json, random, os

SEED = 20260724
TOTAL = 300
OUT = os.path.join(os.path.dirname(__file__), "..", "src", "roster.json")

rnd = random.Random(SEED)

# ---------------------------------------------------------------- name pools
FIRST_F = """Denise Priya Alicia Yvonne Camille Rosalind Simone Beatrice Naomi Lorraine
Evelyn Aisha Selena Gwendolyn Tamara Adaeze Marisol Ingrid Carmen Delphine Harriet Josephine
Kalinda Leona Mabel Nadia Ofelia Paloma Quiana Rhoda Saoirse Thandiwe Ursula Valentina Winona
Xiomara Yolanda Zora Annika Bernadette Clarissa Dorothea Esperanza Fatima Genevieve Hilda
Imani Jacinta Katarina Lucinda Magdalena Noor Octavia Perpetua Rosalie Sunniva Tabitha
Ulrike Vashti Wilhelmina Yuki Zainab Amara Brigid Colette Dagny Elspeth Freya Greta Hana""".split()

FIRST_M = """Tyrell Gregory Marcus Nathaniel Devon Hector Omar Curtis Terrence Dwayne Vincent
Isaiah Rafael Julian Abelardo Bartholomew Cornelius Demetrius Ezekiel Fitzgerald Gideon Horace
Ignatius Jarrod Kwame Leopold Mordecai Nikolai Osvaldo Percival Quentin Roscoe Solomon Thaddeus
Ulysses Virgil Wendell Xavier Yusuf Zachariah Amias Boaz Caspian Dashiell Emmerich Ferdinand
Gaspard Hendrik Ilias Jorunn Kazimir Lorcan Matthias Nestor Obadiah Piotr Rasmus Soren Tobias
Ulrich Vasili Wilfred Yannick Zoltan Anselm Broderick Cyprian""".split()

FIRST_N = "Devon Rowan Sage Quinn Ellis Marlowe Aubrey Lennox Emerson Auden Kit Rene".split()

LAST = """Okonkwo Banks Raghavan Halvorsen Fontaine Chukwu Bergstrom Boudreaux Ashworth Vega
Marquez Whitaker Haddad Lindqvist Abernathy Sandoval Okafor Petrosyan Castellanos Fitzgerald
Bennani Kowalczyk Moreau Thornbury Achebe Ocampo Blackwell Mbeki Arrington Balogun Castellano
Dziedzic Eastwood Fairweather Gallagher Hollingsworth Ivanenko Jankowski Kirkpatrick Lindstrom
Montenegro Nwachukwu Oyelaran Pemberton Quarshie Rasmussen Stankovic Tremblay Ueda Vasquez
Wojciechowski Yamamoto Zielinski Achterberg Brennan Cavanaugh Delacroix Engelhardt Farrugia
Grimaldi Haverford Isaksson Jimenez Kaczmarek Larkspur Mendelsohn Nakagawa Osterman Pahlavi
Quintanilla Rothschild Svendsen Thibodeaux Ulrich Verhoeven Wickersham Yildirim Zabala
Ainsworth Bordelon Chaudhry Dunkerley Escalante Fitzwilliam Ghorbani Huntington Ilyushin
Jaramillo Kensington Lombardi Mwangi Novotny Oyelowo Prendergast Rutherford Sorensen Tanaka
Underhill Villanueva Waterhouse Zamora Adeyemi Bellweather Cortazar Drummond""".split()

PRONOUNS = ["She/Her/Hers", "He/Him/His", "They/Them/Theirs"]

# HUD race and ethnicity categories, plus the standard non-response codes
RACE = ["American Indian, Alaska Native, or Indigenous", "Asian or Asian American",
        "Black, African American, or African", "Hispanic/Latina/e/o",
        "Middle Eastern or North African", "Native Hawaiian or Pacific Islander",
        "White", "White, Hispanic/Latina/e/o", "Black, African American, or African, White",
        "Client doesn't know", "Client refused", "Data not collected"]
QNAME = ["Full name reported", "Full name reported", "Full name reported",
         "Partial, street name, or code name reported", "Client refused"]
QDOB  = ["Full DOB Reported", "Full DOB Reported", "Full DOB Reported",
         "Approximate or partial DOB reported", "Client refused"]
STAFF = ["S. Ramirez", "T. Okoye", "M. Lindgren", "J. Whitfield", "A. Barnes",
         "K. Nakamura", "D. Ferreira", "L. Mbatha", "C. Yoon", "R. Delacroix"]
COLORS = 8

def ssn():
    return "9%02d-%02d-%04d" % (rnd.randint(0, 99), rnd.randint(1, 99), rnd.randint(1, 9999))

def partial_ssn():
    """A client who can recall only part of their SSN.

    The unknown segments are filled with X or 0 at the segment's own width:
    XXX / 000 for the area, XX / 00 for the group, XXXX / 0000 for the serial.
    Never all three — a client who recalls nothing is 'client doesn't know',
    not a partial report.
    """
    area = "9%02d" % rnd.randint(0, 99)
    group = "%02d" % rnd.randint(1, 99)
    serial = "%04d" % rnd.randint(1, 9999)
    fill = rnd.choice("X0")
    masked = rnd.choice(["area", "area+group", "group", "serial", "group+serial"])
    if "area" in masked:   area = fill * 3
    if "group" in masked:  group = fill * 2
    if "serial" in masked: serial = fill * 4
    return "%s-%s-%s" % (area, group, serial)

def iso(y, m, d):
    return "%04d-%02d-%02d" % (y, m, d)

def rand_dob(lo=18, hi=78):
    age = rnd.randint(lo, hi)
    y = 2026 - age
    m = rnd.randint(1, 12)
    d = rnd.randint(1, 28)
    return iso(y, m, d)

def rand_updated():
    return iso(rnd.choice([2025, 2026]), rnd.randint(1, 12), rnd.randint(1, 28))

# ------------------------------------------------------------ scenario cast
# Every task below traces to a paragraph of script_finding_a_participant_v3,
# the vetted LAHSA draft. The paragraph reference is on each entry.
# q: ssn data-quality code. full | approx | refused | unknown | notcollected
def C(i, f, l, d, s, q="full", roi="Yes", a="", p="", vet="No"):
    return {"i": i, "f": f, "l": l, "a": a, "p": p, "d": d, "s": s, "q": q,
            "r": roi, "h": 1, "v": vet, "u": rnd.choice(STAFF), "t": rand_updated(),
            "c": rnd.randrange(COLORS)}

SCRIPTED = [
    # 1  alternate names / nicknames — draft 46-50
    C("357BF6714", "Michael", "Torres", "1979-03-14", "912-45-8802"),
    # 2  year of birth only — draft 29
    C("F565C146B", "Katherine", "Morrison", "1985-07-22", "934-17-3145", p="She/Her/Hers"),
    # 3  last 4 of SSN — draft 31.  Two people share 7742, so the fragment
    #    narrows but does not decide; the participant's name settles it.
    C("D41A7C930", "Danielle", "Whitmore", "1991-05-14", "918-30-7742", p="She/Her/Hers"),
    C("6E23B0A85", "Marcus",   "Pell",     "1976-02-03", "944-61-7742"),
    # 4  first letters of each name — draft 33-34 ("kat joh")
    C("B8F0D3771", "Krzysztof", "Wojciechowski", "1968-07-30", "927-14-6053"),
    # 5  too many results, narrow by adding a term — draft 38-41
    C("A50C9E214", "Esperanza", "Garcia", "1987-04-09", "935-72-1180", p="She/Her/Hers"),
    # 6  zero results, swap one identifier for another — draft 42-45
    C("72B6F1C08", "Adrian", "Fenwick", "1988-12-04", "959-23-5518"),
    # 7  alternate spellings, C and K — draft 51-59
    C("E19D4A6B3", "Kathleen", "Brennan", "1983-09-17", "941-88-2076", p="She/Her/Hers"),
    # 8  second last name / compound surname filed as one word — draft 47
    C("2A8189B34", "Maria", "Delacruz", "1974-01-28", "918-54-5527"),
    # 9  two people, one name; verify on two of three — draft 79-80
    C("3DF1DF674", "James", "Wilson", "1968-09-02", "941-33-4471"),
    C("8C7A8F2D2", "James", "Wilson", "1991-04-17", "968-20-9038", a="Jim"),
    # 10 verify with household members when identifiers are thin — draft 81-86
    C("C4E7B2019", "Yolanda", "Amari", "1980-06-21", None, q="unknown", p="She/Her/Hers"),
    C("9B3F5D6C7", "Iris",    "Amari", "2011-10-02", None, q="notcollected", p="She/Her/Hers"),
    # 11 several matching records; choose the most complete — draft 96-98
    C("F2A6C8D40", "Rosalind", "Vega", "1983-04-11", "961-27-1173", a="Roz", p="She/Her/Hers"),
    C("5C1B9E730", "Rosalind", "Vega", "1983-04-11", "961-XX-XXXX", q="approx"),
    C("8D40A2F16", "Rosalind", "Vega", "1983-04-11", None, q="refused"),
    # 12 a genuine duplicate; report, never merge — draft 99
    C("5BB517588", "Shauna", "Beckett", "1993-04-30", "926-71-2210", p="She/Her/Hers"),
    C("6381E5405", "Shawna", "Beckett", "1993-04-30", "926-71-2210", p="She/Her/Hers"),
    # 11 (script order) confirm by location — draft 81-86, "location data".
    #    Two David Nguyens, same birth year, neither with an SSN. Only the
    #    location history separates them.
    C("6C2D91B47", "David", "Nguyen", "1982-03-09", None, q="refused"),
    C("D3A7E0C85", "David", "Nguyen", "1982-11-22", None, q="unknown"),
    # 12 (script order) everything at once — draft 46-59.
    #    He answers to Smoke, which is on no record. The surname is three
    #    plausible spellings deep, so only the fragment "Rey" reaches all of
    #    them, and the year plus veteran status is what settles it.
    C("A19F4C2E8", "Elias",  "Reyez", "1971-06-14", None, q="refused", vet="Yes"),
    C("B72E5D3F1", "Marisol", "Reyes", "1971-02-27", "933-40-1182", p="She/Her/Hers"),
    C("C58A6E4D2", "Hector", "Reyes", "1988-09-03", "947-22-6690"),
    C("E41B7F5A3", "Lucia",  "Reynoso", "1971-12-08", "952-19-3374", p="She/Her/Hers"),
    C("F93C8A6B4", "Tomas",  "Rios",  "1976-04-19", "918-77-2051"),
    # Capstone sandbox. She introduces herself as Sylvia Marchetti: the spelling
    # is wrong and the surname is one she stopped using. Nothing she offers at
    # first reaches her, so the learner has to ask, respell, narrow, and then
    # confirm on the household — every technique the tasks taught, in one go.
    C("7E1D4A9C3", "Silvia", "Duarte",   "1979-05-08", None, q="refused", p="She/Her/Hers"),
    C("2B8F6E1D5", "Mateo",  "Duarte",   "2014-02-17", None, q="notcollected"),
    # No SSN on either Silvia. If one had a number on file, a learner could pick
    # the other by elimination — she declined to give hers, which says nothing
    # about what is stored. The household has to be the only thing that decides.
    C("9A3C7B2E6", "Silvia", "Okonkwo",  "1979-10-30", None, q="unknown", p="She/Her/Hers"),
    C("4D6E8F1A2", "Silvana","Moreau",   "1991-07-22", "938-64-2207", p="She/Her/Hers"),
    C("8C5B3D7E9", "Silas",  "Whitcomb", "1966-11-05", "925-13-9948"),
    C("1F2A5C8B4", "Sileshi","Abate",    "1984-03-26", "957-81-4432"),
]

# Households that a scripted task depends on, by client id.
PINNED_HOUSEHOLDS = [
    ("C4E7B2019", "9B3F5D6C7"),      # task 10: Yolanda Amari and her daughter Iris
    ("7E1D4A9C3", "2B8F6E1D5"),      # capstone: Silvia Duarte and her son Mateo
]

# Eleven more Garcias so that surname alone overflows a page of results (task 5).
for _gi, (_gf, _gd) in enumerate([
        ("Rafael", "1972-03-18"), ("Lucia", "1990-11-27"), ("Tomas", "1965-08-05"),
        ("Ines", "1998-01-22"), ("Emilio", "1979-06-14"), ("Beatriz", "1984-09-30"),
        ("Santiago", "1993-12-08"), ("Pilar", "1969-05-16"), ("Joaquin", "2000-02-11"),
        ("Mercedes", "1976-07-25"), ("Alonso", "1988-10-19")]):
    SCRIPTED.append(C("G%02d7C4E1B" % _gi, _gf, "Garcia", _gd, ssn()))

# ------------------------------------------------------------------- GUARDS
# A generated record is rejected if it would make any scenario answer ambiguous.
def violates(c):
    f, l, d = c["f"], c["l"], c["d"]
    lo_l, lo_f, lo_a = l.lower(), f.lower(), c["a"].lower()
    # 1: no second Torres reachable by "Tor"; nobody answers to "Lefty"
    if lo_l.startswith("tor"): return True
    if lo_f.startswith("left") or lo_l.startswith("left") or lo_a.startswith("left"): return True
    # 2: no other Morrison, and no other 1985-born Kat*
    if lo_l.startswith("morr"): return True
    if d[:4] == "1985" and (lo_f.startswith("kat") or lo_a.startswith("kat")): return True
    # 3: only the two pinned records may end 7742
    if c["s"] and c["s"].endswith("7742"): return True
    if lo_l.startswith("whitmore") or lo_l.startswith("pell"): return True
    if lo_f.startswith("danielle"): return True
    # 4: one Wojciechowski, one Krzysztof
    if lo_l.startswith("woj") or lo_f.startswith("krz"): return True
    # 5: Garcias are pinned, so no generated ones
    if lo_l.startswith("garcia") or lo_f.startswith("esperanza"): return True
    # 6: one Fenwick, and nobody else born on either reading of that date
    if lo_l.startswith("fen"): return True
    if d in ("1988-12-04", "1988-04-12"): return True
    # 7: one Brennan; nobody spelled with a leading C that would rescue the guess
    if lo_l.startswith("brennan"): return True
    if lo_f.startswith("cath") or lo_f.startswith("kath"): return True
    # 8: no Cruz or Delacruz at all — "Cruz" must match nobody
    if "cruz" in lo_l: return True
    # 9: no third James Wilson
    if lo_l == "wilson" and lo_f == "james": return True
    # 10: the Amari household is pinned
    if lo_l.startswith("amari"): return True
    # 11: exactly three Vegas, all Rosalind
    if lo_l.startswith("vega") or lo_f.startswith("rosalind"): return True
    # 12: no third Beckett
    if lo_l.startswith("beckett"): return True
    # location task: exactly two Nguyens, both David, nobody else close
    if lo_l.startswith("nguyen") or lo_f.startswith("david"): return True
    # the hard one: every Rey*/Rio* surname is pinned, and nobody answers to Smoke
    if lo_l.startswith("rey") or lo_l.startswith("rio"): return True
    if lo_f.startswith("smoke") or lo_l.startswith("smoke") or lo_a.startswith("smoke"): return True
    # only one veteran born 1971 among them, so the flag decides it
    if d[:4] == "1971" and lo_f.startswith("elias"): return True
    # capstone: every Sil* is pinned, nobody is spelled Sylvia, and the surname
    # she offers reaches nobody at all
    if lo_f.startswith("sil") or lo_l.startswith("sil"): return True
    if lo_f.startswith("syl") or lo_l.startswith("syl") or lo_a.startswith("syl"): return True
    if lo_l.startswith("march") or lo_l.startswith("duarte"): return True
    return False

# --------------------------------------------------------------- generation
used_ids = {c["i"] for c in SCRIPTED}
used_names = {(c["f"], c["l"]) for c in SCRIPTED}
clients = list(SCRIPTED)

def new_id():
    while True:
        v = "".join(rnd.choice("0123456789ABCDEF") for _ in range(9))
        if v not in used_ids:
            used_ids.add(v)
            return v

def weighted(pairs):
    r, acc = rnd.random(), 0.0
    for val, w in pairs:
        acc += w
        if r < acc:
            return val
    return pairs[-1][0]

guard_rejects = 0
while len(clients) < TOTAL:
    bucket = weighted([("f", .47), ("m", .47), ("n", .06)])
    first = rnd.choice(FIRST_F if bucket == "f" else FIRST_M if bucket == "m" else FIRST_N)
    last = rnd.choice(LAST)
    if (first, last) in used_names:
        continue

    q = weighted([("full", .80), ("approx", .05), ("refused", .07),
                  ("unknown", .04), ("notcollected", .04)])
    has_ssn = q in ("full", "approx")

    c = {
        "i": new_id(),
        "f": first,
        "l": last,
        "a": rnd.choice(["", "", "", "", first[:3], first[:4]]),
        "p": rnd.choice(PRONOUNS) if rnd.random() < .15 else "",
        "d": rand_dob(),
        "s": (ssn() if q == "full" else partial_ssn()) if has_ssn else None,
        "q": q,
        "r": weighted([("Yes", .68), ("Missing", .24), ("No", .08)]),
        "h": weighted([(1, .60), (2, .18), (3, .12), (4, .07), (5, .03)]),
        "v": weighted([("No", .85), ("Yes", .07), ("", .08)]),
        "u": rnd.choice(STAFF),
        "t": rand_updated(),
        "c": rnd.randrange(COLORS),
    }
    if violates(c):
        guard_rejects += 1
        continue
    used_names.add((first, last))
    clients.append(c)

clients.sort(key=lambda c: (c["l"], c["f"]))

# ---- numeric Client ID -----------------------------------------------------
# Distinct from the alphanumeric unique identifier shown under the name in
# search results; the record page and the expanded row show this one.
cids = rnd.sample(range(10000, 99999), len(clients))
for c, n in zip(clients, cids):
    c["cid"] = n

# ---- households ------------------------------------------------------------
# Members are real clients from this same roster, so opening any member shows a
# household that actually resolves. Surnames often but not always match.
def relationship(member, head):
    if member is head:
        return "Parent"
    gap = int(member["d"][:4]) - int(head["d"][:4])
    if gap >= 16:
        p = member.get("p", "")
        return "Daughter" if p.startswith("She") else "Son" if p.startswith("He") else "Child"
    return "Spouse" if gap <= 8 else "Other relative"

HOUSEHOLD_SHARE = 0.35          # most clients are served as individuals
target_in_hh = int(round(TOTAL * HOUSEHOLD_SHARE))

order = clients[:]
rnd.shuffle(order)
in_hh = 0
by_id = {c["i"]: c for c in clients}

# Households a task depends on. These are built before the random roll, because a
# household has to be reciprocal to be findable and the roll only ever produced
# random ones — task 10 asks the learner to identify Yolanda by her daughter.
for _group in PINNED_HOUSEHOLDS:
    _members = sorted((by_id[i] for i in _group), key=lambda c: c["d"])
    _roll = [{"i": m["i"], "rel": relationship(m, _members[0])} for m in _members]
    for _m in _members:
        _m["hm"], _m["h"] = _roll, len(_members)
    in_hh += len(_members)

for head in order:
    if "hm" in head or in_hh >= target_in_hh:
        continue
    free = [c for c in order if "hm" not in c and c is not head]
    if not free:
        break
    members = [head]
    size = weighted([(2, .48), (3, .27), (4, .17), (5, .08)])
    while len(members) < size and free:
        kin = [c for c in free if c["l"] == head["l"]]
        pick = rnd.choice(kin) if (kin and rnd.random() < .6) else rnd.choice(free)
        members.append(pick)
        free.remove(pick)
    if len(members) < 2:
        continue
    members.sort(key=lambda c: c["d"])           # oldest first becomes the head
    roll = [{"i": m["i"], "rel": relationship(m, members[0])} for m in members]
    for m in members:
        m["hm"], m["h"] = roll, len(members)
    in_hh += len(members)

for c in clients:                                # everyone else is a household of one
    if "hm" not in c:
        c["hm"], c["h"] = [], 1

# ---- client-record page fields -------------------------------------------
# Added after the sort so the assignment stays deterministic for a given seed.
# Invented locations. Clarity's ADD LOCATION search takes addresses, cross-streets,
# landmarks and encampments, so a mix of those is right. Deliberately generic and
# not tied to any real encampment. x/y position the pin on the schematic map.
LOCATIONS = [
    ("6th Street bridge",        "Encampment", 0.55, 0.42),
    ("Alameda St underpass",     "Encampment", 0.62, 0.55),
    ("Slauson Ave & Central",    "Cross-street", 0.58, 0.78),
    ("MacArthur Park north lawn","Landmark",   0.34, 0.38),
    ("Vermont Ave & 8th",        "Cross-street", 0.26, 0.44),
    ("LA River path, Elysian",   "Landmark",   0.70, 0.22),
    ("Union Station forecourt",  "Landmark",   0.66, 0.34),
    ("Adams Blvd & Figueroa",    "Cross-street", 0.44, 0.62),
    ("Westlake metro portal",    "Landmark",   0.32, 0.46),
    ("Hollywood & Western",      "Cross-street", 0.22, 0.14),
    ("Venice Blvd & Sepulveda",  "Cross-street", 0.08, 0.66),
    ("Grand Ave & 5th",          "Cross-street", 0.52, 0.40),
]

QUALITY_LABEL = {
    "full": "Full SSN Reported", "approx": "Approximate or partial SSN reported",
    "refused": "Client refused", "unknown": "Client doesn't know",
    "notcollected": "Data not collected",
}
for c in clients:
    c["rc"] = rnd.choice(RACE)
    c["rd"] = "" if rnd.random() < 0.85 else rnd.choice(
        ["Enrolled member of a federally recognized tribe", "Afro-Caribbean", "Central American"])
    c["qn"] = rnd.choice(QNAME)
    c["qd"] = rnd.choice(QDOB)
    c["ql"] = QUALITY_LABEL[c["q"]]
    c["cr"] = "Yes" if c["r"] == "No" else "No"
    c["fe"] = iso(rnd.randint(2016, 2025), rnd.randint(1, 12), rnd.randint(1, 28))          # Consent Refused mirrors a declined ROI
    # Location history. Clarity records where a participant was contacted; the
    # record page shows it, and for a street-outreach worker it is often the
    # fastest thing to confirm. Invented locations only — see LOCATIONS.
    # Field Interaction and Address records both show in the Location tab without
    # Outreach enabled, so those are the two types modelled. No dates — the help
    # article does not show one, and inventing it would be guessing again.
    _picked = rnd.sample(LOCATIONS, weighted([(0, .30), (1, .34), (2, .22), (3, .14)]))
    c["lo"] = [{"p": p, "ty": ty, "x": x, "y": y,
                "k": "Address" if rnd.random() < .45 else "Field Interaction"}
               for (p, ty, x, y) in _picked]
    c["n"] = {                                            # right-rail accordion counts
        "pr": weighted([(0, .45), (1, .2), (2, .15), (3, .1), (6, .1)]),
        "cq": weighted([(0, .6), (1, .3), (2, .1)]),
        "ap": weighted([(0, .35), (1, .4), (2, .17), (3, .08)]),
        "as": weighted([(0, .55), (1, .27), (2, .12), (3, .06)]),
        "rs": weighted([(0, .3), (1, .25), (2, .2), (3, .15), (5, .1)]),
        "ac": weighted([(0, .5), (1, .35), (2, .15)]),
        "ct": weighted([(0, .4), (1, .3), (2, .2), (3, .1)]),
    }

# five records pre-seeded as "recently accessed" so the landing state matches
# the real product, which never opens on a blank table
recent = [SCRIPTED[0]["i"], SCRIPTED[4]["i"], SCRIPTED[9]["i"],
          SCRIPTED[2]["i"], SCRIPTED[13]["i"]]

# Task 11 needs a clear "most complete" and a clear "oldest enrollment".
_vega = {c["i"]: c for c in clients if c["l"] == "Vega"}
if len(_vega) == 3:
    _vega["F2A6C8D40"].update({"fe": "2019-02-14", "v": "No",  "rc": "Hispanic/Latina/e/o"})
    _vega["5C1B9E730"].update({"fe": "2022-08-03", "v": "",    "rd": ""})
    _vega["8D40A2F16"].update({"fe": "2024-11-20", "v": "",    "rd": "", "a": ""})
# The location task: one David Nguyen has been at the 6th Street bridge for about
# a year, the other has never been there. Nobody else may hold that location, or
# the search stops separating them.
_ngu = {c["i"]: c for c in clients if c["l"] == "Nguyen"}
if len(_ngu) == 2:
    _by_name = {p: (p, ty, x, y) for (p, ty, x, y) in LOCATIONS}
    def _rec(name, kind):
        p, ty, x, y = _by_name[name]
        return {"p": p, "ty": ty, "x": x, "y": y, "k": kind}
    _ngu["6C2D91B47"]["lo"] = [_rec("6th Street bridge", "Field Interaction"),
                               _rec("Alameda St underpass", "Field Interaction")]
    _ngu["D3A7E0C85"]["lo"] = [_rec("Hollywood & Western", "Address"),
                               _rec("Venice Blvd & Sepulveda", "Field Interaction")]
for c in clients:
    if c["l"] != "Nguyen":
        c["lo"] = [e for e in c["lo"] if e["p"] != "6th Street bridge"]

# The capstone turns on Silvia Duarte having a household and Silvia Okonkwo not.
_ok = next((c for c in clients if c["i"] == "9A3C7B2E6"), None)
if _ok is not None and _ok["hm"]:
    for m in _ok["hm"]:
        _other = next((x for x in clients if x["i"] == m["i"]), None)
        if _other is not None:
            _other["hm"], _other["h"] = [], 1
    _ok["hm"], _ok["h"] = [], 1

# Task 10: Yolanda's record is thin on identifiers, so the household is the way in.
_am = {c["i"]: c for c in clients if c["l"] == "Amari"}
if len(_am) == 2:
    _am["C4E7B2019"].update({"qn": "Partial, street name, or code name reported",
                             "qd": "Approximate or partial DOB reported"})

os.makedirs(os.path.dirname(OUT), exist_ok=True)
with open(OUT, "w") as fh:
    json.dump({"clients": clients, "recent": recent}, fh, separators=(",", ":"))

no_ssn = sum(1 for c in clients if not c["s"])
partial = sum(1 for c in clients if c["s"] and not c["s"].replace("-", "").isdigit())
zeros = sum(1 for c in clients if c["s"] and c["s"].split("-")[0] == "000")
print(f"wrote {len(clients)} clients -> {os.path.relpath(OUT)}")
print(f"  guard rejections : {guard_rejects}")
print(f"  no SSN on file   : {no_ssn}")
print(f"  ROI Missing/No   : {sum(1 for c in clients if c['r'] != 'Yes')}")
hh_members = sum(1 for c in clients if c["hm"])
hh_count = len({tuple(sorted(m["i"] for m in c["hm"])) for c in clients if c["hm"]})
print(f"  in a household   : {hh_members} ({hh_members/len(clients):.0%}) across {hh_count} households")
print(f"  partial (X-masked): {partial}")
print(f"  partial (0-masked): {zeros}")
def area_safe(c):
    if not c["s"]: return True
    a = c["s"].split("-")[0]
    return a.startswith("9") or a in ("XXX", "000")
print(f"  all areas safe   : {all(area_safe(c) for c in clients)}")
