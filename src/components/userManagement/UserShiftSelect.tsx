import * as React from 'react';
import Box from '@mui/material/Box';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import { updateUser } from '../../services/authApi';
import { iUser, UserShift } from '../../Interfaces/iUser';
import { toast } from 'react-toastify';

interface iProps {
  shift: UserShift;
  userId: string;
  onSuccess: (usr: iUser) => void;
}

export default function UserShiftSelect({ shift, userId, onSuccess }: iProps) {
  const shifts: UserShift[] = [...Object.values(UserShift)];
  const [userShift, setUserShift] = React.useState(shift || '');

  const handleChange = async (event: SelectChangeEvent) => {
    const pre=userShift
    const newShift = event.target.value as UserShift;
    setUserShift(newShift);
    const payload = { shift: newShift };
    try {
      const { data } = await updateUser(userId, payload);
      const { user } = data;
      onSuccess(user);
    } catch (error) {
      setUserShift(pre);
      toast.error('Failed');
      console.log(error);
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
          value={userShift}
          label="Shift"
          onChange={handleChange}
        >
          {shifts.map((s) => {
            return (
              <MenuItem key={s} value={s}>
                {s}
              </MenuItem>
            );
          })}
        </Select>
      </FormControl>
    </Box>
  );
}
