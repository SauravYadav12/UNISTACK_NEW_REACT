import { Grid } from "@mui/material";
import BasicCard from "../../components/card/Card";
import LeaderboardIcon from "@mui/icons-material/Leaderboard";
import InterpreterModeIcon from "@mui/icons-material/InterpreterMode";
import Face6Icon from "@mui/icons-material/Face6";
import SummarizeIcon from "@mui/icons-material/Summarize";
import BadgeIcon from "@mui/icons-material/Badge";
import { ReactElement } from "react";

interface CustomCard {
  color: string;
  title: string;
  count: number;
  icon: ReactElement;
  titleColor: string;
}

const cardObject: CustomCard[] = [
  {
    color: "#ECF2FF",
    title: "Requirements",
    count: 20163,
    icon: <LeaderboardIcon fontSize="large" style={{ color: "#5D87FF" }} />,
    titleColor: "#5D87FF",
  },
  {
    color: "#FDF4E5",
    title: "Interviews",
    count: 2245,
    icon: <InterpreterModeIcon fontSize="large" style={{ color: "#FFAE1F" }} />,
    titleColor: "#FFAE1F",
  },
  {
    color: "#E8F7FF",
    title: "Completed",
    count: 1315,
    icon: <Face6Icon fontSize="large" style={{ color: "#49BEFF" }} />,
    titleColor: "#49BEFF",
  },
  {
    color: "#FCEDE8",
    title: "Projects",
    count: 90,
    icon: <SummarizeIcon fontSize="large" style={{ color: "#FA896B" }} />,
    titleColor: "#FA896B",
  },
  {
    color: "#E6FFFA",
    title: "Active",
    count: 7,
    icon: <BadgeIcon fontSize="large" style={{ color: "#13DEB9" }} />,
    titleColor: "#13DEB9  ",
  },
  {
    color: "#ECF2FF",
    title: "Employees",
    count: 12,
    icon: <Face6Icon fontSize="large" style={{ color: "#5D87FF" }} />,
    titleColor: "#5D87FF",
  },
];

function Dashboard() {

  return (
    <>
      <Grid container spacing={2} sx={{ width: "100%" }}>
        {cardObject.map((card: any) => {
          return (
            <Grid key={card.title} item xs={12} sm={6} md={4} lg={2} xl={2}>
              <BasicCard color={card.color} title={card.title} count={card.count} icon={card.icon} titleColor={card.titleColor} />
            </Grid>
          );
        })}
      </Grid>
    </>
  );
}

export default Dashboard;
