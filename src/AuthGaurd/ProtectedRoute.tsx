import { Navigate } from 'react-router-dom';
import { useAuth } from './AuthContextProvider';
import { ModuleGroup, moduleKey } from '../utils/accessControlUtil';
import { UserRole } from '../Interfaces/iUser';
import Loader from '../components/loader/Loader';
import RestrictedAccess from './RestrictedAccess';

const ProtectedRoute = ({
  meta,
  requireSuperAdmin,
  children,
}: ProtectedRouteProps) => {
  const { isAuthenticated, accessControlState, iUserState, isModuleAllowed } =
    useAuth();
  const isAllowed = meta
    ? isModuleAllowed(moduleKey(meta.group, meta.module))
    : true;

  // Hard role gate, evaluated independently of the ACL matrix. Used by
  // routes that must never be shown to non-super-admins (e.g. Employee
  // Management → probation approvals) even if an admin somehow has the
  // ACL module bit set.
  const passesRoleGate = requireSuperAdmin
    ? Boolean(iUserState.data?.role?.includes(UserRole['super-admin']))
    : true;

  if (accessControlState.loading || iUserState.loading) {
    return <Loader />;
  }

  if (!isAuthenticated) {
    // Send straight to /login rather than the marketing Landing page — the
    // user was trying to use the app, not shop for it.
    return <Navigate to="/login" replace />;
  }

  if (!isAllowed || !passesRoleGate) {
    return <RestrictedAccess />;
  }

  return children;
};

export default ProtectedRoute;

interface ProtectedRouteProps {
  children: React.ReactNode;
  meta?: { group: ModuleGroup; module: string };
  /** When true, only users with `super-admin` in their role array can
   *  access the route. Layered on top of the standard ACL check. */
  requireSuperAdmin?: boolean;
}
