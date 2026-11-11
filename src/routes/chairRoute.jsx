import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/authContext';
import { ChairProvider } from '../context/chairContext';

// Wraps every /chair/* page: only for admins (profiles.roles has ADMIN / EC_CHAIR)
// and only while the "EC Chair" side is active,
// and gives those pages their shared data (submissions, reviewers, letters).
export default function ChairRoute() {
  const { activeRole, isAdmin, loading, profile, session } = useAuth();

  // Profile loads a moment after the session; don't bounce admins before it arrives.
  if (loading || (session && !profile)) return null;

  if (!isAdmin || activeRole !== 'chair') return <Navigate to="/overview" replace />;

  return (
    <ChairProvider>
      <Outlet />
    </ChairProvider>
  );
}
