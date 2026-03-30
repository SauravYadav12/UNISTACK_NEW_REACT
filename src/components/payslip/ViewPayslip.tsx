import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  CircularProgress,
  IconButton,
} from '@mui/material';
import { Cancel, Close, Send, Bookmark } from '@mui/icons-material';
import { SalaryStructure } from '../salary/SalaryForm';
import { useAuth } from '../../AuthGaurd/AuthContextProvider';
import { payslipApi } from '../../services/payslipApi';
import { toast } from 'react-toastify';
import { Download } from '@mui/icons-material';
import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';
import { Payslip } from '../../Interfaces/payslip';
import {
  generatePayslipPDFDefinition,
  PayslipData,
  paySlipName,
} from '../../utils/payslip.util';
(pdfMake as any).vfs = pdfFonts;

type iProps = {
  open: boolean;
  onClose: () => void;
} & (
  | {
      mode: 'view';
      paySlip: Payslip;
    }
  | {
      mode: 'generate';
      salaryStructure: SalaryStructure;
    }
);

const ViewPayslip: React.FC<iProps> = (props) => {
  const { mode, open, onClose } = props;
  const [saving, setSaving] = useState(false);
  const { iUser, myProfile } = useAuth();

  const [payslipData, setPayslipData] = useState<PayslipData>();

  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setPayslipData(getPayslipData());
  }, [mode]);

  useEffect(() => {
    if (payslipData) {
      generatePDF();
    }
  }, [payslipData]);

  function getPayslipData() {
    if (!iUser || !myProfile) {
      toast.error('User information is missing. Cannot generate payslip.');
      return undefined;
    }

    if (mode === 'view') {
      return props.paySlip;
    } else {
      const currentDate = new Date();
      const currentMonth = currentDate.getMonth() + 1; // getMonth() returns 0-11
      const currentYear = currentDate.getFullYear();

      return {
        employeeId: myProfile.employeeId,
        user: iUser._id,
        profile: myProfile._id,
        month: currentMonth,
        year: currentYear,
        email: iUser.email,
        dob: myProfile.dob,
        name:
          myProfile.name ||
          `${iUser.firstName || ''} ${iUser.lastName || ''}`.trim(),
        workingDays: 22, // Default working days, can be made configurable
        designation: 'Software Engineer', // This should come from profile or user data
        dateOfJoining: '2024-01-01', // This should come from profile or user data
        salaryStructure: props.salaryStructure,
      };
    }
  }

  async function generatePDF() {
    if (!payslipData) {
      toast.error('Payslip data is missing. Cannot generate PDF.');
      return;
    }
    try {
      setLoading(true);
      const docDefinition = generatePayslipPDFDefinition(payslipData);

      const pdfDocGenerator = pdfMake?.createPdf(docDefinition);

      const blob = await pdfDocGenerator.getBlob();
      const url = URL.createObjectURL(blob);
      setPdfUrl(url);
      setLoading(false);
    } catch (error) {
      console.error('Error generating PDF:', error);
      setLoading(false);
    }
  }

  const downloadPDF = () => {
    if (payslipData) {
      const docDefinition = generatePayslipPDFDefinition(payslipData);
      const fileName = paySlipName(payslipData);
      pdfMake.createPdf(docDefinition).download(fileName);
    }
  };

  const handleSave = async () => {
    if (!payslipData) {
      toast.error('Payslip data is missing. Cannot save payslip.');
      return;
    }

    try {
      setSaving(true);
      await payslipApi.createPayslip(payslipData);
      toast.success('Payslip generated and saved successfully!');
      onClose();
    } catch (error) {
      console.error('Error saving payslip:', error);
      toast.error('Failed to save payslip. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleCancel}
      maxWidth="lg"
      fullWidth
      sx={{ '& .MuiDialog-paper': { minHeight: '80vh' } }}
    >
      <DialogTitle>
        <Typography
          variant="h5"
          sx={{
            fontWeight: 'bold',
            display: 'flex',
            alignItems: 'center',
            gap: 1,
          }}
        >
          📄 Payslip {mode === 'generate' ? 'Preview' : 'View'}
        </Typography>

        <IconButton
          onClick={handleCancel}
          sx={{ position: 'absolute', right: 16, top: 16, cursor: 'pointer' }}
        >
          <Close />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ px: 3 }}>
        <Box sx={{ width: '100%', height: '100%' }}>
          {loading ? (
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '400px',
              }}
            >
              <CircularProgress />
              <Typography sx={{ ml: 2 }}>Generating PDF...</Typography>
            </Box>
          ) : pdfUrl ? (
            <Box
              sx={{
                width: '100%',
                height: '600px',
                border: '1px solid #ddd',
                borderRadius: 1,
              }}
            >
              <iframe
                src={`${pdfUrl}#toolbar=1`}
                style={{
                  width: '100%',
                  height: '100%',
                  border: 'none',
                  borderRadius: '4px',
                }}
                title="Payslip PDF"
              />
            </Box>
          ) : (
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '400px',
              }}
            >
              <Typography color="error">Failed to generate PDF</Typography>
            </Box>
          )}
        </Box>
        {mode === 'generate' && (
          <Typography
            variant="body2"
            textAlign={'end'}
            color="text.secondary"
            sx={{ mt: 1 }}
          >
            Review the payslip before saving!
          </Typography>
        )}
      </DialogContent>

      <DialogActions sx={{ pb: 3, gap: 2, justifyContent: 'flex-end' }}>
        <Button
          variant="outlined"
          onClick={handleCancel}
          startIcon={<Cancel />}
          disabled={saving}
          sx={{ borderRadius: 2, minWidth: 100, mr: 'auto' }}
        >
          {mode === 'generate' ? 'Cancel' : 'Close'}
        </Button>

        <Button
          variant="contained"
          startIcon={<Download />}
          onClick={downloadPDF}
          disabled={loading}
          color="primary"
        >
          Download PDF
        </Button>

        {mode === 'generate' && (
          <>
            <Button
              variant="contained"
              onClick={handleSave}
              startIcon={saving ? <CircularProgress size={20} /> : <Bookmark />}
              disabled={saving}
              sx={{ borderRadius: 2, minWidth: 120 }}
            >
              {saving ? 'Saving...' : 'Save'}
            </Button>
            <Button
              variant="contained"
              onClick={handleSave}
              startIcon={saving ? <CircularProgress size={20} /> : <Send />}
              disabled={saving}
              sx={{ borderRadius: 2, minWidth: 120 }}
            >
              {saving ? 'Saving...' : 'Save and send'}
            </Button>
          </>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default ViewPayslip;
