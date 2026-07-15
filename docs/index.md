# ReactStateHelper documentation

A plain JavaScript helper for managing hierarchical app state. It helps:

- 👉 navigating the user through the content, which is
    - 🗂️ modules
    - 📑 sessions
    - 🎯 activities
- ✅ tracking completion and progress

Designed to be copy-pasted verbatim into [MobileCoach](https://mobile-coach.eu/), a mobile health platform.

Developed by Josua Muheim (during module "F14 - Projektbezogenes Arbeiten"), supported by [Claude.ai](https://claude.ai/). The source lives at [github.com/jmuheim/react-state-helper](https://github.com/jmuheim/react-state-helper).

REACT project owners: Sandra Ulrich and Pascal Streule, ZHAW.

## Reasoning

**MobileCoach itself is not very dynamic:** its flows are static rule chains, and modelling anything stateful directly in them (using variables) quickly becomes tedious and error-prone.

By moving the state logic into a single JavaScript snippet, all the "magic trickery" 🪄 (tracking progress, deciding what comes next, building context-sensitive menus) happens there, while the MobileCoach flows only read simple variables and react to them.

## Guides

- 🛠️ **[MobileCoach Admin guide](mobilecoach-admin-guide.md)** — for MobileCoach Admins, who change the app content and keep the project in sync: architecture, data model, state validation, the MobileCoach setup (variables, commands, menu routing), common tasks, tests, and troubleshooting.
    - Also read 🧱 **[MobileCoach platform constraints](mobilecoach-platform-constraints.md)** — the platform's restrictions (self-contained script, pre-declared variables, `$`-scan on save, JSON-only persistence, eval dispatch, static menus) that drive most design decisions.
- ✏️ **[MobileCoach Author guide](mobilecoach-author-guide.md)** — currently a stub pointing to the MobileCoach Admin guide; a new, focused guide for the MobileCoach Authors, who fill the created dialogs with content, is planned.
    - Also read 📋 **[MobileCoach field notes](mobilecoach-field-notes.md)** — hands-on platform knowledge gathered while setting things up in MobileCoach: coach selection, debug coaches, rule regex behavior. Append new insights as they come up.
- 💻 **JavaScript Developers** — there is deliberately no separate guide: the code internals are documented in [`src/ReactStateHelper.js`](https://github.com/jmuheim/react-state-helper/blob/master/src/ReactStateHelper.js) itself, right where they live.

## Project records

- 📜 **[Decision log](decisions.md)** — append-only, numbered design decisions with their rationale and rejected alternatives.
- ❓ **[Open questions](open-questions.md)** — unresolved design questions, each with its current placeholder and what would settle it.
- 🗒️ **[Backlog](backlog.md)** — intended work not yet started, roughly in sequence; items graduate into the decision log when they ship.
