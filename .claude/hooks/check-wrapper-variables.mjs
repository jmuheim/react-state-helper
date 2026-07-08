// Extracts every MobileCoach $variable the deployment wrapper in src/ReactStateHelper.js reads
// or writes, and reports the ones missing from README.md's variable table. A variable that is
// used by the script but not declared in MobileCoach makes the whole script fail silently (see
// CLAUDE.md "Variables"), so a new one must never slip in undocumented.
//
// Used from two places, sharing one extraction so they can't drift apart:
// - test/MobileCoachPlatformConstraints.test.js fails `npm test` on any undocumented variable
// - the CLI below runs as a PostToolUse hook (.claude/settings.json) and reminds at edit time,
//   including the MobileCoach-side declaration step that no test can verify

import { readFileSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';

const WRAPPER_GUARD = "typeof process === 'undefined'";

export function extractWrapperVariables(srcText) {
  const guardIndex = srcText.indexOf(WRAPPER_GUARD);
  if (guardIndex === -1) throw new Error(`MobileCoach wrapper not found (expected \`${WRAPPER_GUARD}\` in the source)`);
  const wrapper = srcText.slice(guardIndex);

  const names = new Set();

  // $-prefixed reads, e.g. '$jsStateHelperJson' or $jsStateHelperCmd inside the eval template
  for (const [, name] of wrapper.matchAll(/\$([a-zA-Z][a-zA-Z0-9]*)/g)) names.add(name);

  // Keys of the output object `let o = {...}` — written back without the $ prefix
  const outputStart = wrapper.indexOf('let o = {');
  if (outputStart === -1) throw new Error('MobileCoach wrapper output object (`let o = {`) not found');
  const outputBlock = wrapper.slice(outputStart, wrapper.indexOf('};', outputStart));
  for (const [, name] of outputBlock.matchAll(/^\s*([a-zA-Z][a-zA-Z0-9]*):/gm)) names.add(name);

  // Numbered series written via template literals outside the wrapper, e.g.
  // vars[`jsStateHelperMenuLabel${i + 1}`] — recorded under their base name, which the README
  // range row ("$jsStateHelperMenuLabel1 – $jsStateHelperMenuLabel9") matches as a substring.
  for (const [, name] of srcText.matchAll(/`(jsStateHelper[a-zA-Z0-9]*)\$\{/g)) names.add(name);

  return names;
}

export function findUndocumentedVariables(srcText, readmeText) {
  return [...extractWrapperVariables(srcText)]
    .filter(name => !readmeText.includes(`$${name}`))
    .sort();
}

// PostToolUse hook entry point: reads the hook event JSON from stdin and only reacts to edits of
// src/ReactStateHelper.js. Exit 2 feeds stderr back to Claude; exit 0 stays silent.
function main() {
  let event;
  try {
    event = JSON.parse(readFileSync(0, 'utf8'));
  } catch {
    return 0; // not a hook invocation we understand — stay out of the way
  }
  const editedFile = event?.tool_input?.file_path;
  if (!editedFile || !editedFile.endsWith('src/ReactStateHelper.js')) return 0;

  const root = new URL('../../', import.meta.url);
  const src = readFileSync(fileURLToPath(new URL('src/ReactStateHelper.js', root)), 'utf8');
  const readme = readFileSync(fileURLToPath(new URL('README.md', root)), 'utf8');
  const missing = findUndocumentedVariables(src, readme);
  if (missing.length === 0) return 0;

  console.error(
    `Wrapper variable(s) not documented in README's variable table: ${missing.map(n => `$${n}`).join(', ')}.\n` +
    '1. Add them to the table in README.md ("MobileCoach deployment").\n' +
    '2. Declare them in the MobileCoach project (default value 0, access "manageable by service") ' +
    'before deploying — an undeclared variable makes the script fail silently.'
  );
  return 2;
}

// Run the CLI only when executed directly, not when imported by tests.
if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) {
  try {
    process.exit(main());
  } catch (e) {
    console.error(`check-wrapper-variables hook failed: ${e.message}`);
    process.exit(2);
  }
}
