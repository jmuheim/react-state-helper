# Content editor guide

This guide is for **content editors** — the people who define modules, sessions, and activities inside [MobileCoach](https://mobile-coach.eu/). No JavaScript knowledge is required. If you are looking for architecture and code internals instead, see the [developer guide](developer-guide.md).

## How content is structured

The participant's progress is tracked in a three-level hierarchy:

```
🗂️ Module (e.g. "Boundary Management")
└── 📑 Session (e.g. "Gesunde Grenzen setzen")
    └── 🎯 Activity (e.g. "Rollenwechsel bewusst gestalten")
```

Every module, session, and activity has an **id** and a **title**:

- Ids are short and mnemonic, prefixed by their level: `m_` for modules, `s_` for sessions, `a_` for activities — e.g. `m_bouMgt`, `s_gesGre`, `a_rolGes`.
- Ids must be **unique across the whole state**, not just within their parent. MobileCoach maps each id to a separate dialog, and menu routing (see [Menus](#menus)) navigates directly to the dialog named after the tapped id — so the exact same id string must be used consistently in the state definition **and** in MobileCoach (dialog names, variable prefixes).
- A wrongly prefixed or duplicated id makes state loading fail immediately, with the offending id named in `$rsh_error`.

Two progress notions exist per module/session:

- **Completed** — all activities of a session are done; all sessions (that have activities) of a module are done.
- **Adequate progress** — a softer bar: the item counts as "good enough" once `sessions_needed_for_adequate_progress` / `activities_needed_for_adequate_progress` of its children are completed, even if not all of them are. Used to nudge participants onward instead of insisting they finish everything.

An **intro session** is a session with no activities of its own (just a stepping stone into the module, e.g. `s_bouIntro`). It must be marked `isIntro: true` in the state definition and be the module's **first** session. Because it has no activities, it counts as completed as soon as the participant enters it once — so it *does* count toward the module being completed, but it never affects the finer-grained progress percentage.

Structural limits, checked when state loads: at most **9** modules, **9** sessions per module, and **9** activities per session (that's how many menu slots exist); every module needs at least one session with activities; every non-intro session needs at least one activity; an intro session may only be a module's first session.

## One-time MobileCoach setup

1. Copy the full contents of [`src/ReactStateHelper.js`](https://github.com/jmuheim/react-state-helper/blob/master/src/ReactStateHelper.js) **as-is** into MobileCoach.
2. Create the following variables in your MobileCoach project — every single one, each with default value `0` and access **"manageable by service"**. The one exception is `$participantGroup`, which already exists by default in MobileCoach; you do not create it (see its row below):

   | Variable | Purpose |
   |---|---|
   | `$rsh_cmd` | Command to execute, e.g. `markActivityCompleted()` (set this before each script run) |
   | `$rsh_json` | Full serialized state, persisted between runs |
   | `$rsh_result` | Return value of the last command; `""` when the command returns nothing (`enterModule(…)`, `markActivityCompleted()`, the `populateMenuFor…()` commands, …) |
   | `$rsh_status` | `success` or `error` |
   | `$rsh_error` | Error message if status is `error`, otherwise `none` |
   | `$rsh_sessionsCompleted` | Comma-separated list of all completed session ids across all modules |
   | `$rsh_menuLabel1` – `$rsh_menuLabel9` | Dynamic menu entry labels (`"<emoji> <title>"`) populated by `populateMenuForModule()` / `populateMenuForSession()` / `populateMenuForActivity()`; written on **every** run — any other command resets all slots to `""` |
   | `$rsh_menuId1` – `$rsh_menuId9` | The id belonging to the label in the same slot (e.g. `m_emoReg`); concatenate the two yourself in the menu definition: `$rsh_menuLabel1:$rsh_menuId1`. Written on **every** run, same reset behavior as the labels |
   | `$participantGroup` | **Already exists by default in MobileCoach — do not create it.** `null` until a module is entered; then `currentModuleId`, with `": <currentSessionId>"` and `": <currentActivityId>"` appended as the participant navigates deeper — updated automatically after every run (we "mis-use" this built-in variable, as it is one of the few easily inspectable variables from within MobileCoach) |

**⚠️ The silent-failure gotcha:** If any variable is missing or has the wrong access setting, the script fails silently and halts the flow mid-conversation — with **no error output** whatsoever. This is extremely painful to debug. Before testing anything, double-check that *every* variable in the table above is declared with default value `0` and access "manageable by service".

## Running a command

MobileCoach cannot call JavaScript functions directly. Instead, each script run works like this:

1. Set `$rsh_cmd` to the command you want, e.g. `markActivityCompleted()` — exactly as written in the cheat-sheet below. **Be extra careful: typos or syntax errors break the run.**
2. Execute the script (the pasted `ReactStateHelper.js`).
3. Read the results: the command's return value is in `$rsh_result` (`""` for commands that return nothing), `$rsh_status` is `success` or `error`, and `$rsh_error` holds the error message (or `none`).

On the very first run, `$rsh_json` still has its default value `0`; the script detects this and initialises fresh default state automatically. After every run the script also updates `$rsh_json` (the persisted state), `$rsh_sessionsCompleted`, `$participantGroup`, and all nine `$rsh_menuLabel` and nine `$rsh_menuId` variables (empty unless the run's command was a `populateMenuFor…()` one) — you never have to write these yourself.

## Command cheat-sheet

As a content editor you only ever issue three kinds of commands: **entering** a module/session/activity, **marking an activity completed**, and **populating a menu**. Most commands require that the participant's current location was set first, in strict order: `enterModule(…)` → `enterSession(…)` → `enterActivity(…)`. Calling a command without its preconditions results in `$rsh_status` = `error`.

| Command (value of `$rsh_cmd`) | Preconditions | Effect |
|---|---|---|
| `enterActivity('a_rolGes')` | module + session entered | Sets the current activity; records visit timestamps and count |
| `enterModule('m_bouMgt')` | — | Sets the current module (and clears session/activity); records visit timestamps and count |
| `enterSession('s_gesGre')` | module entered | Sets the current session (and clears activity); records visit timestamps and count |
| `markActivityCompleted()` | module + session + activity entered | Marks the current activity as completed |
| `populateMenuForActivity()` | module + session entered | Fills the labels and ids with the current session's activities |
| `populateMenuForModule()` | — | Fills `$rsh_menuLabel1–9` and `$rsh_menuId1–9` with one entry per module |
| `populateMenuForSession()` | module entered | Fills the labels and ids with the current module's sessions |

The library also offers **flow-logic commands** (completion booleans, progress numbers, advice text) that feed MobileCoach's conditional branching. Those are wired into the flows by developers and documented in the [developer guide](developer-guide.md#flow-logic-commands) — as a content editor you never need to issue them.

## Menus

MobileCoach has no dynamic list constructs — menu entries are hard-coded in the flow. The workaround:

1. Call one of the `populateMenuFor…()` commands (see cheat-sheet, mind the preconditions) **immediately before displaying the menu** — every other command resets all slots to `""`. It fills `$rsh_menuLabel1`–`$rsh_menuLabel9` (display text, `"<emoji> <title>"`, e.g. `"✅ Emotionsregulation"`) and `$rsh_menuId1`–`$rsh_menuId9` (the matching id, e.g. `m_emoReg`); unused slots are set to `""` so MobileCoach can hide them. 9 slots is a hard maximum.
2. In the menu definition, concatenate label and id per slot with a colon: `$rsh_menuLabel1:$rsh_menuId1`. MobileCoach splits on `:` — the **left** side is displayed to the participant, the **right** side (the id) is stored to a variable with a specific, reserved name when the button is tapped. <!-- TODO: document the exact variable name -->
3. MobileCoach reads that variable and navigates directly to the dialog with that id. Just make sure each module/session/activity id has a dialog of exactly the same name.

> **Note:** titles must not contain a colon — state loading rejects them, because a colon inside the label would corrupt the `:`-split above. It is not known yet how MobileCoach handles an entry with multiple colons (first-colon vs. last-colon split), so the library guarantees the concatenated entry always contains exactly one colon.

Labels (and the advice text of the developer-facing [`getProgressAdvice()`](developer-guide.md#flow-logic-commands) command) are prefixed with an emoji from the `#MENU_EMOJIS` map in the source:

| Key | Emoji | Used for |
|---|---|---|
| `completed` | ✅ | a completed item in a menu, and prefixed to the current level's name in `getProgressAdvice()` |
| `next` | 👉 | the first not-yet-completed item in a menu (menus only) |
| `module` | 🗂️ | module references in `getProgressAdvice()` |
| `session` | 📑 | session references in `getProgressAdvice()` |
| `activity` | 🎯 | activity references in `getProgressAdvice()` |

Menu items that are neither completed nor the next one get no emoji prefix.

## Troubleshooting

- **The flow just stops, no error anywhere** → almost always an undeclared or misconfigured variable. Re-check every row of the [variable table](#one-time-mobilecoach-setup): default `0`, access "manageable by service".
- **Something misbehaves but the flow continues** → inspect `$rsh_error` first (and `$rsh_status`). Load errors name the offending id; command errors usually mean a typo in `$rsh_cmd` or a missing `enterModule`/`enterSession`/`enterActivity` precondition.
- **Where is the participant right now?** → `$participantGroup` shows the current location (module, session, activity) and is easy to inspect from within MobileCoach.
