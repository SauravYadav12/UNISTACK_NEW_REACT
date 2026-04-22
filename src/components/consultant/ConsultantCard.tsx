import { Box, Typography, Stack, alpha, Tooltip, Avatar, Chip } from '@mui/material';
import { motion } from 'framer-motion';
import {
  IconMapPin,
  IconMail,
  IconPhone,
  IconBrandSkype,
  IconBriefcase,
  IconId,
  IconEye,
  IconSchool,
  IconWorld,
  IconClock,
  IconSparkles,
} from '@tabler/icons-react';
import { IConsultant } from '../../Interfaces/types';
import { tokens } from '../../theme/theme';
import { getPersonColor, getInitials } from '../ui/PersonPill';

const MotionBox = motion.create(Box);

// ── Visa tier theming — each visa type gets its own stamp color ──
interface VisaTheme {
  color: string;
  dark: string;
  gradient: string;
  label: string;
  short: string;
  icon: React.ReactNode;
}

function getVisaTheme(visa?: string): VisaTheme {
  const key = (visa || '').toLowerCase();
  if (key.includes('citizen')) {
    return {
      color: '#F59E0B',
      dark: '#B45309',
      gradient: 'linear-gradient(135deg, #F59E0B 0%, #FCD34D 100%)',
      label: visa || 'US Citizen',
      short: 'Citizen',
      icon: <IconWorld size={12} />,
    };
  }
  if (key.includes('green') || key === 'gc') {
    return {
      color: '#10B981',
      dark: '#047857',
      gradient: 'linear-gradient(135deg, #10B981 0%, #6EE7B7 100%)',
      label: visa || 'Green Card',
      short: 'GC',
      icon: <IconId size={12} />,
    };
  }
  if (key.includes('ead')) {
    return {
      color: '#7C3AED',
      dark: '#5B21B6',
      gradient: 'linear-gradient(135deg, #7C3AED 0%, #A78BFA 100%)',
      label: visa || 'GC EAD',
      short: 'EAD',
      icon: <IconId size={12} />,
    };
  }
  if (key.includes('h1') || key.includes('h-1')) {
    return {
      color: '#EC4599',
      dark: '#B91C6D',
      gradient: 'linear-gradient(135deg, #EC4599 0%, #F472B6 100%)',
      label: visa || 'H1B',
      short: 'H1B',
      icon: <IconId size={12} />,
    };
  }
  return {
    color: '#94A3B8',
    dark: '#475569',
    gradient: 'linear-gradient(135deg, #94A3B8 0%, #CBD5E1 100%)',
    label: visa || 'Unknown',
    short: visa || '—',
    icon: <IconId size={12} />,
  };
}

interface Props {
  consultant: IConsultant;
  onView: (c: IConsultant) => void;
  index?: number;
}

