import DashboardIcon from '@mui/icons-material/Dashboard';
import LeaderboardIcon from '@mui/icons-material/Leaderboard';
import InterpreterModeIcon from '@mui/icons-material/InterpreterMode';
import Face6Icon from '@mui/icons-material/Face6';
import Diversity1Icon from '@mui/icons-material/Diversity1';
import SummarizeIcon from '@mui/icons-material/Summarize';
import PointOfSaleIcon from '@mui/icons-material/PointOfSale';
import BadgeIcon from '@mui/icons-material/Badge';
import unistack_Img from '../../assets/unistack.png';
import unistack_small_Img from '../../assets/unistack_small.png';
import {
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  ListSubheader,
  Typography,
} from '@mui/material';
import { useLocation, useNavigate } from 'react-router-dom';
import { drawerWidth, smallDrawerWidth } from '../constants';
import './sidebar.css';
import { PostAdd } from '@mui/icons-material';
import {
  HomeModule,
  MarketingModule,
  ModuleGroup,
  moduleKey,
} from '../../utils/accessControlUtil';
import { useAuth } from '../../AuthGaurd/AuthContextProvider';

function Sidebar({ toggleSideBar }: any) {
  const navigate = useNavigate();
  const { isModuleAllowed } = useAuth();
  const location = useLocation();

  const isMarketingGroupModulesAllowed = Object.values(MarketingModule).some(
    (m) => isModuleAllowed(moduleKey(ModuleGroup.Marketing, m))
  );
  const isHomeGroupModulesAllowed = Object.values(HomeModule).some((m) =>
    isModuleAllowed(moduleKey(ModuleGroup.Home, m))
  );

  const homeMenuItems = [
    {
      text: 'Dashboard',
      icon: <DashboardIcon className="icon-style" />,
      path: '/dashboard',
      moduleName: HomeModule.Dashboard,
    },
    {
      text: 'Profile',
      icon: <BadgeIcon className="icon-style" />,
      path: '/profile',
      moduleName: HomeModule.Profile,
    },
  ];

  const marketingMenuItems = [
    {
      text: 'Requirements',
      icon: <LeaderboardIcon className="icon-style" />,
      path: '/requirements',
      moduleName: MarketingModule.Requirements,
    },
    {
      text: 'Interviews',
      icon: <InterpreterModeIcon className="icon-style" />,
      path: '/interviews',
      moduleName: MarketingModule.Interviews,
    },
    {
      text: 'Test And VI',
      icon: <PostAdd className="icon-style" />,
      path: '/testandvendorinterviews',
      moduleName: MarketingModule['Test And VI'],
    },
    {
      text: 'Consultants',
      icon: <Face6Icon className="icon-style" />,
      path: '/consultants',
      moduleName: MarketingModule.Consultants,
    },
    {
      text: 'Teams',
      icon: <Diversity1Icon className="icon-style" />,
      path: '/teams',
      moduleName: MarketingModule.Teams,
    },
    {
      text: 'Reports',
      icon: <SummarizeIcon className="icon-style" />,
      path: '/reports',
      moduleName: MarketingModule.Reports,
    },
    {
      text: 'Sales Leads',
      icon: <PointOfSaleIcon className="icon-style" />,
      path: '/sales-leads',
      moduleName: MarketingModule['Sales Leads'],
    },
  ];

  return (
    <Drawer
      sx={{
        width: toggleSideBar ? smallDrawerWidth : drawerWidth,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: toggleSideBar ? smallDrawerWidth : drawerWidth,
          boxSizing: 'border-box',
        },
      }}
      variant="permanent"
      anchor="left"
    >
      <div style={{ cursor: 'pointer' }} onClick={() => navigate('/dashboard')}>
        <Typography variant="h5">
          <img
            src={toggleSideBar ? unistack_small_Img : unistack_Img}
            alt="unistack logo"
            width={toggleSideBar ? '50%' : '80%'}
            className={toggleSideBar ? 'small-logo' : 'big-logo'}
          />
        </Typography>
      </div>

      {isHomeGroupModulesAllowed && (
        <List>
          {!toggleSideBar && (
            <ListSubheader color="primary">HOME</ListSubheader>
          )}
          {homeMenuItems.map((item: any) => {
            const isAllowed = isModuleAllowed(
              moduleKey(ModuleGroup.Home, item.moduleName)
            );
            if (!isAllowed) return null;
            return (
              <ListItemButton
                key={item.text}
                onClick={() => navigate(item.path)}
                className={`ListItemButton ${
                  location.pathname === item.path ? 'active' : ''
                }`}
              >
                <ListItemIcon>{item.icon}</ListItemIcon>
                <ListItemText primary={item.text} />
              </ListItemButton>
            );
          })}
        </List>
      )}

      {isMarketingGroupModulesAllowed && (
        <List>
          {!toggleSideBar && (
            <ListSubheader color="primary">MARKETING</ListSubheader>
          )}
          {marketingMenuItems.map((item) => {
            const isAllowed = isModuleAllowed(
              moduleKey(ModuleGroup.Marketing, item.moduleName)
            );
            if (!isAllowed) return null;
            return (
              <ListItemButton
                key={item.text}
                onClick={() => navigate(item.path)}
                className={`ListItemButton ${
                  location.pathname === item.path ? 'active' : ''
                }`}
              >
                <ListItemIcon>{item.icon}</ListItemIcon>
                <ListItemText primary={item.text} />
              </ListItemButton>
            );
          })}
        </List>
      )}
    </Drawer>
  );
}

export default Sidebar;
