# Open questions

Living document, unlike the append-only `docs/decisions.md`. Each item: what is unresolved, the current placeholder, and what resolves it. When one is settled, log the outcome in the decision log (via `/log-decision`) and delete the item here.

## Richer diagnostics in `$rsh_error`

Currently only the error message is written back (TODO in `src/ReactStateHelper.js`: *"Möglichst viel weitere nützliche Infos rein-dumpen!"*).

- **Placeholder:** message only, `'none'` when no error.
- **Why open:** unclear which extra information (the command that ran, a state snapshot, a stack) is actually inspectable and useful inside MobileCoach, and whether variable size limits constrain it.
- **Resolved by:** provoking a real failure in MobileCoach and deciding what would have shortened the debugging.

## Better names for the `populateMenuFor…()` commands

`populateMenuForModule()` fills the menu with *all modules*, yet "for module" (singular) reads as scoped to a single one; `populateMenuForSession()` / `ForActivity()` likewise name the level of the *listed items*, not the scope they draw from.

- **Placeholder:** keep the #20 names.
- **Why open:** flagged in the 2026-07-09 naming review but deliberately deferred to its own PR — these are the most editor-facing command names, so a new scheme (e.g. `populateModuleMenu()`) deserves its own round of thought.
- **Resolved by:** picking a scheme in the follow-up PR and logging the decision.
