import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Moon, Send, Sun } from 'lucide-react';
import { mockPapers } from '../../lib/mockData';

const INITIAL_COMMENTS = [
  {
    id: 1,
    author: 'Dr. Maya Chen',
    time: '10:24 AM',
    text: 'The methodology section needs a clearer description of the dataset.',
  },
  {
    id: 2,
    author: 'Prof. Reyes',
    time: '11:02 AM',
    text: 'Good abstract. Please check the citation format on page 3.',
  },
];

export default function ReviewScreen() {
  const { id } = useParams();
  const navigate = useNavigate();

  const paper = mockPapers.find((p) => String(p.id) === id);

  const [comments, setComments] = useState(INITIAL_COMMENTS);
  const [draft, setDraft] = useState('');
  const [isDark, setIsDark] = useState(() =>
    document.documentElement.classList.contains('dark')
  );

  function toggleDark() {
    const next = !isDark;
    document.documentElement.classList.toggle('dark', next);
    setIsDark(next);
  }

  function handleAddComment(e) {
    e.preventDefault();
    const text = draft.trim();
    if (!text) return;

    setComments((prev) => [
      ...prev,
      {
        id: Date.now(),
        author: 'You',
        time: new Date().toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        }),
        text,
      },
    ]);
    setDraft('');
  }

  if (!paper) {
    return (
      <div className="mx-auto w-full max-w-5xl px-4 py-12 sm:px-6">
        <p className="text-sm text-secondary-600 dark:text-secondary-300">
          Paper not found.
        </p>
        <button
          type="button"
          onClick={() => navigate('/review-assignments')}
          className="mt-4 text-sm font-semibold text-primary-600 hover:underline"
        >
          Back to Review Assignments
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <button
            type="button"
            onClick={() => navigate('/review-assignments')}
            className="flex items-center gap-1.5 text-sm font-medium text-secondary-500 hover:text-secondary-700 dark:text-secondary-400 dark:hover:text-secondary-200"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to assignments
          </button>
          <h1 className="mt-3 text-xl font-bold text-secondary-900 dark:text-white sm:text-2xl">
            {paper.title}
          </h1>
          <p className="mt-1 text-sm text-secondary-500 dark:text-secondary-400">
            {paper.authors} · {paper.field}
          </p>
        </div>

        <button
          type="button"
          onClick={toggleDark}
          aria-label="Toggle dark mode"
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-secondary-200 text-secondary-600 transition-colors hover:bg-secondary-100 dark:border-secondary-700 dark:text-secondary-300 dark:hover:bg-secondary-800"
        >
          {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>
      </div>

      {/* Body: PDF + comments */}
      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_360px]">
        {/* PDF viewer */}
        <div className="overflow-hidden rounded-2xl bg-white shadow-sm dark:bg-secondary-900">
          <iframe
            title={paper.title}
            src={paper.pdfUrl}
            className="h-[70vh] w-full"
          />
        </div>

        {/* Comments sidebar */}
        <aside className="flex h-[70vh] flex-col rounded-2xl bg-white shadow-sm dark:bg-secondary-900">
          <div className="border-b border-secondary-200 px-5 py-4 dark:border-secondary-700">
            <h2 className="text-sm font-semibold text-secondary-900 dark:text-white">
              Comments ({comments.length})
            </h2>
          </div>

          <ul className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
            {comments.map((c) => (
              <li key={c.id}>
                <div className="flex items-baseline justify-between">
                  <span className="text-sm font-semibold text-secondary-900 dark:text-white">
                    {c.author}
                  </span>
                  <span className="text-xs text-secondary-400">{c.time}</span>
                </div>
                <p className="mt-1 text-sm text-secondary-600 dark:text-secondary-300">
                  {c.text}
                </p>
              </li>
            ))}
          </ul>

          <form
            onSubmit={handleAddComment}
            className="border-t border-secondary-200 p-4 dark:border-secondary-700"
          >
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              rows={3}
              placeholder="Write a comment..."
              className="w-full resize-none rounded-lg border border-secondary-200 bg-white px-3 py-2 text-sm text-secondary-900 placeholder:text-secondary-400 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:border-secondary-700 dark:bg-secondary-800 dark:text-white"
            />
            <button
              type="submit"
              disabled={!draft.trim()}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg bg-primary-600 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Send className="h-4 w-4" />
              Post comment
            </button>
          </form>
        </aside>
      </div>
    </div>
  );
}