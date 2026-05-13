// ReactStateHelper, see https://github.com/jmuheim/react-state-helper
//
// Create the following variables in your MobileCoach project (each with value 0 and access "manageable by service"):
// - $jsStateHelperCmd
// - $jsStateHelperError
// - $jsStateHelperJson
// - $jsStateHelperResult
// - $jsStateHelperStatus
// - $jsStateHelperSessionsCompleted

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
          sessions: [
            { id: "introd",
              title: "Einführung",
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
          sessions: [
            { id: "rolCha",
              title: "Rollenwechsel bewusst vollziehen",
              activities: [
                { id: "somAct", title: "Eine erste Übung", completed: false },
                { id: "othAct", title: "Eine andere Übung", completed: false },
              ]
            },
            { id: "sayNo",
              title: "Nein sagen üben",
              activities: [
                { id: "sayNoAct", title: "Nein sagen Übung", completed: false },
              ]
            },
            { id: "limSet",
              title: "Grenzen setzen",
              activities: [
                { id: "limSetAct", title: "Grenzen setzen Übung", completed: false },
              ]
            },
            { id: "worBou",
              title: "Arbeitliche Grenzen kommunizieren",
              activities: [
                { id: "worBouAct", title: "Arbeitsgrenzen Übung", completed: false },
              ]
            },
            { id: "digDet",
              title: "Digitale Auszeiten einhalten",
              activities: [
                { id: "digDetAct", title: "Digitale Auszeit Übung", completed: false },
              ]
            },
          ],
        },
        {
          id: "emoReg",
          title: "Emotionsregulation",
          entered_first_at: null,
          times_entered: 0,
          sessions: [
            { id: "breCon",
              title: "Bewusstes Atmen",
              activities: [
                { id: "breConAct", title: "Atemübung", completed: false },
              ]
            },
            { id: "bodSca",
              title: "Body-Scan-Übung",
              activities: [
                { id: "bodScaAct", title: "Body-Scan", completed: false },
              ]
            },
            { id: "jouWri",
              title: "Tagebuch schreiben",
              activities: [
                { id: "jouWriAct", title: "Tagebucheintrag", completed: false },
              ]
            },
            { id: "proRel",
              title: "Progressive Muskelentspannung",
              activities: [
                { id: "proRelAct", title: "Entspannungsübung", completed: false },
              ]
            },
          ],
        },
      ],
      suggestionSeen: false,
      currentModuleId: null,
      currentSessionId: null,
      currentActivityId: null,
    };
  }

  toString() {
    return JSON.stringify(this.#state);
  }

  markActivityCompleted(moduleId, sessionId, activityId) {
    this.#findActivityIn(moduleId, sessionId, activityId).completed = true;
  }

  isSessionCompleted(moduleId, sessionId) {
    const session = this.#findModule(moduleId).sessions.find(s => s.id === sessionId);
    return this.#isSessionDone(session);
  }

  countCompletedInModule(moduleId) {
    return this.#findModule(moduleId).sessions.filter(s => this.#isSessionDone(s)).length;
  }

  countCompletedOverall() {
    return this.#state.modules.flatMap(m => m.sessions).filter(s => this.#isSessionDone(s)).length;
  }

  // Returns a value between 0 and 1
  getProgress() {
    const all = this.#state.modules.flatMap(m => m.sessions);
    if (all.length === 0) return 0;
    return all.filter(s => this.#isSessionDone(s)).length / all.length;
  }

  // Returns a value between 0 and 1 for the given module
  getModuleProgress(moduleId) {
    const sessions = this.#findModule(moduleId).sessions;
    if (sessions.length === 0) return 0;
    return sessions.filter(s => this.#isSessionDone(s)).length / sessions.length;
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

  enterModule(moduleId) {
    const module = this.#findModule(moduleId);
    if (!module) throw new Error('Module ' + moduleId + ' not found');
    this.#state.currentModuleId = moduleId;
    if (!module.entered_first_at) module.entered_first_at = new Date().toISOString();
    module.times_entered++;
  }

  enterSession(sessionId) {
    this.#state.currentSessionId = this.#findSession(sessionId).id;
  }

  enterActivity(activityId) {
    this.#state.currentActivityId = this.#findActivity(activityId).id;
  }

  getParticipantGroup() {
    const { currentModuleId, currentSessionId } = this.#state;
    if (!currentModuleId || !currentSessionId) return null;
    return currentModuleId + ': ' + currentSessionId;
  }

  allCompletedSessionsAsCsv() {
    return this.#state.modules
      .flatMap(m => m.sessions)
      .filter(s => this.#isSessionDone(s))
      .map(s => s.id)
      .join(',');
  }

  // A session is done when it has at least one activity and all activities are completed.
  #isSessionDone(session) {
    return session.activities.length > 0 && session.activities.every(a => a.completed);
  }

  #findModule(moduleId) {
    return this.#state.modules.find(m => m.id === moduleId);
  }

  #findSession(sessionId) {
    if (!this.#state.currentModuleId) throw new Error('No module entered yet');
    const session = this.#findModule(this.#state.currentModuleId).sessions.find(s => s.id === sessionId);
    if (!session) throw new Error('Session ' + sessionId + ' not found in module ' + this.#state.currentModuleId);
    return session;
  }

  #findActivity(activityId) {
    if (!this.#state.currentSessionId) throw new Error('No session entered yet');
    const activity = this.#findSession(this.#state.currentSessionId).activities.find(a => a.id === activityId);
    if (!activity) throw new Error('Activity ' + activityId + ' not found in session ' + this.#state.currentSessionId);
    return activity;
  }

  #findActivityIn(moduleId, sessionId, activityId) {
    const mod = this.#findModule(moduleId);
    if (!mod) throw new Error('Module ' + moduleId + ' not found');
    const session = mod.sessions.find(s => s.id === sessionId);
    if (!session) throw new Error('Session ' + sessionId + ' not found in module ' + moduleId);
    const activity = session.activities.find(a => a.id === activityId);
    if (!activity) throw new Error('Activity ' + activityId + ' not found in session ' + sessionId);
    return activity;
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
  // - $jsStateHelperCmd = "isSessionCompleted('bouMgt', 'rolCha')"
  // - $jsStateHelperCmd = "markActivityCompleted('bouMgt', 'rolCha', 'somAct')"
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
    jsStateHelperJson:              helper.toString(),
    jsStateHelperResult:            result,
    jsStateHelperStatus:            status,
    jsStateHelperError:             error || 'none', // TODO: Möglichst viel weitere nützliche Infos rein-dumpen!
    jsStateHelperSessionsCompleted: helper.allCompletedSessionsAsCsv(),
    participantGroup:               helper.getParticipantGroup()
  };
  o
}
