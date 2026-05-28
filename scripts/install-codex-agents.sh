#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DEST="${CODEX_HOME:-$HOME/.codex}/agents"
FORCE="0"

if [[ "${1:-}" == "--force" ]]; then
  FORCE="1"
fi

mkdir -p "$DEST"

find "$ROOT" -path "*/agents/codex/*.toml" -type f | while read -r file; do
  base="$(basename "$file")"
  target="$DEST/$base"
  if [[ -e "$target" && "$FORCE" != "1" ]]; then
    echo "Refusing to overwrite existing agent: $target" >&2
    echo "Run with --force to replace it." >&2
    exit 1
  fi
  cp "$file" "$target"
  echo "Installed $base -> $target"
done

echo "Installed OpenAgent Codex agents to $DEST"
