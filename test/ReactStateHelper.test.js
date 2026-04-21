import { describe, it, expect, beforeEach } from 'vitest';

// Default fixture: bouMgt (rolCha, sayNo) + emoReg (breCon) — all incomplete
describe('ReactStateHelper', () => {
  let helper;

  beforeEach(() => {
    helper = ReactStateHelper.fromString('');
  });

  describe('fromString', () => {
    it('initializes default state when given an empty string', () => {
      expect(helper.countCompletedOverall()).toBe(0);
    });

    it('loads persisted state from JSON', () => {
      helper.markTaskCompleted('bouMgt', 'rolCha');
      const restored = ReactStateHelper.fromString(helper.toString());
      expect(restored.isTaskCompleted('bouMgt', 'rolCha')).toBe(true);
    });
  });

  describe('toString', () => {
    it('round-trips state without mutation', () => {
      const json = helper.toString();
      expect(ReactStateHelper.fromString(json).toString()).toBe(json);
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

    it('returns the fraction of completed tasks (1 of 3)', () => {
      helper.markTaskCompleted('bouMgt', 'rolCha');
      expect(helper.getProgress()).toBeCloseTo(1 / 3);
    });

    it('returns 1 when all tasks are completed', () => {
      helper.markTaskCompleted('bouMgt', 'rolCha');
      helper.markTaskCompleted('bouMgt', 'sayNo');
      helper.markTaskCompleted('emoReg', 'breCon');
      expect(helper.getProgress()).toBe(1);
    });
  });

  describe('isGoodEnough', () => {
    it('returns false when fewer than 3 tasks are completed', () => {
      helper.markTaskCompleted('bouMgt', 'rolCha');
      helper.markTaskCompleted('bouMgt', 'sayNo');
      expect(helper.isGoodEnough()).toBe(false);
    });

    it('returns true when all 3 tasks are completed', () => {
      helper.markTaskCompleted('bouMgt', 'rolCha');
      helper.markTaskCompleted('bouMgt', 'sayNo');
      helper.markTaskCompleted('emoReg', 'breCon');
      expect(helper.isGoodEnough()).toBe(true);
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
      const restored = ReactStateHelper.fromString(helper.toString());
      expect(restored.isSuggestionSeen()).toBe(true);
    });

    it('is idempotent — calling again leaves it true', () => {
      helper.markSuggestionSeen();
      helper.markSuggestionSeen();
      expect(helper.isSuggestionSeen()).toBe(true);
    });
  });
});
