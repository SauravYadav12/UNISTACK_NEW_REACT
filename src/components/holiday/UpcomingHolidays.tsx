import { useMemo } from 'react';
import { Box, Stack, Typography, alpha } from '@mui/material';
import { motion } from 'framer-motion';
import moment from 'moment';

import { Holiday } from '../../Interfaces/holiday';
import { useHoliday } from '../../contextProviders/HolidayContextProvider';
import { useAuth } from '../../AuthGaurd/AuthContextProvider';
import { UserRole } from '../../Interfaces/iUser';
import { holidaysForUserShift } from '../../utils/holidayUtil';
import { tokens } from '../../theme/theme';

// Single, shift-aware upcoming-holidays card. Previously this widget showed
// two side-by-side cards (India + United States) regardless of who was
// looking. Per product feedback, every employee should see ONE list — the
// holidays that apply to their shift, plus any company-wide ("ALL") ones —
// without the cognitive overhead of two columns. Super-admins keep seeing
// everything (both shifts) since they manage the calendar.

interface Props {
  /** Retained for API compatibility; not used. */
  forAdmin?: boolean;
}

const WINDOW_DAYS = 30;
const MAX_VISIBLE = 5;

const UpcomingHolidays = (_: Props) => {
  const { holidayState } = useHoliday();
  const { iUser } = useAuth();
  const today = useMemo(() => moment().startOf('day'), []);
  const cutoff = useMemo(() => today.clone().add(WINDOW_DAYS, 'days'), [today]);

  const isSuperAdmin = !!iUser?.role?.includes(UserRole['super-admin']);
  // Super-admins see every shift's holidays since they're the ones managing
  // the calendar; employees see only their own shift + company-wide.
  const visibleHolidays = useMemo(() => {
    const all = holidayState.data || [];
    if (isSuperAdmin) return all;
    return holidaysForUserShift(all, iUser?.shift);
  }, [holidayState.data, isSuperAdmin, iUser?.shift]);

  const upcoming = useMemo<Holiday[]>(() => {
    return visibleHolidays
      .filter((h) => {
        const hd = moment(h.fromDate);
        return hd.isSameOrAfter(today, 'day') && hd.isSameOrBefore(cutoff, 'day');
      })
      .sort((a, b) => moment(a.fromDate).diff(moment(b.fromDate)))
      .slice(0, MAX_VISIBLE);
  }, [visibleHolidays, today, cutoff]);

  return (
    <Box
      sx={{
        position: 'relative',
        borderRadius: 3,
        overflow: 'hidden',
        bgcolor: 'background.paper',
        border: '1px solid',
        borderColor: 'divider',
        boxShadow: '0 2px 12px rgba(3, 40, 64, 0.04)',
      }}
    >
      {/* Navy header strip with tri-color dot accent */}
      <Box
        sx={{
          bgcolor: tokens.colors.brand,
          color: '#fff',
          px: 2,
          py: 1.25,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            top: 8,
            right: 10,
            display: 'flex',
            gap: 0.5,
            opacity: 0.55,
          }}
        >
          <Box sx={{ width: 5, height: 5, borderRadius: '50%', bgcolor: tokens.colors.pink }} />
          <Box sx={{ width: 5, height: 5, borderRadius: '50%', bgcolor: tokens.colors.blue }} />
          <Box sx={{ width: 5, height: 5, borderRadius: '50%', bgcolor: tokens.colors.yellow }} />
        </Box>
        <Typography sx={{ fontSize: 10, letterSpacing: 3, fontWeight: 700, opacity: 0.7 }}>
          NEXT {WINDOW_DAYS} DAYS
        </Typography>
        <Typography sx={{ fontSize: 14, fontWeight: 800, mt: 0.25 }}>
          Upcoming holidays
        </Typography>
      </Box>

      {upcoming.length === 0 ? (
        <Box sx={{ p: 2.5, minHeight: 120, display: 'flex', alignItems: 'center' }}>
          <Typography
            sx={{
              fontSize: 12,
              color: tokens.colors.lightTextSecondary,
              fontStyle: 'italic',
            }}
          >
            No holidays in the next {WINDOW_DAYS} days.
          </Typography>
        </Box>
      ) : (
        <Stack divider={<Box sx={{ borderTop: `1px dashed ${alpha(tokens.colors.brand, 0.12)}` }} />}>
          {upcoming.map((h, i) => (
            <UpcomingRow key={h._id} holiday={h} today={today} index={i} />
          ))}
        </Stack>
      )}
    </Box>
  );
};

