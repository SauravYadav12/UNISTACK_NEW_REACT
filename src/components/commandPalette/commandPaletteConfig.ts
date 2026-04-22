import {
  IconLayoutDashboard,
  IconUserCircle,
  IconChartBar,
  IconMicrophone,
  IconBriefcase,
  IconUsersGroup,
  IconReport,
  IconCoin,
  IconCalendarEvent,
  IconUmbrella,
  IconUserCog,
  IconShieldLock,
  IconCash,
  IconCalendarStats,
  IconFileText,
  IconPlus,
} from '@tabler/icons-react';

export interface CommandItem {
  id: string;
  label: string;
  icon: typeof IconLayoutDashboard;
  section: 'navigate' | 'actions';
  path?: string;
  keywords: string[];
  shortcut?: string;
}

export const commandItems: CommandItem[] = [
  // Navigation
  {
    id: 'nav-dashboard',
    label: 'Dashboard',
    icon: IconLayoutDashboard,
    section: 'navigate',
    path: '/dashboard',
    keywords: ['home', 'overview', 'main'],
  },
  {
    id: 'nav-profile',
    label: 'Profile',
    icon: IconUserCircle,
    section: 'navigate',
    path: '/profile',
    keywords: ['account', 'user', 'settings'],
  },
  {
    id: 'nav-requirements',
    label: 'Requirements',
    icon: IconChartBar,
    section: 'navigate',
    path: '/requirements',
    keywords: ['jobs', 'positions', 'openings'],
  },
  {
    id: 'nav-interviews',
    label: 'Interviews',
    icon: IconMicrophone,
    section: 'navigate',
    path: '/interviews',
    keywords: ['interview', 'schedule', 'calls'],
  },
  {
    id: 'nav-consultants',
    label: 'Consultants',
    icon: IconBriefcase,
    section: 'navigate',
    path: '/consultants',
    keywords: ['consultant', 'candidates', 'people'],
  },
  {
    id: 'nav-teams',
    label: 'Teams',
    icon: IconUsersGroup,
    section: 'navigate',
    path: '/teams',
    keywords: ['team', 'groups', 'members'],
  },
  {
    id: 'nav-reports',
    label: 'Reports',
    icon: IconReport,
    section: 'navigate',
    path: '/reports',
    keywords: ['analytics', 'stats', 'metrics'],
  },
  {
    id: 'nav-sales-leads',
    label: 'Sales Leads',
    icon: IconCoin,
    section: 'navigate',
    path: '/sales-leads',
    keywords: ['sales', 'leads', 'pipeline', 'deals'],
  },
  {
    id: 'nav-attendance',
    label: 'My Attendance',
    icon: IconCalendarEvent,
    section: 'navigate',
    path: '/attendance/my-attendance',
    keywords: ['attendance', 'checkin', 'checkout', 'time'],
  },
  {
    id: 'nav-attendance-dashboard',
    label: 'Attendance Dashboard',
    icon: IconCalendarStats,
    section: 'navigate',
    path: '/attendance/dashboard',
    keywords: ['attendance', 'admin', 'overview'],
  },
  {
    id: 'nav-leaves',
    label: 'Leaves',
    icon: IconUmbrella,
    section: 'navigate',
    path: '/leaves',
    keywords: ['leave', 'vacation', 'time off', 'pto'],
  },
  {
    id: 'nav-user-management',
    label: 'User Management',
    icon: IconUserCog,
    section: 'navigate',
    path: '/user-management',
    keywords: ['users', 'admin', 'manage'],
  },
  {
    id: 'nav-access-control',
    label: 'Access Control',
    icon: IconShieldLock,
    section: 'navigate',
    path: '/access-control',
    keywords: ['permissions', 'roles', 'access'],
  },
  {
    id: 'nav-salary',
    label: 'Salary',
    icon: IconCash,
    section: 'navigate',
    path: '/salary',
    keywords: ['salary', 'pay', 'compensation'],
  },

  // Actions
  {
    id: 'action-new-requirement',
    label: 'Create Requirement',
    icon: IconPlus,
    section: 'actions',
    path: '/requirements',
    keywords: ['new', 'add', 'create', 'requirement'],
  },
  {
    id: 'action-apply-leave',
    label: 'Apply for Leave',
    icon: IconFileText,
    section: 'actions',
    path: '/leaves',
    keywords: ['apply', 'leave', 'request', 'time off'],
  },
];
