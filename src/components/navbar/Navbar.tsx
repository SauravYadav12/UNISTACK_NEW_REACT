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
  InputBase,
} from '@mui/material';
import {
  IconSearch,
  IconCommand,
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
import AttendancePopUp from './AttendancePopUp';
import NotificationBell from './NotificationBell';

interface NavbarProps {
  collapsed: boolean;
  unreadCount: number;
  onOpenNotifications: () => void;
}

function Navbar({ collapsed, unreadCount, onOpenNotifications }: NavbarProps) {
  const theme = useTheme();
  const navigate = useNavigate();
  const { myProfileState, validateLogout, isModuleAllowed, iUser } = useAuth();
  const isDark = theme.palette.mode === 'dark';
  const sidebarWidth = collapsed ? smallDrawerWidth : drawerWidth;

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleOpenMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleCloseMenu = () => setAnchorEl(null);

  const handleLogOut = async () => {
    try {
      logout();
    } catch {}
    validateLogout();
    navigate('/');
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

        {/* Command palette trigger */}
        <Box
          sx={{
            display: { xs: 'none', md: 'flex' },
            alignItems: 'center',
            gap: 1,
            px: 2,
            py: 0.75,
            borderRadius: 3,
            bgcolor: alpha(theme.palette.text.primary, 0.04),
            border: `1px solid ${theme.palette.divider}`,
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            minWidth: 220,
            '&:hover': {
              bgcolor: alpha(theme.palette.text.primary, 0.06),
              borderColor: alpha(theme.palette.primary.main, 0.3),
            },
          }}
          onClick={() => {
            // Will be connected to command palette in Phase 4
          }}
        >
          <IconSearch size={16} color={theme.palette.text.secondary} />
          <InputBase
            placeholder="Search or ask AI..."
            readOnly
            sx={{
              flex: 1,
              fontSize: '0.8125rem',
              color: 'text.secondary',
              cursor: 'pointer',
              '& input': { cursor: 'pointer', p: 0 },
            }}
          />
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 0.25,
              px: 0.75,
              py: 0.25,
              borderRadius: 1.5,
              bgcolor: alpha(theme.palette.text.primary, 0.06),
              fontSize: '0.6875rem',
              fontWeight: 500,
              color: 'text.secondary',
            }}
          >
            <IconCommand size={12} />K
          </Box>
        </Box>

        {/* Attendance popup */}
        <AttendancePopUp />

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
