import * as React from 'react';
import Box from '@mui/material/Box';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import { updateUser } from '../../services/authApi';
import { toast } from 'react-toastify';
import { iUser, UserRole } from '../../Interfaces/iUser';
import { Checkbox, ListItemText } from '@mui/material';

interface iProps {
  role: UserRole[];
  userId: string;
  onSuccess: (usr: iUser) => void;
}

export default function UserRoleSelect({ role, userId, onSuccess }: iProps) {
  const [userRole, setUserRole] = React.useState<UserRole[]>(role);
  const [menuOpen, setMenuOpen] = React.useState(false);
  const menuOpenRef = React.useRef(false);
  const pendingUserRef = React.useRef<iUser | null>(null);

  React.useEffect(() => {
    if (!menuOpen) {
      setUserRole(role);
    }
  }, [role, menuOpen]);

  const flushPendingToParent = React.useCallback(() => {
    if (pendingUserRef.current) {
      onSuccess(pendingUserRef.current);
      pendingUserRef.current = null;
    }
  }, [onSuccess]);

  const handleChange = async (event: SelectChangeEvent<UserRole[]>) => {
    const preRole = userRole;
    const raw = event.target.value;
    const newRole =
      typeof raw === 'string' ? (raw.split(',') as UserRole[]) : raw;
    try {
      setUserRole(newRole);
      const payload = { role: newRole };
      const { data } = await updateUser(userId, payload);
      const { user } = data;
      pendingUserRef.current = user;
      // Avoid onSuccess while the menu is open — parent grid updates remount the cell and close the list.
      if (!menuOpenRef.current) {
        flushPendingToParent();
      }
    } catch (error) {
      setUserRole(preRole);
      console.log(error);
      toast.error('failed to update');
    }
  };

  const handleOpen = () => {
    menuOpenRef.current = true;
    setMenuOpen(true);
  };

  const handleClose = (_event: React.SyntheticEvent) => {
    menuOpenRef.current = false;
    setMenuOpen(false);
    flushPendingToParent();
  };

  return (
    <Box sx={{ minWidth: 120 }}>
      <FormControl fullWidth>
        <Select<UserRole[]>
          sx={{
            boxShadow: 'none',
            '.MuiOutlinedInput-notchedOutline': { border: 0 },
          }}
          id='role-select'
          labelId='role-select-label'
          multiple
          open={menuOpen}
          onOpen={handleOpen}
          onClose={handleClose}
          value={userRole}
          renderValue={(selected) => selected.join(', ')}
          label="Role"
          onChange={handleChange}
          MenuProps={{
            disableAutoFocusItem: true,
          }}
        >
          {Object.values(UserRole).map((r) => {
            return (
              <MenuItem key={r} value={r}>
                <Checkbox checked={userRole.indexOf(r) > -1} />
                <ListItemText primary={r} />
              </MenuItem>
            )
          })}

        </Select>
      </FormControl>
    </Box>
  );
}
