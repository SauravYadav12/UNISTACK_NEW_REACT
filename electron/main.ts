/**
 * Unistack desktop — Electron main process.
 *
 * Thin-shell approach: this process loads the live web app
 * (https://www.unistack.in by default) into a BrowserWindow. We do NOT
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

// Path layout after compile:
//   electron/
//   ├── splash.html        ← lives at the SOURCE root
//   ├── assets/icon.png    ← also at source root
//   └── dist/              ← __dirname when this file runs
//       ├── main.js
//       ├── preload.js
//       └── runtimeConfig.js
// We walk up one level (`..`) from __dirname to reach the splash + assets.
// The preload.js sits next to main.js, so no walk-up needed.
const ELECTRON_DIR = path.join(__dirname, "..");
const ASSETS_DIR = path.join(ELECTRON_DIR, "assets");
const SPLASH_HTML = path.join(ELECTRON_DIR, "splash.html");
const PRELOAD_JS = path.join(__dirname, "preload.js");

// Force the app name immediately, BEFORE any other Electron call. In
// dev mode (`electron .`), the process otherwise inherits "Electron"
// from the binary's Info.plist, which shows up in the macOS menu bar,
// the "About" dialog, and the dock tooltip. Production builds get the
// right name from electron-builder's productName, but we still set it
// here so both flows behave identically.
app.setName("Unistack");

// Baked-in production URL. Override via runtime config (saved by the
// in-app settings dialog) or via ELECTRON_DEV_URL env var (dev only).
// Points directly at /login so the shell never shows the public
// marketing Landing page — desktop users always start on the auth
// surface, then bounce to /dashboard once authenticated.
const DEFAULT_PROD_URL = "https://www.unistack.in/login";

// Tracks whether the user has explicitly chosen to quit. Without this
// flag, app.quit() on macOS just hides the window and the next dock
// click reopens it — desired behavior. But on tray "Quit", we want a
// real exit.
let isQuitting = false;
let mainWindow: BrowserWindow | null = null;
let splashWindow: BrowserWindow | null = null;
let tray: Tray | null = null;

// Hard timeout for the splash: if the remote URL hangs forever (DNS
// failure, captive portal, server down), we still tear down the splash
// after 12s so the user is not staring at a loader and can at least
// see the main window's error chrome.
const SPLASH_HARD_TIMEOUT_MS = 12_000;

// Minimum on-screen time for the splash. Even when the renderer fires
// `did-finish-load` in 800ms on a warm cache, holding for this long
// means the user actually registers the brand moment instead of
// seeing a blink. 3s is a deliberate choice — short enough not to feel
// like a sales pitch, long enough to read the wordmark + tagline.
const SPLASH_MIN_DURATION_MS = 3_000;
let splashShownAt = 0;

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

/**
 * Open the branded splash window. Frameless + transparent so the
 * rounded card with the brand gradient "floats" on the desktop. The
 * window loads `electron/splash.html`; that file is fully self-
 * contained (inline CSS + inline JS, no preload) so it paints within
 * the first frame after creation — important because the whole point
 * of the splash is "instant feedback while the remote URL loads".
 *
 * The splash is dismissed by `dismissSplash()` once the main window's
 * renderer fires `did-finish-load`, OR by the hard timeout, OR if main
 * fails to load (so the user can interact with the error chrome).
 */
function createSplashWindow() {
  if (splashWindow && !splashWindow.isDestroyed()) return;
  splashWindow = new BrowserWindow({
    // Wider than tall — the wordmark "UNI [logo] TACK" lays out
    // horizontally so the splash needs ~600px of breathing room.
    width: 640,
    height: 420,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    resizable: false,
    movable: true, // user can drag it out of the way if they care
    show: false,
    skipTaskbar: true,
    backgroundColor: "#00000000",
    // No preload + no node integration — splash is pure presentational
    // HTML, doesn't need to talk to the OS.
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
    },
  });
  splashWindow.loadFile(SPLASH_HTML);
  splashWindow.once("ready-to-show", () => {
    splashWindow?.show();
    splashShownAt = Date.now();
  });
  splashWindow.on("closed", () => {
    splashWindow = null;
  });
}

/**
 * Fade out the splash, then close it. Called when main is fully
 * loaded (or after the hard timeout). Safe to call multiple times.
 * The fade is driven by `window.__leave()` in splash.html, which sets
 * a data attribute we CSS-animate against.
 *
 * Enforces SPLASH_MIN_DURATION_MS: if the renderer was fast (warm
 * cache, /login responds in < 1s) we still keep the splash up for the
 * full 3 seconds so the brand moment actually registers. Reschedules
 * via setTimeout when called early.
 *
 * `onClosed` runs AFTER the splash window has actually been destroyed
 * — used by the main-window reveal flow to swap windows cleanly. If
 * the splash is already gone when this is called, `onClosed` fires
 * synchronously on the next tick so callers don't have to special-
 * case it.
 */
