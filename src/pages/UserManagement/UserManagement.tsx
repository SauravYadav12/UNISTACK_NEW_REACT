import {
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  IconButton,
  InputAdornment,
  ListItemText,
  Menu,
  MenuItem,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
  alpha,
} from '@mui/material';
import Checkbox from '@mui/material/Checkbox';
import { DataGrid, GridColDef, GridToolbar } from '@mui/x-data-grid';
import {
  Dispatch,
  ReactElement,
  SetStateAction,
  useMemo,
  useState,
} from 'react';
import { motion } from 'framer-motion';
import moment from 'moment';
import { toast } from 'react-toastify';
import {
  IconActivity,
  IconArrowRight,
  IconCrown,
  IconRefresh,
  IconSearch,
  IconPencil,
  IconUserOff,
  IconUserCheck,
  IconUsers,
  IconCircleDot,
  IconX,
  IconRadar2,
  IconChevronDown,
} from '@tabler/icons-react';

import CustomDrawer from '../../components/drawer/CustomDrawer';
import ProfileForm from '../Marketing/Profile/ProfileForm';
import ActiveUserSwitch from '../../components/userManagement/ActiveUserSwitch';
import UserShiftSelect from '../../components/userManagement/UserShiftSelect';
import UserWorkLocationSelect from '../../components/userManagement/UserWorkLocationSelect';
import CanEditSwitch from '../../components/userManagement/canEditSwitch';
import DateOfJoiningEditor from './DateOfJoiningEditor';
import {
  documentFormSection,
  getProfileFormInitialValues,
  profileFormSections,
} from '../Marketing/Profile/constants';
import { getProfileByUser } from '../../services/userProfileApi';
import { updateUser, usersList } from '../../services/authApi';
import { dateFormate2, timeFormate } from '../../components/constants';
import { useFetchData } from '../../hooks/fetchDataHook';
import { iUser, iUserActivity, UserRole } from '../../Interfaces/iUser';
import { tokens } from '../../theme/theme';
import AnimatedCounter from '../../components/ui/AnimatedCounter';
import { getInitials } from '../../components/ui/PersonPill';
import { Sync } from '@mui/icons-material';

const MotionBox = motion.create(Box);

// ── Role visual metadata (no grouping — just colour accents) ──────────────

const ROLE_META: Record<
  UserRole,
  { label: string; accent: string; softBg: string }
> = {
  [UserRole['super-admin']]: {
    label: 'super-admin',
    accent: tokens.colors.pinkDark,
    softBg: alpha(tokens.colors.pink, 0.12),
  },
  [UserRole.admin]: {
    label: 'admin',
    accent: '#7C3AED',
    softBg: alpha('#7C3AED', 0.1),
  },
  [UserRole.hr]: {
    label: 'hr',
    accent: '#B45309',
    softBg: alpha('#F59E0B', 0.14),
  },
  [UserRole.support]: {
    label: 'support',
    accent: '#059669',
    softBg: alpha('#10B981', 0.12),
  },
  [UserRole.marketing]: {
    label: 'marketing',
    accent: tokens.colors.blueDark,
    softBg: alpha(tokens.colors.blue, 0.1),
  },
  [UserRole['project-coordinator']]: {
    label: 'project-coordinator',
    accent: '#0369A1',
    softBg: alpha('#0EA5E9', 0.1),
  },
  [UserRole['chess-sales']]: {
    label: 'chess-sales',
    accent: '#EA580C',
    softBg: alpha('#F97316', 0.12),
  },
  [UserRole.user]: {
    label: 'user',
    accent: '#475569',
    softBg: alpha('#64748B', 0.1),
  },
};

const ROLE_ORDER: UserRole[] = [
  UserRole['super-admin'],
  UserRole.admin,
  UserRole.hr,
  UserRole['project-coordinator'],
  UserRole.support,
  UserRole.marketing,
  UserRole['chess-sales'],
  UserRole.user,
];

// ── Presence (lightweight — just the online dot) ──────────────────────────

const ONLINE_WINDOW_MIN = 10;

type Presence = 'online' | 'recent' | 'idle';

function latestActivity(u: iUser): iUserActivity | null {
  const a = u.activity || [];
  if (!a.length) return null;
  return a[a.length - 1];
}

function lastSeenText(u: iUser): string {
  const last = latestActivity(u);
  if (!last?.loggedInAt) return 'never signed in';
  return moment(last.loggedInAt).fromNow();
}

function presenceOf(u: iUser): Presence {
  if (!u.active) return 'idle';
  const last = latestActivity(u);
  if (!last?.loggedInAt) return 'idle';
  const mins = moment().diff(moment(last.loggedInAt), 'minutes');
  const stillIn = !last.loggedOutAt;
  if (stillIn && mins <= ONLINE_WINDOW_MIN) return 'online';
  if (mins <= 24 * 60) return 'recent';
  return 'idle';
}

const PRESENCE_DOT: Record<Presence, string> = {
  online: '#10B981',
  recent: '#F59E0B',
  idle: '#CBD5E1',
};

// ── Presence Radar ────────────────────────────────────────────────────────

// Deterministic pseudo-position on the radar from user._id. The radar is
// stylized, not geographic: more-present users hug the centre, idle users
// drift to the edge. Position stays stable between renders.
function hash(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
  return h;
}

function radarPoint(
  seed: string,
  presence: Presence,
  radius: number,
): { x: number; y: number } {
  const h = hash(seed);
  const angle = ((h % 1000) / 1000) * Math.PI * 2;
  const ringR =
    presence === 'online'
      ? radius * 0.3
      : presence === 'recent'
        ? radius * 0.58
        : radius * 0.85;
  const jitter = ((h >>> 10) % 24) - 12;
  const r = ringR + jitter * 0.35;
  return {
    x: Math.cos(angle) * r,
    y: Math.sin(angle) * r,
  };
}

interface PresenceRadarProps {
  users: iUser[];
  onSelect: (u: iUser) => void;
  /** Keep the radar bounded; card dimensions are driven by this. */
  size?: number;
}

