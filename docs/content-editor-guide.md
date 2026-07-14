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

- Ids are short and mnemonic, starting with their level letter — `m` for modules, `s` for sessions, `a` for activities — followed by the mnemonic part in camelCase, e.g. `mBouMgt`, `sGesGre`, `aRolGes`. Only letters and numbers are allowed (no underscores): the id with an underscore appended is used verbatim as the dialog's variable prefix in MobileCoach, and prefixes only allow letters and numbers before the trailing underscore.
- Ids must be **unique across the whole state**, not just within their parent. MobileCoach maps each id to a separate dialog, and menu routing (see [Menus](#menus)) navigates directly to the dialog named after the tapped id — so the exact same id string must be used consistently in the state definition **and** in MobileCoach (dialog names, variable prefixes).
- A malformed or duplicated id makes state loading fail immediately, with the offending id named in `$rsh_error`.

Two progress notions exist per module/session:

- **Completed** — all activities of a session are done; all sessions (that have activities) of a module are done.
- **Adequate progress** — a softer bar: the item counts as "good enough" once `sessions_needed_for_adequate_progress` / `activities_needed_for_adequate_progress` of its children are completed, even if not all of them are. Used to nudge participants onward instead of insisting they finish everything.

An **intro session** is a session with no activities of its own (just a stepping stone into the module, e.g. `sBouIntro`). It must be marked `is_intro: true` in the state definition and be the module's **first** session. Because it has no activities, it counts as completed as soon as the participant enters it once — so it *does* count toward the module being completed, but it never affects the finer-grained progress percentage.

Structural limits, checked when state loads: at most **9** modules (that's how many menu slots exist), **8** sessions per module (the sessions menu reserves its last slot for a back entry) and **7** activities per session (the activities menu reserves its last two slots for back entries, see [Menus](#menus)); every module needs at least one session with activities; every non-intro session needs at least one activity; an intro session may only be a module's first session.

## One-time MobileCoach setup

1. Copy the full contents of [`src/ReactStateHelper.js`](https://github.com/jmuheim/react-state-helper/blob/master/src/ReactStateHelper.js) **as-is** into MobileCoach.
2. Create the following variables in your MobileCoach project — every single one, each with default value `0` and access **"manageable by service"**. The one exception is `$participantGroup`, which already exists by default in MobileCoach; you do not create it (see its row below):

   | Variable | Purpose |
   |---|---|
   | `$rsh_cmd` | Command to execute, e.g. `completeActivity()` (set this before each script run) |
   | `$rsh_json` | Full serialized state, persisted between runs |
   | `$rsh_result` | Return value of the last command; `""` when the command returns nothing (`enter(…)`, `completeActivity()`, the `populateMenuWith…()` commands, …) |
   | `$rsh_status` | `success` or `error` |
   | `$rsh_error` | Error message if status is `error`, otherwise `none` |
   | `$rsh_completionOverview` | One-line snapshot of the whole completion state, for quick inspection: each module wraps its sessions in `[ ]`, each session its activities in `( )`, and every completed item carries ✅ right after its id — e.g. `mBouMgt[sBouIntro✅ sGesGre✅(aRolGes✅ aAbgKon✅) sPaus(aMikPau)]` |
   | `$rsh_progressAdvice` | Ready-to-display advice sentence about how to continue (see [`getProgressAdvice()`](developer-guide.md#flow-logic-commands)), refreshed on **every** run; `""` until a module has been entered |
   | `$rsh_menuLabel1` – `$rsh_menuLabel9` | Dynamic menu entry labels (`"<level emoji> <title>[ <status emoji>]"`) populated by `populateMenuWithModules()` / `populateMenuWithSessions()` / `populateMenuWithActivities()`; written on **every** run — any other command resets all slots to `""` |
   | `$rsh_menuId1` – `$rsh_menuId9` | The id belonging to the label in the same slot (e.g. `mEmoReg`); concatenate the two yourself in the menu definition: `$rsh_menuLabel1:$rsh_menuId1`. Written on **every** run, same reset behavior as the labels |
   | `$participantGroup` | **Already exists by default in MobileCoach — do not create it.** `null` until a module is entered; then `currentModuleId`, with `": <currentSessionId>"` and `": <currentActivityId>"` appended as the participant navigates deeper — updated automatically after every run (we "mis-use" this built-in variable, as it is one of the few easily inspectable variables from within MobileCoach) |

**⚠️ The silent-failure gotcha:** If any variable is missing or has the wrong access setting, the script fails silently and halts the flow mid-conversation — with **no error output** whatsoever. This is extremely painful to debug. Before testing anything, double-check that *every* variable in the table above is declared with default value `0` and access "manageable by service".

## Running a command

MobileCoach cannot call JavaScript functions directly. Instead, each script run works like this:

1. Set `$rsh_cmd` to the command you want, e.g. `completeActivity()` — exactly as written in the cheat-sheet below. **Be extra careful: typos or syntax errors break the run.**
2. Execute the script (the pasted `ReactStateHelper.js`).
3. Read the results: the command's return value is in `$rsh_result` (`""` for commands that return nothing), `$rsh_status` is `success` or `error`, and `$rsh_error` holds the error message (or `none`).

On the very first run, `$rsh_json` still has its default value `0`; the script detects this and initialises fresh default state automatically. After every run the script also updates `$rsh_json` (the persisted state), `$rsh_completionOverview`, `$rsh_progressAdvice`, `$participantGroup`, and all nine `$rsh_menuLabel` and nine `$rsh_menuId` variables (empty unless the run's command was a `populateMenuWith…()` one) — you never have to write these yourself.

## Command cheat-sheet

As a content editor you only ever issue three kinds of commands: **entering** a module/session/activity, **marking an activity completed**, and **populating a menu**. Entering is a single command, `enter(…)` — the id's level letter (`m`/`s`/`a`) tells the library which level to enter, so the same command works after any menu tap. Most commands require that the participant's current location was set first, in strict order: module → session → activity. Calling a command without its preconditions results in `$rsh_status` = `error`.

| Command (value of `$rsh_cmd`) | Preconditions | Effect |
|---|---|---|
| `enter('mBouMgt')` | — | Sets the current module (and clears session/activity); records visit timestamps and count |
| `enter('sGesGre')` | module entered | Sets the current session (and clears activity); records visit timestamps and count |
| `enter('aRolGes')` | module + session entered | Sets the current activity; records visit timestamps and count |
| `completeActivity()` | module + session + activity entered | Marks the current activity as completed |
| `populateMenuWithActivities()` | module + session entered | Fills the labels and ids with the current session's activities, plus two back entries (`Eine andere 📑 Session wählen` → the `allSessionsOfCurrentModuleMenu` dialog, then `Ein anderes 🗂️ Modul wählen` → the `allModulesMenu` dialog) |
| `populateMenuWithModules()` | — | Fills `$rsh_menuLabel1–9` and `$rsh_menuId1–9` with one entry per module |
| `populateMenuWithSessions()` | module entered | Fills the labels and ids with the current module's sessions, plus a back entry (`Ein anderes 🗂️ Modul wählen` → the `allModulesMenu` dialog) |

The library also offers **flow-logic commands** (completion booleans, progress numbers, advice text) that feed MobileCoach's conditional branching. Those are wired into the flows by developers and documented in the [developer guide](developer-guide.md#flow-logic-commands) — as a content editor you never need to issue them.

## Menus

MobileCoach has no dynamic list constructs — menu entries are hard-coded in the flow. The workaround:

1. Call one of the `populateMenuWith…()` commands (see cheat-sheet, mind the preconditions) **immediately before displaying the menu** — every other command resets all slots to `""`. It fills `$rsh_menuLabel1`–`$rsh_menuLabel9` (display text, `"<level emoji> <title>[ <status emoji>]"`, e.g. `"🗂️ Emotionsregulation ✅"`) and `$rsh_menuId1`–`$rsh_menuId9` (the matching id, e.g. `mEmoReg`); unused slots are set to `""` so MobileCoach can hide them. 9 slots is a hard maximum.
2. In the menu definition, concatenate label and id per slot with a colon: `$rsh_menuLabel1:$rsh_menuId1`. MobileCoach splits on `:` — the **left** side is displayed to the participant, the **right** side (the id) is stored to the reserved variable `$participantNextMicroDialogIdentifier` when the button is tapped.
3. MobileCoach reads that variable and navigates directly to the dialog with that id. Just make sure each module/session/activity id has a dialog of exactly the same name.

> **Note:** titles must not contain a colon — state loading rejects them. MobileCoach performs the `:`-split on the raw menu definition text before variables are interpolated ([field note](mobilecoach-field-notes.md#menu-entries-split-on-the-raw-definition-text-not-on-variable-content)), so a colon inside a label would be displayed literally rather than corrupt the split; whether the validation can therefore be dropped is an [open question](open-questions.md#drop-the-title-colon-validation).

Every menu label starts with the emoji of its level (`🗂️ <module title>`, `📑 <session title>`, `🎯 <activity title>`), and a status emoji may be appended after the title. All emojis come from the `#EMOJIS` map in the source:

| Key | Emoji | Used for |
|---|---|---|
| `module` | 🗂️ | prefixed to every modules-menu label, to quoted module titles in `getProgressAdvice()` (`Modul "🗂️ Modul Eins"` — inside the quotes, matching the menu-label format), and used in the sessions and activities menus' back entries |
| `session` | 📑 | prefixed to every sessions-menu label, to quoted session titles in `getProgressAdvice()`, and used in the activities menu's back entry |
| `activity` | 🎯 | prefixed to every activities-menu label and to quoted activity titles in `getProgressAdvice()` |
| `completed` | ✅ | appended to a completed item in a menu, and to a completed item's id in `$rsh_completionOverview` |
| `next` | 👈 | appended to the first not-yet-completed item in a menu (menus only) |

Menu items that are neither completed nor the next one get no status emoji — just the level prefix.

### Back entries

The sessions and activities menus automatically append back entries in the slots after their last item (which is why sessions are capped at 8 per module and activities at 7 per session — see [structural limits](#how-content-is-structured) above):

- Sessions menu: `Ein anderes 🗂️ Modul wählen`, routing to the dialog id `allModulesMenu` — **name the dialog that shows the module-selection menu (the one calling `populateMenuWithModules()`) exactly `allModulesMenu`**, or the back entry leads nowhere (a tap on an id without a matching dialog silently pauses the flow, see the [field note](mobilecoach-field-notes.md#a-participantnextmicrodialogidentifier-without-a-matching-dialog-pauses-the-flow-silently)). Where the dialog lives doesn't matter — in our setup it is currently a sub-dialog of the *Einführung* dialog — only its id does. *(TODO: it probably won't stay there — the plan is to move it into the "Magic Menu" dialog, since it is called again and again from within modules; keeping it in the Einführung only reflects that that's where it is displayed first.)*
- Activities menu: `Eine andere 📑 Session wählen`, routing to the dialog id `allSessionsOfCurrentModuleMenu` — **name the dialog that shows the session-selection menu (the one calling `populateMenuWithSessions()`) exactly `allSessionsOfCurrentModuleMenu`**, same silent-failure trap as above — followed by `Ein anderes 🗂️ Modul wählen`, routing to `allModulesMenu` just like the sessions menu's entry — so a participant can switch modules without hopping through the sessions menu first.

A back tap needs no library command of its own — `enter('allModulesMenu')` and `enter('allSessionsOfCurrentModuleMenu')` are **never** called (doing so by mistake puts a dedicated "… must never be entered" message into `$rsh_error`). While a menu reached via a back entry is displayed, the participant's tracked location simply stays in the previous context; it changes when the tapped entry's dialog runs its own `enter(…)` (entering a module clears the current session/activity as usual). Back entries never get a level prefix or the ✅/👈 status emoji — their labels are fixed. The modules menu has no back entry — it is already the top level.

## Troubleshooting

- **The flow just stops, no error anywhere** → almost always an undeclared or misconfigured variable. Re-check every row of the [variable table](#one-time-mobilecoach-setup): default `0`, access "manageable by service".
- **Something misbehaves but the flow continues** → inspect `$rsh_error` first (and `$rsh_status`). Load errors name the offending id; command errors usually mean a typo in `$rsh_cmd` or a missing `enter(…)` precondition (module before session, session before activity).
- **Where is the participant right now?** → `$participantGroup` shows the current location (module, session, activity) and is easy to inspect from within MobileCoach.
