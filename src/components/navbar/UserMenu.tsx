import {
  Tooltip,
  IconButton,
  Avatar,
  Menu,
  MenuItem,
  Typography,
} from '@mui/material';
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../AuthGaurd/AuthContextProvider';
import { logout } from '../../services/authApi';
import {
  ModuleGroup,
  HomeModule,
  moduleKey,
} from '../../utils/accessControlUtil';

const UserMenu = () => {
  const navigate = useNavigate();
  const options = [
    {
      title: 'Profile',
      route: '/profile',
      group: ModuleGroup.Home,
      module: HomeModule.Profile,
    },
    {
      title: 'Dashboard',
      route: '/dashboard',
      group: ModuleGroup.Home,
      module: HomeModule.Dashboard,
    },
  ];
  const { myProfileState, validateLogout, isModuleAllowed } = useAuth();
  const [anchorElUser, setAnchorElUser] = React.useState<null | HTMLElement>(
    null
  );

  const handleOpenUserMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorElUser(event.currentTarget);
  };

  const handleCloseUserMenu = () => {
    setAnchorElUser(null);
  };

  async function handleLogOut() {
    try {
      logout();
    } catch (error) {
      console.log(error);
    }
    validateLogout();
    navigate(`/`);
  }

  return (
    <>
      <Tooltip title="Open settings">
        <IconButton onClick={handleOpenUserMenu} sx={{ p: 0 }}>
          <Avatar alt="Remy Sharp" src={myProfileState?.data?.photo} />
        </IconButton>
      </Tooltip>
      <Menu
        sx={{ mt: '45px' }}
        id="menu-appbar"
        anchorEl={anchorElUser}
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        keepMounted
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        open={Boolean(anchorElUser)}
        onClose={handleCloseUserMenu}
      >
        {options.map((o) => {
          if (!isModuleAllowed(moduleKey(o.group, o.module))) return;
          return (
            <div key={o.route} onClick={() => navigate(o.route)}>
              <MenuItem onClick={handleCloseUserMenu}>
                <Typography textAlign="center">{o.title}</Typography>
              </MenuItem>
            </div>
          );
        })}
        <div onClick={handleLogOut}>
          <MenuItem onClick={handleCloseUserMenu}>
            <Typography textAlign="center">Logout</Typography>
          </MenuItem>
        </div>
      </Menu>
    </>
  );
};

export default UserMenu;
