import { useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { ArrowLeft, PenLine, Printer, Send, X } from 'lucide-react';
import LetterPaper from './letterPaper';
import ManuscriptViewer from './manuscriptViewer';
import SignaturePad from '../chair/signaturePad';
import { DECISIONS, decisionLabel } from '../../lib/db';

const FONTS = ['Inter', 'Georgia', 'Times New Roman', 'Arial', 'Courier New'];
const longDate = () => new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

// Plain-text version saved in reviews.comments_summary (what the EC Chair and author read).
export function composeFeedback(letter) {
  const numbered = (letter.comments ?? []).filter((c) => c.trim()).map((c, i) => `${i + 1}. ${c.trim()}`).join('\n');
  return [letter.body.trim(), numbered && `Comments:\n${numbered}`].filter(Boolean).join('\n\n');
}

// Same sheet as the EC Chair's letter editor, but for a review: the paper on the left,
// the feedback sheet on the right. readOnly shows a review that was already submitted.
export default function ReviewFeedbackEditor({ assignment, reviewerName, onSubmit, onClose }) {
  const sub = assignment.sub;
  const done = Boolean(assignment.review);

  const [decision, setDecision] = useState(assignment.review?.decision ?? 'APPROVED');
  const [sig, setSig] = useState(null);
  const [padOpen, setPadOpen] = useState(false);
  const [font, setFont] = useState('Inter');
  const [size, setSize] = useState(14);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const initial = useMemo(
    () => ({
      template: 'REVIEW',
      badge: 'PEER REVIEW',
      heading: `Review feedback: ${sub?.tracking_number ?? ''}`,
      date: done ? new Date(assignment.review.created_at).toLocaleDateString('en-US', { dateStyle: 'long' }) : longDate(),
      greeting: 'To the EC Chair,',
      intro: 'Below is my evaluation of the paper assigned to me, covering originality, methodology, clarity, and relevance.',
      details: [
        ['Tracking No.', sub?.tracking_number ?? ''],
        ['Paper title', sub?.title ?? ''],
        ['Recommendation', decisionLabel(assignment.review?.decision ?? 'APPROVED')],
        ['Review date', done ? new Date(assignment.review.created_at).toLocaleDateString('en-US', { dateStyle: 'long' }) : longDate()],
      ],
      body: done ? assignment.review.comments_summary ?? '' : 'Overall assessment:\n',
      comments: done ? null : [''],
      closing: 'Respectfully,',
      tracking: sub?.tracking_number ?? '',
    }),
    [assignment, sub, done]
  );
  const stored = assignment.review?.feedback_letter;
  const [letter, setLetter] = useState(stored?.letter ?? initial);

  const pickDecision = (value) => {
    setDecision(value);
    setLetter((l) => ({ ...l, details: l.details.map(([k, v]) => (k === 'Recommendation' ? [k, decisionLabel(value)] : [k, v])) }));
  };

  const submit = async () => {
    setError('');
    const text = composeFeedback(letter);
    if (text.replace(/Overall assessment:/i, '').trim().length < 10) return setError('Write your feedback on the sheet before submitting.');
    if (!window.confirm('Submit this review to the EC Chair? You cannot edit it afterwards.')) return;
    setBusy(true);
    const err = await onSubmit({
      decision,
      text,
      sheet: { letter, signatories: [{ id: 'me', full_name: reviewerName, position: 'Peer Reviewer', signature_url: sig }] },
    });
    setBusy(false);
    if (err) setError(err);
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex flex-col bg-secondary-100 dark:bg-secondary-950">
      <header className="flex flex-wrap items-center gap-3 border-b border-secondary-200 bg-white px-4 py-3 print:hidden dark:border-secondary-800 dark:bg-secondary-900">
        <button type="button" onClick={onClose} aria-label="Close" className="rounded-lg p-2 text-secondary-500 hover:bg-secondary-100"><ArrowLeft className="h-5 w-5" /></button>
        <div className="mr-auto min-w-0">
          <h2 className="text-base font-bold text-secondary-900 dark:text-white">{done ? 'Your submitted review' : 'Write review feedback'}</h2>
          <p className="truncate text-xs text-secondary-500">{sub?.tracking_number} &middot; {sub?.title}</p>
        </div>
        {!done && (
          <>
            <label className="text-xs font-semibold text-secondary-500" htmlFor="rf-decision">Recommendation</label>
            <select id="rf-decision" value={decision} onChange={(e) => pickDecision(e.target.value)} className="rounded-lg border border-secondary-300 bg-white px-3 py-2 text-sm dark:border-secondary-700 dark:bg-secondary-800">
              {DECISIONS.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
            </select>
            <select value={font} onChange={(e) => setFont(e.target.value)} aria-label="Font" className="rounded-lg border border-secondary-300 bg-white px-3 py-2 text-sm dark:border-secondary-700 dark:bg-secondary-800">
              {FONTS.map((f) => <option key={f}>{f}</option>)}
            </select>
            <div className="flex items-center gap-1">
              <button type="button" className="h-8 w-8 rounded-lg border border-secondary-300 font-bold" onClick={() => setSize((s) => Math.max(11, s - 1))}>-</button>
              <span className="w-10 text-center text-xs font-semibold">{size}px</span>
              <button type="button" className="h-8 w-8 rounded-lg border border-secondary-300 font-bold" onClick={() => setSize((s) => Math.min(20, s + 1))}>+</button>
            </div>
            <button type="button" onClick={() => setPadOpen(true)} className="inline-flex items-center gap-1.5 rounded-lg border border-secondary-400 px-3 py-2 text-sm font-semibold text-secondary-600 hover:bg-secondary-50">
              <PenLine className="h-4 w-4" /> {sig ? 'Replace e-signature' : 'Add e-signature'}
            </button>
          </>
        )}
        <button type="button" onClick={() => window.print()} className="inline-flex items-center gap-1.5 rounded-lg border border-secondary-400 px-3 py-2 text-sm font-semibold text-secondary-600 hover:bg-secondary-50"><Printer className="h-4 w-4" /> Print</button>
        {!done && (
          <button type="button" onClick={submit} disabled={busy} className="inline-flex items-center gap-1.5 rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-60">
            <Send className="h-4 w-4" /> {busy ? 'Sending...' : 'Send to EC Chair'}
          </button>
        )}
      </header>

      {error && <p role="alert" className="bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 print:hidden">{error}</p>}

      <div className="grid min-h-0 flex-1 gap-0 lg:grid-cols-2">
        <section className="flex min-h-[40vh] flex-col overflow-y-auto border-b border-secondary-200 bg-white print:hidden lg:border-b-0 lg:border-r dark:border-secondary-800 dark:bg-secondary-900">
          <div className="border-b border-secondary-200 px-4 py-3 dark:border-secondary-800">
            <h3 className="text-xs font-bold uppercase tracking-wide text-secondary-500">Submitted paper</h3>
            <p className="mt-1 text-sm font-semibold text-secondary-900 dark:text-white">{sub?.title}</p>
            <p className="mt-2 max-h-28 overflow-y-auto whitespace-pre-wrap text-xs text-secondary-600 dark:text-secondary-300">{sub?.abstract}</p>
          </div>
          {sub && <ManuscriptViewer authorId={sub.author_id} submissionId={sub.id} height="65vh" />}
        </section>

        <main className="overflow-y-auto p-4 sm:p-6">
          <LetterPaper
            letter={letter}
            onChange={setLetter}
            editable={!done}
            signatories={done && stored?.signatories ? stored.signatories : [{ id: 'me', full_name: reviewerName, position: 'Peer Reviewer', signature_url: sig }]}
            fontFamily={font === 'Inter' ? undefined : font}
            fontSize={size}
          />
        </main>
      </div>

      {padOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 print:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setPadOpen(false)} />
          <div className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-card dark:bg-secondary-900">
            <button type="button" aria-label="Close" onClick={() => setPadOpen(false)} className="absolute right-3 top-3 rounded-lg p-1.5 text-secondary-400 hover:bg-secondary-100"><X className="h-4 w-4" /></button>
            <h3 className="mb-3 text-base font-bold">Your e-signature</h3>
            <SignaturePad onCancel={() => setPadOpen(false)} onSave={(url) => { setSig(url); setPadOpen(false); }} />
          </div>
        </div>
      )}
    </div>,
    document.body
  );
}
