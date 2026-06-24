# ReactStateHelper

A plain JavaScript helper for managing hierarchical app state (modules → sessions → activities) as JSON. Designed to be copy-pasted verbatim into [MobileCoach](https://www.mobilecoach.com/), a mobile health platform that executes JavaScript snippets.

## Data model

State is a JSON tree managed by four classes in `src/ReactStateHelper.js`:

```
ReactStateHelper
└── modules: Module[]
    └── sessions: Session[]
        └── activities: Activity[]
```

| Class | Fields (beyond `id`/`title`/`entered_first_at`/`entered_last_at`/`times_entered`) | Notes |
|---|---|---|
| `Module` | `sessions_needed_for_adequate_use`, `sessions[]` | Top-level grouping, e.g. "Boundary Management" |
| `Session` | `activities_needed_for_adequate_use`, `activities[]`, `isIntro` | `isIntro: true` marks a session that has no activities by design (e.g. an introduction); every other session must have at least one activity |
| `Activity` | `completed` | Leaf node; flips to `true` via `markActivityCompleted()` |

- **Completion**: an `Activity` is completed once marked. A `Session` is completed if it has at least one activity and all of them are completed. A `Module` is completed if all of its sessions that have activities are completed (intro sessions don't count either way).
- **Adequate progress**: a softer bar than full completion — a `Module`/`Session` "has adequate progress" once `sessions_needed_for_adequate_use`/`activities_needed_for_adequate_use` of its children are completed, even if not all of them are. Used to decide e.g. whether to nudge the participant onward instead of insisting they finish everything.
- **IDs**: must be unique across the *entire* state, not just within their parent, and are conventionally prefixed by level — `m_` for modules, `s_` for sessions, `a_` for activities (e.g. `m_bouMgt`, `s_gesGre`, `a_rolGes`) — see `CLAUDE.md` for why. Loading state validates this and other structural invariants (unachievable thresholds, more than 9 sessions/activities in one collection, a module with no sessions, a module with no non-intro session, a non-intro session with no activities) and throws immediately on a violation.
- **Navigation**: before most methods can be called, the helper must be told where the participant currently is via `enterModule(id)` → `enterSession(id)` → `enterActivity(id)`, which also records `entered_first_at`/`entered_last_at`/`times_entered` on the way in.

## Development

```bash
npm test              # run all tests once
npm run test:watch    # re-run on file changes
```

## MobileCoach deployment

1. Copy the full contents of `src/ReactStateHelper.js` as-is into MobileCoach.
2. Create the following variables in your MobileCoach project (each with value `0`, access "manageable by service"):
   | Variable | Purpose |
   |---|---|
   | `$jsStateHelperCmd` | Command to execute, e.g. `markActivityCompleted()` (set this before each script run) |
   | `$jsStateHelperJson` | Full serialized state, persisted between runs |
   | `$jsStateHelperResult` | Return value of the last command |
   | `$jsStateHelperStatus` | `success` or `error` |
   | `$jsStateHelperError` | Error message if status is `error`, otherwise `none` |
   | `$jsStateHelperSessionsCompleted` | Comma-separated list of all completed session IDs across all modules |
   | `$jsStateHelperMenuLabel1` – `$jsStateHelperMenuLabel9` | Dynamic menu entry labels populated by `populateMenuLabelsForModule()` / `populateMenuLabelsForSession()` / `populateMenuLabelsForActivity()` |
   | `$participantGroup` | `"<currentModuleId>: <currentSessionId>"` once navigated, otherwise `null` — populated by `getParticipantGroup()`, intended for participant segmentation |

The script reads `$jsStateHelperJson` (persisted state from the previous run), executes the command in `$jsStateHelperCmd` (e.g. `markActivityCompleted()`, `isGoodEnough('m_bouMgt')`, `getProgressAdvice()`), and writes results back to the variables above — the command's return value always goes to `$jsStateHelperResult`, regardless of which command was run.

Menu labels and `getProgressAdvice()` text are prefixed with an emoji from the `#MENU_EMOJIS` map in `src/ReactStateHelper.js`:

| Key | Emoji | Used for |
|---|---|---|
| `completed` | ✅ | a completed item in a menu, and prefixed to the current level's name in `getProgressAdvice()` |
| `next` | 👉 | the first not-yet-completed item in a menu (menus only) |
| `module` | 🗂️ | module references in `getProgressAdvice()` |
| `session` | 📑 | session references in `getProgressAdvice()` |
| `activity` | 🎯 | activity references in `getProgressAdvice()` |

Menu items that are neither completed nor the next one get no emoji prefix.

On the very first run (when `$jsStateHelperJson` is `0`), the script initialises fresh default state automatically.