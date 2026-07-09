# MobileCoach field notes

Practical platform knowledge gathered while setting the library up in MobileCoach. Unlike the [platform constraints in the developer guide](developer-guide.md#mobilecoach--pathmate-platform-constraints) — which drive the library's design — these notes are hands-on observations about working in the MobileCoach editor itself. Append new insights as they come up.

## Coach selection and debug coaches

When starting a session, the participant chooses a **coach**. The chosen coach's name is available to rules via the `$coachName` variable.

We use specially named coaches to show debugging info in the flow:

- `DEBUGGER` — general debug coach
- `DEBUGGER_<initial>` — one per developer, e.g. `DEBUGGER_P` (Pascal), `DEBUGGER_J` (Josua)

Flows branch on `$coachName` to decide whether to display debugging output.

## Micro dialog message rules

A rule consists of:

- **Comment** — free-text label for the rule (e.g. "If Debugger")
- **Rule [x] (with placeholders)** — the value to test, e.g. `$coachName`
- an operator dropdown, e.g. "text value matches regular expression" / "text value not matches regular expression"
- **Comparison term [y] (with placeholders)** — the value or pattern to compare against

![Rule editing dialog with regular expression match for DEBUGGER.*](images/micro-dialog-message-rule-debugger.jpg)

### Regex matching

To match all debug coaches (see above), the comparison term is the regex `DEBUGGER.*` — confirmed working against `DEBUGGER_J` (2026-07-09).

Notes on regex behavior:

- Use a trailing `.*` for prefix matches. MobileCoach is Java-based and regex rules appear to use full-match semantics (like Java's `String.matches()`), where a bare prefix such as `DEBUGGER_` would *not* match `DEBUGGER_J` because the regex must consume the entire value.
- Case sensitivity is untested — all coach names in use are uppercase, so it hasn't mattered yet. If a case mismatch ever comes up, try prefixing the regex with `(?i)`.
