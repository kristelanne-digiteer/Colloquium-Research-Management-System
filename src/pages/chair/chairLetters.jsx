import { useState } from 'react';
import { Eye } from 'lucide-react';
import { useChair } from '../../context/chairContext';
import ChairButton from '../../components/chair/chairButton';
import DocumentModal from '../../components/chair/documentModal';

export default function ChairLetters() {
  const { letters, submissions } = useChair();
  const [doc, setDoc] = useState(null); // { paperId, type, date }
  const docPaper = doc && submissions.find((s) => s.id === doc.paperId);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
      <h1 className="text-2xl font-bold text-secondary-900 dark:text-white sm:text-3xl">Formal Letters & Documents</h1>
      <p className="mt-1 text-sm text-secondary-500 dark:text-secondary-400">
        Access official acceptance and endorsement certificates generated for authors.
      </p>

      <div className="mt-8 rounded-2xl border border-secondary-200 bg-white p-6 shadow-card dark:border-secondary-800 dark:bg-secondary-900">
        <h3 className="font-bold text-secondary-900 dark:text-white">Issuance & Endorsement Ledger</h3>
        <p className="mt-1 text-sm text-secondary-500">
          Official record of signed committee clearances, certificates, and institutional memos.
        </p>
      </div>

      <div className="mt-5 overflow-x-auto rounded-2xl border border-secondary-200 bg-white shadow-card dark:border-secondary-800 dark:bg-secondary-900">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="border-b border-secondary-200 text-xs uppercase tracking-wide text-secondary-500 dark:border-secondary-800">
            <tr>
              {['Document Reference ID', 'Certificate Classification', 'Associated Tracking #', 'Principal Author', 'Issuance Date'].map((h) => (
                <th key={h} className="px-4 py-3 font-semibold">{h}</th>
              ))}
              <th className="px-4 py-3 text-right font-semibold">Action View</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-secondary-100 dark:divide-secondary-800">
            {letters.map((l) => (
              <tr key={l.id}>
                <td className="px-4 py-3 font-bold text-secondary-900 dark:text-white">{l.id}</td>
                <td className="px-4 py-3">{l.type}</td>
                <td className="px-4 py-3"><code className="rounded bg-secondary-100 px-1.5 py-0.5 text-xs dark:bg-secondary-800">{l.trackingId}</code></td>
                <td className="px-4 py-3">{l.author}</td>
                <td className="px-4 py-3">{l.date}</td>
                <td className="px-4 py-3 text-right">
                  <ChairButton
                    size="sm"
                    variant="secondary"
                    icon={Eye}
                    onClick={() =>
                      setDoc({
                        paperId: l.trackingId,
                        type: l.type.startsWith('Acceptance') ? 'Acceptance' : 'Endorsement',
                        date: l.date,
                      })
                    }
                  >
                    View Letter
                  </ChairButton>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {docPaper && <DocumentModal paper={docPaper} docType={doc.type} date={doc.date} onClose={() => setDoc(null)} />}
    </div>
  );
}
