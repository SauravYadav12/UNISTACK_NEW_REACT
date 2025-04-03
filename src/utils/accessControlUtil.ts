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
  'Test And VI' = 'Test And VI',
  'Consultants' = 'Consultants',
  'Teams' = 'Teams',
  'Reports' = 'Reports',
  'Sales Leads' = 'Sales Leads',
}
export enum HomeModule {
  'Dashboard' = 'Dashboard',
  'Profile' = 'Profile',
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
}

export type iAccessControl = {
  [key in keyof typeof UserRole]?: string[];
} & {
  _id: string;
};

export function moduleKey(moduleGroup: ModuleGroup, module: string) {
  return `${moduleGroup}/${module}`;
}
