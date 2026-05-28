# Git Hygiene

Use this reference before any upload or repository mutation.

## Core Rules

- Never commit from the user's source workspace.
- Never use `git add .` for an upload commit.
- Never include credentials in a remote URL.
- Never modify global git config.
- Never rely on VSCode's signed-in GitHub account.
- Use a temporary clone/worktree for all upload operations.

## Path Discipline

Resolve target path:

- public: `<capability>/<skill-name>/`
- private: `<skill-name>/`

Stage only that path:

```bash
git add -- "<target-path>"
```

Before commit:

```bash
git status --short
```

If any changed path is outside `<target-path>`, stop.

## Staging Branch And Cherry-Pick

For non-empty repositories:

```bash
git switch -c "stage/<skill-name>"
git add -- "<target-path>"
git -c user.name="OpenSkill Publisher" \
  -c user.email="openskill-publisher@users.noreply.github.com" \
  commit -m "<message>"
staging_sha="$(git rev-parse HEAD)"

git switch main
git pull --ff-only origin main
git cherry-pick "$staging_sha"
```

After cherry-pick:

```bash
git diff --name-only HEAD^..HEAD
```

Every path must start with `<target-path>/` or exactly match a file under that directory. If not, abort:

```bash
git cherry-pick --abort
```

## Empty Repository

If the repo has no commits, make a root commit only after checking staged files:

```bash
git switch -c main
git add -- "<target-path>"
git diff --cached --name-only
```

Every path must be under `<target-path>/`. Then commit and push.

## Commit Messages

Public:

```text
add skill: <capability>/<skill-name>
```

Private:

```text
add private skill: <skill-name>
```

## Token Safety

Do not print commands with raw token values. Redact tokens as:

```text
<redacted>
```

Do not run commands that persist credentials:

- `gh auth login`
- `git credential approve`
- `git config --global credential.helper ...`

Use per-command headers and temporary directories.
