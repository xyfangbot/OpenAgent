# Artifact Upload Workflow

Use this reference only in `github-artifact-uploader`.

## Inputs

Required:

- package path
- artifact type: `skill` or `agent`
- GitHub account or organization
- visibility
- artifact name
- capability category
- target branch, default `main`
- dry-run or execute

Repository convention:

- public skill -> `<account>/OpenSkill`, path `<capability>/<skill-name>/`
- private skill -> `<account>/CloseSkill`, path `<skill-name>/`
- agent -> `<account>/OpenAgent`, path `<capability>/<agent-name>/`

Agents are always public in this workflow.
Private skills must not be silently published into `OpenSkill`. If visibility is private or the user says `CloseSkill`, target `CloseSkill`.

## Authentication

Use only:

```text
GITHUB_TOKEN
GH_TOKEN
```

Rules:

- Do not call `gh auth login`.
- Do not rely on VSCode's GitHub account.
- Do not write token values into remotes, git config, files, commit messages, or output.
- Do not use `https://TOKEN@github.com/...`.
- Prefer per-command git config:

```bash
git -c credential.helper= \
  -c http.extraHeader="Authorization: Bearer ${GITHUB_TOKEN}" \
  clone "https://github.com/<account>/<repo>.git" "<tmp>/repo"
```

## Target Resolution

Resolve target:

| Type | Visibility | Repo | Path | Commit message |
| --- | --- | --- | --- | --- |
| skill | public | `OpenSkill` | `<capability>/<skill-name>/` | `add skill: <capability>/<skill-name>` |
| skill | private | `CloseSkill` | `<skill-name>/` | `add private skill: <skill-name>` |
| agent | public | `OpenAgent` | `<capability>/<agent-name>/` | `add agent: <capability>/<agent-name>` |

Reject `artifact type=agent` with `visibility=private`.

## Repo Discovery And Creation

Check if the target repo exists with GitHub REST API:

```bash
curl -fsS \
  -H "Authorization: Bearer ${GITHUB_TOKEN}" \
  -H "Accept: application/vnd.github+json" \
  "https://api.github.com/repos/<account>/<repo>"
```

If it returns 404, create the repo.

Find whether account is a user or org:

```bash
curl -fsS \
  -H "Authorization: Bearer ${GITHUB_TOKEN}" \
  -H "Accept: application/vnd.github+json" \
  "https://api.github.com/users/<account>"
```

If `type` is `Organization`, create with:

```bash
curl -fsS \
  -X POST \
  -H "Authorization: Bearer ${GITHUB_TOKEN}" \
  -H "Accept: application/vnd.github+json" \
  "https://api.github.com/orgs/<account>/repos" \
  -d '{"name":"OpenAgent","private":false}'
```

If `type` is `User`, create with:

```bash
curl -fsS \
  -X POST \
  -H "Authorization: Bearer ${GITHUB_TOKEN}" \
  -H "Accept: application/vnd.github+json" \
  "https://api.github.com/user/repos" \
  -d '{"name":"OpenAgent","private":false}'
```

Use `OpenSkill`/`CloseSkill` and the matching `private` value for skill uploads.

If repo creation fails due to permissions, stop and ask the user to create the repo manually.

## Dry Run

Dry-run must:

- validate required inputs
- resolve repo and target path
- confirm whether a token is present without printing it
- optionally run read-only API checks
- report planned commands at a high level
- stop before clone, commit, repo creation, cherry-pick, or push unless explicitly asked for read-only API checks

## Execute

Execution must:

1. Create a temporary directory with `mktemp -d`.
2. Clone the target repo using only `http.extraHeader`.
3. Copy the package into the resolved target path.
4. Create a staging branch.
5. Commit only the target path.
6. Cherry-pick the staging commit into `main` for non-empty repos.
7. Verify all changed files are under the target path.
8. Push `main`.

Empty repository exception:

- If the repository has no commits, create the first commit from the staged target path and push it as `main`.

## Final Output

Return:

- target repo
- target path
- branch
- dry-run or executed
- commit SHA when executed
- push result

Never include token values.
