// ReactStateHelper, see https://github.com/jmuheim/react-state-helper

const MAX_MENU_SLOTS = 9; // only $rsh_menuLabel1 to $rsh_menuLabel9 and $rsh_menuId1 to $rsh_menuId9 are declared in MobileCoach

// The id of the MobileCoach dialog that shows the module-selection menu (the one calling
// populateMenuWithModules()) — the dialog must be named exactly like this. It is a pure routing
// target: the sessions and activities menus' back entries route to it, but it is never passed
// to enter() — dialogs enter themselves, and while the modules menu is displayed the
// participant's location deliberately stays in the previous context. It cannot collide with a
// state id: registerId rejects it by name, and the convention check (uppercase letter after the
// level letter) would reject it anyway, since the second letter here is lowercase.
const ALL_MODULES_MENU_DIALOG_ID = 'allModulesMenu';

// The id of the MobileCoach dialog that shows the session-selection menu of the current module
// (the one calling populateMenuWithSessions()) — the dialog must be named exactly like this.
// Like ALL_MODULES_MENU_DIALOG_ID it is a pure routing target: the activities menu's session
// back entry routes to it, it is never passed to enter(), and registerId rejects it by name.
const ALL_SESSIONS_OF_CURRENT_MODULE_MENU_DIALOG_ID = 'allSessionsOfCurrentModuleMenu';

// MobileCoach additionally contains an allActivitiesOfCurrentSessionMenu dialog (showing the
// current session's activities menu, the counterpart to the two dialogs above). No menu entry
// emits its id yet, so nothing routes to it — it gets no constant and no enter()/registerId
// handling until something does.

// Registers an id the moment its Module/Session/Activity is instantiated, the same way a DB unique
// constraint rejects an INSERT — this is what makes ids unique across the *entire* state, not just
// within their parent, since the same registry is threaded through the whole Module/Session/Activity tree.
// `levelLetter` enforces the camelCase id convention (mBouMgt / sGesGre / aRolGes) that makes
// cross-level collisions impossible by construction — checked here, at the same point ids are
// registered, rather than trusting callers to follow the convention. The uppercase letter after
// the level letter keeps the level marker recognizable without a separator; the letters-and-numbers
// restriction exists because each id, with an underscore appended, doubles as a MobileCoach dialog
// variable prefix — and prefixes reject underscores anywhere but the end (see
// "Dialog ids and variable prefixes" in docs/mobilecoach-field-notes.md).
function registerId(idRegistry, id, levelLetter) {
  // The reserved menu dialog ids could never pass the convention check below anyway (their second
  // letter is lowercase), but rejecting them by name says what is actually wrong instead of
  // complaining about the id's format (decision #44).
  if (id === ALL_MODULES_MENU_DIALOG_ID) throw new Error('Id ' + ALL_MODULES_MENU_DIALOG_ID + ' is reserved for the dialog showing the module-selection menu and cannot be used as a state id');
  if (id === ALL_SESSIONS_OF_CURRENT_MODULE_MENU_DIALOG_ID) throw new Error('Id ' + ALL_SESSIONS_OF_CURRENT_MODULE_MENU_DIALOG_ID + ' is reserved for the dialog showing the session-selection menu of the current module and cannot be used as a state id');
  // No end-of-string anchor here — its character cannot appear anywhere in this script (decision #27) —
  // so the whole-id coverage is checked by rejecting any character outside letters and numbers instead.
  const startsWithLevelLetter = new RegExp('^' + levelLetter + '[A-Z]').test(id);
  const hasOnlyLettersAndNumbers = !/[^A-Za-z0-9]/.test(id);
  if (!startsWithLevelLetter || !hasOnlyLettersAndNumbers) throw new Error('Id ' + id + ' must start with "' + levelLetter + '" followed by an uppercase letter, and contain only letters and numbers');
  if (idRegistry.has(id)) throw new Error('Duplicate id found in state: ' + id);
  idRegistry.add(id);
}

