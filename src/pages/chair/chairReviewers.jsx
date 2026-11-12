import { useState } from 'react';
import { FileText, FileSearch } from 'lucide-react';
import { useChair } from '../../context/chairContext';
import Modal from '../../components/common/modal';
import ChairButton from '../../components/chair/chairButton';

export default function ChairReviewers() {
  const { reviewers, submissions, setReviewerRole } = useChair();
  const [busyId, setBusyId] = useState(null);
  const [filter, setFilter] = useState('reviewers'); // 'reviewers' | 'all'
  const shown = filter === 'reviewers' ? reviewers.filter((r) => r.isReviewer) : reviewers;

  const toggleRole = async (r) => {
    setBusyId(r.id);
    try {
      await setReviewerRole(r.id, !r.isReviewer);
    } finally {
      setBusyId(null);
    }
  };
  const [auditId, setAuditId] = useState(null);

  const auditReviewer = reviewers.find((r) => r.id === auditId);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
      <h1 className="text-2xl font-bold text-secondary-900 dark:text-white sm:text-3xl">Peer Reviewers Roster</h1>
      <p className="mt-1 text-sm text-secondary-500 dark:text-secondary-400">
        Manage committee experts and track active manuscript workloads.
      </p>

      <div className="mt-8 rounded-2xl border border-secondary-200 bg-white p-6 shadow-card dark:border-secondary-800 dark:bg-secondary-900">
        <h3 className="font-bold text-secondary-900 dark:text-white">Reviewer Directory & Expertise Allocation</h3>
        <p className="mt-1 text-sm text-secondary-500">
          Registered users who can be assigned papers. Expertise comes from each user's profile.
        </p>
      </div>

      <div className="mt-6 inline-flex rounded-xl bg-secondary-100 p-1 dark:bg-secondary-800">
        {[['reviewers', 'Peer Reviewers'], ['all', 'All Users']].map(([key, text]) => (
          <button
            key={key}
            type="button"
            onClick={() => setFilter(key)}
            className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors ${
              filter === key ? 'bg-white text-primary-600 shadow-sm dark:bg-secondary-900' : 'text-secondary-500 hover:text-secondary-700'
            }`}
          >
            {text}
          </button>
        ))}
      </div>

      {shown.length === 0 && (
        <p className="mt-6 rounded-2xl border border-dashed border-secondary-300 bg-white px-6 py-12 text-center text-sm text-secondary-500">
          {filter === 'reviewers' ? 'No peer reviewers yet. Open "All Users" and click "Make reviewer" on someone.' : 'No registered users yet.'}
        </p>
      )}
      <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {shown.map((r) => (
          <div
            key={r.id}
            className="rounded-2xl border border-secondary-200 bg-white p-5 shadow-card dark:border-secondary-800 dark:bg-secondary-900"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary-600 text-sm font-bold text-white">
                {r.initials}
              </div>
              <div>
                <p className="font-semibold text-secondary-900 dark:text-white">{r.name}</p>
                <p className="text-xs text-secondary-500">{r.specialization}</p>
              </div>
              {r.isReviewer && (
                <span className="ml-auto rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-semibold text-green-800">Reviewer</span>
              )}
            </div>
            <div className="mt-4 flex items-center justify-between border-t border-secondary-100 pt-3 dark:border-secondary-800">
              <span className="flex items-center gap-1.5 text-xs text-secondary-500">
                <FileText className="h-4 w-4" />
                Currently reviewing {r.workloadCount} paper{r.workloadCount === 1 ? '' : 's'}
              </span>
              <div className="flex gap-2">
                <ChairButton size="sm" variant="secondary" onClick={() => setAuditId(r.id)}>
                  View Audit
                </ChairButton>
                <ChairButton size="sm" variant={r.isReviewer ? 'secondary' : 'primary'} disabled={busyId === r.id} onClick={() => toggleRole(r)}>
                  {r.isReviewer ? 'Remove role' : 'Make reviewer'}
                </ChairButton>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Audit */}
      <Modal
        open={Boolean(auditReviewer)}
        onClose={() => setAuditId(null)}
        icon={FileSearch}
        title={`Audit: ${auditReviewer?.name}`}
        subtitle={`Specialization: ${auditReviewer?.specialization} • Total Assigned: ${auditReviewer?.workloadCount}`}
        footer={<ChairButton variant="secondary" onClick={() => setAuditId(null)}>Close Audit</ChairButton>}
      >
        {auditReviewer?.assignedPapers.length === 0 ? (
          <p className="py-5 text-center text-sm text-secondary-500">No papers currently assigned to this panelist.</p>
        ) : (
          <ul className="space-y-2">
            {auditReviewer?.assignedPapers.map((pid) => {
              const paper = submissions.find((s) => s.id === pid);
              return (
                <li key={pid} className="flex items-center justify-between gap-3 rounded-xl border border-secondary-200 px-3.5 py-2.5 dark:border-secondary-800">
                  <div>
                    <p className="text-sm font-bold text-secondary-900 dark:text-white">{pid}</p>
                    <p className="text-xs text-secondary-500">{paper?.title ?? 'Research paper'}</p>
                  </div>
                  <span className="whitespace-nowrap rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
                    {paper?.assignments.find((a) => a.reviewerId === auditReviewer.id)?.status?.replace(/_/g, ' ') ?? 'Assigned'}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </Modal>
    </div>
  );
}
