import * as React from 'react';
import Switch from '@mui/material/Switch';
import { updateUser } from '../../services/authApi';
import { createProfile } from '../../services/userProfileApi';
import { toast } from 'react-toastify';

export default function ActiveUserSwitch({
  active,
  userId,
  user,
  onChangeUser,
  setOpen,
  setAlertMessage,
}: any) {
  const [checked, setChecked] = React.useState(active);

  const handleChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const newActiveStatus = event.target.checked;
    setChecked(newActiveStatus);
    const payload = { active: newActiveStatus };
    try {
      const { data } = await updateUser(userId, payload);
      const { user } = data;
      onChangeUser(user);
      if (newActiveStatus) {
        try {
          const name = `${user.firstName} ${user.lastName}`;
          await createProfile(userId, user.email, name);
        } catch (error) {}
        setAlertMessage('User Activated successfully');
      } else {
        setAlertMessage('User Deactivated');
      }
      setOpen(true);
    } catch (error) {
      toast.error('Failed to update!');
      setChecked(!newActiveStatus);
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
