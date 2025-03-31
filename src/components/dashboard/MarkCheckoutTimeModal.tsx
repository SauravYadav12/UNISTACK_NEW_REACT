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
import { getJUser } from '../../utils/utils';

const MarkCheckoutTimeModal = ({
  state,
  attendence,
  onCancel,
  onMark,
}: MarkCheckoutTimeModalProps) => {
  const [open, setOpen] = state;

  async function onMarkCheckoutTime() {
    try {
      const { data } = await updateAttendance(attendence._id, {
        checkOut: new Date().toUTCString(),
      });
      onMark && data.data && onMark(data.data);
      toast.success('Check-out time marked successfully');
      closeModal(false);
    } catch (error) {
      console.log(error);
    }
  }

  function closeModal(emitOnCancel = true) {
    setOpen(false);
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
          Mark Your Check-out time
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            Please mark your checkout time to complete your workday.
            <br />
            Date:{' '}
            {dateByUserShift(getJUser()!.shift).format(
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
  onCancel?: () => void;
}
