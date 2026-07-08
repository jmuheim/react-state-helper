---
description: Push local master commits directly to origin by temporarily bypassing the protect-master ruleset, then restore protection
---

Push the local master commits directly to origin, temporarily bypassing the branch protection: $ARGUMENTS

The `protect-master` ruleset requires a pull request and a passing "test" status check. This command exists for small changes (typo/doc fixes) where a PR is overhead. Because the push skips CI, the local test run below is mandatory.

1. Preconditions — abort with an explanation if any fails:
   - Current branch is `master` (`git branch --show-current`).
   - There is at least one commit to push and no divergence: `git fetch origin && git status` must show "ahead of 'origin/master'", not "diverged".
   - Everything intended for the push is committed. Unrelated uncommitted changes are fine — they stay behind — but confirm nothing staged is half-done.
2. Run `npm test`. If it fails, stop and report — do not push.
3. Look up the ruleset id: `gh api repos/{owner}/{repo}/rulesets --jq '.[] | select(.name=="protect-master") | .id'`. If the ruleset has no `pull_request` rule anymore, just `git push` normally and skip the bypass steps.
4. Enable the bypass for repository admins:
   ```
   gh api -X PUT repos/{owner}/{repo}/rulesets/<id> --input - <<'EOF'
   {"bypass_actors":[{"actor_id":5,"actor_type":"RepositoryRole","bypass_mode":"always"}]}
   EOF
   ```
5. `git push` — expect a `remote: Bypassed rule violations` notice.
6. **Always** revert the bypass, even if the push failed:
   ```
   gh api -X PUT repos/{owner}/{repo}/rulesets/<id> --input - <<'EOF'
   {"bypass_actors":[]}
   EOF
   ```
   Then verify: the ruleset's `bypass_actors` must be empty. If the revert call fails, retry it and do not report success until protection is confirmed restored.
7. Report: pushed commit range, test result, and confirmation that the bypass was removed.
