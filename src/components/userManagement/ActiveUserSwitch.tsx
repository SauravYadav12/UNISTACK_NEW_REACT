import * as React from 'react';
import Switch from '@mui/material/Switch';
import { updateUser } from '../../services/authApi';
import { createProfile } from '../../services/userProfileApi';

export default function ActiveUserSwitch({
  active,
  userId,
  user,
  setOpen,
  setAlertMessage,
}: any) {
  const [checked, setChecked] = React.useState(active);

  const handleChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const newActiveStatus = event.target.checked;
    setChecked(newActiveStatus);
    const payload = { active: newActiveStatus };
    const response: any = await updateUser(userId, payload);
    if (response.status === 200) {
      if (newActiveStatus) {
        try {
          const name = `${user.firstName} ${user.lastName}`;
          await createProfile(userId, user.email, name);
        } catch (error) {
          console.log(error);
        }
        setAlertMessage('User Activated successfully');
      } else {
        setAlertMessage('User Deactivated');
      }
      setOpen(true);
    }
    console.log('response', response);
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
