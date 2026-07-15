# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project purpose

A plain JavaScript library for managing hierarchical app state (modules → sessions → activities) as JSON, designed to be copy-pasted into MobileCoach (a mobile health platform).

## Documentation

Detailed documentation lives in `docs/`, published via GitHub Pages at https://jmuheim.github.io/react-state-helper/ — **the docs site is the source of truth**; this file and the README only keep essentials plus links. When a change makes a docs page stale, update the page.

- `docs/maintainer-guide.md` — for **maintainers**: people who change the state JSON, copy the script into MobileCoach, and maintain the dialog structures there, without touching code logic. Architecture, data model, state validation, MobileCoach setup (doer commands, menu/routing setup), common tasks; contains the canonical **wrapper variable table** (checked by the edit-time hook and `npm test`).
- `docs/mobilecoach-platform-constraints.md` — the full MobileCoach platform constraints that drive most design decisions.
- `docs/content-editor-guide.md` — currently a stub pointing to the maintainer guide; a new, focused content editor guide is planned.
- `docs/mobilecoach-field-notes.md` — hands-on MobileCoach platform knowledge (coach selection, debug coaches, rule regex behavior); **append new platform insights here** as they are learned, don't keep them only in conversation.

The dividing line between the last two: a *constraint* is platform behavior the library's code or design must obey (curated page, keep it short); a *field note* is a hands-on observation about working in the MobileCoach editor (append-only journal). New insights land in the field notes; if one constrains the library's design, add the constraint to the constraints page and keep the hands-on details in the notes. Don't duplicate a rule on both pages — link instead.

## Commands

```bash
npm test              # run all tests once
npm run test:watch    # re-run on file changes
```

Run a single test by name:
```bash
npx vitest run -t "returns true when all activities are completed"
```

Small changes (typo/doc fixes) can skip the PR flow via the `/push-to-master` command: it runs the tests locally, temporarily adds an admin bypass to the `protect-master` ruleset, pushes, and restores protection.

Commits are made via the `/commit` command (also when the user just says "commit" in plain words): it runs the tests and, on a PR branch, brings the PR title and description up to date in the same pass — backed up by a PostToolUse hook that fires after any `git commit`/`git push` on a non-master branch.

## Decision log, open questions & backlog

Design decisions and their rationale (including rejected alternatives) live in `docs/decisions.md` — append-only and numbered. Check it before re-opening a settled question; add entries via the `/log-decision` command, which also propagates the decision to affected docs. Unresolved items live in `docs/open-questions.md`; when one is settled, graduate it into the decision log and delete it there. Intended-but-not-started work lives in `docs/backlog.md` (roughly in sequence; items graduate into the decision log when they ship). The dividing line: an open question is something we *don't know enough about to decide*; a backlog item is work we *have decided we want to do* — file future-work ideas there, not in open questions.

## Pre-merge checklist

- New/changed behavior has tests; `npm test` is green.
- Any new wrapper variable is added to the variable table in `docs/maintainer-guide.md` **and** declared in MobileCoach (default `0`, access "manageable by service") before deploy.
- `src/ReactStateHelper.js` is still one self-contained script — enforced by `test/MobileCoachPlatformConstraints.test.js`.
- README / CLAUDE.md / docs pages / `docs/decisions.md` are updated wherever the change makes them stale.

## Architecture

All logic lives in `src/ReactStateHelper.js`. There are four classes:

| Class | Role |
|---|---|
| `Activity` | Bottom of the hierarchy (contains no children) — tracks `completed`, `times_entered`, timestamps |
| `Session` | Contains activities; `isCompleted()` iff all activities completed |
| `Module` | Contains sessions; exposes `countCompletedSessions` |
| `ReactStateHelper` | Public API; holds `#state` (private); navigated via `current_module_id / current_session_id / current_activity_id` |

Details (id conventions, state validation, navigation model) are in `docs/maintainer-guide.md` — which describes only outward-facing behavior (commands, `$rsh_` variables, errors, limits), not code internals; internals are documented in the source itself.

Test setup: `vitest.config.js` lists `src/ReactStateHelper.js` as a `setupFile`, which registers `ReactStateHelper` as `globalThis.ReactStateHelper` — tests import nothing, mirroring MobileCoach's plain-script environment.

## MobileCoach constraints (essentials)

Full page in `docs/mobilecoach-platform-constraints.md` — these constraints drive most design decisions:

- The deployed artifact is one self-contained script: no `import`/`export`, no Node.js globals (`process` is used to detect Node vs. MobileCoach).
- Every `$variable` the script might write must be pre-declared in MobileCoach (default `0`, access "manageable by service") — a missing one makes the script **fail silently mid-flow**.
- On saving the script editor ("Ok"), MobileCoach scans the raw script text (comments included) for `$` signs and rejects it unless each one starts a declared variable name — so no `${…}` template interpolation (use `+` concatenation) and no decorative `$` in comments (enforced by `test/MobileCoachPlatformConstraints.test.js` and the edit-time hook).
- State persists only as a JSON string round-tripped through `$rsh_json`; `0` means first run → fresh default state.
- Commands dispatch by `eval`-ing `$rsh_cmd`; errors are surfaced via `$rsh_status`/`$rsh_error`.
- Menus are static: 9 slots (a self-imposed choice, not a MobileCoach platform limit). Labels (`$rsh_menuLabel1`–`9`, format `"<level emoji> <title>[ <status emoji>]"`) and ids (`$rsh_menuId1`–`9`) are separate variables, concatenated per slot in MobileCoach as `$rsh_menuLabelN:$rsh_menuIdN`; on tap MobileCoach splits on `:`, stores the id in a reserved variable, and navigates directly to the dialog with that id. The sessions and activities menus append back entries after their items (sessions menu → the `allModulesMenu` overview dialog; activities menu → the `allSessionsOfCurrentModuleMenu` sessions-menu dialog, then `allModulesMenu`), so sessions are capped at 8 per module and activities at 7 per session.
- Ids are globally unique across the whole state (each id names a MobileCoach dialog and, with `_` appended, its variable prefix), contain only letters and numbers, and start with their level letter plus an uppercase letter (`mBouMgt`/`sGesGre`/`aRolGes`).
- Flow branching only reads `$variable` content — booleans and label strings are the library's primary outputs.
