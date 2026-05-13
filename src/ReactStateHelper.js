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
class Activity {
  constructor({ id, title, entered_first_at = null, entered_last_at = null, times_entered = 0, completed = false }) {
    this.id = id;
    this.title = title;
    this.entered_first_at = entered_first_at;
    this.entered_last_at = entered_last_at;
    this.times_entered = times_entered;
    this.completed = completed;
  }

  enter() {
    const now = new Date().toISOString();
    if (!this.entered_first_at) this.entered_first_at = now;
    this.entered_last_at = now;
    this.times_entered++;
  }

  markCompleted() {
    this.completed = true;
  }

  isCompleted() {
    return this.completed;
  }

  toJSON() {
    return { id: this.id, title: this.title, entered_first_at: this.entered_first_at, entered_last_at: this.entered_last_at, times_entered: this.times_entered, completed: this.completed };
  }

  static fromJSON(obj) {
    return new Activity(obj);
  }
}

class Session {
  constructor({ id, title, entered_first_at = null, entered_last_at = null, times_entered = 0, activities = [] }) {
    this.id = id;
    this.title = title;
    this.entered_first_at = entered_first_at;
    this.entered_last_at = entered_last_at;
    this.times_entered = times_entered;
    this.activities = activities;
  }

  enter() {
    const now = new Date().toISOString();
    if (!this.entered_first_at) this.entered_first_at = now;
    this.entered_last_at = now;
    this.times_entered++;
  }

  isCompleted() {
    return this.activities.length > 0 && this.activities.every(a => a.isCompleted());
  }

  findActivity(activityId) {
    return this.activities.find(a => a.id === activityId);
  }

  toJSON() {
    return { id: this.id, title: this.title, entered_first_at: this.entered_first_at, entered_last_at: this.entered_last_at, times_entered: this.times_entered, activities: this.activities };
  }

  static fromJSON({ id, title, entered_first_at, entered_last_at, times_entered, activities }) {
    return new Session({ id, title, entered_first_at, entered_last_at, times_entered, activities: activities.map(a => Activity.fromJSON(a)) });
  }
}

class Module {
  constructor({ id, title, sessions = [], entered_first_at = null, entered_last_at = null, times_entered = 0 }) {
    this.id = id;
    this.title = title;
    this.entered_first_at = entered_first_at;
    this.entered_last_at = entered_last_at;
    this.times_entered = times_entered;
    this.sessions = sessions;
  }

  enter() {
    const now = new Date().toISOString();
    if (!this.entered_first_at) this.entered_first_at = now;
    this.entered_last_at = now;
    this.times_entered++;
  }

  findSession(sessionId) {
    return this.sessions.find(s => s.id === sessionId);
  }

  countCompletedSessions() {
    return this.sessions.filter(s => s.isCompleted()).length;
  }

  getProgress() {
    if (this.sessions.length === 0) return 0;
    return this.sessions.filter(s => s.isCompleted()).length / this.sessions.length;
  }

  toJSON() {
    return {
      id: this.id,
      title: this.title,
      entered_first_at: this.entered_first_at,
      entered_last_at: this.entered_last_at,
      times_entered: this.times_entered,
      sessions: this.sessions,
    };
  }

  static fromJSON({ id, title, entered_first_at, entered_last_at, times_entered, sessions }) {
    return new Module({ id, title, entered_first_at, entered_last_at, times_entered, sessions: sessions.map(s => Session.fromJSON(s)) });
  }
}

class ReactStateHelper {
  #state;

  static initDefaultState() {
    return this.loadExistingState(JSON.stringify(this.initialState()));
  }

  static loadExistingState(json) {
    const helper = new this();
    const data = JSON.parse(json);
    helper.#state = { ...data, modules: data.modules.map(m => Module.fromJSON(m)) };
    return helper;
  }

