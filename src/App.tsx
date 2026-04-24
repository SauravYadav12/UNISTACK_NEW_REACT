import './App.css';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom';
import Login from './pages/Auth/Login';
import Dashboard from './pages/Dashboard/Dashboard';
import Layout from './components/layout/Layout';
import Requirements from './pages/Marketing/Requirements/Requirements';
import Consultants from './pages/Marketing/Consultants/Consultants';
import Teams from './pages/Marketing/Teams/Teams';
import Profile from './pages/Marketing/Profile/Profile';
import Reports from './pages/Marketing/Reports/Reports';
import SignUp from './pages/Auth/Signup';
import { AuthContextProvider, useAuth } from './AuthGaurd/AuthContextProvider';
import ProtectedRoute from './AuthGaurd/ProtectedRoute';
import UserManagement from './pages/UserManagement/UserManagement';
import InterviewTabs from './components/interview/InterviewTabs';
import SalesLead from './pages/Marketing/SalesLeads/SalesLeads';
import AttendanceDashboard from './pages/Attendance/AttendanceDashboard';
import MyAttendance from './pages/Attendance/MyAttendance';
import AccessControl from './pages/AccessControl/AccessControl';
import Leaves from './pages/Leaves/Leaves';
import {
  EmployeeModule,
  HomeModule,
  MarketingModule,
  ModuleGroup,
  SuperAdminModule,
} from './utils/accessControlUtil';
import ForgotPassword from './pages/Auth/ForgotPassword';
import LeavesManagement from './pages/Leaves/LeavesManagement';
import { HolidayContextProvider } from './contextProviders/HolidayContextProvider';
import Salary from './pages/Salary/Salary';
import Projects from './pages/Marketing/Projects/Projects';
import PerformancePage from './pages/Performance/PerformancePage';
import MyDocuments from './pages/Documents/MyDocuments';
import Landing from './pages/Landing/Landing';
import LegalPage from './pages/Legal/LegalPage';
import {
  PRIVACY_CONTENT,
  TERMS_CONTENT,
  SECURITY_CONTENT,
  STATUS_CONTENT,
} from './pages/Legal/legalContent';
import { AiProvider } from './context/AiContext';
import { RequirementAiChatProvider } from './context/RequirementAiChatContext';
import FloatingAiChat from './components/aiChat/FloatingAiChat';
import CommandPalette from './components/commandPalette/CommandPalette';

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

  return (
    <>
      <Routes>
        {/* Public landing — pitches the product to unauthed visitors;
            authed visitors are redirected to /dashboard inside Landing. */}
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        {/* Public legal / policy pages — always reachable, no auth gate.
            Each route renders the shared LegalPage shell with a content blob
            from legalContent.ts. */}
        <Route
          path="/privacy"
          element={<LegalPage content={PRIVACY_CONTENT} />}
        />
        <Route path="/terms" element={<LegalPage content={TERMS_CONTENT} />} />
        <Route
          path="/security"
          element={<LegalPage content={SECURITY_CONTENT} />}
        />
        <Route
          path="/status"
          element={<LegalPage content={STATUS_CONTENT} />}
        />
        {/* Pathless layout route — children carry their own paths (e.g.
            `dashboard` → /dashboard) and render inside <Layout/>. Keeping
            this pathless avoids colliding with the public `/` → Landing
            route declared above. */}
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
          <Route path="my-salary" element={<Navigate to="/my-documents" replace />} />
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
        </Route>

        {isAuthenticated ? (
          <Route
            path="dashboard"
            element={<Navigate to="/dashboard" replace />}
          />
        ) : null}
      </Routes>

      {/* Global AI components — only visible after authentication */}
      {isAuthenticated && (
        <>
          <CommandPalette />
          <FloatingAiChat />
        </>
      )}
    </>
  );
}

export default App;