export default function ConsultantCard({ consultant, onView, index = 0 }: Props) {
  const visa = getVisaTheme(consultant.visaStatus);
  const personColor = getPersonColor(consultant.consultantName || consultant.consultantId);

  const isActive = (consultant.consultantStatus || '').toLowerCase() === 'active';
  const isLooking = (consultant.lookingToChange || '').toLowerCase() === 'yes' ||
    (consultant.lookingToChange || '').toLowerCase() === 'true';
  const projectCount = consultant.projects?.length || 0;
  const currentProjects = consultant.projects?.filter((p) => p.isCurrent) || [];
  const currentProject = currentProjects[0];

  const yearsInUs = consultant.cameToUsYear
    ? Math.max(0, new Date().getFullYear() - parseInt(consultant.cameToUsYear, 10))
    : null;

  const initials = getInitials(consultant.consultantName || consultant.consultantId);

  return (
    <MotionBox
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.03, 0.5), duration: 0.35 }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      onClick={() => onView(consultant)}
      sx={{
        cursor: 'pointer',
        borderRadius: 4,
        bgcolor: 'background.paper',
        border: '1px solid',
        borderColor: 'divider',
        overflow: 'hidden',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        minHeight: 340,
        transition: 'box-shadow 0.25s ease, border-color 0.25s ease',
        '&:hover': {
          borderColor: alpha(visa.color, 0.45),
          boxShadow: `0 12px 32px ${alpha(visa.color, 0.18)}`,
        },
      }}
    >
      {/* Passport banner — colored by visa tier */}
      <Box
        sx={{
          position: 'relative',
          height: 76,
          background: visa.gradient,
          overflow: 'hidden',
        }}
      >
        {/* decorative stamp-like diagonal stripes */}
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `repeating-linear-gradient(45deg, ${alpha('#fff', 0.1)} 0 1px, transparent 1px 12px)`,
            pointerEvents: 'none',
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            top: -20,
            right: -10,
            width: 120,
            height: 120,
            borderRadius: '50%',
            background: `radial-gradient(circle, ${alpha('#fff', 0.2)} 0%, transparent 70%)`,
            pointerEvents: 'none',
          }}
        />

        {/* top-right status + looking flags */}
        <Stack
          direction="row"
          spacing={0.75}
          sx={{ position: 'absolute', top: 10, right: 10, zIndex: 1 }}
        >
          {isLooking && (
            <Tooltip title="Looking for new role" arrow>
              <Box
                sx={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 0.375,
                  px: 0.875,
                  py: 0.375,
                  borderRadius: 1.5,
                  bgcolor: alpha('#fff', 0.92),
                  color: tokens.colors.pinkDark,
                  fontSize: '0.62rem',
                  fontWeight: 800,
                  letterSpacing: '0.04em',
                  boxShadow: `0 2px 6px ${alpha('#000', 0.15)}`,
                  animation: 'pulseGlow 2s ease-in-out infinite',
                  '@keyframes pulseGlow': {
                    '0%, 100%': { boxShadow: `0 0 0 0 ${alpha(tokens.colors.pink, 0.4)}` },
                    '50%': { boxShadow: `0 0 0 6px ${alpha(tokens.colors.pink, 0)}` },
                  },
                }}
              >
                <IconSparkles size={10} />
                OPEN
              </Box>
            </Tooltip>
          )}
          <Box
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 0.375,
              px: 0.875,
              py: 0.375,
              borderRadius: 1.5,
              bgcolor: isActive
                ? alpha(tokens.colors.success, 0.95)
                : alpha('#fff', 0.92),
              color: isActive ? '#fff' : '#475569',
              fontSize: '0.62rem',
              fontWeight: 800,
              letterSpacing: '0.04em',
              boxShadow: `0 2px 6px ${alpha('#000', 0.15)}`,
            }}
          >
            <Box
              sx={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                bgcolor: isActive ? '#6EE7B7' : '#CBD5E1',
                boxShadow: isActive ? '0 0 6px #6EE7B7' : 'none',
              }}
            />
            {isActive ? 'ACTIVE' : 'INACTIVE'}
          </Box>
        </Stack>

        {/* ID badge on top-left */}
        <Box
          sx={{
            position: 'absolute',
            top: 10,
            left: 10,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 0.5,
            px: 0.875,
            py: 0.25,
            borderRadius: 1.5,
            bgcolor: alpha('#000', 0.22),
            color: '#fff',
            fontSize: '0.65rem',
            fontWeight: 700,
            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
            letterSpacing: '0.04em',
          }}
        >
          <IconId size={11} />
          {consultant.consultantId}
        </Box>

        {/* Visa stamp at bottom-right of banner */}
        <Box
          sx={{
            position: 'absolute',
            bottom: 8,
            right: 10,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 0.375,
            px: 1,
            py: 0.375,
            borderRadius: 1.5,
            bgcolor: alpha('#000', 0.25),
            color: '#fff',
            fontSize: '0.68rem',
            fontWeight: 800,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            border: `1px dashed ${alpha('#fff', 0.4)}`,
          }}
        >
          {visa.icon}
          {visa.short}
        </Box>
      </Box>

      {/* Avatar anchored to banner edge */}
      <Box
        sx={{
          position: 'relative',
          height: 0,
          display: 'flex',
          justifyContent: 'center',
        }}
      >
        <Avatar
          sx={{
            width: 68,
            height: 68,
            fontSize: '1.125rem',
            fontWeight: 800,
            background: personColor.gradient,
            color: '#fff',
            border: '4px solid',
            borderColor: 'background.paper',
            boxShadow: `0 4px 14px ${alpha(personColor.color, 0.35)}`,
            transform: 'translateY(-50%)',
          }}
        >
          {initials}
        </Avatar>
      </Box>

      {/* Body */}
      <Box sx={{ pt: 5, px: 2.25, pb: 2, flex: 1, display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ textAlign: 'center', mb: 1.5 }}>
          <Typography
            variant="subtitle1"
            fontWeight={800}
            noWrap
            sx={{ color: 'text.primary', lineHeight: 1.2 }}
          >
            {consultant.consultantName || '—'}
          </Typography>
          {consultant.psuedoName && (
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ display: 'block', fontStyle: 'italic', mt: 0.25 }}
              noWrap
            >
              “{consultant.psuedoName}”
            </Typography>
          )}
        </Box>

        {/* Stats strip */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1fr',
            gap: 1,
            mb: 1.5,
            borderRadius: 2,
            border: '1px solid',
            borderColor: 'divider',
            p: 1,
            bgcolor: alpha(tokens.colors.brand, 0.02),
          }}
        >
          <StatCell
            icon={<IconId size={12} />}
            label="Visa"
            value={visa.short}
            color={visa.color}
          />
          <StatCell
            icon={<IconClock size={12} />}
            label="Zone"
            value={consultant.timeZone || '—'}
            color={tokens.colors.blue}
          />
          <StatCell
            icon={<IconWorld size={12} />}
            label={yearsInUs !== null ? 'Yrs US' : 'Origin'}
            value={
              yearsInUs !== null
                ? `${yearsInUs}`
                : consultant.originCountry || '—'
            }
            color={tokens.colors.pink}
          />
        </Box>

        {/* Education */}
        {consultant.degree && (
          <Stack
            direction="row"
            spacing={0.75}
            alignItems="center"
            sx={{
              mb: 1,
              px: 1.25,
              py: 0.75,
              borderRadius: 1.5,
              bgcolor: alpha(tokens.colors.blue, 0.05),
              border: `1px solid ${alpha(tokens.colors.blue, 0.1)}`,
            }}
          >
            <IconSchool size={14} color={tokens.colors.blueDark} />
            <Box sx={{ minWidth: 0, flex: 1 }}>
              <Typography
                variant="caption"
                fontWeight={700}
                sx={{ color: '#0A3555', display: 'block', lineHeight: 1.2 }}
                noWrap
              >
                {consultant.degree}
              </Typography>
              {consultant.university && (
                <Typography
                  variant="caption"
                  color="text.secondary"
                  noWrap
                  sx={{ fontSize: '0.68rem', display: 'block' }}
                >
                  {consultant.university}
                  {consultant.yearPassing && ` · ${consultant.yearPassing}`}
                </Typography>
              )}
            </Box>
          </Stack>
        )}

        {/* Current project */}
        {currentProject && (
          <Stack
            direction="row"
            spacing={0.75}
            alignItems="center"
            sx={{
              mb: 1,
              px: 1.25,
              py: 0.75,
              borderRadius: 1.5,
              bgcolor: alpha(tokens.colors.success, 0.06),
              border: `1px solid ${alpha(tokens.colors.success, 0.15)}`,
            }}
          >
            <IconBriefcase size={14} color={tokens.colors.success} />
            <Box sx={{ minWidth: 0, flex: 1 }}>
              <Typography
                variant="caption"
                fontWeight={700}
                sx={{ color: tokens.colors.success, display: 'block', lineHeight: 1.2 }}
                noWrap
              >
                {currentProject.projectName || 'Current project'}
              </Typography>
              {(currentProject.projectCity || currentProject.projectState) && (
                <Typography
                  variant="caption"
                  color="text.secondary"
                  noWrap
                  sx={{ fontSize: '0.68rem', display: 'block' }}
                >
                  <IconMapPin size={9} style={{ verticalAlign: '-1px' }} />{' '}
                  {[currentProject.projectCity, currentProject.projectState].filter(Boolean).join(', ')}
                </Typography>
              )}
            </Box>
          </Stack>
        )}

        {/* Location row (only if no current project) */}
        {!currentProject && consultant.currentAddress && (
          <Stack
            direction="row"
            spacing={0.75}
            alignItems="center"
            sx={{ mb: 1, px: 1.25 }}
          >
            <IconMapPin size={12} color={tokens.colors.lightTextSecondary} />
            <Typography
              variant="caption"
              color="text.secondary"
              noWrap
              sx={{ fontSize: '0.7rem', minWidth: 0, flex: 1 }}
            >
              {consultant.currentAddress}
            </Typography>
          </Stack>
        )}

        <Box sx={{ flex: 1 }} />

        {/* Bottom row — quick contacts + project count + View */}
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          spacing={1}
          sx={{ mt: 1.25, pt: 1.25, borderTop: `1px dashed ${alpha(tokens.colors.brand, 0.12)}` }}
        >
          <Stack direction="row" spacing={0.5}>
            <ContactIcon
              href={consultant.email ? `mailto:${consultant.email}` : undefined}
              tooltip={consultant.email}
              icon={<IconMail size={13} />}
              color={tokens.colors.blueDark}
            />
            <ContactIcon
              href={consultant.phone ? `tel:${consultant.phone}` : undefined}
              tooltip={consultant.phone}
              icon={<IconPhone size={13} />}
              color={tokens.colors.success}
            />
            <ContactIcon
              tooltip={consultant.skypeId}
              icon={<IconBrandSkype size={13} />}
              color={tokens.colors.blue}
            />
            {projectCount > 0 && (
              <Chip
                label={`${projectCount}`}
                size="small"
                icon={<IconBriefcase size={10} />}
                sx={{
                  height: 22,
                  fontSize: '0.68rem',
                  fontWeight: 700,
                  bgcolor: alpha(tokens.colors.pink, 0.1),
                  color: tokens.colors.pinkDark,
                  border: 'none',
                  ml: 0.5,
                  '& .MuiChip-icon': { color: tokens.colors.pinkDark, ml: 0.5 },
                }}
              />
            )}
          </Stack>

          <Box
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 0.5,
              px: 1,
              py: 0.375,
              borderRadius: 1.5,
              background: 'linear-gradient(135deg, #032840 0%, #0A3555 100%)',
              color: '#fff',
              fontSize: '0.7rem',
              fontWeight: 700,
              transition: 'all 0.15s ease',
              '&:hover': {
                background: 'linear-gradient(135deg, #0A3555 0%, #032840 100%)',
                boxShadow: `0 4px 10px ${alpha('#032840', 0.25)}`,
              },
            }}
          >
            <IconEye size={12} />
            View
          </Box>
        </Stack>
      </Box>
    </MotionBox>
  );
}

