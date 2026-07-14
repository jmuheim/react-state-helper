# ReactStateHelper

A plain JavaScript helper for managing hierarchical app state (modules → sessions → activities) as JSON. Designed to be copy-pasted verbatim into [MobileCoach](https://mobile-coach.eu/), a mobile health platform that executes JavaScript snippets.

```
ReactStateHelper
└── modules: Module[]
    └── sessions: Session[]
        └── activities: Activity[]
```

## Documentation

Full documentation is published at **<https://jmuheim.github.io/react-state-helper/>** (source in [`docs/`](docs/), which is the single source of truth):

- [Developer guide](docs/developer-guide.md) — architecture, data model, MobileCoach setup (the variables to declare, the command cheat-sheet, menu/routing setup), the flow-logic commands, and the platform constraints that drive the design.
- [Content editor guide](docs/content-editor-guide.md) — currently a stub pointing to the developer guide; a new, focused content editor guide is planned.
- [Decision log](docs/decisions.md), [open questions](docs/open-questions.md), and [backlog](docs/backlog.md).

## Development

```bash
npm test              # run all tests once
npm run test:watch    # re-run on file changes
```

### Claude Code commands

Project-specific slash commands, defined in [`.claude/commands/`](.claude/commands/):

| Command | What it does | When to use |
|---|---|---|
| `/alt-text` | Writes concise alt text for the image reference on the currently selected line and moves the image into `docs/images/` | After pasting a screenshot into a docs page — select its line first |
| `/commit` | Runs the tests, commits, and on a PR branch brings the PR title and description up to date in the same pass | Every commit (also triggered by asking for a commit in plain words) |
| `/log-decision` | Appends a numbered entry to [`docs/decisions.md`](docs/decisions.md) and propagates it to affected docs | Whenever a design decision is made — before it gets lost in conversation |
| `/push-to-master` | Pushes local master commits directly to origin by temporarily bypassing the `protect-master` ruleset, then restores protection | Small changes (typo/doc fixes) where a PR is overhead |
