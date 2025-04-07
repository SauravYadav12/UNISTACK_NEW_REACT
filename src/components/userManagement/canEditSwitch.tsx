import * as React from 'react';
import Switch from '@mui/material/Switch';
import { updateUser } from '../../services/authApi';
import { toast } from 'react-toastify';
import { iUser, jUser } from '../../Interfaces/iUser';
import { Tooltip } from '@mui/material';

export default function CanEditSwitch({
  active,
  iUser,
  setOpen,
  onChangeUser,
  setAlertMessage,
}: CanEditSwitchProps) {
  const [checked, setChecked] = React.useState(active);

  const handleChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const status = event.target.checked;
    try {
      setChecked(!!status);
      const payload = { canEdit: status };
      const { data } = await updateUser(iUser._id, payload);
      const { user } = data;
      setOpen(true);
      onChangeUser(user);
      if (user.canEdit) {
        setAlertMessage('Profile edit permission granted');
      } else {
        setAlertMessage('Profile edit permission revoked');
      }
    } catch (error) {
      setChecked(!status);
      console.log(error);
      toast.error('Failed to update!');
    }
  };
  const isSuperAdmin = iUser.role === 'super-admin';
  return (
    <>
      <Tooltip
        title={isSuperAdmin ? 'Change role from super-admin to edit' : ''}
      >
        <span>
          <Switch
            disabled={isSuperAdmin}
            checked={isSuperAdmin ? true : checked}
            onChange={handleChange}
            inputProps={{ 'aria-label': 'controlled' }}
          />
        </span>
      </Tooltip>
    </>
  );
}

interface CanEditSwitchProps {
  active: boolean;
  iUser: Omit<iUser, 'id'> & {
    _id: string;
  };
  onChangeUser(usr: jUser): void;

  setOpen: (s: boolean) => void;
  setAlertMessage: (m: string) => void;
}
