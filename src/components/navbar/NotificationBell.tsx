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
 */
export default function NotificationBell({ unreadCount, onClick }: Props) {
  const display = unreadCount > 99 ? '99+' : String(unreadCount);
  return (
    <Tooltip title="Notifications">
      <IconButton
        onClick={onClick}
        size="medium"
        sx={{
          color: tokens.colors.lightText,
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
