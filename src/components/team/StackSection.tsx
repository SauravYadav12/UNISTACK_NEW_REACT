import { useState } from 'react';
import {
  Box,
  Typography,
  Stack,
  alpha,
  IconButton,
  Collapse,
  Tooltip,
} from '@mui/material';
import { IconChevronDown, IconFlame } from '@tabler/icons-react';
import { ITeam } from '../../Interfaces/types';
import { tokens } from '../../theme/theme';
import { getStackTheme } from './stackTheme';
import TeamRow from './TeamRow';

interface Props {
  stack: string;
  teams: ITeam[];
  onView: (t: ITeam) => void;
  /** Rank in the overall popularity order (1 = most teams) */
  rank?: number;
  /** Start expanded? Default true */
  defaultExpanded?: boolean;
}

export default function StackSection({
  stack,
  teams,
  onView,
  rank,
  defaultExpanded = true,
}: Props) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const theme = getStackTheme(stack, 16);

  if (!teams.length) return null;

  const isTop = rank !== undefined && rank <= 3;

  return (
    <Box
      sx={{
        mb: 1.5,
        borderRadius: 3,
        border: '1px solid',
        borderColor: expanded ? theme.border : 'divider',
        overflow: 'hidden',
        bgcolor: 'background.paper',
        transition: 'border-color 0.2s ease',
      }}
    >
      {/* Header — clickable to expand/collapse */}
      <Box
        onClick={() => setExpanded((v) => !v)}
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1.25,
          px: 2,
          py: 1.25,
          cursor: 'pointer',
          bgcolor: expanded ? theme.bg : 'transparent',
          transition: 'background 0.15s ease',
          '&:hover': { bgcolor: theme.bg },
        }}
      >
        <Box
          sx={{
            width: 32,
            height: 32,
            borderRadius: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: theme.gradient,
            color: '#fff',
            boxShadow: `0 2px 6px ${alpha(theme.color, 0.3)}`,
            flexShrink: 0,
          }}
        >
          {theme.icon}
        </Box>

        <Stack direction="row" alignItems="center" spacing={0.75} sx={{ minWidth: 0 }}>
          <Typography
            variant="subtitle1"
            fontWeight={800}
            sx={{ color: theme.dark, lineHeight: 1.2 }}
            noWrap
          >
            {stack}
          </Typography>
          <Box
            sx={{
              px: 0.875,
              py: 0.125,
              borderRadius: 1.5,
              bgcolor: alpha(theme.color, 0.14),
              color: theme.dark,
              fontSize: '0.7rem',
              fontWeight: 800,
              flexShrink: 0,
            }}
          >
            {teams.length}
          </Box>
          {isTop && (
            <Tooltip title={`#${rank} most popular stack`} arrow>
              <Box
                sx={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 0.25,
                  px: 0.625,
                  py: 0.125,
                  borderRadius: 1.5,
                  background:
                    rank === 1
                      ? 'linear-gradient(135deg, #FCE441 0%, #F59E0B 100%)'
                      : rank === 2
                        ? 'linear-gradient(135deg, #CBD5E1 0%, #94A3B8 100%)'
                        : 'linear-gradient(135deg, #FCA5A5 0%, #F87171 100%)',
                  color:
                    rank === 1 ? '#7C5800' : rank === 2 ? '#334155' : '#7F1D1D',
                  fontSize: '0.6rem',
                  fontWeight: 800,
                  flexShrink: 0,
                }}
              >
                {rank === 1 && <IconFlame size={10} />}#{rank}
              </Box>
            </Tooltip>
          )}
        </Stack>

        <Box sx={{ flex: 1 }} />

        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ fontWeight: 600, fontSize: '0.7rem', display: { xs: 'none', sm: 'inline' } }}
        >
          {expanded ? 'Collapse' : 'Expand'}
        </Typography>
        <IconButton
          size="small"
          onClick={(e) => {
            e.stopPropagation();
            setExpanded((v) => !v);
          }}
          sx={{
            color: theme.dark,
            transform: expanded ? 'rotate(180deg)' : 'none',
            transition: 'transform 0.2s ease',
          }}
        >
          <IconChevronDown size={16} />
        </IconButton>
      </Box>

      {/* Rows */}
      <Collapse in={expanded} timeout={180} unmountOnExit>
        <Box
          sx={{
            borderTop: `1px solid ${theme.border}`,
            bgcolor: 'background.paper',
          }}
        >
          {teams.map((t, i) => (
            <TeamRow
              key={t._id}
              team={t}
              onView={onView}
              highlightStack={stack}
              showDivider={i < teams.length - 1}
            />
          ))}
        </Box>
      </Collapse>
    </Box>
  );
}
