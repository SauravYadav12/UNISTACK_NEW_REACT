import {
  Box,
  Typography,
  FormControlLabel,
  CircularProgress,
  IconButton,
  Tooltip,
  Grid,
  alpha,
  LinearProgress,
  Chip,
  Stack,
} from '@mui/material';
import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Android12Switch as Switch } from '../Marketing/Profile/constants';
import { UserRole } from '../../Interfaces/iUser';
import {
  iAccessControl,
  ArchiveModule,
  EmployeeModule,
  HomeModule,
  MarketingModule,
  moduleKey,
  SuperAdminModule,
  ModuleGroup,
} from '../../utils/accessControlUtil';
import { useFetchData } from '../../hooks/fetchDataHook';
import {
  getAccessControl,
  updateAccessControl,
} from '../../services/accessControlApi';
import { Sync } from '@mui/icons-material';
import { toast } from 'react-toastify';
import {
  IconShieldLock,
  IconUser,
  IconUserCircle,
  IconBriefcase,
  IconHome,
  IconChartBar,
  IconArchive,
  IconCalendarEvent,
  IconCrown,
  IconCheck,
  IconChessKnight,
} from '@tabler/icons-react';
import { tokens } from '../../theme/theme';

const MotionBox = motion.create(Box);
const MotionGrid = motion.create(Grid);

// Module group visual config — unique color + icon per group
const groupConfig: Record<ModuleGroup, { color: string; icon: React.ReactNode; description: string }> = {
  [ModuleGroup.Home]: {
    color: '#37B7EA',
    icon: <IconHome size={18} />,
    description: 'Dashboard and profile access',
  },
  [ModuleGroup.Marketing]: {
    color: '#EC4599',
    icon: <IconChartBar size={18} />,
    description: 'Sales, requirements, interviews',
  },
  [ModuleGroup.Archive]: {
    color: '#94A3B8',
    icon: <IconArchive size={18} />,
    description: 'Archived records',
  },
  [ModuleGroup['Presence & Leave']]: {
    color: '#10B981',
    icon: <IconCalendarEvent size={18} />,
    description: 'Attendance & leaves',
  },
  [ModuleGroup['Super Admin Modules']]: {
    color: '#F59E0B',
    icon: <IconCrown size={18} />,
    description: 'Administrative controls',
  },
};

// Role visual config — icon + human-readable label
const roleConfig: Partial<Record<UserRole, { icon: React.ReactNode; label: string; description: string }>> = {
  [UserRole.user]: { icon: <IconUser size={18} />, label: 'User', description: 'Standard employee access' },
  [UserRole.admin]: { icon: <IconBriefcase size={18} />, label: 'Admin', description: 'Administrative capabilities' },
  [UserRole.hr]: { icon: <IconUserCircle size={18} />, label: 'HR', description: 'Human resources team' },
  [UserRole['chess-sales']]: {
    icon: <IconChessKnight size={18} />,
    label: 'Chess Sales',
    description: 'Manages chess-academy subscription pipeline',
  },
};

