import { useEffect, useState } from 'react';
import { Bell, CheckCheck, Trash2, X } from 'lucide-react';
import { supabase, isBackendConfigured } from '../../lib/supabaseClient';

const INITIAL_NOTIFICATIONS = [
  {
    id: 'notif-1',
    title: 'Submission Created',
    message: 'Your manuscript CONF-2026-TRACK-0002 was logged for review.',
    created_at: new Date().toISOString(),
    is_read: false,
  },
  {
    id: 'notif-2',
    title: 'Review Assignment Update',
    message: 'A reviewer has been assigned to your submission.',
    created_at: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    is_read: false,
  },
];

function formatTimeLabel(isoString) {
  if (!isoString) return '';
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function Notifications() {
  const [notifications, setNotifications] = useState(INITIAL_NOTIFICATIONS);
  const [isClearing, setIsClearing] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadNotifications() {
      if (!isBackendConfigured) return;

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user || !active) return;

      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (!error && active && Array.isArray(data)) {
        setNotifications(data);
      }
    }

    loadNotifications();
    return () => {
      active = false;
    };
  }, []);

  const handleMarkAllRead = async () => {
    const previous = notifications;
    setNotifications((prev) => prev.map((item) => ({ ...item, is_read: true })));

    if (!isBackendConfigured) return;

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', user.id)
      .eq('is_read', false);

    if (error) {
      console.error('[Colloquium] Failed to mark notifications read:', error);
      setNotifications(previous);
    }
  };

  const handleDismissOne = async (id) => {
    const previous = notifications;
    setNotifications((prev) => prev.filter((item) => item.id !== id));

    if (!isBackendConfigured) return;

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      console.error('[Colloquium] Failed to delete notification:', error);
      setNotifications(previous);
    }
  };

  const handleClearAll = async () => {
    if (notifications.length === 0 || isClearing) return;

    const previous = notifications;
    setIsClearing(true);
    setNotifications([]);

    if (!isBackendConfigured) {
      setIsClearing(false);
      return;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('user_id', user.id);

      if (error) {
        console.error('[Colloquium] Failed to clear notifications:', error);
        setNotifications(previous);
      }
    }

    setIsClearing(false);
  };

  const hasUnread = notifications.some((item) => !item.is_read);

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900 dark:text-white sm:text-3xl">
            Notifications
          </h1>
          <p className="mt-1 text-sm text-secondary-500 dark:text-secondary-400">
            Updates on your submissions and review activity.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {hasUnread && (
            <button
              type="button"
              onClick={handleMarkAllRead}
              className="inline-flex items-center gap-1.5 rounded-xl border border-secondary-200 bg-white px-3 py-2 text-xs font-semibold text-secondary-700 transition hover:bg-secondary-50 dark:border-secondary-700 dark:bg-secondary-900 dark:text-secondary-200"
            >
              <CheckCheck className="h-3.5 w-3.5" />
              <span>Mark all read</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleClearAll}
            disabled={notifications.length === 0 || isClearing}
            className="inline-flex items-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2 text-xs font-semibold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span>{isClearing ? 'Clearing...' : 'Clear'}</span>
          </button>
        </div>
      </div>

      {notifications.length === 0 ? (
        <div className="mt-8 flex flex-col items-center justify-center rounded-2xl border border-dashed border-secondary-300 bg-white px-6 py-16 text-center dark:border-secondary-700 dark:bg-secondary-900">
          <Bell className="h-10 w-10 text-secondary-300" />
          <p className="mt-4 text-sm font-medium text-secondary-600 dark:text-secondary-300">
            You&apos;re all caught up.
          </p>
        </div>
      ) : (
        <div className="mt-8 space-y-3">
          {notifications.map((item) => {
            const timeLabel = item.time || formatTimeLabel(item.created_at);
            return (
              <div
                key={item.id}
                className={`flex items-start justify-between gap-4 rounded-2xl border p-4 transition ${
                  item.is_read
                    ? 'border-secondary-200 bg-white dark:border-secondary-800 dark:bg-secondary-900'
                    : 'border-[#1B3C53]/30 bg-[#F9F3EF] dark:border-secondary-700 dark:bg-secondary-900/90'
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    {!item.is_read && (
                      <span className="h-2 w-2 rounded-full bg-[#1B3C53]" />
                    )}
                    <h2 className="text-sm font-semibold text-secondary-900 dark:text-white">
                      {item.title}
                    </h2>
                    {timeLabel && (
                      <span className="text-xs text-secondary-400">
                        • {timeLabel}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-secondary-600 dark:text-secondary-300">
                    {item.message}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => handleDismissOne(item.id)}
                  title="Dismiss notification"
                  className="rounded-lg p-1 text-secondary-400 transition hover:bg-secondary-100 hover:text-secondary-700 dark:hover:bg-secondary-800"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
