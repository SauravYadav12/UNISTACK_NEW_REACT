import {
  Box,
  Button,
  CircularProgress,
  Grid,
  IconButton,
  Stack,
  TextField,
  Tooltip,
  Typography,
  alpha,
} from '@mui/material';
import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import dayjs, { Dayjs } from 'dayjs';
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import {
  IconCircleCheck,
  IconCircleDot,
  IconClipboardCheck,
  IconCloudUpload,
  IconDeviceFloppy,
  IconFileCheck,
  IconSignature,
  IconUserCheck,
} from '@tabler/icons-react';
import { axiosClient } from '../../../../config/axios.config';
import { uploadFile } from '../../../../services/storageApi';
import { tokens } from '../../../../theme/theme';
import {
  DocStepStatus,
  IDocStep,
  IProject,
} from '../../../../Interfaces/project';

type DocKey = 'bgc' | 'contractSigned' | 'paymentTermsAccepted' | 'onboarding';

interface StepMeta {
  key: DocKey;
  title: string;
  blurb: string;
  color: string;
  Icon: typeof IconFileCheck;
}

const STEPS: StepMeta[] = [
  {
    key: 'bgc',
    title: 'Background check',
    blurb: 'BGC cleared by the client / vendor',
    color: tokens.colors.blue,
    Icon: IconUserCheck,
  },
  {
    key: 'contractSigned',
    title: 'Contract signed',
    blurb: 'All parties have executed the MSA / SOW',
    color: tokens.colors.pink,
    Icon: IconSignature,
  },
  {
    key: 'paymentTermsAccepted',
    title: 'Payment terms accepted',
    blurb: 'Rate card + payment cycle agreed',
    color: tokens.colors.yellowDark,
    Icon: IconFileCheck,
  },
  {
    key: 'onboarding',
    title: 'Onboarding complete',
    blurb: 'Consultant has access, kickoff done',
    color: '#10B981',
    Icon: IconClipboardCheck,
  },
];

interface Props {
  project: IProject;
  onUpdated: (p: IProject) => void;
}

function emptyStep(): IDocStep {
  return { status: 'Pending' };
}