function PresenceRadar({ users, onSelect, size = 220 }: PresenceRadarProps) {
  const r = size / 2;

  const dots = users.map((u) => {
    const p = presenceOf(u);
    const pt = radarPoint(u._id || u.email || 'x', p, r - 10);
    return { user: u, presence: p, x: r + pt.x, y: r + pt.y };
  });

  const onlineCount = dots.filter((d) => d.presence === 'online').length;

  return (
    <Box
      sx={{
        position: 'relative',
        width: size,
        height: size,
        flexShrink: 0,
        mx: 'auto',
      }}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        style={{ position: 'absolute', inset: 0 }}
      >
        <defs>
          <radialGradient id="radarBg-um" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(16, 185, 129, 0.2)" />
            <stop offset="70%" stopColor="rgba(16, 185, 129, 0.05)" />
            <stop offset="100%" stopColor="rgba(16, 185, 129, 0)" />
          </radialGradient>
        </defs>

        <circle cx={r} cy={r} r={r - 4} fill="url(#radarBg-um)" />
        <circle
          cx={r}
          cy={r}
          r={r - 4}
          fill="none"
          stroke="rgba(16, 185, 129, 0.3)"
          strokeWidth={1}
        />
        <circle
          cx={r}
          cy={r}
          r={(r - 4) * 0.68}
          fill="none"
          stroke="rgba(16, 185, 129, 0.22)"
          strokeWidth={1}
        />
        <circle
          cx={r}
          cy={r}
          r={(r - 4) * 0.36}
          fill="none"
          stroke="rgba(16, 185, 129, 0.32)"
          strokeWidth={1}
        />
        <line
          x1={r}
          y1={4}
          x2={r}
          y2={size - 4}
          stroke="rgba(16, 185, 129, 0.18)"
          strokeDasharray="2 4"
        />
        <line
          x1={4}
          y1={r}
          x2={size - 4}
          y2={r}
          stroke="rgba(16, 185, 129, 0.18)"
          strokeDasharray="2 4"
        />
      </svg>

      {/* Rotating sweep */}
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          borderRadius: '50%',
          overflow: 'hidden',
          pointerEvents: 'none',
          '@keyframes radar-spin-um': {
            from: { transform: 'rotate(0deg)' },
            to: { transform: 'rotate(360deg)' },
          },
        }}
      >
        <Box
          sx={{
            width: '100%',
            height: '100%',
            background:
              'conic-gradient(from 0deg, rgba(16,185,129,0) 0deg, rgba(16,185,129,0) 300deg, rgba(16,185,129,0.48) 358deg, rgba(16,185,129,0) 360deg)',
            animation: 'radar-spin-um 4.5s linear infinite',
          }}
        />
      </Box>

      {/* Dots */}
      {dots.map(({ user, presence, x, y }) => {
        const color = PRESENCE_DOT[presence];
        const isOnline = presence === 'online';
        return (
          <Tooltip
            key={user._id}
            arrow
            title={
              <Box>
                <Typography variant="caption" fontWeight={800}>
                  {user.firstName} {user.lastName}
                </Typography>
                <Typography
                  variant="caption"
                  display="block"
                  sx={{ opacity: 0.85 }}
                >
                  {presence} · {lastSeenText(user)}
                </Typography>
              </Box>
            }
          >
            <Box
              onClick={() => onSelect(user)}
              sx={{
                position: 'absolute',
                left: x - 5,
                top: y - 5,
                width: 10,
                height: 10,
                borderRadius: '50%',
                bgcolor: color,
                border: '2px solid rgba(255,255,255,0.85)',
                boxShadow: isOnline
                  ? `0 0 12px ${alpha(color, 0.9)}, 0 0 2px ${color}`
                  : `0 0 5px ${alpha(color, 0.45)}`,
                cursor: 'pointer',
                transition: 'transform 0.15s ease',
                '&:hover': { transform: 'scale(1.5)' },
                ...(isOnline && {
                  '@keyframes pulse-dot-um': {
                    '0%': {
                      boxShadow: `0 0 0 0 ${alpha(color, 0.7)}, 0 0 10px ${alpha(color, 0.8)}`,
                    },
                    '70%': {
                      boxShadow: `0 0 0 10px ${alpha(color, 0)}, 0 0 10px ${alpha(color, 0.8)}`,
                    },
                    '100%': {
                      boxShadow: `0 0 0 0 ${alpha(color, 0)}, 0 0 10px ${alpha(color, 0.8)}`,
                    },
                  },
                  animation: 'pulse-dot-um 1.8s infinite',
                }),
              }}
            />
          </Tooltip>
        );
      })}

      {/* Centre badge */}
      <Box
        sx={{
          position: 'absolute',
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)',
          display: 'flex',
          alignItems: 'center',
          gap: 0.5,
          px: 1.25,
          py: 0.4,
          borderRadius: 99,
          bgcolor: alpha('#0B1020', 0.7),
          border: '1px solid rgba(16, 185, 129, 0.45)',
          color: '#A7F3D0',
          fontSize: '0.62rem',
          fontWeight: 800,
          letterSpacing: '0.12em',
          whiteSpace: 'nowrap',
        }}
      >
        <IconRadar2 size={11} />
        LIVE · {onlineCount}
      </Box>
    </Box>
  );
}

// ── Popover role editor — the primary interaction ────────────────────────

