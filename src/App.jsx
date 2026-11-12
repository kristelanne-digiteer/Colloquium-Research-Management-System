import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/authContext';
import ProtectedRoute from './routes/protectedRoutes';
import ChairRoute from './routes/chairRoute';
import AppLayout from './components/layout/appLayout';
import AuthorSubmissionForm from './components/AuthorSubmissionForm';

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
import ReviewScreen from './pages/review/reviewscreen.jsx';
import Notifications from './pages/notifications/notifications.jsx';
import ChairSubmissions from './pages/chair/chairSubmissions.jsx';
import ChairReviewers from './pages/chair/chairReviewers.jsx';
import ChairLetters from './pages/chair/chairLetters.jsx';
import ChairReports from './pages/chair/chairReports.jsx';

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
          <Route path="/author-submission" element={<AuthorSubmissionForm />} />

          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              <Route path="/overview" element={<Overview />} />
              <Route path="/submissions" element={<MySubmissions />} />
              <Route path="/review-assignments" element={<ReviewAssignments />} />
              <Route path="/review-assignments/:id" element={<ReviewScreen />} />
              <Route path="/notifications" element={<Notifications />} />
              <Route path="/account-settings" element={<AccountSettings />} />
              <Route element={<ChairRoute />}>
                <Route path="/chair" element={<Navigate to="/chair/submissions" replace />} />
                <Route path="/chair/submissions" element={<ChairSubmissions />} />
                <Route path="/chair/reviewers" element={<ChairReviewers />} />
                <Route path="/chair/letters" element={<ChairLetters />} />
                <Route path="/chair/reports" element={<ChairReports />} />
              </Route>
              <Route path="/" element={<Navigate to="/overview" replace />} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}