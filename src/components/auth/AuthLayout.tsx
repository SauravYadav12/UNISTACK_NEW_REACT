import { Box, Typography, alpha, Stack } from '@mui/material';
import { motion } from 'framer-motion';

const MotionImg = motion.img;
import { ReactNode } from 'react';
import { tokens } from '../../theme/theme';
import { scaleIn } from '../../theme/animations';
import unistack_small_Img from '../../assets/unistack_small.png';

interface AuthLayoutProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  /**
   * Uppercase caption shown in the glass pill on the left brand hero.
   * Defaults to login copy.
   */
  eyebrow?: string;
  /**
   * Short pill label above the form title on desktop (e.g. "LOGIN", "SIGN UP").
   */
  chip?: string;
  /**
   * Soft tagline paragraph below the big wordmark on the left hero.
   * Defaults to login copy.
   */
  tagline?: ReactNode;
}

const MotionBox = motion.create(Box);

/**
 * Brand wordmark — UNI + colorful robot mascot (as the 'S') + TACK, all in
 * white Orbitron. Matches the sidebar logo so the brand reads the same
 * everywhere in the app.
 */
function BrandMark({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizes = {
    sm: { fs: '1.4rem', img: 30 },
    md: { fs: '2.25rem', img: 48 },
    lg: { fs: '3.25rem', img: 72 },
  };
  const s = sizes[size];
  return (
    <Box
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: size === 'lg' ? 0.5 : 0.25,
        lineHeight: 1,
        userSelect: 'none',
      }}
    >
      <Typography
        component="span"
        sx={{
          color: '#FFFFFF',
          fontFamily: '"Orbitron", "Inter Variable", "Inter", sans-serif',
          fontWeight: 800,
          fontSize: s.fs,
          letterSpacing: '0.04em',
          lineHeight: 1,
        }}
      >
        UNI
      </Typography>
      <MotionImg
        src={unistack_small_Img}
        alt="S"
        animate={{ y: [0, -4, 0] }}
        transition={{ duration: 3.5, ease: 'easeInOut', repeat: Infinity }}
        style={{
          width: s.img,
          height: s.img,
          objectFit: 'contain',
          flexShrink: 0,
          filter:
            size === 'lg'
              ? `drop-shadow(0 8px 24px ${alpha('#000', 0.4)})`
              : undefined,
        }}
      />
      <Typography
        component="span"
        sx={{
          color: '#FFFFFF',
          fontFamily: '"Orbitron", "Inter Variable", "Inter", sans-serif',
          fontWeight: 800,
          fontSize: s.fs,
          letterSpacing: '0.04em',
          lineHeight: 1,
        }}
      >
        TACK
      </Typography>
    </Box>
  );
}

