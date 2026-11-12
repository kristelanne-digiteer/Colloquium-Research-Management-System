import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Bell, FileText, Printer, X } from 'lucide-react';
import { supabase, isBackendConfigured } from '../../lib/supabaseClient';
import { useAuth } from '../../context/authContext';
import { getLocalLetterNotifications } from '../../lib/letterStore';
import LetterPaper from '../../components/common/letterPaper';

const when = (iso) => new Date(iso).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' });

export default function Notifications() {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [viewing, setViewing] = useState(null);

  useEffect(() => {
    if (!user) return;
    let alive = true;
    const local = getLocalLetterNotifications(user.email);

    const load = async () => {
      if (!isBackendConfigured) return alive && setItems(local);
      const { data } = await supabase
        .from('notifications')
        .select('*')
        .or(`user_id.eq.${user.id},recipient_email.eq.${user.email}`)
        .order('created_at', { ascending: false });
      if (!alive) return;
      // The same letter can exist as a local copy and a DB row: keep the DB row.
      const keys = new Set((data ?? []).map((n) => n.title + n.message));
      setItems([...(data ?? []), ...local.filter((n) => !keys.has(n.title + n.message))]);
    };
    load();

    if (!isBackendConfigured) return () => { alive = false; };
    // Live updates for assignments, submissions and decision letters
    const channel = supabase
      .channel(`notifications-${user.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` }, () => load())
      .subscribe();
    return () => { alive = false; supabase.removeChannel(channel); };
  }, [user]);

  const open = async (n) => {
    setViewing(n);
    if (!n.is_read && isBackendConfigured && !String(n.id).startsWith('local-')) {
      await supabase.from('notifications').update({ is_read: true }).eq('id', n.id);
      setItems((prev) => prev.map((x) => (x.id === n.id ? { ...x, is_read: true } : x)));
    }
  };

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
      <h1 className="text-2xl font-bold text-secondary-900 dark:text-white sm:text-3xl">Notifications</h1>
      <p className="mt-1 text-sm text-secondary-500 dark:text-secondary-400">Updates on your submissions and review activity.</p>

      {items.length === 0 ? (
        <div className="mt-8 flex flex-col items-center justify-center rounded-2xl border border-dashed border-secondary-300 bg-white px-6 py-16 text-center dark:border-secondary-700 dark:bg-secondary-900">
          <Bell className="h-10 w-10 text-secondary-300" />
          <p className="mt-4 text-sm font-medium text-secondary-600 dark:text-secondary-300">You&apos;re all caught up.</p>
        </div>
      ) : (
        <ul className="mt-8 space-y-3">
          {items.map((n) => (
            <li key={n.id} className={`flex items-start gap-3 rounded-2xl border bg-white p-4 dark:bg-secondary-900 ${n.is_read ? 'border-secondary-200 dark:border-secondary-800' : 'border-primary-300'}`}>
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary-600">
                {n.data?.letter ? <FileText className="h-5 w-5" /> : <Bell className="h-5 w-5" />}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-secondary-900 dark:text-white">{n.title}</p>
                <p className="truncate text-sm text-secondary-500">{n.message}</p>
                <p className="mt-1 text-xs text-secondary-400">{when(n.created_at)}</p>
              </div>
              {n.data?.letter && (
                <button type="button" onClick={() => open(n)} className="rounded-lg border border-primary-600 px-3 py-1.5 text-xs font-semibold text-primary-600 hover:bg-primary-50">
                  View letter
                </button>
              )}
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
