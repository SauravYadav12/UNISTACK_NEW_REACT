/**
 * Unistack desktop — preload bridge.
 *
 * Exposes a small, typed `window.unistack` API to the renderer via
 * contextBridge. The renderer has contextIsolation=true and
 * nodeIntegration=false, so this is the ONLY channel between the web
 * app and Node/OS APIs. Anything not exposed here is unreachable from
 * the renderer — keep the surface tight.
 *
 * The same web bundle runs in Chrome (where `window.unistack` is
 * undefined) and Electron (where it's the object below). Components
 * detect via `window.unistack !== undefined` through getDesktopBridge()
 * in src/utils/desktopBridge.ts.
 */
import { contextBridge, ipcRenderer } from "electron";

const api = {
  /** Always true when running inside Electron. Components use this as
   *  a cheap "am I desktop?" check without invoking IPC. */
  isDesktop: true as const,

  /** Returns the Electron app's version (from package.json's "version"
   *  field, surfaced by app.getVersion()). Used by the version-check
   *  toast to compare against latest.json's reported version. */
  getVersion: (): Promise<string> => ipcRenderer.invoke("unistack:getVersion"),

  /** Backend URL the shell is currently pointing at. Defaults to
   *  the baked production URL unless overridden via setServerUrl. */
  getServerUrl: (): Promise<string> =>
    ipcRenderer.invoke("unistack:getServerUrl"),

  /** Override the backend URL. `null` clears the override. Triggers an
   *  immediate window reload to the new URL. Used by the hidden
   *  settings dialog for QA/staging routing. */
  setServerUrl: (url: string | null): Promise<boolean> =>
    ipcRenderer.invoke("unistack:setServerUrl", url),

  /** Current login-item state — does Unistack auto-start on boot? */
  getAutoLaunch: (): Promise<boolean> =>
    ipcRenderer.invoke("unistack:getAutoLaunch"),

  /** Toggle auto-launch on system boot. */
  setAutoLaunch: (enabled: boolean): Promise<boolean> =>
    ipcRenderer.invoke("unistack:setAutoLaunch", enabled),

  /** Fully quit Unistack (not minimize-to-tray). The settings dialog
   *  uses this for an explicit Quit affordance — close-button still
   *  minimizes. */
  quit: (): Promise<void> => ipcRenderer.invoke("unistack:quit"),

  /** Fire a native OS notification. `deepLink` is the in-app path to
   *  navigate to when the user clicks the toast. Used by Uchat once it
   *  lands; the IPC surface is in place from Phase 1 so the web bundle
   *  can rely on it being there. */
  notify: (payload: {
    title: string;
    body: string;
    deepLink?: string;
  }): Promise<boolean> => ipcRenderer.invoke("unistack:notify", payload),

  /** Subscribe to deep-link navigations sent by main (tray menu,
   *  notification click). Returns an unsubscribe function. */
  onNavigate: (cb: (path: string) => void): (() => void) => {
    const listener = (_e: unknown, p: string) => cb(p);
    ipcRenderer.on("unistack:navigate", listener);
    return () => ipcRenderer.removeListener("unistack:navigate", listener);
  },
};

contextBridge.exposeInMainWorld("unistack", api);

// Type augmentation lives in src/utils/desktopBridge.ts so the renderer
// gets the same shape. Keeping the surface here as the source of truth.
export type UnistackBridge = typeof api;
