# Maintainer guide

This guide is for **maintainers** — the people who change the app content (the state JSON), copy the script into MobileCoach, and create/update the dialog structures and variables there, without touching the library's code logic. Content editors, who only fill the created dialogs with their content, will get their own focused [content editor guide](content-editor-guide.md) (currently a stub). Developers changing the code logic itself find the internals documented in the source; the platform constraints that drive most design decisions live on their own page: [MobileCoach / Pathmate platform constraints](mobilecoach-platform-constraints.md).

## Data model

State is a JSON tree managed by four classes in [`src/ReactStateHelper.js`](https://github.com/jmuheim/react-state-helper/blob/master/src/ReactStateHelper.js):

```
👾 ReactStateHelper
└── 🗂️ modules: Module[]
    └── 📑 sessions: Session[]
        └── 🎯 activities: Activity[]
```

| Class | Fields (beyond `id` / `title` / `entered_first_at` / `entered_last_at` / `times_entered`) | Notes |
|---|---|---|
| `Module` | `sessions_needed_for_adequate_progress`, `sessions[]` | Top-level grouping, e.g. "Boundary Management" |
| `Session` | `activities_needed_for_adequate_progress`, `activities[]`, `is_intro` | `is_intro: true` marks a session that has no activities by design (e.g. an introduction) and counts as completed once entered; it must be the module's first session, and every other session must have at least one activity |
| `Activity` | `completed` | Bottom of the hierarchy — contains no children; flips to `true` via `completeActivity()` |

- **Completion**: activities are the only things marked completed directly; sessions and modules derive their completion by aggregating completion status of their children. An `Activity` is completed once marked. A **regular** `Session` (`is_intro: false`) is completed if it has at least one activity and all of them are completed; an **intro** session (`is_intro: true`) has no activities and is instead completed the moment it has been entered once. A `Module` is completed if **all** of its sessions are completed — intro sessions included, which is why they must be entered rather than being skipped.
- **Adequate progress**: a softer bar than full completion — a `Module` has adequate progress once `sessions_needed_for_adequate_progress` of its children are completed. For example: a module contains 4 sessions, but only 3 need to be completed for adequate progress. The same logic applies to `Session` with `activities_needed_for_adequate_progress`. Used to decide e.g. whether to nudge the participant onward instead of insisting they finish everything: whenever an activity is marked as complete, the user gets some advice on how to continue in the flow — the ready-to-display advice sentence in [`$rsh_progressAdvice`](#one-time-mobilecoach-setup) is built from this.

## Architecture

All logic lives in `src/ReactStateHelper.js`. There are four classes:

| Class | Emoji | Role |
|---|---|---|
| `Activity` | 🎯 | Bottom of the hierarchy — tracks `completed`, `times_entered`, timestamps |
| `Session` | 📑 | Contains activities; `isCompleted()` if all activities completed (or, for an intro session, once entered) |
| `Module` | 🗂️ | Contains sessions; exposes `countCompletedSessions` |
| `ReactStateHelper` | 👾 | Public API; holds `#state` (private); navigated via `current_module_id / current_session_id / current_activity_id`. The ubiquitous **rsh** abbreviation (e.g. the `$rsh_json` variable prefix) is its initials |

### ID conventions

Module, session, and activity ids must be unique across the *entire* state, not just within their parent — MobileCoach maps each one to a separate dialog, and menu routing (see [Menus](#menus) below) navigates directly to the dialog named after the tapped id — one flat namespace, so a duplicate would be ambiguous. The exact same id string must therefore be used consistently in the state definition **and** in MobileCoach (dialog names, variable prefixes).

![MobileCoach dialog settings with the id mBouMgt as identifier and variable prefix](images/boundary-management-mobilecoach.jpg)

Every id starts with its level letter — `m` for modules, `s` for sessions, `a` for activities — followed by an uppercase letter, and contains only letters and numbers (e.g. `mBouMgt`, `sAkzep`, `aRolGes`). The uppercase letter is what keeps the level marker recognizable without a separator; keep the rest short and mnemonic. Each id also works as the MobileCoach dialog's **variable prefix** (with an underscore appended, e.g. `$mBouMgt_`) — which is why nothing but letters and numbers is allowed: MobileCoach rejects prefixes containing anything else before the trailing underscore. No other format rules are enforced, except uniqueness.

### State validation

State — the id rules above included — is validated as it loads: a violation makes loading fail immediately, surfaced through [`$rsh_error`](#one-time-mobilecoach-setup) instead of crashing the whole script silently — see [Command dispatch](mobilecoach-platform-constraints.md#command-dispatch).

Checked at load, besides the id rules: the size minimums from the [data model](#data-model) above (every non-intro session needs at least one activity, every module at least one session *with* activities — a module made up entirely of intro sessions could be "completed" without the participant doing anything) and the structural caps — at most **9** modules, **8** sessions per module, **7** activities per session — which fall out of the menu slot layout (see [Back entries](#back-entries)).

### Navigation model

Navigation happens through a single `enter(id)` command: the id's level letter (`m`/`s`/`a`) determines whether a module, session, or activity is entered — one command therefore works after any menu tap, regardless of the menu's level; but always be sure to enter module → session → activity in order. These calls record timestamps and increment `times_entered` for each element. Much of the internal logic relies on the current location stored in state (`current_module_id` / `current_session_id` / `current_activity_id`) — which is why many commands require entering first.

## Tests

```bash
npm test              # run all tests once
npm run test:watch    # re-run on file changes
```

Run the tests after **every** change — even one that only touches the state JSON: besides the behavior, they check the [structural limits](#state-validation) and the [MobileCoach platform constraints](mobilecoach-platform-constraints.md) that would otherwise only fail inside MobileCoach, usually silently.

## Working with Claude Code

The repo is set up for [Claude Code](https://claude.com/claude-code) ([CLI](https://docs.claude.com/en/docs/claude-code/setup) or [VS Code extension](https://marketplace.visualstudio.com/items?itemName=anthropic.claude-code)); the configuration lives in `CLAUDE.md` (project context, loaded automatically at session start) and `.claude/`. It is suggested to do all work through Claude prompts, so the compiled conventions, insights, commands, hooks, and safeguards are taken into account — no other tools are necessary, not even for installing software dependencies.

Good to know: `master` is protected by the `protect-master` [GitHub ruleset](https://github.com/jmuheim/react-state-helper/settings/rules) — changes normally only land via a [pull request (PR)](https://github.com/jmuheim/react-state-helper/pulls) with a passing "test" status check ([continuous integration (CI)](https://github.com/jmuheim/react-state-helper/actions) runs `npm test` on every PR). For small changes (typo/doc fixes) where a PR is overhead, the `/push-to-master` command pushes master directly, temporarily bypassing the protection.

## One-time MobileCoach setup

1. Copy the full contents of [`src/ReactStateHelper.js`](https://github.com/jmuheim/react-state-helper/blob/master/src/ReactStateHelper.js) **as-is** into MobileCoach:

![MobileCoach decision point in the "👾 RSH" dialog: the script lives inside a rule set with setting "execute javascript"](images/mobilecoach-rsh-decision-point-window.jpg)

2. Create the following variables in your MobileCoach project — every single one, each with default value `0` and access **"manageable by service"**:

   | Variable | Purpose |
   |---|---|
   | `$rsh_cmd` | Command to execute, e.g. `completeActivity()` (see [Running a command](#running-a-command)) |
   | `$rsh_json` | Full serialized state, persisted between runs; initialised automatically on the very first run. Declaring it with a full state JSON as its default value instead of `0` would also work, but is untried — see [State persistence](mobilecoach-platform-constraints.md#state-persistence) for the details and caveats |
   | `$rsh_result` | Return value of the last command; `""` when the command returns nothing (`enter(…)`, `completeActivity()`, the `populateMenuWith…()` commands, …) |
   | `$rsh_status` | `success` or `error` |
   | `$rsh_error` | Error message if status is `error`, otherwise `none` |
   | `$rsh_progressAdvice` | Ready-to-display (Swiss German) advice sentence about how to continue, adapting to the deepest entered level (module-level advice while only a module is entered, session-level advice once a session is entered), refreshed on **every** run; `""` until a module has been entered |
   | `$rsh_moduleTimesEntered` | How many times the participant's current module has been entered, refreshed on **every** run; `""` while no module has been entered yet |
   | `$rsh_sessionTimesEntered` | Same for the current session; `""` while no session is current (entering a module clears the current session) |
   | `$rsh_activityTimesEntered` | Same for the current activity; `""` while no activity is current (entering a module or session clears the current activity) |
   | `$rsh_moduleCompleted` | Whether the participant's current module is completed, refreshed on **every** run (returning `true` or `false` as texts, not booleans); `""` while no module has been entered yet |
   | `$rsh_sessionCompleted` | Same for the current session; `""` while no session is current (entering a module clears the current session) |
   | `$rsh_activityCompleted` | Same for the current activity; `""` while no activity is current (entering a module or session clears the current activity) |
   | `$rsh_menuLabel1` – `$rsh_menuLabel9` | Dynamic menu entry labels (`"<level emoji> <title>[ <status emoji>]"`, e.g. `🗂️ Emotionsregulation ✅`, `📑 Gesunde Grenzen setzen 👈`, `🎯 Rollenwechsel bewusst gestalten`) populated by `populateMenuWithModules()` / `populateMenuWithSessions()` / `populateMenuWithActivities()`. Any other command resets all slots to `""` |
   | `$rsh_menuId1` – `$rsh_menuId9` | The id belonging to the label in the same slot (e.g. `mEmoReg`); concatenated with its label in the menu definition (see [Menus](#menus)). Same reset behavior as the labels |
   | `$participantGroup` | **Already exists by default in MobileCoach — do not create it** (we "mis-use" it, as it is one of the few easily inspectable variables from within MobileCoach). Carries the participant's location (the current module id, with the session and activity ids appended as the participant navigates deeper) and a one-line snapshot of the whole completion state (each module wraps its sessions in `[ ]`, each session its activities in `( )`; until a module is entered the variable holds the snapshot alone), e.g. `Participant location: 🗂️mBouMgt: 📑sGesGre \| Completion overview: 🗂️mBouMgt[📑sBouIntro✅ 📑sGesGre✅(🎯aRolGes✅ 🎯aAbgKon✅) 📑sPaus(🎯aMikPau)]` |

3. Also declare the two banner variables — the only ones whose default is **not** `0`: `$debugBanner` with default value `⚠️ DEBUGGER INFO ⚠️`, and `$errorBanner` with default value `🚨 ERROR INFO 🚨`. The script never touches them; flows prepend `$debugBanner` to every DEBUGGER-facing message and `$errorBanner` to every error message — participants see the latter too (see the [banner field note](mobilecoach-field-notes.md#coach-selection-and-debug-coaches)).

**⚠️ The silent-failure gotcha:** If any variable is missing or has the wrong access setting, the script fails silently and halts the flow mid-conversation — with **no error output** whatsoever. This is extremely painful to debug. Before testing anything, double-check that *every* variable in the table above is declared correctly.

## Common tasks

Recipes for the changes a maintainer makes most often. Whatever the task, the loop is the same: edit → `npm test` → land the change via a PR (see [Working with Claude Code](#working-with-claude-code)) → [deploy](#deploying-a-change).

### Changing the app content (the state JSON)

All content — the modules, sessions, and activities with their titles — lives as one JSON-shaped object in `defaultStateTemplate()` in [`src/ReactStateHelper.js`](https://github.com/jmuheim/react-state-helper/blob/master/src/ReactStateHelper.js). To add, remove, rename, or reorder something:

1. Edit the object in `defaultStateTemplate()` — easiest by copying an existing sibling and adjusting it.
2. Give new elements ids following the [ID conventions](#id-conventions), and stay within the [validation rules](#state-validation).
3. Run `npm test` — the suite checks these structural rules against the production data, so mistakes surface here instead of failing silently inside MobileCoach.
4. Mirror the change in MobileCoach: every added or renamed id needs a dialog of exactly that name, with the id plus `$` and `_` as its variable prefix (see [ID conventions](#id-conventions)). Then [deploy the script](#deploying-a-change).
5. Participants who have already run the app keep seeing the **old** content: their state persists in `$rsh_json` (see [State persistence](mobilecoach-platform-constraints.md#state-persistence)), and the built-in default is only loaded while `$rsh_json` is still `0`. While developing this is never a problem in practice: restarting the whole app creates a fresh participant, who starts from the new content — old test participants are simply neglected and eventually deleted (see the [field note](mobilecoach-field-notes.md#restarting-the-app-creates-a-fresh-participant)). Only to make an *existing* participant start over would you reset their `$rsh_json` to `0`.

### Changing behavior

Strictly speaking developer territory — this is the one task that goes beyond maintaining and touches the code logic. All logic lives in [`src/ReactStateHelper.js`](https://github.com/jmuheim/react-state-helper/blob/master/src/ReactStateHelper.js), the tests in `test/ReactStateHelper.test.js`. Add or adjust a test alongside every behavior change, and keep the script self-contained — no `import`/`export`, no Node.js APIs, no stray `$` signs even in comments — `test/MobileCoachPlatformConstraints.test.js` enforces this (see [the platform constraints](mobilecoach-platform-constraints.md) for why).

If the change writes to a **new `$rsh_…` variable**: add it to the [variable table](#one-time-mobilecoach-setup) and declare it in MobileCoach (default `0`, access "manageable by service") **before** deploying. An edit-time hook and `npm test` catch a missing table entry — the MobileCoach declaration they cannot check, and forgetting it triggers the [silent-failure gotcha](#one-time-mobilecoach-setup).

### Deploying a change

A merged change reaches the app only by repeating step 1 of the [one-time MobileCoach setup](#one-time-mobilecoach-setup): copy the **entire** [`src/ReactStateHelper.js`](https://github.com/jmuheim/react-state-helper/blob/master/src/ReactStateHelper.js) over the previous script text in the "👾 RSH" decision point — there are no partial updates. If the change added variables or content, declare the variables and create the dialogs first (see above).

## Running a command

MobileCoach cannot call JavaScript functions directly. Instead, each script run works like this:

1. Set `$rsh_cmd` to the command you want, e.g. `completeActivity()` — exactly as written in the cheat-sheet below; typos or syntax errors break the run.
2. Execute the script (cascade to "👾 RSH" dialog, see [One-time MobileCoach setup](#one-time-mobilecoach-setup)).
3. Read the results: the command's return value is in `$rsh_result` (`""` for commands that return nothing), `$rsh_status` is `success` or `error` (inspect `$rsh_error` for a detailed error message).

After each run the script writes **all** variables from the [table above](#one-time-mobilecoach-setup), regardless of whether they are related to the executed command (see the [command cheat-sheet](#command-cheat-sheet) below) — the only one you ever set yourself is `$rsh_cmd`.

## Command cheat-sheet

Day to day, flows drive the library with three kinds of **doer** commands: **entering** a module/session/activity (see [Navigation model](#navigation-model)), **marking an activity completed** (see the completion rules in the [data model](#data-model)), and **populating a menu** (see [Menus](#menus)). Calling a command without its preconditions results in `$rsh_status` = `error`.

| Command (value of `$rsh_cmd`) | Preconditions | Effect |
|---|---|---|
| `enter('mBouMgt')` | — | Sets the current module (and clears session/activity); records visit timestamps and count |
| `enter('sGesGre')` | module entered | Sets the current session (and clears activity); records visit timestamps and count |
| `enter('aRolGes')` | module + session entered | Sets the current activity; records visit timestamps and count |
| `completeActivity()` | module + session + activity entered | Marks the current activity as completed |
| `populateMenuWithModules()` | — | Fills `$rsh_menuLabel1–9` and `$rsh_menuId1–9` with one entry per module |
| `populateMenuWithSessions()` | module entered | Fills the labels and ids with the current module's sessions, plus a back entry (`Ein anderes 🗂️ Modul wählen` — see [Back entries](#back-entries)) |
| `populateMenuWithActivities()` | module + session entered | Fills the labels and ids with the current session's activities, plus two back entries (`Eine andere 📑 Session wählen`, then `Ein anderes 🗂️ Modul wählen` — see [Back entries](#back-entries)) |

For decisions in a flow (e.g. showing a different message once the current module is completed) and for displaying the participant's status (e.g. the progress advice), no command is needed: the completion flags, times-entered counters, and the advice text are auto-written to `$rsh_` variables on every run — see the [variable table](#one-time-mobilecoach-setup). The cheat-sheet above is the complete set of commands a flow should ever issue — everything else the script computes reaches flows through those auto-written variables.

## Menus

MobileCoach has no dynamic list/loop constructs for building menus — menu entries are hard-coded in the flow. The workaround is to pre-declare a fixed number of `$rsh_menuLabel1`–`$rsh_menuLabel9` and `$rsh_menuId1`–`$rsh_menuId9` variables and auto-populate them (nine slots is a self-imposed choice with reasonable headroom, not a MobileCoach platform limit):

1. Call one of the `populateMenuWith…()` commands (see the [cheat-sheet](#command-cheat-sheet) for their preconditions) **immediately before displaying the menu** — every other command resets all slots to `""`. It fills the label and id slot variables (see the [variable table](#one-time-mobilecoach-setup)); unused slots are set to `""` so MobileCoach can hide them.
2. In the menu definition, concatenate label and id per slot with a colon: `$rsh_menuLabel1:$rsh_menuId1` (for menu item 1). MobileCoach splits on `:` when the button is tapped — the **left** side is displayed to the participant, the **right** side (the id) is stored to the reserved variable `$participantNextMicroDialogIdentifier` ([field note](mobilecoach-field-notes.md#the-tapped-menu-id-lands-in-participantnextmicrodialogidentifier)).
3. MobileCoach reads that variable and navigates directly to the dialog with that id (which must exist under exactly that name — see [ID conventions](#id-conventions)).

There are deliberately three populate commands rather than one auto-detecting `populateMenu()`: a flow can display a higher-level menu while the participant is navigated deeper (e.g. a go-back screen), and the explicit names keep `$rsh_cmd` self-documenting.

At the time being, titles must not contain a colon — state loading rejects them ([field note](mobilecoach-field-notes.md#menu-entries-split-on-the-raw-definition-text-not-on-variable-content); whether to drop this validation is an [open question](open-questions.md#drop-the-title-colon-validation)).

Each label is formatted as `"<level emoji> <title>[ <status emoji>]"` — the level emoji always prefixes the title, and a status emoji is appended after it where applicable (e.g. `"🗂️ Emotionsregulation ✅"`); items that are neither completed nor next up get no status emoji:

| Emoji | Meaning | Appears |
|---|---|---|
| 🗂️ / 📑 / 🎯 | Level marker: module / session / activity | Prefixes every menu label's title and every quoted title in the progress advice (`$rsh_progressAdvice`); glued without a space to the ids in the `$participantGroup` location and snapshot |
| ✅ | Completed | Appended to completed items in menus, and directly after a completed item's id in the `$participantGroup` snapshot |
| 👈 | Next up — the first not-yet-completed item | Menus only |

### Back entries

The sessions and activities menus automatically append **back entries**:

- Sessions menu: `Ein anderes 🗂️ Modul wählen`, routing to the dialog id `allModulesMenu` — **name the dialog that shows the module-selection menu (the one calling `populateMenuWithModules()`) exactly `allModulesMenu`**, or the back entry leads nowhere: a tap on an id without a matching dialog pauses the flow silently ([field note](mobilecoach-field-notes.md#a-participantnextmicrodialogidentifier-without-a-matching-dialog-pauses-the-flow-silently)). Where that dialog lives in MobileCoach doesn't matter — only its id does.
- Activities menu: `Eine andere 📑 Session wählen`, routing to the dialog id `allSessionsOfCurrentModuleMenu` — **name the dialog calling `populateMenuWithSessions()` exactly like that** (same silent-failure trap) — followed by `Ein anderes 🗂️ Modul wählen` just like the sessions menu's entry, so a participant can switch modules without hopping through the sessions menu first.

Back-entry labels are fixed — they get neither a level prefix nor a status emoji. A back tap also involves no library command: `enter('allModulesMenu')` and `enter('allSessionsOfCurrentModuleMenu')` are **never** called — doing so by mistake puts a dedicated "… must never be entered" message into `$rsh_error`, and both reserved ids are equally rejected as *state* ids when state loads. While a menu reached via a back entry is displayed, the participant's tracked location simply stays in the previous context; it changes when the tapped entry's dialog runs its own `enter(…)`.

The modules menu has no back entry — it is already the top level.

To guarantee the back entries always have free slots, [state validation](#state-validation) caps sessions at 8 per module (one slot reserved) and activities at 7 per session (two slots reserved); modules stay capped at 9 — the full number of menu slots — since the top-level menu has no back entry.

## Troubleshooting

- **The flow just stops, no error anywhere** → almost always an undeclared or misconfigured variable. Re-check every row of the [variable table](#one-time-mobilecoach-setup): default `0`, access "manageable by service". After a menu tap, it can also be a tapped id without a dialog of exactly that name ([field note](mobilecoach-field-notes.md#a-participantnextmicrodialogidentifier-without-a-matching-dialog-pauses-the-flow-silently)).
- **Where is the participant right now, and what have they completed?** → `$participantGroup` shows the current location (module, session, activity) followed by the completion snapshot, and is easy to inspect from within MobileCoach.
- **See what happens under the hood** → run the app with a coach whose name starts with `DEBUGGER` (the general debug coach, or a personal one like `DEBUGGER_J`) to get verbose debug messages during the flow (see the [field note on debug coaches](mobilecoach-field-notes.md#coach-selection-and-debug-coaches)).
- **Something misbehaves but the flow continues** → whenever executing a `$rsh_cmd` throws an error, the flow displays `$rsh_error` automatically. Load errors name the offending id; command errors usually mean a typo in `$rsh_cmd` or a missing `enter(…)` precondition (module before session, session before activity).
