# What is on the screen, and who is saying it

Every box a learner can see in Section 7, what it is, who owns it, and when it appears.

The screen has **two layers that never mix**, and the whole design rests on keeping them
apart:

- **The product.** Everything that is meant to be Clarity. Nothing in this layer speaks to
  the learner or knows a lesson is happening.
- **The training layer.** Lashes, and the task panel. Both are ours. Neither exists in the
  real system, and the orientation says so out loud.

If you are ever unsure which layer a box belongs to: **teal or white-with-a-face is ours;
indigo-on-lavender is the product.**

---

## 1. The training layer — ours

### 1.1 Title card
**Where** Centre of the screen, over a dimmed interface. **When** Once, at the very start.

Lashes at full size with the words beside her at title size and no box drawn round them.
Greets, says the interface is a practice copy whose steps are the real ones, and hands over
to the walkthrough. She does not introduce herself — the learner met her in the course intro.

Internally this is a beat with `hero:true`. It is the only time she appears at that size.

### 1.2 Lashes' speech bubble
**Where** Beside her face, wherever she is standing. **When** Only while she is speaking.

A white rounded box with a coloured left border that tells you *what kind* of thing she is
saying. She is not a permanent fixture: she arrives to say one thing and leaves.

| Kind | Border | What it is | Raised by |
|---|---|---|---|
| **Tour** | teal | A step of the orientation. Has *Next →* and a step count. | The orientation, at launch |
| **Tip** | amber | The **hint** for the current task, or a nudge when a search comes back empty. | The learner pressing *Show hint*, or a search returning nothing |
| **Good** | green | Correct-answer feedback, and the teaching sentence that goes with it. | Opening the right record |
| **Bad** | red | Wrong-answer feedback, saying *why* that record is not the one. | Opening a wrong record |

The bubble carries its own footer: a step count on tour beats, *Next →* / *Start*, or
*Hide hint* when it is showing a hint.

**The arrow.** A drawn arrow appears in the gap between her and the thing she is talking
about, and only when a beat points at a specific control. Beats that describe a whole region
— the profile grid, the location list — do not point, because an arrow aimed at a panel lands
on whichever field happens to be under it.

### 1.3 The task panel
**Where** Docked to the right, and draggable anywhere by its title bar. **When** Always,
except while the orientation is walking the interface, when it folds to its title bar.

Teal title bar, then, top to bottom:

| Part | What it is |
|---|---|
| Title bar | Section name, `?` hover help, **pop out**, **collapse** |
| Progress bar and count | *Task 3 of 8* — a count, deliberately not a list of what is coming |
| **Task title** | The situation's name, e.g. *The name he gave you* |
| **Situation** | What the person in front of you said. Their words are in quote styling. |
| **Your task** | The instruction, in its own bordered box — the one thing to do |
| **Show hint** | Opens the hint in Lashes' bubble as a *tip*. Always available; there is no Skip. |
| **Next task →** | Appears only once the task is solved |

**Nothing the panel does moves the interface.** Collapsing it, popping it out, dragging it —
the search card, the field and the top bar keep their exact geometry. A popped-out panel
leaves an empty gutter behind, and that is the deliberate price of a layout that holds still.

### 1.4 The `?` hover help
**Where** Panel title bar. **When** On hover or keyboard focus only.

A small white tooltip naming the panel's three controls. It is a reminder, not a button — it
has no click handler and starts nothing.

### 1.5 Completion modal
**Where** Centre, over a scrim. **When** After the last task.

Reports what was done — *All 13 tasks complete* — and never a score or a percentage. There is
no mark in these simulations.

---

## 2. The product layer — meant to be Clarity

### 2.1 Chrome that is always there
| Box | Notes |
|---|---|
| Left icon rail | 12 icons plus the expander. Only **Clients** is live. |
| Top bar | Dark mode, client search, new window, messages, then the account chip |
| Breadcrumb | `Client Search › Name › Profile` — **record page only**. The last crumb tracks the open tab. |

### 2.2 Client Search
| Box | Notes |
|---|---|
| **Clients card** | Title, subtitle, ⊕ *Add Client*, ⋮ *Restore Deleted Data* |
| Search field | No placeholder and no label — plain, empty or full. Searches as you type. |
| Filter / column buttons | Filter offers Alias, First Name, Last Name. Columns opens the field chooser. |
| Recents hint | *Showing recently accessed clients…* — sits on the landing |
| Results table | Client · DOB · SSN by default. Household glyph before the row kebab, on clients who have one. |
| Row ⋮ | *View Enrollments, View Services, View History, Delete Client* |
| Expanded row | Client ID, Updated by, Updated on, Gender, Race and Ethnicity, plus any column switched off |
| Empty state | *No results yet!* over *Results will be displayed here when they are available.* On an empty search the column header disappears entirely. |

### 2.3 The client record
| Box | Notes |
|---|---|
| Record header | Avatar, name, *You are currently viewing the Client Record pages for…*, alert pill, padlock |
| Left record nav | 17 sections ending in Client Portal, plus a collapse control. Only **Profile** and **Location** are live. |
| Profile card | The identity fields, a **Demographics** subheading, then the rest of Demographics |
| Folded sections | ADA Information, Veteran Information, Veteran Case Conferencing, TLS Ramp Down, Encampment Resolution |
| **Point of Contacts** | Guidance paragraph, then three blocks. The first is open; the second and third fold and name who is in them. |
| Client Location | A table — Address, Date, Type, Created by — with the map below it |

---

## 3. Obstructed controls

Anything the lesson does not teach is **blurred and completely inert**. Click it and nothing
happens: no modal, no menu, no explanation. That is the whole message, and the orientation
says it once in words so it never has to be said again.

Two exceptions, both about legibility rather than behaviour:

- **Small controls stay sharp.** A three-dot kebab or a 26px zoom button under a 2px blur
  reads as a rendering fault rather than a control, so those are drawn crisp. They still do
  nothing.
- **Kebab menus open.** All four are built from captures of the real menus. The menu opens;
  every item in it is obstructed.

---

## 4. The two boxes that are neither

| Box | Why it is here |
|---|---|
| **Add Client notice** | ⊕ is a real control this lesson deliberately does not use. It explains that adding comes *after* searching, and warns when the current task's participant already has a record. That warning is the point of the whole lesson. |
| **Way-back notice** | The top-bar magnifier, pressed while already on Client Search, explains what it is for. |

Both are teaching moments attached to live controls, not obstructions.

---

## Quick answer: who said that?

- **White box with a face beside it** → Lashes. Check the border colour for which kind.
- **Teal-topped panel on the right** → the task.
- **Bordered box inside that panel** → the instruction: the one thing to do.
- **Amber border** → a hint, or a nudge about an empty search.
- **Green or red border** → feedback on a record just opened.
- **Anything indigo on lavender** → the product. It is not talking to the learner.
