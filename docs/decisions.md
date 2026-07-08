# Decision log

Append-only, numbered. Never rewrite a past entry — when a decision changes, add a blockquote note under the old entry (`> Superseded by #N: …` / `> Refined by #N: …`) and write a new numbered entry. Add entries via the `/log-decision` command, which also propagates the decision to the docs it touches.

Entries 1–16 were **reconstructed** on 2026-07-08 from the code, CLAUDE.md, and git history (commit hashes cited where they exist). Treat their wording as inferred: if one misstates the actual reasoning, correct it with a superseding note rather than a silent edit.

## 1. The library ships as a single self-contained plain script

**Decision:** All code — the four classes, helpers, and the MobileCoach wrapper — lives inline in `src/ReactStateHelper.js`. Deployment is copying that one file verbatim into MobileCoach.

**Why:** MobileCoach executes JavaScript snippets with no module system, no `import`/`export`, and no Node.js globals. A multi-file source with a bundling step was not worth it for a ~600-line library and would let the deployed artifact drift from the repo.

**Watch for:** dependency creep. Enforced since #17 by the self-containedness checks in `test/MobileCoachPlatformConstraints.test.js`.

## 2. State persists as one JSON string round-tripped through `$jsStateHelperJson`

**Decision:** The script reads `$jsStateHelperJson` at the start, mutates in-memory objects, and writes the serialized result back at the end. `0` — MobileCoach's default for uninitialised variables — is the first-run sentinel that triggers `initDefaultState()`.

**Why:** No database or session store is accessible from MobileCoach JS; pre-declared `$variables` are the only persistence there is.

**Watch for:** state size — every entered node accumulates timestamps, and it is unclear whether MobileCoach caps variable length.

## 3. Commands dispatch through `eval`, with errors surfaced via status variables

**Decision:** MobileCoach sets `$jsStateHelperCmd` to a string like `"markActivityCompleted()"`; the wrapper `eval`s it against the helper instance. Any error is caught and written to `$jsStateHelperStatus` (`"error"`) and `$jsStateHelperError`.

**Why:** MobileCoach has no way to call specific JS functions. `eval` is safe here because the project fully controls what gets set in `$jsStateHelperCmd`, and it supports argument-taking commands (`isGoodEnough('m_bouMgt')`) without a hand-rolled parser. The catch-and-report exists because an uncaught error halts the script silently with no output at all — the platform's worst debugging trap.

**Watch for:** typos in `$jsStateHelperCmd` surface only at runtime; when a flow misbehaves, inspect `$jsStateHelperError` first.

## 4. Ids are unique across the entire state, not just within their parent

**Decision:** Module, session, and activity ids share one flat namespace.

**Why:** MobileCoach maps each id to a separate dialog, and menu routing stores the tapped label's `:<id>` suffix into a single variable matched by hard-coded `if` rules — both key off a flat namespace. Per-parent uniqueness was rejected: the same id under two parents would be indistinguishable to routing.

## 5. Every id carries its level prefix: `m_` / `s_` / `a_`

**Decision:** Ids are short and mnemonic, prefixed by hierarchy level (e.g. `m_bouMgt`, `s_gesGre`, `a_rolGes`). Introduced as a convention (`3261066`), then enforced at registration time instead of trusting callers (`fa9c0c4`).

**Why:** makes cross-level collisions impossible by construction and makes ids self-describing inside MobileCoach flows.

## 6. Id collisions are caught at instantiation, via a registry threaded through `fromJSON`

**Decision:** A shared `Set` is passed through `Module.fromJSON → Session.fromJSON → Activity.fromJSON`; `registerId()` throws the moment a duplicate (or wrongly prefixed) id is registered — like a DB unique constraint rejecting an INSERT.

**Why:** failing at the registration point pinpoints the offending node, and unlike a separate post-load validation pass it cannot be forgotten when the tree grows.

## 7. Structural invariants are validated when state loads, not when it is used

**Decision:** `loadExistingState` (and `initDefaultState`, which delegates to it) creates the registry and checks the module count; each `fromJSON` checks its own thresholds and slot limits right after building its children. Violations throw immediately (`9303d33`).

