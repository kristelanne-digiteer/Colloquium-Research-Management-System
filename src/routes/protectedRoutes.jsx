import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/authContext';

export default function ProtectedRoute() {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface-muted dark:bg-surface-dark">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600" />
      </div>
    );
  }

  return session ? <Outlet /> : <Navigate to="/login" replace />;
}