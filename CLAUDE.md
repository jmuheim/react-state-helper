Create a small JavaScript library project called ReactStateHelper.

Context:
- This is not a React UI project.
- It is a plain JavaScript helper for managing app state stored as JSON.
- The state is passed as JSON string when initialising ReactStateHelper.
- The helper should manipulate the state in memory, and then serialize it back to JSON.

Requirements:
- Use modern JavaScript with ES modules
- Use Vitest for unit tests
- Create:
  - src/ReactStateHelper.js
  - test/ReactStateHelper.test.js
- Implement methods for:
  - loading state from string
  - exporting state to string
  - marking tasks completed
  - checking whether a task is completed
  - counting completed tasks in a module
  - counting completed tasks overall
  - calculating progress
  - checking the "good enough" rule (>= 3 tasks completed)
  - marking suggestionSeen only once
- Add clear unit tests
- Keep the implementation framework-agnostic and easy to port into MobileCoach