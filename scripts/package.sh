#!/usr/bin/env bash
# Build a reproducible extension zip for Chrome Web Store / AMO upload.
#
# Zips exactly extension/ (manifest_version 3 root) with no dev cruft —
# no tests, no server, no docs, no .DS_Store/__pycache__ noise. Deterministic
# member order and fixed timestamps so two builds of the same tree produce
# byte-identical zips (reproducible-build requirement for store review).

set -euo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")/.."

VERSION="$(node -e "console.log(require('./extension/manifest.json').version)")"
OUT="truthstrike-extension-v${VERSION}.zip"

rm -f "$OUT"
cd extension

# Sort file list for deterministic member order; zip -X drops extra
# filesystem attributes (uid/gid/timestamps) that would otherwise make the
# archive non-reproducible across machines.
find . -type f \
  ! -name '.DS_Store' \
  ! -path '*/__pycache__/*' \
  | sed 's|^\./||' | sort \
  | zip -X -q "../$OUT" -@

cd ..
echo "Built $OUT ($(du -h "$OUT" | cut -f1))"
unzip -l "$OUT" | tail -1
