import { createPortal } from 'react-dom';
import { Printer, X } from 'lucide-react';
import LetterPaper from './letterPaper';
import { reviewSheet } from '../../lib/db';

// Read-only review feedback document: opened by the EC Chair and by the paper's author.
export default function ReviewSheetModal({ review, trackingNumber, title, onClose }) {
  const { letter, signatories } = reviewSheet({ review, trackingNumber, title });
  return createPortal(
    <div className="fixed inset-0 z-[90] overflow-y-auto bg-secondary-100 p-4 sm:p-8 dark:bg-secondary-950">
      <div className="mx-auto mb-4 flex max-w-[760px] justify-end gap-2 print:hidden">
        <button type="button" onClick={() => window.print()} className="inline-flex items-center gap-1.5 rounded-lg border border-secondary-400 bg-white px-3 py-1.5 text-sm font-semibold"><Printer className="h-4 w-4" /> Print / PDF</button>
        <button type="button" onClick={onClose} className="inline-flex items-center gap-1.5 rounded-lg bg-primary-600 px-3 py-1.5 text-sm font-semibold text-white"><X className="h-4 w-4" /> Close</button>
      </div>
      <LetterPaper letter={letter} signatories={signatories} />
    </div>,
    document.body
  );
}