function StatCell({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: string;
}) {
  return (
    <Box sx={{ textAlign: 'center', minWidth: 0 }}>
      <Stack direction="row" spacing={0.375} justifyContent="center" alignItems="center" sx={{ color, mb: 0.25 }}>
        {icon}
        <Typography
          variant="caption"
          sx={{
            fontSize: '0.58rem',
            fontWeight: 700,
            letterSpacing: '0.04em',
            color,
          }}
        >
          {label.toUpperCase()}
        </Typography>
      </Stack>
      <Typography
        variant="caption"
        noWrap
        sx={{
          display: 'block',
          fontSize: '0.8rem',
          fontWeight: 700,
          color: 'text.primary',
          lineHeight: 1,
        }}
      >
        {value}
      </Typography>
    </Box>
  );
}

function ContactIcon({
  href,
  tooltip,
  icon,
  color,
}: {
  href?: string;
  tooltip?: string;
  icon: React.ReactNode;
  color: string;
}) {
  const active = Boolean(tooltip);
  const element = (
    <Box
      component={active && href ? 'a' : 'div'}
      href={href}
      onClick={(e: React.MouseEvent) => e.stopPropagation()}
      sx={{
        width: 26,
        height: 26,
        borderRadius: 1.25,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: active ? alpha(color, 0.1) : alpha(tokens.colors.brand, 0.04),
        color: active ? color : alpha(tokens.colors.brand, 0.3),
        cursor: active && href ? 'pointer' : 'default',
        textDecoration: 'none',
        transition: 'all 0.15s ease',
        '&:hover': active && href
          ? {
              bgcolor: alpha(color, 0.18),
              transform: 'translateY(-1px)',
            }
          : undefined,
      }}
    >
      {icon}
    </Box>
  );
  if (tooltip) {
    return (
      <Tooltip title={tooltip} arrow>
        {element}
      </Tooltip>
    );
  }
  return element;
}
