#!/usr/bin/env bash
#
# upload-song.sh — Add a new mass song set, update manifest, and upload to S3.
#
# Usage:
#   ./scripts/upload-song.sh <date> <name> <songs-json-file>
#
# Example:
#   ./scripts/upload-song.sh 2025-12-25 "Christmas Day" ~/exported-set.json
#
# Arguments:
#   date            Date in YYYY-MM-DD format (e.g. 2025-12-25)
#   name            Set name (e.g. "Christmas Day Mass")
#   songs-json-file Path to a JSON file with the set data.
#                   Must contain a top-level "songs" array.
#
# The script will:
#   1. Validate inputs
#   2. Copy the JSON to public/files/mass/<date> - <name>.json
#   3. Regenerate public/files/sets.json
#   4. Upload the new JSON + sets.json to S3
#   5. Commit & push in the songs submodule
#
# Requirements:
#   - AWS CLI configured with appropriate credentials
#   - Node.js (for generate-manifest.js)
#

set -euo pipefail

S3_BUCKET="${PYESA_S3_BUCKET:-pyesa-web}"
S3_PREFIX="files"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
FILES_DIR="$PROJECT_ROOT/public/files"
MASS_DIR="$FILES_DIR/mass"

# ---------- Helpers ----------
die() { echo "Error: $*" >&2; exit 1; }

usage() {
  echo "Usage: $0 <YYYY-MM-DD> <set-name> <songs-json-file>"
  echo ""
  echo "Example:"
  echo "  $0 2025-12-25 \"Christmas Day\" ~/exported-set.json"
  echo ""
  echo "Environment:"
  echo "  PYESA_S3_BUCKET  S3 bucket name (default: pyesa-web)"
  exit 1
}

# ---------- Validate args ----------
[[ $# -eq 3 ]] || usage

DATE="$1"
NAME="$2"
SOURCE_FILE="$3"

# Validate date format
[[ "$DATE" =~ ^[0-9]{4}-[0-9]{2}-[0-9]{2}$ ]] || die "Date must be YYYY-MM-DD (got '$DATE')"

# Validate source file exists
[[ -f "$SOURCE_FILE" ]] || die "File not found: $SOURCE_FILE"

# Check AWS CLI
command -v aws &>/dev/null || die "AWS CLI is required. Install it: https://aws.amazon.com/cli/"

# Validate JSON
node -e "
  const fs = require('fs');
  const data = JSON.parse(fs.readFileSync(process.argv[1], 'utf8'));
  if (!data.songs || !Array.isArray(data.songs)) {
    console.error('Error: JSON must contain a \"songs\" array');
    process.exit(1);
  }
  console.log('  Found ' + data.songs.length + ' songs');
" "$SOURCE_FILE" || die "Invalid JSON or missing 'songs' array in $SOURCE_FILE"

# ---------- Copy file ----------
DEST_FILENAME="${DATE} - ${NAME}.json"
DEST_PATH="$MASS_DIR/$DEST_FILENAME"

if [[ -f "$DEST_PATH" ]]; then
  echo "Warning: '$DEST_FILENAME' already exists. Overwriting."
fi

cp "$SOURCE_FILE" "$DEST_PATH"
echo "Copied to: public/files/mass/$DEST_FILENAME"

# ---------- Regenerate manifest ----------
echo "Regenerating sets.json..."
node "$SCRIPT_DIR/generate-manifest.js"

# ---------- Upload to S3 ----------
echo ""
echo "Uploading to S3 (s3://$S3_BUCKET/$S3_PREFIX/)..."
aws s3 cp "$DEST_PATH" "s3://$S3_BUCKET/$S3_PREFIX/mass/$DEST_FILENAME" \
  --content-type "application/json"
echo "  Uploaded: mass/$DEST_FILENAME"

aws s3 cp "$FILES_DIR/sets.json" "s3://$S3_BUCKET/$S3_PREFIX/sets.json" \
  --content-type "application/json"
echo "  Uploaded: sets.json"

# ---------- Git operations (songs submodule) ----------
echo ""
echo "Committing in songs submodule..."
cd "$FILES_DIR"
git add "mass/$DEST_FILENAME" "sets.json"
git commit -m "Add set: ${DATE} - ${NAME}"
git push

echo ""
echo "Done!"
echo "  Set:  $DEST_FILENAME"
echo "  S3:   s3://$S3_BUCKET/$S3_PREFIX/mass/$DEST_FILENAME"
echo "  S3:   s3://$S3_BUCKET/$S3_PREFIX/sets.json"
