# Daily Work Summary Workflow

## Purpose

Create a private Markdown summary for a single local calendar day using Codex and Claude Code conversations as evidence.

## Date Window

- Default timezone: `Asia/Shanghai`.
- Manual run: summarize the requested date.
- Scheduled run: run shortly after midnight and summarize the previous date.
- The logical range is local `00:00:00` through `23:59:59`.

## Evidence Sources

- Codex: `~/.codex/sessions/`
- Claude Code: `~/.claude/projects/`
- Optional user notes supplied in the prompt.

Do not include raw logs in the final Markdown. Convert them into concise bullets.

## Markdown Structure

```markdown
# 每日工作总结 - YYYY-MM-DD

> 范围：Asia/Shanghai YYYY-MM-DD 00:00-24:00。
> 来源：Codex N 条有效消息，Claude Code N 条有效消息。
> 说明：本文件根据本机对话日志自动生成，只供个人回顾；默认保存到 ~/daily-work-summaries，不要提交到 Git。

## 大点
- ...

## 小点
### 1. ...
- ...

## 遇到的坑
- ...

## 平台来源
### Codex
- ...

### Claude Code
- ...

## 明天可继续
- ...
```

## Privacy Checklist

- Redact GitHub PATs and `ghp_` tokens.
- Redact `sk-` style secrets.
- Redact app passwords and authorization headers.
- Redact Google Apps Script webhook URLs.
- Avoid raw personal email addresses unless the user explicitly wants them.
- Prefer `~/daily-work-summaries/` so generated Markdown stays outside the project workspace.
- If a project-local output directory is used, keep it ignored by Git.
- Never push generated summaries to OpenAgent.

## Quality Bar

- Major points are short and easy to scan.
- Subpoints mention practical steps and pitfalls, but avoid transcript-level detail.
- The summary distinguishes completed work, attempted work, blockers, and follow-up items.
- If a claim is not supported by logs or user notes, omit it.
