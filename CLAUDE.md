# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project purpose

A plain JavaScript library for managing hierarchical app state (modules → sessions → activities) as JSON, designed to be copy-pasted into MobileCoach (a mobile health platform). See README.md for deployment details.

## Commands

```bash
npm test              # run all tests once
npm run test:watch    # re-run on file changes
```

Run a single test by name:
```bash
npx vitest run -t "returns true when all activities are completed"
```

## Architecture

All logic lives in `src/ReactStateHelper.js`. There are four classes:

| Class | Role |
|---|---|
| `Activity` | Leaf node — tracks `completed`, `times_entered`, timestamps |
| `Session` | Contains activities; `isCompleted()` iff all activities completed |
| `Module` | Contains sessions; exposes `countCompletedSessions`, `getProgress` |
| `ReactStateHelper` | Public API; holds `#state` (private); navigated via `currentModuleId / currentSessionId / currentActivityId` |

**Navigation model:** before calling most methods the caller must `enterModule → enterSession → enterActivity` in order. These calls record timestamps and increment `times_entered`. Most query methods (`isSessionCompleted`, `countCompletedSessions`, etc.) implicitly use the `currentModuleId` stored in state.

**Serialization:** `toString()` returns the full state as JSON. `loadExistingState(json)` hydrates it back through the class hierarchy (`Module.fromJSON → Session.fromJSON → Activity.fromJSON`). `initDefaultState()` builds a fresh default state.

**Test setup:** `vitest.config.js` lists `src/ReactStateHelper.js` as a `setupFile`, which causes it to execute before every test file and register `ReactStateHelper` as `globalThis.ReactStateHelper`. This mirrors the MobileCoach environment where the class is a plain global — tests therefore import nothing and call `ReactStateHelper` directly.
