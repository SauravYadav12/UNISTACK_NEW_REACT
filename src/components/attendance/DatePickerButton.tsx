import { InsertInvitation } from '@mui/icons-material';
import { Box, IconButton, Popover, styled, TextField } from '@mui/material';
import {
  LocalizationProvider,
  PickersDay,
  PickersDayProps,
  StaticDatePicker,
} from '@mui/x-date-pickers';
import { AdapterMoment } from '@mui/x-date-pickers/AdapterMoment';
import moment from 'moment';
import { Moment } from 'moment';
import React, { useState } from 'react';
import { AttendanceTableType } from '../../pages/Attendance/AttendanceDashboard';
import { dateByUserShift } from '../../utils/dateUtil';
import { useAuth } from '../../AuthGaurd/AuthContextProvider';

interface iProps {
  dateState: [Moment, React.Dispatch<React.SetStateAction<Moment>>];
  tableType: AttendanceTableType;
}
const DatePickerButton = ({ dateState, tableType }: iProps) => {
  const usr = useAuth().iUser!;
  const [currentDate, setCurrentDate] = dateState;
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
  const open = Boolean(anchorEl);
  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const renderWeekPickerDay = (
    date: moment.Moment,
    selectedDates: Array<moment.Moment | null>,
    pickersDayProps: PickersDayProps<moment.Moment>
  ) => {
    if (!currentDate) {
      return <PickersDay {...pickersDayProps} />;
    }

    const start = currentDate.clone().startOf('week');
    const end = currentDate.clone().endOf('week');

    const dayIsBetween = date.isBetween(start, end, 'day', '[]');
    const isFirstDay = date.isSame(start, 'day');
    const isLastDay = date.isSame(end, 'day');

    return (
      <CustomPickersDay
        {...pickersDayProps}
        disableMargin
        dayIsBetween={dayIsBetween}
        isFirstDay={isFirstDay}
        isLastDay={isLastDay}
      />
    );
  };
  function handleChange(
    value: moment.Moment | null,
    keyboardInputValue?: string
  ) {
    if (!value) return;
    if (tableType === AttendanceTableType.Weekly) {
      value = value.clone().startOf('week');
    } else if (tableType === AttendanceTableType.Monthly) {
      value = value.clone().startOf('month');
    }
    setCurrentDate(value);
    setAnchorEl(null);
  }
  if (!usr) return null;
  return (
    <Box>
      <IconButton onClick={handleClick} aria-label="change date">
        <InsertInvitation sx={{ width: '18px', height: '18px' }} />
      </IconButton>
      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={() => setAnchorEl(null)}
      >
        <LocalizationProvider dateAdapter={AdapterMoment}>
          <StaticDatePicker
            displayStaticWrapperAs="desktop"
            value={currentDate}
            onChange={handleChange}
            renderInput={(params) => <TextField {...params} />}
            maxDate={dateByUserShift(usr.shift)}
            {...(tableType === AttendanceTableType.Weekly && {
              renderDay: renderWeekPickerDay,
            })}
            {...(tableType === AttendanceTableType.Monthly && {
              openTo: 'month',
              views: ['year', 'month'],
            })}
          />
        </LocalizationProvider>
      </Popover>
    </Box>
  );
};

export default DatePickerButton;

interface CustomPickerDayProps extends PickersDayProps<moment.Moment> {
  dayIsBetween: boolean;
  isFirstDay: boolean;
  isLastDay: boolean;
}

const CustomPickersDay = styled(PickersDay, {
  shouldForwardProp: (prop) =>
    prop !== 'dayIsBetween' && prop !== 'isFirstDay' && prop !== 'isLastDay',
})<CustomPickerDayProps>(({ theme, dayIsBetween, isFirstDay, isLastDay }) => ({
  ...(dayIsBetween && {
    borderRadius: 0,
    backgroundColor: theme.palette.primary.main,
    color: theme.palette.common.white,
    '&:hover, &:focus': {
      backgroundColor: theme.palette.primary.dark,
    },
  }),
  ...(isFirstDay && {
    borderTopLeftRadius: '50%',
    borderBottomLeftRadius: '50%',
  }),
  ...(isLastDay && {
    borderTopRightRadius: '50%',
    borderBottomRightRadius: '50%',
  }),
})) as React.ComponentType<CustomPickerDayProps>;
