import { AttendanceStatus, iAttendance, iUser } from '../../Interfaces/iUser';
import {
  Box,
  CircularProgress,
  IconButton,
  Popover,
  Stack,
  styled,
  Tooltip,
  Typography,
} from '@mui/material';
import DeleteOutlineOutlined from '@mui/icons-material/DeleteOutlineOutlined';
import { getWorkingDuration, timeByUserShift } from '../../utils/dateUtil';
import { dateFormate, timeFormate } from '../constants';
import moment, { Moment } from 'moment';
import { useState } from 'react';
import { toast } from 'react-toastify';
import SelectAttendanceStatus from './SelectAttendanceStatus';
import { deleteAttendance } from '../../services/attendanceApi';
import AttendanceTimePicker from './AttendanceTimePicker';
import { useAuth } from '../../AuthGaurd/AuthContextProvider';
import {
  getStatusShortForm,
  holidaysForUserShift,
  HolidayStatus,
  iHolidayStatus,
  isHolidayMarked,
} from '../../utils/holidayUtil';
import { useHoliday } from '../../contextProviders/HolidayContextProvider';
interface iProps {
  date: Moment;
  user: iUser;
  attendance?: iAttendance;
  label?: string;
  forEmployee?: boolean;
  onChange?: (attendance: iAttendance) => void;
  onAttendanceDeleted?: (attendanceId: string) => void;
}

export const StatusBox = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'status',
})<{ status?: AttendanceStatus | iHolidayStatus }>(({ theme, status }) => ({
  textAlign: 'center',
  fontWeight: 'bold',
  minWidth: '40px',
  maxWidth: '70px',
  cursor: 'pointer',
  borderRadius: '5px',
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
  ...(status === HolidayStatus && {
    backgroundColor: theme.palette.info.light,
    color: theme.palette.error.contrastText,
  }),
}));

