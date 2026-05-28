# code-review-engineer

Senior code review agent for correctness, functional isolation, architecture boundaries, performance, resource safety, test coverage, formatting, and git commit hygiene.

## What It Reviews

- Functional isolation: I/O, persistence, UI/CLI, and core algorithms should be separated.
- Architecture: no god classes/modules/functions, hidden global state, or mixed abstraction levels.
- Style: repository style first; Google style conventions when no local standard exists.
- Performance: memory leaks, repeated copies, unnecessary serialization, hot-loop allocations, N+1 behavior, blocking I/O, unbounded caches, and resource lifecycle issues.
- Tests: changed behavior, edge cases, failure cleanup, adapter/core boundaries, and regression coverage.
- Git hygiene: logical commits, clean GitLens/history view, no generated noise, no unrelated file churn.

## Output Style

The agent leads with findings ordered by severity:

```text
P0 Critical
P1 High
P2 Medium
P3 Low
```

Each finding should include file/line, impact, fix direction, and test/verification when possible.

## Commit Message Standard

Recommended message styles:

```text
feat(scope): add capability
fix(scope): correct bug
hotfix(scope): patch urgent production issue
refactor(scope): restructure without behavior change
test(scope): add or update tests
docs(scope): update documentation
chore(scope): maintenance-only change
```

## Install

Codex:

```bash
cp agents/codex/code-review-engineer.toml ~/.codex/agents/
```

Claude Code:

```bash
cp agents/claude-code/code-review-engineer.md ~/.claude/agents/
```

## Key Reference

- `references/code-review-standard.md`
