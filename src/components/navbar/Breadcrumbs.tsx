import { Breadcrumbs as MuiBreadcrumbs, Typography, Link } from '@mui/material';
import { IconChevronRight } from '@tabler/icons-react';
import { useLocation, useNavigate } from 'react-router-dom';

const routeLabels: Record<string, string> = {
  dashboard: 'Dashboard',
  profile: 'Profile',
  requirements: 'Requirements',
  interviews: 'Interviews',
  consultants: 'Consultants',
  teams: 'Teams',
  reports: 'Reports',
  'sales-leads': 'Sales Leads',
  attendance: 'Attendance',
  'my-attendance': 'My Attendance',
  leaves: 'Leaves',
  'leaves-management': 'Leaves Management',
  'user-management': 'User Management',
  'access-control': 'Access Control',
  salary: 'Salary',
};

export default function Breadcrumbs() {
  const location = useLocation();
  const navigate = useNavigate();

  const segments = location.pathname.split('/').filter(Boolean);

  if (segments.length === 0) return null;

  return (
    <MuiBreadcrumbs
      separator={<IconChevronRight size={14} />}
      sx={{
        '& .MuiBreadcrumbs-separator': {
          mx: 0.5,
          color: 'text.secondary',
          opacity: 0.5,
        },
      }}
    >
      {segments.map((segment, index) => {
        const path = '/' + segments.slice(0, index + 1).join('/');
        const label = routeLabels[segment] || segment.replace(/-/g, ' ');
        const isLast = index === segments.length - 1;

        if (isLast) {
          return (
            <Typography
              key={path}
              variant="body2"
              fontWeight={600}
              color="text.primary"
              sx={{ textTransform: 'capitalize' }}
            >
              {label}
            </Typography>
          );
        }

        return (
          <Link
            key={path}
            component="button"
            variant="body2"
            onClick={() => navigate(path)}
            underline="hover"
            color="text.secondary"
            sx={{
              cursor: 'pointer',
              textTransform: 'capitalize',
              '&:hover': { color: 'primary.main' },
            }}
          >
            {label}
          </Link>
        );
      })}
    </MuiBreadcrumbs>
  );
}
