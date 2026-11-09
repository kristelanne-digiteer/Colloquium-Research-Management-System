import { UserPlus } from 'lucide-react';
import Modal from '../common/modal';
import ChairButton from './chairButton';
import { useChair } from '../../context/chairContext';

export default function AssignReviewerModal({ paperId, onClose }) {
  const { reviewers, assignReviewer } = useChair();

  const handleAssign = (reviewerId) => {
    if (assignReviewer(paperId, reviewerId)) onClose();
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
        {reviewers.map((r) => {
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
                  <p className="text-xs text-secondary-500">
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
