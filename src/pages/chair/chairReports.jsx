import { useChair } from '../../context/chairContext';

export default function ChairReports() {
  const { submissions } = useChair();

  const stats = [
    { label: 'Total Submissions', value: submissions.length, note: 'Active 2026 Cycle Protocols', color: '' },
    { label: 'Approved Protocols', value: submissions.filter((s) => s.status === 'Approved').length, note: 'Full clearance granted', color: 'text-green-700 dark:text-green-400' },
    { label: 'Pending Review', value: submissions.filter((s) => s.status === 'For Review' || s.status === 'Resubmission').length, note: 'Awaiting reviewer feedback', color: 'text-amber-700 dark:text-amber-400' },
    { label: 'Rejections / Revisions', value: submissions.filter((s) => s.status === 'Rejected').length, note: 'Returned for modifications', color: 'text-red-600 dark:text-red-400' },
  ];

  // Static for now, same as the vanilla version. Compute from real data later.
  const metrics = [
    { label: 'Average Review Cycle Duration', value: '4.2 Business Days', color: '' },
    { label: 'Compliance Audit Score', value: '98.4% (Optimal)', color: 'text-green-700 dark:text-green-400' },
    { label: 'Active Panelist Capacity Utilization', value: '76.5%', color: '' },
  ];

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
      <h1 className="text-2xl font-bold text-secondary-900 dark:text-white sm:text-3xl">Committee Analytics & Reports</h1>
      <p className="mt-1 text-sm text-secondary-500 dark:text-secondary-400">
        Monitor review velocity, consensus trends, and institutional compliance metrics.
      </p>

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
        <h3 className="font-bold text-secondary-900 dark:text-white">Committee Workflow Performance & Turnaround Metrics</h3>
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
