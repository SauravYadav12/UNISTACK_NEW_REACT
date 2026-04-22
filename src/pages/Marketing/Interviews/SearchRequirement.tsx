import {
  Box,
  Button,
  DialogContent,
  IconButton,
  InputAdornment,
  Stack,
  TextField,
  Typography,
  Chip,
  alpha,
  CircularProgress,
  Avatar,
  Tooltip,
} from '@mui/material';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import moment from 'moment';
import {
  IconSearch,
  IconX,
  IconChevronRight,
  IconBriefcase,
  IconBuilding,
  IconUserCircle,
  IconAlertCircle,
  IconCompass,
} from '@tabler/icons-react';
import { useAuth } from '../../../AuthGaurd/AuthContextProvider';
import { searchRequirement } from '../../../services/requirementApi';
import { IRequirement, RequirementStatus } from '../../../Interfaces/types';
import { tokens } from '../../../theme/theme';
import { getInitials } from '../../../components/ui/PersonPill';
import { reqirementStatusColors } from '../Requirements/requirementsValues';

interface Props {
  onSelect: (record: IRequirement) => void;
  /**
   * Optional: when this predicate returns a non-empty string for a given
   * assignment, the Select button renders disabled and the reason is shown
   * on the row (and in a tooltip). Used by AddProjectDialog to block
   * re-projecting a requirement that's already attached to a project.
   */
  disableSelectReason?: (record: IRequirement) => string | null;
}

interface SearchResult {
  parent: IRequirement;
  assignments: IRequirement[];
  isParent: boolean;
  matchedReqID?: string;
  legacySelf: boolean;
}

const SEARCH_DEBOUNCE_MS = 500;

function isValidReqID(q: string) {
  return /^REQ-[A-Z0-9-]+$/i.test(q.trim());
}

