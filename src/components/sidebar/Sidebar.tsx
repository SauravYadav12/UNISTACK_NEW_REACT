import {
  Box,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Tooltip,
  Divider,
  Avatar,
  IconButton,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  alpha,
  useTheme,
} from '@mui/material';
import {
  IconLayoutDashboard,
  IconUserCircle,
  IconChartBar,
  IconMicrophone,
  IconFileText,
  IconUsers,
  IconUsersGroup,
  IconReport,
  IconCoin,
  IconCalendarEvent,
  IconBriefcase,
  IconShieldLock,
  IconUserCog,
  IconCash,
  IconChevronLeft,
  IconChevronRight,
  IconMoon,
  IconSun,
  IconChevronDown,
  IconCalendarStats,
  IconUmbrella,
  IconFolders,
  IconMailCog,
  IconClipboardCheck,
} from '@tabler/icons-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { drawerWidth, smallDrawerWidth } from '../constants';
import { useAuth } from '../../AuthGaurd/AuthContextProvider';
import { useThemeMode } from '../../theme/ThemeProvider';
import {
  HomeModule,
  MarketingModule,
  ModuleGroup,
  EmployeeModule,
  SuperAdminModule,
  moduleKey,
} from '../../utils/accessControlUtil';
import { UserRole } from '../../Interfaces/iUser';
import { tokens } from '../../theme/theme';
import unistack_small_Img from '../../assets/unistack_small.png';

export const reqStatusParamKey = 'reqStatus';

interface NavItem {
  text: string;
  icon: React.ReactNode;
  path: string;
  group?: ModuleGroup;
  module?: string;
  allow?: () => boolean;
  dropDown?: NavItem[];
}

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

const MotionBox = motion.create(Box);

