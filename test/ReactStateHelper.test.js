import { describe, it, expect, beforeEach } from 'vitest';
import { ReactStateHelper } from '../src/ReactStateHelper.js';

const makeState = (overrides = {}) => JSON.stringify({
  modules: {
    intro: {
      tasks: {
        read:  { completed: true },
        quiz:  { completed: false },
      },
    },
    chapter1: {
      tasks: {
        video:      { completed: true },
        exercise:   { completed: true },
        reflection: { completed: false },
      },
    },
  },
  suggestionSeen: false,
  ...overrides,
});

describe('ReactStateHelper', () => {
  let helper;

  beforeEach(() => {
    helper = ReactStateHelper.fromString(makeState());
  });

  describe('fromString / toString', () => {
    it('round-trips state without mutation', () => {
      const json = makeState();
      expect(ReactStateHelper.fromString(json).toString()).toBe(json);
    });
  });

  describe('markTaskCompleted', () => {
    it('marks an incomplete task as completed', () => {
      helper.markTaskCompleted('intro', 'quiz');
      expect(helper.isTaskCompleted('intro', 'quiz')).toBe(true);
    });

    it('is a no-op when the task is already completed', () => {
      helper.markTaskCompleted('intro', 'read');
      expect(helper.isTaskCompleted('intro', 'read')).toBe(true);
    });
  });

  describe('isTaskCompleted', () => {
    it('returns true for a completed task', () => {
      expect(helper.isTaskCompleted('intro', 'read')).toBe(true);
    });

    it('returns false for an incomplete task', () => {
      expect(helper.isTaskCompleted('intro', 'quiz')).toBe(false);
    });
  });

  describe('countCompletedInModule', () => {
    it('counts completed tasks in a given module', () => {
      expect(helper.countCompletedInModule('intro')).toBe(1);
      expect(helper.countCompletedInModule('chapter1')).toBe(2);
    });

    it('returns 0 when no tasks are completed', () => {
      const h = ReactStateHelper.fromString(JSON.stringify({
        modules: { empty: { tasks: { a: { completed: false } } } },
        suggestionSeen: false,
      }));
      expect(h.countCompletedInModule('empty')).toBe(0);
    });
  });

  describe('countCompletedOverall', () => {
    it('sums completed tasks across all modules', () => {
      // intro: 1, chapter1: 2 → total 3
      expect(helper.countCompletedOverall()).toBe(3);
    });

    it('increases after marking a task completed', () => {
      helper.markTaskCompleted('intro', 'quiz');
      expect(helper.countCompletedOverall()).toBe(4);
    });
  });

  describe('getProgress', () => {
    it('returns the fraction of completed tasks (0–1)', () => {
      // 3 completed out of 5 total
      expect(helper.getProgress()).toBeCloseTo(0.6);
    });

    it('returns 0 when no tasks exist', () => {
      const h = ReactStateHelper.fromString(JSON.stringify({
        modules: {},
        suggestionSeen: false,
      }));
      expect(h.getProgress()).toBe(0);
    });

    it('returns 1 when all tasks are completed', () => {
      helper.markTaskCompleted('intro', 'quiz');
      helper.markTaskCompleted('chapter1', 'reflection');
      expect(helper.getProgress()).toBe(1);
    });
  });

  describe('isGoodEnough', () => {
    it('returns true when >= 3 tasks are completed', () => {
      expect(helper.isGoodEnough()).toBe(true);
    });

    it('returns false when fewer than 3 tasks are completed', () => {
      const h = ReactStateHelper.fromString(JSON.stringify({
        modules: {
          m: { tasks: { a: { completed: true }, b: { completed: false } } },
        },
        suggestionSeen: false,
      }));
      expect(h.isGoodEnough()).toBe(false);
    });

    it('is exactly true at the boundary of 3', () => {
      const h = ReactStateHelper.fromString(JSON.stringify({
        modules: {
          m: {
            tasks: {
              a: { completed: true },
              b: { completed: true },
              c: { completed: true },
            },
          },
        },
        suggestionSeen: false,
      }));
      expect(h.isGoodEnough()).toBe(true);
    });
  });

  describe('markSuggestionSeen / isSuggestionSeen', () => {
    it('is false initially', () => {
      expect(helper.isSuggestionSeen()).toBe(false);
    });

    it('becomes true after markSuggestionSeen', () => {
      helper.markSuggestionSeen();
      expect(helper.isSuggestionSeen()).toBe(true);
    });

    it('persists the flag through serialization', () => {
      helper.markSuggestionSeen();
      const restored = ReactStateHelper.fromString(helper.toString());
      expect(restored.isSuggestionSeen()).toBe(true);
    });

    it('can only be set once — calling again leaves it true', () => {
      helper.markSuggestionSeen();
      helper.markSuggestionSeen();
      expect(helper.isSuggestionSeen()).toBe(true);
    });

    it('does not set flag if already true in loaded state', () => {
      const h = ReactStateHelper.fromString(makeState({ suggestionSeen: true }));
      h.markSuggestionSeen();
      expect(h.isSuggestionSeen()).toBe(true);
    });
  });
});
