import { describe, it, expect, beforeEach } from 'vitest';

const testState = {
  modules: [
    {
      id: 'mMod1',
      title: 'Modul Eins',
      sessions_needed_for_adequate_progress: 1,
      entered_first_at: null, entered_last_at: null, times_entered: 0,
      sessions: [
        {
          id: 'sSes1intro',
          title: 'Intro Eins',
          activities_needed_for_adequate_progress: 1,
          entered_first_at: null, entered_last_at: null, times_entered: 0,
          activities: [],
          is_intro: true,
        },
        {
          id: 'sSes1a',
          title: 'Session Eins A',
          activities_needed_for_adequate_progress: 1,
          entered_first_at: null, entered_last_at: null, times_entered: 0,
          activities: [
            { id: 'aAct1a1', title: 'Aktivität 1a-1', entered_first_at: null, entered_last_at: null, times_entered: 0, completed: false },
            { id: 'aAct1a2', title: 'Aktivität 1a-2 – Untertitel', entered_first_at: null, entered_last_at: null, times_entered: 0, completed: false },
          ],
        },
        {
          id: 'sSes1b',
          title: 'Session Eins B',
          activities_needed_for_adequate_progress: 1,
          entered_first_at: null, entered_last_at: null, times_entered: 0,
          activities: [
            { id: 'aAct1b1', title: 'Aktivität 1b-1', entered_first_at: null, entered_last_at: null, times_entered: 0, completed: false },
          ],
        },
      ],
    },
    {
      id: 'mMod2',
      title: 'Modul Zwei',
      sessions_needed_for_adequate_progress: 1,
      entered_first_at: null, entered_last_at: null, times_entered: 0,
      sessions: [
        {
          id: 'sSes2intro',
          title: 'Intro Zwei',
          activities_needed_for_adequate_progress: 1,
          entered_first_at: null, entered_last_at: null, times_entered: 0,
          activities: [],
          is_intro: true,
        },
        {
          id: 'sSes2a',
          title: 'Session Zwei A',
          activities_needed_for_adequate_progress: 1,
          entered_first_at: null, entered_last_at: null, times_entered: 0,
          activities: [
            { id: 'aAct2a1', title: 'Aktivität 2a-1', entered_first_at: null, entered_last_at: null, times_entered: 0, completed: false },
          ],
        },
        {
          id: 'sSes2b',
          title: 'Session Zwei B',
          activities_needed_for_adequate_progress: 2,
          entered_first_at: null, entered_last_at: null, times_entered: 0,
          activities: [
            { id: 'aAct2b1', title: 'Aktivität 2b-1', entered_first_at: null, entered_last_at: null, times_entered: 0, completed: false },
            { id: 'aAct2b2', title: 'Aktivität 2b-2', entered_first_at: null, entered_last_at: null, times_entered: 0, completed: false },
            { id: 'aAct2b3', title: 'Aktivität 2b-3', entered_first_at: null, entered_last_at: null, times_entered: 0, completed: false },
          ],
        },
      ],
    },
    {
      id: 'mMod3',
      title: 'Modul Drei',
      sessions_needed_for_adequate_progress: 2,
      entered_first_at: null, entered_last_at: null, times_entered: 0,
      sessions: [
        {
          id: 'sSes3intro',
          title: 'Intro Drei',
          activities_needed_for_adequate_progress: 1,
          entered_first_at: null, entered_last_at: null, times_entered: 0,
          activities: [],
          is_intro: true,
        },
        {
          id: 'sSes3a',
          title: 'Session Drei A',
          activities_needed_for_adequate_progress: 1,
          entered_first_at: null, entered_last_at: null, times_entered: 0,
          activities: [
            { id: 'aAct3a1', title: 'Aktivität 3a-1', entered_first_at: null, entered_last_at: null, times_entered: 0, completed: false },
          ],
        },
        {
          id: 'sSes3b',
          title: 'Session Drei B',
          activities_needed_for_adequate_progress: 1,
          entered_first_at: null, entered_last_at: null, times_entered: 0,
          activities: [
            { id: 'aAct3b1', title: 'Aktivität 3b-1', entered_first_at: null, entered_last_at: null, times_entered: 0, completed: false },
          ],
        },
        {
          id: 'sSes3c',
          title: 'Session Drei C',
          activities_needed_for_adequate_progress: 1,
          entered_first_at: null, entered_last_at: null, times_entered: 0,
          activities: [
            { id: 'aAct3c1', title: 'Aktivität 3c-1', entered_first_at: null, entered_last_at: null, times_entered: 0, completed: false },
          ],
        },
      ],
    },
  ],
  current_module_id: null,
  current_session_id: null,
  current_activity_id: null,
};

