import React from 'react';
import { iUser, jUser, WorkLocation } from '../../Interfaces/iUser';
import {
  Box,
  FormControl,
  MenuItem,
  Select,
  SelectChangeEvent,
} from '@mui/material';
import { toast } from 'react-toastify';
import { updateUser } from '../../services/authApi';
interface iProps {
  location: WorkLocation;
  userId: string;
  onSuccess:(usr: jUser)=> void;
}
const UserWorkLocationSelect = ({
  location,
  userId,
  onSuccess
}: iProps) => {
  const workLocations: WorkLocation[] = [...Object.values(WorkLocation)];
  const [iLocation, setiLocation] = React.useState(location || '');

  const handleChange = async (event: SelectChangeEvent) => {
    const pre=iLocation
    const newLocation = event.target.value as WorkLocation;
    setiLocation(newLocation);
    const payload: Partial<iUser> = { workLocation: newLocation };
    try {
      const { data } = await updateUser(userId, payload);
      const { user } = data;
      onSuccess(user);
    } catch (error) {
      toast.error('Failed');
      setiLocation(pre);
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
          value={iLocation}
          label="Work Locations"
          onChange={handleChange}
        >
          {workLocations.map((s) => {
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
};

export default UserWorkLocationSelect;
