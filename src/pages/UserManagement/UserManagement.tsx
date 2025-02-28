import { Box, Button, CircularProgress, Grid, Typography } from '@mui/material';
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
import { dateFormate, timeFormate } from '../../components/constants';

interface CustomCard {
  color: string;
  title: string;
  count?: number | string;
  icon: ReactElement;
  titleColor: string;
}

function UserManagement() {
  const [users, setUsers] = useState<any[]>();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [mode, setMode] = useState<'view' | 'edit'>('view');
  const [selectedUser, setSelectedUser] = useState<any>();
  const [open, setOpen] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const activeUsrCount = users?.filter((user: any) => user.active).length;
  const premiumUsrCount = users?.filter((user: any) => user.premium).length;

  function viewDetails(row: any): void {
    setSelectedUser(row);
    setDrawerOpen(true);
  }

  const getUsersList = async () => {
    try {
      const { data } = await usersList();
      setUsers(data.users || []);
    } catch (error) {
      toast.error('Failed to fetch users');
      console.log(error);
    }
  };

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
            iUser={params.row}
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
          moment(params.row.createdAt).format(dateFormate + ' ' + timeFormate),
      },
      {
        field: 'updatedAt',
        headerName: 'Updated At',
        width: 200,
        renderCell: (params: any) =>
          moment(params.row.updatedAt).format(dateFormate + ' ' + timeFormate),
      },
    ],
    []
  );

  const dateFormater = (date?: string) => {
    if (!date) return;
    return moment(date).format(dateFormate + ' ' + timeFormate);
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

  const cardObject: CustomCard[] = [
    {
      color: '#ECF2FF',
      title: 'Users',
      count: users?.length,
      icon: <LeaderboardIcon fontSize="large" style={{ color: '#5D87FF' }} />,
      titleColor: '#5D87FF',
    },
    {
      color: '#FDF4E5',
      title: 'Active',
      count: activeUsrCount,
      icon: (
        <InterpreterModeIcon fontSize="large" style={{ color: '#FFAE1F' }} />
      ),
      titleColor: '#FFAE1F',
    },
    {
      color: '#E8F7FF',
      title: 'Inactive',
      count: users && activeUsrCount && users.length - activeUsrCount,
      icon: <Face6Icon fontSize="large" style={{ color: '#49BEFF' }} />,
      titleColor: '#49BEFF',
    },
    {
      color: '#FCEDE8',
      title: 'Premium   ',
      count: premiumUsrCount,
      icon: <SummarizeIcon fontSize="large" style={{ color: '#FA896B' }} />,
      titleColor: '#FA896B',
    },
  ];

  return (
    <>
      <PositionedSnackbar
        open={open}
        message={alertMessage}
        setOpen={setOpen}
      />
      <Box display={'flex'} flexDirection={'column'} height={'100%'}>
        <Grid container spacing={2}>
          {cardObject.map((card: any) => {
            return (
              <Grid key={card.title} item xs={12} sm={3} md={3} lg={3} xl={3}>
                <BasicCard
                  color={card.color}
                  title={card.title}
                  count={card.count ?? 'NA'}
                  icon={card.icon}
                  titleColor={card.titleColor}
                />
              </Grid>
            );
          })}
        </Grid>
        <Typography
          variant="h4"
          component="h4"
          sx={{ textAlign: 'center', my: 2, width: '100%' }}
        >
          Manage Users
        </Typography>
        <DataGrid
          loading={!users}
          rows={users || []}
          columns={Columns}
          getRowId={(row: any) => row._id}
          slots={{ toolbar: GridToolbar }}
          slotProps={{
            toolbar: {
              showQuickFilter: true,
            },
          }}
          sx={{
            flex: 1,
            '& .MuiDataGrid-columnHeaderTitle': {
              fontWeight: 'bold',
              color: '#504e4e',
            },
            '& .MuiDataGrid-scrollbar': {
              scrollbarWidth: 'thin',
            },
          }}
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
                  slotProps={{
                    toolbar: {
                      showQuickFilter: true,
                    },
                  }}
                  sx={{
                    '& .MuiDataGrid-columnHeaderTitle': {
                      fontWeight: 'bold',
                      color: '#504e4e',
                    },
                    '& .MuiDataGrid-scrollbar': {
                      scrollbarWidth: 'thin',
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
