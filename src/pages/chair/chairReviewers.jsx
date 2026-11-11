import { useState } from 'react';
import { FileText, UserPlus, UserCog, FileSearch } from 'lucide-react';
import { useChair } from '../../context/chairContext';
import Modal from '../../components/common/modal';
import FormInput from '../../components/common/formInput';
import ChairButton from '../../components/chair/chairButton';

export default function ChairReviewers() {
  const { reviewers, submissions, addReviewer } = useChair();
  const [addOpen, setAddOpen] = useState(false);
  const [name, setName] = useState('');
  const [spec, setSpec] = useState('');
  const [auditId, setAuditId] = useState(null);

  const auditReviewer = reviewers.find((r) => r.id === auditId);

  const closeAdd = () => {
    setAddOpen(false);
    setName('');
    setSpec('');
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (!name.trim() || !spec.trim()) return;
    addReviewer({ name: name.trim(), specialization: spec.trim() });
    closeAdd();
  };

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
      <h1 className="text-2xl font-bold text-secondary-900 dark:text-white sm:text-3xl">Peer Reviewers Roster</h1>
      <p className="mt-1 text-sm text-secondary-500 dark:text-secondary-400">
        Manage committee experts and track active manuscript workloads.
      </p>

      <div className="mt-8 rounded-2xl border border-secondary-200 bg-white p-6 shadow-card dark:border-secondary-800 dark:bg-secondary-900">
        <h3 className="font-bold text-secondary-900 dark:text-white">Reviewer Directory & Expertise Allocation</h3>
        <p className="mt-1 text-sm text-secondary-500">
          Monitor panelist loads, evaluate expertise domains, and onboard certified institutional reviewers.
        </p>
        <ChairButton className="mt-4" icon={UserPlus} onClick={() => setAddOpen(true)}>
          Register New Reviewer
        </ChairButton>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {reviewers.map((r) => (
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
            </div>
            <div className="mt-4 flex items-center justify-between border-t border-secondary-100 pt-3 dark:border-secondary-800">
              <span className="flex items-center gap-1.5 text-xs text-secondary-500">
                <FileText className="h-4 w-4" />
                Currently reviewing {r.workloadCount} paper{r.workloadCount === 1 ? '' : 's'}
              </span>
              <ChairButton size="sm" variant="secondary" onClick={() => setAuditId(r.id)}>
                View Audit
              </ChairButton>
            </div>
          </div>
        ))}
      </div>

      {/* Register reviewer */}
      <Modal
        open={addOpen}
        onClose={closeAdd}
        icon={UserCog}
        title="Register New Peer Reviewer"
        subtitle="Add a qualified expert to the review roster"
        footer={
          <>
            <ChairButton variant="secondary" onClick={closeAdd}>Cancel</ChairButton>
            <ChairButton type="submit" form="add-reviewer-form">Save Reviewer</ChairButton>
          </>
        }
      >
        <form id="add-reviewer-form" onSubmit={handleSave} className="space-y-4">
          <FormInput label="Full Name & Title" name="new-rev-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Dr. Jane Doe" required />
          <FormInput label="Specialization / Department" name="new-rev-spec" value={spec} onChange={(e) => setSpec(e.target.value)} placeholder="Biomedical Ethics & Genetics" required />
        </form>
      </Modal>

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
                    <p className="text-xs text-secondary-500">{paper?.title ?? 'Research Protocol'}</p>
                  </div>
                  <span className="whitespace-nowrap rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
                    Active Review
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
