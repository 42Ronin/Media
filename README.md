# LAHSA

Internal training and tooling.

## Modules

Each module is a self-contained lesson: its own source, roster, build, tests, and
SCORM package. They share a common fictional client roster so a trainee sees the
same people, with the same identifiers, across the whole series.

| Module | Covers | Status |
|---|---|---|
| **HMIS BNTS - Search** | Finding an existing client in the Clarity HMIS client search screen | Built |
| **HMIS BNTS - Create** | Adding a new client record | Planned |

Each module builds to a single self-contained HTML file that runs in any browser
with no server, no login, and no client data — and optionally to a SCORM 1.2
package so completions track in the LMS.

`reference/` holds the source screenshots the simulations were built against —
internal reference only, not for redistribution.

See the README inside a module for its build instructions, task list, and
fidelity notes. `CLAUDE.md` at the repo root carries the project memory — design
decisions and their rationale, the rules that govern task design, and what still
needs verifying. Read it before making changes.

---

**These are training simulations.** They imitate the HMIS interface for
instructional purposes and are not connected to any live system. Every client
record in them is fictional. They are not affiliated with, endorsed by, or
connected to Bitfocus, Inc.
