import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Menu } from 'lucide-react';
import Sidebar from './sidebar';
import RoleSwitch from './roleSwitch';
import { useAuth } from '../../context/authContext';

export default function AppLayout() {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const { isAdmin } = useAuth();

  return (
    <div className="flex h-screen w-full bg-surface-muted dark:bg-surface-dark">
      {/* Desktop sidebar */}
      <div className="hidden lg:block">
        <Sidebar />
      </div>

      {/* Mobile sidebar overlay */}
      {mobileNavOpen && (
        <div className="fixed inset-0 z-40 flex lg:hidden">
          <div
            className="fixed inset-0 bg-black/40"
            onClick={() => setMobileNavOpen(false)}
          />
          <div className="relative z-50">
            <Sidebar onNavigate={() => setMobileNavOpen(false)} />
          </div>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        {/* Top bar: mobile menu button for everyone, plus the role switch for admins.
            Regular users have nothing to show on desktop, so it stays hidden for them. */}
        <header
          className={`flex items-center justify-between gap-4 border-b border-secondary-200/70 bg-white/80 px-4 py-3 backdrop-blur dark:border-secondary-800 dark:bg-surface-dark/80 sm:px-6 ${
            isAdmin ? '' : 'lg:hidden'
          }`}
        >
          <button
            onClick={() => setMobileNavOpen(true)}
            aria-label="Open menu"
            className="flex h-9 w-9 items-center justify-center rounded-lg text-secondary-600 hover:bg-secondary-100 dark:text-secondary-300 dark:hover:bg-secondary-800 lg:hidden"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex flex-1 justify-end">
            <RoleSwitch />
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
