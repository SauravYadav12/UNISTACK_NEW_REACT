import {
  Box,
  Typography,
  Stack,
  alpha,
  Avatar,
  Tooltip,
} from '@mui/material';
import { motion } from 'framer-motion';
import { IconChevronRight, IconUser, IconCalendar } from '@tabler/icons-react';
import moment from 'moment';
import { ITeam } from '../../Interfaces/types';
import { tokens } from '../../theme/theme';
import { getPersonColor, getInitials } from '../ui/PersonPill';
import { getStackTheme, parseStackList } from './stackTheme';
import { dateFormate2 } from '../constants';

const MotionBox = motion.create(Box);

interface Props {
  team: ITeam;
  onView: (t: ITeam) => void;
  /** When shown inside a lane, the lane's stack is used to theme the left
   *  stripe and promoted to the front of the chip row. */
  highlightStack?: string;
  /** Whether to draw a bottom divider. Sections manage dividers themselves. */
  showDivider?: boolean;
}

export default function TeamRow({
  team,
  onView,
  highlightStack,
  showDivider = true,
}: Props) {
  const stacks = parseStackList(team.teckStack);

  // Theme stack: lane highlight if present, otherwise primary
  const themeStackName =
    (highlightStack && stacks.find((s) => s.toLowerCase() === highlightStack.toLowerCase())) ||
    stacks[0] ||
    'Generalist';
  const theme = getStackTheme(themeStackName, 11);

  // Re-order chips so the highlighted lane's stack is first
  const orderedStacks = (() => {
    if (!highlightStack || stacks.length === 0) return stacks;
    const lower = highlightStack.toLowerCase();
    const primary = stacks.find((s) => s.toLowerCase() === lower);
    if (!primary) return stacks;
    return [primary, ...stacks.filter((s) => s.toLowerCase() !== lower)];
  })();

  const dev = team.developerName || '—';
  const devColor = getPersonColor(dev);

  return (
    <MotionBox
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
      onClick={() => onView(team)}
      sx={{
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        gap: 1.25,
        pl: 2.25, // leaves room for the 3px left stripe
        pr: 1,
        py: 1,
        cursor: 'pointer',
        borderBottom: showDivider ? '1px solid' : 'none',
        borderColor: 'divider',
        transition: 'background 0.15s ease',
        '&:hover': {
          bgcolor: theme.bg,
        },
        '&:hover .row-arrow': {
          transform: 'translateX(2px)',
          bgcolor: theme.color,
          color: '#fff',
        },
      }}
    >
      {/* Left colored stripe (stack color) */}
      <Box
        sx={{
          position: 'absolute',
          left: 0,
          top: 6,
          bottom: 6,
          width: 3,
          borderRadius: '0 2px 2px 0',
          bgcolor: theme.color,
        }}
      />

      {/* Avatar — developer */}
      <Avatar
        sx={{
          width: 34,
          height: 34,
          fontSize: '0.7rem',
          fontWeight: 800,
          background: devColor.gradient,
          color: '#fff',
          flexShrink: 0,
          boxShadow: `0 2px 6px ${alpha(devColor.color, 0.3)}`,
        }}
      >
        {getInitials(dev)}
      </Avatar>

      {/* Primary info: name + meta */}
      <Box sx={{ minWidth: 0, flex: 1 }}>
        <Typography
          variant="body2"
          fontWeight={700}
          noWrap
          sx={{ color: 'text.primary', lineHeight: 1.25 }}
          title={team.teamName || 'Unnamed team'}
        >
          {team.teamName || 'Unnamed team'}
        </Typography>
        <Stack
          direction="row"
          spacing={0.5}
          alignItems="center"
          sx={{ minWidth: 0 }}
        >
          <IconUser size={10} color={devColor.dark} />
          <Typography
            variant="caption"
            noWrap
            sx={{
              color: devColor.dark,
              fontWeight: 600,
              fontSize: '0.7rem',
            }}
            title={dev}
          >
            {dev}
          </Typography>
          <Typography
            variant="caption"
            sx={{ color: 'text.disabled', fontSize: '0.7rem', px: 0.25 }}
          >
            ·
          </Typography>
          <Typography
            variant="caption"
            noWrap
            sx={{
              color: 'text.secondary',
              fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
              fontSize: '0.68rem',
              fontWeight: 600,
            }}
            title={team.teamId}
          >
            {team.teamId}
          </Typography>
          {team.createdAt && (
            <>
              <Typography
                variant="caption"
                sx={{
                  color: 'text.disabled',
                  fontSize: '0.7rem',
                  px: 0.25,
                  display: { xs: 'none', sm: 'inline' },
                }}
              >
                ·
              </Typography>
              <Stack
                direction="row"
                spacing={0.25}
                alignItems="center"
                sx={{ display: { xs: 'none', sm: 'inline-flex' } }}
              >
                <IconCalendar size={10} color={tokens.colors.lightTextSecondary} />
                <Typography
                  variant="caption"
                  sx={{ fontSize: '0.68rem', color: 'text.secondary' }}
                >
                  {moment(team.createdAt).format(dateFormate2)}
                </Typography>
              </Stack>
            </>
          )}
        </Stack>
      </Box>

      {/* Stack chips — right side */}
      <Stack
        direction="row"
        spacing={0.5}
        alignItems="center"
        sx={{
          display: { xs: 'none', sm: 'flex' },
          flexShrink: 0,
          maxWidth: { sm: 180, md: 260 },
          overflow: 'hidden',
        }}
      >
        {orderedStacks.slice(0, 3).map((s, i) => {
          const t = getStackTheme(s, 11);
          const isPrimary = i === 0;
          return (
            <Tooltip key={s} title={isPrimary ? `Primary: ${s}` : s} arrow>
              <Box
                sx={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 0.375,
                  px: 0.75,
                  py: 0.25,
                  borderRadius: 1.25,
                  bgcolor: t.bg,
                  color: t.dark,
                  border: `1px solid ${isPrimary ? t.border : alpha(t.color, 0.12)}`,
                  fontSize: '0.66rem',
                  fontWeight: 700,
                  maxWidth: 110,
                  overflow: 'hidden',
                }}
              >
                <Box sx={{ display: 'inline-flex', flexShrink: 0 }}>{t.icon}</Box>
                <Box
                  component="span"
                  sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                >
                  {s}
                </Box>
              </Box>
            </Tooltip>
          );
        })}
        {orderedStacks.length > 3 && (
          <Tooltip
            title={orderedStacks.slice(3).join(' · ')}
            arrow
          >
            <Box
              sx={{
                px: 0.75,
                py: 0.25,
                borderRadius: 1.25,
                bgcolor: alpha(tokens.colors.brand, 0.06),
                color: 'text.secondary',
                fontSize: '0.66rem',
                fontWeight: 700,
              }}
            >
              +{orderedStacks.length - 3}
            </Box>
          </Tooltip>
        )}
      </Stack>

      {/* Right arrow button */}
      <Box
        className="row-arrow"
        sx={{
          width: 30,
          height: 30,
          borderRadius: 1.25,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: alpha(theme.color, 0.08),
          color: theme.dark,
          flexShrink: 0,
          transition: 'all 0.15s ease',
        }}
      >
        <IconChevronRight size={16} />
      </Box>
    </MotionBox>
  );
}
