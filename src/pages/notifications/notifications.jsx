<<<<<<< Updated upstream
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
=======
import React, { useState, useEffect } from 'react';
import { Bell, CheckCircle2 } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();

    const channel = supabase
      ?.channel('realtime_notifications')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications' }, (payload) => {
        setNotifications((prev) => [payload.new, ...prev]);
      })
      .subscribe();

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, []);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      if (supabase?.from) {
        const { data: authData } = await supabase.auth.getUser();
        const currentUser = authData?.user;

        let query = supabase.from('notifications').select('*').order('created_at', { ascending: false });

        if (currentUser) {
          query = query.or(`user_id.eq.${currentUser.id},recipient_email.eq.${currentUser.email}`);
        }

        const { data, error } = await query;
        if (!error && data) {
          setNotifications(data);
        }
      }
    } catch (err) {
      console.error('Error fetching notifications:', err);
    } finally {
      setLoading(false);
>>>>>>> Stashed changes
    }
  };

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
<<<<<<< Updated upstream
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
=======
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Notifications</h1>
          <p className="mt-1 text-sm text-slate-500">Updates on your submissions, decision notices, and assigned reviews.</p>
        </div>
        <span className="text-xs font-semibold px-2.5 py-1 bg-[#1B3C53]/10 text-[#1B3C53] rounded-full">
          {notifications.length} Total
        </span>
      </div>

      {loading ? (
        <div className="p-8 text-center text-xs text-slate-400">Loading notifications...</div>
      ) : notifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
          <Bell className="h-10 w-10 text-slate-300" />
          <p className="mt-4 text-sm font-medium text-slate-600">You're all caught up.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((n) => (
            <div key={n.id} className="p-4 bg-white rounded-2xl border shadow-sm flex items-start space-x-3.5">
              <div className="p-2.5 bg-[#1B3C53] text-white rounded-xl shrink-0 mt-0.5">
                <Bell className="h-4 w-4" />
              </div>
              <div className="flex-1 space-y-1">
                <div className="flex justify-between items-center">
                  <h4 className="text-sm font-bold text-slate-900">{n.title}</h4>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">{n.message}</p>
              </div>
            </div>
>>>>>>> Stashed changes
          ))}
        </div>
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
