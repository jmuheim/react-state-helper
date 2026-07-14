# Developer guide

Architecture, platform internals, and MobileCoach setup of ReactStateHelper.

## Data model

State is a JSON tree managed by four classes in [`src/ReactStateHelper.js`](https://github.com/jmuheim/react-state-helper/blob/master/src/ReactStateHelper.js):

```
👾 ReactStateHelper
└── 🗂️ modules: Module[]
    └── 📑 sessions: Session[]
        └── 🎯 activities: Activity[]
```

| Class | Fields (beyond `id`/`title`/`entered_first_at`/`entered_last_at`/`times_entered`) | Notes |
|---|---|---|
| `Module` | `sessions_needed_for_adequate_progress`, `sessions[]` | Top-level grouping, e.g. "Boundary Management" |
| `Session` | `activities_needed_for_adequate_progress`, `activities[]`, `is_intro` | `is_intro: true` marks a session that has no activities by design (e.g. an introduction) and counts as completed once entered; it must be the module's first session, and every other session must have at least one activity |
| `Activity` | `completed` | Bottom of the hierarchy — contains no children; flips to `true` via `completeActivity()` |

- **Completion**: activities are the only things marked completed directly; sessions and modules derive their completion by aggregating completion status of their children. An `Activity` is completed once marked. A **regular** `Session` (`is_intro: false`) is completed if it has at least one activity and all of them are completed; an **intro** session (`is_intro: true`) has no activities and is instead completed the moment it has been entered once. A `Module` is completed if **all** of its sessions are completed — intro sessions included, which is why they must be entered rather than being skipped.
- **Adequate progress**: a softer bar than full completion — a `Module` has adequate progress once `sessions_needed_for_adequate_progress` of its children are completed. For example: a module contains 4 sessions, but only 3 need to be completed for adequate progress. The same logic applies to `Session` with `activities_needed_for_adequate_progress`. Used to decide e.g. whether to nudge the participant onward instead of insisting they finish everything: whenever an activity is marked as complete, the user gets some advice on how to continue in the flow.

## Architecture

All logic lives in `src/ReactStateHelper.js`. There are four classes:

| Class | Role |
|---|---|
| `Activity` | Bottom of the hierarchy — tracks `completed`, `times_entered`, timestamps |
| `Session` | Contains activities; `isCompleted()` if all activities completed (or, for an intro session, once entered) |
| `Module` | Contains sessions; exposes `countCompletedSessions`, `getProgress` |
| `ReactStateHelper` | Public API; holds `#state` (private); navigated via `current_module_id / current_session_id / current_activity_id` |

### ID conventions

Module, session, and activity ids must be unique across the *entire* state, not just within their parent — MobileCoach maps each one to a separate dialog, and menu routing (see [Menus](#menus) below) navigates directly to the dialog named after the tapped id — one flat namespace, so a duplicate would be ambiguous. The exact same id string must therefore be used consistently in the state definition **and** in MobileCoach (dialog names, variable prefixes). Ids are kept short and mnemonic (e.g. `gesGre`, `akzep`).

Convention: start every id with its level letter — `m` for modules, `s` for sessions, `a` for activities — followed by the mnemonic part in camelCase, i.e. starting with an uppercase letter (e.g. `mBouMgt`, `sGesGre`, `aRolGes`). Ids contain only letters and numbers: each id, with an underscore appended, doubles as the MobileCoach dialog's **variable prefix**, and MobileCoach rejects prefixes containing anything but letters and numbers before the trailing underscore. The uppercase letter after the level letter is what keeps the level marker recognizable without a separator.

Id collisions are prevented at runtime, at the point each id is actually instantiated. A shared `idRegistry` (`Set`) is threaded through `Module.fromJSON → Session.fromJSON → Activity.fromJSON`; each registers its own id via the top-level `registerId()` helper and throws immediately on a collision, and each checks its own threshold/slot-limit right after building its children. A malformed or duplicated id therefore makes state loading fail immediately, with the offending id named in `$rsh_error`.

### State validation

`loadExistingState` (and therefore `initDefaultState`, which delegates to it) creates the registry and also checks the top-level module count. A violation throws on load; the MobileCoach wrapper at the bottom of the file catches this and surfaces it through `$rsh_error` instead of crashing the whole script silently — see "Command dispatch" below. `test/ReactStateHelper.test.js` exercises each of these checks against minimal synthetic states; `defaultStateTemplate()` itself isn't re-asserted invariant-by-invariant, since `initDefaultState` already can't return a state that violates them — it's instead covered by a behavioral test confirming every activity can be completed without throwing.

In numbers, the structural limits checked at load: at most **9** modules (that's how many menu slots exist), **8** sessions per module and **7** activities per session (the sessions and activities menus reserve their last slots for back entries — see [Menus](#menus)); every module needs at least one session with activities; every non-intro session needs at least one activity; an intro session may only be a module's first session.

Every module needs at least one session, and every session needs at least one activity — except an intro session (one with no activities of its own, just a stepping stone into its module's content, e.g. `sBouIntro`), which must set `is_intro: true` to opt out of that check and must be its module's **first** session (both enforced in `Module.fromJSON`). Because an intro has no activities to complete, `Session.isCompleted()` treats it as completed the moment it has been entered once (`entered_first_at !== null`); this way an intro *does* count toward its module's completion — `Module.isCompleted()` requires every session to be completed, intros included — while adding no busywork. The finer-grained progress *fraction* still ignores intros: `Module.getProgress` (behind the `getModuleProgress` command) filters to `sessions.filter(s => s.activities.length > 0)`, so an unentered intro doesn't drag the percentage down. `is_intro` also lets `Session.fromJSON` tell an intentionally-empty intro session apart from one that's missing activities by mistake. A module made up entirely of intro sessions would let a participant "complete" it without doing anything, so `Module.fromJSON` additionally requires at least one session with activities.

### Navigation model

Navigation happens through a single `enter(id)` method: the id's level letter (`m`/`s`/`a` followed by an uppercase letter, guaranteed by `registerId`) determines whether a module, session, or activity is entered — one command therefore works after any menu tap, regardless of the menu's level. Before calling most methods the caller must enter module → session → activity in order (entering a session looks it up within the current module, an activity within the current session). These calls record timestamps and increment `times_entered`. Most query methods (`isSessionCompleted`, `hasSessionAdequateProgress`, etc.) implicitly use the `current_module_id` stored in state.

Two ids the menus emit are *not* enterable: `allModulesMenu` (the target of the sessions and activities menus' module-overview back entries) and `allSessionsOfCurrentModuleMenu` (the target of the activities menu's session back entry) — see [Menus](#menus) below. No flow ever calls `enter()` with either id: dialogs enter themselves after navigation, and while a menu reached via a back entry is displayed the participant's tracked location deliberately stays in the previous context — it changes only when the tapped item's dialog runs `enter('<own id>')`. Dedicated guards at the top of `enter()` reject each id with an explanatory error ("… must never be entered: …") rather than the generic malformed-id message, which would mislead — these are ids the library itself emits into the menu variables. They cannot collide with a state id: `registerId` rejects each by name with its own dedicated error, and the naming convention (uppercase letter after the level letter) would reject them anyway.

### Serialization

`toString()` returns the full state as JSON. `loadExistingState(json)` hydrates it back through the class hierarchy (`Module.fromJSON → Session.fromJSON → Activity.fromJSON`). `initDefaultState()` builds a fresh default state.

### Test setup

`vitest.config.js` lists `src/ReactStateHelper.js` as a `setupFile`, which causes it to execute before every test file and register `ReactStateHelper` as `globalThis.ReactStateHelper`. This mirrors the MobileCoach environment where the class is a plain global — tests therefore import nothing and call `ReactStateHelper` directly.

`test/MobileCoachPlatformConstraints.test.js` reads `src/ReactStateHelper.js` and this guide as *text* and fails on platform-constraint violations (module syntax in the source; a wrapper variable missing from the [variable table](#one-time-mobilecoach-setup) below). It shares its variable-extraction logic with the PostToolUse hook in `.claude/hooks/check-wrapper-variables.mjs`, which raises the same warning already at edit time.

`test/MobileCoachWrapper.test.js` executes the deployment wrapper the way MobileCoach does: it interpolates `$rsh_json`/`$rsh_cmd` textually into the script, runs it in a `vm` context without Node's `process` global, and asserts on the completion-value object — covering command dispatch, error surfacing, state round-tripping, and that all nine menu label slots are written as top-level keys on every run.

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
   | `$rsh_progressAdvice` | Ready-to-display advice sentence about how to continue (see [`getProgressAdvice()`](#flow-logic-commands)), refreshed on **every** run; `""` until a module has been entered |
   | `$rsh_moduleTimesEntered` | How many times the participant's current module has been entered, refreshed on **every** run; `""` while no module has been entered yet |
   | `$rsh_sessionTimesEntered` | Same for the current session; `""` while no session is current (entering a module clears the current session) |
   | `$rsh_activityTimesEntered` | Same for the current activity; `""` while no activity is current (entering a module or session clears the current activity) |
   | `$rsh_moduleCompleted` | Whether the participant's current module is completed, refreshed on **every** run — always exactly the text `true` or `false`, so rules can compare against these two values directly; `""` while no module has been entered yet |
   | `$rsh_sessionCompleted` | Same for the current session; `""` while no session is current (entering a module clears the current session) |
   | `$rsh_activityCompleted` | Same for the current activity; `""` while no activity is current (entering a module or session clears the current activity) |
   | `$rsh_menuLabel1` – `$rsh_menuLabel9` | Dynamic menu entry labels (`"<level emoji> <title>[ <status emoji>]"`) populated by `populateMenuWithModules()` / `populateMenuWithSessions()` / `populateMenuWithActivities()`; written on **every** run — any other command resets all slots to `""` |
   | `$rsh_menuId1` – `$rsh_menuId9` | The id belonging to the label in the same slot (e.g. `mEmoReg`); concatenate the two yourself in the menu definition: `$rsh_menuLabel1:$rsh_menuId1`. Written on **every** run, same reset behavior as the labels |
   | `$participantGroup` | **Already exists by default in MobileCoach — do not create it.** Carries both quick-inspection values, each behind a short label and updated automatically after every run: the participant's location (`currentModuleId`, with `": <currentSessionId>"` and `": <currentActivityId>"` appended as the participant navigates deeper), then ` \| `, then a one-line snapshot of the whole completion state — each module wraps its sessions in `[ ]`, each session its activities in `( )`, every id carries its level emoji directly in front, and every completed item carries ✅ right after its id. E.g. `Participant location: mBouMgt: sGesGre \| Completion overview: 🗂️mBouMgt[📑sBouIntro✅ 📑sGesGre✅(🎯aRolGes✅ 🎯aAbgKon✅) 📑sPaus(🎯aMikPau)]`. Until a module is entered there is no location, so it holds the snapshot alone. (We "mis-use" this built-in variable, as it is one of the few easily inspectable variables from within MobileCoach) |

3. Also declare the two banner variables — the only ones whose default is **not** `0`: `$debugBanner` with default value `⚠️ DEBUGGER INFO ⚠️`, and `$errorBanner` with default value `🚨 ERROR INFO 🚨`. The script never touches them; flows prepend `$debugBanner` to every DEBUGGER-facing message and `$errorBanner` to every error message — participants see the latter too (see the [banner field note](mobilecoach-field-notes.md#coach-selection-and-debug-coaches)).

**⚠️ The silent-failure gotcha:** If any variable is missing or has the wrong access setting, the script fails silently and halts the flow mid-conversation — with **no error output** whatsoever. This is extremely painful to debug. Before testing anything, double-check that *every* variable in the table above is declared with default value `0` and access "manageable by service".

## Running a command

MobileCoach cannot call JavaScript functions directly. Instead, each script run works like this:

1. Set `$rsh_cmd` to the command you want, e.g. `completeActivity()` — exactly as written in the cheat-sheet below. **Be extra careful: typos or syntax errors break the run.**
2. Execute the script (the pasted `ReactStateHelper.js`).
3. Read the results: the command's return value is in `$rsh_result` (`""` for commands that return nothing), `$rsh_status` is `success` or `error`, and `$rsh_error` holds the error message (or `none`).

On the very first run, `$rsh_json` still has its default value `0`; the script detects this and initialises fresh default state automatically. After every run the script also updates `$rsh_json` (the persisted state), `$rsh_progressAdvice`, `$participantGroup`, the three times-entered counters (`$rsh_moduleTimesEntered`, `$rsh_sessionTimesEntered`, `$rsh_activityTimesEntered`), the three completed flags (`$rsh_moduleCompleted`, `$rsh_sessionCompleted`, `$rsh_activityCompleted`), and all nine `$rsh_menuLabel` and nine `$rsh_menuId` variables (empty unless the run's command was a `populateMenuWith…()` one) — you never have to write these yourself.

## Command cheat-sheet

Day to day, flows drive the library with three kinds of **doer** commands: **entering** a module/session/activity, **marking an activity completed**, and **populating a menu**. Entering is a single command, `enter(…)` — the id's level letter (`m`/`s`/`a`) tells the library which level to enter, so the same command works after any menu tap. Most commands require that the participant's current location was set first, in strict order: module → session → activity. Calling a command without its preconditions results in `$rsh_status` = `error`.

| Command (value of `$rsh_cmd`) | Preconditions | Effect |
|---|---|---|
| `enter('mBouMgt')` | — | Sets the current module (and clears session/activity); records visit timestamps and count |
| `enter('sGesGre')` | module entered | Sets the current session (and clears activity); records visit timestamps and count |
| `enter('aRolGes')` | module + session entered | Sets the current activity; records visit timestamps and count |
| `completeActivity()` | module + session + activity entered | Marks the current activity as completed |
| `populateMenuWithActivities()` | module + session entered | Fills the labels and ids with the current session's activities, plus two back entries (`Eine andere 📑 Session wählen` → the `allSessionsOfCurrentModuleMenu` dialog, then `Ein anderes 🗂️ Modul wählen` → the `allModulesMenu` dialog) |
| `populateMenuWithModules()` | — | Fills `$rsh_menuLabel1–9` and `$rsh_menuId1–9` with one entry per module |
| `populateMenuWithSessions()` | module entered | Fills the labels and ids with the current module's sessions, plus a back entry (`Ein anderes 🗂️ Modul wählen` → the `allModulesMenu` dialog) |

Beyond these, the library offers **flow-logic commands** (completion booleans, progress numbers, advice text) that feed MobileCoach's conditional branching — see [Flow-logic commands](#flow-logic-commands) below.

## Menus

MobileCoach has no dynamic list/loop constructs for building menus — menu entries are hard-coded in the flow. The workaround is to pre-declare a fixed number of `$rsh_menuLabel1`–`$rsh_menuLabel9` and `$rsh_menuId1`–`$rsh_menuId9` variables and populate them from JS, with one command per hierarchy level:

1. Call one of the `populateMenuWith…()` commands (see the [cheat-sheet](#command-cheat-sheet), mind the preconditions: `enter('mBouMgt')` before `populateMenuWithSessions()`, and additionally `enter('sGesGre')` before `populateMenuWithActivities()`) **immediately before displaying the menu** — every other command resets all slots to `""`. It fills `$rsh_menuLabel1`–`$rsh_menuLabel9` (the display text) and `$rsh_menuId1`–`$rsh_menuId9` (the matching id, e.g. `mEmoReg`); unused slots are set to `""` so MobileCoach can hide them.
2. In the menu definition, concatenate label and id per slot with a colon: `$rsh_menuLabel1:$rsh_menuId1`. MobileCoach splits on `:` when the button is tapped — the **left** side is displayed to the participant, the **right** side (the id) is stored to the reserved variable `$participantNextMicroDialogIdentifier` ([field note](mobilecoach-field-notes.md#the-tapped-menu-id-lands-in-participantnextmicrodialogidentifier)).
3. MobileCoach reads that variable and navigates directly to the dialog with that id — so each module/session/activity id needs a dialog of exactly the same name. This direct id-to-dialog navigation is also why ids must be unique across the entire state.

The `:`-split happens on the **raw definition text, before variable interpolation** — colons inside variable values are not treated as separators ([field note](mobilecoach-field-notes.md#menu-entries-split-on-the-raw-definition-text-not-on-variable-content)). Titles are nevertheless still rejected at state load if they contain a colon; that validation predates this insight, and whether to drop it is an [open question](open-questions.md#drop-the-title-colon-validation).

Each label is formatted as `"<level emoji> <title>[ <status emoji>]"` — the level emoji (🗂️/📑/🎯) always prefixes the title, and a status emoji (✅ completed, 👈 next up) is appended after it where applicable (e.g. `"🗂️ Emotionsregulation ✅"`). All emojis come from the `#EMOJIS` map in the source:

| Key | Emoji | Used for |
|---|---|---|
| `module` | 🗂️ | prefixed to every modules-menu label, to quoted module titles in `getProgressAdvice()` (`Modul "🗂️ Modul Eins"` — inside the quotes, matching the menu-label format), to module ids in the completion snapshot inside `$participantGroup` (there without a space), and used in the sessions and activities menus' back entries |
| `session` | 📑 | prefixed to every sessions-menu label, to quoted session titles in `getProgressAdvice()`, to session ids in the completion snapshot (no space), and used in the activities menu's back entry |
| `activity` | 🎯 | prefixed to every activities-menu label, to quoted activity titles in `getProgressAdvice()`, and to activity ids in the completion snapshot (no space) |
| `completed` | ✅ | appended to a completed item in a menu, and to a completed item's id in the completion snapshot inside `$participantGroup` |
| `next` | 👈 | appended to the first not-yet-completed item in a menu (menus only) |

Menu items that are neither completed nor the next one get no status emoji — just the level prefix.

### Back entries

The sessions and activities menus automatically append **back entries** in the slots after their last item:

- Sessions menu: `Ein anderes 🗂️ Modul wählen`, routing to the dialog id `allModulesMenu` — **name the dialog that shows the module-selection menu (the one calling `populateMenuWithModules()`) exactly `allModulesMenu`**, or the back entry leads nowhere (a tap on an id without a matching dialog silently pauses the flow, see the [field note](mobilecoach-field-notes.md#a-participantnextmicrodialogidentifier-without-a-matching-dialog-pauses-the-flow-silently)). Where the dialog lives doesn't matter — in our setup it is currently a sub-dialog of the *Einführung* dialog — only its id does. *(TODO: it probably won't stay there — the plan is to move it into the "Magic Menu" dialog, since it is called again and again from within modules; keeping it in the Einführung only reflects that that's where it is displayed first.)*
- Activities menu: `Eine andere 📑 Session wählen`, routing to the dialog id `allSessionsOfCurrentModuleMenu` — **name the dialog that shows the session-selection menu (the one calling `populateMenuWithSessions()`) exactly `allSessionsOfCurrentModuleMenu`**, same silent-failure trap as above — followed by `Ein anderes 🗂️ Modul wählen`, routing to `allModulesMenu` just like the sessions menu's entry, so a participant can switch modules without hopping through the sessions menu first.

A back tap involves no library command — `enter('allModulesMenu')` and `enter('allSessionsOfCurrentModuleMenu')` are **never** called (doing so by mistake puts a dedicated "… must never be entered" message into `$rsh_error` — see [Navigation model](#navigation-model)). While a menu reached via a back entry is displayed, the participant's tracked location simply stays in the previous context; it changes when the tapped entry's dialog runs its own `enter(…)` (entering a module clears the current session/activity as usual). Back entries never get a level prefix or the ✅/👈 status emoji — their labels are fixed. The modules menu has no back entry — it is already the top level.

To guarantee the back entries always have free slots, state validation caps sessions per module at `MAX_MENU_SLOTS - 1` (8) and activities per session at `MAX_MENU_SLOTS - 2` (7); the module count stays capped at 9, since the top-level menu has no back entry.

Good to know:

- The wrapper writes all nine label and all nine id variables on **every** run — a run whose command isn't one of the `populateMenuWith…()` methods resets them to `""`. Stale entries can't survive, but a menu must be (re)populated right before it is displayed.
- The number of slots (9) is a self-imposed choice, not a MobileCoach platform limit — it could be fewer or more, but 9 seems reasonable headroom.
- There are three separate methods rather than one auto-detecting `populateMenu()`.
    - This allows displaying a higher-level menu while the user is navigated deeper — for example, a "go back" screen.
    - Explicit method names also make the MobileCoach command variable self-documenting.

## Flow-logic commands

Content editors only ever issue the "doer" commands (`enter(…)`, `completeActivity()`, `populateMenuWith…()` — see the [command cheat-sheet](#command-cheat-sheet) above). The query commands below are developer territory: they return booleans, numbers, and display strings that feed MobileCoach's variable-based conditional branching (see "No conditional logic in flows beyond variables" below), and wiring that branching is a developer task.

They are issued the same way as every other command — set `$rsh_cmd`, run the script, read `$rsh_result` (the mechanics are described under [Running a command](#running-a-command) above). The same location preconditions apply: `enter(…)` the module before its session, and a command issued without its preconditions sets `$rsh_status` = `error`.

| Command (value of `$rsh_cmd`) | Preconditions | Returns |
|---|---|---|
| `getCurrentModuleTimesEntered()` | — | How many times the current module has been entered, or `null` while no module is entered. Also written automatically to `$rsh_moduleTimesEntered` on **every** run (`""` instead of `null`), so flows can branch on it without issuing the command |
| `getCurrentSessionTimesEntered()` | — | Same for the current session (auto-written to `$rsh_sessionTimesEntered`); `null`/`""` while no session is current — entering a module clears the current session |
| `getCurrentActivityTimesEntered()` | — | Same for the current activity (auto-written to `$rsh_activityTimesEntered`); `null`/`""` while no activity is current — entering a module or session clears the current activity |
| `isCurrentModuleCompleted()` | — | Whether the current module is completed, or `null` while no module is entered. Also written automatically to `$rsh_moduleCompleted` on **every** run — as the plain string `true`/`false` (`""` instead of `null`), so flows can branch on the exact text without issuing the command |
| `isCurrentSessionCompleted()` | — | Same for the current session (auto-written to `$rsh_sessionCompleted`); `null`/`""` while no session is current — entering a module clears the current session |
| `isCurrentActivityCompleted()` | — | Same for the current activity (auto-written to `$rsh_activityCompleted`); `null`/`""` while no activity is current — entering a module or session clears the current activity |
| `getModuleProgress('mBouMgt')` | — | That module's progress as a number between 0 and 1 |
| `getProgressAdvice()` | module entered (session optional — advice adapts to the deepest entered level) | A ready-to-display Swiss German advice sentence about how to continue. Also written automatically to `$rsh_progressAdvice` on **every** run (`""` while no module is entered), so flows can display it without issuing the command |
| `hasModuleAdequateProgress('mBouMgt')` | — | `true` once the module has adequate progress (threshold, not full completion) |
| `hasSessionAdequateProgress('sGesGre')` | module entered | `true` once the session has adequate progress |
| `isModuleCompleted('mBouMgt')` | — | `true` if all of the module's sessions are completed — an intro session counts once it has been entered |
| `isSessionCompleted('sGesGre')` | module entered | `true` if all activities of that session (in the current module) are completed |

## Troubleshooting

- **The flow just stops, no error anywhere** → almost always an undeclared or misconfigured variable. Re-check every row of the [variable table](#one-time-mobilecoach-setup): default `0`, access "manageable by service".
- **Something misbehaves but the flow continues** → inspect `$rsh_error` first (and `$rsh_status`). Load errors name the offending id; command errors usually mean a typo in `$rsh_cmd` or a missing `enter(…)` precondition (module before session, session before activity).
- **Where is the participant right now, and what have they completed?** → `$participantGroup` shows the current location (module, session, activity) followed by the completion snapshot, and is easy to inspect from within MobileCoach.

## MobileCoach / Pathmate platform constraints

Understanding these constraints is essential — they drive most design decisions in this library.

### Execution model

MobileCoach runs JavaScript snippets in a restricted environment. There is no module system, no `import`/`export`, no Node.js globals (i.e. `process` is absent — we use it to detect the MobileCoach environment vs. Node.js tests). Code must be a single self-contained script. Classes and functions must be declared inline.

### Variables

MobileCoach uses `$variableName` variables that are declared upfront in the project with a fixed name and initial value. The script writes back to them by returning a plain object — MobileCoach writes each key back into the variable of the same name (one key, one variable; an object nested inside another value is not unpacked). This is why the deployment wrapper writes each of the nine menu labels and nine menu ids as its own key on every run: the `populateMenuWith…()` methods store labels and ids on the helper instance, and the wrapper reads them back per slot via `getMenuLabel(slot)` / `getMenuId(slot)` (empty string on runs that didn't populate a menu). Variables must be declared in advance; you cannot create new ones at runtime. This means any variable the script might ever write to must be pre-declared, including numbered series like `$rsh_menuLabel1`–`$rsh_menuLabel9` and `$rsh_menuId1`–`$rsh_menuId9`. **Critical:** if a variable is missing or has the wrong access setting, the script silently fails and halts execution mid-flow with no error output — this is extremely painful to debug. Always make sure every variable is declared with default value `0` and access "manageable by service" before testing — the full table lives under [One-time MobileCoach setup](#one-time-mobilecoach-setup) above.

### Script-editor validation on save: `$` only before declared variable names

MobileCoach's script editor is a plain text field; when confirming it with "Ok", MobileCoach scans the **raw text** — code, strings, and comments alike — for `$` signs and rejects the save ("The text contains unknown variables") unless every `$` is immediately followed by the name of a declared variable. Verified 2026-07-09: even the fragment `$-prefixed` inside a comment was rejected. Consequences for this codebase:

- **No `${…}` template interpolation anywhere** in `src/ReactStateHelper.js` — strings are built with plain `+` concatenation instead (e.g. `o['rsh_menuLabel' + i]`).
- **No `$` in comments except before real variable names**: writing about a declared variable is fine (`$rsh_json`), but pseudo-names (`$rsh_menuLabelN`) or phrases like "$-prefixed" fail the validation — refer to a series via a concrete member instead (`$rsh_menuLabel1`).

Both rules are enforced by `test/MobileCoachPlatformConstraints.test.js` ("every `$` in the source starts a variable name documented in the developer guide") and flagged already at edit time by the PostToolUse hook `.claude/hooks/check-wrapper-variables.mjs`, which shares the same check (`findInvalidDollarSigns`).

### State persistence

There is no database or session store accessible from JS. State is round-tripped as a JSON string through `$rsh_json`: the script reads it at the start, mutates in-memory objects, then writes the serialized result back at the end. On the very first run `$rsh_json` is `0` (MobileCoach's default for uninitialised variables), which the script detects and replaces with fresh state from `defaultStateTemplate()`.

### Command dispatch

MobileCoach has no way to call specific JS functions directly. Instead, inside MobileCoach, the variable `$rsh_cmd` needs to be set to a string like `"completeActivity()"` before the JS script is executed. The script then `eval`s it against the helper instance. While `eval` is generally dangerous, it is safe here because we are in full control of what gets set in `$rsh_cmd`. If, however, the eval throws an error, it is caught and written to `$rsh_status` (`"error"`) and `$rsh_error` (the message), so failures can be inspected inside MobileCoach. Commands that return nothing write `""` into `$rsh_result`, so it never holds a stale value from an earlier run. The step-by-step mechanics are described under [Running a command](#running-a-command) above.

### Menus are static by default

MobileCoach has no dynamic list/loop constructs for building menus — menu entries are hard-coded in the flow. The workaround (pre-declared label/id slot variables populated from JS), the label format, the `:`-split routing via `$participantNextMicroDialogIdentifier`, the back entries, and the resulting slot caps are all described under [Menus](#menus) above.

### No conditional logic in flows beyond variables

Showing/hiding UI elements, branching flows, and labelling menu entries all depend on `$variable` content. This is why boolean results and label strings are the primary output of this library — they feed directly into MobileCoach's variable-based conditional system.
