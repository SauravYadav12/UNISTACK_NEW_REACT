import { useEffect, useMemo, useState } from 'react';
import { Box, Typography, Stack, alpha, IconButton, Tooltip } from '@mui/material';
import { IconRefresh, IconBolt, IconCalendarTime } from '@tabler/icons-react';
import { motion } from 'framer-motion';
import { tokens } from '../../theme/theme';
import { iUser, UserShift } from '../../Interfaces/iUser';
import { dateByUserShift, getOfficeStartTime, timeZoneKeyByUserShift } from '../../utils/dateUtil';

const MotionBox = motion.create(Box);

interface Props {
  user: iUser;
  todayInterviews?: number;
  newRequirements?: number;
  activeTeammates?: number;
  onRefresh?: () => void;
}

function getGreeting(hour: number) {
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  if (hour < 21) return 'Good evening';
  return 'Working late';
}

/**
 * MissionRing — conic-gradient ring showing elapsed vs remaining work day.
 */
function MissionRing({ progressPct, size = 86 }: { progressPct: number; size?: number }) {
  const stroke = 8;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.min(100, Math.max(0, progressPct));
  const offset = circumference * (1 - clamped / 100);

  return (
    <Box sx={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <defs>
          <linearGradient id="ring-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={tokens.colors.pink} />
            <stop offset="100%" stopColor={tokens.colors.blue} />
          </linearGradient>
        </defs>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={alpha('#fff', 0.1)}
          strokeWidth={stroke}
          fill="none"
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="url(#ring-gradient)"
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
        />
      </svg>
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#fff',
        }}
      >
        <Typography variant="h6" fontWeight={800} sx={{ lineHeight: 1 }}>
          {clamped.toFixed(0)}%
        </Typography>
        <Typography variant="caption" sx={{ fontSize: '0.6rem', color: alpha('#fff', 0.65) }}>
          day
        </Typography>
      </Box>
    </Box>
  );
}

