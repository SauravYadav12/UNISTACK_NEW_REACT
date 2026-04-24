import {
  Box,
  Button,
  Chip,
  Container,
  Stack,
  Typography,
  alpha,
} from '@mui/material';
import { Link as RouterLink, Navigate, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  IconArrowRight,
  IconArrowUpRight,
  IconBolt,
  IconBriefcase,
  IconBuildingBank,
  IconCalendarEvent,
  IconChartBar,
  IconCheck,
  IconCircleDot,
  IconCommand,
  IconCornerDownLeft,
  IconFileInvoice,
  IconFolders,
  IconMail,
  IconPlane,
  IconRadar2,
  IconReportAnalytics,
  IconRoute,
  IconSearch,
  IconShieldCheck,
  IconSparkles,
  IconUsers,
} from '@tabler/icons-react';
import { tokens } from '../../theme/theme';
import { useAuth } from '../../AuthGaurd/AuthContextProvider';
import unistack_img from '../../assets/unistack.png';
import unistack_small_img from '../../assets/unistack_small.png';

const MotionBox = motion.create(Box);
const MotionStack = motion.create(Stack);
const MotionTypography = motion.create(Typography);

// ──────────────────────────────────────────────────────────────────────────
// Bright-theme palette
//
// Kept local (not on tokens) because these only belong to the landing page —
// the in-app surface deliberately uses a different, more utilitarian base.
// Tokens.colors.* (pink/blue/yellow/navy) are still the source of truth for
// the brand hues; these are just the page-chrome colors that frame them.
// Exported so the Legal pages (Privacy/Terms/Security/Status) can match the
// same cream surface without having to re-declare the palette.
// ──────────────────────────────────────────────────────────────────────────
export const LIGHT = {
  base: '#FFF7F0', // warm cream — primary page bg
  surface: '#FAF7FF', // lavender-tinted — alternate section bg
  card: '#FFFFFF',
  ink: '#0A3555', // brand navy for primary copy
  inkSoft: '#5A6A85', // muted secondary copy
  rule: 'rgba(10, 53, 85, 0.08)',
};

// ──────────────────────────────────────────────────────────────────────────
// Aurora backdrop — three translucent blobs + a dotted grid + drifting
// particles. Reused at the top of the hero so the same visual language
// bookends the page. No dark gradient anywhere; everything reads on the
// cream base.
//
// The particle layer is a dozen tiny brand-tinted dots with random start
// positions + individual keyframe drifts. CSS-only (no RAF loop) so it's
// free at runtime, and each particle has its own delay so the motion never
// looks synchronised.
// ──────────────────────────────────────────────────────────────────────────

// Scripted particle seeds — the `delay` offset + `duration` jitter prevent
// any visible sync-up across particles. Colors rotate through pink/blue/
// yellow so the hero background feels like a living nebula.
const AURORA_PARTICLES: Array<{
  left: string;
  top: string;
  size: number;
  color: string;
  duration: string;
  delay: string;
  keyframe: 'drift-a' | 'drift-b' | 'drift-c';
}> = [
  { left: '8%', top: '18%', size: 6, color: tokens.colors.pink, duration: '14s', delay: '0s', keyframe: 'drift-a' },
  { left: '18%', top: '72%', size: 4, color: tokens.colors.blue, duration: '18s', delay: '-4s', keyframe: 'drift-b' },
  { left: '24%', top: '38%', size: 8, color: tokens.colors.yellow, duration: '22s', delay: '-2s', keyframe: 'drift-c' },
  { left: '34%', top: '82%', size: 5, color: tokens.colors.pink, duration: '16s', delay: '-8s', keyframe: 'drift-b' },
  { left: '46%', top: '12%', size: 4, color: tokens.colors.blueLight, duration: '20s', delay: '-6s', keyframe: 'drift-a' },
  { left: '52%', top: '64%', size: 7, color: tokens.colors.yellowDark, duration: '26s', delay: '-10s', keyframe: 'drift-c' },
  { left: '64%', top: '28%', size: 5, color: tokens.colors.pinkLight, duration: '19s', delay: '-3s', keyframe: 'drift-b' },
  { left: '72%', top: '78%', size: 6, color: tokens.colors.blue, duration: '24s', delay: '-12s', keyframe: 'drift-a' },
  { left: '82%', top: '42%', size: 4, color: tokens.colors.pink, duration: '17s', delay: '-5s', keyframe: 'drift-c' },
  { left: '88%', top: '14%', size: 5, color: tokens.colors.yellow, duration: '21s', delay: '-9s', keyframe: 'drift-b' },
  { left: '92%', top: '68%', size: 7, color: tokens.colors.blueDark, duration: '28s', delay: '-14s', keyframe: 'drift-a' },
  { left: '14%', top: '52%', size: 5, color: tokens.colors.pinkDark, duration: '23s', delay: '-7s', keyframe: 'drift-c' },
];

function AuroraBackdrop() {
  return (
    <>
      {/* Global keyframes for the drifting particles. Three variants so
          neighbouring particles don't trace identical paths. */}
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          '@keyframes drift-a': {
            '0%': { transform: 'translate(0, 0) scale(1)', opacity: 0.35 },
            '25%': { transform: 'translate(18px, -24px) scale(1.2)', opacity: 0.7 },
            '50%': { transform: 'translate(-12px, -48px) scale(0.85)', opacity: 0.5 },
            '75%': { transform: 'translate(14px, -22px) scale(1.1)', opacity: 0.65 },
            '100%': { transform: 'translate(0, 0) scale(1)', opacity: 0.35 },
          },
          '@keyframes drift-b': {
            '0%': { transform: 'translate(0, 0) scale(1)', opacity: 0.4 },
            '33%': { transform: 'translate(-22px, 14px) scale(1.3)', opacity: 0.75 },
            '66%': { transform: 'translate(16px, 26px) scale(0.9)', opacity: 0.55 },
            '100%': { transform: 'translate(0, 0) scale(1)', opacity: 0.4 },
          },
          '@keyframes drift-c': {
            '0%': { transform: 'translate(0, 0) scale(1)', opacity: 0.3 },
            '20%': { transform: 'translate(12px, 18px) scale(1.15)', opacity: 0.6 },
            '55%': { transform: 'translate(-18px, -12px) scale(1.05)', opacity: 0.75 },
            '80%': { transform: 'translate(20px, -18px) scale(0.9)', opacity: 0.5 },
            '100%': { transform: 'translate(0, 0) scale(1)', opacity: 0.3 },
          },
        }}
      />

      <Box
        sx={{
          position: 'absolute',
          top: -120,
          right: -140,
          width: 520,
          height: 520,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${alpha(tokens.colors.pink, 0.28)} 0%, transparent 70%)`,
          filter: 'blur(90px)',
          pointerEvents: 'none',
          animation: 'aurora-breathe-a 14s ease-in-out infinite',
          '@keyframes aurora-breathe-a': {
            '0%, 100%': { transform: 'scale(1) translate(0, 0)' },
            '50%': { transform: 'scale(1.08) translate(-20px, 14px)' },
          },
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          bottom: -160,
          left: -80,
          width: 540,
          height: 540,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${alpha(tokens.colors.blue, 0.22)} 0%, transparent 70%)`,
          filter: 'blur(100px)',
          pointerEvents: 'none',
          animation: 'aurora-breathe-b 18s ease-in-out infinite',
          '@keyframes aurora-breathe-b': {
            '0%, 100%': { transform: 'scale(1) translate(0, 0)' },
            '50%': { transform: 'scale(1.1) translate(24px, -18px)' },
          },
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          top: '40%',
          right: '30%',
          width: 360,
          height: 360,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${alpha(tokens.colors.yellow, 0.22)} 0%, transparent 70%)`,
          filter: 'blur(90px)',
          pointerEvents: 'none',
          animation: 'aurora-breathe-c 22s ease-in-out infinite',
          '@keyframes aurora-breathe-c': {
            '0%, 100%': { transform: 'scale(1)' },
            '50%': { transform: 'scale(1.14)' },
          },
        }}
      />

      {/* Drifting particle field — tiny glowing dots that float through
          the hero space on independent paths. Pure CSS; zero JS runtime. */}
      {AURORA_PARTICLES.map((p, i) => (
        <Box
          key={i}
          sx={{
            position: 'absolute',
            left: p.left,
            top: p.top,
            width: p.size,
            height: p.size,
            borderRadius: '50%',
            bgcolor: p.color,
            boxShadow: `0 0 ${p.size * 2}px ${alpha(p.color, 0.7)}`,
            opacity: 0.45,
            pointerEvents: 'none',
            animation: `${p.keyframe} ${p.duration} ease-in-out ${p.delay} infinite`,
          }}
        />
      ))}

      {/* Dotted field — the dots fade out toward the edges so the visuals
          stay dominant while this quietly adds texture to the background. */}
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `radial-gradient(${alpha(tokens.colors.pink, 0.18)} 1px, transparent 1px)`,
          backgroundSize: '28px 28px',
          maskImage:
            'radial-gradient(ellipse at 50% 40%, black 30%, transparent 75%)',
          WebkitMaskImage:
            'radial-gradient(ellipse at 50% 40%, black 30%, transparent 75%)',
          pointerEvents: 'none',
        }}
      />
    </>
  );
}

// ──────────────────────────────────────────────────────────────────────────
// Mission core — central gradient sphere with the "U" wordmark, wrapped by
// four tilted orbital rings. Each ring carries a satellite sized + colored
// to one of the six product layers, revolving at its own speed. Adapted
// for the bright theme: the core glows pink→blue, the rings are subtle navy
// alpha, the halo uses the same aurora tint as the page backdrop so the
// orbit reads as belonging to this surface rather than floating on black.
// ──────────────────────────────────────────────────────────────────────────
interface Orbit {
  tiltX: number;
  tiltY: number;
  scale: number;
  speed: string;
  anim: string;
  color: string;
  icon: React.ReactNode;
}

function MissionCore({
  size = 'md',
}: {
  size?: 'md' | 'lg';
}) {
  const dims = size === 'lg' ? { w: 520, h: 520, core: 200 } : { w: 380, h: 380, core: 150 };

  const orbits: Orbit[] = [
    {
      tiltX: 22,
      tiltY: -12,
      scale: 0.85,
      speed: '16s',
      anim: 'mc-spin-a',
      color: tokens.colors.pink,
      icon: <IconBriefcase size={13} color="#fff" />,
    },
    {
      tiltX: -26,
      tiltY: 18,
      scale: 1.0,
      speed: '22s',
      anim: 'mc-spin-b',
      color: tokens.colors.blueDark,
      icon: <IconFileInvoice size={13} color="#fff" />,
    },
    {
      tiltX: 10,
      tiltY: 34,
      scale: 1.15,
      speed: '30s',
      anim: 'mc-spin-c',
      color: '#10B981',
      icon: <IconUsers size={13} color="#fff" />,
    },
    {
      tiltX: -14,
      tiltY: -24,
      scale: 1.3,
      speed: '40s',
      anim: 'mc-spin-d',
      color: tokens.colors.yellowDark,
      icon: <IconSparkles size={13} color="#fff" />,
    },
  ];

  return (
    <Box
      sx={{
        position: 'relative',
        width: { xs: dims.w * 0.72, sm: dims.w * 0.88, md: dims.w },
        height: { xs: dims.w * 0.72, sm: dims.w * 0.88, md: dims.h },
        mx: 'auto',
        '@keyframes mc-spin-a': {
          from: { transform: 'rotate(0deg)' },
          to: { transform: 'rotate(360deg)' },
        },
        '@keyframes mc-spin-b': {
          from: { transform: 'rotate(0deg)' },
          to: { transform: 'rotate(-360deg)' },
        },
        '@keyframes mc-spin-c': {
          from: { transform: 'rotate(0deg)' },
          to: { transform: 'rotate(360deg)' },
        },
        '@keyframes mc-spin-d': {
          from: { transform: 'rotate(0deg)' },
          to: { transform: 'rotate(-360deg)' },
        },
        '@keyframes mc-core-pulse': {
          '0%, 100%': {
            boxShadow: `0 0 60px ${alpha(tokens.colors.pink, 0.45)}, 0 0 120px ${alpha(tokens.colors.blue, 0.25)}, inset 0 0 40px ${alpha('#fff', 0.5)}`,
          },
          '50%': {
            boxShadow: `0 0 90px ${alpha(tokens.colors.pink, 0.65)}, 0 0 170px ${alpha(tokens.colors.blue, 0.38)}, inset 0 0 54px ${alpha('#fff', 0.7)}`,
          },
        },
        '@keyframes mc-halo-breath': {
          '0%, 100%': { transform: 'scale(1)', opacity: 0.6 },
          '50%': { transform: 'scale(1.08)', opacity: 0.85 },
        },
      }}
    >
      {/* Ambient aurora halo that breathes with the core pulse — sits
          behind everything so the whole composition feels alive. */}
      <Box
        sx={{
          position: 'absolute',
          inset: '-12%',
          borderRadius: '50%',
          background: `radial-gradient(circle, ${alpha(tokens.colors.pink, 0.22)} 0%, ${alpha(tokens.colors.blue, 0.14)} 45%, transparent 75%)`,
          filter: 'blur(30px)',
          animation: 'mc-halo-breath 6s ease-in-out infinite',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />

      {/* Central sphere */}
      <Box
        sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          width: { xs: dims.core * 0.72, sm: dims.core * 0.88, md: dims.core },
          height: { xs: dims.core * 0.72, sm: dims.core * 0.88, md: dims.core },
          transform: 'translate(-50%, -50%)',
          borderRadius: '50%',
          background: `radial-gradient(circle at 32% 28%, ${alpha('#fff', 0.6)}, ${tokens.colors.pink} 38%, ${tokens.colors.pinkDark} 62%, ${tokens.colors.blueDark} 100%)`,
          animation: 'mc-core-pulse 3.6s ease-in-out infinite',
          zIndex: 4,
        }}
      />
      {/* U wordmark inside the core */}
      <Box
        sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 5,
          fontSize: { xs: '2rem', md: '2.8rem' },
          fontWeight: 900,
          letterSpacing: '-0.04em',
          color: '#fff',
          textShadow: `0 2px 18px ${alpha(tokens.colors.brand, 0.7)}`,
          pointerEvents: 'none',
          fontFamily: 'ui-sans-serif, system-ui, sans-serif',
        }}
      >
        U
      </Box>

      {/* Orbit rings — each tilted + rotating its own satellite */}
      {orbits.map((orbit, i) => (
        <Box
          key={i}
          sx={{
            position: 'absolute',
            inset: 0,
            transform: `rotateX(${orbit.tiltX}deg) rotateY(${orbit.tiltY}deg) scale(${orbit.scale})`,
            transformStyle: 'preserve-3d',
          }}
        >
          {/* Ring line — a subtle navy-alpha stroke so it reads on cream */}
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              borderRadius: '50%',
              border: `1px solid ${alpha(LIGHT.ink, 0.14)}`,
              boxShadow: `inset 0 0 40px ${alpha(orbit.color, 0.05)}`,
            }}
          />
          {/* Dashed co-ring just inside for extra depth */}
          <Box
            sx={{
              position: 'absolute',
              inset: 6,
              borderRadius: '50%',
              border: `1px dashed ${alpha(orbit.color, 0.22)}`,
            }}
          />
          {/* Rotating holder carrying the satellite */}
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              animation: `${orbit.anim} ${orbit.speed} linear infinite`,
            }}
          >
            <Box
              sx={{
                position: 'absolute',
                top: '50%',
                left: 0,
                transform: 'translate(-50%, -50%)',
                width: 30,
                height: 30,
                borderRadius: '50%',
                background: `radial-gradient(circle at 30% 30%, ${alpha('#fff', 0.6)}, ${orbit.color} 70%)`,
                border: `2px solid ${alpha('#fff', 0.75)}`,
                boxShadow: `0 0 18px ${alpha(orbit.color, 0.55)}, 0 4px 10px ${alpha(orbit.color, 0.25)}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 3,
              }}
            >
              {orbit.icon}
            </Box>
          </Box>
        </Box>
      ))}
    </Box>
  );
}