function RolePicker({
  user,
  onMutate,
  compact = false,
}: {
  user: iUser;
  onMutate: (u: iUser) => void;
  compact?: boolean;
}) {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [savingKey, setSavingKey] = useState<UserRole | null>(null);
  const [localRoles, setLocalRoles] = useState<UserRole[]>(user.role || []);

  // Keep local state in sync if parent swaps the user.
  useMemo(() => {
    setLocalRoles(user.role || []);
  }, [user.role]);

  const toggle = async (r: UserRole) => {
    const before = localRoles;
    const next = before.includes(r)
      ? before.filter((x) => x !== r)
      : [...before, r];
    setLocalRoles(next);
    setSavingKey(r);
    try {
      const { data } = await updateUser(user._id, { role: next });
      onMutate(data.user);
      toast.success(`Role updated`);
    } catch {
      setLocalRoles(before);
      toast.error('Failed to update role');
    } finally {
      setSavingKey(null);
    }
  };

  const roles = localRoles;

  return (
    <>
      <Box
        onClick={(e) => setAnchorEl(e.currentTarget)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setAnchorEl(e.currentTarget as HTMLElement);
          }
        }}
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 0.5,
          alignItems: 'center',
          p: compact ? 0.5 : 1,
          borderRadius: 2,
          cursor: 'pointer',
          minHeight: 32,
          border: '1px dashed',
          borderColor: 'divider',
          transition: 'all 0.15s ease',
          '&:hover': {
            borderColor: alpha(tokens.colors.blue, 0.5),
            bgcolor: alpha(tokens.colors.blue, 0.04),
          },
        }}
      >
        {roles.length === 0 ? (
          <Typography
            variant="caption"
            sx={{
              color: 'text.secondary',
              fontStyle: 'italic',
              fontSize: '0.72rem',
            }}
          >
            No roles assigned — click to add
          </Typography>
        ) : (
          roles.map((r) => {
            const m = ROLE_META[r] || ROLE_META[UserRole.user];
            return (
              <Chip
                key={r}
                label={m.label}
                size="small"
                sx={{
                  height: 20,
                  fontSize: '0.65rem',
                  fontWeight: 700,
                  letterSpacing: '0.04em',
                  bgcolor: m.softBg,
                  color: m.accent,
                  border: `1px solid ${alpha(m.accent, 0.25)}`,
                }}
              />
            );
          })
        )}
        <Box sx={{ flex: 1 }} />
        <IconPencil
          size={12}
          color={tokens.colors.lightTextSecondary}
          style={{ flexShrink: 0 }}
        />
      </Box>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
        slotProps={{
          paper: { sx: { minWidth: 240, borderRadius: 2.5, mt: 0.5 } },
        }}
        MenuListProps={{ dense: true }}
      >
        <Box sx={{ px: 2, pt: 1, pb: 0.5 }}>
          <Typography
            variant="caption"
            sx={{
              fontWeight: 800,
              fontSize: '0.65rem',
              letterSpacing: '0.08em',
              color: 'text.secondary',
              textTransform: 'uppercase',
            }}
          >
            Roles
          </Typography>
        </Box>
        {ROLE_ORDER.map((r) => {
          const checked = roles.includes(r);
          const meta = ROLE_META[r];
          const isSaving = savingKey === r;
          return (
            <MenuItem
              key={r}
              onClick={() => !isSaving && toggle(r)}
              sx={{
                py: 0.75,
                opacity: isSaving ? 0.6 : 1,
              }}
            >
              <Checkbox
                edge="start"
                checked={checked}
                disableRipple
                size="small"
                sx={{
                  color: meta.accent,
                  '&.Mui-checked': { color: meta.accent },
                  p: 0.5,
                  mr: 1,
                }}
              />
              <ListItemText
                primary={meta.label}
                primaryTypographyProps={{
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  color: checked ? meta.accent : 'text.primary',
                }}
              />
              {isSaving && <CircularProgress size={12} sx={{ ml: 1 }} />}
            </MenuItem>
          );
        })}
      </Menu>
    </>
  );
}

// ── User card — role editor + active switch front-and-centre ─────────────

interface UserCardProps {
  user: iUser;
  onOpen: () => void;
  onMutate: (u: iUser) => void;
}

function UserCard({ user, onOpen, onMutate }: UserCardProps) {
  const p = presenceOf(user);
  const dot = PRESENCE_DOT[p];
  const isInactive = !user.active;

  return (
    <MotionBox
      whileHover={{ y: -2 }}
      transition={{ duration: 0.15 }}
      sx={{
        position: 'relative',
        bgcolor: 'background.paper',
        borderRadius: 3,
        border: '1px solid',
        borderColor: 'divider',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        transition: 'all 0.2s ease',
        opacity: isInactive ? 0.78 : 1,
        '&:hover': {
          borderColor: alpha(tokens.colors.blue, 0.35),
          boxShadow: `0 10px 28px ${alpha(tokens.colors.brand, 0.08)}`,
        },
      }}
    >
      {/* Inactive ribbon */}
      {isInactive && (
        <Box
          sx={{
            position: 'absolute',
            top: 12,
            right: -30,
            transform: 'rotate(35deg)',
            px: 4,
            py: 0.25,
            bgcolor: alpha('#94A3B8', 0.9),
            color: '#fff',
            fontSize: '0.6rem',
            fontWeight: 800,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            zIndex: 1,
          }}
        >
          Inactive
        </Box>
      )}

      {/* Header — avatar + identity */}
      <Box sx={{ p: 2 }}>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Box sx={{ position: 'relative', flexShrink: 0 }}>
            <Avatar
              sx={{
                width: 44,
                height: 44,
                fontSize: '0.9rem',
                fontWeight: 800,
                background: tokens.gradients.pinkBlue,
                color: '#fff',
              }}
            >
              {getInitials(`${user.firstName} ${user.lastName}`)}
            </Avatar>
            <Box
              sx={{
                position: 'absolute',
                bottom: 0,
                right: 0,
                width: 12,
                height: 12,
                borderRadius: '50%',
                bgcolor: dot,
                border: '2px solid #fff',
              }}
            />
          </Box>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Stack direction="row" alignItems="center" spacing={0.5}>
              <Typography
                fontWeight={800}
                noWrap
                sx={{ color: '#0A3555' }}
              >
                {user.firstName} {user.lastName}
              </Typography>
              {user.premium && (
                <Tooltip title="Premium">
                  <Box sx={{ color: '#F59E0B', display: 'flex' }}>
                    <IconCrown size={14} />
                  </Box>
                </Tooltip>
              )}
            </Stack>
            <Typography
              variant="caption"
              sx={{
                display: 'block',
                color: 'text.secondary',
                fontSize: '0.72rem',
              }}
              noWrap
            >
              {user.email}
            </Typography>
            <Typography
              variant="caption"
              sx={{
                display: 'block',
                fontSize: '0.68rem',
                color: 'text.secondary',
                mt: 0.25,
              }}
            >
              {user.active ? lastSeenText(user) : 'deactivated'}
            </Typography>
          </Box>
        </Stack>
      </Box>

      {/* Role editor — the primary interaction */}
      <Box sx={{ px: 2, pb: 1.5 }}>
        <Typography
          variant="caption"
          sx={{
            display: 'block',
            fontSize: '0.6rem',
            fontWeight: 700,
            letterSpacing: '0.08em',
            color: 'text.secondary',
            textTransform: 'uppercase',
            mb: 0.5,
          }}
        >
          Roles
        </Typography>
        <RolePicker user={user} onMutate={onMutate} />
      </Box>

      {/* Secondary: shift + location, compact inline */}
      <Box sx={{ px: 2, pb: 1 }}>
        <Stack direction="row" spacing={1} alignItems="center" sx={{ gap: 1 }}>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography
              variant="caption"
              sx={{
                fontSize: '0.6rem',
                fontWeight: 700,
                letterSpacing: '0.06em',
                color: 'text.secondary',
                textTransform: 'uppercase',
                pl: 1,
              }}
            >
              Shift
            </Typography>
            <UserShiftSelect
              shift={user.shift}
              userId={user._id}
              onSuccess={(u) => {
                onMutate(u);
                toast.success(`Shift → ${u.shift}`);
              }}
            />
          </Box>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography
              variant="caption"
              sx={{
                fontSize: '0.6rem',
                fontWeight: 700,
                letterSpacing: '0.06em',
                color: 'text.secondary',
                textTransform: 'uppercase',
                pl: 1,
              }}
            >
              Location
            </Typography>
            <UserWorkLocationSelect
              location={user.workLocation}
              userId={user._id}
              onSuccess={(u) => {
                onMutate(u);
                toast.success(`Location → ${u.workLocation}`);
              }}
            />
          </Box>
        </Stack>
      </Box>

      <Divider />

      {/* Footer — active switch is the other primary interaction */}
      <Stack
        direction="row"
        alignItems="center"
        sx={{ px: 2, py: 1.25, gap: 1 }}
      >
        <Stack direction="row" alignItems="center" spacing={0.5}>
          <Typography
            variant="caption"
            sx={{
              fontSize: '0.7rem',
              fontWeight: 800,
              color: user.active ? '#10B981' : 'text.secondary',
              letterSpacing: '0.04em',
            }}
          >
            {user.active ? 'ACTIVE' : 'INACTIVE'}
          </Typography>
          <ActiveUserSwitch
            active={user.active}
            userId={user._id}
            onSuccess={(u) => {
              onMutate(u);
              toast.success(u.active ? 'Activated' : 'Deactivated');
            }}
          />
        </Stack>
        <Box sx={{ flex: 1 }} />
        <Button
          size="small"
          onClick={onOpen}
          endIcon={<IconArrowRight size={14} />}
          sx={{
            textTransform: 'none',
            fontWeight: 700,
            borderRadius: 2,
            color: tokens.colors.blueDark,
            px: 1.25,
            '&:hover': { bgcolor: alpha(tokens.colors.blue, 0.08) },
          }}
        >
          Open profile
        </Button>
      </Stack>
    </MotionBox>
  );
}

