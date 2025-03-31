import { AttendanceStatus, iAttendance } from '../../Interfaces/iUser';
import { useTheme } from '@mui/material/styles';
import { Box, Tooltip, Typography } from '@mui/material';
import { timeByUserShift } from '../../utils/dateUtil';
import { getJUser } from '../../utils/utils';
import { timeFormate } from '../constants';
import moment from 'moment';
interface iProps {
  attendance?: iAttendance;
  label?: string;
}
const AttendanceStatusBox = ({ attendance, label }: iProps) => {
  const status = attendance?.status;
  const theme = useTheme();

  function statusColor() {
    return {
      ...(status === AttendanceStatus.Present && {
        backgroundColor: theme.palette.success.light,
        color: theme.palette.success.contrastText,
      }),
      ...(status === AttendanceStatus.Absent && {
        backgroundColor: theme.palette.error.light,
        color: theme.palette.error.contrastText,
      }),
      ...(status === AttendanceStatus.Late && {
        backgroundColor: theme.palette.warning.light,
        color: theme.palette.error.contrastText,
      }),
      ...(status === AttendanceStatus['Half-Day'] && {
        backgroundColor: theme.palette.secondary.light,
        color: theme.palette.error.contrastText,
      }),
    };
  }

  function tip() {
    if (!attendance) return '';
    const { checkIn, checkOut, status } = attendance;
    return (
      <>
        <Typography variant="caption">Status: {status}</Typography>
        {checkIn && (
          <>
            <br />
            <Typography variant="caption">
              Check In:{' '}
              {timeByUserShift(getJUser()!.shift, moment(checkIn)).format(
                timeFormate + ' z'
              )}
            </Typography>
          </>
        )}
        {checkOut && (
          <>
            <br />
            <Typography variant="caption">
              Check Out:{' '}
              {timeByUserShift(getJUser()!.shift, moment(checkOut)).format(
                timeFormate + ' z'
              )}
            </Typography>
          </>
        )}
      </>
    );
  }

  return (
    <Box
      sx={{
        textAlign: 'center',
        fontWeight: 'bold',
        minWidth: '40px',
        maxWidth: '70px',
        cursor: 'pointer',
        borderRadius: '5px',
        ...statusColor(),
        '&:hover': {
          //   backgroundColor: theme.palette.action.hover,
        },
      }}
    >
      <Tooltip title={tip()} arrow>
        <Typography>{label || status?.charAt(0).toUpperCase()}</Typography>
      </Tooltip>
    </Box>
  );
};

export default AttendanceStatusBox;
