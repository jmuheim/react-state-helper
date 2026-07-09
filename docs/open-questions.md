# Open questions

Living document, unlike the append-only `docs/decisions.md`. Each item: what is unresolved, the current placeholder, and what resolves it. When one is settled, log the outcome in the decision log (via `/log-decision`) and delete the item here.

## Richer diagnostics in `$rsh_error`

Currently only the error message is written back (TODO in `src/ReactStateHelper.js`: *"Möglichst viel weitere nützliche Infos rein-dumpen!"*).

- **Placeholder:** message only, `'none'` when no error.
- **Why open:** unclear which extra information (the command that ran, a state snapshot, a stack) is actually inspectable and useful inside MobileCoach, and whether variable size limits constrain it.
- **Resolved by:** provoking a real failure in MobileCoach and deciding what would have shortened the debugging.

## Drop the title-colon validation?

MobileCoach splits menu entries on the raw definition text before variable interpolation ([field note](mobilecoach-field-notes.md#menu-entries-split-on-the-raw-definition-text-not-on-variable-content), 2026-07-09), so a colon inside a title can no longer corrupt the `:`-split — the rationale decision #20 gave for keeping `validateTitle()` no longer holds; a colon in a label would simply be displayed.

- **Placeholder:** keep the validation — colons in titles are still rejected at state load.
- **Why open:** dropping it is a behavior change that deserves its own decision (and maybe titles with colons are undesirable for readability anyway); also, the observation used a lone variable without an id part, so a confirming live test with the full `label:id` construct wouldn't hurt.
- **Resolved by:** deciding keep-vs-drop, logging it via `/log-decision`, and (if dropped) removing `validateTitle()` and its tests.
