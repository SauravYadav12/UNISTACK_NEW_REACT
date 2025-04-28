import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
} from '@mui/material';
import { toast } from 'react-toastify';
import { dateFormate, timeFormate } from '../constants';
import { iAttendance } from '../../Interfaces/iUser';
import { updateAttendance } from '../../services/attendanceApi';
import { dateByUserShift } from '../../utils/dateUtil';
import { useAuth } from '../../AuthGaurd/AuthContextProvider';
import { useNavigate } from 'react-router-dom';
import { logout } from '../../services/authApi';

const MarkCheckoutTimeModal = ({
  state,
  attendence,
  onMark,
}: MarkCheckoutTimeModalProps) => {
  const navigate = useNavigate();
  const [open, setOpen] = state;
  const { validateLogout, iUser } = useAuth();
  async function onMarkCheckoutTime() {
    try {
      const { data } = await updateAttendance(attendence._id, {
        checkOut: new Date().toUTCString(),
      });
      onMark && data.data && onMark(data.data);
      toast.success('Check-out time marked successfully');
      closeModal();
    } catch (error) {
      console.log(error);
    }
  }

  async function closeModal() {
    setOpen(false);
    if (iUser?._id === attendence.userRef) {
      validateLogout();
      navigate(`/`);
      try {
        await logout();
      } catch (error) {
        console.log(error);
      }
    }
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
          Mark Your Check-out time
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            Please mark your checkout time to complete your workday.
            <br />
            Date:{' '}
            {dateByUserShift(iUser!.shift).format(
              dateFormate + ' ' + timeFormate + ' z'
            )}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => closeModal()}>Close</Button>
          <Button onClick={onMarkCheckoutTime} autoFocus>
            Mark Check-out time
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default MarkCheckoutTimeModal;

interface MarkCheckoutTimeModalProps {
  attendence: iAttendance;
  state: [boolean, (s: boolean) => void];
  onMark?: (a: iAttendance) => void;
}
