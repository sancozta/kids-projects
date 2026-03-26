#!/bin/bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
FORCE_REBUILD="${1:-}"
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

check_better_sqlite3() {
  "$NODE_BIN" <<'NODE'
try {
  require("better-sqlite3");
  process.exit(0);
} catch (error) {
  const message =
    error instanceof Error ? error.message : typeof error === "string" ? error : "";

  if (
    error &&
    typeof error === "object" &&
    "code" in error &&
    error.code === "ERR_DLOPEN_FAILED"
  ) {
    console.error(message);
    process.exit(42);
  }

  if (
    typeof message === "string" &&
    message.includes("NODE_MODULE_VERSION")
  ) {
    console.error(message);
    process.exit(42);
  }

  if (
    error &&
    typeof error === "object" &&
    "code" in error &&
    error.code === "MODULE_NOT_FOUND"
  ) {
    process.exit(43);
  }

  console.error(message || "Falha inesperada ao carregar better-sqlite3.");
  process.exit(1);
}
NODE
}

rebuild_better_sqlite3() {
  echo "Recompilando better-sqlite3 para Node $("$NODE_BIN" -p 'process.versions.node') (modules $("$NODE_BIN" -p 'process.versions.modules'))..."
  cd "$REPO_DIR"
  "$NPM_BIN" rebuild better-sqlite3
}

if [[ "$FORCE_REBUILD" == "--force" ]]; then
  rebuild_better_sqlite3
  check_better_sqlite3
  exit 0
fi

if check_better_sqlite3; then
  exit 0
fi

status=$?

if [[ "$status" == "42" || "$status" == "43" ]]; then
  rebuild_better_sqlite3
  check_better_sqlite3
  exit 0
fi

exit "$status"
