# latex-feishu-sync-agent

Custom agent for building portable LaTeX note workspaces that compile multiple PDF targets and sync them to Feishu Drive while staying portable to other storage providers.

## What It Does

- Sets up a LaTeX notes workspace with `latexmk`/`xelatex` build commands.
- Supports multiple named PDF targets, each with its own `texRoot`, entry file, output PDF name, and remote folder.
- Keeps private Feishu config in local-only files and safe template config in the repository.
- Syncs PDFs to Feishu Drive by first upload plus later in-place overwrite using the returned `fileToken`.
- Adds watch mode for save-triggered build and sync.
- Prepares a GitHub/Git-compatible publish path that excludes tokens, local sync state, generated PDFs, and synced docs.

## Install

Codex:

```bash
cp agents/codex/latex-feishu-sync-agent.toml ~/.codex/agents/
```

Claude Code:

```bash
cp agents/claude-code/latex-feishu-sync-agent.md ~/.claude/agents/
```

## Requirements

- Node.js 20+
- npm
- TeX Live or MacTeX with `latexmk` and `xelatex`
- `lark-cli` when syncing to Feishu
- A Feishu Drive folder token for each remote PDF target
- Optional: `GITHUB_TOKEN` or `GH_TOKEN` for publishing a portable package to GitHub

## Usage Examples

Ask the agent:

```text
Create a portable LaTeX notes workspace with two PDF targets and Feishu sync.
```

```text
Add another PDF target named topology-notes that syncs to a different Feishu folder.
```

```text
Make this LaTeX Feishu sync project GitHub-ready without including private Feishu docs or tokens.
```

```text
Publish the packaged agent to OpenAgent after I set GITHUB_TOKEN in the terminal.
```

## Safety

- Never paste GitHub PATs, Feishu app secrets, access tokens, refresh tokens, or keychain material into chat.
- Store personal Feishu settings in `feishu.config.local.json`, not in the public template.
- Do not commit `feishu-docs/`, `node_modules/`, `tmp/`, build outputs, `.local.json`, or PDF sync state.
- If a token is pasted into chat, revoke it and create a new token before publishing.

## Repository Layout

```text
latex-feishu-sync-agent/
├── agents/
│   ├── claude-code/latex-feishu-sync-agent.md
│   └── codex/latex-feishu-sync-agent.toml
├── references/
│   └── workflow.md
├── evals/
│   └── evals.json
├── README.md
├── LICENSE
└── .gitignore
```
