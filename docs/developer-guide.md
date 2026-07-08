# Developer guide

Architecture and platform internals of ReactStateHelper. If you define content inside [MobileCoach](https://mobile-coach.eu/) rather than working on the underlying high-level logic, the [content editor guide](content-editor-guide.md) is for you.

## Data model

State is a JSON tree managed by four classes in [`src/ReactStateHelper.js`](https://github.com/jmuheim/react-state-helper/blob/master/src/ReactStateHelper.js):

```
ReactStateHelper
└── modules: Module[]
    └── sessions: Session[]
        └── activities: Activity[]
```

| Class | Emoji | Fields (beyond `id`/`title`/`entered_first_at`/`entered_last_at`/`times_entered`) | Notes |
|---|---|---|---|
| `Module` | 🗂️ | `sessions_needed_for_adequate_progress`, `sessions[]` | Top-level grouping, e.g. "Boundary Management" |
| `Session` | 📑 | `activities_needed_for_adequate_progress`, `activities[]`, `isIntro` | `isIntro: true` marks a session that has no activities by design (e.g. an introduction) and counts as completed once entered; it must be the module's first session, and every other session must have at least one activity |
| `Activity` | 🎯 | `completed` | Bottom of the hierarchy — contains no children; flips to `true` via `markActivityCompleted()` |

- **Completion**: activities are the only things marked completed directly; sessions and modules derive their completion by aggregating their children. An `Activity` is completed once marked. A regular `Session` is completed if it has at least one activity and all of them are completed; an **intro session** (`isIntro: true`) has no activities and is instead completed the moment it has been entered once. A `Module` is completed if **all** of its sessions are completed — intro sessions included, which is why they must be entered rather than being skipped.
- **Adequate progress**: a softer bar than full completion — a `Module`/`Session` "has adequate progress" once `sessions_needed_for_adequate_progress`/`activities_needed_for_adequate_progress` of its children are completed, even if not all of them are. Used to decide e.g. whether to nudge the participant onward instead of insisting they finish everything.

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

Convention: prefix every id with its level — `m_` for modules, `s_` for sessions, `a_` for activities (e.g. `m_bouMgt`, `s_gesGre`, `a_rolGes`).

Id collisions are prevented at runtime, at the point each id is actually instantiated. A shared `idRegistry` (`Set`) is threaded through `Module.fromJSON → Session.fromJSON → Activity.fromJSON`; each registers its own id via the top-level `registerId()` helper and throws immediately on a collision, and each checks its own threshold/slot-limit right after building its children.

### State validation

`loadExistingState` (and therefore `initDefaultState`, which delegates to it) creates the registry and also checks the top-level module count. A violation throws on load; the MobileCoach wrapper at the bottom of the file catches this and surfaces it through `$jsStateHelperError` instead of crashing the whole script silently — see "Command dispatch" below. `test/ReactStateHelper.test.js` exercises each of these checks against minimal synthetic states; `initialState()` itself isn't re-asserted invariant-by-invariant, since `initDefaultState` already can't return a state that violates them — it's instead covered by a behavioral test confirming every activity can be completed without throwing.

Every module needs at least one session, and every session needs at least one activity — except an intro session (one with no activities of its own, just a stepping stone into its module's content, e.g. `s_bouIntro`), which must set `isIntro: true` to opt out of that check and must be its module's **first** session (both enforced in `Module.fromJSON`). Because an intro has no activities to complete, `Session.isCompleted()` treats it as completed the moment it has been entered once (`entered_first_at !== null`); this way an intro *does* count toward its module's completion — `Module.isCompleted()` requires every session to be completed, intros included — while adding no busywork. The finer-grained progress *fraction* still ignores intros: `Module.getProgress` and `ReactStateHelper.getProgress` filter to `sessions.filter(s => s.activities.length > 0)`, so an unentered intro doesn't drag the percentage down. `isIntro` also lets `Session.fromJSON` tell an intentionally-empty intro session apart from one that's missing activities by mistake. A module made up entirely of intro sessions would let a participant "complete" it without doing anything, so `Module.fromJSON` additionally requires at least one session with activities.

### Navigation model

Before calling most methods the caller must `enterModule → enterSession → enterActivity` in order. These calls record timestamps and increment `times_entered`. Most query methods (`isSessionCompleted`, `countCompletedSessionsInModule`, etc.) implicitly use the `currentModuleId` stored in state.

### Serialization

`toString()` returns the full state as JSON. `loadExistingState(json)` hydrates it back through the class hierarchy (`Module.fromJSON → Session.fromJSON → Activity.fromJSON`). `initDefaultState()` builds a fresh default state.

### Test setup

`vitest.config.js` lists `src/ReactStateHelper.js` as a `setupFile`, which causes it to execute before every test file and register `ReactStateHelper` as `globalThis.ReactStateHelper`. This mirrors the MobileCoach environment where the class is a plain global — tests therefore import nothing and call `ReactStateHelper` directly.

`test/MobileCoachPlatformConstraints.test.js` reads `src/ReactStateHelper.js` and `docs/content-editor-guide.md` as *text* and fails on platform-constraint violations (module syntax in the source; a wrapper variable missing from the content-editor guide's variable table). It shares its variable-extraction logic with the PostToolUse hook in `.claude/hooks/check-wrapper-variables.mjs`, which raises the same warning already at edit time.

`test/MobileCoachWrapper.test.js` executes the deployment wrapper the way MobileCoach does: it interpolates `$jsStateHelperJson`/`$jsStateHelperCmd` textually into the script, runs it in a `vm` context without Node's `process` global, and asserts on the completion-value object — covering command dispatch, error surfacing, state round-tripping, and that all nine menu label slots are written as top-level keys on every run.

## MobileCoach / Pathmate platform constraints

Understanding these constraints is essential — they drive most design decisions in this library.

### Execution model

MobileCoach runs JavaScript snippets in a restricted environment. There is no module system, no `import`/`export`, no Node.js globals (i.e. `process` is absent — we use it to detect the MobileCoach environment vs. Node.js tests). Code must be a single self-contained script. Classes and functions must be declared inline.

### Variables

MobileCoach uses `$variableName` variables that are declared upfront in the project with a fixed name and initial value. The script writes back to them by returning a plain object — MobileCoach writes each key back into the variable of the same name (one key, one variable; an object nested inside another value is not unpacked). This is why the deployment wrapper writes each of the nine menu labels and nine menu ids as its own key on every run: the `populateMenuFor…()` methods store labels and ids on the helper instance, and the wrapper reads them back per slot via `getMenuLabel(slot)` / `getMenuId(slot)` (empty string on runs that didn't populate a menu). Variables must be declared in advance; you cannot create new ones at runtime. This means any variable the script might ever write to must be pre-declared, including numbered series like `$jsStateHelperMenuLabel1`–`$jsStateHelperMenuLabel9` and `$jsStateHelperMenuId1`–`$jsStateHelperMenuId9`. **Critical:** if a variable is missing or has the wrong access setting, the script silently fails and halts execution mid-flow with no error output — this is extremely painful to debug. Always make sure every variable is declared with default value `0` and access "manageable by service" before testing — the full table lives in the [content editor guide](content-editor-guide.md#one-time-mobilecoach-setup).

### State persistence

There is no database or session store accessible from JS. State is round-tripped as a JSON string through `$jsStateHelperJson`: the script reads it at the start, mutates in-memory objects, then writes the serialized result back at the end. On the very first run `$jsStateHelperJson` is `0` (MobileCoach's default for uninitialised variables), which the script detects and replaces with fresh state from `initialState()`.

### Command dispatch

MobileCoach has no way to call specific JS functions directly. Instead, inside MobileCoach, the variable `$jsStateHelperCmd` needs to be set to a string like `"markActivityCompleted()"` before the JS script is executed. The script then `eval`s it against the helper instance. While `eval` is generally dangerous, it is safe here because we are in full control of what gets set in `$jsStateHelperCmd`. If, however, the eval throws an error, it is caught and written to `$jsStateHelperStatus` (`"error"`) and `$jsStateHelperError` (the message), so failures can be inspected inside MobileCoach. Commands that return nothing write `""` into `$jsStateHelperResult`, so it never holds a stale value from an earlier run.

### Menus are static by default

MobileCoach has no dynamic list/loop constructs for building menus. Menu entries are hard-coded in the flow. The workaround is to pre-declare a fixed number of `$jsStateHelperMenuLabel1`–`$jsStateHelperMenuLabel9` and `$jsStateHelperMenuId1`–`$jsStateHelperMenuId9` variables and populate them from JS. This can be done for each hierarchy level: modules → sessions → activities (i.e. `populateMenuForModule()`).

The right context needs to be set up before invoking these commands — otherwise the script will error. For example, call `enterModule('m_bouMgt')` before calling `populateMenuForSession()`; and to `populateMenuForActivity()`, you also first need to `enterSession('s_gesGre')`.

Each label is formatted as `"<emoji> <title>"` (e.g. `"✅ Emotionsregulation"`); the matching id (e.g. `m_emoReg`) is written separately to `$jsStateHelperMenuIdN`. The menu definition in MobileCoach concatenates the two per slot — `$jsStateHelperMenuLabel1:$jsStateHelperMenuId1` — and MobileCoach splits on `:` when the button is tapped: the left side is displayed to the user, the right side (the id) is stored to a variable with a specific, reserved name. (TODO: document the exact variable name) Because of this split, titles are rejected at state load if they contain a colon, so the concatenated entry always contains exactly one — we don't know yet how MobileCoach behaves when the entry contains multiple colons (e.g. whether it splits on the first or the last one), so guaranteeing exactly one sidesteps the question entirely. MobileCoach then reads that variable and navigates directly to the dialog with that id. This direct id-to-dialog navigation is also why module, session, and activity ids must be unique across the entire state. See the [content editor guide](content-editor-guide.md#menus) for the `#MENU_EMOJIS` legend and the editor-facing setup steps.

Good to know:

- Unused slots are set to `""` so MobileCoach can hide them.
- The wrapper writes all nine label and all nine id variables on **every** run — a run whose command isn't one of the `populateMenuFor…()` methods resets them to `""`. Stale entries can't survive, but a menu must be (re)populated right before it is displayed.
- The number of slots (9) is a self-imposed choice, not a MobileCoach platform limit — it could be fewer or more, but 9 seems reasonable headroom.
- There are three separate methods rather than one auto-detecting `populateMenu()`.
    - This allows displaying a higher-level menu while the user is navigated deeper — for example, a "go back" screen.
    - Explicit method names also make the MobileCoach command variable self-documenting.

### No conditional logic in flows beyond variables

Showing/hiding UI elements, branching flows, and labelling menu entries all depend on `$variable` content. This is why boolean results and label strings are the primary output of this library — they feed directly into MobileCoach's variable-based conditional system.
