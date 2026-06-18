#!/usr/bin/env bash
# Unistack desktop release pipeline — manual.
#
# Builds the Mac DMG + Windows EXE, uploads both to DO Spaces under
# `desktop/v<version>/`, then overwrites `desktop/latest.json` so the
# in-app /download page and the version-check toast see the new version
# immediately.
#
# Prerequisites (one-time per developer machine):
#   1. macOS box (Windows builds cross-compile from Mac via electron-builder)
#   2. aws CLI installed:  brew install awscli
#   3. scripts/.env.release populated with DO_SPACES_KEY + DO_SPACES_SECRET
#      (copy from scripts/.env.release.example and paste your Spaces creds)
#   4. node + npm install run at the repo root
#
# Usage:
#   bash scripts/release-desktop.sh
#   (or: npm run release:desktop)

set -euo pipefail

# ── Resolve repo root regardless of where the script is invoked from ──
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
cd "${ROOT_DIR}"

# ── Load DO Spaces creds (NOT committed) ──
if [[ ! -f "${SCRIPT_DIR}/.env.release" ]]; then
  echo "ERROR: ${SCRIPT_DIR}/.env.release not found." >&2
  echo "Copy .env.release.example and fill in DO_SPACES_KEY + DO_SPACES_SECRET." >&2
  exit 1
fi
# shellcheck disable=SC1090
set -a; source "${SCRIPT_DIR}/.env.release"; set +a

if [[ -z "${DO_SPACES_KEY:-}" || -z "${DO_SPACES_SECRET:-}" ]]; then
  echo "ERROR: DO_SPACES_KEY / DO_SPACES_SECRET not set in .env.release" >&2
  exit 1
fi

VERSION="$(node -p "require('./package.json').version")"
echo ""
echo "──────────────────────────────────────────────"
echo " Unistack desktop release"
echo " Version : ${VERSION}"
echo " Bucket  : unistack-migrated-from-gcp/desktop/v${VERSION}/"
echo "──────────────────────────────────────────────"
echo ""

# ── Build both targets ──
echo "→ Building macOS DMG…"
npm run build:electron-mac
echo "→ Building Windows EXE…"
npm run build:electron-win

# electron-builder names the artifacts predictably from package.json's
# productName + version. We confirm they exist before uploading.
MAC_DMG="dist-electron/Unistack-${VERSION}.dmg"
WIN_EXE="dist-electron/Unistack Setup ${VERSION}.exe"

if [[ ! -f "${MAC_DMG}" ]]; then
  echo "ERROR: macOS DMG missing at ${MAC_DMG}" >&2
  exit 1
fi
if [[ ! -f "${WIN_EXE}" ]]; then
  echo "ERROR: Windows EXE missing at ${WIN_EXE}" >&2
  exit 1
fi

# ── Configure aws CLI to talk to DO Spaces ──
# DO Spaces is S3-compatible; we just point AWS_REGION + the endpoint
# at blr1.digitaloceanspaces.com. Per-invocation env vars beat
# `aws configure` because we don't want to touch the user's global
# profile (server creds live there).
export AWS_ACCESS_KEY_ID="${DO_SPACES_KEY}"
export AWS_SECRET_ACCESS_KEY="${DO_SPACES_SECRET}"
export AWS_DEFAULT_REGION="blr1"
ENDPOINT="https://blr1.digitaloceanspaces.com"

# ── Upload artifacts ──
echo "→ Uploading macOS DMG to Spaces…"
aws s3 cp "${MAC_DMG}" \
  "s3://unistack-migrated-from-gcp/desktop/v${VERSION}/Unistack-${VERSION}.dmg" \
  --endpoint-url="${ENDPOINT}" \
  --acl=public-read

echo "→ Uploading Windows EXE to Spaces…"
aws s3 cp "${WIN_EXE}" \
  "s3://unistack-migrated-from-gcp/desktop/v${VERSION}/Unistack-Setup-${VERSION}.exe" \
  --endpoint-url="${ENDPOINT}" \
  --acl=public-read

# ── Generate + upload latest.json ──
echo "→ Generating latest.json…"
node "${SCRIPT_DIR}/write-latest.cjs" "${VERSION}"

echo "→ Uploading latest.json to Spaces…"
aws s3 cp "${SCRIPT_DIR}/latest.json" \
  "s3://unistack-migrated-from-gcp/desktop/latest.json" \
  --endpoint-url="${ENDPOINT}" \
  --acl=public-read \
  --cache-control "no-cache, no-store, must-revalidate"

# ── Prune old versions ──
# Keep only the last N version folders under desktop/ to stop the bucket
# from growing unbounded. Each release is ~300 MB (DMG + EXE); without
# pruning, 100 releases = 30 GB. We default to KEEP_VERSIONS=3 — enough
# to roll back if a release goes sideways, but no more.
#
# Override per-release if needed:
#   KEEP_VERSIONS=10 npm run release:desktop
#
# Set KEEP_VERSIONS=0 to disable pruning entirely (keep every release
# forever — useful during the early-adoption phase if you're nervous).
KEEP_VERSIONS="${KEEP_VERSIONS:-3}"
if [[ "${KEEP_VERSIONS}" -gt 0 ]]; then
  echo "→ Pruning old releases (keeping last ${KEEP_VERSIONS})…"
  # List all version folders under desktop/, version-sort descending
  # so newest is first, drop the top KEEP_VERSIONS, delete the rest.
  # `aws s3 ls` returns lines like "                           PRE v1.0.0/"
  # for "common prefixes" (folders). We grep + awk those out.
  ALL_VERSIONS=$(aws s3 ls "s3://unistack-migrated-from-gcp/desktop/" \
    --endpoint-url="${ENDPOINT}" \
    | grep -E " PRE v[0-9]+\.[0-9]+\.[0-9]+/$" \
    | awk '{print $2}' \
    | sed 's:/$::' \
    | sort -V -r)
  TO_DELETE=$(echo "${ALL_VERSIONS}" | tail -n +$((KEEP_VERSIONS + 1)))
  if [[ -z "${TO_DELETE}" ]]; then
    echo "  ✓ Nothing to prune — bucket already at or below the retention limit."
  else
    while IFS= read -r vers; do
      [[ -z "${vers}" ]] && continue
      echo "  ✗ Deleting ${vers}…"
      aws s3 rm "s3://unistack-migrated-from-gcp/desktop/${vers}/" \
        --recursive \
        --endpoint-url="${ENDPOINT}"
    done <<< "${TO_DELETE}"
  fi
fi

# ── Done ──
echo ""
echo "✓ Release v${VERSION} published."
echo ""
echo "Public URLs:"
echo "  macOS   : ${ENDPOINT}/unistack-migrated-from-gcp/desktop/v${VERSION}/Unistack-${VERSION}.dmg"
echo "  Windows : ${ENDPOINT}/unistack-migrated-from-gcp/desktop/v${VERSION}/Unistack-Setup-${VERSION}.exe"
echo "  latest  : ${ENDPOINT}/unistack-migrated-from-gcp/desktop/latest.json"
echo ""
echo "Users on existing shells will see the upgrade nudge within 6 hours"
echo "(or on the next window focus). New users land on /download."
