# Packaging Standard

Use this reference when packaging a skill or agent for public or private distribution.

## Inputs

Collect or infer:

- source skill or agent directory
- package type: skill, agent, or mixed package
- package name
- capability category
- target platform: codex, claude-code, or both
- visibility intent: public or private
- output directory

Ask only for missing information that cannot be inferred safely.

## Public Package Requirements

Public packages should look like professional open-source skill repositories:

- `README.md`
- `LICENSE`
- `.gitignore`
- skill or agent source
- `references/` for detailed workflows
- optional `scripts/` for deterministic install or validation helpers
- `evals/evals.json` with realistic prompts

`README.md` should include:

- one-sentence purpose
- requirements
- install instructions for Codex and/or Claude Code
- usage examples
- repository layout
- safety and privacy notes
- explicit statement that credentials are not stored in the package

`LICENSE` defaults to MIT unless the user requests another license.

## Private Package Requirements

Private packages may omit `LICENSE`, public positioning, and broad install instructions. They still need:

- `README.md`
- `.gitignore`
- skill or agent source
- references or notes needed for maintainability
- safety notes

## Platform Layouts

For skills:

```text
skills/
├── codex/<skill-name>/SKILL.md
└── claude-code/<skill-name>/SKILL.md
```

For agents:

```text
agents/
├── codex/<agent-name>.toml
└── claude-code/<agent-name>.md
```

For mixed packages, include both `skills/` and `agents/`.

## Codex Skill Rules

- Use `SKILL.md`.
- Include YAML frontmatter with `name` and `description`.
- Keep the body concise and move long details to `references/`.
- Installation via GitHub directory URL should work with Codex `$skill-installer`.

## Claude Code Skill Rules

- Use `SKILL.md`.
- Include YAML frontmatter with at least `description`; `name` is acceptable.
- Use Claude Code-specific frontmatter such as `allowed-tools` only in the Claude Code variant.
- Keep detailed instructions in referenced files.

## Codex Agent Rules

- Use standalone TOML files under `agents/codex/`.
- Required fields:
  - `name`
  - `description`
  - `developer_instructions`
- Optional fields may include `model_reasoning_effort`, `sandbox_mode`, `skills.config`, or MCP config when needed.
- Do not assume Codex IDE Extension surfaces subagent activity the same way as CLI/App.

## Claude Code Agent Rules

- Use Markdown files under `agents/claude-code/`.
- Required frontmatter:
  - `name`
  - `description`
- Optional frontmatter:
  - `tools`
  - `model`
  - `skills`
- Body is the agent system prompt.

## Public Content Scrub

Before packaging public content, exclude or rewrite:

- credentials, secrets, access tokens, app secrets, refresh tokens
- QR codes and temporary auth artifacts
- synced private documents and rendered previews
- `node_modules/`, `tmp/`, `dist/`, caches, `.git/`
- personal absolute paths such as `/Users/<name>/...`
- private account names unless the user explicitly wants them public
- generated files that are not needed to install or understand the package

## Final Report

Return:

- package path
- platforms included
- public/private visibility intent
- validation result
- excluded content
- next command for uploader if relevant
