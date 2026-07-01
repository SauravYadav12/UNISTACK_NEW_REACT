/**
 * Per-user runtime config for Unistack desktop.
 *
 * Lives at:
 *   macOS  → ~/Library/Application Support/Unistack/config.json
 *   Windows → %APPDATA%\Unistack\config.json
 *
 * Only contains user-tweakable overrides. The baked production URL +
 * version are constants in main.ts / package.json — config only stores
 * values an admin / QA explicitly set via the settings dialog.
 *
 * Format is forward-compatible JSON: missing keys = "use defaults".
 * Bumping the schema is a matter of adding new optional keys; we don't
 * need a version field at this stage because each key is independently
 * optional.
 */
import { app } from "electron";
import * as fs from "fs";
import * as path from "path";

export interface UnistackConfig {
  /** Override for the backend URL. Undefined = use baked default. */
  serverUrl?: string;
  /** Persistent zoom level (Chromium log scale — 0 = 100%, +1 ≈ 120%,
   *  -1 ≈ 83%). Reapplied to `webContents` on every window load so the
   *  user's chosen zoom survives restarts. Clamped to [-3, 5]. */
  zoomLevel?: number;
}

function configPath(): string {
  return path.join(app.getPath("userData"), "config.json");
}

export function loadConfig(): UnistackConfig {
  try {
    const raw = fs.readFileSync(configPath(), "utf8");
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object") return parsed as UnistackConfig;
  } catch {
    // Missing file or corrupt JSON — treat as empty config. The next
    // saveConfig() will create a clean file.
  }
  return {};
}

export function saveConfig(cfg: UnistackConfig): void {
  const p = configPath();
  try {
    fs.mkdirSync(path.dirname(p), { recursive: true });
    fs.writeFileSync(p, JSON.stringify(cfg, null, 2), "utf8");
  } catch (err) {
    console.error("[unistack] Failed to save config:", err);
  }
}
