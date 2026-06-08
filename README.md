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
   - `$jsStateHelperCmd`
   - `$jsStateHelperError`
   - `$jsStateHelperJson`
   - `$jsStateHelperResult`
   - `$jsStateHelperStatus`
   - `$jsStateHelperSessionsCompleted`

The script reads `$jsStateHelperJson` (persisted state from the previous run), executes the command in `$jsStateHelperCmd` (e.g. `markActivityCompleted()`, `isGoodEnough('bouMgt')`), and writes results back to the variables above.

On the very first run (when `$jsStateHelperJson` is `0`), the script initialises fresh default state automatically.