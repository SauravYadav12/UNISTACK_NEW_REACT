import * as React from 'react';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import Menu from '@mui/material/Menu';
import MenuIcon from '@mui/icons-material/Menu';
import Container from '@mui/material/Container';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
import MenuItem from '@mui/material/MenuItem';
import { ListItemButton } from '@mui/material';
import { drawerWidth, smallDrawerWidth } from '../constants';
import './navbar.css';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../AuthGaurd/AuthContextProvider';
import { iUser, UserRole } from '../../Interfaces/iUser';
import { logout } from '../../services/authApi';
import { getJUser } from '../../utils/utils';

function Navbar({ sidebar, toggleSideBar }: any) {
  const settings = ['Profile', 'Account', 'Dashboard', 'Logout'];
  const pages = [{ title: 'Leaves', route: '/leaves' }];
  const [width, setWidth] = React.useState(drawerWidth);
  const navigate = useNavigate();
  const { myProfile, getMyProfile, validateLogout } = useAuth();
  const user: iUser = JSON.parse(localStorage.getItem('user') || '{}');

  const [anchorElUser, setAnchorElUser] = React.useState<null | HTMLElement>(
    null
  );
  const [anchorElAdmin, setAnchorElAdmin] = React.useState<null | HTMLElement>(
    null
  );
  const open = Boolean(anchorElAdmin);

  React.useEffect(() => {
    toggleSideBar ? setWidth(smallDrawerWidth) : setWidth(drawerWidth);
  }, [toggleSideBar]);

  const handleClickAdmin = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorElAdmin(event.currentTarget);
  };
  const handleCloseAdmin = () => {
    setAnchorElAdmin(null);
  };

  const handleSidebar = () => {
    sidebar();
  };

  const handleSetting = async (setting: String) => {
    if (setting.toLowerCase() === 'logout') {
      validateLogout();
      navigate(`/`);
      await logout();
    } else {
      navigate(`/${setting.toLowerCase()}`);
    }
  };

  const handleOpenUserMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorElUser(event.currentTarget);
  };

  const handleCloseUserMenu = () => {
    setAnchorElUser(null);
  };

  const handleUserManagement = () => {
    navigate('/user-management');
    handleCloseAdmin();
  };

  React.useEffect(() => {
    if (!myProfile) getMyProfile();
  }, []);

  return (
    <div>
      <AppBar
        sx={{
          width: { sm: `calc(100% - ${width}px)` },
          ml: { sm: `${width}px` },
        }}
        elevation={2}
        color="transparent"
        className="header"
      >
        <Container maxWidth="xl" style={{ background: '#ffffffde' }}>
          <Toolbar disableGutters>
            <Typography component={'span'} onClick={handleSidebar}>
              <ListItemButton>
                <MenuIcon />
              </ListItemButton>
            </Typography>
            <Box sx={{ flexGrow: 1, display: { xs: 'none', md: 'flex' } }}>
              <AttendenceMenu />

              {pages.map((page) => (
                <Button
                  key={page.title}
                  onClick={() => navigate(page.route)}
                  sx={{ my: 2, color: 'black', display: 'block' }}
                  className="nav-heading"
                >
                  {page.title}
                </Button>
              ))}
              {user.role === 'super-admin' && (
                <Box sx={{ flexGrow: 1, display: { xs: 'none', md: 'flex' } }}>
                  <Button
                    sx={{ my: 2, color: 'black', display: 'block' }}
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
                    <MenuItem onClick={handleUserManagement}>
                      User Management
                    </MenuItem>
                    <MenuItem onClick={handleCloseAdmin}>
                      Access Control
                    </MenuItem>
                    <MenuItem onClick={handleCloseAdmin}>
                      Leaves Management
                    </MenuItem>
                  </Menu>
                </Box>
              )}
            </Box>
            <Box sx={{ flexGrow: 0, marginRight: '10px' }}>
              <Typography textAlign="center">
                Welcome, {user.firstName}{' '}
              </Typography>
            </Box>

            <Box sx={{ flexGrow: 0, marginLeft: '10px' }}>
              <Tooltip title="Open settings">
                <IconButton onClick={handleOpenUserMenu} sx={{ p: 0 }}>
                  <Avatar alt="Remy Sharp" src={myProfile?.photo} />
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
                {settings.map((setting) => (
                  <div key={setting} onClick={() => handleSetting(setting)}>
                    <MenuItem onClick={handleCloseUserMenu}>
                      <Typography textAlign="center">{setting}</Typography>
                    </MenuItem>
                  </div>
                ))}
              </Menu>
            </Box>
          </Toolbar>
        </Container>
      </AppBar>
    </div>
  );
}
export default Navbar;

function AttendenceMenu() {
  const navigate = useNavigate();
  const options = [
    { title: 'My Attendance', route: '/attendance/my-attendance' },
    {
      title: 'Dashboard',
      route: '/attendance/dashboard',
      allow: [UserRole['super-admin'], UserRole.hr],
    },
  ];

  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };

  return (
    <>
      <Button
        id="attendance-button"
        aria-controls={open ? 'attendance-menu' : undefined}
        aria-haspopup="true"
        aria-expanded={open ? 'true' : undefined}
        sx={{ my: 2, color: 'black', display: 'block' }}
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
          const myRole = getJUser()?.role;
          if (o.allow&&(
            !myRole ||
            !o.allow?.includes(myRole) ||
            myRole !== UserRole['super-admin'])
          )
            return;
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
}


