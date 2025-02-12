import { Navigate } from 'react-router-dom';
import { useAuth } from './AuthContextProvider';
import { getIUser } from '../utils/utils';

const ProtectedRoute = ({ allow, children }: ProtectedRouteProps) => {
  const { isAuthenticated } = useAuth();
  const iuser = getIUser();
  const isAllowed =
    iuser?.role === 'super-admin' ||
    !allow?.length ||
    (iuser && allow.includes(iuser.role));
  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }
  if (!isAllowed) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default ProtectedRoute;

interface ProtectedRouteProps {
  children: React.ReactNode;
  allow?: string[];
}
