# Developer guide

Architecture and platform internals of ReactStateHelper. If you define content inside [MobileCoach](https://mobile-coach.eu/) rather than working on the underlying high-level logic, the [content editor guide](content-editor-guide.md) is for you.

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
| `ReactStateHelper` | Public API; holds `#state` (private); navigated via `currentModuleId / currentSessionId / currentActivityId` |

### ID conventions

Module, session, and activity ids must be unique across the *entire* state, not just within their parent — MobileCoach maps each one to a separate dialog, and menu routing (see "Menus are static by default" below) navigates directly to the dialog named after the tapped id — one flat namespace, so a duplicate would be ambiguous. Ids are kept short and mnemonic (e.g. `gesGre`, `akzep`).

Convention: start every id with its level letter — `m` for modules, `s` for sessions, `a` for activities — followed by the mnemonic part in camelCase, i.e. starting with an uppercase letter (e.g. `mBouMgt`, `sGesGre`, `aRolGes`). Ids contain only letters and numbers: each id, with an underscore appended, doubles as the MobileCoach dialog's **variable prefix**, and MobileCoach rejects prefixes containing anything but letters and numbers before the trailing underscore. The uppercase letter after the level letter is what keeps the level marker recognizable without a separator.

Id collisions are prevented at runtime, at the point each id is actually instantiated. A shared `idRegistry` (`Set`) is threaded through `Module.fromJSON → Session.fromJSON → Activity.fromJSON`; each registers its own id via the top-level `registerId()` helper and throws immediately on a collision, and each checks its own threshold/slot-limit right after building its children.

### State validation

`loadExistingState` (and therefore `initDefaultState`, which delegates to it) creates the registry and also checks the top-level module count. A violation throws on load; the MobileCoach wrapper at the bottom of the file catches this and surfaces it through `$rsh_error` instead of crashing the whole script silently — see "Command dispatch" below. `test/ReactStateHelper.test.js` exercises each of these checks against minimal synthetic states; `defaultStateTemplate()` itself isn't re-asserted invariant-by-invariant, since `initDefaultState` already can't return a state that violates them — it's instead covered by a behavioral test confirming every activity can be completed without throwing.

Every module needs at least one session, and every session needs at least one activity — except an intro session (one with no activities of its own, just a stepping stone into its module's content, e.g. `sBouIntro`), which must set `is_intro: true` to opt out of that check and must be its module's **first** session (both enforced in `Module.fromJSON`). Because an intro has no activities to complete, `Session.isCompleted()` treats it as completed the moment it has been entered once (`entered_first_at !== null`); this way an intro *does* count toward its module's completion — `Module.isCompleted()` requires every session to be completed, intros included — while adding no busywork. The finer-grained progress *fraction* still ignores intros: `Module.getProgress` (behind the `getModuleProgress` command) filters to `sessions.filter(s => s.activities.length > 0)`, so an unentered intro doesn't drag the percentage down. `is_intro` also lets `Session.fromJSON` tell an intentionally-empty intro session apart from one that's missing activities by mistake. A module made up entirely of intro sessions would let a participant "complete" it without doing anything, so `Module.fromJSON` additionally requires at least one session with activities.

### Navigation model

Navigation happens through a single `enter(id)` method: the id's level letter (`m`/`s`/`a` followed by an uppercase letter, guaranteed by `registerId`) determines whether a module, session, or activity is entered — one command therefore works after any menu tap, regardless of the menu's level. Before calling most methods the caller must enter module → session → activity in order (entering a session looks it up within the current module, an activity within the current session). These calls record timestamps and increment `times_entered`. Most query methods (`isSessionCompleted`, `hasSessionAdequateProgress`, etc.) implicitly use the `currentModuleId` stored in state.

Two ids the menus emit are *not* enterable: `allModulesMenu` (the target of the sessions and activities menus' module-overview back entries) and `allSessionsOfCurrentModuleMenu` (the target of the activities menu's session back entry) — see "Menus are static by default" below. No flow ever calls `enter()` with either id: dialogs enter themselves after navigation, and while a menu reached via a back entry is displayed the participant's tracked location deliberately stays in the previous context — it changes only when the tapped item's dialog runs `enter('<own id>')`. Dedicated guards at the top of `enter()` reject each id with an explanatory error ("… must never be entered: …") rather than the generic malformed-id message, which would mislead — these are ids the library itself emits into the menu variables. They cannot collide with a state id: `registerId` rejects each by name with its own dedicated error, and the naming convention (uppercase letter after the level letter) would reject them anyway.

### Serialization

`toString()` returns the full state as JSON. `loadExistingState(json)` hydrates it back through the class hierarchy (`Module.fromJSON → Session.fromJSON → Activity.fromJSON`). `initDefaultState()` builds a fresh default state.

### Test setup

`vitest.config.js` lists `src/ReactStateHelper.js` as a `setupFile`, which causes it to execute before every test file and register `ReactStateHelper` as `globalThis.ReactStateHelper`. This mirrors the MobileCoach environment where the class is a plain global — tests therefore import nothing and call `ReactStateHelper` directly.

`test/MobileCoachPlatformConstraints.test.js` reads `src/ReactStateHelper.js` and `docs/content-editor-guide.md` as *text* and fails on platform-constraint violations (module syntax in the source; a wrapper variable missing from the content-editor guide's variable table). It shares its variable-extraction logic with the PostToolUse hook in `.claude/hooks/check-wrapper-variables.mjs`, which raises the same warning already at edit time.

`test/MobileCoachWrapper.test.js` executes the deployment wrapper the way MobileCoach does: it interpolates `$rsh_json`/`$rsh_cmd` textually into the script, runs it in a `vm` context without Node's `process` global, and asserts on the completion-value object — covering command dispatch, error surfacing, state round-tripping, and that all nine menu label slots are written as top-level keys on every run.

## Flow-logic commands

Content editors only issue the "doer" commands (`enter(…)`, `completeActivity()`, `populateMenuWith…()` — see the [content editor guide's cheat-sheet](content-editor-guide.md#command-cheat-sheet)). The query commands below are developer territory: they return booleans, numbers, and display strings that feed MobileCoach's variable-based conditional branching (see "No conditional logic in flows beyond variables" below), and wiring that branching is a developer task.

They are issued the same way as every other command — set `$rsh_cmd`, run the script, read `$rsh_result` (the mechanics are described in the content editor guide under [Running a command](content-editor-guide.md#running-a-command)). The same location preconditions apply: `enter(…)` the module before its session, and a command issued without its preconditions sets `$rsh_status` = `error`.

| Command (value of `$rsh_cmd`) | Preconditions | Returns |
|---|---|---|
| `getCurrentModuleTimesEntered()` | — | How many times the current module has been entered, or `null` while no module is entered. Also written automatically to `$rsh_moduleTimesEntered` on **every** run (`""` instead of `null`), so flows can branch on it without issuing the command |
| `getCurrentSessionTimesEntered()` | — | Same for the current session (auto-written to `$rsh_sessionTimesEntered`); `null`/`""` while no session is current — entering a module clears the current session |
| `getCurrentActivityTimesEntered()` | — | Same for the current activity (auto-written to `$rsh_activityTimesEntered`); `null`/`""` while no activity is current — entering a module or session clears the current activity |
| `isCurrentModuleCompleted()` | — | Whether the current module is completed, or `null` while no module is entered. Also written automatically to `$rsh_moduleCompleted` on **every** run (`""` instead of `null`), so flows can branch on it without issuing the command |
| `isCurrentSessionCompleted()` | — | Same for the current session (auto-written to `$rsh_sessionCompleted`); `null`/`""` while no session is current — entering a module clears the current session |
| `isCurrentActivityCompleted()` | — | Same for the current activity (auto-written to `$rsh_activityCompleted`); `null`/`""` while no activity is current — entering a module or session clears the current activity |
| `getModuleProgress('mBouMgt')` | — | That module's progress as a number between 0 and 1 |
| `getProgressAdvice()` | module entered (session optional — advice adapts to the deepest entered level) | A ready-to-display Swiss German advice sentence about how to continue. Also written automatically to `$rsh_progressAdvice` on **every** run (`""` while no module is entered), so flows can display it without issuing the command |
| `hasModuleAdequateProgress('mBouMgt')` | — | `true` once the module has adequate progress (threshold, not full completion) |
| `hasSessionAdequateProgress('sGesGre')` | module entered | `true` once the session has adequate progress |
| `isModuleCompleted('mBouMgt')` | — | `true` if all of the module's sessions are completed — an intro session counts once it has been entered |
| `isSessionCompleted('sGesGre')` | module entered | `true` if all activities of that session (in the current module) are completed |

## MobileCoach / Pathmate platform constraints

Understanding these constraints is essential — they drive most design decisions in this library.

### Execution model

MobileCoach runs JavaScript snippets in a restricted environment. There is no module system, no `import`/`export`, no Node.js globals (i.e. `process` is absent — we use it to detect the MobileCoach environment vs. Node.js tests). Code must be a single self-contained script. Classes and functions must be declared inline.

### Variables

MobileCoach uses `$variableName` variables that are declared upfront in the project with a fixed name and initial value. The script writes back to them by returning a plain object — MobileCoach writes each key back into the variable of the same name (one key, one variable; an object nested inside another value is not unpacked). This is why the deployment wrapper writes each of the nine menu labels and nine menu ids as its own key on every run: the `populateMenuWith…()` methods store labels and ids on the helper instance, and the wrapper reads them back per slot via `getMenuLabel(slot)` / `getMenuId(slot)` (empty string on runs that didn't populate a menu). Variables must be declared in advance; you cannot create new ones at runtime. This means any variable the script might ever write to must be pre-declared, including numbered series like `$rsh_menuLabel1`–`$rsh_menuLabel9` and `$rsh_menuId1`–`$rsh_menuId9`. **Critical:** if a variable is missing or has the wrong access setting, the script silently fails and halts execution mid-flow with no error output — this is extremely painful to debug. Always make sure every variable is declared with default value `0` and access "manageable by service" before testing — the full table lives in the [content editor guide](content-editor-guide.md#one-time-mobilecoach-setup).

### Script-editor validation on save: `$` only before declared variable names

MobileCoach's script editor is a plain text field; when confirming it with "Ok", MobileCoach scans the **raw text** — code, strings, and comments alike — for `$` signs and rejects the save ("The text contains unknown variables") unless every `$` is immediately followed by the name of a declared variable. Verified 2026-07-09: even the fragment `$-prefixed` inside a comment was rejected. Consequences for this codebase:

- **No `${…}` template interpolation anywhere** in `src/ReactStateHelper.js` — strings are built with plain `+` concatenation instead (e.g. `o['rsh_menuLabel' + i]`).
- **No `$` in comments except before real variable names**: writing about a declared variable is fine (`$rsh_json`), but pseudo-names (`$rsh_menuLabelN`) or phrases like "$-prefixed" fail the validation — refer to a series via a concrete member instead (`$rsh_menuLabel1`).

Both rules are enforced by `test/MobileCoachPlatformConstraints.test.js` ("every `$` in the source starts a variable name documented in the content-editor guide") and flagged already at edit time by the PostToolUse hook `.claude/hooks/check-wrapper-variables.mjs`, which shares the same check (`findInvalidDollarSigns`).

### State persistence

There is no database or session store accessible from JS. State is round-tripped as a JSON string through `$rsh_json`: the script reads it at the start, mutates in-memory objects, then writes the serialized result back at the end. On the very first run `$rsh_json` is `0` (MobileCoach's default for uninitialised variables), which the script detects and replaces with fresh state from `defaultStateTemplate()`.

### Command dispatch

MobileCoach has no way to call specific JS functions directly. Instead, inside MobileCoach, the variable `$rsh_cmd` needs to be set to a string like `"completeActivity()"` before the JS script is executed. The script then `eval`s it against the helper instance. While `eval` is generally dangerous, it is safe here because we are in full control of what gets set in `$rsh_cmd`. If, however, the eval throws an error, it is caught and written to `$rsh_status` (`"error"`) and `$rsh_error` (the message), so failures can be inspected inside MobileCoach. Commands that return nothing write `""` into `$rsh_result`, so it never holds a stale value from an earlier run.

### Menus are static by default

MobileCoach has no dynamic list/loop constructs for building menus. Menu entries are hard-coded in the flow. The workaround is to pre-declare a fixed number of `$rsh_menuLabel1`–`$rsh_menuLabel9` and `$rsh_menuId1`–`$rsh_menuId9` variables and populate them from JS. This can be done for each hierarchy level: modules → sessions → activities (i.e. `populateMenuWithModules()`).

The right context needs to be set up before invoking these commands — otherwise the script will error. For example, call `enter('mBouMgt')` before calling `populateMenuWithSessions()`; and to `populateMenuWithActivities()`, you also first need to `enter('sGesGre')`.

Each label is formatted as `"<level emoji> <title>[ <status emoji>]"` — the level emoji (🗂️/📑/🎯) always prefixes the title, and a status emoji (✅ completed, 👈 next up) is appended after it where applicable (e.g. `"🗂️ Emotionsregulation ✅"`); the matching id (e.g. `mEmoReg`) is written separately to `$rsh_menuIdN`. The menu definition in MobileCoach concatenates the two per slot — `$rsh_menuLabel1:$rsh_menuId1` — and MobileCoach splits on `:` when the button is tapped: the left side is displayed to the user, the right side (the id) is stored to the reserved variable `$participantNextMicroDialogIdentifier` ([field note](mobilecoach-field-notes.md#the-tapped-menu-id-lands-in-participantnextmicrodialogidentifier)). The split happens on the **raw definition text, before variable interpolation** — colons inside variable values are not treated as separators ([field note](mobilecoach-field-notes.md#menu-entries-split-on-the-raw-definition-text-not-on-variable-content)). Titles are nevertheless still rejected at state load if they contain a colon; that validation predates this insight, and whether to drop it is an [open question](open-questions.md#drop-the-title-colon-validation). MobileCoach then reads that variable and navigates directly to the dialog with that id. This direct id-to-dialog navigation is also why module, session, and activity ids must be unique across the entire state. See the [content editor guide](content-editor-guide.md#menus) for the `#EMOJIS` legend and the editor-facing setup steps.

The sessions and activities menus append **back entries** in the slots after their last item: the sessions menu links `Ein anderes 🗂️ Modul wählen` to the module-overview dialog (the reserved id `allModulesMenu` — the MobileCoach dialog showing the modules menu must carry exactly that id); the activities menu links `Eine andere 📑 Session wählen` to the sessions-menu dialog (the reserved id `allSessionsOfCurrentModuleMenu` — the MobileCoach dialog calling `populateMenuWithSessions()` must carry exactly that id) and, in the slot after that, the same `Ein anderes 🗂️ Modul wählen` → `allModulesMenu` entry as the sessions menu, so switching modules doesn't require hopping through the sessions menu first. A back tap involves no library command: MobileCoach navigates to the target dialog, and the participant's tracked location stays in the previous context until the next dialog enters itself (see "Navigation model" above). To guarantee the back entries always have free slots, state validation caps sessions per module at `MAX_MENU_SLOTS - 1` (8) and activities per session at `MAX_MENU_SLOTS - 2` (7); the module count stays capped at 9, since the top-level menu has no back entry.

Good to know:

- Unused slots are set to `""` so MobileCoach can hide them.
- The wrapper writes all nine label and all nine id variables on **every** run — a run whose command isn't one of the `populateMenuWith…()` methods resets them to `""`. Stale entries can't survive, but a menu must be (re)populated right before it is displayed.
- The number of slots (9) is a self-imposed choice, not a MobileCoach platform limit — it could be fewer or more, but 9 seems reasonable headroom.
- There are three separate methods rather than one auto-detecting `populateMenu()`.
    - This allows displaying a higher-level menu while the user is navigated deeper — for example, a "go back" screen.
    - Explicit method names also make the MobileCoach command variable self-documenting.

### No conditional logic in flows beyond variables

Showing/hiding UI elements, branching flows, and labelling menu entries all depend on `$variable` content. This is why boolean results and label strings are the primary output of this library — they feed directly into MobileCoach's variable-based conditional system.