function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const { toggleMode, resolvedMode } = useThemeMode();
  const { isModuleAllowed, iUser, myProfileState } = useAuth();
  const isDark = resolvedMode === 'dark';

  const profile = myProfileState?.data;
  const isSuperAdmin = iUser?.role?.includes(UserRole['super-admin']);

  const isActive = (path: string) => {
    const currentPath = location.pathname + (location.search?.replace('%20', ' ') || '');
    return currentPath === path;
  };

  const isSectionActive = (path: string) => {
    return location.pathname.startsWith(path.split('?')[0]);
  };

  const homeItems: NavItem[] = [
    {
      text: 'Dashboard',
      icon: <IconLayoutDashboard size={20} />,
      path: '/dashboard',
      group: ModuleGroup.Home,
      module: HomeModule.Dashboard,
    },
    {
      text: 'Profile',
      icon: <IconUserCircle size={20} />,
      path: '/profile',
      group: ModuleGroup.Home,
      module: HomeModule.Profile,
    },
    {
      text: 'My Documents',
      icon: <IconCash size={20} />,
      path: '/my-documents',
      // Gated by Home → My Documents so admins can revoke access via the
      // Access Control page. The sidebar's `visibleItems` filter drops any
      // entry whose (group, module) pair isn't allowed for the current role.
      group: ModuleGroup.Home,
      module: HomeModule['My Documents'],
    },
  ];

  const marketingItems: NavItem[] = [
    {
      text: 'Requirements',
      icon: <IconChartBar size={20} />,
      path: '/requirements',
      group: ModuleGroup.Marketing,
      module: MarketingModule.Requirements,
    },
    {
      text: 'Interviews',
      icon: <IconMicrophone size={20} />,
      path: '/interviews',
      group: ModuleGroup.Marketing,
      module: MarketingModule.Interviews,
    },
    {
      text: 'Consultants',
      icon: <IconBriefcase size={20} />,
      path: '/consultants',
      group: ModuleGroup.Marketing,
      module: MarketingModule.Consultants,
    },
    {
      text: 'Teams',
      icon: <IconUsersGroup size={20} />,
      path: '/teams',
      group: ModuleGroup.Marketing,
      module: MarketingModule.Teams,
    },
    {
      text: 'Reports',
      icon: <IconReport size={20} />,
      path: '/reports',
      group: ModuleGroup.Marketing,
      module: MarketingModule.Reports,
    },
    // Sales Leads hidden — not needed
    // {
    //   text: 'Sales Leads',
    //   icon: <IconCoin size={20} />,
    //   path: '/sales-leads',
    //   group: ModuleGroup.Marketing,
    //   module: MarketingModule['Sales Leads'],
    // },
  ];

  // My-Attendance (self-service) still needs to reach admins for their own
  // clock-in view — it used to sit in the Presence section. Keeping it at
  // the bottom of Home feels natural alongside "My Documents".
  const myAttendance: NavItem = {
    text: 'My Attendance',
    icon: <IconCalendarEvent size={20} />,
    path: '/attendance/my-attendance',
    group: ModuleGroup['Presence & Leave'],
    module: EmployeeModule.Attendance,
    allow: () => !isSuperAdmin,
  };

  // HR section — operational, people-ops surfaces.
  const hrItems: NavItem[] = [
    {
      text: 'Attendance',
      icon: <IconCalendarStats size={20} />,
      path: '/attendance/dashboard',
      group: ModuleGroup['Super Admin Modules'],
      module: SuperAdminModule['Attendance Dashboard'],
    },
    {
      text: 'Leave Management',
      icon: <IconUmbrella size={20} />,
      path: '/leaves-management',
      group: ModuleGroup['Presence & Leave'],
      module: EmployeeModule.Leaves,
    },
    {
      text: 'Salary',
      icon: <IconCash size={20} />,
      path: '/salary',
      group: ModuleGroup['Super Admin Modules'],
      module: SuperAdminModule.SalaryManagement,
    },
    {
      text: 'Performance',
      icon: <IconChartBar size={20} />,
      path: '/performance',
      group: ModuleGroup['Super Admin Modules'],
      module: SuperAdminModule['Performance'],
    },
  ];

  const projectsItems: NavItem[] = [
    {
      text: 'Project Management',
      icon: <IconFolders size={20} />,
      path: '/projects',
      group: ModuleGroup['Super Admin Modules'],
      module: SuperAdminModule.Projects,
    },
  ];

  const adminItems: NavItem[] = [
    {
      text: 'User Management',
      icon: <IconUserCog size={20} />,
      path: '/user-management',
      group: ModuleGroup['Super Admin Modules'],
      module: SuperAdminModule['User Management'],
    },
    {
      text: 'Access Control',
      icon: <IconShieldLock size={20} />,
      path: '/access-control',
      group: ModuleGroup['Super Admin Modules'],
      module: SuperAdminModule['Access Control'],
    },
  ];

  // Home picks up my-attendance as the third item for employees — it's a
  // self-service surface, not an HR-ops one, so it belongs with Profile /
  // Documents rather than under HR.
  const homeItemsWithAttendance: NavItem[] = [...homeItems, myAttendance];

  const sections = [
    { label: 'HOME', items: homeItemsWithAttendance },
    { label: 'MARKETING', items: marketingItems },
    { label: 'HR', items: hrItems },
    { label: 'PROJECTS', items: projectsItems },
    { label: 'ADMIN', items: adminItems },
  ];

  const width = collapsed ? smallDrawerWidth : drawerWidth;

  const renderNavItem = (item: NavItem, indent = false) => {
    if (item.allow && !item.allow()) return null;
    if (item.group && item.module &&
      !isModuleAllowed(moduleKey(item.group, item.module))) return null;

    const active = isActive(item.path);

    const button = (
      <ListItemButton
        key={item.text}
        onClick={() => navigate(item.path)}
        sx={{
          minHeight: 40,
          borderRadius: 2.5,
          mx: collapsed ? 0.75 : 1.5,
          px: collapsed ? 1.5 : 2,
          pl: indent && !collapsed ? 4 : undefined,
          mb: 0.25,
          justifyContent: collapsed ? 'center' : 'flex-start',
          bgcolor: active ? alpha(tokens.colors.pink, 0.15) : 'transparent',
          color: active ? tokens.colors.pink : alpha('#FFFFFF', 0.6),
          '&:hover': {
            bgcolor: active
              ? alpha(tokens.colors.pink, 0.2)
              : 'transparent',
            color: '#FFFFFF',
          },
          transition: 'all 0.2s ease',
        }}
      >
        <ListItemIcon
          sx={{
            minWidth: 0,
            mr: collapsed ? 0 : 1.5,
            justifyContent: 'center',
            color: active ? tokens.colors.pink : alpha('#FFFFFF', 0.5),
          }}
        >
          {item.icon}
        </ListItemIcon>
        {!collapsed && (
          <ListItemText
            primary={item.text}
            primaryTypographyProps={{
              fontSize: '0.8125rem',
              fontWeight: active ? 600 : 400,
              noWrap: true,
            }}
          />
        )}
      </ListItemButton>
    );

    if (collapsed) {
      return (
        <Tooltip key={item.text} title={item.text} placement="right" arrow>
          {button}
        </Tooltip>
      );
    }

    return button;
  };

  const renderDropdownItem = (item: NavItem) => {
    if (item.group && item.module &&
      !isModuleAllowed(moduleKey(item.group, item.module))) return null;
    const active = isActive(item.path) || isSectionActive(item.path);

    if (collapsed) {
      return (
        <Tooltip key={item.text} title={item.text} placement="right" arrow>
          {renderNavItem(item)!}
        </Tooltip>
      );
    }

    if (!item.dropDown) return renderNavItem(item);

    return (
      <Accordion
        key={item.text}
        defaultExpanded={isSectionActive(item.path)}
        sx={{
          bgcolor: 'transparent',
          boxShadow: 'none',
          '&:before': { display: 'none' },
          mx: 1.5,
          borderRadius: '10px !important',
        }}
        disableGutters
      >
        <ListItemButton
          onClick={() => navigate(item.path)}
          sx={{
            minHeight: 40,
            borderRadius: 2.5,
            px: 2,
            mb: 0.25,
            bgcolor: active ? alpha(tokens.colors.pink, 0.15) : 'transparent',
            color: active ? tokens.colors.pink : alpha('#FFFFFF', 0.6),
            '&:hover': {
              bgcolor: alpha('#FFFFFF', 0.06),
            },
          }}
        >
          <ListItemIcon
            sx={{
              minWidth: 0,
              mr: 1.5,
              color: active ? 'primary.main' : 'text.secondary',
            }}
          >
            {item.icon}
          </ListItemIcon>
          <ListItemText
            primary={item.text}
            primaryTypographyProps={{
              fontSize: '0.8125rem',
              fontWeight: active ? 600 : 400,
            }}
          />
          <AccordionSummary
            onClick={(e) => e.stopPropagation()}
            sx={{
              m: 0,
              p: 0,
              minHeight: '0px !important',
              '& .MuiAccordionSummary-content': { m: '0 !important' },
              borderRadius: '50%',
              '&:hover': { bgcolor: 'transparent' },
            }}
            expandIcon={
              <IconChevronDown size={16} color={active ? tokens.colors.pink : alpha('#FFFFFF', 0.4)} />
            }
          />
        </ListItemButton>
        <AccordionDetails sx={{ p: 0, pb: 0.5 }}>
          <List disablePadding>
            {item.dropDown.map((sub) => renderNavItem(sub, true))}
          </List>
        </AccordionDetails>
      </Accordion>
    );
  };

  return (
    <MotionBox
      animate={{ width }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        height: '100vh',
        zIndex: (t) => t.zIndex.drawer,
        display: 'flex',
        flexDirection: 'column',
        background: tokens.gradients.sidebar,
        borderRight: `1px solid ${alpha('#FFFFFF', 0.06)}`,
        overflow: 'hidden',
      }}
    >
      {/* Logo — "UNI" + robot mascot (as the 'S') + "TACK" when expanded.
          Collapsed mode shows just the colorful robot.
          Padding in expanded mode matches the nav buttons' (mx: 1.5 + px: 2 = 28px)
          so the "U" of the wordmark lines up with the nav icons below. */}
      <Box
        onClick={() => navigate('/dashboard')}
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'flex-start',
          pl: collapsed ? 1 : 3.5,
          pr: collapsed ? 1 : 2.5,
          pt: 2,
          pb: 1.5,
          cursor: 'pointer',
          minHeight: 56,
          userSelect: 'none',
        }}
      >
        {collapsed ? (
          <img
            src={unistack_small_Img}
            alt="UNISTACK"
            style={{
              width: 32,
              height: 32,
              objectFit: 'contain',
              transition: 'all 0.3s ease',
              flexShrink: 0,
            }}
          />
        ) : (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 0.25,
              lineHeight: 1,
            }}
          >
            <Typography
              component="span"
              sx={{
                color: '#FFFFFF',
                // Orbitron matches the original wordmark's geometric look.
                // Scoped to the logo only so the rest of the app keeps Inter.
                fontFamily: '"Orbitron", "Inter Variable", "Inter", sans-serif',
                fontWeight: 800,
                fontSize: '1.4rem',
                letterSpacing: '0.02em',
                lineHeight: 1,
              }}
            >
              UNI
            </Typography>
            <img
              src={unistack_small_Img}
              alt="S"
              style={{
                width: 30,
                height: 30,
                objectFit: 'contain',
                flexShrink: 0,
                // Nudge down a hair so the stacked robot sits on the text
                // baseline like a lowercase-height glyph would.
                marginBottom: -2,
              }}
            />
            <Typography
              component="span"
              sx={{
                color: '#FFFFFF',
                fontFamily: '"Orbitron", "Inter Variable", "Inter", sans-serif',
                fontWeight: 800,
                fontSize: '1.4rem',
                letterSpacing: '0.02em',
                lineHeight: 1,
              }}
            >
              TACK
            </Typography>
          </Box>
        )}
      </Box>

      <Divider sx={{ mx: collapsed ? 1 : 2, borderColor: alpha('#FFFFFF', 0.08) }} />

      {/* Navigation */}
      <Box
        sx={{
          flex: 1,
          overflowY: 'auto',
          overflowX: 'hidden',
          py: 1,
        }}
      >
        {sections.map(({ label, items }) => {
          const visibleItems = items.filter((item) => {
            if (item.allow && !item.allow()) return false;
            if (!item.group || !item.module) return true;
            return isModuleAllowed(moduleKey(item.group, item.module));
          });
          if (visibleItems.length === 0) return null;

          return (
            <Box key={label}>
              <AnimatePresence>
                {!collapsed && (
                  <MotionBox
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                  >
                    <Typography
                      variant="overline"
                      sx={{
                        px: 3,
                        pt: 2,
                        pb: 0.5,
                        display: 'block',
                        color: alpha('#FFFFFF', 0.35),
                        fontSize: '0.65rem',
                        letterSpacing: '0.1em',
                      }}
                    >
                      {label}
                    </Typography>
                  </MotionBox>
                )}
              </AnimatePresence>

              {collapsed && <Box sx={{ pt: 1 }} />}

              <List disablePadding>
                {items.map((item) =>
                  item.dropDown ? renderDropdownItem(item) : renderNavItem(item)
                )}
              </List>
            </Box>
          );
        })}
      </Box>

      {/* Bottom section */}
      <Box sx={{ mt: 'auto' }}>
        <Divider sx={{ mx: collapsed ? 1 : 2, borderColor: alpha('#FFFFFF', 0.08) }} />

        {/* Theme toggle */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            py: 1,
          }}
        >
          <Tooltip title={isDark ? 'Light mode' : 'Dark mode'} placement="right">
            <IconButton onClick={toggleMode} size="small" sx={{ color: alpha('#FFFFFF', 0.5), '&:hover': { color: tokens.colors.yellow } }}>
              {isDark ? <IconSun size={18} /> : <IconMoon size={18} />}
            </IconButton>
          </Tooltip>
        </Box>

        {/* User mini card */}
        {!collapsed && profile && (
          <Box
            onClick={() => navigate('/profile')}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
              mx: 1.5,
              mb: 1,
              p: 1.5,
              borderRadius: 2.5,
              cursor: 'pointer',
              bgcolor: alpha('#FFFFFF', 0.06),
              '&:hover': {
                bgcolor: alpha('#FFFFFF', 0.1),
              },
              transition: 'background-color 0.2s ease',
            }}
          >
            <Avatar
              sx={{
                width: 32,
                height: 32,
                fontSize: '0.75rem',
                fontWeight: 600,
                bgcolor: tokens.colors.pink,
                color: '#FFFFFF',
              }}
            >
              {iUser?.firstName?.[0]}
              {iUser?.lastName?.[0]}
            </Avatar>
            <Box sx={{ overflow: 'hidden' }}>
              <Typography
                variant="body2"
                fontWeight={600}
                noWrap
                color="#FFFFFF"
                fontSize="0.8rem"
              >
                {iUser?.firstName} {iUser?.lastName}
              </Typography>
              <Typography variant="caption" sx={{ color: alpha('#FFFFFF', 0.5) }} noWrap fontSize="0.7rem">
                {iUser?.role?.[0]?.replace('-', ' ')}
              </Typography>
            </Box>
          </Box>
        )}

        {/* Collapse toggle */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: collapsed ? 'center' : 'flex-end',
            px: 1.5,
            pb: 1.5,
          }}
        >
          <Tooltip title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'} placement="right">
            <IconButton
              onClick={onToggle}
              size="small"
              sx={{
                color: alpha('#FFFFFF', 0.4),
                '&:hover': { color: tokens.colors.blue },
              }}
            >
              {collapsed ? <IconChevronRight size={18} /> : <IconChevronLeft size={18} />}
            </IconButton>
          </Tooltip>
        </Box>
      </Box>
    </MotionBox>
  );
}

export default Sidebar;
