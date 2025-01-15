import DashboardIcon from "@mui/icons-material/Dashboard";
import LeaderboardIcon from "@mui/icons-material/Leaderboard";
import InterpreterModeIcon from "@mui/icons-material/InterpreterMode";
import Face6Icon from "@mui/icons-material/Face6";
import Diversity1Icon from "@mui/icons-material/Diversity1";
import SummarizeIcon from "@mui/icons-material/Summarize";
import BadgeIcon from "@mui/icons-material/Badge";
import {
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  ListSubheader,
  Typography,
} from "@mui/material";
import { useLocation, useNavigate } from "react-router-dom";
import { drawerWidth, smallDrawerWidth } from "../constants";
import "./sidebar.css";

function Sidebar({ toggleSideBar }: any) {
  const navigate = useNavigate();
  const location = useLocation();
  const homeMenuItems: any = [
    {
      text: "Dashboard",
      icon: <DashboardIcon className="icon-style" />,
      path: "/dashboard",
    },
    {
      text: "Profile",
      icon: <BadgeIcon className="icon-style" />,
      path: "/profile",
    },
  ];

  const marketingMenuItems = [
    {
      text: "Requirements",
      icon: <LeaderboardIcon className="icon-style" />,
      path: "/requirements",
    },
    {
      text: "Interviews",
      icon: <InterpreterModeIcon className="icon-style" />,
      path: "/interviews",
    },
    {
      text: "Consultants",
      icon: <Face6Icon className="icon-style" />,
      path: "/consultants",
    },
    {
      text: "Teams",
      icon: <Diversity1Icon className="icon-style" />,
      path: "/teams",
    },
    {
      text: "Reports",
      icon: <SummarizeIcon className="icon-style" />,
      path: "/reports",
    },
  ];

  return (
    <Drawer
      sx={{
        width: toggleSideBar ? smallDrawerWidth : drawerWidth,
        flexShrink: 0,
        "& .MuiDrawer-paper": {
          width: toggleSideBar ? smallDrawerWidth : drawerWidth,
          boxSizing: "border-box",
        },
      }}
      variant="permanent"
      anchor="left"
    >
      <div>
        <Typography variant="h5">
          <img
            src={
              toggleSideBar
                ? "src/assets/unistack_small.png"
                : "src/assets/unistack.png"
            }
            alt="unistack logo"
            width={toggleSideBar ? "50%" : "80%"}
            className={toggleSideBar ? "small-logo" : "big-logo"}
          />
        </Typography>
      </div>

      <List>
        {!toggleSideBar && <ListSubheader color="primary">HOME</ListSubheader>}
        {homeMenuItems.map((item: any) => {
          return (
            <ListItemButton
              key={item.text}
              onClick={() => navigate(item.path)}
              className={`ListItemButton ${
                location.pathname === item.path ? "active" : ""
              }`}
            >
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItemButton>
          );
        })}
      </List>

      <List>
        {!toggleSideBar && (
          <ListSubheader color="primary">MARKETING</ListSubheader>
        )}
        {marketingMenuItems.map((item: any) => {
          return (
            <ListItemButton
              key={item.text}
              onClick={() => navigate(item.path)}
              className={`ListItemButton ${
                location.pathname === item.path ? "active" : ""
              }`}
            >
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItemButton>
          );
        })}
      </List>
    </Drawer>
  );
}

export default Sidebar;
