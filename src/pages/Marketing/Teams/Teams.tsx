import {
  Box,
  Button,
  CircularProgress,
  IconButton,
  Stack,
  Typography,
  alpha,
  InputBase,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Chip,
} from '@mui/material';
import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { teamsList } from '../../../services/teamsApi';
import CustomDrawer from '../../../components/drawer/CustomDrawer';
import TeamsForm from './TeamsForm';
import { syncDataById } from '../../../utils/syncDataById';
import { FormMode } from '../Requirements/Requirements';
import { ITeam } from '../../../Interfaces/types';
import { useFetchData } from '../../../hooks/fetchDataHook';
import { tokens } from '../../../theme/theme';
import AnimatedCounter from '../../../components/ui/AnimatedCounter';
import TeamRow from '../../../components/team/TeamRow';
import StackSection from '../../../components/team/StackSection';
import { getStackTheme, parseStackList } from '../../../components/team/stackTheme';
import SyncIcon from '@mui/icons-material/Sync';
import {
  IconUsersGroup,
  IconSearch,
  IconX,
  IconPlus,
  IconLayoutList,
  IconStack2,
  IconCode,
  IconUser,
  IconFlame,
} from '@tabler/icons-react';

const MotionBox = motion.create(Box);

type ViewMode = 'sections' | 'flat';
type SortKey = 'recent' | 'oldest' | 'alpha';

