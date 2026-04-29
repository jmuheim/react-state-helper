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
      helper.markTaskCompleted('bouMgt', 'rolCha');
      const restored = ReactStateHelper.loadExistingState(helper.toString());
      expect(restored.isTaskCompleted('bouMgt', 'rolCha')).toBe(true);
    });
  });

  describe('toString', () => {
    it('round-trips state without mutation', () => {
      const json = helper.toString();
      expect(ReactStateHelper.loadExistingState(json).toString()).toBe(json);
    });
  });

  describe('markTaskCompleted', () => {
    it('marks an incomplete task as completed', () => {
      helper.markTaskCompleted('bouMgt', 'rolCha');
      expect(helper.isTaskCompleted('bouMgt', 'rolCha')).toBe(true);
    });

    it('is idempotent when the task is already completed', () => {
      helper.markTaskCompleted('bouMgt', 'rolCha');
      helper.markTaskCompleted('bouMgt', 'rolCha');
      expect(helper.isTaskCompleted('bouMgt', 'rolCha')).toBe(true);
    });
  });

  describe('isTaskCompleted', () => {
    it('returns false for all tasks in the default state', () => {
      expect(helper.isTaskCompleted('bouMgt', 'rolCha')).toBe(false);
      expect(helper.isTaskCompleted('bouMgt', 'sayNo')).toBe(false);
      expect(helper.isTaskCompleted('emoReg', 'breCon')).toBe(false);
    });

    it('returns true after the task is marked completed', () => {
      helper.markTaskCompleted('emoReg', 'breCon');
      expect(helper.isTaskCompleted('emoReg', 'breCon')).toBe(true);
    });
  });

  describe('countCompletedInModule', () => {
    it('returns 0 for all modules in the default state', () => {
      expect(helper.countCompletedInModule('bouMgt')).toBe(0);
      expect(helper.countCompletedInModule('emoReg')).toBe(0);
    });

    it('counts only completed tasks within the given module', () => {
      helper.markTaskCompleted('bouMgt', 'rolCha');
      expect(helper.countCompletedInModule('bouMgt')).toBe(1);
      expect(helper.countCompletedInModule('emoReg')).toBe(0);
    });
  });

  describe('countCompletedOverall', () => {
    it('returns 0 in the default state', () => {
      expect(helper.countCompletedOverall()).toBe(0);
    });

    it('increases as tasks across modules are completed', () => {
      helper.markTaskCompleted('bouMgt', 'rolCha');
      expect(helper.countCompletedOverall()).toBe(1);
      helper.markTaskCompleted('emoReg', 'breCon');
      expect(helper.countCompletedOverall()).toBe(2);
    });
  });

  describe('getProgress', () => {
    it('returns 0 in the default state', () => {
      expect(helper.getProgress()).toBe(0);
    });

    it('returns 1 when all tasks are completed', () => {
      for (const module of ReactStateHelper.initialState().modules)
        for (const task of module.tasks)
          helper.markTaskCompleted(module.id, task.id);
      expect(helper.getProgress()).toBe(1);
    });
  });

  describe('getModuleProgress', () => {
    it('returns 0 for all modules in the default state', () => {
      expect(helper.getModuleProgress('bouMgt')).toBe(0);
      expect(helper.getModuleProgress('emoReg')).toBe(0);
    });

    it('returns the fraction of completed tasks within the module (1 of 5)', () => {
      helper.markTaskCompleted('bouMgt', 'rolCha');
      expect(helper.getModuleProgress('bouMgt')).toBeCloseTo(1 / 5);
    });

    it('does not count tasks from other modules', () => {
      helper.markTaskCompleted('emoReg', 'breCon');
      expect(helper.getModuleProgress('bouMgt')).toBe(0);
    });

    it('returns 1 when all tasks in the module are completed', () => {
      const tasks = ReactStateHelper.initialState().modules.find(m => m.id === 'bouMgt').tasks;
      for (const task of tasks)
        helper.markTaskCompleted('bouMgt', task.id);
      expect(helper.getModuleProgress('bouMgt')).toBe(1);
    });
  });

  describe('isGoodEnough', () => {
    it('returns false when fewer than 3 tasks are completed in the module', () => {
      helper.markTaskCompleted('bouMgt', 'rolCha');
      helper.markTaskCompleted('bouMgt', 'sayNo');
      expect(helper.isGoodEnough('bouMgt')).toBe(false);
    });

    it('returns true when 3 tasks are completed in the module', () => {
      helper.markTaskCompleted('bouMgt', 'rolCha');
      helper.markTaskCompleted('bouMgt', 'sayNo');
      helper.markTaskCompleted('bouMgt', 'limSet');
      expect(helper.isGoodEnough('bouMgt')).toBe(true);
    });

    it('does not count tasks from other modules', () => {
      helper.markTaskCompleted('bouMgt', 'rolCha');
      helper.markTaskCompleted('bouMgt', 'sayNo');
      helper.markTaskCompleted('emoReg', 'breCon');
      expect(helper.isGoodEnough('bouMgt')).toBe(false);
    });
  });

  describe('allCompletedTasksAsCsv', () => {
    it('returns an empty string in the default state', () => {
      expect(helper.allCompletedTasksAsCsv()).toBe('');
    });

    it('returns a single task id when one task is completed', () => {
      helper.markTaskCompleted('bouMgt', 'rolCha');
      expect(helper.allCompletedTasksAsCsv()).toBe('rolCha');
    });

    it('returns comma-separated ids across modules in order', () => {
      helper.markTaskCompleted('bouMgt', 'rolCha');
      helper.markTaskCompleted('bouMgt', 'sayNo');
      helper.markTaskCompleted('emoReg', 'breCon');
      expect(helper.allCompletedTasksAsCsv()).toBe('rolCha,sayNo,breCon');
    });
  });

  describe('enterTask / getParticipantGroup', () => {
    it('returns null before any task has been entered', () => {
      expect(helper.getParticipantGroup()).toBeNull();
    });

    it('returns "moduleId: taskId" after entering a task', () => {
      helper.enterTask('strMgt', 'staTec');
      expect(helper.getParticipantGroup()).toBe('strMgt: staTec');
    });

    it('updates to the most recently entered task', () => {
      helper.enterTask('strMgt', 'staTec');
      helper.enterTask('bouMgt', 'sayNo');
      expect(helper.getParticipantGroup()).toBe('bouMgt: sayNo');
    });

    it('sets entered_first_at on first entry and does not overwrite it', () => {
      helper.enterTask('strMgt', 'staTec');
      const first = JSON.parse(helper.toString()).modules.find(m => m.id === 'strMgt').entered_first_at;
      expect(first).not.toBeNull();
      helper.enterTask('strMgt', 'staTec');
      const second = JSON.parse(helper.toString()).modules.find(m => m.id === 'strMgt').entered_first_at;
      expect(second).toBe(first);
    });

    it('increments times_entered on each entry', () => {
      helper.enterTask('strMgt', 'staTec');
      helper.enterTask('strMgt', 'priSet');
      const mod = JSON.parse(helper.toString()).modules.find(m => m.id === 'strMgt');
      expect(mod.times_entered).toBe(2);
    });

    it('persists through serialization', () => {
      helper.enterTask('strMgt', 'staTec');
      const restored = ReactStateHelper.loadExistingState(helper.toString());
      expect(restored.getParticipantGroup()).toBe('strMgt: staTec');
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
