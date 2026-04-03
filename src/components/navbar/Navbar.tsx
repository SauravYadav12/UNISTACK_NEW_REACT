import * as React from 'react';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import MenuIcon from '@mui/icons-material/Menu';
import Container from '@mui/material/Container';
import Button from '@mui/material/Button';
import { ListItemButton, Popover } from '@mui/material';
import { drawerWidth, smallDrawerWidth } from '../constants';
import './navbar.css';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../AuthGaurd/AuthContextProvider';
import {
  EmployeeModule,
  ModuleGroup,
  moduleKey,
} from '../../utils/accessControlUtil';
import { useMediaQuery, useTheme } from '@mui/material';
import AttendenceMenu from './AttendenceMenu';
import AttendancePopUp from './AttendancePopUp';
import SuperAdminMenu from './SuperAdminMenu';
import UserMenu from './UserMenu';
import { UserRole } from '../../Interfaces/iUser';

interface iProps {
  sidebar: () => void;
  toggleSideBar: boolean;
}


function Navbar({ sidebar, toggleSideBar }: iProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [width, setWidth] = React.useState(drawerWidth);
  const { iUser: user } = useAuth();

  React.useEffect(() => {
    toggleSideBar ? setWidth(smallDrawerWidth) : setWidth(drawerWidth);
  }, [toggleSideBar]);

  const handleSidebar = () => {
    sidebar();
  };

  return (
    <div>
      <AppBar
        sx={{
          width: `calc(100% - ${width}px)`,
          ml: `${width}px`,
        }}
        elevation={2}
        color="transparent"
        className="header"
      >
        <Container
          sx={{ maxWidth: '100% !important' }}
          style={{ background: '#ffffffde' }}
        >
          <Toolbar disableGutters>
            {isMobile ? (
              <MobileMenu />
            ) : (
              <>
                <Typography component={'span'} onClick={handleSidebar}>
                  <ListItemButton>
                    <MenuIcon />
                  </ListItemButton>
                </Typography>
                <Box sx={{ flexGrow: 1 }}>
                  <Box sx={{ display: 'flex' }}>
                    <AttendenceMenu />
                    <LeavesButton />
                    <SuperAdminMenu />
                  </Box>
                </Box>
                <AttendancePopUp />
              </>
            )}
            <Box sx={{ flexGrow: 0, marginRight: '10px' }}>
              <Typography textAlign="center">
                Welcome, {user?.firstName}
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
interface LeavesButtonProp {
  onClick?: () => void;
}
function LeavesButton({ onClick }: LeavesButtonProp) {
  const navigate = useNavigate();
  const { isModuleAllowed, iUser } = useAuth();

  if (
    !isModuleAllowed(
      moduleKey(ModuleGroup['Presence & Leave'], EmployeeModule.Leaves)
    )
  ) {
    return null;
  }

  return (
    <Button
      key={'Leaves'}
      onClick={() => {
        navigate(iUser?.role.includes(UserRole['super-admin']) ? '/leaves-management' : '/leaves');
        onClick?.();
      }}
      sx={{ color: 'black', display: 'block' }}
      className="nav-heading"
    >
      Leaves
    </Button>
  );
}

function MobileMenu() {
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
      <ListItemButton
        onClick={handleOpenUserMenu}
        sx={{ maxWidth: 'fit-content' }}
      >
        <MenuIcon />
      </ListItemButton>
      <Popover
        id="mobile-menu-appbar"
        anchorEl={anchorElUser}
        keepMounted
        open={Boolean(anchorElUser)}
        onClose={handleCloseUserMenu}
      >
        <Box sx={{ m: 1 }}>
          <AttendenceMenu onClose={handleCloseUserMenu} />
          <LeavesButton onClick={handleCloseUserMenu} />
          <SuperAdminMenu onClose={handleCloseUserMenu} />
          <AttendancePopUp />
        </Box>
      </Popover>
      <Box sx={{ flexGrow: 1 }}></Box>
    </>
  );
}
