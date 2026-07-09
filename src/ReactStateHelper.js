// ReactStateHelper, see https://github.com/jmuheim/react-state-helper

const MAX_MENU_SLOTS = 9; // only $rsh_menuLabel1 to $rsh_menuLabel9 and $rsh_menuId1 to $rsh_menuId9 are declared in MobileCoach

// Registers an id the moment its Module/Session/Activity is instantiated, the same way a DB unique
// constraint rejects an INSERT — this is what makes ids unique across the *entire* state, not just
// within their parent, since the same registry is threaded through the whole Module/Session/Activity tree.
// `prefix` enforces the m_/s_/a_ convention that makes cross-level collisions impossible by construction
// (see "ID conventions" in CLAUDE.md) — checked here, at the same point ids are registered, rather than
// trusting callers to follow the convention.
function registerId(idRegistry, id, levelPrefix) {
  const prefix = levelPrefix + '_';
  if (!id.startsWith(prefix)) throw new Error('Id ' + id + ' must start with "' + prefix + '"');
  if (idRegistry.has(id)) throw new Error('Duplicate id found in state: ' + id);
  idRegistry.add(id);
}

// In MobileCoach, menu entries are concatenated per slot, e.g. "$rsh_menuLabel1:$rsh_menuId1",
// and split on ":" at tap time to extract the id. How MobileCoach splits an entry with multiple
// colons (first vs. last) is unknown, so titles must not contain any colon — the entry then
// always contains exactly one and the split cannot be corrupted.
function validateTitle(title, entityDescription) {
  if (title.includes(':')) throw new Error(entityDescription + ' title "' + title + '" must not contain a colon');
}

class Module {
  constructor({ id, title, sessions_needed_for_adequate_progress = 1, sessions = [], entered_first_at = null, entered_last_at = null, times_entered = 0 }) {
    this.id = id;
    this.title = title;
    this.sessions_needed_for_adequate_progress = sessions_needed_for_adequate_progress;
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

  isCompleted() {
    return this.sessions.length > 0 && this.sessions.every(s => s.isCompleted());
  }

  hasAdequateProgress() {
    return this.countCompletedSessions() >= this.sessions_needed_for_adequate_progress;
  }

  getProgress() {
    const completable = this.sessions.filter(s => s.activities.length > 0);
    if (completable.length === 0) return 0;
    return completable.filter(s => s.isCompleted()).length / completable.length;
  }

  toJSON() {
    return {
      id: this.id,
      title: this.title,
      sessions_needed_for_adequate_progress: this.sessions_needed_for_adequate_progress,
      entered_first_at: this.entered_first_at,
      entered_last_at: this.entered_last_at,
      times_entered: this.times_entered,
      sessions: this.sessions,
    };
  }

  static fromJSON({ id, title, sessions_needed_for_adequate_progress, entered_first_at, entered_last_at, times_entered, sessions }, idRegistry) {
    registerId(idRegistry, id, 'm');
    validateTitle(title, 'Module ' + id);
    const module = new Module({ id, title, sessions_needed_for_adequate_progress, entered_first_at, entered_last_at, times_entered, sessions: sessions.map(s => Session.fromJSON(s, idRegistry)) });
    if (module.sessions.length === 0) throw new Error('Module ' + id + ' has no sessions');
    // An intro session completes on first entry alone; without at least one session that has activities,
    // a module could be "completed" without any real work — so at least one non-intro session is required.
    if (module.sessions.every(s => s.activities.length === 0)) throw new Error('Module ' + id + ' has no sessions with activities (every module needs at least one non-intro session)');
    if (module.sessions.length > MAX_MENU_SLOTS) throw new Error('Module ' + id + ' has ' + module.sessions.length + ' sessions, but at most ' + MAX_MENU_SLOTS + ' are supported');
    if (module.sessions_needed_for_adequate_progress < 1 || module.sessions_needed_for_adequate_progress > module.sessions.length) throw new Error('Module ' + id + ' has an unachievable sessions_needed_for_adequate_progress (' + module.sessions_needed_for_adequate_progress + ') for its ' + module.sessions.length + ' session(s)');
    const nonFirstIntroSession = module.sessions.find((s, i) => s.isIntro && i !== 0);
    if (nonFirstIntroSession) throw new Error('Session ' + nonFirstIntroSession.id + ' in module ' + id + ' is marked isIntro but is not the first session — only the first session may be an intro');
    return module;
  }
}

class Session {
  constructor({ id, title, activities_needed_for_adequate_progress = 1, entered_first_at = null, entered_last_at = null, times_entered = 0, activities = [], isIntro = false }) {
    this.id = id;
    this.title = title;
    this.activities_needed_for_adequate_progress = activities_needed_for_adequate_progress;
    this.entered_first_at = entered_first_at;
    this.entered_last_at = entered_last_at;
    this.times_entered = times_entered;
    this.activities = activities;
    this.isIntro = isIntro;
  }

