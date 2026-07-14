# ReactStateHelper documentation

A plain JavaScript helper for managing hierarchical app state. It helps:

- 👉 navigating the user through the content, which is
    - 🗂️ modules
    - 📑 sessions
    - 🎯 activities
- ✅ tracking completion and progress

Designed to be copy-pasted verbatim into [MobileCoach](https://mobile-coach.eu/), a mobile health platform.

The source lives at [github.com/jmuheim/react-state-helper](https://github.com/jmuheim/react-state-helper).

## Reasoning

**MobileCoach itself is not very dynamic:** its flows are static rule chains, and modelling anything stateful directly in them quickly becomes tedious and error-prone.

By moving the state logic into a single JavaScript snippet, all the "magic trickery" 🪄 (tracking progress, deciding what comes next, building context-sensitive menus) happens there, while the MobileCoach flows only read simple variables and react to them.

## Guides

- 🛠️ **[Developer guide](developer-guide.md)** — architecture, data model, state validation, the MobileCoach setup (variables to declare and the silent-failure gotcha, command cheat-sheet, menu/routing setup), the flow-logic commands (completion booleans, progress numbers, advice text), test setup, and the MobileCoach platform constraints that drive the design.
- ✏️ **[Content editor guide](content-editor-guide.md)** — currently a stub pointing to the developer guide; a new, focused guide for the people defining content in MobileCoach is planned.
- 📋 **[MobileCoach field notes](mobilecoach-field-notes.md)** — hands-on platform knowledge gathered while setting things up in MobileCoach: coach selection, debug coaches, rule regex behavior. Append new insights as they come up.

## Project records

- 📜 **[Decision log](decisions.md)** — append-only, numbered design decisions with their rationale and rejected alternatives.
- ❓ **[Open questions](open-questions.md)** — unresolved design questions, each with its current placeholder and what would settle it.
- 🗒️ **[Backlog](backlog.md)** — intended work not yet started, roughly in sequence; items graduate into the decision log when they ship.
