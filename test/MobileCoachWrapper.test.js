import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { runInNewContext } from 'node:vm';

// Runs the deployment wrapper the way MobileCoach does: $variables are interpolated *textually*
// into the script, the script executes as a plain script in an environment without Node's
// `process` global, and its completion value (the trailing `o`) is the object whose keys
// MobileCoach writes back as individual variables — one key, one variable, nothing nested —
// which is exactly what these tests guard.
const src = readFileSync(fileURLToPath(new URL('../src/ReactStateHelper.js', import.meta.url)), 'utf8');

function runWrapper({ cmd, json = '0' }) {
  const interpolated = src
    .replaceAll('$jsStateHelperJson', () => json)
    .replaceAll('$jsStateHelperCmd', () => cmd);
  return runInNewContext(interpolated, {});
}

describe('MobileCoach deployment wrapper', () => {
  it('writes scalar command results to jsStateHelperResult', () => {
    const o = runWrapper({ cmd: "getModuleProgress('m_bouMgt')" });
    expect(o.jsStateHelperStatus).toBe('success');
    expect(o.jsStateHelperResult).toBe(0);
    expect(o.jsStateHelperError).toBe('none');
  });

  it('writes populated menu labels and ids as top-level keys (only those reach the MobileCoach variables)', () => {
    const o = runWrapper({ cmd: 'populateMenuForModule()' });
    expect(o.jsStateHelperStatus).toBe('success');
    expect(o.jsStateHelperMenuLabel1).toBe('👉 Boundary Management');
    expect(o.jsStateHelperMenuId1).toBe('m_bouMgt');
    expect(o.jsStateHelperMenuId2).toBe('m_emoReg');
    for (let i = 1; i <= 9; i++) {
      expect(o).toHaveProperty(`jsStateHelperMenuLabel${i}`);
      expect(o).toHaveProperty(`jsStateHelperMenuId${i}`);
    }
  });

  it('writes "" to jsStateHelperResult when the command returns nothing (no stale result)', () => {
    const o = runWrapper({ cmd: "enterModule('m_bouMgt')" });
    expect(o.jsStateHelperStatus).toBe('success');
    expect(o.jsStateHelperResult).toBe('');
  });

  it('writes all 9 menu label and id slots as "" on runs that do not populate a menu (no stale entries)', () => {
    const o = runWrapper({ cmd: "getModuleProgress('m_bouMgt')" });
    expect(o.jsStateHelperStatus).toBe('success');
    for (let i = 1; i <= 9; i++) {
      expect(o[`jsStateHelperMenuLabel${i}`]).toBe('');
      expect(o[`jsStateHelperMenuId${i}`]).toBe('');
    }
  });

  it('round-trips state through jsStateHelperJson between runs', () => {
    const first = runWrapper({ cmd: "enterModule('m_bouMgt')" });
    expect(first.jsStateHelperStatus).toBe('success');
    const second = runWrapper({ cmd: 'populateMenuForSession()', json: first.jsStateHelperJson });
    expect(second.jsStateHelperStatus).toBe('success');
    expect(second.jsStateHelperMenuId1).toBe('s_bouIntro');
  });

  it('reports command errors via jsStateHelperStatus/-Error instead of crashing', () => {
    const o = runWrapper({ cmd: 'populateMenuForSession()' }); // no module entered yet
    expect(o.jsStateHelperStatus).toBe('error');
    expect(o.jsStateHelperError).toMatch(/No module entered/);
  });
});
