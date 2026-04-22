import { Box, BoxProps } from '@mui/material';
import { motion } from 'framer-motion';
import { tokens } from '../../theme/theme';

interface AiSparkleProps extends BoxProps {
  size?: 'sm' | 'md' | 'lg';
  animate?: boolean;
}

const sizes = {
  sm: { dot: 4, glow: 8 },
  md: { dot: 6, glow: 14 },
  lg: { dot: 8, glow: 20 },
};

const MotionBox = motion.create(Box);

export default function AiSparkle({
  size = 'sm',
  animate = true,
  sx,
  ...props
}: AiSparkleProps) {
  const { dot, glow } = sizes[size];

  return (
    <Box
      sx={{
        position: 'relative',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: dot + glow,
        height: dot + glow,
        ...sx,
      }}
      {...props}
    >
      {/* Glow ring */}
      {animate && (
        <MotionBox
          animate={{
            scale: [1, 1.6, 1],
            opacity: [0.5, 0, 0.5],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          sx={{
            position: 'absolute',
            width: dot + glow,
            height: dot + glow,
            borderRadius: '50%',
            background: tokens.gradients.ai,
          }}
        />
      )}

      {/* Core dot */}
      <Box
        sx={{
          width: dot,
          height: dot,
          borderRadius: '50%',
          background: tokens.gradients.ai,
          zIndex: 1,
        }}
      />
    </Box>
  );
}

// AI gradient badge for labeling AI-powered features
export function AiBadge({ label = 'AI', sx }: { label?: string; sx?: BoxProps['sx'] }) {
  return (
    <Box
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 0.5,
        px: 1,
        py: 0.25,
        borderRadius: 3,
        background: tokens.gradients.aiSubtle,
        fontSize: '0.6875rem',
        fontWeight: 600,
        letterSpacing: '0.04em',
        color: tokens.colors.primary,
        ...sx,
      }}
    >
      <AiSparkle size="sm" animate={false} />
      {label}
    </Box>
  );
}
