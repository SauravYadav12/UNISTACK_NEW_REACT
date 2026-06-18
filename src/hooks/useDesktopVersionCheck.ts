/**
 * Detects when a newer Unistack desktop shell has been published on DO
 * Spaces and signals the UI to nudge the user toward `/download`.
 *
 * The hook is inert in browsers — `getDesktopBridge()` is null there
 * and the function returns `{ updateAvailable: false }` so callers
 * (currently <VersionUpdateToast />) render nothing.
 *
 * Polling cadence:
 *   - Once on mount
 *   - On every window focus (catches "I came back from lunch and a new
 *     release dropped")
 *   - Every 6 hours as a safety net for long-running windows
 *
 * Per-version dismissal:
 *   - "Remind me later" sets `unistack.desktopUpdateDismissed.<version>`
 *     in localStorage. The toast hides for that specific version, but a
 *     NEWER release re-prompts because the key is keyed on the version.
 *   - This is the standard pattern used by Slack/VS Code so users don't
 *     get spammed for a release they already declined but DO get
 *     reminded when something new drops.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { getDesktopBridge } from '../utils/desktopBridge';

const LATEST_URL =
  'https://blr1.digitaloceanspaces.com/unistack-migrated-from-gcp/desktop/latest.json';
const POLL_INTERVAL_MS = 6 * 60 * 60 * 1000; // 6 hours
const DISMISS_KEY_PREFIX = 'unistack.desktopUpdateDismissed.';

interface LatestPayload {
  version: string;
  releasedAt: string;
  mac: { url: string; sizeBytes: number };
  win: { url: string; sizeBytes: number };
  notes: string;
}

export interface VersionCheckState {
  /** True only when the latest published version is strictly newer than
   *  the installed shell AND the user hasn't dismissed it for that
   *  specific version. */
  updateAvailable: boolean;
  currentVersion: string;
  latestVersion: string;
  notes: string;
  /** Resolved download URL for the user's OS. Calculated by the toast
   *  off `navigator.platform` to avoid a per-render decision in the hook. */
  latestPayload: LatestPayload | null;
  /** Mark the current latest version as "remind me later". Subsequent
   *  re-checks won't flip `updateAvailable` to true until a NEWER
   *  version is published. */
  dismiss(): void;
}

/**
 * Lightweight semver-major.minor.patch compare. We control `latest.json`
 * so we don't deal with prereleases or build metadata — strict numeric
 * compare of three dot-separated parts is enough.
 */
function isStrictlyGreater(candidate: string, baseline: string): boolean {
  const a = candidate.split('.').map((n) => Number.parseInt(n, 10));
  const b = baseline.split('.').map((n) => Number.parseInt(n, 10));
  for (let i = 0; i < 3; i++) {
    const av = Number.isFinite(a[i]) ? a[i] : 0;
    const bv = Number.isFinite(b[i]) ? b[i] : 0;
    if (av !== bv) return av > bv;
  }
  return false;
}

function readDismissed(version: string): boolean {
  if (!version) return false;
  try {
    return localStorage.getItem(DISMISS_KEY_PREFIX + version) === 'true';
  } catch {
    return false;
  }
}

function writeDismissed(version: string) {
  try {
    localStorage.setItem(DISMISS_KEY_PREFIX + version, 'true');
  } catch {
    // localStorage disabled / quota exceeded → in-memory only.
  }
}

export function useDesktopVersionCheck(): VersionCheckState {
  const bridge = getDesktopBridge();
  const [currentVersion, setCurrentVersion] = useState<string>('');
  const [latestPayload, setLatestPayload] = useState<LatestPayload | null>(null);
  // Bumping this state-tick re-evaluates `updateAvailable` even when
  // the underlying data hasn't changed — used by `dismiss()`.
  const [dismissedTick, setDismissedTick] = useState(0);
  // Avoid concurrent fetches if focus + interval fire at the same time.
  const inFlightRef = useRef(false);

  const fetchLatest = useCallback(async () => {
    if (inFlightRef.current) return;
    inFlightRef.current = true;
    try {
      const res = await fetch(LATEST_URL, { cache: 'no-cache' });
      if (!res.ok) return;
      const data: LatestPayload = await res.json();
      if (data?.version) setLatestPayload(data);
    } catch (err) {
      // Network error / DNS / S3 hiccup — silent fail. Next focus or
      // interval will retry. We don't surface this because failing to
      // check for an update isn't worth a user-facing error toast.
      console.warn('[version-check] fetch failed', err);
    } finally {
      inFlightRef.current = false;
    }
  }, []);

  // 1) Resolve installed shell version (one IPC round-trip, cached).
  useEffect(() => {
    if (!bridge) return;
    bridge.getVersion().then(setCurrentVersion).catch(() => {
      /* swallow — we'll re-derive later if a re-render fires getVersion again */
    });
  }, [bridge]);

  // 2) Wire fetch lifecycle: mount + focus + 6h interval.
  useEffect(() => {
    if (!bridge) return;
    fetchLatest();
    const onFocus = () => fetchLatest();
    window.addEventListener('focus', onFocus);
    const id = window.setInterval(fetchLatest, POLL_INTERVAL_MS);
    return () => {
      window.removeEventListener('focus', onFocus);
      window.clearInterval(id);
    };
  }, [bridge, fetchLatest]);

  const latestVersion = latestPayload?.version ?? '';
  const notes = latestPayload?.notes ?? '';

  // Derive `updateAvailable` from current + latest + dismiss state.
  // Touch `dismissedTick` in the dependency list so dismiss() triggers
  // a re-derivation without re-fetching.
  const updateAvailable = (() => {
    if (!bridge) return false;
    if (!currentVersion || !latestVersion) return false;
    if (!isStrictlyGreater(latestVersion, currentVersion)) return false;
    if (readDismissed(latestVersion)) return false;
    // Read tick to keep the eslint exhaustive-deps gods happy without
    // pulling it through a useMemo.
    void dismissedTick;
    return true;
  })();

  const dismiss = useCallback(() => {
    if (!latestVersion) return;
    writeDismissed(latestVersion);
    setDismissedTick((t) => t + 1);
  }, [latestVersion]);

  return {
    updateAvailable,
    currentVersion,
    latestVersion,
    notes,
    latestPayload,
    dismiss,
  };
}
