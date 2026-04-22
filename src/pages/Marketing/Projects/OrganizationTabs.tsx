import {
  Box,
  Button,
  IconButton,
  Stack,
  Tooltip,
  Typography,
  alpha,
} from '@mui/material';
import { IconPencil, IconPlus } from '@tabler/icons-react';
import { tokens } from '../../../theme/theme';
import { IOrganization } from '../../../Interfaces/organization';

interface Props {
  orgs: IOrganization[];
  activeId: string | null;
  counts: Record<string, number>;
  /** When false the add/edit affordances are suppressed — used for the
   *  project-coordinator role, which reads orgs but can't mutate them. */
  canManage?: boolean;
  onChange: (id: string) => void;
  onAdd: () => void;
  onEdit: (org: IOrganization) => void;
}

/**
 * Horizontal brand-chip tab strip. One tab per active org + an inline
 * "add org" CTA. The active tab gets the pink→blue gradient treatment so the
 * selection is unmistakable.
 */
export default function OrganizationTabs({
  orgs,
  activeId,
  counts,
  canManage = true,
  onChange,
  onAdd,
  onEdit,
}: Props) {
  if (!orgs.length) {
    // PC sees a gentler note instead of the create CTA — they can't make one.
    if (!canManage) {
      return (
        <Box
          sx={{
            p: 2,
            mb: 2,
            borderRadius: 3,
            border: `1px dashed ${alpha(tokens.colors.blue, 0.3)}`,
            bgcolor: alpha(tokens.colors.blue, 0.04),
          }}
        >
          <Typography sx={{ fontWeight: 700 }}>No organizations yet</Typography>
          <Typography variant="caption" color="text.secondary">
            Ask an admin to set one up before projects can be added.
          </Typography>
        </Box>
      );
    }
    return (
      <Box
        sx={{
          p: 2,
          mb: 2,
          borderRadius: 3,
          border: `1px dashed ${alpha(tokens.colors.blue, 0.3)}`,
          bgcolor: alpha(tokens.colors.blue, 0.04),
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Box>
          <Typography sx={{ fontWeight: 700 }}>
            No organizations yet
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Every project lives under one organization — create one to get started.
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<IconPlus size={16} />}
          onClick={onAdd}
          sx={{
            background: tokens.gradients.pinkBlue,
            textTransform: 'none',
            fontWeight: 700,
            borderRadius: 2,
            '&:hover': {
              background: 'linear-gradient(135deg, #DB2777 0%, #1A9FD4 100%)',
            },
          }}
        >
          Add organization
        </Button>
      </Box>
    );
  }

  return (
    <Stack
      direction="row"
      spacing={1}
      sx={{
        mb: 2.5,
        overflowX: 'auto',
        flexWrap: 'nowrap',
        alignItems: 'center',
        py: 0.5,
      }}
    >
      {orgs.map((org) => {
        const active = org._id === activeId;
        const count = counts[org._id] ?? 0;
        return (
          <Box
            key={org._id}
            onClick={() => onChange(org._id)}
            sx={{
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 1,
              px: 1.5,
              py: 0.875,
              borderRadius: 3,
              flexShrink: 0,
              background: active
                ? tokens.gradients.pinkBlue
                : alpha(tokens.colors.blue, 0.06),
              color: active ? '#fff' : tokens.colors.lightText,
              border: active
                ? 'none'
                : `1px solid ${alpha(tokens.colors.blue, 0.2)}`,
              boxShadow: active ? `0 6px 16px ${alpha(tokens.colors.pink, 0.3)}` : 'none',
              transition: 'all 0.18s ease',
              '&:hover': {
                transform: 'translateY(-1px)',
                boxShadow: active
                  ? `0 8px 20px ${alpha(tokens.colors.pink, 0.4)}`
                  : `0 4px 10px ${alpha(tokens.colors.blue, 0.15)}`,
              },
            }}
          >
            <Typography
              sx={{
                fontSize: '0.72rem',
                fontWeight: 800,
                letterSpacing: '0.08em',
                color: active ? alpha('#fff', 0.8) : tokens.colors.blueDark,
                textTransform: 'uppercase',
              }}
            >
              {org.shortCode}
            </Typography>
            <Typography sx={{ fontSize: '0.9rem', fontWeight: 700 }}>
              {org.name}
            </Typography>
            <Box
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                minWidth: 22,
                height: 22,
                px: 0.75,
                borderRadius: '999px',
                bgcolor: active ? alpha('#fff', 0.2) : alpha(tokens.colors.pink, 0.1),
                color: active ? '#fff' : tokens.colors.pinkDark,
                fontSize: '0.7rem',
                fontWeight: 800,
              }}
            >
              {count}
            </Box>
            {active && canManage && (
              <Tooltip title="Edit organization">
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(org);
                  }}
                  sx={{
                    color: '#fff',
                    bgcolor: alpha('#fff', 0.15),
                    width: 26,
                    height: 26,
                    '&:hover': { bgcolor: alpha('#fff', 0.25) },
                  }}
                >
                  <IconPencil size={13} />
                </IconButton>
              </Tooltip>
            )}
          </Box>
        );
      })}
      {canManage && (
      <Box sx={{ flexShrink: 0 }}>
        <Tooltip title="Add organization">
          <IconButton
            onClick={onAdd}
            sx={{
              color: tokens.colors.pinkDark,
              bgcolor: alpha(tokens.colors.pink, 0.08),
              border: `1px dashed ${alpha(tokens.colors.pink, 0.4)}`,
              borderRadius: 2,
              width: 40,
              height: 40,
              '&:hover': { bgcolor: alpha(tokens.colors.pink, 0.14) },
            }}
          >
            <IconPlus size={18} />
          </IconButton>
        </Tooltip>
      </Box>
      )}
    </Stack>
  );
}
