# Open questions

Living document, unlike the append-only `docs/decisions.md`. Each item: what is unresolved, the current placeholder, and what resolves it. When one is settled, log the outcome in the decision log (via `/log-decision`) and delete the item here. Note the distinction from `docs/backlog.md`: an open question is something we **don't know enough about to decide**; work we have already decided we want to do is a backlog item.

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

## Should back entries carry a level prefix / status emoji?

Back-entry labels are currently fixed plain text (`Ein anderes 🗂️ Modul wählen`, `Eine andere 📑 Session wählen`) — unlike regular menu items, they get no level-emoji prefix and no ✅/👈 status emoji.

- **Placeholder:** keep the labels fixed and unadorned.
- **Why open:** it is unclear whether a visual marker (e.g. a back arrow, or the target level's emoji as prefix) would help participants distinguish back entries from content entries, or just add noise.
- **Resolved by:** deciding a label format for back entries (possibly after observing participants), logging it via `/log-decision`, and adjusting the label constants and tests if it changes.

## Rename the default branch `master` → `main`

The repo was initialized locally (git's own default is still `master`; GitHub's `main` default only applies to repos created on github.com). Purely cosmetic, but `main` is the current convention, and the rename gets more expensive as automation accretes around the name.

- **Placeholder:** stay on `master`.
- **Why open:** low priority; needs one deliberate pass rather than a piecemeal change.
- **Resolved by:** using GitHub's branch rename (retargets PRs, redirects URLs, updates the Pages source), then in the same pass: update `branches: [master]` in `.github/workflows/test.yml`, verify/rename the `protect-master` ruleset, rewrite `.claude/commands/push-to-master.md` (→ `/push-to-main`), update `blob/master/` links in `docs/developer-guide.md` and `docs/content-editor-guide.md` plus `master` mentions in CLAUDE.md (decision-log entries stay as historical record), rename local branches, and verify CI, Pages, and the ruleset still work. Logged via `/log-decision` either way (rename or deliberate keep).
