import { useEffect, useState } from 'react';
import {
  Box,
  Stack,
  Typography,
  Chip,
  CircularProgress,
  alpha,
} from '@mui/material';
import { IconChevronRight, IconInbox } from '@tabler/icons-react';
import moment from 'moment';
import { toast } from 'react-toastify';
import CustomDrawer from '../drawer/CustomDrawer';
import RequirementDrawer from '../requirement/RequirementDrawer';
import {
  getMarketingPositions,
  MarketingPosition,
} from '../../services/reportsApi';
import { tokens } from '../../theme/theme';

// Status → accent colour + the stamp that dates the position in this report.
const STATUS_META: Record<
  string,
  { color: string; stamp: keyof MarketingPosition }
> = {
  'Submission in progress': {
    color: tokens.colors.warning,
    stamp: '_perfInProgressAt',
  },
  Submitted: { color: tokens.colors.success, stamp: '_perfSubmittedAt' },
  Interviewed: { color: tokens.colors.blue, stamp: '_perfInterviewedAt' },
  Cancelled: { color: tokens.colors.error, stamp: '_perfCancelledAt' },
};

interface Props {
  open: boolean;
  onClose: () => void;
  person: { id: string; name: string } | null;
  /** One of the four statuses; omitted = the person's total across all four. */
  status?: string;
  fromDate: string;
  toDate: string;
}

/**
 * The drill-down for a clicked number in the marketing report. Shows the list
 * of positions behind that number; selecting one opens the full requirement
 * view on top (reusing RequirementDrawer), and closing it returns to the list.
 */
export default function MarketingPositionsDrawer({
  open,
  onClose,
  person,
  status,
  fromDate,
  toDate,
}: Props) {
  const [positions, setPositions] = useState<MarketingPosition[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedReqID, setSelectedReqID] = useState<string>();

  useEffect(() => {
    if (!open || !person) return;
    let cancelled = false;
    setLoading(true);
    setSelectedReqID(undefined);
    getMarketingPositions({ assignedToRef: person.id, status, fromDate, toDate })
      .then((data) => {
        if (!cancelled) setPositions(data || []);
      })
      .catch(() => {
        if (!cancelled) {
          toast.error('Failed to load positions.');
          setPositions([]);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, person, status, fromDate, toDate]);

  const statusDate = (p: MarketingPosition): string | undefined => {
    const meta = p.reqStatus ? STATUS_META[p.reqStatus] : undefined;
    const raw = meta ? (p[meta.stamp] as string | undefined) : undefined;
    return raw ? moment(raw).format('MMM D, YYYY') : undefined;
  };

  return (
    <>
      <CustomDrawer
        open={open}
        onClose={onClose}
        closeOnOutSideClick
        title={person ? person.name : 'Positions'}
        subTitle={status || 'All positions'}
      >
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress size={28} />
          </Box>
        ) : positions.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 8, color: 'text.secondary' }}>
            <IconInbox size={40} style={{ opacity: 0.4 }} />
            <Typography sx={{ mt: 1 }}>
              No positions for this selection.
            </Typography>
          </Box>
        ) : (
          <Stack spacing={1} sx={{ mt: 1 }}>
            <Typography variant="caption" color="text.secondary">
              {positions.length} position{positions.length === 1 ? '' : 's'}
            </Typography>
            {positions.map((p) => {
              const meta = p.reqStatus ? STATUS_META[p.reqStatus] : undefined;
              const color = meta?.color || tokens.colors.lightTextSecondary;
              const when = statusDate(p);
              return (
                <Box
                  key={p._id}
                  onClick={() => setSelectedReqID(p.reqID)}
                  sx={{
                    p: 1.5,
                    borderRadius: 2,
                    border: '1px solid',
                    borderColor: 'divider',
                    borderLeft: `4px solid ${color}`,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 1,
                    transition: 'box-shadow .2s, transform .2s',
                    '&:hover': {
                      boxShadow: `0 4px 16px ${alpha(color, 0.18)}`,
                      transform: 'translateY(-1px)',
                    },
                  }}
                >
                  <Box sx={{ minWidth: 0 }}>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Typography fontWeight={700} noWrap>
                        {p.reqID}
                      </Typography>
                      {p.reqStatus && (
                        <Chip
                          size="small"
                          label={p.reqStatus}
                          sx={{
                            bgcolor: alpha(color, 0.15),
                            color,
                            fontWeight: 700,
                          }}
                        />
                      )}
                    </Stack>
                    <Typography variant="body2" color="text.secondary" noWrap>
                      {p.appliedFor || '—'}
                      {when ? ` · ${when}` : ''}
                    </Typography>
                  </Box>
                  <IconChevronRight
                    size={18}
                    style={{ flexShrink: 0, opacity: 0.5 }}
                  />
                </Box>
              );
            })}
          </Stack>
        )}
      </CustomDrawer>

      {selectedReqID && (
        <RequirementDrawer
          reqID={selectedReqID}
          open={Boolean(selectedReqID)}
          onClose={() => setSelectedReqID(undefined)}
        />
      )}
    </>
  );
}