export default function AuthLayout({
  children,
  title,
  subtitle,
  eyebrow = 'SYSTEM ONLINE · AWAITING CREDENTIALS',
  chip = 'LOGIN',
  tagline = (
    <>
      Welcome back to your command center.
      <br />
      Requirements, interviews, and your whole team — all in one place.
    </>
  ),
}: AuthLayoutProps) {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        position: 'relative',
        overflow: 'hidden',
        bgcolor: tokens.colors.brand,
      }}
    >
      {/* ── Left panel — brand hero ── */}
      <Box
        sx={{
          display: { xs: 'none', md: 'flex' },
          flex: 1,
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          position: 'relative',
          overflow: 'hidden',
          p: 6,
        }}
      >
        {/* Animated gradient orbs */}
        <Box
          sx={{
            position: 'absolute',
            top: '12%',
            left: '8%',
            width: 360,
            height: 360,
            borderRadius: '50%',
            background: `radial-gradient(circle, ${alpha(tokens.colors.pink, 0.28)} 0%, transparent 70%)`,
            filter: 'blur(70px)',
            animation: 'float1 9s ease-in-out infinite',
            '@keyframes float1': {
              '0%, 100%': { transform: 'translate(0, 0) scale(1)' },
              '50%': { transform: 'translate(40px, -25px) scale(1.05)' },
            },
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            bottom: '15%',
            right: '10%',
            width: 320,
            height: 320,
            borderRadius: '50%',
            background: `radial-gradient(circle, ${alpha(tokens.colors.blue, 0.22)} 0%, transparent 70%)`,
            filter: 'blur(60px)',
            animation: 'float2 11s ease-in-out infinite',
            '@keyframes float2': {
              '0%, 100%': { transform: 'translate(0, 0) scale(1)' },
              '50%': { transform: 'translate(-30px, 35px) scale(1.1)' },
            },
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            top: '55%',
            left: '42%',
            width: 220,
            height: 220,
            borderRadius: '50%',
            background: `radial-gradient(circle, ${alpha(tokens.colors.yellow, 0.18)} 0%, transparent 70%)`,
            filter: 'blur(50px)',
            animation: 'float3 7s ease-in-out infinite',
            '@keyframes float3': {
              '0%, 100%': { transform: 'translate(0, 0)' },
              '50%': { transform: 'translate(20px, 18px)' },
            },
          }}
        />

        {/* Subtle starfield */}
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `radial-gradient(circle at 18% 32%, ${alpha('#fff', 0.4)} 0.5px, transparent 1px),
                              radial-gradient(circle at 72% 18%, ${alpha('#fff', 0.5)} 0.5px, transparent 1px),
                              radial-gradient(circle at 48% 78%, ${alpha('#fff', 0.3)} 0.5px, transparent 1px),
                              radial-gradient(circle at 88% 62%, ${alpha('#fff', 0.4)} 0.5px, transparent 1px),
                              radial-gradient(circle at 22% 82%, ${alpha('#fff', 0.3)} 0.5px, transparent 1px)`,
            backgroundSize: '100% 100%',
            pointerEvents: 'none',
            opacity: 0.6,
          }}
        />

        {/* Brand content */}
        <MotionBox
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          sx={{
            position: 'relative',
            zIndex: 1,
            textAlign: 'center',
            maxWidth: 520,
          }}
        >
          {/* Eyebrow — command-console vibe */}
          <Box
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 1,
              px: 1.5,
              py: 0.625,
              borderRadius: 5,
              bgcolor: alpha('#fff', 0.06),
              border: `1px solid ${alpha('#fff', 0.12)}`,
              backdropFilter: 'blur(8px)',
              mb: 3,
            }}
          >
            <Box
              sx={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                bgcolor: tokens.colors.pink,
                boxShadow: `0 0 10px ${tokens.colors.pink}`,
                animation: 'pulseBeat 1.6s ease-in-out infinite',
                '@keyframes pulseBeat': {
                  '0%, 100%': { opacity: 1, transform: 'scale(1)' },
                  '50%': { opacity: 0.6, transform: 'scale(1.25)' },
                },
              }}
            />
            <Typography
              variant="caption"
              sx={{
                color: alpha('#fff', 0.75),
                letterSpacing: '0.15em',
                fontWeight: 600,
                fontSize: '0.7rem',
              }}
            >
              {eyebrow}
            </Typography>
          </Box>

          {/* Big wordmark */}
          <BrandMark size="lg" />

          {/* Soft, non-corporate tagline */}
          <Typography
            component="div"
            sx={{
              mt: 3,
              color: alpha('#FFFFFF', 0.7),
              fontSize: '1rem',
              lineHeight: 1.7,
              maxWidth: 420,
              mx: 'auto',
            }}
          >
            {tagline}
          </Typography>

          {/* Brand color dots — pulse in sequence */}
          <Stack direction="row" spacing={1.5} justifyContent="center" sx={{ mt: 5 }}>
            {[tokens.colors.pink, tokens.colors.blue, tokens.colors.yellow].map((color, i) => (
              <Box
                key={color}
                sx={{
                  width: 10,
                  height: 10,
                  borderRadius: '50%',
                  bgcolor: color,
                  boxShadow: `0 0 14px ${color}`,
                  animation: `dotPulse 2.4s ease-in-out infinite`,
                  animationDelay: `${i * 0.25}s`,
                  '@keyframes dotPulse': {
                    '0%, 100%': { opacity: 0.5, transform: 'scale(0.9)' },
                    '50%': { opacity: 1, transform: 'scale(1.15)' },
                  },
                }}
              />
            ))}
          </Stack>
        </MotionBox>
      </Box>

      {/* ── Right panel — form ── */}
      <Box
        sx={{
          flex: { xs: 1, md: '0 0 480px' },
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: 'background.default',
          borderRadius: { xs: 0, md: '32px 0 0 32px' },
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Top brand accent line */}
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

        {/* Floating decorative corner glow — feels like brand bleeds into the form */}
        <Box
          sx={{
            position: 'absolute',
            top: -120,
            right: -120,
            width: 260,
            height: 260,
            borderRadius: '50%',
            background: `radial-gradient(circle, ${alpha(tokens.colors.pink, 0.08)} 0%, transparent 70%)`,
            filter: 'blur(30px)',
            pointerEvents: 'none',
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            bottom: -100,
            left: -80,
            width: 220,
            height: 220,
            borderRadius: '50%',
            background: `radial-gradient(circle, ${alpha(tokens.colors.blue, 0.07)} 0%, transparent 70%)`,
            filter: 'blur(30px)',
            pointerEvents: 'none',
          }}
        />

        <MotionBox
          variants={scaleIn}
          initial="initial"
          animate="animate"
          sx={{
            position: 'relative',
            zIndex: 1,
            width: '100%',
            maxWidth: 400,
            mx: 'auto',
            px: { xs: 3, sm: 4 },
            py: 4,
          }}
        >
          {/* Mobile brand — visible when left panel is hidden */}
          <Box
            sx={{
              display: { xs: 'flex', md: 'none' },
              flexDirection: 'column',
              alignItems: 'center',
              gap: 1.5,
              mb: 4,
              p: 2.5,
              borderRadius: 3,
              background: tokens.gradients.darkSurface,
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <Box
              sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: 2,
                background: tokens.gradients.brand,
              }}
            />
            <BrandMark size="sm" />
            <Typography
              variant="caption"
              sx={{ color: alpha('#fff', 0.6), letterSpacing: '0.1em', fontWeight: 600 }}
            >
              COMMAND CENTER
            </Typography>
          </Box>

          {/* Desktop — subtle header chip above the title */}
          <Box
            sx={{
              display: { xs: 'none', md: 'inline-flex' },
              alignItems: 'center',
              gap: 0.75,
              px: 1.25,
              py: 0.375,
              borderRadius: 5,
              bgcolor: alpha(tokens.colors.pink, 0.08),
              border: `1px solid ${alpha(tokens.colors.pink, 0.18)}`,
              mb: 2,
            }}
          >
            <Box
              sx={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                bgcolor: tokens.colors.pink,
                boxShadow: `0 0 8px ${tokens.colors.pink}`,
              }}
            />
            <Typography
              variant="caption"
              sx={{
                color: tokens.colors.pinkDark,
                letterSpacing: '0.12em',
                fontWeight: 700,
                fontSize: '0.68rem',
              }}
            >
              {chip}
            </Typography>
          </Box>

          {/* Title */}
          {title && (
            <Typography
              variant="h2"
              color="text.primary"
              mb={0.5}
              sx={{ fontWeight: 800, letterSpacing: '-0.02em' }}
            >
              {title}
            </Typography>
          )}

          {subtitle && (
            <Typography variant="body2" color="text.secondary" mb={3.5}>
              {subtitle}
            </Typography>
          )}

          {children}
        </MotionBox>
      </Box>
    </Box>
  );
}