  enter() {
    const now = new Date().toISOString();
    if (!this.entered_first_at) this.entered_first_at = now;
    this.entered_last_at = now;
    this.times_entered++;
  }

  isCompleted() {
    if (this.isIntro) return this.entered_first_at !== null;
    return this.activities.length > 0 && this.activities.every(a => a.isCompleted());
  }

  countCompletedActivities() {
    return this.activities.filter(a => a.isCompleted()).length;
  }

  hasAdequateProgress() {
    return this.countCompletedActivities() >= this.activities_needed_for_adequate_progress;
  }

  findActivity(activityId) {
    return this.activities.find(a => a.id === activityId);
  }

  toJSON() {
    return { id: this.id, title: this.title, activities_needed_for_adequate_progress: this.activities_needed_for_adequate_progress, entered_first_at: this.entered_first_at, entered_last_at: this.entered_last_at, times_entered: this.times_entered, activities: this.activities, isIntro: this.isIntro };
  }

  static fromJSON({ id, title, activities_needed_for_adequate_progress, entered_first_at, entered_last_at, times_entered, activities, isIntro }, idRegistry) {
    registerId(idRegistry, id, 's');
    validateTitle(title, 'Session ' + id);
    const session = new Session({ id, title, activities_needed_for_adequate_progress, entered_first_at, entered_last_at, times_entered, activities: activities.map(a => Activity.fromJSON(a, idRegistry)), isIntro });
    if (session.activities.length > MAX_MENU_SLOTS) throw new Error('Session ' + id + ' has ' + session.activities.length + ' activities, but at most ' + MAX_MENU_SLOTS + ' are supported');
    // Only intro sessions (isIntro: true) may have no activities; every other session needs at least one.
    if (!session.isIntro && session.activities.length === 0) throw new Error('Session ' + id + ' has no activities (set isIntro: true if this is intentional)');
    // Sessions without activities (i.e. intros) have no achievable threshold to check.
    if (session.activities.length > 0 && (session.activities_needed_for_adequate_progress < 1 || session.activities_needed_for_adequate_progress > session.activities.length))
      throw new Error('Session ' + id + ' has an unachievable activities_needed_for_adequate_progress (' + session.activities_needed_for_adequate_progress + ') for its ' + session.activities.length + ' activity/activities');
    return session;
  }
}

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

  static fromJSON(obj, idRegistry) {
    registerId(idRegistry, obj.id, 'a');
    validateTitle(obj.title, 'Activity ' + obj.id);
    return new Activity(obj);
  }
}

class ReactStateHelper {
  #state;

  // Menu labels and ids populated by the populateMenuFor…() methods, read back per slot via
  // getMenuLabel() / getMenuId(). Not part of #state: they are rebuilt right before showing a menu,
  // never persisted.
  #menuLabels = [];
  #menuIds = [];

  static initDefaultState() {
    return this.loadExistingState(JSON.stringify(this.initialState()));
  }

