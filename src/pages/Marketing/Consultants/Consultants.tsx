import {
  Box,
  Button,
  Chip,
  CircularProgress,
  IconButton,
  Stack,
  Typography,
  alpha,
  InputBase,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  MenuItem,
  Select,
} from '@mui/material';
import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { consultantsList } from '../../../services/consultantApi';
import CustomDrawer from '../../../components/drawer/CustomDrawer';
import ConsultantForm from './ConsultantForm';
import { syncDataById } from '../../../utils/syncDataById';
import { FormMode } from '../Requirements/Requirements';
import { IConsultant } from '../../../Interfaces/types';
import { useFetchData } from '../../../hooks/fetchDataHook';
import { tokens } from '../../../theme/theme';
import AnimatedCounter from '../../../components/ui/AnimatedCounter';
import ConsultantCard from '../../../components/consultant/ConsultantCard';
import SyncIcon from '@mui/icons-material/Sync';
import {
  IconUsers,
  IconSearch,
  IconX,
  IconPlus,
  IconUserCheck,
  IconUserX,
  IconSparkles,
  IconWorld,
  IconClock,
  IconBriefcase,
  IconSortAscending,
} from '@tabler/icons-react';

const MotionBox = motion.create(Box);

type VisaKey = 'all' | 'citizen' | 'gc' | 'ead' | 'h1b' | 'other';
type StatusKey = 'all' | 'active' | 'inactive';
type TimezoneKey = 'all' | 'EST' | 'CST' | 'MST' | 'PST';
type SortKey = 'recent' | 'alpha' | 'projects' | 'oldest';

const VISA_FILTERS: { key: VisaKey; label: string; color: string; icon?: React.ReactNode }[] = [
  { key: 'all', label: 'All', color: tokens.colors.brand },
  { key: 'h1b', label: 'H1B', color: '#EC4599' },
  { key: 'gc', label: 'Green Card', color: '#10B981' },
  { key: 'ead', label: 'GC EAD', color: '#7C3AED' },
  { key: 'citizen', label: 'US Citizen', color: '#F59E0B' },
  { key: 'other', label: 'Other', color: '#94A3B8' },
];

function classifyVisa(visa?: string): VisaKey {
  const key = (visa || '').toLowerCase();
  if (key.includes('citizen')) return 'citizen';
  if (key.includes('ead')) return 'ead';
  if (key.includes('green') || key === 'gc') return 'gc';
  if (key.includes('h1') || key.includes('h-1')) return 'h1b';
  return 'other';
}

function isLooking(c: IConsultant) {
  const key = (c.lookingToChange || '').toLowerCase();
  return key === 'yes' || key === 'true';
}
function isActive(c: IConsultant) {
  return (c.consultantStatus || '').toLowerCase() === 'active';
}

