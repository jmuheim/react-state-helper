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
