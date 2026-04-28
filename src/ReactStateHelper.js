// ReactStateHelper, see https://github.com/jmuheim/react-state-helper

// Copy and paste the following code into MobileCoach and uncomment the code at the end!
class ReactStateHelper {
  #state;

  static initDefaultState() {
    const helper = new this();
    helper.#state = this.initialState();
    return helper;
  }

  static loadExistingState(json) {
    const helper = new this();
    helper.#state = JSON.parse(json);
    return helper;
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
            { id: "limSet", title: "Grenzen setzen",                   completed: false },
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

  // Returns a value between 0 and 1 for the given module
  getModuleProgress(moduleId) {
    const tasks = this.#findModule(moduleId).tasks;
    if (tasks.length === 0) return 0;
    return tasks.filter(t => t.completed).length / tasks.length;
  }

  isGoodEnough(moduleId) {
    return this.countCompletedInModule(moduleId) >= 3;
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

// The following code should only be executed inside MobileCoach!
//
// For this we examine `process`, which is a Node.js global absent in MobileCoach.
if (typeof process === 'undefined') {
  // $jsStateHelperJson is a MobileCoach variable interpolated into this script before execution.
  // It holds the serialized state from the previous run, or empty string on the very first run.
  const jsStateHelperJson = '$jsStateHelperJson';

  // Initialises the helper with the state from the previous run ($jsStateHelperJson in MobileCoach);
  // otherwise initialise default state (fresh start of the app).
  const helper = jsStateHelperJson == 'not-yet-initialised' ? ReactStateHelper.initDefaultState() : ReactStateHelper.loadExistingState(jsStateHelperJson);

  // Inside MobileCoach, before calling ReactStateHelper, set $jsStateHelperCmd to the command you'd like to execute, e.g.
  // - $jsStateHelperCmd = "isTaskCompleted('bouMgt', 'sayNo')"
  // - $jsStateHelperCmd = "markTaskCompleted('bouMgt', 'sayNo')"
  // - $jsStateHelperCmd = "countCompletedInModule('bouMgt')"
  // - $jsStateHelperCmd = "isGoodEnough('bouMgt')"
  // - $jsStateHelperCmd = "getModuleProgress('bouMgt')"
  // Please be extra careful! Typos or syntax errors will break this!
  const result = eval(`helper.$jsStateHelperCmd`);

  let o = {
    jsStateHelperJson:   helper.toString(),  // Save state to MobileCoach as $jsStateHelperJson
    jsStateHelperResult: result,             // Save command result to MobileCoach as $jsStateHelperResult
  };
  o
}
