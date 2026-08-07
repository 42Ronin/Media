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

# Names that repeat, deliberately. A roster where every name is unique makes search
# look far more decisive than it is: the first thing a learner types finds exactly
# one person, and they stop thinking. Most records are drawn from these much smaller
# pools instead, so a name usually returns a handful and the learner has to add a
# second identifier to reach one person. That is the habit the whole lesson is for.
#
# Nothing here may collide with a pinned answer — every one of these is checked by
# violates() the same as any other generated record.
COMMON_F = """Maria Jose Anthony Angela Robert Linda Michelle Carlos Sandra Kevin
Monica Andre Tanya Luis Rosa Eric Patricia Jamal Teresa Darnell""".split()
COMMON_L = """Johnson Williams Lopez Smith Jackson Martinez Hernandez Brown Davis
Thompson Robinson Walker Young Alvarez Ramirez Carter Flores Bennett Foster Freeman""".split()

# The same name, written down by two different people. This is how a duplicate
# gets made, and it is what makes a search that looks decisive not be: type the
# whole name and you find one of them, type the part they share and you find both.
# Both spellings of each pair are in the pool, so the roster carries the texture
# everywhere rather than only around the scenario cast.
PHONETIC_F = """Sara Sarah Aisha Ayesha Stephen Steven Sean Shawn Carla Karla
Cristina Christina Kristina Jon John Marc Mark Erik Erick Caitlin Kaitlin
Mohamed Muhammad Ahmad Ahmed Hasan Hassan Nadia Nadya Sofia Sophia
Jaqueline Jacqueline Latonya Latonia""".split()
PHONETIC_L = """Sanchez Sanches Ramos Ramoz Perez Peres Gonzalez Gonzales
Vasquez Vazquez Marques Marquez Ibrahim Ibraheem Nazir Nazeer Mensah Mensa
Osei Osey Kabir Kabeer Shephard Sheppard Clarke Clark Stuart Stewart""".split()
COMMON_F += PHONETIC_F
COMMON_L += PHONETIC_L
COMMON_RATE = 0.93          # how often a name is drawn from the small pool
MAX_TWINS   = 34            # records allowed to share a full name with another

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
# Gender, as the record page words it — the capture shows "Man (Boy, if child)",
# so the parenthetical is part of the option rather than our gloss on it.
GENDER = ["Woman (Girl, if child)", "Man (Boy, if child)", "Non-Binary",
          "Transgender", "Culturally Specific Identity", "Questioning",
          "Different Identity", "Client doesn't know", "Client refused",
          "Data not collected"]
GENDER_W = [.42, .42, .04, .03, .02, .01, .01, .02, .02, .01]
SUFFIX = ["Jr.", "Sr.", "II", "III"]
LANGUAGE = ["English", "Spanish", "Armenian", "Korean", "Mandarin", "Tagalog",
            "Russian", "Farsi", "Vietnamese", "American Sign Language"]
# Invented clinics. Real clinic names belong to real organisations, and the same
# rule applies here as everywhere else in this roster.
CLINIC = ["Westlake Community Health", "Harbor Street Clinic", "Vermont Wellness Center",
          "Eastside Family Health", "Central Avenue Health Partners"]
