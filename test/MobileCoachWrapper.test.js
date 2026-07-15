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
  it('writes value-returning command results to rsh_result', () => {
    const o = runWrapper({ cmd: 'getCompletionOverview()' });
    expect(o.rsh_status).toBe('success');
    expect(o.rsh_result).toContain('🗂️mBouMgt');
    expect(o.rsh_error).toBe('none');
  });

  it('writes populated menu labels and ids as top-level keys (only those reach the MobileCoach variables)', () => {
    const o = runWrapper({ cmd: 'populateMenuWithModules()' });
    expect(o.rsh_status).toBe('success');
    expect(o.rsh_menuLabel1).toBe('🗂️ Boundary Management 👈');
    expect(o.rsh_menuId1).toBe('mBouMgt');
    expect(o.rsh_menuId2).toBe('mEmoReg');
    for (let i = 1; i <= 9; i++) {
      expect(o).toHaveProperty(`rsh_menuLabel${i}`);
      expect(o).toHaveProperty(`rsh_menuId${i}`);
    }
  });

  it('writes "" to rsh_result when the command returns nothing (no stale result)', () => {
    const o = runWrapper({ cmd: "enter('mBouMgt')" });
    expect(o.rsh_status).toBe('success');
    expect(o.rsh_result).toBe('');
  });

  it('writes all 9 menu label and id slots as "" on runs that do not populate a menu (no stale entries)', () => {
    const o = runWrapper({ cmd: 'getCompletionOverview()' });
    expect(o.rsh_status).toBe('success');
    for (let i = 1; i <= 9; i++) {
      expect(o[`rsh_menuLabel${i}`]).toBe('');
      expect(o[`rsh_menuId${i}`]).toBe('');
    }
  });

  it('round-trips state through rsh_json between runs', () => {
    const first = runWrapper({ cmd: "enter('mBouMgt')" });
    expect(first.rsh_status).toBe('success');
    const second = runWrapper({ cmd: 'populateMenuWithSessions()', json: first.rsh_json });
    expect(second.rsh_status).toBe('success');
    expect(second.rsh_menuId1).toBe('sBouIntro');
  });

  it('writes the progress advice to rsh_progressAdvice once a module is entered', () => {
    const o = runWrapper({ cmd: "enter('mBouMgt')" });
    expect(o.rsh_status).toBe('success');
    expect(o.rsh_progressAdvice).toContain('Boundary Management');
  });

  it('writes "" to rsh_progressAdvice while no module is entered (advice would throw)', () => {
    const o = runWrapper({ cmd: 'getCompletionOverview()' });
    expect(o.rsh_status).toBe('success');
    expect(o.rsh_progressAdvice).toBe('');
  });

  it('writes location and completion overview to participantGroup once a module is entered', () => {
    const o = runWrapper({ cmd: "enter('mBouMgt')" });
    expect(o.rsh_status).toBe('success');
    expect(o.participantGroup).toBe('Participant location: 🗂️mBouMgt | Completion overview: 🗂️mBouMgt[📑sBouIntro 📑sGesGre(🎯aRolGes 🎯aAbgKon) 📑sPaus(🎯aMikPau)] 🗂️mEmoReg[📑sEmoIntro 📑sAkzep(🎯aAkzep) 📑sNeuBew(🎯aNeuBew) 📑sUmgEmo(🎯aEmoSit) 📑sUmgSup(🎯aUmgSup)]');
  });

  it('extends the participantGroup location while navigating deeper and rolls completed activities up into session and module marks', () => {
    let run = runWrapper({ cmd: "enter('mBouMgt')" });
    for (const cmd of [
      "enter('sBouIntro')", // an intro session has no activities, so it completes on enter
      "enter('sGesGre')", "enter('aRolGes')", 'completeActivity()',
      "enter('aAbgKon')", 'completeActivity()', // last activity of sGesGre → session completes
      "enter('sPaus')", "enter('aMikPau')", 'completeActivity()', // last session of mBouMgt → module completes
      "enter('mEmoReg')", "enter('sAkzep')", "enter('aAkzep')", 'completeActivity()', // sAkzep completes, mEmoReg stays uncompleted
    ]) {
      run = runWrapper({ cmd, json: run.rsh_json });
      expect(run.rsh_status).toBe('success');
    }
    expect(run.participantGroup).toBe('Participant location: 🗂️mEmoReg: 📑sAkzep: 🎯aAkzep | Completion overview: 🗂️mBouMgt✅[📑sBouIntro✅ 📑sGesGre✅(🎯aRolGes✅ 🎯aAbgKon✅) 📑sPaus✅(🎯aMikPau✅)] 🗂️mEmoReg[📑sEmoIntro 📑sAkzep✅(🎯aAkzep✅) 📑sNeuBew(🎯aNeuBew) 📑sUmgEmo(🎯aEmoSit) 📑sUmgSup(🎯aUmgSup)]');
  });

  it('writes the completion overview alone to participantGroup while no module is entered (there is no location yet)', () => {
    const o = runWrapper({ cmd: 'getCompletionOverview()' });
    expect(o.rsh_status).toBe('success');
    expect(o.participantGroup).toBe('Completion overview: 🗂️mBouMgt[📑sBouIntro 📑sGesGre(🎯aRolGes 🎯aAbgKon) 📑sPaus(🎯aMikPau)] 🗂️mEmoReg[📑sEmoIntro 📑sAkzep(🎯aAkzep) 📑sNeuBew(🎯aNeuBew) 📑sUmgEmo(🎯aEmoSit) 📑sUmgSup(🎯aUmgSup)]');
  });

  it('writes "" to all three times-entered variables while nothing is entered', () => {
    const o = runWrapper({ cmd: 'getCompletionOverview()' });
    expect(o.rsh_status).toBe('success');
    expect(o.rsh_moduleTimesEntered).toBe('');
    expect(o.rsh_sessionTimesEntered).toBe('');
    expect(o.rsh_activityTimesEntered).toBe('');
  });

  it('writes the current items\' times-entered counts and "" for levels cleared by re-entering the module', () => {
    let run = runWrapper({ cmd: "enter('mBouMgt')" });
    expect(run.rsh_moduleTimesEntered).toBe(1);
    expect(run.rsh_sessionTimesEntered).toBe('');
    for (const cmd of ["enter('sGesGre')", "enter('aRolGes')", "enter('aRolGes')"]) {
      run = runWrapper({ cmd, json: run.rsh_json });
      expect(run.rsh_status).toBe('success');
    }
    expect(run.rsh_moduleTimesEntered).toBe(1);
    expect(run.rsh_sessionTimesEntered).toBe(1);
    expect(run.rsh_activityTimesEntered).toBe(2); // aRolGes was entered twice
    run = runWrapper({ cmd: "enter('mBouMgt')", json: run.rsh_json });
    expect(run.rsh_moduleTimesEntered).toBe(2);
    expect(run.rsh_sessionTimesEntered).toBe(''); // re-entering the module cleared session and activity
    expect(run.rsh_activityTimesEntered).toBe('');
  });

  it('writes "" to all three completed variables while nothing is entered', () => {
    const o = runWrapper({ cmd: 'getCompletionOverview()' });
    expect(o.rsh_status).toBe('success');
    expect(o.rsh_moduleCompleted).toBe('');
    expect(o.rsh_sessionCompleted).toBe('');
    expect(o.rsh_activityCompleted).toBe('');
  });

  it('writes the current items\' completed flags as the strings "true"/"false" (MobileCoach rules compare text) and "" for levels cleared by re-entering the module', () => {
    let run = runWrapper({ cmd: "enter('mBouMgt')" });
    expect(run.rsh_moduleCompleted).toBe('false');
    expect(run.rsh_sessionCompleted).toBe('');
    for (const cmd of ["enter('sGesGre')", "enter('aRolGes')", 'completeActivity()']) {
      run = runWrapper({ cmd, json: run.rsh_json });
      expect(run.rsh_status).toBe('success');
    }
    expect(run.rsh_moduleCompleted).toBe('false');
    expect(run.rsh_sessionCompleted).toBe('false'); // aAbgKon still open
    expect(run.rsh_activityCompleted).toBe('true'); // aRolGes was just completed
    run = runWrapper({ cmd: "enter('mBouMgt')", json: run.rsh_json });
    expect(run.rsh_sessionCompleted).toBe(''); // re-entering the module cleared session and activity
    expect(run.rsh_activityCompleted).toBe('');
  });

  it('reports command errors via rsh_status/-Error instead of crashing', () => {
    const o = runWrapper({ cmd: 'populateMenuWithSessions()' }); // no module entered yet
    expect(o.rsh_status).toBe('error');
    expect(o.rsh_error).toMatch(/No module entered/);
  });
});
