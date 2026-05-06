// ReactStateHelper, see https://github.com/jmuheim/react-state-helper
//
// Create the following variables in your MobileCoach project (each with value 0 and access "manageable by service"):
// - $jsStateHelperCmd
// - $jsStateHelperError
// - $jsStateHelperJson
// - $jsStateHelperResult
// - $jsStateHelperStatus
// - $jsStateHelperTasksCompleted

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
          id: "onboard",
          title: "Onboarding",
          entered_first_at: null,
          times_entered: 0,
          tasks: [
            { id: "introd",
              title: "Einführung",
              completed: false,
              activities: [
                { id: "globGoal", title: "Globales Ziel definieren", completed: false },
                { id: "howEdu", title: "Psychoedukation: wie bewandert...?", completed: false },
              ]
            },
          ],
        },
        {
          id: "bouMgt",
          title: "Boundary Management",
          entered_first_at: null,
          times_entered: 0,
          tasks: [
            { id: "rolCha",
              title: "Rollenwechsel bewusst vollziehen",
              completed: false,
              activities: [
                { id: "somAct", title: "Eine erste Übung", completed: false },
                { id: "othAct", title: "Eine andere Übung", completed: false },
              ]
            },
            { id: "sayNo",
              title: "Nein sagen üben",
              completed: false,
              activities: []
            },
            { id: "limSet",
              title: "Grenzen setzen",
              completed: false,
              activities: []
            },
            { id: "worBou",
              title: "Arbeitliche Grenzen kommunizieren",
              completed: false,
              activities: []
            },
            { id: "digDet",
              title: "Digitale Auszeiten einhalten",
              completed: false,
              activities: []
            },
          ],
        },
        {
          id: "emoReg",
          title: "Emotionsregulation",
          entered_first_at: null,
          times_entered: 0,
          tasks: [
            { id: "breCon",
              title: "Bewusstes Atmen",
              completed: false,
              activities: []
            },
            { id: "bodSca",
              title: "Body-Scan-Übung",
              completed: false,
              activities: []
            },
            { id: "jouWri",
              title: "Tagebuch schreiben",
              completed: false,
              activities: []
            },
            { id: "proRel",
              title: "Progressive Muskelentspannung",
              completed: false,
              activities: []
            },
          ],
        },
      ],
      suggestionSeen: false,
      currentModuleId: null,
      currentTaskId: null,
      currentActivityId: null,
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

  enterTask(moduleId, taskId) {
    this.#state.currentModuleId = moduleId;
    this.#state.currentTaskId = taskId;
    const module = this.#findModule(moduleId);
    if (!module.entered_first_at) module.entered_first_at = new Date().toISOString();
    module.times_entered++;
  }

  getParticipantGroup() {
    const { currentModuleId, currentTaskId } = this.#state;
    if (!currentModuleId || !currentTaskId) return null;
    return currentModuleId + ': ' + currentTaskId;
  }

  allCompletedTasksAsCsv() {
    return this.#state.modules
      .flatMap(m => m.tasks)
      .filter(t => t.completed)
      .map(t => t.id)
      .join(',');
  }

  #findModule(moduleId) {
    return this.#state.modules.find(m => m.id === moduleId);
  }

  #findTask(moduleId, taskId) {
    return this.#findModule(moduleId).tasks.find(t => t.id === taskId);
  }
}

// Expose as a global so tests can use it without an import (matching MobileCoach's plain-script environment)
globalThis.ReactStateHelper = ReactStateHelper;

// The following code should only be executed inside MobileCoach!
// For this we examine `process`, which is a Node.js global and thus absent in MobileCoach.
if (typeof process === 'undefined') {
  // $jsStateHelperJson is a MobileCoach variable interpolated into this script before execution.
  // It holds the JSON serialized state from the previous run, or anything else on the very first run.
  const jsStateHelperJson = '$jsStateHelperJson';

  // Initialises the helper with the state from the previous run (if $jsStateHelperJson contains valid JSON);
  // otherwise initialise default state (fresh start of the app).
  let helper;
  try {
    if (jsStateHelperJson === '0') throw new Error(); // MobileCoach default for uninitialised variables
    JSON.parse(jsStateHelperJson);
    helper = ReactStateHelper.loadExistingState(jsStateHelperJson);
  } catch {
    helper = ReactStateHelper.initDefaultState();
  }

  // Inside MobileCoach, before calling ReactStateHelper, set $jsStateHelperCmd to the command you'd like to execute, e.g.
  // - $jsStateHelperCmd = "isTaskCompleted('bouMgt', 'sayNo')"
  // - $jsStateHelperCmd = "markTaskCompleted('bouMgt', 'sayNo')"
  // - $jsStateHelperCmd = "countCompletedInModule('bouMgt')"
  // - $jsStateHelperCmd = "isGoodEnough('bouMgt')"
  // - $jsStateHelperCmd = "getModuleProgress('bouMgt')"
  // Please be extra careful! Typos or syntax errors will break this!
  let result, status, error;
  try {
    result = eval(`helper.$jsStateHelperCmd`);
    status = 'success';
  } catch (e) { // If there's any error, details about it can be inspected through $jsStateHelperError
    status = 'error';
    error = e.message;
  }

  let o = {
    // MobileCoach will save these elements to corresponding variables,
    // i.e. jsStateHelperJson becomes $jsStateHelperJson.
    jsStateHelperJson:           helper.toString(),
    jsStateHelperResult:         result,
    jsStateHelperStatus:         status,
    jsStateHelperError:          error || 'none', // TODO: Möglichst viel weitere nützliche Infos rein-dumpen!
    jsStateHelperTasksCompleted: helper.allCompletedTasksAsCsv(),
    participantGroup:            helper.getParticipantGroup()
  };
  o
}
