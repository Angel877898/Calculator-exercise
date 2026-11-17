# 4. Git, GitHub and final review

```
## Context
The project is complete locally. Now publish it with a clean history and review it.

## Requirements
Git history:
- Start with an initial commit on main (.gitignore + minimal README)
- One branch per logical piece of work, for example:
  feat/backend-calculator, feat/backend-api, chore/frontend-setup,
  feat/frontend-calculator, chore/docker-ci, docs/readme
- Inside each branch, small focused commits following Conventional Commits
  (feat, fix, test, docs, chore, ci, style), with tests in their own commits
- Merge each branch into main with --no-ff

GitHub:
- Create a public repository named "Calculator-exercise"
- Push main and every branch
- Check that the CI workflow passes

Final review:
- Compare the project against the original requirements (functional, non-functional, deliverables)
- List anything missing, weak or inconsistent, ordered by importance
- Do not change anything; I'll decide what to fix

## Verification
Show me `git log --oneline --graph`, the repository URL and the CI result.
```
