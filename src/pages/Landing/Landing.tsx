import {
  Avatar,
  Box,
  Button,
  Chip,
  Container,
  IconButton,
  Stack,
  Tooltip,
  Typography,
  alpha,
} from '@mui/material';
import { Navigate, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import {
  IconBriefcase,
  IconMicrophone,
  IconChartBar,
  IconFolders,
  IconUsers,
  IconSparkles,
  IconArrowRight,
  IconArrowUpRight,
  IconRadar2,
  IconCircleDot,
  IconBolt,
  IconShieldCheck,
  IconMail,
} from '@tabler/icons-react';
import { tokens } from '../../theme/theme';
import { useAuth } from '../../AuthGaurd/AuthContextProvider';
import unistack_img from '../../assets/unistack.png';
import unistack_small_img from '../../assets/unistack_small.png';

const MotionBox = motion.create(Box);
const MotionStack = motion.create(Stack);
const MotionTypography = motion.create(Typography);

// ──────────────────────────────────────────────────────────────────────────
// Orbital hero visual — central gradient sphere with three tilted orbit
// rings and one satellite per orbit revolving at its own speed. Built from
// pure CSS + SVG for lightweight rendering; no WebGL dependency.
// ──────────────────────────────────────────────────────────────────────────
function MissionCore() {
  return (
    <Box
      sx={{
        position: 'relative',
        width: { xs: 280, sm: 360, md: 440 },
        height: { xs: 280, sm: 360, md: 440 },
        flexShrink: 0,
        mx: 'auto',
        '@keyframes orbit-spin-1': {
          from: { transform: 'rotate(0deg)' },
          to: { transform: 'rotate(360deg)' },
        },
        '@keyframes orbit-spin-2': {
          from: { transform: 'rotate(0deg)' },
          to: { transform: 'rotate(-360deg)' },
        },
        '@keyframes orbit-spin-3': {
          from: { transform: 'rotate(0deg)' },
          to: { transform: 'rotate(360deg)' },
        },
        '@keyframes core-pulse': {
          '0%, 100%': {
            boxShadow: `0 0 60px ${alpha(tokens.colors.pink, 0.55)}, 0 0 120px ${alpha(tokens.colors.blue, 0.35)}, inset 0 0 40px ${alpha('#fff', 0.35)}`,
          },
          '50%': {
            boxShadow: `0 0 80px ${alpha(tokens.colors.pink, 0.75)}, 0 0 160px ${alpha(tokens.colors.blue, 0.5)}, inset 0 0 50px ${alpha('#fff', 0.55)}`,
          },
        },
      }}
    >
      {/* Central core sphere */}
      <Box
        sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          width: { xs: 110, sm: 140, md: 170 },
          height: { xs: 110, sm: 140, md: 170 },
          transform: 'translate(-50%, -50%)',
          borderRadius: '50%',
          background: `radial-gradient(circle at 30% 30%, ${alpha('#fff', 0.45)}, ${tokens.colors.pink} 35%, ${tokens.colors.pinkDark} 60%, ${tokens.colors.blueDark} 100%)`,
          animation: 'core-pulse 3s ease-in-out infinite',
          zIndex: 4,
        }}
      />
      {/* Brand mark inside the core */}
      <Box
        sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 5,
          fontSize: { xs: '1.5rem', md: '2rem' },
          fontWeight: 900,
          letterSpacing: '0.02em',
          color: '#fff',
          textShadow: `0 2px 14px ${alpha(tokens.colors.brand, 0.7)}`,
          pointerEvents: 'none',
        }}
      >
        U
      </Box>

      {/* Three orbital rings — each tilted differently, each with a satellite */}
      {[
        {
          tiltX: 22,
          tiltY: -12,
          scale: 0.95,
          speed: '18s',
          anim: 'orbit-spin-1',
          satColor: tokens.colors.yellow,
          satIcon: <IconBolt size={14} color={tokens.colors.brand} />,
        },
        {
          tiltX: -26,
          tiltY: 16,
          scale: 1.05,
          speed: '22s',
          anim: 'orbit-spin-2',
          satColor: tokens.colors.blueLight,
          satIcon: <IconRadar2 size={14} color={tokens.colors.brand} />,
        },
        {
          tiltX: 8,
          tiltY: 32,
          scale: 1.15,
          speed: '30s',
          anim: 'orbit-spin-3',
          satColor: tokens.colors.pinkLight,
          satIcon: <IconSparkles size={14} color={tokens.colors.brand} />,
        },
      ].map((orbit, i) => (
        <Box
          key={i}
          sx={{
            position: 'absolute',
            inset: 0,
            transform: `rotateX(${orbit.tiltX}deg) rotateY(${orbit.tiltY}deg) scale(${orbit.scale})`,
            transformStyle: 'preserve-3d',
          }}
        >
          {/* Ring (visual only) */}
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              borderRadius: '50%',
              border: `1px solid ${alpha('#fff', 0.18)}`,
              boxShadow: `inset 0 0 40px ${alpha(tokens.colors.blue, 0.08)}`,
            }}
          />
          {/* Rotating holder for satellite */}
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
                width: 28,
                height: 28,
                borderRadius: '50%',
                background: orbit.satColor,
                border: `2px solid ${alpha('#fff', 0.6)}`,
                boxShadow: `0 0 18px ${alpha(orbit.satColor, 0.7)}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 3,
              }}
            >
              {orbit.satIcon}
            </Box>
          </Box>
        </Box>
      ))}

      {/* Ambient outer glow */}
      <Box
        sx={{
          position: 'absolute',
          inset: '-8%',
          borderRadius: '50%',
          background: `radial-gradient(circle, ${alpha(tokens.colors.pink, 0.15)} 0%, ${alpha(tokens.colors.blue, 0.1)} 40%, transparent 70%)`,
          filter: 'blur(20px)',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />
    </Box>
  );
}

// ──────────────────────────────────────────────────────────────────────────
// Faux live-status ticker — decorative "mission control" marquee strip
// running along the bottom of the hero. Loops forever via CSS keyframe.
// ──────────────────────────────────────────────────────────────────────────
function StatusTicker() {
  const items = [
    '12 workflows live',
    '3 events scheduled today',
    '18 operators online',
    'Item #45 · In review',
    'Project #21 · Active',
    '6 decisions pending',
    '2 new items in last hour',
    '99.9% uptime · all systems nominal',
  ];
  const doubled = [...items, ...items];
  return (
    <Box
      sx={{
        width: '100%',
        overflow: 'hidden',
        borderTop: '1px solid',
        borderBottom: '1px solid',
        borderColor: alpha('#fff', 0.08),
        bgcolor: alpha('#000', 0.25),
        backdropFilter: 'blur(6px)',
        py: 1.25,
        '@keyframes ticker-slide': {
          from: { transform: 'translateX(0)' },
          to: { transform: 'translateX(-50%)' },
        },
      }}
    >
      <Stack
        direction="row"
        spacing={4}
        sx={{
          width: 'max-content',
          animation: 'ticker-slide 42s linear infinite',
          whiteSpace: 'nowrap',
        }}
      >
        {doubled.map((item, i) => (
          <Stack
            key={i}
            direction="row"
            alignItems="center"
            spacing={1}
            sx={{ px: 2 }}
          >
            <IconCircleDot size={10} color="#10B981" />
            <Typography
              variant="caption"
              sx={{
                color: alpha('#fff', 0.82),
                fontWeight: 700,
                letterSpacing: '0.08em',
                fontSize: '0.72rem',
                textTransform: 'uppercase',
              }}
            >
              {item}
            </Typography>
          </Stack>
        ))}
      </Stack>
    </Box>
  );
}

// ──────────────────────────────────────────────────────────────────────────
// Per-module signature mini-animations. Each card's visual echoes what
// that module actually does inside the product.
// ──────────────────────────────────────────────────────────────────────────
function ModuleVisual({ kind, accent }: { kind: string; accent: string }) {
  switch (kind) {
    case 'parent-child':
      // Parent card with children sliding in from the right
      return (
        <Box sx={{ position: 'relative', height: 80 }}>
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '60%',
              height: 22,
              borderRadius: 1,
              bgcolor: alpha(accent, 0.25),
              border: `1px solid ${alpha(accent, 0.5)}`,
            }}
          />
          {[0, 1, 2].map((i) => (
            <Box
              key={i}
              sx={{
                position: 'absolute',
                top: 30 + i * 16,
                left: 12,
                width: `${48 - i * 4}%`,
                height: 12,
                borderRadius: 1,
                bgcolor: alpha(accent, 0.18),
                border: `1px solid ${alpha(accent, 0.35)}`,
                '@keyframes child-slide': {
                  '0%': { transform: 'translateX(-16px)', opacity: 0 },
                  '20%, 100%': { transform: 'translateX(0)', opacity: 1 },
                },
                animation: `child-slide 4s ease-in-out ${0.4 + i * 0.25}s infinite`,
              }}
            />
          ))}
        </Box>
      );
    case 'pulse':
      // Pulse bars — interviewed pipeline stages lighting up
      return (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'flex-end',
            gap: 0.75,
            height: 80,
            justifyContent: 'center',
          }}
        >
          {[30, 55, 70, 45, 85, 60, 40].map((h, i) => (
            <Box
              key={i}
              sx={{
                width: 10,
                height: h,
                borderRadius: 1,
                background: `linear-gradient(180deg, ${alpha(accent, 0.85)}, ${alpha(accent, 0.35)})`,
                '@keyframes bar-pulse': {
                  '0%, 100%': { transform: 'scaleY(0.7)', opacity: 0.6 },
                  '50%': { transform: 'scaleY(1)', opacity: 1 },
                },
                transformOrigin: 'bottom',
                animation: `bar-pulse 2.4s ease-in-out ${i * 0.15}s infinite`,
              }}
            />
          ))}
        </Box>
      );
    case 'bars':
      // Performance score bars rising
      return (
        <Stack spacing={0.75} sx={{ height: 80, justifyContent: 'center' }}>
          {[78, 62, 91].map((v, i) => (
            <Box
              key={i}
              sx={{
                position: 'relative',
                width: '100%',
                height: 10,
                borderRadius: 99,
                bgcolor: alpha(accent, 0.12),
                overflow: 'hidden',
              }}
            >
              <Box
                sx={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  bottom: 0,
                  width: `${v}%`,
                  borderRadius: 99,
                  background: `linear-gradient(90deg, ${alpha(accent, 0.6)}, ${accent})`,
                  '@keyframes bar-fill': {
                    '0%': { transform: 'scaleX(0)' },
                    '50%, 100%': { transform: 'scaleX(1)' },
                  },
                  transformOrigin: 'left',
                  animation: `bar-fill 3.4s ease-out ${i * 0.3}s infinite`,
                }}
              />
            </Box>
          ))}
        </Stack>
      );
    case 'stack':
      // Project folders stacking
      return (
        <Box sx={{ position: 'relative', height: 80 }}>
          {[0, 1, 2].map((i) => (
            <Box
              key={i}
              sx={{
                position: 'absolute',
                left: 12 + i * 14,
                top: 14 + i * 10,
                width: 68,
                height: 44,
                borderRadius: 1.25,
                bgcolor: alpha(accent, 0.18 + i * 0.12),
                border: `1px solid ${alpha(accent, 0.4 + i * 0.15)}`,
                '@keyframes stack-drop': {
                  '0%': { transform: 'translateY(-10px)', opacity: 0 },
                  '20%, 100%': { transform: 'translateY(0)', opacity: 1 },
                },
                animation: `stack-drop 4s ease-out ${0.2 + i * 0.35}s infinite`,
              }}
            />
          ))}
        </Box>
      );
    case 'radar':
      // Tiny radar pulse
      return (
        <Box
          sx={{
            position: 'relative',
            width: 80,
            height: 80,
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
              inset: 14,
              borderRadius: '50%',
              border: `1px solid ${alpha(accent, 0.25)}`,
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
            { x: 22, y: 18 },
            { x: 58, y: 26 },
            { x: 34, y: 54 },
          ].map((d, i) => (
            <Box
              key={i}
              sx={{
                position: 'absolute',
                left: d.x,
                top: d.y,
                width: 6,
                height: 6,
                borderRadius: '50%',
                bgcolor: accent,
                boxShadow: `0 0 8px ${alpha(accent, 0.7)}`,
              }}
            />
          ))}
        </Box>
      );
    case 'sphere':
      // AI sphere with gentle yawn
      return (
        <Box
          sx={{
            position: 'relative',
            width: 72,
            height: 72,
            mx: 'auto',
            '@keyframes ai-sphere-dance': {
              '0%, 100%': {
                transform: 'translateY(0) scale(1, 1) rotate(0deg)',
              },
              '25%': { transform: 'translateY(-6px) scale(1, 1) rotate(0deg)' },
              '45%': {
                transform: 'translateY(-2px) scale(1.06, 0.92) rotate(-3deg)',
              },
              '55%': {
                transform: 'translateY(-8px) scale(1.08, 1.15) rotate(3deg)',
              },
              '75%': {
                transform: 'translateY(-2px) scale(1, 1) rotate(180deg)',
              },
              '95%': {
                transform: 'translateY(0) scale(1, 1) rotate(360deg)',
              },
            },
          }}
        >
          <Box
            sx={{
              width: '100%',
              height: '100%',
              borderRadius: '50%',
              background: `radial-gradient(circle at 30% 30%, ${alpha('#fff', 0.5)}, ${tokens.colors.pink} 40%, ${tokens.colors.blueDark} 100%)`,
              boxShadow: `0 0 18px ${alpha(tokens.colors.pink, 0.5)}`,
              animation: 'ai-sphere-dance 8s ease-in-out infinite',
            }}
          />
        </Box>
      );
    default:
      return null;
  }
}

interface ModuleDef {
  name: string;
  tagline: string;
  icon: React.ReactNode;
  accent: string;
  kind: string;
}

const MODULES: ModuleDef[] = [
  {
    name: 'Pipelines',
    tagline:
      'Structured work items with parent/child lanes · per-owner tracking · auto-rollup reporting to leadership',
    icon: <IconBriefcase size={18} />,
    accent: tokens.colors.pink,
    kind: 'parent-child',
  },
  {
    name: 'Events',
    tagline:
      'Schedule, track, and close operational touchpoints · routing across parties · template generator',
    icon: <IconMicrophone size={18} />,
    accent: tokens.colors.blue,
    kind: 'pulse',
  },
  {
    name: 'Performance',
    tagline:
      'Transparent, tunable scoring · stage-weighted metrics · admin-auditable formulas',
    icon: <IconChartBar size={18} />,
    accent: '#10B981',
    kind: 'bars',
  },
  {
    name: 'Projects',
    tagline:
      'Promote mature items to projects · per-organization governance · clean handoffs',
    icon: <IconFolders size={18} />,
    accent: '#F59E0B',
    kind: 'stack',
  },
  {
    name: 'People Ops',
    tagline:
      'Live team radar · role management · shift & location controls · audit trails',
    icon: <IconUsers size={18} />,
    accent: '#7C3AED',
    kind: 'radar',
  },
  {
    name: 'AI Copilot',
    tagline:
      'Extract structured data from free-form input · generate role-specific drafts · contextual suggestions',
    icon: <IconSparkles size={18} />,
    accent: tokens.colors.yellowDark,
    kind: 'sphere',
  },
];

function ModuleCard({ m, delay }: { m: ModuleDef; delay: number }) {
  return (
    <MotionBox
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.5, delay }}
      whileHover={{ y: -6 }}
      sx={{
        position: 'relative',
        p: 3,
        borderRadius: 4,
        bgcolor: 'background.paper',
        border: '1px solid',
        borderColor: 'divider',
        overflow: 'hidden',
        transition: 'all 0.25s ease',
        '&:hover': {
          borderColor: alpha(m.accent, 0.45),
          boxShadow: `0 20px 48px ${alpha(m.accent, 0.18)}`,
        },
      }}
    >
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 3,
          background: `linear-gradient(90deg, ${m.accent}, ${alpha(m.accent, 0.3)})`,
        }}
      />
      <Stack direction="row" spacing={1.25} alignItems="center" sx={{ mb: 1.5 }}>
        <Box
          sx={{
            width: 36,
            height: 36,
            borderRadius: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: m.accent,
            bgcolor: alpha(m.accent, 0.14),
          }}
        >
          {m.icon}
        </Box>
        <Typography variant="h6" fontWeight={800} sx={{ color: '#0A3555' }}>
          {m.name}
        </Typography>
      </Stack>
      <Typography
        variant="body2"
        sx={{
          color: 'text.secondary',
          mb: 2.5,
          minHeight: 44,
          lineHeight: 1.55,
        }}
      >
        {m.tagline}
      </Typography>
      {/* Signature animation */}
      <Box sx={{ mt: 1 }}>
        <ModuleVisual kind={m.kind} accent={m.accent} />
      </Box>
    </MotionBox>
  );
}

// ──────────────────────────────────────────────────────────────────────────
// Persona cards — one per team profile. Shows "day in the life" bullets.
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
        bgcolor: 'background.paper',
        border: '1px solid',
        borderColor: 'divider',
        overflow: 'hidden',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        transition: 'all 0.25s ease',
        '&:hover': {
          borderColor: alpha(p.accent, 0.4),
          boxShadow: `0 18px 42px ${alpha(p.accent, 0.14)}`,
          transform: 'translateY(-4px)',
        },
      }}
    >
      <Box
        sx={{
          position: 'absolute',
          top: -40,
          right: -40,
          width: 160,
          height: 160,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${alpha(p.accent, 0.18)} 0%, transparent 70%)`,
          filter: 'blur(30px)',
          pointerEvents: 'none',
        }}
      />
      <Box
        sx={{
          width: 44,
          height: 44,
          borderRadius: 2,
          background: p.gradient,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#fff',
          mb: 2,
          boxShadow: `0 12px 28px ${alpha(p.accent, 0.32)}`,
        }}
      >
        {p.icon}
      </Box>
      <Typography variant="h5" fontWeight={800} sx={{ color: '#0A3555' }}>
        {p.role}
      </Typography>
      <Typography
        variant="body2"
        sx={{ color: 'text.secondary', mb: 2.5, mt: 0.5 }}
      >
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
                width: 5,
                height: 5,
                borderRadius: '50%',
                bgcolor: p.accent,
                mt: 0.85,
                flexShrink: 0,
              }}
            />
            <Typography
              variant="body2"
              sx={{ color: '#0A3555', lineHeight: 1.5 }}
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
// Counter tile — counts up from 0 to `value` once the viewport sees it.
// ──────────────────────────────────────────────────────────────────────────
function CounterStat({
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
      // easeOutCubic
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
      sx={{ textAlign: 'center' }}
    >
      <Typography
        variant="h3"
        sx={{
          fontWeight: 900,
          fontSize: { xs: '2rem', md: '2.75rem' },
          background: `linear-gradient(135deg, ${accent} 0%, #fff 100%)`,
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          lineHeight: 1,
        }}
      >
        {display.toLocaleString()}
        {suffix}
      </Typography>
      <Typography
        variant="caption"
        sx={{
          display: 'block',
          mt: 1,
          color: alpha('#fff', 0.72),
          fontWeight: 700,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          fontSize: '0.7rem',
        }}
      >
        {label}
      </Typography>
    </MotionBox>
  );
}

