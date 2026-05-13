import { Badge, IconButton, Tooltip, alpha } from '@mui/material';
import { IconBell } from '@tabler/icons-react';
import { tokens } from '../../theme/theme';

interface Props {
  unreadCount: number;
  onClick: () => void;
}

/**
 * Lightweight bell trigger. Render in the navbar; the parent owns the
 * drawer + polling state.
 *
 * Color: must adapt to the theme. The previous build hard-coded
 * `tokens.colors.lightText` (a dark navy `#032840`) which rendered
 * invisible on top of the dark-mode navbar background — the bell would
 * "glitch in" briefly on refresh (light flash before dark-mode CSS
 * reapplied) and then disappear once dark mode settled. Using
 * `text.primary` (which the AppBar itself already uses) means the icon
 * follows whatever the current palette's text colour is, so it stays
 * visible in both light and dark.
 */
export default function NotificationBell({ unreadCount, onClick }: Props) {
  const display = unreadCount > 99 ? '99+' : String(unreadCount);
  return (
    <Tooltip title="Notifications">
      <IconButton
        onClick={onClick}
        size="medium"
        sx={{
          color: 'text.primary',
          borderRadius: 2,
          '&:hover': { bgcolor: alpha(tokens.colors.pink, 0.08) },
        }}
        aria-label={`Open notifications — ${unreadCount} unread`}
      >
        <Badge
          badgeContent={unreadCount > 0 ? display : null}
          color="error"
          overlap="circular"
          sx={{
            '& .MuiBadge-badge': {
              fontSize: '0.62rem',
              fontWeight: 800,
              minWidth: 18,
              height: 18,
              padding: '0 4px',
            },
          }}
        >
          <IconBell size={22} />
        </Badge>
      </IconButton>
    </Tooltip>
  );
}
