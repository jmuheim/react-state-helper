// Copy and paste the following code into MobileCoach and uncomment the code at the end!
class ReactStateHelper {
  #state;

  static fromString(json) {
    const helper = new ReactStateHelper();
    helper.#state = ReactStateHelper.#initOrLoadExistingState(json);
    return helper;
  }

  static #initOrLoadExistingState(json) {
    // String content available, restore saved state!
    if (json && json.trim()) {
      return JSON.parse(json);

    // Very first app start: no string content available, so start fresh with the default state!
    } else {
      return ReactStateHelper.initialState();
    }
  }

  static initialState() {
    return {
      modules: [
        {
          id: "bouMgt",
          title: "Boundary Management",
          tasks: [
            { id: "rolCha", title: "Rollenwechsel bewusst vollziehen", completed: false },
            { id: "sayNo",  title: "Nein sagen üben",                  completed: false },
          ],
        },
        {
          id: "emoReg",
          title: "Emotionsregulation",
          tasks: [
            { id: "breCon", title: "Bewusstes Atmen", completed: false },
          ],
        },
      ],
      suggestionSeen: false,
    };
  }

  toString() {
    return JSON.stringify(this.#state);
  }

  markTaskCompleted(moduleId, taskId) {
    this.#findTask(moduleId, taskId).completed = true;
  }

  isTaskCompleted(moduleId, taskId) {
    return this.#findTask(moduleId, taskId).completed === true;
  }

  countCompletedInModule(moduleId) {
    return this.#findModule(moduleId).tasks.filter(t => t.completed).length;
  }

  countCompletedOverall() {
    return this.#state.modules.flatMap(m => m.tasks).filter(t => t.completed).length;
  }

  // Returns a value between 0 and 1
  getProgress() {
    const all = this.#state.modules.flatMap(m => m.tasks);
    if (all.length === 0) return 0;
    return all.filter(t => t.completed).length / all.length;
  }

  isGoodEnough() {
    return this.countCompletedOverall() >= 3;
  }

  markSuggestionSeen() {
    if (!this.#state.suggestionSeen) {
      this.#state.suggestionSeen = true;
    }
  }

  isSuggestionSeen() {
    return this.#state.suggestionSeen === true;
  }

  #findModule(moduleId) {
    return this.#state.modules.find(m => m.id === moduleId);
  }

  #findTask(moduleId, taskId) {
    return this.#findModule(moduleId).tasks.find(t => t.id === taskId);
  }
}

globalThis.ReactStateHelper = ReactStateHelper;

// UNCOMMENT FROM HERE when copy+pasting to MobileCoach!
// const helper = ReactStateHelper.fromString('$stateJson');
// helper.markTaskCompleted('chapter1', 'video');
// let o = {
//   stateJson: helper.toString() // Saved to MobileCoach as $stateJson
// };
// UNCOMMENT UNTIL HERE when copy+pasting to MobileCoach!
