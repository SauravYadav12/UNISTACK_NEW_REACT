/**
 * Unistack desktop — Electron main process.
 *
 * Thin-shell approach: this process loads the live web app
 * (https://portal.unicodez.com by default) into a BrowserWindow. We do NOT
 * bundle the React build; we point at the deployed URL so feature work in
 * the web auto-propagates to desktop users on next refresh.
 *
 * Surfaces native OS behaviors the web app can't do alone:
 *   - System tray + dock icon (always visible)
 *   - Single-instance lock (second launch focuses the existing window)
 *   - Close → minimize-to-tray; explicit Quit exits
 *   - Native OS notifications (used by Uchat in a later phase)
 *   - Auto-launch on system boot (user toggle)
 *   - Runtime backend URL override (persisted per-user config)
 *
 * The renderer reaches these via the typed `window.unistack` API exposed
 * by preload.ts. The web bundle stays unmodified and runs in Chrome too.
 */
import {
  app,
  BrowserWindow,
  Menu,
  Notification,
  Tray,
  ipcMain,
  nativeImage,
  shell,
} from "electron";
import * as path from "path";
import { loadConfig, saveConfig } from "./runtimeConfig";

// Baked-in production URL. Override via runtime config (saved by the
// in-app settings dialog) or via ELECTRON_DEV_URL env var (dev only).
const DEFAULT_PROD_URL = "https://portal.unicodez.com";

// Tracks whether the user has explicitly chosen to quit. Without this
// flag, app.quit() on macOS just hides the window and the next dock
// click reopens it — desired behavior. But on tray "Quit", we want a
// real exit.
let isQuitting = false;
let mainWindow: BrowserWindow | null = null;
let tray: Tray | null = null;

function resolveStartUrl(): string {
  // 1. Dev-server override (used by `npm run dev:electron`).
  const devUrl = process.env.ELECTRON_DEV_URL;
  if (devUrl) return devUrl;
  // 2. User-set override (settings dialog). Persisted to userData JSON.
  const cfg = loadConfig();
  if (cfg.serverUrl) return cfg.serverUrl;
  // 3. Fallback to baked default.
  return DEFAULT_PROD_URL;
}

function createMainWindow() {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.show();
    mainWindow.focus();
    return;
  }
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 960,
    minHeight: 640,
    show: false,
    backgroundColor: "#032840", // matches the brand navy so the load doesn't flash white
    title: "Unistack",
    icon: path.join(__dirname, "assets", "icon.png"),
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false, // preload needs Node APIs (fs for config)
    },
  });

  // Show only after first paint so we don't flash an empty grey window
  // while portal.unicodez.com cold-starts.
  mainWindow.once("ready-to-show", () => {
    mainWindow?.show();
  });

  const startUrl = resolveStartUrl();
  mainWindow.loadURL(startUrl).catch((err) => {
    console.error("[unistack] Failed to load start URL:", startUrl, err);
  });

  // Open external links (target=_blank / window.open) in the user's
  // default browser instead of a new Electron window. Mostly relevant
  // for /download → installer mirrors, or any future external help link.
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith("http://") || url.startsWith("https://")) {
      shell.openExternal(url);
      return { action: "deny" };
    }
    return { action: "allow" };
  });

  // Close → minimize to tray. The OS-level Quit (Cmd+Q, tray Quit) sets
  // isQuitting so this branch doesn't intercept the real exit.
  mainWindow.on("close", (e) => {
    if (!isQuitting) {
      e.preventDefault();
      mainWindow?.hide();
      // macOS: hide from dock too so it really feels "minimized". On
      // Windows the taskbar entry vanishes automatically because we
      // already hide().
      if (process.platform === "darwin") app.dock?.hide();
    }
  });

  mainWindow.on("show", () => {
    if (process.platform === "darwin") app.dock?.show();
  });
}

