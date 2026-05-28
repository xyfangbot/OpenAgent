# OpenAgent

OpenAgent is a public collection of reusable custom agents for Codex and Claude Code.

## Layout

```text
<capability>/<agent-name>/
```

Current agents:

- `engineering-quality/code-review-engineer`: Reviews code for correctness, architecture isolation, performance/resource safety, tests, style, and git commit hygiene.
- `publishing-infra/skill-packager`: Packages existing skills into professional public/private distributions.
- `publishing-infra/skill-github-uploader`: Uploads already packaged skills to `OpenSkill` or `CloseSkill`.
- `publishing-infra/github-artifact-uploader`: Uploads already packaged skills or agents to `OpenSkill`, `CloseSkill`, or `OpenAgent`.

## Install

Codex agent files live under each package's `agents/codex/` directory and can be copied into `~/.codex/agents/`.

Claude Code agent files live under each package's `agents/claude-code/` directory and can be copied into `~/.claude/agents/`.

## Safety

Uploader agents use caller-provided `GITHUB_TOKEN` or `GH_TOKEN` only. They must not use VSCode's GitHub session, call `gh auth login`, or write credentials into remotes, files, commits, or logs.
