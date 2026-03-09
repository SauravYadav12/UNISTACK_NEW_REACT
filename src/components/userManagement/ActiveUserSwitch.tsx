import * as React from 'react';
import Switch from '@mui/material/Switch';
import { updateUser } from '../../services/authApi';
import { createProfile } from '../../services/userProfileApi';
import { toast } from 'react-toastify';
import { iUser } from '../../Interfaces/iUser';

interface iProps {
  active: boolean;
  userId: string;
  onSuccess: (usr: iUser) => void;
}
export default function ActiveUserSwitch({
  active,
  userId,
  onSuccess,
}: iProps) {
  const [checked, setChecked] = React.useState(active);

  const handleChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const newActiveStatus = event.target.checked;
    setChecked(newActiveStatus);
    const payload = { active: newActiveStatus };
    try {
      const { data } = await updateUser(userId, payload);
      const { user } = data;
      onSuccess(user);
      if (newActiveStatus) {
        try {
          const name = `${user.firstName} ${user.lastName}`;
          await createProfile(userId, user.email, name);
        } catch (error) {
          toast.error('Failed to create user profile!');
        }
      }
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
