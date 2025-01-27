import * as React from 'react';
import Box from '@mui/material/Box';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import { updateUser } from '../../services/authApi';

export default function BasicSelect({
  setRole,
  userId,
  setAlertMessage,
  setOpen,
}: any) {
  const [userRole, setUserRole] = React.useState(setRole);

  const handleChange = async (event: SelectChangeEvent) => {
    const newRole = event.target.value as string;
    setUserRole(newRole);
    const payload = { role: newRole };
    const response: any = await updateUser(userId, payload);
    console.log('roleUpdateresponse', response.data);
    if (response.status === 200) {
      setAlertMessage(`Role updated to ${newRole}`);
      setOpen(true);
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
        </Select>
      </FormControl>
    </Box>
  );
}
