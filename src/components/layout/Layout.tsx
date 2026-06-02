import { Outlet, useLocation } from 'react-router-dom';
import { Box, useMediaQuery, useTheme } from '@mui/material';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from '../navbar/Navbar';
import Sidebar from '../sidebar/Sidebar';
import { drawerWidth, smallDrawerWidth, navbarHeight } from '../constants';
import { useAuth } from '../../AuthGaurd/AuthContextProvider';
import { pageVariants } from '../../theme/animations';
import { useNotifications } from '../../hooks/useNotifications';
import NotificationDrawer from '../notifications/NotificationDrawer';

const MotionBox = motion.create(Box);

function Layout() {
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { myProfileState, myAttendanceState } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const notifications = useNotifications();

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

  // Auto-collapse on smaller screens
  useEffect(() => {
    const handleResize = () => {
      setCollapsed(window.innerWidth < 1024);
    };
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const sidebarWidth = collapsed ? smallDrawerWidth : drawerWidth;

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />

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
            <Outlet />
          </MotionBox>
        </AnimatePresence>
      </Box>
    </Box>
  );
}

export default Layout;