export default function SearchRequirement({
  onSelect,
  disableSelectReason,
}: Props) {
  const { iUser } = useAuth();
  const [query, setQuery] = useState('');
  const [debounced, setDebounced] = useState('');
  const [result, setResult] = useState<SearchResult | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Debounce user typing so admins don't need to click Search every time.
  useEffect(() => {
    const t = setTimeout(() => setDebounced(query.trim()), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [query]);

  const runSearch = useCallback(async (raw: string) => {
    const q = raw.trim();
    if (!q) {
      setResult(null);
      setError('');
      return;
    }
    if (!isValidReqID(q)) {
      setResult(null);
      setError('Use a valid ID format like REQ-05 or REQ-05-A.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await searchRequirement(q);
      setResult(res.data.data || null);
    } catch (e: any) {
      setResult(null);
      const msg = e?.response?.data?.message || 'No requirement found.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fire on debounced change.
  useEffect(() => {
    if (debounced) void runSearch(debounced);
    else {
      setResult(null);
      setError('');
    }
  }, [debounced, runSearch]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Build display assignments: if legacySelf, synthesize a single assignment
  // from the parent's own assignedToRef.
  const renderableAssignments = useMemo(() => {
    if (!result) return [] as Array<IRequirement & { __matched?: boolean; __yours?: boolean; __legacy?: boolean }>;
    const uid = iUser?._id || '';
    if (result.legacySelf) {
      const p = result.parent;
      return [
        {
          ...p,
          __matched: true,
          __yours: String(p.assignedToRef || '') === String(uid),
          __legacy: true,
        },
      ];
    }
    return result.assignments.map((a) => ({
      ...a,
      __matched: result.matchedReqID === a.reqID,
      __yours: String(a.assignedToRef || '') === String(uid),
      __legacy: false,
    }));
  }, [result, iUser?._id]);

  // Sort so "yours" is first, then matched, then by childSuffix.
  const sortedAssignments = useMemo(() => {
    return [...renderableAssignments].sort((a, b) => {
      if (a.__yours !== b.__yours) return a.__yours ? -1 : 1;
      if (a.__matched !== b.__matched) return a.__matched ? -1 : 1;
      return (a.childSuffix || '').localeCompare(b.childSuffix || '');
    });
  }, [renderableAssignments]);

  const parent = result?.parent;

  return (
    <DialogContent sx={{ p: { xs: 2, sm: 3 }, bgcolor: '#F6F9FC' }}>
      {/* ── Search bar ── */}
      <Box
        sx={{
          p: 2,
          borderRadius: 3,
          bgcolor: '#fff',
          border: '1px solid',
          borderColor: 'divider',
          boxShadow: `0 6px 20px ${alpha(tokens.colors.brand, 0.06)}`,
        }}
      >
        <Stack direction="row" spacing={1.25} alignItems="center">
          <TextField
            inputRef={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                void runSearch(query);
              }
            }}
            placeholder="Type a Req ID — e.g. REQ-05 or REQ-05-A"
            fullWidth
            size="medium"
            InputProps={{
              sx: { borderRadius: 2.5, fontSize: '1rem', fontWeight: 600 },
              startAdornment: (
                <InputAdornment position="start">
                  <IconSearch size={20} color={tokens.colors.blueDark} />
                </InputAdornment>
              ),
              endAdornment: query ? (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={() => setQuery('')}>
                    <IconX size={16} />
                  </IconButton>
                </InputAdornment>
              ) : undefined,
            }}
          />
          <Button
            variant="contained"
            onClick={() => void runSearch(query)}
            disabled={loading}
            sx={{
              textTransform: 'none',
              fontWeight: 700,
              borderRadius: 2.5,
              px: 3,
              background: tokens.gradients.pinkBlue,
              '&:hover': { background: tokens.gradients.pinkBlue, filter: 'brightness(1.08)' },
            }}
          >
            {loading ? <CircularProgress size={18} sx={{ color: '#fff' }} /> : 'Search'}
          </Button>
        </Stack>
        <Typography
          variant="caption"
          sx={{ display: 'block', mt: 1, color: 'text.secondary' }}
        >
          Tip: type a parent ID (e.g. <strong>REQ-05</strong>) to see every marketer's assignment in one place.
        </Typography>
      </Box>

      {/* ── Error / empty ── */}
      {error && !loading && (
        <Stack
          direction="row"
          spacing={1}
          alignItems="center"
          sx={{
            mt: 2,
            p: 1.5,
            borderRadius: 2.5,
            bgcolor: alpha('#EF4444', 0.06),
            border: `1px solid ${alpha('#EF4444', 0.2)}`,
          }}
        >
          <IconAlertCircle size={18} color="#EF4444" />
          <Typography variant="body2" color="error.main" fontWeight={600}>
            {error}
          </Typography>
        </Stack>
      )}

      {!query && !result && !error && (
        <Stack
          alignItems="center"
          spacing={1.25}
          sx={{ mt: 5, p: 4, textAlign: 'center' }}
        >
          <Box
            sx={{
              width: 64,
              height: 64,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: tokens.gradients.pinkBlue,
              color: '#fff',
              boxShadow: tokens.shadows.glow,
            }}
          >
            <IconCompass size={28} />
          </Box>
          <Typography variant="h6" fontWeight={800}>
            Find the right requirement
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 440 }}>
            Start with the parent Req ID. We'll surface every marketer's
            assignment under it so you always attach the interview to the
            correct one.
          </Typography>
        </Stack>
      )}

      {/* ── Parent card with assignments ── */}
      {parent && (
        <Box
          sx={{
            mt: 2,
            borderRadius: 3,
            overflow: 'hidden',
            border: '1px solid',
            borderColor: 'divider',
            bgcolor: '#fff',
            boxShadow: `0 10px 30px ${alpha(tokens.colors.brand, 0.06)}`,
          }}
        >
          {/* Parent hero strip */}
          <Box
            sx={{
              position: 'relative',
              p: 2.25,
              background: tokens.gradients.pinkBlue,
              color: '#fff',
              overflow: 'hidden',
            }}
          >
            <Typography
              variant="caption"
              sx={{ opacity: 0.9, letterSpacing: '0.08em', fontWeight: 800 }}
            >
              PARENT REQUIREMENT
            </Typography>
            <Typography
              variant="h6"
              fontWeight={800}
              sx={{ lineHeight: 1.2, mt: 0.25 }}
            >
              {parent.reqID}
              {parent.jobTitle && <Box component="span" sx={{ opacity: 0.9 }}> · {parent.jobTitle}</Box>}
            </Typography>
            <Stack
              direction="row"
              spacing={1.25}
              flexWrap="wrap"
              sx={{ mt: 0.75, fontSize: '0.82rem', opacity: 0.95 }}
            >
              {parent.clientCompany && (
                <Stack direction="row" spacing={0.5} alignItems="center">
                  <IconBuilding size={14} />
                  <span>{parent.clientCompany}</span>
                </Stack>
              )}
              {parent.primaryTech && (
                <Stack direction="row" spacing={0.5} alignItems="center">
                  <IconBriefcase size={14} />
                  <span>{parent.primaryTech}</span>
                </Stack>
              )}
              {parent.reqEnteredBy && (
                <Stack direction="row" spacing={0.5} alignItems="center">
                  <IconUserCircle size={14} />
                  <span>{parent.reqEnteredBy}</span>
                </Stack>
              )}
            </Stack>
          </Box>

          {/* Assignments list */}
          <Box sx={{ p: 2 }}>
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1.5 }}>
              <Typography
                variant="caption"
                sx={{
                  letterSpacing: '0.08em',
                  fontWeight: 800,
                  color: tokens.colors.blueDark,
                }}
              >
                ASSIGNMENTS
              </Typography>
              <Chip
                label={sortedAssignments.length}
                size="small"
                sx={{
                  height: 20,
                  bgcolor: alpha(tokens.colors.blue, 0.1),
                  color: tokens.colors.blueDark,
                  fontWeight: 800,
                  fontSize: '0.68rem',
                }}
              />
            </Stack>

            {sortedAssignments.length === 0 ? (
              <Box
                sx={{
                  p: 3,
                  textAlign: 'center',
                  borderRadius: 2.5,
                  border: '1px dashed',
                  borderColor: alpha(tokens.colors.blue, 0.3),
                  bgcolor: alpha(tokens.colors.blue, 0.03),
                }}
              >
                <Typography variant="body2" fontWeight={700}>
                  No marketers assigned yet
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Ask Support or an admin to assign this requirement before scheduling interviews.
                </Typography>
              </Box>
            ) : (
              <Stack spacing={1.25}>
                {sortedAssignments.map((a) => {
                  const status = (a.reqStatus || 'New Working') as RequirementStatus;
                  const statusColor = reqirementStatusColors[status] || '#94A3B8';
                  const updated = a.updatedAt ? moment(a.updatedAt).fromNow() : '—';
                  const accent = a.__yours
                    ? tokens.colors.pink
                    : a.__matched
                      ? tokens.colors.blue
                      : '#CBD5E1';
                  return (
                    <Box
                      key={a._id || a.reqID}
                      sx={{
                        position: 'relative',
                        p: 1.5,
                        pl: 2,
                        borderRadius: 2.5,
                        border: '1px solid',
                        borderColor: a.__yours
                          ? alpha(tokens.colors.pink, 0.35)
                          : a.__matched
                            ? alpha(tokens.colors.blue, 0.3)
                            : 'divider',
                        bgcolor: a.__yours
                          ? alpha(tokens.colors.pink, 0.04)
                          : '#fff',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1.5,
                        transition: 'all 0.18s ease',
                        '&:hover': {
                          borderColor: a.__yours ? tokens.colors.pink : tokens.colors.blueDark,
                          transform: 'translateY(-1px)',
                          boxShadow: `0 8px 24px ${alpha(accent, 0.15)}`,
                        },
                      }}
                    >
                      <Box
                        sx={{
                          position: 'absolute',
                          left: 0,
                          top: 0,
                          bottom: 0,
                          width: 4,
                          bgcolor: accent,
                        }}
                      />

                      <Avatar
                        sx={{
                          width: 40,
                          height: 40,
                          fontSize: '0.78rem',
                          fontWeight: 800,
                          background: a.__yours
                            ? tokens.gradients.pinkBlue
                            : alpha(tokens.colors.blue, 0.12),
                          color: a.__yours ? '#fff' : tokens.colors.blueDark,
                          flexShrink: 0,
                        }}
                      >
                        {getInitials(a.assignedTo || '?')}
                      </Avatar>

                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Stack direction="row" spacing={0.75} alignItems="center" flexWrap="wrap">
                          <Typography
                            sx={{
                              fontFamily: 'ui-monospace, Menlo, monospace',
                              fontSize: '0.8rem',
                              fontWeight: 800,
                              color: tokens.colors.blueDark,
                            }}
                          >
                            {a.reqID}
                          </Typography>
                          {a.__yours && (
                            <Chip
                              label="YOUR ASSIGNMENT"
                              size="small"
                              sx={{
                                height: 18,
                                fontSize: '0.6rem',
                                fontWeight: 800,
                                letterSpacing: '0.06em',
                                background: tokens.gradients.pinkBlue,
                                color: '#fff',
                              }}
                            />
                          )}
                          {!a.__yours && a.__matched && (
                            <Chip
                              label="MATCHED"
                              size="small"
                              sx={{
                                height: 18,
                                fontSize: '0.6rem',
                                fontWeight: 800,
                                letterSpacing: '0.06em',
                                bgcolor: alpha(tokens.colors.blue, 0.15),
                                color: tokens.colors.blueDark,
                              }}
                            />
                          )}
                          {a.__legacy && (
                            <Tooltip title="Legacy standalone requirement — single assignment only">
                              <Chip
                                label="LEGACY"
                                size="small"
                                sx={{
                                  height: 18,
                                  fontSize: '0.6rem',
                                  fontWeight: 800,
                                  bgcolor: alpha('#94A3B8', 0.15),
                                  color: '#475569',
                                }}
                              />
                            </Tooltip>
                          )}
                          {a.project?.projectId && (
                            <Chip
                              label={`${a.project.projectId}${
                                a.project.organizationShortCode
                                  ? ` · ${a.project.organizationShortCode}`
                                  : a.project.organizationName
                                    ? ` · ${a.project.organizationName}`
                                    : ''
                              }`}
                              size="small"
                              sx={{
                                height: 18,
                                fontSize: '0.62rem',
                                fontWeight: 800,
                                letterSpacing: '0.04em',
                                bgcolor: alpha('#F59E0B', 0.15),
                                color: '#B45309',
                                border: `1px solid ${alpha('#F59E0B', 0.35)}`,
                              }}
                            />
                          )}
                        </Stack>
                        <Typography fontWeight={700} sx={{ mt: 0.125 }} noWrap>
                          {a.assignedTo || 'Unassigned'}
                        </Typography>
                        <Stack
                          direction="row"
                          spacing={1}
                          sx={{ mt: 0.25, color: 'text.secondary', flexWrap: 'wrap' }}
                        >
                          {a.appliedFor && (
                            <Typography variant="caption" sx={{ fontSize: '0.72rem' }}>
                              Applied for: <strong>{a.appliedFor}</strong>
                            </Typography>
                          )}
                          <Chip
                            label={status}
                            size="small"
                            sx={{
                              height: 18,
                              fontSize: '0.62rem',
                              fontWeight: 700,
                              bgcolor: alpha(statusColor, 0.12),
                              color: statusColor,
                              border: `1px solid ${alpha(statusColor, 0.25)}`,
                            }}
                          />
                          <Typography variant="caption" sx={{ fontSize: '0.72rem' }}>
                            Last update: {updated}
                          </Typography>
                        </Stack>
                      </Box>

                      {(() => {
                        const disableReason = disableSelectReason?.(a) || null;
                        const button = (
                          <Button
                            variant={a.__yours ? 'contained' : 'outlined'}
                            size="small"
                            onClick={() => !disableReason && onSelect(a)}
                            disabled={!!disableReason}
                            endIcon={<IconChevronRight size={14} />}
                            sx={{
                              textTransform: 'none',
                              fontWeight: 700,
                              borderRadius: 2,
                              flexShrink: 0,
                              ...(a.__yours
                                ? {
                                    background: tokens.gradients.pinkBlue,
                                    '&:hover': {
                                      background: tokens.gradients.pinkBlue,
                                      filter: 'brightness(1.08)',
                                    },
                                  }
                                : {
                                    borderColor: alpha(tokens.colors.blue, 0.35),
                                    color: tokens.colors.blueDark,
                                    '&:hover': {
                                      borderColor: tokens.colors.blueDark,
                                      bgcolor: alpha(tokens.colors.blue, 0.06),
                                    },
                                  }),
                            }}
                          >
                            Select
                          </Button>
                        );
                        return disableReason ? (
                          <Tooltip title={disableReason}>
                            <span>{button}</span>
                          </Tooltip>
                        ) : (
                          button
                        );
                      })()}
                    </Box>
                  );
                })}
              </Stack>
            )}
          </Box>
        </Box>
      )}
    </DialogContent>
  );
}