export default function DocumentationPanel({ project, onUpdated }: Props) {
  // Per-step local state so each card edits independently. Saving one step
  // sends only that step's fields via PATCH /projects/:id/documentation.
  const initialLocal = () => ({
    bgc: project.documentation?.bgc || emptyStep(),
    contractSigned: project.documentation?.contractSigned || emptyStep(),
    paymentTermsAccepted:
      project.documentation?.paymentTermsAccepted || emptyStep(),
    onboarding: project.documentation?.onboarding || emptyStep(),
    extraNotes: project.documentation?.extraNotes || '',
  });
  const [local, setLocal] = useState(initialLocal);
  const [savingKey, setSavingKey] = useState<DocKey | 'notes' | null>(null);
  const [uploadingKey, setUploadingKey] = useState<DocKey | null>(null);

  useEffect(() => {
    setLocal(initialLocal());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project._id]);

  const patchStep = (key: DocKey, partial: Partial<IDocStep>) => {
    setLocal((s) => ({ ...s, [key]: { ...s[key], ...partial } }));
  };

  async function saveStep(key: DocKey) {
    setSavingKey(key);
    try {
      const step = local[key];
      const res = await axiosClient.patch(
        `/projects/${project._id}/documentation`,
        {
          [key]: {
            status: step.status,
            completedOn: step.completedOn || null,
            notes: step.notes || '',
            attachmentUrl: step.attachmentUrl || '',
          },
        }
      );
      if (res.data?.data) onUpdated(res.data.data);
      toast.success(`${key} updated`);
    } catch {
      toast.error('Could not save step');
    } finally {
      setSavingKey(null);
    }
  }

  async function saveNotes() {
    setSavingKey('notes');
    try {
      const res = await axiosClient.patch(
        `/projects/${project._id}/documentation`,
        { extraNotes: local.extraNotes }
      );
      if (res.data?.data) onUpdated(res.data.data);
      toast.success('Notes saved');
    } catch {
      toast.error('Could not save notes');
    } finally {
      setSavingKey(null);
    }
  }

  async function uploadAttachment(key: DocKey, file: File) {
    if (file.type !== 'application/pdf') {
      toast.error('Only PDF files are allowed');
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      toast.error('Max 20 MB');
      return;
    }
    setUploadingKey(key);
    try {
      const res = await uploadFile(file, 'contract');
      const url = res.data?.data?.url;
      if (!url) throw new Error('Upload failed');
      patchStep(key, { attachmentUrl: url });
      toast.success('File uploaded — remember to Save');
    } catch {
      toast.error('Upload failed');
    } finally {
      setUploadingKey(null);
    }
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Stack spacing={2}>
        <Box>
          <Typography variant="subtitle1" fontWeight={700}>
            Onboarding trail
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Mark each step as you complete it — dates and notes are for the audit record.
          </Typography>
        </Box>

        <Grid container spacing={1.5}>
          {STEPS.map(({ key, title, blurb, color, Icon }) => {
            const step = local[key];
            const isDone = step.status === 'Done';
            const saving = savingKey === key;
            const uploading = uploadingKey === key;
            const completedDay: Dayjs | null = step.completedOn
              ? dayjs(step.completedOn)
              : null;

            return (
              <Grid size={{ xs: 12, md: 6 }} key={key}>
                <Box
                  sx={{
                    borderRadius: 3,
                    border: '1px solid',
                    borderColor: alpha(color, isDone ? 0.4 : 0.2),
                    bgcolor: isDone
                      ? alpha(color, 0.05)
                      : 'background.paper',
                    p: 2,
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 1.25,
                  }}
                >
                  <Stack direction="row" alignItems="center" spacing={1.25}>
                    <Box
                      sx={{
                        width: 36,
                        height: 36,
                        borderRadius: 2,
                        bgcolor: alpha(color, 0.15),
                        color,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Icon size={18} />
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <Typography fontWeight={800} sx={{ fontSize: '0.95rem' }}>
                        {title}
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{ color: tokens.colors.lightTextSecondary }}
                      >
                        {blurb}
                      </Typography>
                    </Box>
                    <Box
                      sx={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 0.5,
                        px: 0.875,
                        py: 0.375,
                        borderRadius: 2,
                        bgcolor: isDone
                          ? alpha('#10B981', 0.15)
                          : alpha('#5A6A85', 0.1),
                        color: isDone ? '#059669' : '#5A6A85',
                      }}
                    >
                      {isDone ? <IconCircleCheck size={12} /> : <IconCircleDot size={12} />}
                      <Typography
                        variant="caption"
                        fontWeight={700}
                        sx={{ fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}
                      >
                        {step.status}
                      </Typography>
                    </Box>
                  </Stack>

                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems="stretch">
                    <Button
                      variant={isDone ? 'outlined' : 'contained'}
                      size="small"
                      onClick={() =>
                        patchStep(key, {
                          status: (isDone ? 'Pending' : 'Done') as DocStepStatus,
                          completedOn: isDone ? undefined : new Date().toISOString(),
                        })
                      }
                      sx={{
                        textTransform: 'none',
                        fontWeight: 700,
                        borderRadius: 2,
                        bgcolor: isDone ? 'transparent' : color,
                        color: isDone ? color : '#fff',
                        borderColor: color,
                        '&:hover': {
                          bgcolor: isDone ? alpha(color, 0.06) : color,
                          filter: isDone ? 'none' : 'brightness(0.95)',
                        },
                      }}
                    >
                      {isDone ? 'Mark pending' : 'Mark done'}
                    </Button>

                    <DatePicker
                      label="Completed on"
                      value={completedDay}
                      onChange={(v) =>
                        patchStep(key, {
                          completedOn: v ? v.toISOString() : undefined,
                        })
                      }
                      slotProps={{
                        textField: {
                          size: 'small',
                          sx: { flex: 1, '& .MuiOutlinedInput-root': { borderRadius: 2 } },
                        },
                      }}
                    />
                  </Stack>

                  <TextField
                    size="small"
                    label="Notes"
                    multiline
                    minRows={2}
                    value={step.notes || ''}
                    onChange={(e) => patchStep(key, { notes: e.target.value })}
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                  />

                  <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                    <Button
                      component="label"
                      size="small"
                      startIcon={
                        uploading ? (
                          <CircularProgress size={12} />
                        ) : (
                          <IconCloudUpload size={14} />
                        )
                      }
                      disabled={uploading}
                      sx={{
                        textTransform: 'none',
                        fontWeight: 700,
                        borderRadius: 2,
                        color: tokens.colors.blueDark,
                      }}
                    >
                      {uploading ? 'Uploading' : step.attachmentUrl ? 'Replace PDF' : 'Attach PDF'}
                      <input
                        type="file"
                        accept="application/pdf"
                        hidden
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          e.target.value = '';
                          if (f) uploadAttachment(key, f);
                        }}
                      />
                    </Button>
                    {step.attachmentUrl && (
                      <Tooltip title="Open attachment">
                        <IconButton
                          component="a"
                          href={step.attachmentUrl}
                          target="_blank"
                          size="small"
                        >
                          <IconFileCheck size={14} color={tokens.colors.blueDark} />
                        </IconButton>
                      </Tooltip>
                    )}
                    <Box sx={{ flex: 1 }} />
                    <Button
                      size="small"
                      variant="contained"
                      onClick={() => saveStep(key)}
                      disabled={saving}
                      startIcon={
                        saving ? (
                          <CircularProgress size={12} sx={{ color: '#fff' }} />
                        ) : (
                          <IconDeviceFloppy size={14} />
                        )
                      }
                      sx={{
                        textTransform: 'none',
                        fontWeight: 700,
                        borderRadius: 2,
                        bgcolor: tokens.colors.pink,
                        '&:hover': { bgcolor: tokens.colors.pinkDark },
                      }}
                    >
                      Save step
                    </Button>
                  </Stack>
                </Box>
              </Grid>
            );
          })}
        </Grid>

        <Box
          sx={{
            p: 2,
            borderRadius: 3,
            border: '1px solid',
            borderColor: 'grey.200',
          }}
        >
          <TextField
            fullWidth
            size="small"
            multiline
            minRows={3}
            label="Extra notes"
            placeholder="Anything the checklist doesn't capture — vendor quirks, client preferences, etc."
            value={local.extraNotes}
            onChange={(e) => setLocal((s) => ({ ...s, extraNotes: e.target.value }))}
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
          />
          <Stack direction="row" justifyContent="flex-end" sx={{ mt: 1 }}>
            <Button
              size="small"
              variant="contained"
              onClick={saveNotes}
              disabled={savingKey === 'notes'}
              startIcon={
                savingKey === 'notes' ? (
                  <CircularProgress size={12} sx={{ color: '#fff' }} />
                ) : (
                  <IconDeviceFloppy size={14} />
                )
              }
              sx={{
                textTransform: 'none',
                fontWeight: 700,
                borderRadius: 2,
                background: tokens.gradients.pinkBlue,
                '&:hover': { background: 'linear-gradient(135deg, #DB2777 0%, #1A9FD4 100%)' },
              }}
            >
              Save notes
            </Button>
          </Stack>
        </Box>
      </Stack>
    </LocalizationProvider>
  );
}
