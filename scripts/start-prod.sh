#!/bin/bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
DEFAULT_PATH="/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin"

resolve_bin() {
  local preferred="$1"
  local fallback_name="$2"

  if [[ -n "$preferred" && -x "$preferred" ]]; then
    printf '%s\n' "$preferred"
    return 0
  fi

  command -v "$fallback_name"
}

NODE_BIN="$(resolve_bin "${KIDS_PROJECTS_NODE_BIN:-}" node)"
NPM_BIN="$(resolve_bin "${KIDS_PROJECTS_NPM_BIN:-}" npm)"

export PATH="$(dirname "$NODE_BIN"):$(dirname "$NPM_BIN"):$DEFAULT_PATH:${PATH:-}"
export KIDS_PROJECTS_HOST="${KIDS_PROJECTS_HOST:-127.0.0.1}"
export KIDS_PROJECTS_PORT="${KIDS_PROJECTS_PORT:-46321}"

mkdir -p "$REPO_DIR/logs" "$REPO_DIR/data/archives"
cd "$REPO_DIR"

if [ ! -f "$REPO_DIR/.next/BUILD_ID" ]; then
  "$NPM_BIN" run build
fi

bash "$REPO_DIR/scripts/ensure-native-deps.sh"

exec "$NPM_BIN" run start -- --hostname "$KIDS_PROJECTS_HOST" --port "$KIDS_PROJECTS_PORT"
