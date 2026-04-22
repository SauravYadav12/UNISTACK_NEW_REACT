import { useState } from 'react';
import {
  Box, Button, CircularProgress, Stack, Typography, alpha,
} from '@mui/material';
import { motion } from 'framer-motion';
import { IconCloudDownload, IconRefresh } from '@tabler/icons-react';
import { toast } from 'react-toastify';

import { syncHolidays } from '../../services/salaryApi';
import type { SyncCountryResult } from '../../services/salaryApi';
import ConfirmDialog from '../ui/ConfirmDialog';
import { tokens } from '../../theme/theme';
import { useHoliday } from '../../contextProviders/HolidayContextProvider';

/**
 * SyncHolidaysCard — compact, admin-only banner that sits above the
 * Holidays tabs. Fetches the current year's public holidays for a single
 * country (IN or US) from Nager.Date, with an automatic India-only
 * fallback on the server when Nager.Date returns an empty list.
 *
 * Always syncs the current calendar year by product decision — no year
 * picker here.
 */
interface Props {
  country: 'IN' | 'US';
  visible?: boolean;
}

const COUNTRY_META = {
  IN: { label: 'India', flag: '🇮🇳' },
  US: { label: 'United States', flag: '🇺🇸' },
};

const SyncHolidaysCard = ({ country, visible = true }: Props) => {
  const year = new Date().getFullYear();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const { holidayState } = useHoliday();
  const meta = COUNTRY_META[country];

  if (!visible) return null;

  async function runSync() {
    setSyncing(true);
    try {
      const { data } = await syncHolidays(year, country);
      const r: SyncCountryResult | undefined = country === 'IN' ? data.india : data.us;
      if (!r) {
        toast.error(`No result returned for ${meta.label}`);
        return;
      }
      if (r.error) {
        toast.warning(`${meta.label}: ${r.error.slice(0, 80)}`);
      } else {
        toast.success(
          `${meta.label} ${year}: ${r.upserted} holiday${r.upserted === 1 ? '' : 's'} loaded${r.skipped ? `, ${r.skipped} skipped` : ''}`,
        );
      }
      await holidayState.loadData();
    } catch (e) {
      const msg = (e as { response?: { data?: { error?: string } }; message?: string })
        ?.response?.data?.error
        || (e as { message?: string })?.message
        || 'Unknown error';
      toast.error(`Failed to sync: ${msg}`);
      throw e;
    } finally {
      setSyncing(false);
    }
  }

  return (
    <>
      <Box
        sx={{
          position: 'relative',
          borderRadius: 3,
          p: 2,
          mb: 2.5,
          overflow: 'hidden',
          background: `linear-gradient(135deg, ${alpha(tokens.colors.brand, 0.04)} 0%, ${alpha(tokens.colors.pink, 0.05)} 60%, ${alpha(tokens.colors.blue, 0.04)} 100%)`,
          border: `1px solid ${alpha(tokens.colors.pink, 0.18)}`,
        }}
      >
        <Box sx={{
          position: 'absolute', top: 0, bottom: 0, left: 0, width: 4,
          background: `linear-gradient(180deg, ${tokens.colors.pink} 0%, ${tokens.colors.blue} 50%, ${tokens.colors.yellow} 100%)`,
        }} />

        <Stack
          direction={{ xs: 'column', md: 'row' }}
          alignItems={{ xs: 'flex-start', md: 'center' }}
          justifyContent="space-between"
          spacing={1.5}
          sx={{ pl: 1.5 }}
        >
          <Stack direction="row" alignItems="center" spacing={1.75}>
            <motion.div
              whileHover={{ y: -2, rotate: -6 }}
              transition={{ type: 'spring', stiffness: 280, damping: 16 }}
            >
              <Box sx={{
                width: 40, height: 40, borderRadius: 2,
                bgcolor: alpha(tokens.colors.pink, 0.12),
                color: tokens.colors.pink,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <IconCloudDownload size={20} stroke={2} />
              </Box>
            </motion.div>
            <Box>
              <Typography sx={{
                fontSize: 14, fontWeight: 800,
                color: tokens.colors.lightText, letterSpacing: 0.2,
              }}>
                {meta.flag} {meta.label} national holidays
              </Typography>
              <Typography sx={{ fontSize: 12, color: tokens.colors.lightTextSecondary, lineHeight: 1.4 }}>
                Load the official {meta.label} public-holiday list for {year}. Safe to re-run — duplicates are skipped.
              </Typography>
            </Box>
          </Stack>

          <Button
            variant="contained"
            size="small"
            disabled={syncing}
            onClick={() => setConfirmOpen(true)}
            startIcon={syncing
              ? <CircularProgress size={14} sx={{ color: '#fff' }} />
              : <IconRefresh size={16} />}
            sx={{
              bgcolor: tokens.colors.pink,
              '&:hover': { bgcolor: tokens.colors.pinkDark },
              fontWeight: 700,
            }}
          >
            {syncing ? 'Syncing…' : `Sync ${meta.label} holidays`}
          </Button>
        </Stack>
      </Box>

      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={runSync}
        tone="neutral"
        title={`Sync ${meta.label} holidays for ${year}?`}
        confirmLabel="Yes, sync now"
        cancelLabel="Cancel"
        description={
          <Stack spacing={1.25} sx={{ textAlign: 'left' }}>
            <Typography variant="body2" color="text.secondary">
              Loads the official <strong>{meta.label}</strong> public and bank holidays for {year} into your holidays collection.
            </Typography>
            <Box sx={{
              p: 1.25, borderRadius: 1.5,
              bgcolor: alpha(tokens.colors.success, 0.06),
              border: `1px solid ${alpha(tokens.colors.success, 0.2)}`,
            }}>
              <Typography variant="caption" sx={{ color: tokens.colors.success, fontWeight: 700, letterSpacing: 1 }}>
                NON-DESTRUCTIVE
              </Typography>
              <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary', mt: 0.25 }}>
                Running this multiple times is safe — duplicates are skipped. Your manually-added holidays are untouched.
              </Typography>
            </Box>
            <Typography variant="caption" color="text.secondary">
              Salary calculations automatically exclude these dates as non-working days for {meta.label} employees.
            </Typography>
          </Stack>
        }
      />
    </>
  );
};

export default SyncHolidaysCard;
