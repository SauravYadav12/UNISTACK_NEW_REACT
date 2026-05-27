import { useEffect, useState } from 'react';
import {
  Box,
  Button,
  CircularProgress,
  Stack,
  TextField,
  Typography,
  alpha,
} from '@mui/material';
import { IconCalendarPlus, IconCheck } from '@tabler/icons-react';
import { toast } from 'react-toastify';
import dayjs from 'dayjs';
import { tokens } from '../../theme/theme';
import { iUser } from '../../Interfaces/iUser';
import { getProfileByUser } from '../../services/userProfileApi';
import { updateEmployeeJoiningDate } from '../../services/probationApi';

/**
 * Inline Date-of-Joining editor for the User Management drawer.
 *
 * Lives next to the `canEdit` toggle. Admin / super-admin can adjust
 * any employee's DOJ here; the server recomputes
 * `probationOriginalEndDate` (if the employee is still on probation)
 * and force-re-seeds leave balances so prorata reflects the new clock.
 *
 * Read access is implicit (only admin/super-admin reach this drawer at
 * all) but the server also gates the PATCH on role for defence in
 * depth.
 */

interface Props {
  user: iUser;
}

export default function DateOfJoiningEditor({ user }: Props) {
  // Local YYYY-MM-DD string for the native <input type="date">. We
  // resolve it from the profile on mount.
  const [value, setValue] = useState<string>('');
  // Snapshot of the originally-loaded value so we can detect "dirty"
  // and disable save when nothing changed.
  const [original, setOriginal] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>('');

  async function load() {
    setLoading(true);
    setError('');
    try {
      // Re-use the existing self-service endpoint (admins can query
      // any user via the userRef filter).
      const p = await getProfileByUser({
        ...user,
        id: user._id,
      });
      const doj = p?.dateOfJoining
        ? dayjs(p.dateOfJoining).format('YYYY-MM-DD')
        : '';
      setValue(doj);
      setOriginal(doj);
    } catch (e) {
      setError(
        (e as { response?: { data?: { error?: string } } })?.response?.data
          ?.error ||
          (e as Error)?.message ||
          'Failed to load joining date.',
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // Refetch when a different user is selected.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user._id]);

  async function save() {
    if (!value || value === original) return;
    setSaving(true);
    try {
      const res = await updateEmployeeJoiningDate(user._id || '', value);
      const { balancesUpdated, probationOriginalEndDate } = res.data ?? {
        balancesUpdated: 0,
        probationOriginalEndDate: null,
      };
      setOriginal(value);
      toast.success(
        `Joining date updated.${
          balancesUpdated ? ` Leave balances re-seeded.` : ''
        }${
          probationOriginalEndDate
            ? ` Probation review now due ${dayjs(
                probationOriginalEndDate,
              ).format('DD MMM YYYY')}.`
            : ''
        }`,
      );
    } catch (e) {
      const msg =
        (e as { response?: { data?: { error?: string } } })?.response?.data
          ?.error ||
        (e as Error)?.message ||
        'Failed to save joining date.';
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  }

  const dirty = value && value !== original;

  return (
    <Stack
      direction="row"
      alignItems="center"
      spacing={1.25}
      sx={{
        mb: 2,
        p: 1.5,
        borderRadius: 2,
        border: '1px solid',
        borderColor: 'divider',
        bgcolor: alpha(tokens.colors.pink, 0.04),
      }}
    >
      <Box
        sx={{
          width: 28,
          height: 28,
          borderRadius: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: alpha(tokens.colors.pink, 0.12),
          color: tokens.colors.pink,
          flexShrink: 0,
        }}
      >
        <IconCalendarPlus size={16} />
      </Box>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography fontWeight={700} variant="body2">
          Date of Joining
        </Typography>
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ display: 'block' }}
        >
          Sets the probation clock and leave-balance prorata. Saving
          re-seeds balances for the current year.
        </Typography>
      </Box>
      {loading ? (
        <CircularProgress size={18} />
      ) : error ? (
        <Typography variant="caption" color="error">
          {error}
        </Typography>
      ) : (
        <Stack direction="row" spacing={1} alignItems="center">
          <TextField
            type="date"
            size="small"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            disabled={saving}
            sx={{ minWidth: 160 }}
            InputLabelProps={{ shrink: true }}
          />
          <Button
            size="small"
            variant="contained"
            startIcon={
              saving ? <CircularProgress size={14} /> : <IconCheck size={14} />
            }
            disabled={!dirty || saving}
            onClick={save}
          >
            Save
          </Button>
        </Stack>
      )}
    </Stack>
  );
}
