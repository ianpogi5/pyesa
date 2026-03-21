#!/usr/bin/env bash
#
# upload-song.sh — Regenerate the sets manifest and sync all song files to S3.
#
# Usage:
#   ./scripts/upload-song.sh
#
# The script will:
#   1. Regenerate public/files/sets.json from public/files/mass/
#   2. Sync all files to S3
#   3. Invalidate CloudFront cache for song files
#   4. Commit & push in the songs repo
#
# Requirements:
#   - AWS CLI configured with appropriate credentials
#   - Node.js (for generate-manifest.js)
#

set -euo pipefail

S3_BUCKET="${PYESA_S3_BUCKET:-pyesa-web}"
S3_PREFIX="files"
DISTRIBUTION_ID="${PYESA_DISTRIBUTION_ID:-}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
FILES_DIR="$PROJECT_ROOT/public/files"
MASS_DIR="$FILES_DIR/mass"
AWS_PROFILE="${AWS_PROFILE:-pyesa}"

# Load .env if present
if [[ -f "$PROJECT_ROOT/.env" ]]; then
  set -a
  source "$PROJECT_ROOT/.env"
  set +a
  # Re-apply defaults after sourcing .env
  S3_BUCKET="${PYESA_S3_BUCKET:-$S3_BUCKET}"
  DISTRIBUTION_ID="${PYESA_DISTRIBUTION_ID:-$DISTRIBUTION_ID}"
  AWS_PROFILE="${AWS_PROFILE:-pyesa}"
fi

# ---------- Helpers ----------
die() { echo "Error: $*" >&2; exit 1; }

# ---------- Validate ----------
[[ -d "$MASS_DIR" ]] || die "Mass directory not found: $MASS_DIR"
command -v aws &>/dev/null || die "AWS CLI is required. Install it: https://aws.amazon.com/cli/"
command -v node &>/dev/null || die "Node.js is required."

# ---------- Clean new song files ----------
echo "Cleaning new song files..."
node "$SCRIPT_DIR/clean-song-files.js"

# ---------- Regenerate manifest ----------
echo ""
echo "Regenerating sets.json..."
node "$SCRIPT_DIR/generate-manifest.js"

# ---------- Sync to S3 ----------
echo ""
echo "Syncing to S3 (s3://$S3_BUCKET/$S3_PREFIX/)..."
aws s3 sync "$FILES_DIR" "s3://$S3_BUCKET/$S3_PREFIX/" \
  --profile "$AWS_PROFILE" \
  --exclude ".git/*" \
  --content-type "application/json"
echo "  Sync complete."

# ---------- Invalidate CloudFront ----------
echo ""
echo "Invalidating CloudFront cache..."

if [ -z "$DISTRIBUTION_ID" ]; then
  # Auto-discover from S3 bucket origin
  DISTRIBUTION_ID=$(aws cloudfront list-distributions \
    --profile "$AWS_PROFILE" \
    --query "DistributionList.Items[?Origins.Items[?DomainName=='${S3_BUCKET}.s3.amazonaws.com']].Id" \
    --output text 2>/dev/null || echo "")
fi

if [ -n "$DISTRIBUTION_ID" ] && [ "$DISTRIBUTION_ID" != "None" ]; then
  aws cloudfront create-invalidation \
    --profile "$AWS_PROFILE" \
    --distribution-id "$DISTRIBUTION_ID" \
    --paths "/files/*"
  echo "  Invalidated /files/* on distribution $DISTRIBUTION_ID"
else
  echo "  Warning: Could not find CloudFront distribution for bucket $S3_BUCKET. Skipping invalidation."
fi

# ---------- Git operations (songs repo) ----------
echo ""
echo "Committing changes..."
cd "$FILES_DIR"
git add -A
if git diff --cached --quiet; then
  echo "  No changes to commit."
else
  git commit -m "Update songs $(date +%Y-%m-%d)"
  git push
  echo "  Pushed to remote."
fi

echo ""
echo "Done!"
