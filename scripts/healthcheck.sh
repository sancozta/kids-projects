#!/bin/bash
set -euo pipefail

export PATH="/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin:${PATH:-}"

HOST="${KIDS_PROJECTS_HOST:-127.0.0.1}"
PORT="${KIDS_PROJECTS_PORT:-46321}"
LABEL="${KIDS_PROJECTS_LAUNCHD_LABEL:-com.sancozta.kids-projects}"
HEALTH_URL="http://${HOST}:${PORT}/api/health"

if curl -fsS --max-time 10 "$HEALTH_URL" >/dev/null; then
  exit 0
fi

launchctl kickstart -k "gui/${UID}/${LABEL}"