// ── Compact stats tile — bounded width, never stretches ──────────────────

interface StatTileProps {
  label: string;
  value: number;
  accent: string;
  icon: ReactElement;
  /** Dark variant — glass-style tile that reads on the dark command section. */
  dark?: boolean;
}

function StatTile({ label, value, accent, icon, dark }: StatTileProps) {
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1.25,
        px: 1.75,
        py: 1.25,
        borderRadius: 2.5,
        bgcolor: dark ? alpha('#fff', 0.06) : 'background.paper',
        border: '1px solid',
        borderColor: dark ? alpha('#fff', 0.1) : 'divider',
        backdropFilter: dark ? 'blur(6px)' : undefined,
        minWidth: 140,
        flex: '0 0 auto',
      }}
    >
      <Box
        sx={{
          width: 32,
          height: 32,
          borderRadius: 1.5,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: accent,
          bgcolor: alpha(accent, dark ? 0.2 : 0.12),
          flexShrink: 0,
        }}
      >
        {icon}
      </Box>
      <Box>
        <AnimatedCounter
          value={value}
          variant="h5"
          fontWeight={800}
          sx={{ lineHeight: 1, color: dark ? '#fff' : '#0A3555' }}
        />
        <Typography
          variant="caption"
          sx={{
            fontSize: '0.66rem',
            fontWeight: 700,
            letterSpacing: '0.08em',
            color: dark ? alpha('#fff', 0.72) : 'text.secondary',
            textTransform: 'uppercase',
            display: 'block',
            mt: 0.25,
          }}
        >
          {label}
        </Typography>
      </Box>
    </Box>
  );
}

// ── Section helpers ───────────────────────────────────────────────────────
// Used so the Active and Inactive rosters can render as visually distinct
// sections (header chip + thin divider line) on the "All" view. The grid
// itself is identical between the two — only the heading changes — so we
// extract it here to keep the page body declarative.

interface UserGridProps {
  users: iUser[];
  onOpen: (u: iUser) => void;
  onMutate: (u: iUser) => void;
}

function UserGrid({ users, onOpen, onMutate }: UserGridProps) {
  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: {
          xs: '1fr',
          sm: 'repeat(auto-fill, minmax(320px, 1fr))',
        },
        gap: 2,
      }}
    >
      {users.map((u) => (
        <UserCard
          key={u._id}
          user={u}
          onOpen={() => onOpen(u)}
          onMutate={onMutate}
        />
      ))}
    </Box>
  );
}

interface RosterSectionProps {
  title: string;
  count: number;
  accent: string;
  icon: ReactElement;
  collapsible?: boolean;
  defaultExpanded?: boolean;
  children: React.ReactNode;
}

