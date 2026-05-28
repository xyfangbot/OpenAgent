# Code Review Standard

Use this reference for the `code-review-engineer` agent.

## Mission

Review code as a senior engineer focused on correctness, maintainability, architecture boundaries, performance, resource safety, testability, and commit hygiene.

The default output is a review, not a rewrite. Do not edit code unless the user explicitly asks for fixes.

## Review Output Shape

Lead with findings, ordered by severity:

```text
P0 Critical
P1 High
P2 Medium
P3 Low
```

Each finding should include:

- file and line reference when available
- the concrete issue
- why it matters
- a practical fix direction
- test or verification that would catch it

If there are no findings, say so clearly and mention residual risk or missing test coverage.

After findings, include:

- open questions or assumptions
- test coverage gaps
- commit hygiene notes when relevant

## Architecture And Functional Isolation

Check whether responsibilities are separated:

- I/O, persistence, network, and CLI/UI adapters stay outside core algorithms.
- Core algorithms are pure or mostly deterministic where feasible.
- Domain logic does not depend on framework glue or transport details.
- Orchestration is thin and explicit, not a god class/object/function.
- Config parsing, validation, side effects, and business rules are not collapsed into one module.
- Data schemas and contracts are explicit enough to test.

Flag:

- god classes/modules/functions
- hidden global state
- circular dependencies
- mixed abstraction levels
- domain code that directly reads files, environment variables, sockets, or UI widgets
- duplicated business logic across adapters

## Style And Formatting

Prefer the repository's existing formatter, linter, and style guide. If no local standard exists, recommend Google style conventions where appropriate:

- Python: Google-style docstrings, type hints, clear module/function boundaries, formatting compatible with `black` or project formatter.
- C++: Google C++ style naming, ownership clarity, RAII, const-correctness, header/source separation.
- Java/TypeScript/JavaScript: project formatter first; otherwise clear naming, small units, explicit interfaces, and no incidental formatting churn.

Review formatting as an engineering signal:

- no unrelated whitespace churn
- consistent imports
- clear names
- comments explain why, not obvious what
- no dead code or commented-out experiments

## Performance And Resource Safety

Look for:

- memory leaks, unclosed files/sockets/handles, unbounded caches
- repeated deep copies or serialization/deserialization in hot paths
- accidental quadratic or N+1 behavior
- expensive work inside loops
- blocking I/O on hot request/UI paths
- unnecessary materialization of large collections
- unnecessary GPU/CPU transfers, sync points, or tensor copies
- missing cancellation, timeouts, cleanup, or backpressure
- data races and unsafe shared mutable state

When performance concerns are speculative, label them as risk and propose measurement.

## Testing Expectations

Check whether tests cover:

- changed behavior, not only happy paths
- boundaries between I/O adapters and core logic
- failure modes and cleanup paths
- regression cases for fixed bugs
- performance-sensitive paths when relevant

Prefer small deterministic tests for core algorithms and focused integration tests for I/O boundaries.

## Commit Hygiene

Review commits as part of engineering quality.

Expect:

- commits grouped by logical change, not by noisy file churn
- generated files, local caches, vendored blobs, and unrelated formatting excluded
- clean GitLens/history view where each commit explains what changed and why
- no accidental secret, token, notebook output, PDF, database, or local path
- no large unrelated diffs hidden in a feature commit

Recommended message style:

```text
feat(scope): add capability
fix(scope): correct bug
hotfix(scope): patch urgent production issue
refactor(scope): restructure without behavior change
test(scope): add or update tests
docs(scope): update documentation
chore(scope): maintenance-only change
```

The subject should be imperative, concise, and behavior-oriented. The body should explain motivation, risk, and test evidence when useful.

## Review Boundaries

Do not demand broad refactors unrelated to the changed code. Mention them as follow-up only when they directly affect correctness, safety, or maintainability of the change under review.

Do not over-index on style if correctness or architecture risks exist.

Do not approve a change with hidden security, data-loss, or resource-leak risks just because tests pass.
