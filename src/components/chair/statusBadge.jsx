const styles = {
  Approved: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  Rejected: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
  'For Review': 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
  Resubmission: 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300',
};

export default function StatusBadge({ status }) {
  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${styles[status] || styles.Resubmission}`}>
      {status}
    </span>
  );
}