// In MobileCoach, menu entries are concatenated per slot, e.g. "$rsh_menuLabel1:$rsh_menuId1",
// and split on ":" at tap time to extract the id. The split happens on the raw definition text,
// before variable interpolation, so a colon inside a title cannot corrupt it — whether this
// validation can therefore be dropped is an open question (docs/open-questions.md).
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
    // One slot fewer than the menu offers: the sessions menu appends a back entry after the sessions.
    if (module.sessions.length > MAX_MENU_SLOTS - 1) throw new Error('Module ' + id + ' has ' + module.sessions.length + ' sessions, but at most ' + (MAX_MENU_SLOTS - 1) + ' are supported (one menu slot is reserved for the back entry)');
    if (module.sessions_needed_for_adequate_progress < 1 || module.sessions_needed_for_adequate_progress > module.sessions.length) throw new Error('Module ' + id + ' has an unachievable sessions_needed_for_adequate_progress (' + module.sessions_needed_for_adequate_progress + ') for its ' + module.sessions.length + ' session(s)');
    const nonFirstIntroSession = module.sessions.find((s, i) => s.is_intro && i !== 0);
    if (nonFirstIntroSession) throw new Error('Session ' + nonFirstIntroSession.id + ' in module ' + id + ' is marked is_intro but is not the first session — only the first session may be an intro');
    return module;
  }
}

class Session {
  constructor({ id, title, activities_needed_for_adequate_progress = 1, entered_first_at = null, entered_last_at = null, times_entered = 0, activities = [], is_intro = false }) {
    this.id = id;
    this.title = title;
    this.activities_needed_for_adequate_progress = activities_needed_for_adequate_progress;
    this.entered_first_at = entered_first_at;
    this.entered_last_at = entered_last_at;
    this.times_entered = times_entered;
    this.activities = activities;
    this.is_intro = is_intro;
  }

  enter() {
    const now = new Date().toISOString();
    if (!this.entered_first_at) this.entered_first_at = now;
    this.entered_last_at = now;
    this.times_entered++;
  }

  isCompleted() {
    if (this.is_intro) return this.entered_first_at !== null;
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
    return { id: this.id, title: this.title, activities_needed_for_adequate_progress: this.activities_needed_for_adequate_progress, entered_first_at: this.entered_first_at, entered_last_at: this.entered_last_at, times_entered: this.times_entered, activities: this.activities, is_intro: this.is_intro };
  }