MIDDLE = ["Ann", "Lee", "Marie", "James", "Rose", "Dean", "Grace", "Paul",
          "Elise", "Ray", "June", "Cole"]
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

    # Section 11 — the running scenario. He calls himself Desmond and gives Carrow,
    # a surname he stopped using; nobody is filed under it, so his first two
    # searches reach nobody at all. "Dez" is the fragment that opens it up, and it
    # has to return five so the list is readable but not an answer. Adding 1974
    # leaves two, neither with an SSN, and only the Location tab separates them.
    C("D2F8A6C31", "Dezmond", "Ellery", "1974-08-16", None, q="refused"),
    C("A7C4E9B52", "Dezmond", "Achebe", "1974-03-02", None, q="unknown"),
    C("B5E1D8F43", "Dezirae", "Ellsworth", "1996-11-09", "943-28-1160", p="She/Her/Hers"),
    C("C9A3F7E64", "Dezra",   "Achterberg","1988-05-23", "917-62-9084", p="She/Her/Hers"),
    C("E6B2C5A75", "Dezhawn", "Arrington", "2001-01-30", "955-40-3372"),

    # ---- prefix decoys ------------------------------------------------------
    # Typing the first few letters of a name is what everybody does first, and it
    # was landing on exactly one record for most of the cast — the guards that keep
    # a task answer unambiguous had also made every scenario name unique in the
    # roster, so a three-letter prefix handed the answer over before the learner
    # had done any of the thinking the task is for.
    #
    # Each of these shares a prefix with one scenario answer and nothing else. None
    # of them can satisfy the task's own search: they differ on the other name, on
    # the year, or on both. Checked by tools/obviousness.mjs.
    C("T1A4B7C92", "Priya",     "Torrance",  "1986-02-11", "931-45-7712", p="She/Her/Hers"),
    C("T2B5C8D03", "Andre",     "Torkelson", "1993-09-24", "946-18-2205"),
    C("D3C6D9E14", "Daniel",    "Okafor",    "1984-07-19", "923-51-6640"),
    C("D4D7E0F25", "Danika",    "Flores",    "1997-12-03", "958-33-1178", p="She/Her/Hers"),
    C("K5E8F1A36", "Krzesimir", "Nowak",     "1977-05-28", "914-27-8853"),
    C("W6F9A2B47", "Tomasz",    "Wojcik",    "1990-10-14", "962-05-4419"),
    C("E7A0B3C58", "Esperanza", "Bennett",   "1995-03-07", "939-72-3306", p="She/Her/Hers"),
    C("E8B1C4D69", "Espen",     "Halvorsen", "1971-11-21", "927-60-5514"),
    C("A9C2D5E70", "Adriana",   "Flores",    "1992-06-30", "944-19-7723", p="She/Her/Hers"),
    C("A0D3E6F81", "Adrienne",  "Carter",    "1981-01-13", "955-84-2260", p="She/Her/Hers"),
    C("F1E4F7A92", "Rosa",      "Fenwick",   "1969-08-27", "918-42-9931", p="She/Her/Hers"),
    C("F2F5A8B03", "Marisol",   "Fenton",    "1994-04-05", "936-27-1148", p="She/Her/Hers"),
    C("B3A6B9C14", "Luis",      "Brennan",   "1978-02-16", "949-13-6672"),
    C("B4B7C0D25", "Brenda",    "Alvarez",   "1987-11-08", "925-66-3390", p="She/Her/Hers"),
    C("Y5C8D1E36", "Yolanda",   "Foster",    "1996-05-12", "941-70-8817", p="She/Her/Hers"),
    C("Y6D9E2F47", "Yolanda",   "Ramirez",   "1973-09-01", "953-24-4408", p="She/Her/Hers"),
    C("L7E0F3A58", "Elias",     "Thompson",  "1993-07-23", "917-38-5561"),
    C("L8F1A4B69", "Elise",     "Johnson",   "1966-12-19", "934-51-2287", p="She/Her/Hers"),
    C("M9A2B5C70", "Katarina",  "Morrissey", "1999-03-15", "928-47-9903", p="She/Her/Hers"),
    C("M0B3C6D81", "Devon",     "Whitfield", "1975-10-06", "946-82-3315"),
    # Two names the participant says out loud, which were reaching exactly one
    # record and ending the task before it started: "Danielle" in task 3, and
    # "Reyez" — one of the three spellings he offers — in task 12.
    C("N1A5B8C26", "Danielle",  "Thompson",  "1986-09-11", "932-14-7708", p="She/Her/Hers"),
    C("N2B6C9D37", "Consuelo",  "Reyez",     "1995-04-02", "948-31-2265", p="She/Her/Hers"),

    # ---- both-prefix decoys -------------------------------------------------
    # The pair above catches a learner who types the start of one name. These
    # catch the one who types the start of both, which is the technique the
    # lesson actually teaches — "krz woj", "kat joh". Each shares the first three
    # letters of the first name AND of the surname with one scenario answer, and
    # none of them can be mistaken for the answer: the rest of the surname
    # differs, so the full name still reaches one record.
    C("P1A6C1E48", "Michaela", "Torkington", "1991-04-22", "913-58-7729", p="She/Her/Hers"),
    C("P2B7D2F59", "Katia",    "Moreno",     "1990-08-14", "947-21-3364", p="She/Her/Hers"),
    C("P3C8E3A60", "Danika",   "Whitfield",  "1983-01-09", "926-74-5183", p="She/Her/Hers"),
    C("P4D9F4B71", "Krzesimir","Wojda",      "1972-06-27", "935-19-8840"),
    C("P5E0A5C82", "Espen",    "Garrido",    "1998-10-03", "959-47-2216"),
    C("P6F1B6D93", "Adriana",  "Fenton",     "1996-03-18", "922-63-9075", p="She/Her/Hers"),
    C("P7A2C7E04", "Katia",    "Brenner",    "1975-12-01", "944-08-1157", p="She/Her/Hers"),
    C("P8B3D8F15", "Marco",    "Delgado",    "1969-07-16", "951-36-4428"),
    C("P9C4E9A26", "Jamal",    "Wiltshire",  "1994-02-05", "938-90-6613"),
    C("Q0D5F0B37", "Yolonda",  "Amaro",      "1987-11-29", "916-52-7704", p="She/Her/Hers"),
    C("Q1E6A1C48", "Dave",     "Ngugi",      "1979-05-21", "963-14-3395"),
    C("Q2F7B2D59", "Elena",    "Reynolds",   "1966-09-12", "929-77-2281", p="She/Her/Hers"),
    C("Q3A8C3E60", "Rosario",  "Vegh",       "1992-12-24", "955-23-8867", p="She/Her/Hers"),

    # ---- heard, not read ----------------------------------------------------
    # How names actually diverge in HMIS: somebody wrote it down while listening.
    # i and e, e and eh, a and ah, c and ch and s and sh, s and z, silent letters
    # dropped. Each of these is one scenario answer misheard, so the fragment a
    # learner types reaches both and the full name still reaches one.
    C("R1B9D4F71", "Michele",   "Torrez",     "1988-07-04", "934-61-2290", p="She/Her/Hers"),
    C("R2C0E5A82", "Catherine", "Morrisen",   "1993-02-18", "928-15-7736", p="She/Her/Hers"),
    C("R3D1F6B93", "Daniela",   "Witmore",    "1977-09-26", "946-30-4419", p="She/Her/Hers"),
    C("R4E2A7C04", "Kristof",   "Wojcieszak", "1985-11-12", "919-73-6628"),
    C("R5F3B8D15", "Esperansa", "Gallardo",   "1970-06-08", "952-44-1183", p="She/Her/Hers"),
    C("R6A4C9E26", "Adrien",    "Fenwyck",    "1994-01-31", "937-28-9950"),
    C("R7B5D0F37", "Kathryn",   "Brennen",    "1968-04-14", "923-67-3305", p="She/Her/Hers"),
    C("R8C6E1A48", "Mariah",    "Delacroix",  "1991-08-20", "958-12-7761", p="She/Her/Hers"),
    C("R9D7F2B59", "Jaime",     "Wilsen",     "1980-03-27", "941-59-2274"),
    C("S0E8A3C60", "Yolande",   "Amary",      "1965-10-11", "917-84-6642", p="She/Her/Hers"),
    C("S1F9B4D71", "Davide",    "Nguyan",     "1997-05-06", "960-31-8815"),
    C("S2A0C5E82", "Elyas",     "Rayas",      "1973-12-29", "944-26-5507"),
    C("S4C2E7A04", "Elias",     "Reynolds",   "1990-02-08", "926-49-1172"),
    C("S3B1D6F93", "Rosalyn",   "Veiga",      "1986-09-15", "931-70-3348", p="She/Her/Hers"),
    # One partial SSN is pinned rather than left to the roll. The scenario cast has
    # grown enough to crowd the generated records out, and a masked area segment is
    # the case that proves a search cannot match across the gap.
    C("V1A2B3C44", "Tanya",     "Freeman",    "1982-04-17", "XXX-45-8891",
      q="approx", p="She/Her/Hers"),
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
    # section 11: every Dez* is pinned, so the fragment returns exactly five.
    # Nobody is filed under Carrow, and no first name begins Des, so neither of
    # the two searches he leads with can reach anybody.
    if lo_f.startswith("dez") or lo_l.startswith("dez") or lo_a.startswith("dez"): return True
    if lo_f.startswith("des") or lo_a.startswith("des"): return True
    if lo_l.startswith("carrow") or lo_l.startswith("ellery") or lo_l.startswith("achebe"): return True
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
twins = 0
while len(clients) < TOTAL:
    bucket = weighted([("f", .47), ("m", .47), ("n", .06)])
    common_f = rnd.random() < COMMON_RATE
    common_l = rnd.random() < COMMON_RATE
    first = (rnd.choice(COMMON_F) if common_f else
             rnd.choice(FIRST_F if bucket == "f" else FIRST_M if bucket == "m" else FIRST_N))
    last = rnd.choice(COMMON_L if common_l else LAST)
    if (first, last) in used_names:
        # A full name that is not unique is the point, within a limit: it is why
        # "two of the three" is the rule the lesson teaches. Only common names may
        # collide, so a pinned answer can never acquire a twin this way.
        if not (common_f and common_l) or twins >= MAX_TWINS:
            continue
        twins += 1

    q = weighted([("full", .76), ("approx", .09), ("refused", .07),
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
# The Location tab is a table: Address, Date, Type, Created by, and a scope chip.
# The second address line is the city/state/country/ZIP the product shows beneath
# the street. Encampments and cross-streets are how outreach records a place that
# has no street number, which is why line one is often not a street address.
LOCATIONS = [
    ("6th Street bridge",        "Los Angeles, CA, USA, 90021", 0.55, 0.42),
    ("Alameda St underpass",     "Los Angeles, CA, USA, 90021", 0.62, 0.55),
    ("Slauson Ave & Central",    "Los Angeles, CA, USA, 90011", 0.58, 0.78),
    ("MacArthur Park north lawn","Los Angeles, CA, USA, 90057", 0.34, 0.38),
    ("Vermont Ave & 8th",        "Los Angeles, CA, USA, 90005", 0.26, 0.44),
    ("LA River path, Elysian",   "Los Angeles, CA, USA, 90031", 0.70, 0.22),
    ("Union Station forecourt",  "Los Angeles, CA, USA, 90012", 0.66, 0.34),
    ("Adams Blvd & Figueroa",    "Los Angeles, CA, USA, 90007", 0.44, 0.62),
    ("Westlake metro portal",    "Los Angeles, CA, USA, 90057", 0.32, 0.46),
    ("Hollywood & Western",      "Los Angeles, CA, USA, 90027", 0.22, 0.14),
    ("Venice Blvd & Sepulveda",  "Los Angeles, CA, USA, 90066", 0.08, 0.66),
    ("Grand Ave & 5th",          "Los Angeles, CA, USA, 90071", 0.52, 0.40),
]
# Type is two lines in the product: what created the record, then the field it came
# from. "Program Enrollment" over "Geolocation Field" is the pair the owner's
# capture shows; "Field Interaction" is the other type Bitfocus's help article names
# as visible without Outreach enabled. Nothing else is guessed at.
LOC_TYPE = ["Program Enrollment", "Field Interaction"]
LOC_SOURCE = "Geolocation Field"
# The organisations a location record is created by. Invented, like every other
# organisation in this roster — a real provider's name belongs to that provider.
LOC_ORG = ["Harborlight Outreach", "Sixth Street Collective", "Vermont Care Network",
           "Alameda Housing Partners", "Westlake Community Trust"]

# Point of Contact. The profile carries three PoC blocks; the live capture had all
# three empty because that account's test client had none recorded, but an empty
# section teaches nothing — the reason a worker reads this part of the record is to
# find out which staff member already has the relationship.
#
# These are STAFF, not participants, and they are invented like everything else.
# Phone numbers use 213-555-01xx: 555-0100 through 555-0199 is the block reserved
# for fiction, so nothing here can ring a real person. Emails use example.org,
# which IANA reserves for documentation and which can never be registered.
POC_F = ["Adaeze", "Marisol", "Terrence", "Bao", "Priya", "Roland", "Ximena",
         "Devon", "Ingrid", "Hakim", "Noelle", "Sergei", "Tamsin", "Obadiah",
         "Lucinda", "Farhan", "Odette", "Gustavo", "Neve", "Rashida"]
POC_L = ["Okonkwo", "Villalobos", "Ashworth", "Nguyen-Pratt", "Ramanathan",
         "Beaumont", "Escalante", "Whitlock", "Sorensen", "Bakr", "Ferreira",
         "Novikov", "Hallowell", "Adeyemi", "Castellanos", "Rahimi", "Duval",
         "Mendoza-Klein", "Aherne", "Bashir"]
# Point of Contact Category, from the owner's capture of the dropdown open. These are
# real LAHSA and DHS programme names — organisations and programmes, not people — and
# they are used verbatim because inventing programme names would be the same mistake
# as inventing field labels. The live list is longer; these are the visible six.
# The field is often left unset, and an unset one renders the Select placeholder.
POC_CAT = ["LAHSA Funded Interim Housing (Crisis)",
           "LAHSA Funded Interim Housing (Host Home)",
           "LAHSA Funded Street Outreach Program",
           "DHS Funded Countywide Benefits Entitlement Services Team (CBEST)",
           "DHS Multi-Disciplinary Outreach Team",
           "DHS Funded Interim Housing"]


def poc_person(r):
    """One staff member: name, a reachable-looking but unreachable phone, an email."""
    f, l = r.choice(POC_F), r.choice(POC_L)
    return {
        "nm": f + " " + l,
        "ph": "213-555-01%02d" % r.randint(0, 99),
        "ex": str(r.randint(200, 899)) if r.random() < 0.35 else "",
        "em": (f + "." + l.replace("-", "").replace("'", "") + "@example.org").lower(),
    }


def loc_row(place, city, x, y, kind):
    """One row of the Location table, in the product's own columns."""
    who = poc_person(rnd)
    return {"p": place, "city": city, "x": x, "y": y,
            "ty": kind, "src": LOC_SOURCE,
            "d": iso(rnd.randint(2023, 2026), rnd.randint(1, 12), rnd.randint(1, 28)),
            "by": who["nm"], "org": rnd.choice(LOC_ORG), "sc": "Individual"}


def poc_block(r, when):
    """A filled Point of Contact block, supervisor and all."""
    p, sup = poc_person(r), poc_person(r)
    return {"dt": when, "nm": p["nm"], "ph": p["ph"], "ex": p["ex"], "em": p["em"],
            "snm": sup["nm"], "sph": sup["ph"], "sex": sup["ex"], "sem": sup["em"],
            "cat": r.choice(POC_CAT) if r.random() < 0.45 else ""}


QUALITY_LABEL = {
    "full": "Full SSN Reported", "approx": "Approximate or partial SSN reported",
    "refused": "Client refused", "unknown": "Client doesn't know",
    "notcollected": "Data not collected",
}
for c in clients:
    c["rc"] = rnd.choice(RACE)
    c["rd"] = "" if rnd.random() < 0.85 else rnd.choice(
        ["Enrolled member of a federally recognized tribe", "Afro-Caribbean", "Central American"])
    # Name and identity fields the live profile carries. Most are empty on most
    # records, which is what the capture shows and what makes "No value" the
    # normal sight on this page rather than a sign something is wrong.
    c["mn"] = rnd.choice(MIDDLE) if rnd.random() < 0.22 else ""
    c["sfx"] = rnd.choice(SUFFIX) if rnd.random() < 0.05 else ""
    c["lid"] = str(rnd.randint(100000, 999999)) if rnd.random() < 0.18 else ""
    c["mdn"] = rnd.choice(COMMON_L) if rnd.random() < 0.07 else ""
    c["g"] = weighted(list(zip(GENDER, GENDER_W)))
    # The rest of Demographics, from the owner's August capture of that part of the
    # page. Mostly empty, which is what the capture shows and what makes "No value"
    # the ordinary sight here rather than a sign something is missing.
    c["lang"] = rnd.choice(LANGUAGE) if rnd.random() < 0.30 else ""
    c["tb"] = iso(rnd.randint(2023, 2026), rnd.randint(1, 12), rnd.randint(1, 28)) \
        if rnd.random() < 0.12 else ""
    c["clinic"] = rnd.choice(CLINIC) if rnd.random() < 0.10 else ""
    c["dpss"] = str(rnd.randint(1000000, 9999999)) if rnd.random() < 0.14 else ""
    c["prk"] = "Yes" if rnd.random() < 0.08 else "No"
    c["fema"] = str(rnd.randint(1000000000, 9999999999)) if rnd.random() < 0.04 else ""
    # "Updated on" is a timestamp on the record, not just a date.
    c["ut"] = "%d:%02d %s" % (rnd.randint(1, 12), rnd.randint(0, 59),
                              rnd.choice(["AM", "PM"]))
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
    c["lo"] = [loc_row(p, city, x, y, rnd.choice(LOC_TYPE)) for (p, city, x, y) in _picked]
    # Nought to three Points of Contact, weighted so most records carry one and a
    # few carry the full three — the section's own guidance is about what to do
    # when three are already recorded, which only means anything if some records
    # actually have three. Dates run from the year after intake to now.
    c["poc"] = [poc_block(rnd, iso(rnd.randint(2023, 2026), rnd.randint(1, 12), rnd.randint(1, 28)))
                for _ in range(weighted([(0, .22), (1, .48), (2, .21), (3, .09)]))]
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
    _by_name = {p: (p, city, x, y) for (p, city, x, y) in LOCATIONS}
    def _rec(name, kind):
        p, city, x, y = _by_name[name]
        return loc_row(p, city, x, y, kind)
    _ngu["6C2D91B47"]["lo"] = [_rec("6th Street bridge", "Field Interaction"),
                               _rec("Union Station forecourt", "Field Interaction")]
    _ngu["D3A7E0C85"]["lo"] = [_rec("Hollywood & Western", "Program Enrollment"),
                               _rec("Venice Blvd & Sepulveda", "Field Interaction")]
for c in clients:
    if c["l"] != "Nguyen":
        c["lo"] = [e for e in c["lo"] if e["p"] != "6th Street bridge"]

# Section 11: one Dezmond has been contacted at the Alameda St underpass, the block
# the team has been working. The other has never been there. Like the bridge above,
# the location only separates them if nobody else on the roster holds it.
_dez = {c["i"]: c for c in clients if c["f"] == "Dezmond"}
if len(_dez) == 2:
    _by_name2 = {p: (p, city, x, y) for (p, city, x, y) in LOCATIONS}
    def _rec2(name, kind):
        p, city, x, y = _by_name2[name]
        return loc_row(p, city, x, y, kind)
    _dez["D2F8A6C31"]["lo"] = [_rec2("Alameda St underpass", "Field Interaction"),
                               _rec2("Grand Ave & 5th", "Field Interaction")]
    _dez["A7C4E9B52"]["lo"] = [_rec2("Westlake metro portal", "Program Enrollment")]
for c in clients:
    if c["i"] != "D2F8A6C31":
        c["lo"] = [e for e in c["lo"] if e["p"] != "Alameda St underpass"]

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

from collections import Counter
_f = Counter(c["f"] for c in clients)
_l = Counter(c["l"] for c in clients)
_n = Counter((c["f"], c["l"]) for c in clients)
print(f"  distinct first   : {len(_f)}  most common {_f.most_common(1)[0]}")
print(f"  distinct last    : {len(_l)}  most common {_l.most_common(1)[0]}")
print(f"  first names shared by 2+ : {sum(1 for v in _f.values() if v > 1)}")
print(f"  surnames shared by 2+    : {sum(1 for v in _l.values() if v > 1)}")
print(f"  full names shared by 2+  : {sum(1 for v in _n.values() if v > 1)}")
