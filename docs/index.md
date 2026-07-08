# ReactStateHelper documentation

A plain JavaScript helper for managing hierarchical app state (modules → sessions → activities) as JSON. Designed to be copy-pasted verbatim into [MobileCoach](https://mobile-coach.eu/), a mobile health platform that executes JavaScript snippets. The source lives at [github.com/jmuheim/react-state-helper](https://github.com/jmuheim/react-state-helper).

## Guides

- **[Content editor guide](content-editor-guide.md)** — for the people defining modules, sessions, and activities in MobileCoach: id conventions, the variables to declare (and the silent-failure gotcha), the command cheat-sheet, and menu/routing setup. No JavaScript knowledge required.
- **[Developer guide](developer-guide.md)** — architecture, data model, state validation, test setup, and the MobileCoach platform constraints that drive the design.

## Project records

- **[Decision log](decisions.md)** — append-only, numbered design decisions with their rationale and rejected alternatives.
- **[Open questions](open-questions.md)** — unresolved design questions, each with its current placeholder and what would settle it.
