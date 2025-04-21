import { AttendanceStatus, iAttendance, jUser } from '../../Interfaces/iUser';
import { useTheme } from '@mui/material/styles';
import { Box, Popover, Stack, Tooltip, Typography } from '@mui/material';
import { getWorkingDuration, timeByUserShift } from '../../utils/dateUtil';
import { getJUser } from '../../utils/utils';
import { timeFormate } from '../constants';
import moment, { Moment } from 'moment';
import { useState } from 'react';
import SelectAttendanceStatus from './SelectAttendanceStatus';
import AttendanceTimePicker from './AttendanceTimePicker';
interface iProps {
  date: Moment;
  user: jUser;
  attendance?: iAttendance;
  label?: string;
  forEmployee?: boolean;
  onChange?: (attendance: iAttendance) => void;
}
const AttendanceStatusBox = ({
  attendance,
  forEmployee,
  date,
  user,
  label,
  onChange,
}: iProps) => {
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
  const open = Boolean(anchorEl);
  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };
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

        <br />
        <Typography variant="caption">
          Check In:{' '}
          {checkIn
            ? timeByUserShift(getJUser()!.shift, moment(checkIn)).format(
                timeFormate + ' z'
              )
            : 'NA'}
        </Typography>

        <br />
        <Typography variant="caption">
          Check Out:{' '}
          {checkOut
            ? timeByUserShift(getJUser()!.shift, moment(checkOut)).format(
                timeFormate + ' z'
              )
            : 'NA'}
        </Typography>

        <WorkingDuration attendance={attendance} />
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
        <Typography onClick={forEmployee ? undefined : handleClick}>
          {label || status?.charAt(0).toUpperCase()}
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
            <Box py={1} width={'100%'}>
              <SelectAttendanceStatus
                attendance={attendance}
                date={date}
                user={user}
                onChange={onChange}
              />
            </Box>

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
    </Box>
  );
};

export default AttendanceStatusBox;

interface WorkingDurationProps {
  attendance: iAttendance;
}

function WorkingDuration({ attendance }: WorkingDurationProps) {
  const { checkIn, checkOut } = attendance;

  return (
    <>
      {
        <>
          <br />
          <Typography variant="caption">
            Working duration:{' '}
            {checkOut && checkIn ? getWorkingDuration(checkIn, checkOut) : 'NA'}
          </Typography>
        </>
      }
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
  return (
    <Stack direction={'row'} display={'flex'} justifyContent={'center'}>
      <Typography
        variant="subtitle2"
        color="textSecondary"
        alignContent={'center'}
      >
        <span style={{ fontWeight: 'bold' }}> {label} </span>
        {attendance[field] && attendance.status !== AttendanceStatus.Absent
          ? timeByUserShift(
              getJUser()!.shift,
              moment(attendance[field])
            ).format(timeFormate + ' z')
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
