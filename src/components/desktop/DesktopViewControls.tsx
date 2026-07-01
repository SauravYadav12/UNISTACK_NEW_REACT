/**
 * Compact icon cluster for Electron-only view controls: hard refresh
 * (clears cache + reloads ignoring cache) and zoom in / out / reset.
 *
 * Renders NOTHING in the web build — self-checks `isRunningInDesktop`
 * so it's safe to mount unconditionally in the shared Navbar.
 *
 * Zoom state is fetched once on mount and re-read after every
 * mutation so the % label stays in sync. The main process persists
 * the level to `runtimeConfig.zoomLevel` and reapplies it on every
 * `did-finish-load`, so refreshes don't blow the user's chosen size.
 */
import { Box, IconButton, Tooltip, alpha } from '@mui/material';
import { useCallback, useEffect, useState } from 'react';
import {
  IconRefresh,
  IconZoomIn,
  IconZoomOut,
} from '@tabler/icons-react';
import { tokens } from '../../theme/theme';
import { getDesktopBridge, isRunningInDesktop } from '../../utils/desktopBridge';

/** Chromium's log-scale zoom: percent = 1.2^level. Rounded so the UI
 *  reads clean values (100 %, 110 %, 120 %, …). */
function zoomLevelToPercent(level: number): number {
  return Math.round(Math.pow(1.2, level) * 100);
}

export default function DesktopViewControls() {
  const [zoomPct, setZoomPct] = useState<number>(100);

  const readZoom = useCallback(async () => {
    const bridge = getDesktopBridge();
    if (!bridge) return;
    try {
      const lvl = await bridge.getZoomLevel();
      setZoomPct(zoomLevelToPercent(lvl));
    } catch {
      /* main process died or hard-refresh raced — leave label stale */
    }
  }, []);

  useEffect(() => {
    void readZoom();
  }, [readZoom]);

  if (!isRunningInDesktop()) return null;

  async function handleRefresh() {
    const bridge = getDesktopBridge();
    if (!bridge) return;
    try {
      await bridge.hardRefresh();
    } catch {
      /* window is being torn down for the reload */
    }
  }
  async function handleZoomIn() {
    const bridge = getDesktopBridge();
    if (!bridge) return;
    const lvl = await bridge.zoomIn();
    setZoomPct(zoomLevelToPercent(lvl));
  }
  async function handleZoomOut() {
    const bridge = getDesktopBridge();
    if (!bridge) return;
    const lvl = await bridge.zoomOut();
    setZoomPct(zoomLevelToPercent(lvl));
  }
  async function handleZoomReset() {
    const bridge = getDesktopBridge();
    if (!bridge) return;
    const lvl = await bridge.zoomReset();
    setZoomPct(zoomLevelToPercent(lvl));
  }

  return (
    <Box
      sx={{
        display: { xs: 'none', sm: 'inline-flex' },
        alignItems: 'center',
        gap: 0.25,
        px: 0.5,
        py: 0.25,
        borderRadius: 2,
        border: `1px solid ${alpha(tokens.colors.blue, 0.2)}`,
        bgcolor: alpha(tokens.colors.blue, 0.04),
      }}
    >
      <Tooltip title="Reload · clears cache first">
        <IconButton size="small" onClick={handleRefresh} sx={{ color: tokens.colors.blueDark }}>
          <IconRefresh size={16} />
        </IconButton>
      </Tooltip>
      <Tooltip title="Zoom out">
        <IconButton size="small" onClick={handleZoomOut} sx={{ color: tokens.colors.blueDark }}>
          <IconZoomOut size={16} />
        </IconButton>
      </Tooltip>
      <Tooltip title="Reset zoom to 100%">
        <Box
          component="button"
          onClick={handleZoomReset}
          sx={{
            all: 'unset',
            cursor: 'pointer',
            minWidth: 34,
            textAlign: 'center',
            fontSize: 10.5,
            fontWeight: 800,
            color: tokens.colors.blueDark,
            letterSpacing: 0.4,
            px: 0.25,
            borderRadius: 1,
            '&:hover': { bgcolor: alpha(tokens.colors.blue, 0.08) },
          }}
        >
          {zoomPct}%
        </Box>
      </Tooltip>
      <Tooltip title="Zoom in">
        <IconButton size="small" onClick={handleZoomIn} sx={{ color: tokens.colors.blueDark }}>
          <IconZoomIn size={16} />
        </IconButton>
      </Tooltip>
    </Box>
  );
}
