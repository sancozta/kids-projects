#!/bin/bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
DATA_DIR="$REPO_DIR/data"
ARCHIVE_DIR="$DATA_DIR/archives"
RETENTION_COUNT="${KIDS_PROJECTS_BACKUP_RETENTION:-14}"
STAMP="$(date +"%Y-%m-%dT%H-%M-%S")"
TARGET_FILE="$ARCHIVE_DIR/data-$STAMP.tar.gz"

mkdir -p "$ARCHIVE_DIR"

tar \
  --exclude="data/archives" \
  -czf "$TARGET_FILE" \
  -C "$REPO_DIR" \
  data

mapfile -t ARCHIVES < <(find "$ARCHIVE_DIR" -maxdepth 1 -type f -name "data-*.tar.gz" | sort)

if [ "${#ARCHIVES[@]}" -gt "$RETENTION_COUNT" ]; then
  REMOVE_COUNT=$(( ${#ARCHIVES[@]} - RETENTION_COUNT ))

  for (( index=0; index<REMOVE_COUNT; index+=1 )); do
    rm -f "${ARCHIVES[$index]}"
  done
fi
