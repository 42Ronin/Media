#!/usr/bin/env python3
"""Carry the script's wording into the simulation, keeping the simulation's markup.

    python3 script/sync_copy.py [--apply]

The script is the authority on what the learner reads; the template is the
authority on emphasis. The script's blocks are plain text — the markup was
stripped when the learner-text document was generated — so pasting them in
verbatim would drop every <b>, <code> and quoted line, and the hints would stop
showing what to type.

So this aligns the old plain text against the new plain text character by
character and carries the markup across at its mapped position. Position, not
search: `Lefty` appears twice in task one's situation and only the second is
<code>, which a find-and-wrap would get wrong.

Anything it cannot place is reported and left alone rather than guessed at.
Run without --apply to see what would change.
"""
import difflib
import html as _html
import json
import os
import re
import sys
import unicodedata

import docx

HERE = os.path.dirname(os.path.abspath(__file__))
TPL = os.path.join(HERE, "..", "src", "lesson1.template.html")
DOC = os.environ.get("SCRIPT_DOCX", "")

TAGS = ("b", "code", "span")


# ---------------------------------------------------------------- the script
def script_blocks(path):
    """Every [REF] [text] block the script carries for the tools."""
    out = {}
    for p in docx.Document(path).paragraphs:
        m = re.match(r"^\[(SIMULATOR-\d+[^\]]*?)\]\s*\[(.*)\]\s*$", p.text.strip(), re.S)
        if not m:
            continue
        ref = m.group(1).split(" —")[0].strip()
        body = m.group(2).strip()
        # a trailing "] [Button: …" is the beat's button label, not its words
        body = re.split(r"\]\s*\[Button:", body)[0].strip()
        out[ref] = " ".join(body.split())
    return out


# ------------------------------------------------- reading the template's JS
def read_expr(src, i):
    """Read a JS expression of string literals joined by +, starting at i.

    Returns (end_index, decoded_value). Handles both quote styles, escapes and
    the comments that sit between concatenated lines."""
    val, n = "", len(src)
    while i < n:
        while i < n and (src[i].isspace() or src[i] == "+"):
            i += 1
        if src.startswith("/*", i):
            i = src.index("*/", i) + 2
            continue
        if i >= n or src[i] not in "\"'":
            break
        q, i = src[i], i + 1
        buf = ""
        while i < n and src[i] != q:
            if src[i] == "\\":
                buf += src[i:i + 2]
                i += 2
            else:
                buf += src[i]
                i += 1
        i += 1
        val += json.loads('"' + buf.replace('"', '\\"').replace("\\'", "'") + '"')
        j = i
        while j < n and (src[j].isspace() or src[j] == "+"):
            j += 1
        if src.startswith("/*", j):
            j = src.index("*/", j) + 2
            while j < n and (src[j].isspace() or src[j] == "+"):
                j += 1
        if j < n and src[j] in "\"'" and "+" in src[i:j]:
            i = j
            continue
        break
    return i, val


def js_literal(value, indent):
    """Write a value back as wrapped string literals, in the file's own style."""
    pad = " " * indent
    words, lines, cur = value.split(" "), [], ""
    for w in words:
        if cur and len(cur) + len(w) + 1 > 86:
            lines.append(cur)
            cur = w
        else:
            cur = (cur + " " + w) if cur else w
    if cur:
        lines.append(cur)
    esc = [l.replace("\\", "\\\\").replace('"', '\\"') for l in lines]
    if len(esc) == 1:
        return '"%s"' % esc[0]
    body = ('"%s "' % esc[0]) + "+\n"
    body += "+\n".join('%s"%s "' % (pad, e) for e in esc[1:-1])
    if len(esc) > 2:
        body += "+\n"
    body += '%s"%s"' % (pad, esc[-1])
    return body


# --------------------------------------------------------- markup, carried over
def unmark(htm):
    """Plain text, plus every tag's span in plain-text coordinates."""
    spans, plain, i = [], "", 0
    for m in re.finditer(r"<(/?)(\w+)([^>]*)>", htm):
        plain += htm[i:m.start()]
        i = m.end()
        tag, close, attrs = m.group(2), m.group(1) == "/", m.group(3)
        if tag == "p":
            if close:
                spans.append(("PARA", len(plain), len(plain), ""))
            continue
        if tag == "br":
            spans.append(("PARA", len(plain), len(plain), ""))
            continue
        if tag not in TAGS:
            continue
        if close:
            for s in reversed(spans):
                if s[0] == tag and s[2] is None:
                    spans[spans.index(s)] = (tag, s[1], len(plain), s[3])
                    break
        else:
            spans.append((tag, len(plain), None, attrs))
    plain += htm[i:]
    return _html.unescape(plain), [s for s in spans if s[2] is not None]


def remark(old_plain, new_plain, spans):
    """Carry spans from old coordinates to new, by alignment."""
    sm = difflib.SequenceMatcher(None, old_plain, new_plain, autojunk=False)
    lo2new = {}
    for a, b, size in sm.get_matching_blocks():
        for k in range(size + 1):
            lo2new.setdefault(a + k, b + k)

    def at(pos):
        if pos in lo2new:
            return lo2new[pos]
        near = [p for p in lo2new if p <= pos]
        if not near:
            return 0
        p = max(near)
        return min(len(new_plain), lo2new[p] + (pos - p))

    inserts, missed = [], []
    for tag, s, e, attrs in spans:
        ns, ne = at(s), at(e)
        if tag == "PARA":
            inserts.append((ns, 0, "</p><p>"))
            continue
        if ne <= ns or _html.unescape(old_plain[s:e]).strip() not in new_plain:
            missed.append((tag, old_plain[s:e]))
            continue
        inserts.append((ns, 1, "<%s%s>" % (tag, attrs)))
        inserts.append((ne, -1, "</%s>" % tag))
    out, last = "", 0
    for pos, _, txt in sorted(inserts, key=lambda x: (x[0], -x[1])):
        out += _html.escape(new_plain[last:pos], quote=False) + txt
        last = pos
    out += _html.escape(new_plain[last:], quote=False)
    return out, missed


