import {
  Box,
  Stack,
  Typography,
  IconButton,
  TextField,
  Tooltip,
  alpha,
  CircularProgress,
  InputAdornment,
} from '@mui/material';
import { useMemo, useState } from 'react';
import moment from 'moment';
import {
  IconPencil,
  IconRefresh,
  IconCheck,
  IconX,
  IconSearch,
  IconPhone,
  IconWorld,
} from '@tabler/icons-react';
import { QuoPhoneNumber } from '../../Interfaces/quo';
import { tokens } from '../../theme/theme';

interface Props {
  numbers: QuoPhoneNumber[];
  loading: boolean;
  selectedId: string | 'all';
  onSelect: (id: string | 'all') => void;
  onSync: () => void;
  syncing: boolean;
  onLabelSave: (id: string, label: string) => Promise<void>;
  onReconcile: (id: string) => Promise<void>;
  reconcileBusyId: string | null;
  todayCounts: Record<string, number>;
}

function fmtE164(n: string) {
  if (!n) return '';
  // Tiny format helper: +1 415 555 1234
  const m = n.match(/^\+?(\d{1,3})(\d{3})(\d{3})(\d{4})$/);
  return m ? `+${m[1]} ${m[2]} ${m[3]} ${m[4]}` : n;
}

export default function NumberListPanel(props: Props) {
  const {
    numbers,
    loading,
    selectedId,
    onSelect,
    onSync,
    syncing,
    onLabelSave,
    onReconcile,
    reconcileBusyId,
    todayCounts,
  } = props;
  const [search, setSearch] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState('');
  const [savingId, setSavingId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();
    if (!s) return numbers;
    return numbers.filter(
      (n) =>
        n.e164.toLowerCase().includes(s) ||
        (n.label || '').toLowerCase().includes(s),
    );
  }, [numbers, search]);

  const totalToday = Object.values(todayCounts).reduce((a, b) => a + b, 0);

  return (
    <Box
      sx={{
        borderRight: '1px solid',
        borderColor: 'divider',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: alpha(tokens.colors.blue, 0.02),
      }}
    >
      {/* Header */}
      <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
        <Stack direction="row" alignItems="center" spacing={1}>
          <Box
            sx={{
              width: 30,
              height: 30,
              borderRadius: 1.5,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: tokens.gradients.pinkBlue,
              color: '#fff',
            }}
          >
            <IconPhone size={16} />
          </Box>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="subtitle2" fontWeight={800} noWrap>
              Numbers
            </Typography>
            <Typography variant="caption" color="text.secondary" noWrap>
              {numbers.length} on account
            </Typography>
          </Box>
          <Tooltip title="Sync from Quo (refresh list of owned numbers)">
            <span>
              <IconButton
                onClick={onSync}
                disabled={syncing || loading}
                size="small"
                sx={{
                  bgcolor: alpha(tokens.colors.blue, 0.1),
                  '&:hover': { bgcolor: alpha(tokens.colors.blue, 0.18) },
                }}
              >
                {syncing ? (
                  <CircularProgress size={14} />
                ) : (
                  <IconRefresh size={16} />
                )}
              </IconButton>
            </span>
          </Tooltip>
        </Stack>

        <TextField
          size="small"
          fullWidth
          placeholder="Search number or label…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ mt: 1.5 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <IconSearch size={14} />
              </InputAdornment>
            ),
          }}
        />
      </Box>

      {/* List */}
      <Box sx={{ flex: 1, overflowY: 'auto', p: 1 }}>
        {/* All-numbers pseudo-row */}
        <NumberCard
          selected={selectedId === 'all'}
          onClick={() => onSelect('all')}
          title="All numbers"
          subtitle={`${numbers.length} lines · ${totalToday} today`}
          icon={<IconWorld size={16} />}
        />

        {loading && numbers.length === 0 ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress size={20} />
          </Box>
        ) : filtered.length === 0 ? (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              {numbers.length === 0
                ? 'No numbers yet — click sync above.'
                : 'No matches.'}
            </Typography>
          </Box>
        ) : (
          filtered.map((n) => {
            const isEditing = editingId === n._id;
            const isReconciling = reconcileBusyId === n._id;
            const todayCount = todayCounts[n._id] || 0;
            return (
              <Box
                key={n._id}
                onClick={() => !isEditing && onSelect(n._id)}
                sx={{
                  position: 'relative',
                  cursor: isEditing ? 'default' : 'pointer',
                  borderRadius: 2,
                  border: '1px solid',
                  borderColor:
                    selectedId === n._id
                      ? tokens.colors.blueDark
                      : 'transparent',
                  bgcolor:
                    selectedId === n._id
                      ? alpha(tokens.colors.blue, 0.08)
                      : 'transparent',
                  '&:hover': isEditing
                    ? undefined
                    : { bgcolor: alpha(tokens.colors.blue, 0.05) },
                  p: 1.25,
                  mb: 0.75,
                  transition: 'all 0.15s ease',
                }}
              >
                <Stack direction="row" alignItems="center" spacing={1}>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography
                      sx={{
                        fontSize: '0.85rem',
                        fontWeight: 700,
                        color: '#0A3555',
                        fontFamily:
                          'ui-monospace, SFMono-Regular, Menlo, monospace',
                      }}
                      noWrap
                    >
                      {fmtE164(n.e164)}
                    </Typography>
                    {isEditing ? (
                      <Stack
                        direction="row"
                        spacing={0.5}
                        alignItems="center"
                        sx={{ mt: 0.5 }}
                      >
                        <TextField
                          size="small"
                          value={editLabel}
                          onChange={(e) => setEditLabel(e.target.value)}
                          onClick={(e) => e.stopPropagation()}
                          autoFocus
                          placeholder="Label…"
                          sx={{
                            '& .MuiOutlinedInput-input': {
                              py: 0.25,
                              fontSize: '0.75rem',
                            },
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.stopPropagation();
                              setSavingId(n._id);
                              onLabelSave(n._id, editLabel.trim())
                                .catch(() => {})
                                .finally(() => {
                                  setSavingId(null);
                                  setEditingId(null);
                                });
                            } else if (e.key === 'Escape') {
                              setEditingId(null);
                            }
                          }}
                        />
                        <IconButton
                          size="small"
                          disabled={savingId === n._id}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSavingId(n._id);
                            onLabelSave(n._id, editLabel.trim())
                              .catch(() => {})
                              .finally(() => {
                                setSavingId(null);
                                setEditingId(null);
                              });
                          }}
                        >
                          {savingId === n._id ? (
                            <CircularProgress size={12} />
                          ) : (
                            <IconCheck size={14} color="#10B981" />
                          )}
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingId(null);
                          }}
                        >
                          <IconX size={14} color="#EF4444" />
                        </IconButton>
                      </Stack>
                    ) : (
                      <Stack
                        direction="row"
                        spacing={0.5}
                        alignItems="center"
                        sx={{ mt: 0.25 }}
                      >
                        <Typography
                          variant="caption"
                          color={n.label ? 'text.primary' : 'text.disabled'}
                          sx={{
                            fontStyle: n.label ? 'normal' : 'italic',
                            fontWeight: n.label ? 600 : 400,
                            fontSize: '0.72rem',
                          }}
                          noWrap
                        >
                          {n.label || 'Unlabeled'}
                        </Typography>
                        <Tooltip title="Rename">
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingId(n._id);
                              setEditLabel(n.label || '');
                            }}
                            sx={{ ml: 'auto', p: 0.25 }}
                          >
                            <IconPencil size={11} />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    )}
                    {n.syncedAt && !isEditing && (
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ fontSize: '0.65rem' }}
                      >
                        Synced {moment(n.syncedAt).fromNow()}
                      </Typography>
                    )}
                  </Box>
                  <Stack alignItems="flex-end" spacing={0.5}>
                    {todayCount > 0 && (
                      <Box
                        sx={{
                          bgcolor: alpha(tokens.colors.pink, 0.15),
                          color: tokens.colors.pinkDark,
                          px: 0.75,
                          py: 0.125,
                          borderRadius: 1,
                          fontSize: '0.65rem',
                          fontWeight: 800,
                        }}
                      >
                        {todayCount} today
                      </Box>
                    )}
                    <Tooltip title="Refresh from Quo (fills any missed webhooks)">
                      <span>
                        <IconButton
                          size="small"
                          disabled={isReconciling}
                          onClick={(e) => {
                            e.stopPropagation();
                            onReconcile(n._id);
                          }}
                          sx={{ p: 0.25 }}
                        >
                          {isReconciling ? (
                            <CircularProgress size={12} />
                          ) : (
                            <IconRefresh size={12} />
                          )}
                        </IconButton>
                      </span>
                    </Tooltip>
                  </Stack>
                </Stack>
              </Box>
            );
          })
        )}
      </Box>
    </Box>
  );
}

function NumberCard({
  selected,
  onClick,
  title,
  subtitle,
  icon,
}: {
  selected: boolean;
  onClick: () => void;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
}) {
  return (
    <Box
      onClick={onClick}
      sx={{
        cursor: 'pointer',
        borderRadius: 2,
        border: '1px solid',
        borderColor: selected ? tokens.colors.blueDark : 'transparent',
        bgcolor: selected ? alpha(tokens.colors.blue, 0.08) : 'transparent',
        '&:hover': { bgcolor: alpha(tokens.colors.blue, 0.05) },
        p: 1.25,
        mb: 0.75,
      }}
    >
      <Stack direction="row" spacing={1} alignItems="center">
        <Box
          sx={{
            width: 28,
            height: 28,
            borderRadius: 1.5,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: alpha(tokens.colors.blueDark, 0.1),
            color: tokens.colors.blueDark,
          }}
        >
          {icon}
        </Box>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography sx={{ fontSize: '0.85rem', fontWeight: 700 }} noWrap>
            {title}
          </Typography>
          <Typography variant="caption" color="text.secondary" noWrap>
            {subtitle}
          </Typography>
        </Box>
      </Stack>
    </Box>
  );
}