function RosterSection({
  title,
  count,
  accent,
  icon,
  collapsible = false,
  defaultExpanded = true,
  children,
}: RosterSectionProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  return (
    <Box sx={{ mb: 3 }}>
      <Stack
        direction="row"
        alignItems="center"
        spacing={1.25}
        sx={{
          mb: 1.5,
          cursor: collapsible ? 'pointer' : 'default',
          userSelect: 'none',
        }}
        onClick={() => collapsible && setExpanded((v) => !v)}
        role={collapsible ? 'button' : undefined}
        tabIndex={collapsible ? 0 : undefined}
        onKeyDown={(e) => {
          if (
            collapsible &&
            (e.key === 'Enter' || e.key === ' ')
          ) {
            e.preventDefault();
            setExpanded((v) => !v);
          }
        }}
      >
        <Box
          sx={{
            width: 26,
            height: 26,
            borderRadius: 1.5,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: accent,
            bgcolor: alpha(accent, 0.12),
            flexShrink: 0,
          }}
        >
          {icon}
        </Box>
        <Typography
          variant="body1"
          sx={{
            fontWeight: 800,
            fontSize: '0.95rem',
            color: '#0A3555',
            letterSpacing: '0.01em',
          }}
        >
          {title}
        </Typography>
        <Chip
          label={count}
          size="small"
          sx={{
            height: 20,
            fontWeight: 800,
            fontSize: '0.7rem',
            bgcolor: alpha(accent, 0.12),
            color: accent,
            border: `1px solid ${alpha(accent, 0.25)}`,
          }}
        />
        <Box
          sx={{
            flex: 1,
            height: 1,
            bgcolor: 'divider',
            ml: 1,
            minWidth: 16,
          }}
        />
        {collapsible && (
          <IconChevronDown
            size={16}
            color={tokens.colors.lightTextSecondary}
            style={{
              transition: 'transform 0.2s ease',
              transform: expanded ? 'rotate(0deg)' : 'rotate(-90deg)',
              flexShrink: 0,
            }}
          />
        )}
      </Stack>
      {expanded && children}
    </Box>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────

type StatusFilter = 'all' | 'active' | 'inactive';

function UserManagement() {
  const {
    data: users,
    loading,
    error,
    setData: setUsers,
    loadData,
  } = useFetchData<iUser[]>(getUsersList, []);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [mode, setMode] = useState<'view' | 'edit'>('view');
  const [selectedUser, setSelectedUser] = useState<iUser>();

  // Filters
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<StatusFilter>('all');
  const [roleFilter, setRoleFilter] = useState<UserRole[]>([]);

  async function getUsersList() {
    const { data } = await usersList();
    return data.users || [];
  }

  function handleViewDetails(u: iUser): void {
    setSelectedUser(u);
    setDrawerOpen(true);
  }

  function handleMutate(usr: iUser) {
    setUsers((prev) =>
      (prev || []).map((u) => (u._id === usr._id ? usr : u)),
    );
  }

  const toggleRoleFilter = (r: UserRole) => {
    setRoleFilter((prev) =>
      prev.includes(r) ? prev.filter((x) => x !== r) : [...prev, r],
    );
  };

  const list = users || [];

  const counts = useMemo(() => {
    let active = 0;
    let inactive = 0;
    let premium = 0;
    let online = 0;
    let recent = 0;
    let idle = 0;
    for (const u of list) {
      if (u.active) active++;
      else inactive++;
      if (u.premium) premium++;
      const p = presenceOf(u);
      if (p === 'online') online++;
      else if (p === 'recent') recent++;
      else idle++;
    }
    return {
      total: list.length,
      active,
      inactive,
      premium,
      online,
      recent,
      idle,
    };
  }, [list]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return list
      .filter((u) => {
        if (status === 'active' && !u.active) return false;
        if (status === 'inactive' && u.active) return false;
        if (roleFilter.length) {
          const uRoles = u.role || [];
          if (!roleFilter.some((r) => uRoles.includes(r))) return false;
        }
        if (q) {
          const hay = `${u.firstName} ${u.lastName} ${u.email}`.toLowerCase();
          if (!hay.includes(q)) return false;
        }
        return true;
      })
      .sort((a, b) => {
        // Active first, then alphabetical.
        if (a.active !== b.active) return a.active ? -1 : 1;
        return (a.firstName || '').localeCompare(b.firstName || '');
      });
  }, [list, search, status, roleFilter]);

  // Partition for the split-by-status render on the "All" view.
  // The `filtered` sort already keeps each subset alphabetically ordered;
  // splitting just removes the active-first ordering at the boundary,
  // which is irrelevant once each side has its own labeled section.
  const { activeList, inactiveList } = useMemo(() => {
    const act: iUser[] = [];
    const inact: iUser[] = [];
    for (const u of filtered) {
      if (u.active) act.push(u);
      else inact.push(u);
    }
    return { activeList: act, inactiveList: inact };
  }, [filtered]);

  const hasActiveFilter =
    search.trim().length > 0 || status !== 'all' || roleFilter.length > 0;

  const resetFilters = () => {
    setSearch('');
    setStatus('all');
    setRoleFilter([]);
  };

  return (
    <Box sx={{ maxWidth: 1400, mx: 'auto' }}>
      {/* Title + refresh */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          mb: 2.5,
          flexWrap: 'wrap',
          gap: 1.5,
        }}
      >
        <Box>
          <Typography
            variant="h1"
            fontWeight={700}
            sx={{ mb: 0.25, fontSize: { xs: '1.5rem', md: '1.875rem' } }}
          >
            User{' '}
            <Box
              component="span"
              sx={{
                background: tokens.gradients.pinkBlue,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              Management
            </Box>
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Assign roles · activate or deactivate · open profile for details
          </Typography>
        </Box>
        <Tooltip title="Refresh">
          <IconButton
            onClick={loadData}
            disabled={loading}
            sx={{
              bgcolor: '#ECF2FF',
              borderRadius: '10px',
              width: 40,
              height: 40,
              '&:hover': { bgcolor: '#D6E4FF' },
            }}
          >
            <IconRefresh size={18} color="#5D87FF" />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Single dark Command section — holds stats + filter + live-pulse
          radar. Roster cards live below this on the normal light background,
          so the whole "operational controls" surface reads as one frame and
          the actual people list reads as the main content. */}
      <MotionBox
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        sx={{
          position: 'relative',
          borderRadius: 4,
          overflow: 'hidden',
          background: tokens.gradients.darkSurface,
          color: '#fff',
          p: { xs: 2, sm: 2.5 },
          // Generous margin-bottom so the roster cards below get clean
          // breathing room from the dark command section.
          mb: { xs: 3, md: 5 },
        }}
      >
        {/* Ambient orbs */}
        <Box
          sx={{
            position: 'absolute',
            top: -60,
            right: -30,
            width: 220,
            height: 220,
            borderRadius: '50%',
            background: `radial-gradient(circle, ${alpha(tokens.colors.pink, 0.22)} 0%, transparent 70%)`,
            filter: 'blur(55px)',
            pointerEvents: 'none',
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            bottom: -60,
            left: '20%',
            width: 220,
            height: 220,
            borderRadius: '50%',
            background: `radial-gradient(circle, ${alpha('#10B981', 0.18)} 0%, transparent 70%)`,
            filter: 'blur(55px)',
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

        {/* 2-col: stats+filter on the left, radar on the right. Stretch so
            the filter bar grows to match the radar column's height — the
            radar + legend is typically taller than stats + compact filter. */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: '1fr 240px' },
            gap: { xs: 2.5, md: 3 },
            alignItems: 'stretch',
            position: 'relative',
          }}
        >
          {/* LEFT: stats + filter — flex column with space-between so stats
              pin to the top of the column and the filter bar drops to the
              bottom. The bar's bottom edge lands alongside the radar's
              legend on the right. */}
          <Box
            sx={{
              minWidth: 0,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            {/* Stats strip — no mb: space-between on the parent handles
                the gap to the filter bar below. */}
            <Box
              sx={{
                display: 'flex',
                gap: 1.25,
                flexWrap: 'wrap',
                alignContent: 'flex-start',
              }}
            >
              <StatTile
                dark
                label="Total"
                value={counts.total}
                accent={tokens.colors.blueLight}
                icon={<IconUsers size={16} />}
              />
              <StatTile
                dark
                label="Active"
                value={counts.active}
                accent="#10B981"
                icon={<IconUserCheck size={16} />}
              />
              <StatTile
                dark
                label="Inactive"
                value={counts.inactive}
                accent="#CBD5E1"
                icon={<IconUserOff size={16} />}
              />
              <StatTile
                dark
                label="Online now"
                value={counts.online}
                accent="#10B981"
                icon={<IconCircleDot size={16} />}
              />
              <StatTile
                dark
                label="Premium"
                value={counts.premium}
                accent="#FCD34D"
                icon={<IconCrown size={16} />}
              />
            </Box>

            {/* Filter bar — glass card within the dark section. Natural
                height; the left column has `justify-content: space-between`
                so stats pin to the top and this bar drops to the bottom,
                landing alongside the radar's legend. */}
            <Box
              sx={{
                bgcolor: alpha('#fff', 0.05),
                borderRadius: 3,
                border: '1px solid',
                borderColor: alpha('#fff', 0.08),
                backdropFilter: 'blur(6px)',
                p: 2,
              }}
            >
              <Stack spacing={1.5}>
                {/* Row 1: search + status toggle + result count */}
                <Stack
                  direction={{ xs: 'column', sm: 'row' }}
                  spacing={1.25}
                  alignItems={{ xs: 'stretch', sm: 'center' }}
                >
                  <TextField
                    size="small"
                    placeholder="Search by name or email…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    sx={{
                      flex: 1,
                      maxWidth: { sm: 360 },
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2.5,
                        bgcolor: alpha('#fff', 0.08),
                        color: '#fff',
                        '& .MuiOutlinedInput-notchedOutline': {
                          borderColor: alpha('#fff', 0.15),
                        },
                        '&:hover .MuiOutlinedInput-notchedOutline': {
                          borderColor: alpha('#fff', 0.3),
                        },
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                          borderColor: alpha(tokens.colors.pink, 0.6),
                        },
                        '& input': { color: '#fff' },
                        '& input::placeholder': {
                          color: alpha('#fff', 0.5),
                          opacity: 1,
                        },
                      },
                    }}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <IconSearch
                            size={16}
                            color={alpha('#fff', 0.65)}
                          />
                        </InputAdornment>
                      ),
                      endAdornment: search ? (
                        <InputAdornment position="end">
                          <IconButton
                            size="small"
                            onClick={() => setSearch('')}
                            sx={{ color: alpha('#fff', 0.7) }}
                          >
                            <IconX size={14} />
                          </IconButton>
                        </InputAdornment>
                      ) : undefined,
                    }}
                  />
                  <ToggleButtonGroup
                    value={status}
                    exclusive
                    size="small"
                    onChange={(_, v) => v && setStatus(v as StatusFilter)}
                    sx={{
                      '& .MuiToggleButton-root': {
                        textTransform: 'none',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        px: 1.75,
                        py: 0.5,
                        borderRadius: '8px !important',
                        border: '1px solid',
                        borderColor: alpha('#fff', 0.15),
                        color: alpha('#fff', 0.75),
                        mx: 0.25,
                        '&:hover': { bgcolor: alpha('#fff', 0.08) },
                        '&.Mui-selected': {
                          bgcolor: alpha(tokens.colors.pink, 0.22),
                          color: '#fff',
                          borderColor: alpha(tokens.colors.pink, 0.5),
                          '&:hover': {
                            bgcolor: alpha(tokens.colors.pink, 0.28),
                          },
                        },
                      },
                    }}
                  >
                    <ToggleButton value="all">All</ToggleButton>
                    <ToggleButton value="active">Active</ToggleButton>
                    <ToggleButton value="inactive">Inactive</ToggleButton>
                  </ToggleButtonGroup>
                  <Box sx={{ flex: 1 }} />
                  <Typography
                    variant="caption"
                    sx={{
                      color: alpha('#fff', 0.72),
                      fontWeight: 600,
                      fontSize: '0.72rem',
                    }}
                  >
                    {filtered.length} of {counts.total} showing
                  </Typography>
                </Stack>

                {/* Row 2: role filter chips */}
                <Stack
                  direction="row"
                  spacing={0.75}
                  alignItems="center"
                  sx={{ flexWrap: 'wrap', gap: 0.75 }}
                >
                  <Typography
                    variant="caption"
                    sx={{
                      fontWeight: 700,
                      color: alpha('#fff', 0.7),
                      letterSpacing: '0.04em',
                      mr: 0.5,
                    }}
                  >
                    Role:
                  </Typography>
                  {ROLE_ORDER.map((r) => {
                    const m = ROLE_META[r];
                    const selected = roleFilter.includes(r);
                    return (
                      <Chip
                        key={r}
                        label={m.label}
                        size="small"
                        clickable
                        onClick={() => toggleRoleFilter(r)}
                        sx={{
                          height: 24,
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          letterSpacing: '0.02em',
                          bgcolor: selected
                            ? alpha(m.accent, 0.28)
                            : 'transparent',
                          color: selected ? '#fff' : alpha('#fff', 0.7),
                          border: `1px solid ${
                            selected
                              ? alpha(m.accent, 0.55)
                              : alpha('#fff', 0.18)
                          }`,
                          '&:hover': {
                            bgcolor: alpha(m.accent, 0.22),
                            borderColor: alpha(m.accent, 0.5),
                          },
                        }}
                      />
                    );
                  })}
                  {hasActiveFilter && (
                    <Button
                      size="small"
                      onClick={resetFilters}
                      startIcon={<IconX size={12} />}
                      sx={{
                        ml: 0.5,
                        textTransform: 'none',
                        fontWeight: 700,
                        fontSize: '0.7rem',
                        color: alpha('#fff', 0.65),
                        borderRadius: 2,
                        px: 1,
                        minHeight: 24,
                        '&:hover': { bgcolor: alpha('#fff', 0.1) },
                      }}
                    >
                      Clear filters
                    </Button>
                  )}
                </Stack>
              </Stack>
            </Box>
          </Box>

          {/* RIGHT: radar */}
          <Box sx={{ position: 'relative', minWidth: 0 }}>
            <Stack
              direction="row"
              alignItems="center"
              spacing={0.75}
              sx={{ mb: 1 }}
            >
              <Typography
                variant="caption"
                sx={{
                  color: '#A7F3D0',
                  fontWeight: 800,
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  fontSize: '0.62rem',
                }}
              >
                Live Pulse
              </Typography>
              <Box sx={{ flex: 1 }} />
              <Typography
                variant="caption"
                sx={{ color: alpha('#fff', 0.55), fontSize: '0.62rem' }}
              >
                click a dot
              </Typography>
            </Stack>

            <Box sx={{ position: 'relative', py: 0.5 }}>
              <PresenceRadar
                users={list}
                onSelect={handleViewDetails}
                size={220}
              />
            </Box>

            {/* Mini legend */}
            <Stack
              direction="row"
              spacing={1.25}
              justifyContent="center"
              flexWrap="wrap"
              sx={{ mt: 1.25, rowGap: 0.5 }}
            >
              {(
                [
                  ['online', counts.online],
                  ['recent', counts.recent],
                  ['idle', counts.idle],
                ] as Array<[Presence, number]>
              ).map(([k, v]) => (
                <Stack
                  key={k}
                  direction="row"
                  spacing={0.5}
                  alignItems="center"
                >
                  <Box
                    sx={{
                      width: 6,
                      height: 6,
                      borderRadius: '50%',
                      bgcolor: PRESENCE_DOT[k],
                      boxShadow:
                        k === 'online'
                          ? `0 0 6px ${alpha(PRESENCE_DOT[k], 0.8)}`
                          : 'none',
                    }}
                  />
                  <Typography
                    variant="caption"
                    sx={{
                      fontSize: '0.64rem',
                      fontWeight: 700,
                      color: alpha('#fff', 0.72),
                      letterSpacing: '0.04em',
                    }}
                  >
                    {v} {k}
                  </Typography>
                </Stack>
              ))}
            </Stack>
          </Box>
        </Box>
      </MotionBox>

      {/* Error / Loading / Grid — light section for the roster cards */}
      {error ? (
        <Box textAlign="center" py={6}>
          <Typography color="error" mb={2}>
            {error}
          </Typography>
          <Button variant="outlined" onClick={loadData} startIcon={<Sync />}>
            Retry
          </Button>
        </Box>
      ) : loading && !list.length ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
          <CircularProgress />
        </Box>
      ) : filtered.length === 0 ? (
        <Box
          sx={{
            textAlign: 'center',
            py: 8,
            borderRadius: 3,
            border: '1px dashed',
            borderColor: 'divider',
            bgcolor: alpha(tokens.colors.blue, 0.03),
          }}
        >
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            No users match the current filters.
          </Typography>
          {hasActiveFilter && (
            <Button
              size="small"
              variant="outlined"
              onClick={resetFilters}
              startIcon={<IconX size={12} />}
              sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 2 }}
            >
              Clear filters
            </Button>
          )}
        </Box>
      ) : (
        // ── Roster — split by active state ──
        // On the "All" tab we render two labeled sections so HR can see at
        // a glance who's currently active vs. deactivated. The inactive
        // section is collapsible (default expanded) because the count is
        // often smaller but still worth scanning.
        // When the user has narrowed the status filter to one of them the
        // single matching grid renders without any section header (no
        // point repeating "Active users" when that's the only filter).
        status === 'active' ? (
          <UserGrid
            users={activeList}
            onOpen={handleViewDetails}
            onMutate={handleMutate}
          />
        ) : status === 'inactive' ? (
          <UserGrid
            users={inactiveList}
            onOpen={handleViewDetails}
            onMutate={handleMutate}
          />
        ) : (
          <>
            {activeList.length > 0 && (
              <RosterSection
                title="Active users"
                count={activeList.length}
                accent="#10B981"
                icon={<IconUserCheck size={14} />}
              >
                <UserGrid
                  users={activeList}
                  onOpen={handleViewDetails}
                  onMutate={handleMutate}
                />
              </RosterSection>
            )}
            {inactiveList.length > 0 && (
              <RosterSection
                title="Inactive users"
                count={inactiveList.length}
                accent="#94A3B8"
                icon={<IconUserOff size={14} />}
                collapsible
              >
                <UserGrid
                  users={inactiveList}
                  onOpen={handleViewDetails}
                  onMutate={handleMutate}
                />
              </RosterSection>
            )}
          </>
        )
      )}

      {/* Drawer: profile form + login activity — unchanged */}
      {!!selectedUser && (
        <CustomDrawer
          open={drawerOpen}
          onClose={() => {
            setDrawerOpen(false);
            setMode('view');
          }}
          title={
            (mode === 'view' ? '' : 'Edit ') +
            'Profile: ' +
            `${selectedUser.firstName} ${selectedUser.lastName}`
          }
          closeOnOutSideClick={mode === 'view'}
        >
          <MyForm modeState={[mode, setMode]} user={selectedUser} />

          {mode === 'view' && (
            <Box sx={{ mt: 3 }}>
              {/* Date-of-Joining editor — admin / super-admin can set
                  or correct DOJ for any employee. Recomputes the
                  probation clock and re-seeds the year's balances. */}
              <DateOfJoiningEditor user={selectedUser} />

              {/* canEdit toggle lives in the drawer — it's an advanced
                  permission flag, not a day-to-day admin action, so keeping
                  it off the main card reduces noise. */}
              <Stack
                direction="row"
                alignItems="center"
                spacing={1.25}
                sx={{
                  mb: 2,
                  p: 1.5,
                  borderRadius: 2,
                  border: '1px solid',
                  borderColor: 'divider',
                  bgcolor: alpha(tokens.colors.blue, 0.03),
                }}
              >
                <Box sx={{ flex: 1 }}>
                  <Typography fontWeight={700} variant="body2">
                    Allow this user to edit their own profile
                  </Typography>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ display: 'block' }}
                  >
                    When off, the user sees profile fields read-only.
                  </Typography>
                </Box>
                <CanEditSwitch
                  canEdit={!!selectedUser.canEdit}
                  jUser={selectedUser}
                  onSuccess={(u) => {
                    handleMutate(u);
                    setSelectedUser(u);
                    toast.success(
                      u.canEdit ? 'Edit granted' : 'Edit revoked',
                    );
                  }}
                />
              </Stack>

              {/* Login activity */}
              <Box
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
                  <Box
                    sx={{
                      width: 28,
                      height: 28,
                      borderRadius: 2,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      bgcolor: alpha(tokens.colors.pink, 0.1),
                      color: tokens.colors.pink,
                    }}
                  >
                    <IconActivity size={16} />
                  </Box>
                  <Typography
                    variant="body1"
                    fontWeight={600}
                    color="#2A3547"
                  >
                    Login Activity
                  </Typography>
                </Box>
                <Box sx={{ height: 520, width: '100%' }}>
                  <DataGrid
                    columns={activityColumn}
                    rows={[...(selectedUser?.activity || [])].reverse()}
                    getRowId={(row) => row._id}
                    slots={{ toolbar: GridToolbar }}
                    slotProps={{ toolbar: { showQuickFilter: true } }}
                    sx={{
                      border: 'none',
                      fontSize: '0.8125rem',
                      '& .MuiDataGrid-columnHeaders': {
                        bgcolor: '#F6F9FC',
                        borderBottom: '1px solid',
                        borderColor: 'grey.200',
                      },
                      '& .MuiDataGrid-columnHeaderTitle': {
                        fontWeight: 600,
                        fontSize: '0.75rem',
                        color: '#2A3547',
                        textTransform: 'uppercase',
                      },
                      '& .MuiDataGrid-cell': {
                        borderBottom: '1px solid',
                        borderColor: 'grey.100',
                      },
                      '& .MuiDataGrid-cell:focus, & .MuiDataGrid-cell:focus-within':
                        { outline: 'none' },
                      '& .MuiDataGrid-columnHeader:focus, & .MuiDataGrid-columnHeader:focus-within':
                        { outline: 'none' },
                      '& .MuiDataGrid-scrollbar': { scrollbarWidth: 'thin' },
                    }}
                  />
                </Box>
              </Box>
            </Box>
          )}
        </CustomDrawer>
      )}
    </Box>
  );
}