const AttendanceStatusBox = ({
  attendance,
  forEmployee,
  date,
  user,
  label,
  onChange,
  onAttendanceDeleted,
}: iProps) => {
  const { iUser } = useAuth();
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
  const [deleting, setDeleting] = useState(false);
  const open = Boolean(anchorEl);
  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const { holidayState } = useHoliday();

  // Filter the holiday list to those that apply to THIS cell's user. An
  // India-shift employee no longer sees US holidays on their attendance
  // grid, and vice versa. Org-wide ("ALL") holidays continue to show for
  // everyone. Legacy rows without a country are treated as "ALL".
  const relevantHolidays = holidaysForUserShift(
    holidayState.data || [],
    user.shift,
  );
  const isHoliday = isHolidayMarked(
    relevantHolidays,
    date.format(dateFormate),
  );

  const status = getStatus();

  function getStatus() {
    if (
      isHoliday &&
      (!attendance || attendance.status === AttendanceStatus.Absent)
    ) {
      return HolidayStatus;
    }
    return attendance?.status;
  }

  async function handleClearAttendance() {
    if (!attendance?._id || deleting) return;
    setDeleting(true);
    try {
      await deleteAttendance(attendance._id);
      onAttendanceDeleted?.(attendance._id);
      setAnchorEl(null);
      toast.success('Attendance cleared');
    } catch (e) {
      console.error(e);
      toast.error('Failed to clear attendance');
    } finally {
      setDeleting(false);
    }
  }

  function tip() {
    if (!status) return null;
    return (
      <>
        <Typography variant="caption">Status: {status}</Typography>

        {status === 'Holiday' ? (
          <>
            <br />
            <Typography variant="caption">
              Title: {isHoliday?.name || 'NA'}
            </Typography>
            <br />
            <Typography variant="caption">
              Description: {isHoliday?.description || 'NA'}
            </Typography>
          </>
        ) : (
          attendance && (
            <>
              <br />
              <Typography variant="caption">
                Check In:{' '}
                {attendance.checkIn
                  ? timeByUserShift(
                      iUser!.shift,
                      moment(attendance.checkIn)
                    ).format(timeFormate + ' z')
                  : 'NA'}
              </Typography>

              <br />
              <Typography variant="caption">
                Check Out:{' '}
                {attendance.checkOut
                  ? timeByUserShift(
                      iUser!.shift,
                      moment(attendance.checkOut)
                    ).format(timeFormate + ' z')
                  : 'NA'}
              </Typography>

              <WorkingDuration attendance={attendance} />
            </>
          )
        )}
      </>
    );
  }

  return (
    <StatusBox status={status}>
      <Tooltip title={tip()} arrow>
        <Typography onClick={forEmployee ? undefined : handleClick}>
          {label || (status && getStatusShortForm(status))}
        </Typography>
      </Tooltip>
      {!forEmployee && (
        <Popover
          open={open}
          anchorEl={anchorEl}
          onClose={() => setAnchorEl(null)}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'left',
          }}
          transformOrigin={{
            vertical: 'top',
            horizontal: 'left',
          }}
        >
          <Box p={2}>
            <Stack
              direction="row"
              alignItems="center"
              spacing={0.5}
              sx={{ py: 1, width: '100%' }}
            >
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <SelectAttendanceStatus
                  attendance={attendance}
                  date={date}
                  user={user}
                  onChange={onChange}
                />
              </Box>
              {attendance && onAttendanceDeleted && (
                <Tooltip title="Clear attendance">
                  <span>
                    <IconButton
                      size="small"
                      color="error"
                      disabled={deleting}
                      onClick={() => void handleClearAttendance()}
                      aria-label="Clear attendance"
                    >
                      {deleting ? (
                        <CircularProgress color="inherit" size={18} />
                      ) : (
                        <DeleteOutlineOutlined fontSize="small" />
                      )}
                    </IconButton>
                  </span>
                </Tooltip>
              )}
            </Stack>

            {attendance && (
              <>
                <Box width={'fit-content'}>
                  <MyTimePicker
                    field="checkIn"
                    attendance={attendance}
                    onChange={onChange}
                    label="IN :"
                  />
                </Box>
                <Box width={'fit-content'}>
                  <MyTimePicker
                    field="checkOut"
                    attendance={attendance}
                    onChange={onChange}
                    label="OUT :"
                  />
                </Box>
              </>
            )}
          </Box>
        </Popover>
      )}
    </StatusBox>
  );
};

export default AttendanceStatusBox;

interface WorkingDurationProps {
  attendance: iAttendance;
}

function WorkingDuration({ attendance }: WorkingDurationProps) {
  const { checkIn, checkOut } = attendance;
  const { iUser } = useAuth();

  return (
    <>
      <br />
      <Typography variant="caption">
        Working duration:{' '}
        {checkOut && checkIn && iUser
          ? getWorkingDuration(checkIn, checkOut, iUser.shift)
          : 'NA'}
      </Typography>
    </>
  );
}

interface MyTimePickerProp {
  attendance: iAttendance;
  field: 'checkIn' | 'checkOut';
  label?: string;
  onChange?: (att: iAttendance) => void;
}

export function MyTimePicker({
  field,
  attendance,
  label,
  onChange,
}: MyTimePickerProp) {
  const { iUser } = useAuth();
  return (
    <Stack direction={'row'} display={'flex'} justifyContent={'center'}>
      <Typography
        variant="subtitle2"
        color="textSecondary"
        alignContent={'center'}
      >
        <span style={{ fontWeight: 'bold' }}> {label} </span>
        {attendance[field] && attendance.status !== AttendanceStatus.Absent
          ? timeByUserShift(iUser!.shift, moment(attendance[field])).format(
              timeFormate + ' z'
            )
          : 'NA'}
      </Typography>
      {onChange && (
        <AttendanceTimePicker
          attendance={attendance}
          onChange={onChange}
          field={field}
        />
      )}
    </Stack>
  );
}
