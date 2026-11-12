import { useCallback, useEffect, useState } from 'react';
import { ClipboardCheck } from 'lucide-react';
import { supabase, isBackendConfigured } from '../../lib/supabaseClient';
import { useAuth } from '../../context/authContext';
import { decisionLabel, fmtDate } from '../../lib/db';
import ReviewFeedbackEditor from '../../components/common/reviewFeedbackEditor';

// Papers explicitly assigned to the logged-in user by the EC Chair, plus the review scorecard.
export default function ReviewAssignments() {
  const { user, profile } = useAuth();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [active, setActive] = useState(null); // row being reviewed
  const load = useCallback(async () => {
    if (!isBackendConfigured || !user) return setLoading(false);
    const { data: asg, error: e1 } = await supabase.from('reviewer_assignments').select('*').eq('reviewer_id', user.id).order('assigned_at', { ascending: false });
    if (e1) { setError(e1.message); return setLoading(false); }
    const ids = [...new Set(asg.map((a) => a.submission_id))];
    const [subs, revs] = await Promise.all([
      ids.length ? supabase.from('submissions').select('*').in('id', ids) : { data: [] },
      supabase.from('reviews').select('*').eq('reviewer_id', user.id),
    ]);
    const subById = Object.fromEntries((subs.data ?? []).map((s) => [s.id, s]));
    setRows(
      asg.map((a) => {
        const sub = subById[a.submission_id];
        const mine = (revs.data ?? []).find((r) => r.submission_id === a.submission_id && r.review_round === (sub?.review_round ?? 1));
        return { ...a, sub, review: mine };
      })
    );
    setError('');
    setLoading(false);
  }, [user]);

  useEffect(() => {
    load();
    if (!isBackendConfigured || !user) return;
    const channel = supabase.channel(`reviewer-${user.id}`);
    channel.on('postgres_changes', { event: '*', schema: 'public', table: 'reviewer_assignments', filter: `reviewer_id=eq.${user.id}` }, () => load());
    channel.subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [load, user]);

  // Called by the editor. Returns an error message, or nothing on success.
  const submitReview = async ({ decision, text, sheet }) => {
    const row = {
      submission_id: active.submission_id,
      reviewer_id: user.id,
      stage: active.stage,
      decision,
      comments_summary: text,
      review_round: active.sub?.review_round ?? 1,
      feedback_letter: sheet,
    };
    let { error: re } = await supabase.from('reviews').insert(row);
    // Column missing (update3.sql not run yet): save the text only so the review is never lost.
    if (re && /feedback_letter/.test(re.message)) {
      delete row.feedback_letter;
      ({ error: re } = await supabase.from('reviews').insert(row));
    }
    if (re) return `Could not submit review: ${re.message}`;

    const { error: ae } = await supabase.from('reviewer_assignments').update({ assignment_status: 'COMPLETED' }).eq('id', active.id);
    // Tell the EC Chair(s). Best-effort: the review is already saved.
    await supabase.rpc('notify_admins', {
      p_title: 'Review submitted',
      p_message: `${active.sub?.tracking_number ?? ''}: ${decisionLabel(decision)}`,
      p_data: { submissionId: active.submission_id },
    });
    if (ae) setError(`Review saved, but the assignment status was not updated: ${ae.message}`);
    setActive(null);
    load();
  };

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
      <h1 className="text-2xl font-bold text-secondary-900 dark:text-white sm:text-3xl">Review Assignments</h1>
      <p className="mt-1 text-sm text-secondary-500 dark:text-secondary-400">Papers assigned to you for peer review.</p>

      {error && <p role="alert" className="mt-6 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

      {rows.length === 0 ? (
        <div className="mt-8 flex flex-col items-center justify-center rounded-2xl border border-dashed border-secondary-300 bg-white px-6 py-16 text-center dark:border-secondary-700 dark:bg-secondary-900">
          <ClipboardCheck className="h-10 w-10 text-secondary-300" />
          <p className="mt-4 text-sm font-medium text-secondary-600 dark:text-secondary-300">{loading ? 'Loading...' : 'No review assignments yet.'}</p>
          <p className="mt-1 text-sm text-secondary-400">Papers the EC Chair assigns to you will appear here.</p>
        </div>
      ) : (
        <ul className="mt-8 space-y-4">
          {rows.map((r) => {
            const done = r.assignment_status === 'COMPLETED';
            return (
              <li key={r.id} className="rounded-2xl bg-white p-5 shadow-sm dark:bg-secondary-900">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-secondary-500">{r.sub?.tracking_number}</p>
                    <h3 className="mt-1 font-semibold text-secondary-900 dark:text-white">{r.sub?.title ?? 'Paper'}</h3>
                    <p className="mt-1 line-clamp-2 text-sm text-secondary-500">{r.sub?.abstract}</p>
                    <p className="mt-2 text-xs text-secondary-400">Due {fmtDate(r.due_date) || 'not set'}</p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${done ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                      {done ? 'Completed' : String(r.assignment_status).replace(/_/g, ' ')}
                    </span>
                    <button type="button" onClick={() => setActive(r)} className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700">
                      {done ? 'View my review' : 'Review paper'}
                    </button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {active && (
        <ReviewFeedbackEditor
          key={active.id}
          assignment={active}
          reviewerName={profile?.full_name || user?.email || 'Reviewer'}
          onSubmit={submitReview}
          onClose={() => setActive(null)}
        />
      )}
    </div>
  );
}
