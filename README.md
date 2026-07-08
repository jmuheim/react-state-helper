# ReactStateHelper

A plain JavaScript helper for managing hierarchical app state (modules → sessions → activities) as JSON. Designed to be copy-pasted verbatim into [MobileCoach](https://www.mobilecoach.com/), a mobile health platform that executes JavaScript snippets.

```
ReactStateHelper
└── modules: Module[]
    └── sessions: Session[]
        └── activities: Activity[]
```

## Documentation

Full documentation is published at **<https://jmuheim.github.io/react-state-helper/>** (source in [`docs/`](docs/), which is the single source of truth):

- [Content editor guide](docs/content-editor-guide.md) — MobileCoach setup, the variables to declare, the command cheat-sheet, and menu/routing setup. Start here to deploy.
- [Developer guide](docs/developer-guide.md) — architecture, data model, and the MobileCoach platform constraints that drive the design.
- [Decision log](docs/decisions.md) and [open questions](docs/open-questions.md).

## Development

```bash
npm test              # run all tests once
npm run test:watch    # re-run on file changes
```
