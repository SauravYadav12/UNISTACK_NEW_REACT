/**
 * Global "open the desktop-download modal" affordance.
 *
 * Mounted once at the Layout level so any descendant (navbar button,
 * dashboard banner, version-update toast, settings dialog, etc.) can
 * pop the modal via the `useDesktopDownload()` hook without prop
 * drilling or per-component state. Single source of truth for the
 * modal's open state — closing it once closes it everywhere.
 *
 * The /download route still renders its own page version for shareable
 * external links; this provider only powers in-app affordances.
 */
import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import DesktopDownloadDialog from '../components/desktop/DesktopDownloadDialog';

interface DesktopDownloadContextValue {
  openDownloadDialog(): void;
  closeDownloadDialog(): void;
  isOpen: boolean;
}

const DesktopDownloadContext = createContext<DesktopDownloadContextValue | null>(
  null,
);

export function DesktopDownloadProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const openDownloadDialog = useCallback(() => setOpen(true), []);
  const closeDownloadDialog = useCallback(() => setOpen(false), []);

  const value = useMemo<DesktopDownloadContextValue>(
    () => ({ openDownloadDialog, closeDownloadDialog, isOpen: open }),
    [openDownloadDialog, closeDownloadDialog, open],
  );

  return (
    <DesktopDownloadContext.Provider value={value}>
      {children}
      <DesktopDownloadDialog open={open} onClose={closeDownloadDialog} />
    </DesktopDownloadContext.Provider>
  );
}

/**
 * Read the desktop-download modal controls from context. Throws if used
 * outside the provider — mounting the provider at Layout means every
 * authenticated tree has access, so a missing provider means a bug
 * (e.g. someone tried to call this from a public route).
 */
export function useDesktopDownload(): DesktopDownloadContextValue {
  const v = useContext(DesktopDownloadContext);
  if (!v) {
    throw new Error(
      'useDesktopDownload() must be called inside <DesktopDownloadProvider>',
    );
  }
  return v;
}
