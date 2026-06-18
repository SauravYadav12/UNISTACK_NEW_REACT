#!/usr/bin/env node
/* eslint-disable no-console */
/**
 * Emit scripts/latest.json — the manifest the /download page and the
 * in-app version-check toast consume.
 *
 * Run as: node scripts/write-latest.js <version>
 *
 * Reads `RELEASE_NOTES.md` (one-line summary at the top) if present,
 * else falls back to a generic message. The release script invokes this
 * after the DMG + EXE are produced so file sizes are accurate.
 */
const fs = require("fs");
const path = require("path");

const version = process.argv[2];
if (!version) {
  console.error("Usage: node scripts/write-latest.js <version>");
  process.exit(1);
}

const root = path.resolve(__dirname, "..");
const dmg = path.join(root, "dist-electron", `Unistack-${version}.dmg`);
const exe = path.join(root, "dist-electron", `Unistack Setup ${version}.exe`);

function safeSize(p) {
  try {
    return fs.statSync(p).size;
  } catch {
    return 0;
  }
}

const macSize = safeSize(dmg);
const winSize = safeSize(exe);
if (!macSize || !winSize) {
  console.error(
    `Missing build artifact(s):\n  ${dmg} → ${macSize} bytes\n  ${exe} → ${winSize} bytes`,
  );
  process.exit(1);
}

// Notes: first non-empty line of RELEASE_NOTES.md if present, else a
// generic message. The release script can be enhanced later to read a
// per-version section if release-notes get long.
let notes = "Shell update — refresh when convenient.";
const notesPath = path.join(root, "RELEASE_NOTES.md");
if (fs.existsSync(notesPath)) {
  const firstLine = fs
    .readFileSync(notesPath, "utf8")
    .split("\n")
    .map((l) => l.trim())
    .find((l) => l && !l.startsWith("#"));
  if (firstLine) notes = firstLine;
}

const payload = {
  version,
  releasedAt: new Date().toISOString(),
  mac: {
    url: `https://blr1.digitaloceanspaces.com/unistack-storage/desktop/v${version}/Unistack-${version}.dmg`,
    sizeBytes: macSize,
  },
  win: {
    url: `https://blr1.digitaloceanspaces.com/unistack-storage/desktop/v${version}/Unistack-Setup-${version}.exe`,
    sizeBytes: winSize,
  },
  notes,
};

const out = path.join(__dirname, "latest.json");
fs.writeFileSync(out, JSON.stringify(payload, null, 2), "utf8");
console.log(`✓ Wrote ${out}`);
console.log(JSON.stringify(payload, null, 2));
