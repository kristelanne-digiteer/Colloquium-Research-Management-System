import { useCallback, useEffect, useState } from 'react';
import { Bell, CheckCheck } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../context/authContext';

const formatDate = (iso) =>
  new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });

export default function Notifications() {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (!user) return;
    const { data, error: fetchError } = await supabase
      .from('notifications')
      .select('id, type, title, message, is_read, created_at')
      .eq('user_id', user.id)
      .lte('scheduled_for', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(50);

    if (fetchError) setError('Could not load notifications.');
    else {
      setError('');
      setItems(data);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    load();
    window.addEventListener('focus', load);
    return () => window.removeEventListener('focus', load);
  }, [load]);

  const markRead = async (id) => {
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
    await supabase.from('notifications').update({ is_read: true }).eq('id', id);
  };

  const markAllRead = async () => {
    setItems((prev) => prev.map((n) => ({ ...n, is_read: true })));
    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', user.id)
      .eq('is_read', false);
  };

  const unreadCount = items.filter((n) => !n.is_read).length;

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900 dark:text-white sm:text-3xl">
            Notifications
          </h1>
          <p className="mt-1 text-sm text-secondary-500 dark:text-secondary-400">
            Updates on your submissions and review activity.
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            type="button"
            onClick={markAllRead}
            className="flex shrink-0 items-center gap-1.5 text-sm font-semibold text-primary-600 hover:text-primary-700"
          >
            <CheckCheck className="h-4 w-4" />
            Mark all as read
          </button>
        )}
      </div>

      {error && <p className="mt-6 text-sm font-medium text-red-600">{error}</p>}

      {loading ? (
        <div className="mt-8 flex justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600" />
        </div>
      ) : items.length === 0 ? (
        <div className="mt-8 flex flex-col items-center justify-center rounded-2xl border border-dashed border-secondary-300 bg-white px-6 py-16 text-center dark:border-secondary-700 dark:bg-secondary-900">
          <Bell className="h-10 w-10 text-secondary-300" />
          <p className="mt-4 text-sm font-medium text-secondary-600 dark:text-secondary-300">
            You're all caught up.
          </p>
        </div>
      ) : (
        <ul className="mt-8 space-y-3">
          {items.map((n) => (
            <li key={n.id}>
              <button
                type="button"
                onClick={() => !n.is_read && markRead(n.id)}
                className={`w-full rounded-2xl border px-5 py-4 text-left transition-colors ${
                  n.is_read
                    ? 'border-secondary-200 bg-white dark:border-secondary-800 dark:bg-secondary-900'
                    : 'border-primary-300 bg-primary-50 dark:border-primary-700 dark:bg-secondary-800'
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-secondary-900 dark:text-white">
                    {n.title}
                  </p>
                  {!n.is_read && <span className="h-2 w-2 shrink-0 rounded-full bg-primary-600" />}
                </div>
                <p className="mt-1 text-sm text-secondary-600 dark:text-secondary-300">
                  {n.message}
                </p>
                <p className="mt-2 text-xs text-secondary-400">{formatDate(n.created_at)}</p>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}