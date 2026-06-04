import React, { useEffect, useState } from 'react';
import CustomDrawer from '../../../components/drawer/CustomDrawer';
import {
  Box,
  Button,
  Tab,
  Tabs,
  Typography,
  useMediaQuery,
  useTheme,
  alpha,
  IconButton,
  Tooltip,
  CircularProgress,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
} from '@mui/material';
import {
  IconEdit,
  IconRefresh,
  IconUser,
  IconBuildingBank,
  IconFileText,
  IconMapPin,
  IconId,
  IconX,
} from '@tabler/icons-react';
import { motion } from 'framer-motion';
import ProfileForm from './ProfileForm';
import MyAvatar from '../../../components/profile/myAvatar/MyAvatar';
import ProfileDetails from '../../../components/profile/ProfileDetails';
import Address from '../../../components/profile/Address';
import Documents from '../../../components/profile/Documents';
import BankDetailsComponent from '../../../components/profile/BankDetails';
import { useAuth } from '../../../AuthGaurd/AuthContextProvider';
import {
  documentFormSection,
  getProfileFormInitialValues,
  profileFormSections,
} from './constants';
import { tokens } from '../../../theme/theme';
import SkeletonLoader from '../../../components/ui/SkeletonLoader';
import { fadeInUp } from '../../../theme/animations';
import { uploadFile } from '../../../services/storageApi';
import { updateProfile } from '../../../services/userProfileApi';
import { toast } from 'react-toastify';

const MotionBox = motion.create(Box);

const tabConfig = [
  { label: 'Personal', icon: <IconUser size={16} /> },
  { label: 'Bank', icon: <IconBuildingBank size={16} /> },
  { label: 'Documents', icon: <IconFileText size={16} /> },
  { label: 'Permanent Address', icon: <IconMapPin size={16} /> },
  { label: 'Communication Address', icon: <IconMapPin size={16} /> },
];

