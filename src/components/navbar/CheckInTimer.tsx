import { Box, Button, Chip, CircularProgress, Tooltip } from '@mui/material';
import { IconLogin2, IconLogout2, IconClockHour4 } from '@tabler/icons-react';
import { useAuth } from '../../AuthGaurd/AuthContextProvider';
import { UserRole } from '../../Interfaces/iUser';
import {
  EmployeeModule,
  ModuleGroup,
  moduleKey,
} from '../../utils/accessControlUtil';
import { tokens } from '../../theme/theme';
import { useCheckIn } from '../../contextProviders/CheckInProvider';

// HH:MM:SS from a millisecond duration.
function formatElapsed(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
}

/**
 * Navbar working-hours timer. Replaces the old AttendancePopUp:
 *   - Not checked in → a "Check In" button.
 *   - Checked in    → a live HH:MM:SS chip + "Check Out" button.
 *
 * The elapsed time is server-clock based (see CheckInProvider) and survives
 * logout/login or a browser crash because it's recomputed from the stored
 * check-in timestamp. Hidden for super-admins and for anyone without the
 * Attendance module (mirrors the previous widget's gating).
 */
export default function CheckInTimer() {
  const { iUser, isModuleAllowed } = useAuth();
  const { isCheckedIn, elapsedMs, actionPending, doCheckIn, doCheckOut } =
    useCheckIn();

  if (
    !iUser ||
    iUser.role?.includes(UserRole['super-admin']) ||
    !isModuleAllowed(
      moduleKey(ModuleGroup['Presence & Leave'], EmployeeModule.Attendance)
    )
  ) {
    return null;
  }

  const brandButtonSx = {
    textTransform: 'none' as const,
    borderRadius: 2,
    fontWeight: 700,
    px: 1.5,
    py: 0.5,
    fontSize: '0.8rem',
    background: tokens.gradients.pinkBlue,
    boxShadow: 'none',
    color: '#fff',
    minWidth: 'max-content',
    '&:hover': {
      background: tokens.gradients.pinkBlue,
      filter: 'brightness(1.08)',
      boxShadow: 'none',
    },
  };

  return (
    <Box sx={{ flexGrow: 0, mr: 2.5, display: 'flex', alignItems: 'center', gap: 1 }}>
      {isCheckedIn && (
        <Tooltip title="Working time today — do not forget to check out." arrow>
          <Chip
            icon={<IconClockHour4 size={15} />}
            label={formatElapsed(elapsedMs)}
            size="small"
            sx={{
              fontWeight: 800,
              fontVariantNumeric: 'tabular-nums',
              letterSpacing: 0.5,
              color: tokens.colors.blueDark,
              bgcolor: 'rgba(3, 40, 64, 0.06)',
              '& .MuiChip-icon': { color: tokens.colors.pinkDark },
            }}
          />
        </Tooltip>
      )}

      {isCheckedIn ? (
        <Button
          variant="contained"
          size="small"
          startIcon={
            actionPending ? (
              <CircularProgress size={13} sx={{ color: '#fff' }} />
            ) : (
              <IconLogout2 size={16} />
            )
          }
          sx={brandButtonSx}
          disabled={actionPending}
          onClick={() => doCheckOut('manual')}
        >
          Check Out
        </Button>
      ) : (
        <Button
          variant="contained"
          size="small"
          startIcon={
            actionPending ? (
              <CircularProgress size={13} sx={{ color: '#fff' }} />
            ) : (
              <IconLogin2 size={16} />
            )
          }
          sx={brandButtonSx}
          disabled={actionPending}
          onClick={() => doCheckIn()}
        >
          Check In
        </Button>
      )}
    </Box>
  );
}
