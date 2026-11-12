import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FileText, ClipboardCheck, Bell } from 'lucide-react';
import { useAuth } from '../../context/authContext';
import { supabase, isBackendConfigured } from '../../lib/supabaseClient';
import { authorStatus } from '../../lib/db';

const when = (iso) => new Date(iso).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' });

// Live dashboard: counts and recent activity come from Supabase and refresh on any change.
export default function Overview() {
  const { profile, activeRole, user } = useAuth();
  const [stats, setStats] = useState({ submissions: 0, inReview: 0, accepted: 0, assignments: 0, pending: 0, unread: 0 });
  const [recent, setRecent] = useState([]);

  const load = useCallback(async () => {
    if (!isBackendConfigured || !user) return;
    const [subs, asg, unread, notes] = await Promise.all([
      supabase.from('submissions').select('status, revision_deadline').eq('author_id', user.id),
      supabase.from('reviewer_assignments').select('assignment_status').eq('reviewer_id', user.id),
      supabase.from('notifications').select('id', { count: 'exact', head: true }).eq('user_id', user.id).eq('is_read', false),
      supabase.from('notifications').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(6),
    ]);
    const mine = subs.data ?? [];
    const labels = mine.map((s) => authorStatus(s.status, s.revision_deadline));
    const assignments = asg.data ?? [];
    setStats({
      submissions: mine.length,
      inReview: labels.filter((l) => l === 'For Review' || l === 'Resubmission').length,
      accepted: labels.filter((l) => l === 'Approved').length,
      assignments: assignments.length,
      pending: assignments.filter((a) => a.assignment_status !== 'COMPLETED').length,
      unread: unread.count ?? 0,
    });
    setRecent(notes.data ?? []);
  }, [user]);

  useEffect(() => {
    load();
    if (!isBackendConfigured || !user) return;
    const channel = supabase.channel(`overview-${user.id}`);
    ['submissions', 'reviewer_assignments', 'reviews', 'notifications'].forEach((table) =>
      channel.on('postgres_changes', { event: '*', schema: 'public', table }, () => load())
    );
    channel.subscribe();
    // Fallback for when realtime is not enabled: refresh when the tab is focused again.
    const onFocus = () => load();
    window.addEventListener('focus', onFocus);
    return () => {
      supabase.removeChannel(channel);
      window.removeEventListener('focus', onFocus);
    };
  }, [load, user]);

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
      <h1 className="text-2xl font-bold text-secondary-900 dark:text-white sm:text-3xl">
        Welcome back{profile?.full_name ? `, ${profile.full_name.split(' ')[0]}` : ''}
      </h1>
      <p className="mt-1 text-sm text-secondary-500 dark:text-secondary-400">
        You're viewing Colloquium as {activeRole === 'chair' ? 'the EC Chair' : 'an Author / Reviewer'}.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <SummaryCard to="/submissions" icon={FileText} label="My Submissions" value={stats.submissions}
          note={stats.submissions ? `${stats.inReview} in review, ${stats.accepted} accepted` : 'No papers yet'} />
        <SummaryCard to="/review-assignments" icon={ClipboardCheck} label="Review Assignments" value={stats.assignments}
          note={stats.assignments ? `${stats.pending} waiting for your review` : 'Nothing assigned'} />
        <SummaryCard to="/notifications" icon={Bell} label="Unread Notifications" value={stats.unread}
          note={stats.unread ? 'Open to read them' : "You're all caught up"} />
      </div>

      <div className="mt-8 rounded-2xl border border-secondary-200 bg-white shadow-card dark:border-secondary-800 dark:bg-secondary-900">
        <div className="flex items-center justify-between border-b border-secondary-100 px-5 py-4 dark:border-secondary-800">
          <h2 className="text-sm font-bold text-secondary-900 dark:text-white">Recent activity</h2>
          {recent.length > 0 && <Link to="/notifications" className="text-xs font-semibold text-primary-600 hover:underline">See all</Link>}
        </div>
        {recent.length === 0 ? (
          <p className="p-8 text-center text-sm text-secondary-500 dark:text-secondary-400">
            No recent activity yet. Once you submit a paper or get assigned a review, it'll show up here.
          </p>
        ) : (
          <ul className="divide-y divide-secondary-100 dark:divide-secondary-800">
            {recent.map((n) => (
              <li key={n.id} className="flex items-start gap-3 px-5 py-3">
                <span className={`mt-1.5 h-2.5 w-2.5 flex-shrink-0 rounded-full ${n.is_read ? 'bg-secondary-200' : 'bg-red-500'}`} />
                <div className="min-w-0 flex-1">
                  <p className={`text-sm text-secondary-900 dark:text-white ${n.is_read ? '' : 'font-bold'}`}>{n.title}</p>
                  <p className="truncate text-xs text-secondary-500">{n.message}</p>
                </div>
                <span className="flex-shrink-0 text-xs text-secondary-400">{when(n.created_at)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function SummaryCard({ to, icon: Icon, label, value, note }) {
  return (
    <Link to={to} className="rounded-2xl border border-secondary-200 bg-white p-5 shadow-card transition-colors hover:border-primary-300 dark:border-secondary-800 dark:bg-secondary-900">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-50 text-primary-600 dark:bg-primary-900/30 dark:text-primary-300">
        <Icon className="h-5 w-5" />
      </div>
      <p className="mt-3 text-2xl font-bold text-secondary-900 dark:text-white">{value}</p>
      <p className="text-sm text-secondary-500 dark:text-secondary-400">{label}</p>
      {note && <p className="mt-1 text-xs text-secondary-400">{note}</p>}
    </Link>
  );
}
