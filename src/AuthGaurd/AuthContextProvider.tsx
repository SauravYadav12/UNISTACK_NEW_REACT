import { createContext, useContext, useState } from 'react';
import { UserProfile } from '../Interfaces/profile';
import { getIUser, isTokenExpired } from '../utils/utils';
import { getProfileByUser } from '../services/userProfileApi';
import { toast } from 'react-toastify';
import { syncUserOnLocalStorage} from '../services/authApi';

const AuthContext = createContext({
  isAuthenticated: false,
  isAttendanceMarked: false,
  setIsAttendanceMarked(s) {},
  validateLogin: (token: string) => {},
  validateLogout: () => {},
  myProfile: undefined,
  getMyProfile: () => {},
  setMyProfile: () => {},
} as DefaultContextValue);

export const AuthContextProvider = ({ children }: any) => {
  const [isAuthenticated, setIsAuthenticated] = useState(
    !!localStorage.getItem('token') && !isTokenExpired()
  );
  const [isAttendanceMarked, setIsAttendanceMarked] = useState(false);
  const [myProfile, setMyProfile] = useState<UserProfile>();

  const validateLogin = (token: string) => {
    localStorage.setItem('token', token);
    setIsAuthenticated(true);
  };

  function validateLogout() {
    localStorage.removeItem('token');
    setIsAuthenticated(false);
  }

  const getMyProfile = async () => {
    try {
      syncUserOnLocalStorage();
      const iUser = getIUser()!;
      const profile = await getProfileByUser(iUser);
      if (!profile) {
        toast.error('Not found');
      }
      setMyProfile(profile);
    } catch (error) {
      toast.error('Something went wrong');
      console.log(error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        isAttendanceMarked,
        setIsAttendanceMarked,
        isAuthenticated,
        validateLogin,
        validateLogout,
        getMyProfile,
        setMyProfile,
        myProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

interface DefaultContextValue {
  isAttendanceMarked: boolean;
  setIsAttendanceMarked: (s: boolean) => void;
  isAuthenticated: boolean;
  validateLogin: (token: string) => void;
  validateLogout: () => void;
  myProfile: undefined | UserProfile;
  getMyProfile: () => void;
  setMyProfile: (profile: UserProfile) => void;
}
