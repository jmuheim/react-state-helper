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
      helper.enterSession('gesGre');
      expect(helper.isSessionCompleted('gesGre')).toBe(false);
      helper.enterActivity('rolGes'); helper.markActivityCompleted();
      helper.enterActivity('abgKon'); helper.markActivityCompleted();
      const restored = ReactStateHelper.loadExistingState(helper.toString());
      expect(restored.isSessionCompleted('gesGre')).toBe(true);
    });
  });

  describe('isSessionCompleted', () => {
    beforeEach(() => {
      helper.enterModule('bouMgt');
    });

    it('returns false for all sessions in the default state', () => {
      expect(helper.isSessionCompleted('gesGre')).toBe(false);
      expect(helper.isSessionCompleted('paus')).toBe(false);
      helper.enterModule('emoReg');
      expect(helper.isSessionCompleted('neuBew')).toBe(false);
    });

    it('returns false when only some activities are completed', () => {
      helper.enterSession('gesGre');
      helper.enterActivity('rolGes'); helper.markActivityCompleted();
      expect(helper.isSessionCompleted('gesGre')).toBe(false);
    });

    it('returns true when all activities are completed', () => {
      helper.enterSession('gesGre');
      helper.enterActivity('rolGes'); helper.markActivityCompleted();
      helper.enterActivity('abgKon'); helper.markActivityCompleted();
      expect(helper.isSessionCompleted('gesGre')).toBe(true);
    });

    it('throws if no module has been entered', () => {
      helper = ReactStateHelper.initDefaultState();
      expect(() => helper.isSessionCompleted('gesGre')).toThrow('No module entered yet');
    });
  });

  describe('hasSessionAdequateProgress', () => {
    beforeEach(() => {
      helper.enterModule('bouMgt');
    });

    it('returns false for all sessions in the default state', () => {
      expect(helper.hasSessionAdequateProgress('gesGre')).toBe(false);
      expect(helper.hasSessionAdequateProgress('paus')).toBe(false);
    });

    it('returns true once completed activities meet the threshold (gesGre threshold=1)', () => {
      helper.enterSession('gesGre');
      helper.enterActivity('rolGes'); helper.markActivityCompleted();
      expect(helper.hasSessionAdequateProgress('gesGre')).toBe(true);
    });

    it('unlike isSessionCompleted, stays true even if not all activities are done', () => {
      helper.enterSession('gesGre');
      helper.enterActivity('rolGes'); helper.markActivityCompleted();
      expect(helper.isSessionCompleted('gesGre')).toBe(false);
      expect(helper.hasSessionAdequateProgress('gesGre')).toBe(true);
    });

    it('throws if no module has been entered', () => {
      helper = ReactStateHelper.initDefaultState();
      expect(() => helper.hasSessionAdequateProgress('gesGre')).toThrow('No module entered yet');
    });
  });

  describe('isModuleCompleted', () => {
    it('returns false for all modules in the default state', () => {
      expect(helper.isModuleCompleted('bouMgt')).toBe(false);
      expect(helper.isModuleCompleted('emoReg')).toBe(false);
    });

    it('returns false when only some sessions are completed', () => {
      helper.enterModule('bouMgt');
      helper.enterSession('gesGre');
      helper.enterActivity('rolGes'); helper.markActivityCompleted();
      helper.enterActivity('abgKon'); helper.markActivityCompleted();
      expect(helper.isModuleCompleted('bouMgt')).toBe(false);
    });

    it('returns true when all sessions with activities are completed', () => {
      helper.enterModule('bouMgt');
      const sessions = ReactStateHelper.initialState().modules.find(m => m.id === 'bouMgt').sessions;
      for (const session of sessions) {
        helper.enterSession(session.id);
        for (const activity of session.activities) {
          helper.enterActivity(activity.id);
          helper.markActivityCompleted();
        }
      }
      expect(helper.isModuleCompleted('bouMgt')).toBe(true);
    });

    it('does not count sessions from other modules', () => {
      helper.enterModule('emoReg');
      const sessions = ReactStateHelper.initialState().modules.find(m => m.id === 'emoReg').sessions;
      for (const session of sessions) {
        helper.enterSession(session.id);
        for (const activity of session.activities) {
          helper.enterActivity(activity.id);
          helper.markActivityCompleted();
        }
      }
      expect(helper.isModuleCompleted('bouMgt')).toBe(false);
    });
  });

  describe('countCompletedSessions', () => {
    it('throws if no module has been entered', () => {
      expect(() => helper.countCompletedSessions()).toThrow('No module entered yet');
    });

    it('returns 0 for the current module in the default state', () => {
      helper.enterModule('bouMgt');
      expect(helper.countCompletedSessions()).toBe(0);
    });

    it('counts only completed sessions within the current module', () => {
      helper.enterModule('bouMgt');
      helper.enterSession('gesGre');
      helper.enterActivity('rolGes'); helper.markActivityCompleted();
      helper.enterActivity('abgKon'); helper.markActivityCompleted();
      expect(helper.countCompletedSessions()).toBe(1);
      helper.enterModule('emoReg');
      expect(helper.countCompletedSessions()).toBe(0);
    });
  });

  describe('countCompletedOverall', () => {
    it('returns 0 in the default state', () => {
      expect(helper.countCompletedOverall()).toBe(0);
    });

    it('increases as sessions across modules are completed', () => {
      helper.enterModule('bouMgt');
      helper.enterSession('gesGre');
      helper.enterActivity('rolGes'); helper.markActivityCompleted();
      helper.enterActivity('abgKon'); helper.markActivityCompleted();
      expect(helper.countCompletedOverall()).toBe(1);
      helper.enterModule('emoReg');
      helper.enterSession('neuBew');
      helper.enterActivity('neuBewAct'); helper.markActivityCompleted();
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

    it('returns the fraction of completed sessions within the module (1 of 2 completable)', () => {
      helper.enterModule('bouMgt');
      helper.enterSession('gesGre');
      helper.enterActivity('rolGes'); helper.markActivityCompleted();
      helper.enterActivity('abgKon'); helper.markActivityCompleted();
      expect(helper.getModuleProgress('bouMgt')).toBeCloseTo(1 / 2);
    });

    it('does not count sessions from other modules', () => {
      helper.enterModule('emoReg');
      helper.enterSession('neuBew');
      helper.enterActivity('neuBewAct'); helper.markActivityCompleted();
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
    beforeEach(() => {
      helper.enterModule('bouMgt');
    });

    it('returns false with no completed sessions', () => {
      expect(helper.isGoodEnough('bouMgt')).toBe(false);
    });

    it('returns true once the module threshold is met (bouMgt threshold=1)', () => {
      helper.enterSession('gesGre');
      helper.enterActivity('rolGes'); helper.markActivityCompleted();
      helper.enterActivity('abgKon'); helper.markActivityCompleted();
      expect(helper.isGoodEnough('bouMgt')).toBe(true);
    });

    it('does not count sessions from other modules', () => {
      helper.enterModule('emoReg');
      helper.enterSession('neuBew');
      helper.enterActivity('neuBewAct'); helper.markActivityCompleted();
      expect(helper.isGoodEnough('bouMgt')).toBe(false);
    });
  });

  describe('allCompletedSessionsAsCsv', () => {
    beforeEach(() => {
      helper.enterModule('bouMgt');
      helper.enterSession('gesGre');
    });

    it('returns an empty string in the default state', () => {
      expect(helper.allCompletedSessionsAsCsv()).toBe('');
    });

    it('returns a single session id when one session is completed', () => {
      helper.enterActivity('rolGes'); helper.markActivityCompleted();
      helper.enterActivity('abgKon'); helper.markActivityCompleted();
      expect(helper.allCompletedSessionsAsCsv()).toBe('gesGre');
    });

    it('does not include partially completed sessions', () => {
      helper.enterActivity('rolGes'); helper.markActivityCompleted();
      expect(helper.allCompletedSessionsAsCsv()).toBe('');
    });

    it('returns comma-separated ids across modules in order', () => {
      helper.enterActivity('rolGes'); helper.markActivityCompleted();
      helper.enterActivity('abgKon'); helper.markActivityCompleted();
      helper.enterSession('paus');
      helper.enterActivity('mikPau'); helper.markActivityCompleted();
      helper.enterModule('emoReg');
      helper.enterSession('neuBew');
      helper.enterActivity('neuBewAct'); helper.markActivityCompleted();
      expect(helper.allCompletedSessionsAsCsv()).toBe('gesGre,paus,neuBew');
    });
  });

  describe('enterModule / enterSession / getParticipantGroup', () => {
    it('returns null before any session has been entered', () => {
      expect(helper.getParticipantGroup()).toBeNull();
    });

    it('returns "moduleId: sessionId" after entering a module and session', () => {
      helper.enterModule('bouMgt');
      helper.enterSession('gesGre');
      expect(helper.getParticipantGroup()).toBe('bouMgt: gesGre');
    });

    it('updates to the most recently entered module and session', () => {
      helper.enterModule('bouMgt');
      helper.enterSession('gesGre');
      helper.enterModule('emoReg');
      helper.enterSession('neuBew');
      expect(helper.getParticipantGroup()).toBe('emoReg: neuBew');
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

    it('updates entered_last_at on every enterModule', () => {
      helper.enterModule('bouMgt');
      const first = JSON.parse(helper.toString()).modules.find(m => m.id === 'bouMgt').entered_last_at;
      expect(first).not.toBeNull();
      helper.enterModule('bouMgt');
      const second = JSON.parse(helper.toString()).modules.find(m => m.id === 'bouMgt').entered_last_at;
      expect(second).not.toBeNull();
    });

    it('sets entered_first_at on first enterSession and does not overwrite it', () => {
      helper.enterModule('bouMgt');
      helper.enterSession('gesGre');
      const first = JSON.parse(helper.toString()).modules.find(m => m.id === 'bouMgt')
        .sessions.find(s => s.id === 'gesGre').entered_first_at;
      expect(first).not.toBeNull();
      helper.enterSession('gesGre');
      const second = JSON.parse(helper.toString()).modules.find(m => m.id === 'bouMgt')
        .sessions.find(s => s.id === 'gesGre').entered_first_at;
      expect(second).toBe(first);
    });

    it('increments times_entered on each enterSession', () => {
      helper.enterModule('bouMgt');
      helper.enterSession('gesGre');
      helper.enterSession('gesGre');
      const session = JSON.parse(helper.toString()).modules.find(m => m.id === 'bouMgt')
        .sessions.find(s => s.id === 'gesGre');
      expect(session.times_entered).toBe(2);
    });

    it('updates entered_last_at on every enterSession', () => {
      helper.enterModule('bouMgt');
      helper.enterSession('gesGre');
      const first = JSON.parse(helper.toString()).modules.find(m => m.id === 'bouMgt')
        .sessions.find(s => s.id === 'gesGre').entered_last_at;
      expect(first).not.toBeNull();
      helper.enterSession('gesGre');
      const second = JSON.parse(helper.toString()).modules.find(m => m.id === 'bouMgt')
        .sessions.find(s => s.id === 'gesGre').entered_last_at;
      expect(second).not.toBeNull();
    });

    it('persists through serialization', () => {
      helper.enterModule('bouMgt');
      helper.enterSession('gesGre');
      const restored = ReactStateHelper.loadExistingState(helper.toString());
      expect(restored.getParticipantGroup()).toBe('bouMgt: gesGre');
    });

    it('throws if the moduleId does not exist', () => {
      expect(() => helper.enterModule('nonExistent')).toThrow('Module nonExistent not found');
    });

    it('throws if enterSession is called without a current module', () => {
      expect(() => helper.enterSession('gesGre')).toThrow('No module entered yet');
    });

    it('throws if the sessionId is not in the current module', () => {
      helper.enterModule('bouMgt');
      expect(() => helper.enterSession('neuBew')).toThrow('Session neuBew not found in module bouMgt');
    });

    it('enterModule resets currentSessionId and currentActivityId', () => {
      helper.enterModule('bouMgt');
      helper.enterSession('gesGre');
      helper.enterActivity('rolGes');
      helper.enterModule('emoReg');
      const state = JSON.parse(helper.toString());
      expect(state.currentSessionId).toBeNull();
      expect(state.currentActivityId).toBeNull();
    });

    it('enterSession resets currentActivityId', () => {
      helper.enterModule('bouMgt');
      helper.enterSession('gesGre');
      helper.enterActivity('rolGes');
      helper.enterSession('paus');
      expect(JSON.parse(helper.toString()).currentActivityId).toBeNull();
    });
  });

  describe('enterActivity', () => {
    beforeEach(() => {
      helper.enterModule('bouMgt');
    });

    it('sets the current activity', () => {
      helper.enterSession('gesGre');
      helper.enterActivity('rolGes');
      expect(JSON.parse(helper.toString()).currentActivityId).toBe('rolGes');
    });

    it('throws if enterActivity is called without a current session', () => {
      expect(() => helper.enterActivity('rolGes')).toThrow('No session entered yet');
    });

    it('throws if the activityId is not in the current session', () => {
      helper.enterSession('gesGre');
      expect(() => helper.enterActivity('neuBewAct')).toThrow('Activity neuBewAct not found in session gesGre');
    });

    it('sets entered_first_at on first enterActivity and does not overwrite it', () => {
      helper.enterSession('gesGre');
      helper.enterActivity('rolGes');
      const first = JSON.parse(helper.toString()).modules.find(m => m.id === 'bouMgt')
        .sessions.find(s => s.id === 'gesGre')
        .activities.find(a => a.id === 'rolGes').entered_first_at;
      expect(first).not.toBeNull();
      helper.enterActivity('rolGes');
      const second = JSON.parse(helper.toString()).modules.find(m => m.id === 'bouMgt')
        .sessions.find(s => s.id === 'gesGre')
        .activities.find(a => a.id === 'rolGes').entered_first_at;
      expect(second).toBe(first);
    });

    it('increments times_entered on each enterActivity', () => {
      helper.enterSession('gesGre');
      helper.enterActivity('rolGes');
      helper.enterActivity('rolGes');
      const activity = JSON.parse(helper.toString()).modules.find(m => m.id === 'bouMgt')
        .sessions.find(s => s.id === 'gesGre')
        .activities.find(a => a.id === 'rolGes');
      expect(activity.times_entered).toBe(2);
    });

    it('updates entered_last_at on every enterActivity', () => {
      helper.enterSession('gesGre');
      helper.enterActivity('rolGes');
      const first = JSON.parse(helper.toString()).modules.find(m => m.id === 'bouMgt')
        .sessions.find(s => s.id === 'gesGre')
        .activities.find(a => a.id === 'rolGes').entered_last_at;
      expect(first).not.toBeNull();
      helper.enterActivity('rolGes');
      const second = JSON.parse(helper.toString()).modules.find(m => m.id === 'bouMgt')
        .sessions.find(s => s.id === 'gesGre')
        .activities.find(a => a.id === 'rolGes').entered_last_at;
      expect(second).not.toBeNull();
    });
  });

  describe('populateMenuLabelsForModule', () => {
    it('marks the first incomplete module as 👉 and leaves the rest plain', () => {
      const vars = helper.populateMenuLabelsForModule();
      expect(vars.jsStateHelperMenuLabel1).toBe('👉 Boundary Management:bouMgt');
      expect(vars.jsStateHelperMenuLabel2).toBe('Emotionsregulation:emoReg');
    });

    it('fills unused slots with empty string', () => {
      const vars = helper.populateMenuLabelsForModule();
      for (let i = 3; i <= 9; i++) expect(vars[`jsStateHelperMenuLabel${i}`]).toBe('');
    });

    it('marks a completed module with ✅', () => {
      helper.enterModule('bouMgt');
      const sessions = ReactStateHelper.initialState().modules.find(m => m.id === 'bouMgt').sessions;
      for (const session of sessions) {
        helper.enterSession(session.id);
        for (const activity of session.activities) {
          helper.enterActivity(activity.id);
          helper.markActivityCompleted();
        }
      }
      const vars = helper.populateMenuLabelsForModule();
      expect(vars.jsStateHelperMenuLabel1).toBe('✅ Boundary Management:bouMgt');
      expect(vars.jsStateHelperMenuLabel2).toBe('👉 Emotionsregulation:emoReg');
    });

    it('marks no module as 👉 when all are ✅', () => {
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
      const vars = helper.populateMenuLabelsForModule();
      expect(vars.jsStateHelperMenuLabel1).toBe('✅ Boundary Management:bouMgt');
      expect(vars.jsStateHelperMenuLabel2).toBe('✅ Emotionsregulation:emoReg');
    });

  });

  describe('populateMenuLabelsForSession', () => {
    beforeEach(() => {
      helper.enterModule('bouMgt');
    });

    it('marks the first incomplete session as 👉 and leaves the rest plain', () => {
      const vars = helper.populateMenuLabelsForSession();
      expect(vars.jsStateHelperMenuLabel1).toBe('👉 Einführung:bouIntro');
      expect(vars.jsStateHelperMenuLabel2).toBe('gesunde Grenzen setzen:gesGre');
      expect(vars.jsStateHelperMenuLabel3).toBe('Pausen:paus');
    });

    it('fills unused slots with empty string', () => {
      const vars = helper.populateMenuLabelsForSession();
      for (let i = 4; i <= 9; i++) expect(vars[`jsStateHelperMenuLabel${i}`]).toBe('');
    });

    it('marks a completed session with ✅', () => {
      helper.enterSession('gesGre');
      helper.enterActivity('rolGes'); helper.markActivityCompleted();
      helper.enterActivity('abgKon'); helper.markActivityCompleted();
      const vars = helper.populateMenuLabelsForSession();
      expect(vars.jsStateHelperMenuLabel1).toBe('👉 Einführung:bouIntro');
      expect(vars.jsStateHelperMenuLabel2).toBe('✅ gesunde Grenzen setzen:gesGre');
      expect(vars.jsStateHelperMenuLabel3).toBe('Pausen:paus');
    });

    it('marks content sessions as ✅ when all are done (intro session without activities stays as 👉)', () => {
      const module = ReactStateHelper.initialState().modules.find(m => m.id === 'bouMgt');
      helper.enterModule('bouMgt');
      for (const session of module.sessions) {
        helper.enterSession(session.id);
        for (const activity of session.activities) {
          helper.enterActivity(activity.id);
          helper.markActivityCompleted();
        }
      }
      const vars = helper.populateMenuLabelsForSession();
      expect(vars.jsStateHelperMenuLabel1).toBe('👉 Einführung:bouIntro');
      expect(vars.jsStateHelperMenuLabel2).toBe('✅ gesunde Grenzen setzen:gesGre');
      expect(vars.jsStateHelperMenuLabel3).toBe('✅ Pausen:paus');
    });

    it('throws if no module has been entered', () => {
      helper = ReactStateHelper.initDefaultState();
      expect(() => helper.populateMenuLabelsForSession()).toThrow('No module entered yet');
    });

  });

  describe('populateMenuLabelsForActivity', () => {
    beforeEach(() => {
      helper.enterModule('bouMgt');
      helper.enterSession('gesGre');
    });

    it('marks the first incomplete activity as 👉 and leaves the rest plain', () => {
      const vars = helper.populateMenuLabelsForActivity();
      expect(vars.jsStateHelperMenuLabel1).toBe('👉 Rollenwechsel bewusst gestalten:rolGes');
      expect(vars.jsStateHelperMenuLabel2).toBe('Abgrenzen mit Klarheit: Das Konsequenzengitter:abgKon');
    });

    it('fills unused slots with empty string', () => {
      const vars = helper.populateMenuLabelsForActivity();
      for (let i = 3; i <= 9; i++) expect(vars[`jsStateHelperMenuLabel${i}`]).toBe('');
    });

    it('marks a completed activity with ✅', () => {
      helper.enterActivity('rolGes'); helper.markActivityCompleted();
      const vars = helper.populateMenuLabelsForActivity();
      expect(vars.jsStateHelperMenuLabel1).toBe('✅ Rollenwechsel bewusst gestalten:rolGes');
      expect(vars.jsStateHelperMenuLabel2).toBe('👉 Abgrenzen mit Klarheit: Das Konsequenzengitter:abgKon');
    });

    it('throws if no module has been entered', () => {
      helper = ReactStateHelper.initDefaultState();
      expect(() => helper.populateMenuLabelsForActivity()).toThrow('No module entered yet');
    });

    it('marks no activity as 👉 when all are ✅', () => {
      helper.enterActivity('rolGes'); helper.markActivityCompleted();
      helper.enterActivity('abgKon'); helper.markActivityCompleted();
      const vars = helper.populateMenuLabelsForActivity();
      expect(vars.jsStateHelperMenuLabel1).toBe('✅ Rollenwechsel bewusst gestalten:rolGes');
      expect(vars.jsStateHelperMenuLabel2).toBe('✅ Abgrenzen mit Klarheit: Das Konsequenzengitter:abgKon');
    });

    it('throws if no session has been entered', () => {
      helper = ReactStateHelper.initDefaultState();
      helper.enterModule('bouMgt');
      expect(() => helper.populateMenuLabelsForActivity()).toThrow('No session entered yet');
    });

  });


  describe('getProgressAdvice', () => {
    it('throws when no module is entered', () => {
      expect(() => helper.getProgressAdvice()).toThrow('No module entered yet');
    });

    describe('session-level advice: below threshold (gesGre in bouMgt: threshold 1, 2 activities)', () => {
      beforeEach(() => {
        helper.enterModule('bouMgt');
        helper.enterSession('gesGre');
      });

      it('returns a start-with message when no activity has been entered yet', () => {
        expect(helper.getProgressAdvice()).toBe('Start with one of the available 🎯 activities in 📑 session "gesunde Grenzen setzen".');
      });

      it('case A: session adequate, not complete, module not adequate — references the finishing activity', () => {
        helper.enterActivity('rolGes'); helper.markActivityCompleted();
        expect(helper.getProgressAdvice()).toBe('Hooray! By finishing 🎯 activity "Rollenwechsel bewusst gestalten", you have now adequately progressed in 📑 session "gesunde Grenzen setzen". You can proceed with more activities if you like, or skip ahead to 📑 session "Pausen".');
      });
    });

    describe('session-level advice: keep going (umgEmo in emoReg: threshold 2, 3 activities)', () => {
      beforeEach(() => {
        helper.enterModule('emoReg');
        helper.enterSession('umgEmo');
      });

      it('returns a keep-going message when an activity is entered but below threshold', () => {
        helper.enterActivity('akzep'); helper.markActivityCompleted();
        expect(helper.getProgressAdvice()).toBe('Keep going in 📑 session "Umgang mit schwierigen Emotionen" — next up is 🎯 activity "Emotionsregulation in schwierigen Situationen".');
      });

      it('case A: session adequate, not complete, module not adequate — references the finishing activity', () => {
        helper.enterActivity('akzep'); helper.markActivityCompleted();
        helper.enterActivity('emoSit'); helper.markActivityCompleted();
        expect(helper.getProgressAdvice()).toBe('Hooray! By finishing 🎯 activity "Emotionsregulation in schwierigen Situationen", you have now adequately progressed in 📑 session "Umgang mit schwierigen Emotionen". You can proceed with more activities if you like.');
      });
    });

    // Requires a module with sessions_needed_for_adequate_use >= 2 so completing one session leaves the module not yet adequate.
    it.skip('case B: session complete, module not adequate — references the finishing session', () => {
      // Set up: enter a module with threshold >= 2, complete exactly one session (all its activities),
      // so sessionComplete=true but countCompletedSessions < threshold → moduleAdequate=false.
      // expect(helper.getProgressAdvice()).toBe('By finishing 📑 session "…", you have now completed all its 🎯 activities. You can re-visit them if you like, or skip ahead to 📑 session "…".');
    });

    describe('cascade: completing a session also triggers module adequate use (case C)', () => {
      it('with next module: session complete AND module adequate — references the finishing session (paus in bouMgt)', () => {
        helper.enterModule('bouMgt');
        helper.enterSession('paus');
        helper.enterActivity('mikPau'); helper.markActivityCompleted();
        expect(helper.getProgressAdvice()).toBe('Hooray! By finishing 📑 session "Pausen", you have now adequately progressed in 🗂️ module "Boundary Management". You can proceed with more sessions if you like, or skip ahead to 🗂️ module "Emotionsregulation".');
      });

      it('without next module: session complete AND module adequate — no skip option (neuBew in emoReg)', () => {
        helper.enterModule('emoReg');
        helper.enterSession('neuBew');
        helper.enterActivity('neuBewAct'); helper.markActivityCompleted();
        expect(helper.getProgressAdvice()).toBe('Hooray! By finishing 📑 session "Neubewertung", you have now adequately progressed in 🗂️ module "Emotionsregulation". You can proceed with more sessions if you like.');
      });
    });

    describe('case D: session adequate (not complete) while module was already adequate', () => {
      it('references the finishing activity and mentions both session and module', () => {
        helper.enterModule('bouMgt');
        helper.enterSession('paus'); helper.enterActivity('mikPau'); helper.markActivityCompleted();
        helper.enterModule('bouMgt');
        helper.enterSession('gesGre');
        helper.enterActivity('rolGes'); helper.markActivityCompleted();
        expect(helper.getProgressAdvice()).toBe('Hooray! By finishing 🎯 activity "Rollenwechsel bewusst gestalten", you have now adequately progressed in both 📑 session "gesunde Grenzen setzen" and 🗂️ module "Boundary Management". You can proceed with more activities if you like, or skip ahead to 🗂️ module "Emotionsregulation".');
      });
    });

    describe('module-level advice (bouMgt: threshold 1, 2 completable sessions)', () => {
      beforeEach(() => {
        helper.enterModule('bouMgt');
      });

      it('returns empty string when below session threshold', () => {
        expect(helper.getProgressAdvice()).toBe('');
      });

      it('returns good-progress message when threshold met but sessions remain', () => {
        helper.enterSession('gesGre'); helper.enterActivity('rolGes'); helper.markActivityCompleted(); helper.enterActivity('abgKon'); helper.markActivityCompleted();
        helper.enterModule('bouMgt');
        expect(helper.getProgressAdvice()).toBe('You have good progress in module 🗂️ "Boundary Management". You can stay and complete more 📑 sessions, or skip to module 🗂️ "Emotionsregulation".');
      });

      it('returns all-completed message when all sessions are done', () => {
        helper.enterSession('gesGre'); helper.enterActivity('rolGes'); helper.markActivityCompleted(); helper.enterActivity('abgKon'); helper.markActivityCompleted();
        helper.enterModule('bouMgt');
        helper.enterSession('paus'); helper.enterActivity('mikPau'); helper.markActivityCompleted();
        helper.enterModule('bouMgt');
        expect(helper.getProgressAdvice()).toBe('You have completed all 📑 sessions in module 🗂️ "Boundary Management". You can re-visit them as often as you like, or skip to module 🗂️ "Emotionsregulation".');
      });
    });

    describe('module-level advice without a next module (emoReg: threshold 1, 2 completable sessions)', () => {
      it('returns good-progress message with no skip option when threshold met but sessions remain', () => {
        helper.enterModule('emoReg');
        helper.enterSession('neuBew'); helper.enterActivity('neuBewAct'); helper.markActivityCompleted();
        helper.enterModule('emoReg');
        expect(helper.getProgressAdvice()).toBe('You have good progress in module 🗂️ "Emotionsregulation". You can stay and complete more 📑 sessions.');
      });

      it('returns all-completed message with no skip option when all sessions are done', () => {
        helper.enterModule('emoReg');
        helper.enterSession('neuBew'); helper.enterActivity('neuBewAct'); helper.markActivityCompleted();
        helper.enterModule('emoReg');
        helper.enterSession('umgEmo');
        helper.enterActivity('akzep'); helper.markActivityCompleted();
        helper.enterActivity('emoSit'); helper.markActivityCompleted();
        helper.enterActivity('umgSup'); helper.markActivityCompleted();
        helper.enterModule('emoReg');
        expect(helper.getProgressAdvice()).toBe('You have completed all 📑 sessions in module 🗂️ "Emotionsregulation". You can re-visit them as often as you like.');
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
});
