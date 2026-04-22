import { Box, Typography, IconButton, Stack, alpha, Tooltip, Chip, Skeleton } from '@mui/material';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import { IconCalendar, IconRefresh, IconArrowsExchange } from '@tabler/icons-react';
import { dateFormate } from '../constants';
import { tokens } from '../../theme/theme';

interface DateBarProps {
  fromDate?: string;
  toDate?: string;
  metaText: string;
  loading: boolean;
  onDateChange: (key: 'fromDate' | 'toDate', newValue: any) => void;
  reload?: () => void;
}

type PresetKey = 'today' | '7d' | '30d' | 'thisMonth' | 'lastMonth' | 'ytd';

const PRESETS: { key: PresetKey; label: string; compute: () => { from: string; to: string } }[] = [
  {
    key: 'today',
    label: 'Today',
    compute: () => {
      const today = dayjs().format(dateFormate);
      return { from: today, to: today };
    },
  },
  {
    key: '7d',
    label: '7 days',
    compute: () => ({
      from: dayjs().subtract(6, 'day').format(dateFormate),
      to: dayjs().format(dateFormate),
    }),
  },
  {
    key: '30d',
    label: '30 days',
    compute: () => ({
      from: dayjs().subtract(29, 'day').format(dateFormate),
      to: dayjs().format(dateFormate),
    }),
  },
  {
    key: 'thisMonth',
    label: 'This month',
    compute: () => ({
      from: dayjs().startOf('month').format(dateFormate),
      to: dayjs().format(dateFormate),
    }),
  },
  {
    key: 'lastMonth',
    label: 'Last month',
    compute: () => ({
      from: dayjs().subtract(1, 'month').startOf('month').format(dateFormate),
      to: dayjs().subtract(1, 'month').endOf('month').format(dateFormate),
    }),
  },
  {
    key: 'ytd',
    label: 'YTD',
    compute: () => ({
      from: dayjs().startOf('year').format(dateFormate),
      to: dayjs().format(dateFormate),
    }),
  },
];

function matchPreset(from?: string, to?: string): PresetKey | null {
  if (!from || !to) return null;
  for (const p of PRESETS) {
    const r = p.compute();
    if (r.from === from && r.to === to) return p.key;
  }
  return null;
}

const DateBar = ({
  fromDate,
  toDate,
  metaText,
  loading,
  onDateChange,
  reload,
}: DateBarProps) => {
  const activePreset = matchPreset(fromDate, toDate);

  const handlePreset = (key: PresetKey) => {
    const p = PRESETS.find((x) => x.key === key);
    if (!p) return;
    const { from, to } = p.compute();
    onDateChange('fromDate', dayjs(from));
    onDateChange('toDate', dayjs(to));
  };

  return (
    <Box
      sx={{
        mt: 2,
        mb: 3,
        bgcolor: 'background.paper',
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 3.5,
        p: 2,
      }}
    >
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        spacing={2}
        alignItems={{ xs: 'stretch', md: 'center' }}
        justifyContent="space-between"
      >
        {/* Left side — date range display */}
        <Stack direction="row" alignItems="center" spacing={1.5} sx={{ minWidth: 0, flex: 1 }}>
          <Box
            sx={{
              width: 38,
              height: 38,
              borderRadius: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: alpha(tokens.colors.pink, 0.1),
              color: tokens.colors.pink,
              flexShrink: 0,
            }}
          >
            <IconCalendar size={18} />
          </Box>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', letterSpacing: '0.04em', fontWeight: 600 }}>
              RANGE
            </Typography>
            <Stack direction="row" alignItems="center" spacing={0.75} sx={{ flexWrap: 'wrap' }}>
              <Typography variant="body2" fontWeight={700} color="text.primary">
                {fromDate || '—'}
              </Typography>
              <IconArrowsExchange size={14} color={tokens.colors.lightTextSecondary} />
              <Typography variant="body2" fontWeight={700} color="text.primary">
                {toDate || '—'}
              </Typography>
              <Box
                sx={{
                  ml: 0.5,
                  px: 0.75,
                  py: 0.125,
                  borderRadius: 1.25,
                  bgcolor: alpha(tokens.colors.blue, 0.12),
                  color: tokens.colors.blueDark,
                  fontSize: '0.7rem',
                  fontWeight: 600,
                  minHeight: 18,
                  display: 'inline-flex',
                  alignItems: 'center',
                }}
              >
                {loading ? (
                  <Skeleton width={80} height={14} />
                ) : (
                  metaText || '—'
                )}
              </Box>
            </Stack>
          </Box>
        </Stack>

        {/* Right side — controls */}
        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <Box sx={{ width: 165, '& .MuiOutlinedInput-root': { borderRadius: 2.5 } }}>
              <DatePicker
                format={dateFormate}
                maxDate={toDate ? dayjs(toDate) : undefined}
                label="From"
                value={fromDate ? dayjs(fromDate) : null}
                onChange={(newValue) => onDateChange('fromDate', newValue)}
                slotProps={{
                  textField: {
                    size: 'small',
                    error: !fromDate || !dayjs(fromDate).isValid(),
                  },
                }}
              />
            </Box>
            <Box sx={{ width: 165, '& .MuiOutlinedInput-root': { borderRadius: 2.5 } }}>
              <DatePicker
                format={dateFormate}
                minDate={fromDate ? dayjs(fromDate) : undefined}
                label="To"
                value={toDate ? dayjs(toDate) : null}
                onChange={(newValue) => onDateChange('toDate', newValue)}
                slotProps={{
                  textField: {
                    size: 'small',
                    error: !toDate || !dayjs(toDate).isValid(),
                  },
                }}
              />
            </Box>
          </LocalizationProvider>
          {!!reload && (
            <Tooltip title="Refresh">
              <IconButton
                onClick={reload}
                disabled={loading}
                sx={{
                  bgcolor: alpha(tokens.colors.brand, 0.05),
                  color: tokens.colors.brand,
                  borderRadius: 2,
                  width: 38,
                  height: 38,
                  '&:hover': { bgcolor: alpha(tokens.colors.brand, 0.1) },
                }}
              >
                <IconRefresh size={18} className={loading ? 'sync-icon-loading' : ''} />
              </IconButton>
            </Tooltip>
          )}
        </Stack>
      </Stack>

      {/* Preset chips */}
      <Stack direction="row" spacing={0.75} sx={{ mt: 1.5, flexWrap: 'wrap' }} useFlexGap>
        {PRESETS.map((p) => {
          const active = activePreset === p.key;
          return (
            <Chip
              key={p.key}
              label={p.label}
              size="small"
              onClick={() => handlePreset(p.key)}
              sx={{
                height: 26,
                fontWeight: 600,
                border: '1px solid',
                borderColor: active ? alpha(tokens.colors.pink, 0.35) : 'divider',
                bgcolor: active ? alpha(tokens.colors.pink, 0.1) : 'transparent',
                color: active ? tokens.colors.pinkDark : 'text.secondary',
                '&:hover': {
                  bgcolor: active
                    ? alpha(tokens.colors.pink, 0.15)
                    : alpha(tokens.colors.pink, 0.06),
                  borderColor: alpha(tokens.colors.pink, 0.25),
                },
              }}
            />
          );
        })}
      </Stack>
    </Box>
  );
};

export default DateBar;
