import { Box, Typography, Skeleton, IconButton, Tooltip, alpha, Chip } from '@mui/material';
import { IconRefresh, IconSparkles, IconArrowRight } from '@tabler/icons-react';
import { motion } from 'framer-motion';
import { tokens } from '../../theme/theme';

interface AiDailyBriefingProps {
  loading?: boolean;
  insights?: { text: string; type: 'pink' | 'blue' | 'yellow' | 'default' }[];
  onRefresh?: () => void;
  userName?: string;
}

const MotionBox = motion.create(Box);

export default function AiDailyBriefing({ loading, insights, onRefresh, userName }: AiDailyBriefingProps) {
  const defaultInsights: AiDailyBriefingProps['insights'] = [
    { text: 'AI insights loading...', type: 'default' },
  ];

  const items = insights?.length ? insights : defaultInsights;

  const typeColor: Record<string, string> = {
    pink: tokens.colors.pink,
    blue: tokens.colors.blue,
    yellow: tokens.colors.yellowDark,
    default: alpha('#FFFFFF', 0.6),
  };

  return (
    <Box
      sx={{
        position: 'relative',
        borderRadius: 4,
        overflow: 'hidden',
        background: tokens.gradients.darkSurface,
        p: { xs: 2.5, sm: 3.5 },
        color: '#FFFFFF',
      }}
    >
      {/* Decorative gradient orbs */}
      <Box
        sx={{
          position: 'absolute',
          top: -40,
          right: -30,
          width: 200,
          height: 200,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${alpha(tokens.colors.pink, 0.2)} 0%, transparent 70%)`,
          filter: 'blur(40px)',
          pointerEvents: 'none',
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          bottom: -30,
          left: '30%',
          width: 160,
          height: 160,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${alpha(tokens.colors.blue, 0.15)} 0%, transparent 70%)`,
          filter: 'blur(30px)',
          pointerEvents: 'none',
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          top: '50%',
          right: '20%',
          width: 100,
          height: 100,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${alpha(tokens.colors.yellow, 0.1)} 0%, transparent 70%)`,
          filter: 'blur(25px)',
          pointerEvents: 'none',
        }}
      />

      {/* Top brand gradient line */}
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

      {/* Content */}
      <Box sx={{ position: 'relative', zIndex: 1 }}>
        {/* Header row */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box
              sx={{
                width: 36,
                height: 36,
                borderRadius: 2.5,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: tokens.gradients.pinkBlue,
                boxShadow: tokens.shadows.aiGlow,
              }}
            >
              <IconSparkles size={18} color="#FFFFFF" />
            </Box>
            <Box>
              <Typography variant="h5" fontWeight={700} sx={{ color: '#FFFFFF' }}>
                AI Daily Briefing
              </Typography>
              <Typography variant="caption" sx={{ color: alpha('#FFFFFF', 0.5) }}>
                Your personalized summary
              </Typography>
            </Box>
          </Box>
          {onRefresh && (
            <Tooltip title="Refresh">
              <IconButton
                onClick={onRefresh}
                size="small"
                sx={{ color: alpha('#FFFFFF', 0.5), '&:hover': { color: '#FFFFFF' } }}
              >
                <IconRefresh size={16} />
              </IconButton>
            </Tooltip>
          )}
        </Box>

        {/* Insight items */}
        {loading ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {[90, 75, 60].map((w) => (
              <Skeleton
                key={w}
                variant="rounded"
                height={20}
                width={`${w}%`}
                sx={{ bgcolor: alpha('#FFFFFF', 0.08) }}
              />
            ))}
          </Box>
        ) : (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {items.map((item, i) => (
              <MotionBox
                key={i}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1, duration: 0.35 }}
              >
                <Chip
                  icon={
                    <Box
                      sx={{
                        width: 6,
                        height: 6,
                        borderRadius: '50%',
                        bgcolor: typeColor[item.type],
                        ml: 0.5,
                        boxShadow: `0 0 6px ${typeColor[item.type]}`,
                      }}
                    />
                  }
                  label={item.text}
                  sx={{
                    bgcolor: alpha('#FFFFFF', 0.08),
                    color: alpha('#FFFFFF', 0.85),
                    border: `1px solid ${alpha('#FFFFFF', 0.06)}`,
                    fontWeight: 500,
                    fontSize: '0.8rem',
                    height: 36,
                    cursor: 'default',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      bgcolor: alpha('#FFFFFF', 0.12),
                      borderColor: alpha(typeColor[item.type], 0.3),
                    },
                    '& .MuiChip-icon': { mr: 0.5 },
                  }}
                />
              </MotionBox>
            ))}
          </Box>
        )}
      </Box>
    </Box>
  );
}