function Profile() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [profilePictureDrawer, setProfilePictureDrawer] = useState(false);
  const [value, setValue] = React.useState(0);
  const { myProfileState, iUser } = useAuth();

  // Self-profile editing is open by default for every authenticated user
  // — this is their OWN profile, and the old `iUser.canEdit` gate (which
  // defaults to `false` on the User schema and only flips when super-admin
  // toggles it via User Management) was over-restrictive here: the
  // Edit Profile button and the avatar's photo-edit affordance just
  // never appeared for the vast majority of accounts.
  //
  // The `canEdit` flag is still meaningful elsewhere — admin / super-admin
  // can lock down a SPECIFIC user via the User Management drawer, and
  // routes that surface OTHER users' profiles still respect it. Here,
  // we only need to check the viewer is authenticated.
  const canEdit = !!iUser;

  const handleChange = (_: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };

  useEffect(() => {
    myProfileState?.loadData();
  }, []);

  if (!myProfileState || myProfileState.loading) {
    return <SkeletonLoader variant="form" />;
  }

  const {
    error,
    data: myProfile,
    loadData: getMyProfile,
    setData: setMyProfile,
  } = myProfileState;

  if (error) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300, gap: 1.5 }}>
        <IconButton onClick={getMyProfile}>
          <IconRefresh size={20} color={tokens.colors.blue} />
        </IconButton>
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  return (
    <>
      {/* Profile Hero Section */}
      <MotionBox
        variants={fadeInUp}
        initial="initial"
        animate="animate"
        sx={{
          position: 'relative',
          borderRadius: 4,
          overflow: 'hidden',
          mb: 3,
        }}
      >
        {/* Cover / Banner */}
        <Box
          sx={{
            height: { xs: 140, sm: 180 },
            background: tokens.gradients.darkSurface,
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Decorative orbs */}
          <Box
            sx={{
              position: 'absolute',
              top: -40,
              right: '10%',
              width: 250,
              height: 250,
              borderRadius: '50%',
              background: `radial-gradient(circle, ${alpha(tokens.colors.pink, 0.25)} 0%, transparent 70%)`,
              filter: 'blur(50px)',
            }}
          />
          <Box
            sx={{
              position: 'absolute',
              bottom: -60,
              left: '20%',
              width: 200,
              height: 200,
              borderRadius: '50%',
              background: `radial-gradient(circle, ${alpha(tokens.colors.blue, 0.2)} 0%, transparent 70%)`,
              filter: 'blur(40px)',
            }}
          />
          <Box
            sx={{
              position: 'absolute',
              top: '30%',
              right: '35%',
              width: 120,
              height: 120,
              borderRadius: '50%',
              background: `radial-gradient(circle, ${alpha(tokens.colors.yellow, 0.12)} 0%, transparent 70%)`,
              filter: 'blur(30px)',
            }}
          />
          {/* Brand gradient line at top */}
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: 3,
              background: tokens.gradients.brand,
            }}
          />
        </Box>

        {/* Profile info card overlay */}
        <Box
          sx={{
            bgcolor: 'background.paper',
            borderRadius: 4,
            border: '1px solid',
            borderColor: 'divider',
            mx: { xs: 1.5, sm: 3 },
            mt: -8,
            position: 'relative',
            zIndex: 1,
            p: { xs: 2, sm: 3 },
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            alignItems: { xs: 'center', sm: 'flex-end' },
            gap: { xs: 2, sm: 3 },
          }}
        >
          {/* Avatar */}
          <Box sx={{ mt: { xs: -6, sm: -7 } }}>
            <MyAvatar
              editable={canEdit}
              avatar={myProfile?.photo}
              onEdit={() => setProfilePictureDrawer(!profilePictureDrawer)}
            />
          </Box>

          {/* Name & meta */}
          <Box sx={{ flex: 1, textAlign: { xs: 'center', sm: 'left' }, minWidth: 0 }}>
            <Typography variant="h3" fontWeight={700} color="text.primary" noWrap>
              {myProfile?.name || 'N/A'}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5, justifyContent: { xs: 'center', sm: 'flex-start' }, flexWrap: 'wrap' }}>
              {myProfile?.employeeId && (
                <Chip
                  icon={<IconId size={14} />}
                  label={myProfile.employeeId}
                  size="small"
                  sx={{
                    bgcolor: alpha(tokens.colors.blue, 0.08),
                    color: tokens.colors.blue,
                    fontWeight: 600,
                    fontSize: '0.75rem',
                  }}
                />
              )}
              {myProfile?.email?.official && (
                <Typography variant="caption" color="text.secondary" noWrap>
                  {myProfile.email.official}
                </Typography>
              )}
            </Box>
          </Box>

          {/* Edit button */}
          {canEdit && (
            <Button
              variant="contained"
              startIcon={<IconEdit size={16} />}
              onClick={() => setDrawerOpen(true)}
              size="small"
              sx={{ flexShrink: 0 }}
            >
              Edit Profile
            </Button>
          )}
        </Box>
      </MotionBox>

      {/* Tabs Section */}
      <MotionBox
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.35 }}
        sx={{
          bgcolor: 'background.paper',
          borderRadius: 4,
          border: '1px solid',
          borderColor: 'divider',
          overflow: 'hidden',
        }}
      >
        <Box sx={{ borderBottom: 1, borderColor: 'divider', px: { xs: 1, sm: 2 } }}>
          <Tabs
            value={value}
            onChange={handleChange}
            variant={isMobile ? 'scrollable' : 'standard'}
            scrollButtons="auto"
            sx={{
              '& .MuiTab-root': {
                minHeight: 48,
                textTransform: 'none',
                fontWeight: 500,
                fontSize: '0.8125rem',
                gap: 0.75,
              },
              '& .Mui-selected': {
                color: `${tokens.colors.pink} !important`,
              },
              '& .MuiTabs-indicator': {
                height: 2.5,
                borderRadius: '2px 2px 0 0',
                bgcolor: tokens.colors.pink,
              },
            }}
          >
            {tabConfig.map((tab, i) => (
              <Tab
                key={i}
                icon={tab.icon}
                iconPosition="start"
                label={tab.label}
                id={`profile-tab-${i}`}
                aria-controls={`profile-tabpanel-${i}`}
              />
            ))}
          </Tabs>
        </Box>

        {/* Tab content */}
        <Box sx={{ p: { xs: 2, sm: 3 } }}>
          <TabPanel value={value} index={0}>
            <ProfileDetails />
          </TabPanel>
          <TabPanel value={value} index={1}>
            <BankDetailsComponent />
          </TabPanel>
          <TabPanel value={value} index={2}>
            <Documents />
          </TabPanel>
          <TabPanel value={value} index={3}>
            {!!myProfile?.permanentAddress && (
              <Address address={myProfile.permanentAddress} />
            )}
          </TabPanel>
          <TabPanel value={value} index={4}>
            {!!myProfile?.communicationAddress && (
              <Address address={myProfile.communicationAddress} />
            )}
          </TabPanel>
        </Box>
      </MotionBox>

      {/* Edit Drawers */}
      {!!myProfile && (
        <CustomDrawer
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          title="Edit Profile"
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
      {/* Profile Photo Modal */}
      {!!myProfile && (
        <ProfilePhotoModal
          open={profilePictureDrawer}
          onClose={() => setProfilePictureDrawer(false)}
          currentPhoto={myProfile.photo}
          profileId={myProfile._id}
          onSuccess={(updatedProfile) => {
            setMyProfile(updatedProfile);
            setProfilePictureDrawer(false);
          }}
        />
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

function TabPanel({ children, value, index }: TabPanelProps) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`profile-tabpanel-${index}`}
      aria-labelledby={`profile-tab-${index}`}
    >
      {value === index && children}
    </div>
  );
}

// ── Profile Photo Upload Modal ──
import { UserProfile } from '../../../Interfaces/profile';
import {
  IconCloudUpload,
  IconTrash,
} from '@tabler/icons-react';

interface ProfilePhotoModalProps {
  open: boolean;
  onClose: () => void;
  currentPhoto?: string;
  profileId: string;
  onSuccess: (profile: UserProfile) => void;
}

function ProfilePhotoModal({ open, onClose, currentPhoto, profileId, onSuccess }: ProfilePhotoModalProps) {
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
  const [preview, setPreview] = React.useState<string>(currentPhoto || '');
  const [uploading, setUploading] = React.useState(false);

  React.useEffect(() => {
    if (open) {
      setSelectedFile(null);
      setPreview(currentPhoto || '');
    }
  }, [open, currentPhoto]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size should be less than 5MB');
      return;
    }
    setSelectedFile(file);
    setPreview(URL.createObjectURL(file));
  };

  const handleRemove = () => {
    setSelectedFile(null);
    setPreview('');
  };

  const handleSubmit = async () => {
    setUploading(true);
    try {
      let photoUrl = currentPhoto || '';

      if (selectedFile) {
        const { data: uploadData } = await uploadFile(selectedFile);
        photoUrl = uploadData.data.url;
      }

      const { data } = await updateProfile(profileId, { photo: photoUrl } as any);
      if (data.error || !data.data) {
        toast.error(data.error || 'Something went wrong');
        return;
      }
      toast.success('Profile photo updated');
      onSuccess(data.data);
    } catch (error) {
      toast.error('Failed to update profile photo');
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: '16px',
          boxShadow: '0px 7px 30px 0px rgba(90, 114, 123, 0.11)',
          overflow: 'hidden',
        },
      }}
    >
      {/* Header */}
      <DialogTitle
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          py: 2,
          px: 3,
        }}
      >
        <Typography variant="h6" fontWeight={700} color="#2A3547">
          Update Profile Photo
        </Typography>
        <IconButton onClick={onClose} size="small" sx={{ color: 'text.secondary' }}>
          <IconX size={18} />
        </IconButton>
      </DialogTitle>

      {/* Content */}
      <DialogContent sx={{ p: 3 }}>
        {preview ? (
          /* Photo preview */
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
            <Box
              sx={{
                width: 160,
                height: 160,
                borderRadius: '50%',
                overflow: 'hidden',
                border: '4px solid',
                borderColor: 'grey.200',
              }}
            >
              <img
                src={preview}
                alt="Preview"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </Box>

            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="outlined"
                component="label"
                size="small"
                sx={{
                  borderColor: 'grey.300',
                  color: '#5A6A85',
                  textTransform: 'none',
                  borderRadius: '8px',
                  fontSize: '0.8125rem',
                }}
              >
                Change
                <input type="file" accept="image/*" hidden onChange={handleFileChange} />
              </Button>
              <Button
                variant="outlined"
                size="small"
                onClick={handleRemove}
                sx={{
                  borderColor: alpha('#EF4444', 0.3),
                  color: '#EF4444',
                  textTransform: 'none',
                  borderRadius: '8px',
                  fontSize: '0.8125rem',
                  '&:hover': { borderColor: '#EF4444', bgcolor: alpha('#EF4444', 0.04) },
                }}
                startIcon={<IconTrash size={14} />}
              >
                Remove
              </Button>
            </Box>
          </Box>
        ) : (
          /* Empty upload area */
          <Box
            component="label"
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              py: 5,
              px: 3,
              borderRadius: 3,
              border: '2px dashed',
              borderColor: 'grey.300',
              bgcolor: '#F6F9FC',
              cursor: 'pointer',
              transition: 'all 0.2s',
              '&:hover': {
                borderColor: tokens.colors.blue,
                bgcolor: alpha(tokens.colors.blue, 0.04),
              },
            }}
          >
            <IconCloudUpload size={40} color={tokens.colors.blue} style={{ opacity: 0.6, marginBottom: 12 }} />
            <Typography variant="body2" fontWeight={600} color={tokens.colors.blue}>
              Click to upload photo
            </Typography>
            <Typography variant="caption" color="text.secondary" mt={0.5}>
              JPG, PNG — Max 5MB
            </Typography>
            <input type="file" accept="image/*" hidden onChange={handleFileChange} />
          </Box>
        )}
      </DialogContent>

      {/* Footer */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'flex-end',
          gap: 1.5,
          px: 3,
          py: 2,
        }}
      >
        <Button
          variant="outlined"
          onClick={onClose}
          sx={{
            borderColor: 'grey.300',
            color: '#5A6A85',
            textTransform: 'none',
            fontWeight: 600,
            borderRadius: '10px',
            px: 3,
          }}
        >
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={uploading || (!selectedFile && !preview)}
          sx={{
            bgcolor: '#032840',
            color: '#fff',
            '&:hover': { bgcolor: '#0A3555' },
            textTransform: 'none',
            fontWeight: 600,
            borderRadius: '10px',
            px: 3,
            boxShadow: 'none',
          }}
        >
          {uploading ? (
            <CircularProgress size={18} sx={{ color: '#fff' }} />
          ) : (
            'Save'
          )}
        </Button>
      </Box>
    </Dialog>
  );
}
