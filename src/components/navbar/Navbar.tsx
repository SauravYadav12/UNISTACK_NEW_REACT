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
import { iAttendance, iUser } from '../../Interfaces/iUser';
import { logout } from '../../services/authApi';
import { getJUser } from '../../utils/utils';
import CheckInCheckOut from '../attendance/CheckInCheckOut';
import { dateByUserShift } from '../../utils/dateUtil';
import {
  EmployeeModule,
  HomeModule,
  ModuleGroup,
  moduleKey,
  SuperAdminModule,
} from '../../utils/accessControlUtil';

function Navbar({ sidebar, toggleSideBar }: any) {
  const [width, setWidth] = React.useState(drawerWidth);
  const navigate = useNavigate();
  const { myProfile, getMyProfile, isModuleAllowed } =
    useAuth();
  const user: iUser = JSON.parse(localStorage.getItem('user') || '{}');

  React.useEffect(() => {
    toggleSideBar ? setWidth(smallDrawerWidth) : setWidth(drawerWidth);
  }, [toggleSideBar]);

  const handleSidebar = () => {
    sidebar();
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

              {isModuleAllowed(
                moduleKey(
                  ModuleGroup['Presence & Leave'],
                  EmployeeModule.Leaves
                )
              ) && (
                <Button
                  key={'Leaves'}
                  onClick={() => navigate('/leaves')}
                  sx={{ my: 2, color: 'black', display: 'block' }}
                  className="nav-heading"
                >
                  {'Leaves'}
                </Button>
              )}
              <SuperAdminMenu />
            </Box>
            {isModuleAllowed(
              moduleKey(
                ModuleGroup['Presence & Leave'],
                EmployeeModule.Attendance
              )
            ) && (
              <Box sx={{ flexGrow: 0, marginRight: '20px' }}>
                <AttendancePopUp />
              </Box>
            )}
            <Box sx={{ flexGrow: 0, marginRight: '10px' }}>
              <Typography textAlign="center">
                Welcome, {user.firstName}{' '}
              </Typography>
            </Box>

            <Box sx={{ flexGrow: 0, marginLeft: '10px' }}>
              <UserMenu />
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
  const { isModuleAllowed } = useAuth();
  const options = [
    {
      title: 'My Attendance',
      route: '/attendance/my-attendance',
      group: ModuleGroup['Presence & Leave'],
      module: EmployeeModule.Attendance,
    },
    {
      title: 'Dashboard',
      route: '/attendance/dashboard',
      group: ModuleGroup['Super Admin Modules'],
      module: SuperAdminModule['Attendance Dashboard'],
    },
  ];
  const isAllowed = options.some((o) =>
    isModuleAllowed(moduleKey(o.group, o.module))
  );
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };

  if (!isAllowed) return null;
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
}

function AttendancePopUp() {
  const me = getJUser();
  const { myAttendanceState } = useAuth();
  if (!myAttendanceState || !me) return null;
  const { loading, error, attendance, setResults } = myAttendanceState;

  const dateState = React.useState(dateByUserShift(me.shift));

  function handleChange(att: iAttendance) {
    setResults((pre) => [...pre.filter((i) => i._id !== att._id), att]);
  }

  if (loading || error) return null;

  return (
    <CheckInCheckOut
      buttonSize="small"
      allowAutomaticPopUp
      user={me}
      date={dateState[0]}
      onChange={handleChange}
      attendance={attendance[0]}
    />
  );
}

function SuperAdminMenu() {
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
      title: 'Leaves Management',
      route: '/leaves-management',
      group: ModuleGroup['Super Admin Modules'],
      module: SuperAdminModule['Leaves Management'],
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
  };

  if (!isAllowed) return null;

  return (
    <>
      {
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
      }
    </>
  );
}

function UserMenu() {
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
  const { myProfile, validateLogout, isModuleAllowed } = useAuth();
  const [anchorElUser, setAnchorElUser] = React.useState<null | HTMLElement>(
    null
  );

  const handleOpenUserMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorElUser(event.currentTarget);
  };

  const handleCloseUserMenu = () => {
    setAnchorElUser(null);
  };

  return (
    <>
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
        <div
          onClick={async () => {
            validateLogout();
            navigate(`/`);
            await logout();
          }}
        >
          <MenuItem onClick={handleCloseUserMenu}>
            <Typography textAlign="center">Logout</Typography>
          </MenuItem>
        </div>
      </Menu>
    </>
  );
}
