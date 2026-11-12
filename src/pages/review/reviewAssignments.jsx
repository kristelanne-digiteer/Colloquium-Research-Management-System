import { useCallback, useEffect, useState } from 'react';
import { ClipboardCheck, Star, X } from 'lucide-react';
import { supabase, isBackendConfigured } from '../../lib/supabaseClient';
import { useAuth } from '../../context/authContext';
import { DECISIONS, decisionLabel, fmtDate } from '../../lib/db';

const input =
  'w-full rounded-lg border border-secondary-300 bg-white px-3 py-2 text-sm text-secondary-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/40 dark:border-secondary-700 dark:bg-secondary-800 dark:text-white';

// Papers explicitly assigned to the logged-in user by the EC Chair, plus the review scorecard.
export default function ReviewAssignments() {
  const { user } = useAuth();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [active, setActive] = useState(null); // row being reviewed
  const [rating, setRating] = useState(0);
  const [decision, setDecision] = useState('APPROVED');
  const [comments, setComments] = useState('');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

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

  const openReview = (row) => {
    setActive(row);
    setRating(row.review?.rating ?? 0);
    setDecision(row.review?.decision ?? 'APPROVED');
    setComments(row.review?.comments_summary ?? '');
    setFormError('');
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!rating) return setFormError('Give the paper a rating from 1 to 5.');
    if (!comments.trim()) return setFormError('Write your technical feedback for the EC Chair.');
    setSaving(true);
    setFormError('');
    const { error: re } = await supabase.from('reviews').insert({
      submission_id: active.submission_id,
      reviewer_id: user.id,
      stage: active.stage,
      decision,
      rating,
      comments_summary: comments.trim(),
      review_round: active.sub?.review_round ?? 1,
    });
    if (re) {
      setFormError(`Could not submit review: ${re.message}`);
      return setSaving(false);
    }
    const { error: ae } = await supabase.from('reviewer_assignments').update({ assignment_status: 'COMPLETED' }).eq('id', active.id);
    // Tell the EC Chair(s). Best-effort: the review is already saved.
    await supabase.rpc('notify_admins', {
      p_title: 'Review submitted',
      p_message: `${active.sub?.tracking_number ?? ''}: ${decisionLabel(decision)} (${rating}/5)`,
      p_data: { submissionId: active.submission_id },
    });
    setSaving(false);
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
                    <button type="button" onClick={() => openReview(r)} className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setActive(null)} />
          <form onSubmit={submit} className="relative max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl dark:bg-secondary-900">
            <button type="button" aria-label="Close" onClick={() => setActive(null)} className="absolute right-3 top-3 rounded-lg p-1.5 text-secondary-400 hover:bg-secondary-100"><X className="h-4 w-4" /></button>
            <p className="text-xs font-bold text-secondary-500">{active.sub?.tracking_number}</p>
            <h2 className="mt-1 pr-8 text-lg font-bold text-secondary-900 dark:text-white">{active.sub?.title}</h2>
            <p className="mt-3 max-h-40 overflow-y-auto whitespace-pre-wrap text-sm text-secondary-600 dark:text-secondary-300">{active.sub?.abstract}</p>

            <fieldset disabled={Boolean(active.review) || saving} className="mt-5 space-y-4">
              <div>
                <span className="mb-1.5 block text-xs font-semibold text-secondary-500">Rating</span>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button key={n} type="button" aria-label={`${n} star${n > 1 ? 's' : ''}`} onClick={() => setRating(n)}>
                      <Star className={`h-7 w-7 ${n <= rating ? 'fill-amber-400 text-amber-400' : 'text-secondary-300'}`} />
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label htmlFor="rv-decision" className="mb-1.5 block text-xs font-semibold text-secondary-500">Recommendation</label>
                <select id="rv-decision" className={input} value={decision} onChange={(e) => setDecision(e.target.value)}>
                  {DECISIONS.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
                </select>
              </div>
              <div>
                <label htmlFor="rv-comments" className="mb-1.5 block text-xs font-semibold text-secondary-500">Technical feedback (sent to the EC Chair)</label>
                <textarea id="rv-comments" rows={6} className={input} value={comments} onChange={(e) => setComments(e.target.value)} placeholder="Originality, methodology, clarity, relevance..." />
              </div>
            </fieldset>

            {formError && <p role="alert" className="mt-3 text-sm font-semibold text-red-600">{formError}</p>}
            {!active.review && (
              <button type="submit" disabled={saving} className="mt-5 w-full rounded-lg bg-primary-600 py-2.5 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-60">
                {saving ? 'Submitting...' : 'Submit review'}
              </button>
            )}
          </form>
        </div>
      )}
    </div>
  );
}