**Why:** content mistakes should fail fast at load — surfaced through `$jsStateHelperError` (see #3) — rather than producing wrong progress numbers later.

## 8. Intro sessions opt out via `isIntro`, and every module needs at least one non-intro session

**Decision:** A session with no activities must set `isIntro: true`. Completion and progress math filter to sessions that have activities. `Module.fromJSON` additionally requires at least one session with activities (`030b62b`).

**Why:** `isIntro` exists solely so `Session.fromJSON` can tell an intentionally-empty stepping-stone session apart from one that is missing activities by mistake. Without the module-level rule, a module made up entirely of intro sessions would be vacuously "complete" before the participant has done anything.

## 9. At most 9 items per menu level (`MAX_MENU_SLOTS`)

**Decision:** Modules, sessions per module, and activities per session are capped at 9, checked at load.

**Why:** only `$jsStateHelperMenuLabel1`–`$jsStateHelperMenuLabel9` exist, and MobileCoach variables cannot be created at runtime — a hard platform constraint. Capping at load keeps content from silently outgrowing the menu.

## 10. Three explicit `populateMenuLabelsFor*` methods instead of one auto-detecting method

**Decision:** `populateMenuLabelsForModule()` / `ForSession()` / `ForActivity()` rather than a single `populateMenuLabels()` that infers the level from navigation state.

**Why:** (a) a higher-level menu must be displayable while the participant is navigated deeper — e.g. a "go back" screen; (b) explicit names make the `$jsStateHelperCmd` value self-documenting inside flows.

## 11. Menu labels encode routing as `<emoji> <title>:<id>`

**Decision:** Each populated slot is formatted `"✅ Emotionsregulation:m_emoReg"`; unused slots are set to `""` so MobileCoach can hide them; the first not-yet-completed item gets 👉 (see `#MENU_EMOJIS`).

**Why:** MobileCoach has no dynamic list/loop constructs — menus are hard-coded in the flow. Splitting on `:` (left side displayed, right side stored to a routing variable on tap) plus one hard-coded jump rule per id makes the static menu behave fully dynamically after a tedious one-time setup.

**Watch for:** titles containing `:` — see `docs/open-questions.md`.

## 12. "Adequate progress" is a softer bar than completion

**Decision:** `sessions_needed_for_adequate_use` / `activities_needed_for_adequate_use` thresholds; `hasAdequateProgress()` / `isGoodEnough()` report once that many children are completed, even if not all are.

**Why:** the intervention nudges participants onward instead of insisting they finish everything — `getProgressAdvice()` wording and flow branching key off this distinction.

## 13. Tests run in a MobileCoach-shaped environment: the source is a setup file and a global

**Decision:** `vitest.config.js` lists `src/ReactStateHelper.js` as a `setupFile`; the file registers `globalThis.ReactStateHelper`; test files never import the class.

**Why:** this mirrors MobileCoach, where the class is a plain global in a single script — tests exercise the exact deployment shape, including the absence of exports.

## 14. Behavioral tests run on synthetic fixtures, decoupled from production content

**Decision:** Tests build their own minimal states (`851f191`, `07eefe9`). Production `initialState()` is covered by a behavioral test that every activity can be completed without throwing — not invariant-by-invariant.

**Why:** content edits (new modules, renamed sessions) must not break behavioral tests; and `initDefaultState` cannot return an invariant-violating state anyway, since it delegates to `loadExistingState` (#7).

## 15. Participant-facing strings are Swiss German

**Decision:** Advice text uses Swiss spelling — `abschliessen`, no `ß` (`7960069`) — and "Session" stays untranslated (`5c71750`).

**Why:** Swiss deployment context; "Session" is the established participant-facing term for that hierarchy level.

## 16. `$participantGroup` is deliberately repurposed to expose the participant's location

**Decision:** `getParticipantLocation()` writes `moduleId[: sessionId[: activityId]]` into `$participantGroup` (`e656913`).

**Why:** it is one of the few variables easily inspectable from within MobileCoach — an accepted "mis-use" (README's own word) trading naming purity for observability.

**Watch for:** anything that starts using `$participantGroup` for actual group assignment — see `docs/open-questions.md`.

## 17. Adopted the project-foundation setup: decision log, CI, constraint tests, edit-time hook

*(2026-07-08 — the first live entry, not reconstructed.)*

**Decision:** Added this decision log (entries 1–16 reconstructed), `docs/open-questions.md`, a GitHub Actions workflow running the suite on PRs and pushes to master, `test/MobileCoachPlatformConstraints.test.js` (self-containedness + wrapper-variable/README sync, mutation-tested), a PostToolUse hook (`.claude/hooks/check-wrapper-variables.mjs`) that warns at edit time about undocumented wrapper variables including the MobileCoach-side declaration step no test can verify, a PR template carrying the pre-merge checklist, and the `/log-decision` command.

**Why:** durable knowledge belongs in files and claims should be verified deterministically (per the two project-foundation playbooks this was adapted from) — scaled to this project's actual weight.

**Considered and skipped, with revisit triggers:** Claude Code skills (CLAUDE.md is ~100 lines, far under the ~250-line split threshold, and the MobileCoach constraints are needed in nearly every session — revisit if CLAUDE.md outgrows that); a path-based skill-routing hook (no skills to route to); `docs/roadmap.md` (single-file library with a working feature-per-PR flow — revisit if a multi-PR feature queue forms); Dependabot (one devDependency, zero runtime dependencies, deployment is copy-paste); reviewer subagents (the suite runs in ~250 ms).

## 18. Documentation is published via plain GitHub Pages from `docs/`, and the docs site is the source of truth

*(2026-07-08)*

**Decision:** `docs/` is served by GitHub Pages in "deploy from a branch" mode (`master`, `/docs` folder, GitHub's server-side Jekyll with the built-in `jekyll-theme-primer` — a 3-line `_config.yml`, no front matter, no local build tooling, no new dependencies). Two audience-specific pages were added: `docs/content-editor-guide.md` (for MobileCoach content editors; now holds the canonical wrapper **variable table**, the command cheat-sheet, and menu/routing setup) and `docs/developer-guide.md` (architecture + full platform constraints, promoted from CLAUDE.md). README and CLAUDE.md were slimmed to essentials plus links; the docs pages are the single source of truth. The edit-time hook (`.claude/hooks/check-wrapper-variables.mjs`) and `test/MobileCoachPlatformConstraints.test.js` now check the variable table in `docs/content-editor-guide.md` instead of README.

**Why:** with a first live MobileCoach test upcoming, documentation must serve future developers *and* content editors — the latter benefit from a clean published URL with navigable pages rather than a repo tree. Plain Pages was chosen over VitePress and `remote_theme` just-the-docs to avoid non-standard tooling: multiple pages, converted relative links, and themes come for free from GitHub's default Jekyll plugins, and the same markdown renders on github.com. Making docs the source of truth avoids three copies (README / CLAUDE.md / docs) drifting apart.

**Watch for:** the site only updates from `master` (enable once via Settings → Pages, deploy from branch `master` `/docs`); links from docs pages out of `docs/` must be absolute GitHub URLs. Revisit the tooling choice (sidebar/search via just-the-docs or VitePress) if the page count outgrows a hand-written index.
