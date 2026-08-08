// Mirrors the server CheckInSession model.

export type CheckoutSource = 'manual' | 'logout' | 'auto';

export interface ICheckInSession {
  _id: string;
  userRef: string;
  userName?: string;
  userEmail?: string;
  shift?: string;
  date: string; // YYYY-MM-DD in the employee's timezone
  checkInAt: string; // ISO
  checkOutAt: string | null; // ISO or null while open
  autoCheckout: boolean;
  checkoutSource: CheckoutSource | null;
  durationSeconds: number | null;
  createdAt: string;
  updatedAt: string;
}

// GET /checkin/current
export interface CurrentSessionResponse {
  session: ICheckInSession | null;
  serverTime: string; // ISO — used to compute elapsed without client-clock drift
  maxSessionMs: number; // 14h cap in ms
}

// GET /checkin/logs
export type CheckInLogScope = 'day' | 'week' | 'month';
export interface CheckInLogsResponse {
  scope: CheckInLogScope;
  from: string;
  to: string;
  sessions: ICheckInSession[];
}