  static fromJSON({ id, title, activities_needed_for_adequate_progress, entered_first_at, entered_last_at, times_entered, activities, is_intro }, idRegistry) {
    registerId(idRegistry, id, 's');
    validateTitle(title, 'Session ' + id);
    const session = new Session({ id, title, activities_needed_for_adequate_progress, entered_first_at, entered_last_at, times_entered, activities: activities.map(a => Activity.fromJSON(a, idRegistry)), is_intro });
    // Two slots fewer than the menu offers: the activities menu appends two back entries after the activities.
    if (session.activities.length > MAX_MENU_SLOTS - 2) throw new Error('Session ' + id + ' has ' + session.activities.length + ' activities, but at most ' + (MAX_MENU_SLOTS - 2) + ' are supported (two menu slots are reserved for the back entries)');
    // Only intro sessions (is_intro: true) may have no activities; every other session needs at least one.
    if (!session.is_intro && session.activities.length === 0) throw new Error('Session ' + id + ' has no activities (set is_intro: true if this is intentional)');
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

  // Menu labels and ids populated by the populateMenuWith…() methods, read back per slot via
  // getMenuLabel() / getMenuId(). Not part of #state: they are rebuilt right before showing a menu,
  // never persisted.
  #menuLabels = [];
  #menuIds = [];

  static initDefaultState() {
    return this.loadExistingState(JSON.stringify(this.defaultStateTemplate()));
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

  static defaultStateTemplate() {
    return {
      modules: [
        {
          id: "mBouMgt",
          title: "Boundary Management",
          sessions_needed_for_adequate_progress: 1,
          entered_first_at: null,
          entered_last_at: null,
          times_entered: 0,
          sessions: [
            {
              id: "sBouIntro",
              title: "Einführung",
              activities_needed_for_adequate_progress: 1,
              entered_first_at: null,
              entered_last_at: null,
              times_entered: 0,
              activities: [],
              is_intro: true,
            },
            {
              id: "sGesGre",
              title: "Gesunde Grenzen setzen",
              activities_needed_for_adequate_progress: 1,
              entered_first_at: null,
              entered_last_at: null,
              times_entered: 0,
              activities: [
                {
                  id: "aRolGes",
                  title: "Rollenwechsel bewusst gestalten",
                  entered_first_at: null,
                  entered_last_at: null,
                  times_entered: 0,
                  completed: false,
                },
                {
                  id: "aAbgKon",
                  title: "Abgrenzen mit Klarheit – Das Konsequenzengitter",
                  entered_first_at: null,
                  entered_last_at: null,
                  times_entered: 0,
                  completed: false,
                },
              ],
              is_intro: false,
            },
            {
              id: "sPaus",
              title: "Pausen",
              activities_needed_for_adequate_progress: 1,
              entered_first_at: null,
              entered_last_at: null,
              times_entered: 0,
              activities: [
                {
                  id: "aMikPau",
                  title: "Mikropausen im Schulalltag",
                  entered_first_at: null,
                  entered_last_at: null,
                  times_entered: 0,
                  completed: false,
                },
              ],
              is_intro: false,
            },
          ],
        },
        {
          id: "mEmoReg",
          title: "Emotionsregulation",
          sessions_needed_for_adequate_progress: 1,
          entered_first_at: null,
          entered_last_at: null,
          times_entered: 0,
          sessions: [
            {
              id: "sEmoIntro",
              title: "Einführung",
              activities_needed_for_adequate_progress: 1,
              entered_first_at: null,
              entered_last_at: null,
              times_entered: 0,
              activities: [],
              is_intro: true,
            },
            {
              id: "sAkzep",
              title: "Akzeptanz",
              activities_needed_for_adequate_progress: 1,
              entered_first_at: null,
              entered_last_at: null,
              times_entered: 0,
              activities: [
                {
                  id: "aAkzep",
                  title: "Akzeptanz",
                  entered_first_at: null,
                  entered_last_at: null,
                  times_entered: 0,
                  completed: false,
                },
              ],
              is_intro: false,
            },
            {
              id: "sNeuBew",
              title: "Neubewertung",
              activities_needed_for_adequate_progress: 1,
              entered_first_at: null,
              entered_last_at: null,
              times_entered: 0,
              activities: [
                {
                  id: "aNeuBew",
                  title: "Neubewertung",
                  entered_first_at: null,
                  entered_last_at: null,
                  times_entered: 0,
                  completed: false,
                },
              ],
              is_intro: false,
            },
            {
              id: "sUmgEmo",
              title: "Umgang mit schwierigen Emotionen",
              activities_needed_for_adequate_progress: 1,
              entered_first_at: null,
              entered_last_at: null,
              times_entered: 0,
              activities: [
                {
                  id: "aEmoSit",
                  title: "Emotionsregulation in schwierigen Situationen",
                  entered_first_at: null,
                  entered_last_at: null,
                  times_entered: 0,
                  completed: false,
                },
              ],
              is_intro: false,
            },
            {
              id: "sUmgSup",
              title: "Umgang mit unterdrückten Gefühlen",
              activities_needed_for_adequate_progress: 1,
              entered_first_at: null,
              entered_last_at: null,
              times_entered: 0,
              activities: [
                {
                  id: "aUmgSup",
                  title: "Umgang mit Suppression",
                  entered_first_at: null,
                  entered_last_at: null,
                  times_entered: 0,
                  completed: false,
                },
              ],
              is_intro: false,
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

  completeActivity() {
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

  // Returns a value between 0 and 1 for the given module
  getModuleProgress(moduleId) {
    return this.#findModule(moduleId).getProgress();
  }

  hasModuleAdequateProgress(moduleId) {
    return this.#findModule(moduleId).hasAdequateProgress();
  }

  // The level to enter is read off the id's level letter (m/s/a followed by an uppercase letter,
  // enforced by registerId), so a single command works after any menu tap regardless of whether
  // the menu listed modules, sessions or activities.
  enter(id) {
    // The back-entry targets are the menu ids that must never be entered (see the constants'
    // declarations at the top of the file). Without these guards the generic level-letter error
    // below would suggest the id itself is malformed.
    if (id === ALL_MODULES_MENU_DIALOG_ID) throw new Error(ALL_MODULES_MENU_DIALOG_ID + ' must never be entered: it only routes to the dialog that shows the module-selection menu, which leaves the location unchanged — the location changes when the participant taps a module and that dialog runs enter with its own id');
    if (id === ALL_SESSIONS_OF_CURRENT_MODULE_MENU_DIALOG_ID) throw new Error(ALL_SESSIONS_OF_CURRENT_MODULE_MENU_DIALOG_ID + ' must never be entered: it only routes to the dialog that shows the session-selection menu of the current module, which leaves the location unchanged — the location changes when the participant taps a session and that dialog runs enter with its own id');
    if (/^m[A-Z]/.test(id)) {
      const module = this.#findModule(id);
      if (!module) throw new Error('Module ' + id + ' not found');
      this.#state.currentModuleId = id;
      this.#state.currentSessionId = null;
      this.#state.currentActivityId = null;
      module.enter();
    } else if (/^s[A-Z]/.test(id)) {
      const session = this.#findSession(id);
      this.#state.currentSessionId = session.id;
      this.#state.currentActivityId = null;
      session.enter();
    } else if (/^a[A-Z]/.test(id)) {
      const activity = this.#findActivity(id);
      this.#state.currentActivityId = activity.id;
      activity.enter();
    } else {
      throw new Error('Cannot enter id ' + id + ': it must start with "m", "s" or "a" followed by an uppercase letter');
    }
  }

  getParticipantLocation() {
    const { currentModuleId, currentSessionId, currentActivityId } = this.#state;
    if (!currentModuleId) return null;
    return [currentModuleId, currentSessionId, currentActivityId].filter(Boolean).join(': ');
  }

  // One-line snapshot of the whole completion state, meant for quick inspection inside MobileCoach:
  // each module wraps its sessions in [ ], each non-intro session wraps its activities in ( ), and
  // every completed item carries the completed emoji right after its id — so the rollup from
  // completed activities to their session and module is visible at a glance, e.g.
  // "mMod1[sSes1intro✅ sSes1a✅(aAct1a1✅ aAct1a2✅) sSes1b(aAct1b1)] mMod2[…]".
  getCompletionOverview() {
    const completedEmoji = ReactStateHelper.#EMOJIS.completed;
    const moduleParts = [];
    for (const module of this.#state.modules) {
      const sessionParts = [];
      for (const session of module.sessions) {
        let sessionPart = session.id + (session.isCompleted() ? completedEmoji : '');
        if (session.activities.length > 0) {
          const activityParts = [];
          for (const activity of session.activities) {
            activityParts.push(activity.id + (activity.isCompleted() ? completedEmoji : ''));
          }
          sessionPart += '(' + activityParts.join(' ') + ')';
        }
        sessionParts.push(sessionPart);
      }
      moduleParts.push(module.id + (module.isCompleted() ? completedEmoji : '') + '[' + sessionParts.join(' ') + ']');
    }
    return moduleParts.join(' ');
  }

  static #EMOJIS = {
    completed: '✅',
    next: '👈',
    module: '🗂️',
    session: '📑',
    activity: '🎯',
  };

  getProgressAdvice() {
    const { module: m, session: s, activity: a } = ReactStateHelper.#EMOJIS;
    if (this.#state.currentSessionId) {
      const session = this.#findSession(this.#state.currentSessionId);
      const activity = this.#state.currentActivityId ? this.#findActivity(this.#state.currentActivityId) : null;
      const nextActivity = session.activities.find(act => !act.isCompleted());
      return this.#buildProgressAdviceString({
        labelSingular: 'Session', labelPlural: 'Sessions', emoji: s, title: session.title,
        subLabelSingular: 'Aktivität', subLabelPlural: 'Aktivitäten', subEmoji: a,
        completed: session.countCompletedActivities(), total: session.activities.length, threshold: session.activities_needed_for_adequate_progress,
        notStartedYet: !activity, nextItem: nextActivity,
        skipPart: ', oder eine andere ' + s + ' Session bzw. ein anderes ' + m + ' Modul wählen',
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
        labelSingular: 'Modul', labelPlural: 'Module', emoji: m, title: module.title,
        subLabelSingular: 'Session', subLabelPlural: 'Sessions', subEmoji: s,
        completed: completedSessions, total: completableSessions.length, threshold: module.sessions_needed_for_adequate_progress,
        notStartedYet: completedSessions === 0, nextItem: nextUncompletedSession,
        skipPart: nextModule ? ', oder zu Modul "' + m + ' ' + nextModule.title + '" weitergehen' : null,
      });
    }
    throw new Error('No module entered yet');
  }

  #buildProgressAdviceString({ labelSingular, labelPlural, emoji, title, subLabelSingular, subLabelPlural, subEmoji, completed, total, threshold, notStartedYet, nextItem, skipPart }) {
    const allCoveredPart = skipPart === null ? ' — und das gilt auch für alle anderen ' + labelPlural : '';
    if (skipPart === null) skipPart = '';
    if (completed >= total) return 'Du hast ' + labelSingular + ' "' + emoji + ' ' + title + '" erfolgreich abgeschlossen' + allCoveredPart + '. Die enthaltenen ' + subLabelPlural + ' kannst du jederzeit erneut besuchen' + skipPart + '.';
    if (completed >= threshold) return 'Du hast in ' + labelSingular + ' "' + emoji + ' ' + title + '" ausreichend Fortschritt gemacht' + allCoveredPart + '. Du kannst bleiben und weitere ' + subEmoji + ' ' + subLabelPlural + ' abschliessen' + skipPart + '.';
    if (notStartedYet) return 'Beginne mit einer der verfügbaren ' + subEmoji + ' ' + subLabelPlural + ' in ' + labelSingular + ' "' + emoji + ' ' + title + '".';
    if (!nextItem) throw new Error('No uncompleted ' + subLabelSingular + ' found in ' + labelSingular + ' "' + title + '" despite being below threshold');
    return 'Mach weiter in ' + labelSingular + ' "' + emoji + ' ' + title + '" — zum Beispiel mit ' + subLabelSingular + ' "' + subEmoji + ' ' + nextItem.title + '".';
  }

  populateMenuWithModules() {
    this.#menuLabels = this.#buildMenuLabels(this.#state.modules, ReactStateHelper.#EMOJIS.module);
    this.#menuIds = this.#buildMenuIds(this.#state.modules);
  }

  populateMenuWithSessions() {
    if (!this.#state.currentModuleId) throw new Error('No module entered yet');
    const sessions = this.#findModule(this.#state.currentModuleId).sessions;
    this.#menuLabels = this.#buildMenuLabels(sessions, ReactStateHelper.#EMOJIS.session);
    this.#menuIds = this.#buildMenuIds(sessions);
    this.#addBackEntry(sessions.length, 'Ein anderes ' + ReactStateHelper.#EMOJIS.module + ' Modul wählen', ALL_MODULES_MENU_DIALOG_ID);
  }

  populateMenuWithActivities() {
    if (!this.#state.currentModuleId) throw new Error('No module entered yet');
    if (!this.#state.currentSessionId) throw new Error('No session entered yet');
    const activities = this.#findSession(this.#state.currentSessionId).activities;
    this.#menuLabels = this.#buildMenuLabels(activities, ReactStateHelper.#EMOJIS.activity);
    this.#menuIds = this.#buildMenuIds(activities);
    this.#addBackEntry(activities.length, 'Eine andere ' + ReactStateHelper.#EMOJIS.session + ' Session wählen', ALL_SESSIONS_OF_CURRENT_MODULE_MENU_DIALOG_ID);
    this.#addBackEntry(activities.length + 1, 'Ein anderes ' + ReactStateHelper.#EMOJIS.module + ' Modul wählen', ALL_MODULES_MENU_DIALOG_ID);
  }

  // Puts a back entry into the given slot right after the last item (or after the previous back
  // entry). Those slots always exist: state validation caps sessions per module at
  // MAX_MENU_SLOTS - 1 (one back entry) and activities per session at MAX_MENU_SLOTS - 2 (two).
  #addBackEntry(itemCount, label, id) {
    this.#menuLabels[itemCount] = label;
    this.#menuIds[itemCount] = id;
  }

  // Slot numbers run 1–9, matching the MobileCoach menu label variables. Empty until one of the
  // populateMenuWith…() methods was called ('' hides the slot in MobileCoach).
  getMenuLabel(slot) {
    return this.#menuLabels[slot - 1] ?? '';
  }

  // The id belonging to the label in the same slot ('' for empty slots). In MobileCoach the two are
  // concatenated per slot, e.g. "$rsh_menuLabel1:$rsh_menuId1", to form the routable menu entry: on
  // tap, MobileCoach stores the id in its reserved variable $participantNextMicroDialogIdentifier
  // and navigates to the dialog with that id.
  getMenuId(slot) {
    return this.#menuIds[slot - 1] ?? '';
  }

  // Every label starts with the level emoji; the status marker (✅ done, 👈 next up) is appended
  // after the title, matching the marker-after-id convention of the completion overview.
  #buildMenuLabels(items, levelEmoji) {
    const { completed: completedEmoji, next: nextEmoji } = ReactStateHelper.#EMOJIS;
    const labels = [];
    let nextAssigned = false;
    for (let i = 0; i < MAX_MENU_SLOTS; i++) {
      const item = items[i];
      if (!item) {
        labels.push('');
      } else if (item.isCompleted()) {
        labels.push(levelEmoji + ' ' + item.title + ' ' + completedEmoji);
      } else if (!nextAssigned) {
        labels.push(levelEmoji + ' ' + item.title + ' ' + nextEmoji);
        nextAssigned = true;
      } else {
        labels.push(levelEmoji + ' ' + item.title);
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
  // - $rsh_cmd = "isSessionCompleted('sGesGre')"
  // - $rsh_cmd = "completeActivity()"
  // - $rsh_cmd = "hasModuleAdequateProgress('mBouMgt')"
  // - $rsh_cmd = "getModuleProgress('mBouMgt')"
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

  // getProgressAdvice() throws before any module was entered (e.g. on the very first run), so it
  // is guarded here: a failing advice must never crash the whole output object (decision #37).
  let progressAdvice = '';
  if (helper) {
    try {
      progressAdvice = helper.getProgressAdvice();
    } catch {
      progressAdvice = '';
    }
  }

  // $participantGroup carries both quick-inspection values in one variable, each prefixed with a
  // short label: the participant's location, then the completion overview, separated by " | ".
  // Before the first module is entered there is no location, so it holds the overview alone.
  let participantGroup = null;
  if (helper) {
    const location = helper.getParticipantLocation();
    const overview = 'Completion overview: ' + helper.getCompletionOverview();
    participantGroup = location ? 'Participant location: ' + location + ' | ' + overview : overview;
  }

  let o = {
    // MobileCoach will save these elements to corresponding variables,
    // i.e. rsh_json becomes $rsh_json.
    rsh_json:           helper ? helper.toString() : rsh_json,
    // '' when the command returned nothing (enter…, complete…, populate…), so the variable never holds a stale value from an earlier run.
    rsh_result:         result === undefined ? '' : result,
    rsh_status:         status,
    rsh_error:          error || 'none', // TODO: Möglichst viel weitere nützliche Infos rein-dumpen!
    rsh_progressAdvice: progressAdvice,
    participantGroup:   participantGroup
  };

  // All 9 menu labels and their 9 ids are written back to MobileCoach as individual variables,
  // on every run. A populateMenuWith…() command fills them; after any other command every
  // slot is '' (hidden), so (re)populate the menu right before displaying it.
  for (let i = 1; i <= MAX_MENU_SLOTS; i++) {
    o['rsh_menuLabel' + i] = helper ? helper.getMenuLabel(i) : '';
    o['rsh_menuId' + i] = helper ? helper.getMenuId(i) : '';
  }

  o
}
