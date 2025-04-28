import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from '@mui/material';
import { toast } from 'react-toastify';
import { dateFormate } from '../constants';
import { AttendanceStatus, iAttendance, iUser } from '../../Interfaces/iUser';
import { markAttendance, updateAttendance } from '../../services/attendanceApi';
import { dateByUserShift, getAttendanceStatus } from '../../utils/dateUtil';
import { useAuth } from '../../AuthGaurd/AuthContextProvider';
export const autoOpenAttendanceModalKey =
  'automatically_open_mark_attendance_modal';

const MarkAttendanceModal = ({
  user,
  date,
  attendence,
  state,
  forAdmin = false,
  onCancel,
  onMark,
}: MarkAttendanceModalProps) => {
  const { iUser } = useAuth();
  const [open, setOpen] = state;
  const isUserHasSession = user._id === iUser?._id;
  async function onMarkAttendance() {
    let status = getAttendanceStatus(user);
    if (forAdmin && !status) {
      status = AttendanceStatus.Present;
    }
    if (!status) {
      toast.error('Inapplicable time');
      return;
    }
    try {
      const { data } = await (attendence
        ? updateAttendance(attendence._id, {
            status,
          })
        : markAttendance(user, date, status));
      onMark && data.data && onMark(data.data);
      toast.success('Attendance marked successfully');
      closeModal(false);
    } catch (error) {
      console.log(error);
    }
  }

  function closeModal(emitOnCancel = true) {
    setOpen(false);
    localStorage.removeItem(autoOpenAttendanceModalKey);
    emitOnCancel && onCancel && onCancel();
  }

  return (
    <>
      <Dialog
        open={open}
        onClose={() => closeModal()}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">
          {isUserHasSession
            ? 'Mark Your Attendance'
            : `${user.firstName + ' ' + user.lastName}`}
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            {isUserHasSession
              ? 'Start your day by quickly marking your attendance.'
              : `Mark Attendance for ${user.firstName + ' ' + user.lastName}`}
            <br />
            Date: {dateByUserShift(iUser!.shift).format(dateFormate)}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => closeModal()}>Close</Button>
          <Button onClick={onMarkAttendance} autoFocus>
            Mark Attendance
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default MarkAttendanceModal;

interface MarkAttendanceModalProps {
  user: iUser;
  date: string;
  state: [boolean, (s: boolean) => void];
  attendence?: iAttendance;
  forAdmin?: boolean;
  onMark?: (a: iAttendance) => void;
  onCancel?: () => void;
}
