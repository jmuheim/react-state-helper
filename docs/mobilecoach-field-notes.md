# MobileCoach field notes

Practical platform knowledge gathered while setting the library up in MobileCoach. Unlike the [platform constraints in the developer guide](developer-guide.md#mobilecoach--pathmate-platform-constraints) — which drive the library's design — these notes are hands-on observations about working in the MobileCoach editor itself. Append new insights as they come up.

## Coach selection and debug coaches

When starting a session, the participant chooses a **coach**. The chosen coach's name is available to rules via the `$coachName` variable.

We use specially named coaches to show debugging info in the flow:

- `DEBUGGER` — general debug coach
- `DEBUGGER_<initial>` — one per developer, e.g. `DEBUGGER_P` (Pascal), `DEBUGGER_J` (Josua)

Flows branch on `$coachName` to decide whether to display debugging output, using a rule with operator "text value matches regular expression" and comparison term `DEBUGGER.*` (the trailing `.*` is required — a bare prefix like `DEBUGGER_` does not match):

![Rule editing dialog with regular expression match for DEBUGGER.*](images/micro-dialog-message-rule-debugger.jpg)

## Saving scripts: every `$` must start a declared variable name

The script editor is a plain text field; when confirming it with "Ok", MobileCoach validates the text and rejects it with "The text contains unknown variables." if it contains a `$` that isn't immediately followed by the name of a declared variable. The scan covers the **raw text** — comments included — and isn't a JS parse: even the fragment "$-prefixed" inside a comment was rejected (`$` followed by a hyphen). The editor doesn't say which token it dislikes, so with several candidates it's a process of elimination.

For our script this means no `` ${…} `` template interpolation and no `$`-decorated pseudo-names in comments — the full rule and its enforcing test live in the [developer guide](developer-guide.md#script-editor-validation-on-save--only-before-declared-variable-names) (decision #27).

## Menu entries split on the raw definition text, not on variable content

When a menu entry is defined as `$rsh_menuLabel1:$rsh_menuId1`, MobileCoach performs the `:`-split on the **raw definition text, before variables are interpolated** — colons that arrive inside variable values are never treated as separators.

Observed: a menu entry consisting of a single variable whose value was `Hello:test` displayed the full string `Hello:test` and produced no return value. Any post-interpolation split — first-colon or last-colon — would instead have displayed `Hello` and returned `test`, so this rules out post-interpolation splitting entirely.

Consequences:

- The former uncertainty "how does MobileCoach split an entry with multiple colons?" (sidestepped by decision #20's exactly-one-colon guarantee) is moot: only the literal `:` written in the menu definition is a split point.
- A colon inside a label would be displayed literally rather than corrupt the routing — which removes the original rationale for the library's title-colon validation; whether to drop it is now an [open question](open-questions.md#drop-the-title-colon-validation). (Caveat: the observation used a lone variable without an id part; a quick live check with the full `$rsh_menuLabel1:$rsh_menuId1` construct and a colon inside the label would make it airtight.)

## The tapped menu id lands in `$participantNextMicroDialogIdentifier`

The reserved variable that receives the right-hand side of a tapped menu entry (the part after the `:`, i.e. the dialog id) is called `$participantNextMicroDialogIdentifier`. MobileCoach then navigates to the micro dialog whose id matches its content — this is the variable behind the menu routing described above, and it can also be read in follow-up rules to branch on which entry was tapped.

## Dialog ids and variable prefixes: both set from the same id

Each dialog has a user-definable **id** and a user-definable **variable prefix**. The id identifies the dialog and can be used to jump to it (menu routing navigates to the dialog whose id was tapped); the prefix namespaces the dialog's variables. We set both from the same library id: the id verbatim (`mBouMgt`), the prefix with an underscore appended (`$mBouMgt_`).

The "Edit variable prefix" dialog rejects anything that doesn't match the rule "Variable prefixes always start with an `$` and only contain letters and numbers and must end with an underscore" — so exactly one underscore, at the end, and none inside. `m_bouMgt_` is rejected (internal underscore); `mBouMgt_` is accepted. Note this is stricter than variable *names*, which may contain underscores anywhere (e.g. `$rsh_json`); the restriction applies only to the prefix field.

## A `$participantNextMicroDialogIdentifier` without a matching dialog pauses the flow silently

Observed (2026-07-10): when the tapped menu id (the content of `$participantNextMicroDialogIdentifier`) names no existing dialog, nothing happens — no error, no navigation; the flow just pauses.

Consequences:

- Every id a menu can emit must have a dialog of exactly the same name — including the `allModulesMenu` back-entry target introduced by decision #38 (as `modulesMenu`; renamed in decision #43) and the `allSessionsOfCurrentModuleMenu` target introduced by decision #46. A typo'd dialog id is one more member of the silent-failure family (alongside undeclared variables): if a flow freezes right after a menu tap, compare the tapped id against the dialog ids first.
- The considered alternative of intercepting the back tap in-dialog (no dedicated dialog) would technically be possible — the flow survives the unmatched id — but was rejected in decision #38 for another reason: the modules-menu block would be duplicated into every module dialog.

## Dialog skeleton: non-module dialogs around the real modules

At the top level of the dialog structure, the *real* modules (those in the JSON data model, navigable via menus) are framed by two dialogs that look like modules in the editor but are not part of the state:

- **Einführung** — entered once at app start, never navigable again afterwards; hosts the pre-questionnaire and, currently, the `allModulesMenu` dialog as a sub-dialog (the module-selection menu the sessions menus' back entries route to — menu routing only cares about the dialog id, not where the dialog is nested). *(TODO: `allModulesMenu` probably won't stay there — the plan is to move it into the "Magic Menu" dialog, since it is called again and again from within modules; it only sits in the Einführung because that's where it is displayed first.)*
- **Abschluss** — the counterpart at the end: participants re-take the same questionnaire (post). Like the Einführung, it is not in the JSON model and cannot be reached through the library's menus.

Besides these, MobileCoach also contains an `allActivitiesOfCurrentSessionMenu` dialog — the activities-menu counterpart to `allModulesMenu` and `allSessionsOfCurrentModuleMenu`. No menu entry currently emits its id, so it is unreachable and effectively unused; it is noted here (and in a comment next to the dialog-id constants in the source) so its presence in the editor isn't mistaken for wiring.
