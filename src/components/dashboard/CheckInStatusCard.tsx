import { Box, Button, Stack, Typography, alpha, CircularProgress, Tooltip } from '@mui/material';
import { IconClockHour4, IconLogin2, IconLogout2, IconAlertTriangle } from '@tabler/icons-react';
import moment from 'moment';
import { tokens } from '../../theme/theme';
import { dateByUserShift } from '../../utils/dateUtil';
import { useAuth } from '../../AuthGaurd/AuthContextProvider';
import { useCheckIn } from '../../contextProviders/CheckInProvider';

function formatWorked(ms: number): string {
  const totalMin = Math.floor(ms / 60000);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  if (h === 0) return `${m}m`;
  return `${h}h ${m}m`;
}

/**
 * Dashboard card telling the employee whether they're currently checked in.
 *   - Checked in → "Checked in at HH:MM · working Xh Ym" + a "don't forget
 *     to check out" nudge + a Check Out button.
 *   - Not checked in → prompt to Check In.
 * Reads the shared CheckInProvider so it stays in lockstep with the navbar
 * timer. Renders nothing for super-admins (provider never checks them in).
 */
export default function CheckInStatusCard() {
  const { iUser } = useAuth();
  const { session, isCheckedIn, elapsedMs, actionPending, doCheckIn, doCheckOut } =
    useCheckIn();

  const accent = isCheckedIn ? tokens.colors.pink : tokens.colors.blue;

  // No check-in on weekends (non-working days), resolved in the user's
  // shift timezone. Checkout stays enabled.
  const dow = iUser?.shift ? dateByUserShift(iUser.shift).day() : new Date().getDay();
  const isWeekend = dow === 0 || dow === 6;

  return (
    <Box
      sx={{
        mt: 2,
        p: 2.5,
        borderRadius: 3,
        border: '1px solid',
        borderColor: alpha(accent, 0.25),
        background: alpha(accent, 0.05),
        display: 'flex',
        flexDirection: { xs: 'column', sm: 'row' },
        alignItems: { sm: 'center' },
        justifyContent: 'space-between',
        gap: 1.5,
      }}
    >
      <Stack direction="row" spacing={1.5} alignItems="center">
        <Box
          sx={{
            width: 44,
            height: 44,
            borderRadius: 2.5,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: alpha(accent, 0.12),
            color: accent,
          }}
        >
          <IconClockHour4 size={24} />
        </Box>
        <Box>
          {isCheckedIn && session ? (
            <>
              <Typography sx={{ fontWeight: 800, color: tokens.colors.lightText }}>
                Checked in at {moment(session.checkInAt).format('h:mm A')}
                {' · '}working {formatWorked(elapsedMs)}
              </Typography>
              <Stack direction="row" spacing={0.5} alignItems="center" sx={{ mt: 0.25 }}>
                <IconAlertTriangle size={13} color={tokens.colors.yellowDark} />
                <Typography variant="caption" sx={{ color: tokens.colors.yellowDark, fontWeight: 600 }}>
                  Don&rsquo;t forget to check out before you leave.
                </Typography>
              </Stack>
            </>
          ) : (
            <>
              <Typography sx={{ fontWeight: 800, color: tokens.colors.lightText }}>
                {isWeekend ? 'Non-working day' : 'You haven’t checked in yet'}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {isWeekend
                  ? 'Check-in is not available on weekends.'
                  : 'Start your working-hours timer for today.'}
              </Typography>
            </>
          )}
        </Box>
      </Stack>

      <Tooltip
        title={!isCheckedIn && isWeekend ? 'Check-in is not available on weekends.' : ''}
        arrow
      >
        <Box component="span">
          <Button
            variant="contained"
            size="small"
            disabled={actionPending || (!isCheckedIn && isWeekend)}
            startIcon={
              actionPending ? (
                <CircularProgress size={14} sx={{ color: '#fff' }} />
              ) : isCheckedIn ? (
                <IconLogout2 size={16} />
              ) : (
                <IconLogin2 size={16} />
              )
            }
            onClick={() => (isCheckedIn ? doCheckOut('manual') : doCheckIn())}
            sx={{
              textTransform: 'none',
              fontWeight: 700,
              borderRadius: 2.5,
              px: 2.5,
              background: tokens.gradients.pinkBlue,
              boxShadow: 'none',
              '&:hover': { background: tokens.gradients.pinkBlue, filter: 'brightness(1.08)' },
            }}
          >
            {isCheckedIn ? 'Check Out' : 'Check In'}
          </Button>
        </Box>
      </Tooltip>
    </Box>
  );
}
