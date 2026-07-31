import './App.css';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
} from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { Box, CircularProgress } from '@mui/material';
import { AuthContextProvider, useAuth } from './AuthGaurd/AuthContextProvider';
import ProtectedRoute from './AuthGaurd/ProtectedRoute';
import Layout from './components/layout/Layout';
import {
  EmployeeModule,
  HomeModule,
  MarketingModule,
  ModuleGroup,
  SuperAdminModule,
} from './utils/accessControlUtil';
import { HolidayContextProvider } from './contextProviders/HolidayContextProvider';
import { AiProvider } from './context/AiContext';
import { RequirementAiChatProvider } from './context/RequirementAiChatContext';
import { JobBoardSearchProvider } from './context/JobBoardSearchContext';
import {
  PRIVACY_CONTENT,
  TERMS_CONTENT,
  SECURITY_CONTENT,
  STATUS_CONTENT,
} from './pages/Legal/legalContent';

// ── Lazy-loaded route components ────────────────────────────────────
// Each page becomes its own Vite chunk and is fetched only on
// navigation, instead of being bundled into the initial download. For
// a 30-page app with heavy deps (DataGrid, react-pdf, apexcharts,
// country-state-city ~5MB), this typically shrinks the first
// JavaScript payload by 70-90% and dramatically improves first paint
// + login latency. Each lazy() resolves once and is cached for
// subsequent visits, so there's no perceived delay after the first
// click into any page.
const Landing = lazy(() => import('./pages/Landing/Landing'));
const Login = lazy(() => import('./pages/Auth/Login'));
const SignUp = lazy(() => import('./pages/Auth/Signup'));
const ForgotPassword = lazy(() => import('./pages/Auth/ForgotPassword'));
const LegalPage = lazy(() => import('./pages/Legal/LegalPage'));
const OnboardingFormPage = lazy(
  () => import('./pages/PublicOnboarding/OnboardingFormPage'),
);
const OfferLetterPage = lazy(
  () => import('./pages/PublicOnboarding/OfferLetterPage'),
);
const DesktopDownloadPage = lazy(
  () => import('./pages/DesktopDownload/DesktopDownloadPage'),
);
const Dashboard = lazy(() => import('./pages/Dashboard/Dashboard'));
const Salary = lazy(() => import('./pages/Salary/Salary'));
const Projects = lazy(() => import('./pages/Marketing/Projects/Projects'));
const PerformancePage = lazy(
  () => import('./pages/Performance/PerformancePage'),
);
const EmployeePulse = lazy(
  () => import('./pages/EmployeePulse/EmployeePulse'),
);
const MyDocuments = lazy(() => import('./pages/Documents/MyDocuments'));
const Profile = lazy(() => import('./pages/Marketing/Profile/Profile'));
const MyAttendance = lazy(() => import('./pages/Attendance/MyAttendance'));
const Requirements = lazy(
  () => import('./pages/Marketing/Requirements/Requirements'),
);
const InterviewTabs = lazy(
  () => import('./components/interview/InterviewTabs'),
);
const JobBoards = lazy(() => import('./pages/JobBoards/JobBoards'));
const Consultants = lazy(
  () => import('./pages/Marketing/Consultants/Consultants'),
);
const Teams = lazy(() => import('./pages/Marketing/Teams/Teams'));
const Reports = lazy(() => import('./pages/Marketing/Reports/Reports'));
const SalesLead = lazy(
  () => import('./pages/Marketing/SalesLeads/SalesLeads'),
);
const ChessLeads = lazy(() => import('./pages/ChessLeads/ChessLeads'));
const UserManagement = lazy(
  () => import('./pages/UserManagement/UserManagement'),
);
const AccessControl = lazy(
  () => import('./pages/AccessControl/AccessControl'),
);
const AttendanceDashboard = lazy(
  () => import('./pages/Attendance/AttendanceDashboard'),
);
const LeavesManagement = lazy(
  () => import('./pages/Leaves/LeavesManagement'),
);
const EmployeeManagement = lazy(
  () => import('./pages/EmployeeManagement/EmployeeManagement'),
);
const CallReport = lazy(() => import('./pages/CallReport/CallReport'));

// Global authenticated-only chrome — also lazy because it loads heavy
// AI / command-palette logic that's not needed before login.
const FloatingAiChat = lazy(
  () => import('./components/aiChat/FloatingAiChat'),
);
const CommandPalette = lazy(
  () => import('./components/commandPalette/CommandPalette'),
);

/**
 * Minimal centered spinner shown while a lazy chunk downloads. Kept
 * intentionally tiny so it loads instantly and doesn't itself become
 * a perceptible flash; on a typical home connection a code-split
 * chunk is back within 50-150ms, well under the 200ms threshold most
 * users register as a "delay".
 */