function UpcomingRow({
  holiday,
  today,
  index,
}: {
  holiday: Holiday;
  today: moment.Moment;
  index: number;
}) {
  const daysAway = moment(holiday.fromDate).startOf('day').diff(today, 'days');
  const daysLabel = (() => {
    if (daysAway === 0) return 'TODAY';
    if (daysAway === 1) return 'TOMORROW';
    return `${daysAway} DAYS`;
  })();
  const dayOfWeek = moment(holiday.fromDate).format('dddd');

  // Per-row accent based on which shift the holiday applies to. "ALL" gets
  // the brand navy so company-wide entries visually pop above per-shift
  // ones; per-shift entries get the soft pink/blue we use elsewhere.
  const scope = (holiday.country || 'ALL') as 'IN' | 'US' | 'ALL';
  const accent =
    scope === 'IN'
      ? tokens.colors.pink
      : scope === 'US'
        ? tokens.colors.blue
        : tokens.colors.brand;
  const scopeLabel =
    scope === 'IN' ? 'India' : scope === 'US' ? 'US' : 'Company-wide';

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.25 }}
    >
      <Box
        sx={{
          p: 1.75,
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
        }}
      >
        {/* Date block */}
        <Box
          sx={{
            minWidth: 44,
            textAlign: 'center',
            px: 0.75,
            py: 0.5,
            borderRadius: 1.5,
            bgcolor: alpha(accent, 0.08),
            border: `1px solid ${alpha(accent, 0.2)}`,
          }}
        >
          <Typography
            sx={{
              fontSize: 9,
              fontWeight: 700,
              letterSpacing: 1.2,
              color: accent,
              lineHeight: 1,
            }}
          >
            {moment(holiday.fromDate).format('MMM').toUpperCase()}
          </Typography>
          <Typography
            sx={{
              fontSize: 18,
              fontWeight: 800,
              color: tokens.colors.lightText,
              lineHeight: 1.1,
              mt: 0.25,
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {moment(holiday.fromDate).format('D')}
          </Typography>
        </Box>

        {/* Name + meta */}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography
            sx={{
              fontSize: 13,
              fontWeight: 700,
              color: tokens.colors.lightText,
              lineHeight: 1.25,
            }}
            noWrap
          >
            {holiday.name || 'Holiday'}
          </Typography>
          <Stack direction="row" alignItems="center" spacing={0.75} sx={{ mt: 0.25 }}>
            <Typography sx={{ fontSize: 10, color: tokens.colors.lightTextSecondary }}>
              {dayOfWeek}
            </Typography>
            <Box sx={{ width: 3, height: 3, borderRadius: '50%', bgcolor: alpha(tokens.colors.brand, 0.3) }} />
            <Typography
              sx={{
                fontSize: 9,
                fontWeight: 700,
                letterSpacing: 0.6,
                color: accent,
                textTransform: 'uppercase',
              }}
            >
              {scopeLabel}
            </Typography>
          </Stack>
        </Box>

        {/* Days-away pill */}
        <Box
          sx={{
            display: 'inline-flex',
            alignItems: 'center',
            px: 1,
            py: 0.4,
            borderRadius: 1.25,
            bgcolor: alpha(accent, daysAway === 0 ? 0.22 : 0.12),
            color: accent,
            border: `1px solid ${alpha(accent, 0.3)}`,
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {daysAway === 0 && (
            <motion.span
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
              style={{
                width: 5,
                height: 5,
                borderRadius: '50%',
                background: accent,
                marginRight: 4,
                display: 'inline-block',
              }}
            />
          )}
          <Typography sx={{ fontSize: 9, fontWeight: 800, letterSpacing: 1, lineHeight: 1 }}>
            {daysLabel}
          </Typography>
        </Box>
      </Box>
    </motion.div>
  );
}

export default UpcomingHolidays;