// ──────────────────────────────────────────────────────────────────────────
// Brand interlude — dedicated motion moment between the stat strip and the
// tabbed feature section. Centers the MissionCore orbital with a left-side
// narrative block, so the page has both the product-mock energy (palette)
// and the brand-energy (orbit). Satellites carry one icon per layer.
// ──────────────────────────────────────────────────────────────────────────
function BrandInterlude() {
  return (
    <Box
      sx={{
        position: 'relative',
        py: { xs: 10, md: 16 },
        bgcolor: LIGHT.base,
        overflow: 'hidden',
      }}
    >
      {/* Background accents — a pink blob top-left, blue blob bottom-right,
          plus a very subtle concentric-rings backdrop so the orbital
          visually "belongs" on this surface. */}
      <Box
        sx={{
          position: 'absolute',
          top: -140,
          left: -120,
          width: 460,
          height: 460,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${alpha(tokens.colors.pink, 0.16)} 0%, transparent 70%)`,
          filter: 'blur(90px)',
          pointerEvents: 'none',
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          bottom: -160,
          right: -100,
          width: 500,
          height: 500,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${alpha(tokens.colors.blue, 0.14)} 0%, transparent 70%)`,
          filter: 'blur(100px)',
          pointerEvents: 'none',
        }}
      />

      <Container
        maxWidth="lg"
        sx={{
          position: 'relative',
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: '1fr 1.15fr' },
          alignItems: 'center',
          gap: { xs: 6, md: 8 },
        }}
      >
        <MotionStack
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6 }}
          spacing={2.5}
        >
          <Chip
            label="THE CORE"
            size="small"
            sx={{
              alignSelf: 'flex-start',
              height: 22,
              fontSize: '0.66rem',
              fontWeight: 800,
              letterSpacing: '0.16em',
              bgcolor: alpha(tokens.colors.blue, 0.08),
              color: tokens.colors.blueDark,
              border: `1px solid ${alpha(tokens.colors.blue, 0.22)}`,
            }}
          />
          <Typography
            variant="h2"
            fontWeight={900}
            sx={{
              fontSize: { xs: '1.95rem', md: '2.6rem' },
              color: LIGHT.ink,
              letterSpacing: '-0.02em',
              lineHeight: 1.1,
            }}
          >
            One core.{' '}
            <Box
              component="span"
              sx={{
                background: tokens.gradients.pinkBlue,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              Every orbit
            </Box>
            {' '}locked in.
          </Typography>
          <Typography
            sx={{
              color: LIGHT.inkSoft,
              fontSize: { xs: '1rem', md: '1.08rem' },
              lineHeight: 1.65,
              maxWidth: 480,
            }}
          >
            Unistack is built around a single control plane — roles, audit,
            AI — with every product surface revolving around it. Shared
            identity, shared context, shared memory. No module gets lonely,
            no data gets lost.
          </Typography>
          <Stack spacing={1.25} sx={{ mt: 1 }}>
            {[
              {
                color: tokens.colors.pink,
                icon: <IconBriefcase size={12} color="#fff" />,
                label: 'Pipelines orbit',
                detail: 'Parent + child lanes · multi-assign',
              },
              {
                color: tokens.colors.blueDark,
                icon: <IconFileInvoice size={12} color="#fff" />,
                label: 'Billing orbit',
                detail: 'Timesheets → invoices → paid',
              },
              {
                color: '#10B981',
                icon: <IconUsers size={12} color="#fff" />,
                label: 'People orbit',
                detail: 'Leaves · salary · holidays',
              },
              {
                color: tokens.colors.yellowDark,
                icon: <IconSparkles size={12} color="#fff" />,
                label: 'Intelligence orbit',
                detail: 'AI extract · drafts · ⌘K',
              },
            ].map((row, i) => (
              <MotionStack
                key={i}
                direction="row"
                spacing={1.5}
                alignItems="center"
                initial={{ opacity: 0, x: -12 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, amount: 0.5 }}
                transition={{ duration: 0.4, delay: 0.1 + i * 0.1 }}
              >
                <Box
                  sx={{
                    width: 24,
                    height: 24,
                    borderRadius: '50%',
                    background: `radial-gradient(circle at 30% 30%, ${alpha('#fff', 0.5)}, ${row.color} 70%)`,
                    boxShadow: `0 0 12px ${alpha(row.color, 0.5)}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  {row.icon}
                </Box>
                <Box>
                  <Typography
                    sx={{
                      fontSize: '0.84rem',
                      fontWeight: 800,
                      color: LIGHT.ink,
                    }}
                  >
                    {row.label}
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: '0.76rem',
                      color: LIGHT.inkSoft,
                    }}
                  >
                    {row.detail}
                  </Typography>
                </Box>
              </MotionStack>
            ))}
          </Stack>
        </MotionStack>

        <MotionBox
          initial={{ opacity: 0, scale: 0.82 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.8 }}
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
          }}
        >
          <MissionCore size="lg" />
        </MotionBox>
      </Container>
    </Box>
  );
}

// ──────────────────────────────────────────────────────────────────────────
// Command-palette mock — the hero's right-side visual. Shows a fake search
// bar with results; cycles through different operator queries every few
// seconds so the hero carries life without a heavy animation loop. This is
// the page's "out-of-the-box" moment: instead of a dashboard screenshot,
// admins see *how* they'll interact with the product.
// ──────────────────────────────────────────────────────────────────────────
interface PaletteResult {
  icon: React.ReactNode;
  label: string;
  meta: string;
  accent: string;
}

interface PaletteScene {
  query: string;
  hint: string;
  results: PaletteResult[];
}

const PALETTE_SCENES: PaletteScene[] = [
  {
    query: 'invoices this month',
    hint: 'Switch project',
    results: [
      {
        icon: <IconFileInvoice size={14} />,
        label: 'INV-ACM-202604-07 · AcmeCorp',
        meta: '$14,400 · Raised',
        accent: tokens.colors.pinkDark,
      },
      {
        icon: <IconFileInvoice size={14} />,
        label: 'INV-NOV-202604-03 · Nova Systems',
        meta: '$9,600 · Paid',
        accent: '#10B981',
      },
      {
        icon: <IconFileInvoice size={14} />,
        label: 'INV-RAI-202604-02 · Rainforest Labs',
        meta: '$11,200 · Due',
        accent: '#EF4444',
      },
    ],
  },
  {
    query: 'who is submitted this week',
    hint: 'Jump to person',
    results: [
      {
        icon: <IconUsers size={14} />,
        label: 'Priya K. · 4 submissions',
        meta: 'Top in Marketing',
        accent: tokens.colors.pink,
      },
      {
        icon: <IconUsers size={14} />,
        label: 'Aman S. · 3 submissions',
        meta: 'Rising · +2 vs last week',
        accent: tokens.colors.blue,
      },
      {
        icon: <IconUsers size={14} />,
        label: 'Noor I. · 2 submissions',
        meta: '1 converted · Interviewed',
        accent: tokens.colors.yellowDark,
      },
    ],
  },
  {
    query: 'leave balance for Q2',
    hint: 'Open report',
    results: [
      {
        icon: <IconPlane size={14} />,
        label: 'Paid leave · 11.5 days available',
        meta: 'Accrued 1/month · resets Jan',
        accent: tokens.colors.blue,
      },
      {
        icon: <IconPlane size={14} />,
        label: 'Sick · 4 of 6 used',
        meta: 'Reset: next Jan 1',
        accent: '#F59E0B',
      },
      {
        icon: <IconCalendarEvent size={14} />,
        label: 'Holiday calendar in sync',
        meta: 'Nager.Date · last pulled 2h ago',
        accent: '#10B981',
      },
    ],
  },
];

function CommandPaletteMock() {
  const [sceneIdx, setSceneIdx] = useState(0);

  // Rotate through the three scripted queries on a loop. useRef keeps a
  // single interval handle alive across re-renders; cleanup on unmount.
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  useEffect(() => {
    tickRef.current = setInterval(() => {
      setSceneIdx((i) => (i + 1) % PALETTE_SCENES.length);
    }, 3800);
    return () => {
      if (tickRef.current) clearInterval(tickRef.current);
    };
  }, []);

  const scene = PALETTE_SCENES[sceneIdx];

  return (
    <MotionBox
      initial={{ opacity: 0, y: 28, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.7, delay: 0.1 }}
      sx={{
        position: 'relative',
        width: '100%',
        maxWidth: 460,
        mx: 'auto',
      }}
    >
      {/* Glow halo behind the card */}
      <Box
        sx={{
          position: 'absolute',
          inset: -24,
          borderRadius: 6,
          background: tokens.gradients.pinkBlue,
          opacity: 0.18,
          filter: 'blur(40px)',
          pointerEvents: 'none',
        }}
      />

      {/* Card frame */}
      <Box
        sx={{
          position: 'relative',
          borderRadius: 4,
          bgcolor: '#FFFFFFEE',
          backdropFilter: 'blur(10px)',
          border: `1px solid ${alpha(tokens.colors.blue, 0.2)}`,
          boxShadow: `0 32px 60px ${alpha(tokens.colors.blue, 0.18)}, 0 12px 24px ${alpha(tokens.colors.pink, 0.12)}`,
          overflow: 'hidden',
        }}
      >
        {/* Top brand stripe */}
        <Box
          sx={{
            height: 3,
            background: tokens.gradients.pinkBlue,
          }}
        />

        {/* Traffic-light chrome */}
        <Stack
          direction="row"
          spacing={0.75}
          sx={{
            px: 2,
            py: 1.25,
            borderBottom: `1px solid ${LIGHT.rule}`,
          }}
          alignItems="center"
        >
          <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: '#FCA5A5' }} />
          <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: '#FCD34D' }} />
          <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: '#6EE7B7' }} />
          <Box sx={{ flex: 1 }} />
          <Typography
            variant="caption"
            sx={{
              color: LIGHT.inkSoft,
              fontWeight: 700,
              letterSpacing: '0.1em',
              fontSize: '0.66rem',
            }}
          >
            UNISTACK · COMMAND
          </Typography>
        </Stack>

        {/* Search row */}
        <Stack
          direction="row"
          spacing={1.25}
          alignItems="center"
          sx={{
            px: 2,
            py: 1.75,
            borderBottom: `1px solid ${LIGHT.rule}`,
            bgcolor: alpha(tokens.colors.blueLight, 0.06),
          }}
        >
          <IconSearch size={16} color={tokens.colors.blueDark} />
          <Box sx={{ flex: 1, position: 'relative', height: 22 }}>
            <AnimatePresence mode="wait">
              <MotionTypography
                key={scene.query}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.35 }}
                sx={{
                  position: 'absolute',
                  inset: 0,
                  fontSize: '0.92rem',
                  fontWeight: 600,
                  color: LIGHT.ink,
                  fontFamily:
                    'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
                }}
              >
                {scene.query}
                <Box
                  component="span"
                  sx={{
                    display: 'inline-block',
                    width: 2,
                    height: 14,
                    ml: 0.5,
                    bgcolor: tokens.colors.pinkDark,
                    verticalAlign: 'middle',
                    animation: 'palette-caret 1s steps(2) infinite',
                    '@keyframes palette-caret': {
                      '0%, 100%': { opacity: 1 },
                      '50%': { opacity: 0 },
                    },
                  }}
                />
              </MotionTypography>
            </AnimatePresence>
          </Box>
          <Chip
            size="small"
            icon={<IconCommand size={12} />}
            label="K"
            sx={{
              height: 22,
              fontSize: '0.68rem',
              fontWeight: 800,
              letterSpacing: '0.06em',
              bgcolor: alpha(tokens.colors.blue, 0.1),
              color: tokens.colors.blueDark,
              border: `1px solid ${alpha(tokens.colors.blue, 0.25)}`,
              '.MuiChip-icon': {
                color: tokens.colors.blueDark,
                marginLeft: '6px',
              },
            }}
          />
        </Stack>

        {/* Results */}
        <AnimatePresence mode="wait">
          <MotionBox
            key={sceneIdx}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.35 }}
            sx={{ py: 0.5 }}
          >
            {scene.results.map((r, i) => (
              <Stack
                key={i}
                direction="row"
                spacing={1.25}
                alignItems="center"
                sx={{
                  px: 2,
                  py: 1.25,
                  borderBottom:
                    i < scene.results.length - 1
                      ? `1px dashed ${LIGHT.rule}`
                      : 'none',
                  cursor: 'default',
                  transition: 'background-color 0.2s ease',
                  ...(i === 0 && {
                    bgcolor: alpha(tokens.colors.pink, 0.06),
                  }),
                }}
              >
                <Box
                  sx={{
                    width: 28,
                    height: 28,
                    borderRadius: 1.5,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: alpha(r.accent, 0.12),
                    color: r.accent,
                    flexShrink: 0,
                  }}
                >
                  {r.icon}
                </Box>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography
                    sx={{
                      fontSize: '0.86rem',
                      fontWeight: 700,
                      color: LIGHT.ink,
                      lineHeight: 1.25,
                    }}
                  >
                    {r.label}
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{ color: LIGHT.inkSoft, fontSize: '0.72rem' }}
                  >
                    {r.meta}
                  </Typography>
                </Box>
                {i === 0 && (
                  <Stack direction="row" spacing={0.5} alignItems="center">
                    <Typography
                      variant="caption"
                      sx={{
                        color: LIGHT.inkSoft,
                        fontWeight: 700,
                        fontSize: '0.66rem',
                        letterSpacing: '0.08em',
                        textTransform: 'uppercase',
                      }}
                    >
                      {scene.hint}
                    </Typography>
                    <IconCornerDownLeft size={12} color={LIGHT.inkSoft} />
                  </Stack>
                )}
              </Stack>
            ))}
          </MotionBox>
        </AnimatePresence>

        {/* Footer helper bar */}
        <Stack
          direction="row"
          alignItems="center"
          spacing={1.5}
          sx={{
            px: 2,
            py: 1,
            borderTop: `1px solid ${LIGHT.rule}`,
            bgcolor: alpha(tokens.colors.pink, 0.04),
          }}
        >
          <Stack direction="row" spacing={0.5} alignItems="center">
            <IconSparkles size={12} color={tokens.colors.pinkDark} />
            <Typography
              variant="caption"
              sx={{
                color: tokens.colors.pinkDark,
                fontWeight: 800,
                fontSize: '0.66rem',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
              }}
            >
              AI-ranked
            </Typography>
          </Stack>
          <Box sx={{ flex: 1 }} />
          <Typography
            variant="caption"
            sx={{ color: LIGHT.inkSoft, fontSize: '0.68rem' }}
          >
            3 of {scene.results.length} shown
          </Typography>
        </Stack>
      </Box>
    </MotionBox>
  );
}

// ──────────────────────────────────────────────────────────────────────────
// Module visuals — compact animated mocks used in the tabbed feature
// section and the bento grid. Each `kind` maps to a distinct motif that
// echoes what the matching product surface actually does.
// ──────────────────────────────────────────────────────────────────────────
function ModuleVisual({
  kind,
  accent,
  size = 'md',
}: {
  kind: string;
  accent: string;
  size?: 'sm' | 'md' | 'lg';
}) {
  const height = size === 'sm' ? 80 : size === 'lg' ? 180 : 120;
  switch (kind) {
    case 'parent-child':
      return (
        <Box sx={{ position: 'relative', height, width: '100%' }}>
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '62%',
              height: 26,
              borderRadius: 1.25,
              bgcolor: alpha(accent, 0.22),
              border: `1px solid ${alpha(accent, 0.45)}`,
              display: 'flex',
              alignItems: 'center',
              px: 1,
              fontSize: '0.66rem',
              fontWeight: 800,
              color: accent,
              letterSpacing: '0.04em',
            }}
          >
            REQ-108 · Parent
          </Box>
          {[0, 1, 2].map((i) => (
            <Box
              key={i}
              sx={{
                position: 'absolute',
                top: 38 + i * 20,
                left: 20,
                width: `${56 - i * 4}%`,
                height: 16,
                borderRadius: 1,
                bgcolor: alpha(accent, 0.14),
                border: `1px solid ${alpha(accent, 0.3)}`,
                display: 'flex',
                alignItems: 'center',
                px: 1,
                fontSize: '0.6rem',
                fontWeight: 700,
                color: accent,
                '@keyframes child-slide': {
                  '0%': { transform: 'translateX(-18px)', opacity: 0 },
                  '22%, 100%': { transform: 'translateX(0)', opacity: 1 },
                },
                animation: `child-slide 4.2s ease-in-out ${0.4 + i * 0.28}s infinite`,
              }}
            >
              REQ-108-{String.fromCharCode(65 + i)}
            </Box>
          ))}
        </Box>
      );
    case 'pulse':
      return (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'flex-end',
            gap: 0.75,
            height,
            justifyContent: 'center',
          }}
        >
          {[36, 58, 72, 48, 86, 62, 44, 78].map((h, i) => (
            <Box
              key={i}
              sx={{
                width: 12,
                height: `${h}%`,
                borderRadius: 1.25,
                background: `linear-gradient(180deg, ${accent}, ${alpha(accent, 0.35)})`,
                '@keyframes bar-pulse': {
                  '0%, 100%': { transform: 'scaleY(0.7)', opacity: 0.65 },
                  '50%': { transform: 'scaleY(1)', opacity: 1 },
                },
                transformOrigin: 'bottom',
                animation: `bar-pulse 2.6s ease-in-out ${i * 0.13}s infinite`,
              }}
            />
          ))}
        </Box>
      );
    case 'bars':
      return (
        <Stack spacing={1} sx={{ height, justifyContent: 'center' }}>
          {[
            { label: 'Priya K.', v: 92 },
            { label: 'Aman S.', v: 74 },
            { label: 'Noor I.', v: 61 },
          ].map((row, i) => (
            <Box key={i}>
              <Stack direction="row" sx={{ mb: 0.5 }}>
                <Typography
                  sx={{
                    fontSize: '0.66rem',
                    fontWeight: 700,
                    color: LIGHT.inkSoft,
                    flex: 1,
                  }}
                >
                  {row.label}
                </Typography>
                <Typography
                  sx={{
                    fontSize: '0.66rem',
                    fontWeight: 800,
                    color: accent,
                  }}
                >
                  {row.v}
                </Typography>
              </Stack>
              <Box
                sx={{
                  position: 'relative',
                  width: '100%',
                  height: 8,
                  borderRadius: 99,
                  bgcolor: alpha(accent, 0.12),
                  overflow: 'hidden',
                }}
              >
                <Box
                  sx={{
                    position: 'absolute',
                    inset: 0,
                    width: `${row.v}%`,
                    borderRadius: 99,
                    background: `linear-gradient(90deg, ${alpha(accent, 0.6)}, ${accent})`,
                    '@keyframes bar-fill': {
                      '0%': { transform: 'scaleX(0)' },
                      '55%, 100%': { transform: 'scaleX(1)' },
                    },
                    transformOrigin: 'left',
                    animation: `bar-fill 3.2s ease-out ${i * 0.3}s infinite`,
                  }}
                />
              </Box>
            </Box>
          ))}
        </Stack>
      );
    case 'stack':
      return (
        <Box sx={{ position: 'relative', height, width: '100%' }}>
          {[0, 1, 2].map((i) => (
            <Box
              key={i}
              sx={{
                position: 'absolute',
                left: 12 + i * 20,
                top: 10 + i * 14,
                width: 120,
                height: 62,
                borderRadius: 1.5,
                bgcolor: alpha(accent, 0.18 + i * 0.14),
                border: `1px solid ${alpha(accent, 0.42 + i * 0.15)}`,
                display: 'flex',
                flexDirection: 'column',
                px: 1.25,
                py: 0.75,
                '@keyframes stack-drop': {
                  '0%': { transform: 'translateY(-12px)', opacity: 0 },
                  '22%, 100%': { transform: 'translateY(0)', opacity: 1 },
                },
                animation: `stack-drop 4.2s ease-out ${0.2 + i * 0.35}s infinite`,
              }}
            >
              <Typography
                sx={{
                  fontSize: '0.6rem',
                  fontWeight: 800,
                  color: accent,
                  letterSpacing: '0.04em',
                }}
              >
                PRJ-{22 + i}
              </Typography>
              <Box
                sx={{
                  mt: 'auto',
                  height: 4,
                  width: `${40 + i * 20}%`,
                  borderRadius: 1,
                  bgcolor: accent,
                }}
              />
            </Box>
          ))}
        </Box>
      );
    case 'radar':
      return (
        <Box
          sx={{
            position: 'relative',
            width: height,
            height,
            mx: 'auto',
            '@keyframes mini-sweep': {
              from: { transform: 'rotate(0deg)' },
              to: { transform: 'rotate(360deg)' },
            },
          }}
        >
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              borderRadius: '50%',
              border: `1px solid ${alpha(accent, 0.35)}`,
            }}
          />
          <Box
            sx={{
              position: 'absolute',
              inset: 20,
              borderRadius: '50%',
              border: `1px solid ${alpha(accent, 0.25)}`,
            }}
          />
          <Box
            sx={{
              position: 'absolute',
              inset: 40,
              borderRadius: '50%',
              border: `1px solid ${alpha(accent, 0.18)}`,
            }}
          />
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              borderRadius: '50%',
              overflow: 'hidden',
              '& > div': {
                width: '100%',
                height: '100%',
                background: `conic-gradient(from 0deg, transparent 0deg, transparent 300deg, ${alpha(accent, 0.5)} 358deg, transparent 360deg)`,
                animation: 'mini-sweep 3.2s linear infinite',
              },
            }}
          >
            <div />
          </Box>
          {[
            { x: '26%', y: '22%' },
            { x: '68%', y: '30%' },
            { x: '40%', y: '64%' },
            { x: '72%', y: '72%' },
          ].map((d, i) => (
            <Box
              key={i}
              sx={{
                position: 'absolute',
                left: d.x,
                top: d.y,
                width: 8,
                height: 8,
                borderRadius: '50%',
                bgcolor: accent,
                boxShadow: `0 0 12px ${alpha(accent, 0.7)}`,
              }}
            />
          ))}
        </Box>
      );
    case 'sphere':
      return (
        <Box
          sx={{
            position: 'relative',
            width: height,
            height,
            mx: 'auto',
            '@keyframes ai-sphere-dance': {
              '0%, 100%': { transform: 'translateY(0) scale(1, 1) rotate(0deg)' },
              '25%': { transform: 'translateY(-6px) scale(1, 1) rotate(0deg)' },
              '45%': { transform: 'translateY(-2px) scale(1.06, 0.92) rotate(-3deg)' },
              '55%': { transform: 'translateY(-8px) scale(1.08, 1.15) rotate(3deg)' },
              '75%': { transform: 'translateY(-2px) scale(1, 1) rotate(180deg)' },
              '95%': { transform: 'translateY(0) scale(1, 1) rotate(360deg)' },
            },
          }}
        >
          <Box
            sx={{
              width: '100%',
              height: '100%',
              borderRadius: '50%',
              background: `radial-gradient(circle at 30% 30%, ${alpha('#fff', 0.65)}, ${tokens.colors.pink} 40%, ${tokens.colors.blueDark} 100%)`,
              boxShadow: `0 0 24px ${alpha(tokens.colors.pink, 0.42)}, 0 12px 30px ${alpha(tokens.colors.blue, 0.32)}`,
              animation: 'ai-sphere-dance 8s ease-in-out infinite',
            }}
          />
        </Box>
      );
    case 'invoice':
      return (
        <Box
          sx={{
            position: 'relative',
            width: '100%',
            height,
            bgcolor: '#fff',
            borderRadius: 2,
            border: `1px solid ${alpha(accent, 0.25)}`,
            overflow: 'hidden',
            boxShadow: `0 12px 30px ${alpha(accent, 0.12)}`,
          }}
        >
          <Box
            sx={{
              height: 4,
              background: `linear-gradient(90deg, ${tokens.colors.pink}, ${tokens.colors.blue})`,
            }}
          />
          <Box sx={{ px: 1.5, py: 1.25 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
              <Box>
                <Typography
                  sx={{
                    fontSize: '0.6rem',
                    color: LIGHT.inkSoft,
                    fontWeight: 800,
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                  }}
                >
                  Invoice
                </Typography>
                <Typography
                  sx={{
                    fontSize: '0.95rem',
                    fontWeight: 900,
                    color: LIGHT.ink,
                    fontFamily: 'ui-monospace, Menlo, monospace',
                  }}
                >
                  #202604-07
                </Typography>
              </Box>
              <Chip
                size="small"
                label="RAISED"
                sx={{
                  height: 18,
                  fontSize: '0.58rem',
                  fontWeight: 800,
                  bgcolor: alpha(tokens.colors.blue, 0.12),
                  color: tokens.colors.blueDark,
                  letterSpacing: '0.08em',
                }}
              />
            </Stack>
            {[
              { d: 'Services WE 1st–7th Mar', h: '40.0h' },
              { d: 'Services WE 8th–14th Mar', h: '40.0h' },
              { d: 'Services WE 15th–21st Mar', h: '38.5h' },
            ].map((li, i) => (
              <Stack
                key={i}
                direction="row"
                justifyContent="space-between"
                sx={{
                  pt: 0.75,
                  pb: 0.5,
                  borderBottom: `1px dashed ${LIGHT.rule}`,
                }}
              >
                <Typography sx={{ fontSize: '0.66rem', color: LIGHT.ink }}>
                  {li.d}
                </Typography>
                <Typography
                  sx={{ fontSize: '0.66rem', fontWeight: 700, color: LIGHT.ink }}
                >
                  {li.h}
                </Typography>
              </Stack>
            ))}
            <Stack
              direction="row"
              justifyContent="space-between"
              sx={{ mt: 1, pt: 0.5 }}
            >
              <Typography
                sx={{
                  fontSize: '0.6rem',
                  color: LIGHT.inkSoft,
                  fontWeight: 800,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                }}
              >
                Total due
              </Typography>
              <Typography
                sx={{
                  fontSize: '0.82rem',
                  fontWeight: 900,
                  background: tokens.gradients.pinkBlue,
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                $14,400.00
              </Typography>
            </Stack>
          </Box>
        </Box>
      );
    case 'leaves':
      return (
        <Box sx={{ width: '100%', height, position: 'relative' }}>
          {[
            { label: 'Paid', used: 3, total: 15, color: tokens.colors.blue },
            { label: 'Sick', used: 4, total: 6, color: '#F59E0B' },
            { label: 'Casual', used: 2, total: 8, color: '#10B981' },
            { label: 'Unpaid', used: 0, total: 0, color: '#7C3AED' },
          ].map((row, i) => (
            <Stack
              key={i}
              direction="row"
              alignItems="center"
              spacing={1}
              sx={{ mb: 0.75 }}
            >
              <Box
                sx={{
                  width: 10,
                  height: 10,
                  borderRadius: '50%',
                  bgcolor: row.color,
                  flexShrink: 0,
                }}
              />
              <Typography
                sx={{
                  fontSize: '0.68rem',
                  fontWeight: 700,
                  color: LIGHT.ink,
                  width: 52,
                }}
              >
                {row.label}
              </Typography>
              <Box
                sx={{
                  flex: 1,
                  height: 6,
                  borderRadius: 99,
                  bgcolor: alpha(row.color, 0.15),
                  overflow: 'hidden',
                }}
              >
                <Box
                  sx={{
                    height: '100%',
                    width: row.total > 0 ? `${(row.used / row.total) * 100}%` : 0,
                    background: `linear-gradient(90deg, ${alpha(row.color, 0.7)}, ${row.color})`,
                    borderRadius: 99,
                    '@keyframes bar-fill-slow': {
                      '0%': { transform: 'scaleX(0)' },
                      '70%, 100%': { transform: 'scaleX(1)' },
                    },
                    transformOrigin: 'left',
                    animation: `bar-fill-slow 4s ease-out ${i * 0.2}s infinite`,
                  }}
                />
              </Box>
              <Typography
                sx={{
                  fontSize: '0.66rem',
                  color: LIGHT.inkSoft,
                  fontWeight: 700,
                  width: 42,
                  textAlign: 'right',
                }}
              >
                {row.total > 0 ? `${row.used}/${row.total}` : '∞'}
              </Typography>
            </Stack>
          ))}
        </Box>
      );
    default:
      return null;
  }
}

// ──────────────────────────────────────────────────────────────────────────
// Tabbed feature section — centerpiece of the page. Six tabs, each one a
// different module surface with copy + a signature mini-visual. AnimatePresence
// handles the cross-fade between tab contents so the section feels alive
// without being noisy.
// ──────────────────────────────────────────────────────────────────────────
interface FeatureTab {
  key: string;
  label: string;
  icon: React.ReactNode;
  accent: string;
  title: string;
  lead: string;
  bullets: string[];
  kind: string;
}

const FEATURE_TABS: FeatureTab[] = [
  {
    key: 'pipelines',
    label: 'Pipelines',
    icon: <IconBriefcase size={16} />,
    accent: tokens.colors.pink,
    title: 'Parent/child pipelines without the spreadsheet gymnastics',
    lead:
      'Capture a requirement once, spawn a child lane per marketer, and let each owner track their own pipeline while leadership still sees the roll-up.',
    bullets: [
      'Multi-assign a single req to 1–N marketers in one click',
      'Each child carries its own status, comments, and AI drafts',
      'Status filters hide parent rows so the grid stays honest',
      'Copy a req to kick off a fresh lane without cloning history',
    ],
    kind: 'parent-child',
  },
  {
    key: 'projects',
    label: 'Projects',
    icon: <IconFolders size={16} />,
    accent: '#F59E0B',
    title: 'Promote mature reqs to projects — with a clean handoff',
    lead:
      'Every ready-to-go requirement graduates into a project shell with contract, contacts, billing terms, and the organization snapshot frozen at conversion.',
    bullets: [
      'Bill-to selector (Client / Vendor / Prime Vendor) drives the invoice',
      'Contract uploads, additional details, and docs tracked per project',
      'Organization shortcode feeds sequential invoice numbers',
      'Status (Active/Hold/Ended/Terminated) auditable from one place',
    ],
    kind: 'stack',
  },
  {
    key: 'invoices',
    label: 'Invoices',
    icon: <IconFileInvoice size={16} />,
    accent: tokens.colors.blueDark,
    title: 'Invoice automation that still reads like a real invoice',
    lead:
      'Monthly timesheets become weekly line items, the PDF is generated from a live preview, and resend just re-opens the same compose dialog with the last send pre-filled.',
    bullets: [
      'Auto-draft from approved timesheets · override + manual raise supported',
      'Weekly chunks (1–7, 8–14, 15–21, 22–28, 29–end) match paper invoices',
      'Brand-tinted invoice preview with configurable Bill-To party',
      'Chip-style recipient input · Resend restores last message verbatim',
    ],
    kind: 'invoice',
  },
  {
    key: 'people',
    label: 'People Ops',
    icon: <IconUsers size={16} />,
    accent: '#10B981',
    title: 'Leaves, salary, and holidays — one system of record',
    lead:
      'Dynamic leave types with per-user/year allocations, component-level salary with monthly accrual, and holiday calendars synced from Nager.Date keep HR + payroll in sync.',
    bullets: [
      'Jan 1 00:00 IST auto-reset with prorata for mid-year joiners',
      'UL overflow when the balance runs out — no silent negatives',
      'react-to-pdf salary slips with live-preview edit flow',
      '10 medical days upfront · rest accrue 1/month',
    ],
    kind: 'leaves',
  },
  {
    key: 'performance',
    label: 'Performance',
    icon: <IconChartBar size={16} />,
    accent: '#7C3AED',
    title: 'Transparent scoring with tunable weights',
    lead:
      'Stage-weighted metrics for both Marketing and Support, with formulas an admin can tune from a single page — no black-box ratings, no screenshots-of-Excel reviews.',
    bullets: [
      'Parent/child-aware credit: submissions roll up, duplicates penalise',
      'Marketer + Support leaderboards with per-user detail drawers',
      'Weights editable by admin; scoring recomputes on demand',
      'Breakdown lines sum to the score — auditable by the team',
    ],
    kind: 'bars',
  },
  {
    key: 'intelligence',
    label: 'Intelligence',
    icon: <IconSparkles size={16} />,
    accent: tokens.colors.yellowDark,
    title: 'AI extract, smart drafts, and an ops-native command palette',
    lead:
      'Paste a raw job post and Unistack extracts every structured field. Draft an interview template in one keystroke. Search across everything with ⌘K — AI-ranked.',
    bullets: [
      'Extract structured reqs from unstructured posts or screenshots',
      'AI-drafted interview / invoice / notice templates — editable, not locked',
      '⌘K jumps across invoices, reqs, people, and performance',
      'Suggestions learn from the edits your team makes',
    ],
    kind: 'sphere',
  },
];

function FeatureTabsSection() {
  const [activeKey, setActiveKey] = useState(FEATURE_TABS[0].key);
  const active = useMemo(
    () => FEATURE_TABS.find((t) => t.key === activeKey) || FEATURE_TABS[0],
    [activeKey]
  );

  return (
    <Box
      id="modules"
      sx={{
        py: { xs: 8, md: 14 },
        position: 'relative',
        bgcolor: LIGHT.base,
        overflow: 'hidden',
      }}
    >
      {/* Soft aurora tint in the top-right */}
      <Box
        sx={{
          position: 'absolute',
          top: -180,
          right: -120,
          width: 520,
          height: 520,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${alpha(tokens.colors.pink, 0.18)} 0%, transparent 70%)`,
          filter: 'blur(100px)',
          pointerEvents: 'none',
        }}
      />

      <Container maxWidth="lg" sx={{ position: 'relative' }}>
        <MotionStack
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.5 }}
          alignItems="center"
          spacing={1.5}
          sx={{ mb: 5, textAlign: 'center' }}
        >
          <Chip
            label="THE COMMAND LAYERS"
            size="small"
            sx={{
              height: 22,
              fontSize: '0.66rem',
              fontWeight: 800,
              letterSpacing: '0.16em',
              bgcolor: alpha(tokens.colors.pink, 0.1),
              color: tokens.colors.pinkDark,
              border: `1px solid ${alpha(tokens.colors.pink, 0.25)}`,
            }}
          />
          <Typography
            variant="h2"
            fontWeight={900}
            sx={{
              fontSize: { xs: '1.95rem', md: '2.75rem' },
              color: LIGHT.ink,
              letterSpacing: '-0.02em',
              maxWidth: 760,
            }}
          >
            One frame,{' '}
            <Box
              component="span"
              sx={{
                background: tokens.gradients.pinkBlue,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              every workflow
            </Box>
          </Typography>
          <Typography
            variant="body1"
            sx={{
              color: LIGHT.inkSoft,
              maxWidth: 640,
              mt: 1,
              fontSize: { xs: '1rem', md: '1.08rem' },
              lineHeight: 1.6,
            }}
          >
            Pick a layer. Each one is a first-class surface built for the
            people who live in it — tied together by shared roles, one audit
            trail, and an AI copilot that learns your ops.
          </Typography>
        </MotionStack>

        {/* Tab strip — horizontally scrollable on mobile; pill-style with
            gradient underline on the active tab. */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: { xs: 'flex-start', md: 'center' },
            mb: 4,
            mx: { xs: -2, md: 0 },
            px: { xs: 2, md: 0 },
            overflowX: 'auto',
            '&::-webkit-scrollbar': { display: 'none' },
            scrollbarWidth: 'none',
          }}
        >
          <Stack
            direction="row"
            spacing={0.75}
            sx={{
              p: 0.75,
              borderRadius: 99,
              bgcolor: LIGHT.card,
              border: `1px solid ${LIGHT.rule}`,
              boxShadow: `0 8px 24px ${alpha(tokens.colors.blue, 0.08)}`,
            }}
          >
            {FEATURE_TABS.map((t) => {
              const isActive = t.key === activeKey;
              return (
                <Box
                  key={t.key}
                  onClick={() => setActiveKey(t.key)}
                  sx={{
                    position: 'relative',
                    px: 2,
                    py: 1,
                    borderRadius: 99,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.75,
                    color: isActive ? '#fff' : LIGHT.inkSoft,
                    background: isActive
                      ? tokens.gradients.pinkBlue
                      : 'transparent',
                    transition: 'all 0.25s ease',
                    whiteSpace: 'nowrap',
                    boxShadow: isActive
                      ? `0 10px 24px ${alpha(tokens.colors.pink, 0.3)}`
                      : 'none',
                    '&:hover': !isActive
                      ? { color: LIGHT.ink, bgcolor: alpha(tokens.colors.blue, 0.04) }
                      : undefined,
                  }}
                >
                  {t.icon}
                  <Typography
                    sx={{
                      fontSize: '0.82rem',
                      fontWeight: 800,
                      letterSpacing: '0.02em',
                    }}
                  >
                    {t.label}
                  </Typography>
                </Box>
              );
            })}
          </Stack>
        </Box>

        {/* Content panel */}
        <AnimatePresence mode="wait">
          <MotionBox
            key={active.key}
            initial={{ opacity: 0, y: 20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -14, scale: 0.98 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            sx={{
              position: 'relative',
              borderRadius: 5,
              bgcolor: LIGHT.card,
              border: `1px solid ${alpha(active.accent, 0.22)}`,
              boxShadow: `0 24px 60px ${alpha(active.accent, 0.12)}`,
              overflow: 'hidden',
            }}
          >
            <Box
              sx={{
                height: 4,
                background: `linear-gradient(90deg, ${active.accent}, ${alpha(active.accent, 0.25)})`,
              }}
            />
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', md: '1.2fr 1fr' },
                gap: { xs: 3, md: 5 },
                p: { xs: 3, md: 5 },
              }}
            >
              <Box>
                <Stack direction="row" spacing={1.25} alignItems="center" sx={{ mb: 2 }}>
                  <Box
                    sx={{
                      width: 42,
                      height: 42,
                      borderRadius: 2,
                      bgcolor: alpha(active.accent, 0.14),
                      color: active.accent,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {active.icon}
                  </Box>
                  <Typography
                    sx={{
                      fontSize: '0.7rem',
                      fontWeight: 800,
                      letterSpacing: '0.12em',
                      color: active.accent,
                      textTransform: 'uppercase',
                    }}
                  >
                    {active.label} layer
                  </Typography>
                </Stack>
                <Typography
                  variant="h4"
                  fontWeight={900}
                  sx={{
                    color: LIGHT.ink,
                    fontSize: { xs: '1.5rem', md: '1.85rem' },
                    letterSpacing: '-0.015em',
                    lineHeight: 1.2,
                    mb: 1.5,
                  }}
                >
                  {active.title}
                </Typography>
                <Typography
                  sx={{
                    color: LIGHT.inkSoft,
                    fontSize: '1rem',
                    lineHeight: 1.65,
                    mb: 2.5,
                  }}
                >
                  {active.lead}
                </Typography>
                <Stack spacing={1.25}>
                  {active.bullets.map((b, i) => (
                    <Stack
                      key={i}
                      direction="row"
                      spacing={1}
                      alignItems="flex-start"
                    >
                      <Box
                        sx={{
                          width: 20,
                          height: 20,
                          borderRadius: '50%',
                          bgcolor: alpha(active.accent, 0.14),
                          color: active.accent,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                          mt: 0.25,
                        }}
                      >
                        <IconCheck size={12} />
                      </Box>
                      <Typography
                        sx={{
                          color: LIGHT.ink,
                          fontSize: '0.92rem',
                          lineHeight: 1.55,
                        }}
                      >
                        {b}
                      </Typography>
                    </Stack>
                  ))}
                </Stack>
              </Box>
              <Box
                sx={{
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minHeight: { xs: 180, md: 260 },
                  borderRadius: 3,
                  bgcolor: alpha(active.accent, 0.05),
                  border: `1px dashed ${alpha(active.accent, 0.22)}`,
                  p: 3,
                }}
              >
                <ModuleVisual kind={active.kind} accent={active.accent} size="lg" />
              </Box>
            </Box>
          </MotionBox>
        </AnimatePresence>
      </Container>
    </Box>
  );
}

// ──────────────────────────────────────────────────────────────────────────
// Bento grid — a second, scroll-later unique moment. Five differently-sized
// cards form a dashboard-looking layout where each card teases a capability.
// ──────────────────────────────────────────────────────────────────────────
function BentoSection() {
  return (
    <Box
      sx={{
        py: { xs: 8, md: 14 },
        bgcolor: LIGHT.surface,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <Box
        sx={{
          position: 'absolute',
          bottom: -200,
          left: -100,
          width: 520,
          height: 520,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${alpha(tokens.colors.blue, 0.18)} 0%, transparent 70%)`,
          filter: 'blur(100px)',
          pointerEvents: 'none',
        }}
      />

      <Container maxWidth="lg" sx={{ position: 'relative' }}>
        <MotionStack
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.5 }}
          alignItems="center"
          spacing={1.5}
          sx={{ mb: 5, textAlign: 'center' }}
        >
          <Chip
            label="THE OPERATING STACK"
            size="small"
            sx={{
              height: 22,
              fontSize: '0.66rem',
              fontWeight: 800,
              letterSpacing: '0.16em',
              bgcolor: alpha(tokens.colors.blue, 0.1),
              color: tokens.colors.blueDark,
              border: `1px solid ${alpha(tokens.colors.blue, 0.25)}`,
            }}
          />
          <Typography
            variant="h2"
            fontWeight={900}
            sx={{
              fontSize: { xs: '1.95rem', md: '2.75rem' },
              color: LIGHT.ink,
              letterSpacing: '-0.02em',
              maxWidth: 760,
            }}
          >
            Replace six tools. Keep one login.
          </Typography>
        </MotionStack>

        {/* Bento — 4 columns on desktop, stacks on mobile. Cards span
            different row/column counts for the "dashboard on a page" feel. */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              sm: 'repeat(2, 1fr)',
              md: 'repeat(4, 1fr)',
            },
            gridAutoRows: { xs: 'auto', md: 180 },
            gap: { xs: 2, md: 2.5 },
          }}
        >
          <BentoCard
            span="col-span-2 row-span-2"
            accent={tokens.colors.pink}
            icon={<IconRoute size={18} />}
            chip="Pipelines"
            title="Parent/child lanes, no spreadsheet gymnastics"
            copy="Multi-assign one req to many marketers. Each child is its own lane — status, comments, AI drafts — rolling up to the parent for leadership."
            kind="parent-child"
            emphasis
          />
          <BentoCard
            span="col-span-1 row-span-1"
            accent={tokens.colors.yellowDark}
            icon={<IconSparkles size={18} />}
            chip="AI extract"
            title="Paste a post. Get structured fields."
            copy="One keystroke parses raw job postings into the right columns."
            kind="sphere"
            emphasis={false}
          />
          <BentoCard
            span="col-span-1 row-span-2"
            accent={tokens.colors.blueDark}
            icon={<IconFileInvoice size={18} />}
            chip="Invoicing"
            title="Invoices that write themselves"
            copy="Approved timesheets become weekly line items. PDF renders from the live preview. Resend re-opens the last message."
            kind="invoice"
            emphasis
          />
          <BentoCard
            span="col-span-1 row-span-1"
            accent="#10B981"
            icon={<IconCalendarEvent size={18} />}
            chip="Leaves"
            title="Accrual that respects the calendar"
            copy="Jan 1 auto-reset with prorata. UL overflow. Nager.Date holidays."
            kind="leaves"
            emphasis={false}
          />
          <BentoCard
            span="col-span-2 row-span-1"
            accent="#7C3AED"
            icon={<IconReportAnalytics size={18} />}
            chip="Performance"
            title="Scoring you can audit"
            copy="Stage-weighted metrics, tunable from one page. Submissions roll up; duplicates penalise. Review with the team, not against them."
            kind="bars"
            emphasis={false}
          />
        </Box>
      </Container>
    </Box>
  );
}

function BentoCard({
  span,
  accent,
  icon,
  chip,
  title,
  copy,
  kind,
  emphasis,
}: {
  span: string;
  accent: string;
  icon: React.ReactNode;
  chip: string;
  title: string;
  copy: string;
  kind: string;
  emphasis: boolean;
}) {
  // span is a tailwind-flavored hint; here we translate it to CSS grid spans.
  const cols = span.includes('col-span-2') ? 2 : 1;
  const rows = span.includes('row-span-2') ? 2 : 1;

  return (
    <MotionBox
      initial={{ opacity: 0, y: 32, scale: 0.96 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, amount: 0.25 }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -6, transition: { duration: 0.25 } }}
      sx={{
        position: 'relative',
        gridColumn: { xs: 'auto', md: `span ${cols}` },
        gridRow: { xs: 'auto', md: `span ${rows}` },
        p: 2.5,
        borderRadius: 4,
        bgcolor: LIGHT.card,
        border: `1px solid ${alpha(accent, 0.2)}`,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        minHeight: { xs: 220, md: 'auto' },
        transition: 'all 0.25s ease',
        '&:hover': {
          borderColor: alpha(accent, 0.45),
          boxShadow: `0 28px 56px ${alpha(accent, 0.18)}`,
        },
      }}
    >
      {/* Accent wash in the top-right corner */}
      <Box
        sx={{
          position: 'absolute',
          top: -40,
          right: -40,
          width: 180,
          height: 180,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${alpha(accent, 0.18)} 0%, transparent 70%)`,
          filter: 'blur(30px)',
          pointerEvents: 'none',
        }}
      />

      <Stack
        direction="row"
        spacing={1}
        alignItems="center"
        sx={{ mb: 1.25, position: 'relative' }}
      >
        <Box
          sx={{
            width: 30,
            height: 30,
            borderRadius: 1.5,
            bgcolor: alpha(accent, 0.14),
            color: accent,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          {icon}
        </Box>
        <Typography
          sx={{
            fontSize: '0.64rem',
            fontWeight: 800,
            letterSpacing: '0.12em',
            color: accent,
            textTransform: 'uppercase',
          }}
        >
          {chip}
        </Typography>
      </Stack>

      <Typography
        sx={{
          fontSize: emphasis ? '1.1rem' : '0.96rem',
          fontWeight: 800,
          color: LIGHT.ink,
          lineHeight: 1.25,
          mb: 0.75,
          position: 'relative',
        }}
      >
        {title}
      </Typography>
      <Typography
        sx={{
          fontSize: '0.82rem',
          color: LIGHT.inkSoft,
          lineHeight: 1.55,
          position: 'relative',
        }}
      >
        {copy}
      </Typography>

      {emphasis && (
        <Box
          sx={{
            mt: 'auto',
            pt: 2,
            position: 'relative',
            display: 'flex',
            alignItems: 'flex-end',
          }}
        >
          <Box sx={{ width: '100%' }}>
            <ModuleVisual kind={kind} accent={accent} size="md" />
          </Box>
        </Box>
      )}
    </MotionBox>
  );
}

// ──────────────────────────────────────────────────────────────────────────
// Persona cards — three team profiles. Kept the bones but re-tinted for
// the bright theme; the accent gradients and bullet lists are the same.
// ──────────────────────────────────────────────────────────────────────────
interface Persona {
  role: string;
  tagline: string;
  accent: string;
  gradient: string;
  icon: React.ReactNode;
  perks: string[];
}

const PERSONAS: Persona[] = [
  {
    role: 'Frontline',
    tagline: 'Source the work. Route it to the right owners. Own the top-of-funnel.',
    accent: tokens.colors.blueDark,
    gradient: 'linear-gradient(135deg, #37B7EA 0%, #EC4599 100%)',
    icon: <IconShieldCheck size={20} />,
    perks: [
      'AI drafts structured items from free-form input',
      'Route ownership with one-click handoffs',
      'Credit rolls up when owned work converts',
    ],
  },
  {
    role: 'Execution',
    tagline: 'Take ownership. Drive items to completion. Rack up wins.',
    accent: tokens.colors.pinkDark,
    gradient: 'linear-gradient(135deg, #EC4599 0%, #FCE441 100%)',
    icon: <IconBolt size={20} />,
    perks: [
      'Your workspace per assignment — no cross-owner noise',
      'Per-owner leaderboard with transparent weights',
      'AI-drafted templates for common touchpoints',
    ],
  },
  {
    role: 'Leadership',
    tagline: 'Govern access. Audit actions. Keep the organisation healthy.',
    accent: '#7C3AED',
    gradient: 'linear-gradient(135deg, #7C3AED 0%, #37B7EA 100%)',
    icon: <IconUsers size={20} />,
    perks: [
      'Per-role module gating from one page',
      'Presence, activity, and performance in one frame',
      'Login history and audit logs per user',
    ],
  },
];

function PersonaCard({ p, delay }: { p: Persona; delay: number }) {
  return (
    <MotionBox
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.5, delay }}
      sx={{
        position: 'relative',
        p: 3,
        borderRadius: 4,
        bgcolor: LIGHT.card,
        border: `1px solid ${LIGHT.rule}`,
        overflow: 'hidden',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        transition: 'all 0.25s ease',
        '&:hover': {
          borderColor: alpha(p.accent, 0.4),
          boxShadow: `0 22px 48px ${alpha(p.accent, 0.16)}`,
          transform: 'translateY(-4px)',
        },
      }}
    >
      <Box
        sx={{
          position: 'absolute',
          top: -40,
          right: -40,
          width: 180,
          height: 180,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${alpha(p.accent, 0.22)} 0%, transparent 70%)`,
          filter: 'blur(30px)',
          pointerEvents: 'none',
        }}
      />
      <Box
        sx={{
          width: 48,
          height: 48,
          borderRadius: 2,
          background: p.gradient,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#fff',
          mb: 2,
          boxShadow: `0 14px 28px ${alpha(p.accent, 0.32)}`,
        }}
      >
        {p.icon}
      </Box>
      <Typography variant="h5" fontWeight={800} sx={{ color: LIGHT.ink }}>
        {p.role}
      </Typography>
      <Typography sx={{ color: LIGHT.inkSoft, mb: 2.5, mt: 0.5, fontSize: '0.94rem' }}>
        {p.tagline}
      </Typography>
      <Stack spacing={1.25} sx={{ flex: 1 }}>
        {p.perks.map((perk, i) => (
          <Stack
            key={i}
            direction="row"
            spacing={1}
            alignItems="flex-start"
          >
            <Box
              sx={{
                width: 20,
                height: 20,
                borderRadius: '50%',
                bgcolor: alpha(p.accent, 0.14),
                color: p.accent,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                mt: 0.25,
              }}
            >
              <IconCheck size={11} />
            </Box>
            <Typography
              sx={{ color: LIGHT.ink, lineHeight: 1.55, fontSize: '0.92rem' }}
            >
              {perk}
            </Typography>
          </Stack>
        ))}
      </Stack>
    </MotionBox>
  );
}

// ──────────────────────────────────────────────────────────────────────────
// Inline stat tile — bright theme counterpart. Displays a big gradient
// number, counts up on viewport entry, label below in muted navy.
// ──────────────────────────────────────────────────────────────────────────
function StatTile({
  value,
  suffix,
  label,
  accent,
}: {
  value: number;
  suffix?: string;
  label: string;
  accent: string;
}) {
  const [display, setDisplay] = useState(0);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    if (!inView) return;
    const start = performance.now();
    const dur = 1400;
    let raf = 0;
    const tick = (t: number) => {
      const progress = Math.min(1, (t - start) / dur);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(value * eased));
      if (progress < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, value]);
  return (
    <MotionBox
      onViewportEnter={() => setInView(true)}
      viewport={{ once: true, amount: 0.5 }}
      sx={{
        position: 'relative',
        p: 2.5,
        borderRadius: 4,
        bgcolor: LIGHT.card,
        border: `1px solid ${alpha(accent, 0.2)}`,
        textAlign: 'center',
        boxShadow: `0 14px 32px ${alpha(accent, 0.08)}`,
        overflow: 'hidden',
      }}
    >
      <Box
        sx={{
          position: 'absolute',
          top: -50,
          right: -50,
          width: 160,
          height: 160,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${alpha(accent, 0.18)} 0%, transparent 70%)`,
          filter: 'blur(30px)',
          pointerEvents: 'none',
        }}
      />
      <Typography
        sx={{
          fontWeight: 900,
          fontSize: { xs: '2rem', md: '2.6rem' },
          background: `linear-gradient(135deg, ${accent} 0%, ${LIGHT.ink} 100%)`,
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          lineHeight: 1.1,
          position: 'relative',
        }}
      >
        {display.toLocaleString()}
        {suffix}
      </Typography>
      <Typography
        variant="caption"
        sx={{
          display: 'block',
          mt: 0.75,
          color: LIGHT.inkSoft,
          fontWeight: 800,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          fontSize: '0.68rem',
          position: 'relative',
        }}
      >
        {label}
      </Typography>
    </MotionBox>
  );
}

// ──────────────────────────────────────────────────────────────────────────
// Top nav — bright theme. Fixed-position; transparent at the top of the
// page, transitioning to a translucent cream with soft shadow once the
// user scrolls past the hero's top. The 32px scroll threshold is far
// enough that the nav doesn't flicker on sub-pixel scrolls but close
// enough that reaching for the sign-in button doesn't require going back
// to the very top.
//
// Links default to in-page anchors (scrolled into view); when the nav is
// rendered on a sub-route like /privacy, the anchors are swapped for
// `/#modules` etc. so they still work (they route back to the landing).
// Exported so the Legal pages can mount the same nav — consistent header
// + transparent/opaque transition all in one component.
// ──────────────────────────────────────────────────────────────────────────
export function LandingNav({
  onLogin,
  /** When the nav is rendered on a non-landing page (e.g. /privacy), the
   *  in-page anchor links won't work — they'd point at sections on the
   *  current route. Passing `anchorMode: 'route'` rewrites those as
   *  `/#id` so the browser routes home before scrolling. */
  anchorMode = 'local',
}: {
  onLogin: () => void;
  anchorMode?: 'local' | 'route';
}) {
  const [scrolled, setScrolled] = useState(false);

  // Snapshot scrollY on mount (handles hard-reload at mid-page) and listen
  // passively — the nav re-renders only when the state flips, not on every
  // scroll tick, so this is cheap.
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 32);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const navLinks = [
    { label: 'Platform', id: 'modules' },
    { label: 'Stack', id: 'stack' },
    { label: 'Roles', id: 'roles' },
    { label: 'Contact', id: 'contact' },
  ];

  return (
    <Box
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 30,
        px: { xs: 2, md: 4 },
        py: 1.75,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        bgcolor: scrolled ? alpha(LIGHT.base, 0.82) : 'transparent',
        backdropFilter: scrolled ? 'blur(14px)' : 'none',
        WebkitBackdropFilter: scrolled ? 'blur(14px)' : 'none',
        borderBottom: `1px solid ${scrolled ? LIGHT.rule : 'transparent'}`,
        boxShadow: scrolled
          ? `0 8px 24px ${alpha(LIGHT.ink, 0.06)}`
          : 'none',
        transition:
          'background-color 0.3s ease, backdrop-filter 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease',
      }}
    >
      <Stack
        direction="row"
        alignItems="center"
        spacing={1.25}
        component={RouterLink}
        to="/"
        sx={{
          textDecoration: 'none',
          color: 'inherit',
        }}
      >
        <Box
          component="img"
          src={unistack_small_img}
          alt="Unistack"
          sx={{
            width: 34,
            height: 34,
            borderRadius: 1.25,
            objectFit: 'contain',
          }}
        />
        <Typography
          variant="h6"
          fontWeight={900}
          sx={{
            color: LIGHT.ink,
            letterSpacing: '-0.01em',
            fontSize: { xs: '1.05rem', md: '1.2rem' },
          }}
        >
          Unistack
        </Typography>
        <Chip
          label="COMMAND CENTER"
          size="small"
          sx={{
            ml: 0.5,
            height: 20,
            fontSize: '0.56rem',
            fontWeight: 800,
            letterSpacing: '0.12em',
            bgcolor: alpha(tokens.colors.pink, 0.08),
            color: tokens.colors.pinkDark,
            border: `1px solid ${alpha(tokens.colors.pink, 0.25)}`,
            display: { xs: 'none', sm: 'flex' },
          }}
        />
      </Stack>

      <Stack
        direction="row"
        alignItems="center"
        spacing={3}
        sx={{ display: { xs: 'none', md: 'flex' } }}
      >
        {navLinks.map(({ label, id }) => (
          <Typography
            key={id}
            component="a"
            href={anchorMode === 'route' ? `/#${id}` : `#${id}`}
            sx={{
              color: LIGHT.inkSoft,
              fontSize: '0.88rem',
              fontWeight: 700,
              textDecoration: 'none',
              transition: 'color 0.15s ease',
              '&:hover': { color: LIGHT.ink },
            }}
          >
            {label}
          </Typography>
        ))}
      </Stack>

      <Button
        onClick={onLogin}
        variant="contained"
        endIcon={<IconArrowRight size={14} />}
        sx={{
          textTransform: 'none',
          fontWeight: 800,
          borderRadius: 2.5,
          px: 2.25,
          py: 0.75,
          background: tokens.gradients.pinkBlue,
          color: '#fff',
          boxShadow: `0 10px 24px ${alpha(tokens.colors.pink, 0.32)}`,
          '&:hover': {
            background: tokens.gradients.pinkBlue,
            filter: 'brightness(1.06)',
            boxShadow: `0 12px 28px ${alpha(tokens.colors.pink, 0.4)}`,
          },
        }}
      >
        Sign in
      </Button>
    </Box>
  );
}

// ──────────────────────────────────────────────────────────────────────────
// Main landing component
// ──────────────────────────────────────────────────────────────────────────
export default function Landing() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // If already signed in, skip the sales pitch.
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;

  const goLogin = () => navigate('/login');
  const goContact = () => {
    const el = document.getElementById('contact');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <Box sx={{ bgcolor: LIGHT.base, color: LIGHT.ink, overflow: 'hidden' }}>
      <LandingNav onLogin={goLogin} />

      {/* ───────────── HERO ─────────────
          Extra top padding clears the fixed nav. The nav is transparent
          at rest so content visually "starts" right under it; the padding
          is just to keep the chip readable. */}
      <Box
        sx={{
          position: 'relative',
          pt: { xs: 12, md: 16 },
          pb: { xs: 6, md: 12 },
          overflow: 'hidden',
        }}
      >
        <AuroraBackdrop />

        <Container
          maxWidth="lg"
          sx={{
            position: 'relative',
            zIndex: 2,
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: '1.1fr 1fr' },
            alignItems: 'center',
            gap: { xs: 5, md: 6 },
          }}
        >
          <MotionStack
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            spacing={3}
            sx={{ maxWidth: 620 }}
          >
            <Chip
              icon={<IconRadar2 size={14} />}
              label="UNISTACK · ONE-STOP COMMAND CENTER"
              sx={{
                alignSelf: 'flex-start',
                height: 28,
                fontSize: '0.68rem',
                fontWeight: 800,
                letterSpacing: '0.12em',
                bgcolor: '#fff',
                color: LIGHT.ink,
                border: `1px solid ${alpha(tokens.colors.pink, 0.3)}`,
                boxShadow: `0 8px 20px ${alpha(tokens.colors.pink, 0.08)}`,
                '.MuiChip-icon': { color: tokens.colors.pinkDark, ml: 0.75 },
                pr: 1.25,
              }}
            />
            <MotionTypography
              variant="h1"
              fontWeight={900}
              sx={{
                fontSize: { xs: '2.5rem', sm: '3.1rem', md: '3.9rem' },
                lineHeight: 1.03,
                letterSpacing: '-0.03em',
                color: LIGHT.ink,
              }}
            >
              The{' '}
              <Box
                component="span"
                sx={{
                  position: 'relative',
                  background: tokens.gradients.pinkBlue,
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  '&::after': {
                    content: '""',
                    position: 'absolute',
                    left: 0,
                    bottom: '-6%',
                    width: '100%',
                    height: 8,
                    borderRadius: 99,
                    background: tokens.gradients.pinkBlue,
                    opacity: 0.18,
                  },
                }}
              >
                one-stop command center
              </Box>
              {' '}for everything your ops team touches.
            </MotionTypography>
            <Typography
              variant="body1"
              sx={{
                color: LIGHT.inkSoft,
                fontSize: { xs: '1.05rem', md: '1.18rem' },
                lineHeight: 1.65,
                maxWidth: 560,
              }}
            >
              Unistack unifies pipelines, projects, invoices, people, and
              performance — one login, one audit trail, one bright focused
              frame. Replace six spreadsheets, three dashboards, and your
              weekly status call.
            </Typography>

            <Stack direction="row" spacing={1.5} sx={{ flexWrap: 'wrap', gap: 1.5 }}>
              <Button
                onClick={goLogin}
                variant="contained"
                size="large"
                endIcon={<IconArrowRight size={18} />}
                sx={{
                  textTransform: 'none',
                  fontWeight: 800,
                  borderRadius: 3,
                  px: 3,
                  py: 1.35,
                  background: tokens.gradients.pinkBlue,
                  boxShadow: `0 14px 32px ${alpha(tokens.colors.pink, 0.4)}`,
                  '&:hover': {
                    background: tokens.gradients.pinkBlue,
                    filter: 'brightness(1.06)',
                    boxShadow: `0 18px 40px ${alpha(tokens.colors.pink, 0.52)}`,
                  },
                }}
              >
                Sign in to Unistack
              </Button>
              <Button
                onClick={goContact}
                variant="outlined"
                size="large"
                endIcon={<IconArrowUpRight size={18} />}
                sx={{
                  textTransform: 'none',
                  fontWeight: 800,
                  borderRadius: 3,
                  px: 3,
                  py: 1.35,
                  color: LIGHT.ink,
                  borderColor: alpha(LIGHT.ink, 0.2),
                  bgcolor: alpha('#fff', 0.6),
                  '&:hover': {
                    borderColor: LIGHT.ink,
                    bgcolor: '#fff',
                  },
                }}
              >
                Explore the layers
              </Button>
            </Stack>

            <Stack
              direction="row"
              spacing={3}
              sx={{ pt: 1, flexWrap: 'wrap', gap: 2 }}
            >
              {[
                'SSO-ready',
                '99.9% uptime',
                'Role-based access',
                'Audit-logged',
              ].map((t) => (
                <Stack
                  key={t}
                  direction="row"
                  spacing={0.75}
                  alignItems="center"
                >
                  <IconCircleDot size={10} color="#10B981" />
                  <Typography
                    variant="caption"
                    sx={{
                      color: LIGHT.inkSoft,
                      fontWeight: 700,
                      letterSpacing: '0.06em',
                      fontSize: '0.7rem',
                      textTransform: 'uppercase',
                    }}
                  >
                    {t}
                  </Typography>
                </Stack>
              ))}
            </Stack>
          </MotionStack>

          {/* Right-side command palette mock */}
          <Box sx={{ display: 'flex', justifyContent: 'center' }}>
            <CommandPaletteMock />
          </Box>
        </Container>
      </Box>

      {/* ───────────── INLINE STAT STRIP ───────────── */}
      <Box sx={{ bgcolor: LIGHT.base, pb: { xs: 6, md: 10 }, position: 'relative', zIndex: 2 }}>
        <Container maxWidth="lg">
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: 'repeat(2, 1fr)',
                md: 'repeat(4, 1fr)',
              },
              gap: { xs: 2, md: 2.5 },
            }}
          >
            <StatTile value={6} label="Modules · one login" accent={tokens.colors.pink} />
            <StatTile value={1} label="Source of truth" accent={tokens.colors.blueDark} />
            <StatTile value={0} label="Spreadsheets required" accent="#10B981" />
            <StatTile value={99} suffix=".9%" label="Uptime SLA" accent={tokens.colors.yellowDark} />
          </Box>
        </Container>
      </Box>

      {/* ───────────── BRAND INTERLUDE (orbital core) ───────────── */}
      <BrandInterlude />

      {/* ───────────── TABBED FEATURE SECTION ───────────── */}
      <FeatureTabsSection />

      {/* ───────────── BENTO GRID ───────────── */}
      <Box id="stack">
        <BentoSection />
      </Box>

      {/* ───────────── PERSONAS ───────────── */}
      <Box
        id="roles"
        sx={{
          py: { xs: 8, md: 14 },
          bgcolor: LIGHT.base,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            top: -120,
            right: -80,
            width: 420,
            height: 420,
            borderRadius: '50%',
            background: `radial-gradient(circle, ${alpha(tokens.colors.yellow, 0.2)} 0%, transparent 70%)`,
            filter: 'blur(90px)',
            pointerEvents: 'none',
          }}
        />
        <Container maxWidth="lg" sx={{ position: 'relative' }}>
          <MotionStack
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.5 }}
            alignItems="center"
            spacing={1.5}
            sx={{ mb: 5, textAlign: 'center' }}
          >
            <Chip
              label="BUILT FOR EVERY SEAT"
              size="small"
              sx={{
                height: 22,
                fontSize: '0.65rem',
                fontWeight: 800,
                letterSpacing: '0.16em',
                bgcolor: alpha(tokens.colors.yellowDark, 0.1),
                color: tokens.colors.yellowDark,
                border: `1px solid ${alpha(tokens.colors.yellowDark, 0.25)}`,
              }}
            />
            <Typography
              variant="h2"
              fontWeight={900}
              sx={{
                fontSize: { xs: '1.95rem', md: '2.75rem' },
                color: LIGHT.ink,
                letterSpacing: '-0.02em',
                maxWidth: 720,
              }}
            >
              One app. Three very different daily jobs.
            </Typography>
            <Typography
              sx={{
                color: LIGHT.inkSoft,
                maxWidth: 620,
                mt: 1,
                fontSize: { xs: '1rem', md: '1.08rem' },
              }}
            >
              Frontline teams source the work. Execution teams close it.
              Leadership keeps the operating system healthy.
            </Typography>
          </MotionStack>

          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' },
              gap: 3,
            }}
          >
            {PERSONAS.map((p, i) => (
              <PersonaCard key={p.role} p={p} delay={i * 0.1} />
            ))}
          </Box>
        </Container>
      </Box>

      {/* ───────────── CTA / FOOTER ───────────── */}
      <Box
        id="contact"
        sx={{
          py: { xs: 8, md: 14 },
          bgcolor: LIGHT.surface,
          borderTop: `1px solid ${LIGHT.rule}`,
        }}
      >
        <Container maxWidth="md">
          <MotionBox
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.5 }}
            sx={{
              position: 'relative',
              p: { xs: 4, md: 7 },
              borderRadius: 6,
              bgcolor: LIGHT.card,
              border: `1px solid ${alpha(tokens.colors.pink, 0.2)}`,
              boxShadow: `0 32px 80px ${alpha(tokens.colors.pink, 0.14)}, 0 16px 40px ${alpha(tokens.colors.blue, 0.12)}`,
              overflow: 'hidden',
              textAlign: 'center',
            }}
          >
            <Box
              sx={{
                position: 'absolute',
                top: -80,
                right: -60,
                width: 280,
                height: 280,
                borderRadius: '50%',
                background: `radial-gradient(circle, ${alpha(tokens.colors.pink, 0.26)} 0%, transparent 70%)`,
                filter: 'blur(60px)',
                pointerEvents: 'none',
              }}
            />
            <Box
              sx={{
                position: 'absolute',
                bottom: -100,
                left: 10,
                width: 260,
                height: 260,
                borderRadius: '50%',
                background: `radial-gradient(circle, ${alpha(tokens.colors.blue, 0.22)} 0%, transparent 70%)`,
                filter: 'blur(60px)',
                pointerEvents: 'none',
              }}
            />
            <Box
              sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: 4,
                background: tokens.gradients.brand,
              }}
            />
            <Stack spacing={3} alignItems="center" sx={{ position: 'relative' }}>
              <Box
                sx={{
                  width: 56,
                  height: 56,
                  borderRadius: 2.5,
                  background: tokens.gradients.pinkBlue,
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: `0 18px 36px ${alpha(tokens.colors.pink, 0.4)}`,
                }}
              >
                <IconBuildingBank size={26} />
              </Box>
              <Typography
                variant="h2"
                fontWeight={900}
                sx={{
                  fontSize: { xs: '1.95rem', md: '2.7rem' },
                  letterSpacing: '-0.02em',
                  color: LIGHT.ink,
                }}
              >
                Ready to unify your stack?
              </Typography>
              <Typography
                sx={{
                  color: LIGHT.inkSoft,
                  maxWidth: 560,
                  fontSize: { xs: '1rem', md: '1.1rem' },
                  lineHeight: 1.6,
                }}
              >
                Sign in if you're already provisioned. Otherwise drop us a
                line — we'll get your org set up within a business day.
              </Typography>
              <Stack
                direction="row"
                spacing={1.5}
                flexWrap="wrap"
                justifyContent="center"
                sx={{ gap: 1.5 }}
              >
                <Button
                  onClick={goLogin}
                  variant="contained"
                  size="large"
                  endIcon={<IconArrowRight size={18} />}
                  sx={{
                    textTransform: 'none',
                    fontWeight: 800,
                    borderRadius: 3,
                    px: 3,
                    py: 1.25,
                    background: tokens.gradients.pinkBlue,
                    boxShadow: `0 14px 32px ${alpha(tokens.colors.pink, 0.4)}`,
                    '&:hover': {
                      background: tokens.gradients.pinkBlue,
                      filter: 'brightness(1.06)',
                    },
                  }}
                >
                  Sign in
                </Button>
                <Button
                  component="a"
                  href="mailto:info@unicodez.com?subject=Unistack%20demo%20request"
                  variant="outlined"
                  size="large"
                  startIcon={<IconMail size={18} />}
                  sx={{
                    textTransform: 'none',
                    fontWeight: 800,
                    borderRadius: 3,
                    px: 3,
                    py: 1.25,
                    color: LIGHT.ink,
                    borderColor: alpha(LIGHT.ink, 0.22),
                    bgcolor: '#fff',
                    '&:hover': {
                      borderColor: LIGHT.ink,
                      bgcolor: alpha(tokens.colors.blue, 0.04),
                    },
                  }}
                >
                  info@unicodez.com
                </Button>
              </Stack>
            </Stack>
          </MotionBox>
        </Container>

        <Container maxWidth="lg" sx={{ mt: 6 }}>
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={2}
            justifyContent="space-between"
            alignItems={{ xs: 'flex-start', sm: 'center' }}
            sx={{ pt: 4, borderTop: `1px solid ${LIGHT.rule}` }}
          >
            <Stack direction="row" alignItems="center" spacing={1.25}>
              <Box
                component="img"
                src={unistack_img}
                alt="Unistack"
                sx={{ height: 28, objectFit: 'contain' }}
              />
              <Typography
                variant="caption"
                sx={{ color: LIGHT.inkSoft, fontWeight: 600 }}
              >
                © {new Date().getFullYear()} Unicodez Softcorp · All rights reserved
              </Typography>
            </Stack>
            <Stack direction="row" spacing={3}>
              {[
                { label: 'Privacy', to: '/privacy' },
                { label: 'Terms', to: '/terms' },
                { label: 'Security', to: '/security' },
                { label: 'Status', to: '/status' },
              ].map((l) => (
                <Typography
                  key={l.label}
                  component={RouterLink}
                  to={l.to}
                  variant="caption"
                  sx={{
                    color: LIGHT.inkSoft,
                    fontWeight: 600,
                    textDecoration: 'none',
                    '&:hover': { color: LIGHT.ink },
                  }}
                >
                  {l.label}
                </Typography>
              ))}
            </Stack>
          </Stack>
        </Container>
      </Box>
    </Box>
  );
}
