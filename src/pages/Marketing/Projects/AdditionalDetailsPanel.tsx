import {
  Box,
  Button,
  CircularProgress,
  IconButton,
  Stack,
  TextField,
  Tooltip,
  Typography,
  alpha,
} from '@mui/material';
import { useState } from 'react';
import { toast } from 'react-toastify';
import {
  IconDeviceFloppy,
  IconPencil,
  IconPlus,
  IconTrash,
  IconX,
} from '@tabler/icons-react';
import { motion } from 'framer-motion';
import moment from 'moment';
import { tokens } from '../../../theme/theme';
import { IProject } from '../../../Interfaces/project';
import {
  addAdditionalDetail,
  removeAdditionalDetail,
  updateAdditionalDetail,
} from '../../../services/projectApi';
import ConfirmDialog from '../../../components/ui/ConfirmDialog';

const MotionBox = motion.create(Box);

interface Props {
  project: IProject;
  onUpdated: (p: IProject) => void;
}

export default function AdditionalDetailsPanel({ project, onUpdated }: Props) {
  const [adding, setAdding] = useState(false);
  const [newKey, setNewKey] = useState('');
  const [newValue, setNewValue] = useState('');
  const [saving, setSaving] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editKey, setEditKey] = useState('');
  const [editValue, setEditValue] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);

  const [pendingDelete, setPendingDelete] = useState<{ id: string; key: string } | null>(null);

  const handleAdd = async () => {
    const key = newKey.trim();
    if (!key) {
      toast.error('Key is required');
      return;
    }
    setSaving(true);
    try {
      const { data } = await addAdditionalDetail(project._id, {
        key,
        value: newValue,
      });
      if (data.data) onUpdated(data.data);
      setAdding(false);
      setNewKey('');
      setNewValue('');
    } catch {
      toast.error('Could not save detail');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveEdit = async (detailId: string) => {
    const key = editKey.trim();
    if (!key) {
      toast.error('Key is required');
      return;
    }
    setSavingEdit(true);
    try {
      const { data } = await updateAdditionalDetail(project._id, detailId, {
        key,
        value: editValue,
      });
      if (data.data) onUpdated(data.data);
      setEditingId(null);
    } catch {
      toast.error('Could not update detail');
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDelete = async () => {
    if (!pendingDelete) return;
    const { data } = await removeAdditionalDetail(project._id, pendingDelete.id);
    if (data.data) onUpdated(data.data);
    setPendingDelete(null);
  };

  const details = project.additionalDetails || [];

  return (
    <Box>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        sx={{ mb: 2 }}
      >
        <Box>
          <Typography variant="subtitle1" fontWeight={700}>
            Extra context
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Anything the snapshot doesn't cover — PO numbers, onboarding notes, visa quirks
          </Typography>
        </Box>
        {!adding && (
          <Button
            size="small"
            variant="outlined"
            startIcon={<IconPlus size={14} />}
            onClick={() => setAdding(true)}
            sx={{
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 700,
              borderColor: tokens.colors.pink,
              color: tokens.colors.pinkDark,
              '&:hover': {
                bgcolor: alpha(tokens.colors.pink, 0.06),
                borderColor: tokens.colors.pinkDark,
              },
            }}
          >
            Add detail
          </Button>
        )}
      </Stack>

      {adding && (
        <MotionBox
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          sx={{
            p: 2,
            mb: 1.5,
            borderRadius: 3,
            border: `1px dashed ${alpha(tokens.colors.pink, 0.4)}`,
            bgcolor: alpha(tokens.colors.pink, 0.03),
          }}
        >
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems="center">
            <TextField
              label="Key"
              size="small"
              value={newKey}
              onChange={(e) => setNewKey(e.target.value)}
              sx={{ flex: 1, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            />
            <TextField
              label="Value"
              size="small"
              value={newValue}
              onChange={(e) => setNewValue(e.target.value)}
              sx={{ flex: 2, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            />
            <Stack direction="row" spacing={0.5}>
              <Button
                size="small"
                variant="contained"
                onClick={handleAdd}
                disabled={saving}
                startIcon={
                  saving ? (
                    <CircularProgress size={12} sx={{ color: '#fff' }} />
                  ) : (
                    <IconDeviceFloppy size={14} />
                  )
                }
                sx={{
                  bgcolor: tokens.colors.pink,
                  textTransform: 'none',
                  fontWeight: 700,
                  borderRadius: 2,
                  '&:hover': { bgcolor: tokens.colors.pinkDark },
                }}
              >
                Save
              </Button>
              <IconButton
                size="small"
                onClick={() => {
                  setAdding(false);
                  setNewKey('');
                  setNewValue('');
                }}
              >
                <IconX size={14} />
              </IconButton>
            </Stack>
          </Stack>
        </MotionBox>
      )}

      {details.length === 0 && !adding && (
        <Box
          sx={{
            py: 6,
            textAlign: 'center',
            borderRadius: 3,
            border: `1px dashed ${alpha(tokens.colors.blue, 0.3)}`,
            bgcolor: alpha(tokens.colors.blue, 0.03),
          }}
        >
          <Typography sx={{ fontWeight: 700, color: tokens.colors.lightText }}>
            No extra details yet
          </Typography>
          <Typography sx={{ fontSize: 13, color: tokens.colors.lightTextSecondary }}>
            Click &ldquo;Add detail&rdquo; to capture PO numbers, contract notes, anything custom.
          </Typography>
        </Box>
      )}

      <Stack spacing={1}>
        {details.map((d) => {
          const isEditing = editingId === d._id;
          return (
            <Box
              key={d._id}
              sx={{
                p: 1.75,
                borderRadius: 3,
                border: '1px solid',
                borderColor: isEditing
                  ? alpha(tokens.colors.pink, 0.4)
                  : 'grey.200',
                bgcolor: isEditing ? alpha(tokens.colors.pink, 0.03) : 'background.paper',
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
              }}
            >
              {isEditing ? (
                <>
                  <TextField
                    size="small"
                    value={editKey}
                    onChange={(e) => setEditKey(e.target.value)}
                    sx={{ flex: 1, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                  />
                  <TextField
                    size="small"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    sx={{ flex: 2, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                  />
                  <Tooltip title="Save">
                    <IconButton
                      size="small"
                      onClick={() => d._id && handleSaveEdit(d._id)}
                      disabled={savingEdit}
                      sx={{ color: tokens.colors.pinkDark }}
                    >
                      {savingEdit ? (
                        <CircularProgress size={14} />
                      ) : (
                        <IconDeviceFloppy size={16} />
                      )}
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Cancel">
                    <IconButton size="small" onClick={() => setEditingId(null)}>
                      <IconX size={16} />
                    </IconButton>
                  </Tooltip>
                </>
              ) : (
                <>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography
                      variant="caption"
                      sx={{
                        color: tokens.colors.lightTextSecondary,
                        fontWeight: 700,
                        letterSpacing: '0.04em',
                        textTransform: 'uppercase',
                        fontSize: '0.65rem',
                      }}
                    >
                      {d.key}
                    </Typography>
                    <Typography
                      sx={{
                        fontSize: '0.88rem',
                        fontWeight: 600,
                        color: tokens.colors.lightText,
                        wordBreak: 'break-word',
                      }}
                    >
                      {d.value || '—'}
                    </Typography>
                    {d.addedBy && (
                      <Typography
                        variant="caption"
                        sx={{ color: 'text.secondary', fontSize: '0.68rem' }}
                      >
                        {d.addedBy}
                        {d.addedAt && ` · ${moment(d.addedAt).format('MMM D, YYYY')}`}
                      </Typography>
                    )}
                  </Box>
                  <Tooltip title="Edit">
                    <IconButton
                      size="small"
                      onClick={() => {
                        setEditingId(d._id || null);
                        setEditKey(d.key);
                        setEditValue(d.value);
                      }}
                    >
                      <IconPencil size={14} />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Delete">
                    <IconButton
                      size="small"
                      onClick={() =>
                        d._id && setPendingDelete({ id: d._id, key: d.key })
                      }
                      sx={{ color: '#EF4444' }}
                    >
                      <IconTrash size={14} />
                    </IconButton>
                  </Tooltip>
                </>
              )}
            </Box>
          );
        })}
      </Stack>

      <ConfirmDialog
        open={!!pendingDelete}
        onClose={() => setPendingDelete(null)}
        onConfirm={handleDelete}
        title="Remove this detail?"
        description={
          pendingDelete
            ? `"${pendingDelete.key}" will be removed from this project's extra context.`
            : ''
        }
        confirmLabel="Remove"
        tone="danger"
      />
    </Box>
  );
}
