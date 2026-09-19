import { FileText, ClipboardCheck, Bell } from 'lucide-react';
import { useAuth } from '../../context/authContext';

export default function Overview() {
  const { profile, activeRole } = useAuth();

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
      <h1 className="text-2xl font-bold text-secondary-900 dark:text-white sm:text-3xl">
        Welcome back{profile?.full_name ? `, ${profile.full_name.split(' ')[0]}` : ''}
      </h1>
      <p className="mt-1 text-sm text-secondary-500 dark:text-secondary-400">
        You're viewing Colloquium as {activeRole === 'author' ? 'an Author' : 'a Reviewer'}.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <SummaryCard icon={FileText} label="My Submissions" value={0} />
        <SummaryCard icon={ClipboardCheck} label="Review Assignments" value={0} />
        <SummaryCard icon={Bell} label="Unread Notifications" value={0} />
      </div>

      <div className="mt-8 rounded-2xl border border-secondary-200 bg-white p-8 text-center shadow-card dark:border-secondary-800 dark:bg-secondary-900">
        <p className="text-sm text-secondary-500 dark:text-secondary-400">
          No recent activity yet. Once you submit a paper or get assigned a review, it'll show up here.
        </p>
      </div>
    </div>
  );
}

function SummaryCard({ icon: Icon, label, value }) {
  return (
    <div className="rounded-2xl border border-secondary-200 bg-white p-5 shadow-card dark:border-secondary-800 dark:bg-secondary-900">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-50 text-primary-600 dark:bg-primary-900/30 dark:text-primary-300">
        <Icon className="h-5 w-5" />
      </div>
      <p className="mt-3 text-2xl font-bold text-secondary-900 dark:text-white">{value}</p>
      <p className="text-sm text-secondary-500 dark:text-secondary-400">{label}</p>
    </div>
  );
}