// ──────────────────────────────────────────────────────────────────────────
// Top nav — brand logo left, nav links center, "Sign in" right.
// ──────────────────────────────────────────────────────────────────────────
function LandingNav({ onLogin }: { onLogin: () => void }) {
  return (
    <Box
      sx={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 10,
        px: { xs: 2, md: 4 },
        py: 2.5,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
    >
      <Stack direction="row" alignItems="center" spacing={1.25}>
        <Box
          component="img"
          src={unistack_small_img}
          alt="Unistack"
          sx={{
            width: 34,
            height: 34,
            borderRadius: 1,
            objectFit: 'contain',
          }}
        />
        <Typography
          variant="h6"
          fontWeight={900}
          sx={{
            color: '#fff',
            letterSpacing: '-0.01em',
            fontSize: { xs: '1.05rem', md: '1.2rem' },
          }}
        >
          Unistack
        </Typography>
        <Chip
          label="MISSION CONTROL"
          size="small"
          sx={{
            ml: 0.5,
            height: 20,
            fontSize: '0.56rem',
            fontWeight: 800,
            letterSpacing: '0.12em',
            bgcolor: alpha('#fff', 0.1),
            color: '#A7F3D0',
            border: `1px solid ${alpha('#10B981', 0.35)}`,
          }}
        />
      </Stack>

      <Stack
        direction="row"
        alignItems="center"
        spacing={3}
        sx={{ display: { xs: 'none', md: 'flex' } }}
      >
        {[
          { label: 'Platform', id: 'modules' },
          { label: 'Roles', id: 'roles' },
          { label: 'Contact', id: 'contact' },
        ].map(({ label, id }) => (
          <Typography
            key={id}
            component="a"
            href={`#${id}`}
            sx={{
              color: alpha('#fff', 0.75),
              fontSize: '0.88rem',
              fontWeight: 600,
              textDecoration: 'none',
              transition: 'color 0.15s ease',
              '&:hover': { color: '#fff' },
            }}
          >
            {label}
          </Typography>
        ))}
      </Stack>

      <Stack direction="row" spacing={1.25} alignItems="center">
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
            boxShadow: `0 8px 20px ${alpha(tokens.colors.pink, 0.4)}`,
            '&:hover': {
              background: tokens.gradients.pinkBlue,
              filter: 'brightness(1.08)',
              boxShadow: `0 10px 24px ${alpha(tokens.colors.pink, 0.5)}`,
            },
          }}
        >
          Sign in
        </Button>
      </Stack>
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
    <Box sx={{ bgcolor: '#F5F7FA', overflow: 'hidden' }}>
      {/* ───────────── HERO ───────────── */}
      <Box
        sx={{
          position: 'relative',
          minHeight: { xs: 'auto', md: '100vh' },
          background: tokens.gradients.darkSurface,
          color: '#fff',
          overflow: 'hidden',
          pt: { xs: 10, md: 12 },
          pb: { xs: 6, md: 0 },
        }}
      >
        {/* Ambient orbs */}
        <Box
          sx={{
            position: 'absolute',
            top: -80,
            right: -80,
            width: 420,
            height: 420,
            borderRadius: '50%',
            background: `radial-gradient(circle, ${alpha(tokens.colors.pink, 0.28)} 0%, transparent 70%)`,
            filter: 'blur(80px)',
            pointerEvents: 'none',
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            bottom: -100,
            left: '10%',
            width: 400,
            height: 400,
            borderRadius: '50%',
            background: `radial-gradient(circle, ${alpha(tokens.colors.blue, 0.22)} 0%, transparent 70%)`,
            filter: 'blur(80px)',
            pointerEvents: 'none',
          }}
        />
        {/* Subtle grid backdrop */}
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `linear-gradient(to right, ${alpha('#fff', 0.04)} 1px, transparent 1px), linear-gradient(to bottom, ${alpha('#fff', 0.04)} 1px, transparent 1px)`,
            backgroundSize: '64px 64px',
            maskImage: `radial-gradient(ellipse at 50% 40%, black 40%, transparent 80%)`,
            WebkitMaskImage: `radial-gradient(ellipse at 50% 40%, black 40%, transparent 80%)`,
            pointerEvents: 'none',
          }}
        />
        {/* Top brand stripe */}
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

        <LandingNav onLogin={goLogin} />

        <Container
          maxWidth="lg"
          sx={{
            position: 'relative',
            zIndex: 2,
            display: 'flex',
            flexDirection: { xs: 'column-reverse', md: 'row' },
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: { xs: 5, md: 6 },
            minHeight: { md: 'calc(100vh - 64px)' },
            py: { xs: 4, md: 6 },
          }}
        >
          <MotionStack
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            spacing={3}
            sx={{ flex: 1, maxWidth: 560 }}
          >
            <Chip
              icon={<IconRadar2 size={14} />}
              label="OPS, BUT CALMER"
              sx={{
                alignSelf: 'flex-start',
                height: 26,
                fontSize: '0.68rem',
                fontWeight: 800,
                letterSpacing: '0.12em',
                bgcolor: alpha('#fff', 0.08),
                color: '#A7F3D0',
                border: `1px solid ${alpha('#10B981', 0.35)}`,
                '.MuiChip-icon': { color: '#A7F3D0', ml: 0.75 },
                pr: 1,
              }}
            />
            <MotionTypography
              variant="h1"
              fontWeight={900}
              sx={{
                fontSize: { xs: '2.5rem', sm: '3rem', md: '3.75rem' },
                lineHeight: 1.05,
                letterSpacing: '-0.03em',
              }}
            >
              Run your ops like{' '}
              <Box
                component="span"
                sx={{
                  background: tokens.gradients.pinkBlue,
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                Mission Control
              </Box>
              .
            </MotionTypography>
            <Typography
              variant="body1"
              sx={{
                color: alpha('#fff', 0.82),
                fontSize: { xs: '1rem', md: '1.12rem' },
                lineHeight: 1.65,
                maxWidth: 520,
              }}
            >
              Unistack is the command center for your operational pipelines,
              project delivery, and people management — one frame where
              frontline teams source work, execution teams ship outcomes, and
              leadership sees everything.
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
                  py: 1.25,
                  background: tokens.gradients.pinkBlue,
                  boxShadow: `0 14px 32px ${alpha(tokens.colors.pink, 0.42)}`,
                  '&:hover': {
                    background: tokens.gradients.pinkBlue,
                    filter: 'brightness(1.08)',
                    boxShadow: `0 18px 40px ${alpha(tokens.colors.pink, 0.55)}`,
                  },
                }}
              >
                Sign in to Mission Control
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
                  py: 1.25,
                  color: '#fff',
                  borderColor: alpha('#fff', 0.35),
                  '&:hover': {
                    borderColor: '#fff',
                    bgcolor: alpha('#fff', 0.08),
                  },
                }}
              >
                Request a demo
              </Button>
            </Stack>

            <Stack
              direction="row"
              spacing={3}
              sx={{ pt: 1, opacity: 0.7, flexWrap: 'wrap', gap: 2 }}
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
                      color: alpha('#fff', 0.75),
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

          <MotionBox
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
            sx={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <MissionCore />
          </MotionBox>
        </Container>

        <Box
          sx={{
            position: 'relative',
            zIndex: 2,
            mt: { xs: 5, md: 0 },
          }}
        >
          <StatusTicker />
        </Box>
      </Box>

      {/* ───────────── MODULES ───────────── */}
      <Box
        id="modules"
        sx={{
          py: { xs: 8, md: 12 },
          position: 'relative',
          background: `linear-gradient(180deg, #F5F7FA 0%, #FFFFFF 100%)`,
        }}
      >
        <Container maxWidth="lg">
          <MotionStack
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.5 }}
            alignItems="center"
            spacing={1.5}
            sx={{ mb: 6, textAlign: 'center' }}
          >
            <Chip
              label="THE STACK"
              size="small"
              sx={{
                height: 22,
                fontSize: '0.65rem',
                fontWeight: 800,
                letterSpacing: '0.16em',
                bgcolor: alpha(tokens.colors.blue, 0.12),
                color: tokens.colors.blueDark,
                border: `1px solid ${alpha(tokens.colors.blue, 0.3)}`,
              }}
            />
            <Typography
              variant="h2"
              fontWeight={900}
              sx={{
                fontSize: { xs: '1.85rem', md: '2.5rem' },
                color: '#0A3555',
                letterSpacing: '-0.02em',
                maxWidth: 760,
              }}
            >
              Six modules. One cockpit. Every lever where you'd expect it.
            </Typography>
            <Typography
              variant="body1"
              sx={{
                color: 'text.secondary',
                maxWidth: 640,
                mt: 1,
              }}
            >
              Each module is a first-class surface with its own command
              affordances — hand-crafted for the team that lives in it, tied
              into the rest of Unistack by shared roles, audit trails, and AI
              copiloting.
            </Typography>
          </MotionStack>

          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: '1fr',
                sm: 'repeat(2, 1fr)',
                md: 'repeat(3, 1fr)',
              },
              gap: 3,
            }}
          >
            {MODULES.map((m, i) => (
              <ModuleCard key={m.name} m={m} delay={i * 0.08} />
            ))}
          </Box>
        </Container>
      </Box>

      {/* ───────────── PERSONAS ───────────── */}
      <Box
        id="roles"
        sx={{
          py: { xs: 8, md: 12 },
          background: `linear-gradient(180deg, #FFFFFF 0%, #F5F7FA 100%)`,
        }}
      >
        <Container maxWidth="lg">
          <MotionStack
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.5 }}
            alignItems="center"
            spacing={1.5}
            sx={{ mb: 6, textAlign: 'center' }}
          >
            <Chip
              label="BUILT FOR EVERY SEAT"
              size="small"
              sx={{
                height: 22,
                fontSize: '0.65rem',
                fontWeight: 800,
                letterSpacing: '0.16em',
                bgcolor: alpha(tokens.colors.pink, 0.12),
                color: tokens.colors.pinkDark,
                border: `1px solid ${alpha(tokens.colors.pink, 0.3)}`,
              }}
            />
            <Typography
              variant="h2"
              fontWeight={900}
              sx={{
                fontSize: { xs: '1.85rem', md: '2.5rem' },
                color: '#0A3555',
                letterSpacing: '-0.02em',
                maxWidth: 720,
              }}
            >
              One app. Three very different daily jobs.
            </Typography>
            <Typography
              variant="body1"
              sx={{
                color: 'text.secondary',
                maxWidth: 620,
                mt: 1,
              }}
            >
              Frontline teams source the work. Execution teams close it.
              Leadership keeps the operating system healthy. Unistack meets
              each team where they are.
            </Typography>
          </MotionStack>

          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: '1fr',
                md: 'repeat(3, 1fr)',
              },
              gap: 3,
            }}
          >
            {PERSONAS.map((p, i) => (
              <PersonaCard key={p.role} p={p} delay={i * 0.1} />
            ))}
          </Box>
        </Container>
      </Box>

      {/* ───────────── STATS BAND ───────────── */}
      <Box
        sx={{
          position: 'relative',
          py: { xs: 6, md: 8 },
          background: tokens.gradients.darkSurface,
          color: '#fff',
          overflow: 'hidden',
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            background: `radial-gradient(ellipse at 50% 50%, ${alpha(tokens.colors.pink, 0.12)} 0%, transparent 65%)`,
            pointerEvents: 'none',
          }}
        />
        <Container maxWidth="lg" sx={{ position: 'relative' }}>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: 'repeat(2, 1fr)',
                md: 'repeat(4, 1fr)',
              },
              gap: 4,
            }}
          >
            <CounterStat
              value={10200}
              suffix="+"
              label="Work items tracked"
              accent={tokens.colors.pink}
            />
            <CounterStat
              value={2450}
              suffix="+"
              label="Events scheduled"
              accent={tokens.colors.blueLight}
            />
            <CounterStat
              value={520}
              suffix="+"
              label="Projects shipped"
              accent="#FCD34D"
            />
            <CounterStat
              value={99}
              suffix=".9%"
              label="Uptime SLA"
              accent="#10B981"
            />
          </Box>
        </Container>
      </Box>

      {/* ───────────── CTA / FOOTER ───────────── */}
      <Box
        id="contact"
        sx={{
          py: { xs: 8, md: 12 },
          bgcolor: '#F5F7FA',
          borderTop: '1px solid',
          borderColor: 'divider',
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
              p: { xs: 4, md: 6 },
              borderRadius: 6,
              background: tokens.gradients.darkSurface,
              color: '#fff',
              overflow: 'hidden',
              textAlign: 'center',
            }}
          >
            <Box
              sx={{
                position: 'absolute',
                top: -60,
                right: -40,
                width: 260,
                height: 260,
                borderRadius: '50%',
                background: `radial-gradient(circle, ${alpha(tokens.colors.pink, 0.24)} 0%, transparent 70%)`,
                filter: 'blur(60px)',
                pointerEvents: 'none',
              }}
            />
            <Box
              sx={{
                position: 'absolute',
                bottom: -80,
                left: 10,
                width: 240,
                height: 240,
                borderRadius: '50%',
                background: `radial-gradient(circle, ${alpha(tokens.colors.blue, 0.2)} 0%, transparent 70%)`,
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
                height: 3,
                background: tokens.gradients.brand,
              }}
            />
            <Stack
              spacing={3}
              alignItems="center"
              sx={{ position: 'relative' }}
            >
              <Typography
                variant="h2"
                fontWeight={900}
                sx={{
                  fontSize: { xs: '1.85rem', md: '2.5rem' },
                  letterSpacing: '-0.02em',
                }}
              >
                Ready to take the console?
              </Typography>
              <Typography
                variant="body1"
                sx={{
                  color: alpha('#fff', 0.82),
                  maxWidth: 560,
                  fontSize: { xs: '1rem', md: '1.08rem' },
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
                    boxShadow: `0 12px 28px ${alpha(tokens.colors.pink, 0.4)}`,
                    '&:hover': {
                      background: tokens.gradients.pinkBlue,
                      filter: 'brightness(1.08)',
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
                    color: '#fff',
                    borderColor: alpha('#fff', 0.35),
                    '&:hover': {
                      borderColor: '#fff',
                      bgcolor: alpha('#fff', 0.08),
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
            sx={{ pt: 4, borderTop: '1px solid', borderColor: 'divider' }}
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
                sx={{ color: 'text.secondary', fontWeight: 600 }}
              >
                © {new Date().getFullYear()} Unicodez Softcorp · All rights
                reserved
              </Typography>
            </Stack>
            <Stack direction="row" spacing={3}>
              {['Privacy', 'Terms', 'Security', 'Status'].map((l) => (
                <Typography
                  key={l}
                  component="a"
                  href="#"
                  variant="caption"
                  sx={{
                    color: 'text.secondary',
                    fontWeight: 600,
                    textDecoration: 'none',
                    '&:hover': { color: tokens.colors.blueDark },
                  }}
                >
                  {l}
                </Typography>
              ))}
            </Stack>
          </Stack>
        </Container>
      </Box>
    </Box>
  );
}
