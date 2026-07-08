# Content editor guide

This guide is for **content editors** — the people who define modules, sessions, and activities inside MobileCoach. No JavaScript knowledge is required. If you are looking for architecture and code internals instead, see the [developer guide](developer-guide.md).

## How content is structured

The participant's progress is tracked in a three-level hierarchy:

```
Module (e.g. "Boundary Management")
└── Session (e.g. "Gesunde Grenzen setzen")
    └── Activity (e.g. "Rollenwechsel bewusst gestalten")
```

Every module, session, and activity has an **id** and a **title**:

- Ids are short and mnemonic, prefixed by their level: `m_` for modules, `s_` for sessions, `a_` for activities — e.g. `m_bouMgt`, `s_gesGre`, `a_rolGes`.
- Ids must be **unique across the whole state**, not just within their parent. MobileCoach maps each id to a separate dialog, and menu routing (see [Menus](#menus)) matches ids in one flat namespace — so the exact same id string must be used consistently in the state definition **and** in MobileCoach (dialog names, variable prefixes, routing rules).
- A wrongly prefixed or duplicated id makes state loading fail immediately, with the offending id named in `$jsStateHelperError`.

Two progress notions exist per module/session:

- **Completed** — all activities of a session are done; all sessions (that have activities) of a module are done.
- **Adequate progress** — a softer bar: the item counts as "good enough" once `sessions_needed_for_adequate_use` / `activities_needed_for_adequate_use` of its children are completed, even if not all of them are. Used to nudge participants onward instead of insisting they finish everything.

An **intro session** is a session with no activities of its own (just a stepping stone into the module, e.g. `s_bouIntro`). It must be marked `isIntro: true` in the state definition; it never counts toward or against completion.

Structural limits, checked when state loads: at most **9** modules, **9** sessions per module, and **9** activities per session (that's how many menu slots exist); every module needs at least one session with activities; every non-intro session needs at least one activity.

## One-time MobileCoach setup

1. Copy the full contents of [`src/ReactStateHelper.js`](https://github.com/jmuheim/react-state-helper/blob/master/src/ReactStateHelper.js) **as-is** into MobileCoach.
2. Create the following variables in your MobileCoach project — every single one, each with default value `0` and access **"manageable by service"**:

   | Variable | Purpose |
   |---|---|
   | `$jsStateHelperCmd` | Command to execute, e.g. `markActivityCompleted()` (set this before each script run) |
   | `$jsStateHelperJson` | Full serialized state, persisted between runs |
   | `$jsStateHelperResult` | Return value of the last command (the `populateMenuLabelsFor…()` commands return nothing — their output goes to the menu label variables instead) |
   | `$jsStateHelperStatus` | `success` or `error` |
   | `$jsStateHelperError` | Error message if status is `error`, otherwise `none` |
   | `$jsStateHelperSessionsCompleted` | Comma-separated list of all completed session ids across all modules |
   | `$jsStateHelperMenuLabel1` – `$jsStateHelperMenuLabel9` | Dynamic menu entry labels populated by `populateMenuLabelsForModule()` / `populateMenuLabelsForSession()` / `populateMenuLabelsForActivity()`; written on **every** run — any other command resets all slots to `""` |
   | `$participantGroup` | `null` until a module is entered; then `currentModuleId`, with `": <currentSessionId>"` and `": <currentActivityId>"` appended as the participant navigates deeper — populated by `getParticipantLocation()` (we "mis-use" this variable, as it is one of the few easily inspectable variables from within MobileCoach) |

## ⚠️ The silent-failure gotcha

**If any variable is missing or has the wrong access setting, the script fails silently and halts the flow mid-conversation — with no error output whatsoever.** This is extremely painful to debug. Before testing anything, double-check that *every* variable in the table above is declared with default value `0` and access "manageable by service".

## Running a command

MobileCoach cannot call JavaScript functions directly. Instead, each script run works like this:

1. Set `$jsStateHelperCmd` to the command you want, e.g. `markActivityCompleted()` — exactly as written in the cheat-sheet below. **Be extra careful: typos or syntax errors break the run.**
2. Execute the script (the pasted `ReactStateHelper.js`).
3. Read the results: the command's return value is in `$jsStateHelperResult`, `$jsStateHelperStatus` is `success` or `error`, and `$jsStateHelperError` holds the error message (or `none`).

On the very first run, `$jsStateHelperJson` still has its default value `0`; the script detects this and initialises fresh default state automatically. After every run the script also updates `$jsStateHelperJson` (the persisted state), `$jsStateHelperSessionsCompleted`, `$participantGroup`, and all nine `$jsStateHelperMenuLabel` variables (empty unless the run's command was a `populateMenuLabelsFor…()` one) — you never have to write these yourself.

## Command cheat-sheet

Many commands require that the participant's current location was set first, in strict order: `enterModule(…)` → `enterSession(…)` → `enterActivity(…)`. Calling a command without its preconditions results in `$jsStateHelperStatus` = `error`.

| Command (value of `$jsStateHelperCmd`) | Preconditions | Effect / returns |
|---|---|---|
| `enterModule('m_bouMgt')` | — | Sets the current module (and clears session/activity); records visit timestamps and count |
| `enterSession('s_gesGre')` | module entered | Sets the current session (and clears activity); records visit timestamps and count |
| `enterActivity('a_rolGes')` | module + session entered | Sets the current activity; records visit timestamps and count |
| `markActivityCompleted()` | module + session + activity entered | Marks the current activity as completed |
| `isModuleCompleted('m_bouMgt')` | — | `true` if all of the module's sessions (with activities) are completed |
| `isSessionCompleted('s_gesGre')` | module entered | `true` if all activities of that session (in the current module) are completed |
| `isGoodEnough('m_bouMgt')` | — | `true` once the module has adequate progress (threshold, not full completion) |
| `hasSessionAdequateProgress('s_gesGre')` | module entered | `true` once the session has adequate progress |
| `countCompletedSessions()` | module entered | Number of completed sessions in the current module |
| `countCompletedOverall()` | — | Number of completed sessions across all modules |
| `getProgress()` | — | Overall progress as a number between 0 and 1 |
| `getModuleProgress('m_bouMgt')` | — | That module's progress as a number between 0 and 1 |
| `getProgressAdvice()` | module entered (session optional — advice adapts to the deepest entered level) | A ready-to-display Swiss German advice sentence about how to continue |
| `populateMenuLabelsForModule()` | — | Fills `$jsStateHelperMenuLabel1–9` with one entry per module |
| `populateMenuLabelsForSession()` | module entered | Fills the labels with the current module's sessions |
| `populateMenuLabelsForActivity()` | module + session entered | Fills the labels with the current session's activities |
| `getParticipantLocation()` | — | The current location as `m_x: s_y: a_z` (or `null` before any module was entered); also written to `$participantGroup` after every run |
| `markSuggestionSeen()` / `isSuggestionSeen()` | — | Sets / reads a one-time "suggestion seen" flag |
| `toString()` | — | The full state as a JSON string (the same value written to `$jsStateHelperJson`) |

## Menus

MobileCoach has no dynamic list constructs — menu entries are hard-coded in the flow. The workaround:

1. Call one of the `populateMenuLabelsFor…()` commands (see cheat-sheet, mind the preconditions) **immediately before displaying the menu** — every other command resets all label slots to `""`. It fills `$jsStateHelperMenuLabel1`–`$jsStateHelperMenuLabel9`; unused slots are set to `""` so MobileCoach can hide them. 9 slots is a hard maximum.
2. Each label has the format `"<emoji> <title>:<id>"`, e.g. `"✅ Emotionsregulation:m_emoReg"`. MobileCoach splits on `:` — the **left** side is displayed to the participant, the **right** side (the id) is stored to a routing variable of your choice when the button is tapped.
3. For each possible id, add one hard-coded routing rule: `if <routing variable> == "m_emoReg" → jump to element X`. Tedious to set up once, but fully dynamic thereafter.

> **Caveat:** titles can themselves contain a colon (e.g. *"Abgrenzen mit Klarheit: Das Konsequenzengitter"*). Whether routing survives this depends on where MobileCoach splits — see [open questions](open-questions.md).

Labels (and `getProgressAdvice()` text) are prefixed with an emoji from the `#MENU_EMOJIS` map in the source:

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
- **Something misbehaves but the flow continues** → inspect `$jsStateHelperError` first (and `$jsStateHelperStatus`). Load errors name the offending id; command errors usually mean a typo in `$jsStateHelperCmd` or a missing `enterModule`/`enterSession`/`enterActivity` precondition.
- **Where is the participant right now?** → `$participantGroup` shows the current location (module, session, activity) and is easy to inspect from within MobileCoach.
