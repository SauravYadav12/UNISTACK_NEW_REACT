import { CardProps, useTheme } from '@mui/material';
import { forwardRef } from 'react';
import { motion } from 'framer-motion';

interface GlassCardProps extends Omit<CardProps, 'component'> {
  blur?: number;
  opacity?: number;
  hoverLift?: boolean;
  gradient?: string;
}

const GlassCard = forwardRef<HTMLDivElement, GlassCardProps>(
  ({ blur = 20, opacity, hoverLift = false, gradient, sx, children, ...props }, ref) => {
    const theme = useTheme();
    const isDark = theme.palette.mode === 'dark';
    const bgOpacity = opacity ?? (isDark ? 0.78 : 0.72);

    const bgColor = isDark
      ? `rgba(26, 29, 39, ${bgOpacity})`
      : `rgba(255, 255, 255, ${bgOpacity})`;

    const borderColor = isDark
      ? 'rgba(255, 255, 255, 0.06)'
      : 'rgba(255, 255, 255, 0.18)';

    return (
      <motion.div
        ref={ref}
        initial={hoverLift ? { y: 0 } : undefined}
        whileHover={hoverLift ? { y: -3, transition: { duration: 0.25 } } : undefined}
        style={{
          background: gradient || bgColor,
          backdropFilter: `blur(${blur}px)`,
          WebkitBackdropFilter: `blur(${blur}px)`,
          border: `1px solid ${borderColor}`,
          borderRadius: 16,
          transition: 'box-shadow 0.25s ease',
        }}
      >
        {children}
      </motion.div>
    );
  }
);

GlassCard.displayName = 'GlassCard';
export default GlassCard;