export default UserManagement;

// ── Activity grid columns ─────────────────────────────────────────────────

const dateFormater = (date?: string) => {
  if (!date) return;
  return moment(date).format(dateFormate2 + ' ' + timeFormate);
};
const extractLocationField = (val?: string, field?: string) => {
  if (!val || !field) return;
  try {
    const parsed = JSON.parse(val);
    if (!parsed || typeof parsed !== 'object' || !(field in parsed)) return;
    return (parsed as Record<string, unknown>)[field];
  } catch {
    return;
  }
};

const activityColumn: GridColDef<iUserActivity>[] = [
  {
    field: 'loggedInAt',
    headerName: 'Logged-In At',
    width: 200,
    valueGetter: (v) => dateFormater(v) || 'NA',
  },
  {
    field: 'loggedOutAt',
    headerName: 'Logged-Out At',
    width: 200,
    valueGetter: (v) => dateFormater(v) || 'NA',
  },
  { field: 'ip', headerName: 'IP', width: 150, valueGetter: (v) => v || 'NA' },
  {
    field: 'latitude',
    headerName: 'Latitude',
    width: 130,
    valueGetter: (_v, row) =>
      extractLocationField(row.location, 'latitude') || 'NA',
  },
  {
    field: 'longitude',
    headerName: 'Longitude',
    width: 130,
    valueGetter: (_v, row) =>
      extractLocationField(row.location, 'longitude') || 'NA',
  },
  {
    field: 'altitude',
    headerName: 'Altitude',
    width: 120,
    valueGetter: (_v, row) =>
      extractLocationField(row.location, 'altitude') || 'NA',
  },
  {
    field: 'accuracy',
    headerName: 'Accuracy',
    width: 120,
    valueGetter: (_v, row) =>
      extractLocationField(row.location, 'accuracy') || 'NA',
  },
];

