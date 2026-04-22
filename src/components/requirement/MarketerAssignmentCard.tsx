import { useState } from 'react';
import {
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  Collapse,
  IconButton,
  Stack,
  TextField,
  Tooltip,
  Typography,
  alpha,
} from '@mui/material';
import {
  IconChevronDown,
  IconChevronRight,
  IconExternalLink,
  IconMessageCircle2,
  IconSend,
  IconTrash,
} from '@tabler/icons-react';
import dayjs from 'dayjs';
import { reqirementStatusColors } from '../../pages/Marketing/Requirements/requirementsValues';
import { IRequirement, RequirementStatus } from '../../Interfaces/types';
import { iUser } from '../../Interfaces/iUser';
import { tokens } from '../../theme/theme';
import { getInitials } from '../ui/PersonPill';
import { dateFormate, timeFormate } from '../constants';

interface Props {
  child: IRequirement;
  currentUser: iUser;
  /** Draft comment text for this card. Local to the parent form's state bag. */
  pendingComment: string;
  onPendingCommentChange: (text: string) => void;
  /**
   * Called when the user clicks the in-card Post button. Parent form is
   * expected to persist immediately (no dependence on the main drawer Save).
   */
  onPostComment: (text: string) => Promise<void> | void;
  onOpenFocused: () => void;
  onRemove: () => void;
  removing?: boolean;
  /** True while this card's comment is posting. */
  posting?: boolean;
  /**
   * When true this card's comment input renders disabled — the current user
   * isn't this marketer and isn't a parent-editor role.
   */
  readOnly?: boolean;
  /**
   * Whether the Remove button should render at all. Marketers can't unassign
   * themselves or siblings — only support / admin / super-admin can.
   */
  canRemove?: boolean;
  /**
   * When true this card belongs to the current user — gets a subtle "YOU"
   * chip so it's obvious which one is theirs.
   */
  isSelf?: boolean;
}

/**
 * One compact card per marketer assignment on the parent requirement drawer.
 * Displays the assignment summary (status, applied-for, rate, tax, duration,
 * remote %, next step) inline in the header so the parent drawer stays
 * glanceable. Field-level edits happen in the focused child drawer opened
 * via the "View record" button. Only comments can be added from here.
 */
