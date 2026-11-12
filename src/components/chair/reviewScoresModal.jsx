import { useState } from 'react';
import { ClipboardList, FileText } from 'lucide-react';
import Modal from '../common/modal';
import ChairButton from './chairButton';
import { decisionLabel } from '../../lib/db';
import { useChair } from '../../context/chairContext';
import ManuscriptViewer from '../common/manuscriptViewer';
import ReviewSheetModal from '../common/reviewSheetModal';

const tone = {
  APPROVED: 'bg-green-100 text-green-800',
  REJECTED: 'bg-red-100 text-red-700',
  ACCEPT_WITH_COMMENTS: 'bg-amber-100 text-amber-800',
};

// Live assignment status + each reviewer's decision, rating and feedback for one paper.
export default function ReviewScoresModal({ paper, onClose }) {
  const { unassignReviewer } = useChair();
  const [sheet, setSheet] = useState(null);
  const [showFile, setShowFile] = useState(false);
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
      <div className="mb-4 overflow-hidden rounded-xl border border-secondary-200 dark:border-secondary-800">
        <button type="button" onClick={() => setShowFile((v) => !v)} className="flex w-full items-center justify-between px-4 py-3 text-sm font-semibold text-secondary-800 hover:bg-secondary-50 dark:text-secondary-100">
          <span className="inline-flex items-center gap-2"><FileText className="h-4 w-4" /> Student&apos;s submitted file</span>
          <span className="text-xs text-primary-600">{showFile ? 'Hide' : 'View'}</span>
        </button>
        {showFile && <ManuscriptViewer authorId={paper.authorId} submissionId={paper.dbId} height="55vh" />}
      </div>

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
                  <div className="flex items-center gap-2">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${a.status === 'COMPLETED' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}`}>
                      {String(a.status).replace(/_/g, ' ')}
                    </span>
                    {a.status !== 'COMPLETED' && (
                      <button type="button" onClick={() => window.confirm(`Remove ${a.reviewerName} from this paper?`) && unassignReviewer(a.id)} className="text-xs font-semibold text-red-600 hover:underline">
                        Remove
                      </button>
                    )}
                  </div>
                </div>
                {review ? (
                  <div className="mt-3 border-t border-secondary-100 pt-3 text-sm dark:border-secondary-800">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${tone[review.decision] ?? 'bg-slate-100 text-slate-700'}`}>
                        {decisionLabel(review.decision)}
                      </span>

                    </div>
                    {review.comments && <p className="mt-2 line-clamp-3 whitespace-pre-wrap text-secondary-600 dark:text-secondary-300">{review.comments}</p>}
                    <button type="button" onClick={() => setSheet(review)} className="mt-2 text-xs font-semibold text-primary-600 hover:underline">View review sheet (PDF)</button>
                  </div>
                ) : (
                  <p className="mt-3 text-xs text-secondary-400">Waiting for this reviewer&apos;s scorecard.</p>
                )}
              </li>
            );
          })}
        </ul>
      )}
      {sheet && <ReviewSheetModal review={{ ...sheet, reviewerName: sheet.reviewerName }} trackingNumber={paper.id} title={paper.title} onClose={() => setSheet(null)} />}
    </Modal>
  );
}
