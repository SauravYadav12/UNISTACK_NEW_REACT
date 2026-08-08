import {
  createContext,
  useContext,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import { toast } from 'react-toastify';
import { useAuth } from '../AuthGaurd/AuthContextProvider';
import { UserRole } from '../Interfaces/iUser';
import { ICheckInSession } from '../Interfaces/checkin';
import {
  getCurrentSession,
  checkIn as apiCheckIn,
  checkOut as apiCheckOut,
} from '../services/checkinApi';

interface CheckInContextValue {
  session: ICheckInSession | null;
  isCheckedIn: boolean;
  // Live elapsed time (ms) since check-in, capped at the 14h server limit.
  elapsedMs: number;
  maxSessionMs: number;
  loading: boolean;
  actionPending: boolean;
  doCheckIn: () => Promise<void>;
  doCheckOut: (source?: 'manual' | 'logout') => Promise<void>;
  // Bridge for the legacy auto-popup MarkAttendanceModal: after that modal
  // marks the Attendance row, this ensures a CheckInSession exists (so the
  // navbar flips to Check Out + the session is logged) WITHOUT a toast.
  syncCheckIn: () => Promise<void>;
  refresh: () => Promise<void>;
}

const DEFAULT_MAX = 14 * 60 * 60 * 1000;

const CheckInContext = createContext<CheckInContextValue>({
  session: null,
  isCheckedIn: false,
  elapsedMs: 0,
  maxSessionMs: DEFAULT_MAX,
  loading: false,
  actionPending: false,
  doCheckIn: async () => {},
  doCheckOut: async () => {},
  syncCheckIn: async () => {},
  refresh: async () => {},
});

export function CheckInProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, iUser, myAttendanceState } = useAuth();

  // The timer is an employee affordance. Super-admins administer the
  // system; they never check in, and the existing navbar attendance
  // widget already hid for them — mirror that so we don't poll for them.
  const isSuperAdmin = !!iUser?.role?.includes(UserRole['super-admin']);
  const enabled = isAuthenticated && !!iUser && !isSuperAdmin;

  const [session, setSession] = useState<ICheckInSession | null>(null);
  const [loading, setLoading] = useState(false);
  const [actionPending, setActionPending] = useState(false);
  const [maxSessionMs, setMaxSessionMs] = useState(DEFAULT_MAX);
  const [elapsedMs, setElapsedMs] = useState(0);

  // serverNow - clientNow, captured at fetch time. Lets us compute elapsed
  // from the server clock so a skewed local clock never lies about hours.
  const clockOffsetRef = useRef(0);

  const refresh = useCallback(async () => {
    if (!enabled) {
      setSession(null);
      setElapsedMs(0);
      return;
    }
    setLoading(true);
    try {
      const res = await getCurrentSession();
      const data = res.data?.data;
      if (data) {
        setSession(data.session);
        setMaxSessionMs(data.maxSessionMs || DEFAULT_MAX);
        clockOffsetRef.current =
          new Date(data.serverTime).getTime() - Date.now();
      }
    } catch {
      // Non-fatal — leave whatever we had; the timer just won't update.
    } finally {
      setLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // 1-second tick. Recompute elapsed from the server-adjusted clock and
  // cap at maxSessionMs. When we hit the cap, refresh once so the UI
  // picks up the server-side auto-checkout (which zeroes the session).
  useEffect(() => {
    if (!session) {
      setElapsedMs(0);
      return;
    }
    const checkInMs = new Date(session.checkInAt).getTime();
    let hitCap = false;
    const compute = () => {
      const serverNow = Date.now() + clockOffsetRef.current;
      const raw = serverNow - checkInMs;
      const capped = Math.min(Math.max(raw, 0), maxSessionMs);
      setElapsedMs(capped);
      if (raw >= maxSessionMs && !hitCap) {
        hitCap = true;
        // Session is over the cap — the server will have auto-closed it.
        refresh();
      }
    };
    compute();
    const id = setInterval(compute, 1000);
    return () => clearInterval(id);
  }, [session, maxSessionMs, refresh]);

  // Keep the legacy attendance state (read by the old auto-popup modal)
  // in lockstep after any session action, so the two check-in surfaces
  // never disagree about whether the user is checked in today.
  const refreshLegacyAttendance = useCallback(() => {
    try {
      myAttendanceState?.loadData?.();
    } catch {
      // non-fatal
    }
  }, [myAttendanceState]);

  const doCheckIn = useCallback(async () => {
    if (actionPending) return;
    setActionPending(true);
    try {
      await apiCheckIn();
      await refresh();
      refreshLegacyAttendance();
      toast.success('Checked in — timer started.');
    } catch {
      toast.error('Could not check in.');
    } finally {
      setActionPending(false);
    }
  }, [actionPending, refresh, refreshLegacyAttendance]);

  // Silent variant used by the legacy modal bridge (the modal shows its own
  // toast). Idempotent server-side — returns the existing open session if
  // one already exists.
  const syncCheckIn = useCallback(async () => {
    try {
      await apiCheckIn();
      await refresh();
    } catch {
      // non-fatal
    }
  }, [refresh]);

  const doCheckOut = useCallback(
    async (source: 'manual' | 'logout' = 'manual') => {
      if (actionPending) return;
      setActionPending(true);
      try {
        await apiCheckOut(source);
        await refresh();
        refreshLegacyAttendance();
        if (source === 'manual') toast.success('Checked out.');
      } catch {
        if (source === 'manual') toast.error('Could not check out.');
      } finally {
        setActionPending(false);
      }
    },
    [actionPending, refresh, refreshLegacyAttendance]
  );

  return (
    <CheckInContext.Provider
      value={{
        session,
        isCheckedIn: !!session,
        elapsedMs,
        maxSessionMs,
        loading,
        actionPending,
        doCheckIn,
        doCheckOut,
        syncCheckIn,
        refresh,
      }}
    >
      {children}
    </CheckInContext.Provider>
  );
}

export const useCheckIn = () => useContext(CheckInContext);