function createTray() {
  // Tray icon path — keep a separate smaller asset for the system tray
  // since the main app icon is too large at 16/32px.
  const iconPath = path.join(__dirname, "assets", "icon-tray.png");
  const image = nativeImage.createFromPath(iconPath);
  // macOS template image: lets the OS recolor for light/dark menubar.
  if (process.platform === "darwin") image.setTemplateImage(true);

  tray = new Tray(image);
  tray.setToolTip("Unistack");
  refreshTrayMenu();

  // Click behavior differs by platform: Windows users expect click to
  // toggle the window; macOS users expect click to open the menu.
  tray.on("click", () => {
    if (process.platform === "win32") {
      if (mainWindow?.isVisible()) mainWindow.hide();
      else createMainWindow();
    }
  });
}

function refreshTrayMenu() {
  if (!tray) return;
  const menu = Menu.buildFromTemplate([
    {
      label: "Open Unistack",
      click: () => createMainWindow(),
    },
    {
      label: "Download page",
      click: () => {
        createMainWindow();
        // Navigate the renderer to /download. Renderer listens on this
        // IPC channel via preload's onNavigate.
        mainWindow?.webContents.send("unistack:navigate", "/download");
      },
    },
    { type: "separator" },
    {
      label: "Quit Unistack",
      click: () => {
        isQuitting = true;
        app.quit();
      },
    },
  ]);
  tray.setContextMenu(menu);
}

function registerIpc() {
  ipcMain.handle("unistack:getServerUrl", () => {
    return loadConfig().serverUrl || DEFAULT_PROD_URL;
  });

  ipcMain.handle("unistack:setServerUrl", (_evt, url: string | null) => {
    const cfg = loadConfig();
    if (url === null || url.trim() === "") {
      delete cfg.serverUrl;
    } else {
      cfg.serverUrl = url.trim();
    }
    saveConfig(cfg);
    // Reload to pick up the new URL — admins changing this from the
    // settings dialog want immediate effect, not a manual restart.
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.loadURL(resolveStartUrl());
    }
    return true;
  });

  ipcMain.handle("unistack:getVersion", () => app.getVersion());

  ipcMain.handle("unistack:getAutoLaunch", () => {
    const settings = app.getLoginItemSettings();
    return settings.openAtLogin;
  });

  ipcMain.handle("unistack:setAutoLaunch", (_evt, enabled: boolean) => {
    app.setLoginItemSettings({ openAtLogin: !!enabled });
    return true;
  });

  ipcMain.handle("unistack:quit", () => {
    isQuitting = true;
    app.quit();
  });

  // Native notification — used by Uchat once it lands. `deepLink` is the
  // in-app path the renderer should navigate to when the user clicks
  // the toast (e.g. "/uchat/room/abc123").
  ipcMain.handle(
    "unistack:notify",
    (_evt, payload: { title: string; body: string; deepLink?: string }) => {
      if (!Notification.isSupported()) return false;
      const n = new Notification({
        title: payload.title,
        body: payload.body,
        silent: false,
      });
      n.on("click", () => {
        createMainWindow();
        if (payload.deepLink) {
          mainWindow?.webContents.send(
            "unistack:navigate",
            payload.deepLink,
          );
        }
      });
      n.show();
      return true;
    },
  );

  ipcMain.handle("unistack:isDesktop", () => true);
}

// Single-instance lock: second launch focuses the existing window
// instead of spawning a duplicate. Critical for chat / notification UX
// — without this, employees end up with two Unistack windows.
const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
} else {
  app.on("second-instance", () => {
    createMainWindow();
  });

  app.whenReady().then(() => {
    registerIpc();
    createTray();
    createMainWindow();

    app.on("activate", () => {
      // macOS — dock click after all windows closed.
      if (!mainWindow || mainWindow.isDestroyed()) createMainWindow();
      else mainWindow.show();
    });
  });

  app.on("before-quit", () => {
    isQuitting = true;
  });

  app.on("window-all-closed", () => {
    // Don't quit when last window closes — we live in the tray. Only
    // an explicit Quit (tray menu, Cmd+Q, before-quit) actually exits.
    if (process.platform !== "darwin") {
      // On Windows we still keep the tray alive. Web wouldn't quit on
      // tab close either; same vibe.
    }
  });
}
