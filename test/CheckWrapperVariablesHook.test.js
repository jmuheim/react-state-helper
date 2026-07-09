import { describe, it, expect } from 'vitest';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { extractWrapperVariables, findUndocumentedVariables } from '../.claude/hooks/check-wrapper-variables.mjs';

const hookPath = fileURLToPath(new URL('../.claude/hooks/check-wrapper-variables.mjs', import.meta.url));
const realSrcPath = fileURLToPath(new URL('../src/ReactStateHelper.js', import.meta.url));

// Minimal stand-in for src/ReactStateHelper.js: a class part writing a numbered variable series,
// the wrapper guard, $-reads, and the output object.
function fakeSrc({ outputKeys = ['rsh_json', 'participantGroup'] } = {}) {
  const menuLine = "vars['rsh_menuLabel' + (i + 1)] = item.title;";
  return [
    'class Foo {',
    `  bar() { ${menuLine} }`,
    '}',
    "if (typeof process === 'undefined') {",
    "  const rsh_json = '$rsh_json';",
    '  const result = eval(`helper.$rsh_cmd`);',
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
    it('collects $-reads, output object keys, and concatenated numbered series', () => {
      const names = [...extractWrapperVariables(fakeSrc())];
      expect(names).toContain('rsh_json'); // $-read and output key
      expect(names).toContain('rsh_cmd'); // read inside the eval template
      expect(names).toContain('participantGroup'); // output key, written without $ prefix
      expect(names).toContain('rsh_menuLabel'); // numbered series, recorded by base name
    });

    it('throws when the MobileCoach wrapper guard is missing (must not silently check nothing)', () => {
      expect(() => extractWrapperVariables('class Foo {}')).toThrow(/wrapper not found/);
    });
  });

  describe('findUndocumentedVariables', () => {
    it('returns an empty list when the doc table documents every variable', () => {
      const doc = fakeDocTable(['rsh_json', 'rsh_cmd', 'participantGroup', 'rsh_menuLabel1']);
      expect(findUndocumentedVariables(fakeSrc(), doc)).toEqual([]);
    });

    it('matches a numbered series against its doc-table range row via the base name', () => {
      // The table only lists $rsh_menuLabel1 (– $rsh_menuLabel9), not the base name itself
      const doc = fakeDocTable(['rsh_json', 'rsh_cmd', 'participantGroup', 'rsh_menuLabel1']);
      expect(findUndocumentedVariables(fakeSrc(), doc)).not.toContain('rsh_menuLabel');
    });

    it('reports variables missing from the doc table, sorted', () => {
      const src = fakeSrc({ outputKeys: ['rsh_json', 'rsh_zebra', 'rsh_alpha'] });
      const doc = fakeDocTable(['rsh_json', 'rsh_cmd', 'rsh_menuLabel1']);
      expect(findUndocumentedVariables(src, doc)).toEqual(['rsh_alpha', 'rsh_zebra']);
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
