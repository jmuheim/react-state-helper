# MobileCoach / Pathmate platform constraints

Understanding these constraints is essential — they drive most design decisions in this library. How to work *within* them (setup, commands, menus) is described in the [developer guide](developer-guide.md); hands-on editor observations live in the [field notes](mobilecoach-field-notes.md).

## Execution model

MobileCoach runs JavaScript snippets in a restricted environment. There is no module system, no `import`/`export`, no Node.js globals (i.e. `process` is absent — we use it to detect the MobileCoach environment vs. Node.js tests). Code must be a single self-contained script. Classes and functions must be declared inline.

## Variables

MobileCoach uses `$variableName` variables that are declared upfront in the project with a fixed name and initial value. The script writes back to them by returning a plain object — MobileCoach writes each key back into the variable of the same name (one key, one variable; an object nested inside another value is not unpacked). This is why the deployment wrapper writes each of the nine menu labels and nine menu ids as its own separate key on every run (empty string on runs that didn't populate a menu). Variables must be declared in advance; you cannot create new ones at runtime. This means any variable the script might ever write to must be pre-declared, including numbered series like `$rsh_menuLabel1`–`$rsh_menuLabel9` and `$rsh_menuId1`–`$rsh_menuId9`. **Critical:** if a variable is missing or has the wrong access setting, the script silently fails and halts execution mid-flow with no error output — this is extremely painful to debug. Always make sure every variable is declared with default value `0` and access "manageable by service" before testing — the full table lives under [One-time MobileCoach setup](developer-guide.md#one-time-mobilecoach-setup) in the developer guide.

## Script-editor validation on save: `$` only before declared variable names

MobileCoach's script editor is a plain text field; when confirming it with "Ok", MobileCoach scans the **raw text** — code, strings, and comments alike — for `$` signs and rejects the save ("The text contains unknown variables") unless every `$` is immediately followed by the name of a declared variable. Verified 2026-07-09: even the fragment `$-prefixed` inside a comment was rejected. Consequences for this codebase:

- **No `${…}` template interpolation anywhere** in `src/ReactStateHelper.js` — strings are built with plain `+` concatenation instead (e.g. `o['rsh_menuLabel' + i]`).
- **No `$` in comments except before real variable names**: writing about a declared variable is fine (`$rsh_json`), but pseudo-names (`$rsh_menuLabelN`) or phrases like "$-prefixed" fail the validation — refer to a series via a concrete member instead (`$rsh_menuLabel1`).

Both rules are enforced by `test/MobileCoachPlatformConstraints.test.js` ("every `$` in the source starts a variable name documented in the developer guide") and flagged already at edit time by the PostToolUse hook `.claude/hooks/check-wrapper-variables.mjs`, which shares the same check (`findInvalidDollarSigns`).

## State persistence

There is no database or session store accessible from JS. State is round-tripped as a JSON string through `$rsh_json`: the script reads it at the start, mutates in-memory objects, then writes the serialized result back at the end. On the very first run `$rsh_json` is `0` (MobileCoach's default for uninitialised variables), which the script detects and replaces with fresh default state.

## Command dispatch

MobileCoach has no way to call specific JS functions directly. Instead, inside MobileCoach, the variable `$rsh_cmd` needs to be set to a string like `"completeActivity()"` before the JS script is executed. The script then `eval`s it against the helper instance. While `eval` is generally dangerous, it is safe here because we are in full control of what gets set in `$rsh_cmd`. If, however, the eval throws an error, it is caught and written to `$rsh_status` (`"error"`) and `$rsh_error` (the message), so failures can be inspected inside MobileCoach. Commands that return nothing write `""` into `$rsh_result`, so it never holds a stale value from an earlier run. The step-by-step mechanics are described under [Running a command](developer-guide.md#running-a-command) in the developer guide.

## Menus are static by default

MobileCoach has no dynamic list/loop constructs for building menus — menu entries are hard-coded in the flow. The workaround (pre-declared label/id slot variables populated from JS), the label format, the `:`-split routing via `$participantNextMicroDialogIdentifier`, the back entries, and the resulting slot caps are all described under [Menus](developer-guide.md#menus) in the developer guide.

## No conditional logic in flows beyond variables

Showing/hiding UI elements, branching flows, and labelling menu entries all depend on `$variable` content. This is why boolean results and label strings are the primary output of this library — they feed directly into MobileCoach's variable-based conditional system.
