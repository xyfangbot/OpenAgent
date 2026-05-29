# Daily Work Summary Agent

`daily-work-summary` turns a full local day of Codex and Claude Code conversations into a private Markdown work summary. It is designed for personal research and engineering review: major outcomes first, then concise sub-summaries with basic steps, pitfalls, and results.

## What It Does

- Reads all local Codex and Claude Code conversation logs for one local calendar day, not just the current chat window.
- Summarizes what was done into Markdown without copying raw prompts.
- Separates major outcomes from practical sub-summaries.
- Highlights blockers, setup problems, permission issues, and debugging paths.
- Keeps generated Markdown private and out of GitHub.

## Install

Codex:

```bash
mkdir -p ~/.codex/agents
cp agents/codex/daily-work-summary.toml ~/.codex/agents/
```

Claude Code:

```bash
mkdir -p ~/.claude/agents
cp agents/claude-code/daily-work-summary.md ~/.claude/agents/
```

Restart the relevant tool after installation.

## Suggested Output

Write generated summaries to:

```text
~/daily-work-summaries/YYYY-MM-DD.md
```

The default location is outside the project workspace. If you choose a project-local output directory, keep that directory in `.gitignore`. The agent package is public; the generated daily summaries are private working notes.

## Summary Format

- `## 今日大点`: outcome-level bullets, not copied conversation text.
- `## 分项小结`: for each major topic, include `做了什么`、`基本步骤`、`遇到的坑`、`结果`.
- `## 关键坑`: cross-topic blockers and lessons.
- `## 对话来源`: counts and scope for Codex/Claude Code logs.
- `## 明天可继续`: small follow-up actions.

## Example Prompts

- `用 daily-work-summary 总结昨天 00:00 到今天 00:00 我在 Codex 和 Claude Code 里做了什么，输出 Markdown。`
- `帮我把今天的工作按大点和小点总结一下，大点简单，小点写基本步骤和遇到的坑，不要太细。`
- `检查每日总结输出目录是否会被 Git 提交，如果会就修正忽略规则。`

## Safety

- Redact tokens, passwords, webhook secrets, app passwords, private URLs, and email addresses.
- Do not upload generated daily summaries.
- Do not commit raw conversation logs.
- Do not paste raw prompts as summary bullets.
- Do not invent work that is not supported by logs or user notes.
