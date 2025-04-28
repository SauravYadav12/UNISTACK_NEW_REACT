import { Button, Menu, MenuItem } from '@mui/material';
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../AuthGaurd/AuthContextProvider';
import { UserRole } from '../../Interfaces/iUser';
import {
  ModuleGroup,
  EmployeeModule,
  SuperAdminModule,
  moduleKey,
} from '../../utils/accessControlUtil';
interface iProps {
  onClose?: () => void;
}
const AttendenceMenu = ({ onClose }: iProps) => {
  const navigate = useNavigate();
  const { isModuleAllowed, iUser: me } = useAuth();
  const options = [
    {
      title: 'My Attendance',
      route: '/attendance/my-attendance',
      group: ModuleGroup['Presence & Leave'],
      module: EmployeeModule.Attendance,
      allow: () => {
        return me?.role !== UserRole['super-admin'];
      },
    },
    {
      title: 'Dashboard',
      route: '/attendance/dashboard',
      group: ModuleGroup['Super Admin Modules'],
      module: SuperAdminModule['Attendance Dashboard'],
    },
  ];
  const isAllowed = options.some((o) => {
    if (o.allow && !o.allow()) return false;
    return isModuleAllowed(moduleKey(o.group, o.module));
  });
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
    onClose?.();
  };

  if (!isAllowed) return null;
  return (
    <>
      <Button
        id="attendance-button"
        aria-controls={open ? 'attendance-menu' : undefined}
        aria-haspopup="true"
        aria-expanded={open ? 'true' : undefined}
        sx={{ color: 'black', display: 'block' }}
        className="nav-heading"
        onClick={handleClick}
      >
        Attendance
      </Button>
      <Menu
        id="attendance-menu"
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        MenuListProps={{
          'aria-labelledby': 'attendance-button',
        }}
      >
        {options.map((o, i) => {
          if (o.allow && !o.allow()) return;
          if (!isModuleAllowed(moduleKey(o.group, o.module))) return;
          return (
            <MenuItem
              key={i}
              onClick={() => {
                handleClose();
                navigate(o.route);
              }}
            >
              {o.title}
            </MenuItem>
          );
        })}
      </Menu>
    </>
  );
};

export default AttendenceMenu;
