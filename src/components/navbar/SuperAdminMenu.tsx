import { Box, Button, Menu, MenuItem } from '@mui/material';
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../AuthGaurd/AuthContextProvider';
import {
  ModuleGroup,
  SuperAdminModule,
  moduleKey,
} from '../../utils/accessControlUtil';
interface iProps {
  onClose?: () => void;
}
const SuperAdminMenu = ({ onClose }: iProps) => {
  const navigate = useNavigate();
  const { isModuleAllowed } = useAuth();
  const pages = [
    {
      title: 'User Management',
      route: '/user-management',
      group: ModuleGroup['Super Admin Modules'],
      module: SuperAdminModule['User Management'],
    },
    {
      title: 'Access Control',
      route: '/access-control',
      group: ModuleGroup['Super Admin Modules'],
      module: SuperAdminModule['Access Control'],
    },
    {
      title: 'Salary Management',
      route: '/salary',
      group: ModuleGroup['Super Admin Modules'],
      module: SuperAdminModule['SalaryManagement'],
    },
  ];
  const isAllowed = pages.some((o) =>
    isModuleAllowed(moduleKey(o.group, o.module))
  );
  const [anchorElAdmin, setAnchorElAdmin] = React.useState<null | HTMLElement>(
    null
  );
  const open = Boolean(anchorElAdmin);
  const handleClickAdmin = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorElAdmin(event.currentTarget);
  };
  const handleCloseAdmin = () => {
    setAnchorElAdmin(null);
    onClose?.();
  };

  if (!isAllowed) return null;

  return (
    <>
      <Box sx={{ flexGrow: 1, display: 'flex' }}>
        <Button
          sx={{ color: 'black', display: 'block' }}
          className="nav-heading"
          onClick={handleClickAdmin}
        >
          Super-Admin
        </Button>
        <Menu
          id="basic-menu"
          anchorEl={anchorElAdmin}
          open={open}
          onClose={handleCloseAdmin}
          MenuListProps={{
            'aria-labelledby': 'basic-button',
          }}
        >
          {pages.map((item, i) => {
            if (!isModuleAllowed(moduleKey(item.group, item.module))) return;
            return (
              <MenuItem
                key={i}
                onClick={() => {
                  item.route && navigate(item.route);
                  handleCloseAdmin();
                }}
              >
                {item.title}
              </MenuItem>
            );
          })}
        </Menu>
      </Box>
    </>
  );
};

export default SuperAdminMenu;
