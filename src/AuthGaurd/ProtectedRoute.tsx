import { Navigate } from 'react-router-dom';
import { useAuth } from './AuthContextProvider';
import { ModuleGroup, moduleKey } from '../utils/accessControlUtil';
import { logout } from '../services/authApi';

const ProtectedRoute = ({ meta, children }: ProtectedRouteProps) => {
  const {
    isAuthenticated,
    accessControlState,
    isModuleAllowed,
    validateLogout,
  } = useAuth();
  const isAllowed = meta
    ? isModuleAllowed(moduleKey(meta.group, meta.module))
    : true;

  function OnError() {
    validateLogout();
    logout();
    return <Navigate to="/" replace />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  if (accessControlState?.error) {
    return <OnError />;
  }

  if (!isAllowed) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default ProtectedRoute;

interface ProtectedRouteProps {
  children: React.ReactNode;
  meta?: { group: ModuleGroup; module: string };
}
