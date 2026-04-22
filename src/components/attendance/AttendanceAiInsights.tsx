import { Box, Typography, alpha } from '@mui/material';
import { IconTrendingUp, IconAlertTriangle, IconSparkles } from '@tabler/icons-react';
import { motion } from 'framer-motion';
import GlassCard from '../ui/GlassCard';
import { AiBadge } from '../ui/AiSparkle';
import { tokens } from '../../theme/theme';
import { staggerContainer, staggerItem } from '../../theme/animations';

const MotionBox = motion.create(Box);

interface InsightItem {
  type: 'info' | 'warning' | 'success';
  text: string;
}

interface AttendanceAiInsightsProps {
  insights?: InsightItem[];
}

const defaultInsights: InsightItem[] = [
  { type: 'success', text: 'Your attendance rate is tracking well this month.' },
  { type: 'info', text: 'AI attendance insights will be available once more data is collected.' },
];

export default function AttendanceAiInsights({ insights }: AttendanceAiInsightsProps) {
  const items = insights?.length ? insights : defaultInsights;

  const getIcon = (type: InsightItem['type']) => {
    switch (type) {
      case 'warning':
        return <IconAlertTriangle size={16} />;
      case 'success':
        return <IconTrendingUp size={16} />;
      default:
        return <IconSparkles size={16} />;
    }
  };

  const getColor = (type: InsightItem['type']) => {
    switch (type) {
      case 'warning':
        return tokens.colors.warning;
      case 'success':
        return tokens.colors.success;
      default:
        return tokens.colors.primary;
    }
  };

  return (
    <GlassCard sx={{ p: 2.5 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <Typography variant="h6" fontWeight={600}>
          Insights
        </Typography>
        <AiBadge />
      </Box>

      <MotionBox
        variants={staggerContainer}
        initial="initial"
        animate="animate"
        sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}
      >
        {items.map((item, i) => (
          <MotionBox
            key={i}
            variants={staggerItem}
            sx={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 1.5,
              p: 1.5,
              borderRadius: 2.5,
              bgcolor: alpha(getColor(item.type), 0.06),
            }}
          >
            <Box sx={{ color: getColor(item.type), mt: 0.25 }}>
              {getIcon(item.type)}
            </Box>
            <Typography variant="body2" color="text.secondary">
              {item.text}
            </Typography>
          </MotionBox>
        ))}
      </MotionBox>
    </GlassCard>
  );
}
