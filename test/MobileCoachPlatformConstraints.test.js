import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { extractWrapperVariables, findUndocumentedVariables, findInvalidDollarSigns } from '../.claude/hooks/check-wrapper-variables.mjs';

// The MobileCoach platform constraints from CLAUDE.md, enforced against the source *text* —
// violating them never breaks a unit test, only the deployed script (usually silently).
const src = readFileSync(fileURLToPath(new URL('../src/ReactStateHelper.js', import.meta.url)), 'utf8');
const doc = readFileSync(fileURLToPath(new URL('../docs/content-editor-guide.md', import.meta.url)), 'utf8');

describe('MobileCoach platform constraints', () => {
  describe('self-containedness (the script is copy-pasted verbatim into MobileCoach)', () => {
    it('contains no ES module syntax', () => {
      expect(src).not.toMatch(/^\s*(import|export)\b/m);
    });

    it('contains no CommonJS require', () => {
      expect(src).not.toMatch(/\brequire\s*\(/);
    });
  });

  describe("paste-time variable validation (MobileCoach scans the raw text for $ signs — code, comments, everything — and rejects the paste unless each one starts a declared variable; verified 2026-07-09: even '$-prefixed' in a comment was rejected)", () => {
    it('every $ in the source starts a variable name documented in the content-editor guide', () => {
      expect(findInvalidDollarSigns(src, doc)).toEqual([]);
    });
  });

  describe('wrapper variables stay in sync with the variable table in docs/content-editor-guide.md', () => {
    it('extraction finds the known wrapper variables (guards the check itself against silently going blind)', () => {
      const names = [...extractWrapperVariables(src)];
      for (const expected of [
        'rsh_json',
        'rsh_cmd',
        'rsh_result',
        'rsh_status',
        'rsh_error',
        'rsh_sessionsCompleted',
        'rsh_menuLabel',
        'rsh_menuId',
        'participantGroup',
      ]) {
        expect(names).toContain(expected);
      }
    });

    it('documents every wrapper variable in the content-editor guide (an undeclared variable fails silently in MobileCoach)', () => {
      expect(findUndocumentedVariables(src, doc)).toEqual([]);
    });
  });
});
