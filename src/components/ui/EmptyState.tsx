import { Box, Typography, Button, Stack } from '@mui/material';
import { IconInbox } from '@tabler/icons-react';
import { motion } from 'framer-motion';
import { fadeInUp } from '../../theme/animations';
import { tokens } from '../../theme/theme';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

const MotionStack = motion.create(Stack);

export default function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <MotionStack
      variants={fadeInUp}
      initial="initial"
      animate="animate"
      alignItems="center"
      justifyContent="center"
      spacing={2}
      sx={{ py: 8, px: 4 }}
    >
      <Box
        sx={{
          width: 72,
          height: 72,
          borderRadius: 4,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: tokens.gradients.aiSubtle,
          color: tokens.colors.primary,
          mb: 1,
        }}
      >
        {icon || <IconInbox size={32} />}
      </Box>

      <Typography variant="h4" textAlign="center" color="text.primary">
        {title}
      </Typography>

      {description && (
        <Typography
          variant="body2"
          textAlign="center"
          color="text.secondary"
          maxWidth={400}
        >
          {description}
        </Typography>
      )}

      {actionLabel && onAction && (
        <Button variant="contained" onClick={onAction} sx={{ mt: 1 }}>
          {actionLabel}
        </Button>
      )}
    </MotionStack>
  );
}