export default function Consultants() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [formReady, setFormReady] = useState(false);
  const [viewData, setViewData] = useState<IConsultant>();
  const [formTitle, setFormTitle] = useState('');
  const [mode, setMode] = useState<FormMode>('view');

  // Filters
  const [search, setSearch] = useState('');
  const [visaFilter, setVisaFilter] = useState<VisaKey>('all');
  const [statusFilter, setStatusFilter] = useState<StatusKey>('active');
  const [timezoneFilter, setTimezoneFilter] = useState<TimezoneKey>('all');
  const [lookingOnly, setLookingOnly] = useState(false);
  const [sort, setSort] = useState<SortKey>('recent');
  const [visible, setVisible] = useState(24);

  const {
    data: consultants,
    loading,
    error,
    loadData,
    setData,
  } = useFetchData<IConsultant[]>(async () => {
    const { data } = await consultantsList('limit=5000');
    return data.data?.results || [];
  }, []);

  // Defer form mount for snappier drawer
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

  // ── Filter + sort ──
  const filtered = useMemo(() => {
    const list = consultants || [];
    const q = search.trim().toLowerCase();

    const matched = list.filter((c) => {
      if (q) {
        const hay = `${c.consultantName || ''} ${c.psuedoName || ''} ${c.consultantId || ''} ${c.email || ''} ${c.university || ''}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (visaFilter !== 'all' && classifyVisa(c.visaStatus) !== visaFilter) return false;
      if (statusFilter === 'active' && !isActive(c)) return false;
      if (statusFilter === 'inactive' && isActive(c)) return false;
      if (timezoneFilter !== 'all' && c.timeZone !== timezoneFilter) return false;
      if (lookingOnly && !isLooking(c)) return false;
      return true;
    });

    const sorted = [...matched];
    switch (sort) {
      case 'alpha':
        sorted.sort((a, b) =>
          (a.consultantName || '').localeCompare(b.consultantName || '')
        );
        break;
      case 'projects':
        sorted.sort(
          (a, b) => (b.projects?.length || 0) - (a.projects?.length || 0)
        );
        break;
      case 'oldest':
        sorted.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
        break;
      case 'recent':
      default:
        sorted.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    }
    return sorted;
  }, [consultants, search, visaFilter, statusFilter, timezoneFilter, lookingOnly, sort]);

  const visibleRows = filtered.slice(0, visible);

  // Reset visible count when filters change
  useEffect(() => {
    setVisible(24);
  }, [search, visaFilter, statusFilter, timezoneFilter, lookingOnly, sort]);

  // ── Stats ──
  const stats = useMemo(() => {
    const all = consultants || [];
    const active = all.filter(isActive).length;
    const looking = all.filter(isLooking).length;
    const projects = all.reduce((sum, c) => sum + (c.projects?.length || 0), 0);
    return { total: all.length, active, inactive: all.length - active, looking, projects };
  }, [consultants]);

  const visaCounts = useMemo(() => {
    const all = consultants || [];
    const counts: Record<VisaKey, number> = { all: all.length, citizen: 0, gc: 0, ead: 0, h1b: 0, other: 0 };
    all.forEach((c) => {
      const k = classifyVisa(c.visaStatus);
      counts[k] = (counts[k] || 0) + 1;
    });
    return counts;
  }, [consultants]);

  // ── Handlers ──
  const handleView = (c: IConsultant) => {
    setViewData(c);
    setFormTitle(`Consultant ID: ${c.consultantId}`);
    setMode('view');
    setDrawerOpen(true);
    syncDataById(c, {
      queryFunction: consultantsList,
      setResults: (cb) => {
        const newList = typeof cb === 'function' ? cb(consultants || []) : cb;
        setData(newList as IConsultant[]);
      },
      setViewData,
    });
  };

  const handleAddNew = () => {
    setFormTitle('Add New Consultant');
    setViewData(undefined);
    setMode('add');
    setDrawerOpen(true);
  };

  const handleCloseForm = () => {
    setDrawerOpen(false);
    setViewData(undefined);
  };
  const handleEdit = (editMode: boolean) => setMode(editMode ? 'edit' : 'view');

  const setResults = (cb: any) => {
    const newList = typeof cb === 'function' ? cb(consultants || []) : cb;
    setData(newList as IConsultant[]);
  };

  const clearFilters = () => {
    setSearch('');
    setVisaFilter('all');
    setStatusFilter('all');
    setTimezoneFilter('all');
    setLookingOnly(false);
  };

  const hasActiveFilter =
    !!search ||
    visaFilter !== 'all' ||
    statusFilter !== 'active' ||
    timezoneFilter !== 'all' ||
    lookingOnly;

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
              <IconUsers size={26} />
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
                CONSULTANT ROSTER · PASSPORT GALLERY
              </Typography>
              <Typography
                variant="h4"
                fontWeight={700}
                sx={{ color: '#fff', lineHeight: 1.15 }}
              >
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
                  talent deck
                </Box>
              </Typography>
              <Typography
                variant="body2"
                sx={{ color: alpha('#fff', 0.65), mt: 0.25 }}
              >
                {filtered.length} of {stats.total} shown · filter by visa, timezone, or availability
              </Typography>
            </Box>
          </Stack>

          <Stack direction="row" spacing={1.25} flexWrap="wrap" useFlexGap>
            {[
              {
                label: 'Active',
                value: stats.active,
                icon: <IconUserCheck size={14} />,
                color: tokens.colors.success,
              },
              {
                label: 'Open',
                value: stats.looking,
                icon: <IconSparkles size={14} />,
                color: tokens.colors.pink,
              },
              {
                label: 'Projects',
                value: stats.projects,
                icon: <IconBriefcase size={14} />,
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
                  minWidth: 92,
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
          borderRadius: 4,
          p: { xs: 1.5, sm: 2 },
          mb: 2.5,
        }}
      >
        <Stack spacing={1.5}>
          {/* Search + status + sort row */}
          <Stack
            direction={{ xs: 'column', md: 'row' }}
            spacing={1.25}
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
                placeholder="Search name, pseudonym, ID, email, university…"
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
              value={statusFilter}
              exclusive
              size="small"
              onChange={(_, v) => v && setStatusFilter(v)}
              sx={{
                '& .MuiToggleButton-root': {
                  px: 1.5,
                  py: 0.5,
                  fontSize: '0.75rem',
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
              <ToggleButton value="all">All</ToggleButton>
              <ToggleButton value="active">
                <IconUserCheck size={13} style={{ marginRight: 4 }} /> Active
              </ToggleButton>
              <ToggleButton value="inactive">
                <IconUserX size={13} style={{ marginRight: 4 }} /> Inactive
              </ToggleButton>
            </ToggleButtonGroup>

            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 0.75,
                px: 1,
                py: 0.5,
                borderRadius: 2,
                border: '1px solid',
                borderColor: 'divider',
              }}
            >
              <IconSortAscending size={14} color={tokens.colors.lightTextSecondary} />
              <Select
                value={sort}
                onChange={(e) => setSort(e.target.value as SortKey)}
                variant="standard"
                disableUnderline
                sx={{
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  color: 'text.primary',
                  '& .MuiSelect-select': { py: 0.25 },
                }}
              >
                <MenuItem value="recent">Newest first</MenuItem>
                <MenuItem value="oldest">Oldest first</MenuItem>
                <MenuItem value="alpha">A → Z</MenuItem>
                <MenuItem value="projects">Most projects</MenuItem>
              </Select>
            </Box>
          </Stack>

          {/* Visa chips + timezone + looking-only */}
          <Stack
            direction="row"
            spacing={0.75}
            flexWrap="wrap"
            alignItems="center"
            useFlexGap
          >
            {VISA_FILTERS.map((v) => {
              const active = visaFilter === v.key;
              const count = visaCounts[v.key] || 0;
              return (
                <Chip
                  key={v.key}
                  label={`${v.label} · ${count}`}
                  size="small"
                  onClick={() => setVisaFilter(v.key)}
                  sx={{
                    height: 28,
                    fontWeight: 600,
                    fontSize: '0.72rem',
                    borderRadius: 1.75,
                    border: '1px solid',
                    borderColor: active ? alpha(v.color, 0.45) : 'divider',
                    bgcolor: active ? alpha(v.color, 0.12) : 'transparent',
                    color: active ? v.color : 'text.secondary',
                    '&:hover': {
                      bgcolor: active ? alpha(v.color, 0.18) : alpha(v.color, 0.08),
                      borderColor: alpha(v.color, 0.3),
                    },
                  }}
                />
              );
            })}

            <Box sx={{ mx: 0.5, width: '1px', height: 20, bgcolor: 'divider' }} />

            <Stack direction="row" alignItems="center" spacing={0.5}>
              <IconClock size={13} color={tokens.colors.lightTextSecondary} />
              <ToggleButtonGroup
                value={timezoneFilter}
                exclusive
                size="small"
                onChange={(_, v) => v && setTimezoneFilter(v)}
                sx={{
                  '& .MuiToggleButton-root': {
                    px: 1,
                    py: 0.25,
                    fontSize: '0.68rem',
                    fontWeight: 700,
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
                <ToggleButton value="all">All</ToggleButton>
                <ToggleButton value="EST">EST</ToggleButton>
                <ToggleButton value="CST">CST</ToggleButton>
                <ToggleButton value="MST">MST</ToggleButton>
                <ToggleButton value="PST">PST</ToggleButton>
              </ToggleButtonGroup>
            </Stack>

            <Chip
              icon={<IconSparkles size={12} />}
              label="Open to new role"
              clickable
              onClick={() => setLookingOnly((v) => !v)}
              size="small"
              sx={{
                height: 28,
                fontWeight: 700,
                fontSize: '0.7rem',
                borderRadius: 1.75,
                border: '1px solid',
                borderColor: lookingOnly ? alpha(tokens.colors.pink, 0.45) : 'divider',
                bgcolor: lookingOnly ? alpha(tokens.colors.pink, 0.12) : 'transparent',
                color: lookingOnly ? tokens.colors.pinkDark : 'text.secondary',
                '& .MuiChip-icon': {
                  color: lookingOnly ? tokens.colors.pink : tokens.colors.lightTextSecondary,
                },
                '&:hover': {
                  bgcolor: alpha(tokens.colors.pink, 0.08),
                  borderColor: alpha(tokens.colors.pink, 0.3),
                },
              }}
            />

            {hasActiveFilter && (
              <Chip
                label="Clear filters"
                clickable
                onClick={clearFilters}
                size="small"
                sx={{
                  height: 28,
                  fontWeight: 600,
                  fontSize: '0.7rem',
                  borderRadius: 1.75,
                  bgcolor: alpha(tokens.colors.lightTextSecondary, 0.08),
                  color: 'text.secondary',
                  '&:hover': { bgcolor: alpha(tokens.colors.lightTextSecondary, 0.15) },
                }}
              />
            )}

            <Box sx={{ flex: 1 }} />

            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
              {filtered.length} match{filtered.length !== 1 ? 'es' : ''}
            </Typography>
          </Stack>
        </Stack>
      </Box>

      {/* ── Card gallery ── */}
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
      ) : visibleRows.length === 0 ? (
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
            No consultants match
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
            Try adjusting your filters or adding a new consultant.
          </Typography>
          {hasActiveFilter && (
            <Button size="small" variant="outlined" onClick={clearFilters}>
              Clear filters
            </Button>
          )}
        </Box>
      ) : (
        <>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: '1fr',
                sm: 'repeat(2, 1fr)',
                md: 'repeat(3, 1fr)',
                lg: 'repeat(4, 1fr)',
                xl: 'repeat(5, 1fr)',
              },
              gap: 2,
              mb: 3,
            }}
          >
            {visibleRows.map((c, i) => (
              <ConsultantCard
                key={c._id}
                consultant={c}
                onView={handleView}
                index={i}
              />
            ))}
          </Box>

          {visible < filtered.length && (
            <Box sx={{ textAlign: 'center', mb: 3 }}>
              <Button
                variant="outlined"
                onClick={() => setVisible((v) => v + 24)}
                startIcon={<IconWorld size={16} />}
                sx={{
                  borderRadius: 2.5,
                  fontWeight: 600,
                  textTransform: 'none',
                  px: 3,
                  borderColor: alpha(tokens.colors.pink, 0.3),
                  color: tokens.colors.pinkDark,
                  '&:hover': {
                    borderColor: tokens.colors.pink,
                    bgcolor: alpha(tokens.colors.pink, 0.05),
                  },
                }}
              >
                Load {Math.min(24, filtered.length - visible)} more · {filtered.length - visible} remaining
              </Button>
            </Box>
          )}
        </>
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
          <ConsultantForm
            setResults={setResults}
            viewData={viewData}
            mode={mode}
            onDrawerClose={handleCloseForm}
            isEditing={mode !== 'view'}
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
