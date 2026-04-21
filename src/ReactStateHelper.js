// Copy and paste the following code into MobileCoach EXCEPT the last line `export { ... }`!
class ReactStateHelper {
  #state;

  static fromString(json) {
    const helper = new ReactStateHelper();
    helper.#state = JSON.parse(json);
    return helper;
  }

  toString() {
    return JSON.stringify(this.#state);
  }

  markTaskCompleted(moduleId, taskId) {
    this.#state.modules[moduleId].tasks[taskId].completed = true;
  }

  isTaskCompleted(moduleId, taskId) {
    return this.#state.modules[moduleId].tasks[taskId].completed === true;
  }

  countCompletedInModule(moduleId) {
    return Object.values(this.#state.modules[moduleId].tasks)
      .filter(t => t.completed).length;
  }

  countCompletedOverall() {
    return Object.values(this.#state.modules)
      .flatMap(m => Object.values(m.tasks))
      .filter(t => t.completed).length;
  }

  // Returns a value between 0 and 1
  getProgress() {
    const all = Object.values(this.#state.modules)
      .flatMap(m => Object.values(m.tasks));
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
}

// Ignore this line when copying into MobileCoach!
export { ReactStateHelper };