describe('ReactStateHelper', () => {
  let helper;

  beforeEach(() => {
    helper = ReactStateHelper.loadExistingState(JSON.stringify(testState));
  });

  describe('initDefaultState', () => {
    it('creates a fresh helper matching defaultStateTemplate()', () => {
      const fresh = ReactStateHelper.initDefaultState();
      expect(fresh.toString()).toBe(JSON.stringify(ReactStateHelper.defaultStateTemplate()));
    });
  });

  describe('loadExistingState', () => {
    it('loads persisted state from JSON', () => {
      helper.enter('mMod1');
      helper.enter('sSes1a');
      expect(helper.isSessionCompleted('sSes1a')).toBe(false);
      helper.enter('aAct1a1'); helper.completeActivity();
      helper.enter('aAct1a2'); helper.completeActivity();
      const restored = ReactStateHelper.loadExistingState(helper.toString());
      expect(restored.isSessionCompleted('sSes1a')).toBe(true);
    });
  });

  describe('isSessionCompleted', () => {
    beforeEach(() => {
      helper.enter('mMod1');
    });

    it('returns false for all sessions in the default state', () => {
      expect(helper.isSessionCompleted('sSes1a')).toBe(false);
      expect(helper.isSessionCompleted('sSes1b')).toBe(false);
      helper.enter('mMod2');
      expect(helper.isSessionCompleted('sSes2a')).toBe(false);
    });

    it('returns false when only some activities are completed', () => {
      helper.enter('sSes1a');
      helper.enter('aAct1a1'); helper.completeActivity();
      expect(helper.isSessionCompleted('sSes1a')).toBe(false);
    });

    it('returns true when all activities are completed', () => {
      helper.enter('sSes1a');
      helper.enter('aAct1a1'); helper.completeActivity();
      helper.enter('aAct1a2'); helper.completeActivity();
      expect(helper.isSessionCompleted('sSes1a')).toBe(true);
    });

    it('throws if no module has been entered', () => {
      helper = ReactStateHelper.loadExistingState(JSON.stringify(testState));
      expect(() => helper.isSessionCompleted('sSes1a')).toThrow('No module entered yet');
    });
  });

  describe('hasSessionAdequateProgress', () => {
    beforeEach(() => {
      helper.enter('mMod1');
    });

    it('returns false for all sessions in the default state', () => {
      expect(helper.hasSessionAdequateProgress('sSes1a')).toBe(false);
      expect(helper.hasSessionAdequateProgress('sSes1b')).toBe(false);
    });

    it('returns true once completed activities meet the threshold (sSes1a threshold=1)', () => {
      helper.enter('sSes1a');
      helper.enter('aAct1a1'); helper.completeActivity();
      expect(helper.hasSessionAdequateProgress('sSes1a')).toBe(true);
    });

    it('unlike isSessionCompleted, stays true even if not all activities are done', () => {
      helper.enter('sSes1a');
      helper.enter('aAct1a1'); helper.completeActivity();
      expect(helper.isSessionCompleted('sSes1a')).toBe(false);
      expect(helper.hasSessionAdequateProgress('sSes1a')).toBe(true);
    });

    it('throws if no module has been entered', () => {
      helper = ReactStateHelper.loadExistingState(JSON.stringify(testState));
      expect(() => helper.hasSessionAdequateProgress('sSes1a')).toThrow('No module entered yet');
    });
  });

  describe('isModuleCompleted', () => {
    it('returns false for all modules in the default state', () => {
      expect(helper.isModuleCompleted('mMod1')).toBe(false);
      expect(helper.isModuleCompleted('mMod2')).toBe(false);
    });

    it('returns false when only some sessions are completed', () => {
      helper.enter('mMod1');
      helper.enter('sSes1a');
      helper.enter('aAct1a1'); helper.completeActivity();
      helper.enter('aAct1a2'); helper.completeActivity();
      expect(helper.isModuleCompleted('mMod1')).toBe(false);
    });

    it('returns true when all sessions are completed (including the intro)', () => {
      helper.enter('mMod1');
      const mod1Data = testState.modules.find(m => m.id === 'mMod1');
      for (const ses of mod1Data.sessions) {
        helper.enter(ses.id);
        for (const act of ses.activities) {
          helper.enter(act.id); helper.completeActivity();
        }
      }
      expect(helper.isModuleCompleted('mMod1')).toBe(true);
    });

    it('does not count sessions from other modules', () => {
      helper.enter('mMod2');
      const mod2Data = testState.modules.find(m => m.id === 'mMod2');
      for (const ses of mod2Data.sessions) {
        helper.enter(ses.id);
        for (const act of ses.activities) {
          helper.enter(act.id); helper.completeActivity();
        }
      }
      expect(helper.isModuleCompleted('mMod1')).toBe(false);
    });
  });

  describe('getModuleProgress', () => {
    it('returns 0 for all modules in the default state', () => {
      expect(helper.getModuleProgress('mMod1')).toBe(0);
      expect(helper.getModuleProgress('mMod2')).toBe(0);
    });

    it('returns the fraction of completed sessions within the module (1 of 2 completable)', () => {
      helper.enter('mMod1');
      helper.enter('sSes1a');
      helper.enter('aAct1a1'); helper.completeActivity();
      helper.enter('aAct1a2'); helper.completeActivity();
      expect(helper.getModuleProgress('mMod1')).toBeCloseTo(1 / 2);
    });

    it('does not count sessions from other modules', () => {
      helper.enter('mMod2');
      helper.enter('sSes2a');
      helper.enter('aAct2a1'); helper.completeActivity();
      expect(helper.getModuleProgress('mMod1')).toBe(0);
    });

    it('returns 1 when all sessions in the module are completed', () => {
      helper.enter('mMod1');
      const mod1Data = testState.modules.find(m => m.id === 'mMod1');
      for (const ses of mod1Data.sessions) {
        helper.enter(ses.id);
        for (const act of ses.activities) {
          helper.enter(act.id); helper.completeActivity();
        }
      }
      expect(helper.getModuleProgress('mMod1')).toBe(1);
    });
  });

  describe('hasModuleAdequateProgress', () => {
    beforeEach(() => {
      helper.enter('mMod1');
    });

    it('returns false with no completed sessions', () => {
      expect(helper.hasModuleAdequateProgress('mMod1')).toBe(false);
    });

    it('returns true once the module threshold is met (mMod1 threshold=1)', () => {
      helper.enter('sSes1a');
      helper.enter('aAct1a1'); helper.completeActivity();
      helper.enter('aAct1a2'); helper.completeActivity();
      expect(helper.hasModuleAdequateProgress('mMod1')).toBe(true);
    });

    it('does not count sessions from other modules', () => {
      helper.enter('mMod2');
      helper.enter('sSes2a');
      helper.enter('aAct2a1'); helper.completeActivity();
      expect(helper.hasModuleAdequateProgress('mMod1')).toBe(false);
    });
  });

  describe('getCompletionOverview', () => {
    it('lists every module, session and activity id without completion marks in the default state', () => {
      expect(helper.getCompletionOverview()).toBe('🗂️mMod1[📑sSes1intro 📑sSes1a(🎯aAct1a1 🎯aAct1a2) 📑sSes1b(🎯aAct1b1)] 🗂️mMod2[📑sSes2intro 📑sSes2a(🎯aAct2a1) 📑sSes2b(🎯aAct2b1 🎯aAct2b2 🎯aAct2b3)] 🗂️mMod3[📑sSes3intro 📑sSes3a(🎯aAct3a1) 📑sSes3b(🎯aAct3b1) 📑sSes3c(🎯aAct3c1)]');
    });

    it('marks a completed activity without marking its partially completed session', () => {
      helper.enter('mMod1');
      helper.enter('sSes1a');
      helper.enter('aAct1a1'); helper.completeActivity();
      expect(helper.getCompletionOverview()).toContain('📑sSes1a(🎯aAct1a1✅ 🎯aAct1a2)');
    });

    it('marks a session once all its activities are completed', () => {
      helper.enter('mMod1');
      helper.enter('sSes1a');
      helper.enter('aAct1a1'); helper.completeActivity();
      helper.enter('aAct1a2'); helper.completeActivity();
      expect(helper.getCompletionOverview()).toContain('📑sSes1a✅(🎯aAct1a1✅ 🎯aAct1a2✅)');
    });

    it('marks an intro session once it has been entered', () => {
      helper.enter('mMod1');
      helper.enter('sSes1intro');
      expect(helper.getCompletionOverview()).toContain('📑sSes1intro✅');
    });

    it('marks a module once all its sessions (intro included) are completed', () => {
      helper.enter('mMod1');
      helper.enter('sSes1intro');
      helper.enter('sSes1a');
      helper.enter('aAct1a1'); helper.completeActivity();
      helper.enter('aAct1a2'); helper.completeActivity();
      helper.enter('sSes1b');
      helper.enter('aAct1b1'); helper.completeActivity();
      expect(helper.getCompletionOverview()).toBe('🗂️mMod1✅[📑sSes1intro✅ 📑sSes1a✅(🎯aAct1a1✅ 🎯aAct1a2✅) 📑sSes1b✅(🎯aAct1b1✅)] 🗂️mMod2[📑sSes2intro 📑sSes2a(🎯aAct2a1) 📑sSes2b(🎯aAct2b1 🎯aAct2b2 🎯aAct2b3)] 🗂️mMod3[📑sSes3intro 📑sSes3a(🎯aAct3a1) 📑sSes3b(🎯aAct3b1) 📑sSes3c(🎯aAct3c1)]');
    });
  });

  describe('enter / getParticipantLocation', () => {
    it('returns null before any module has been entered', () => {
      expect(helper.getParticipantLocation()).toBeNull();
    });

    it('returns just the module id after entering a module but no session yet', () => {
      helper.enter('mMod1');
      expect(helper.getParticipantLocation()).toBe('mMod1');
    });

    it('returns "moduleId: sessionId" after entering a module and session', () => {
      helper.enter('mMod1');
      helper.enter('sSes1a');
      expect(helper.getParticipantLocation()).toBe('mMod1: sSes1a');
    });

    it('updates to the most recently entered module and session', () => {
      helper.enter('mMod1');
      helper.enter('sSes1a');
      helper.enter('mMod2');
      helper.enter('sSes2a');
      expect(helper.getParticipantLocation()).toBe('mMod2: sSes2a');
    });

    it('appends the activity id once an activity has been entered', () => {
      helper.enter('mMod1');
      helper.enter('sSes1a');
      helper.enter('aAct1a1');
      expect(helper.getParticipantLocation()).toBe('mMod1: sSes1a: aAct1a1');
    });

    it('drops the activity id again after entering a new session', () => {
      helper.enter('mMod1');
      helper.enter('sSes1a');
      helper.enter('aAct1a1');
      helper.enter('sSes1b');
      expect(helper.getParticipantLocation()).toBe('mMod1: sSes1b');
    });

    it('drops the session and activity ids after entering a new module', () => {
      helper.enter('mMod1');
      helper.enter('sSes1a');
      helper.enter('aAct1a1');
      helper.enter('mMod2');
      expect(helper.getParticipantLocation()).toBe('mMod2');
    });

    it('drops the activity id but keeps the session id after re-entering the same session', () => {
      helper.enter('mMod1');
      helper.enter('sSes1a');
      helper.enter('aAct1a1');
      helper.enter('sSes1a');
      expect(helper.getParticipantLocation()).toBe('mMod1: sSes1a');
    });

    it('sets entered_first_at on first enter of a module and does not overwrite it', () => {
      helper.enter('mMod1');
      const first = JSON.parse(helper.toString()).modules.find(m => m.id === 'mMod1').entered_first_at;
      expect(first).not.toBeNull();
      helper.enter('mMod1');
      const second = JSON.parse(helper.toString()).modules.find(m => m.id === 'mMod1').entered_first_at;
      expect(second).toBe(first);
    });

    it('increments times_entered on each enter of a module', () => {
      helper.enter('mMod1');
      helper.enter('mMod1');
      const mod = JSON.parse(helper.toString()).modules.find(m => m.id === 'mMod1');
      expect(mod.times_entered).toBe(2);
    });

    it('updates entered_last_at on every enter of a module', () => {
      helper.enter('mMod1');
      const first = JSON.parse(helper.toString()).modules.find(m => m.id === 'mMod1').entered_last_at;
      expect(first).not.toBeNull();
      helper.enter('mMod1');
      const second = JSON.parse(helper.toString()).modules.find(m => m.id === 'mMod1').entered_last_at;
      expect(second).not.toBeNull();
    });

    it('sets entered_first_at on first enter of a session and does not overwrite it', () => {
      helper.enter('mMod1');
      helper.enter('sSes1a');
      const first = JSON.parse(helper.toString()).modules.find(m => m.id === 'mMod1')
        .sessions.find(s => s.id === 'sSes1a').entered_first_at;
      expect(first).not.toBeNull();
      helper.enter('sSes1a');
      const second = JSON.parse(helper.toString()).modules.find(m => m.id === 'mMod1')
        .sessions.find(s => s.id === 'sSes1a').entered_first_at;
      expect(second).toBe(first);
    });

    it('increments times_entered on each enter of a session', () => {
      helper.enter('mMod1');
      helper.enter('sSes1a');
      helper.enter('sSes1a');
      const session = JSON.parse(helper.toString()).modules.find(m => m.id === 'mMod1')
        .sessions.find(s => s.id === 'sSes1a');
      expect(session.times_entered).toBe(2);
    });

    it('updates entered_last_at on every enter of a session', () => {
      helper.enter('mMod1');
      helper.enter('sSes1a');
      const first = JSON.parse(helper.toString()).modules.find(m => m.id === 'mMod1')
        .sessions.find(s => s.id === 'sSes1a').entered_last_at;
      expect(first).not.toBeNull();
      helper.enter('sSes1a');
      const second = JSON.parse(helper.toString()).modules.find(m => m.id === 'mMod1')
        .sessions.find(s => s.id === 'sSes1a').entered_last_at;
      expect(second).not.toBeNull();
    });

    it('persists through serialization', () => {
      helper.enter('mMod1');
      helper.enter('sSes1a');
      const restored = ReactStateHelper.loadExistingState(helper.toString());
      expect(restored.getParticipantLocation()).toBe('mMod1: sSes1a');
    });

    it('throws if the moduleId does not exist', () => {
      expect(() => helper.enter('mNonExistent')).toThrow('Module mNonExistent not found');
    });

    it('throws if the id has no known level letter', () => {
      expect(() => helper.enter('nonExistent')).toThrow('Cannot enter id nonExistent: it must start with "m", "s" or "a" followed by an uppercase letter');
    });

    it('throws if a session is entered without a current module', () => {
      expect(() => helper.enter('sSes1a')).toThrow('No module entered yet');
    });

    it('throws if the sessionId is not in the current module', () => {
      helper.enter('mMod1');
      expect(() => helper.enter('sSes2a')).toThrow('Session sSes2a not found in module mMod1');
    });

    it('entering a module resets current_session_id and current_activity_id', () => {
      helper.enter('mMod1');
      helper.enter('sSes1a');
      helper.enter('aAct1a1');
      helper.enter('mMod2');
      const state = JSON.parse(helper.toString());
      expect(state.current_session_id).toBeNull();
      expect(state.current_activity_id).toBeNull();
    });

    it('throws a dedicated error for the allModulesMenu back-entry id — it is a pure routing target, dialogs enter themselves', () => {
      expect(() => helper.enter('allModulesMenu')).toThrow('allModulesMenu must never be entered: it only routes to the dialog that shows the module-selection menu, which leaves the location unchanged — the location changes when the participant taps a module and that dialog runs enter with its own id');
    });

    it('throws a dedicated error for the allSessionsOfCurrentModuleMenu back-entry id — it is a pure routing target, dialogs enter themselves', () => {
      expect(() => helper.enter('allSessionsOfCurrentModuleMenu')).toThrow('allSessionsOfCurrentModuleMenu must never be entered: it only routes to the dialog that shows the session-selection menu of the current module, which leaves the location unchanged — the location changes when the participant taps a session and that dialog runs enter with its own id');
    });

    it('entering a session resets current_activity_id', () => {
      helper.enter('mMod1');
      helper.enter('sSes1a');
      helper.enter('aAct1a1');
      helper.enter('sSes1b');
      expect(JSON.parse(helper.toString()).current_activity_id).toBeNull();
    });
  });

  describe('getCurrentModuleTimesEntered / getCurrentSessionTimesEntered / getCurrentActivityTimesEntered', () => {
    it('returns null on all levels before anything is entered', () => {
      expect(helper.getCurrentModuleTimesEntered()).toBeNull();
      expect(helper.getCurrentSessionTimesEntered()).toBeNull();
      expect(helper.getCurrentActivityTimesEntered()).toBeNull();
    });

    it('returns the count for each entered level and null below the deepest entered level', () => {
      helper.enter('mMod1');
      expect(helper.getCurrentModuleTimesEntered()).toBe(1);
      expect(helper.getCurrentSessionTimesEntered()).toBeNull();
      expect(helper.getCurrentActivityTimesEntered()).toBeNull();
      helper.enter('sSes1a');
      expect(helper.getCurrentSessionTimesEntered()).toBe(1);
      expect(helper.getCurrentActivityTimesEntered()).toBeNull();
      helper.enter('aAct1a1');
      expect(helper.getCurrentActivityTimesEntered()).toBe(1);
    });

    it('counts repeated enters of the same item', () => {
      helper.enter('mMod1');
      helper.enter('mMod1');
      helper.enter('mMod1');
      expect(helper.getCurrentModuleTimesEntered()).toBe(3);
    });

    it('returns the new current item\'s own count after switching, not the previous one\'s', () => {
      helper.enter('mMod1');
      helper.enter('mMod1');
      helper.enter('mMod2');
      expect(helper.getCurrentModuleTimesEntered()).toBe(1);
    });

    it('returns null for session and activity again after re-entering a module (which clears them)', () => {
      helper.enter('mMod1');
      helper.enter('sSes1a');
      helper.enter('aAct1a1');
      helper.enter('mMod1');
      expect(helper.getCurrentModuleTimesEntered()).toBe(2);
      expect(helper.getCurrentSessionTimesEntered()).toBeNull();
      expect(helper.getCurrentActivityTimesEntered()).toBeNull();
    });
  });

  describe('isCurrentModuleCompleted / isCurrentSessionCompleted / isCurrentActivityCompleted', () => {
    it('returns null on all levels before anything is entered', () => {
      expect(helper.isCurrentModuleCompleted()).toBeNull();
      expect(helper.isCurrentSessionCompleted()).toBeNull();
      expect(helper.isCurrentActivityCompleted()).toBeNull();
    });

    it('returns false for each entered but uncompleted level and null below the deepest entered level', () => {
      helper.enter('mMod1');
      expect(helper.isCurrentModuleCompleted()).toBe(false);
      expect(helper.isCurrentSessionCompleted()).toBeNull();
      expect(helper.isCurrentActivityCompleted()).toBeNull();
      helper.enter('sSes1a');
      expect(helper.isCurrentSessionCompleted()).toBe(false);
      expect(helper.isCurrentActivityCompleted()).toBeNull();
      helper.enter('aAct1a1');
      expect(helper.isCurrentActivityCompleted()).toBe(false);
    });

    it('turns true level by level as activities complete and roll up into their session and module', () => {
      helper.enter('mMod1');
      helper.enter('sSes1intro'); // an intro session completes on enter
      helper.enter('sSes1a');
      helper.enter('aAct1a1');
      helper.completeActivity();
      expect(helper.isCurrentActivityCompleted()).toBe(true);
      expect(helper.isCurrentSessionCompleted()).toBe(false); // aAct1a2 still open
      helper.enter('aAct1a2');
      helper.completeActivity();
      expect(helper.isCurrentSessionCompleted()).toBe(true);
      expect(helper.isCurrentModuleCompleted()).toBe(false); // sSes1b still open
      helper.enter('sSes1b');
      helper.enter('aAct1b1');
      helper.completeActivity();
      expect(helper.isCurrentModuleCompleted()).toBe(true);
    });

    it('returns null for session and activity again after re-entering a module (which clears them)', () => {
      helper.enter('mMod1');
      helper.enter('sSes1a');
      helper.enter('aAct1a1');
      helper.completeActivity();
      helper.enter('mMod1');
      expect(helper.isCurrentModuleCompleted()).toBe(false);
      expect(helper.isCurrentSessionCompleted()).toBeNull();
      expect(helper.isCurrentActivityCompleted()).toBeNull();
    });
  });

  describe('entering an activity', () => {
    beforeEach(() => {
      helper.enter('mMod1');
    });

    it('sets the current activity', () => {
      helper.enter('sSes1a');
      helper.enter('aAct1a1');
      expect(JSON.parse(helper.toString()).current_activity_id).toBe('aAct1a1');
    });

    it('throws if an activity is entered without a current session', () => {
      expect(() => helper.enter('aAct1a1')).toThrow('No session entered yet');
    });

    it('throws if the activityId is not in the current session', () => {
      helper.enter('sSes1a');
      expect(() => helper.enter('aAct2a1')).toThrow('Activity aAct2a1 not found in session sSes1a');
    });

    it('sets entered_first_at on first enter of an activity and does not overwrite it', () => {
      helper.enter('sSes1a');
      helper.enter('aAct1a1');
      const first = JSON.parse(helper.toString()).modules.find(m => m.id === 'mMod1')
        .sessions.find(s => s.id === 'sSes1a')
        .activities.find(a => a.id === 'aAct1a1').entered_first_at;
      expect(first).not.toBeNull();
      helper.enter('aAct1a1');
      const second = JSON.parse(helper.toString()).modules.find(m => m.id === 'mMod1')
        .sessions.find(s => s.id === 'sSes1a')
        .activities.find(a => a.id === 'aAct1a1').entered_first_at;
      expect(second).toBe(first);
    });

    it('increments times_entered on each enter of an activity', () => {
      helper.enter('sSes1a');
      helper.enter('aAct1a1');
      helper.enter('aAct1a1');
      const activity = JSON.parse(helper.toString()).modules.find(m => m.id === 'mMod1')
        .sessions.find(s => s.id === 'sSes1a')
        .activities.find(a => a.id === 'aAct1a1');
      expect(activity.times_entered).toBe(2);
    });

    it('updates entered_last_at on every enter of an activity', () => {
      helper.enter('sSes1a');
      helper.enter('aAct1a1');
      const first = JSON.parse(helper.toString()).modules.find(m => m.id === 'mMod1')
        .sessions.find(s => s.id === 'sSes1a')
        .activities.find(a => a.id === 'aAct1a1').entered_last_at;
      expect(first).not.toBeNull();
      helper.enter('aAct1a1');
      const second = JSON.parse(helper.toString()).modules.find(m => m.id === 'mMod1')
        .sessions.find(s => s.id === 'sSes1a')
        .activities.find(a => a.id === 'aAct1a1').entered_last_at;
      expect(second).not.toBeNull();
    });
  });

  describe('populateMenuWithModules', () => {
    it('marks the first incomplete module with a trailing 👈 and leaves the rest plain', () => {
      helper.populateMenuWithModules();
      expect(helper.getMenuLabel(1)).toBe('🗂️ Modul Eins 👈');
      expect(helper.getMenuLabel(2)).toBe('🗂️ Modul Zwei');
    });

    it('provides each module id in the slot matching its label', () => {
      helper.populateMenuWithModules();
      expect(helper.getMenuId(1)).toBe('mMod1');
      expect(helper.getMenuId(2)).toBe('mMod2');
    });

    it('fills unused slots with empty string', () => {
      helper.populateMenuWithModules();
      for (let i = 4; i <= 9; i++) {
        expect(helper.getMenuLabel(i)).toBe('');
        expect(helper.getMenuId(i)).toBe('');
      }
    });

    it('marks a completed module with a trailing ✅', () => {
      helper.enter('mMod1');
      const mod1Data = testState.modules.find(m => m.id === 'mMod1');
      for (const ses of mod1Data.sessions) {
        helper.enter(ses.id);
        for (const act of ses.activities) {
          helper.enter(act.id); helper.completeActivity();
        }
      }
      helper.populateMenuWithModules();
      expect(helper.getMenuLabel(1)).toBe('🗂️ Modul Eins ✅');
      expect(helper.getMenuLabel(2)).toBe('🗂️ Modul Zwei 👈');
    });

    it('marks no module as 👈 when all are ✅', () => {
      for (const mod of testState.modules) {
        helper.enter(mod.id);
        for (const ses of mod.sessions) {
          helper.enter(ses.id);
          for (const act of ses.activities) {
            helper.enter(act.id); helper.completeActivity();
          }
        }
      }
      helper.populateMenuWithModules();
      expect(helper.getMenuLabel(1)).toBe('🗂️ Modul Eins ✅');
      expect(helper.getMenuLabel(2)).toBe('🗂️ Modul Zwei ✅');
    });
  });

  describe('populateMenuWithSessions', () => {
    beforeEach(() => {
      helper.enter('mMod1');
    });

    it('marks the first incomplete session with a trailing 👈 and leaves the rest plain', () => {
      helper.populateMenuWithSessions();
      expect(helper.getMenuLabel(1)).toBe('📑 Intro Eins 👈');
      expect(helper.getMenuLabel(2)).toBe('📑 Session Eins A');
      expect(helper.getMenuLabel(3)).toBe('📑 Session Eins B');
    });

    it('provides each session id in the slot matching its label', () => {
      helper.populateMenuWithSessions();
      expect(helper.getMenuId(1)).toBe('sSes1intro');
      expect(helper.getMenuId(2)).toBe('sSes1a');
      expect(helper.getMenuId(3)).toBe('sSes1b');
    });

    it('appends a back-to-module-overview entry in the slot after the last session', () => {
      helper.populateMenuWithSessions();
      expect(helper.getMenuLabel(4)).toBe('Ein anderes 🗂️ Modul wählen');
      expect(helper.getMenuId(4)).toBe('allModulesMenu');
    });

    it('fills unused slots with empty string', () => {
      helper.populateMenuWithSessions();
      for (let i = 5; i <= 9; i++) {
        expect(helper.getMenuLabel(i)).toBe('');
        expect(helper.getMenuId(i)).toBe('');
      }
    });

    it('marks a completed session with a trailing ✅', () => {
      helper.enter('sSes1a');
      helper.enter('aAct1a1'); helper.completeActivity();
      helper.enter('aAct1a2'); helper.completeActivity();
      helper.populateMenuWithSessions();
      expect(helper.getMenuLabel(1)).toBe('📑 Intro Eins 👈');
      expect(helper.getMenuLabel(2)).toBe('📑 Session Eins A ✅');
      expect(helper.getMenuLabel(3)).toBe('📑 Session Eins B');
    });

    it('marks all sessions as ✅ when all are completed (intro becomes ✅ as soon as it is entered)', () => {
      const mod1Data = testState.modules.find(m => m.id === 'mMod1');
      for (const ses of mod1Data.sessions) {
        helper.enter(ses.id);
        for (const act of ses.activities) {
          helper.enter(act.id); helper.completeActivity();
        }
      }
      helper.populateMenuWithSessions();
      expect(helper.getMenuLabel(1)).toBe('📑 Intro Eins ✅');
      expect(helper.getMenuLabel(2)).toBe('📑 Session Eins A ✅');
      expect(helper.getMenuLabel(3)).toBe('📑 Session Eins B ✅');
    });

    it('never marks the back entry with 👈 or ✅', () => {
      const mod1Data = testState.modules.find(m => m.id === 'mMod1');
      for (const ses of mod1Data.sessions) {
        helper.enter(ses.id);
        for (const act of ses.activities) {
          helper.enter(act.id); helper.completeActivity();
        }
      }
      helper.populateMenuWithSessions();
      expect(helper.getMenuLabel(4)).toBe('Ein anderes 🗂️ Modul wählen');
    });

    it('throws if no module has been entered', () => {
      helper = ReactStateHelper.loadExistingState(JSON.stringify(testState));
      expect(() => helper.populateMenuWithSessions()).toThrow('No module entered yet');
    });
  });

  describe('populateMenuWithActivities', () => {
    beforeEach(() => {
      helper.enter('mMod1');
      helper.enter('sSes1a');
    });

    it('marks the first incomplete activity with a trailing 👈 and leaves the rest plain', () => {
      helper.populateMenuWithActivities();
      expect(helper.getMenuLabel(1)).toBe('🎯 Aktivität 1a-1 👈');
      expect(helper.getMenuLabel(2)).toBe('🎯 Aktivität 1a-2 – Untertitel');
    });

    it('provides each activity id in the slot matching its label', () => {
      helper.populateMenuWithActivities();
      expect(helper.getMenuId(1)).toBe('aAct1a1');
      expect(helper.getMenuId(2)).toBe('aAct1a2');
    });

    it('appends a back-to-sessions-menu entry in the slot after the last activity', () => {
      helper.populateMenuWithActivities();
      expect(helper.getMenuLabel(3)).toBe('Eine andere 📑 Session wählen');
      expect(helper.getMenuId(3)).toBe('allSessionsOfCurrentModuleMenu');
    });

    it('appends a back-to-module-overview entry in the slot after the session back entry', () => {
      helper.populateMenuWithActivities();
      expect(helper.getMenuLabel(4)).toBe('Ein anderes 🗂️ Modul wählen');
      expect(helper.getMenuId(4)).toBe('allModulesMenu');
    });

    it('fills unused slots with empty string', () => {
      helper.populateMenuWithActivities();
      for (let i = 5; i <= 9; i++) {
        expect(helper.getMenuLabel(i)).toBe('');
        expect(helper.getMenuId(i)).toBe('');
      }
    });

    it('marks a completed activity with a trailing ✅', () => {
      helper.enter('aAct1a1'); helper.completeActivity();
      helper.populateMenuWithActivities();
      expect(helper.getMenuLabel(1)).toBe('🎯 Aktivität 1a-1 ✅');
      expect(helper.getMenuLabel(2)).toBe('🎯 Aktivität 1a-2 – Untertitel 👈');
    });

    it('throws if no module has been entered', () => {
      helper = ReactStateHelper.loadExistingState(JSON.stringify(testState));
      expect(() => helper.populateMenuWithActivities()).toThrow('No module entered yet');
    });

    it('marks no activity as 👈 when all are ✅', () => {
      helper.enter('aAct1a1'); helper.completeActivity();
      helper.enter('aAct1a2'); helper.completeActivity();
      helper.populateMenuWithActivities();
      expect(helper.getMenuLabel(1)).toBe('🎯 Aktivität 1a-1 ✅');
      expect(helper.getMenuLabel(2)).toBe('🎯 Aktivität 1a-2 – Untertitel ✅');
    });

    it('throws if no session has been entered', () => {
      helper = ReactStateHelper.loadExistingState(JSON.stringify(testState));
      helper.enter('mMod1');
      expect(() => helper.populateMenuWithActivities()).toThrow('No session entered yet');
    });
  });


  describe('getProgressAdvice', () => {
    it('throws when no module is entered', () => {
      expect(() => helper.getProgressAdvice()).toThrow('No module entered yet');
    });

    describe('module-level advice', () => {
      describe('other modules without adequate progress yet (mMod1: threshold 1, 2 completable sessions)', () => {
        beforeEach(() => {
          helper.enter('mMod1');
        });

        it('returns a start-with message when no session has been entered yet', () => {
          expect(helper.getProgressAdvice()).toBe('Beginne mit einer der verfügbaren 📑 Sessions in Modul "🗂️ Modul Eins".');
        });

        it('returns a keep-going message when some sessions done but below threshold (mMod3: threshold 2)', () => {
          helper.enter('mMod3');
          helper.enter('sSes3a'); helper.enter('aAct3a1'); helper.completeActivity();
          helper.enter('mMod3');
          expect(helper.getProgressAdvice()).toBe('Mach weiter in Modul "🗂️ Modul Drei" — zum Beispiel mit Session "📑 Session Drei B".');
        });

        it('returns good-progress message when threshold met but sessions remain', () => {
          helper.enter('sSes1a'); helper.enter('aAct1a1'); helper.completeActivity(); helper.enter('aAct1a2'); helper.completeActivity();
          helper.enter('mMod1');
          expect(helper.getProgressAdvice()).toBe('Du hast in Modul "🗂️ Modul Eins" ausreichend Fortschritt gemacht. Du kannst bleiben und weitere 📑 Sessions abschliessen, oder zu Modul "🗂️ Modul Zwei" weitergehen.');
        });

        it('returns all-completed message when all sessions are done', () => {
          helper.enter('sSes1a'); helper.enter('aAct1a1'); helper.completeActivity(); helper.enter('aAct1a2'); helper.completeActivity();
          helper.enter('mMod1');
          helper.enter('sSes1b'); helper.enter('aAct1b1'); helper.completeActivity();
          helper.enter('mMod1');
          expect(helper.getProgressAdvice()).toBe('Du hast Modul "🗂️ Modul Eins" erfolgreich abgeschlossen. Die enthaltenen Sessions kannst du jederzeit erneut besuchen, oder zu Modul "🗂️ Modul Zwei" weitergehen.');
        });
      });

      describe('all other modules with adequate progress (mMod3: threshold 2, 3 completable sessions)', () => {
        it('returns good-progress message when threshold met but sessions remain', () => {
          helper.enter('mMod3');
          helper.enter('sSes3a'); helper.enter('aAct3a1'); helper.completeActivity();
          helper.enter('mMod3');
          helper.enter('sSes3b'); helper.enter('aAct3b1'); helper.completeActivity();
          helper.enter('mMod3');
          expect(helper.getProgressAdvice()).toBe('Du hast in Modul "🗂️ Modul Drei" ausreichend Fortschritt gemacht — und das gilt auch für alle anderen Module. Du kannst bleiben und weitere 📑 Sessions abschliessen.');
        });

        it('returns all-completed message when all sessions are done', () => {
          helper.enter('mMod3');
          helper.enter('sSes3a'); helper.enter('aAct3a1'); helper.completeActivity();
          helper.enter('mMod3');
          helper.enter('sSes3b'); helper.enter('aAct3b1'); helper.completeActivity();
          helper.enter('mMod3');
          helper.enter('sSes3c'); helper.enter('aAct3c1'); helper.completeActivity();
          helper.enter('mMod3');
          expect(helper.getProgressAdvice()).toBe('Du hast Modul "🗂️ Modul Drei" erfolgreich abgeschlossen — und das gilt auch für alle anderen Module. Die enthaltenen Sessions kannst du jederzeit erneut besuchen.');
        });
      });
    });

    describe('session-level advice', () => {
      it('returns a start-with message when no activity has been entered yet', () => {
        helper.enter('mMod1');
        helper.enter('sSes1a');
        expect(helper.getProgressAdvice()).toBe('Beginne mit einer der verfügbaren 🎯 Aktivitäten in Session "📑 Session Eins A".');
      });

      it('returns a keep-going message when an activity is done but below threshold (sSes2b: threshold 2)', () => {
        helper.enter('mMod2');
        helper.enter('sSes2b');
        helper.enter('aAct2b1'); helper.completeActivity();
        expect(helper.getProgressAdvice()).toBe('Mach weiter in Session "📑 Session Zwei B" — zum Beispiel mit Aktivität "🎯 Aktivität 2b-2".');
      });

      it('returns an adequate-progress message once the threshold is met but not all activities are done (sSes1a: threshold 1, 2 activities)', () => {
        helper.enter('mMod1');
        helper.enter('sSes1a');
        helper.enter('aAct1a1'); helper.completeActivity();
        expect(helper.getProgressAdvice()).toBe('Du hast in Session "📑 Session Eins A" ausreichend Fortschritt gemacht. Du kannst bleiben und weitere 🎯 Aktivitäten abschliessen, oder eine andere 📑 Session bzw. ein anderes 🗂️ Modul wählen.');
      });

      it('returns a session-complete message when all activities are done (sSes3a: threshold 1, 1 activity)', () => {
        helper.enter('mMod3');
        helper.enter('sSes3a');
        helper.enter('aAct3a1'); helper.completeActivity();
        expect(helper.getProgressAdvice()).toBe('Du hast Session "📑 Session Drei A" erfolgreich abgeschlossen. Die enthaltenen Aktivitäten kannst du jederzeit erneut besuchen, oder eine andere 📑 Session bzw. ein anderes 🗂️ Modul wählen.');
      });
    });
  });

  describe('production data (ReactStateHelper.defaultStateTemplate()) structural invariants', () => {
    let state;
    beforeEach(() => {
      state = JSON.parse(ReactStateHelper.initDefaultState().toString());
    });

    it('completing every activity in every session completes every module without throwing', () => {
      const p = ReactStateHelper.initDefaultState();
      for (const mod of state.modules) {
        p.enter(mod.id);
        for (const ses of mod.sessions) {
          p.enter(ses.id);
          for (const act of ses.activities) {
            p.enter(act.id);
            p.completeActivity();
          }
        }
      }
      for (const mod of state.modules) {
        expect(p.isModuleCompleted(mod.id)).toBe(true);
      }
    });
  });

  describe('state validation', () => {
    const minimalValidState = () => ({
      modules: [
        {
          id: 'mM1',
          title: 'M1',
          sessions_needed_for_adequate_progress: 1,
          sessions: [
            {
              id: 'sS1',
              title: 'S1',
              activities_needed_for_adequate_progress: 1,
              activities: [{ id: 'aA1', title: 'A1' }],
            },
          ],
        },
      ],
      current_module_id: null,
      current_session_id: null,
      current_activity_id: null,
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
        id: 'mM2',
        title: 'M2',
        sessions_needed_for_adequate_progress: 1,
        sessions: [{ id: 'sS1', title: 'S1 dup', activities_needed_for_adequate_progress: 1, activities: [{ id: 'aA2', title: 'A2' }] }],
      });
      expect(() => ReactStateHelper.loadExistingState(JSON.stringify(state))).toThrow('Duplicate id found in state: sS1');
    });

    it('throws naming the convention when a module id is missing the m level letter', () => {
      const state = minimalValidState();
      state.modules[0].id = 'm1';
      expect(() => ReactStateHelper.loadExistingState(JSON.stringify(state))).toThrow('Id m1 must start with "m" followed by an uppercase letter, and contain only letters and numbers');
    });

    it('throws naming the convention when a session id is missing the s level letter', () => {
      const state = minimalValidState();
      state.modules[0].sessions[0].id = 's1';
      expect(() => ReactStateHelper.loadExistingState(JSON.stringify(state))).toThrow('Id s1 must start with "s" followed by an uppercase letter, and contain only letters and numbers');
    });

    it('throws naming the convention when an activity id is missing the a level letter', () => {
      const state = minimalValidState();
      state.modules[0].sessions[0].activities[0].id = 'a1';
      expect(() => ReactStateHelper.loadExistingState(JSON.stringify(state))).toThrow('Id a1 must start with "a" followed by an uppercase letter, and contain only letters and numbers');
    });

    it('throws when an id contains a character that is not a letter or number', () => {
      const state = minimalValidState();
      // An underscore inside the id would make it unusable as a MobileCoach dialog variable prefix,
      // which only allows letters and numbers before the trailing underscore.
      state.modules[0].id = 'mBou_Mgt';
      expect(() => ReactStateHelper.loadExistingState(JSON.stringify(state))).toThrow('Id mBou_Mgt must start with "m" followed by an uppercase letter, and contain only letters and numbers');
    });

    it('throws a dedicated error when a state id uses the reserved allModulesMenu dialog id', () => {
      const state = minimalValidState();
      state.modules[0].id = 'allModulesMenu';
      expect(() => ReactStateHelper.loadExistingState(JSON.stringify(state))).toThrow('Id allModulesMenu is reserved for the dialog showing the module-selection menu and cannot be used as a state id');
    });

    it('throws a dedicated error when a state id uses the reserved allSessionsOfCurrentModuleMenu dialog id', () => {
      const state = minimalValidState();
      state.modules[0].id = 'allSessionsOfCurrentModuleMenu';
      expect(() => ReactStateHelper.loadExistingState(JSON.stringify(state))).toThrow('Id allSessionsOfCurrentModuleMenu is reserved for the dialog showing the session-selection menu of the current module and cannot be used as a state id');
    });

    it('throws when a module threshold exceeds its own session count', () => {
      const state = minimalValidState();
      state.modules[0].sessions_needed_for_adequate_progress = 2;
      expect(() => ReactStateHelper.loadExistingState(JSON.stringify(state))).toThrow('Module mM1 has an unachievable sessions_needed_for_adequate_progress (2) for its 1 session(s)');
    });

    it('throws when a session threshold exceeds its own activity count', () => {
      const state = minimalValidState();
      state.modules[0].sessions[0].activities_needed_for_adequate_progress = 2;
      expect(() => ReactStateHelper.loadExistingState(JSON.stringify(state))).toThrow('Session sS1 has an unachievable activities_needed_for_adequate_progress (2) for its 1 activity/activities');
    });

    it('does not enforce a threshold for intro sessions without activities', () => {
      const state = minimalValidState();
      state.modules[0].sessions[0].activities = [];
      state.modules[0].sessions[0].activities_needed_for_adequate_progress = 5;
      state.modules[0].sessions[0].is_intro = true;
      // The module needs at least one session with activities besides the intro session under test.
      state.modules[0].sessions.push({ id: 'sS2', title: 'S2', activities_needed_for_adequate_progress: 1, activities: [{ id: 'aA2', title: 'A2' }] });
      expect(() => ReactStateHelper.loadExistingState(JSON.stringify(state))).not.toThrow();
    });

    it('throws when a module has no sessions', () => {
      const state = minimalValidState();
      state.modules[0].sessions = [];
      expect(() => ReactStateHelper.loadExistingState(JSON.stringify(state))).toThrow('Module mM1 has no sessions');
    });

    it('throws when a module has only sessions without activities', () => {
      const state = minimalValidState();
      state.modules[0].sessions[0].activities = [];
      state.modules[0].sessions[0].is_intro = true;
      expect(() => ReactStateHelper.loadExistingState(JSON.stringify(state))).toThrow('Module mM1 has no sessions with activities (every module needs at least one non-intro session)');
    });

    it('throws when a non-intro session has no activities', () => {
      const state = minimalValidState();
      state.modules[0].sessions[0].activities = [];
      expect(() => ReactStateHelper.loadExistingState(JSON.stringify(state))).toThrow('Session sS1 has no activities (set is_intro: true if this is intentional)');
    });

    it('does not throw when an intro-session has no activities', () => {
      const state = minimalValidState();
      state.modules[0].sessions[0].activities = [];
      state.modules[0].sessions[0].is_intro = true;
      // The module needs at least one session with activities besides the intro session under test.
      state.modules[0].sessions.push({ id: 'sS2', title: 'S2', activities_needed_for_adequate_progress: 1, activities: [{ id: 'aA2', title: 'A2' }] });
      expect(() => ReactStateHelper.loadExistingState(JSON.stringify(state))).not.toThrow();
    });

    it('throws when an intro session is not the first session in its module', () => {
      const state = minimalValidState();
      state.modules[0].sessions.push({ id: 'sS2', title: 'S2', activities_needed_for_adequate_progress: 1, activities: [], is_intro: true });
      expect(() => ReactStateHelper.loadExistingState(JSON.stringify(state))).toThrow('Session sS2 in module mM1 is marked is_intro but is not the first session — only the first session may be an intro');
    });

    it('does not throw when the first session is is_intro and subsequent sessions are not', () => {
      const state = minimalValidState();
      state.modules[0].sessions.unshift({ id: 'sIntro', title: 'Intro', activities_needed_for_adequate_progress: 1, activities: [], is_intro: true });
      expect(() => ReactStateHelper.loadExistingState(JSON.stringify(state))).not.toThrow();
    });

    it('throws when more than 9 modules are present', () => {
      const state = minimalValidState();
      // Each module must be individually valid — the per-module checks fire before this top-level count check does.
      state.modules = Array.from({ length: 10 }, (_, i) => ({
        id: `mM${i}`,
        title: `M${i}`,
        sessions_needed_for_adequate_progress: 1,
        sessions: [{ id: `sS${i}`, title: `S${i}`, activities_needed_for_adequate_progress: 1, activities: [{ id: `aA${i}`, title: `A${i}` }] }],
      }));
      expect(() => ReactStateHelper.loadExistingState(JSON.stringify(state))).toThrow('State has 10 modules, but at most 9 are supported');
    });

    it('throws when a module has more than 8 sessions (one menu slot is reserved for the back entry)', () => {
      const state = minimalValidState();
      state.modules[0].sessions = Array.from({ length: 9 }, (_, i) =>
        i === 0
          ? { id: `sS${i}`, title: `S${i}`, activities_needed_for_adequate_progress: 1, activities: [{ id: `aA${i}`, title: `A${i}` }] }
          : { id: `sS${i}`, title: `S${i}`, activities_needed_for_adequate_progress: 1, activities: [], is_intro: true }
      );
      expect(() => ReactStateHelper.loadExistingState(JSON.stringify(state))).toThrow('Module mM1 has 9 sessions, but at most 8 are supported (one menu slot is reserved for the back entry)');
    });

    it('throws when a session has more than 7 activities (two menu slots are reserved for the back entries)', () => {
      const state = minimalValidState();
      state.modules[0].sessions[0].activities = Array.from({ length: 8 }, (_, i) => ({ id: `aA${i}`, title: `A${i}` }));
      expect(() => ReactStateHelper.loadExistingState(JSON.stringify(state))).toThrow('Session sS1 has 8 activities, but at most 7 are supported (two menu slots are reserved for the back entries)');
    });

    it('throws when a module title contains a colon', () => {
      const state = minimalValidState();
      state.modules[0].title = 'Modul: Einführung';
      expect(() => ReactStateHelper.loadExistingState(JSON.stringify(state))).toThrow('Module mM1 title "Modul: Einführung" must not contain a colon');
    });

    it('throws when a session title contains a colon', () => {
      const state = minimalValidState();
      state.modules[0].sessions[0].title = 'Session: Überblick';
      expect(() => ReactStateHelper.loadExistingState(JSON.stringify(state))).toThrow('Session sS1 title "Session: Überblick" must not contain a colon');
    });

    it('throws when an activity title contains a colon', () => {
      const state = minimalValidState();
      state.modules[0].sessions[0].activities[0].title = 'Aktivität: Detail';
      expect(() => ReactStateHelper.loadExistingState(JSON.stringify(state))).toThrow('Activity aA1 title "Aktivität: Detail" must not contain a colon');
    });
  });
});
