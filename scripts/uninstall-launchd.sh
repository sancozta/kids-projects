#!/bin/bash
set -euo pipefail

TARGET_DIR="$HOME/Library/LaunchAgents"

for label in \
  "com.sancozta.kids-projects.watchdog" \
  "com.sancozta.kids-projects.backup" \
  "com.sancozta.kids-projects"
do
  launchctl bootout "gui/${UID}/${label}" 2>/dev/null || true
  rm -f "$TARGET_DIR/${label}.plist"
done
