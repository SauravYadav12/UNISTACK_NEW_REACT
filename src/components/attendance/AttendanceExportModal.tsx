import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  TextField,
  Box,
  CircularProgress,
} from '@mui/material';
import { mkConfig, generateCsv, download, ColumnHeader } from 'export-to-csv';
import { AttendanceStatus, iAttendance, iUser } from '../../Interfaces/iUser';
import { dateFormate, timeFormate } from '../constants';
import dayjs from 'dayjs';
import { useState } from 'react';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { getAttendance } from '../../services/attendanceApi';
import { toast } from 'react-toastify';
import moment from 'moment';
import { timeByUserShift } from '../../utils/dateUtil';
import { useAuth } from '../../AuthGaurd/AuthContextProvider';
interface iProps {
  filename?: string;
  open: boolean;
  users: iUser[];
  onOpen: () => void;
  onClose: () => void;
}

function AttendanceExportModal({
  open,
  users,
  filename = 'Employee attendance',
  onClose,
  onOpen,
}: iProps) {
  const { iUser: user } = useAuth();

  const columnHeaders: ColumnHeader[] = [
    { key: 'username', displayLabel: 'User Name' },
    { key: 'status', displayLabel: 'Status' },
    { key: 'date', displayLabel: 'Date' },
    { key: 'checkIn', displayLabel: 'Check In' },
    { key: 'checkOut', displayLabel: 'Check Out' },
  ];
  const csvConfig = mkConfig({
    useKeysAsHeaders: false,
    filename,
    columnHeaders,
    replaceUndefinedWith: '',
  });

  const year = new Date().getFullYear();
  const month = new Date().getMonth();
  const [dates, setDates] = useState({
    fromDate: dayjs(new Date(year, month, 1)).format(dateFormate),
    toDate: dayjs(new Date()).format(dateFormate),
  });
  const { fromDate, toDate } = dates;
  const isDatesValid = dayjs(fromDate).isValid() && dayjs(toDate).isValid();

  const [loading, setLoading] = useState<boolean>(false);

  const onDateChange = (key: 'fromDate' | 'toDate', newValue: string | null) => {
    newValue = newValue ? dayjs(newValue).format(dateFormate) : null;
    setDates((prevValues) => ({
      ...prevValues,
      [key]: newValue,
    }));
  };

  function formateAttendanceDataToExport(attendance: iAttendance[]) {
    const data: ExportData[] = [];
    for (const att of attendance) {
      const user = users.find((u) => u._id === att.userRef);
      const { checkIn, checkOut, status, date } = att;
      data.push({
        username: user && user.firstName + ' ' + user.lastName,
        status: status,
        date: dayjs(date).format(dateFormate),
        checkIn:
          checkIn &&
          timeByUserShift(user!.shift, moment(checkIn)).format(
            timeFormate + ' z'
          ),
        checkOut:
          checkOut &&
          timeByUserShift(user!.shift, moment(checkOut)).format(
            timeFormate + ' z'
          ),
      });
    }

    const sortedData = [...data].sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      return dateB - dateA;
    });

    const dataWithBlanks = [];

    let previousDate: string | null = null;
    for (const item of sortedData) {
      const currentDate = item.date;
      if (previousDate && currentDate !== previousDate) {
        dataWithBlanks.push({}, {});
      }
      dataWithBlanks.push(item);
      previousDate = currentDate;
    }

    return dataWithBlanks;
  }

  const handleDownloadClick = async () => {
    if (!isDatesValid || loading) return;
    setLoading(true);
    try {
      const { data } = await getAttendance(
        `fromDate=${fromDate}&toDate=${toDate}`
      );
      const csv = generateCsv(csvConfig)(
        formateAttendanceDataToExport(data.data || [])
      );
      download(csvConfig)(csv);
      onClose();
    } catch (error) {
      toast.error('failed to generate');
    } finally {
      setLoading(false);
    }
  };

  function DateInputs() {
    if (loading) {
      return (
        <Box height={'50px'} width={'400px'} className="loader" sx={{ py: 1 }}>
          <CircularProgress />
        </Box>
      );
    }
    return (
      <>
        <Grid
          item
          sx={{
            width: 190,
            mr: 1,
            '& .MuiOutlinedInput-root': {
              borderRadius: '10px',
            },
          }}
        >
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <DatePicker
              inputFormat={dateFormate}
              maxDate={toDate}
              label="From Date"
              value={fromDate ? dayjs(fromDate) : null}
              onChange={(newValue) => onDateChange('fromDate', newValue)}
              renderInput={(params) => (
                <TextField
                  size="small"
                  {...params}
                  error={!fromDate || !dayjs(fromDate).isValid()}
                />
              )}
            />
          </LocalizationProvider>
        </Grid>
        <Grid
          item
          sx={{
            width: 190,
            mr: 1,
            '& .MuiOutlinedInput-root': {
              borderRadius: '10px',
            },
          }}
        >
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <DatePicker
              inputFormat={dateFormate}
              minDate={fromDate}
              label="To Date"
              value={toDate ? dayjs(toDate) : null}
              onChange={(newValue) => onDateChange('toDate', newValue)}
              renderInput={(params) => (
                <TextField
                  size="small"
                  {...params}
                  error={!toDate || !dayjs(toDate).isValid()}
                />
              )}
            />
          </LocalizationProvider>
        </Grid>
      </>
    );
  }

  return (
    <>
      <Button variant="contained" color="primary" size="small" onClick={onOpen}>
        Export
      </Button>
      <Dialog open={open} onClose={onClose}>
        <DialogTitle>Export Attendance Data</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, py: 4 }}>
            <DateInputs />
          </Box>
          {!isDatesValid && (
            <p style={{ textAlign: 'center', color: 'red' }}>Invalid dates !</p>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
          <Button
            disabled={!isDatesValid || loading}
            variant="contained"
            color="primary"
            size="small"
            onClick={handleDownloadClick}
            sx={{
              borderRadius: '10px',
            }}
          >
            Download
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

export default AttendanceExportModal;

interface ExportData {
  username?: string;
  checkIn?: string;
  checkOut?: string;
  date: string;
  status: AttendanceStatus;
}
