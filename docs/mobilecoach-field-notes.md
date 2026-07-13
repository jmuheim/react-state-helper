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

## Variables are never cleaned up: stale values survive forever

MobileCoach has no lifecycle for participant variables: once something is written, it stays until something else overwrites it — the platform never resets or expires a value, even when it is clearly spent. Example: `$participantNextMicroDialogIdentifier` receives the tapped menu id (see above), but after MobileCoach has navigated to that dialog, the variable keeps its value indefinitely; it is not consumed by the jump. This appears to be the platform's general attitude, not a bug in one variable.

Consequences:

- A variable's content answers "what was written *last*", never "is this current" — branching on a variable like `$participantNextMicroDialogIdentifier` outside its immediate context may act on a value left over from a much earlier interaction.
- Any freshness guarantee has to come from our side: the library's always-write-every-run model (decision #19, reaffirmed in #37) is the countermeasure, not platform redundancy. This tension is central to the [null-init / direct-write open question](open-questions.md#invert-the-output-flow-pre-initialise-all-variables-to-null-commands-write-results-directly): the platform won't clean up after us, so whatever the script stops overwriting simply stays stale.

## Moving between dialogs: cascading vs. jumping

Dialogs are containers of flow elements (messages, decision points, …), handled by rules one after another in sequence. There are two ways to move to another dialog, with opposite return behavior:

- **Cascading:** after the jumped-to dialog finishes, control returns to where it came from.
- **Jumping:** one-way — control does *not* return.

Unverified: what a **jump from within a cascade** does to the pending return chain — does the jump abandon the whole cascade (the stacked "go back" targets are dropped), or does the cascade's return still fire when the jumped-to dialog finishes? Needs a live test with a cascade at least two levels deep, jumping out of the innermost dialog.

(Stub — a fuller write-up of dialog internals, rule sequencing, variable writes, and if/else trees is planned; see the [flow-export open question](open-questions.md#check-the-mobilecoach-flow-export-html-into-the-repo).)

## Dialog ids and variable prefixes: both set from the same id

Each dialog has a user-definable **id** and a user-definable **variable prefix**. The id identifies the dialog and can be used to jump to it (menu routing navigates to the dialog whose id was tapped); the prefix namespaces the dialog's variables. We set both from the same library id: the id verbatim (`mBouMgt`), the prefix with an underscore appended (`$mBouMgt_`).

The "Edit variable prefix" dialog rejects anything that doesn't match the rule "Variable prefixes always start with an `$` and only contain letters and numbers and must end with an underscore" — so exactly one underscore, at the end, and none inside. `m_bouMgt_` is rejected (internal underscore); `mBouMgt_` is accepted. Note this is stricter than variable *names*, which may contain underscores anywhere (e.g. `$rsh_json`); the restriction applies only to the prefix field.
