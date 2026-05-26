export type NotificationLinkKind =
  | 'requirement'
  | 'interview'
  | 'leave'
  | 'salary'
  | 'project'
  | 'timesheet'
  | 'filter'
  | 'employee-management';

export interface NotificationLink {
  kind: NotificationLinkKind;
  reqID?: string;
  intId?: string;
  leaveId?: string;
  slipMonth?: { year: number; month: number };
  projectId?: string;
  approvalId?: string;
  periodMonth?: string;
  filterReqIDs?: string[];
  /** For employee-management links — which employee triggered the event. */
  employeeRef?: string;
}

export interface NotificationActor {
  _id?: string;
  name?: string;
}

export interface NotificationItem {
  _id: string;
  recipientRef: string;
  type: string;
  title: string;
  body: string;
  link: NotificationLink;
  dedupeKey?: string;
  readAt?: string | null;
  actor?: NotificationActor;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationListResponse {
  items: NotificationItem[];
  unreadCount: number;
}

export interface UnreadCountResponse {
  count: number;
}