export default function MarketerAssignmentCard({
  child,
  currentUser,
  pendingComment,
  onPendingCommentChange,
  onPostComment,
  onOpenFocused,
  onRemove,
  removing = false,
  posting = false,
  readOnly = false,
  canRemove = true,
  isSelf = false,
}: Props) {
  const [expanded, setExpanded] = useState(false);

  const status = (child.reqStatus || 'New Working') as RequirementStatus;
  const statusColor = reqirementStatusColors[status] || '#94A3B8';
  const hasDraftComment = pendingComment.trim().length > 0;

  // Rate / taxType / duration / remote may be stored as arrays or strings.
  const stringify = (x: unknown): string => {
    if (Array.isArray(x)) return x.filter(Boolean).join(', ');
    if (x == null) return '';
    return String(x);
  };

  // Compact summary chips for the header sub-row.
  const summaryChips: { label: string; value: string }[] = [
    { label: 'Applied', value: child.appliedFor || '' },
    { label: 'Rate', value: stringify(child.rate) },
    { label: 'Tax', value: stringify(child.taxType) },
    { label: 'Duration', value: stringify(child.duration) },
    { label: 'Remote', value: stringify(child.remote) },
    { label: 'Next', value: child.nextStep || '' },
  ].filter((c) => c.value.length > 0);

  const commentCount = (child.mComment || []).length;

  return (
    <Box
      sx={{
        borderRadius: 3,
        border: '1px solid',
        borderColor: hasDraftComment ? alpha(tokens.colors.pink, 0.4) : 'divider',
        bgcolor: hasDraftComment ? alpha(tokens.colors.pink, 0.03) : 'background.paper',
        overflow: 'hidden',
        transition: 'all 0.15s ease',
      }}
    >
      {/* ── Header: avatar + name + status + summary chips ── */}
      <Box
        onClick={() => setExpanded((x) => !x)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setExpanded((x) => !x);
          }
        }}
        sx={{
          px: 2,
          py: 1.5,
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          cursor: 'pointer',
          userSelect: 'none',
          bgcolor: '#F6F9FC',
          '&:hover': { bgcolor: alpha(tokens.colors.blue, 0.04) },
        }}
      >
        <Avatar
          sx={{
            width: 38,
            height: 38,
            fontSize: '0.74rem',
            fontWeight: 800,
            background: tokens.gradients.pinkBlue,
            color: '#fff',
            flexShrink: 0,
          }}
        >
          {getInitials(child.assignedTo || '?')}
        </Avatar>

        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Stack direction="row" alignItems="center" spacing={1} flexWrap="wrap" useFlexGap>
            <Typography fontWeight={800} noWrap sx={{ color: '#0A3555' }}>
              {child.assignedTo || 'Unassigned'}
            </Typography>
            <Typography
              sx={{
                fontFamily: 'ui-monospace, Menlo, monospace',
                fontSize: '0.72rem',
                fontWeight: 700,
                color: tokens.colors.blueDark,
              }}
            >
              {child.reqID}
            </Typography>
            <Chip
              label={status}
              size="small"
              sx={{
                height: 22,
                fontSize: '0.68rem',
                fontWeight: 700,
                bgcolor: alpha(statusColor, 0.12),
                color: statusColor,
                border: `1px solid ${alpha(statusColor, 0.25)}`,
              }}
            />
            {isSelf && (
              <Chip
                label="YOU"
                size="small"
                sx={{
                  height: 20,
                  fontSize: '0.6rem',
                  fontWeight: 800,
                  letterSpacing: '0.08em',
                  background: tokens.gradients.pinkBlue,
                  color: '#fff',
                }}
              />
            )}
            {readOnly && (
              <Chip
                label="view only"
                size="small"
                sx={{
                  height: 20,
                  fontSize: '0.6rem',
                  fontWeight: 700,
                  letterSpacing: '0.06em',
                  bgcolor: alpha('#94A3B8', 0.15),
                  color: '#475569',
                }}
              />
            )}
          </Stack>

          {/* Summary chip row — same data that used to live in the form inputs. */}
          {summaryChips.length > 0 ? (
            <Stack
              direction="row"
              spacing={0.75}
              flexWrap="wrap"
              useFlexGap
              sx={{ mt: 0.75 }}
            >
              {summaryChips.map((c) => (
                <Box
                  key={c.label}
                  sx={{
                    display: 'inline-flex',
                    alignItems: 'baseline',
                    gap: 0.5,
                    px: 0.875,
                    py: 0.25,
                    borderRadius: 1.5,
                    bgcolor: '#fff',
                    border: `1px solid ${alpha(tokens.colors.blue, 0.18)}`,
                  }}
                >
                  <Typography
                    variant="caption"
                    sx={{
                      fontSize: '0.6rem',
                      fontWeight: 700,
                      letterSpacing: '0.06em',
                      textTransform: 'uppercase',
                      color: 'text.secondary',
                    }}
                  >
                    {c.label}
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      color: tokens.colors.blueDark,
                    }}
                    noWrap
                  >
                    {c.value}
                  </Typography>
                </Box>
              ))}
            </Stack>
          ) : (
            <Typography
              variant="caption"
              sx={{ mt: 0.5, display: 'block', color: 'text.secondary' }}
            >
              No details entered yet — open the focused record to fill in rate, tax, duration…
            </Typography>
          )}
        </Box>

        <Box sx={{ color: 'text.secondary', display: 'flex' }}>
          {expanded ? <IconChevronDown size={18} /> : <IconChevronRight size={18} />}
        </Box>
      </Box>

      {/* ── Body: comments timeline + actions ── */}
      <Collapse in={expanded} timeout="auto" unmountOnExit>
        <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          <Box
            sx={{
              borderRadius: 2,
              border: '1px solid',
              borderColor: 'divider',
              bgcolor: '#F6F9FC',
              overflow: 'hidden',
            }}
          >
            <Stack
              direction="row"
              alignItems="center"
              spacing={1}
              sx={{ px: 1.5, py: 1 }}
            >
              <IconMessageCircle2 size={16} color={tokens.colors.blueDark} />
              <Typography
                variant="caption"
                fontWeight={800}
                sx={{
                  color: tokens.colors.blueDark,
                  letterSpacing: '0.04em',
                }}
              >
                COMMENTS ({commentCount})
              </Typography>
            </Stack>
            <Box sx={{ p: 1.5, pt: 0, display: 'flex', flexDirection: 'column', gap: 1 }}>
              {(child.mComment || [])
                .slice()
                .reverse()
                .map((c, i) => (
                  <Box
                    key={i}
                    sx={{
                      p: 1,
                      borderRadius: 1.5,
                      bgcolor: '#fff',
                      border: '1px solid',
                      borderColor: 'divider',
                    }}
                  >
                    <Typography
                      variant="caption"
                      sx={{ fontWeight: 800, color: tokens.colors.blueDark }}
                    >
                      {c.username}
                      <Box component="span" sx={{ color: 'text.secondary', fontWeight: 500, ml: 0.5 }}>
                        · {dayjs(c.date).format(dateFormate + ' ' + timeFormate)}
                      </Box>
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 0.25, whiteSpace: 'pre-wrap' }}>
                      {c.comment}
                    </Typography>
                  </Box>
                ))}
              {commentCount === 0 && (
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ textAlign: 'center', py: 1 }}
                >
                  No comments yet on this assignment.
                </Typography>
              )}
              <TextField
                placeholder={
                  readOnly
                    ? 'Read-only — only this marketer or an admin can comment here'
                    : `Add comment as ${currentUser.firstName || 'you'}…`
                }
                value={pendingComment}
                onChange={(e) => onPendingCommentChange(e.target.value)}
                disabled={readOnly || posting}
                size="small"
                multiline
                minRows={2}
                fullWidth
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5, bgcolor: '#fff' } }}
              />
              {!readOnly && (
                <Stack direction="row" justifyContent="flex-end">
                  <Button
                    variant="contained"
                    size="small"
                    startIcon={
                      posting ? (
                        <CircularProgress size={14} sx={{ color: '#fff' }} />
                      ) : (
                        <IconSend size={14} />
                      )
                    }
                    onClick={(e) => {
                      e.stopPropagation();
                      const trimmed = pendingComment.trim();
                      if (!trimmed) return;
                      void onPostComment(trimmed);
                    }}
                    disabled={posting || !pendingComment.trim()}
                    sx={{
                      textTransform: 'none',
                      fontWeight: 700,
                      borderRadius: 2,
                      background: tokens.gradients.pinkBlue,
                      '&:hover': {
                        background: tokens.gradients.pinkBlue,
                        filter: 'brightness(1.08)',
                      },
                    }}
                  >
                    Post comment
                  </Button>
                </Stack>
              )}
            </Box>
          </Box>

          {/* Actions */}
          <Stack direction="row" spacing={1}>
            <Button
              size="small"
              variant="outlined"
              startIcon={<IconExternalLink size={14} />}
              onClick={(e) => {
                e.stopPropagation();
                onOpenFocused();
              }}
              sx={{
                textTransform: 'none',
                fontWeight: 700,
                borderRadius: 2,
                borderColor: 'divider',
                color: '#5A6A85',
              }}
            >
              View record
            </Button>
            <Box sx={{ flex: 1 }} />
            {canRemove && (
              <Tooltip
                title={
                  removing
                    ? 'Removing…'
                    : 'Remove this assignment (blocked if interviews exist)'
                }
              >
                <span>
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemove();
                    }}
                    disabled={removing}
                    sx={{
                      color: '#EF4444',
                      '&:hover': { bgcolor: alpha('#EF4444', 0.08) },
                    }}
                  >
                    {removing ? <CircularProgress size={14} /> : <IconTrash size={16} />}
                  </IconButton>
                </span>
              </Tooltip>
            )}
          </Stack>
        </Box>
      </Collapse>
    </Box>
  );
}
