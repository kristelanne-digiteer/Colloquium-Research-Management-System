// Small helpers shared by the Author, EC Chair and Reviewer pages.

// DB status -> label used on the EC Chair side (StatusBadge)
export function chairStatus(dbStatus, revisionDeadline = null) {
  const s = String(dbStatus || '').toUpperCase();
  if (s === 'ACCEPTED' || s === 'APPROVED') return 'Approved';
  if (s === 'DECLINED' || s === 'REJECTED') return 'Rejected';
  if (revisionDeadline || s.includes('REVISION') || s.includes('RESUB')) return 'Resubmission';
  return 'For Review';
}

// DB status -> label used on the Author side
export function authorStatus(dbStatus, revisionDeadline = null) {
  const c = chairStatus(dbStatus, revisionDeadline);
  return c === 'Rejected' ? 'Declined' : c;
}

export const initialsOf = (name = '') =>
  name.split(' ').filter(Boolean).map((n) => n[0]).join('').substring(0, 2).toUpperCase() || '?';

export const fmtDate = (iso) =>
  iso ? new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '';

export const DECISIONS = [
  { value: 'APPROVED', label: 'Approve' },
  { value: 'ACCEPT_WITH_COMMENTS', label: 'Accept with comments' },
  { value: 'REJECTED', label: 'Reject' },
];
export const decisionLabel = (v) => DECISIONS.find((d) => d.value === v)?.label ?? v;

// ---- manuscript files (storage bucket "manuscripts", path <authorId>/<submissionId>/<file>) ----
export const MANUSCRIPT_BUCKET = 'manuscripts';
export const folderOf = (authorId, submissionId) => `${authorId}/${submissionId}`;
export const fileLabel = (name = '') => name.replace(/^\d+-/, '');

// Build the sheet shown for a submitted review. Uses the saved sheet when there is one,
// otherwise rebuilds a plain one from the saved text (older reviews).
export function reviewSheet({ review, trackingNumber, title }) {
  const date = review.createdAt ? new Date(review.createdAt).toLocaleDateString('en-US', { dateStyle: 'long' }) : '';
  const letter =
    review.letter ?? {
      template: 'REVIEW',
      badge: 'PEER REVIEW',
      heading: `Review feedback: ${trackingNumber ?? ''}`,
      date,
      greeting: 'To the EC Chair,',
      intro: 'Evaluation of the assigned paper.',
      details: [
        ['Tracking No.', trackingNumber ?? ''],
        ['Paper title', title ?? ''],
        ['Recommendation', decisionLabel(review.decision)],
        ['Review date', date],
      ],
      body: review.comments ?? '',
      comments: null,
      closing: 'Respectfully,',
      tracking: trackingNumber ?? '',
    };
  const signatories = review.signatories ?? [{ id: 'me', full_name: review.reviewerName ?? 'Peer Reviewer', position: 'Peer Reviewer', signature_url: null }];
  return { letter, signatories };
}
