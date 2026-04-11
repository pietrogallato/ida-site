#!/usr/bin/env bash
# scripts/backup-sanity.sh
#
# Manual backup of the Sanity dataset — security audit F-43.
#
# Creates a tar.gz export of the entire production dataset (documents +
# assets) in ./backups/ with a timestamped filename. Run this script
# monthly (or before any major editorial change) and copy the resulting
# file to a location outside of Sanity — e.g. Google Drive, an external
# drive, or a private GitHub release.
#
# Requirements:
#   - npx (ships with npm)
#   - You must be logged in to Sanity on this machine: `npx sanity login`
#     (once; the token is cached under ~/.config/sanity).
#   - NEXT_PUBLIC_SANITY_DATASET set in .env.local (default "production").
#
# Usage:
#   ./scripts/backup-sanity.sh
#
# The script is idempotent and safe to re-run.

set -euo pipefail

PROJECT_ROOT="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_ROOT"

# Load dataset name from .env.local if present.
if [[ -f .env.local ]]; then
  set -a
  # shellcheck disable=SC1091
  source ./.env.local
  set +a
fi

DATASET="${NEXT_PUBLIC_SANITY_DATASET:-production}"
BACKUP_DIR="${PROJECT_ROOT}/backups"
TIMESTAMP="$(date +%Y%m%d-%H%M%S)"
OUTPUT_FILE="${BACKUP_DIR}/sanity-${DATASET}-${TIMESTAMP}.tar.gz"

mkdir -p "$BACKUP_DIR"

echo "→ Backing up Sanity dataset \"${DATASET}\" to ${OUTPUT_FILE}"
npx sanity dataset export "${DATASET}" "${OUTPUT_FILE}"

SIZE_HUMAN="$(du -h "${OUTPUT_FILE}" | cut -f1)"
echo ""
echo "✓ Backup complete: ${OUTPUT_FILE} (${SIZE_HUMAN})"
echo ""
echo "NEXT STEP — store the archive off-site:"
echo "  1. Upload to Google Drive / iCloud / external drive"
echo "  2. Delete local copies older than 6 months:"
echo "       find ${BACKUP_DIR} -name 'sanity-*.tar.gz' -mtime +180 -delete"
