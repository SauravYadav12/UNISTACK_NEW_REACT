import {
  AppBar,
  Toolbar,
  Box,
  IconButton,
  Avatar,
  Menu,
  MenuItem,
  Typography,
  Tooltip,
  Divider,
  alpha,
  useTheme,
} from '@mui/material';
import {
  IconLogout,
  IconUserCircle,
  IconLayoutDashboard,
} from '@tabler/icons-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { drawerWidth, smallDrawerWidth, navbarHeight } from '../constants';
import { useAuth } from '../../AuthGaurd/AuthContextProvider';
import { logout } from '../../services/authApi';
import {
  ModuleGroup,
  HomeModule,
  moduleKey,
} from '../../utils/accessControlUtil';
import { tokens } from '../../theme/theme';
import Breadcrumbs from './Breadcrumbs';
import CheckInTimer from './CheckInTimer';
import AttendancePopUp from './AttendancePopUp';
import NotificationBell from './NotificationBell';
import DesktopDownloadButton from '../desktop/DesktopDownloadButton';
import DesktopViewControls from '../desktop/DesktopViewControls';
import { isRunningInDesktop } from '../../utils/desktopBridge';
import { useCheckIn } from '../../contextProviders/CheckInProvider';

interface NavbarProps {
  collapsed: boolean;
  unreadCount: number;
  onOpenNotifications: () => void;
}