  static loadExistingState(json) {
    const helper = new this();
    const data = JSON.parse(json);
    const idRegistry = new Set();
    const modules = data.modules.map(m => Module.fromJSON(m, idRegistry));
    if (modules.length > MAX_MENU_SLOTS) throw new Error('State has ' + modules.length + ' modules, but at most ' + MAX_MENU_SLOTS + ' are supported');
    helper.#state = { ...data, modules };
    return helper;
  }

  static initialState() {
    return {
      modules: [
        {
          id: "m_bouMgt",
          title: "Boundary Management",
          sessions_needed_for_adequate_progress: 1,
          entered_first_at: null,
          entered_last_at: null,
          times_entered: 0,
          sessions: [
            {
              id: "s_bouIntro",
              title: "Einführung",
              activities_needed_for_adequate_progress: 1,
              entered_first_at: null,
              entered_last_at: null,
              times_entered: 0,
              activities: [],
              isIntro: true,
            },
            {
              id: "s_gesGre",
              title: "Gesunde Grenzen setzen",
              activities_needed_for_adequate_progress: 1,
              entered_first_at: null,
              entered_last_at: null,
              times_entered: 0,
              activities: [
                {
                  id: "a_rolGes",
                  title: "Rollenwechsel bewusst gestalten",
                  entered_first_at: null,
                  entered_last_at: null,
                  times_entered: 0,
                  completed: false,
                },
                {
                  id: "a_abgKon",
                  title: "Abgrenzen mit Klarheit – Das Konsequenzengitter",
                  entered_first_at: null,
                  entered_last_at: null,
                  times_entered: 0,
                  completed: false,
                },
              ],
              isIntro: false,
            },
            {
              id: "s_paus",
              title: "Pausen",
              activities_needed_for_adequate_progress: 1,
              entered_first_at: null,
              entered_last_at: null,
              times_entered: 0,
              activities: [
                {
                  id: "a_mikPau",
                  title: "Mikropausen im Schulalltag",
                  entered_first_at: null,
                  entered_last_at: null,
                  times_entered: 0,
                  completed: false,
                },
              ],
              isIntro: false,
            },
          ],
        },
        {
          id: "m_emoReg",
          title: "Emotionsregulation",
          sessions_needed_for_adequate_progress: 1,
          entered_first_at: null,
          entered_last_at: null,
          times_entered: 0,
          sessions: [
            {
              id: "s_emoIntro",
              title: "Einführung",
              activities_needed_for_adequate_progress: 1,
              entered_first_at: null,
              entered_last_at: null,
              times_entered: 0,
              activities: [],
              isIntro: true,
            },
            {
              id: "s_akzep",
              title: "Akzeptanz",
              activities_needed_for_adequate_progress: 1,
              entered_first_at: null,
              entered_last_at: null,
              times_entered: 0,
              activities: [
                {
                  id: "a_akzepAct",
                  title: "Akzeptanz",
                  entered_first_at: null,
                  entered_last_at: null,
                  times_entered: 0,
                  completed: false,
                },
              ],
              isIntro: false,
            },
            {
              id: "s_neuBew",
              title: "Neubewertung",
              activities_needed_for_adequate_progress: 1,
              entered_first_at: null,
              entered_last_at: null,
              times_entered: 0,
              activities: [
                {
                  id: "a_neuBewAct",
                  title: "Neubewertung",
                  entered_first_at: null,
                  entered_last_at: null,
                  times_entered: 0,
                  completed: false,
                },
              ],
              isIntro: false,
            },
            {
              id: "s_umgEmo",
              title: "Umgang mit schwierigen Emotionen",
              activities_needed_for_adequate_progress: 1,
              entered_first_at: null,
              entered_last_at: null,
              times_entered: 0,
              activities: [
                {
                  id: "a_emoSit",
                  title: "Emotionsregulation in schwierigen Situationen",
                  entered_first_at: null,
                  entered_last_at: null,
                  times_entered: 0,
                  completed: false,
                },
              ],
              isIntro: false,
            },
            {
              id: "s_umgSup",
              title: "Umgang mit unterdrückten Gefühlen",
              activities_needed_for_adequate_progress: 1,
              entered_first_at: null,
              entered_last_at: null,
              times_entered: 0,
              activities: [
                {
                  id: "a_umgSupAct",
                  title: "Umgang mit Suppression",
                  entered_first_at: null,
                  entered_last_at: null,
                  times_entered: 0,
                  completed: false,
                },
              ],
              isIntro: false,
            },
          ],
        },
      ],
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

  isModuleCompleted(moduleId) {
    return this.#findModule(moduleId).isCompleted();
  }

  isSessionCompleted(sessionId) {
    if (!this.#state.currentModuleId) throw new Error('No module entered yet');
    return this.#findModule(this.#state.currentModuleId).findSession(sessionId).isCompleted();
  }

  hasSessionAdequateProgress(sessionId) {
    if (!this.#state.currentModuleId) throw new Error('No module entered yet');
    return this.#findModule(this.#state.currentModuleId).findSession(sessionId).hasAdequateProgress();
  }

  // Returns a value between 0 and 1
  getProgress() {
    const all = this.#state.modules.flatMap(m => m.sessions.filter(s => s.activities.length > 0));
    if (all.length === 0) return 0;
    return all.filter(s => s.isCompleted()).length / all.length;
  }

  // Returns a value between 0 and 1 for the given module
  getModuleProgress(moduleId) {
    return this.#findModule(moduleId).getProgress();
  }

  hasModuleAdequateProgress(moduleId) {
    return this.#findModule(moduleId).hasAdequateProgress();
  }

  // The level to enter is read off the id's prefix (m_/s_/a_, enforced by registerId), so a single
  // command works after any menu tap regardless of whether the menu listed modules, sessions or activities.
  enter(id) {
    if (id.startsWith('m_')) {
      const module = this.#findModule(id);
      if (!module) throw new Error('Module ' + id + ' not found');
      this.#state.currentModuleId = id;
      this.#state.currentSessionId = null;
      this.#state.currentActivityId = null;
      module.enter();
    } else if (id.startsWith('s_')) {
      const session = this.#findSession(id);
      this.#state.currentSessionId = session.id;
      this.#state.currentActivityId = null;
      session.enter();
    } else if (id.startsWith('a_')) {
      const activity = this.#findActivity(id);
      this.#state.currentActivityId = activity.id;
      activity.enter();
    } else {
      throw new Error('Cannot enter id ' + id + ': it must start with "m_", "s_" or "a_"');
    }
  }

  getParticipantLocation() {
    const { currentModuleId, currentSessionId, currentActivityId } = this.#state;
    if (!currentModuleId) return null;
    return [currentModuleId, currentSessionId, currentActivityId].filter(Boolean).join(': ');
  }

  allCompletedSessionsAsCsv() {
    return this.#state.modules
      .flatMap(m => m.sessions)
      .filter(s => s.isCompleted())
      .map(s => s.id)
      .join(',');
  }

  static #MENU_EMOJIS = {
    completed: '✅',
    next: '👉',
    module: '🗂️',
    session: '📑',
    activity: '🎯',
  };

  getProgressAdvice() {
    const { module: m, session: s, activity: a } = ReactStateHelper.#MENU_EMOJIS;
    if (this.#state.currentSessionId) {
      const module = this.#findModule(this.#state.currentModuleId);
      const session = this.#findSession(this.#state.currentSessionId);
      const activity = this.#state.currentActivityId ? this.#findActivity(this.#state.currentActivityId) : null;
      const nextActivity = session.activities.find(act => !act.isCompleted());
      return this.#buildProgressAdviceString({
        label: 'Session', labelPlural: 'Sessions', emoji: s, title: session.title,
        subLabel: 'Aktivitäten', subLabelSingular: 'Aktivität', subEmoji: a,
        completed: session.countCompletedActivities(), total: session.activities.length, threshold: session.activities_needed_for_adequate_progress,
        notStartedYet: !activity, nextItem: nextActivity,
        next: { label: 'Modul', emoji: m, title: module.title }, nextVerb: 'zurückgehen',
      });
    }
    if (this.#state.currentModuleId) {
      const module = this.#findModule(this.#state.currentModuleId);
      const idx = this.#state.modules.findIndex(mm => mm.id === module.id);
      const completableSessions = module.sessions.filter(s => s.activities.length > 0);
      const nextUncompletedSession = completableSessions.find(s => !s.isCompleted());
      const nextModule = this.#state.modules[idx + 1];
      const completedSessions = module.countCompletedSessions();
      return this.#buildProgressAdviceString({
        label: 'Modul', labelPlural: 'Module', emoji: m, title: module.title,
        subLabel: 'Sessions', subLabelSingular: 'Session', subEmoji: s,
        completed: completedSessions, total: completableSessions.length, threshold: module.sessions_needed_for_adequate_progress,
        notStartedYet: completedSessions === 0, nextItem: nextUncompletedSession,
        next: nextModule ? { label: 'Modul', emoji: m, title: nextModule.title } : null, nextVerb: 'weitergehen',
      });
    }
    throw new Error('No module entered yet');
  }

  #buildProgressAdviceString({ label, labelPlural, emoji, title, subLabel, subLabelSingular, subEmoji, completed, total, threshold, notStartedYet, nextItem, next, nextVerb }) {
    const skipPart = next ? ', oder zu ' + next.emoji + ' ' + next.label + ' "' + next.title + '" ' + nextVerb : '';
    const allCoveredPart = next ? '' : ' — und das gilt auch für alle anderen ' + labelPlural;
    if (completed >= total) return 'Du hast ' + emoji + ' ' + label + ' "' + title + '" erfolgreich abgeschlossen' + allCoveredPart + '. Die enthaltenen ' + subLabel + ' kannst du jederzeit erneut besuchen' + skipPart + '.';
    if (completed >= threshold) return 'Du hast in ' + emoji + ' ' + label + ' "' + title + '" ausreichend Fortschritt gemacht' + allCoveredPart + '. Du kannst bleiben und weitere ' + subEmoji + ' ' + subLabel + ' abschliessen' + skipPart + '.';
    if (notStartedYet) return 'Beginne mit einer der verfügbaren ' + subEmoji + ' ' + subLabel + ' in ' + emoji + ' ' + label + ' "' + title + '".';
    if (!nextItem) throw new Error('No uncompleted ' + subLabelSingular + ' found in ' + label + ' "' + title + '" despite being below threshold');
    return 'Mach weiter in ' + emoji + ' ' + label + ' "' + title + '" — zum Beispiel mit ' + subEmoji + ' ' + subLabelSingular + ' "' + nextItem.title + '".';
  }

  populateMenuForModule() {
    this.#menuLabels = this.#buildMenuLabels(this.#state.modules);
    this.#menuIds = this.#buildMenuIds(this.#state.modules);
  }

  populateMenuForSession() {
    if (!this.#state.currentModuleId) throw new Error('No module entered yet');
    const sessions = this.#findModule(this.#state.currentModuleId).sessions;
    this.#menuLabels = this.#buildMenuLabels(sessions);
    this.#menuIds = this.#buildMenuIds(sessions);
  }

  populateMenuForActivity() {
    if (!this.#state.currentModuleId) throw new Error('No module entered yet');
    if (!this.#state.currentSessionId) throw new Error('No session entered yet');
    const activities = this.#findSession(this.#state.currentSessionId).activities;
    this.#menuLabels = this.#buildMenuLabels(activities);
    this.#menuIds = this.#buildMenuIds(activities);
  }

  // Slot numbers run 1–9, matching the MobileCoach menu label variables. Empty until one of the
  // populateMenuFor…() methods was called ('' hides the slot in MobileCoach).
  getMenuLabel(slot) {
    return this.#menuLabels[slot - 1] ?? '';
  }

  // The id belonging to the label in the same slot ('' for empty slots). In MobileCoach the two are
  // concatenated per slot, e.g. "$rsh_menuLabel1:$rsh_menuId1", to form the routable menu entry.
  getMenuId(slot) {
    return this.#menuIds[slot - 1] ?? '';
  }

  #buildMenuLabels(items) {
    const { completed: completedEmoji, next: nextEmoji } = ReactStateHelper.#MENU_EMOJIS;
    const labels = [];
    let nextAssigned = false;
    for (let i = 0; i < MAX_MENU_SLOTS; i++) {
      const item = items[i];
      if (!item) {
        labels.push('');
      } else if (item.isCompleted()) {
        labels.push((completedEmoji ? completedEmoji + ' ' : '') + item.title);
      } else if (!nextAssigned) {
        labels.push((nextEmoji ? nextEmoji + ' ' : '') + item.title);
        nextAssigned = true;
      } else {
        labels.push(item.title);
      }
    }
    return labels;
  }

  #buildMenuIds(items) {
    const ids = [];
    for (let i = 0; i < MAX_MENU_SLOTS; i++) {
      const item = items[i];
      ids.push(item ? item.id : '');
    }
    return ids;
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
  // $rsh_json is a MobileCoach variable interpolated into this script before execution.
  // It holds the JSON serialized state from the previous run, or anything else on the very first run.
  const rsh_json = '$rsh_json';

  // Initialises the helper with the state from the previous run (if $rsh_json contains valid JSON);
  // otherwise initialise default state (fresh start of the app).
  let helper;

  // If any error surfaces, it will be reported via $rsh_error instead of crashing the whole script with no output at all.
  let error;

  try {
    if (rsh_json === '0') throw new Error(); // MobileCoach default for uninitialised variables
    JSON.parse(rsh_json);
    helper = ReactStateHelper.loadExistingState(rsh_json);
  } catch {
    try {
      helper = ReactStateHelper.initDefaultState();
    } catch (e) {
      error = e.message;
    }
  }

  // Inside MobileCoach, before calling ReactStateHelper, set $rsh_cmd to the command you'd like to execute, e.g.
  // - $rsh_cmd = "isSessionCompleted('s_gesGre')"
  // - $rsh_cmd = "markActivityCompleted()"
  // - $rsh_cmd = "hasModuleAdequateProgress('m_bouMgt')"
  // - $rsh_cmd = "getModuleProgress('m_bouMgt')"
  // Please be extra careful! Typos or syntax errors will break this!
  let result, status;
  if (error) {
    status = 'error';
  } else {
    try {
      result = eval(`helper.$rsh_cmd`);
      status = 'success';
    } catch (e) { // If there's any error, details about it can be inspected through $rsh_error
      status = 'error';
      error = e.message;
    }
  }

  let o = {
    // MobileCoach will save these elements to corresponding variables,
    // i.e. rsh_json becomes $rsh_json.
    rsh_json:              helper ? helper.toString() : rsh_json,
    // '' when the command returned nothing (enter…, mark…, populate…), so the variable never holds a stale value from an earlier run.
    rsh_result:            result === undefined ? '' : result,
    rsh_status:            status,
    rsh_error:             error || 'none', // TODO: Möglichst viel weitere nützliche Infos rein-dumpen!
    rsh_sessionsCompleted: helper ? helper.allCompletedSessionsAsCsv() : '',
    participantGroup:               helper ? helper.getParticipantLocation() : null
  };

  // All 9 menu labels and their 9 ids are written back to MobileCoach as individual variables,
  // on every run. A populateMenuFor…() command fills them; after any other command every
  // slot is '' (hidden), so (re)populate the menu right before displaying it.
  for (let i = 1; i <= MAX_MENU_SLOTS; i++) {
    o['rsh_menuLabel' + i] = helper ? helper.getMenuLabel(i) : '';
    o['rsh_menuId' + i] = helper ? helper.getMenuId(i) : '';
  }

  o
}
