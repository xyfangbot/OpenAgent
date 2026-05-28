# LaTeX Feishu Sync Workflow

## Workspace Pattern

Use a portable project layout:

```text
.
├── latex-notes/
│   ├── main.tex
│   ├── config/
│   ├── chap0/
│   └── figures/
├── scripts/
│   ├── latex-build.mjs
│   ├── latex-sync-pdf.mjs
│   ├── latex-watch-sync.mjs
│   ├── feishu-upload-pdf.mjs
│   └── workspace-config.mjs
├── feishu.config.json
├── feishu.config.local.json
└── package.json
```

Public repository config is a template. Private local config goes into `feishu.config.local.json`.

## Target Schema

```json
{
  "pdfTargets": {
    "robot-notes": {
      "texRoot": "latex-notes",
      "mainTex": "main.tex",
      "outputPdf": "build/robot-notes.pdf",
      "remoteName": "robot-notes.pdf",
      "sync": {
        "provider": "feishu-drive",
        "folderToken": "<FEISHU_FOLDER_TOKEN>"
      }
    }
  }
}
```

Rules:

- `texRoot`, `mainTex`, and `outputPdf` must stay inside the workspace.
- Output PDFs should go under a build directory.
- Each target has its own remote file identity.
- If `folderToken` or `remoteName` changes, treat the target as a new remote destination and do not delete the old remote file automatically.

## Commands

Build one target:

```bash
npm run latex:build -- --target robot-notes
```

Build and sync one target:

```bash
npm run latex:sync-pdf -- --target robot-notes
```

Build and sync all targets:

```bash
npm run latex:sync-all
```

Watch and sync after saves:

```bash
npm run latex:watch-sync
```

Publish dry run:

```bash
npm run github:dry-run -- --github-owner <owner> --repo <repo>
```

Publish execute:

```bash
GITHUB_TOKEN=<new-token> npm run github:publish -- --github-owner <owner> --repo <repo>
```

## Provider Boundary

The build layer should never know Feishu-specific details. Provider scripts consume an already generated PDF and perform upload.

Current provider:

- `feishu-drive`: `lark-cli drive +upload`

Possible future providers:

- `github-release`
- `git-lfs`
- `s3`
- `webdav`
- `local-copy`

## Validation

Before finishing:

- Run `node --check` on changed Node scripts.
- Run `npm run latex:build -- --target <alias>`.
- Run dry-run publish if GitHub packaging changed.
- Confirm no secret patterns appear in staged public content.
- Confirm generated PDFs and local Feishu state are ignored.