function dismissSplash(onClosed?: () => void) {
  if (!splashWindow || splashWindow.isDestroyed()) {
    if (onClosed) setImmediate(onClosed);
    return;
  }
  const elapsed = splashShownAt ? Date.now() - splashShownAt : 0;
  const wait = Math.max(0, SPLASH_MIN_DURATION_MS - elapsed);
  if (wait > 0) {
    setTimeout(() => dismissSplash(onClosed), wait);
    return;
  }
  const w = splashWindow;
  // Run the JS fade hook, then close after the animation finishes.
  w.webContents
    .executeJavaScript("window.__leave && window.__leave();", true)
    .catch(() => {/* splash already destroyed or load failed */});
  setTimeout(() => {
    if (w && !w.isDestroyed()) w.close();
    if (onClosed) onClosed();
  }, 420);
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
    icon: path.join(ASSETS_DIR, "icon.png"),
    webPreferences: {
      preload: PRELOAD_JS,
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false, // preload needs Node APIs (fs for config)
    },
  });

  // The splash window covers the cold-start. The main window must
  // remain HIDDEN until the splash has fully closed — otherwise the
  // splash's transparent corners let the (loaded) login page bleed
  // through, which looks like two pages stacked on top of each other.
  //
  // Flow:
  //   1. main loads URL in the background while splash plays.
  //   2. `did-finish-load` fires → request splash dismissal.
  //   3. dismissSplash() enforces the 3s minimum + 420ms fade.
  //   4. Splash actually destroyed → callback fires → main shown.
  let revealed = false;
  function revealMainWindow() {
    if (revealed || !mainWindow || mainWindow.isDestroyed()) return;
    revealed = true;
    dismissSplash(() => {
      if (!mainWindow || mainWindow.isDestroyed()) return;
      mainWindow.show();
      mainWindow.focus();
    });
  }
  mainWindow.webContents.on("did-finish-load", revealMainWindow);
  // Even if loading fails (server down, DNS issue), tear down the
  // splash so the user can see the failure chrome and react.
  mainWindow.webContents.on("did-fail-load", (_e, _code, desc, url) => {
    console.error("[unistack] did-fail-load", desc, url);
    revealMainWindow();
  });
  // Belt-and-braces timeout for the splash. If neither did-finish-load
  // nor did-fail-load ever fires (network black hole, captive portal
  // intercept), we still reveal the main window so the user isn't
  // stranded.
  setTimeout(revealMainWindow, SPLASH_HARD_TIMEOUT_MS);

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
  // Tray icon — uses the colorful Unistack brand mark.
  //
  // Sizing: target ~16px tall, which is the macOS menu bar's standard
  // density. Without macOS @1x/@2x representations attached, the OS
  // renders a single-rep image at its literal pixel dimensions — so a
  // 44px source actually shows up as 44px tall, towering over the rest
  // of the menu bar. 16 is the right value.
  //
  // Only `height` is passed so the source's 3:4 aspect ratio is
  // preserved (432×578 → 12×16). Passing both dimensions squashes
  // the mark into a 1:1 box and erases color detail.
  //
  // We deliberately do NOT use macOS template-image mode here — the
  // brand colors are part of the identity and the user opted to keep
  // them in the tray even though fine detail softens at this size.
  const iconPath = path.join(ASSETS_DIR, "icon-tray.png");
  const image = nativeImage.createFromPath(iconPath);
  const trayImage = image.isEmpty()
    ? image
    : image.resize({ height: 16, quality: "best" });

  tray = new Tray(trayImage);
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

/**
 * Build the application menu. On macOS the first item (the "app menu")
 * is the one that shows the app NAME in bold at the top-left of the
 * screen — so we set it explicitly to "Unistack". Without this, the
 * default app menu uses `app.getName()` AND a hard-coded "Electron"
 * label on the first item in some Electron versions, which is why the
 * menu bar still reads "Electron" even after app.setName() is called.
 *
 * On Windows / Linux we just disable the menu bar entirely — the web
 * app provides all its own navigation; the native menu would only
 * duplicate.
 */
function buildAppMenu() {
  if (process.platform !== "darwin") {
    Menu.setApplicationMenu(null);
    return;
  }
  const template: Electron.MenuItemConstructorOptions[] = [
    {
      label: "Unistack",
      submenu: [
        { label: "About Unistack", role: "about" },
        { type: "separator" },
        { label: "Hide Unistack", accelerator: "Command+H", role: "hide" },
        { label: "Hide Others", accelerator: "Command+Alt+H", role: "hideOthers" },
        { label: "Show All", role: "unhide" },
        { type: "separator" },
        {
          label: "Quit Unistack",
          accelerator: "Command+Q",
          click: () => {
            isQuitting = true;
            app.quit();
          },
        },
      ],
    },
    {
      label: "Edit",
      submenu: [
        { role: "undo" },
        { role: "redo" },
        { type: "separator" },
        { role: "cut" },
        { role: "copy" },
        { role: "paste" },
        { role: "selectAll" },
      ],
    },
    {
      label: "View",
      submenu: [
        { role: "reload" },
        { role: "forceReload" },
        { role: "toggleDevTools" },
        { type: "separator" },
        { role: "resetZoom" },
        { role: "zoomIn" },
        { role: "zoomOut" },
        { type: "separator" },
        { role: "togglefullscreen" },
      ],
    },
    {
      label: "Window",
      submenu: [
        { role: "minimize" },
        { role: "close" },
        { role: "front" },
      ],
    },
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
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
    buildAppMenu();
    registerIpc();
    createTray();
    // Splash first, then the (hidden) main window. Splash shows
    // instantly; main reveals itself once its `did-finish-load` fires,
    // at which point the splash gracefully fades out.
    createSplashWindow();
    createMainWindow();

    // macOS-only nicety: a proper dock icon. BrowserWindow `icon` only
    // affects the window decoration; for the dock we set it on the app
    // itself. Wrapped in optional chaining because app.dock is
    // undefined on non-mac platforms.
    if (process.platform === "darwin") {
      try {
        app.dock?.setIcon(path.join(ASSETS_DIR, "icon.png"));
      } catch (err) {
        console.warn("[unistack] Could not set dock icon:", err);
      }
    }

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
