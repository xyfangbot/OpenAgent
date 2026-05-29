# Daily Work Summary Workflow

## Purpose

Create a private Markdown summary for a single full local calendar day using all local Codex and Claude Code conversations as evidence. The output should be a work summary, not a copied conversation digest.

## Date Window

- Default timezone: `Asia/Shanghai`.
- Manual run: summarize the requested date.
- Scheduled run: run at `00:05` and summarize the previous date.
- The logical range is local `YYYY-MM-DD 00:00` through the next day `00:00`.

## Evidence Sources

- Codex: `~/.codex/sessions/`
- Claude Code: `~/.claude/projects/`
- Optional user notes supplied in the prompt.

Do not include raw logs or raw prompts in the final Markdown. Convert them into concise work-summary bullets.

## Markdown Structure

```markdown
# 每日工作总结 - YYYY-MM-DD

> 时间范围：Asia/Shanghai YYYY-MM-DD 00:00 至 YYYY-MM-DD+1 00:00。
> 自动生成：每天 00:05 生成前一天总结。
> 对话范围：当天所有本机可见 Codex/Claude Code 对话，不限于当前窗口。
> 说明：本文件根据本机对话日志自动生成，只供个人回顾；默认保存到 ~/daily-work-summaries，不要提交到 Git。

## 今日大点
- ...

## 分项小结
### 1. ...
- 做了什么：...
- 基本步骤：...
- 遇到的坑：...
- 结果：...

## 关键坑
- ...

## 对话来源
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
- Subpoints mention practical steps, pitfalls, and results, but avoid transcript-level detail.
- The summary distinguishes completed work, attempted work, blockers, and follow-up items.
- The summary never uses raw-prompt bullets such as `明确需求：...`.
- If a claim is not supported by logs or user notes, omit it.
