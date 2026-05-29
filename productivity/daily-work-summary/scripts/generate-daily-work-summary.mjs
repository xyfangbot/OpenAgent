#!/usr/bin/env node
import { mkdir, readdir, readFile, stat, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

const DEFAULT_TIMEZONE = "Asia/Shanghai";
const DEFAULT_OUT_DIR = path.join(os.homedir(), "daily-work-summaries");
const AUTOMATION_TIME = "00:05";

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (!arg.startsWith("--")) continue;
    const key = arg.slice(2);
    const next = argv[i + 1];
    args[key] = next && !next.startsWith("--") ? argv[++i] : true;
  }
  return args;
}

function usage() {
  return `Usage:
  node scripts/generate-daily-work-summary.mjs [--date YYYY-MM-DD] [--yesterday] [--timezone Asia/Shanghai] [--out ~/daily-work-summaries] [--stdout]

Default: summarize the current local date. For automation, use --yesterday at 00:05.
`;
}

function expandHome(filePath) {
  if (filePath === "~") return os.homedir();
  if (filePath.startsWith("~/")) return path.join(os.homedir(), filePath.slice(2));
  return filePath;
}

function dateKeyInZone(date, timeZone) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(date);
  const byType = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${byType.year}-${byType.month}-${byType.day}`;
}

function addDays(dateKey, days) {
  const [year, month, day] = dateKey.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day + days));
  return date.toISOString().slice(0, 10);
}

function dateParts(dateKey) {
  const [year, month, day] = dateKey.split("-");
  return { year, month, day };
}

async function pathExists(filePath) {
  try {
    await stat(filePath);
    return true;
  } catch {
    return false;
  }
}

async function walk(dir, out = []) {
  if (!(await pathExists(dir))) return out;
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      await walk(fullPath, out);
    } else if (entry.isFile() && entry.name.endsWith(".jsonl")) {
      out.push(fullPath);
    }
  }
  return out;
}

function redactSecrets(text) {
  return String(text || "")
    .replace(/github_pat_[A-Za-z0-9_]+/g, "[GITHUB_PAT_REDACTED]")
    .replace(/\bgh[pousr]_[A-Za-z0-9_]{20,}\b/g, "[GITHUB_TOKEN_REDACTED]")
    .replace(/\bsk-[A-Za-z0-9_-]{12,}\b/g, "[SECRET_REDACTED]")
    .replace(/https:\/\/script\.google\.com\/macros\/s\/[^\s)'"<>]+/g, "[GOOGLE_APPS_SCRIPT_URL_REDACTED]")
    .replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g, "[EMAIL_REDACTED]")
    .replace(/\b[a-z]{4}\s+[a-z]{4}\s+[a-z]{4}\s+[a-z]{4}\b/gi, "[APP_PASSWORD_REDACTED]")
    .replace(/(Authorization:\s*(?:Bearer|Basic)\s+)[^\s'"<>]+/gi, "$1[REDACTED]")
    .replace(/((?:GITHUB_TOKEN|GH_TOKEN|GMAIL_WEBHOOK_SECRET|GMAIL_APP_PASSWORD)\s*[:=]\s*)[^\s'"<>]+/gi, "$1[REDACTED]");
}

function cleanText(raw) {
  let text = redactSecrets(raw);
  text = text
    .replace(/<environment_context>[\s\S]*?<\/environment_context>/g, " ")
    .replace(/<turn_aborted>[\s\S]*?<\/turn_aborted>/g, " ")
    .replace(/# Context from my IDE setup:[\s\S]*?## My request for Codex:\s*/g, " ")
    .replace(/<[^>\n]{1,80}>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return text;
}

function extractCodexText(content) {
  if (typeof content === "string") return content;
  if (!Array.isArray(content)) return "";
  return content
    .filter((item) => item && (item.type === "input_text" || item.type === "output_text"))
    .map((item) => item.text || "")
    .join("\n");
}

function extractClaudeText(message) {
  const content = message?.content;
  if (typeof content === "string") return content;
  if (!Array.isArray(content)) return "";
  return content
    .filter((item) => item && item.type === "text")
    .map((item) => item.text || "")
    .join("\n");
}

function isLikelyToolResult(entry) {
  if (entry.toolUseResult || entry.type === "attachment" || entry.isMeta) return true;
  const content = entry.message?.content;
  return Array.isArray(content) && content.some((item) => item?.type === "tool_result");
}

function localDateMatches(timestamp, targetDate, timeZone) {
  if (!timestamp) return false;
  const date = new Date(timestamp);
  if (Number.isNaN(date.valueOf())) return false;
  return dateKeyInZone(date, timeZone) === targetDate;
}

async function readCodexEntries(targetDate, timeZone) {
  const home = os.homedir();
  const root = path.join(home, ".codex", "sessions");
  const candidateDates = [addDays(targetDate, -1), targetDate, addDays(targetDate, 1)];
  const files = [];

  for (const dateKey of candidateDates) {
    const { year, month, day } = dateParts(dateKey);
    const dir = path.join(root, year, month, day);
    if (await pathExists(dir)) files.push(...await walk(dir));
  }

  const entries = [];
  for (const file of [...new Set(files)]) {
    const raw = await readFile(file, "utf8").catch(() => "");
    for (const line of raw.split(/\r?\n/)) {
      if (!line.trim()) continue;
      let record;
      try {
        record = JSON.parse(line);
      } catch {
        continue;
      }
      if (!localDateMatches(record.timestamp, targetDate, timeZone)) continue;
      if (record.type !== "response_item") continue;
      const payload = record.payload || {};
      if (payload.type !== "message" || !["user", "assistant"].includes(payload.role)) continue;
      const text = cleanText(extractCodexText(payload.content));
      if (!text || text.length < 8) continue;
      entries.push({
        source: "Codex",
        role: payload.role,
        timestamp: record.timestamp,
        file,
        text
      });
    }
  }
  return entries;
}

async function readClaudeEntries(targetDate, timeZone) {
  const root = path.join(os.homedir(), ".claude", "projects");
  const files = await walk(root);
  const entries = [];

  for (const file of files) {
    const raw = await readFile(file, "utf8").catch(() => "");
    for (const line of raw.split(/\r?\n/)) {
      if (!line.trim()) continue;
      let record;
      try {
        record = JSON.parse(line);
      } catch {
        continue;
      }
      if (!localDateMatches(record.timestamp, targetDate, timeZone)) continue;
      if (!["user", "assistant"].includes(record.type)) continue;
      if (isLikelyToolResult(record)) continue;
      const text = cleanText(extractClaudeText(record.message));
      if (!text || text.length < 8) continue;
      entries.push({
        source: "Claude Code",
        role: record.type,
        timestamp: record.timestamp,
        file,
        text
      });
    }
  }
  return entries;
}

function dedupeEntries(entries) {
  const seen = new Set();
  const result = [];
  for (const entry of entries.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))) {
    const key = `${entry.source}|${entry.role}|${entry.text.slice(0, 240)}`;
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(entry);
  }
  return result;
}

const topicDefs = [
  {
    key: "dailySummary",
    title: "每日工作总结自动化",
    patterns: [/每日总结|工作总结|daily work summary|daily summary|work review|今天做了什么|昨天做了什么|0点到.*24点|00:00-24:00/i]
  },
  {
    key: "paperRadar",
    title: "论文雷达与 Paper Vault 工作流",
    patterns: [/论文|文献|research radar|literature|Paper Vault|Zotero|arXiv|High\/Medium|full-text|精读/i]
  },
  {
    key: "gmail",
    title: "Gmail 邮件发送链路",
    patterns: [/Gmail|邮件|email|App Password|Apps Script|webhook|SMTP|sendEmail|敏感信息/i]
  },
  {
    key: "feishu",
    title: "飞书云文档接入 VSCode",
    patterns: [/飞书|Feishu|Lark|云文档|docx|wiki|Markdown|VSCode|预览|同步|push/i]
  },
  {
    key: "codeReview",
    title: "代码审核 Agent",
    patterns: [/代码审核|code review|review agent|内存泄漏|性能|提交规范|Google格式|gitlens/i]
  },
  {
    key: "agents",
    title: "Agent/Skill 体系整理",
    patterns: [/OpenAgent|CloseAgent|agent|subagent|Claude Code|Codex|skill|OpenSkill|CloseSkill|打包|上传/i]
  },
  {
    key: "github",
    title: "GitHub 仓库与发布流程",
    patterns: [/GitHub|仓库|repo|public|private|PAT|token|cherry-pick|commit|push|username/i]
  }
];

function topicsFor(text) {
  const matches = [];
  for (const topic of topicDefs) {
    if (topic.patterns.some((pattern) => pattern.test(text))) matches.push(topic.key);
  }
  return matches.length > 0 ? matches : ["other"];
}

function collectTopicData(entries) {
  const data = new Map();
  for (const topic of topicDefs) data.set(topic.key, { ...topic, entries: [] });
  data.set("other", { key: "other", title: "其他协作事项", entries: [] });

  for (const entry of entries) {
    for (const key of topicsFor(entry.text)) {
      data.get(key)?.entries.push(entry);
    }
  }
  return [...data.values()].filter((topic) => topic.entries.length > 0);
}

function topicText(topic) {
  return topic.entries.map((entry) => entry.text).join("\n");
}

function has(text, pattern) {
  return pattern.test(text);
}

function bullet(label, text) {
  return `- ${label}：${text}`;
}

function joinSteps(steps) {
  return `${steps
    .map((step) => step.trim().replace(/[。.;；]+$/u, ""))
    .filter(Boolean)
    .join("；")}。`;
}

function summaryForTopic(topic) {
  const text = topicText(topic);
  const templates = {
    dailySummary: {
      oneLine: "重做每日工作总结 agent，使它按完整自然日归纳 Codex/Claude Code 对话，并自动生成个人 Markdown 日报。",
      did: "把目标从“摘录对话”改成“归纳当天工作产出”，明确生成范围、生成时间、输出位置和不上 Git 的隐私边界。",
      steps: [
        "创建 Codex/Claude Code 双平台 agent 包，并放入 OpenAgent 的 productivity 分类。",
        "实现本地脚本读取当天所有 Codex/Claude Code 对话日志，按日期生成 Markdown。",
        `配置 launchd 每天 ${AUTOMATION_TIME} 运行，默认总结前一天 00:00 到次日 00:00 的内容。`,
        "把输出目录迁移到用户主目录下的 `~/daily-work-summaries`，避免混入项目文件。"
      ],
      pitfall: "第一版过度贴近原始对话，读起来像日志摘抄；后续需要坚持“先归纳、再列步骤”的写法。",
      result: "本机已能自动生成日报，agent 和文档也已同步到 OpenAgent。"
    },
    paperRadar: {
      oneLine: "搭建研究论文雷达工作流，把每日文献监控、Paper Vault 入库和 Zotero 精读候选串起来。",
      did: "围绕 robot learning 等方向配置每日文献抓取、High/Medium 论文筛选、全文 inbox 和每周精读候选。",
      steps: [
        "安装并接入 `daily-literature-digest` 与 `paper-vault` 两个 Codex skill。",
        "生成 `research-radar-curator` 编排 agent，用它协调文献日报、Paper Vault 和 Zotero taxonomy curator。",
        "配置每日 09:00 文献日报、09:30 Paper Vault 导入和周日 Zotero 候选总结。",
        "验证 Paper Vault 本地可视化页面和全文 inbox 规则。"
      ],
      pitfall: "无人值守流程不能自动登录出版社或学校账号；只有摘要或元数据的论文只能进入候选/全文 inbox。",
      result: "论文雷达与可视化文献库已经具备自动运行基础。"
    },
    gmail: {
      oneLine: "修通 Gmail 自动发送链路，为论文日报邮件通知提供稳定出口。",
      did: "先尝试 SMTP，再改用 Google Apps Script webhook，并验证手动发送和脚本发送。",
      steps: [
        "区分 Gmail 登录密码和 App Password，避免直接使用网页登录密码。",
        "定位 SMTP 连接超时问题，判断更像网络/端口限制而非密码错误。",
        "创建 Apps Script webhook，通过 HTTPS 触发 Gmail 发送。",
        "把 webhook 配置放进本地 `.env`，并确认不会写进 Git。"
      ],
      pitfall: "Google 会提示未验证应用访问敏感信息；SMTP 端口也可能被本地网络阻断。",
      result: "手动测试邮件已经发送成功，后续论文日报可走 webhook 邮件链路。"
    },
    feishu: {
      oneLine: "打通飞书云文档和 VSCode/Codex 的本地 Markdown 工作流。",
      did: "围绕飞书云文档链接建立拉取、渲染预览、编辑和回写的本地工作流，并整理成可复用 skill。",
      steps: [
        "使用飞书/Lark CLI 授权读取云文档内容。",
        "把云文档同步为 workspace 内 Markdown，并生成本地 HTML 预览。",
        "验证本地修改后可以通过脚本推回飞书文档。",
        "整理 `feishu-docs-vscode` skill，方便后续复用。"
      ],
      pitfall: "飞书授权、CLI 环境和文档权限是主要阻塞点；预览和回写也需要严格区分本地文件与远端文档。",
      result: "已经形成 VSCode 内可读、可预览、可回写的飞书 Markdown 工作流。"
    },
    codeReview: {
      oneLine: "设计并发布客观代码审核 agent，用于从工程质量角度审查别人写的代码。",
      did: "把代码审核要求扩展为结构化 prompt，覆盖隔离性、提交卫生、性能、内存、格式和客观性。",
      steps: [
        "明确 agent 不是代码作者，默认站在客观审查视角提出风险和建议。",
        "加入模块隔离、IO 与核心算法分离、避免上帝类等架构检查。",
        "加入提交规范、GitLens 可读性、按修改范围提交等 Git 卫生要求。",
        "补充内存泄漏、重复拷贝和性能退化等检查点。"
      ],
      pitfall: "审核 agent 容易写成主观建议清单；需要要求它用文件/行号、可复现风险和测试缺口说话。",
      result: "代码审核 agent 已整理并发布到 OpenAgent。"
    },
    agents: {
      oneLine: "建立 Codex/Claude Code 双平台 agent 与 skill 的打包、分类和上传体系。",
      did: "围绕 OpenAgent/OpenSkill/CloseSkill/CloseAgent 规划公开和私有资产的组织方式，并生成多个专业 agent。",
      steps: [
        "确认 Codex 使用 `.codex/agents/*.toml`，Claude Code 使用 `.claude/agents/*.md`。",
        "生成 skill packager 和 GitHub uploader 两类职责分离的 agent。",
        "按公开/私有仓库拆分 OpenSkill、CloseSkill、OpenAgent、CloseAgent。",
        "为研究、笔记、工程和上传发布等能力建立初步分类。"
      ],
      pitfall: "agent 和 skill 容易职责混淆；上传器不能顺手改内容，打包器也不能顺手推 GitHub。",
      result: "双平台 agent 包已经可以安装、验证和上传。"
    },
    github: {
      oneLine: "完成 GitHub 新账号下多个公开/私有仓库的发布流程。",
      did: "围绕 `xyfangbot` 账号上传 OpenAgent/OpenSkill/CloseSkill/CloseAgent 内容，并坚持临时 token 与干净提交。",
      steps: [
        "讨论并确定适合研究展示的新 GitHub username。",
        "用临时 PAT 通过 GitHub API/HTTPS 推送，不依赖 VSCode 登录态。",
        "采用 staging branch 和 cherry-pick 思路，尽量只提交目标目录。",
        "公开内容进入 OpenAgent/OpenSkill，私有内容进入 CloseAgent/CloseSkill。"
      ],
      pitfall: "PAT 曾在对话里出现，必须避免写入文件、日志和 README；上传时也不能把本地生成内容带上去。",
      result: "OpenAgent、CloseAgent、OpenSkill、CloseSkill 的基础发布链路已经跑通。"
    },
    other: {
      oneLine: "处理了一些账号命名、安装路径和使用方式确认等配套事项。",
      did: "围绕日常使用体验补充了路径说明、运行方式和局部调整。",
      steps: [
        "确认生成文件的实际位置和自动任务状态。",
        "把个人输出目录从项目内迁移到用户主目录。",
        "根据使用反馈继续修正 agent 规则。"
      ],
      pitfall: "自动化默认路径如果放在项目里，容易让个人笔记和仓库内容混在一起。",
      result: "个人输出和公开仓库内容已经拆开。"
    }
  };

  const base = templates[topic.key] || templates.other;
  const steps = [...base.steps];
  if (topic.key === "dailySummary" && has(text, /OpenAgent|GitHub|上传|pushed/i)) {
    steps.push("把 agent 包上传到 GitHub 的 OpenAgent 仓库。");
  }
  if (topic.key === "gmail" && has(text, /sent|发送成功|手动发/i)) {
    steps.push("完成手动邮件发送验证。");
  }
  if (topic.key === "paperRadar" && has(text, /launchd|09:00|09:30|每周日/i)) {
    steps.push("把每日和每周任务写入本地定时任务。");
  }
  return { ...base, steps: [...new Set(steps)] };
}

function pickPitfalls(topics) {
  const seen = new Set();
  const bullets = [];
  for (const topic of topics) {
    const summary = summaryForTopic(topic);
    if (!summary.pitfall || seen.has(summary.pitfall)) continue;
    seen.add(summary.pitfall);
    bullets.push(`- ${summary.pitfall}`);
  }
  return bullets.length > 0 ? bullets : ["- 今天没有从对话里归纳出明确阻塞点。"];
}

function nextSteps(topics) {
  const keys = new Set(topics.map((topic) => topic.key));
  const bullets = [];
  if (keys.has("dailySummary")) bullets.push("- 按这版格式继续观察日报质量，后续只微调总结规则，不再回退到原文摘录。");
  if (keys.has("paperRadar")) bullets.push("- 检查下一次论文雷达、Paper Vault 导入和 Zotero 候选总结是否按定时任务运行。");
  if (keys.has("gmail")) bullets.push("- 留意 Gmail webhook 的授权状态，若邮件失败优先检查 Apps Script 部署和 `.env`。");
  if (keys.has("feishu")) bullets.push("- 继续验证飞书文档回写，尤其是复杂 Markdown/公式/图片的转换边界。");
  if (keys.has("agents") || keys.has("github")) bullets.push("- 继续保持公开 agent/skill 仓库只提交可发布内容，个人输出和 token 不进仓库。");
  if (bullets.length === 0) bullets.push("- 明天继续按当天主要产出补充总结。");
  return bullets;
}

function renderMarkdown({ targetDate, timeZone, entries }) {
  const codexCount = entries.filter((entry) => entry.source === "Codex").length;
  const claudeCount = entries.filter((entry) => entry.source === "Claude Code").length;
  const codexSessions = new Set(entries.filter((entry) => entry.source === "Codex").map((entry) => entry.file)).size;
  const claudeSessions = new Set(entries.filter((entry) => entry.source === "Claude Code").map((entry) => entry.file)).size;
  const topics = collectTopicData(entries);
  const nextDate = addDays(targetDate, 1);

  const lines = [];
  lines.push(`# 每日工作总结 - ${targetDate}`);
  lines.push("");
  lines.push(`> 时间范围：${timeZone} ${targetDate} 00:00 至 ${nextDate} 00:00。`);
  lines.push(`> 自动生成：每天 ${AUTOMATION_TIME} 生成前一天总结。`);
  lines.push(`> 对话范围：当天所有本机可见 Codex/Claude Code 对话，不限于当前窗口。Codex ${codexSessions} 个会话/${codexCount} 条有效消息，Claude Code ${claudeSessions} 个会话/${claudeCount} 条有效消息。`);
  lines.push(`> 输出位置：${DEFAULT_OUT_DIR}/${targetDate}.md。仅供个人回顾，不上传 GitHub。`);
  lines.push("");

  lines.push("## 今日大点");
  if (topics.length === 0) {
    lines.push("- 今天没有检索到可总结的 Codex/Claude Code 对话。");
  } else {
    for (const topic of topics) lines.push(`- ${summaryForTopic(topic).oneLine}`);
  }
  lines.push("");

  lines.push("## 分项小结");
  if (topics.length === 0) {
    lines.push("- 可以检查日志路径是否存在，或手动指定 `--date YYYY-MM-DD` 重新生成。");
  } else {
    topics.forEach((topic, index) => {
      const summary = summaryForTopic(topic);
      lines.push(`### ${index + 1}. ${topic.title}`);
      lines.push(bullet("做了什么", summary.did));
      lines.push(bullet("基本步骤", joinSteps(summary.steps)));
      lines.push(bullet("遇到的坑", summary.pitfall));
      lines.push(bullet("结果", summary.result));
      lines.push("");
    });
  }

  lines.push("## 关键坑");
  lines.push(...pickPitfalls(topics));
  lines.push("");

  lines.push("## 对话来源");
  lines.push(`- Codex：汇总当天所有 session，共 ${codexSessions} 个会话、${codexCount} 条有效消息。`);
  lines.push(`- Claude Code：汇总当天所有 project log，共 ${claudeSessions} 个会话、${claudeCount} 条有效消息。`);
  lines.push("- 处理方式：只保留归纳后的工作事实，不复制原始 prompt、token、邮箱、webhook 或长段对话。");
  lines.push("");

  lines.push("## 明天可继续");
  lines.push(...nextSteps(topics));
  lines.push("");

  return `${lines.join("\n")}\n`;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help || args.h) {
    console.log(usage());
    return;
  }

  const timeZone = String(args.timezone || DEFAULT_TIMEZONE);
  const today = dateKeyInZone(new Date(), timeZone);
  const targetDate = String(args.date || (args.yesterday ? addDays(today, -1) : today));
  if (!/^\d{4}-\d{2}-\d{2}$/.test(targetDate)) {
    throw new Error(`Invalid --date: ${targetDate}`);
  }

  const entries = dedupeEntries([
    ...await readCodexEntries(targetDate, timeZone),
    ...await readClaudeEntries(targetDate, timeZone)
  ]);
  const markdown = renderMarkdown({ targetDate, timeZone, entries });

  if (args.stdout) {
    process.stdout.write(markdown);
    return;
  }

  const outDir = path.resolve(expandHome(String(args.out || DEFAULT_OUT_DIR)));
  await mkdir(outDir, { recursive: true });
  const outFile = path.join(outDir, `${targetDate}.md`);
  await writeFile(outFile, markdown, "utf8");
  console.log(`Daily work summary written: ${outFile}`);
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
