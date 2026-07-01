/**
 * Single seam between the renderer and the Electron preload bridge.
 *
 * In Chrome → `window.unistack` is undefined → `getDesktopBridge()`
 * returns `null` → every desktop-only call short-circuits.
 *
 * In the Electron renderer → `window.unistack` is the object exposed by
 * `electron/preload.ts` via `contextBridge.exposeInMainWorld('unistack', …)`.
 *
 * Components should reach for the bridge through this helper rather than
 * touching `window.unistack` directly — that way:
 *   1. The "am I inside Electron?" check is centralized.
 *   2. TypeScript stays happy in the web bundle (no global declaration
 *      leak into shared code).
 *   3. We can mock the bridge in tests without touching `window`.
 */

export interface DesktopBridge {
  /** Always true when present. Used as a cheap presence check that
   *  avoids re-issuing IPC calls. */
  isDesktop: true;

  /** Electron app version (matches package.json's `"version"` field). */
  getVersion(): Promise<string>;

  /** Current backend URL the shell is loading. */
  getServerUrl(): Promise<string>;

  /** Override the backend URL (or pass `null` to clear and revert to
   *  the baked default). Causes an immediate window reload to the new
   *  URL — used by the hidden settings dialog for QA/staging switching. */
  setServerUrl(url: string | null): Promise<boolean>;

  /** Login-item auto-launch state. */
  getAutoLaunch(): Promise<boolean>;
  setAutoLaunch(enabled: boolean): Promise<boolean>;

  /** Hard quit (skips minimize-to-tray). */
  quit(): Promise<void>;

  /** Fire a native OS notification. `deepLink` is the in-app path the
   *  renderer should navigate to when the user clicks the toast.
   *  Wired up in Phase 1 so Uchat in a later phase can rely on it. */
  notify(payload: {
    title: string;
    body: string;
    deepLink?: string;
  }): Promise<boolean>;

  /** Subscribe to navigation requests from main (tray menu, notification
   *  click). Returns an unsubscribe function — callers should call it on
   *  unmount to avoid leaking listeners across hot-reload. */
  onNavigate(cb: (path: string) => void): () => void;

  /** Bypass-cache reload — clears the HTTP cache first, then reloads
   *  ignoring cache. Escape hatch when the SPA appears stale. */
  hardRefresh(): Promise<boolean>;

  /** Current Chromium zoom level. 0 = 100%. */
  getZoomLevel(): Promise<number>;

  /** Step zoom in / out. Persists via runtimeConfig so the level
   *  survives restarts. Returns the new level. */
  zoomIn(): Promise<number>;
  zoomOut(): Promise<number>;
  /** Snap zoom back to 100%. */
  zoomReset(): Promise<number>;
}

declare global {
  // Augment the renderer's global so TS knows about the bridge when we
  // need to read it. We keep this declaration here (not in a global
  // .d.ts) so it's co-located with the helper and only loaded when this
  // file is imported.
  interface Window {
    unistack?: DesktopBridge;
  }
}

/**
 * Returns the desktop bridge if running inside Electron, otherwise null.
 * Cheap to call — the underlying object is always the same reference.
 */
export function getDesktopBridge(): DesktopBridge | null {
  if (typeof window === "undefined") return null;
  return window.unistack ?? null;
}

/**
 * Cheap presence check that doesn't require an IPC round-trip.
 * Useful for conditional UI ("show the DESKTOP pill", "hide the
 * download banner") that needs to react synchronously on first render.
 */
export function isRunningInDesktop(): boolean {
  return getDesktopBridge() !== null;
}
