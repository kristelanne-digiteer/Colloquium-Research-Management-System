import { Check, Clock, X } from 'lucide-react';

const STATUS_STYLES = {
  pending:
    'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
  approved:
    'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300',
  rejected:
    'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300',
};

const STATUS_LABELS = {
  pending: 'Pending',
  approved: 'Approved',
  rejected: 'Rejected',
};

function StatusBadge({ status }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${STATUS_STYLES[status]}`}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}

function ActionButton({ label, icon: Icon, active, onClick, activeClass }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      className={`flex h-8 w-8 items-center justify-center rounded-lg border transition-colors ${
        active
          ? activeClass
          : 'border-secondary-200 text-secondary-500 hover:bg-secondary-100 dark:border-secondary-700 dark:text-secondary-300 dark:hover:bg-secondary-800'
      }`}
    >
      <Icon className="h-4 w-4" />
    </button>
  );
}

export default function PendingList({ papers, onDecision, onOpen }) {
  return (
    <div className="mt-8 overflow-hidden rounded-2xl bg-white shadow-sm dark:bg-secondary-900">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="border-b border-secondary-200 text-xs uppercase tracking-wide text-secondary-500 dark:border-secondary-700 dark:text-secondary-400">
            <tr>
              <th className="px-6 py-3 font-semibold">Paper</th>
              <th className="px-6 py-3 font-semibold">Field</th>
              <th className="px-6 py-3 font-semibold">Due</th>
              <th className="px-6 py-3 font-semibold">Status</th>
              <th className="px-6 py-3 text-right font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-secondary-100 dark:divide-secondary-800">
            {papers.map((paper) => (
              <tr key={paper.id}>
                <td className="px-6 py-4">
                  <button
                    type="button"
                    onClick={() => onOpen?.(paper.id)}
                    className="text-left font-semibold text-secondary-900 hover:underline dark:text-white"
                  >
                    {paper.title}
                  </button>
                  <p className="mt-0.5 text-xs text-secondary-500 dark:text-secondary-400">
                    {paper.authors}
                  </p>
                </td>
                <td className="px-6 py-4 text-secondary-600 dark:text-secondary-300">
                  {paper.field}
                </td>
                <td className="px-6 py-4 text-secondary-600 dark:text-secondary-300">
                  {paper.dueDate}
                </td>
                <td className="px-6 py-4">
                  <StatusBadge status={paper.status} />
                </td>
                <td className="px-6 py-4">
                  <div className="flex justify-end gap-2">
                    <ActionButton
                      label="Approve"
                      icon={Check}
                      active={paper.status === 'approved'}
                      activeClass="border-emerald-600 bg-emerald-600 text-white"
                      onClick={() => onDecision(paper.id, 'approved')}
                    />
                    <ActionButton
                      label="Mark as pending"
                      icon={Clock}
                      active={paper.status === 'pending'}
                      activeClass="border-amber-500 bg-amber-500 text-white"
                      onClick={() => onDecision(paper.id, 'pending')}
                    />
                    <ActionButton
                      label="Reject"
                      icon={X}
                      active={paper.status === 'rejected'}
                      activeClass="border-red-600 bg-red-600 text-white"
                      onClick={() => onDecision(paper.id, 'rejected')}
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}