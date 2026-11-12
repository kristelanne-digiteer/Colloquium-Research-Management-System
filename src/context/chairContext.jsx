import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from './authContext';
import { supabase, isBackendConfigured } from '../lib/supabaseClient';
import { chairStatus, fmtDate, initialsOf } from '../lib/db';

// Live data for every /chair/* page, straight from Supabase:
// submissions (all authors), reviewer roster (profiles), assignments, reviews, letters.
// A realtime listener re-fetches whenever any of those tables change.

const ChairContext = createContext(null);

const DEFAULT_SIGNATORIES = [
  { id: 'default-1', full_name: 'Dr. Maria Santos', position: 'Editor-in-Chief', signature_url: null, is_active: true },
];

const formatDate = () =>
  new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

export function ChairProvider({ children }) {
  const { profile, user } = useAuth();
  const [submissions, setSubmissions] = useState([]);
  const [reviewers, setReviewers] = useState([]);
  const [letters, setLetters] = useState([]);
  const [signatories, setSignatories] = useState(DEFAULT_SIGNATORIES);
  const [loading, setLoading] = useState(isBackendConfigured);
  const [loadError, setLoadError] = useState('');
  const [toast, setToast] = useState(null);
  const toastTimer = useRef(null);

  const chairName = profile?.full_name || 'EC Chair';

  const notify = useCallback((message) => {
    setToast(message);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 4000);
  }, []);

  const load = useCallback(async () => {
    if (!isBackendConfigured) {
      setLoading(false);
      return;
    }
    const [subsRes, asgRes, revRes, profRes, trackRes, letRes, sigRes] = await Promise.all([
      supabase.from('submissions').select('*').order('created_at', { ascending: false }),
      supabase.from('reviewer_assignments').select('*'),
      supabase.from('reviews').select('*'),
      supabase.from('profiles').select('id, full_name, work_field, roles'),
      supabase.from('reviewer_tracks').select('user_id, track_code'),
      supabase.from('letters').select('id, reference_code, letter_type, generated_at, submission_id').order('generated_at'),
      supabase.from('letter_signatories').select('*').eq('is_active', true).order('created_at'),
    ]);

    const firstError = [subsRes, asgRes, revRes, profRes].find((r) => r.error)?.error;
    setLoadError(firstError ? firstError.message : '');
    if (firstError) {
      setLoading(false);
      return;
    }

    const profiles = profRes.data ?? [];
    const nameOf = Object.fromEntries(profiles.map((p) => [p.id, p.full_name || 'Unnamed user']));
    const assignments = asgRes.data ?? [];
    const reviews = revRes.data ?? [];
    const tracksOf = {};
    (trackRes.data ?? []).forEach((t) => {
      (tracksOf[t.user_id] ||= []).push(t.track_code);
    });

    const subs = (subsRes.data ?? []).map((s) => {
      const asg = assignments.filter((a) => a.submission_id === s.id);
      const revs = reviews.filter((r) => r.submission_id === s.id && r.review_round === s.review_round);
      const total = asg.length;
      return {
        id: s.tracking_number || s.id.slice(0, 8),
        dbId: s.id,
        stage: s.current_stage,
        title: s.title,
        abstract: s.abstract,
        keywords: s.keywords?.length ? s.keywords : s.track_sector ? [s.track_sector] : [],
        author: nameOf[s.author_id] || 'Unknown author',
        authorId: s.author_id,
        status: chairStatus(s.status, s.revision_deadline),
        revisionDeadline: s.revision_deadline,
        reviewRound: s.review_round,
        dbStatus: s.status,
        submittedAt: fmtDate(s.created_at),
        reviewsDone: revs.length,
        reviewsTotal: total,
        consensus: total === 0 ? 'No reviewer assigned yet' : `${revs.length}/${total} reviews submitted`,
        assignments: asg.map((a) => ({
          id: a.id,
          reviewerId: a.reviewer_id,
          reviewerName: nameOf[a.reviewer_id] || 'Unnamed reviewer',
          status: a.assignment_status,
          dueDate: fmtDate(a.due_date),
        })),
        reviews: revs.map((r) => ({
          id: r.id,
          reviewerName: nameOf[r.reviewer_id] || 'Unnamed reviewer',
          decision: r.decision,
          rating: r.rating,
          comments: r.comments_summary,
          letter: r.feedback_letter?.letter ?? null,
          signatories: r.feedback_letter?.signatories ?? null,
          createdAt: r.created_at,
        })),
      };
    });
    const trackingById = Object.fromEntries(subs.map((s) => [s.dbId, s]));

    const roster = profiles.map((p) => {
      const mine = assignments.filter((a) => a.reviewer_id === p.id);
      const active = mine.filter((a) => a.assignment_status !== 'COMPLETED');
      return {
        id: p.id,
        name: p.full_name || 'Unnamed user',
        initials: initialsOf(p.full_name || ''),
        roles: (p.roles ?? []).map((x) => String(x).toUpperCase()),
        isReviewer: (p.roles ?? []).some((x) => String(x).toUpperCase() === 'REVIEWER'),
        specialization: tracksOf[p.id]?.join(', ') || p.work_field || 'No expertise listed',
        workloadCount: active.length,
        assignedPapers: mine.map((a) => trackingById[a.submission_id]?.id).filter(Boolean),
      };
    });

    setSubmissions(subs);
    setReviewers(roster);
    setLetters(
      (letRes.data ?? []).map((l) => ({
        id: l.reference_code,
        type: String(l.letter_type).replace(/_/g, ' '),
        trackingId: trackingById[l.submission_id]?.id ?? '',
        author: trackingById[l.submission_id]?.author ?? '',
        date: fmtDate(l.generated_at),
        status: 'Sent',
      }))
    );
    if (!sigRes.error && sigRes.data?.length) setSignatories(sigRes.data);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
    if (!isBackendConfigured) return;
    const channel = supabase.channel('chair-live');
    ['submissions', 'reviewer_assignments', 'reviews', 'letters', 'profiles'].forEach((table) =>
      channel.on('postgres_changes', { event: '*', schema: 'public', table }, () => load())
    );
    channel.subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [load]);

  const pushNotification = async (row) => {
    const { error } = await supabase.from('notifications').insert({ send_email: true, ...row });
    return error;
  };

  // Only the EC Chair can reach this (ChairRoute + RLS). Errors never throw: the caller gets false.
  const assignReviewer = async (paperId, reviewerId) => {
    const reviewer = reviewers.find((r) => r.id === reviewerId);
    const paper = submissions.find((p) => p.id === paperId);
    if (!reviewer || !paper) return false;
    if (!reviewer.isReviewer) {
      notify(`${reviewer.name} does not have the Reviewer role yet. Grant it on the Peer Reviewers page.`);
      return false;
    }
    if (reviewer.assignedPapers.includes(paperId)) {
      notify(`${reviewer.name} is already assigned to this paper.`);
      return false;
    }
    if (reviewer.id === paper.authorId) {
      notify('An author cannot review their own paper.');
      return false;
    }

    const due = new Date(Date.now() + 14 * 86400000).toISOString();
    const { error } = await supabase.from('reviewer_assignments').insert({
      submission_id: paper.dbId,
      reviewer_id: reviewerId,
      stage: paper.stage,
      due_date: due,
    });
    if (error) {
      notify(`Could not assign reviewer: ${error.message}`);
      return false;
    }

    const noteError = await pushNotification({
      user_id: reviewerId,
      type: 'REVIEW_ASSIGNED',
      title: 'New paper assigned for review',
      message: `${paper.id}: ${paper.title}`,
      data: { submissionId: paper.dbId, trackingNumber: paper.id },
    });
    notify(
      noteError
        ? `Assigned ${reviewer.name}, but the notification failed: ${noteError.message}`
        : `Assigned ${reviewer.name} to ${paper.id}. They have been notified.`
    );
    await load();
    return true;
  };

  // Remove a reviewer from a paper (their submitted review, if any, is kept).
  const unassignReviewer = async (assignmentId) => {
    const { data, error } = await supabase.from('reviewer_assignments').delete().eq('id', assignmentId).select('id');
    if (error) return notify(`Could not remove assignment: ${error.message}`);
    if (!data?.length) return notify('Could not remove the assignment (blocked by the database).');
    notify('Reviewer removed from this paper.');
    await load();
  };

  // Delete a letter: drafts live only in this session, sent ones are rows in public.letters.
  const deleteLetter = async (letter) => {
    if (String(letter.id).startsWith('DRAFT-')) {
      setLetters((prev) => prev.filter((l) => l.id !== letter.id));
      return;
    }
    const { error } = await supabase.from('letters').delete().eq('reference_code', letter.id);
    if (error) return notify(`Could not delete the letter record: ${error.message}`);
    notify('Letter record deleted.');
    await load();
  };

  // Open the paper for revision: the author can then replace the file and resubmit (same submission).
  const requestRevision = async (paperId, days = 14) => {
    const paper = submissions.find((p) => p.id === paperId);
    if (!paper) return;
    const due = new Date(Date.now() + days * 86400000).toISOString();
    const { error } = await supabase.from('submissions').update({ revision_deadline: due, updated_at: new Date().toISOString() }).eq('id', paper.dbId);
    if (error) return notify(`Could not request a revision: ${error.message}`);
    await pushNotification({
      user_id: paper.authorId,
      type: 'REVISION_REQUESTED',
      title: 'Revisions requested for your paper',
      message: `${paper.id}: replace your file and resubmit by ${fmtDate(due)}.`,
      data: { submissionId: paper.dbId, trackingNumber: paper.id },
    });
    notify(`Revision requested for ${paper.id}. The author can now replace the file and resubmit.`);
    await load();
  };

  const setDecision = async (paperId, dbStatus, message) => {
    const paper = submissions.find((p) => p.id === paperId);
    if (!paper) return;
    const { error } = await supabase.from('submissions').update({ status: dbStatus, updated_at: new Date().toISOString() }).eq('id', paper.dbId);
    if (error) return notify(`Could not update status: ${error.message}`);
    await pushNotification({
      user_id: paper.authorId,
      type: 'STATUS_CHANGED',
      title: `Your paper was ${dbStatus === 'REJECTED' ? 'declined' : 'accepted'}`,
      message: `${paper.id}: ${paper.title}`,
      data: { submissionId: paper.dbId, trackingNumber: paper.id },
    });
    notify(message);
    await load();
  };

  const approveSubmission = (paperId) => setDecision(paperId, 'ACCEPTED_FOR_PRESENTATION', `Submission ${paperId} has been approved.`);
  const rejectSubmission = (paperId) => setDecision(paperId, 'REJECTED', `Submission ${paperId} marked as declined.`);

  // EC Chair grants / removes the REVIEWER role (profiles.roles). The database only allows
  // reviewer_assignments for users that hold this role.
  const setReviewerRole = async (userId, enabled) => {
    const person = reviewers.find((r) => r.id === userId);
    if (!person) return false;
    const base = person.roles.length ? person.roles : ['AUTHOR'];
    const roles = enabled
      ? [...new Set([...base, 'REVIEWER'])]
      : base.filter((r) => r !== 'REVIEWER').length ? base.filter((r) => r !== 'REVIEWER') : ['AUTHOR'];

    // Goes through a SQL function (admin only) because normal users have no UPDATE privilege on profiles.
    const { error } = await supabase.rpc('admin_set_roles', { p_user: userId, p_roles: roles });
    if (error) {
      notify(`Could not update role: ${error.message}`);
      return false;
    }
    notify(enabled ? `${person.name} is now a Peer Reviewer.` : `${person.name} is no longer a Peer Reviewer.`);
    load(); // refresh in the background, do not make the button wait for it
    return true;
  };

  // Signatories live in public.letter_signatories
  const saveSignatory = async (sig) => {
    const row = { full_name: sig.full_name, position: sig.position, signature_url: sig.signature_url ?? null, is_active: true };
    let saved = { ...sig, ...row };
    if (isBackendConfigured) {
      const isReal = sig.id && !String(sig.id).startsWith('default-') && !String(sig.id).startsWith('new-');
      const res = isReal
        ? await supabase.from('letter_signatories').update(row).eq('id', sig.id).select().single()
        : await supabase.from('letter_signatories').insert(row).select().single();
      if (!res.error && res.data) saved = res.data;
    }
    setSignatories((prev) => (prev.some((p) => p.id === sig.id) ? prev.map((p) => (p.id === sig.id ? saved : p)) : [...prev, saved]));
    return saved;
  };

  // Drafts only (sent letters come back from public.letters through load()).
  const logLetter = ({ paperId, label, status, recipientEmail }) => {
    if (status === 'Sent') return load();
    const paper = submissions.find((p) => p.id === paperId);
    setLetters((prev) => [
      ...prev,
      { id: `DRAFT-${prev.length + 1}`, type: label, trackingId: paperId, author: paper?.author ?? '', date: formatDate(), status, recipientEmail },
    ]);
  };

  const value = useMemo(
    () => ({
      submissions, reviewers, letters, signatories, chairName, loading, loadError, userId: user?.id,
      notify, assignReviewer, requestRevision, unassignReviewer, deleteLetter, setReviewerRole, approveSubmission, rejectSubmission, saveSignatory, logLetter, reload: load,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [submissions, reviewers, letters, signatories, chairName, loading, loadError]
  );

  return (
    <ChairContext.Provider value={value}>
      {children}
      {toast && (
        <div role="status" className="fixed bottom-6 right-6 z-[80] max-w-sm rounded-xl bg-primary-600 px-4 py-3 text-sm font-medium text-white shadow-lg">
          {toast}
        </div>
      )}
    </ChairContext.Provider>
  );
}

export function useChair() {
  const ctx = useContext(ChairContext);
  if (!ctx) throw new Error('useChair must be used within a ChairProvider');
  return ctx;
}
