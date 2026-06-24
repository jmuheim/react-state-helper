import { describe, it, expect, beforeEach } from 'vitest';

const testState = {
  modules: [
    {
      id: 'm_mod1',
      title: 'Modul Eins',
      sessions_needed_for_adequate_use: 1,
      entered_first_at: null, entered_last_at: null, times_entered: 0,
      sessions: [
        {
          id: 's_ses1intro',
          title: 'Intro Eins',
          activities_needed_for_adequate_use: 1,
          entered_first_at: null, entered_last_at: null, times_entered: 0,
          activities: [],
          isIntro: true,
        },
        {
          id: 's_ses1a',
          title: 'Session Eins A',
          activities_needed_for_adequate_use: 1,
          entered_first_at: null, entered_last_at: null, times_entered: 0,
          activities: [
            { id: 'a_act1a1', title: 'Aktivität 1a-1', entered_first_at: null, entered_last_at: null, times_entered: 0, completed: false },
            { id: 'a_act1a2', title: 'Aktivität 1a-2: Untertitel', entered_first_at: null, entered_last_at: null, times_entered: 0, completed: false },
          ],
        },
        {
          id: 's_ses1b',
          title: 'Session Eins B',
          activities_needed_for_adequate_use: 1,
          entered_first_at: null, entered_last_at: null, times_entered: 0,
          activities: [
            { id: 'a_act1b1', title: 'Aktivität 1b-1', entered_first_at: null, entered_last_at: null, times_entered: 0, completed: false },
          ],
        },
      ],
    },
    {
      id: 'm_mod2',
      title: 'Modul Zwei',
      sessions_needed_for_adequate_use: 1,
      entered_first_at: null, entered_last_at: null, times_entered: 0,
      sessions: [
        {
          id: 's_ses2intro',
          title: 'Intro Zwei',
          activities_needed_for_adequate_use: 1,
          entered_first_at: null, entered_last_at: null, times_entered: 0,
          activities: [],
          isIntro: true,
        },
        {
          id: 's_ses2a',
          title: 'Session Zwei A',
          activities_needed_for_adequate_use: 1,
          entered_first_at: null, entered_last_at: null, times_entered: 0,
          activities: [
            { id: 'a_act2a1', title: 'Aktivität 2a-1', entered_first_at: null, entered_last_at: null, times_entered: 0, completed: false },
          ],
        },
        {
          id: 's_ses2b',
          title: 'Session Zwei B',
          activities_needed_for_adequate_use: 2,
          entered_first_at: null, entered_last_at: null, times_entered: 0,
          activities: [
            { id: 'a_act2b1', title: 'Aktivität 2b-1', entered_first_at: null, entered_last_at: null, times_entered: 0, completed: false },
            { id: 'a_act2b2', title: 'Aktivität 2b-2', entered_first_at: null, entered_last_at: null, times_entered: 0, completed: false },
            { id: 'a_act2b3', title: 'Aktivität 2b-3', entered_first_at: null, entered_last_at: null, times_entered: 0, completed: false },
          ],
        },
      ],
    },
    {
      id: 'm_mod3',
      title: 'Modul Drei',
      sessions_needed_for_adequate_use: 2,
      entered_first_at: null, entered_last_at: null, times_entered: 0,
      sessions: [
        {
          id: 's_ses3intro',
          title: 'Intro Drei',
          activities_needed_for_adequate_use: 1,
          entered_first_at: null, entered_last_at: null, times_entered: 0,
          activities: [],
          isIntro: true,
        },
        {
          id: 's_ses3a',
          title: 'Session Drei A',
          activities_needed_for_adequate_use: 1,
          entered_first_at: null, entered_last_at: null, times_entered: 0,
          activities: [
            { id: 'a_act3a1', title: 'Aktivität 3a-1', entered_first_at: null, entered_last_at: null, times_entered: 0, completed: false },
          ],
        },
        {
          id: 's_ses3b',
          title: 'Session Drei B',
          activities_needed_for_adequate_use: 1,
          entered_first_at: null, entered_last_at: null, times_entered: 0,
          activities: [
            { id: 'a_act3b1', title: 'Aktivität 3b-1', entered_first_at: null, entered_last_at: null, times_entered: 0, completed: false },
          ],
        },
        {
          id: 's_ses3c',
          title: 'Session Drei C',
          activities_needed_for_adequate_use: 1,
          entered_first_at: null, entered_last_at: null, times_entered: 0,
          activities: [
            { id: 'a_act3c1', title: 'Aktivität 3c-1', entered_first_at: null, entered_last_at: null, times_entered: 0, completed: false },
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

describe('ReactStateHelper', () => {
  let helper;

  beforeEach(() => {
    helper = ReactStateHelper.loadExistingState(JSON.stringify(testState));
  });

  describe('initDefaultState', () => {
    it('creates a fresh helper matching initialState()', () => {
      const fresh = ReactStateHelper.initDefaultState();
      expect(fresh.toString()).toBe(JSON.stringify(ReactStateHelper.initialState()));
    });
  });

  describe('loadExistingState', () => {
    it('loads persisted state from JSON', () => {
      helper.enterModule('m_mod1');
      helper.enterSession('s_ses1a');
      expect(helper.isSessionCompleted('s_ses1a')).toBe(false);
      helper.enterActivity('a_act1a1'); helper.markActivityCompleted();
      helper.enterActivity('a_act1a2'); helper.markActivityCompleted();
      const restored = ReactStateHelper.loadExistingState(helper.toString());
      expect(restored.isSessionCompleted('s_ses1a')).toBe(true);
    });
  });

  describe('isSessionCompleted', () => {
    beforeEach(() => {
      helper.enterModule('m_mod1');
    });

    it('returns false for all sessions in the default state', () => {
      expect(helper.isSessionCompleted('s_ses1a')).toBe(false);
      expect(helper.isSessionCompleted('s_ses1b')).toBe(false);
      helper.enterModule('m_mod2');
      expect(helper.isSessionCompleted('s_ses2a')).toBe(false);
    });

    it('returns false when only some activities are completed', () => {
      helper.enterSession('s_ses1a');
      helper.enterActivity('a_act1a1'); helper.markActivityCompleted();
      expect(helper.isSessionCompleted('s_ses1a')).toBe(false);
    });

    it('returns true when all activities are completed', () => {
      helper.enterSession('s_ses1a');
      helper.enterActivity('a_act1a1'); helper.markActivityCompleted();
      helper.enterActivity('a_act1a2'); helper.markActivityCompleted();
      expect(helper.isSessionCompleted('s_ses1a')).toBe(true);
    });

    it('throws if no module has been entered', () => {
      helper = ReactStateHelper.loadExistingState(JSON.stringify(testState));
      expect(() => helper.isSessionCompleted('s_ses1a')).toThrow('No module entered yet');
    });
  });

  describe('hasSessionAdequateProgress', () => {
    beforeEach(() => {
      helper.enterModule('m_mod1');
    });

    it('returns false for all sessions in the default state', () => {
      expect(helper.hasSessionAdequateProgress('s_ses1a')).toBe(false);
      expect(helper.hasSessionAdequateProgress('s_ses1b')).toBe(false);
    });

    it('returns true once completed activities meet the threshold (s_ses1a threshold=1)', () => {
      helper.enterSession('s_ses1a');
      helper.enterActivity('a_act1a1'); helper.markActivityCompleted();
      expect(helper.hasSessionAdequateProgress('s_ses1a')).toBe(true);
    });

    it('unlike isSessionCompleted, stays true even if not all activities are done', () => {
      helper.enterSession('s_ses1a');
      helper.enterActivity('a_act1a1'); helper.markActivityCompleted();
      expect(helper.isSessionCompleted('s_ses1a')).toBe(false);
      expect(helper.hasSessionAdequateProgress('s_ses1a')).toBe(true);
    });

    it('throws if no module has been entered', () => {
      helper = ReactStateHelper.loadExistingState(JSON.stringify(testState));
      expect(() => helper.hasSessionAdequateProgress('s_ses1a')).toThrow('No module entered yet');
    });
  });

  describe('isModuleCompleted', () => {
    it('returns false for all modules in the default state', () => {
      expect(helper.isModuleCompleted('m_mod1')).toBe(false);
      expect(helper.isModuleCompleted('m_mod2')).toBe(false);
    });

    it('returns false when only some sessions are completed', () => {
      helper.enterModule('m_mod1');
      helper.enterSession('s_ses1a');
      helper.enterActivity('a_act1a1'); helper.markActivityCompleted();
      helper.enterActivity('a_act1a2'); helper.markActivityCompleted();
      expect(helper.isModuleCompleted('m_mod1')).toBe(false);
    });

    it('returns true when all sessions with activities are completed', () => {
      helper.enterModule('m_mod1');
      const mod1Data = testState.modules.find(m => m.id === 'm_mod1');
      for (const ses of mod1Data.sessions) {
        helper.enterSession(ses.id);
        for (const act of ses.activities) {
          helper.enterActivity(act.id); helper.markActivityCompleted();
        }
      }
      expect(helper.isModuleCompleted('m_mod1')).toBe(true);
    });

    it('does not count sessions from other modules', () => {
      helper.enterModule('m_mod2');
      const mod2Data = testState.modules.find(m => m.id === 'm_mod2');
      for (const ses of mod2Data.sessions) {
        helper.enterSession(ses.id);
        for (const act of ses.activities) {
          helper.enterActivity(act.id); helper.markActivityCompleted();
        }
      }
      expect(helper.isModuleCompleted('m_mod1')).toBe(false);
    });
  });

  describe('countCompletedSessions', () => {
    it('throws if no module has been entered', () => {
      expect(() => helper.countCompletedSessions()).toThrow('No module entered yet');
    });

    it('returns 0 for the current module in the default state', () => {
      helper.enterModule('m_mod1');
      expect(helper.countCompletedSessions()).toBe(0);
    });

    it('counts only completed sessions within the current module', () => {
      helper.enterModule('m_mod1');
      helper.enterSession('s_ses1a');
      helper.enterActivity('a_act1a1'); helper.markActivityCompleted();
      helper.enterActivity('a_act1a2'); helper.markActivityCompleted();
      expect(helper.countCompletedSessions()).toBe(1);
      helper.enterModule('m_mod2');
      expect(helper.countCompletedSessions()).toBe(0);
    });
  });

  describe('countCompletedOverall', () => {
    it('returns 0 in the default state', () => {
      expect(helper.countCompletedOverall()).toBe(0);
    });

    it('increases as sessions across modules are completed', () => {
      helper.enterModule('m_mod1');
      helper.enterSession('s_ses1a');
      helper.enterActivity('a_act1a1'); helper.markActivityCompleted();
      helper.enterActivity('a_act1a2'); helper.markActivityCompleted();
      expect(helper.countCompletedOverall()).toBe(1);
      helper.enterModule('m_mod2');
      helper.enterSession('s_ses2a');
      helper.enterActivity('a_act2a1'); helper.markActivityCompleted();
      expect(helper.countCompletedOverall()).toBe(2);
    });
  });

  describe('getProgress', () => {
    it('returns 0 in the default state', () => {
      expect(helper.getProgress()).toBe(0);
    });

    it('returns 1 when all sessions are completed', () => {
      for (const mod of testState.modules) {
        helper.enterModule(mod.id);
        for (const ses of mod.sessions) {
          helper.enterSession(ses.id);
          for (const act of ses.activities) {
            helper.enterActivity(act.id); helper.markActivityCompleted();
          }
        }
      }
      expect(helper.getProgress()).toBe(1);
    });
  });

  describe('getModuleProgress', () => {
    it('returns 0 for all modules in the default state', () => {
      expect(helper.getModuleProgress('m_mod1')).toBe(0);
      expect(helper.getModuleProgress('m_mod2')).toBe(0);
    });

    it('returns the fraction of completed sessions within the module (1 of 2 completable)', () => {
      helper.enterModule('m_mod1');
      helper.enterSession('s_ses1a');
      helper.enterActivity('a_act1a1'); helper.markActivityCompleted();
      helper.enterActivity('a_act1a2'); helper.markActivityCompleted();
      expect(helper.getModuleProgress('m_mod1')).toBeCloseTo(1 / 2);
    });

    it('does not count sessions from other modules', () => {
      helper.enterModule('m_mod2');
      helper.enterSession('s_ses2a');
      helper.enterActivity('a_act2a1'); helper.markActivityCompleted();
      expect(helper.getModuleProgress('m_mod1')).toBe(0);
    });

    it('returns 1 when all sessions in the module are completed', () => {
      helper.enterModule('m_mod1');
      const mod1Data = testState.modules.find(m => m.id === 'm_mod1');
      for (const ses of mod1Data.sessions) {
        helper.enterSession(ses.id);
        for (const act of ses.activities) {
          helper.enterActivity(act.id); helper.markActivityCompleted();
        }
      }
      expect(helper.getModuleProgress('m_mod1')).toBe(1);
    });
  });

  describe('isGoodEnough', () => {
    beforeEach(() => {
      helper.enterModule('m_mod1');
    });

    it('returns false with no completed sessions', () => {
      expect(helper.isGoodEnough('m_mod1')).toBe(false);
    });

    it('returns true once the module threshold is met (m_mod1 threshold=1)', () => {
      helper.enterSession('s_ses1a');
      helper.enterActivity('a_act1a1'); helper.markActivityCompleted();
      helper.enterActivity('a_act1a2'); helper.markActivityCompleted();
      expect(helper.isGoodEnough('m_mod1')).toBe(true);
    });

    it('does not count sessions from other modules', () => {
      helper.enterModule('m_mod2');
      helper.enterSession('s_ses2a');
      helper.enterActivity('a_act2a1'); helper.markActivityCompleted();
      expect(helper.isGoodEnough('m_mod1')).toBe(false);
    });
  });

  describe('allCompletedSessionsAsCsv', () => {
    beforeEach(() => {
      helper.enterModule('m_mod1');
      helper.enterSession('s_ses1a');
    });

    it('returns an empty string in the default state', () => {
      expect(helper.allCompletedSessionsAsCsv()).toBe('');
    });

    it('returns a single session id when one session is completed', () => {
      helper.enterActivity('a_act1a1'); helper.markActivityCompleted();
      helper.enterActivity('a_act1a2'); helper.markActivityCompleted();
      expect(helper.allCompletedSessionsAsCsv()).toBe('s_ses1a');
    });

    it('does not include partially completed sessions', () => {
      helper.enterActivity('a_act1a1'); helper.markActivityCompleted();
      expect(helper.allCompletedSessionsAsCsv()).toBe('');
    });

    it('returns comma-separated ids across modules in order', () => {
      helper.enterActivity('a_act1a1'); helper.markActivityCompleted();
      helper.enterActivity('a_act1a2'); helper.markActivityCompleted();
      helper.enterSession('s_ses1b');
      helper.enterActivity('a_act1b1'); helper.markActivityCompleted();
      helper.enterModule('m_mod2');
      helper.enterSession('s_ses2a');
      helper.enterActivity('a_act2a1'); helper.markActivityCompleted();
      expect(helper.allCompletedSessionsAsCsv()).toBe('s_ses1a,s_ses1b,s_ses2a');
    });
  });

  describe('enterModule / enterSession / getParticipantLocation', () => {
    it('returns null before any module has been entered', () => {
      expect(helper.getParticipantLocation()).toBeNull();
    });

    it('returns just the module id after entering a module but no session yet', () => {
      helper.enterModule('m_mod1');
      expect(helper.getParticipantLocation()).toBe('m_mod1');
    });

    it('returns "moduleId: sessionId" after entering a module and session', () => {
      helper.enterModule('m_mod1');
      helper.enterSession('s_ses1a');
      expect(helper.getParticipantLocation()).toBe('m_mod1: s_ses1a');
    });

    it('updates to the most recently entered module and session', () => {
      helper.enterModule('m_mod1');
      helper.enterSession('s_ses1a');
      helper.enterModule('m_mod2');
      helper.enterSession('s_ses2a');
      expect(helper.getParticipantLocation()).toBe('m_mod2: s_ses2a');
    });

    it('appends the activity id once an activity has been entered', () => {
      helper.enterModule('m_mod1');
      helper.enterSession('s_ses1a');
      helper.enterActivity('a_act1a1');
      expect(helper.getParticipantLocation()).toBe('m_mod1: s_ses1a: a_act1a1');
    });

    it('drops the activity id again after entering a new session', () => {
      helper.enterModule('m_mod1');
      helper.enterSession('s_ses1a');
      helper.enterActivity('a_act1a1');
      helper.enterSession('s_ses1b');
      expect(helper.getParticipantLocation()).toBe('m_mod1: s_ses1b');
    });

    it('drops the session and activity ids after entering a new module', () => {
      helper.enterModule('m_mod1');
      helper.enterSession('s_ses1a');
      helper.enterActivity('a_act1a1');
      helper.enterModule('m_mod2');
      expect(helper.getParticipantLocation()).toBe('m_mod2');
    });

    it('drops the activity id but keeps the session id after re-entering the same session', () => {
      helper.enterModule('m_mod1');
      helper.enterSession('s_ses1a');
      helper.enterActivity('a_act1a1');
      helper.enterSession('s_ses1a');
      expect(helper.getParticipantLocation()).toBe('m_mod1: s_ses1a');
    });

    it('sets entered_first_at on first enterModule and does not overwrite it', () => {
      helper.enterModule('m_mod1');
      const first = JSON.parse(helper.toString()).modules.find(m => m.id === 'm_mod1').entered_first_at;
      expect(first).not.toBeNull();
      helper.enterModule('m_mod1');
      const second = JSON.parse(helper.toString()).modules.find(m => m.id === 'm_mod1').entered_first_at;
      expect(second).toBe(first);
    });

    it('increments times_entered on each enterModule', () => {
      helper.enterModule('m_mod1');
      helper.enterModule('m_mod1');
      const mod = JSON.parse(helper.toString()).modules.find(m => m.id === 'm_mod1');
      expect(mod.times_entered).toBe(2);
    });

    it('updates entered_last_at on every enterModule', () => {
      helper.enterModule('m_mod1');
      const first = JSON.parse(helper.toString()).modules.find(m => m.id === 'm_mod1').entered_last_at;
      expect(first).not.toBeNull();
      helper.enterModule('m_mod1');
      const second = JSON.parse(helper.toString()).modules.find(m => m.id === 'm_mod1').entered_last_at;
      expect(second).not.toBeNull();
    });

    it('sets entered_first_at on first enterSession and does not overwrite it', () => {
      helper.enterModule('m_mod1');
      helper.enterSession('s_ses1a');
      const first = JSON.parse(helper.toString()).modules.find(m => m.id === 'm_mod1')
        .sessions.find(s => s.id === 's_ses1a').entered_first_at;
      expect(first).not.toBeNull();
      helper.enterSession('s_ses1a');
      const second = JSON.parse(helper.toString()).modules.find(m => m.id === 'm_mod1')
        .sessions.find(s => s.id === 's_ses1a').entered_first_at;
      expect(second).toBe(first);
    });

    it('increments times_entered on each enterSession', () => {
      helper.enterModule('m_mod1');
      helper.enterSession('s_ses1a');
      helper.enterSession('s_ses1a');
      const session = JSON.parse(helper.toString()).modules.find(m => m.id === 'm_mod1')
        .sessions.find(s => s.id === 's_ses1a');
      expect(session.times_entered).toBe(2);
    });

    it('updates entered_last_at on every enterSession', () => {
      helper.enterModule('m_mod1');
      helper.enterSession('s_ses1a');
      const first = JSON.parse(helper.toString()).modules.find(m => m.id === 'm_mod1')
        .sessions.find(s => s.id === 's_ses1a').entered_last_at;
      expect(first).not.toBeNull();
      helper.enterSession('s_ses1a');
      const second = JSON.parse(helper.toString()).modules.find(m => m.id === 'm_mod1')
        .sessions.find(s => s.id === 's_ses1a').entered_last_at;
      expect(second).not.toBeNull();
    });

    it('persists through serialization', () => {
      helper.enterModule('m_mod1');
      helper.enterSession('s_ses1a');
      const restored = ReactStateHelper.loadExistingState(helper.toString());
      expect(restored.getParticipantLocation()).toBe('m_mod1: s_ses1a');
    });

    it('throws if the moduleId does not exist', () => {
      expect(() => helper.enterModule('nonExistent')).toThrow('Module nonExistent not found');
    });

    it('throws if enterSession is called without a current module', () => {
      expect(() => helper.enterSession('s_ses1a')).toThrow('No module entered yet');
    });

    it('throws if the sessionId is not in the current module', () => {
      helper.enterModule('m_mod1');
      expect(() => helper.enterSession('s_ses2a')).toThrow('Session s_ses2a not found in module m_mod1');
    });

    it('enterModule resets currentSessionId and currentActivityId', () => {
      helper.enterModule('m_mod1');
      helper.enterSession('s_ses1a');
      helper.enterActivity('a_act1a1');
      helper.enterModule('m_mod2');
      const state = JSON.parse(helper.toString());
      expect(state.currentSessionId).toBeNull();
      expect(state.currentActivityId).toBeNull();
    });

    it('enterSession resets currentActivityId', () => {
      helper.enterModule('m_mod1');
      helper.enterSession('s_ses1a');
      helper.enterActivity('a_act1a1');
      helper.enterSession('s_ses1b');
      expect(JSON.parse(helper.toString()).currentActivityId).toBeNull();
    });
  });

  describe('enterActivity', () => {
    beforeEach(() => {
      helper.enterModule('m_mod1');
    });

    it('sets the current activity', () => {
      helper.enterSession('s_ses1a');
      helper.enterActivity('a_act1a1');
      expect(JSON.parse(helper.toString()).currentActivityId).toBe('a_act1a1');
    });

    it('throws if enterActivity is called without a current session', () => {
      expect(() => helper.enterActivity('a_act1a1')).toThrow('No session entered yet');
    });

    it('throws if the activityId is not in the current session', () => {
      helper.enterSession('s_ses1a');
      expect(() => helper.enterActivity('a_act2a1')).toThrow('Activity a_act2a1 not found in session s_ses1a');
    });

    it('sets entered_first_at on first enterActivity and does not overwrite it', () => {
      helper.enterSession('s_ses1a');
      helper.enterActivity('a_act1a1');
      const first = JSON.parse(helper.toString()).modules.find(m => m.id === 'm_mod1')
        .sessions.find(s => s.id === 's_ses1a')
        .activities.find(a => a.id === 'a_act1a1').entered_first_at;
      expect(first).not.toBeNull();
      helper.enterActivity('a_act1a1');
      const second = JSON.parse(helper.toString()).modules.find(m => m.id === 'm_mod1')
        .sessions.find(s => s.id === 's_ses1a')
        .activities.find(a => a.id === 'a_act1a1').entered_first_at;
      expect(second).toBe(first);
    });

    it('increments times_entered on each enterActivity', () => {
      helper.enterSession('s_ses1a');
      helper.enterActivity('a_act1a1');
      helper.enterActivity('a_act1a1');
      const activity = JSON.parse(helper.toString()).modules.find(m => m.id === 'm_mod1')
        .sessions.find(s => s.id === 's_ses1a')
        .activities.find(a => a.id === 'a_act1a1');
      expect(activity.times_entered).toBe(2);
    });

    it('updates entered_last_at on every enterActivity', () => {
      helper.enterSession('s_ses1a');
      helper.enterActivity('a_act1a1');
      const first = JSON.parse(helper.toString()).modules.find(m => m.id === 'm_mod1')
        .sessions.find(s => s.id === 's_ses1a')
        .activities.find(a => a.id === 'a_act1a1').entered_last_at;
      expect(first).not.toBeNull();
      helper.enterActivity('a_act1a1');
      const second = JSON.parse(helper.toString()).modules.find(m => m.id === 'm_mod1')
        .sessions.find(s => s.id === 's_ses1a')
        .activities.find(a => a.id === 'a_act1a1').entered_last_at;
      expect(second).not.toBeNull();
    });
  });

  describe('populateMenuLabelsForModule', () => {
    it('marks the first incomplete module as 👉 and leaves the rest plain', () => {
      const vars = helper.populateMenuLabelsForModule();
      expect(vars.jsStateHelperMenuLabel1).toBe('👉 Modul Eins:m_mod1');
      expect(vars.jsStateHelperMenuLabel2).toBe('Modul Zwei:m_mod2');
    });

    it('fills unused slots with empty string', () => {
      const vars = helper.populateMenuLabelsForModule();
      for (let i = 4; i <= 9; i++) expect(vars[`jsStateHelperMenuLabel${i}`]).toBe('');
    });

    it('marks a completed module with ✅', () => {
      helper.enterModule('m_mod1');
      const mod1Data = testState.modules.find(m => m.id === 'm_mod1');
      for (const ses of mod1Data.sessions) {
        helper.enterSession(ses.id);
        for (const act of ses.activities) {
          helper.enterActivity(act.id); helper.markActivityCompleted();
        }
      }
      const vars = helper.populateMenuLabelsForModule();
      expect(vars.jsStateHelperMenuLabel1).toBe('✅ Modul Eins:m_mod1');
      expect(vars.jsStateHelperMenuLabel2).toBe('👉 Modul Zwei:m_mod2');
    });

    it('marks no module as 👉 when all are ✅', () => {
      for (const mod of testState.modules) {
        helper.enterModule(mod.id);
        for (const ses of mod.sessions) {
          helper.enterSession(ses.id);
          for (const act of ses.activities) {
            helper.enterActivity(act.id); helper.markActivityCompleted();
          }
        }
      }
      const vars = helper.populateMenuLabelsForModule();
      expect(vars.jsStateHelperMenuLabel1).toBe('✅ Modul Eins:m_mod1');
      expect(vars.jsStateHelperMenuLabel2).toBe('✅ Modul Zwei:m_mod2');
    });
  });

  describe('populateMenuLabelsForSession', () => {
    beforeEach(() => {
      helper.enterModule('m_mod1');
    });

    it('marks the first incomplete session as 👉 and leaves the rest plain', () => {
      const vars = helper.populateMenuLabelsForSession();
      expect(vars.jsStateHelperMenuLabel1).toBe('👉 Intro Eins:s_ses1intro');
      expect(vars.jsStateHelperMenuLabel2).toBe('Session Eins A:s_ses1a');
      expect(vars.jsStateHelperMenuLabel3).toBe('Session Eins B:s_ses1b');
    });

    it('fills unused slots with empty string', () => {
      const vars = helper.populateMenuLabelsForSession();
      for (let i = 4; i <= 9; i++) expect(vars[`jsStateHelperMenuLabel${i}`]).toBe('');
    });

    it('marks a completed session with ✅', () => {
      helper.enterSession('s_ses1a');
      helper.enterActivity('a_act1a1'); helper.markActivityCompleted();
      helper.enterActivity('a_act1a2'); helper.markActivityCompleted();
      const vars = helper.populateMenuLabelsForSession();
      expect(vars.jsStateHelperMenuLabel1).toBe('👉 Intro Eins:s_ses1intro');
      expect(vars.jsStateHelperMenuLabel2).toBe('✅ Session Eins A:s_ses1a');
      expect(vars.jsStateHelperMenuLabel3).toBe('Session Eins B:s_ses1b');
    });

    it('marks content sessions as ✅ when all are done (intro session without activities stays as 👉)', () => {
      const mod1Data = testState.modules.find(m => m.id === 'm_mod1');
      for (const ses of mod1Data.sessions) {
        helper.enterSession(ses.id);
        for (const act of ses.activities) {
          helper.enterActivity(act.id); helper.markActivityCompleted();
        }
      }
      const vars = helper.populateMenuLabelsForSession();
      expect(vars.jsStateHelperMenuLabel1).toBe('👉 Intro Eins:s_ses1intro');
      expect(vars.jsStateHelperMenuLabel2).toBe('✅ Session Eins A:s_ses1a');
      expect(vars.jsStateHelperMenuLabel3).toBe('✅ Session Eins B:s_ses1b');
    });

    it('throws if no module has been entered', () => {
      helper = ReactStateHelper.loadExistingState(JSON.stringify(testState));
      expect(() => helper.populateMenuLabelsForSession()).toThrow('No module entered yet');
    });
  });

  describe('populateMenuLabelsForActivity', () => {
    beforeEach(() => {
      helper.enterModule('m_mod1');
      helper.enterSession('s_ses1a');
    });

    it('marks the first incomplete activity as 👉 and leaves the rest plain', () => {
      const vars = helper.populateMenuLabelsForActivity();
      expect(vars.jsStateHelperMenuLabel1).toBe('👉 Aktivität 1a-1:a_act1a1');
      expect(vars.jsStateHelperMenuLabel2).toBe('Aktivität 1a-2: Untertitel:a_act1a2');
    });

    it('fills unused slots with empty string', () => {
      const vars = helper.populateMenuLabelsForActivity();
      for (let i = 3; i <= 9; i++) expect(vars[`jsStateHelperMenuLabel${i}`]).toBe('');
    });

    it('marks a completed activity with ✅', () => {
      helper.enterActivity('a_act1a1'); helper.markActivityCompleted();
      const vars = helper.populateMenuLabelsForActivity();
      expect(vars.jsStateHelperMenuLabel1).toBe('✅ Aktivität 1a-1:a_act1a1');
      expect(vars.jsStateHelperMenuLabel2).toBe('👉 Aktivität 1a-2: Untertitel:a_act1a2');
    });

    it('throws if no module has been entered', () => {
      helper = ReactStateHelper.loadExistingState(JSON.stringify(testState));
      expect(() => helper.populateMenuLabelsForActivity()).toThrow('No module entered yet');
    });

    it('marks no activity as 👉 when all are ✅', () => {
      helper.enterActivity('a_act1a1'); helper.markActivityCompleted();
      helper.enterActivity('a_act1a2'); helper.markActivityCompleted();
      const vars = helper.populateMenuLabelsForActivity();
      expect(vars.jsStateHelperMenuLabel1).toBe('✅ Aktivität 1a-1:a_act1a1');
      expect(vars.jsStateHelperMenuLabel2).toBe('✅ Aktivität 1a-2: Untertitel:a_act1a2');
    });

    it('throws if no session has been entered', () => {
      helper = ReactStateHelper.loadExistingState(JSON.stringify(testState));
      helper.enterModule('m_mod1');
      expect(() => helper.populateMenuLabelsForActivity()).toThrow('No session entered yet');
    });
  });


  describe('getProgressAdvice', () => {
    it('throws when no module is entered', () => {
      expect(() => helper.getProgressAdvice()).toThrow('No module entered yet');
    });

    describe('module-level advice', () => {
      describe('other modules not yet adequately used (m_mod1: threshold 1, 2 completable sessions)', () => {
        beforeEach(() => {
          helper.enterModule('m_mod1');
        });

        it('returns a start-with message when no session has been entered yet', () => {
          expect(helper.getProgressAdvice()).toBe('Beginne mit einer der verfügbaren 📑 Sessions in 🗂️ Modul "Modul Eins".');
        });

        it('returns a keep-going message when some sessions done but below threshold (m_mod3: threshold 2)', () => {
          helper.enterModule('m_mod3');
          helper.enterSession('s_ses3a'); helper.enterActivity('a_act3a1'); helper.markActivityCompleted();
          helper.enterModule('m_mod3');
          expect(helper.getProgressAdvice()).toBe('Mach weiter in 🗂️ Modul "Modul Drei" — zum Beispiel mit 📑 Session "Session Drei B".');
        });

        it('returns good-progress message when threshold met but sessions remain', () => {
          helper.enterSession('s_ses1a'); helper.enterActivity('a_act1a1'); helper.markActivityCompleted(); helper.enterActivity('a_act1a2'); helper.markActivityCompleted();
          helper.enterModule('m_mod1');
          expect(helper.getProgressAdvice()).toBe('Du hast in 🗂️ Modul "Modul Eins" ausreichend Fortschritt gemacht. Du kannst bleiben und weitere 📑 Sessions abschliessen, oder zu 🗂️ Modul "Modul Zwei" weitergehen.');
        });

        it('returns all-completed message when all sessions are done', () => {
          helper.enterSession('s_ses1a'); helper.enterActivity('a_act1a1'); helper.markActivityCompleted(); helper.enterActivity('a_act1a2'); helper.markActivityCompleted();
          helper.enterModule('m_mod1');
          helper.enterSession('s_ses1b'); helper.enterActivity('a_act1b1'); helper.markActivityCompleted();
          helper.enterModule('m_mod1');
          expect(helper.getProgressAdvice()).toBe('Du hast 🗂️ Modul "Modul Eins" erfolgreich abgeschlossen. Die enthaltenen Sessions kannst du jederzeit erneut besuchen, oder zu 🗂️ Modul "Modul Zwei" weitergehen.');
        });
      });

      describe('all other modules adequately used (m_mod3: threshold 2, 3 completable sessions)', () => {
        it('returns good-progress message when threshold met but sessions remain', () => {
          helper.enterModule('m_mod3');
          helper.enterSession('s_ses3a'); helper.enterActivity('a_act3a1'); helper.markActivityCompleted();
          helper.enterModule('m_mod3');
          helper.enterSession('s_ses3b'); helper.enterActivity('a_act3b1'); helper.markActivityCompleted();
          helper.enterModule('m_mod3');
          expect(helper.getProgressAdvice()).toBe('Du hast in 🗂️ Modul "Modul Drei" ausreichend Fortschritt gemacht — und das gilt auch für alle anderen Module. Du kannst bleiben und weitere 📑 Sessions abschliessen.');
        });

        it('returns all-completed message when all sessions are done', () => {
          helper.enterModule('m_mod3');
          helper.enterSession('s_ses3a'); helper.enterActivity('a_act3a1'); helper.markActivityCompleted();
          helper.enterModule('m_mod3');
          helper.enterSession('s_ses3b'); helper.enterActivity('a_act3b1'); helper.markActivityCompleted();
          helper.enterModule('m_mod3');
          helper.enterSession('s_ses3c'); helper.enterActivity('a_act3c1'); helper.markActivityCompleted();
          helper.enterModule('m_mod3');
          expect(helper.getProgressAdvice()).toBe('Du hast 🗂️ Modul "Modul Drei" erfolgreich abgeschlossen — und das gilt auch für alle anderen Module. Die enthaltenen Sessions kannst du jederzeit erneut besuchen.');
        });
      });
    });

    describe('session-level advice', () => {
      it('returns a start-with message when no activity has been entered yet', () => {
        helper.enterModule('m_mod1');
        helper.enterSession('s_ses1a');
        expect(helper.getProgressAdvice()).toBe('Beginne mit einer der verfügbaren 🎯 Aktivitäten in 📑 Session "Session Eins A".');
      });

      it('returns a keep-going message when an activity is done but below threshold (s_ses2b: threshold 2)', () => {
        helper.enterModule('m_mod2');
        helper.enterSession('s_ses2b');
        helper.enterActivity('a_act2b1'); helper.markActivityCompleted();
        expect(helper.getProgressAdvice()).toBe('Mach weiter in 📑 Session "Session Zwei B" — zum Beispiel mit 🎯 Aktivität "Aktivität 2b-2".');
      });

      it('returns an adequate-progress message once the threshold is met but not all activities are done (s_ses1a: threshold 1, 2 activities)', () => {
        helper.enterModule('m_mod1');
        helper.enterSession('s_ses1a');
        helper.enterActivity('a_act1a1'); helper.markActivityCompleted();
        expect(helper.getProgressAdvice()).toBe('Du hast in 📑 Session "Session Eins A" ausreichend Fortschritt gemacht. Du kannst bleiben und weitere 🎯 Aktivitäten abschliessen, oder zu 🗂️ Modul "Modul Eins" zurückgehen.');
      });

      it('returns a session-complete message when all activities are done (s_ses3a: threshold 1, 1 activity)', () => {
        helper.enterModule('m_mod3');
        helper.enterSession('s_ses3a');
        helper.enterActivity('a_act3a1'); helper.markActivityCompleted();
        expect(helper.getProgressAdvice()).toBe('Du hast 📑 Session "Session Drei A" erfolgreich abgeschlossen. Die enthaltenen Aktivitäten kannst du jederzeit erneut besuchen, oder zu 🗂️ Modul "Modul Drei" zurückgehen.');
      });
    });
  });

  describe('markSuggestionSeen / isSuggestionSeen', () => {
    it('is false in the default state', () => {
      expect(helper.isSuggestionSeen()).toBe(false);
    });

    it('becomes true after markSuggestionSeen', () => {
      helper.markSuggestionSeen();
      expect(helper.isSuggestionSeen()).toBe(true);
    });

    it('persists through serialization', () => {
      helper.markSuggestionSeen();
      const restored = ReactStateHelper.loadExistingState(helper.toString());
      expect(restored.isSuggestionSeen()).toBe(true);
    });

    it('is idempotent — calling again leaves it true', () => {
      helper.markSuggestionSeen();
      helper.markSuggestionSeen();
      expect(helper.isSuggestionSeen()).toBe(true);
    });
  });

  describe('production data (ReactStateHelper.initialState()) structural invariants', () => {
    let state;
    beforeEach(() => {
      state = JSON.parse(ReactStateHelper.initDefaultState().toString());
    });

    it('completing every activity in every session reaches full progress without throwing', () => {
      const p = ReactStateHelper.initDefaultState();
      for (const mod of state.modules) {
        p.enterModule(mod.id);
        for (const ses of mod.sessions) {
          p.enterSession(ses.id);
          for (const act of ses.activities) {
            p.enterActivity(act.id);
            p.markActivityCompleted();
          }
        }
      }
      expect(p.getProgress()).toBe(1);
    });
  });

  describe('state validation', () => {
    const minimalValidState = () => ({
      modules: [
        {
          id: 'm_m1',
          title: 'M1',
          sessions_needed_for_adequate_use: 1,
          sessions: [
            {
              id: 's_s1',
              title: 'S1',
              activities_needed_for_adequate_use: 1,
              activities: [{ id: 'a_a1', title: 'A1' }],
            },
          ],
        },
      ],
      suggestionSeen: false,
      currentModuleId: null,
      currentSessionId: null,
      currentActivityId: null,
    });

    it('loads a minimal valid state without throwing', () => {
      expect(() => ReactStateHelper.loadExistingState(JSON.stringify(minimalValidState()))).not.toThrow();
    });

    it('also validates production data when constructing the default state', () => {
      expect(() => ReactStateHelper.initDefaultState()).not.toThrow();
    });

    it('throws naming the colliding id when sessions in different modules reuse an id', () => {
      const state = minimalValidState();
      // The id registry is global, not per-module — a same-level collision across modules must be caught too.
      state.modules.push({
        id: 'm_m2',
        title: 'M2',
        sessions_needed_for_adequate_use: 1,
        sessions: [{ id: 's_s1', title: 'S1 dup', activities_needed_for_adequate_use: 1, activities: [{ id: 'a_a2', title: 'A2' }] }],
      });
      expect(() => ReactStateHelper.loadExistingState(JSON.stringify(state))).toThrow('Duplicate id found in state: s_s1');
    });

    it('throws naming the required prefix when a module id is missing the m_ prefix', () => {
      const state = minimalValidState();
      state.modules[0].id = 'm1';
      expect(() => ReactStateHelper.loadExistingState(JSON.stringify(state))).toThrow('Id m1 must start with "m_"');
    });

    it('throws naming the required prefix when a session id is missing the s_ prefix', () => {
      const state = minimalValidState();
      state.modules[0].sessions[0].id = 's1';
      expect(() => ReactStateHelper.loadExistingState(JSON.stringify(state))).toThrow('Id s1 must start with "s_"');
    });

    it('throws naming the required prefix when an activity id is missing the a_ prefix', () => {
      const state = minimalValidState();
      state.modules[0].sessions[0].activities[0].id = 'a1';
      expect(() => ReactStateHelper.loadExistingState(JSON.stringify(state))).toThrow('Id a1 must start with "a_"');
    });

    it('throws when a module threshold exceeds its own session count', () => {
      const state = minimalValidState();
      state.modules[0].sessions_needed_for_adequate_use = 2;
      expect(() => ReactStateHelper.loadExistingState(JSON.stringify(state))).toThrow('Module m_m1 has an unachievable sessions_needed_for_adequate_use (2) for its 1 session(s)');
    });

    it('throws when a session threshold exceeds its own activity count', () => {
      const state = minimalValidState();
      state.modules[0].sessions[0].activities_needed_for_adequate_use = 2;
      expect(() => ReactStateHelper.loadExistingState(JSON.stringify(state))).toThrow('Session s_s1 has an unachievable activities_needed_for_adequate_use (2) for its 1 activity/activities');
    });

    it('does not enforce a threshold for intro sessions without activities', () => {
      const state = minimalValidState();
      state.modules[0].sessions[0].activities = [];
      state.modules[0].sessions[0].activities_needed_for_adequate_use = 5;
      state.modules[0].sessions[0].isIntro = true;
      // The module needs at least one session with activities besides the intro session under test.
      state.modules[0].sessions.push({ id: 's_s2', title: 'S2', activities_needed_for_adequate_use: 1, activities: [{ id: 'a_a2', title: 'A2' }] });
      expect(() => ReactStateHelper.loadExistingState(JSON.stringify(state))).not.toThrow();
    });

    it('throws when a module has no sessions', () => {
      const state = minimalValidState();
      state.modules[0].sessions = [];
      expect(() => ReactStateHelper.loadExistingState(JSON.stringify(state))).toThrow('Module m_m1 has no sessions');
    });

    it('throws when a module has only sessions without activities', () => {
      const state = minimalValidState();
      state.modules[0].sessions[0].activities = [];
      state.modules[0].sessions[0].isIntro = true;
      expect(() => ReactStateHelper.loadExistingState(JSON.stringify(state))).toThrow('Module m_m1 has no sessions with activities (every module needs at least one non-intro session)');
    });

    it('throws when a non-intro session has no activities', () => {
      const state = minimalValidState();
      state.modules[0].sessions[0].activities = [];
      expect(() => ReactStateHelper.loadExistingState(JSON.stringify(state))).toThrow('Session s_s1 has no activities (set isIntro: true if this is intentional)');
    });

    it('does not throw when an intro-session has no activities', () => {
      const state = minimalValidState();
      state.modules[0].sessions[0].activities = [];
      state.modules[0].sessions[0].isIntro = true;
      // The module needs at least one session with activities besides the intro session under test.
      state.modules[0].sessions.push({ id: 's_s2', title: 'S2', activities_needed_for_adequate_use: 1, activities: [{ id: 'a_a2', title: 'A2' }] });
      expect(() => ReactStateHelper.loadExistingState(JSON.stringify(state))).not.toThrow();
    });

    it('throws when more than 9 modules are present', () => {
      const state = minimalValidState();
      // Each module must be individually valid — the per-module checks fire before this top-level count check does.
      state.modules = Array.from({ length: 10 }, (_, i) => ({
        id: `m_m${i}`,
        title: `M${i}`,
        sessions_needed_for_adequate_use: 1,
        sessions: [{ id: `s_s${i}`, title: `S${i}`, activities_needed_for_adequate_use: 1, activities: [{ id: `a_a${i}`, title: `A${i}` }] }],
      }));
      expect(() => ReactStateHelper.loadExistingState(JSON.stringify(state))).toThrow('State has 10 modules, but at most 9 are supported');
    });

    it('throws when a module has more than 9 sessions', () => {
      const state = minimalValidState();
      state.modules[0].sessions = Array.from({ length: 10 }, (_, i) =>
        i === 0
          ? { id: `s_s${i}`, title: `S${i}`, activities_needed_for_adequate_use: 1, activities: [{ id: `a_a${i}`, title: `A${i}` }] }
          : { id: `s_s${i}`, title: `S${i}`, activities_needed_for_adequate_use: 1, activities: [], isIntro: true }
      );
      expect(() => ReactStateHelper.loadExistingState(JSON.stringify(state))).toThrow('Module m_m1 has 10 sessions, but at most 9 are supported');
    });

    it('throws when a session has more than 9 activities', () => {
      const state = minimalValidState();
      state.modules[0].sessions[0].activities = Array.from({ length: 10 }, (_, i) => ({ id: `a_a${i}`, title: `A${i}` }));
      expect(() => ReactStateHelper.loadExistingState(JSON.stringify(state))).toThrow('Session s_s1 has 10 activities, but at most 9 are supported');
    });
  });
});
