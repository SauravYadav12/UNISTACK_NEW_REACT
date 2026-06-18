#!/usr/bin/env bash
# Dev-only macOS hack: patch the bundled Electron.app's Info.plist so
# the macOS menu bar bolded app name reads "Unistack" instead of
# "Electron" during `npm run dev:electron`.
#
# Why this is needed:
#   macOS reads CFBundleName from the launching app's Info.plist BEFORE
#   any JavaScript runs, so app.setName('Unistack') in main.ts can only
#   update the *menu item labels* ("About …", "Quit …"), not the bolded
#   menu name. The plist lives inside node_modules/electron, which is
#   wiped on every `npm install` — so we re-patch in `postinstall`.
#
# Production builds are unaffected — electron-builder generates a fresh
# Info.plist with productName: Unistack from electron-builder.yml.
#
# No-op on Linux / Windows (only macOS has the menu bar this way).

set -e

# Only relevant on macOS.
[[ "$(uname)" != "Darwin" ]] && exit 0

ELECTRON_APP="node_modules/electron/dist/Electron.app"
PLIST="${ELECTRON_APP}/Contents/Info.plist"
EXEC_DIR="${ELECTRON_APP}/Contents/MacOS"

if [[ ! -f "${PLIST}" ]]; then
  # Electron not installed yet (fresh clone, npm install hasn't run).
  # Postinstall hook will re-fire once electron is in place.
  exit 0
fi

# Detect the root-ownership case (someone ran `npm install` via sudo
# at some point). Without write access we can't patch the plist; print
# a clear remediation step and exit cleanly so we don't break the
# install pipeline.
if [[ ! -w "${PLIST}" ]]; then
  echo "[unistack] Skipping menu-bar name patch — Electron.app is owned by root."
  echo "[unistack] To enable the dev-mode 'Unistack' menu bar label, run:"
  echo "[unistack]   sudo chown -R \$(whoami) node_modules/electron"
  echo "[unistack]   bash scripts/patch-dev-electron-name.sh"
  echo "[unistack] (Production builds are unaffected — this only matters during 'npm run dev:electron'.)"
  exit 0
fi

# PlistBuddy ships with macOS. Set each key, creating it if missing.
plist_set() {
  local key="$1"
  local value="$2"
  /usr/libexec/PlistBuddy -c "Set :${key} ${value}" "${PLIST}" 2>/dev/null \
    || /usr/libexec/PlistBuddy -c "Add :${key} string ${value}" "${PLIST}" 2>/dev/null \
    || true
}
plist_set CFBundleName Unistack
plist_set CFBundleDisplayName Unistack

# Refresh macOS's LaunchServices cache so the new name is picked up
# without requiring a logout. Silent failure is fine — the bundle still
# launches; only the LS cache misses until it refreshes naturally.
/System/Library/Frameworks/CoreServices.framework/Versions/A/Frameworks/LaunchServices.framework/Versions/A/Support/lsregister \
  -f "${ELECTRON_APP}" 2>/dev/null || true

echo "[unistack] Patched dev Electron.app menu-bar name → Unistack"