function Navbar({ collapsed, unreadCount, onOpenNotifications }: NavbarProps) {
  const theme = useTheme();
  const navigate = useNavigate();
  const { myProfileState, validateLogout, isModuleAllowed, iUser } = useAuth();
  const { isCheckedIn, doCheckOut } = useCheckIn();
  const isDark = theme.palette.mode === 'dark';
  const sidebarWidth = collapsed ? smallDrawerWidth : drawerWidth;

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleOpenMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleCloseMenu = () => setAnchorEl(null);

  const handleLogOut = async () => {
    // Logout implies checkout — stop the working-hours timer and record
    // the session as logout-closed before the token is cleared. Best-effort:
    // never block logout on it.
    if (isCheckedIn) {
      try {
        await doCheckOut('logout');
      } catch {}
    }
    try {
      logout();
    } catch {}
    validateLogout();
    // Go straight to /login — what the user actually wants after they
    // log out. Previously navigated to `/` (the marketing Landing
    // page), which renders fine in the browser but shows as a blank
    // BrowserWindow inside the desktop Electron shell (the Landing
    // page's complex animation / redirect logic doesn't kick in
    // reliably there). /login is the same destination Login.tsx and
    // ProtectedRoute already route to, so behavior is consistent
    // across web + desktop.
    navigate('/login');
  };

  return (
    <AppBar
      elevation={0}
      sx={{
        position: 'fixed',
        top: 0,
        left: sidebarWidth,
        width: `calc(100% - ${sidebarWidth}px)`,
        height: navbarHeight,
        bgcolor: isDark
          ? alpha(tokens.colors.darkBg, 0.85)
          : alpha('#FFFFFF', 0.82),
        backdropFilter: tokens.glass.blur,
        WebkitBackdropFilter: tokens.glass.blur,
        borderBottom: `1px solid ${theme.palette.divider}`,
        transition: 'left 0.3s cubic-bezier(0.22, 1, 0.36, 1), width 0.3s cubic-bezier(0.22, 1, 0.36, 1)',
        color: 'text.primary',
      }}
    >
      <Toolbar
        sx={{
          minHeight: `${navbarHeight}px !important`,
          px: { xs: 2, sm: 3 },
          gap: 2,
        }}
      >
        {/* Breadcrumbs */}
        <Box sx={{ flexShrink: 0 }}>
          <Breadcrumbs />
        </Box>

        <Box sx={{ flexGrow: 1 }} />

        {/* Working-hours check-in timer + button (employees only) */}
        <CheckInTimer />

        {/* Legacy 9AM auto-popup check-in modal host (renders no buttons of
            its own; a modal check-in bridges into the timer/session). */}
        <AttendancePopUp />

        {/* Always-on "Download app" button for web users — self-hides
            inside Electron. Auto-detects OS to show the right icon
            (Apple on mac, Windows on win) so the affordance feels
            tailored to the user's device. */}
        <DesktopDownloadButton />

        {/* Electron-only: reload + zoom controls. Renders null in the
            web build, so it's safe to mount unconditionally. */}
        <DesktopViewControls />

        {/* DESKTOP pill — only renders inside Electron. Visually faint
            so it sits at the same weight as the search box but is
            unmistakable in support tickets ("are you on desktop or
            web?"). Click is a no-op for now; the settings dialog is
            still accessed via Cmd/Ctrl+Shift+, keyboard shortcut. */}
        {isRunningInDesktop() && (
          <Tooltip title="You're using the Unistack desktop app. Press ⌘/Ctrl + Shift + , for settings.">
            <Box
              sx={{
                display: { xs: 'none', sm: 'inline-flex' },
                alignItems: 'center',
                gap: 0.5,
                px: 1,
                py: 0.35,
                borderRadius: 2,
                bgcolor: alpha(tokens.colors.blue, 0.1),
                color: tokens.colors.blueDark,
                border: `1px solid ${alpha(tokens.colors.blue, 0.25)}`,
                fontSize: 9.5,
                fontWeight: 800,
                letterSpacing: 0.6,
                textTransform: 'uppercase',
              }}
            >
              Desktop
            </Box>
          </Tooltip>
        )}

        {/* Notification bell */}
        <NotificationBell
          unreadCount={unreadCount}
          onClick={onOpenNotifications}
        />

        {/* User avatar & menu */}
        <Tooltip title="Account">
          <IconButton onClick={handleOpenMenu} size="small" sx={{ ml: 0.5 }}>
            <Avatar
              src={myProfileState?.data?.photo}
              sx={{
                width: 34,
                height: 34,
                fontSize: '0.8rem',
                fontWeight: 600,
                bgcolor: 'primary.main',
                color: 'primary.contrastText',
              }}
            >
              {iUser?.firstName?.[0]}
            </Avatar>
          </IconButton>
        </Tooltip>

        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleCloseMenu}
          transformOrigin={{ horizontal: 'right', vertical: 'top' }}
          anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
          slotProps={{
            paper: {
              sx: {
                mt: 1,
                minWidth: 180,
              },
            },
          }}
        >
          <Box sx={{ px: 2, py: 1.5 }}>
            <Typography variant="body2" fontWeight={600}>
              {iUser?.firstName} {iUser?.lastName}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {iUser?.email}
            </Typography>
          </Box>
          <Divider />

          {isModuleAllowed(moduleKey(ModuleGroup.Home, HomeModule.Dashboard)) && (
            <MenuItem
              onClick={() => {
                navigate('/dashboard');
                handleCloseMenu();
              }}
            >
              <IconLayoutDashboard size={16} style={{ marginRight: 10 }} />
              Dashboard
            </MenuItem>
          )}

          {isModuleAllowed(moduleKey(ModuleGroup.Home, HomeModule.Profile)) && (
            <MenuItem
              onClick={() => {
                navigate('/profile');
                handleCloseMenu();
              }}
            >
              <IconUserCircle size={16} style={{ marginRight: 10 }} />
              Profile
            </MenuItem>
          )}

          <Divider />
          <MenuItem
            onClick={() => {
              handleLogOut();
              handleCloseMenu();
            }}
            sx={{ color: 'error.main' }}
          >
            <IconLogout size={16} style={{ marginRight: 10 }} />
            Logout
          </MenuItem>
        </Menu>
      </Toolbar>
    </AppBar>
  );
}

export default Navbar;
