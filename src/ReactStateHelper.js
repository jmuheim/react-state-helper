// ReactStateHelper, see https://github.com/jmuheim/react-state-helper
//
// Create the following variables in your MobileCoach project (each with value 0 and access "manageable by service"):
// - $jsStateHelperCmd
// - $jsStateHelperError
// - $jsStateHelperJson
// - $jsStateHelperResult
// - $jsStateHelperStatus

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
          entered_first_at: null,
          times_entered: 0,
          tasks: [
            { id: "rolCha", title: "Rollenwechsel bewusst vollziehen",  completed: false },
            { id: "sayNo",  title: "Nein sagen üben",                   completed: false },
            { id: "limSet", title: "Grenzen setzen",                    completed: false },
            { id: "worBou", title: "Arbeitliche Grenzen kommunizieren", completed: false },
            { id: "digDet", title: "Digitale Auszeiten einhalten",      completed: false },
          ],
        },
        {
          id: "emoReg",
          title: "Emotionsregulation",
          entered_first_at: null,
          times_entered: 0,
          tasks: [
            { id: "breCon", title: "Bewusstes Atmen",               completed: false },
            { id: "bodSca", title: "Body-Scan-Übung",               completed: false },
            { id: "jouWri", title: "Tagebuch schreiben",            completed: false },
            { id: "proRel", title: "Progressive Muskelentspannung", completed: false },
          ],
        },
        {
          id: "strMgt",
          title: "Stressmanagement",
          entered_first_at: null,
          times_entered: 0,
          tasks: [
            { id: "priSet", title: "Prioritäten setzen",       completed: false },
            { id: "timBlo", title: "Time-Blocking einsetzen",  completed: false },
            { id: "breRou", title: "Pausenroutine etablieren", completed: false },
            { id: "staTec", title: "STOPP-Technik anwenden",   completed: false },
            { id: "delTas", title: "Aufgaben delegieren",      completed: false },
          ],
        },
        {
          id: "timMgt",
          title: "Zeitmanagement",
          entered_first_at: null,
          times_entered: 0,
          tasks: [
            { id: "morRou", title: "Morgenroutine einhalten",     completed: false },
            { id: "todLis", title: "Tagesliste erstellen",        completed: false },
            { id: "twoMin", title: "Zwei-Minuten-Regel anwenden", completed: false },
            { id: "disApp", title: "Ablenkungen reduzieren",      completed: false },
            { id: "batTas", title: "Aufgaben bündeln",            completed: false },
            { id: "eveRev", title: "Tagesabschluss-Review",       completed: false },
          ],
        },
        {
          id: "comSkl",
          title: "Kommunikation",
          entered_first_at: null,
          times_entered: 0,
          tasks: [
            { id: "actLis", title: "Aktives Zuhören üben",         completed: false },
            { id: "iStaMe", title: "Ich-Botschaften verwenden",    completed: false },
            { id: "conFee", title: "Konstruktives Feedback geben", completed: false },
            { id: "claExp", title: "Erwartungen klären",           completed: false },
          ],
        },
        {
          id: "selCar",
          title: "Selbstfürsorge",
          entered_first_at: null,
          times_entered: 0,
          tasks: [
            { id: "regSle", title: "Regelmäßigen Schlaf sichern", completed: false },
            { id: "nutEat", title: "Ausgewogen ernähren",         completed: false },
            { id: "phyAct", title: "Körperliche Aktivität",       completed: false },
            { id: "socCon", title: "Soziale Kontakte pflegen",    completed: false },
            { id: "hobTim", title: "Zeit für Hobbys einplanen",   completed: false },
          ],
        },
        {
          id: "minFul",
          title: "Achtsamkeit",
          entered_first_at: null,
          times_entered: 0,
          tasks: [
            { id: "medPra", title: "Meditationspraxis etablieren",  completed: false },
            { id: "preMom", title: "Präsente Momente wahrnehmen",   completed: false },
            { id: "graPra", title: "Dankbarkeitspraxis",            completed: false },
            { id: "sinTas", title: "Single-Tasking üben",           completed: false },
          ],
        },
        {
          id: "worBal",
          title: "Work-Life-Balance",
          entered_first_at: null,
          times_entered: 0,
          tasks: [
            { id: "offHou", title: "Feste Offline-Zeiten einhalten", completed: false },
            { id: "vacPla", title: "Urlaub aktiv planen",            completed: false },
            { id: "perPro", title: "Persönliche Projekte verfolgen", completed: false },
            { id: "famTim", title: "Familienzeit schützen",          completed: false },
            { id: "aftWor", title: "Feierabend-Ritual etablieren",   completed: false },
            { id: "recAct", title: "Erholungsaktivitäten einplanen", completed: false },
          ],
        },
        {
          id: "relBld",
          title: "Beziehungsgestaltung",
          entered_first_at: null,
          times_entered: 0,
          tasks: [
            { id: "truBld", title: "Vertrauen aufbauen",           completed: false },
            { id: "conRes", title: "Konflikte konstruktiv lösen",  completed: false },
            { id: "supSek", title: "Unterstützung annehmen",       completed: false },
            { id: "netAct", title: "Netzwerk aktiv pflegen",       completed: false },
            { id: "appExr", title: "Wertschätzung ausdrücken",     completed: false },
          ],
        },
        {
          id: "resStr",
          title: "Resilienz",
          entered_first_at: null,
          times_entered: 0,
          tasks: [
            { id: "proMin", title: "Wachstumsorientiertes Denken",  completed: false },
            { id: "failLe", title: "Aus Fehlern lernen",            completed: false },
            { id: "supSys", title: "Unterstützungssystem aufbauen", completed: false },
            { id: "purSen", title: "Sinn und Zweck reflektieren",   completed: false },
            { id: "adaCha", title: "Anpassungsfähigkeit üben",      completed: false },
            { id: "selEff", title: "Selbstwirksamkeit stärken",     completed: false },
            { id: "optPra", title: "Optimismus praktizieren",       completed: false },
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
    jsStateHelperJson:   helper.toString(),
    jsStateHelperResult: result,
    jsStateHelperStatus: status,
    jsStateHelperError:  error || 'none',
  };
  o
}
