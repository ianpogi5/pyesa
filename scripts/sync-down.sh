#!/usr/bin/env bash
#
# sync-down.sh — Pull song data from S3 into public/files/ and back it up
# to the songs git repo.
#
# Since the set builder went live, S3 is the source of truth for song data
# (the website writes sets, drafts, and library.json directly to S3).
# Run this periodically — and always before editing files locally — so the
# pyesa-songs repo stays a faithful backup.
#
# Usage:
#   ./scripts/sync-down.sh
#

set -euo pipefail

S3_BUCKET="${PYESA_S3_BUCKET:-pyesa-web}"
S3_PREFIX="files"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
FILES_DIR="$PROJECT_ROOT/public/files"
AWS_PROFILE="${AWS_PROFILE:-pyesa}"

# Load .env if present
if [[ -f "$PROJECT_ROOT/.env" ]]; then
  set -a
  source "$PROJECT_ROOT/.env"
  set +a
  S3_BUCKET="${PYESA_S3_BUCKET:-$S3_BUCKET}"
  AWS_PROFILE="${AWS_PROFILE:-pyesa}"
fi

die() { echo "Error: $*" >&2; exit 1; }

[[ -d "$FILES_DIR" ]] || die "Files directory not found: $FILES_DIR"
command -v aws &>/dev/null || die "AWS CLI is required."

echo "Syncing s3://$S3_BUCKET/$S3_PREFIX/ → $FILES_DIR ..."
aws s3 sync "s3://$S3_BUCKET/$S3_PREFIX/" "$FILES_DIR" \
  --profile "$AWS_PROFILE" \
  --exclude ".git/*"
echo "  Sync complete."

echo ""
echo "Committing to songs repo..."
cd "$FILES_DIR"
git add -A
if git diff --cached --quiet; then
  echo "  No changes to commit."
else
  git commit -m "Sync from S3 $(date +%Y-%m-%d)"
  git push
  echo "  Pushed to remote."
fi

echo ""
echo "Done!"