export default function CommandHero({
  user,
  todayInterviews = 0,
  newRequirements = 0,
  activeTeammates = 0,
  onRefresh,
}: Props) {
  // Live clock
  const [now, setNow] = useState(() => dateByUserShift(user.shift || UserShift.India));

  useEffect(() => {
    const id = setInterval(() => setNow(dateByUserShift(user.shift || UserShift.India)), 1000);
    return () => clearInterval(id);
  }, [user.shift]);

  // Workday progress
  const { progressPct, remaining } = useMemo(() => {
    const shift = user.shift || UserShift.India;
    const { h, m } = getOfficeStartTime(shift);
    const start = now.clone().hour(h).minute(m).second(0).millisecond(0);
    const end = start.clone().add(9, 'hours');
    const total = end.valueOf() - start.valueOf();
    const elapsed = now.valueOf() - start.valueOf();
    let pct = 0;
    if (elapsed <= 0) pct = 0;
    else if (elapsed >= total) pct = 100;
    else pct = (elapsed / total) * 100;
    const remMs = Math.max(0, end.valueOf() - now.valueOf());
    const remH = Math.floor(remMs / (1000 * 60 * 60));
    const remM = Math.floor((remMs / (1000 * 60)) % 60);
    const rem =
      remMs === 0
        ? 'Day complete'
        : remH > 0
          ? `${remH}h ${remM}m to go`
          : `${remM}m to go`;
    return { progressPct: pct, remaining: rem };
  }, [now, user.shift]);

  const timeStr = now.format('HH:mm:ss');
  const dateStr = now.format('dddd · MMMM D, YYYY');
  const hour = now.hour();
  const tzKey = timeZoneKeyByUserShift(user.shift || UserShift.India);

  return (
    <Box
      sx={{
        position: 'relative',
        borderRadius: 4,
        overflow: 'hidden',
        background: tokens.gradients.darkSurface,
        color: '#FFFFFF',
        p: { xs: 2.5, sm: 3.5 },
      }}
    >
      {/* orbs */}
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
          left: '35%',
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
        {/* Left: Greeting + clock */}
        <Box>
          <Typography
            variant="caption"
            sx={{ color: alpha('#fff', 0.7), letterSpacing: '0.06em', fontWeight: 600 }}
          >
            MISSION CONTROL · {tzKey}
          </Typography>
          <Typography variant="h3" fontWeight={700} sx={{ color: '#fff', lineHeight: 1.15, mt: 0.5 }}>
            {getGreeting(hour)},{' '}
            <Box
              component="span"
              sx={{
                background: tokens.gradients.pinkBlue,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              {user.firstName || 'there'}
            </Box>
          </Typography>
          <Stack direction="row" alignItems="center" spacing={1.25} sx={{ mt: 1 }}>
            <Typography
              variant="h5"
              fontWeight={800}
              sx={{
                color: '#fff',
                fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {timeStr}
            </Typography>
            <Box sx={{ width: 4, height: 4, borderRadius: '50%', bgcolor: alpha('#fff', 0.3) }} />
            <Typography variant="body2" sx={{ color: alpha('#fff', 0.7) }}>
              {dateStr}
            </Typography>
          </Stack>
        </Box>

        {/* Right: Ring + stats + refresh */}
        <Stack direction="row" alignItems="center" spacing={2.5}>
          {/* Quick stats */}
          <Stack direction={{ xs: 'row', sm: 'row' }} spacing={1.25}>
            {[
              {
                label: "Today's interviews",
                value: todayInterviews,
                color: tokens.colors.blue,
              },
              {
                label: 'New reqs (24h)',
                value: newRequirements,
                color: tokens.colors.pink,
              },
              {
                label: 'Team online',
                value: activeTeammates,
                color: tokens.colors.yellow,
              },
            ].map((s) => (
              <MotionBox
                key={s.label}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                sx={{
                  bgcolor: alpha('#fff', 0.08),
                  border: `1px solid ${alpha('#fff', 0.12)}`,
                  borderRadius: 2.5,
                  px: 1.5,
                  py: 1.25,
                  minWidth: 96,
                  backdropFilter: 'blur(8px)',
                }}
              >
                <Typography
                  variant="h4"
                  fontWeight={800}
                  sx={{ color: '#fff', lineHeight: 1, mb: 0.25 }}
                >
                  {s.value}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{
                    color: alpha('#fff', 0.7),
                    letterSpacing: '0.03em',
                    fontSize: '0.65rem',
                  }}
                >
                  {s.label}
                </Typography>
                <Box
                  sx={{
                    height: 2,
                    borderRadius: 1,
                    bgcolor: s.color,
                    mt: 0.5,
                    boxShadow: `0 0 8px ${alpha(s.color, 0.6)}`,
                  }}
                />
              </MotionBox>
            ))}
          </Stack>

          {/* Mission ring */}
          <Box sx={{ display: { xs: 'none', md: 'flex' }, flexDirection: 'column', alignItems: 'center', gap: 0.5 }}>
            <MissionRing progressPct={progressPct} />
            <Stack direction="row" alignItems="center" spacing={0.5}>
              <IconBolt size={12} color={tokens.colors.yellow} />
              <Typography variant="caption" sx={{ color: alpha('#fff', 0.7), fontSize: '0.7rem' }}>
                {remaining}
              </Typography>
            </Stack>
          </Box>

          {onRefresh && (
            <Tooltip title="Refresh data">
              <IconButton
                onClick={onRefresh}
                sx={{
                  bgcolor: alpha('#fff', 0.1),
                  color: '#fff',
                  borderRadius: 2,
                  width: 40,
                  height: 40,
                  '&:hover': { bgcolor: alpha('#fff', 0.18) },
                }}
              >
                <IconRefresh size={18} />
              </IconButton>
            </Tooltip>
          )}
        </Stack>
      </Stack>

      {/* Mobile mission ring row */}
      <Box
        sx={{
          display: { xs: 'flex', md: 'none' },
          mt: 2.5,
          pt: 2.5,
          borderTop: `1px solid ${alpha('#fff', 0.1)}`,
          alignItems: 'center',
          gap: 2,
          position: 'relative',
          zIndex: 1,
        }}
      >
        <MissionRing progressPct={progressPct} size={64} />
        <Box>
          <Stack direction="row" alignItems="center" spacing={0.75}>
            <IconCalendarTime size={14} color={alpha('#fff', 0.7) as unknown as string} />
            <Typography variant="caption" sx={{ color: alpha('#fff', 0.7), fontWeight: 600 }}>
              WORK DAY PROGRESS
            </Typography>
          </Stack>
          <Typography variant="subtitle2" fontWeight={700} sx={{ color: '#fff' }}>
            {remaining}
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}
