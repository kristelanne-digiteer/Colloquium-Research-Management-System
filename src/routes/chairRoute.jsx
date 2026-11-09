import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/authContext';
import { ChairProvider } from '../context/chairContext';

// Wraps every /chair/* page: only visible while the "EC Chair" role is active,
// and gives those pages their shared data (submissions, reviewers, letters).
// TODO: once Supabase has a role column, also check profile.role === 'ec_chair' here.
export default function ChairRoute() {
  const { activeRole } = useAuth();

  if (activeRole !== 'chair') return <Navigate to="/overview" replace />;

  return (
    <ChairProvider>
      <Outlet />
    </ChairProvider>
  );
}
