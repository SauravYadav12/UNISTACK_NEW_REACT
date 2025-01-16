import { createContext, useContext,  useState } from 'react';
import { UserProfile } from '../Interfaces/profile';
import { getIUser } from '../utils/utils';
import { getProfileByUser } from '../services/userProfileApi';

const AuthContext = createContext({
  isAuthenticated: false,
  validateLogin: (token: string) => {},
  validateLogout: () => {},
  myProfile: undefined,
  getMyProfile: () => {},
  setMyProfile: () => {},
  isGetMyProfileInProgress: false,
} as DefaultContextValue);

export const AuthContextProvider = ({ children }: any) => {
  const [isAuthenticated, setIsAuthenticated] = useState(
    !!localStorage.getItem('token')
  );
  const [isGetMyProfileInProgress, setIsGetMyProfileInProgress] =
    useState(false);
  const [myProfile, setMyProfile] = useState<UserProfile>();

  const validateLogin = (token: string) => {
    localStorage.setItem('token', token);
    setIsAuthenticated(true);
  };
  const validateLogout = () => {
    localStorage.removeItem('token');
    setIsAuthenticated(false);
  };

  const getMyProfile = async () => {
    try {
      setIsGetMyProfileInProgress(true);
      const iUser = getIUser()!;
      const profile = await getProfileByUser(iUser);
      setMyProfile(profile);
    } catch (error) {
      console.log(error);
    } finally {
      setIsGetMyProfileInProgress(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        validateLogin,
        validateLogout,
        isGetMyProfileInProgress,
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
  isAuthenticated: boolean;
  validateLogin: (token: string) => void;
  validateLogout: () => void;
  myProfile: undefined | UserProfile;
  getMyProfile: () => void;
  setMyProfile: (profile: UserProfile) => void;
  isGetMyProfileInProgress: boolean;
}
