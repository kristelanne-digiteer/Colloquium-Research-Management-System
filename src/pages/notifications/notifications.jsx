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
    }
  };

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
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
          ))}
        </div>
      )}
    </div>
  );
}