import { useLocation, useNavigate } from 'react-router-dom';
import { PenLine, ClipboardCheck, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../context/authContext';

// TODO: once profiles have a role column, only show 'chair' to users who actually are EC Chairs.
const roles = [
  { key: 'author', label: 'Author', icon: PenLine },
  { key: 'reviewer', label: 'Reviewer', icon: ClipboardCheck },
  { key: 'chair', label: 'EC Chair', icon: ShieldCheck },
];

export default function RoleSwitch() {
  const { activeRole, setActiveRole } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const handleSwitch = (role) => {
    setActiveRole(role);
    if (role === 'chair') navigate('/chair/submissions');
    else if (pathname.startsWith('/chair')) navigate('/overview');
  };

  return (
    <div className="inline-flex items-center rounded-xl bg-secondary-100 p-1 dark:bg-secondary-800">
      {roles.map(({ key, label, icon: Icon }) => (
        <button
          key={key}
          type="button"
          onClick={() => handleSwitch(key)}
          className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-sm font-semibold transition-colors ${
            activeRole === key
              ? 'bg-white text-primary-600 shadow-sm dark:bg-secondary-900'
              : 'text-secondary-500 hover:text-secondary-700 dark:hover:text-secondary-300'
          }`}
        >
          <Icon className="h-4 w-4" />
          {label}
        </button>
      ))}
    </div>
  );
}
