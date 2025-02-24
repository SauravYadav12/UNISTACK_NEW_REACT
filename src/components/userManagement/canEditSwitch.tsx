import * as React from 'react';
import Switch from '@mui/material/Switch';
import { updateUser } from '../../services/authApi';
import { toast } from 'react-toastify';
import { iUser } from '../../Interfaces/iUser';
import { Tooltip } from '@mui/material';

export default function CanEditSwitch({
  active,
  iUser,
  setOpen,
  setAlertMessage,
}: CanEditSwitchProps) {
  const [checked, setChecked] = React.useState(active);

  const handleChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const status = event.target.checked;
      const payload = { canEdit: status };
      const { data } = await updateUser(iUser.id, payload);
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
  const disabled = iUser.role === 'super-admin';
  return (
    <>
      <Tooltip
        title={disabled ? 'Change role from super-admin to edit' : ''}
      >
        <span>
          <Switch
            disabled={disabled}
            checked={checked}
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
  iUser: iUser;
  setOpen: (s: boolean) => void;
  setAlertMessage: (m: string) => void;
}
