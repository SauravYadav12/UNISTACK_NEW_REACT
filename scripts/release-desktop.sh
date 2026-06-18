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
echo " Bucket  : unistack-storage/desktop/v${VERSION}/"
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
  "s3://unistack-storage/desktop/v${VERSION}/Unistack-${VERSION}.dmg" \
  --endpoint-url="${ENDPOINT}" \
  --acl=public-read

echo "→ Uploading Windows EXE to Spaces…"
aws s3 cp "${WIN_EXE}" \
  "s3://unistack-storage/desktop/v${VERSION}/Unistack-Setup-${VERSION}.exe" \
  --endpoint-url="${ENDPOINT}" \
  --acl=public-read

# ── Generate + upload latest.json ──
echo "→ Generating latest.json…"
node "${SCRIPT_DIR}/write-latest.js" "${VERSION}"

echo "→ Uploading latest.json to Spaces…"
aws s3 cp "${SCRIPT_DIR}/latest.json" \
  "s3://unistack-storage/desktop/latest.json" \
  --endpoint-url="${ENDPOINT}" \
  --acl=public-read \
  --cache-control "no-cache, no-store, must-revalidate"

# ── Done ──
echo ""
echo "✓ Release v${VERSION} published."
echo ""
echo "Public URLs:"
echo "  macOS   : ${ENDPOINT}/unistack-storage/desktop/v${VERSION}/Unistack-${VERSION}.dmg"
echo "  Windows : ${ENDPOINT}/unistack-storage/desktop/v${VERSION}/Unistack-Setup-${VERSION}.exe"
echo "  latest  : ${ENDPOINT}/unistack-storage/desktop/latest.json"
echo ""
echo "Users on existing shells will see the upgrade nudge within 6 hours"
echo "(or on the next window focus). New users land on /download."
