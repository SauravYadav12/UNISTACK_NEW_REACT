export interface iUser {
  active: boolean;
  corpName: string;
  email: string;
  firstName: string;
  id: string;
  lastName: string;
  premium: boolean;
  role: UserRole;
  canEdit: boolean;
  shift: UserShift;
}

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

export interface jUser extends Omit<iUser, 'id'> {
  _id: string;
}

export enum AttendanceStatus {
  'Present' = 'Present',
  'Absent' = 'Absent',
  'Late' = 'Late',
  'Half-Day' = 'Half-Day',
}
export enum UserShift {
  'US' = 'US',
  'India' = 'India',
}

export enum UserRole {
  'super-admin' = 'super-admin',
  'admin' = 'admin',
  'hr' = 'hr',
  'support' = 'support',
  'user' = 'user',
  marketing = 'marketing',
}
