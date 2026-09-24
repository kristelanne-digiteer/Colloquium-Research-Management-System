import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/authContext';
import ProtectedRoute from './routes/protectedRoutes';
import AppLayout from './components/layout/appLayout';

import SignUp from './pages/auth/signUp.jsx';
import VerifyPin from './pages/auth/verifyPin.jsx';
import Login from './pages/auth/login.jsx';
import ForgotPassword from './pages/auth/forgotPassword.jsx';
import ResetPin from './pages/auth/resetPin.jsx';
import ResetSuccess from './pages/auth/resetSuccess.jsx';
import AccountSettings from './pages/auth/accountSettings.jsx';
import Overview from './pages/dashboard/overview.jsx';
import MySubmissions from './pages/submissions/mySubmissions.jsx';
import ReviewAssignments from './pages/review/reviewAssignments.jsx';
import Notifications from './pages/notifications/notifications.jsx';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/signup" element={<SignUp />} />
          <Route path="/verify-pin" element={<VerifyPin />} />
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-pin" element={<ResetPin />} />
          <Route path="/reset-success" element={<ResetSuccess />} />

          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              <Route path="/overview" element={<Overview />} />
              <Route path="/submissions" element={<MySubmissions />} />
              <Route path="/review-assignments" element={<ReviewAssignments />} />
              <Route path="/notifications" element={<Notifications />} />
              <Route path="/account-settings" element={<AccountSettings />} />
              <Route path="/" element={<Navigate to="/overview" replace />} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}