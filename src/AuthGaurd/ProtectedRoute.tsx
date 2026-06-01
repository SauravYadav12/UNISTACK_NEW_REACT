import { Navigate, useLocation } from 'react-router-dom';
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
  const location = useLocation();
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
    // Send straight to /login rather than the marketing Landing page —
    // the user was trying to use the app, not shop for it. Stash the
    // path + query they were aiming for as ?redirect=... so Login can
    // bounce them back to the right page after re-authentication
    // (matters for email-link deep links: clicking a leave/interview
    // notification used to drop you on /dashboard after login).
    const intended = location.pathname + location.search;
    const isWorthRemembering =
      intended && intended !== '/' && intended !== '/login';
    const target = isWorthRemembering
      ? `/login?redirect=${encodeURIComponent(intended)}`
      : '/login';
    return <Navigate to={target} replace />;
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
