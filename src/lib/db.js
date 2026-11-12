// Small helpers shared by the Author, EC Chair and Reviewer pages.

// DB status -> label used on the EC Chair side (StatusBadge)
export function chairStatus(dbStatus) {
  const s = String(dbStatus || '').toUpperCase();
  if (s === 'ACCEPTED' || s === 'APPROVED') return 'Approved';
  if (s === 'DECLINED' || s === 'REJECTED') return 'Rejected';
  if (s.includes('REVISION') || s.includes('RESUB')) return 'Resubmission';
  return 'For Review';
}

// DB status -> label used on the Author side
export function authorStatus(dbStatus) {
  const c = chairStatus(dbStatus);
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