function RouteFallback() {
  return (
    <Box
      sx={{
        minHeight: '60vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <CircularProgress size={28} />
    </Box>
  );
}

// Outer shell — sets up providers only
function App() {
  return (
    <AuthContextProvider>
      <Router>
        <AiProvider>
          <RequirementAiChatProvider>
            <AppContent />
          </RequirementAiChatProvider>
        </AiProvider>
      </Router>
    </AuthContextProvider>
  );
}

// Inner component — can safely read useAuth() since it's inside AuthContextProvider
function AppContent() {
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  // Public candidate-facing routes (magic-link onboarding form + offer
  // letter signing). These should NEVER render internal-only UI like
  // the AI chat or command palette — even if the visitor happens to
  // also be authenticated as an admin in the same browser tab.
  const isPublicCandidateRoute =
    location.pathname.startsWith('/onboarding/') ||
    location.pathname.startsWith('/offer/') ||
    location.pathname === '/download';
  const showInternalChrome = isAuthenticated && !isPublicCandidateRoute;

  return (
    <>
      {/* One Suspense at the top of the route tree catches every lazy
          page in one place — simpler than wrapping each <Route> and
          avoids cascading fallbacks on nested routes. */}
      <Suspense fallback={<RouteFallback />}>
        <Routes>
          {/* Public landing — pitches the product to unauthed visitors;
              authed visitors are redirected to /dashboard inside Landing. */}
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          {/* Public legal / policy pages — always reachable, no auth gate. */}
          <Route
            path="/privacy"
            element={<LegalPage content={PRIVACY_CONTENT} />}
          />
          <Route
            path="/terms"
            element={<LegalPage content={TERMS_CONTENT} />}
          />
          <Route
            path="/security"
            element={<LegalPage content={SECURITY_CONTENT} />}
          />
          <Route
            path="/status"
            element={<LegalPage content={STATUS_CONTENT} />}
          />
          {/* Candidate-facing public pages — accessed via a magic-link
              token in the URL, no JWT auth. Mounted OUTSIDE the
              <ProtectedRoute> wrapper below. */}
          <Route
            path="/onboarding/:token"
            element={<OnboardingFormPage />}
          />
          <Route path="/offer/:token" element={<OfferLetterPage />} />
          {/* Public desktop-installer download page — no auth required so
              users (and prospective new joiners) can grab installers
              from a shared link. Page itself fetches latest.json from DO
              Spaces on mount so new releases appear without a code push. */}
          <Route path="/download" element={<DesktopDownloadPage />} />
          {/* Pathless layout route — children carry their own paths (e.g.
              `dashboard` → /dashboard) and render inside <Layout/>. */}
          <Route
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route
              path="dashboard"
              element={
                <ProtectedRoute
                  meta={{
                    group: ModuleGroup.Home,
                    module: HomeModule.Dashboard,
                  }}
                >
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="salary"
              element={
                <ProtectedRoute
                  meta={{
                    group: ModuleGroup['Super Admin Modules'],
                    module: SuperAdminModule['SalaryManagement'],
                  }}
                >
                  <Salary />
                </ProtectedRoute>
              }
            />
            <Route
              path="projects"
              element={
                <ProtectedRoute
                  meta={{
                    group: ModuleGroup['Super Admin Modules'],
                    module: SuperAdminModule['Projects'],
                  }}
                >
                  <Projects />
                </ProtectedRoute>
              }
            />
            <Route
              path="performance"
              element={
                <ProtectedRoute
                  meta={{
                    group: ModuleGroup['Super Admin Modules'],
                    module: SuperAdminModule['Performance'],
                  }}
                >
                  <PerformancePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="employee-pulse"
              element={
                <ProtectedRoute
                  meta={{
                    group: ModuleGroup['Super Admin Modules'],
                    module: SuperAdminModule['Employee Pulse'],
                  }}
                >
                  <EmployeePulse />
                </ProtectedRoute>
              }
            />
            <Route
              path="my-documents"
              element={
                <ProtectedRoute
                  meta={{
                    group: ModuleGroup.Home,
                    module: HomeModule['My Documents'],
                  }}
                >
                  <MyDocuments />
                </ProtectedRoute>
              }
            />
            {/* Back-compat: old /my-salary bookmarks continue to work. */}
            <Route
              path="my-salary"
              element={<Navigate to="/my-documents" replace />}
            />
            <Route
              path="profile"
              element={
                <ProtectedRoute
                  meta={{
                    group: ModuleGroup.Home,
                    module: HomeModule.Profile,
                  }}
                >
                  <Profile />
                </ProtectedRoute>
              }
            />
            <Route
              path="attendance/my-attendance"
              element={
                <ProtectedRoute
                  meta={{
                    group: ModuleGroup['Presence & Leave'],
                    module: EmployeeModule.Attendance,
                  }}
                >
                  <HolidayContextProvider>
                    <MyAttendance />
                  </HolidayContextProvider>
                </ProtectedRoute>
              }
            />
            <Route
              path="leaves"
              element={<Navigate to="/leaves-management" replace />}
            />
            <Route
              path="requirements"
              element={
                <ProtectedRoute
                  meta={{
                    group: ModuleGroup.Marketing,
                    module: MarketingModule.Requirements,
                  }}
                >
                  <Requirements />
                </ProtectedRoute>
              }
            />
            <Route
              path="chess-leads"
              element={
                <ProtectedRoute
                  meta={{
                    group: ModuleGroup.Marketing,
                    module: MarketingModule['Chess Leads'],
                  }}
                >
                  <ChessLeads />
                </ProtectedRoute>
              }
            />
            <Route
              path="interviews"
              element={
                <ProtectedRoute
                  meta={{
                    group: ModuleGroup.Marketing,
                    module: MarketingModule.Interviews,
                  }}
                >
                  <InterviewTabs />
                </ProtectedRoute>
              }
            />
            <Route
              path="job-boards"
              element={
                <ProtectedRoute
                  meta={{
                    group: ModuleGroup.Marketing,
                    module: MarketingModule['Job Boards'],
                  }}
                >
                  <JobBoardSearchProvider>
                    <JobBoards />
                  </JobBoardSearchProvider>
                </ProtectedRoute>
              }
            />
            <Route
              path="consultants"
              element={
                <ProtectedRoute
                  meta={{
                    group: ModuleGroup.Marketing,
                    module: MarketingModule.Consultants,
                  }}
                >
                  <Consultants />
                </ProtectedRoute>
              }
            />
            <Route
              path="teams"
              element={
                <ProtectedRoute
                  meta={{
                    group: ModuleGroup.Marketing,
                    module: MarketingModule.Teams,
                  }}
                >
                  <Teams />
                </ProtectedRoute>
              }
            />
            <Route
              path="reports"
              element={
                <ProtectedRoute
                  meta={{
                    group: ModuleGroup.Marketing,
                    module: MarketingModule.Reports,
                  }}
                >
                  <Reports />
                </ProtectedRoute>
              }
            />
            <Route
              path="sales-leads"
              element={
                <ProtectedRoute
                  meta={{
                    group: ModuleGroup.Marketing,
                    module: MarketingModule['Sales Leads'],
                  }}
                >
                  <SalesLead />
                </ProtectedRoute>
              }
            />
            <Route
              path="user-management"
              element={
                <ProtectedRoute
                  meta={{
                    group: ModuleGroup['Super Admin Modules'],
                    module: SuperAdminModule['User Management'],
                  }}
                >
                  <UserManagement />
                </ProtectedRoute>
              }
            />
            <Route
              path="access-control"
              element={
                <ProtectedRoute
                  meta={{
                    group: ModuleGroup['Super Admin Modules'],
                    module: SuperAdminModule['Access Control'],
                  }}
                >
                  <AccessControl />
                </ProtectedRoute>
              }
            />
            <Route
              path="call-report"
              element={
                <ProtectedRoute
                  meta={{
                    group: ModuleGroup['Super Admin Modules'],
                    module: SuperAdminModule['Call Report'],
                  }}
                >
                  <CallReport />
                </ProtectedRoute>
              }
            />
            <Route
              path="attendance/dashboard"
              element={
                <ProtectedRoute
                  meta={{
                    group: ModuleGroup['Super Admin Modules'],
                    module: SuperAdminModule['Attendance Dashboard'],
                  }}
                >
                  <HolidayContextProvider>
                    <AttendanceDashboard />
                  </HolidayContextProvider>
                </ProtectedRoute>
              }
            />
            <Route
              path="leaves-management"
              element={
                <ProtectedRoute
                  meta={{
                    group: ModuleGroup['Presence & Leave'],
                    module: EmployeeModule.Leaves,
                  }}
                >
                  <LeavesManagement />
                </ProtectedRoute>
              }
            />
            <Route
              path="employee-management"
              element={
                <ProtectedRoute
                  meta={{
                    group: ModuleGroup['Super Admin Modules'],
                    module: SuperAdminModule['Employee Management'],
                  }}
                >
                  <EmployeeManagement />
                </ProtectedRoute>
              }
            />
          </Route>

          {isAuthenticated ? (
            <Route
              path="dashboard"
              element={<Navigate to="/dashboard" replace />}
            />
          ) : null}
        </Routes>
      </Suspense>

      {/* Global AI components — only visible after authentication AND
          only on internal app routes. Also wrapped in Suspense so the
          chunk download is non-blocking. */}
      {showInternalChrome && (
        <Suspense fallback={null}>
          <CommandPalette />
          <FloatingAiChat />
        </Suspense>
      )}
    </>
  );
}

export default App;
