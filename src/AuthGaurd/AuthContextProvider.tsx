import { createContext, useContext, useState } from 'react';
import { UserProfile } from '../Interfaces/profile';
import { getUserIdFromToken, isTokenExpired } from '../utils/utils';
import { getProfileByUser } from '../services/userProfileApi';
import { syncIUser } from '../services/authApi';
import { iUseAttendance, useAttendance } from '../hooks/attendanceHook';
import { iFetchData, useFetchData } from '../hooks/fetchDataHook';
import { getAccessControl } from '../services/accessControlApi';
import {
  iAccessControl,
  ModuleGroup,
  moduleKey,
  SuperAdminModule,
} from '../utils/accessControlUtil';
import { iUser, UserRole } from '../Interfaces/iUser';
import { autoOpenAttendanceModalKey } from '../components/dashboard/MarkAttendanceModal';
import { toast } from 'react-toastify';


export const allowdDomains=['unicodez.com','team.unicodez.com']

export const initialFetchState = {
  data: undefined,
  error: '',
  loading: false,
  loadData: async function () {},
  setData: () => {},
};
const initialMyAttendanceState = {
  attendance: [],
  loadData: async function () {},
  error: '',
  loading: false,
  setResults: () => {},
};

const AuthContext = createContext({
  isAuthenticated: false,
  accessControlState: initialFetchState,
  iUserState: initialFetchState,
  myProfileState: initialFetchState,
  myAttendanceState: initialMyAttendanceState,
  myProfile: undefined,
  syncIUser() {},
  validateLogin: (token: string) => {},
  validateLogout: () => {},
  setMyProfile: () => {},
  isModuleAllowed: () => false,
} as DefaultContextValue);

export const AuthContextProvider = ({ children }: { children: React.ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(
    !!localStorage.getItem('token') && !isTokenExpired()
  );

  const accessControlState = useFetchData(async () => {
    if (!isAuthenticated) return;
    const { data } = await getAccessControl();
    return data.data;
  }, [isAuthenticated]);

  const iUserState = useFetchData(async () => {
    const id = getUserIdFromToken();
    if (!isAuthenticated || !id) return;
    const { user, error } = await syncIUser(id);
    if (error) {
      toast.error('Failed to sync user');
    }
    return user;
  }, [isAuthenticated]);

  const myAttendanceState = useAttendance(
    {
      users: iUserState.data ? [iUserState.data] : [],
      fetchDataIf: isAuthenticated && !!iUserState.data,
    },
    [isAuthenticated, iUserState.data]
  );

  const myProfileState = useFetchData(getMyProfile, [isAuthenticated]);

  const validateLogin = (token: string, user: iUser) => {
    localStorage.setItem('token', token);
    localStorage.setItem(autoOpenAttendanceModalKey, 'true');
    setIsAuthenticated(true);
    iUserState.setData(user);
  };

  function validateLogout() {
    localStorage.removeItem('token');
    setIsAuthenticated(false);
  }

  async function getMyProfile() {
    if (!isAuthenticated || !iUserState.data) return;
    const iUser = iUserState.data;
    const profile = await getProfileByUser(iUser);
    return profile;
  }

  const isModuleAllowed = (key: string) => {
    const me = iUserState.data;
    const { data } = accessControlState;
    if (!data || !me?.role.length || isTokenExpired()) return false;
    if (me.role.includes(UserRole['super-admin'])) return true;

    // Performance page is intentionally visible to every Marketing + Support
    // user — they're the people whose scores it shows, so transparency is
    // by design (the scoring rules and weights are publicly visible inside
    // the page). The gear-icon "Edit weights" affordance stays gated to
    // super-admin only via an inline check in PerformancePage.tsx, and the
    // weight-write API endpoints are guarded server-side by roleGuard
    // (see `/performance/weights` PATCH / `/performance/weights/reset`),
    // so this carve-out only affects read-only viewing.
    const performanceKey = moduleKey(
      ModuleGroup['Super Admin Modules'],
      SuperAdminModule.Performance,
    );
    if (key === performanceKey) {
      if (
        me.role.includes(UserRole.marketing) ||
        me.role.includes(UserRole.support)
      ) {
        return true;
      }
    }

    return me.role.some((role) => data[role]?.includes(key) || false);
  };

  return (
    <AuthContext.Provider
      value={{
        iUserState,
        iUser: iUserState.data,
        myProfileState,
        myProfile: myProfileState.data,
        myAttendanceState,
        accessControlState,
        isAuthenticated,
        syncIUser: iUserState.loadData,
        setMyProfile: myProfileState.setData,
        validateLogin,
        validateLogout,
        isModuleAllowed,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

interface DefaultContextValue {
  iUserState: iFetchData<iUser | undefined>;
  iUser?: iUser;
  myProfileState: iFetchData<UserProfile | undefined>;
  myProfile?: UserProfile;
  myAttendanceState: iUseAttendance;
  accessControlState: iFetchData<iAccessControl | undefined>;
  isAuthenticated: boolean;
  syncIUser: () => void;
  validateLogin: (token: string, user: iUser) => void;
  validateLogout: () => void;
  setMyProfile: (profile: UserProfile) => void;
  isModuleAllowed: (key: string) => boolean;
}
