import React, { useEffect, useState } from 'react';
import CustomDrawer from '../../../components/drawer/CustomDrawer';
import { Box, Button, Tab, Tabs, Typography } from '@mui/material';
import { ModeEditOutline } from '@mui/icons-material';
import ProfileForm from './ProfileForm';
import MyAvatar from '../../../components/profile/myAvatar/MyAvatar';
import ProfileDetails from '../../../components/profile/ProfileDetails';
import Address from '../../../components/profile/Address';
import Documents from '../../../components/profile/Documents';
import BankDetailsComponent from '../../../components/profile/BankDetails';
import { useAuth } from '../../../AuthGaurd/AuthContextProvider';
import CircularProgress from '@mui/material/CircularProgress';
import { FaRegIdBadge } from 'react-icons/fa';
import './profile.css';
function Profile() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [value, setValue] = React.useState(0);
  const { myProfile, getMyProfile } = useAuth();

  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };

  useEffect(() => {
    getMyProfile();
  }, []);
  if (!myProfile)
    return (
      <Box className="loader">
        <CircularProgress />
      </Box>
    );
  return (
    <>
      <div style={{ marginRight: 25 }}>
        <Box
          className="top-container"
          sx={{
            bgcolor: 'primary.main',
            '&:hover': {
              bgcolor: 'primary.dark',
            },
          }}
        />
      </div>
      <div style={{ marginRight: 25 }}>
        <Box className="middle-container">
          <Box
            sx={{
              width: `33%`,
              height: 100,
            }}
          >
            <Box className="left-box">
              <FaRegIdBadge color="#032840" fontSize={17} />
              <Typography variant="h6">
                {myProfile?.employeeId || 'G17275HH1'}
              </Typography>
            </Box>
          </Box>
          <Box className="middle-box">
            <MyAvatar avatar={myProfile?.photo} />
            <Box className="profile-name">
              <span>{myProfile?.name}</span>
            </Box>
          </Box>

          <Box className="right-box">
            <Button
              variant="contained"
              style={{ marginRight: 25, float: 'right', borderRadius: '10px' }}
              onClick={() => setDrawerOpen(true)}
              size="small"
            >
              <ModeEditOutline
                style={{ paddingRight: '8px', width: '16px', height: '16px' }}
              />{' '}
              <span>Edit</span>
            </Button>
          </Box>
        </Box>
      </div>
      <div style={{ marginRight: 25 }}>
        <Box>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs
              value={value}
              onChange={handleChange}
              aria-label="basic tabs example"
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
          title={'Profile Details'}
        >
          <ProfileForm
            template={myProfile}
            onClose={() => setDrawerOpen(false)}
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
