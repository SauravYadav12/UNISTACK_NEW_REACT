export interface iUser {
  active: boolean;
  corpName: string;
  email: string;
  firstName: string;
  id: string;
  _id: string;
  lastName: string;
  premium: boolean;
  role: UserRole[];
  canEdit: boolean;
  shift: UserShift;
  workLocation: WorkLocation;
  activity?: iUserActivity[];
  /** Auth-account creation timestamp from Mongoose `timestamps: true`. Used
   *  as a "didn't exist before this date" cutoff for the attendance week
   *  strip so new joiners don't see Present/Absent pills on days that
   *  pre-date their account. */
  createdAt?: string;
}

export type iUserActivity = {
  loggedInAt?: string;
  loggedOutAt?: string;
  location?: string;
  ip?: string;
  _id: string;
};

export interface iAttendance {
  _id: string;
  userRef: string;
  date: string;
  checkOut?: string;
  checkIn?: string;
  status: AttendanceStatus;
  createdAt: string;
  updatedAt: string;
}

export enum AttendanceStatus {
  Present = 'Present',
  Absent = 'Absent',
  Late = 'Late',
  'Half-Day' = 'Half-Day',
}
export enum UserShift {
  US = 'US',
  India = 'India',
}

export enum UserRole {
  'super-admin' = 'super-admin',
  admin = 'admin',
  hr = 'hr',
  marketing = 'marketing',
  support = 'support',
  user = 'user',
  'project-coordinator' = 'project-coordinator',
}

export enum WorkLocation {
  Office = 'Office',
  Home = 'Home',
}
