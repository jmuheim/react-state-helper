# Open questions

Living document, unlike the append-only `docs/decisions.md`. Each item: what is unresolved, the current placeholder, and what resolves it. When one is settled, log the outcome in the decision log (via `/log-decision`) and delete the item here.

## Richer diagnostics in `$jsStateHelperError`

Currently only the error message is written back (TODO in `src/ReactStateHelper.js`: *"Möglichst viel weitere nützliche Infos rein-dumpen!"*).

- **Placeholder:** message only, `'none'` when no error.
- **Why open:** unclear which extra information (the command that ran, a state snapshot, a stack) is actually inspectable and useful inside MobileCoach, and whether variable size limits constrain it.
- **Resolved by:** provoking a real failure in MobileCoach and deciding what would have shortened the debugging.

## Dedicated variable instead of repurposed `$participantGroup`

`getParticipantLocation()` writes the participant's location into `$participantGroup` because it is one of the few easily inspectable variables (decision #16 — README calls it a "mis-use").

- **Placeholder:** keep the repurposing.
- **Why open:** a dedicated `$jsStateHelperLocation` would be cleaner and free `$participantGroup` for real group assignment, but might lose the easy inspectability that motivated the choice.
- **Resolved by:** checking whether a purpose-declared variable is equally inspectable in the MobileCoach UI.
