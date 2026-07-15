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

> Refined by #29: the level marker loses its underscore — ids are camelCase (`mBouMgt`), because the id doubles as a MobileCoach dialog variable prefix, which forbids inner underscores.

## 6. Id collisions are caught at instantiation, via a registry threaded through `fromJSON`

**Decision:** A shared `Set` is passed through `Module.fromJSON → Session.fromJSON → Activity.fromJSON`; `registerId()` throws the moment a duplicate (or wrongly prefixed) id is registered — like a DB unique constraint rejecting an INSERT.

**Why:** failing at the registration point pinpoints the offending node, and unlike a separate post-load validation pass it cannot be forgotten when the tree grows.

## 7. Structural invariants are validated when state loads, not when it is used

**Decision:** `loadExistingState` (and `initDefaultState`, which delegates to it) creates the registry and checks the module count; each `fromJSON` checks its own thresholds and slot limits right after building its children. Violations throw immediately (`9303d33`).

**Why:** content mistakes should fail fast at load — surfaced through `$jsStateHelperError` (see #3) — rather than producing wrong progress numbers later.

## 8. Intro sessions opt out via `isIntro`, and every module needs at least one non-intro session

> Refined by #31: the field is renamed `is_intro`, matching the snake_case of the other persisted fields. The opt-out mechanism itself stands.

> Refined by #22: an intro session now completes on first entry and *does* count toward module completion (only the progress fraction still ignores it), and it must be the module's first session. The `isIntro` opt-out and the "at least one non-intro session" rule still stand.

**Decision:** A session with no activities must set `isIntro: true`. Completion and progress math filter to sessions that have activities. `Module.fromJSON` additionally requires at least one session with activities (`030b62b`).

**Why:** `isIntro` exists solely so `Session.fromJSON` can tell an intentionally-empty stepping-stone session apart from one that is missing activities by mistake. Without the module-level rule, a module made up entirely of intro sessions would be vacuously "complete" before the participant has done anything.

## 9. At most 9 items per menu level (`MAX_MENU_SLOTS`)

**Decision:** Modules, sessions per module, and activities per session are capped at 9, checked at load.

**Why:** only `$jsStateHelperMenuLabel1`–`$jsStateHelperMenuLabel9` exist, and MobileCoach variables cannot be created at runtime — a hard platform constraint. Capping at load keeps content from silently outgrowing the menu.

## 10. Three explicit `populateMenuLabelsFor*` methods instead of one auto-detecting method

> Refined by #20: renamed to `populateMenuForModule()` / `ForSession()` / `ForActivity()` — the methods now populate ids as well as labels. The three-explicit-methods choice itself stands.

**Decision:** `populateMenuLabelsForModule()` / `ForSession()` / `ForActivity()` rather than a single `populateMenuLabels()` that infers the level from navigation state.

**Why:** (a) a higher-level menu must be displayable while the participant is navigated deeper — e.g. a "go back" screen; (b) explicit names make the `$jsStateHelperCmd` value self-documenting inside flows.

## 11. Menu labels encode routing as `<emoji> <title>:<id>`

> Superseded by #20: labels and ids are now separate variables; the `:` concatenation happens in the MobileCoach menu definition, not in JS.

**Decision:** Each populated slot is formatted `"✅ Emotionsregulation:m_emoReg"`; unused slots are set to `""` so MobileCoach can hide them; the first not-yet-completed item gets 👉 (see `#MENU_EMOJIS`).

**Why:** MobileCoach has no dynamic list/loop constructs — menus are hard-coded in the flow. Splitting on `:` (left side displayed, right side stored to a routing variable on tap) plus one hard-coded jump rule per id makes the static menu behave fully dynamically after a tedious one-time setup.

**Watch for:** titles containing `:` — see `docs/open-questions.md`.

## 12. "Adequate progress" is a softer bar than completion

> Refined by #21: the threshold fields are renamed `sessions_needed_for_adequate_progress` / `activities_needed_for_adequate_progress`. The softer-bar concept itself stands.
> Refined by #23: `isGoodEnough()` is renamed `hasModuleAdequateProgress()`.

**Decision:** `sessions_needed_for_adequate_use` / `activities_needed_for_adequate_use` thresholds; `hasAdequateProgress()` / `isGoodEnough()` report once that many children are completed, even if not all are.

**Why:** the intervention nudges participants onward instead of insisting they finish everything — `getProgressAdvice()` wording and flow branching key off this distinction.

## 13. Tests run in a MobileCoach-shaped environment: the source is a setup file and a global

**Decision:** `vitest.config.js` lists `src/ReactStateHelper.js` as a `setupFile`; the file registers `globalThis.ReactStateHelper`; test files never import the class.

**Why:** this mirrors MobileCoach, where the class is a plain global in a single script — tests exercise the exact deployment shape, including the absence of exports.

## 14. Behavioral tests run on synthetic fixtures, decoupled from production content

> Refined by #33: `initialState()` is renamed `defaultStateTemplate()`.

**Decision:** Tests build their own minimal states (`851f191`, `07eefe9`). Production `initialState()` is covered by a behavioral test that every activity can be completed without throwing — not invariant-by-invariant.

**Why:** content edits (new modules, renamed sessions) must not break behavioral tests; and `initDefaultState` cannot return an invariant-violating state anyway, since it delegates to `loadExistingState` (#7).

## 15. Participant-facing strings are Swiss German

**Decision:** Advice text uses Swiss spelling — `abschliessen`, no `ß` (`7960069`) — and "Session" stays untranslated (`5c71750`).

**Why:** Swiss deployment context; "Session" is the established participant-facing term for that hierarchy level.

## 16. `$participantGroup` is deliberately repurposed to expose the participant's location

> Refined by #35: the repurposing is permanent — `$participantGroup` is a MobileCoach built-in that will never carry real group assignment in this project.

> Refined by #52: the location ids now carry their level emojis (`🗂️mBouMgt: 📑sGesGre`).

**Decision:** `getParticipantLocation()` writes `moduleId[: sessionId[: activityId]]` into `$participantGroup` (`e656913`).

**Why:** it is one of the few variables easily inspectable from within MobileCoach — an accepted "mis-use" (README's own word) trading naming purity for observability.

**Watch for:** anything that starts using `$participantGroup` for actual group assignment — see `docs/open-questions.md`.

## 17. Adopted the project-foundation setup: decision log, CI, constraint tests, edit-time hook

*(2026-07-08 — the first live entry, not reconstructed.)*

**Decision:** Added this decision log (entries 1–16 reconstructed), `docs/open-questions.md`, a GitHub Actions workflow running the suite on PRs and pushes to master, `test/MobileCoachPlatformConstraints.test.js` (self-containedness + wrapper-variable/README sync, mutation-tested), a PostToolUse hook (`.claude/hooks/check-wrapper-variables.mjs`) that warns at edit time about undocumented wrapper variables including the MobileCoach-side declaration step no test can verify, a PR template carrying the pre-merge checklist, and the `/log-decision` command.

**Why:** durable knowledge belongs in files and claims should be verified deterministically (per the two project-foundation playbooks this was adapted from) — scaled to this project's actual weight.

**Considered and skipped, with revisit triggers:** Claude Code skills (CLAUDE.md is ~100 lines, far under the ~250-line split threshold, and the MobileCoach constraints are needed in nearly every session — revisit if CLAUDE.md outgrows that); a path-based skill-routing hook (no skills to route to); `docs/roadmap.md` (single-file library with a working feature-per-PR flow — revisit if a multi-PR feature queue forms); Dependabot (one devDependency, zero runtime dependencies, deployment is copy-paste); reviewer subagents (the suite runs in ~250 ms).

> Refined by #38: the `docs/roadmap.md` revisit trigger fired (six queued items, 2026-07-13) — added as `docs/backlog.md`.

## 18. Documentation is published via plain GitHub Pages from `docs/`, and the docs site is the source of truth

> Refined by #25: the command cheat-sheet is split by audience — the content editor guide keeps only the editor-facing doer commands; the query/flow-logic commands moved to the developer guide.

*(2026-07-08)*

**Decision:** `docs/` is served by GitHub Pages in "deploy from a branch" mode (`master`, `/docs` folder, GitHub's server-side Jekyll with the built-in `jekyll-theme-primer` — a 3-line `_config.yml`, no front matter, no local build tooling, no new dependencies). Two audience-specific pages were added: `docs/content-editor-guide.md` (for MobileCoach content editors; now holds the canonical wrapper **variable table**, the command cheat-sheet, and menu/routing setup) and `docs/developer-guide.md` (architecture + full platform constraints, promoted from CLAUDE.md). README and CLAUDE.md were slimmed to essentials plus links; the docs pages are the single source of truth. The edit-time hook (`.claude/hooks/check-wrapper-variables.mjs`) and `test/MobileCoachPlatformConstraints.test.js` now check the variable table in `docs/content-editor-guide.md` instead of README.

**Why:** with a first live MobileCoach test upcoming, documentation must serve future developers *and* content editors — the latter benefit from a clean published URL with navigable pages rather than a repo tree. Plain Pages was chosen over VitePress and `remote_theme` just-the-docs to avoid non-standard tooling: multiple pages, converted relative links, and themes come for free from GitHub's default Jekyll plugins, and the same markdown renders on github.com. Making docs the source of truth avoids three copies (README / CLAUDE.md / docs) drifting apart.

**Watch for:** the site only updates from `master` (enable once via Settings → Pages, deploy from branch `master` `/docs`); links from docs pages out of `docs/` must be absolute GitHub URLs. Revisit the tooling choice (sidebar/search via just-the-docs or VitePress) if the page count outgrows a hand-written index.

## 19. Menu labels are stored on the helper and written to all nine label variables on every wrapper run

> Refined by #20: the wrapper now writes nine `jsStateHelperMenuId` variables alongside the nine labels, with the same every-run reset behavior.

*(2026-07-08)*

**Decision:** The `populateMenuLabelsFor…()` methods no longer return a label map; they store the labels on the helper instance (`#menuLabels`, not part of persisted state), read back per slot via `getMenuLabel(slot)`. The deployment wrapper writes all nine `jsStateHelperMenuLabel` keys into its output object on **every** run — `""` unless the run's command populated a menu. Consequence: a menu must be (re)populated immediately before displaying it, and stale labels from earlier runs cannot survive.

**Why:** MobileCoach writes each key of the object the script returns back into the variable of the same name — one key, one variable; an object nested inside another value is not unpacked. The original wrapper returned the label map nested inside `$jsStateHelperResult`, so the menu label variables were never written at all. Now every menu label is written back to MobileCoach as an individual variable. **Rejected:** conditionally spreading object-valued command results into the output object — works, but the conditional spread is hard to read and hides which variables the wrapper writes; explicit per-slot writes keep the wrapper's variable set visible and aligned with the pre-declared variable table. Covered by `test/MobileCoachWrapper.test.js`, which runs the wrapper MobileCoach-style (textual `$variable` interpolation, `vm` context without `process`).

**Watch for:** that MobileCoach really writes each returned key back as a variable is our understanding, not yet observed live — the upcoming live test confirms it. If a flow ever needs labels to survive unrelated commands between populate and display, persist `#menuLabels` into `#state` instead of widening the wrapper.

## 20. Menu labels and menu ids are separate variables, concatenated in the MobileCoach menu definition

> Factual basis revised (2026-07-09): MobileCoach splits on the **raw definition text before variable interpolation**, so a colon in a title cannot corrupt the split after all — see the [field note](mobilecoach-field-notes.md#menu-entries-split-on-the-raw-definition-text-not-on-variable-content). The decision itself (concatenate MobileCoach-side) stands; whether the title-colon validation kept below can now be dropped is an [open question](open-questions.md#drop-the-title-colon-validation).

> Refined by #36: the `populateMenuFor…()` names introduced here are renamed `populateMenuWith…()` (plural).

> Refined by #41: the label format becomes `"<level emoji> <title>[ <status emoji>]"` — the level emoji always prefixes the title, and the status markers (✅, 👈 instead of 👉) trail it.

*(2026-07-08)*

**Decision:** `getMenuLabel(slot)` returns only the display text `"<emoji> <title>"`; the new `getMenuId(slot)` returns the bare id. The wrapper writes `$jsStateHelperMenuId1`–`9` alongside `$jsStateHelperMenuLabel1`–`9` on every run (same `""`-reset behavior, see #19). The content editor concatenates the two per slot in the menu definition — `$jsStateHelperMenuLabel1:$jsStateHelperMenuId1` — so the `:` that MobileCoach splits on at tap time is added in MobileCoach, not in JS. Supersedes #11's `"<emoji> <title>:<id>"` label format. Because the methods now populate ids as well as labels, they were renamed `populateMenuForModule()` / `ForSession()` / `ForActivity()` (refines #10; nothing is deployed yet, so renaming `$jsStateHelperCmd` command strings is free).

**Why:** it puts the concatenation under MobileCoach-side control, and together with the load-time rejection of colons in titles (commit c304cee) it guarantees the concatenated entry contains **exactly one** colon — so where MobileCoach splits (first vs. last colon) no longer matters, settling the former open question "Colons inside titles vs. the `:`-split of menu labels". The title validation stays, because the displayed string is still `label:id` after concatenation and a colon in a title would still corrupt the split. **Rejected:** dropping the title-colon validation as "no longer JS's concern" — the library is still the only place that can catch the corruption before it silently breaks routing.

**Watch for:** nine new MobileCoach variables `$jsStateHelperMenuId1`–`$jsStateHelperMenuId9` must be declared (default `0`, access "manageable by service") **before** deploying the updated script — a missing one fails silently mid-flow.

## 21. The threshold concept is uniformly called "adequate progress", including in field names

> Refined by #23: the module-level command `isGoodEnough()` — not renamed here — is renamed `hasModuleAdequateProgress()`, completing the unification.

*(2026-07-08)*

**Decision:** The JSON threshold fields `sessions_needed_for_adequate_use` / `activities_needed_for_adequate_use` are renamed to `sessions_needed_for_adequate_progress` / `activities_needed_for_adequate_progress` (refines #12). "Adequate progress" is now the single term for the softer-than-completion bar everywhere: field names, `hasAdequateProgress()`, the `hasSessionAdequateProgress` command, and docs prose.

**Why:** the codebase used two names for one concept — "adequate progress" in every method name, command, docs heading, and even #12's own title, versus "adequate use" only in the two field names — forcing readers to learn that both mean the same thing. Renaming the two fields is the minimal unification; **rejected:** renaming the methods/command to "adequate use" instead, which would have touched far more surface (public API, content-editor cheat-sheet, prose) to standardize on the less descriptive term. Nothing is deployed to MobileCoach yet, so breaking the persisted `$jsStateHelperJson` shape is free; no `$`-wrapper variables are affected.

**Watch for:** nothing — once state is live in MobileCoach, any future field rename needs a migration path instead (see the no-backward-compat window closing with the first deployment).

## 22. An intro session completes on first entry and counts toward module completion

*(2026-07-08)*

**Decision:** `Session.isCompleted()` returns `true` for an intro session (`isIntro: true`) as soon as it has been entered once (`entered_first_at !== null`), and `Module.isCompleted()` now requires **all** sessions to be completed — intros included — rather than filtering to sessions that have activities (refines #8). The progress *fraction* (`getProgress`/`getModuleProgress`) and session counts still filter to sessions with activities, so an intro adds nothing to the denominator. An intro must also be its module's first session, checked in `Module.fromJSON`.

**Why:** intro sessions previously "never counted either way", so there was no way to tell whether a participant had actually seen a module's introduction, and a module could read as fully completed while its intro was never opened. Completing an intro on entry gives that a truthful signal — an intro is "done" precisely when it has been read — and keeping it out of the progress fraction means it still adds no busywork to the percentage. Restricting intros to the first slot matches how they are used (a stepping stone *into* the module) and keeps "was the intro seen" unambiguous. **Rejected:** leaving intros uncounted (loses the "intro seen" signal); marking intros complete unconditionally at load (would report completion before the participant ever entered the module).

**Watch for:** nothing new to declare in MobileCoach — the change is pure library logic over existing `entered_first_at` timestamps. Flows that key off `isModuleCompleted` will now also require the intro to have been entered.

## 23. The module-level command is renamed `hasModuleAdequateProgress`, completing the "adequate progress" unification

*(2026-07-08)*

**Decision:** The public command `isGoodEnough(moduleId)` is renamed `hasModuleAdequateProgress(moduleId)` (refines #21, which unified the terminology in field names and docs but left this command untouched).

**Why:** `isGoodEnough` was the last holdout still using the informal "good enough" wording for the softer-than-completion bar that everything else — field names, `hasAdequateProgress()`, the `hasSessionAdequateProgress` command, docs prose — calls "adequate progress" since #21. The new name also parallels the session-level command exactly. Nothing is deployed to MobileCoach yet, so renaming the public command surface is free. **Rejected:** keeping `isGoodEnough` as an alias — dead surface with no deployed callers.

**Watch for:** nothing — no `$`-wrapper variables are affected. Once flows are live in MobileCoach, command renames need a coordinated flow update instead.

## 24. Legacy command surface is removed: suggestion-seen flag and both session-count commands deleted; `toString`/`getParticipantLocation` dropped from the cheat-sheet

*(2026-07-08)*

**Decision:** `markSuggestionSeen()` / `isSuggestionSeen()` (with the persisted `suggestionSeen` state field), `countCompletedSessionsInModule()`, and `countCompletedSessionsOverall()` are deleted. `toString()` and `getParticipantLocation()` stay as methods — the wrapper calls them on every run to write `$jsStateHelperJson` and `$participantGroup` — but their rows leave the content-editor command cheat-sheet, since issuing them as `$jsStateHelperCmd` is never needed. `Module.countCompletedSessions()` stays: `hasAdequateProgress()` and `getProgressAdvice()` use it internally.

**Why:** the suggestion-seen pair and both count commands date from the very first implementation commit, have no internal callers, and no documented use case in any doc or decision entry — leftover brainstorming surface that content editors would otherwise have to understand. The two cheat-sheet-only removals cut commands whose outputs are written automatically after every run anyway. Nothing is deployed to MobileCoach yet, so deleting public commands (and the `suggestionSeen` field from the persisted `$jsStateHelperJson` shape) is free. **Rejected:** keeping `countCompletedSessionsOverall()` "just in case" a future flow wants a "≥ N sessions completed in total" rule — note that the `$jsStateHelperSessionsCompleted` CSV is *not* a substitute (MobileCoach branching cannot count CSV entries), so if such a rule is ever designed, re-add the command then.

**Watch for:** no MobileCoach variables need declaring or removing — `$jsStateHelperSessionsCompleted` and `$participantGroup` are still written every run. If a "suggestion" feature returns, design it with a documented flow use case first.

## 25. The command cheat-sheet is split by audience: doer commands stay with content editors, flow-logic commands move to the developer guide

> Refined by #32: the overall `getProgress()` command is deleted (unused); the other six flow-logic commands stand.
> Refined by #28: the three `enter…()` doer commands are now a single `enter(id)`. The audience split itself stands.

*(2026-07-08)*

**Decision:** The cheat-sheet in `docs/content-editor-guide.md` keeps only the editor-facing **doer** commands — `enterModule()` / `enterSession()` / `enterActivity()`, `markActivityCompleted()`, and the three `populateMenuFor…()` commands (refines #18, which placed the whole cheat-sheet in the editor guide). The seven **query** commands (`getProgress`, `getModuleProgress`, `getProgressAdvice`, `isModuleCompleted`, `isSessionCompleted`, `hasModuleAdequateProgress`, `hasSessionAdequateProgress`) move to a new "Flow-logic commands" section in `docs/developer-guide.md`; each guide links to the other's half. While moving, the stale `isModuleCompleted` description ("all sessions *with activities*") was corrected to match #22 (all sessions, an intro counting once entered).

**Why:** content editors create content, set flags, and display menus; conditional flow branching — the only consumer of the query commands' booleans/numbers/advice strings — is hidden from them and wired by developers. Query commands in the editor cheat-sheet were noise for that audience and doubled the surface an editor "would otherwise have to understand" (the same argument as #24). **Rejected:** one shared cheat-sheet with an "audience" column — both audiences still scan past the other's half, and the developer guide already hosts the flow-branching context (the "No conditional logic in flows beyond variables" constraint) the query commands belong next to.

**Watch for:** the split encodes a team-role assumption — editors never wire branching. If a future flow design has editors placing conditions themselves, the query commands need an editor-facing home again. New commands must now be filed to the correct guide: doer → editor guide, query → developer guide.

## 26. The MobileCoach variable prefix is `rsh_` instead of `jsStateHelper`

*(2026-07-09)*

**Decision:** All wrapper variables are renamed from `$jsStateHelper…` to `$rsh_…` with camelCase after the underscore: `$rsh_json`, `$rsh_cmd`, `$rsh_status`, `$rsh_error`, `$rsh_result`, `$rsh_menuLabel1`–`9`, `$rsh_menuId1`–`9`, `$rsh_sessionsCompleted`. Earlier entries in this log keep the old names (append-only); everywhere else — source, tests, hook, docs — uses the new ones.

**Why:** `jsStateHelper` was long (14 characters) and didn't resemble the project name ReactStateHelper; `rsh` is its initials. The trailing underscore follows MobileCoach's own convention: its dialog-level user-definable variable prefixes are *required* to end with an underscore, so `rsh_` reads as a native prefix. The shortening pays off most where names are hand-typed in MobileCoach — a menu slot is now `$rsh_menuLabel1:$rsh_menuId1` instead of `$jsStateHelperMenuLabel1:$jsStateHelperMenuId1`. **Rejected:** `$react…` (falsely suggests the React framework), `$helper…` (generic, loses the link to the library), `$stateHelper…` (barely shorter). Nothing is deployed (testing phase), so the rename costs only re-declaring the variables in MobileCoach.

**Watch for:** the extraction regexes in `.claude/hooks/check-wrapper-variables.mjs` needed `_` added to their character classes (`[a-zA-Z0-9_]`) — any future name-matching pattern must include the underscore too. All wrapper variables must be re-declared in MobileCoach under the new names (default `0`, access "manageable by service") before the next test — the old `$jsStateHelper…` declarations become dead and should be deleted.

## 27. `$` appears in the source only immediately before a declared variable name

*(2026-07-09)*

**Decision:** `src/ReactStateHelper.js` contains a `$` character only where it starts the name of a declared MobileCoach variable. Concretely: no `${…}` template interpolation anywhere — strings are built with plain `+` concatenation (e.g. `o['rsh_menuLabel' + i]`) — and comments may mention real variables (`$rsh_json`) but not `$`-prefixed pseudo-names (`$rsh_menuLabelN`) or other `$` punctuation. Enforced by `test/MobileCoachPlatformConstraints.test.js`, which walks every `$` occurrence in the source and asserts it starts a variable name documented in the content-editor guide's table; the hook's numbered-series extraction regex accordingly changed from the template-literal pattern to the concatenation pattern (`'rsh_menuLabel' + i`).

**Why:** MobileCoach's script editor is a plain text field validated on save ("Ok"): it scans the **raw text** — code, strings, and comments alike — for `$` signs and rejects the save ("The text contains unknown variables") unless each `$` starts a declared variable's name. Empirically verified 2026-07-09 while deploying the #26 rename: the script was accepted only after removing two comment fragments reading "$-prefixed" — even `$` followed by a hyphen inside a comment is rejected, proving the check is a raw text scan, not a JS parse. **Rejected:** keeping template literals and fixing only the comment pseudo-names — disproven empirically; `$` followed by a non-name character is exactly what the validator rejects.

**Watch for:** the constraint test makes violations impossible to merge, but only for `src/ReactStateHelper.js` — if a second deployable script is ever added, it needs the same guard. When writing about variable series in source comments, refer to a concrete declared member (`$rsh_menuLabel1`) rather than a bare or pseudo-name — this keeps the `$`-notation consistent while satisfying the validator; pseudo-names like `$rsh_menuLabelN` are fine everywhere outside the deployed source (docs, tests, this log).

## 28. One `enter(id)` command replaces `enterModule()` / `enterSession()` / `enterActivity()`

*(2026-07-09)*

**Decision:** The three navigation commands are deleted and replaced by a single `enter(id)` that dispatches on the id's level prefix: `m_` enters a module (clearing session and activity), `s_` a session (clearing the activity), `a_` an activity. Lookup scoping and preconditions are unchanged — a session is looked up within the current module, an activity within the current session, and calling out of order still errors. An id with an unrecognized prefix throws, surfaced as usual via `$rsh_status`/`$rsh_error`.

**Why:** the prefix is enforced at instantiation by `registerId()` (an id *cannot* exist without the correct `m_`/`s_`/`a_` prefix), so dispatching on it is reliable by construction, not a heuristic. The payoff is on the MobileCoach side: after a menu tap, the tapped id lands in one reserved variable, and with a single `enter(…)` the same generic follow-up rule works after *any* menu — module, session, or activity level — where previously the editor had to pick the matching one of three commands. It also removes two failure modes: the wrong-level call (`enterSession('a_…')`) and the error-handling asymmetry between `enterModule` (explicit null check) and the other two (finders throw). This does **not** conflict with #10's three explicit `populateMenuFor…()` methods: there, a single method would have to *infer* the level from navigation state (ambiguous — e.g. a "go back" screen shows a higher-level menu than the current location); here, the level is stated explicitly by the argument itself. **Rejected:** keeping the three methods as aliases (dead surface for editors to understand, and nothing is deployed yet — the breaking change is free); global lookup instead of scoped (would silently allow entering a session of a non-current module, breaking the `currentModuleId` invariant the query commands rely on).

**Watch for:** nothing new to declare in MobileCoach — `$rsh_cmd` is the only carrier. Any flow already drafted with the old command names must switch to `enter(…)`. If a fourth hierarchy level is ever added, `enter()` needs its prefix branch *and* `registerId()` its prefix enforcement in the same change.

## 29. Ids are camelCase with a level letter: `mBouMgt` instead of `m_bouMgt`

**Decision:** Ids start with their level letter (`m`/`s`/`a`) followed by the mnemonic part in camelCase, and contain only letters and numbers — e.g. `mBouMgt`, `sGesGre`, `aRolGes` (refines #5). `registerId()` enforces all of it at registration: level letter, then an uppercase letter, then nothing but letters and numbers. `enter(id)` (#28) dispatches on the same pattern.

**Why:** each id is used verbatim in MobileCoach as the dialog identifier **and**, with an underscore appended, as the dialog's variable prefix — and the "Edit variable prefix" dialog rejects anything but letters and numbers before the mandatory trailing underscore ("Variable prefixes always start with an $ and only contain letters and numbers and must end with an underscore", observed 2026-07-09 when `m_bouMgt_` was refused; see the field notes). The mandatory uppercase letter after the level letter keeps the level marker recognizable without a separator and keeps `enter()`'s dispatch unambiguous (`menu…` cannot be mistaken for a module id). The letters-and-numbers check runs at state load, so an id that MobileCoach would refuse as a prefix fails loudly instead of surfacing later as a silent mid-flow failure. **Rejected:** keeping `m_bouMgt` in state and hand-deriving `mBouMgt_` for each dialog's prefix (two spellings of the same name kept in sync by hand across every dialog — exactly the silent-failure class the load-time checks exist to prevent); longer level markers like `modBouMgt`/`sesGesGre` (more readable in isolation, but ids are hand-typed all over MobileCoach — menu wiring, dialog names, `enter('…')` calls — so shorter wins). Nothing is deployed (testing phase), so the rename costs only renaming the MobileCoach dialogs.

**Watch for:** the `registerId()` pattern is built without an end-of-string regex anchor because that character is banned from the script's raw text (#27) — whole-string coverage is guaranteed by the separate letters-and-numbers check instead. Historical entries and commit messages keep the old `m_…` spellings; only live docs were renamed.

## 30. The completion command is `completeActivity()` instead of `markActivityCompleted()`

**Decision:** The public command `markActivityCompleted()` is renamed `completeActivity()`. It still takes no argument and completes the current activity; the internal `Activity.markCompleted()` keeps its name (not editor-facing).

**Why:** next to the id-taking queries (`isSessionCompleted(sessionId)`, `hasSessionAdequateProgress(sessionId)`), `markActivityCompleted()` read like it should take an `activityId`, while it silently operates on the current activity. Verb-first `completeActivity` is a plainer imperative and shorter to hand-type into `$rsh_cmd` (the same brevity argument as #26). "Current" stays implicit, matching the API convention that a command’s scope is implied rather than spelled out — `getProgressAdvice()` and `populateMenuForSession()` also operate on the current context without carrying “Current” in their names. Nothing is deployed (testing phase), so the break is free. **Rejected:** `completeCurrentActivity()` — explicit about the target, but it would be the only name carrying "Current", breaking that convention; keeping the old name as an alias — dead surface with no deployed callers.

**Watch for:** nothing new to declare in MobileCoach — `$rsh_cmd` is the only carrier. Historical entries (#2, #25) keep the old name, per the append-only rule.

## 31. The intro-session field is `is_intro`, matching the snake_case of all other persisted fields

**Decision:** The persisted field and object property `isIntro` is renamed `is_intro` (refines #8).

**Why:** it was the only camelCase key in an otherwise snake_case state shape (`times_entered`, `entered_first_at`, `sessions_needed_for_adequate_progress`, `completed`) — two conventions in one JSON object for no reason. snake_case wins because every other field already uses it, so this is the minimal diff. Nothing is deployed (testing phase), so breaking the persisted `$rsh_json` shape is free — the same argument as #21. **Rejected:** converting all fields to camelCase instead (touches every field, fixture, and docs mention to standardize on the minority convention).

**Watch for:** nothing — no `$`-wrapper variables are affected. Once state is live in MobileCoach, field renames need a migration path instead.

## 32. The overall `getProgress()` command is removed

**Decision:** The helper-level `getProgress()` (overall progress across all modules) is deleted from the public command surface, its tests and docs row with it. `Module.getProgress()` stays — it backs the `getModuleProgress(moduleId)` command.

**Why:** it was referenced only by its own tests and its docs table row; no flow uses an overall-progress number (confirmed 2026-07-09). Its name was also misleading: everywhere else a no-arg command scopes to the current location, but this one was global. Dead surface with a misleading name is better deleted than renamed. **Rejected:** renaming it `getOverallProgress()` — keeps unused surface, just prettier.

**Watch for:** if a flow ever needs overall progress, reintroduce it as `getOverallProgress()` so the global scope is explicit in the name.

## 33. The default-state blueprint is `defaultStateTemplate()`, not `initialState()`

**Decision:** The static `initialState()` is renamed `defaultStateTemplate()` (refines #14's wording; behavior unchanged).

**Why:** `initDefaultState()` and `initialState()` were near-twin names — four letters apart — for different things: the former returns a ready helper *instance*, the latter the plain state *object* the default is built from. "Template" states that role and no longer collides visually with `initDefaultState()`. **Rejected:** renaming `initDefaultState()` instead — it is the wrapper-facing entry point and its name (init me a default-state helper) reads fine; renaming both — churn without extra clarity.

## 34. `getCompletionOverview()` and `$rsh_completionOverview` replace `allCompletedSessionsAsCsv()` and `$rsh_sessionsCompleted`

> Refined by #49: the dedicated `$rsh_completionOverview` variable is dropped — the overview (now with level-emoji id prefixes) is appended to `$participantGroup` instead.

**Decision:** The CSV of completed session ids is replaced by a one-line overview of the entire completion state, written to `$rsh_completionOverview` on every run (same cadence as before): each module wraps its sessions in `[ ]`, each non-intro session wraps its activities in `( )`, and every completed item — activity, session, or module — carries the completed emoji (see #EMOJIS in the source) directly after its id, e.g. `mBouMgt[sBouIntro sGesGre(aRolGes aAbgKon)]` with the marker appended to whatever is done.

**Why:** the CSV predates activities — it named completed sessions and said nothing about activities or how completion rolls up into sessions and modules. The overview shows the full hierarchy and its rollup at a glance while staying a single, inspectable string. Ids instead of titles keep it compact and unambiguous (titles are long and may repeat); the completed marker reuses the same emoji editors already know from menu labels. **Rejected:** exposing raw JSON (that is `$rsh_json`, unreadable at a glance); per-level counts like `1/2` (derivable from the marks, adds noise); keeping the CSV alongside the overview (a second variable carrying strictly less information).

**Watch for:** declare `$rsh_completionOverview` in MobileCoach (default `0`, "manageable by service") and remove the `$rsh_sessionsCompleted` declaration before the next copy-over. Variable length limits in MobileCoach are unknown — with many modules the overview is the likeliest value to hit one (same unknown as the `$rsh_error` open question).

## 35. `$participantGroup` keeps carrying the participant location — permanently

> Refined by #49: the variable now carries the completion overview after the location, separated by ` | `.

**Decision:** The repurposing of `$participantGroup` for the participant's location (#16) is permanent; no dedicated `$rsh_location` variable will replace it. The corresponding open question is resolved and removed.

**Why:** `$participantGroup` is a MobileCoach built-in, written into the platform itself — it always exists, needs no declaration, and stays one of the few variables easily inspectable in the MobileCoach UI. The project will never use it for actual group assignment (confirmed 2026-07-09), so the collision the open question worried about cannot happen. **Rejected:** a dedicated `$rsh_location` — one more variable to declare, without the built-in inspectability that motivated #16 in the first place.

## 36. The menu commands are `populateMenuWithModules()` / `WithSessions()` / `WithActivities()`

**Decision:** The three menu-populating commands are renamed from `populateMenuForModule()` / `ForSession()` / `ForActivity()` (#20) to `populateMenuWithModules()` / `populateMenuWithSessions()` / `populateMenuWithActivities()`. The corresponding open question ("Better names for the `populateMenuFor…()` commands") is resolved and removed. Refines #20; #10/#28's three-explicit-methods choice stands untouched.

**Why:** `populateMenuForModule()` fills the menu with *all modules*, yet "for module" (singular) reads as scoped to a single one — the name pointed at neither the listed items clearly nor the drawing scope. "Populate the menu **with** modules" states unambiguously what fills the menu; the drawing scope (the current module/session) stays implicit, matching the API convention that a command's scope is never spelled out (#30). Nothing is deployed (testing phase), so the break is free. **Rejected:** `populateModuleMenu()` / `populateSessionMenu()` / `populateActivityMenu()` — shortest and verb-first, but "session menu" can be misread as "the menu shown in a session" (which would list activities); `populateMenuForModules()` — pluralizing fixes the singular misreading, but "for" still points at the listed items rather than the scope; keeping the #20 names — the misreading is worth fixing on the most editor-facing command names, and the 5 extra characters over the shortest alternative were judged worth the unambiguity.

## 37. `getProgressAdvice()` is auto-written to `$rsh_progressAdvice` on every run

**Decision:** The deployment wrapper writes `getProgressAdvice()`'s sentence to `$rsh_progressAdvice` on every run, joining the other auto-written variables (#19's write-everything-every-run cadence). The call is guarded: before any module is entered — the normal state of every participant's first runs — `getProgressAdvice()` throws, and the wrapper writes `''` instead. The command itself stays issuable via `$rsh_cmd` (its `$rsh_result` semantics are unchanged).

**Why:** the advice previously existed only as a command result in `$rsh_result`, which the next command overwrites — a flow wanting to display it had to issue `getProgressAdvice()` at exactly the display point. Auto-writing makes the freshest advice referenceable anywhere in a flow. The guard is not optional politeness: the auto-write runs *outside* the eval's try/catch, and an uncaught throw there kills the entire output object — no variables are written, not even `$rsh_error` — which is the platform's silent mid-flow halt. **Rejected:** writing output keys conditionally on the content of `$rsh_cmd` (menu variables only on `populateMenuWith…()` runs, `$rsh_progressAdvice` only on `getProgressAdvice()` runs) — a key omitted from the output object makes MobileCoach *keep the variable's previous value*, reintroducing exactly the stale-variable bugs the always-write model exists to prevent, and string-matching command names would create a shadow dispatch that a rename like #36 silently breaks; no auto-write at all — keeps the advice one command away and stale in `$rsh_result`.

**Watch for:** declare `$rsh_progressAdvice` in MobileCoach (default `0`, "manageable by service") before the next copy-over. The guard maps *any* advice failure to `''` — today the only reachable throw is "no module entered yet", but if `getProgressAdvice()` ever gains new throw paths, an unexpectedly empty `$rsh_progressAdvice` is the symptom pointing here.

## 38. Sessions and activities menus append an automatic back entry; `modulesMenu` is the reserved module-overview dialog id

> Refined by #39: the labels are now `Ein anderes 🗂️ Modul wählen` / `Eine andere 📑 Session wählen`; routing and caps unchanged.
> Refined by #43: the reserved id is renamed to `allModulesMenu`; everything else unchanged.
> Refined by #44: `registerId` now rejects the reserved id by name after all — the case rule alone was judged too implicit.
> Refined by #45: the activities menu appends a second back entry to the module overview; activities per session are capped at 7.

**Decision:** `populateMenuWithSessions()` appends `Zurück zur 🗂️ Modulauswahl` in the slot after the last session, routing to the module-overview dialog — the reserved id `modulesMenu`; the MobileCoach dialog that shows the modules menu must carry exactly that id. `populateMenuWithActivities()` appends `Zurück zu 🗂️ <module title>`, routing to the parent module's own dialog. `modulesMenu` is a pure routing target: `enter('modulesMenu')` is never called, and a dedicated guard rejects it with an explanatory error ("modulesMenu must never be entered: …") — the generic malformed-id message would mislead, since this is an id the library itself emits into the menu variables. To guarantee the back entry a free slot, state validation now caps sessions per module and activities per session at `MAX_MENU_SLOTS - 1` (8); modules stay capped at 9, since the top-level menu has no back entry.

**Why:** without back entries a participant who tapped into a module or session had no way back up the hierarchy — menus are the only navigation surface. Appending inside the populate commands keeps the editor workflow unchanged (same one command per menu). A back tap needs no library command because dialogs enter *themselves*: after a tap, MobileCoach navigates to the target dialog, whose own script run calls `enter('<own id>')` — the tapped id never reaches `enter()`, and while the modules menu is displayed the participant's tracked location deliberately stays in the previous context. `modulesMenu` cannot collide with a state id because `registerId` requires an uppercase letter after the level letter, so no reserved-word check is needed. **Rejected:** making the back-target dialog id a command parameter — more editor-facing surface for a value that never varies; supporting `enter('modulesMenu')` as a full-navigation reset — implemented at first, then removed: it assumed a generic `enter($participantNextMicroDialogIdentifier)` follow-up rule after menu taps that the flows don't actually use (dialogs enter themselves), leaving it dead code with untestable-in-practice semantics; keeping the 9-item caps and appending the back entry only when a slot happens to be free — a menu whose back entry silently disappears at exactly 9 items is a content bug waiting to be discovered live; intercepting the back tap inside the displaying dialog instead of routing to a dedicated dialog (checking `$participantNextMicroDialogIdentifier` against the back id, then re-populating and re-showing the modules menu) — platform-wise possible, since an unmatched id pauses silently rather than erroring ([field note](mobilecoach-field-notes.md#a-participantnextmicrodialogidentifier-without-a-matching-dialog-pauses-the-flow-silently), tested 2026-07-10), but the module-selection dialog must exist somewhere anyway, and the intercept would duplicate the branch rule plus the modules-menu block into every module dialog.

**Watch for:** in MobileCoach, the module-overview dialog must be (re)named `modulesMenu` before the next copy-over, or both back entries' sessions-menu route leads nowhere. Existing state definitions with 9 sessions or 9 activities per parent now fail validation (fine while nothing is deployed). While the modules menu is displayed, `$participantGroup` and `$rsh_progressAdvice` still reflect the previously entered context — by design, not a bug.

## 39. Back entries are worded as choosing anew, not going back

**Decision:** The sessions menu's back entry reads `Ein anderes 🗂️ Modul wählen` (was `Zurück zur 🗂️ Modulauswahl`), the activities menu's reads `Eine andere 📑 Session wählen` (was `Zurück zu 🗂️ <module title>`). Routing targets are unchanged (`modulesMenu` / the parent module's dialog), as are the 8-item caps from #38. The activities-menu label no longer interpolates the module title and carries the session emoji instead of the module emoji — each label names the level being *chosen*, not the dialog being routed to. Internally the slot keeps its name (`#addBackEntry`, "back entry" in the docs) since it still occupies the slot after the last item and routes up the hierarchy.

**Why:** "Zurück" misdescribed what happens: a tap doesn't go back — the participant's tracked location deliberately stays in the previous context (#38), and the entry's real purpose is to pick a *different* session/module. Wording it as a choice also matches what the target dialog shows (a selection menu). Dropping the module title from the activities-menu label removes the only variable-length back label; the fixed wording can't overflow with long module titles. **Rejected:** keeping "Zurück …" wording — actively misleading about the navigation model; naming the routed-to level (`Ein anderes Modul wählen` on the activities menu, since it routes to the module dialog) — the participant thinks in terms of what they want next (another session), not which dialog re-renders on the way there.

**Watch for:** the labels still say "ein anderes/eine andere" even when only one module or session exists — harmless, but revisit if single-module coaches become the norm.

## 40. Intended work lives in `docs/backlog.md`; open questions return to genuine unknowns only

*(2026-07-13)*

**Decision:** Added `docs/backlog.md`, a living document for intended-but-not-started work, ordered roughly by intended sequence. Each item carries **Today** (current state), **Open design points** (what still needs deciding inside the item), and **Done when** (completion criteria including the `/log-decision` graduation). `docs/open-questions.md` returns to its original contract — genuine unknowns with a placeholder — and its intro now states the dividing line: an open question is something we *don't know enough about to decide*; a backlog item is work we *have decided we want to do*. The six future-work ideas collected on 2026-07-13 (JSON extraction from the script, per-concern script split, `;`-batch commands, output-flow inversion, flow-export check-in, enter-helper dialogs) moved from open questions to the backlog.

**Why:** the 2026-07-13 idea-collection session stretched `docs/open-questions.md` to hold planned work — "Placeholder: not yet implemented" was the tell that two different contracts were being mixed, which would erode the open-questions file's usefulness as a list of actual unknowns. This is the `docs/roadmap.md` that #17 considered and skipped, whose revisit trigger ("if a multi-PR feature queue forms") has now fired: six queued items spanning multiple future PRs. **Rejected:** GitHub Issues — checkboxes, labels, and PR cross-linking for free, but they live outside the repo, are not versioned alongside the docs, and would split the source of truth against #18's docs-as-source-of-truth setup.

**Watch for:** backlog items drifting into stale plans — each item's *Open design points* reflect what was known at write time; re-check them against the field notes and decision log when picking an item up. And the dividing line cuts both ways: a backlog item that turns out to hinge on an unknown should spawn an open question, not silently stall.

## 41. Menu labels carry the level emoji as prefix; status markers trail the title

*(2026-07-13)*

> Refined by #42: in `getProgressAdvice()` texts the level emoji moves inside the quoted title, so the quoted string matches this entry's menu-label format.

**Decision:** Every menu label starts with its level emoji — 🗂️ for modules, 📑 for sessions, 🎯 for activities — giving the format `"<level emoji> <title>[ <status emoji>]"` (refines #20's `"<emoji> <title>"`). The status markers move from prefix to suffix: a completed item ends in ✅, the first not-yet-completed item ends in 👈 (flipped from 👉 so it points at its own label). Items that are neither get only the level prefix. Back entries keep their fixed labels from #39 (no level prefix, no status marker), and `getProgressAdvice()` texts are unchanged — they already carried the level emojis inline.

**Why:** the level emojis appeared on every surface (advice texts, back entries) *except* the menu items themselves — a menu of bare titles didn't visually state what kind of thing is being chosen. Prefixing the level emoji also gives every label in a menu the same shape: previously the title's start position jumped right whenever a ✅/👉 prefix appeared. With the prefix slot taken by the level emoji, the status markers trail the title — consistent with the completion overview's marker-after-id convention (#34). **Rejected:** stacking both emojis in front (`✅ 🗂️ Titel`) — two emojis before the first word reads cluttered and the title offset still varies; keeping 👉 as the trailing marker — at the right edge a right-pointing hand points away from the label it marks.

**Watch for:** every label is now longer by one emoji (two for marked items) — relevant if a MobileCoach length limit for menu buttons or variables ever surfaces (same unknown family as `$rsh_error`/`$rsh_completionOverview`). No new variables to declare; the existing `$rsh_menuLabel1`–`9` simply carry the new format.

## 42. Advice texts quote items in menu-label format: the level emoji sits inside the quotes

**Decision:** In `getProgressAdvice()` texts, every quoted item reference carries its level emoji inside the quotes — `Modul "🗂️ Modul Eins"` instead of `🗂️ Modul "Modul Eins"`. This applies to all quoted references in the advice templates: the current item, the "oder zu … weitergehen/zurückgehen" target, and the "zum Beispiel mit …" sub-item example. Plural references without a quoted title (e.g. "weitere 📑 Sessions abschliessen") keep the emoji before the label word, since there is no title to attach it to. Refines #41, whose note said advice texts were unchanged.

**Why:** with the emoji outside, the quoted string was the bare title while the menus show `"<level emoji> <title>"` (#41) — the same item read differently in an advice sentence than on the button the participant is about to tap. Moving the emoji inside the quotes makes the quoted string identical to the menu label's stable prefix part, so advice text and menu visually name the same thing. **Rejected:** emoji both outside and inside — duplicates the emoji in every reference; dropping the emoji from advice texts entirely — loses the level cue exactly where the participant is told where to go next.

**Watch for:** nothing new — message lengths are unchanged and no variables are affected.

## 43. The reserved module-overview dialog id is `allModulesMenu` (was `modulesMenu`)

**Decision:** The reserved id the sessions menu's back entry routes to (#38) is renamed from `modulesMenu` to `allModulesMenu` — in the emitted menu id, the `enter()` guard and its error message, and all docs. Everything else about #38 is unchanged: it remains a pure routing target that is never entered, and the MobileCoach dialog showing the module-selection menu must now carry exactly the id `allModulesMenu`.

**Why:** the MobileCoach dialog structure has gained two similar menu dialogs, `allSessionsOfCurrentModuleMenu` and `allActivitiesOfCurrentSessionMenu`, and the `all…Menu` pattern keeps all three consistently named. Collision safety survives the rename even though the id now starts with a level letter (`a` for activities): `registerId` requires an uppercase letter after the level letter, and the second letter of `allModulesMenu` is lowercase. **Rejected:** keeping `modulesMenu` — one menu dialog named against the pattern of its two siblings is a standing invitation for typos; renaming the two new dialogs to the short pattern instead (`sessionsMenu`, `activitiesMenu`) — their names must express *whose* sessions/activities they list (the current module's/session's), which the short form drops.

**Watch for:** the module-overview dialog in MobileCoach must be renamed to `allModulesMenu` before the next copy-over, or the sessions menus' back entries route to a no-longer-existing id — a tap then pauses the flow silently ([field note](mobilecoach-field-notes.md#a-participantnextmicrodialogidentifier-without-a-matching-dialog-pauses-the-flow-silently)). The two sibling dialog names are MobileCoach-side only — the library emits neither.

## 44. `registerId` rejects the reserved menu dialog id by name

**Decision:** `registerId` rejects `allModulesMenu` (held in the `ALL_MODULES_MENU_DIALOG_ID` constant) with a dedicated error — "Id allModulesMenu is reserved for the dialog showing the module-selection menu and cannot be used as a state id" — before the naming-convention checks run. This refines #38, which concluded no reserved-word check was needed.

**Why:** the collision safety was a coincidence of letter casing — the convention check (uppercase letter after the level letter) rejects the reserved id only because its second letter happens to be lowercase, a property nobody guards when the id is renamed (as #43 just did). And when the case rule does fire, its message complains about the id's *format*, misdescribing the actual conflict: the id is well-formed for a dialog, it is just reserved. The explicit check makes the guarantee deliberate and the error truthful. **Rejected:** relying on the case rule alone (the #38 position) — safe today, but implicit and wrongly worded when triggered; checking in each `fromJSON` instead — `registerId` is the single choke point every id already passes through.

**Watch for:** nothing MobileCoach-side — the check runs at state load/registration only; no new variables, no emitted-value changes.

## 45. The activities menu carries a second back entry to the module overview; activities are capped at 7 per session

> Refined by #46: the session back entry now routes to the reserved `allSessionsOfCurrentModuleMenu` dialog id instead of the parent module's own dialog.

**Decision:** `populateMenuWithActivities()` appends `Ein anderes 🗂️ Modul wählen` (routing to `allModulesMenu`) in the slot after its existing `Eine andere 📑 Session wählen` back entry — the same label/target the sessions menu emits (#39, #43). The activities menu thus ends in two back entries: choose another session, choose another module. To guarantee both a free slot, state validation caps activities per session at `MAX_MENU_SLOTS - 2` (7, was 8); sessions per module stay capped at 8, modules at 9. Refines #38.

**Why:** from an activities menu, reaching a different module took two hops — back to the sessions menu (via the parent module's dialog), then back again to the module overview. A participant deep in one module who wants to switch modules is a normal navigation move, and menus are the only navigation surface (#38), so the shortcut belongs in the menu. Ordering puts the nearer level first: session (one level up) before module (two levels up). Like the sessions menu's entry, it is a pure routing target — no library command runs on tap, the location changes when the target module's dialog enters itself. **Rejected:** keeping the two-hop route — works, but costs a full dialog round-trip through the module dialog just to render another menu; appending the module entry only when a slot happens to be free — the same silently-disappearing-entry trap #38 already rejected for the first back entry.

**Watch for:** state definitions with 8 activities in a session now fail validation (fine — nothing is deployed yet, the MobileCoach copy-over is testing-only). The `allModulesMenu` dialog-naming requirement (#43) now matters for activities menus too: if the dialog is misnamed, taps on this entry pause the flow silently.

## 46. The activities menu's session back entry routes to the reserved `allSessionsOfCurrentModuleMenu` dialog id

**Decision:** `populateMenuWithActivities()` no longer points `Eine andere 📑 Session wählen` at the parent module's own dialog; it emits the new reserved dialog id `allSessionsOfCurrentModuleMenu` (constant `ALL_SESSIONS_OF_CURRENT_MODULE_MENU_DIALOG_ID`) — the MobileCoach dialog that shows the current module's session-selection menu, i.e. the one calling `populateMenuWithSessions()`. Like `allModulesMenu` (#43) it is a pure routing target: `enter()` rejects it with a dedicated guard, and `registerId` rejects it as a state id by name (#44). Refines #45.

**Why:** routing through the module's own dialog re-runs that dialog's `enter(<module id>)`, which bumps the module's `times_entered` and timestamps just to re-render a menu the participant was already inside — polluting usage data with navigation noise — and replays whatever content the module dialog carries before its menu. A dedicated menu dialog shows the sessions menu and nothing else, exactly how the module overview already works (#38, #43); the participant's tracked location now also stays in the previous context while the sessions menu is displayed, matching the modules-menu semantics instead of silently clearing the current session. **Rejected:** keeping the module's dialog as target (the #45 wiring) — see above; teaching `enter()` not to count back-navigation — impossible, the library cannot distinguish a back tap from a genuine module entry, both arrive as a plain dialog navigation.

**Watch for:** a dialog named exactly `allSessionsOfCurrentModuleMenu` (calling `populateMenuWithSessions()`) must exist in MobileCoach, or session back taps pause the flow silently — the same misnaming trap as #43/#45, now on a second dialog. No new variables.

## 47. Session-level advice tails mirror the activities menu's two back entries

**Decision:** The session-level `getProgressAdvice()` messages (adequate-progress and session-complete) end with `, oder eine andere 📑 Session bzw. ein anderes 🗂️ Modul wählen.` instead of `, oder zu Modul "🗂️ <current module>" zurückgehen.`. Module-level messages are unchanged (`, oder zu Modul "🗂️ <next module>" weitergehen.`, or the "und das gilt auch für alle anderen Module" variant when no module follows). Internally, `#buildProgressAdviceString` now takes a pre-built `skipPart` string from its callers instead of a `next` target plus `nextVerb` — the new tail names two alternatives and no title, which the old template could not express; `null` still selects the all-covered variant.

**Why:** the old tail was wrong on two counts. "Zurückgehen" misdescribed the navigation model the same way the old back-entry labels did before #39 — nothing goes back, the participant *chooses* where to continue. And it named the very module the participant is already inside, offering a single exit where the activities menu shown in the same context offers two since #45: another session, another module. The new tail names exactly those two back entries, so advice and menu speak the same language — the same advice-matches-menu reasoning as #42, extended from item references to the continuation options. As a side benefit, the fixed wording drops the only variable-length tail at session level (the same overflow-safety point #39 made for the labels). **Rejected:** keeping "zurückgehen" with the module title — misleading on both counts above; naming only one of the two alternatives — undersells the menu the participant actually gets; quoting the back-entry labels verbatim in the sentence ("… oder "Eine andere 📑 Session wählen"") — imperative button labels don't inline grammatically into a sentence.

**Watch for:** #39's single-module caveat now applies to advice too — "eine andere Session bzw. ein anderes Modul" reads oddly when only one module or session exists. The tail also assumes the participant sees a menu carrying both back entries; true wherever session-level advice is shown today, revisit if advice ever surfaces next to a menu that lacks them.

## 48. Debug messages are prefixed with the MobileCoach-owned banner variable `$debugBanner`

**Decision:** Every DEBUGGER-facing message in the flows starts with the content of `$debugBanner`, a variable owned by MobileCoach: declared there with the marker `⚠️ DEBUGGER INFO ⚠️` as its **default value** (not `0`), prepended to debug text elements on the flow side. The script does not write or read it today; it may interpolate it later if script-emitted debug messages ever need the marker. Shipped — this graduates the "Unify DEBUGGER messages behind a shared prefix variable" backlog item.

**Why:** debug-only output (shown when `$coachName` matches `DEBUGGER.*`) must be instantly distinguishable from participant content, and the marker has to live in exactly one place so every message uses the identical string. **Rejected:** a script-owned `$rsh_debugPrefix` auto-written on every run — it would make the marker repo-versioned, but costs a wrapper variable and script involvement for what is a flow-side display concern, and has an availability gap: an auto-written banner exists only after the script has run at least once, while flows may show debug messages before any script run; a MobileCoach default value is there from the very start.

**Watch for:** the marker string lives only in MobileCoach, unversioned — the field notes record its existence and exact value so it isn't tribal knowledge; keep that note current if the wording ever changes. Because of the `$`-scan on save, `$debugBanner` must stay declared before any script or pasted snippet mentions it literally. Still open, tracked with the enter-helper backlog item: whether the script's future DEBUGGER-guard messages interpolate `'$debugBanner'` themselves, and the misconfiguration guard for a banner left at default `'0'` (raise via `$rsh_error` instead of rendering debug messages with a bare `0`).

## 49. The completion overview rides inside `$participantGroup`; `$rsh_completionOverview` is dropped

> Refined by #52: "`getParticipantLocation()` is unchanged" no longer holds — the location ids now carry their level emojis too.

**Decision:** The wrapper writes the participant's location and the completion overview into `$participantGroup` as one string, each part behind a short label: `Participant location: <location> | Completion overview: <overview>` (e.g. `Participant location: mBouMgt: sGesGre | Completion overview: 🗂️mBouMgt[📑sBouIntro✅ 📑sGesGre✅(🎯aRolGes✅ 🎯aAbgKon✅) 📑sPaus(🎯aMikPau)]`); before the first module is entered there is no location, so the variable holds the labelled overview alone. The dedicated `$rsh_completionOverview` output variable (#34) is dropped; `getCompletionOverview()` stays as a method, now prefixing every id with its level emoji (#41's menu-label emojis, here without a space — ids are compact enough); `getParticipantLocation()` is unchanged. Extends the #16/#35 repurposing of the built-in.

**Why:** both values exist purely for quick human inspection, and `$participantGroup` is the one easily inspectable MobileCoach built-in — the whole reason #16 repurposed it. Splitting the inspection payload across a built-in and a declared variable meant one more row in the setup table and one more chance to hit the silent-failure trap of an undeclared variable, for no gain: nobody branches a flow on the overview string. **Rejected:** keeping both variables (a declared variable whose only consumer is the same human eyeball already looking at `$participantGroup`); merging in the other direction into `$rsh_completionOverview` (loses the built-in's no-declaration inspectability, which is the point); marking the current location inside the overview with an emoji instead of prefixing it (harder to read at a glance and overloads the emoji vocabulary).

**Watch for:** remove the `$rsh_completionOverview` declaration in MobileCoach before the next copy-over — the platform [never cleans up variables](mobilecoach-field-notes.md#variables-are-never-cleaned-up-stale-values-survive-forever), so a stale copy would otherwise linger forever and mislead inspection. The merged value is now the likeliest string to hit MobileCoach's unknown variable length limit (same unknown family as `$rsh_error`, see #34's watch-for).

## 50. Error messages are prefixed with the MobileCoach-owned banner variable `$errorBanner`

**Decision:** Every error-reporting message in the flows starts with the content of `$errorBanner`, a second MobileCoach-owned banner variable alongside `$debugBanner` (#48): declared there with the marker `🚨 ERROR INFO 🚨` as its **default value** (not `0`), prepended to error text elements on the flow side. Unlike `$debugBanner` it is not gated on `$coachName` — every error message carries it, participant-facing ones included. The script does not write or read it.

**Why:** error output needs the same at-a-glance distinguishability from regular content that debug output got in #48, and the same single-place-marker argument applies. It is a separate variable rather than a reuse of `$debugBanner` because the audiences differ: debug output is hidden from participants behind the `DEBUGGER.*` coach check, errors are shown to everyone — one shared banner would either leak the DEBUGGER wording into participant messages or force error messages behind the coach gate. **Rejected:** a script-owned `$rsh_errorPrefix` auto-written on every run — the same alternative #48 rejected, for the same reasons (flow-side display concern, and the availability gap before the first script run — which for *error* messages is precisely when things may already be going wrong).

**Watch for:** same maintenance profile as #48 — the marker string lives only in MobileCoach, unversioned; the field notes record its exact value, keep that current. `$errorBanner` must stay declared before any script or pasted snippet mentions it literally (`$`-scan on save). Because participants see this banner, wording changes are participant-content decisions, not just developer convenience. The open banner-interpolation question tracked with the enter-helper backlog item now spans both banners.

## 51. The auto-written completed flags carry the exact strings `true`/`false`, not booleans

**Decision:** The wrapper's three completed flags — `$rsh_moduleCompleted`, `$rsh_sessionCompleted`, `$rsh_activityCompleted`, auto-written on every run for the participant's current module/session/activity (`""` while that level has no current item) — hold the exact strings `true`/`false`, converted explicitly in the wrapper. The underlying query commands `isCurrentModuleCompleted()` / `isCurrentSessionCompleted()` / `isCurrentActivityCompleted()` keep returning real booleans (`null` while no current item), consistent with every other `is…`/`has…` command.

**Why:** MobileCoach rules branch on variable *content as text*, and how the platform stringifies a raw JavaScript boolean written back from the script is unverified — if it rendered as anything other than `true`/`false`, a rule comparing against those texts would silently never fire. Converting in the wrapper removes that unknown: the variable content is guaranteed to be one of exactly two known strings. **Rejected:** writing raw booleans and trusting the platform's stringification (bets a silent flow failure on unverified behavior); making the `isCurrent…Completed()` methods return strings themselves (breaks the library-API convention that `is…`/`has…` commands return booleans, and would leak the MobileCoach text concern into the Node-tested API).

**Watch for:** the conversion is deliberately asymmetric — booleans returned by commands issued via `$rsh_cmd` (e.g. `isModuleCompleted('mBouMgt')`) still reach `$rsh_result` unconverted. A live check of how `$rsh_result` renders a raw boolean belongs in the field notes; if it is anything other than `true`/`false`, the same conversion belongs in the `rsh_result` assembly.

## 52. Location ids in `$participantGroup` carry their level emojis

**Decision:** `getParticipantLocation()` prefixes each id with its level emoji, directly in front with no space — the same convention #49 gave `getCompletionOverview()` — so the location part of `$participantGroup` reads `🗂️mBouMgt: 📑sGesGre` instead of `mBouMgt: sGesGre` (`ccafde9`, pushed directly to master). Refines #16's bare-id format and #49's "`getParticipantLocation()` is unchanged".

**Why:** both halves of the merged `$participantGroup` value exist for the same quick human inspection (#49), yet the location showed bare ids while the overview right next to it was emoji-prefixed — one variable speaking two dialects. The developer guide's `$participantGroup` example already showed the emoji-prefixed location, so code and docs had drifted; the emojis reuse #41's level vocabulary, making each id's level readable at a glance instead of via its first letter. **Rejected:** correcting the docs down to the bare-id format instead — the at-a-glance legibility that justified the overview's emojis in #49 applies equally to the location; a space between emoji and id (menu-label style) — #49 already settled no-space for compact ids inside this variable.

**Watch for:** nothing branches on the location string today; if a flow ever does, it must match the emoji-prefixed format. The deployed MobileCoach copy keeps writing bare ids until the next copy-over.

## 53. No underscore prefix for "internal" commands — the boundary is the cheat-sheet plus real `#` privacy

**Decision:** Method names on `ReactStateHelper` never carry an `_` prefix to mark them as "internal". The class's methods fall into three tiers, each with its own existing mechanism: **(1)** editor-facing doer commands are exactly the rows of the developer guide's command cheat-sheet; **(2)** wrapper plumbing (`getProgressAdvice()`, `getParticipantLocation()`, `getMenuLabel(slot)`, `toString()`, the `isCurrent…`/`getCurrent…` getters, …) stays public and plainly named, because the end-of-run output assembly lives *outside* the class and must reach it; **(3)** truly internal helpers use JavaScript's `#` private syntax (`#findModule`, `#buildMenuLabels`, `#addBackEntry`, …), which the wrapper's `eval` cannot touch — a flow calling one fails loudly via `$rsh_status`/`$rsh_error`.

**Why:** an `_` prefix is a soft convention that enforces nothing, while the codebase already uses the enforced alternative (`#`) for everything genuinely private. The methods an `_` would end up targeting — the id-taking query commands like `isModuleCompleted('mBouMgt')` — aren't private at all: the developer guide explicitly offers them as an escape hatch, and the wrapper's own comment block shows them as example `$rsh_cmd` values. Command strings are hand-typed in MobileCoach, so a leading underscore adds typo surface for no guarantee (the same hand-typing argument that drove #26's shortening). **Rejected:** `_`-prefixing the query commands (appearance of privacy without enforcement, and it discourages the one legitimate use they have); `_`-prefixing the wrapper plumbing (misstates its role — it *is* the class's public API, consumed by the wrapper on every run); drawing the editor-facing boundary via naming at all — if that boundary ever needs enforcement, the house mechanism is a constraint test pinning the public method surface (like the wrapper-variable table check), not a rename.

**Watch for:** whether the id-taking query commands should be reachable from MobileCoach *at all* is deliberately **not** settled here — they have no internal callers, no MobileCoach flow uses them today, and their only output channel (`$rsh_result`) may be removed by the batch-commands backlog item; the invert-the-output-flow item could make them `#`-private for real. Tracked as an open question.
