import { Chip, ChipProps, useTheme, alpha } from '@mui/material';

type StatusType = 'success' | 'warning' | 'error' | 'info' | 'default' | 'primary';

interface StatusBadgeProps extends Omit<ChipProps, 'color'> {
  status: StatusType;
  pulse?: boolean;
}

const statusColorMap: Record<StatusType, { key: string; bg: string }> = {
  success: { key: 'success.main', bg: 'success.light' },
  warning: { key: 'warning.main', bg: 'warning.light' },
  error: { key: 'error.main', bg: 'error.light' },
  info: { key: 'info.main', bg: 'info.light' },
  primary: { key: 'primary.main', bg: 'primary.light' },
  default: { key: 'text.secondary', bg: 'action.hover' },
};

export default function StatusBadge({
  status,
  pulse = false,
  label,
  sx,
  ...props
}: StatusBadgeProps) {
  const theme = useTheme();
  const colors = statusColorMap[status];

  return (
    <Chip
      label={label}
      size="small"
      sx={{
        fontWeight: 600,
        fontSize: '0.7rem',
        height: 24,
        color: colors.key,
        backgroundColor: alpha(
          (theme.palette as unknown as Record<string, Record<string, string>>)[status === 'default' ? 'text' : status]?.main || theme.palette.text.secondary,
          0.1
        ),
        border: 'none',
        ...(pulse && {
          animation: 'pulse-badge 1.5s ease-in-out infinite',
          '@keyframes pulse-badge': {
            '0%, 100%': { transform: 'scale(1)' },
            '50%': { transform: 'scale(1.05)' },
          },
        }),
        ...sx,
      }}
      {...props}
    />
  );
}
