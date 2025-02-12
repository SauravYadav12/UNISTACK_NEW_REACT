import {
  Box,
  Button,
  CircularProgress,
  Grid,
  Typography,
} from '@mui/material';
import { DataGrid, GridToolbar } from '@mui/x-data-grid';
import {
  Dispatch,
  ReactElement,
  SetStateAction,
  useEffect,
  useMemo,
  useState,
} from 'react';
import BasicCard from '../../components/card/Card';
import LeaderboardIcon from '@mui/icons-material/Leaderboard';
import InterpreterModeIcon from '@mui/icons-material/InterpreterMode';
import Face6Icon from '@mui/icons-material/Face6';
import SummarizeIcon from '@mui/icons-material/Summarize';
import { usersList } from '../../services/authApi';
import ActiveUserSwitch from '../../components/userManagement/ActiveUserSwitch';
import PositionedSnackbar from '../../components/snackbar/Snackbar';
import moment from 'moment';
import BasicSelect from '../../components/userManagement/UserRoleSelect';
import CanEditSwitch from '../../components/userManagement/canEditSwitch';
import CustomDrawer from '../../components/drawer/CustomDrawer';
import ProfileForm from '../Marketing/Profile/ProfileForm';
import {
  documentFormSection,
  getProfileFormInitialValues,
  profileFormSections,
} from '../Marketing/Profile/constants';
import { UserProfile } from '../../Interfaces/profile';
import { getProfileByUser } from '../../services/userProfileApi';
import { toast } from 'react-toastify';

interface CustomCard {
  color: string;
  title: string;
  count: number;
  icon: ReactElement;
  titleColor: string;
}

function UserManagement() {
  const [users, setUsers] = useState([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [mode, setMode] = useState<'view' | 'edit'>('view');
  const [selectedUser, setSelectedUser] = useState<any>();
  const [activeUsers, setActiveUsers] = useState(0);
  const [inactiveUsers, setInactiveUsers] = useState(0);
  const [open, setOpen] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');

  function viewDetails(row: any): void {
    setSelectedUser(row);
    setDrawerOpen(true);
  }

  useEffect(() => {
    getUsersList();
  }, []);

  const Columns: any = useMemo(
    () => [
      {
        field: 'view',
        headerName: 'Profile',
        width: 100,
        renderCell: (params: any) => (
          <Button
            size="small"
            variant="contained"
            color="primary"
            sx={{ borderRadius: '10px' }}
            onClick={() => viewDetails(params.row)}
          >
            view
          </Button>
        ),
      },
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
        field: 'canEdit',
        headerName: 'Can Edit Profile',
        width: 100,
        type: 'actions',
        renderCell: (params: any) => (
          <CanEditSwitch
            active={!!params.row.canEdit}
            userId={params.row._id}
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

  const dateFormater = (date?: string) => {
    if (!date) return;
    return moment(date).format('YYYY-MM-DD HH:MM:SS');
  };
  const extractLocationField = (val: any, field: string) => {
    if (!val) return;
    val = JSON.parse(val);
    return val[field];
  };
  const activityColumn = [
    {
      field: 'loggedInAt',
      headerName: 'Logged-In At',
      width: 200,
      valueGetter: (v: any) => dateFormater(v) || 'NA',
    },
    {
      field: 'loggedOutAt',
      headerName: 'Logged-Out At',
      width: 200,
      valueGetter: (v: any) => dateFormater(v) || 'NA',
    },

    {
      field: 'ip',
      headerName: 'IP',
      width: 200,
      valueGetter: (v: any) => v || 'NA',
    },
    {
      field: 'latitude',
      headerName: 'Latitude',
      width: 150,
      valueGetter: (v: any, row: any) =>
        extractLocationField(row.location, 'latitude') || 'NA',
    },
    {
      field: 'longitude',
      headerName: 'Longitude',
      width: 150,
      valueGetter: (v: any, row: any) =>
        extractLocationField(row.location, 'longitude') || 'NA',
    },
    {
      field: 'altitude',
      headerName: 'Altitude',
      width: 150,
      valueGetter: (v: any, row: any) =>
        extractLocationField(row.location, 'altitude') || 'NA',
    },
    {
      field: 'accuracy',
      headerName: 'Accuracy',
      width: 150,
      valueGetter: (v: any, row: any) =>
        extractLocationField(row.location, 'accuracy') || 'NA',
    },
  ];

  const activityColumnGroupingModel = [
    {
      groupId: 'Location',
      align: 'center',
      description: '',
      children: [
        { field: 'latitude' },
        { field: 'longitude' },
        { field: 'altitude' },
        { field: 'accuracy' },
      ],
    },
  ];

  const getUsersList = async () => {
    try {
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
      } else {
        setActiveUsers(0);
        setInactiveUsers(0);
      }
    } catch (error) {
      console.log(error);
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

      {!!selectedUser && (
        <CustomDrawer
          open={drawerOpen}
          onClose={() => {
            setDrawerOpen(false);
            setMode('view');
          }}
          title={
            (mode === 'view' ? '' : 'Edit') +
            ' Profile: ' +
            `${selectedUser.firstName} ${selectedUser.lastName}`
          }
        >
          <MyForm modeState={[mode, setMode]} user={selectedUser} />
          {mode === 'view' && (
            <>
              <Grid container spacing={1} sx={{ maxWidth: '100%' }}>
                <Grid item xs={12}>
                  <h4>6. Activity</h4>
                </Grid>
              </Grid>
              <Box
                sx={{
                  height: 600,
                  width: '100%',
                }}
              >
                <DataGrid
                  columns={activityColumn}
                  rows={[...(selectedUser?.activity || [])].reverse()}
                  getRowId={(row: any) => row._id}
                  slots={{ toolbar: GridToolbar }}
                  // columnGroupingModel={activityColumnGroupingModel}
                  slotProps={{
                    toolbar: {
                      showQuickFilter: true,
                    },
                  }}
                />
              </Box>
            </>
          )}
        </CustomDrawer>
      )}
    </>
  );
}

export default UserManagement;

const MyForm = ({ user, modeState }: MyFormqProps) => {
  const [mode, setMode] = modeState;
  const [myProfile, setMyProfile] = useState<UserProfile>();
  const getProfile = async () => {
    try {
      const res = await getProfileByUser({ ...user, id: user._id });
      if (res) {
        setMyProfile(res);
      }
    } catch (error) {
      toast.error('Failed to fetch profile');
      console.log(error);
    }
  };
  useEffect(() => {
    getProfile();
  }, [user]);

  if (!myProfile)
    return (
      <Box className="loader">
        <CircularProgress />
      </Box>
    );

  return (
    <ProfileForm
      template={getProfileFormInitialValues(myProfile)}
      profileFormSections={profileFormSections}
      documentFormSection={documentFormSection}
      viewMode={mode === 'view'}
      onClickCancel={() => setMode('view')}
      onClickEdit={() => setMode('edit')}
      onSubmitSuccessfully={(p) => {
        setMyProfile(p);
        setMode('view');
      }}
    />
  );
};

interface MyFormqProps {
  user: any;
  modeState: ['view' | 'edit', Dispatch<SetStateAction<'view' | 'edit'>>];
}
