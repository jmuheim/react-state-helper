# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project purpose

A plain JavaScript library for managing hierarchical app state (modules → sessions → activities) as JSON, designed to be copy-pasted into MobileCoach (a mobile health platform). See README.md for deployment details.

## Commands

```bash
npm test              # run all tests once
npm run test:watch    # re-run on file changes
```

Run a single test by name:
```bash
npx vitest run -t "returns true when all activities are completed"
```

## Architecture

All logic lives in `src/ReactStateHelper.js`. There are four classes:

| Class | Role |
|---|---|
| `Activity` | Leaf node — tracks `completed`, `times_entered`, timestamps |
| `Session` | Contains activities; `isCompleted()` iff all activities completed |
| `Module` | Contains sessions; exposes `countCompletedSessions`, `getProgress` |
| `ReactStateHelper` | Public API; holds `#state` (private); navigated via `currentModuleId / currentSessionId / currentActivityId` |

### Navigation model

Before calling most methods the caller must `enterModule → enterSession → enterActivity` in order. These calls record timestamps and increment `times_entered`. Most query methods (`isSessionCompleted`, `countCompletedSessions`, etc.) implicitly use the `currentModuleId` stored in state.

### Serialization

`toString()` returns the full state as JSON. `loadExistingState(json)` hydrates it back through the class hierarchy (`Module.fromJSON → Session.fromJSON → Activity.fromJSON`). `initDefaultState()` builds a fresh default state.

### Test setup

`vitest.config.js` lists `src/ReactStateHelper.js` as a `setupFile`, which causes it to execute before every test file and register `ReactStateHelper` as `globalThis.ReactStateHelper`. This mirrors the MobileCoach environment where the class is a plain global — tests therefore import nothing and call `ReactStateHelper` directly.

## MobileCoach / Pathmate platform constraints

Understanding these constraints is essential — they drive most design decisions in this library.

### Execution model

MobileCoach runs JavaScript snippets in a restricted environment. There is no module system, no `import`/`export`, no Node.js globals (i.e. `process` is absent — we use it to detect the MobileCoach environment vs. Node.js tests). Code must be a single self-contained script. Classes and functions must be declared inline.

### Variables

MobileCoach uses `$variableName` variables that are declared upfront in the project with a fixed name and initial value. The script writes back to them by returning a plain object — MobileCoach maps each key to the corresponding `$variable`. Variables must be declared in advance; you cannot create new ones at runtime. This means any variable the script might ever write to must be pre-declared, including numbered series like `$jsStateHelperMenuLabel1`–`$jsStateHelperMenuLabel9`. **Critical:** if a variable is missing or has the wrong access setting, the script silently fails and halts execution mid-flow with no error output — this is extremely painful to debug. Always make sure every variable is declared with default value `0` and access "manageable by service" before testing.

### State persistence

There is no database or session store accessible from JS. State is round-tripped as a JSON string through `$jsStateHelperJson`: the script reads it at the start, mutates in-memory objects, then writes the serialized result back at the end. On the very first run `$jsStateHelperJson` is `0` (MobileCoach's default for uninitialised variables), which the script detects and replaces with fresh state from `initialState()`.

### Command dispatch

MobileCoach has no way to call specific JS functions directly. Instead, inside MobileCoach, the variable `$jsStateHelperCmd` needs to be set to a string like `"markActivityCompleted()"` before the JS script is executed. The script then `eval`s it against the helper instance. While `eval` is generally dangerous, it is safe here because we are in full control of what gets set in `$jsStateHelperCmd`. If, however, the eval throws an error, it is caught and written to `$jsStateHelperStatus` (`"error"`) and `$jsStateHelperError` (the message), so failures can be inspected inside MobileCoach.

### Menus are static by default

MobileCoach has no dynamic list/loop constructs for building menus. Menu entries are hard-coded in the flow. The workaround is to pre-declare a fixed number of `$jsStateHelperMenuLabel1`–`$jsStateHelperMenuLabel9` variables and populate them from JS (`populateModuleMenuLabels()` / `populateSessionMenuLabels()` / `populateActivityMenuLabels()`). Unused slots are set to `""` so MobileCoach can hide them. The maximum of 9 slots is a hard constraint — adding more requires re-declaring variables in the MobileCoach project.

The MobileCoach flow must ensure the user has previously navigated into the right context before invoking these commands — otherwise the script will error. `populateSessionMenuLabels()` requires a module to already be entered in state (via `enterModule('bouMgt')`); `populateActivityMenuLabels()` requires both a module and a session (via `enterModule('bouMgt')` / `enterSession('rolCha')`).

Each label is formatted as `"<emoji> <title>:<id>"` (e.g. `"✅ Emotionsregulation:emoReg"`). MobileCoach splits on `:` — the left side is displayed to the user, the right side (the id) is stored to a developer-chosen variable when the button is tapped. This allows routing: for each possible id, a hard-coded `if <that variable> == "emoReg" → jump to element X` rule handles navigation. Tedious to set up once, but fully dynamic thereafter.

### No conditional logic in flows beyond variables

Showing/hiding UI elements, branching flows, and labelling menu entries all depend on `$variable` content. This is why boolean results and label strings are the primary output of this library — they feed directly into MobileCoach's variable-based conditional system.