// ── Profile form (drawer body) — preserved ────────────────────────────────

const MyForm = ({ user, modeState }: MyFormProps) => {
  const [mode, setMode] = modeState;
  const {
    data: myProfile,
    setData: setMyProfile,
    loadData,
    loading,
    error,
  } = useFetchData(getProfile, [user]);
  async function getProfile() {
    return await getProfileByUser({ ...user, id: user._id });
  }
  if (loading)
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
        <CircularProgress />
      </Box>
    );
  if (error) {
    return (
      <Box textAlign="center" py={4}>
        <Typography color="error" mb={1}>
          {error}
        </Typography>
        <IconButton onClick={loadData}>
          <Sync color="primary" />
        </IconButton>
      </Box>
    );
  }
  return (
    <ProfileForm
      template={getProfileFormInitialValues(myProfile)}
      profileFormSections={profileFormSections}
      documentFormSection={documentFormSection}
      viewMode={mode === 'view'}
      onClickCancel={() => setMode('view')}
      onClickEdit={() => setMode('edit')}
      onSubmitSuccessfully={(p) => {
        setMyProfile(p);
        setMode('view');
      }}
    />
  );
};

interface MyFormProps {
  user: iUser;
  modeState: ['view' | 'edit', Dispatch<SetStateAction<'view' | 'edit'>>];
}
