# skill-packager

Professional packaging agent for turning an existing skill into a clean public/private package for Codex, Claude Code, or both.

## What It Does

- Inspects a source skill directory.
- Produces repository-quality package content.
- Separates Codex and Claude Code variants when needed.
- Adds README, references, eval prompts, install notes, and safety notes.
- Excludes private local artifacts before public release.

## What It Does Not Do

- It does not upload to GitHub.
- It does not create repositories.
- It does not push git branches.

## Install

Codex:

```bash
cp agents/codex/skill-packager.toml ~/.codex/agents/
```

Claude Code:

```bash
cp agents/claude-code/skill-packager.md ~/.claude/agents/
```

## Key Reference

- `references/packaging-standard.md`
