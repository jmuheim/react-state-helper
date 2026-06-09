# ReactStateHelper

A plain JavaScript helper for managing hierarchical app state (modules → sessions → activities) as JSON. Designed to be copy-pasted verbatim into [MobileCoach](https://www.mobilecoach.com/), a mobile health platform that executes JavaScript snippets.

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
   | `$jsStateHelperMenuLabel1` – `$jsStateHelperMenuLabel9` | Dynamic menu entry labels populated by `populateModuleMenuLabels()` / `populateSessionMenuLabels()` |

The script reads `$jsStateHelperJson` (persisted state from the previous run), executes the command in `$jsStateHelperCmd` (e.g. `markActivityCompleted()`, `isGoodEnough('bouMgt')`), and writes results back to the variables above.

On the very first run (when `$jsStateHelperJson` is `0`), the script initialises fresh default state automatically.