export default function Teams() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [formReady, setFormReady] = useState(false);
  const [formTitle, setFormTitle] = useState('');
  const [mode, setMode] = useState<FormMode>('view');
  const [isEditing, setIsEditing] = useState(false);
  const [viewData, setViewData] = useState<ITeam>();

  // Filters
  const [search, setSearch] = useState('');
  const [stackFilter, setStackFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('sections');
  const [sort, setSort] = useState<SortKey>('recent');
  // Collapse controls — bump to force re-expand all sections
  const [expandAllNonce, setExpandAllNonce] = useState(0);
  const [collapseAllNonce, setCollapseAllNonce] = useState(0);

  const {
    data: teams,
    loading,
    error,
    loadData,
    setData,
  } = useFetchData<ITeam[]>(async () => {
    const { data } = await teamsList('limit=5000');
    return data.data?.results || [];
  }, []);

  // Deferred form mount for snappier drawer open
  useEffect(() => {
    if (!drawerOpen) {
      setFormReady(false);
      return;
    }
    let raf2 = 0;
    const raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => setFormReady(true));
    });
    return () => {
      cancelAnimationFrame(raf1);
      if (raf2) cancelAnimationFrame(raf2);
    };
  }, [drawerOpen]);

  // ── All known stacks + counts (for the stack chip filter) ──
  const allStacks = useMemo(() => {
    const counts = new Map<string, number>();
    (teams || []).forEach((t) => {
      const parsed = parseStackList(t.teckStack);
      if (parsed.length === 0) {
        counts.set('Unassigned', (counts.get('Unassigned') || 0) + 1);
        return;
      }
      parsed.forEach((s) => counts.set(s, (counts.get(s) || 0) + 1));
    });
    return Array.from(counts.entries())
      .map(([stack, count]) => ({ stack, count }))
      .sort((a, b) => b.count - a.count);
  }, [teams]);

  // ── Filter + sort ──
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = (teams || []).filter((t) => {
      if (q) {
        const hay = `${t.teamId || ''} ${t.teamName || ''} ${t.teckStack || ''} ${t.developerName || ''} ${t.createdBy || ''}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (stackFilter !== 'all') {
        const parsed = parseStackList(t.teckStack);
        if (stackFilter === 'Unassigned') {
          if (parsed.length > 0) return false;
        } else if (!parsed.some((s) => s.toLowerCase() === stackFilter.toLowerCase())) {
          return false;
        }
      }
      return true;
    });

    const sorted = [...list];
    switch (sort) {
      case 'alpha':
        sorted.sort((a, b) => (a.teamName || '').localeCompare(b.teamName || ''));
        break;
      case 'oldest':
        sorted.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
        break;
      case 'recent':
      default:
        sorted.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    }
    return sorted;
  }, [teams, search, stackFilter, sort]);

  // ── Sections ──
  // When "All" is selected: cross-post teams across every stack they use
  // (a team with "React, Node" appears in both sections).
  // When a specific stack is filtered (e.g. Angular): show ONLY that section.
  // Within each section, rank by primary-stack position (primary teams first).
  const sections = useMemo(() => {
    const map = new Map<string, { team: ITeam; rank: number; index: number }[]>();
    const filterKey = stackFilter === 'all' ? null : stackFilter.toLowerCase();

    filtered.forEach((team, index) => {
      const parsed = parseStackList(team.teckStack);

      if (parsed.length === 0) {
        // Only include Unassigned if not filtering to a specific stack, or
        // if the filter itself is "Unassigned".
        if (filterKey && filterKey !== 'unassigned') return;
        if (!map.has('Unassigned')) map.set('Unassigned', []);
        map.get('Unassigned')!.push({ team, rank: 0, index });
        return;
      }

      const seen = new Set<string>();
      parsed.forEach((stack, rank) => {
        const key = stack.toLowerCase();
        // When a specific stack is filtered, skip every other stack this team
        // may have — otherwise we'd re-post it into Node/Python/etc. lanes.
        if (filterKey && key !== filterKey) return;
        if (seen.has(key)) return;
        seen.add(key);
        if (!map.has(stack)) map.set(stack, []);
        map.get(stack)!.push({ team, rank, index });
      });
    });

    return Array.from(map.entries())
      .map(([stack, entries]) => ({
        stack,
        teams: entries
          .sort((a, b) => a.rank - b.rank || a.index - b.index)
          .map((e) => e.team),
      }))
      .sort((a, b) => b.teams.length - a.teams.length);
  }, [filtered, stackFilter]);

  // ── Stats ──
  const stats = useMemo(() => {
    const all = teams || [];
    const developers = new Set(all.map((t) => t.developerName).filter(Boolean));
    const uniqueStacks = new Set<string>();
    all.forEach((t) => parseStackList(t.teckStack).forEach((s) => uniqueStacks.add(s)));
    const topStack = allStacks[0];
    return {
      total: all.length,
      developers: developers.size,
      stacks: uniqueStacks.size,
      topStack,
    };
  }, [teams, allStacks]);

  // ── Handlers ──
  const handleView = (t: ITeam) => {
    setViewData(t);
    setFormTitle(`Team ID: ${t.teamId}`);
    setMode('view');
    setIsEditing(false);
    setDrawerOpen(true);
    syncDataById(t, {
      queryFunction: teamsList,
      setResults: (cb) => {
        const newList = typeof cb === 'function' ? cb(teams || []) : cb;
        setData(newList as ITeam[]);
      },
      setViewData,
    });
  };

  const handleAddNew = () => {
    setFormTitle('Add New Team');
    setViewData(undefined);
    setMode('add');
    setIsEditing(true);
    setDrawerOpen(true);
  };

  const handleCloseForm = () => {
    setDrawerOpen(false);
    setViewData(undefined);
  };

  const handleEdit = (editMode: boolean) => {
    setIsEditing(editMode);
    setMode(editMode ? 'edit' : 'view');
  };

  const setResults = (cb: any) => {
    const newList = typeof cb === 'function' ? cb(teams || []) : cb;
    setData(newList as ITeam[]);
  };

  const clearFilters = () => {
    setSearch('');
    setStackFilter('all');
  };

  const hasActiveFilter = !!search || stackFilter !== 'all';
  const topStackThemeColor = stats.topStack
    ? getStackTheme(stats.topStack.stack).color
    : tokens.colors.pink;

  return (
    <Box>
      {/* ── Hero banner ── */}
      <MotionBox
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        sx={{
          position: 'relative',
          borderRadius: 4,
          overflow: 'hidden',
          background: tokens.gradients.darkSurface,
          color: '#fff',
          p: { xs: 2.5, sm: 3.5 },
          mb: 3,
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            top: -60,
            right: -40,
            width: 280,
            height: 280,
            borderRadius: '50%',
            background: `radial-gradient(circle, ${alpha(tokens.colors.pink, 0.3)} 0%, transparent 70%)`,
            filter: 'blur(50px)',
            pointerEvents: 'none',
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            bottom: -80,
            left: '25%',
            width: 260,
            height: 260,
            borderRadius: '50%',
            background: `radial-gradient(circle, ${alpha(tokens.colors.blue, 0.22)} 0%, transparent 70%)`,
            filter: 'blur(50px)',
            pointerEvents: 'none',
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 3,
            background: tokens.gradients.brand,
          }}
        />

        <Stack
          direction={{ xs: 'column', md: 'row' }}
          justifyContent="space-between"
          alignItems={{ xs: 'flex-start', md: 'center' }}
          spacing={3}
          sx={{ position: 'relative', zIndex: 1 }}
        >
          <Stack direction="row" alignItems="center" spacing={2}>
            <Box
              sx={{
                width: 52,
                height: 52,
                borderRadius: 3,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: tokens.gradients.pinkBlue,
                color: '#fff',
                boxShadow: tokens.shadows.aiGlow,
              }}
            >
              <IconUsersGroup size={26} />
            </Box>
            <Box>
              <Typography
                variant="caption"
                sx={{
                  color: alpha('#fff', 0.7),
                  letterSpacing: '0.06em',
                  fontWeight: 600,
                }}
              >
                SQUAD BAY · GROUPED BY TECH STACK
              </Typography>
              <Typography variant="h4" fontWeight={700} sx={{ color: '#fff', lineHeight: 1.15 }}>
                Your{' '}
                <Box
                  component="span"
                  sx={{
                    background: tokens.gradients.pinkBlue,
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                  }}
                >
                  dev roster
                </Box>
              </Typography>
              <Typography variant="body2" sx={{ color: alpha('#fff', 0.65), mt: 0.25 }}>
                {filtered.length} of {stats.total} shown · clean list view grouped by stack
              </Typography>
            </Box>
          </Stack>

          <Stack direction="row" spacing={1.25} flexWrap="wrap" useFlexGap alignItems="center">
            {[
              {
                label: 'Teams',
                value: stats.total,
                icon: <IconUsersGroup size={14} />,
                color: tokens.colors.pink,
              },
              {
                label: 'Stacks',
                value: stats.stacks,
                icon: <IconCode size={14} />,
                color: tokens.colors.blue,
              },
              {
                label: 'Devs',
                value: stats.developers,
                icon: <IconUser size={14} />,
                color: tokens.colors.yellow,
              },
            ].map((s) => (
              <Box
                key={s.label}
                sx={{
                  bgcolor: alpha('#fff', 0.08),
                  border: `1px solid ${alpha('#fff', 0.12)}`,
                  borderRadius: 2.5,
                  px: 1.5,
                  py: 1.25,
                  minWidth: 86,
                  backdropFilter: 'blur(8px)',
                }}
              >
                <Stack direction="row" alignItems="center" spacing={0.5}>
                  <Box sx={{ color: s.color, display: 'flex' }}>{s.icon}</Box>
                  <Typography
                    variant="caption"
                    sx={{
                      color: alpha('#fff', 0.7),
                      letterSpacing: '0.05em',
                      fontSize: '0.65rem',
                      fontWeight: 600,
                    }}
                  >
                    {s.label.toUpperCase()}
                  </Typography>
                </Stack>
                <AnimatedCounter
                  value={s.value}
                  variant="h4"
                  fontWeight={700}
                  sx={{ color: '#fff', lineHeight: 1.2, mt: 0.25 }}
                />
              </Box>
            ))}

            {stats.topStack && (
              <Tooltip title="Most popular tech stack" arrow>
                <Box
                  sx={{
                    bgcolor: alpha('#fff', 0.08),
                    border: `1px solid ${alpha(topStackThemeColor, 0.4)}`,
                    borderRadius: 2.5,
                    px: 1.5,
                    py: 1.25,
                    minWidth: 120,
                    backdropFilter: 'blur(8px)',
                  }}
                >
                  <Stack direction="row" alignItems="center" spacing={0.5}>
                    <IconFlame size={14} color={tokens.colors.yellow} />
                    <Typography
                      variant="caption"
                      sx={{
                        color: alpha('#fff', 0.7),
                        letterSpacing: '0.05em',
                        fontSize: '0.65rem',
                        fontWeight: 600,
                      }}
                    >
                      TOP STACK
                    </Typography>
                  </Stack>
                  <Typography
                    variant="subtitle1"
                    fontWeight={800}
                    sx={{ color: '#fff', mt: 0.25, lineHeight: 1.2 }}
                  >
                    {stats.topStack.stack}
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{ color: alpha('#fff', 0.6), fontSize: '0.68rem' }}
                  >
                    {stats.topStack.count} {stats.topStack.count === 1 ? 'team' : 'teams'}
                  </Typography>
                </Box>
              </Tooltip>
            )}

            <Button
              variant="contained"
              startIcon={<IconPlus size={16} />}
              onClick={handleAddNew}
              size="medium"
              sx={{
                background: tokens.gradients.pinkBlue,
                color: '#fff',
                textTransform: 'none',
                fontWeight: 700,
                borderRadius: 2.5,
                px: 2.5,
                py: 0.9,
                boxShadow: `0 6px 16px ${alpha(tokens.colors.pink, 0.35)}`,
                '&:hover': {
                  background: 'linear-gradient(135deg, #DB2777 0%, #1A9FD4 100%)',
                  boxShadow: `0 8px 20px ${alpha(tokens.colors.pink, 0.45)}`,
                },
              }}
            >
              Add new
            </Button>
            <Tooltip title="Refresh">
              <IconButton
                onClick={loadData}
                disabled={loading}
                sx={{
                  bgcolor: alpha('#fff', 0.1),
                  color: '#fff',
                  borderRadius: 2,
                  width: 40,
                  height: 40,
                  '&:hover': { bgcolor: alpha('#fff', 0.18) },
                }}
              >
                <SyncIcon
                  className={loading ? 'sync-icon-loading' : ''}
                  sx={{ fontSize: 18 }}
                />
              </IconButton>
            </Tooltip>
          </Stack>
        </Stack>
      </MotionBox>

      {/* ── Filter bar ── */}
      <Box
        sx={{
          bgcolor: 'background.paper',
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 3,
          p: { xs: 1.25, sm: 1.5 },
          mb: 2,
        }}
      >
        <Stack spacing={1.25}>
          {/* Search + view toggles + sort */}
          <Stack
            direction={{ xs: 'column', md: 'row' }}
            spacing={1}
            alignItems={{ xs: 'stretch', md: 'center' }}
          >
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                px: 1.5,
                py: 0.75,
                borderRadius: 2.5,
                border: '1px solid',
                borderColor: 'divider',
                bgcolor: alpha(tokens.colors.brand, 0.02),
                flex: 1,
                minWidth: 220,
                transition: 'all 0.2s ease',
                '&:focus-within': {
                  borderColor: tokens.colors.pink,
                  boxShadow: `0 0 0 3px ${alpha(tokens.colors.pink, 0.12)}`,
                  bgcolor: 'background.paper',
                },
              }}
            >
              <IconSearch size={16} color={tokens.colors.lightTextSecondary} />
              <InputBase
                placeholder="Search team, dev, stack, ID…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                sx={{
                  flex: 1,
                  fontSize: '0.875rem',
                  '& input': { py: 0.25 },
                }}
              />
              {search && (
                <IconButton size="small" onClick={() => setSearch('')}>
                  <IconX size={14} />
                </IconButton>
              )}
            </Box>

            <ToggleButtonGroup
              value={viewMode}
              exclusive
              size="small"
              onChange={(_, v) => v && setViewMode(v)}
              sx={{
                '& .MuiToggleButton-root': {
                  px: 1.5,
                  py: 0.5,
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  textTransform: 'none',
                  border: '1px solid',
                  borderColor: 'divider',
                  '&.Mui-selected': {
                    bgcolor: alpha(tokens.colors.pink, 0.1),
                    color: tokens.colors.pinkDark,
                    borderColor: alpha(tokens.colors.pink, 0.3),
                  },
                },
              }}
            >
              <ToggleButton value="sections">
                <IconStack2 size={13} style={{ marginRight: 4 }} /> By stack
              </ToggleButton>
              <ToggleButton value="flat">
                <IconLayoutList size={13} style={{ marginRight: 4 }} /> Flat list
              </ToggleButton>
            </ToggleButtonGroup>

            <ToggleButtonGroup
              value={sort}
              exclusive
              size="small"
              onChange={(_, v) => v && setSort(v)}
              sx={{
                '& .MuiToggleButton-root': {
                  px: 1.25,
                  py: 0.5,
                  fontSize: '0.68rem',
                  fontWeight: 600,
                  textTransform: 'none',
                  border: '1px solid',
                  borderColor: 'divider',
                  '&.Mui-selected': {
                    bgcolor: alpha(tokens.colors.blue, 0.1),
                    color: tokens.colors.blueDark,
                    borderColor: alpha(tokens.colors.blue, 0.3),
                  },
                },
              }}
            >
              <ToggleButton value="recent">Newest</ToggleButton>
              <ToggleButton value="oldest">Oldest</ToggleButton>
              <ToggleButton value="alpha">A→Z</ToggleButton>
            </ToggleButtonGroup>
          </Stack>

          {/* Stack chips filter */}
          {allStacks.length > 0 && (
            <Stack
              direction="row"
              spacing={0.625}
              flexWrap="wrap"
              useFlexGap
              sx={{ alignItems: 'center' }}
            >
              <Chip
                label={`All · ${teams?.length || 0}`}
                size="small"
                onClick={() => setStackFilter('all')}
                sx={{
                  height: 26,
                  fontWeight: 700,
                  fontSize: '0.7rem',
                  borderRadius: 1.5,
                  border: '1px solid',
                  borderColor: stackFilter === 'all' ? alpha(tokens.colors.brand, 0.3) : 'divider',
                  bgcolor: stackFilter === 'all' ? alpha(tokens.colors.brand, 0.08) : 'transparent',
                  color: stackFilter === 'all' ? tokens.colors.brand : 'text.secondary',
                  '&:hover': {
                    bgcolor: alpha(tokens.colors.brand, 0.06),
                  },
                }}
              />
              {allStacks.slice(0, 20).map(({ stack, count }) => {
                const active = stackFilter === stack;
                const t = getStackTheme(stack, 11);
                return (
                  <Chip
                    key={stack}
                    label={`${stack} · ${count}`}
                    icon={
                      <Box sx={{ display: 'inline-flex', color: active ? t.dark : t.color }}>
                        {t.icon}
                      </Box>
                    }
                    size="small"
                    onClick={() => setStackFilter(stack)}
                    sx={{
                      height: 26,
                      fontWeight: 700,
                      fontSize: '0.7rem',
                      borderRadius: 1.5,
                      border: '1px solid',
                      borderColor: active ? t.border : 'divider',
                      bgcolor: active ? t.bg : 'transparent',
                      color: active ? t.dark : 'text.secondary',
                      '& .MuiChip-icon': { ml: '6px !important' },
                      '&:hover': {
                        bgcolor: t.bg,
                        borderColor: t.border,
                      },
                    }}
                  />
                );
              })}

              {hasActiveFilter && (
                <Chip
                  label="Clear"
                  clickable
                  onClick={clearFilters}
                  size="small"
                  sx={{
                    height: 26,
                    fontWeight: 600,
                    fontSize: '0.68rem',
                    borderRadius: 1.5,
                    bgcolor: alpha(tokens.colors.lightTextSecondary, 0.08),
                    color: 'text.secondary',
                    '&:hover': { bgcolor: alpha(tokens.colors.lightTextSecondary, 0.15) },
                  }}
                />
              )}

              <Box sx={{ flex: 1 }} />

              {viewMode === 'sections' && sections.length > 1 && (
                <Stack direction="row" spacing={0.5}>
                  <Chip
                    label="Expand all"
                    clickable
                    size="small"
                    onClick={() => setExpandAllNonce((n) => n + 1)}
                    sx={{
                      height: 24,
                      fontSize: '0.66rem',
                      fontWeight: 600,
                      borderRadius: 1.5,
                      bgcolor: 'transparent',
                      color: 'text.secondary',
                      border: '1px solid',
                      borderColor: 'divider',
                      '&:hover': { bgcolor: alpha(tokens.colors.brand, 0.04) },
                    }}
                  />
                  <Chip
                    label="Collapse all"
                    clickable
                    size="small"
                    onClick={() => setCollapseAllNonce((n) => n + 1)}
                    sx={{
                      height: 24,
                      fontSize: '0.66rem',
                      fontWeight: 600,
                      borderRadius: 1.5,
                      bgcolor: 'transparent',
                      color: 'text.secondary',
                      border: '1px solid',
                      borderColor: 'divider',
                      '&:hover': { bgcolor: alpha(tokens.colors.brand, 0.04) },
                    }}
                  />
                </Stack>
              )}

              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, ml: 1 }}>
                {filtered.length} match{filtered.length !== 1 ? 'es' : ''}
              </Typography>
            </Stack>
          )}
        </Stack>
      </Box>

      {/* ── Body ── */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography color="error" sx={{ mb: 1 }}>
            {error}
          </Typography>
          <Button variant="outlined" onClick={loadData} size="small">
            Retry
          </Button>
        </Box>
      ) : filtered.length === 0 ? (
        <Box
          sx={{
            textAlign: 'center',
            py: 10,
            borderRadius: 4,
            bgcolor: 'background.paper',
            border: '1px dashed',
            borderColor: 'divider',
          }}
        >
          <Box
            sx={{
              width: 56,
              height: 56,
              borderRadius: '50%',
              bgcolor: alpha(tokens.colors.pink, 0.08),
              color: tokens.colors.pink,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              mb: 1.5,
            }}
          >
            <IconSearch size={26} />
          </Box>
          <Typography variant="subtitle1" fontWeight={700}>
            No teams match
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
            Try adjusting your filters or add a new team.
          </Typography>
          {hasActiveFilter && (
            <Button size="small" variant="outlined" onClick={clearFilters}>
              Clear filters
            </Button>
          )}
        </Box>
      ) : viewMode === 'sections' ? (
        /* ── Sectioned view — collapsible rows per stack ── */
        <Box>
          {sections.map((sec, i) => (
            <StackSection
              // Force remount on bulk expand/collapse so internal state resets cleanly
              key={`${sec.stack}-${expandAllNonce}-${collapseAllNonce}`}
              stack={sec.stack}
              teams={sec.teams}
              onView={handleView}
              rank={i + 1}
              defaultExpanded={
                collapseAllNonce > expandAllNonce ? false : true
              }
            />
          ))}
        </Box>
      ) : (
        /* ── Flat list — all teams in one clean list, 2 columns on wide screens ── */
        <Box
          sx={{
            borderRadius: 3,
            border: '1px solid',
            borderColor: 'divider',
            bgcolor: 'background.paper',
            overflow: 'hidden',
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' },
          }}
        >
          {filtered.map((t, i) => (
            <Box
              key={t._id}
              sx={{
                // Hide the inner right border on the last column for even rows
                borderRight: {
                  xs: 'none',
                  lg: i % 2 === 0 ? `1px solid ${alpha(tokens.colors.brand, 0.08)}` : 'none',
                },
              }}
            >
              <TeamRow
                team={t}
                onView={handleView}
                showDivider={i < filtered.length - (filtered.length % 2 === 0 ? 2 : 1)}
              />
            </Box>
          ))}
        </Box>
      )}

      {/* ── Drawer ── */}
      <CustomDrawer
        open={drawerOpen}
        onClose={handleCloseForm}
        title={formTitle}
        closeOnOutSideClick={mode === 'view'}
      >
        {!formReady ? (
          <DrawerSkeleton />
        ) : (
          <TeamsForm
            setResults={setResults}
            viewData={viewData}
            mode={mode}
            setDrawerOpen={setDrawerOpen}
            isEditing={isEditing}
            onEdit={handleEdit}
          />
        )}
      </CustomDrawer>
    </Box>
  );
}

function DrawerSkeleton() {
  return (
    <Box sx={{ p: 1.5 }}>
      <Stack spacing={2}>
        {[0, 1, 2, 3].map((i) => (
          <Box
            key={i}
            sx={{
              borderRadius: 3,
              border: '1px solid',
              borderColor: 'grey.200',
              overflow: 'hidden',
            }}
          >
            <Box
              sx={{
                px: 2.5,
                py: 1.5,
                bgcolor: '#F6F9FC',
                borderBottom: '1px solid',
                borderColor: 'grey.200',
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
              }}
            >
              <Box sx={{ width: 24, height: 24, borderRadius: '50%', bgcolor: alpha(tokens.colors.brand, 0.12) }} />
              <Box sx={{ height: 14, width: 140, borderRadius: 1, bgcolor: alpha(tokens.colors.brand, 0.08) }} />
            </Box>
            <Box sx={{ p: 2.5 }}>
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                {[0, 1, 2, 3].map((j) => (
                  <Box
                    key={j}
                    sx={{ height: 40, borderRadius: 1.5, bgcolor: alpha(tokens.colors.brand, 0.06) }}
                  />
                ))}
              </Box>
            </Box>
          </Box>
        ))}
      </Stack>
    </Box>
  );
}
