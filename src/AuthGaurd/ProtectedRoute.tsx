import { Navigate } from 'react-router-dom';
import { useAuth } from './AuthContextProvider';
import { ModuleGroup, moduleKey } from '../utils/accessControlUtil';

const ProtectedRoute = ({ meta, children }: ProtectedRouteProps) => {
  const { isAuthenticated, isModuleAllowed } = useAuth();
  const isAllowed = meta
    ? isModuleAllowed(moduleKey(meta.group, meta.module))
    : true;

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
  meta?: { group: ModuleGroup; module: string };
}
