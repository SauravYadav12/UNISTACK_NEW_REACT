import { createContext, useContext, useState } from 'react';
import { UserProfile } from '../Interfaces/profile';
import { getIUser, getJUser, isTokenExpired } from '../utils/utils';
import { getProfileByUser } from '../services/userProfileApi';
import { syncUserOnLocalStorage } from '../services/authApi';
import { iUseAttendance, useAttendance } from '../hooks/attendanceHook';
import { iFetchData, useFetchData } from '../hooks/fetchDataHook';
import { getAccessControl } from '../services/accessControlApi';
import { iAccessControl } from '../utils/accessControlUtil';
import { UserRole } from '../Interfaces/iUser';

const AuthContext = createContext({
  isAuthenticated: false,
  myAttendanceState: undefined,
  validateLogin: (token: string) => {},
  validateLogout: () => {},
  myProfile: undefined,
  setMyProfile: () => {},
  isModuleAllowed: () => false,
} as DefaultContextValue);

export const AuthContextProvider = ({ children }: any) => {
  const [isAuthenticated, setIsAuthenticated] = useState(
    !!localStorage.getItem('token') && !isTokenExpired()
  );

  const accessControlState = useFetchData<iAccessControl>(async () => {
    const { data } = await getAccessControl();
    return data.data!;
  }, []);

  const me = getJUser()!;
  const myAttendanceState = useAttendance({
    users: [me],
  });

  const myProfileState = useFetchData(getMyProfile, []);

  const validateLogin = (token: string) => {
    localStorage.setItem('token', token);
    setIsAuthenticated(true);
    accessControlState.loadData();
    myAttendanceState.loadData();
    getMyProfile();
  };

  function validateLogout() {
    localStorage.removeItem('token');
    setIsAuthenticated(false);
  }

  async function getMyProfile() {
    syncUserOnLocalStorage();
    const iUser = getIUser()!;
    const profile = await getProfileByUser(iUser);
    return profile;
  }

  const isModuleAllowed = (key: string) => {
    const me = getJUser();
    const { loading, error, data } = accessControlState;
    if (loading || error || !data || !me?.role) return false;
    if (me.role === UserRole['super-admin']) return true;
    return data[me.role]?.includes(key) || false;
  };

  return (
    <AuthContext.Provider
      value={{
        myProfileState,
        myProfile: myProfileState.data,
        myAttendanceState,
        accessControlState,
        isAuthenticated,
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
  myProfileState?: iFetchData<UserProfile | undefined>;
  myProfile?: UserProfile;
  myAttendanceState?: iUseAttendance;
  accessControlState?: iFetchData<iAccessControl>;
  isAuthenticated: boolean;
  validateLogin: (token: string) => void;
  validateLogout: () => void;
  setMyProfile: (profile: UserProfile) => void;
  isModuleAllowed: (key: string) => boolean;
}
