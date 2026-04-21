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

The JavaScript will be run in a MobileCoach environment. MobileCoach is a mobile health app platform that allows the execution of JavaScript snippets (we will copy+paste ReactStateHelper's content into it).

MobileCoach offers $variables that can be placed inside the JavaScript like so:

```
console.log($aMobileCoachVariable); // Will be interpolated with the value of the variable and then be executed as JavaScript
```

And MobileCoach offers the following way to return data from JavaScript and store it to MobileCoach variables:

```
let o = {};

o = {
  someVariableName: "someValue" // The key will become $someVariableName with value "someValue"
};

o // Will be returned at the end of the script
```

## Copy-pasting into MobileCoach

Copy the full contents of `src/ReactStateHelper.js` into MobileCoach and uncomment the template at the bottom of the file.