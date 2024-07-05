import { Box, Grid } from '@mui/material';
import { DataGrid, GridToolbar } from '@mui/x-data-grid';
import { ReactElement, useEffect, useState } from "react";
import BasicCard from "../../components/card/Card";
import LeaderboardIcon from "@mui/icons-material/Leaderboard";
import InterpreterModeIcon from "@mui/icons-material/InterpreterMode";
import Face6Icon from "@mui/icons-material/Face6";
import SummarizeIcon from "@mui/icons-material/Summarize";
import { usersList } from "../../services/authApi";

interface CustomCard {
  color: string;
  title: string;
  count: number;
  icon: ReactElement;
  titleColor: string;
}
const Columns = ["firstName", "lastName", "email", "role", "active", "premium", "corpName", "createdAt", "updatedAt"];

function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeUsers, setActiveUsers] = useState(0);
  const [inactiveUsers, setInactiveUsers] = useState(0);

  useEffect(() => {
    getUsersList();
  }, []);

  const getUsersList = async () => {
    try {
      setLoading(true);
      const res = await usersList();
      if (res.data?.users.length) {
        setUsers(res.data?.users);
        const activeuserCount = res.data?.users.filter((user: any) => user.active);
        const inactiveuserCount = res.data?.users.filter((user: any) => !user.active);
        setActiveUsers(activeuserCount.length);
        setInactiveUsers(inactiveuserCount.length);
        setLoading(false);
      } else {
        setActiveUsers(0);
        setInactiveUsers(0);
        setLoading(false);
      }
    } catch (error) {
      console.log(error);
      setLoading(false);
    }
  };

  const cardObject: CustomCard[] = [
    {
      color: "#ECF2FF",
      title: "Users",
      count: users.length,
      icon: <LeaderboardIcon fontSize="large" style={{ color: "#5D87FF" }} />,
      titleColor: "#5D87FF"
    },
    {
      color: "#FDF4E5",
      title: "Active",
      count: activeUsers,
      icon: <InterpreterModeIcon fontSize="large" style={{ color: "#FFAE1F" }} />,
      titleColor: "#FFAE1F"
    },
    {
      color: "#E8F7FF",
      title: "Inactive",
      count: inactiveUsers,
      icon: <Face6Icon fontSize="large" style={{ color: "#49BEFF" }} />,
      titleColor: "#49BEFF"
    },
    {
      color: "#FCEDE8",
      title: "Premium   ",
      count: 90,
      icon: <SummarizeIcon fontSize="large" style={{ color: "#FA896B" }} />,
      titleColor: "#FA896B"
    }
  ];

  const cardComponent = cardObject.map((card: any) => {
    return (
      <Grid key={card.title} item xs={12} sm={3} md={3} lg={3} xl={3}>
        <BasicCard color={card.color} title={card.title} count={card.count} icon={card.icon} titleColor={card.titleColor} />
      </Grid>
    );
  });

  return (
    <>
      <Grid container spacing={2} sx={{ width: "100%" }}>
        {cardComponent}
      </Grid>
      <Box sx={{ marginRight: "25px" }}>
        <div style={{ height: 400, width: "100%", margin: "25px 0 0 0" }}>
          <DataGrid
            rows={users}
            getRowId={(row: any) => row._id}
            loading={loading}
            columns={Columns.map((field) => ({
              field,
              headerName: field.charAt(0).toUpperCase() + field.slice(1), // Capitalize first letter
              width: 150 // Adjust width as needed
            }))}
            // disableColumnFilter
            slots={{ toolbar: GridToolbar }}
          />
        </div>
      </Box>
    </>
  );
}

export default UserManagement