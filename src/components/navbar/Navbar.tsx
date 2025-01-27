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
import { iUser } from '../../Interfaces/iUser';

const pages = ['Attendance', 'Leaves'];
const settings = ['Profile', 'Account', 'Dashboard', 'Logout'];

function Navbar({ sidebar, toggleSideBar }: any) {
  const [width, setWidth] = React.useState(drawerWidth);
  const navigate = useNavigate();
  const { myProfile, getMyProfile, validateLogout } = useAuth();
  const user: iUser = JSON.parse(localStorage.getItem('user') || '{}');

  React.useEffect(() => {
    toggleSideBar ? setWidth(smallDrawerWidth) : setWidth(drawerWidth);
  }, [toggleSideBar]);

  const [anchorElUser, setAnchorElUser] = React.useState<null | HTMLElement>(
    null
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
  };

  const handleSidebar = () => {
    sidebar();
  };

  const handleSetting = (setting: String) => {
    if (setting.toLowerCase() === 'logout') {
      validateLogout();
      navigate(`/`);
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
        <Container maxWidth="xl">
          <Toolbar disableGutters>
            <Typography component={'span'} onClick={handleSidebar}>
              <ListItemButton>
                <MenuIcon />
              </ListItemButton>
            </Typography>
            <Box sx={{ flexGrow: 1, display: { xs: 'none', md: 'flex' } }}>
              {pages.map((page) => (
                <Button
                  key={page}
                  onClick={() => {}}
                  sx={{ my: 2, color: 'black', display: 'block' }}
                  className="nav-heading"
                >
                  {page}
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

            {/* <Box sx={{ paddingTop: "8px" }}>
              <NotificationsNoneIcon />
            </Box> */}

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
