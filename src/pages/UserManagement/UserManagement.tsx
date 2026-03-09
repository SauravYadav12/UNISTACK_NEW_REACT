import {
  Box,
  Button,
  CircularProgress,
  Grid,
  IconButton,
  Typography,
} from '@mui/material';
import { DataGrid, GridColDef, GridToolbar } from '@mui/x-data-grid';
import {
  Dispatch,
  ReactElement,
  SetStateAction,
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
import UserRoleSelect from '../../components/userManagement/UserRoleSelect';
import CanEditSwitch from '../../components/userManagement/canEditSwitch';
import CustomDrawer from '../../components/drawer/CustomDrawer';
import ProfileForm from '../Marketing/Profile/ProfileForm';
import {
  documentFormSection,
  getProfileFormInitialValues,
  profileFormSections,
} from '../Marketing/Profile/constants';
import { getProfileByUser } from '../../services/userProfileApi';
import { dateFormate2, timeFormate } from '../../components/constants';
import UserShiftSelect from '../../components/userManagement/UserShiftSelect';
import { Sync } from '@mui/icons-material';
import { useFetchData } from '../../hooks/fetchDataHook';
import { iUser, iUserActivity, UserRole } from '../../Interfaces/iUser';
import UserWorkLocationSelect from '../../components/userManagement/UserWorkLocationSelect';

interface CustomCard {
  color: string;
  title: string;
  count?: number | string;
  icon: ReactElement;
  titleColor: string;
}

function UserManagement() {
  const {
    data: users,
    loading,
    error,
    setData: setUsers,
    loadData,
  } = useFetchData<iUser[]>(getUsersList, []);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [mode, setMode] = useState<'view' | 'edit'>('view');
  const [selectedUser, setSelectedUser] = useState<iUser>();
  const [open, setOpen] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const activeUsrCount = users?.filter((user) => user.active).length;
  const premiumUsrCount = users?.filter((user) => user.premium).length;

  function viewDetails(row: iUser): void {
    setSelectedUser(row);
    setDrawerOpen(true);
  }

  async function getUsersList() {
    const { data } = await usersList();
    return data.users || [];
  }

  function HandleChangeUser(usr: iUser) {
    setUsers((pre) => {
      pre =
        pre?.map((u) => {
          if (u._id === usr._id) return usr;
          return u;
        }) || [];
      return [...pre];
    });
  }

  const Columns = useMemo<GridColDef<iUser>[]>(
    () => [
      {
        field: 'view',
        headerName: 'Profile',
        width: 100,
        renderCell: (params) => (
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
        filterable: false,
        sortable: false,
      },
      {
        field: 'firstName',
        headerName: 'Name',
        width: 160,
        valueGetter: (val, param) => {
          return param.firstName + ' ' + param.lastName;
        },
      },
      { field: 'email', headerName: 'Email', width: 200 },
      {
        field: 'role',
        headerName: 'Role',
        width: 200,
        type: 'actions',
        renderCell: (params) => (
          <UserRoleSelect
            role={params.row.role as UserRole}
            userId={params.row._id}
            onSuccess={(u) => {
              HandleChangeUser(u);
              setAlertMessage(`Role updated to ${u.role}`);
              setOpen(true);
            }}
          />
        ),
      },
      {
        field: 'shift',
        headerName: 'Shift',
        width: 100,
        type: 'actions',
        renderCell: (params) => (
          <UserShiftSelect
            shift={params.row.shift}
            userId={params.row._id}
            onSuccess={(u) => {
              setAlertMessage(`Shift updated to ${u.shift}`);
              setOpen(true);
              HandleChangeUser(u);
            }}
          />
        ),
      },
      {
        field: 'workLocation',
        headerName: 'Work Location',
        width: 150,
        type: 'actions',
        renderCell: (params) => (
          <UserWorkLocationSelect
            location={params.row.workLocation}
            userId={params.row._id}
            onSuccess={(u) => {
              HandleChangeUser(u);
              setAlertMessage(`Work Location updated to ${u.workLocation}`);
              setOpen(true);
            }}
          />
        ),
      },
      {
        field: 'active',
        headerName: 'Active',
        width: 100,
        type: 'actions',
        renderCell: (params) => (
          <ActiveUserSwitch
            active={params.row.active}
            userId={params.row._id}
            onSuccess={(u) => {
              HandleChangeUser(u);
              if (u.active) {
                setAlertMessage('User Activated successfully');
              } else {
                setAlertMessage('User Deactivated');
              }
              setOpen(true);
            }}
          />
        ),
      },
      {
        field: 'canEdit',
        headerName: 'Can Edit Profile',
        width: 100,
        type: 'actions',
        renderCell: (params) => (
          <CanEditSwitch
            canEdit={!!params.row.canEdit}
            jUser={params.row}
            onSuccess={(u) => {
              HandleChangeUser(u);
              setOpen(true);
              if (u.canEdit) {
                setAlertMessage('Profile edit permission granted');
              } else {
                setAlertMessage('Profile edit permission revoked');
              }
            }}
          />
        ),
      },
      {
        field: 'premium',
        headerName: 'Premium',
        width: 100,
        type: 'boolean',
      },
      { field: 'corpName', headerName: 'Corp Name', width: 100 },
      {
        field: 'createdAt',
        headerName: 'Created At',
        width: 200,
        valueGetter: (params) =>
          moment(params).format(dateFormate2 + ' ' + timeFormate),
        // filterOperators: filterOperatorsForDateField,
      },
      {
        field: 'updatedAt',
        headerName: 'Updated At',
        width: 200,
        valueGetter: (params) =>
          moment(params).format(dateFormate2 + ' ' + timeFormate),
        // filterOperators: filterOperatorsForDateField,
      },
    ],
    []
  );

  const dateFormater = (date?: string) => {
    if (!date) return;
    return moment(date).format(dateFormate2 + ' ' + timeFormate);
  };
  const extractLocationField = (val?: string, field?: string) => {
    if (!val || !field) return;
    val = JSON.parse(val);
    if (!val || typeof val !== 'object' || !(field in val)) return;
    return val[field];
  };

  const activityColumn: GridColDef<iUserActivity>[] = [
    {
      field: 'loggedInAt',
      headerName: 'Logged-In At',
      width: 200,
      valueGetter: (v) => dateFormater(v) || 'NA',
    },
    {
      field: 'loggedOutAt',
      headerName: 'Logged-Out At',
      width: 200,
      valueGetter: (v) => dateFormater(v) || 'NA',
    },

    {
      field: 'ip',
      headerName: 'IP',
      width: 200,
      valueGetter: (v) => v || 'NA',
    },
    {
      field: 'latitude',
      headerName: 'Latitude',
      width: 150,
      valueGetter: (v, row) =>
        extractLocationField(row.location, 'latitude') || 'NA',
    },
    {
      field: 'longitude',
      headerName: 'Longitude',
      width: 150,
      valueGetter: (v, row) =>
        extractLocationField(row.location, 'longitude') || 'NA',
    },
    {
      field: 'altitude',
      headerName: 'Altitude',
      width: 150,
      valueGetter: (v, row) =>
        extractLocationField(row.location, 'altitude') || 'NA',
    },
    {
      field: 'accuracy',
      headerName: 'Accuracy',
      width: 150,
      valueGetter: (v, row) =>
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

  function MyUserTable() {
    if (error) {
      return (
        <Box textAlign={'center'}>
          <Typography color="error">{error}</Typography>
          <IconButton onClick={loadData}>
            <Sync color="primary" />
          </IconButton>
        </Box>
      );
    }

    return (
      <DataGrid
        loading={loading}
        rows={users || []}
        columns={Columns}
        getRowId={(row) => row._id}
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
    );
  }

  return (
    <>
      <PositionedSnackbar
        open={open}
        message={alertMessage}
        setOpen={setOpen}
      />
      <Box display={'flex'} flexDirection={'column'} height={'100%'}>
        <Grid container spacing={2}>
          {cardObject.map((card) => {
            return (
              <Grid key={card.title} item xs={12} sm={3} md={3} lg={3} xl={3}>
                <BasicCard
                  color={card.color}
                  title={card.title}
                  count={
                    typeof card.count === 'number'
                      ? card.count
                      : parseInt(card.count || '0') || 0
                  }
                  icon={card.icon}
                  titleColor={card.titleColor}
                />
              </Grid>
            );
          })}
        </Grid>
        <Box
          display={'flex'}
          justifyContent={'space-between'}
          alignItems={'center'}
        >
          <Typography variant="h5" sx={{ textAlign: 'center', my: 2 }}>
            Manage Users
          </Typography>
          <IconButton onClick={loadData}>
            <Sync color="primary" />
          </IconButton>
        </Box>

        <MyUserTable />
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
          closeOnOutSideClick={mode === 'view'}
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
                  getRowId={(row) => row._id}
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

const MyForm = ({ user, modeState }: MyFormProps) => {
  const [mode, setMode] = modeState;
  const {
    data: myProfile,
    setData: setMyProfile,
    loadData,
    loading,
    error,
  } = useFetchData(getProfile, [user]);
  async function getProfile() {
    return await getProfileByUser({ ...user, id: user._id });
  }
  if (loading)
    return (
      <Box className="loader">
        <CircularProgress />
      </Box>
    );
  if (error) {
    return (
      <Box textAlign={'center'}>
        <Typography color="error">{error}</Typography>
        <IconButton onClick={loadData}>
          <Sync color="primary" />
        </IconButton>
      </Box>
    );
  }
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

interface MyFormProps {
  user: iUser;
  modeState: ['view' | 'edit', Dispatch<SetStateAction<'view' | 'edit'>>];
}