  static initialState() {
    return {
      modules: [
        {
          id: "onboard",
          title: "Onboarding",
          entered_first_at: null,
          entered_last_at: null,
          times_entered: 0,
          sessions: [
            {
              id: "introd",
              title: "Einführung",
              entered_first_at: null,
              entered_last_at: null,
              times_entered: 0,
              activities: [
                {
                  id: "globGoal",
                  title: "Globales Ziel definieren",
                  entered_first_at: null,
                  entered_last_at: null,
                  times_entered: 0,
                  completed: false,
                },
                {
                  id: "howEdu",
                  title: "Psychoedukation: wie bewandert...?",
                  entered_first_at: null,
                  entered_last_at: null,
                  times_entered: 0,
                  completed: false,
                },
              ],
            },
          ],
        },
        {
          id: "bouMgt",
          title: "Boundary Management",
          entered_first_at: null,
          entered_last_at: null,
          times_entered: 0,
          sessions: [
            {
              id: "rolCha",
              title: "Rollenwechsel bewusst vollziehen",
              entered_first_at: null,
              entered_last_at: null,
              times_entered: 0,
              activities: [
                {
                  id: "somAct",
                  title: "Eine erste Übung",
                  entered_first_at: null,
                  entered_last_at: null,
                  times_entered: 0,
                  completed: false,
                },
                {
                  id: "othAct",
                  title: "Eine andere Übung",
                  entered_first_at: null,
                  entered_last_at: null,
                  times_entered: 0,
                  completed: false,
                },
              ],
            },
            {
              id: "sayNo",
              title: "Nein sagen üben",
              entered_first_at: null,
              entered_last_at: null,
              times_entered: 0,
              activities: [
                {
                  id: "sayNoAct",
                  title: "Nein sagen Übung",
                  entered_first_at: null,
                  entered_last_at: null,
                  times_entered: 0,
                  completed: false,
                },
              ],
            },
            {
              id: "limSet",
              title: "Grenzen setzen",
              entered_first_at: null,
              entered_last_at: null,
              times_entered: 0,
              activities: [
                {
                  id: "limSetAct",
                  title: "Grenzen setzen Übung",
                  entered_first_at: null,
                  entered_last_at: null,
                  times_entered: 0,
                  completed: false,
                },
              ],
            },
            {
              id: "worBou",
              title: "Arbeitliche Grenzen kommunizieren",
              entered_first_at: null,
              entered_last_at: null,
              times_entered: 0,
              activities: [
                {
                  id: "worBouAct",
                  title: "Arbeitsgrenzen Übung",
                  entered_first_at: null,
                  entered_last_at: null,
                  times_entered: 0,
                  completed: false,
                },
              ],
            },
            {
              id: "digDet",
              title: "Digitale Auszeiten einhalten",
              entered_first_at: null,
              entered_last_at: null,
              times_entered: 0,
              activities: [
                {
                  id: "digDetAct",
                  title: "Digitale Auszeit Übung",
                  entered_first_at: null,
                  entered_last_at: null,
                  times_entered: 0,
                  completed: false,
                },
              ],
            },
          ],
        },
        {
          id: "emoReg",
          title: "Emotionsregulation",
          entered_first_at: null,
          entered_last_at: null,
          times_entered: 0,
          sessions: [
            {
              id: "breCon",
              title: "Bewusstes Atmen",
              entered_first_at: null,
              entered_last_at: null,
              times_entered: 0,
              activities: [
                {
                  id: "breConAct",
                  title: "Atemübung",
                  entered_first_at: null,
                  entered_last_at: null,
                  times_entered: 0,
                  completed: false,
                },
              ],
            },
            {
              id: "bodSca",
              title: "Body-Scan-Übung",
              entered_first_at: null,
              entered_last_at: null,
              times_entered: 0,
              activities: [
                {
                  id: "bodScaAct",
                  title: "Body-Scan",
                  entered_first_at: null,
                  entered_last_at: null,
                  times_entered: 0,
                  completed: false,
                },
              ],
            },
            {
              id: "jouWri",
              title: "Tagebuch schreiben",
              entered_first_at: null,
              entered_last_at: null,
              times_entered: 0,
              activities: [
                {
                  id: "jouWriAct",
                  title: "Tagebucheintrag",
                  entered_first_at: null,
                  entered_last_at: null,
                  times_entered: 0,
                  completed: false,
                },
              ],
            },
            {
              id: "proRel",
              title: "Progressive Muskelentspannung",
              entered_first_at: null,
              entered_last_at: null,
              times_entered: 0,
              activities: [
                {
                  id: "proRelAct",
                  title: "Entspannungsübung",
                  entered_first_at: null,
                  entered_last_at: null,
                  times_entered: 0,
                  completed: false,
                },
              ],
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

  markActivityCompleted() {
    if (!this.#state.currentActivityId) throw new Error('No activity entered yet');
    this.#findActivity(this.#state.currentActivityId).markCompleted();
  }

  isSessionCompleted(sessionId) {
    if (!this.#state.currentModuleId) throw new Error('No module entered yet');
    return this.#findModule(this.#state.currentModuleId).findSession(sessionId).isCompleted();
  }

  countCompletedSessions() {
    if (!this.#state.currentModuleId) throw new Error('No module entered yet');
    return this.#findModule(this.#state.currentModuleId).countCompletedSessions();
  }

  countCompletedOverall() {
    return this.#state.modules.reduce((sum, m) => sum + m.countCompletedSessions(), 0);
  }

  // Returns a value between 0 and 1
  getProgress() {
    const all = this.#state.modules.flatMap(m => m.sessions);
    if (all.length === 0) return 0;
    return all.filter(s => s.isCompleted()).length / all.length;
  }

  // Returns a value between 0 and 1 for the given module
  getModuleProgress(moduleId) {
    return this.#findModule(moduleId).getProgress();
  }

  isGoodEnough(moduleId) {
    return this.#findModule(moduleId).countCompletedSessions() >= 3;
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
    this.#state.currentSessionId = null;
    this.#state.currentActivityId = null;
    module.enter();
  }

  enterSession(sessionId) {
    const session = this.#findSession(sessionId);
    this.#state.currentSessionId = session.id;
    this.#state.currentActivityId = null;
    session.enter();
  }

  enterActivity(activityId) {
    const activity = this.#findActivity(activityId);
    this.#state.currentActivityId = activity.id;
    activity.enter();
  }

  getParticipantGroup() {
    const { currentModuleId, currentSessionId } = this.#state;
    if (!currentModuleId || !currentSessionId) return null;
    return currentModuleId + ': ' + currentSessionId;
  }

  allCompletedSessionsAsCsv() {
    return this.#state.modules
      .flatMap(m => m.sessions)
      .filter(s => s.isCompleted())
      .map(s => s.id)
      .join(',');
  }

  #findModule(moduleId) {
    return this.#state.modules.find(m => m.id === moduleId);
  }

  #findSession(sessionId) {
    if (!this.#state.currentModuleId) throw new Error('No module entered yet');
    const session = this.#findModule(this.#state.currentModuleId).findSession(sessionId);
    if (!session) throw new Error('Session ' + sessionId + ' not found in module ' + this.#state.currentModuleId);
    return session;
  }

  #findActivity(activityId) {
    if (!this.#state.currentModuleId) throw new Error('No module entered yet');
    if (!this.#state.currentSessionId) throw new Error('No session entered yet');
    const activity = this.#findSession(this.#state.currentSessionId).findActivity(activityId);
    if (!activity) throw new Error('Activity ' + activityId + ' not found in session ' + this.#state.currentSessionId);
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
  // - $jsStateHelperCmd = "markActivityCompleted()"
  // - $jsStateHelperCmd = "countCompletedSessions('bouMgt')"
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
