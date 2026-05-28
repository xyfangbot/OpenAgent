# github-artifact-uploader

General GitHub upload agent for already packaged skills or agents.

This is the bootstrap-safe uploader for the OpenSkill/OpenAgent system.

## What It Does

- Publishes public skills to `<account>/OpenSkill/<capability>/<skill-name>/`.
- Publishes private skills to `<account>/CloseSkill/<skill-name>/`.
- Publishes public agents to `<account>/OpenAgent/<capability>/<agent-name>/`.
- Uses only caller-provided `GITHUB_TOKEN` or `GH_TOKEN`.
- Uses temporary clones and staging-branch-to-cherry-pick discipline.

## What It Does Not Do

- It does not rewrite packaged content.
- It does not package skills or agents.
- It does not create private agent repositories in this workflow.
- It does not use VSCode's GitHub session.

## Install

Codex:

```bash
cp agents/codex/github-artifact-uploader.toml ~/.codex/agents/
```

Claude Code:

```bash
cp agents/claude-code/github-artifact-uploader.md ~/.claude/agents/
```

## Key References

- `references/artifact-upload-workflow.md`
- `references/git-hygiene.md`
