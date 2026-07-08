import { describe, it, expect } from 'vitest';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { extractWrapperVariables, findUndocumentedVariables } from '../.claude/hooks/check-wrapper-variables.mjs';

const hookPath = fileURLToPath(new URL('../.claude/hooks/check-wrapper-variables.mjs', import.meta.url));
const realSrcPath = fileURLToPath(new URL('../src/ReactStateHelper.js', import.meta.url));

// Minimal stand-in for src/ReactStateHelper.js: a class part writing a numbered variable series,
// the wrapper guard, $-reads, and the output object.
function fakeSrc({ outputKeys = ['jsStateHelperJson', 'participantGroup'] } = {}) {
  const menuLine = 'vars[`jsStateHelperMenuLabel${i + 1}`] = item.title;';
  return [
    'class Foo {',
    `  bar() { ${menuLine} }`,
    '}',
    "if (typeof process === 'undefined') {",
    "  const jsStateHelperJson = '$jsStateHelperJson';",
    '  const result = eval(`helper.$jsStateHelperCmd`);',
    '  let o = {',
    ...outputKeys.map(k => `    ${k}: 1,`),
    '  };',
    '  o',
    '}',
  ].join('\n');
}

function fakeDocTable(names) {
  return names.map(n => `| \`$${n}\` | some purpose |`).join('\n');
}

describe('check-wrapper-variables hook', () => {
  describe('extractWrapperVariables', () => {
    it('collects $-reads, output object keys, and template-literal series', () => {
      const names = [...extractWrapperVariables(fakeSrc())];
      expect(names).toContain('jsStateHelperJson'); // $-read and output key
      expect(names).toContain('jsStateHelperCmd'); // read inside the eval template
      expect(names).toContain('participantGroup'); // output key, written without $ prefix
      expect(names).toContain('jsStateHelperMenuLabel'); // numbered series, recorded by base name
    });

    it('throws when the MobileCoach wrapper guard is missing (must not silently check nothing)', () => {
      expect(() => extractWrapperVariables('class Foo {}')).toThrow(/wrapper not found/);
    });
  });

  describe('findUndocumentedVariables', () => {
    it('returns an empty list when the doc table documents every variable', () => {
      const doc = fakeDocTable(['jsStateHelperJson', 'jsStateHelperCmd', 'participantGroup', 'jsStateHelperMenuLabel1']);
      expect(findUndocumentedVariables(fakeSrc(), doc)).toEqual([]);
    });

    it('matches a numbered series against its doc-table range row via the base name', () => {
      // The table only lists $jsStateHelperMenuLabel1 (– $jsStateHelperMenuLabel9), not the base name itself
      const doc = fakeDocTable(['jsStateHelperJson', 'jsStateHelperCmd', 'participantGroup', 'jsStateHelperMenuLabel1']);
      expect(findUndocumentedVariables(fakeSrc(), doc)).not.toContain('jsStateHelperMenuLabel');
    });

    it('reports variables missing from the doc table, sorted', () => {
      const src = fakeSrc({ outputKeys: ['jsStateHelperJson', 'jsStateHelperZebra', 'jsStateHelperAlpha'] });
      const doc = fakeDocTable(['jsStateHelperJson', 'jsStateHelperCmd', 'jsStateHelperMenuLabel1']);
      expect(findUndocumentedVariables(src, doc)).toEqual(['jsStateHelperAlpha', 'jsStateHelperZebra']);
    });
  });

  describe('CLI (PostToolUse hook)', () => {
    function runHook(stdin) {
      return spawnSync(process.execPath, [hookPath], { input: stdin, encoding: 'utf8' });
    }

    it('ignores edits to other files', () => {
      const result = runHook(JSON.stringify({ tool_input: { file_path: '/tmp/other.js' } }));
      expect(result.status).toBe(0);
      expect(result.stderr).toBe('');
    });

    it('ignores malformed input', () => {
      const result = runHook('not json');
      expect(result.status).toBe(0);
    });

    it('passes on the real source and content-editor guide (repo currently has no undocumented variable)', () => {
      const result = runHook(JSON.stringify({ tool_input: { file_path: realSrcPath } }));
      expect(result.stderr).toBe('');
      expect(result.status).toBe(0);
    });
  });
});
