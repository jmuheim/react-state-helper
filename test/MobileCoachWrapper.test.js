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
    .replaceAll('$rsh_json', () => json)
    .replaceAll('$rsh_cmd', () => cmd);
  return runInNewContext(interpolated, {});
}

describe('MobileCoach deployment wrapper', () => {
  it('writes scalar command results to rsh_result', () => {
    const o = runWrapper({ cmd: "getModuleProgress('m_bouMgt')" });
    expect(o.rsh_status).toBe('success');
    expect(o.rsh_result).toBe(0);
    expect(o.rsh_error).toBe('none');
  });

  it('writes populated menu labels and ids as top-level keys (only those reach the MobileCoach variables)', () => {
    const o = runWrapper({ cmd: 'populateMenuForModule()' });
    expect(o.rsh_status).toBe('success');
    expect(o.rsh_menuLabel1).toBe('👉 Boundary Management');
    expect(o.rsh_menuId1).toBe('m_bouMgt');
    expect(o.rsh_menuId2).toBe('m_emoReg');
    for (let i = 1; i <= 9; i++) {
      expect(o).toHaveProperty(`rsh_menuLabel${i}`);
      expect(o).toHaveProperty(`rsh_menuId${i}`);
    }
  });

  it('writes "" to rsh_result when the command returns nothing (no stale result)', () => {
    const o = runWrapper({ cmd: "enterModule('m_bouMgt')" });
    expect(o.rsh_status).toBe('success');
    expect(o.rsh_result).toBe('');
  });

  it('writes all 9 menu label and id slots as "" on runs that do not populate a menu (no stale entries)', () => {
    const o = runWrapper({ cmd: "getModuleProgress('m_bouMgt')" });
    expect(o.rsh_status).toBe('success');
    for (let i = 1; i <= 9; i++) {
      expect(o[`rsh_menuLabel${i}`]).toBe('');
      expect(o[`rsh_menuId${i}`]).toBe('');
    }
  });

  it('round-trips state through rsh_json between runs', () => {
    const first = runWrapper({ cmd: "enterModule('m_bouMgt')" });
    expect(first.rsh_status).toBe('success');
    const second = runWrapper({ cmd: 'populateMenuForSession()', json: first.rsh_json });
    expect(second.rsh_status).toBe('success');
    expect(second.rsh_menuId1).toBe('s_bouIntro');
  });

  it('reports command errors via rsh_status/-Error instead of crashing', () => {
    const o = runWrapper({ cmd: 'populateMenuForSession()' }); // no module entered yet
    expect(o.rsh_status).toBe('error');
    expect(o.rsh_error).toMatch(/No module entered/);
  });
});
