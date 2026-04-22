import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  Stack,
  TextField,
  Typography,
  alpha,
} from '@mui/material';
import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import {
  IconBuildingSkyscraper,
  IconCloudUpload,
  IconDeviceFloppy,
  IconPhoto,
  IconX,
} from '@tabler/icons-react';
import { tokens } from '../../../theme/theme';
import {
  createOrganization,
  updateOrganization,
} from '../../../services/organizationApi';
import { uploadFile } from '../../../services/storageApi';
import { IOrganization } from '../../../Interfaces/organization';

interface Props {
  open: boolean;
  /** If provided, dialog is in edit mode. */
  initial?: IOrganization;
  onClose: () => void;
  onSaved: (org: IOrganization) => void;
}

type FormState = {
  name: string;
  shortCode: string;
  email: string;
  phone: string;
  website: string;
  address: string;
  einNumber: string;
  logoUrl: string;
};

const EMPTY: FormState = {
  name: '',
  shortCode: '',
  email: '',
  phone: '',
  website: '',
  address: '',
  einNumber: '',
  logoUrl: '',
};

function suggestShort(name: string): string {
  const letters = name.toUpperCase().replace(/[^A-Z]/g, '');
  return letters.slice(0, Math.min(5, Math.max(3, letters.length)));
}

