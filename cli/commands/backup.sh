#!/bin/bash
# desc: Gera backup compactado do diretorio data/
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"

cd "$REPO_DIR"
exec ./scripts/backup-data.sh "$@"
