#!/bin/bash
# desc: Instala os agentes launchd do kids-projects no macOS
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"

cd "$REPO_DIR"
exec ./scripts/install-launchd.sh "$@"
