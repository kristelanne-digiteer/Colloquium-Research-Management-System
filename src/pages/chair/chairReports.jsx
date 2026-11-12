import { Download } from 'lucide-react';
import { useChair } from '../../context/chairContext';
import ChairButton from '../../components/chair/chairButton';
import { downloadCsv } from '../../lib/exportCsv';

export default function ChairReports() {
  const { submissions, reviewers, notify } = useChair();

  const stats = [
    { label: 'Total Submissions', value: submissions.length, note: 'All submitted papers', color: '' },
    { label: 'Accepted Papers', value: submissions.filter((s) => s.status === 'Approved').length, note: 'Accepted by the committee', color: 'text-green-700 dark:text-green-400' },
    { label: 'Pending Review', value: submissions.filter((s) => s.status === 'For Review').length, note: 'Awaiting reviewer feedback', color: 'text-amber-700 dark:text-amber-400' },
    { label: 'Declined / Revisions', value: submissions.filter((s) => s.status === 'Rejected' || s.status === 'Resubmission').length, note: 'Returned or declined', color: 'text-red-600 dark:text-red-400' },
  ];

  const totalAssignments = submissions.reduce((n, s) => n + s.assignments.length, 0);
  const completed = submissions.reduce((n, s) => n + s.assignments.filter((a) => a.status === 'COMPLETED').length, 0);
  const rated = submissions.flatMap((s) => s.reviews).filter((r) => r.rating != null);
  const avgRating = rated.length ? (rated.reduce((n, r) => n + Number(r.rating), 0) / rated.length).toFixed(1) : '-';
  const metrics = [
    { label: 'Review assignments completed', value: `${completed} of ${totalAssignments}`, color: '' },
    { label: 'Papers with no reviewer yet', value: submissions.filter((s) => s.assignments.length === 0).length, color: '' },
    { label: 'Average reviewer rating', value: avgRating === '-' ? '-' : `${avgRating} / 5`, color: '' },
    { label: 'Registered users', value: reviewers.length, color: '' },
  ];

  // Generate a CSV: summary section first, then one row per submission.
  const generateReport = () => {
    if (!submissions.length) return notify('There are no submissions to include in a report yet.');

    const now = new Date();
    const rows = [
      ['Colloquium - Committee Analytics & Reports'],
      ['Generated', now.toLocaleString('en-US')],
      [],
      ['SUMMARY'],
      ['Metric', 'Value'],
      ...stats.map((s) => [s.label, s.value]),
      ...metrics.map((m) => [m.label, m.value]),
      [],
      ['SUBMISSIONS'],
      ['Tracking No.', 'Title', 'Author', 'Status', 'Review Round', 'Submitted', 'Assigned Reviewers', 'Reviews Submitted', 'Average Rating', 'Decisions'],
      ...submissions.map((s) => {
        const ratings = s.reviews.filter((r) => r.rating != null).map((r) => Number(r.rating));
        const avg = ratings.length ? (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1) : '';
        return [
          s.id,
          s.title,
          s.author,
          s.status,
          s.reviewRound,
          s.submittedAt,
          s.assignments.map((a) => a.reviewerName).join('; '),
          `${s.reviewsDone}/${s.reviewsTotal}`,
          avg,
          s.reviews.map((r) => `${r.reviewerName}: ${r.decision ?? '-'}`).join('; '),
        ];
      }),
    ];

    const stamp = now.toISOString().slice(0, 10);
    downloadCsv(`colloquium-report-${stamp}.csv`, rows);
    notify('Report generated. Check your downloads folder.');
  };

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900 dark:text-white sm:text-3xl">Committee Analytics & Reports</h1>
          <p className="mt-1 text-sm text-secondary-500 dark:text-secondary-400">
            Monitor review velocity, consensus trends, and institutional compliance metrics.
          </p>
        </div>
        <ChairButton icon={Download} onClick={generateReport}>
          Generate Report (CSV)
        </ChairButton>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-2xl border border-secondary-200 bg-white p-5 shadow-card dark:border-secondary-800 dark:bg-secondary-900">
            <h4 className="text-sm font-medium text-secondary-500">{s.label}</h4>
            <p className={`mt-2 text-3xl font-bold text-secondary-900 dark:text-white ${s.color}`}>{s.value}</p>
            <span className="mt-1 inline-block rounded-md bg-accent-100 px-2 py-0.5 text-xs font-medium text-accent-600 dark:bg-accent-600/20 dark:text-accent-300">
              {s.note}
            </span>
          </div>
        ))}
      </div>

      <div className="mt-6 rounded-2xl border border-secondary-200 bg-white p-6 shadow-card dark:border-secondary-800 dark:bg-secondary-900">
        <h3 className="font-bold text-secondary-900 dark:text-white">Review Progress</h3>
        <div className="mt-4 divide-y divide-secondary-100 dark:divide-secondary-800">
          {metrics.map((m) => (
            <div key={m.label} className="flex items-center justify-between py-3 text-sm">
              <span className="text-secondary-600 dark:text-secondary-300">{m.label}</span>
              <strong className={`text-secondary-900 dark:text-white ${m.color}`}>{m.value}</strong>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
