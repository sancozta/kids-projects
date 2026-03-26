#!/bin/bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
TEMPLATE_DIR="$REPO_DIR/launchd"
TARGET_DIR="$HOME/Library/LaunchAgents"
NODE_BIN="$(command -v node)"
NPM_BIN="$(command -v npm)"

mkdir -p "$TARGET_DIR" "$REPO_DIR/logs" "$REPO_DIR/data/archives"

install_template() {
  local template_name="$1"
  local output_name="${template_name%.template}"
  local source_file="$TEMPLATE_DIR/$template_name"
  local target_file="$TARGET_DIR/$output_name"

  sed \
    -e "s|__REPO_ROOT__|$REPO_DIR|g" \
    -e "s|__NODE_BIN__|$NODE_BIN|g" \
    -e "s|__NPM_BIN__|$NPM_BIN|g" \
    "$source_file" > "$target_file"
}

wait_until_unloaded() {
  local label="$1"
  local attempt

  for attempt in 1 2 3 4 5; do
    if ! launchctl print "gui/${UID}/${label}" >/dev/null 2>&1; then
      return 0
    fi

    sleep 0.5
  done
}

bootstrap_agent() {
  local plist_path="$1"
  local attempt
  local error_file

  error_file="$(mktemp)"

  for attempt in 1 2 3 4 5; do
    if launchctl bootstrap "gui/${UID}" "$plist_path" 2>"$error_file"; then
      rm -f "$error_file"
      return 0
    fi

    sleep 0.5
  done

  cat "$error_file" >&2
  rm -f "$error_file"
  return 1
}

install_template "com.sancozta.kids-projects.plist.template"
install_template "com.sancozta.kids-projects.watchdog.plist.template"
install_template "com.sancozta.kids-projects.backup.plist.template"

for label in \
  "com.sancozta.kids-projects" \
  "com.sancozta.kids-projects.watchdog" \
  "com.sancozta.kids-projects.backup"
do
  launchctl bootout "gui/${UID}/${label}" 2>/dev/null || true
  wait_until_unloaded "$label"
done

bootstrap_agent "$TARGET_DIR/com.sancozta.kids-projects.plist"
bootstrap_agent "$TARGET_DIR/com.sancozta.kids-projects.watchdog.plist"
bootstrap_agent "$TARGET_DIR/com.sancozta.kids-projects.backup.plist"

launchctl enable "gui/${UID}/com.sancozta.kids-projects"
launchctl enable "gui/${UID}/com.sancozta.kids-projects.watchdog"
launchctl enable "gui/${UID}/com.sancozta.kids-projects.backup"

launchctl kickstart -k "gui/${UID}/com.sancozta.kids-projects"
launchctl kickstart -k "gui/${UID}/com.sancozta.kids-projects.watchdog"

echo "Launchd instalado com Node: $NODE_BIN"
echo "Launchd instalado com npm:  $NPM_BIN"
