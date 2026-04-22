import { useEffect, useState } from 'react';
import { useAuth } from '../../AuthGaurd/AuthContextProvider';
import { MyDetail } from '../../Interfaces/profile';
import { Box, Grid, Typography, alpha } from '@mui/material';
import dayjs from 'dayjs';
import { dateFormate } from '../constants';
import { tokens } from '../../theme/theme';
import {
  IconUser,
  IconCalendar,
  IconMail,
  IconMailOpened,
  IconPhone,
  IconPhoneCall,
  IconId,
  IconCreditCard,
} from '@tabler/icons-react';

const detailIcons = [
  <IconUser size={16} />,
  <IconCalendar size={16} />,
  <IconMail size={16} />,
  <IconMailOpened size={16} />,
  <IconPhone size={16} />,
  <IconPhoneCall size={16} />,
  <IconId size={16} />,
  <IconCreditCard size={16} />,
];

const ProfileDetails = () => {
  const { myProfile } = useAuth();
  const [myDetails, setMyDetails] = useState<MyDetail[]>([]);

  useEffect(() => {
    const schema: MyDetail[] = [
      { label: 'Name', value: myProfile?.name },
      { label: 'Date of Birth', value: myProfile?.dob ? dayjs(myProfile.dob).format(dateFormate) : '' },
      { label: 'Personal Email', value: myProfile?.email.personal },
      { label: 'Official Email', value: myProfile?.email.official },
      { label: 'Phone Number', value: myProfile?.phoneNumber },
      { label: 'Emergency Phone', value: myProfile?.emergencyPhoneNumber },
      { label: 'Aadhar Number', value: myProfile?.aadharNumber },
      { label: 'PAN Number', value: myProfile?.panNumber },
    ];
    setMyDetails(schema);
  }, [myProfile]);

  return (
    <Grid container spacing={2}>
      {myDetails.map((detail, i) => (
        <Grid key={i} size={{ xs: 12, sm: 6, md: 4 }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 1.5,
              p: 2,
              borderRadius: 3,
              bgcolor: alpha(tokens.colors.lightSurfaceAlt, 0.5),
              border: '1px solid',
              borderColor: 'divider',
              transition: 'all 0.2s ease',
              '&:hover': {
                borderColor: alpha(tokens.colors.blue, 0.2),
                bgcolor: alpha(tokens.colors.blue, 0.03),
              },
            }}
          >
            <Box
              sx={{
                width: 32,
                height: 32,
                borderRadius: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: alpha(tokens.colors.blue, 0.08),
                color: tokens.colors.blue,
                flexShrink: 0,
                mt: 0.25,
              }}
            >
              {detailIcons[i] || <IconUser size={16} />}
            </Box>
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'capitalize' }}>
                {detail.label}
              </Typography>
              <Typography variant="body2" fontWeight={600} color="text.primary" noWrap>
                {detail.value || 'N/A'}
              </Typography>
            </Box>
          </Box>
        </Grid>
      ))}
    </Grid>
  );
};

export default ProfileDetails;
