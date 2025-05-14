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
import TestAndVendorInterviews from './pages/Marketing/TestAndVendorInterviews/TestAndVendorInterviews';
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

function App() {
  const { isAuthenticated } = useAuth();
  return (
    <AuthContextProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route
            path="/"
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
                  <MyAttendance />
                </ProtectedRoute>
              }
            />
            <Route
              path="leaves"
              element={
                <ProtectedRoute
                  meta={{
                    group: ModuleGroup['Presence & Leave'],
                    module: EmployeeModule.Leaves,
                  }}
                >
                  {/* <Leaves /> */}
                  <>Comming Soon</>
                </ProtectedRoute>
              }
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
              path="testandvendorinterviews"
              element={
                <ProtectedRoute
                  meta={{
                    group: ModuleGroup.Marketing,
                    module: MarketingModule['Test And VI'],
                  }}
                >
                  <TestAndVendorInterviews />
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
                  <AttendanceDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="leaves-management"
              element={
                <ProtectedRoute
                  meta={{
                    group: ModuleGroup['Super Admin Modules'],
                    module: SuperAdminModule['Leaves Management'],
                  }}
                >
                  {/* <LeavesManagement /> */}
                  <>Comming Soon</>
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
      </Router>
    </AuthContextProvider>
  );
}

export default App;
