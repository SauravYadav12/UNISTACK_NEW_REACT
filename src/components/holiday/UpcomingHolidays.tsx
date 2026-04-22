import { useMemo } from 'react';
import { Box, Stack, Typography, alpha } from '@mui/material';
import { motion } from 'framer-motion';
import moment from 'moment';

import { Holiday } from '../../Interfaces/holiday';
import { useHoliday } from '../../contextProviders/HolidayContextProvider';
import { tokens } from '../../theme/theme';

// Product rule: show the single closest upcoming holiday per region within
// the next 30 days, drawn from the shared holidays collection. Empty state
// per region when nothing is coming up.

interface Props {
  /** Retained for API compatibility; not used in this view. */
  forAdmin?: boolean;
}

const WINDOW_DAYS = 30;

function findNearest(
  holidays: Holiday[],
  country: 'IN' | 'US',
  start: moment.Moment,
  end: moment.Moment,
): Holiday | undefined {
  return [...holidays]
    .filter((h) => {
      const c = h.country || 'ALL';
      if (c !== country && c !== 'ALL') return false;
      const hd = moment(h.fromDate);
      return hd.isSameOrAfter(start, 'day') && hd.isSameOrBefore(end, 'day');
    })
    .sort((a, b) => moment(a.fromDate).diff(moment(b.fromDate)))
    .shift();
}

const COUNTRIES = [
  {
    code: 'IN' as const,
    flag: '\uD83C\uDDEE\uD83C\uDDF3', // 🇮🇳
    label: 'India',
    accent: tokens.colors.pink,
  },
  {
    code: 'US' as const,
    flag: '\uD83C\uDDFA\uD83C\uDDF8', // 🇺🇸
    label: 'United States',
    accent: tokens.colors.blue,
  },
];

const UpcomingHolidays = (_: Props) => {
  const { holidayState } = useHoliday();
  const today = useMemo(() => moment().startOf('day'), []);
  const cutoff = useMemo(() => today.clone().add(WINDOW_DAYS, 'days'), [today]);
  const all = holidayState.data || [];

  const picks = useMemo(
    () =>
      COUNTRIES.map((c) => ({
        ...c,
        holiday: findNearest(all, c.code, today, cutoff),
      })),
    [all, today, cutoff],
  );

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
          px: 2, py: 1.25,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <Box sx={{
          position: 'absolute', top: 8, right: 10, display: 'flex', gap: 0.5, opacity: 0.55,
        }}>
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

      {/* Two halves, one per country, split by a subtle dashed divider */}
      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', position: 'relative' }}>
        {/* Vertical dashed divider */}
        <Box sx={{
          position: 'absolute',
          top: 12, bottom: 12,
          left: '50%',
          width: 0,
          borderLeft: `1px dashed ${alpha(tokens.colors.brand, 0.18)}`,
        }} />
        {picks.map((p, i) => (
          <HalfCard key={p.code} pick={p} today={today} index={i} />
        ))}
      </Box>
    </Box>
  );
};

function HalfCard({
  pick,
  today,
  index,
}: {
  pick: typeof COUNTRIES[number] & { holiday?: Holiday };
  today: moment.Moment;
  index: number;
}) {
  const { flag, label, accent, holiday } = pick;

  const daysAway = holiday
    ? moment(holiday.fromDate).startOf('day').diff(today, 'days')
    : null;

  const daysLabel = (() => {
    if (daysAway == null) return null;
    if (daysAway === 0) return 'TODAY';
    if (daysAway === 1) return 'TOMORROW';
    return `${daysAway} DAYS`;
  })();

  const dayOfWeek = holiday ? moment(holiday.fromDate).format('dddd') : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, duration: 0.3 }}
    >
      <Box sx={{
        position: 'relative',
        p: 2,
        minHeight: 140,
        display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
        bgcolor: holiday ? 'transparent' : alpha(tokens.colors.lightTextSecondary, 0.03),
      }}>
        {/* Country row */}
        <Stack direction="row" alignItems="center" spacing={0.75} sx={{ mb: 1 }}>
          <Typography sx={{ fontSize: 18, lineHeight: 1 }}>{flag}</Typography>
          <Typography sx={{
            fontSize: 10, fontWeight: 700, letterSpacing: 2,
            color: accent, textTransform: 'uppercase',
          }}>
            {label}
          </Typography>
        </Stack>

        {holiday ? (
          <>
            {/* Holiday name */}
            <Box sx={{ flex: 1 }}>
              <Typography sx={{
                fontSize: 15, fontWeight: 700, color: tokens.colors.lightText,
                lineHeight: 1.2, mb: 0.5,
              }}>
                {holiday.name || 'Holiday'}
              </Typography>
              <Typography sx={{ fontSize: 11, color: tokens.colors.lightTextSecondary }}>
                {moment(holiday.fromDate).format('MMM D')} · {dayOfWeek}
              </Typography>
            </Box>

            {/* Days-away pill — bigger if very close */}
            <Box sx={{ mt: 1, alignSelf: 'flex-start' }}>
              <Box sx={{
                display: 'inline-flex', alignItems: 'center',
                px: 1, py: 0.4, borderRadius: 1.25,
                bgcolor: alpha(accent, daysAway === 0 ? 0.22 : 0.12),
                color: accent,
                border: `1px solid ${alpha(accent, 0.3)}`,
                fontVariantNumeric: 'tabular-nums',
              }}>
                {/* Small pulse dot on TODAY */}
                {daysAway === 0 && (
                  <motion.span
                    animate={{ opacity: [1, 0.3, 1] }}
                    transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
                    style={{
                      width: 6, height: 6, borderRadius: '50%',
                      background: accent, marginRight: 6, display: 'inline-block',
                    }}
                  />
                )}
                <Typography sx={{
                  fontSize: 10, fontWeight: 800, letterSpacing: 1.2, lineHeight: 1,
                }}>
                  {daysLabel}
                </Typography>
              </Box>
            </Box>
          </>
        ) : (
          <Box sx={{ flex: 1, display: 'flex', alignItems: 'center' }}>
            <Typography sx={{ fontSize: 11, color: tokens.colors.lightTextSecondary, fontStyle: 'italic' }}>
              No holidays in the next {WINDOW_DAYS} days.
            </Typography>
          </Box>
        )}
      </Box>
    </motion.div>
  );
}

export default UpcomingHolidays;