export default function OrganizationFormDialog({
  open,
  initial,
  onClose,
  onSaved,
}: Props) {
  const isEdit = !!initial;
  const [form, setForm] = useState<FormState>(EMPTY);
  const [touchedShort, setTouchedShort] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});

  async function handleLogoFile(file: File) {
    // Client-side pre-checks to avoid a round-trip for obvious fails.
    if (!file.type.startsWith('image/')) {
      toast.error('Only image files are allowed');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Logo must be under 2 MB');
      return;
    }
    setUploadingLogo(true);
    try {
      const res = await uploadFile(file, 'logo');
      const url = res.data?.data?.url;
      if (!url) throw new Error('Upload failed');
      setForm((f) => ({ ...f, logoUrl: url }));
      toast.success('Logo uploaded');
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: string } }; message?: string })
          ?.response?.data?.error ||
        (err as { message?: string })?.message ||
        'Logo upload failed';
      toast.error(msg);
    } finally {
      setUploadingLogo(false);
    }
  }

  useEffect(() => {
    if (open) {
      setForm(
        initial
          ? {
              name: initial.name || '',
              shortCode: initial.shortCode || '',
              email: initial.email || '',
              phone: initial.phone || '',
              website: initial.website || '',
              address: initial.address || '',
              einNumber: initial.einNumber || '',
              logoUrl: initial.logoUrl || '',
            }
          : EMPTY
      );
      setErrors({});
      setTouchedShort(!!initial);
    }
  }, [open, initial]);

  const patch = (k: keyof FormState, v: string) => {
    setForm((f) => {
      const next = { ...f, [k]: v };
      // Auto-derive shortCode from name until the user explicitly edits it.
      if (k === 'name' && !touchedShort) {
        next.shortCode = suggestShort(v);
      }
      return next;
    });
    if (errors[k]) setErrors((e) => ({ ...e, [k]: '' }));
  };

  const validate = (): boolean => {
    const next: Partial<Record<keyof FormState, string>> = {};
    if (!form.name.trim()) next.name = 'Name is required';
    if (!form.shortCode.trim()) next.shortCode = 'Short code is required';
    else if (form.shortCode.length < 2 || form.shortCode.length > 5) {
      next.shortCode = '2–5 characters';
    }
    if (form.email && !form.email.includes('@')) next.email = 'Invalid email';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      const payload = {
        ...form,
        shortCode: form.shortCode.toUpperCase(),
      };
      const res = isEdit
        ? await updateOrganization(initial!._id, payload)
        : await createOrganization(payload);
      if (!res.data?.data) throw new Error('Save failed');
      toast.success(isEdit ? 'Organization updated' : 'Organization created');
      onSaved(res.data.data);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ||
        (err as { message?: string }).message ||
        'Save failed';
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={saving ? undefined : onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{ sx: { borderRadius: 4, overflow: 'hidden' } }}
    >
      <Box
        sx={{
          position: 'relative',
          background: tokens.gradients.darkSurface,
          color: '#fff',
          px: 3,
          py: 2.25,
          overflow: 'hidden',
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            top: -50,
            right: -30,
            width: 200,
            height: 200,
            borderRadius: '50%',
            background: `radial-gradient(circle, ${alpha(tokens.colors.blue, 0.25)} 0%, transparent 70%)`,
            filter: 'blur(40px)',
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 3,
            background: `linear-gradient(90deg, ${tokens.colors.blue} 0%, ${tokens.colors.yellow} 100%)`,
          }}
        />
        <DialogTitle sx={{ p: 0, display: 'flex', alignItems: 'center', gap: 1.25 }}>
          <Box
            sx={{
              width: 36,
              height: 36,
              borderRadius: 2,
              background: `linear-gradient(135deg, ${tokens.colors.blue} 0%, ${tokens.colors.yellow} 100%)`,
              color: '#032840',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <IconBuildingSkyscraper size={18} />
          </Box>
          <Box sx={{ flex: 1 }}>
            <Typography variant="caption" sx={{ color: alpha('#fff', 0.7), letterSpacing: '0.06em', fontWeight: 700 }}>
              {isEdit ? 'EDIT ORGANIZATION' : 'NEW ORGANIZATION'}
            </Typography>
            <Typography variant="h6" fontWeight={800} sx={{ color: '#fff' }}>
              {isEdit ? initial?.name : 'Set up a new org'}
            </Typography>
          </Box>
          <IconButton
            size="small"
            onClick={onClose}
            disabled={saving}
            sx={{ color: '#fff' }}
          >
            <IconX size={18} />
          </IconButton>
        </DialogTitle>
      </Box>

      <DialogContent sx={{ p: 3 }}>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 8 }}>
            <TextField
              fullWidth
              size="small"
              label="Name"
              value={form.name}
              onChange={(e) => patch('name', e.target.value)}
              error={!!errors.name}
              helperText={errors.name}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <TextField
              fullWidth
              size="small"
              label="Short code"
              value={form.shortCode}
              onChange={(e) => {
                setTouchedShort(true);
                patch('shortCode', e.target.value.toUpperCase().slice(0, 5));
              }}
              error={!!errors.shortCode}
              helperText={errors.shortCode || 'Used in invoice numbers'}
              inputProps={{ style: { textTransform: 'uppercase' } }}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              size="small"
              label="Email"
              value={form.email}
              onChange={(e) => patch('email', e.target.value)}
              error={!!errors.email}
              helperText={errors.email}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              size="small"
              label="Phone"
              value={form.phone}
              onChange={(e) => patch('phone', e.target.value)}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              size="small"
              label="Website"
              value={form.website}
              onChange={(e) => patch('website', e.target.value)}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              size="small"
              label="EIN"
              value={form.einNumber}
              onChange={(e) => patch('einNumber', e.target.value)}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <Box
              sx={{
                p: 1.5,
                borderRadius: 2.5,
                border: `1px solid ${alpha(tokens.colors.blue, 0.2)}`,
                bgcolor: alpha(tokens.colors.blue, 0.03),
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
              }}
            >
              <Box
                sx={{
                  width: 64,
                  height: 64,
                  borderRadius: 2,
                  bgcolor: '#fff',
                  border: `1px dashed ${alpha(tokens.colors.blue, 0.3)}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                  flexShrink: 0,
                }}
              >
                {form.logoUrl ? (
                  <img
                    src={form.logoUrl}
                    alt="Logo preview"
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'contain',
                    }}
                  />
                ) : (
                  <IconPhoto size={24} color={tokens.colors.lightTextSecondary} />
                )}
              </Box>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography sx={{ fontWeight: 700, fontSize: '0.88rem' }}>
                  Logo
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Shows on this organization's invoices. PNG / JPG / SVG up to 2 MB.
                  {!form.logoUrl && ' Name is used when no logo is set.'}
                </Typography>
              </Box>
              <Stack direction="row" spacing={0.5}>
                {form.logoUrl && (
                  <Button
                    size="small"
                    onClick={() => setForm((f) => ({ ...f, logoUrl: '' }))}
                    disabled={uploadingLogo}
                    sx={{
                      textTransform: 'none',
                      fontWeight: 700,
                      color: '#EF4444',
                    }}
                  >
                    Remove
                  </Button>
                )}
                <Button
                  component="label"
                  size="small"
                  variant="outlined"
                  disabled={uploadingLogo}
                  startIcon={
                    uploadingLogo ? (
                      <CircularProgress size={12} />
                    ) : (
                      <IconCloudUpload size={14} />
                    )
                  }
                  sx={{
                    textTransform: 'none',
                    fontWeight: 700,
                    borderRadius: 2,
                    borderColor: tokens.colors.blueDark,
                    color: tokens.colors.blueDark,
                    '&:hover': {
                      bgcolor: alpha(tokens.colors.blue, 0.06),
                      borderColor: tokens.colors.blueDark,
                    },
                  }}
                >
                  {uploadingLogo
                    ? 'Uploading…'
                    : form.logoUrl
                      ? 'Replace'
                      : 'Upload'}
                  <input
                    type="file"
                    accept="image/*"
                    hidden
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      e.target.value = '';
                      if (f) handleLogoFile(f);
                    }}
                  />
                </Button>
              </Stack>
            </Box>
          </Grid>
          <Grid size={{ xs: 12 }}>
            <TextField
              fullWidth
              size="small"
              label="Address"
              multiline
              minRows={2}
              value={form.address}
              onChange={(e) => patch('address', e.target.value)}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            />
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2.5, pt: 0 }}>
        <Stack direction="row" spacing={1}>
          <Button onClick={onClose} disabled={saving} sx={{ textTransform: 'none' }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={saving}
            startIcon={
              saving ? (
                <CircularProgress size={14} sx={{ color: '#fff' }} />
              ) : (
                <IconDeviceFloppy size={16} />
              )
            }
            sx={{
              textTransform: 'none',
              fontWeight: 700,
              borderRadius: 2,
              background: tokens.gradients.pinkBlue,
              px: 3,
              '&:hover': {
                background: 'linear-gradient(135deg, #DB2777 0%, #1A9FD4 100%)',
              },
            }}
          >
            {saving ? 'Saving' : isEdit ? 'Save changes' : 'Create'}
          </Button>
        </Stack>
      </DialogActions>
    </Dialog>
  );
}
