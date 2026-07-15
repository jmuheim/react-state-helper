## What / Why



## Checklist

- [ ] New/changed behavior has tests; `npm test` is green.
- [ ] Any new wrapper variable is added to the variable table in `docs/maintainer-guide.md` **and** declared in MobileCoach (default value `0`, access "manageable by service") before deploy.
- [ ] `src/ReactStateHelper.js` is still one self-contained script (no `import`/`export`).
- [ ] README / CLAUDE.md / docs pages / `docs/decisions.md` are updated wherever this change makes them stale; new design choices are logged via `/log-decision`.
- [ ] PR title and description re-read against the final diff.
