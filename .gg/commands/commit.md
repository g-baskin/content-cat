---
name: commit
description: Run checks, agent code review, commit with AI message, and push
---

1. Run quality checks:
   pnpm lint:fix
   pnpm typecheck
   Fix ALL errors before continuing.

2. Review changes: `git status`, `git diff --staged`, `git diff`

3. Fast review gate: spawn ONE subagent with the full diff. Review ONLY for real bugs,
   regressions, leftover debug code, and unintended changes. Score each issue 0-100
   confidence (pre-existing/nitpicks = false positives). Report ONLY issues >= 80
   confidence with file:line and a one-line fix. If none, reply "CLEAR".

4. If CLEAR: go to step 5, push WITHOUT asking anything.
   If issues reported: STOP, show them, ask:
   "A) Fix it first, then commit & push  B) Commit & push anyway"
   On A: fix, re-run step 1, continue (no re-review). On B: continue as-is.

5. Stage relevant files with `git add` (specific files, not -A)

6. Generate commit message: start with verb (Add/Update/Fix/Remove/Refactor), one line.

7. Commit and push — never pause:
   git commit -m "your generated message"
   git push
