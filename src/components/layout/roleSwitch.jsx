import { PenLine, ClipboardCheck } from 'lucide-react';
import { useAuth } from '../../context/authContext';

export default function RoleSwitch() {
  const { activeRole, setActiveRole } = useAuth();

  return (
    <div className="inline-flex items-center rounded-xl bg-secondary-100 p-1 dark:bg-secondary-800">
      <button
        type="button"
        onClick={() => setActiveRole('author')}
        className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-sm font-semibold transition-colors ${
          activeRole === 'author'
            ? 'bg-white text-primary-600 shadow-sm dark:bg-secondary-900'
            : 'text-secondary-500 hover:text-secondary-700 dark:hover:text-secondary-300'
        }`}
      >
        <PenLine className="h-4 w-4" />
        Author
      </button>
      <button
        type="button"
        onClick={() => setActiveRole('reviewer')}
        className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-sm font-semibold transition-colors ${
          activeRole === 'reviewer'
            ? 'bg-white text-primary-600 shadow-sm dark:bg-secondary-900'
            : 'text-secondary-500 hover:text-secondary-700 dark:hover:text-secondary-300'
        }`}
      >
        <ClipboardCheck className="h-4 w-4" />
        Reviewer
      </button>
    </div>
  );
}