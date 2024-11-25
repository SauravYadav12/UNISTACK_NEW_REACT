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
import Interviews from './pages/Marketing/Interviews/Interviews';
import Consultants from './pages/Marketing/Consultants/Consultants';
import Teams from './pages/Marketing/Teams/Teams';
import Profile from './pages/Marketing/Profile/Profile';
import Reports from './pages/Marketing/Reports/Reports';
import SignUp from './pages/Auth/Signup';
import { AuthContextProvider, useAuth } from './AuthGaurd/AuthContextProvider';
import ProtectedRoute from './AuthGaurd/ProtectedRoute';
import UserManagement from './pages/UserManagement/UserManagement';
import TestAndVendorInterviews from './pages/Marketing/TestAndVendorInterviews/TestAndVendorInterviews';
import ListTabs from './components/tabs/CustomTabs';

function App() {
  const { isAuthenticated } = useAuth();
  return (
    <AuthContextProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/signup" element={<SignUp />} />
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
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="requirements"
              element={
                <ProtectedRoute>
                  <Requirements />
                </ProtectedRoute>
              }
            />
            <Route
              path="interviews"
              element={
                <ProtectedRoute>
                  <ListTabs />
                </ProtectedRoute>
              }
            />
            <Route
              path="testandvendorinterviews"
              element={
                <ProtectedRoute>
                  <TestAndVendorInterviews />
                </ProtectedRoute>
              }
            />
            <Route
              path="consultants"
              element={
                <ProtectedRoute>
                  <Consultants />
                </ProtectedRoute>
              }
            />
            <Route
              path="teams"
              element={
                <ProtectedRoute>
                  <Teams />
                </ProtectedRoute>
              }
            />
            <Route
              path="reports"
              element={
                <ProtectedRoute>
                  <Reports />
                </ProtectedRoute>
              }
            />
            <Route
              path="profile"
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              }
            />
            <Route
              path="user-management"
              element={
                <ProtectedRoute>
                  <UserManagement />
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
