import { useMemo } from 'react';
import { Box, Typography, IconButton, Divider } from '@mui/material';
import { Close } from '@mui/icons-material';
import { Holiday } from '../../Interfaces/holiday';
import { useHoliday } from '../../contextProviders/HolidayContextProvider';
import { getDatesBetween } from '../../utils/dateUtil';
import moment from 'moment';
import { dateFormate2 } from '../constants';
import { deleteHoliday } from '../../services/holidayApi';
import { toast } from 'react-toastify';
import ChartCardWrapper from '../dashboard/ChartCardWrapper';
import { parseError } from '../../utils/utils';

const getUpcomingAndSortedHolidays = (holidays: Holiday[]): Holiday[] => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return holidays
    .filter((holiday) => new Date(holiday.fromDate) >= today)
    .sort(
      (a, b) => new Date(a.fromDate).getTime() - new Date(b.fromDate).getTime()
    );
};

interface iProps{
    forAdmin?:boolean
}

const UpcomingHolidays = ({forAdmin}:iProps) => {
  const { holidayState, removeHoliday } = useHoliday();
  const holidays = useMemo(
    () => getUpcomingAndSortedHolidays(holidayState.data || []),
    [holidayState.data]
  );

  const handleRemoveHoliday = async (id: string) => {
    try {
      await deleteHoliday(id);
      removeHoliday(id);
    } catch (error) {
     const errorMessage =parseError(error);
      toast.error(errorMessage);
    }
  };

  return (
    <ChartCardWrapper title=" Upcoming Holidays">
      <>
        <Divider />
        {holidays.length === 0 ? (
          <Typography
            variant="caption"
            sx={{
              textAlign: 'start',
            }}
          >
            No upcoming holidays!
          </Typography>
        ) : (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'flex-start',
              overflowX: 'auto',
            }}
          >
            {holidays.map((holiday) => {
              const totalDays = getDatesBetween(
                holiday.fromDate,
                holiday.toDate
              ).length;
              return (
                <Box
                  key={holiday._id}
                  columnGap={2}
                  rowGap={1}
                  sx={{
                    p: { xs: 1.5, sm: 2 },
                    mb: 1.5,
                    borderRadius: '12px',
                    transition: 'all 0.3s ease-in-out',
                    '&:hover': {
                      boxShadow: 1,
                    },
                    minWidth: '200px',
                  }}
                >
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      justifyContent: 'space-between',
                    }}
                  >
                    <Typography
                      variant="subtitle1"
                      sx={{
                        fontWeight: 'semi-bold',
                        color: '#1f2937',
                      }}
                    >
                      {holiday.name?.slice(0, 20) || 'NA'}
                      {holiday.name && holiday.name.length > 20 && '...'}
                    </Typography>
                   {forAdmin&& <IconButton
                      size="small"
                      aria-label={`remove ${holiday.name}`}
                      onClick={() => handleRemoveHoliday(holiday._id)}
                    >
                      <Close
                        style={{ width: '20px', height: '20px' }}
                        color="error"
                      />
                    </IconButton>}
                  </Box>
                  <Typography variant="body2" color={'gray'}>
                    {totalDays} day{totalDays > 1 && 's'}
                  </Typography>
                  <Typography variant="body2" color={'gray'}>
                    {moment(holiday.fromDate).format(dateFormate2)}{' '}
                    {totalDays > 1 && (
                      <>To {moment(holiday.toDate).format(dateFormate2)}</>
                    )}
                  </Typography>
                </Box>
              );
            })}
          </Box>
        )}
      </>
    </ChartCardWrapper>
  );
};

export default UpcomingHolidays;
