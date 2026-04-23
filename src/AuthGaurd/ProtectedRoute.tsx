import { Navigate } from 'react-router-dom';
import { useAuth } from './AuthContextProvider';
import { ModuleGroup, moduleKey } from '../utils/accessControlUtil';
import Loader from '../components/loader/Loader';
import RestrictedAccess from './RestrictedAccess';

const ProtectedRoute = ({ meta, children }: ProtectedRouteProps) => {
  const { isAuthenticated, accessControlState, iUserState, isModuleAllowed } =
    useAuth();
  const isAllowed = meta
    ? isModuleAllowed(moduleKey(meta.group, meta.module))
    : true;

  if (accessControlState.loading || iUserState.loading) {
    return <Loader />;
  }

  if (!isAuthenticated) {
    // Send straight to /login rather than the marketing Landing page — the
    // user was trying to use the app, not shop for it.
    return <Navigate to="/login" replace />;
  }

  if (!isAllowed) {
    return <RestrictedAccess />;
  }

  return children;
};

export default ProtectedRoute;

interface ProtectedRouteProps {
  children: React.ReactNode;
  meta?: { group: ModuleGroup; module: string };
}