const AccessControl = () => {
  const tabs = Object.values(UserRole).filter(
    (r) => r !== UserRole['super-admin']
  );
  const moduleGroups: { [key in ModuleGroup]: string[] } = useMemo(
    () => ({
      [ModuleGroup.Home]: Object.values(HomeModule),
      [ModuleGroup.Marketing]: Object.values(MarketingModule),
      [ModuleGroup.Archive]: Object.values(ArchiveModule),
      [ModuleGroup['Presence & Leave']]: Object.values(EmployeeModule),
      [ModuleGroup['Super Admin Modules']]: Object.values(SuperAdminModule),
    }),
    []
  );
  const [activeRole, setActiveRole] = useState<UserRole>(tabs[0]);

  const {
    loading,
    error,
    data: accessControl,
    setData: setAccessControl,
    loadData,
  } = useFetchData<iAccessControl>(async () => {
    const { data } = await getAccessControl();
    return data.data!;
  }, []);

  const handleModuleToggle = async (
    role: UserRole,
    moduleGroup: ModuleGroup,
    module: string,
    checked: boolean
  ) => {
    if (!accessControl) return;
    const key = moduleKey(moduleGroup, module);

    const pre = { ...accessControl };
    try {
      const updatedAccess = { ...accessControl };
      if (checked) {
        if (!updatedAccess[role]?.includes(key)) {
          updatedAccess[role] = [...(updatedAccess[role] || []), key];
        }
      } else {
        updatedAccess[role] =
          updatedAccess[role]?.filter((item) => item !== key) || [];
      }
      setAccessControl(updatedAccess);
      await updateAccessControl(accessControl._id, updatedAccess);
    } catch (error) {
      setAccessControl(pre);
      toast.error('Failed to update');
      console.log(error);
    }
  };

  const handleGroupToggle = async (
    role: UserRole,
    moduleGroup: ModuleGroup,
    enableAll: boolean
  ) => {
    if (!accessControl) return;
    const pre = { ...accessControl };
    try {
      const updated = { ...accessControl };
      const existing = new Set(updated[role] || []);
      const groupKeys = moduleGroups[moduleGroup].map((m) => moduleKey(moduleGroup, m));
      if (enableAll) {
        groupKeys.forEach((k) => existing.add(k));
      } else {
        groupKeys.forEach((k) => existing.delete(k));
      }
      updated[role] = Array.from(existing);
      setAccessControl(updated);
      await updateAccessControl(accessControl._id, updated);
    } catch (err) {
      setAccessControl(pre);
      toast.error('Failed to update');
      console.log(err);
    }
  };

  const isModuleAllowed = (
    role: UserRole,
    moduleGroup: ModuleGroup,
    module: string
  ): boolean => {
    const key = moduleKey(moduleGroup, module);
    if (accessControl && Array.isArray(accessControl[role])) {
      return accessControl[role]?.includes(key) || false;
    }
    return false;
  };

  const roleStats = (role: UserRole) => {
    let total = 0;
    let granted = 0;
    (Object.keys(moduleGroups) as ModuleGroup[]).forEach((group) => {
      moduleGroups[group].forEach((module) => {
        total++;
        if (isModuleAllowed(role, group, module)) granted++;
      });
    });
    return { total, granted };
  };

  const groupStats = (role: UserRole, group: ModuleGroup) => {
    const total = moduleGroups[group].length;
    const granted = moduleGroups[group].filter((m) => isModuleAllowed(role, group, m)).length;
    return { total, granted };
  };

  if (loading || !accessControl) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', py: 10 }}>
        <Typography color="error" mb={1}>{error}</Typography>
        <IconButton onClick={loadData}>
          <Sync color="primary" />
        </IconButton>
      </Box>
    );
  }

  const activeRoleStats = roleStats(activeRole);

  return (
    <Box>
      {/* Hero header */}
      <MotionBox
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        sx={{ mb: 3 }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
              <Box
                sx={{
                  width: 44,
                  height: 44,
                  borderRadius: 3,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: tokens.gradients.pinkBlue,
                  color: '#fff',
                  boxShadow: tokens.shadows.aiGlow,
                }}
              >
                <IconShieldLock size={22} />
              </Box>
              <Box>
                <Typography variant="h1" fontWeight={700} color="text.primary" sx={{ lineHeight: 1.1 }}>
                  Access{' '}
                  <Box component="span" sx={{ background: tokens.gradients.pinkBlue, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                    Control
                  </Box>
                </Typography>
                <Typography variant="body1" color="text.secondary" mt={0.5}>
                  Configure what each role can see and do
                </Typography>
              </Box>
            </Box>
          </Box>
          <Tooltip title="Refresh">
            <IconButton onClick={loadData} sx={{ color: 'text.secondary' }}>
              <Sync />
            </IconButton>
          </Tooltip>
        </Box>
      </MotionBox>

      <Grid container spacing={3}>
        {/* ── Left: Role picker sidebar ── */}
        <Grid size={{ xs: 12, md: 4, lg: 3 }}>
          <MotionBox
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            <Typography variant="overline" sx={{ color: 'text.secondary', fontWeight: 600, letterSpacing: '0.08em', ml: 0.5 }}>
              Roles
            </Typography>
            <Stack spacing={1.5} mt={1}>
              {tabs.map((role) => {
                const isActive = activeRole === role;
                const stats = roleStats(role);
                const pct = stats.total ? (stats.granted / stats.total) * 100 : 0;
                const cfg = roleConfig[role] || { icon: <IconUser size={18} />, label: role, description: '' };

                return (
                  <MotionBox
                    key={role}
                    whileHover={{ y: -2, transition: { duration: 0.15 } }}
                    onClick={() => setActiveRole(role)}
                    sx={{
                      p: 2,
                      borderRadius: 3,
                      bgcolor: isActive ? alpha(tokens.colors.pink, 0.06) : 'background.paper',
                      border: '1.5px solid',
                      borderColor: isActive ? tokens.colors.pink : 'divider',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      '&:hover': {
                        borderColor: isActive ? tokens.colors.pink : alpha(tokens.colors.pink, 0.3),
                      },
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
                      <Box
                        sx={{
                          width: 36,
                          height: 36,
                          borderRadius: 2.5,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          bgcolor: isActive ? tokens.colors.pink : alpha(tokens.colors.pink, 0.1),
                          color: isActive ? '#fff' : tokens.colors.pink,
                          transition: 'all 0.2s',
                        }}
                      >
                        {cfg.icon}
                      </Box>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography variant="body1" fontWeight={600} color="text.primary" sx={{ textTransform: 'capitalize', lineHeight: 1.2 }}>
                          {cfg.label}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" noWrap>
                          {cfg.description}
                        </Typography>
                      </Box>
                    </Box>

                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                      <Typography variant="caption" color="text.secondary" fontWeight={500}>
                        Permissions
                      </Typography>
                      <Typography variant="caption" fontWeight={700} color={isActive ? tokens.colors.pink : 'text.secondary'}>
                        {stats.granted} / {stats.total}
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={pct}
                      sx={{
                        height: 6,
                        borderRadius: 3,
                        bgcolor: alpha(tokens.colors.pink, 0.1),
                        '& .MuiLinearProgress-bar': {
                          borderRadius: 3,
                          bgcolor: tokens.colors.pink,
                        },
                      }}
                    />
                  </MotionBox>
                );
              })}
            </Stack>
          </MotionBox>
        </Grid>

        {/* ── Right: Module groups ── */}
        <Grid size={{ xs: 12, md: 8, lg: 9 }}>
          <AnimatePresence mode="wait">
            <MotionBox
              key={activeRole}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.25 }}
            >
              {/* Role summary bar */}
              <Box
                sx={{
                  p: 2.5,
                  mb: 3,
                  borderRadius: 3,
                  background: 'linear-gradient(135deg, #032840 0%, #0A3555 100%)',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: 2,
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                <Box
                  sx={{
                    position: 'absolute',
                    top: -40,
                    right: -20,
                    width: 180,
                    height: 180,
                    borderRadius: '50%',
                    background: `radial-gradient(circle, ${alpha(tokens.colors.pink, 0.25)} 0%, transparent 70%)`,
                    filter: 'blur(30px)',
                    pointerEvents: 'none',
                  }}
                />
                <Box sx={{ position: 'relative', zIndex: 1 }}>
                  <Typography variant="caption" sx={{ color: alpha('#fff', 0.65), letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 600 }}>
                    Configuring
                  </Typography>
                  <Typography variant="h4" fontWeight={700} sx={{ color: '#fff', textTransform: 'capitalize', mt: 0.25 }}>
                    {roleConfig[activeRole]?.label || activeRole} role
                  </Typography>
                </Box>
                <Box sx={{ position: 'relative', zIndex: 1, display: 'flex', gap: 2 }}>
                  <Chip
                    icon={<IconCheck size={14} style={{ color: '#fff' }} />}
                    label={`${activeRoleStats.granted} granted`}
                    sx={{
                      bgcolor: alpha('#10B981', 0.25),
                      color: '#fff',
                      fontWeight: 600,
                      border: `1px solid ${alpha('#10B981', 0.4)}`,
                      '& .MuiChip-icon': { color: '#fff' },
                    }}
                  />
                  <Chip
                    label={`${activeRoleStats.total - activeRoleStats.granted} restricted`}
                    sx={{
                      bgcolor: alpha('#fff', 0.1),
                      color: alpha('#fff', 0.8),
                      fontWeight: 600,
                      border: `1px solid ${alpha('#fff', 0.15)}`,
                    }}
                  />
                </Box>
              </Box>

              {/* Module group cards */}
              <Grid container spacing={2}>
                {(Object.keys(moduleGroups) as ModuleGroup[]).map((group, i) => {
                  const cfg = groupConfig[group];
                  const gStats = groupStats(activeRole, group);
                  const allOn = gStats.granted === gStats.total;
                  const noneOn = gStats.granted === 0;

                  return (
                    <MotionGrid
                      key={group}
                      size={{ xs: 12, md: 6 }}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: i * 0.05 }}
                    >
                      <Box
                        sx={{
                          borderRadius: 3,
                          border: '1px solid',
                          borderColor: 'grey.200',
                          overflow: 'hidden',
                          bgcolor: 'background.paper',
                          height: '100%',
                          display: 'flex',
                          flexDirection: 'column',
                          transition: 'box-shadow 0.2s',
                          '&:hover': { boxShadow: `0 6px 24px ${alpha(cfg.color, 0.12)}` },
                        }}
                      >
                        {/* Group header with unique color accent */}
                        <Box
                          sx={{
                            px: 2.5,
                            py: 1.75,
                            borderBottom: '1px solid',
                            borderColor: 'grey.200',
                            bgcolor: alpha(cfg.color, 0.04),
                            borderLeft: `3px solid ${cfg.color}`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: 1.5,
                          }}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flex: 1, minWidth: 0 }}>
                            <Box
                              sx={{
                                width: 34,
                                height: 34,
                                borderRadius: 2,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                bgcolor: alpha(cfg.color, 0.15),
                                color: cfg.color,
                                flexShrink: 0,
                              }}
                            >
                              {cfg.icon}
                            </Box>
                            <Box sx={{ minWidth: 0 }}>
                              <Typography variant="body1" fontWeight={600} color="text.primary" noWrap>
                                {group}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {gStats.granted} of {gStats.total} enabled
                              </Typography>
                            </Box>
                          </Box>
                          <Tooltip title={allOn ? 'Revoke all' : 'Grant all'}>
                            <Chip
                              label={allOn ? 'All' : noneOn ? 'None' : 'Toggle'}
                              size="small"
                              clickable
                              onClick={() => handleGroupToggle(activeRole, group, !allOn)}
                              sx={{
                                bgcolor: allOn ? alpha(cfg.color, 0.15) : alpha(cfg.color, 0.05),
                                color: cfg.color,
                                fontWeight: 600,
                                fontSize: '0.7rem',
                                height: 24,
                                borderRadius: '6px',
                                border: `1px solid ${alpha(cfg.color, 0.2)}`,
                                '&:hover': { bgcolor: alpha(cfg.color, 0.18) },
                              }}
                            />
                          </Tooltip>
                        </Box>

                        {/* Module list */}
                        <Box sx={{ p: 1, flex: 1 }}>
                          {moduleGroups[group].map((module) => {
                            const checked = isModuleAllowed(activeRole, group, module);
                            return (
                              <Box
                                key={module}
                                sx={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                  px: 1.5,
                                  py: 0.75,
                                  borderRadius: 1.5,
                                  transition: 'background-color 0.15s',
                                  '&:hover': { bgcolor: alpha(cfg.color, 0.04) },
                                }}
                              >
                                <Typography
                                  variant="body2"
                                  color="text.primary"
                                  sx={{
                                    fontWeight: checked ? 500 : 400,
                                    opacity: checked ? 1 : 0.75,
                                  }}
                                >
                                  {module}
                                </Typography>
                                <FormControlLabel
                                  sx={{ m: 0 }}
                                  control={
                                    <Switch
                                      checked={checked}
                                      onChange={(e) => handleModuleToggle(activeRole, group, module, e.target.checked)}
                                      name={`${activeRole}-${group}-${module}`}
                                    />
                                  }
                                  label=""
                                />
                              </Box>
                            );
                          })}
                        </Box>
                      </Box>
                    </MotionGrid>
                  );
                })}
              </Grid>
            </MotionBox>
          </AnimatePresence>
        </Grid>
      </Grid>
    </Box>
  );
};

export default AccessControl;
