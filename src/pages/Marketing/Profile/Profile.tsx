import React, { useEffect, useState } from 'react';
import CustomDrawer from '../../../components/drawer/CustomDrawer';
import {
  Box,
  Button,
  IconButton,
  Tab,
  Tabs,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { ModeEditOutline, Sync } from '@mui/icons-material';
import ProfileForm from './ProfileForm';
import MyAvatar from '../../../components/profile/myAvatar/MyAvatar';
import ProfileDetails from '../../../components/profile/ProfileDetails';
import Address from '../../../components/profile/Address';
import Documents from '../../../components/profile/Documents';
import BankDetailsComponent from '../../../components/profile/BankDetails';
import { useAuth } from '../../../AuthGaurd/AuthContextProvider';
import CircularProgress from '@mui/material/CircularProgress';
import { FaRegIdBadge } from 'react-icons/fa';
import coverImage from '../../../assets/unistack_banner.png';
import './profile.css';
import {
  documentFormSection,
  getProfileFormInitialValues,
  profileFormSections,
  profilePhotoSection,
} from './constants';
import { UserRole } from '../../../Interfaces/iUser';
function Profile() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const marginRight = isMobile ? 0 : 25;
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [profilePictureDrawer, setProfilePictureDrawer] = useState(false);
  const [value, setValue] = React.useState(0);
  const { myProfileState, iUser } = useAuth();

  const canEdit = iUser?.canEdit || iUser?.role.includes(UserRole['super-admin']);

  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };

  useEffect(() => {
    myProfileState?.loadData();
  }, []);

  if (!myProfileState || myProfileState.loading) {
    return (
      <Box className="loader" sx={{ m: 0 }}>
        <CircularProgress />
      </Box>
    );
  }

  const {
    error,
    data: myProfile,
    loadData: getMyProfile,
    setData: setMyProfile,
  } = myProfileState;

  if (error) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          gap: 5,
        }}
      >
        <IconButton onClick={getMyProfile}>
          <Sync color="primary" />
        </IconButton>
        <Typography color="error">{error}</Typography>
      </div>
    );
  }

  return (
    <>
      <div style={{ marginRight }}>
        <Box
          className="top-container"
          sx={{
            border: '8px',
            overflow: 'hidden',
            bgcolor: 'primary.main',
            '&:hover': {
              bgcolor: 'primary.dark',
            },
          }}
        >
          <img
            src={coverImage}
            alt="profile cover image"
            style={{ width: '100%', height: '100%', objectFit: 'fill' }}
          />
        </Box>
      </div>
      <div style={{ marginRight }}>
        <Box className="middle-container">
          <Box
            sx={{
              width: `33%`,
              height: 100,
            }}
          >
            {!isMobile && (
              <Box className="left-box">
                <FaRegIdBadge color="#032840" fontSize={17} />
                <Typography variant="h6">
                  {myProfile?.employeeId || 'NA'}
                </Typography>
              </Box>
            )}
          </Box>
          <Box className="middle-box">
            <MyAvatar
              editable={canEdit}
              avatar={myProfile?.photo}
              onEdit={() => setProfilePictureDrawer(!profilePictureDrawer)}
            />
            <Box className="profile-name" sx={{ width: 'max-content' }}>
              <span>{myProfile?.name}</span>
            </Box>
          </Box>

          <Box className="right-box">
            {!isMobile && (
              <>
                {canEdit && (
                  <Button
                    variant="contained"
                    style={{
                      marginRight,
                      float: 'right',
                      borderRadius: '10px',
                    }}
                    onClick={() => setDrawerOpen(true)}
                    size="small"
                  >
                    <ModeEditOutline
                      style={{
                        paddingRight: '8px',
                        width: '16px',
                        height: '16px',
                      }}
                    />{' '}
                    <span>Edit</span>
                  </Button>
                )}
              </>
            )}
          </Box>
        </Box>
      </div>

      {isMobile && (
        <Box>
          <Box className="left-box">
            <FaRegIdBadge color="#032840" fontSize={14} />
            <Typography variant="subtitle1">
              {myProfile?.employeeId || 'NA'}
            </Typography>
          </Box>
          {canEdit && (
            <Box
              display={'flex'}
              justifyContent={'center'}
              alignItems={'center'}
              my={2}
            >
              <Button
                variant="contained"
                style={{
                  borderRadius: '10px',
                }}
                onClick={() => setDrawerOpen(true)}
                size="small"
              >
                <ModeEditOutline
                  style={{
                    paddingRight: '8px',
                    width: '16px',
                    height: '16px',
                  }}
                />{' '}
                <span>Edit</span>
              </Button>
            </Box>
          )}
        </Box>
      )}

      <div style={{ marginRight }}>
        <Box>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs
              value={value}
              onChange={handleChange}
              aria-label="basic tabs example"
              sx={{
                '& .MuiTabs-scroller': {
                  overflowX: 'auto !important',
                  scrollbarWidth: 'thin',
                },
              }}
            >
              <Tab label="Personal details" {...a11yProps(0)} />
              <Tab label="Bank details" {...a11yProps(1)} />
              <Tab label="Documents" {...a11yProps(2)} />
              <Tab label="Permanent address" {...a11yProps(3)} />
              <Tab label="Communication address" {...a11yProps(4)} />
            </Tabs>
          </Box>
          <CustomTabPanel value={value} index={0}>
            <ProfileDetails />
          </CustomTabPanel>
          <CustomTabPanel value={value} index={1}>
            <BankDetailsComponent />
          </CustomTabPanel>
          <CustomTabPanel value={value} index={2}>
            <Documents />
          </CustomTabPanel>
          <CustomTabPanel value={value} index={3}>
            {!!myProfile?.permanentAddress && (
              <Address address={myProfile?.permanentAddress} />
            )}
          </CustomTabPanel>
          <CustomTabPanel value={value} index={4}>
            {!!myProfile?.communicationAddress && (
              <Address address={myProfile?.communicationAddress} />
            )}
          </CustomTabPanel>
        </Box>
      </div>

      {!!myProfile && (
        <CustomDrawer
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          title={'Edit Profile'}
          closeOnOutSideClick={false}
        >
          <ProfileForm
            onSubmitSuccessfully={(p) => {
              setMyProfile(p);
              setDrawerOpen(false);
            }}
            template={getProfileFormInitialValues(myProfile)}
            profileFormSections={profileFormSections}
            documentFormSection={documentFormSection}
            onClickCancel={() => setDrawerOpen(false)}
          />
        </CustomDrawer>
      )}
      {!!myProfile && (
        <CustomDrawer
          open={profilePictureDrawer}
          onClose={() => setProfilePictureDrawer(false)}
          title={'Edit Profile'}
          closeOnOutSideClick={false}
        >
          <ProfileForm
            onSubmitSuccessfully={(p) => {
              setMyProfile(p);
              setProfilePictureDrawer(false);
            }}
            template={getProfileFormInitialValues(myProfile)}
            profileFormSections={[]}
            documentFormSection={[profilePhotoSection]}
            documentSectionHeader="Profile photo"
            onClickCancel={() => setProfilePictureDrawer(false)}
          />
        </CustomDrawer>
      )}
    </>
  );
}

export default Profile;

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function CustomTabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `simple-tab-${index}`,
    'aria-controls': `simple-tabpanel-${index}`,
  };
}
