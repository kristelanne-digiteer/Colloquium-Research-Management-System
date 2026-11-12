import { useState } from 'react';
import { Eye, Plus, Trash2 } from 'lucide-react';
import { useChair } from '../../context/chairContext';
import ChairButton from '../../components/chair/chairButton';
import LetterEditor from '../../components/chair/letterEditor';
import { LETTER_TEMPLATES } from '../../data/letterTemplates';

const statusStyle = {
  Sent: 'bg-green-100 text-green-700',
  Draft: 'bg-amber-100 text-amber-700',
};

export default function ChairLetters() {
  const { letters, submissions, deleteLetter } = useChair();
  const [open, setOpen] = useState(null); // { paperId, template }
  const [newPaper, setNewPaper] = useState('');
  const [newTemplate, setNewTemplate] = useState('ACCEPTED');
  const paper = open && submissions.find((s) => s.id === open.paperId);

  const templateFor = (type) =>
    Object.entries(LETTER_TEMPLATES).find(([, t]) => type.startsWith(t.label))?.[0] ?? 'ACCEPTED';

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
      <h1 className="text-2xl font-bold text-secondary-900 dark:text-white sm:text-3xl">Formal Letters & Documents</h1>
      <p className="mt-1 text-sm text-secondary-500 dark:text-secondary-400">
        Write decision letters from templates, add e-signatures, and send them to authors.
      </p>

      <div className="mt-8 flex flex-wrap items-end gap-3 rounded-2xl border border-secondary-200 bg-white p-5 shadow-card dark:border-secondary-800 dark:bg-secondary-900">
        <div className="min-w-[220px] flex-1">
          <label className="mb-1 block text-xs font-semibold text-secondary-500" htmlFor="nl-paper">Paper</label>
          <select id="nl-paper" value={newPaper} onChange={(e) => setNewPaper(e.target.value)} className="w-full rounded-lg border border-secondary-300 bg-white px-3 py-2 text-sm dark:border-secondary-700 dark:bg-secondary-800">
            <option value="">Select a submission...</option>
            {submissions.map((s) => <option key={s.id} value={s.id}>{s.id} - {s.title.slice(0, 60)}</option>)}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-secondary-500" htmlFor="nl-template">Template</label>
          <select id="nl-template" value={newTemplate} onChange={(e) => setNewTemplate(e.target.value)} className="rounded-lg border border-secondary-300 bg-white px-3 py-2 text-sm dark:border-secondary-700 dark:bg-secondary-800">
            {Object.entries(LETTER_TEMPLATES).map(([k, t]) => <option key={k} value={k}>{t.label}</option>)}
          </select>
        </div>
        <ChairButton icon={Plus} disabled={!newPaper} onClick={() => setOpen({ paperId: newPaper, template: newTemplate })}>
          New letter
        </ChairButton>
      </div>

      <div className="mt-5 overflow-x-auto rounded-2xl border border-secondary-200 bg-white shadow-card dark:border-secondary-800 dark:bg-secondary-900">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="border-b border-secondary-200 text-xs uppercase tracking-wide text-secondary-500 dark:border-secondary-800">
            <tr>
              {['Reference', 'Letter', 'Tracking #', 'Author', 'Date', 'Status'].map((h) => (
                <th key={h} className="px-4 py-3 font-semibold">{h}</th>
              ))}
              <th className="px-4 py-3 text-right font-semibold">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-secondary-100 dark:divide-secondary-800">
            {letters.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-10 text-center text-sm text-secondary-500">No letters yet. Create one above.</td></tr>
            )}
            {letters.map((l) => (
              <tr key={l.id}>
                <td className="px-4 py-3 font-bold text-secondary-900 dark:text-white">{l.id}</td>
                <td className="px-4 py-3">{l.type}</td>
                <td className="px-4 py-3"><code className="rounded bg-secondary-100 px-1.5 py-0.5 text-xs dark:bg-secondary-800">{l.trackingId}</code></td>
                <td className="px-4 py-3">{l.author}</td>
                <td className="px-4 py-3">{l.date}</td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusStyle[l.status ?? 'Sent']}`}>{l.status ?? 'Sent'}</span>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex justify-end gap-2">
                    <ChairButton size="sm" variant="secondary" icon={Eye} onClick={() => setOpen({ paperId: l.trackingId, template: templateFor(l.type) })}>
                      Open
                    </ChairButton>
                    <ChairButton size="sm" variant="secondary" icon={Trash2} onClick={() => window.confirm(`Delete letter record ${l.id}?`) && deleteLetter(l)}>
                      Delete
                    </ChairButton>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {paper && <LetterEditor key={paper.id + open.template} paper={paper} initialTemplate={open.template} onClose={() => setOpen(null)} />}
    </div>
  );
}
