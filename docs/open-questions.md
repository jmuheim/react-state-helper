# Open questions

Living document, unlike the append-only `docs/decisions.md`. Each item: what is unresolved, the current placeholder, and what resolves it. When one is settled, log the outcome in the decision log (via `/log-decision`) and delete the item here.

## Richer diagnostics in `$jsStateHelperError`

Currently only the error message is written back (TODO in `src/ReactStateHelper.js`: *"Möglichst viel weitere nützliche Infos rein-dumpen!"*).

- **Placeholder:** message only, `'none'` when no error.
- **Why open:** unclear which extra information (the command that ran, a state snapshot, a stack) is actually inspectable and useful inside MobileCoach, and whether variable size limits constrain it.
- **Resolved by:** provoking a real failure in MobileCoach and deciding what would have shortened the debugging.

## Colons inside titles vs. the `:`-split of menu labels

Menu labels are `"<emoji> <title>:<id>"` and MobileCoach splits on `:` to separate display text from the routing id — but titles themselves can contain colons: the production activity `a_abgKon` is titled *"Abgrenzen mit Klarheit: Das Konsequenzengitter"*, and the test fixtures deliberately include *"Aktivität 1a-2: Untertitel"*. Whether routing survives this depends on MobileCoach splitting at the **last** colon, which cannot be verified from JS.

- **Placeholder:** titles with colons are allowed and shipped.
- **Why open:** if MobileCoach splits at the first colon, tapping such an entry would store `"Das Konsequenzengitter:a_abgKon"` as the id and every routing rule would miss.
- **Resolved by:** tapping `a_abgKon`'s menu entry in MobileCoach and inspecting the stored routing variable; then either log the guarantee in the decision log or strip/reject colons in titles at load.

## Dedicated variable instead of repurposed `$participantGroup`

`getParticipantLocation()` writes the participant's location into `$participantGroup` because it is one of the few easily inspectable variables (decision #16 — README calls it a "mis-use").

- **Placeholder:** keep the repurposing.
- **Why open:** a dedicated `$jsStateHelperLocation` would be cleaner and free `$participantGroup` for real group assignment, but might lose the easy inspectability that motivated the choice.
- **Resolved by:** checking whether a purpose-declared variable is equally inspectable in the MobileCoach UI.
