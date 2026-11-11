import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { useAuth } from './authContext';
import { initialSubmissions, initialReviewers, initialLetters } from '../data/chairMockData';

// Replaces the global `state` object + all the mutate/render functions from the vanilla app.js.
// Every page under /chair/* reads from here, so assigning a reviewer on the Submissions page
// automatically updates the Reviewers and Reports pages (no manual renderX() calls needed).

const ChairContext = createContext(null);

const formatDate = () =>
  new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

export function ChairProvider({ children }) {
  const { profile } = useAuth();
  const [submissions, setSubmissions] = useState(initialSubmissions);
  const [reviewers, setReviewers] = useState(initialReviewers);
  const [letters, setLetters] = useState(initialLetters);
  const [toast, setToast] = useState(null);
  const toastTimer = useRef(null);

  const chairName = profile?.full_name || 'Dr. Aris Thorne';

  const notify = useCallback((message) => {
    setToast(message);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 3500);
  }, []);

  const assignReviewer = (paperId, reviewerId) => {
    const reviewer = reviewers.find((r) => r.id === reviewerId);
    const paper = submissions.find((p) => p.id === paperId);
    if (!reviewer || !paper) return false;
    if (reviewer.assignedPapers.includes(paperId)) {
      notify(`${reviewer.name} is already assigned to this paper.`);
      return false;
    }

    setReviewers((prev) =>
      prev.map((r) =>
        r.id === reviewerId
          ? { ...r, assignedPapers: [...r.assignedPapers, paperId], workloadCount: r.workloadCount + 1 }
          : r
      )
    );

    // Prototype logic carried over from the vanilla version:
    // assigning a reviewer bumps reviewsDone. Replace once real review submissions exist.
    setSubmissions((prev) =>
      prev.map((p) => {
        if (p.id !== paperId || p.reviewsDone >= p.reviewsTotal) return p;
        const reviewsDone = p.reviewsDone + 1;
        const complete = reviewsDone === p.reviewsTotal && p.status === 'For Review';
        return {
          ...p,
          reviewsDone,
          ...(complete && { status: 'Approved', consensus: 'Approved by Committee Consensus' }),
        };
      })
    );

    notify(`Assigned ${reviewer.name} to ${paperId}. Workload and progress updated.`);
    return true;
  };

  const setDecision = (paperId, status, consensus, message) => {
    setSubmissions((prev) => prev.map((p) => (p.id === paperId ? { ...p, status, consensus } : p)));
    notify(message);
  };

  const approveSubmission = (paperId) =>
    setDecision(paperId, 'Approved', 'Approved by EC Chair Action', `Submission ${paperId} has been approved.`);

  const rejectSubmission = (paperId) =>
    setDecision(paperId, 'Rejected', 'Rejected by EC Chair Action', `Submission ${paperId} marked as Rejected.`);

  const addReviewer = ({ name, specialization }) => {
    const initials = name
      .split(' ')
      .filter(Boolean)
      .map((n) => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
    setReviewers((prev) => [
      ...prev,
      { id: `r${prev.length + 1}`, name, specialization, workloadCount: 0, assignedPapers: [], initials },
    ]);
    notify(`Registered ${name} to the reviewer roster.`);
  };

  // Logs the letter in the archive and returns the issuance date for the document preview.
  const generateLetter = (paperId, docType) => {
    const paper = submissions.find((p) => p.id === paperId);
    if (!paper) return null;
    const date = formatDate();
    setLetters((prev) => [
      ...prev,
      {
        id: `DOC-2026-${String(prev.length + 1).padStart(3, '0')}`,
        type: `${docType} Letter`,
        trackingId: paper.id,
        author: paper.author,
        date,
      },
    ]);
    return date;
  };

  const value = useMemo(
    () => ({
      submissions,
      reviewers,
      letters,
      chairName,
      notify,
      assignReviewer,
      approveSubmission,
      rejectSubmission,
      addReviewer,
      generateLetter,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [submissions, reviewers, letters, chairName]
  );

  return (
    <ChairContext.Provider value={value}>
      {children}
      {toast && (
        <div
          role="status"
          className="fixed bottom-6 right-6 z-[60] max-w-sm rounded-xl bg-primary-600 px-4 py-3 text-sm font-medium text-white shadow-lg"
        >
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
