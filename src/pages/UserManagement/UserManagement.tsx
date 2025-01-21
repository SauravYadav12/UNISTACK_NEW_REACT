import { Box, Grid, Typography } from '@mui/material';
import { DataGrid, GridToolbar } from '@mui/x-data-grid';
import { ReactElement, useEffect, useMemo, useState } from 'react';
import BasicCard from '../../components/card/Card';
import LeaderboardIcon from '@mui/icons-material/Leaderboard';
import InterpreterModeIcon from '@mui/icons-material/InterpreterMode';
import Face6Icon from '@mui/icons-material/Face6';
import SummarizeIcon from '@mui/icons-material/Summarize';
import { usersList } from '../../services/authApi';
import ActiveUserSwitch from './ActiveUserSwitch';
import PositionedSnackbar from '../../components/snackbar/Snackbar';
import moment from 'moment';
import BasicSelect from './UserRoleSelect';

interface CustomCard {
  color: string;
  title: string;
  count: number;
  icon: ReactElement;
  titleColor: string;
}

function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeUsers, setActiveUsers] = useState(0);
  const [inactiveUsers, setInactiveUsers] = useState(0);
  // const [pageSize, setPageSize] = useState(5)
  const [open, setOpen] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');

  useEffect(() => {
    getUsersList();
  }, []);

  const Columns: any = useMemo(
    () => [
      { field: 'photoURL', headerName: 'Avatar', width: 60 },
      {
        field: 'firstName',
        headerName: 'First Name',
        width: 100,
        editable: true,
      },
      {
        field: 'lastName',
        headerName: 'Last Name',
        width: 100,
        editable: true,
      },
      { field: 'email', headerName: 'Email', width: 200, editable: true },
      {
        field: 'role',
        headerName: 'Role',
        width: 100,
        type: 'actions',
        renderCell: (params: any) => (
          <BasicSelect
            setRole={params.row.role}
            userId={params.row._id}
            setOpen={setOpen}
            setAlertMessage={setAlertMessage}
          />
        ),
      },
      {
        field: 'active',
        headerName: 'Active',
        width: 100,
        type: 'actions',
        renderCell: (params: any) => (
          <ActiveUserSwitch
            active={params.row.active}
            userId={params.row._id}
            user={params.row}
            setOpen={setOpen}
            setAlertMessage={setAlertMessage}
          />
        ),
      },
      {
        field: 'premium',
        headerName: 'Premium',
        width: 100,
        type: 'boolean',
        editable: true,
      },
      { field: 'corpName', headerName: 'Corp Name', width: 100 },
      {
        field: 'createdAt',
        headerName: 'Created At',
        width: 200,
        renderCell: (params: any) =>
          moment(params.row.createdAt).format('YYYY-MM-DD HH:MM:SS'),
      },
      {
        field: 'updatedAt',
        headerName: 'Updated At',
        width: 200,
        renderCell: (params: any) =>
          moment(params.row.updatedAt).format('YYYY-MM-DD HH:MM:SS'),
      },
    ],
    []
  );

  const getUsersList = async () => {
    try {
      setLoading(true);
      const res = await usersList();
      if (res.data?.users.length) {
        setUsers(res.data?.users);
        const activeuserCount = res.data?.users.filter(
          (user: any) => user.active
        );
        const inactiveuserCount = res.data?.users.filter(
          (user: any) => !user.active
        );
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
      color: '#ECF2FF',
      title: 'Users',
      count: users.length,
      icon: <LeaderboardIcon fontSize="large" style={{ color: '#5D87FF' }} />,
      titleColor: '#5D87FF',
    },
    {
      color: '#FDF4E5',
      title: 'Active',
      count: activeUsers,
      icon: (
        <InterpreterModeIcon fontSize="large" style={{ color: '#FFAE1F' }} />
      ),
      titleColor: '#FFAE1F',
    },
    {
      color: '#E8F7FF',
      title: 'Inactive',
      count: inactiveUsers,
      icon: <Face6Icon fontSize="large" style={{ color: '#49BEFF' }} />,
      titleColor: '#49BEFF',
    },
    {
      color: '#FCEDE8',
      title: 'Premium   ',
      count: 90,
      icon: <SummarizeIcon fontSize="large" style={{ color: '#FA896B' }} />,
      titleColor: '#FA896B',
    },
  ];

  const cardComponent = cardObject.map((card: any) => {
    return (
      <Grid key={card.title} item xs={12} sm={3} md={3} lg={3} xl={3}>
        <BasicCard
          color={card.color}
          title={card.title}
          count={card.count}
          icon={card.icon}
          titleColor={card.titleColor}
        />
      </Grid>
    );
  });

  return (
    <>
      <PositionedSnackbar
        open={open}
        message={alertMessage}
        setOpen={setOpen}
      />
      <Grid container spacing={2} sx={{ width: '100%' }}>
        {cardComponent}
      </Grid>
      <Box
        sx={{
          height: 400,
          width: '100%',
        }}
      >
        <Typography
          variant="h4"
          component="h4"
          sx={{ textAlign: 'center', mt: 3, mb: 3 }}
        >
          Manage Users
        </Typography>
        <DataGrid
          columns={Columns}
          rows={users}
          getRowId={(row: any) => row._id}
          slots={{ toolbar: GridToolbar }}
        />
      </Box>
    </>
  );
}

export default UserManagement;
