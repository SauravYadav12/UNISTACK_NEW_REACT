import { useEffect, useState } from 'react';
import { MyDetail } from '../../Interfaces/profile';
import { useAuth } from '../../AuthGaurd/AuthContextProvider';
import { Box, Grid, Typography, alpha } from '@mui/material';
import { tokens } from '../../theme/theme';
import {
  IconUser,
  IconHash,
  IconBuilding,
  IconCode,
  IconWorld,
  IconMapPin,
} from '@tabler/icons-react';

const bankIcons = [
  <IconUser size={16} />,
  <IconHash size={16} />,
  <IconCode size={16} />,
  <IconWorld size={16} />,
  <IconBuilding size={16} />,
  <IconMapPin size={16} />,
];

const BankDetailsComponent = () => {
  const { myProfile } = useAuth();
  const [bankDetails, setBankDetails] = useState<MyDetail[]>([]);

  useEffect(() => {
    const schema: MyDetail[] = [
      { label: 'Account Name', value: myProfile?.bankDetails.accountName },
      { label: 'Account Number', value: myProfile?.bankDetails.accountNumber },
      { label: 'IFSC Code', value: myProfile?.bankDetails.ifscCode },
      { label: 'Swift Code', value: myProfile?.bankDetails.swiftCode },
      { label: 'Bank Name', value: myProfile?.bankDetails.bankName },
      { label: 'Bank Address', value: myProfile?.bankDetails.bankAddress },
    ];
    setBankDetails(schema);
  }, [myProfile]);

  return (
    <Grid container spacing={2}>
      {bankDetails.map((detail, i) => (
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
                borderColor: alpha(tokens.colors.pink, 0.2),
                bgcolor: alpha(tokens.colors.pink, 0.03),
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
                bgcolor: alpha(tokens.colors.pink, 0.08),
                color: tokens.colors.pink,
                flexShrink: 0,
                mt: 0.25,
              }}
            >
              {bankIcons[i] || <IconBuilding size={16} />}
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

export default BankDetailsComponent;
