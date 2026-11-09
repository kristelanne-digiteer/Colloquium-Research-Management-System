import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ClipboardCheck } from 'lucide-react';
import PendingList from './pendinglist';
import { mockPapers } from '../../lib/mockData';

export default function ReviewAssignments() {
  const navigate = useNavigate();
  const [papers, setPapers] = useState(mockPapers);

  function handleDecision(id, status) {
    setPapers((prev) => prev.map((p) => (p.id === id ? { ...p, status } : p)));
  }

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
      <h1 className="text-2xl font-bold text-secondary-900 dark:text-white sm:text-3xl">
        Review Assignments
      </h1>
      <p className="mt-1 text-sm text-secondary-500 dark:text-secondary-400">
        Papers assigned to you for peer review.
      </p>

      {papers.length === 0 ? (
        <div className="mt-8 flex flex-col items-center justify-center rounded-2xl border border-dashed border-secondary-300 bg-white px-6 py-16 text-center dark:border-secondary-700 dark:bg-secondary-900">
          <ClipboardCheck className="h-10 w-10 text-secondary-300" />
          <p className="mt-4 text-sm font-medium text-secondary-600 dark:text-secondary-300">
            No review assignments yet.
          </p>
          <p className="mt-1 text-sm text-secondary-400">
            Assignments from conference chairs will appear here.
          </p>
        </div>
      ) : (
        <PendingList
          papers={papers}
          onDecision={handleDecision}
          onOpen={(id) => navigate(`/review-assignments/${id}`)}
        />
      )}
    </div>
  );
}