import { describe, it, expect, beforeEach } from 'vitest';

describe('ReactStateHelper', () => {
  let helper;

  beforeEach(() => {
    helper = ReactStateHelper.initDefaultState();
  });

  describe('initDefaultState', () => {
    it('initializes the default state', () => {
      expect(helper.toString()).toBe(JSON.stringify(ReactStateHelper.initialState()));
    });
  });

  describe('loadExistingState', () => {
    it('loads persisted state from JSON', () => {
      helper.enterModule('bouMgt');
      helper.enterSession('rolCha');
      helper.enterActivity('somAct'); helper.markActivityCompleted();
      helper.enterActivity('othAct'); helper.markActivityCompleted();
      const restored = ReactStateHelper.loadExistingState(helper.toString());
      expect(restored.isSessionCompleted('rolCha')).toBe(true);
    });
  });

  describe('toString', () => {
    it('round-trips state without mutation', () => {
      const json = helper.toString();
      expect(ReactStateHelper.loadExistingState(json).toString()).toBe(json);
    });
  });

  describe('markActivityCompleted', () => {
    it('marks an activity as completed', () => {
      helper.enterModule('bouMgt');
      helper.enterSession('rolCha');
      helper.enterActivity('somAct');
      helper.markActivityCompleted();
      const state = JSON.parse(helper.toString());
      const activity = state.modules.find(m => m.id === 'bouMgt')
        .sessions.find(s => s.id === 'rolCha')
        .activities.find(a => a.id === 'somAct');
      expect(activity.completed).toBe(true);
    });

    it('is idempotent', () => {
      helper.enterModule('bouMgt');
      helper.enterSession('rolCha');
      helper.enterActivity('somAct');
      helper.markActivityCompleted();
      helper.markActivityCompleted();
      const state = JSON.parse(helper.toString());
      const activity = state.modules.find(m => m.id === 'bouMgt')
        .sessions.find(s => s.id === 'rolCha')
        .activities.find(a => a.id === 'somAct');
      expect(activity.completed).toBe(true);
    });

    it('throws if no activity has been entered', () => {
      expect(() => helper.markActivityCompleted()).toThrow('No activity entered yet');
    });
  });

  describe('isSessionCompleted', () => {
    it('returns false for all sessions in the default state', () => {
      helper.enterModule('bouMgt');
      expect(helper.isSessionCompleted('rolCha')).toBe(false);
      expect(helper.isSessionCompleted('sayNo')).toBe(false);
      helper.enterModule('emoReg');
      expect(helper.isSessionCompleted('breCon')).toBe(false);
    });

    it('returns false when only some activities are completed', () => {
      helper.enterModule('bouMgt');
      helper.enterSession('rolCha');
      helper.enterActivity('somAct'); helper.markActivityCompleted();
      expect(helper.isSessionCompleted('rolCha')).toBe(false);
    });

    it('returns true when all activities are completed', () => {
      helper.enterModule('bouMgt');
      helper.enterSession('rolCha');
      helper.enterActivity('somAct'); helper.markActivityCompleted();
      helper.enterActivity('othAct'); helper.markActivityCompleted();
      expect(helper.isSessionCompleted('rolCha')).toBe(true);
    });

    it('throws if no module has been entered', () => {
      expect(() => helper.isSessionCompleted('rolCha')).toThrow('No module entered yet');
    });
  });

  describe('countCompletedInModule', () => {
    it('returns 0 for all modules in the default state', () => {
      expect(helper.countCompletedInModule('bouMgt')).toBe(0);
      expect(helper.countCompletedInModule('emoReg')).toBe(0);
    });

    it('counts only completed sessions within the given module', () => {
      helper.enterModule('bouMgt');
      helper.enterSession('rolCha');
      helper.enterActivity('somAct'); helper.markActivityCompleted();
      helper.enterActivity('othAct'); helper.markActivityCompleted();
      expect(helper.countCompletedInModule('bouMgt')).toBe(1);
      expect(helper.countCompletedInModule('emoReg')).toBe(0);
    });
  });

  describe('countCompletedOverall', () => {
    it('returns 0 in the default state', () => {
      expect(helper.countCompletedOverall()).toBe(0);
    });

    it('increases as sessions across modules are completed', () => {
      helper.enterModule('bouMgt');
      helper.enterSession('rolCha');
      helper.enterActivity('somAct'); helper.markActivityCompleted();
      helper.enterActivity('othAct'); helper.markActivityCompleted();
      expect(helper.countCompletedOverall()).toBe(1);
      helper.enterModule('emoReg');
      helper.enterSession('breCon');
      helper.enterActivity('breConAct'); helper.markActivityCompleted();
      expect(helper.countCompletedOverall()).toBe(2);
    });
  });

  describe('getProgress', () => {
    it('returns 0 in the default state', () => {
      expect(helper.getProgress()).toBe(0);
    });

    it('returns 1 when all sessions are completed', () => {
      for (const module of ReactStateHelper.initialState().modules) {
        helper.enterModule(module.id);
        for (const session of module.sessions) {
          helper.enterSession(session.id);
          for (const activity of session.activities) {
            helper.enterActivity(activity.id);
            helper.markActivityCompleted();
          }
        }
      }
      expect(helper.getProgress()).toBe(1);
    });
  });

  describe('getModuleProgress', () => {
    it('returns 0 for all modules in the default state', () => {
      expect(helper.getModuleProgress('bouMgt')).toBe(0);
      expect(helper.getModuleProgress('emoReg')).toBe(0);
    });

    it('returns the fraction of completed sessions within the module (1 of 5)', () => {
      helper.enterModule('bouMgt');
      helper.enterSession('rolCha');
      helper.enterActivity('somAct'); helper.markActivityCompleted();
      helper.enterActivity('othAct'); helper.markActivityCompleted();
      expect(helper.getModuleProgress('bouMgt')).toBeCloseTo(1 / 5);
    });

    it('does not count sessions from other modules', () => {
      helper.enterModule('emoReg');
      helper.enterSession('breCon');
      helper.enterActivity('breConAct'); helper.markActivityCompleted();
      expect(helper.getModuleProgress('bouMgt')).toBe(0);
    });

    it('returns 1 when all sessions in the module are completed', () => {
      helper.enterModule('bouMgt');
      const sessions = ReactStateHelper.initialState().modules.find(m => m.id === 'bouMgt').sessions;
      for (const session of sessions) {
        helper.enterSession(session.id);
        for (const activity of session.activities) {
          helper.enterActivity(activity.id);
          helper.markActivityCompleted();
        }
      }
      expect(helper.getModuleProgress('bouMgt')).toBe(1);
    });
  });

  describe('isGoodEnough', () => {
    it('returns false when fewer than 3 sessions are completed in the module', () => {
      helper.enterModule('bouMgt');
      helper.enterSession('rolCha');
      helper.enterActivity('somAct'); helper.markActivityCompleted();
      helper.enterActivity('othAct'); helper.markActivityCompleted();
      helper.enterSession('sayNo');
      helper.enterActivity('sayNoAct'); helper.markActivityCompleted();
      expect(helper.isGoodEnough('bouMgt')).toBe(false);
    });

    it('returns true when 3 sessions are completed in the module', () => {
      helper.enterModule('bouMgt');
      helper.enterSession('rolCha');
      helper.enterActivity('somAct'); helper.markActivityCompleted();
      helper.enterActivity('othAct'); helper.markActivityCompleted();
      helper.enterSession('sayNo');
      helper.enterActivity('sayNoAct'); helper.markActivityCompleted();
      helper.enterSession('limSet');
      helper.enterActivity('limSetAct'); helper.markActivityCompleted();
      expect(helper.isGoodEnough('bouMgt')).toBe(true);
    });

    it('does not count sessions from other modules', () => {
      helper.enterModule('bouMgt');
      helper.enterSession('rolCha');
      helper.enterActivity('somAct'); helper.markActivityCompleted();
      helper.enterActivity('othAct'); helper.markActivityCompleted();
      helper.enterSession('sayNo');
      helper.enterActivity('sayNoAct'); helper.markActivityCompleted();
      helper.enterModule('emoReg');
      helper.enterSession('breCon');
      helper.enterActivity('breConAct'); helper.markActivityCompleted();
      expect(helper.isGoodEnough('bouMgt')).toBe(false);
    });
  });

  describe('allCompletedSessionsAsCsv', () => {
    it('returns an empty string in the default state', () => {
      expect(helper.allCompletedSessionsAsCsv()).toBe('');
    });

    it('returns a single session id when one session is completed', () => {
      helper.enterModule('bouMgt');
      helper.enterSession('rolCha');
      helper.enterActivity('somAct'); helper.markActivityCompleted();
      helper.enterActivity('othAct'); helper.markActivityCompleted();
      expect(helper.allCompletedSessionsAsCsv()).toBe('rolCha');
    });

    it('does not include partially completed sessions', () => {
      helper.enterModule('bouMgt');
      helper.enterSession('rolCha');
      helper.enterActivity('somAct'); helper.markActivityCompleted();
      expect(helper.allCompletedSessionsAsCsv()).toBe('');
    });

    it('returns comma-separated ids across modules in order', () => {
      helper.enterModule('bouMgt');
      helper.enterSession('rolCha');
      helper.enterActivity('somAct'); helper.markActivityCompleted();
      helper.enterActivity('othAct'); helper.markActivityCompleted();
      helper.enterSession('sayNo');
      helper.enterActivity('sayNoAct'); helper.markActivityCompleted();
      helper.enterModule('emoReg');
      helper.enterSession('breCon');
      helper.enterActivity('breConAct'); helper.markActivityCompleted();
      expect(helper.allCompletedSessionsAsCsv()).toBe('rolCha,sayNo,breCon');
    });
  });

  describe('enterModule / enterSession / getParticipantGroup', () => {
    it('returns null before any session has been entered', () => {
      expect(helper.getParticipantGroup()).toBeNull();
    });

    it('returns "moduleId: sessionId" after entering a module and session', () => {
      helper.enterModule('bouMgt');
      helper.enterSession('rolCha');
      expect(helper.getParticipantGroup()).toBe('bouMgt: rolCha');
    });

    it('updates to the most recently entered module and session', () => {
      helper.enterModule('bouMgt');
      helper.enterSession('rolCha');
      helper.enterModule('emoReg');
      helper.enterSession('breCon');
      expect(helper.getParticipantGroup()).toBe('emoReg: breCon');
    });

    it('sets entered_first_at on first enterModule and does not overwrite it', () => {
      helper.enterModule('bouMgt');
      const first = JSON.parse(helper.toString()).modules.find(m => m.id === 'bouMgt').entered_first_at;
      expect(first).not.toBeNull();
      helper.enterModule('bouMgt');
      const second = JSON.parse(helper.toString()).modules.find(m => m.id === 'bouMgt').entered_first_at;
      expect(second).toBe(first);
    });

    it('increments times_entered on each enterModule', () => {
      helper.enterModule('bouMgt');
      helper.enterModule('bouMgt');
      const mod = JSON.parse(helper.toString()).modules.find(m => m.id === 'bouMgt');
      expect(mod.times_entered).toBe(2);
    });

    it('persists through serialization', () => {
      helper.enterModule('bouMgt');
      helper.enterSession('rolCha');
      const restored = ReactStateHelper.loadExistingState(helper.toString());
      expect(restored.getParticipantGroup()).toBe('bouMgt: rolCha');
    });

    it('throws if enterSession is called without a current module', () => {
      expect(() => helper.enterSession('rolCha')).toThrow('No module entered yet');
    });

    it('throws if the sessionId is not in the current module', () => {
      helper.enterModule('bouMgt');
      expect(() => helper.enterSession('breCon')).toThrow('Session breCon not found in module bouMgt');
    });
  });

  describe('enterActivity', () => {
    it('sets the current activity', () => {
      helper.enterModule('bouMgt');
      helper.enterSession('rolCha');
      helper.enterActivity('somAct');
      expect(JSON.parse(helper.toString()).currentActivityId).toBe('somAct');
    });

    it('throws if enterActivity is called without a current session', () => {
      helper.enterModule('bouMgt');
      expect(() => helper.enterActivity('somAct')).toThrow('No session entered yet');
    });

    it('throws if the activityId is not in the current session', () => {
      helper.enterModule('bouMgt');
      helper.enterSession('rolCha');
      expect(() => helper.enterActivity('globGoal')).toThrow('Activity globGoal not found in session rolCha');
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
});
