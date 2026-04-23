import {
  Box,
  Button,
  CircularProgress,
  Grid,
  MenuItem,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
  alpha,
} from '@mui/material';
import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import dayjs, { Dayjs } from 'dayjs';
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import {
  IconBriefcase,
  IconBuilding,
  IconDeviceFloppy,
  IconContract,
  IconCalendarTime,
  IconClipboardCheck,
  IconFileInvoice,
  IconInfoCircle,
  IconMail,
  IconPhone,
  IconSettings,
  IconUser,
  IconWorld,
} from '@tabler/icons-react';
import { tokens } from '../../../theme/theme';
import CustomDrawer from '../../../components/drawer/CustomDrawer';
import { IProject, ProjectStatus } from '../../../Interfaces/project';
import { updateProject } from '../../../services/projectApi';
import AdditionalDetailsPanel from './AdditionalDetailsPanel';
import ContractUploadPanel from './ContractUploadPanel';
import DocumentationPanel from './panels/DocumentationPanel';
import TimesheetsPanel from './panels/TimesheetsPanel';
import InvoicesPanel from './panels/InvoicesPanel';

interface Props {
  open: boolean;
  project?: IProject;
  /** Optional deep-link: which tab to land on. Defaults to Overview. */
  initialTab?: 'overview' | 'timesheets' | 'invoices';
  /** Optional deep-link: which period month (YYYY-MM) the Timesheets panel
   *  should open at. Ignored unless initialTab === 'timesheets'. */
  initialPeriodMonth?: string;
  onClose: () => void;
  onUpdated: (p: IProject) => void;
}

const STATUS_OPTIONS: ProjectStatus[] = ['Active', 'On Hold', 'Ended', 'Terminated'];

const STATUS_COLORS: Record<ProjectStatus, string> = {
  Active: '#10B981',
  'On Hold': '#F59E0B',
  Ended: '#0A3555',
  Terminated: '#EF4444',
};

function firstLabel(arr?: unknown[]): string {
  if (!Array.isArray(arr) || arr.length === 0) return '—';
  const r = arr[0] as { value?: string | number; currency?: string } | string;
  if (typeof r === 'string') return r;
  if (r && typeof r === 'object') {
    const v = r.value != null ? String(r.value) : '';
    const cur = r.currency || '';
    return [cur, v].filter(Boolean).join(' ') || '—';
  }
  return '—';
}

function KV({
  label,
  value,
  icon,
}: {
  label: string;
  value?: string;
  icon?: React.ReactNode;
}) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, py: 0.5 }}>
      {icon && (
        <Box
          sx={{
            width: 22,
            height: 22,
            borderRadius: 1,
            bgcolor: alpha(tokens.colors.blue, 0.08),
            color: tokens.colors.blueDark,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          {icon}
        </Box>
      )}
      <Box sx={{ minWidth: 0 }}>
        <Typography
          variant="caption"
          sx={{
            color: tokens.colors.lightTextSecondary,
            fontSize: '0.66rem',
            fontWeight: 700,
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
          }}
        >
          {label}
        </Typography>
        <Typography
          sx={{
            fontSize: '0.85rem',
            fontWeight: 600,
            color: tokens.colors.lightText,
            wordBreak: 'break-word',
          }}
        >
          {value || '—'}
        </Typography>
      </Box>
    </Box>
  );
}

