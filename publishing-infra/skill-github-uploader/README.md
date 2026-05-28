# skill-github-uploader

GitHub upload agent for already packaged skills.

## What It Does

- Publishes public skills to `<account>/OpenSkill/<capability>/<skill-name>/`.
- Publishes private skills to `<account>/CloseSkill/<skill-name>/`.
- Uses only caller-provided `GITHUB_TOKEN` or `GH_TOKEN`.
- Uses temporary clones and staging-branch-to-cherry-pick discipline.

## What It Does Not Do

- It does not rewrite skill content.
- It does not package skills.
- It does not use VSCode's GitHub session.
- It does not call `gh auth login`.

## Install

Codex:

```bash
cp agents/codex/skill-github-uploader.toml ~/.codex/agents/
```

Claude Code:

```bash
cp agents/claude-code/skill-github-uploader.md ~/.claude/agents/
```

## Key References

- `references/github-upload-workflow.md`
- `references/git-hygiene.md`
