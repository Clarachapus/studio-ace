#!/bin/bash
# Assembles the ready-to-copy USB folder for the client: site sources + double-click launchers + guide.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT="${1:-/Volumes/Crucial X9/STUDIO ACE/CLE USB studio a.c.e}"
mkdir -p "$OUT/site"
rsync -a --delete \
  --exclude node_modules --exclude '.next' --exclude '.next-*' --exclude .git --exclude test-results \
  --exclude playwright-report --exclude .leads --exclude '._*' --exclude .DS_Store --exclude '*.tsbuildinfo' \
  --exclude .share-active --exclude '.env*.local' --exclude usb-kit --exclude backup.sh \
  --exclude 'scripts/share*.sh' --exclude '.claude' \
  "$ROOT/" "$OUT/site/"
rsync -a --exclude '._*' "$ROOT/usb-kit/" "$OUT/"
chmod +x "$OUT"/*.command
find "$OUT" -name '._*' -delete 2>/dev/null || true
echo "Kit prêt : $OUT"
du -sh "$OUT"
