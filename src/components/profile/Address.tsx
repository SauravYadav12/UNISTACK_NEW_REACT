import { useEffect, useState } from 'react';
import {
  CommunicationAddress,
  MyDetail,
  PermanentAddress,
} from '../../Interfaces/profile';
import { Box, Grid, Typography, alpha } from '@mui/material';
import { Country } from 'country-state-city';
import { tokens } from '../../theme/theme';
import {
  IconMapPin,
  IconMap2,
  IconBuilding,
  IconWorld,
  IconMailbox,
  IconHome,
} from '@tabler/icons-react';

const addressIcons = [
  <IconHome size={16} />,
  <IconMap2 size={16} />,
  <IconBuilding size={16} />,
  <IconMapPin size={16} />,
  <IconWorld size={16} />,
  <IconMailbox size={16} />,
];

const Address = ({
  address,
}: {
  address: PermanentAddress | CommunicationAddress;
}) => {
  const [addressSchema, setAddressSchema] = useState<MyDetail[]>([]);

  useEffect(() => {
    const schema: MyDetail[] = [
      { label: 'Address 1', value: address.address1 },
      { label: 'Address 2', value: address.address2 },
      { label: 'City', value: address.city },
      { label: 'State', value: address.state },
      {
        label: 'Country',
        value: address.country
          ? `${Country.getCountryByCode(address.country)?.name} (${address.country})`
          : '',
      },
      { label: 'Zip / Pin', value: address['zip/pin'] },
    ];
    setAddressSchema(schema);
  }, [address]);

  return (
    <Grid container spacing={2}>
      {addressSchema.map((detail, i) => (
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
              {addressIcons[i] || <IconMapPin size={16} />}
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

export default Address;
