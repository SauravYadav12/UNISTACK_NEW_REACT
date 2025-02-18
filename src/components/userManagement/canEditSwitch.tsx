import * as React from 'react';
import Switch from '@mui/material/Switch';
import { updateUser } from '../../services/authApi';
import { toast } from 'react-toastify';

export default function CanEditSwitch({
  active,
  userId,
  setOpen,
  setAlertMessage,
}: any) {
  const [checked, setChecked] = React.useState(active);

  const handleChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const status = event.target.checked;
      const payload = { canEdit: status };
      const { data } = await updateUser(userId, payload);
      const { user } = data;
      setChecked(!!user.canEdit);
      setOpen(true);
      if (user.canEdit) {
        setAlertMessage('Profile edit permission granted');
      } else {
        setAlertMessage('Profile edit permission revoked');
      }
    } catch (error) {
      console.log(error);
      toast.error('Failed to update!');
    }
  };

  return (
    <>
      <Switch
        checked={checked}
        onChange={handleChange}
        inputProps={{ 'aria-label': 'controlled' }}
      />
    </>
  );
}
