import { Box, Typography, Stack } from '@mui/material';
import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { fadeInUp } from '../../theme/animations';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  actions?: ReactNode;
}

const MotionBox = motion.create(Box);

export default function PageHeader({ title, subtitle, icon, actions }: PageHeaderProps) {
  return (
    <MotionBox
      variants={fadeInUp}
      initial="initial"
      animate="animate"
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        mb: 3,
        flexWrap: 'wrap',
        gap: 2,
      }}
    >
      <Stack direction="row" alignItems="center" spacing={1.5}>
        {icon && (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              color: 'primary.main',
            }}
          >
            {icon}
          </Box>
        )}
        <Box>
          <Typography variant="h2" color="text.primary">
            {title}
          </Typography>
          {subtitle && (
            <Typography variant="body2" color="text.secondary" mt={0.25}>
              {subtitle}
            </Typography>
          )}
        </Box>
      </Stack>

      {actions && (
        <Stack direction="row" alignItems="center" spacing={1}>
          {actions}
        </Stack>
      )}
    </MotionBox>
  );
}