function SnapshotCard({
  title,
  color,
  icon,
  children,
}: {
  title: string;
  color: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Box
      sx={{
        borderRadius: 3,
        border: '1px solid',
        borderColor: alpha(color, 0.25),
        overflow: 'hidden',
      }}
    >
      <Box
        sx={{
          px: 2,
          py: 1.25,
          bgcolor: alpha(color, 0.08),
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          borderBottom: `1px solid ${alpha(color, 0.2)}`,
        }}
      >
        <Box
          sx={{
            width: 26,
            height: 26,
            borderRadius: 1.5,
            bgcolor: alpha(color, 0.18),
            color,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {icon}
        </Box>
        <Typography fontWeight={800} sx={{ fontSize: '0.85rem', color: tokens.colors.lightText }}>
          {title}
        </Typography>
      </Box>
      <Box sx={{ p: 2 }}>{children}</Box>
    </Box>
  );
}

export default function ProjectDrawer({
  open,
  project,
  initialTab,
  initialPeriodMonth,
  onClose,
  onUpdated,
}: Props) {
  const [tab, setTab] = useState(0);
  const [status, setStatus] = useState<ProjectStatus>('Active');
  const [startDate, setStartDate] = useState<Dayjs | null>(null);
  const [endDate, setEndDate] = useState<Dayjs | null>(null);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  // Bill-To selector + the three party-address fields. Kept as local state so
  // the user can edit and save them alongside status/dates/notes from the
  // editable strip. On invoice generation, InvoicePreview uses billToCustomer
  // to pick which company + address to render in the Bill-To card.
  const [billToCustomer, setBillToCustomer] = useState<
    'Client' | 'Vendor' | 'Prime Vendor'
  >('Client');
  const [clientAddress, setClientAddress] = useState('');
  const [vendorAddress, setVendorAddress] = useState('');
  const [primeVendorAddress, setPrimeVendorAddress] = useState('');

  useEffect(() => {
    if (!project) return;
    setStatus((project.status as ProjectStatus) || 'Active');
    setStartDate(project.startDate ? dayjs(project.startDate) : null);
    setEndDate(project.endDate ? dayjs(project.endDate) : null);
    setNotes(project.notes || '');
    setBillToCustomer(project.billToCustomer || 'Client');
    setClientAddress(project.clientAddress || '');
    setVendorAddress(project.vendorAddress || '');
    setPrimeVendorAddress(project.primeVendorAddress || '');
    // Honour deep-link target when set, else land on Overview.
    // Tab order: 0=Overview 1=Documentation 2=Timesheets 3=Invoices 4=Extras 5=Docs
    if (initialTab === 'timesheets') setTab(2);
    else if (initialTab === 'invoices') setTab(3);
    else setTab(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project?._id, initialTab]);

  if (!project) return null;

  const statusColor = STATUS_COLORS[status] || '#5A6A85';

  const handleSaveOverview = async () => {
    setSaving(true);
    try {
      const { data } = await updateProject(project._id, {
        status,
        startDate: startDate ? startDate.toISOString() : undefined,
        endDate: endDate ? endDate.toISOString() : undefined,
        notes,
        // Billing targets — these flow straight into InvoicePreview's
        // Bill-To card and the invoice PDF. `billToCustomer` drives
        // which of the three addresses actually renders.
        billToCustomer,
        clientAddress,
        vendorAddress,
        primeVendorAddress,
      });
      if (data.data) {
        onUpdated(data.data);
        toast.success('Project updated');
      }
    } catch {
      toast.error('Could not save changes');
    } finally {
      setSaving(false);
    }
  };

  const drawerTitle = (
    <Stack direction="row" alignItems="center" spacing={1.25}>
      <Box
        sx={{
          width: 38,
          height: 38,
          borderRadius: 2,
          background: `linear-gradient(135deg, ${tokens.colors.blue} 0%, ${tokens.colors.yellow} 100%)`,
          color: '#032840',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <IconBriefcase size={18} />
      </Box>
      <Box>
        <Typography variant="caption" sx={{ letterSpacing: '0.06em', color: 'text.secondary', fontWeight: 700 }}>
          {project.projectId} · from {project.reqID}
          {project.organizationShortCode ? ` · ${project.organizationShortCode}` : ''}
        </Typography>
        <Typography variant="h6" fontWeight={800} sx={{ color: '#0A3555', lineHeight: 1.2 }}>
          {project.jobTitle || 'Project details'}
        </Typography>
      </Box>
      <Box
        sx={{
          ml: 1,
          px: 1,
          py: 0.25,
          borderRadius: 1.5,
          bgcolor: alpha(statusColor, 0.12),
          color: statusColor,
          fontWeight: 800,
          fontSize: '0.7rem',
          letterSpacing: '0.05em',
          textTransform: 'uppercase',
        }}
      >
        {status}
      </Box>
    </Stack>
  );

  return (
    <CustomDrawer open={open} title={drawerTitle} onClose={onClose} closeOnOutSideClick>
      <Box sx={{ px: 1 }}>
        <Tabs
          value={tab}
          onChange={(_, v) => setTab(v)}
          sx={{
            borderBottom: 1,
            borderColor: 'divider',
            mb: 2.5,
            '& .MuiTab-root': { textTransform: 'none', fontWeight: 700, minHeight: 44 },
            '& .Mui-selected': { color: tokens.colors.pinkDark },
            '& .MuiTabs-indicator': { bgcolor: tokens.colors.pink, height: 3, borderRadius: 3 },
          }}
        >
          <Tab icon={<IconInfoCircle size={16} />} iconPosition="start" label="Overview" />
          <Tab icon={<IconClipboardCheck size={16} />} iconPosition="start" label="Documentation" />
          <Tab icon={<IconCalendarTime size={16} />} iconPosition="start" label="Timesheets" />
          <Tab icon={<IconFileInvoice size={16} />} iconPosition="start" label="Invoices" />
          <Tab icon={<IconSettings size={16} />} iconPosition="start" label="Additional details" />
          <Tab icon={<IconContract size={16} />} iconPosition="start" label="Additional docs" />
        </Tabs>

        {tab === 0 && (
          <Stack spacing={2}>
            {/* Editable strip — status / dates / notes */}
            <Box
              sx={{
                p: 2,
                borderRadius: 3,
                bgcolor: alpha(tokens.colors.pink, 0.03),
                border: `1px solid ${alpha(tokens.colors.pink, 0.2)}`,
              }}
            >
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <TextField
                      select
                      size="small"
                      fullWidth
                      label="Status"
                      value={status}
                      onChange={(e) => setStatus(e.target.value as ProjectStatus)}
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                    >
                      {STATUS_OPTIONS.map((s) => (
                        <MenuItem key={s} value={s}>
                          {s}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <DatePicker
                      label="Start date"
                      value={startDate}
                      onChange={setStartDate}
                      slotProps={{
                        textField: {
                          size: 'small',
                          fullWidth: true,
                          sx: { '& .MuiOutlinedInput-root': { borderRadius: 2 } },
                        },
                      }}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <DatePicker
                      label="End date"
                      value={endDate}
                      onChange={setEndDate}
                      slotProps={{
                        textField: {
                          size: 'small',
                          fullWidth: true,
                          sx: { '& .MuiOutlinedInput-root': { borderRadius: 2 } },
                        },
                      }}
                    />
                  </Grid>
                  <Grid size={{ xs: 12 }}>
                    <TextField
                      label="Notes"
                      fullWidth
                      size="small"
                      multiline
                      minRows={2}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                    />
                  </Grid>

                  {/* ── Billing target ─────────────────────────────────────
                      Drives the "Bill to" card on InvoicePreview. Whichever
                      party is selected here is the one whose company name +
                      address get rendered into every generated invoice for
                      this project. The three address inputs let admins keep
                      separate mailing addresses per party so switching the
                      Bill-To target doesn't require re-typing the address. */}
                  <Grid size={{ xs: 12 }}>
                    <Box
                      sx={{
                        mt: 0.5,
                        pt: 1.5,
                        borderTop: `1px dashed ${alpha(tokens.colors.pink, 0.3)}`,
                      }}
                    >
                      <Typography
                        variant="caption"
                        sx={{
                          color: tokens.colors.pinkDark,
                          fontWeight: 800,
                          letterSpacing: '0.06em',
                          textTransform: 'uppercase',
                          fontSize: '0.68rem',
                        }}
                      >
                        Billing target — appears on invoice "Bill to"
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <TextField
                      select
                      size="small"
                      fullWidth
                      label="Bill to customer"
                      value={billToCustomer}
                      onChange={(e) =>
                        setBillToCustomer(
                          e.target.value as 'Client' | 'Vendor' | 'Prime Vendor'
                        )
                      }
                      helperText="Which party receives the invoice"
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                    >
                      <MenuItem value="Client">Client</MenuItem>
                      <MenuItem value="Vendor">Vendor</MenuItem>
                      <MenuItem value="Prime Vendor">Prime Vendor</MenuItem>
                    </TextField>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <TextField
                      label="Client address"
                      fullWidth
                      size="small"
                      multiline
                      minRows={2}
                      value={clientAddress}
                      onChange={(e) => setClientAddress(e.target.value)}
                      helperText={
                        billToCustomer === 'Client' ? 'Active on invoice' : ' '
                      }
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <TextField
                      label="Vendor address"
                      fullWidth
                      size="small"
                      multiline
                      minRows={2}
                      value={vendorAddress}
                      onChange={(e) => setVendorAddress(e.target.value)}
                      helperText={
                        billToCustomer === 'Vendor' ? 'Active on invoice' : ' '
                      }
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <TextField
                      label="Prime vendor address"
                      fullWidth
                      size="small"
                      multiline
                      minRows={2}
                      value={primeVendorAddress}
                      onChange={(e) => setPrimeVendorAddress(e.target.value)}
                      helperText={
                        billToCustomer === 'Prime Vendor'
                          ? 'Active on invoice'
                          : ' '
                      }
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                    />
                  </Grid>
                </Grid>
              </LocalizationProvider>
              <Stack direction="row" justifyContent="flex-end" sx={{ mt: 1.5 }}>
                <Button
                  onClick={handleSaveOverview}
                  disabled={saving}
                  startIcon={
                    saving ? (
                      <CircularProgress size={14} sx={{ color: '#fff' }} />
                    ) : (
                      <IconDeviceFloppy size={16} />
                    )
                  }
                  variant="contained"
                  sx={{
                    background: tokens.gradients.pinkBlue,
                    textTransform: 'none',
                    fontWeight: 700,
                    borderRadius: 2,
                    px: 2.5,
                    '&:hover': {
                      background: 'linear-gradient(135deg, #DB2777 0%, #1A9FD4 100%)',
                    },
                  }}
                >
                  {saving ? 'Saving' : 'Save changes'}
                </Button>
              </Stack>
            </Box>

            {/* Terms row */}
            <Grid container spacing={1.5}>
              <Grid size={{ xs: 12, sm: 4 }}>
                <Box
                  sx={{
                    p: 1.5,
                    borderRadius: 3,
                    bgcolor: alpha(tokens.colors.blue, 0.06),
                    border: `1px solid ${alpha(tokens.colors.blue, 0.2)}`,
                  }}
                >
                  <Typography
                    variant="caption"
                    sx={{
                      color: tokens.colors.blueDark,
                      fontWeight: 800,
                      letterSpacing: '0.04em',
                      textTransform: 'uppercase',
                      fontSize: '0.65rem',
                    }}
                  >
                    Rate
                  </Typography>
                  <Typography sx={{ fontSize: '1.05rem', fontWeight: 800, color: '#0A3555' }}>
                    {firstLabel(project.rate)}
                  </Typography>
                </Box>
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <Box
                  sx={{
                    p: 1.5,
                    borderRadius: 3,
                    bgcolor: alpha(tokens.colors.pink, 0.06),
                    border: `1px solid ${alpha(tokens.colors.pink, 0.2)}`,
                  }}
                >
                  <Typography
                    variant="caption"
                    sx={{
                      color: tokens.colors.pinkDark,
                      fontWeight: 800,
                      letterSpacing: '0.04em',
                      textTransform: 'uppercase',
                      fontSize: '0.65rem',
                    }}
                  >
                    Tax term
                  </Typography>
                  <Typography sx={{ fontSize: '1.05rem', fontWeight: 800, color: '#0A3555' }}>
                    {firstLabel(project.taxType)}
                  </Typography>
                </Box>
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <Box
                  sx={{
                    p: 1.5,
                    borderRadius: 3,
                    bgcolor: alpha(tokens.colors.yellow, 0.12),
                    border: `1px solid ${alpha(tokens.colors.yellowDark, 0.25)}`,
                  }}
                >
                  <Typography
                    variant="caption"
                    sx={{
                      color: tokens.colors.yellowDark,
                      fontWeight: 800,
                      letterSpacing: '0.04em',
                      textTransform: 'uppercase',
                      fontSize: '0.65rem',
                    }}
                  >
                    Duration
                  </Typography>
                  <Typography sx={{ fontSize: '1.05rem', fontWeight: 800, color: '#0A3555' }}>
                    {firstLabel(project.duration)}
                  </Typography>
                </Box>
              </Grid>
            </Grid>

            {/* Contact snapshot cards */}
            <Grid container spacing={1.5}>
              <Grid size={{ xs: 12, md: 6 }}>
                <SnapshotCard
                  title="Client"
                  color={tokens.colors.blue}
                  icon={<IconBuilding size={14} />}
                >
                  <KV label="Company" value={project.clientCompany} icon={<IconBuilding size={13} />} />
                  <KV label="Contact" value={project.clientPerson} icon={<IconUser size={13} />} />
                  <KV label="Phone" value={project.clientPhone} icon={<IconPhone size={13} />} />
                  <KV label="Email" value={project.clientEmail} icon={<IconMail size={13} />} />
                  <KV label="Website" value={project.clientWebsite} icon={<IconWorld size={13} />} />
                  <KV label="Address" value={project.clientAddress} />
                </SnapshotCard>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <SnapshotCard
                  title="Prime vendor"
                  color={tokens.colors.yellow}
                  icon={<IconUser size={14} />}
                >
                  <KV label="Company" value={project.primeVendorCompany} icon={<IconBuilding size={13} />} />
                  <KV label="Contact" value={project.primeVendorName} icon={<IconUser size={13} />} />
                  <KV label="Phone" value={project.primeVendorPhone} icon={<IconPhone size={13} />} />
                  <KV label="Email" value={project.primeVendorEmail} icon={<IconMail size={13} />} />
                  <KV label="Website" value={project.primeVendorWebsite} icon={<IconWorld size={13} />} />
                </SnapshotCard>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <SnapshotCard
                  title="Vendor"
                  color={tokens.colors.pink}
                  icon={<IconUser size={14} />}
                >
                  <KV label="Company" value={project.vendorCompany} icon={<IconBuilding size={13} />} />
                  <KV label="Contact" value={project.vendorPersonName} icon={<IconUser size={13} />} />
                  <KV label="Phone" value={project.vendorPhone} icon={<IconPhone size={13} />} />
                  <KV label="Email" value={project.vendorEmail} icon={<IconMail size={13} />} />
                  <KV label="Website" value={project.vendorWebsite} icon={<IconWorld size={13} />} />
                </SnapshotCard>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <SnapshotCard
                  title="Consultant"
                  color="#5A6A85"
                  icon={<IconUser size={14} />}
                >
                  <KV label="Name" value={project.consultant} icon={<IconUser size={13} />} />
                  <KV label="Job title" value={project.jobTitle} icon={<IconBriefcase size={13} />} />
                </SnapshotCard>
              </Grid>
            </Grid>
          </Stack>
        )}

        {tab === 1 && <DocumentationPanel project={project} onUpdated={onUpdated} />}

        {tab === 2 && (
          <TimesheetsPanel
            project={project}
            initialPeriodMonth={initialPeriodMonth}
            onInvoiceMaybeCreated={() => setTab(3)}
          />
        )}

        {tab === 3 && <InvoicesPanel project={project} />}

        {tab === 4 && <AdditionalDetailsPanel project={project} onUpdated={onUpdated} />}

        {tab === 5 && <ContractUploadPanel project={project} onUpdated={onUpdated} />}
      </Box>
    </CustomDrawer>
  );
}
