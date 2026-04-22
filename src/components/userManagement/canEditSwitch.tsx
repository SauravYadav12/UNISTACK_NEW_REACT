import * as React from 'react';
import { Android12Switch as Switch } from '../../pages/Marketing/Profile/constants';
import { updateUser } from '../../services/authApi';
import { toast } from 'react-toastify';
import { iUser, UserRole } from '../../Interfaces/iUser';
import { Tooltip } from '@mui/material';

export default function CanEditSwitch({ canEdit, jUser, onSuccess }: iProps) {
  const [checked, setChecked] = React.useState(canEdit);

  const handleChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const status = event.target.checked;
    try {
      setChecked(!!status);
      const payload = { canEdit: status };
      const { data } = await updateUser(jUser._id, payload);
      const { user } = data;
      onSuccess(user);
    } catch (error) {
      setChecked(!status);
      console.log(error);
      toast.error('Failed to update!');
    }
  };
  const isSuperAdmin = jUser.role.includes(UserRole['super-admin']);
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

interface iProps {
  canEdit: boolean;
  jUser: iUser;
  onSuccess: (usr: iUser) => void;
}