def wrap_paras(htm, had_p):
    # a paragraph break lands where a space used to be, so tidy the seam
    htm = htm.replace("<p> ", "<p>").replace(" </p>", "</p>")
    if not had_p:
        return htm
    if not htm.startswith("<p>"):
        htm = "<p>" + htm
    if not htm.endswith("</p>"):
        htm += "</p>"
    return htm.replace("<p></p>", "")


def norm(s):
    s = unicodedata.normalize("NFKD", s)
    for a, b in (("’", "'"), ("‘", "'"), ("“", '"'), ("”", '"'),
                 ("—", "-"), ("–", "-"), (" ", " ")):
        s = s.replace(a, b)
    return re.sub(r"\s+", " ", s).strip().lower()


# ------------------------------------------------------------------- the sync
FIELD = {"brief": "SITUATION", "ask": "INSTRUCTION", "hint": "HINT", "teach": "FEEDBACK"}
SIM = {7: "SIMULATOR-1", 10: "SIMULATOR-2"}


def main():
    apply = "--apply" in sys.argv
    if not DOC or not os.path.exists(DOC):
        raise SystemExit("set SCRIPT_DOCX to the script .docx")
    want = script_blocks(DOC)
    src = open(TPL, encoding="utf-8").read()

    # which task each id belongs to, and its number within its section
    order, seen = {}, {}
    for m in re.finditer(r'\{ id:"([a-z0-9]+)", sec:(\d+),', src):
        sec = int(m.group(2))
        seen[sec] = seen.get(sec, 0) + 1
        order[m.group(1)] = (sec, seen[sec])

    edits, missed, unchanged, nomatch = [], [], 0, []

    def plan(ref, start, end, old_html):
        nonlocal unchanged
        new_plain = want.get(ref)
        if new_plain is None:
            nomatch.append(ref)
            return
        old_plain, spans = unmark(old_html)
        if norm(old_plain) == norm(new_plain):
            unchanged += 1
            return
        htm, miss = remark(old_plain, new_plain, spans)
        htm = wrap_paras(htm, "<p>" in old_html)
        edits.append((start, end, htm, ref))
        for tag, txt in miss:
            missed.append((ref, tag, txt))

    # tasks
    for m in re.finditer(r'\{ id:"([a-z0-9]+)", sec:(\d+),', src):
        tid, sec = m.group(1), int(m.group(2))
        tag = SIM.get(sec)
        if not tag:
            continue
        n = order[tid][1]
        block_end = src.find("\n},", m.end())
        for key, name in FIELD.items():
            k = src.find("\n  %s:" % key, m.end(), block_end)
            if k < 0:
                continue
            s = k + len("\n  %s:" % key)
            e, val = read_expr(src, s)
            plan("%s.TASK.%d.%s" % (tag, n, name), s, e, val)

        # per-record feedback, in the order the object lists them
        w = src.find("\n  wrong:{", m.end(), block_end)
        if w >= 0:
            i, wn = src.index("{", w + 8) + 1, 0
            while True:
                q = src.find('"UID#', i)
                if q < 0 or q > block_end:
                    break
                colon = src.index(":", src.index('"', q + 1))
                wn += 1
                e, val = read_expr(src, colon + 1)
                plan("%s.TASK.%d.WRONG.%d" % (tag, n, wn), colon + 1, e, val)
                i = e
                nxt = src.find('"UID#', i)
                if nxt < 0 or nxt > src.find("}", i):
                    break

    # orientation beats
    tours = src.index("var TOURS={")
    seven = src.index("7:[", tours)
    end7 = src.index("\n10:[", seven) if "\n10:[" in src[seven:seven + 40000] else src.index("\n};", seven)
    beat = 0
    for m in re.finditer(r"\n  html:", src[seven:end7]):
        beat += 1
        s = seven + m.end()
        e, val = read_expr(src, s)
        plan("SIMULATOR-1.INTRO.%02d" % beat, s, e, val)

    # section closings
    for sec, tag in SIM.items():
        m = re.search(r"\n  %d:'" % sec, src[src.index("var CLOSING={"):])
        if not m:
            continue
        s = src.index("var CLOSING={") + m.end() - 1
        e, val = read_expr(src, s)
        plan("%s.DONE" % tag, s, e, val)

    print("blocks already matching the script : %d" % unchanged)
    print("blocks to rewrite                  : %d" % len(edits))
    if nomatch:
        print("no script block found for          : %s" % ", ".join(nomatch))
    if missed:
        print("\nmarkup that could not be carried over (fix by hand):")
        for ref, tag, txt in missed:
            print("  %-34s <%s>%s</%s>" % (ref, tag, txt[:48], tag))

    if not apply:
        print("\ndry run — pass --apply to write")
        return

    for s, e, htm, ref in sorted(edits, reverse=True):
        indent = 8 if "INTRO" in ref or ".DONE" in ref else 8
        src = src[:s] + js_literal(htm, indent) + src[e:]
    open(TPL, "w", encoding="utf-8").write(src)
    print("\nwritten: %s" % os.path.relpath(TPL))


if __name__ == "__main__":
    main()
