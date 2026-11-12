import { useMemo, useState } from 'react';
import {
  Search, LayoutGrid, Table2, UserCheck, UserPlus, ClipboardList, FileSignature, CheckCircle2, Ban,
} from 'lucide-react';
import { useChair } from '../../context/chairContext';
import StatusBadge from '../../components/chair/statusBadge';
import ActionMenu from '../../components/chair/actionMenu';
import AssignReviewerModal from '../../components/chair/assignReviewerModal';
import ReviewScoresModal from '../../components/chair/reviewScoresModal';
import LetterEditor from '../../components/chair/letterEditor';

function Keywords({ list }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {list.map((k) => (
        <span key={k} className="rounded-md bg-accent-100 px-2 py-0.5 text-xs font-medium text-accent-600 dark:bg-accent-600/20 dark:text-accent-300">
          {k}
        </span>
      ))}
    </div>
  );
}

export default function ChairSubmissions() {
  const { submissions, approveSubmission, rejectSubmission, requestRevision, loading, loadError } = useChair();
  const [view, setView] = useState('card');
  const [query, setQuery] = useState('');
  const [assignId, setAssignId] = useState(null);
  const [scoresId, setScoresId] = useState(null);
  const [doc, setDoc] = useState(null); // { paperId, type, date }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return submissions.filter(
      (s) => s.id.toLowerCase().includes(q) || s.title.toLowerCase().includes(q) || s.author.toLowerCase().includes(q)
    );
  }, [submissions, query]);

  const openLetter = (paperId, template) => setDoc({ paperId, template });

  const actionsFor = (p) => [
    { label: 'Assign Reviewer', icon: UserPlus, onClick: () => setAssignId(p.id) },
    { label: 'Reviewer scores', icon: ClipboardList, onClick: () => setScoresId(p.id) },
    { label: 'Write decision letter', icon: FileSignature, onClick: () => openLetter(p.id, p.status === 'Rejected' ? 'REJECTED' : p.status === 'Resubmission' ? 'REVISIONS' : 'ACCEPTED') },
    {
      label: 'Request revision', icon: ClipboardList,
      onClick: () => window.confirm(`Ask the author of ${p.id} to revise and resubmit (14 days)?`) && requestRevision(p.id),
    },
    { divider: true },
    {
      label: 'Approve Submission', icon: CheckCircle2, tone: 'success',
      onClick: () => window.confirm(`Officially APPROVE submission ${p.id}?`) && approveSubmission(p.id),
    },
    {
      label: 'Reject Submission', icon: Ban, tone: 'danger',
      onClick: () => window.confirm(`Mark ${p.id} as Rejected?`) && rejectSubmission(p.id),
    },
  ];

  const scoresPaper = submissions.find((s) => s.id === scoresId);
  const docPaper = doc && submissions.find((s) => s.id === doc.paperId);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900 dark:text-white sm:text-3xl">Incoming Submissions Inbox</h1>
          <p className="mt-1 text-sm text-secondary-500 dark:text-secondary-400">
            Review, assign, and render decisions on submitted research proposals.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-secondary-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search tracking #, title..."
              className="w-64 rounded-xl border border-secondary-300 bg-white py-2 pl-9 pr-3 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/40 dark:border-secondary-700 dark:bg-secondary-800 dark:text-slate-100"
            />
          </div>
          <div className="inline-flex rounded-xl bg-secondary-100 p-1 dark:bg-secondary-800">
            {[['card', LayoutGrid, 'Card View'], ['table', Table2, 'Table View']].map(([mode, Icon, text]) => (
              <button
                key={mode}
                type="button"
                onClick={() => setView(mode)}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors ${
                  view === mode
                    ? 'bg-white text-primary-600 shadow-sm dark:bg-secondary-900'
                    : 'text-secondary-500 hover:text-secondary-700 dark:hover:text-secondary-300'
                }`}
              >
                <Icon className="h-4 w-4" />
                {text}
              </button>
            ))}
          </div>
        </div>
      </div>

      {loadError && (
        <p role="alert" className="mt-6 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
          Could not load submissions: {loadError}. Make sure you ran supabase_workflow.sql and your account has the ADMIN role.
        </p>
      )}

      {filtered.length === 0 ? (
        <p className="mt-8 rounded-2xl border border-dashed border-secondary-300 bg-white px-6 py-12 text-center text-sm text-secondary-500 dark:border-secondary-700 dark:bg-secondary-900">
          {loading ? 'Loading submissions...' : submissions.length === 0 ? 'No papers have been submitted yet. New submissions from authors appear here instantly.' : 'No submissions match your search.'}
        </p>
      ) : view === 'card' ? (
        <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((p) => (
            <div
              key={p.id}
              className="flex flex-col justify-between gap-4 rounded-2xl border border-secondary-200 bg-white p-5 shadow-card dark:border-secondary-800 dark:bg-secondary-900"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-secondary-500">{p.id}</span>
                  <StatusBadge status={p.status} />
                </div>
                <h3 className="mt-3 font-semibold leading-snug text-secondary-900 dark:text-white">{p.title}</h3>
                <p className="mt-1 text-sm text-secondary-500">By {p.author}</p>
                <div className="mt-3"><Keywords list={p.keywords} /></div>
                <p className="mt-3 text-xs text-secondary-500">
                  Reviewers: {p.assignments.length ? p.assignments.map((a) => a.reviewerName).join(', ') : 'none assigned'}
                </p>
              </div>
              <div className="flex items-end justify-between border-t border-secondary-100 pt-3 dark:border-secondary-800">
                <div>
                  <span className="flex items-center gap-1.5 text-sm font-semibold text-secondary-700 dark:text-secondary-200">
                    <UserCheck className="h-4 w-4" /> {p.reviewsDone}/{p.reviewsTotal} Reviews
                  </span>
                  <p className="mt-0.5 text-xs text-secondary-500">{p.consensus}</p>
                </div>
                <ActionMenu actions={actionsFor(p)} />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-8 overflow-x-auto rounded-2xl border border-secondary-200 bg-white shadow-card dark:border-secondary-800 dark:bg-secondary-900">
          <table className="w-full min-w-[860px] text-left text-sm">
            <thead className="border-b border-secondary-200 text-xs uppercase tracking-wide text-secondary-500 dark:border-secondary-800">
              <tr>
                {['Tracking Number', 'Title & Keywords', 'Author', 'Status', 'Reviews Progress', 'Consensus'].map((h) => (
                  <th key={h} className="px-4 py-3 font-semibold">{h}</th>
                ))}
                <th className="px-4 py-3 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-secondary-100 dark:divide-secondary-800">
              {filtered.map((p) => (
                <tr key={p.id}>
                  <td className="px-4 py-3 font-bold text-secondary-900 dark:text-white">{p.id}</td>
                  <td className="max-w-xs px-4 py-3">
                    <p className="font-semibold text-secondary-900 dark:text-white">{p.title}</p>
                    <div className="mt-1"><Keywords list={p.keywords} /></div>
                  </td>
                  <td className="px-4 py-3">{p.author}</td>
                  <td className="px-4 py-3"><StatusBadge status={p.status} /></td>
                  <td className="px-4 py-3"><strong>{p.reviewsDone}/{p.reviewsTotal}</strong> completed</td>
                  <td className="px-4 py-3 text-xs text-secondary-500">{p.consensus}</td>
                  <td className="px-4 py-3 text-right"><ActionMenu actions={actionsFor(p)} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {assignId && <AssignReviewerModal paperId={assignId} onClose={() => setAssignId(null)} />}
      {scoresPaper && <ReviewScoresModal paper={scoresPaper} onClose={() => setScoresId(null)} />}
      {docPaper && <LetterEditor key={docPaper.id} paper={docPaper} initialTemplate={doc.template} onClose={() => setDoc(null)} />}
    </div>
  );
}
