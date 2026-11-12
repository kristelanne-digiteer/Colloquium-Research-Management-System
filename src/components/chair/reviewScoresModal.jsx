import { ClipboardList } from 'lucide-react';
import Modal from '../common/modal';
import ChairButton from './chairButton';
import { decisionLabel } from '../../lib/db';

const tone = {
  APPROVED: 'bg-green-100 text-green-800',
  REJECTED: 'bg-red-100 text-red-700',
  ACCEPT_WITH_COMMENTS: 'bg-amber-100 text-amber-800',
};

// Live assignment status + each reviewer's decision, rating and feedback for one paper.
export default function ReviewScoresModal({ paper, onClose }) {
  return (
    <Modal
      open
      onClose={onClose}
      size="lg"
      icon={ClipboardList}
      title="Reviewer Assignments & Scores"
      subtitle={`${paper.id} - ${paper.title}`}
      footer={<ChairButton variant="secondary" onClick={onClose}>Close</ChairButton>}
    >
      {paper.assignments.length === 0 ? (
        <p className="py-6 text-center text-sm text-secondary-500">No reviewer has been assigned to this paper yet.</p>
      ) : (
        <ul className="space-y-3">
          {paper.assignments.map((a) => {
            const review = paper.reviews.find((r) => r.reviewerName === a.reviewerName);
            return (
              <li key={a.id} className="rounded-xl border border-secondary-200 p-4 dark:border-secondary-800">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-semibold text-secondary-900 dark:text-white">{a.reviewerName}</p>
                    <p className="text-xs text-secondary-500">Due {a.dueDate || 'not set'}</p>
                  </div>
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${a.status === 'COMPLETED' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}`}>
                    {String(a.status).replace(/_/g, ' ')}
                  </span>
                </div>
                {review ? (
                  <div className="mt-3 border-t border-secondary-100 pt-3 text-sm dark:border-secondary-800">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${tone[review.decision] ?? 'bg-slate-100 text-slate-700'}`}>
                        {decisionLabel(review.decision)}
                      </span>
                      {review.rating != null && <span className="font-semibold">Rating: {review.rating}/5</span>}
                    </div>
                    {review.comments && <p className="mt-2 whitespace-pre-wrap text-secondary-600 dark:text-secondary-300">{review.comments}</p>}
                  </div>
                ) : (
                  <p className="mt-3 text-xs text-secondary-400">Waiting for this reviewer&apos;s scorecard.</p>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </Modal>
  );
}
