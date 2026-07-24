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
# q: ssn data-quality code. full | approx | refused | unknown | notcollected
def C(i, f, l, d, s, q="full", roi="Yes", a="", p="", h=1, vet="No"):
    return {"i": i, "f": f, "l": l, "a": a, "p": p, "d": d, "s": s, "q": q,
            "r": roi, "h": h, "v": vet, "u": rnd.choice(STAFF), "t": rand_updated(),
            "c": rnd.randrange(COLORS)}

SCRIPTED = [
    # 1 nickname: filed under legal name, NO alias recorded
    C("357BF6714", "Michael", "Torres", "1979-03-14", "912-45-8802", roi="Yes", h=1),
    # 2 year of birth: goes by Kate, surname may have changed
    C("F565C146B", "Katherine", "Morrison", "1985-07-22", "934-17-3145", roi="Yes",
      p="She/Her/Hers", h=3),
    # 3 date formats: two people share this DOB
    C("AD63C3FF2", "Andre", "Whitfield", "1990-12-05", "907-62-6690", roi="Missing"),
    C("C967BF20E", "Jamal", "Underwood", "1990-12-05", "955-08-4402", roi="Yes"),
    # 4 same name, different people
    C("3DF1DF674", "James", "Wilson", "1968-09-02", "941-33-4471", roi="Yes", h=2),
    C("8C7A8F2D2", "James", "Wilson", "1991-04-17", "968-20-9038", roi="Missing", a="Jim"),
    # 5 true duplicate pair: same DOB, same SSN, one-letter name difference
    C("5BB517588", "Shauna", "Beckett", "1993-04-30", "926-71-2210", roi="Missing",
      p="She/Her/Hers"),
    C("6381E5405", "Shawna", "Beckett", "1993-04-30", "926-71-2210", roi="Yes",
      p="She/Her/Hers"),
    # 6 compound surname entered as one word, so "Cruz" finds nothing
    C("2A8189B34", "Maria", "Delacruz", "1974-01-28", "918-54-5527", roi="Yes", h=4),
    # 7 ROI column: exactly three Delgados, exactly one Missing
    C("9E4C21A70", "Marcus", "Delgado", "1985-01-19", "903-88-9927", roi="Yes"),
    C("B72D0F118", "Rosa", "Delgado", "1979-06-06", "947-12-5501", roi="Yes",
      p="She/Her/Hers", h=2),
    C("4F80C6E93", "Elena", "Delgado", "1996-08-03", "930-45-3378", roi="Missing",
      p="She/Her/Hers"),
    # 8 SSN refused: identity must be confirmed on DOB alone
    C("7A1E93C55", "Robert", "Nakashima", "1982-11-09", None, q="refused", roi="Yes"),
    C("1C6B4D802", "Robert", "Nakashima", "1977-03-22", "961-29-7713", roi="Yes", a="Bobby"),
]

# ------------------------------------------------------------------- GUARDS
# A generated record is rejected if it would make any scenario answer ambiguous.
def violates(c):
    f, l, d = c["f"], c["l"], c["d"]
    lo_l, lo_f = l.lower(), f.lower()
    # 1: no second Torres reachable by "Tor"
    if lo_l.startswith("tor"): return True
    # 1: nobody may answer to "Lefty" — the whole task is that it matches nothing
    if lo_f.startswith("left") or lo_l.startswith("left") or c["a"].lower().startswith("left"):
        return True
    # 2: no other 1985-born Kat*/Kate
    if d[:4] == "1985" and (lo_f.startswith("kat") or c["a"].lower().startswith("kat")): return True
    # 2: no other Morrison
    if lo_l.startswith("morr"): return True
    # 3: no third person on that date
    if d == "1990-12-05": return True
    # 3: no other Whitfield / Underwood
    if lo_l in ("whitfield", "underwood"): return True
    # 4: no third James Wilson (other Wilsons are welcome noise)
    if lo_l == "wilson" and lo_f == "james": return True
    # 5: no third Beckett
    if lo_l.startswith("beckett"): return True
    # 6: no other Cruz or Delacruz. "Cruz" must match nobody at all, which is
    #    the whole task: the surname was filed as one word.
    if "cruz" in lo_l: return True
    # 7: exactly three Delgados
    if lo_l == "delgado": return True
    # 8: exactly two Nakashimas
    if lo_l.startswith("nakashima"): return True
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

order = clients[:]
rnd.shuffle(order)
for head in order:
    if "hm" in head:
        continue
    size = weighted([(1, .58), (2, .18), (3, .13), (4, .08), (5, .03)])
    if size == 1:
        head["hm"], head["h"] = [], 1
        continue
    members = [head]
    while len(members) < size:
        free = [c for c in order if "hm" not in c and c not in members]
        if not free:
            break
        kin = [c for c in free if c["l"] == head["l"]]
        members.append(rnd.choice(kin) if (kin and rnd.random() < .6) else rnd.choice(free))
    members.sort(key=lambda c: c["d"])           # oldest first becomes the head
    roll = [{"i": m["i"], "rel": relationship(m, members[0])} for m in members]
    for m in members:
        m["hm"], m["h"] = roll, len(members)

# ---- client-record page fields -------------------------------------------
# Added after the sort so the assignment stays deterministic for a given seed.
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
    c["cr"] = "Yes" if c["r"] == "No" else "No"          # Consent Refused mirrors a declined ROI
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
print(f"  partial (X-masked): {partial}")
print(f"  partial (0-masked): {zeros}")
def area_safe(c):
    if not c["s"]: return True
    a = c["s"].split("-")[0]
    return a.startswith("9") or a in ("XXX", "000")
print(f"  all areas safe   : {all(area_safe(c) for c in clients)}")
