import { UserRole } from '../Interfaces/iUser';

export enum ModuleGroup {
  Home = 'Home',
  Marketing = 'Marketing',
  Archive = 'Archive',
  'Presence & Leave' = 'Presence & Leave',
  'Super Admin Modules' = 'Super Admin Modules',
}
export enum MarketingModule {
  'Requirements' = 'Requirements',
  'Interviews' = 'Interviews',
  'Consultants' = 'Consultants',
  'Teams' = 'Teams',
  'Reports' = 'Reports',
  'Sales Leads' = 'Sales Leads',
  'Job Boards' = 'Job Boards',
  'Chess Leads' = 'Chess Leads',
  // Controls visibility of the internal interviewee/staffing info — the
  // "Interviewee Candidate Details" section in the interview drawer AND
  // the "Interviewee" column in the interviews grid. Super-admins always
  // see it; other roles only when granted here. Toggle lives under the
  // Marketing group in the Access Control tab.
  'Interviewee Details' = 'Interviewee Details',
  // The IT Job Search review queue — jobs pulled from the dedicated inbox
  // (and later JSearch/feeds), reviewed, and approved into Requirements.
  'IT Job Search' = 'IT Job Search',
}
export enum HomeModule {
  'Dashboard' = 'Dashboard',
  'Profile' = 'Profile',
  'My Documents' = 'My Documents',
}
export enum ArchiveModule {
  'Requirements' = 'Requirements',
  'Interviews' = 'Interviews',
}

export enum EmployeeModule {
  'Attendance' = 'Attendance',
  'Leaves' = 'Leaves',
}
export enum SuperAdminModule {
  'Attendance Dashboard' = 'Attendance Dashboard',
  'Leaves Management' = 'Leaves Management',
  'Access Control' = 'Access Control',
  'User Management' = 'User Management',
  'SalaryManagement' = 'SalaryManagement',
  'Projects' = 'Projects',
  'Organizations' = 'Organizations',
  'Invoice Email Templates' = 'Invoice Email Templates',
  'Timesheet Approvals' = 'Timesheet Approvals',
  'Performance' = 'Performance',
  'Employee Pulse' = 'Employee Pulse',
  'Employee Management' = 'Employee Management',
  'Onboarding' = 'Onboarding',
  'Call Report' = 'Call Report',
}

export type iAccessControl = {
  [key in keyof typeof UserRole]?: string[];
} & {
  _id: string;
};

export function moduleKey(moduleGroup: ModuleGroup, module: string) {
  return `${moduleGroup}/${module}`;
}
