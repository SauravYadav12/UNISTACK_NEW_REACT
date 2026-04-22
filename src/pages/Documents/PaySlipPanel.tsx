import { useRef, useState } from 'react';
import {
  Box, Button, FormControl, IconButton, InputLabel, MenuItem,
  Select, Stack, Typography, alpha, CircularProgress,
} from '@mui/material';
import moment from 'moment';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import {
  IconChevronLeft, IconChevronRight, IconDownload, IconFileOff,
} from '@tabler/icons-react';

import { useFetchData } from '../../hooks/fetchDataHook';
import { tokens } from '../../theme/theme';
import { getMySlip } from '../../services/salaryApi';
import { SalarySlip } from '../../Interfaces/salary';
import SalarySlipView from '../../components/salary/SalarySlip';
import { downloadSlipAsPdf } from '../../components/salary/downloadSlipPdf';

const MotionBox = motion.create(Box);

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

/**
 * The payslip viewer, rendered as a panel inside My Documents. Owns its own
 * month/year picker + download action — no page-level title (that's handled
 * by the parent MyDocuments page).
 */
export default function PaySlipPanel() {
  const now = moment();
  const [year, setYear] = useState<number>(now.year());
  const [month, setMonth] = useState<number>(now.month() + 1);
  const [downloading, setDownloading] = useState(false);
  const slipRef = useRef<HTMLDivElement | null>(null);

  const { data: slip, loading } = useFetchData<SalarySlip | undefined>(async () => {
    try {
      const { data } = await getMySlip(year, month);
      return data || undefined;
    } catch {
      return undefined;
    }
  }, [year, month]);

  const filename = slip
    ? `Unicodez-Salary-${slip.employeeId || slip.user}-${slip.year}-${String(slip.month).padStart(2, '0')}.pdf`
    : 'salary-slip.pdf';

  function shiftMonth(delta: number) {
    const m = moment({ year, month: month - 1 }).add(delta, 'month');
    setYear(m.year());
    setMonth(m.month() + 1);
  }

  async function handleDownload() {
    if (!slip || !slipRef.current) {
      toast.error('No slip available to download');
      return;
    }
    setDownloading(true);
    try {
      await downloadSlipAsPdf(slipRef.current, filename);
    } catch (err) {
      console.error('PDF download failed', err);
      toast.error('Could not generate PDF. Try again.');
    } finally {
      setDownloading(false);
    }
  }

  return (
    <Box>
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        justifyContent="space-between"
        alignItems={{ xs: 'flex-start', md: 'center' }}
        spacing={1.5}
        sx={{ mb: 2.5 }}
      >
        <Typography sx={{ fontWeight: 700, fontSize: 15, color: tokens.colors.lightText }}>
          View and download your monthly payslips
        </Typography>
        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
          <IconButton onClick={() => shiftMonth(-1)} size="small">
            <IconChevronLeft size={18} />
          </IconButton>
          <FormControl size="small" sx={{ minWidth: 130 }}>
            <InputLabel>Month</InputLabel>
            <Select value={month} label="Month" onChange={(e) => setMonth(Number(e.target.value))}>
              {MONTH_NAMES.map((m, i) => (
                <MenuItem key={m} value={i + 1}>{m}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 100 }}>
            <InputLabel>Year</InputLabel>
            <Select value={year} label="Year" onChange={(e) => setYear(Number(e.target.value))}>
              {Array.from({ length: 6 }, (_, i) => now.year() - 3 + i).map((y) => (
                <MenuItem key={y} value={y}>{y}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <IconButton onClick={() => shiftMonth(1)} size="small">
            <IconChevronRight size={18} />
          </IconButton>
          <Button
            variant="contained" size="small"
            startIcon={downloading
              ? <CircularProgress size={14} sx={{ color: '#fff' }} />
              : <IconDownload size={16} />}
            onClick={handleDownload}
            disabled={!slip || loading || downloading}
            sx={{ bgcolor: tokens.colors.pink, '&:hover': { bgcolor: tokens.colors.pinkDark } }}
          >
            {downloading ? 'Generating…' : 'Download PDF'}
          </Button>
        </Stack>
      </Stack>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
          <CircularProgress />
        </Box>
      ) : slip ? (
        <MotionBox
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          sx={{ display: 'flex', justifyContent: 'center', bgcolor: '#F4F6F8', py: 4, borderRadius: 4 }}
        >
          <Box ref={slipRef} sx={{ bgcolor: 'white' }}>
            <SalarySlipView slip={slip} />
          </Box>
        </MotionBox>
      ) : (
        <MotionBox
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          sx={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            py: 8, bgcolor: alpha(tokens.colors.pink, 0.03), borderRadius: 4,
            border: `1px dashed ${alpha(tokens.colors.pink, 0.3)}`,
          }}
        >
          <IconFileOff size={48} color={tokens.colors.pink} strokeWidth={1.5} />
          <Typography sx={{ mt: 2, fontWeight: 600, color: tokens.colors.lightText }}>
            No payslip for {MONTH_NAMES[month - 1]} {year}
          </Typography>
          <Typography sx={{ color: tokens.colors.lightTextSecondary, mt: 0.5, fontSize: 13 }}>
            Your HR will generate slips at month-end. Try another month.
          </Typography>
        </MotionBox>
      )}
    </Box>
  );
}
