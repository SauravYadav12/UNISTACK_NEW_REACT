import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Box, CircularProgress, useMediaQuery, useTheme } from '@mui/material';
import { Suspense, useCallback, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from '../navbar/Navbar';
import Sidebar from '../sidebar/Sidebar';
import { drawerWidth, smallDrawerWidth, navbarHeight } from '../constants';
import { useAuth } from '../../AuthGaurd/AuthContextProvider';
import { pageVariants } from '../../theme/animations';
import { useNotifications } from '../../hooks/useNotifications';
import NotificationDrawer from '../notifications/NotificationDrawer';
import DesktopSettingsDialog from '../desktop/DesktopSettingsDialog';
import VersionUpdateToast from '../desktop/VersionUpdateToast';
import { getDesktopBridge } from '../../utils/desktopBridge';

const MotionBox = motion.create(Box);

function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { myProfileState, myAttendanceState } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [desktopSettingsOpen, setDesktopSettingsOpen] = useState(false);
  const notifications = useNotifications();

  // Desktop-only wiring — keyboard shortcut + deep-link navigation
  // listener. Both register only when running inside Electron so the
  // web bundle stays inert. Cleanup unsubscribes on unmount.
  useEffect(() => {
    const bridge = getDesktopBridge();
    if (!bridge) return;
    function handleKey(e: KeyboardEvent) {
      // Cmd+Shift+, (mac) / Ctrl+Shift+, (win+linux). Modifier check
      // mirrors the OS-conventional "Preferences" shortcut.
      const modifier = e.metaKey || e.ctrlKey;
      if (modifier && e.shiftKey && e.key === ',') {
        e.preventDefault();
        setDesktopSettingsOpen(true);
      }
    }
    window.addEventListener('keydown', handleKey);
    // Deep-link from tray / notification click → bring the user to the
    // requested in-app path without a full page reload.
    const unsub = bridge.onNavigate((p) => navigate(p));
    return () => {
      window.removeEventListener('keydown', handleKey);
      unsub();
    };
  }, [navigate]);

  useEffect(() => {
    !myProfileState.data && myProfileState.loadData();
    // Re-fetch today's attendance on every navigation so admin status
    // edits (e.g. super-admin flipping a record from Present → Half-Day
    // via the dashboard) become visible to the employee without a
    // full re-login. Previously the state was loaded once at auth-init
    // and never refreshed, which caused the "super-admin sees half-day,
    // employee sees present" complaint.
    myAttendanceState.loadData();
  }, [location]);

  // Auto-collapse on smaller screens. The resize event fires
  // continuously while the user drags the browser edge, so we
  // coalesce updates onto the next animation frame — same end-state,
  // 1 setState per frame instead of dozens, which keeps the sidebar
  // and content area from re-rendering on every pixel of drag.
  useEffect(() => {
    let frame = 0;
    const handleResize = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        setCollapsed(window.innerWidth < 1024);
      });
    };
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => {
      window.removeEventListener('resize', handleResize);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  const sidebarWidth = collapsed ? smallDrawerWidth : drawerWidth;
  // Stable identity — Sidebar is a 680-line subtree and shouldn't see
  // a fresh `onToggle` reference each render.
  const handleToggleSidebar = useCallback(
    () => setCollapsed((prev) => !prev),
    [],
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      <Sidebar collapsed={collapsed} onToggle={handleToggleSidebar} />

      <Navbar
        collapsed={collapsed}
        unreadCount={notifications.unreadCount}
        onOpenNotifications={notifications.openDrawer}
      />

      <NotificationDrawer
        open={notifications.drawerOpen}
        onClose={notifications.closeDrawer}
        items={notifications.items}
        loading={notifications.loading}
        markRead={notifications.markRead}
        markAllRead={notifications.markAllRead}
        removeOne={notifications.removeOne}
        clearAll={notifications.clearAll}
      />

      {/* Desktop-only chrome: settings dialog (keyboard-triggered) +
          new-version toast. Both internally short-circuit in browser
          context, so they're safe to mount unconditionally here. */}
      <DesktopSettingsDialog
        open={desktopSettingsOpen}
        onClose={() => setDesktopSettingsOpen(false)}
      />
      <VersionUpdateToast />

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          ml: `${sidebarWidth}px`,
          mt: `${navbarHeight}px`,
          transition: 'margin-left 0.3s cubic-bezier(0.22, 1, 0.36, 1)',
          minHeight: `calc(100vh - ${navbarHeight}px)`,
          overflow: 'auto',
        }}
      >
        <AnimatePresence mode="wait">
          <MotionBox
            key={location.pathname}
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            sx={{
              px: { xs: 2, sm: 2.5, md: 3 },
              py: { xs: 2, sm: 2.5 },
              maxWidth: 1600,
              mx: 'auto',
            }}
          >
            {/* Inner Suspense — boundary lives BELOW the sidebar +
                navbar so a lazy page chunk fetch only swaps the
                content area for a spinner. Without this, the outer
                Suspense in App.tsx would unmount the whole layout
                during a chunk download (making navigation look like a
                full-page reload). */}
            <Suspense
              fallback={
                <Box
                  sx={{
                    minHeight: '50vh',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <CircularProgress size={26} />
                </Box>
              }
            >
              <Outlet />
            </Suspense>
          </MotionBox>
        </AnimatePresence>
      </Box>
    </Box>
  );
}

export default Layout;
