// Two paste-safety checks for src/ReactStateHelper.js:
// 1. Extracts every MobileCoach $variable the deployment wrapper reads or writes, and reports the
//    ones missing from the variable table in docs/content-editor-guide.md. A variable that is used
//    by the script but not declared in MobileCoach makes the whole script fail silently (see
//    "Variables" in docs/developer-guide.md), so a new one must never slip in undocumented.
// 2. Reports every `$` in the source that doesn't start a documented variable name. MobileCoach's
//    paste-time validator scans the raw text — comments included — and rejects the whole paste on
//    any such `$` (e.g. `${…}` interpolation or "$-prefixed" in a comment; decision #27).
//
// Used from two places, sharing one implementation so they can't drift apart:
// - test/MobileCoachPlatformConstraints.test.js fails `npm test` on any violation
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

  // $-prefixed reads, e.g. '$rsh_json' or $rsh_cmd inside the eval template
  for (const [, name] of wrapper.matchAll(/\$([a-zA-Z][a-zA-Z0-9_]*)/g)) names.add(name);

  // Keys of the output object `let o = {...}` — written back without the $ prefix
  const outputStart = wrapper.indexOf('let o = {');
  if (outputStart === -1) throw new Error('MobileCoach wrapper output object (`let o = {`) not found');
  const outputBlock = wrapper.slice(outputStart, wrapper.indexOf('};', outputStart));
  for (const [, name] of outputBlock.matchAll(/^\s*([a-zA-Z][a-zA-Z0-9_]*):/gm)) names.add(name);

  // Numbered series written via string concatenation, e.g. o['rsh_menuLabel' + i] — recorded
  // under their base name, which the table's range row ("$rsh_menuLabel1 – $rsh_menuLabel9")
  // matches as a substring. (Template literals are banned in the source: MobileCoach's paste-time
  // validator scans the raw text for $ signs, and `${` would trip it.)
  for (const [, name] of srcText.matchAll(/'(rsh_[a-zA-Z0-9_]*)'\s*\+/g)) names.add(name);

  return names;
}

export function findUndocumentedVariables(srcText, docText) {
  return [...extractWrapperVariables(srcText)]
    .filter(name => !docText.includes(`$${name}`))
    .sort();
}

// Walks every `$` in the source and describes the ones MobileCoach's paste validator would reject:
// a `$` not followed by a variable name at all (`${…}`, `$-…`), or one naming a variable that is
// not in the content-editor guide's table (and thus not declared in MobileCoach).
export function findInvalidDollarSigns(srcText, docText) {
  const problems = [];
  for (let i = srcText.indexOf('$'); i !== -1; i = srcText.indexOf('$', i + 1)) {
    const token = srcText.slice(i).match(/^\$[a-zA-Z][a-zA-Z0-9_]*/);
    const context = JSON.stringify(srcText.slice(Math.max(0, i - 30), i + 30));
    if (!token) problems.push(`$ not followed by a variable name near ${context}`);
    else if (!docText.includes(token[0])) problems.push(`undocumented variable ${token[0]} near ${context}`);
  }
  return problems;
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
  const doc = readFileSync(fileURLToPath(new URL('docs/content-editor-guide.md', root)), 'utf8');
  const messages = [];

  const missing = findUndocumentedVariables(src, doc);
  if (missing.length > 0) {
    messages.push(
      `Wrapper variable(s) not documented in the variable table in docs/content-editor-guide.md: ${missing.map(n => `$${n}`).join(', ')}.\n` +
      '1. Add them to the table in docs/content-editor-guide.md ("One-time MobileCoach setup").\n' +
      '2. Declare them in the MobileCoach project (default value 0, access "manageable by service") ' +
      'before deploying — an undeclared variable makes the script fail silently.'
    );
  }

  const invalidDollars = findInvalidDollarSigns(src, doc);
  if (invalidDollars.length > 0) {
    messages.push(
      "Invalid $ sign(s) in src/ReactStateHelper.js — MobileCoach's paste-time validator rejects the " +
      'whole script when any $ (comments included) does not start a declared variable name (decision #27). ' +
      'Use string concatenation instead of `${…}`, and write variable series in comments without the $ ' +
      '(rsh_menuLabelN):\n- ' + invalidDollars.join('\n- ')
    );
  }

  if (messages.length === 0) return 0;
  console.error(messages.join('\n\n'));
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
