import { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Bell, CheckCheck, FileText, Printer, Trash2, X } from 'lucide-react';
import { supabase, isBackendConfigured } from '../../lib/supabaseClient';
import { useAuth } from '../../context/authContext';
import { clearLocalNotifications, getLocalLetterNotifications, removeLocalNotification } from '../../lib/letterStore';
import LetterPaper from '../../components/common/letterPaper';

const when = (iso) => new Date(iso).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' });
const isLocal = (n) => String(n.id).startsWith('local-');

// Create (sent by the app) / Read / Update (mark read) / Delete (one or clear all).
export default function Notifications() {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [viewing, setViewing] = useState(null);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (!user) return;
    const local = getLocalLetterNotifications(user.email);
    if (!isBackendConfigured) return setItems(local);
    const { data, error: e } = await supabase
      .from('notifications')
      .select('*')
      .or(`user_id.eq.${user.id},recipient_email.eq.${user.email}`)
      .order('created_at', { ascending: false });
    if (e) setError(e.message);
    // The same letter can exist as a local copy and a DB row: keep the DB row.
    const keys = new Set((data ?? []).map((n) => n.title + n.message));
    setItems([...(data ?? []), ...local.filter((n) => !keys.has(n.title + n.message))]);
  }, [user]);

  useEffect(() => {
    load();
    if (!isBackendConfigured || !user) return;
    // Live updates for assignments, submissions and decision letters
    const channel = supabase
      .channel(`notifications-${user.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [load, user]);

  const markRead = async (n) => {
    if (n.is_read) return;
    setItems((prev) => prev.map((x) => (x.id === n.id ? { ...x, is_read: true } : x)));
    if (isBackendConfigured && !isLocal(n)) await supabase.from('notifications').update({ is_read: true }).eq('id', n.id);
  };

  const markAllRead = async () => {
    setItems((prev) => prev.map((x) => ({ ...x, is_read: true })));
    if (isBackendConfigured) await supabase.from('notifications').update({ is_read: true }).eq('user_id', user.id).eq('is_read', false);
  };

  const remove = async (n) => {
    setItems((prev) => prev.filter((x) => x.id !== n.id));
    if (isLocal(n)) return removeLocalNotification(n.id);
    const { error: e } = await supabase.from('notifications').delete().eq('id', n.id);
    if (e) { setError(`Could not delete: ${e.message}`); load(); }
  };

  const clearAll = async () => {
    if (!window.confirm('Delete all notifications? This cannot be undone.')) return;
    setItems([]);
    clearLocalNotifications(user.email);
    if (isBackendConfigured) {
      const { error: e } = await supabase.from('notifications').delete().eq('user_id', user.id);
      if (e) { setError(`Could not clear: ${e.message}`); load(); }
    }
  };

  const unread = items.filter((n) => !n.is_read).length;

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900 dark:text-white sm:text-3xl">Notifications</h1>
          <p className="mt-1 text-sm text-secondary-500 dark:text-secondary-400">
            Updates on your submissions and review activity. {unread > 0 ? `${unread} unread.` : ''}
          </p>
        </div>
        {items.length > 0 && (
          <div className="flex gap-2">
            <button type="button" onClick={markAllRead} disabled={unread === 0} className="inline-flex items-center gap-1.5 rounded-lg border border-secondary-300 px-3 py-1.5 text-xs font-semibold text-secondary-700 hover:bg-secondary-50 disabled:opacity-50">
              <CheckCheck className="h-4 w-4" /> Mark all read
            </button>
            <button type="button" onClick={clearAll} className="inline-flex items-center gap-1.5 rounded-lg border border-red-300 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50">
              <Trash2 className="h-4 w-4" /> Clear all
            </button>
          </div>
        )}
      </div>

      {error && <p role="alert" className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

      {items.length === 0 ? (
        <div className="mt-8 flex flex-col items-center justify-center rounded-2xl border border-dashed border-secondary-300 bg-white px-6 py-16 text-center dark:border-secondary-700 dark:bg-secondary-900">
          <Bell className="h-10 w-10 text-secondary-300" />
          <p className="mt-4 text-sm font-medium text-secondary-600 dark:text-secondary-300">You&apos;re all caught up.</p>
        </div>
      ) : (
        <ul className="mt-6 space-y-3">
          {items.map((n) => (
            <li key={n.id} className={`flex items-start gap-3 rounded-2xl border bg-white p-4 dark:bg-secondary-900 ${n.is_read ? 'border-secondary-200 dark:border-secondary-800' : 'border-primary-300'}`}>
              <div className="relative flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary-600">
                {n.data?.letter ? <FileText className="h-5 w-5" /> : <Bell className="h-5 w-5" />}
                {!n.is_read && <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-red-500" aria-label="Unread" />}
              </div>
              <div className="min-w-0 flex-1">
                <p className={`text-secondary-900 dark:text-white ${n.is_read ? 'font-medium' : 'font-bold'}`}>{n.title}</p>
                <p className="truncate text-sm text-secondary-500">{n.message}</p>
                <p className="mt-1 text-xs text-secondary-400">{when(n.created_at)}</p>
              </div>
              <div className="flex flex-shrink-0 items-center gap-1">
                {n.data?.letter && (
                  <button type="button" onClick={() => { setViewing(n); markRead(n); }} className="rounded-lg border border-primary-600 px-3 py-1.5 text-xs font-semibold text-primary-600 hover:bg-primary-50">
                    View letter
                  </button>
                )}
                {!n.is_read && (
                  <button type="button" onClick={() => markRead(n)} title="Mark as read" aria-label="Mark as read" className="rounded-lg p-2 text-secondary-400 hover:bg-secondary-100 hover:text-secondary-700">
                    <CheckCheck className="h-4 w-4" />
                  </button>
                )}
                <button type="button" onClick={() => remove(n)} title="Delete" aria-label="Delete notification" className="rounded-lg p-2 text-secondary-400 hover:bg-red-50 hover:text-red-600">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {viewing && createPortal(
        <div className="fixed inset-0 z-50 overflow-y-auto bg-secondary-100 p-4 sm:p-8 dark:bg-secondary-950">
          <div className="mx-auto mb-4 flex max-w-[760px] justify-end gap-2 print:hidden">
            <button type="button" onClick={() => window.print()} className="inline-flex items-center gap-1.5 rounded-lg border border-secondary-400 bg-white px-3 py-1.5 text-sm font-semibold"><Printer className="h-4 w-4" /> Print / PDF</button>
            <button type="button" onClick={() => setViewing(null)} className="inline-flex items-center gap-1.5 rounded-lg bg-primary-600 px-3 py-1.5 text-sm font-semibold text-white"><X className="h-4 w-4" /> Close</button>
          </div>
          <LetterPaper letter={viewing.data.letter} signatories={viewing.data.signatories ?? []} />
        </div>,
        document.body
      )}
    </div>
  );
}
