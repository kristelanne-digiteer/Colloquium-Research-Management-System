import { UserPlus } from 'lucide-react';
import { Link } from 'react-router-dom';
import Modal from '../common/modal';
import ChairButton from './chairButton';
import { useChair } from '../../context/chairContext';

// Lists only users that hold the REVIEWER role (granted on Chair > Peer Reviewers).
export default function AssignReviewerModal({ paperId, onClose }) {
  const { reviewers, assignReviewer, submissions } = useChair();
  const paper = submissions.find((s) => s.id === paperId);
  const eligible = reviewers.filter((r) => r.isReviewer && r.id !== paper?.authorId);

  const handleAssign = async (reviewerId) => {
    if (await assignReviewer(paperId, reviewerId)) onClose();
  };

  return (
    <Modal
      open={Boolean(paperId)}
      onClose={onClose}
      icon={UserPlus}
      title="Assign Peer Reviewer"
      subtitle={`Paper ID: ${paperId}`}
      footer={<ChairButton variant="secondary" onClick={onClose}>Done</ChairButton>}
    >
      <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-secondary-500">Reviewer Directory</p>
      <ul className="space-y-2">
        {eligible.length === 0 && (
          <li className="py-4 text-center text-sm text-secondary-500">
            No peer reviewers yet. Give someone the Reviewer role on the{' '}
            <Link to="/chair/reviewers" onClick={onClose} className="font-semibold text-primary-600 underline">Peer Reviewers</Link> page.
          </li>
        )}
        {eligible.map((r) => {
          const assigned = r.assignedPapers.includes(paperId);
          return (
            <li
              key={r.id}
              className="flex items-center justify-between gap-3 rounded-xl border border-secondary-200 px-3 py-2.5 dark:border-secondary-800"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-600 text-xs font-bold text-white">
                  {r.initials}
                </div>
                <div>
                  <p className="text-sm font-semibold text-secondary-900 dark:text-white">{r.name}</p>
                  <p className="text-xs text-secondary-500">{r.specialization}</p>
                  <p className="text-xs text-secondary-400">
                    Currently reviewing {r.workloadCount} paper{r.workloadCount === 1 ? '' : 's'}
                  </p>
                </div>
              </div>
              <ChairButton
                size="sm"
                variant={assigned ? 'accent' : 'secondary'}
                disabled={assigned}
                onClick={() => handleAssign(r.id)}
              >
                {assigned ? 'Assigned' : 'Assign'}
              </ChairButton>
            </li>
          );
        })}
      </ul>
    </Modal>
  );
}
