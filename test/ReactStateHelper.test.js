import { describe, it, expect, beforeEach } from 'vitest';

const testState = {
  modules: [
    {
      id: 'mod1',
      title: 'Module One',
      sessions_needed_for_adequate_use: 1,
      entered_first_at: null, entered_last_at: null, times_entered: 0,
      sessions: [
        {
          id: 'ses1intro',
          title: 'Intro One',
          activities_needed_for_adequate_use: 1,
          entered_first_at: null, entered_last_at: null, times_entered: 0,
          activities: [],
        },
        {
          id: 'ses1a',
          title: 'Session One A',
          activities_needed_for_adequate_use: 1,
          entered_first_at: null, entered_last_at: null, times_entered: 0,
          activities: [
            { id: 'act1a1', title: 'Activity 1a-1', entered_first_at: null, entered_last_at: null, times_entered: 0, completed: false },
            { id: 'act1a2', title: 'Activity 1a-2: Subtitle', entered_first_at: null, entered_last_at: null, times_entered: 0, completed: false },
          ],
        },
        {
          id: 'ses1b',
          title: 'Session One B',
          activities_needed_for_adequate_use: 1,
          entered_first_at: null, entered_last_at: null, times_entered: 0,
          activities: [
            { id: 'act1b1', title: 'Activity 1b-1', entered_first_at: null, entered_last_at: null, times_entered: 0, completed: false },
          ],
        },
      ],
    },
    {
      id: 'mod2',
      title: 'Module Two',
      sessions_needed_for_adequate_use: 1,
      entered_first_at: null, entered_last_at: null, times_entered: 0,
      sessions: [
        {
          id: 'ses2intro',
          title: 'Intro Two',
          activities_needed_for_adequate_use: 1,
          entered_first_at: null, entered_last_at: null, times_entered: 0,
          activities: [],
        },
        {
          id: 'ses2a',
          title: 'Session Two A',
          activities_needed_for_adequate_use: 1,
          entered_first_at: null, entered_last_at: null, times_entered: 0,
          activities: [
            { id: 'act2a1', title: 'Activity 2a-1', entered_first_at: null, entered_last_at: null, times_entered: 0, completed: false },
          ],
        },
        {
          id: 'ses2b',
          title: 'Session Two B',
          activities_needed_for_adequate_use: 2,
          entered_first_at: null, entered_last_at: null, times_entered: 0,
          activities: [
            { id: 'act2b1', title: 'Activity 2b-1', entered_first_at: null, entered_last_at: null, times_entered: 0, completed: false },
            { id: 'act2b2', title: 'Activity 2b-2', entered_first_at: null, entered_last_at: null, times_entered: 0, completed: false },
            { id: 'act2b3', title: 'Activity 2b-3', entered_first_at: null, entered_last_at: null, times_entered: 0, completed: false },
          ],
        },
      ],
    },
    {
      id: 'mod3',
      title: 'Module Three',
      sessions_needed_for_adequate_use: 2,
      entered_first_at: null, entered_last_at: null, times_entered: 0,
      sessions: [
        {
          id: 'ses3intro',
          title: 'Intro Three',
          activities_needed_for_adequate_use: 1,
          entered_first_at: null, entered_last_at: null, times_entered: 0,
          activities: [],
        },
        {
          id: 'ses3a',
          title: 'Session Three A',
          activities_needed_for_adequate_use: 1,
          entered_first_at: null, entered_last_at: null, times_entered: 0,
          activities: [
            { id: 'act3a1', title: 'Activity 3a-1', entered_first_at: null, entered_last_at: null, times_entered: 0, completed: false },
          ],
        },
        {
          id: 'ses3b',
          title: 'Session Three B',
          activities_needed_for_adequate_use: 1,
          entered_first_at: null, entered_last_at: null, times_entered: 0,
          activities: [
            { id: 'act3b1', title: 'Activity 3b-1', entered_first_at: null, entered_last_at: null, times_entered: 0, completed: false },
          ],
        },
        {
          id: 'ses3c',
          title: 'Session Three C',
          activities_needed_for_adequate_use: 1,
          entered_first_at: null, entered_last_at: null, times_entered: 0,
          activities: [
            { id: 'act3c1', title: 'Activity 3c-1', entered_first_at: null, entered_last_at: null, times_entered: 0, completed: false },
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
      helper.enterModule('mod1');
      helper.enterSession('ses1a');
      expect(helper.isSessionCompleted('ses1a')).toBe(false);
      helper.enterActivity('act1a1'); helper.markActivityCompleted();
      helper.enterActivity('act1a2'); helper.markActivityCompleted();
      const restored = ReactStateHelper.loadExistingState(helper.toString());
      expect(restored.isSessionCompleted('ses1a')).toBe(true);
    });
  });

  describe('isSessionCompleted', () => {
    beforeEach(() => {
      helper.enterModule('mod1');
    });

    it('returns false for all sessions in the default state', () => {
      expect(helper.isSessionCompleted('ses1a')).toBe(false);
      expect(helper.isSessionCompleted('ses1b')).toBe(false);
      helper.enterModule('mod2');
      expect(helper.isSessionCompleted('ses2a')).toBe(false);
    });

    it('returns false when only some activities are completed', () => {
      helper.enterSession('ses1a');
      helper.enterActivity('act1a1'); helper.markActivityCompleted();
      expect(helper.isSessionCompleted('ses1a')).toBe(false);
    });

    it('returns true when all activities are completed', () => {
      helper.enterSession('ses1a');
      helper.enterActivity('act1a1'); helper.markActivityCompleted();
      helper.enterActivity('act1a2'); helper.markActivityCompleted();
      expect(helper.isSessionCompleted('ses1a')).toBe(true);
    });

    it('throws if no module has been entered', () => {
      helper = ReactStateHelper.loadExistingState(JSON.stringify(testState));
      expect(() => helper.isSessionCompleted('ses1a')).toThrow('No module entered yet');
    });
  });

  describe('hasSessionAdequateProgress', () => {
    beforeEach(() => {
      helper.enterModule('mod1');
    });

    it('returns false for all sessions in the default state', () => {
      expect(helper.hasSessionAdequateProgress('ses1a')).toBe(false);
      expect(helper.hasSessionAdequateProgress('ses1b')).toBe(false);
    });

    it('returns true once completed activities meet the threshold (ses1a threshold=1)', () => {
      helper.enterSession('ses1a');
      helper.enterActivity('act1a1'); helper.markActivityCompleted();
      expect(helper.hasSessionAdequateProgress('ses1a')).toBe(true);
    });

    it('unlike isSessionCompleted, stays true even if not all activities are done', () => {
      helper.enterSession('ses1a');
      helper.enterActivity('act1a1'); helper.markActivityCompleted();
      expect(helper.isSessionCompleted('ses1a')).toBe(false);
      expect(helper.hasSessionAdequateProgress('ses1a')).toBe(true);
    });

    it('throws if no module has been entered', () => {
      helper = ReactStateHelper.loadExistingState(JSON.stringify(testState));
      expect(() => helper.hasSessionAdequateProgress('ses1a')).toThrow('No module entered yet');
    });
  });

  describe('isModuleCompleted', () => {
    it('returns false for all modules in the default state', () => {
      expect(helper.isModuleCompleted('mod1')).toBe(false);
      expect(helper.isModuleCompleted('mod2')).toBe(false);
    });

    it('returns false when only some sessions are completed', () => {
      helper.enterModule('mod1');
      helper.enterSession('ses1a');
      helper.enterActivity('act1a1'); helper.markActivityCompleted();
      helper.enterActivity('act1a2'); helper.markActivityCompleted();
      expect(helper.isModuleCompleted('mod1')).toBe(false);
    });

    it('returns true when all sessions with activities are completed', () => {
      helper.enterModule('mod1');
      const mod1Data = testState.modules.find(m => m.id === 'mod1');
      for (const ses of mod1Data.sessions) {
        helper.enterSession(ses.id);
        for (const act of ses.activities) {
          helper.enterActivity(act.id); helper.markActivityCompleted();
        }
      }
      expect(helper.isModuleCompleted('mod1')).toBe(true);
    });

    it('does not count sessions from other modules', () => {
      helper.enterModule('mod2');
      const mod2Data = testState.modules.find(m => m.id === 'mod2');
      for (const ses of mod2Data.sessions) {
        helper.enterSession(ses.id);
        for (const act of ses.activities) {
          helper.enterActivity(act.id); helper.markActivityCompleted();
        }
      }
      expect(helper.isModuleCompleted('mod1')).toBe(false);
    });
  });

  describe('countCompletedSessions', () => {
    it('throws if no module has been entered', () => {
      expect(() => helper.countCompletedSessions()).toThrow('No module entered yet');
    });

    it('returns 0 for the current module in the default state', () => {
      helper.enterModule('mod1');
      expect(helper.countCompletedSessions()).toBe(0);
    });

    it('counts only completed sessions within the current module', () => {
      helper.enterModule('mod1');
      helper.enterSession('ses1a');
      helper.enterActivity('act1a1'); helper.markActivityCompleted();
      helper.enterActivity('act1a2'); helper.markActivityCompleted();
      expect(helper.countCompletedSessions()).toBe(1);
      helper.enterModule('mod2');
      expect(helper.countCompletedSessions()).toBe(0);
    });
  });

  describe('countCompletedOverall', () => {
    it('returns 0 in the default state', () => {
      expect(helper.countCompletedOverall()).toBe(0);
    });

    it('increases as sessions across modules are completed', () => {
      helper.enterModule('mod1');
      helper.enterSession('ses1a');
      helper.enterActivity('act1a1'); helper.markActivityCompleted();
      helper.enterActivity('act1a2'); helper.markActivityCompleted();
      expect(helper.countCompletedOverall()).toBe(1);
      helper.enterModule('mod2');
      helper.enterSession('ses2a');
      helper.enterActivity('act2a1'); helper.markActivityCompleted();
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
      expect(helper.getModuleProgress('mod1')).toBe(0);
      expect(helper.getModuleProgress('mod2')).toBe(0);
    });

    it('returns the fraction of completed sessions within the module (1 of 2 completable)', () => {
      helper.enterModule('mod1');
      helper.enterSession('ses1a');
      helper.enterActivity('act1a1'); helper.markActivityCompleted();
      helper.enterActivity('act1a2'); helper.markActivityCompleted();
      expect(helper.getModuleProgress('mod1')).toBeCloseTo(1 / 2);
    });

    it('does not count sessions from other modules', () => {
      helper.enterModule('mod2');
      helper.enterSession('ses2a');
      helper.enterActivity('act2a1'); helper.markActivityCompleted();
      expect(helper.getModuleProgress('mod1')).toBe(0);
    });

    it('returns 1 when all sessions in the module are completed', () => {
      helper.enterModule('mod1');
      const mod1Data = testState.modules.find(m => m.id === 'mod1');
      for (const ses of mod1Data.sessions) {
        helper.enterSession(ses.id);
        for (const act of ses.activities) {
          helper.enterActivity(act.id); helper.markActivityCompleted();
        }
      }
      expect(helper.getModuleProgress('mod1')).toBe(1);
    });
  });

  describe('isGoodEnough', () => {
    beforeEach(() => {
      helper.enterModule('mod1');
    });

    it('returns false with no completed sessions', () => {
      expect(helper.isGoodEnough('mod1')).toBe(false);
    });

    it('returns true once the module threshold is met (mod1 threshold=1)', () => {
      helper.enterSession('ses1a');
      helper.enterActivity('act1a1'); helper.markActivityCompleted();
      helper.enterActivity('act1a2'); helper.markActivityCompleted();
      expect(helper.isGoodEnough('mod1')).toBe(true);
    });

    it('does not count sessions from other modules', () => {
      helper.enterModule('mod2');
      helper.enterSession('ses2a');
      helper.enterActivity('act2a1'); helper.markActivityCompleted();
      expect(helper.isGoodEnough('mod1')).toBe(false);
    });
  });

  describe('allCompletedSessionsAsCsv', () => {
    beforeEach(() => {
      helper.enterModule('mod1');
      helper.enterSession('ses1a');
    });

    it('returns an empty string in the default state', () => {
      expect(helper.allCompletedSessionsAsCsv()).toBe('');
    });

    it('returns a single session id when one session is completed', () => {
      helper.enterActivity('act1a1'); helper.markActivityCompleted();
      helper.enterActivity('act1a2'); helper.markActivityCompleted();
      expect(helper.allCompletedSessionsAsCsv()).toBe('ses1a');
    });

    it('does not include partially completed sessions', () => {
      helper.enterActivity('act1a1'); helper.markActivityCompleted();
      expect(helper.allCompletedSessionsAsCsv()).toBe('');
    });

    it('returns comma-separated ids across modules in order', () => {
      helper.enterActivity('act1a1'); helper.markActivityCompleted();
      helper.enterActivity('act1a2'); helper.markActivityCompleted();
      helper.enterSession('ses1b');
      helper.enterActivity('act1b1'); helper.markActivityCompleted();
      helper.enterModule('mod2');
      helper.enterSession('ses2a');
      helper.enterActivity('act2a1'); helper.markActivityCompleted();
      expect(helper.allCompletedSessionsAsCsv()).toBe('ses1a,ses1b,ses2a');
    });
  });

  describe('enterModule / enterSession / getParticipantGroup', () => {
    it('returns null before any session has been entered', () => {
      expect(helper.getParticipantGroup()).toBeNull();
    });

    it('returns "moduleId: sessionId" after entering a module and session', () => {
      helper.enterModule('mod1');
      helper.enterSession('ses1a');
      expect(helper.getParticipantGroup()).toBe('mod1: ses1a');
    });

    it('updates to the most recently entered module and session', () => {
      helper.enterModule('mod1');
      helper.enterSession('ses1a');
      helper.enterModule('mod2');
      helper.enterSession('ses2a');
      expect(helper.getParticipantGroup()).toBe('mod2: ses2a');
    });

    it('sets entered_first_at on first enterModule and does not overwrite it', () => {
      helper.enterModule('mod1');
      const first = JSON.parse(helper.toString()).modules.find(m => m.id === 'mod1').entered_first_at;
      expect(first).not.toBeNull();
      helper.enterModule('mod1');
      const second = JSON.parse(helper.toString()).modules.find(m => m.id === 'mod1').entered_first_at;
      expect(second).toBe(first);
    });

    it('increments times_entered on each enterModule', () => {
      helper.enterModule('mod1');
      helper.enterModule('mod1');
      const mod = JSON.parse(helper.toString()).modules.find(m => m.id === 'mod1');
      expect(mod.times_entered).toBe(2);
    });

    it('updates entered_last_at on every enterModule', () => {
      helper.enterModule('mod1');
      const first = JSON.parse(helper.toString()).modules.find(m => m.id === 'mod1').entered_last_at;
      expect(first).not.toBeNull();
      helper.enterModule('mod1');
      const second = JSON.parse(helper.toString()).modules.find(m => m.id === 'mod1').entered_last_at;
      expect(second).not.toBeNull();
    });

    it('sets entered_first_at on first enterSession and does not overwrite it', () => {
      helper.enterModule('mod1');
      helper.enterSession('ses1a');
      const first = JSON.parse(helper.toString()).modules.find(m => m.id === 'mod1')
        .sessions.find(s => s.id === 'ses1a').entered_first_at;
      expect(first).not.toBeNull();
      helper.enterSession('ses1a');
      const second = JSON.parse(helper.toString()).modules.find(m => m.id === 'mod1')
        .sessions.find(s => s.id === 'ses1a').entered_first_at;
      expect(second).toBe(first);
    });

    it('increments times_entered on each enterSession', () => {
      helper.enterModule('mod1');
      helper.enterSession('ses1a');
      helper.enterSession('ses1a');
      const session = JSON.parse(helper.toString()).modules.find(m => m.id === 'mod1')
        .sessions.find(s => s.id === 'ses1a');
      expect(session.times_entered).toBe(2);
    });

    it('updates entered_last_at on every enterSession', () => {
      helper.enterModule('mod1');
      helper.enterSession('ses1a');
      const first = JSON.parse(helper.toString()).modules.find(m => m.id === 'mod1')
        .sessions.find(s => s.id === 'ses1a').entered_last_at;
      expect(first).not.toBeNull();
      helper.enterSession('ses1a');
      const second = JSON.parse(helper.toString()).modules.find(m => m.id === 'mod1')
        .sessions.find(s => s.id === 'ses1a').entered_last_at;
      expect(second).not.toBeNull();
    });

    it('persists through serialization', () => {
      helper.enterModule('mod1');
      helper.enterSession('ses1a');
      const restored = ReactStateHelper.loadExistingState(helper.toString());
      expect(restored.getParticipantGroup()).toBe('mod1: ses1a');
    });

    it('throws if the moduleId does not exist', () => {
      expect(() => helper.enterModule('nonExistent')).toThrow('Module nonExistent not found');
    });

    it('throws if enterSession is called without a current module', () => {
      expect(() => helper.enterSession('ses1a')).toThrow('No module entered yet');
    });

    it('throws if the sessionId is not in the current module', () => {
      helper.enterModule('mod1');
      expect(() => helper.enterSession('ses2a')).toThrow('Session ses2a not found in module mod1');
    });

    it('enterModule resets currentSessionId and currentActivityId', () => {
      helper.enterModule('mod1');
      helper.enterSession('ses1a');
      helper.enterActivity('act1a1');
      helper.enterModule('mod2');
      const state = JSON.parse(helper.toString());
      expect(state.currentSessionId).toBeNull();
      expect(state.currentActivityId).toBeNull();
    });

    it('enterSession resets currentActivityId', () => {
      helper.enterModule('mod1');
      helper.enterSession('ses1a');
      helper.enterActivity('act1a1');
      helper.enterSession('ses1b');
      expect(JSON.parse(helper.toString()).currentActivityId).toBeNull();
    });
  });

  describe('enterActivity', () => {
    beforeEach(() => {
      helper.enterModule('mod1');
    });

    it('sets the current activity', () => {
      helper.enterSession('ses1a');
      helper.enterActivity('act1a1');
      expect(JSON.parse(helper.toString()).currentActivityId).toBe('act1a1');
    });

    it('throws if enterActivity is called without a current session', () => {
      expect(() => helper.enterActivity('act1a1')).toThrow('No session entered yet');
    });

    it('throws if the activityId is not in the current session', () => {
      helper.enterSession('ses1a');
      expect(() => helper.enterActivity('act2a1')).toThrow('Activity act2a1 not found in session ses1a');
    });

    it('sets entered_first_at on first enterActivity and does not overwrite it', () => {
      helper.enterSession('ses1a');
      helper.enterActivity('act1a1');
      const first = JSON.parse(helper.toString()).modules.find(m => m.id === 'mod1')
        .sessions.find(s => s.id === 'ses1a')
        .activities.find(a => a.id === 'act1a1').entered_first_at;
      expect(first).not.toBeNull();
      helper.enterActivity('act1a1');
      const second = JSON.parse(helper.toString()).modules.find(m => m.id === 'mod1')
        .sessions.find(s => s.id === 'ses1a')
        .activities.find(a => a.id === 'act1a1').entered_first_at;
      expect(second).toBe(first);
    });

    it('increments times_entered on each enterActivity', () => {
      helper.enterSession('ses1a');
      helper.enterActivity('act1a1');
      helper.enterActivity('act1a1');
      const activity = JSON.parse(helper.toString()).modules.find(m => m.id === 'mod1')
        .sessions.find(s => s.id === 'ses1a')
        .activities.find(a => a.id === 'act1a1');
      expect(activity.times_entered).toBe(2);
    });

    it('updates entered_last_at on every enterActivity', () => {
      helper.enterSession('ses1a');
      helper.enterActivity('act1a1');
      const first = JSON.parse(helper.toString()).modules.find(m => m.id === 'mod1')
        .sessions.find(s => s.id === 'ses1a')
        .activities.find(a => a.id === 'act1a1').entered_last_at;
      expect(first).not.toBeNull();
      helper.enterActivity('act1a1');
      const second = JSON.parse(helper.toString()).modules.find(m => m.id === 'mod1')
        .sessions.find(s => s.id === 'ses1a')
        .activities.find(a => a.id === 'act1a1').entered_last_at;
      expect(second).not.toBeNull();
    });
  });

  describe('populateMenuLabelsForModule', () => {
    it('marks the first incomplete module as 👉 and leaves the rest plain', () => {
      const vars = helper.populateMenuLabelsForModule();
      expect(vars.jsStateHelperMenuLabel1).toBe('👉 Module One:mod1');
      expect(vars.jsStateHelperMenuLabel2).toBe('Module Two:mod2');
    });

    it('fills unused slots with empty string', () => {
      const vars = helper.populateMenuLabelsForModule();
      for (let i = 4; i <= 9; i++) expect(vars[`jsStateHelperMenuLabel${i}`]).toBe('');
    });

    it('marks a completed module with ✅', () => {
      helper.enterModule('mod1');
      const mod1Data = testState.modules.find(m => m.id === 'mod1');
      for (const ses of mod1Data.sessions) {
        helper.enterSession(ses.id);
        for (const act of ses.activities) {
          helper.enterActivity(act.id); helper.markActivityCompleted();
        }
      }
      const vars = helper.populateMenuLabelsForModule();
      expect(vars.jsStateHelperMenuLabel1).toBe('✅ Module One:mod1');
      expect(vars.jsStateHelperMenuLabel2).toBe('👉 Module Two:mod2');
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
      expect(vars.jsStateHelperMenuLabel1).toBe('✅ Module One:mod1');
      expect(vars.jsStateHelperMenuLabel2).toBe('✅ Module Two:mod2');
    });
  });

  describe('populateMenuLabelsForSession', () => {
    beforeEach(() => {
      helper.enterModule('mod1');
    });

    it('marks the first incomplete session as 👉 and leaves the rest plain', () => {
      const vars = helper.populateMenuLabelsForSession();
      expect(vars.jsStateHelperMenuLabel1).toBe('👉 Intro One:ses1intro');
      expect(vars.jsStateHelperMenuLabel2).toBe('Session One A:ses1a');
      expect(vars.jsStateHelperMenuLabel3).toBe('Session One B:ses1b');
    });

    it('fills unused slots with empty string', () => {
      const vars = helper.populateMenuLabelsForSession();
      for (let i = 4; i <= 9; i++) expect(vars[`jsStateHelperMenuLabel${i}`]).toBe('');
    });

    it('marks a completed session with ✅', () => {
      helper.enterSession('ses1a');
      helper.enterActivity('act1a1'); helper.markActivityCompleted();
      helper.enterActivity('act1a2'); helper.markActivityCompleted();
      const vars = helper.populateMenuLabelsForSession();
      expect(vars.jsStateHelperMenuLabel1).toBe('👉 Intro One:ses1intro');
      expect(vars.jsStateHelperMenuLabel2).toBe('✅ Session One A:ses1a');
      expect(vars.jsStateHelperMenuLabel3).toBe('Session One B:ses1b');
    });

    it('marks content sessions as ✅ when all are done (intro session without activities stays as 👉)', () => {
      const mod1Data = testState.modules.find(m => m.id === 'mod1');
      for (const ses of mod1Data.sessions) {
        helper.enterSession(ses.id);
        for (const act of ses.activities) {
          helper.enterActivity(act.id); helper.markActivityCompleted();
        }
      }
      const vars = helper.populateMenuLabelsForSession();
      expect(vars.jsStateHelperMenuLabel1).toBe('👉 Intro One:ses1intro');
      expect(vars.jsStateHelperMenuLabel2).toBe('✅ Session One A:ses1a');
      expect(vars.jsStateHelperMenuLabel3).toBe('✅ Session One B:ses1b');
    });

    it('throws if no module has been entered', () => {
      helper = ReactStateHelper.loadExistingState(JSON.stringify(testState));
      expect(() => helper.populateMenuLabelsForSession()).toThrow('No module entered yet');
    });
  });

  describe('populateMenuLabelsForActivity', () => {
    beforeEach(() => {
      helper.enterModule('mod1');
      helper.enterSession('ses1a');
    });

    it('marks the first incomplete activity as 👉 and leaves the rest plain', () => {
      const vars = helper.populateMenuLabelsForActivity();
      expect(vars.jsStateHelperMenuLabel1).toBe('👉 Activity 1a-1:act1a1');
      expect(vars.jsStateHelperMenuLabel2).toBe('Activity 1a-2: Subtitle:act1a2');
    });

    it('fills unused slots with empty string', () => {
      const vars = helper.populateMenuLabelsForActivity();
      for (let i = 3; i <= 9; i++) expect(vars[`jsStateHelperMenuLabel${i}`]).toBe('');
    });

    it('marks a completed activity with ✅', () => {
      helper.enterActivity('act1a1'); helper.markActivityCompleted();
      const vars = helper.populateMenuLabelsForActivity();
      expect(vars.jsStateHelperMenuLabel1).toBe('✅ Activity 1a-1:act1a1');
      expect(vars.jsStateHelperMenuLabel2).toBe('👉 Activity 1a-2: Subtitle:act1a2');
    });

    it('throws if no module has been entered', () => {
      helper = ReactStateHelper.loadExistingState(JSON.stringify(testState));
      expect(() => helper.populateMenuLabelsForActivity()).toThrow('No module entered yet');
    });

    it('marks no activity as 👉 when all are ✅', () => {
      helper.enterActivity('act1a1'); helper.markActivityCompleted();
      helper.enterActivity('act1a2'); helper.markActivityCompleted();
      const vars = helper.populateMenuLabelsForActivity();
      expect(vars.jsStateHelperMenuLabel1).toBe('✅ Activity 1a-1:act1a1');
      expect(vars.jsStateHelperMenuLabel2).toBe('✅ Activity 1a-2: Subtitle:act1a2');
    });

    it('throws if no session has been entered', () => {
      helper = ReactStateHelper.loadExistingState(JSON.stringify(testState));
      helper.enterModule('mod1');
      expect(() => helper.populateMenuLabelsForActivity()).toThrow('No session entered yet');
    });
  });


  describe('getProgressAdvice', () => {
    it('throws when no module is entered', () => {
      expect(() => helper.getProgressAdvice()).toThrow('No module entered yet');
    });

    describe('module-level advice (mod1: threshold 1, 2 completable sessions)', () => {
      beforeEach(() => {
        helper.enterModule('mod1');
      });

      it('returns a start-with message when no session has been entered yet', () => {
        expect(helper.getProgressAdvice()).toBe('Start with one of the available 📑 sessions in module 🗂️ "Module One".');
      });

      it('returns a keep-going message when some sessions done but below threshold (mod3: threshold 2)', () => {
        helper.enterModule('mod3');
        helper.enterSession('ses3a'); helper.enterActivity('act3a1'); helper.markActivityCompleted();
        helper.enterModule('mod3');
        expect(helper.getProgressAdvice()).toBe('Keep going in module 🗂️ "Module Three" — next up is 📑 session "Session Three B".');
      });

      it('returns good-progress message when threshold met but sessions remain', () => {
        helper.enterSession('ses1a'); helper.enterActivity('act1a1'); helper.markActivityCompleted(); helper.enterActivity('act1a2'); helper.markActivityCompleted();
        helper.enterModule('mod1');
        expect(helper.getProgressAdvice()).toBe('You have good progress in module 🗂️ "Module One". You can stay and complete more 📑 sessions, or skip to module 🗂️ "Module Two".');
      });

      it('returns all-completed message when all sessions are done', () => {
        helper.enterSession('ses1a'); helper.enterActivity('act1a1'); helper.markActivityCompleted(); helper.enterActivity('act1a2'); helper.markActivityCompleted();
        helper.enterModule('mod1');
        helper.enterSession('ses1b'); helper.enterActivity('act1b1'); helper.markActivityCompleted();
        helper.enterModule('mod1');
        expect(helper.getProgressAdvice()).toBe('You have completed all 📑 sessions in module 🗂️ "Module One". You can re-visit them as often as you like, or skip to module 🗂️ "Module Two".');
      });
    });

    describe('module-level advice on the last module — all modules covered (mod3: threshold 2, 3 completable sessions)', () => {
      it('returns good-progress message when threshold met but sessions remain', () => {
        helper.enterModule('mod3');
        helper.enterSession('ses3a'); helper.enterActivity('act3a1'); helper.markActivityCompleted();
        helper.enterModule('mod3');
        helper.enterSession('ses3b'); helper.enterActivity('act3b1'); helper.markActivityCompleted();
        helper.enterModule('mod3');
        expect(helper.getProgressAdvice()).toBe('You have good progress in module 🗂️ "Module Three" — and in every other module, too. You can stay and complete more 📑 sessions.');
      });

      it('returns all-completed message when all sessions are done', () => {
        helper.enterModule('mod3');
        helper.enterSession('ses3a'); helper.enterActivity('act3a1'); helper.markActivityCompleted();
        helper.enterModule('mod3');
        helper.enterSession('ses3b'); helper.enterActivity('act3b1'); helper.markActivityCompleted();
        helper.enterModule('mod3');
        helper.enterSession('ses3c'); helper.enterActivity('act3c1'); helper.markActivityCompleted();
        helper.enterModule('mod3');
        expect(helper.getProgressAdvice()).toBe('You have completed all 📑 sessions in module 🗂️ "Module Three" — and in every other module, too. You can re-visit them as often as you like.');
      });
    });

    describe('session-level advice: below threshold (ses1a in mod1: threshold 1, 2 activities)', () => {
      beforeEach(() => {
        helper.enterModule('mod1');
        helper.enterSession('ses1a');
      });

      it('returns a start-with message when no activity has been entered yet', () => {
        expect(helper.getProgressAdvice()).toBe('Start with one of the available 🎯 activities in 📑 session "Session One A".');
      });

      it('case A: session adequate, not complete, module not adequate — references the finishing activity', () => {
        helper.enterActivity('act1a1'); helper.markActivityCompleted();
        expect(helper.getProgressAdvice()).toBe('Hooray! By finishing 🎯 activity "Activity 1a-1", you have now adequately progressed in 📑 session "Session One A". You can proceed with more activities if you like, or skip ahead to 📑 session "Session One B".');
      });
    });

    describe('session-level advice: keep going (ses2b in mod2: threshold 2, 3 activities)', () => {
      beforeEach(() => {
        helper.enterModule('mod2');
        helper.enterSession('ses2b');
      });

      it('returns a keep-going message when an activity is entered but below threshold', () => {
        helper.enterActivity('act2b1'); helper.markActivityCompleted();
        expect(helper.getProgressAdvice()).toBe('Keep going in 📑 session "Session Two B" — next up is 🎯 activity "Activity 2b-2".');
      });

      it('case A: session adequate, not complete, module not adequate — references the finishing activity', () => {
        helper.enterActivity('act2b1'); helper.markActivityCompleted();
        helper.enterActivity('act2b2'); helper.markActivityCompleted();
        expect(helper.getProgressAdvice()).toBe('Hooray! By finishing 🎯 activity "Activity 2b-2", you have now adequately progressed in 📑 session "Session Two B". You can proceed with more activities if you like.');
      });
    });

    it('case B: session complete, module not adequate — references the finishing session (ses3a in mod3: threshold 2)', () => {
      helper.enterModule('mod3');
      helper.enterSession('ses3a');
      helper.enterActivity('act3a1'); helper.markActivityCompleted();
      expect(helper.getProgressAdvice()).toBe('By finishing 📑 session "Session Three A", you have now completed all its 🎯 activities. You can re-visit them if you like, or skip ahead to 📑 session "Session Three B".');
    });

    describe('cascade: completing a session also triggers module adequate use (case C)', () => {
      it('with next module: session complete AND module adequate — references the finishing session (ses1b in mod1)', () => {
        helper.enterModule('mod1');
        helper.enterSession('ses1b');
        helper.enterActivity('act1b1'); helper.markActivityCompleted();
        expect(helper.getProgressAdvice()).toBe('Hooray! By finishing 📑 session "Session One B", you have now adequately progressed in 🗂️ module "Module One". You can proceed with more sessions if you like, or skip ahead to 🗂️ module "Module Two".');
      });

      it('without next module: session complete AND module adequate — no skip option (ses3b in mod3: threshold 2)', () => {
        helper.enterModule('mod3');
        helper.enterSession('ses3a'); helper.enterActivity('act3a1'); helper.markActivityCompleted();
        helper.enterModule('mod3');
        helper.enterSession('ses3b');
        helper.enterActivity('act3b1'); helper.markActivityCompleted();
        expect(helper.getProgressAdvice()).toBe('Hooray! By finishing 📑 session "Session Three B", you have now adequately progressed in 🗂️ module "Module Three". You can proceed with more sessions if you like.');
      });
    });

    describe('case D: session adequate (not complete) while module was already adequate', () => {
      it('references the finishing activity and mentions both session and module', () => {
        helper.enterModule('mod1');
        helper.enterSession('ses1b'); helper.enterActivity('act1b1'); helper.markActivityCompleted();
        helper.enterModule('mod1');
        helper.enterSession('ses1a');
        helper.enterActivity('act1a1'); helper.markActivityCompleted();
        expect(helper.getProgressAdvice()).toBe('Hooray! By finishing 🎯 activity "Activity 1a-1", you have now adequately progressed in both 📑 session "Session One A" and 🗂️ module "Module One". You can proceed with more activities if you like, or skip ahead to 🗂️ module "Module Two".');
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

  describe('production data (ReactStateHelper.initialState())', () => {
    let p;
    beforeEach(() => {
      p = ReactStateHelper.initDefaultState();
    });

    it('has modules bouMgt and emoReg in order', () => {
      const state = JSON.parse(p.toString());
      expect(state.modules.map(m => m.id)).toEqual(['bouMgt', 'emoReg']);
    });

    it('bouMgt has sessions bouIntro, gesGre, paus', () => {
      const state = JSON.parse(p.toString());
      expect(state.modules.find(m => m.id === 'bouMgt').sessions.map(s => s.id)).toEqual(['bouIntro', 'gesGre', 'paus']);
    });

    it('emoReg has sessions emoIntro, neuBew, umgEmo', () => {
      const state = JSON.parse(p.toString());
      expect(state.modules.find(m => m.id === 'emoReg').sessions.map(s => s.id)).toEqual(['emoIntro', 'neuBew', 'umgEmo']);
    });

    it('bouIntro and emoIntro are empty intro sessions (no activities)', () => {
      const state = JSON.parse(p.toString());
      expect(state.modules.find(m => m.id === 'bouMgt').sessions.find(s => s.id === 'bouIntro').activities).toEqual([]);
      expect(state.modules.find(m => m.id === 'emoReg').sessions.find(s => s.id === 'emoIntro').activities).toEqual([]);
    });

    it('all module thresholds are 1', () => {
      const state = JSON.parse(p.toString());
      for (const m of state.modules) expect(m.sessions_needed_for_adequate_use).toBe(1);
    });

    it('umgEmo requires 2 activities for adequate progress; all other content sessions require 1', () => {
      const state = JSON.parse(p.toString());
      const umgEmo = state.modules.find(m => m.id === 'emoReg').sessions.find(s => s.id === 'umgEmo');
      expect(umgEmo.activities_needed_for_adequate_use).toBe(2);
      const otherContent = state.modules.flatMap(m => m.sessions).filter(s => s.id !== 'umgEmo' && s.activities.length > 0);
      for (const s of otherContent) expect(s.activities_needed_for_adequate_use).toBe(1);
    });

    describe('happy path: completing the full program', () => {
      it('getProgress starts at 0', () => {
        expect(p.getProgress()).toBe(0);
      });

      it('completing all content sessions reaches getProgress 1', () => {
        for (const mod of ReactStateHelper.initialState().modules) {
          p.enterModule(mod.id);
          for (const ses of mod.sessions) {
            p.enterSession(ses.id);
            for (const act of ses.activities) {
              p.enterActivity(act.id); p.markActivityCompleted();
            }
          }
        }
        expect(p.getProgress()).toBe(1);
      });

      it('getProgressAdvice on entry to bouMgt returns a start-with message', () => {
        p.enterModule('bouMgt');
        expect(p.getProgressAdvice()).toBe('Start with one of the available 📑 sessions in module 🗂️ "Boundary Management".');
      });

      it('getProgressAdvice on entry to gesGre returns a start-with message', () => {
        p.enterModule('bouMgt');
        p.enterSession('gesGre');
        expect(p.getProgressAdvice()).toBe('Start with one of the available 🎯 activities in 📑 session "gesunde Grenzen setzen".');
      });

      it('getProgressAdvice after adequately completing bouMgt advises skipping to emoReg', () => {
        p.enterModule('bouMgt');
        p.enterSession('gesGre'); p.enterActivity('rolGes'); p.markActivityCompleted(); p.enterActivity('abgKon'); p.markActivityCompleted();
        p.enterModule('bouMgt');
        p.enterSession('paus'); p.enterActivity('mikPau'); p.markActivityCompleted();
        p.enterModule('bouMgt');
        const advice = p.getProgressAdvice();
        expect(advice).toContain('Boundary Management');
        expect(advice).toContain('Emotionsregulation');
      });

      it('getProgressAdvice after completing all modules mentions all modules covered', () => {
        for (const mod of ReactStateHelper.initialState().modules) {
          p.enterModule(mod.id);
          for (const ses of mod.sessions) {
            p.enterSession(ses.id);
            for (const act of ses.activities) {
              p.enterActivity(act.id); p.markActivityCompleted();
            }
          }
          p.enterModule(mod.id);
        }
        expect(p.getProgressAdvice()).toContain('and in every other module, too');
      });
    });

    describe('edge cases', () => {
      it('intro sessions do not count toward getProgress', () => {
        p.enterModule('bouMgt');
        p.enterSession('bouIntro');
        expect(p.getProgress()).toBe(0);
      });

      it('one completed session is enough for bouMgt adequate use (threshold=1)', () => {
        p.enterModule('bouMgt');
        p.enterSession('gesGre'); p.enterActivity('rolGes'); p.markActivityCompleted(); p.enterActivity('abgKon'); p.markActivityCompleted();
        expect(p.isGoodEnough('bouMgt')).toBe(true);
      });

      it('completing all non-intro sessions marks bouMgt as completed', () => {
        p.enterModule('bouMgt');
        p.enterSession('gesGre'); p.enterActivity('rolGes'); p.markActivityCompleted(); p.enterActivity('abgKon'); p.markActivityCompleted();
        p.enterSession('paus'); p.enterActivity('mikPau'); p.markActivityCompleted();
        expect(p.isModuleCompleted('bouMgt')).toBe(true);
      });

      it('umgEmo requires 2 completed activities for adequate progress', () => {
        p.enterModule('emoReg');
        p.enterSession('umgEmo');
        p.enterActivity('akzep'); p.markActivityCompleted();
        expect(p.hasSessionAdequateProgress('umgEmo')).toBe(false);
        p.enterActivity('emoSit'); p.markActivityCompleted();
        expect(p.hasSessionAdequateProgress('umgEmo')).toBe(true);
      });
    });
  });
});
