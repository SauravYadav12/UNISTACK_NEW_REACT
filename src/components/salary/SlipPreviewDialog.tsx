import { useRef, useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Box, CircularProgress } from '@mui/material';
import { toast } from 'react-toastify';
import SalarySlipView from './SalarySlip';
import { SalarySlip } from '../../Interfaces/salary';
import { IconDownload } from '@tabler/icons-react';
import { downloadSlipAsPdf } from './downloadSlipPdf';

interface Props {
  open: boolean;
  slip?: SalarySlip;
  onClose: () => void;
}

export default function SlipPreviewDialog({ open, slip, onClose }: Props) {
  const [downloading, setDownloading] = useState(false);
  const slipRef = useRef<HTMLDivElement | null>(null);

  const filename = slip
    ? `Unicodez-Salary-${slip.employeeId || slip.user}-${slip.year}-${String(slip.month).padStart(2, '0')}.pdf`
    : 'salary-slip.pdf';

  async function handleDownload() {
    if (!slip || !slipRef.current) return;
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
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle sx={{ fontWeight: 700 }}>Payslip Preview</DialogTitle>
      <DialogContent dividers sx={{ bgcolor: '#F4F6F8', p: 3, display: 'flex', justifyContent: 'center' }}>
        {slip && (
          <Box ref={slipRef} sx={{ bgcolor: 'white' }}>
            <SalarySlipView slip={slip} />
          </Box>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} disabled={downloading}>Close</Button>
        <Button
          variant="contained"
          onClick={handleDownload}
          disabled={!slip || downloading}
          startIcon={downloading
            ? <CircularProgress size={16} sx={{ color: '#fff' }} />
            : <IconDownload size={18} />}
          sx={{ bgcolor: '#EC4599', '&:hover': { bgcolor: '#D03B85' } }}
        >
          {downloading ? 'Generating…' : 'Download PDF'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
