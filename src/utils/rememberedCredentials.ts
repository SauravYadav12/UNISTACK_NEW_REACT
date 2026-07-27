/**
 * "Remember me" credentials store.
 *
 * Backed by `localStorage`, which works identically in the browser and
 * inside the Electron desktop shell (Electron persists localStorage per
 * app profile), so both surfaces share the same code path.
 *
 * Security posture — read carefully:
 * - We store the raw email and password so the login form can auto-fill.
 * - localStorage is readable by any script running on this origin, so a
 *   successful XSS on the app could exfiltrate credentials. This is the
 *   standard "remember me" tradeoff — the same threat that already
 *   applies to the JWT stored under `token`.
 * - Password is base64-obfuscated on disk. This is NOT encryption — it
 *   just avoids casual eye-reads if someone opens DevTools ➜ Storage on
 *   an unlocked machine. Do not treat the on-disk value as protected.
 * - If we want real protection later, wire this to Electron's
 *   `safeStorage` (OS keychain / DPAPI) via the preload bridge.
 */

const KEY = 'unistack.rememberedLogin.v1';

export interface RememberedCredentials {
  email: string;
  password: string;
}

interface Stored {
  email?: string;
  /** base64-encoded password (not encryption — see file header). */
  p64?: string;
}

function safeParse(raw: string | null): Stored | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object') return parsed as Stored;
    return null;
  } catch {
    return null;
  }
}

/** Returns saved credentials, or `null` when nothing was ever remembered. */
export function loadRememberedCredentials(): RememberedCredentials | null {
  try {
    const stored = safeParse(localStorage.getItem(KEY));
    if (!stored || !stored.email || !stored.p64) return null;
    // atob may throw if the value was tampered with — decodeURIComponent
    // + a UTF-8 dance handles non-ASCII passwords cleanly.
    const password = decodeURIComponent(
      Array.prototype.map
        .call(atob(stored.p64), (c: string) =>
          '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2),
        )
        .join(''),
    );
    return { email: stored.email, password };
  } catch {
    return null;
  }
}

/**
 * Persist the credentials. Only call when the user has actively opted
 * in via the "Remember me" checkbox.
 */
export function saveRememberedCredentials(creds: RememberedCredentials): void {
  try {
    const bytes = new TextEncoder().encode(creds.password);
    let bin = '';
    for (const byte of bytes) bin += String.fromCharCode(byte);
    const p64 = btoa(bin);
    localStorage.setItem(KEY, JSON.stringify({ email: creds.email, p64 }));
  } catch {
    // localStorage quota / privacy mode → silent no-op.
  }
}

export function clearRememberedCredentials(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* silent */
  }
}

/** Whether the user has ever saved credentials on this device. */
export function hasRememberedCredentials(): boolean {
  return loadRememberedCredentials() !== null;
}
