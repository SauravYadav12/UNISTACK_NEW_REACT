import * as React from 'react';
import Box from '@mui/material/Box';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import { updateUser } from '../../services/authApi';
import { toast } from 'react-toastify';
import { iUser, UserRole } from '../../Interfaces/iUser';

interface iProps {
  role: UserRole;
  userId: string;
  onSuccess: (usr: iUser) => void;
}

export default function UserRoleSelect({ role, userId, onSuccess }: iProps) {
  const [userRole, setUserRole] = React.useState(role);

  const handleChange = async (event: SelectChangeEvent) => {
    const preRole = userRole;
    const newRole = event.target.value as UserRole;
    try {
      setUserRole(newRole);
      const payload = { role: newRole };
      const { data } = await updateUser(userId, payload);
      const { user } = data;
      onSuccess(user);
    } catch (error) {
      setUserRole(preRole);
      console.log(error);
      toast.error('failed to update');
    }
  };
  return (
    <Box sx={{ minWidth: 120 }}>
      <FormControl fullWidth>
        <Select
          sx={{
            boxShadow: 'none',
            '.MuiOutlinedInput-notchedOutline': { border: 0 },
          }}
          value={userRole}
          label="Role"
          onChange={handleChange}
        >
          <MenuItem value="user">user</MenuItem>
          <MenuItem value="admin">admin</MenuItem>
          <MenuItem value="super-admin">super-admin</MenuItem>
          <MenuItem value="support">support</MenuItem>
          <MenuItem value="marketing">marketing</MenuItem>
          <MenuItem value="hr">hr</MenuItem>
        </Select>
      </FormControl>
    </Box>
  );
}
