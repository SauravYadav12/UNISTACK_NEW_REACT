import { Accordion, AccordionSummary, AccordionDetails } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
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
import {
  AcUnit,
  DoDisturb,
  PostAdd,
  Videocam,
  WorkspacePremium,
} from '@mui/icons-material';
import {
  HomeModule,
  MarketingModule,
  ModuleGroup,
  moduleKey,
} from '../../utils/accessControlUtil';
import { useAuth } from '../../AuthGaurd/AuthContextProvider';
import { RequirementStatus } from '../../Interfaces/reports';

interface Item {
  text: string;
  icon: JSX.Element;
  path: string;
  moduleName: MarketingModule;
}

interface NavItem extends Item {
  dropDown?: Item[] | undefined;
}

const reqStatusOptions: RequirementStatus[] = [
  'New Working',
  'Submitted',
  'Interviewed',
  'Cancelled',
];

export const reqStatusParamKey = 'reqStatus';

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

  const marketingMenuItems: NavItem[] = [
    {
      text: 'Requirements',
      icon: <LeaderboardIcon className="icon-style" />,
      path: '/requirements',
      moduleName: MarketingModule.Requirements,
      dropDown: reqStatusOptions.map((status) => ({
        text: status,
        path: `/requirements?${reqStatusParamKey}=${status}`,
        icon: getReqStatusOptionsIcons(status),
        moduleName: MarketingModule.Requirements,
      })),
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

  function getReqStatusOptionsIcons(status: RequirementStatus) {
    switch (status) {
      case 'New Working':
        return <AcUnit style={{ color: '#1976D2' }} fontSize="small" />;
      case 'Submitted':
        return (
          <WorkspacePremium style={{ color: '#4CAF50' }} fontSize="small" />
        );
      case 'Interviewed':
        return <Videocam style={{ color: '#03A9F4' }} fontSize="small" />;
      case 'Cancelled':
        return <DoDisturb style={{ color: '#D32F2F' }} fontSize="small" />;
      default:
        return <PostAdd fontSize="small" />;
    }
  }

  const renderMenuItem = (
    item: NavItem,
    onClick?: () => void,
    indent?: number
  ) => (
    <ListItemButton
      key={item.text}
      onClick={onClick || (() => navigate(item.path))}
      className={`ListItemButton ${isActive(item) ? 'active' : ''}`}
      sx={{ ...(indent ? { pl: indent } : {}) }}
    >
      {item.icon && (
        <ListItemIcon sx={{ minWidth: '0px', pr: 2 }}>{item.icon}</ListItemIcon>
      )}
      <ListItemText primary={item.text} />
    </ListItemButton>
  );

  function isActive(item: NavItem) {
    const path =
      location.pathname + (location.search?.replace('%20', ' ') || '');
    return path === item.path;
  }

  return (
    <Drawer
      sx={{
        width: toggleSideBar ? smallDrawerWidth : drawerWidth,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: toggleSideBar ? smallDrawerWidth : drawerWidth,
          boxSizing: 'border-box',
          scrollbarWidth: 'thin',
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
            return renderMenuItem(item, () => navigate(item.path));
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
            if (item.dropDown) {
              return (
                <Accordion
                  key={item.text}
                  sx={{ boxShadow: 'none', bgcolor: 'transparent' }}
                >
                  <ListItemButton
                    key={item.text}
                    onClick={() => navigate(item.path)}
                    className={`ListItemButton ${
                      isActive(item) ? 'active' : ''
                    }`}
                    sx={{ minWidth: '200px' }}
                  >
                    {item.icon && (
                      <ListItemIcon sx={{ minWidth: '0px', pr: 2 }}>
                        {item.icon}
                      </ListItemIcon>
                    )}
                    <ListItemText
                      primary={item.text}
                      sx={{ width: 'max-content' }}
                    />
                    <AccordionSummary
                    onClick={(e) => e.stopPropagation()}
                      sx={{
                        m: 0,
                        p: 0,
                        minHeight: '0px !important',
                        '& .MuiAccordionSummary-content': {
                          m: '0 !important',
                        },
                        borderRadius: '50%',
                        ':hover': { bgcolor: '#f6ebeb4e' },
                      }}
                      expandIcon={
                        <ExpandMoreIcon
                          sx={{ color: isActive(item) ? 'white' : 'gray' }}
                        />
                      }
                    />
                  </ListItemButton>

                  <AccordionDetails sx={{ p: 0 }}>
                    <List component="div" disablePadding>
                      {item.dropDown.map((subItem) =>
                        renderMenuItem(subItem, () => navigate(subItem.path), 3)
                      )}
                    </List>
                  </AccordionDetails>
                </Accordion>
              );
            }
            return renderMenuItem(item);
          })}
        </List>
      )}
    </Drawer>
  );
}

export default Sidebar;
