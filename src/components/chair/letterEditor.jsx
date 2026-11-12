import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { ArrowLeft, PenLine, Plus, Printer, Save, Send, Trash2, X } from 'lucide-react';
import ChairButton from './chairButton';
import SignaturePad from './signaturePad';
import LetterPaper from '../common/letterPaper';
import { useChair } from '../../context/chairContext';
import { useAuth } from '../../context/authContext';
import { LETTER_TEMPLATES, buildLetter } from '../../data/letterTemplates';
import { sendLetterToAuthor } from '../../lib/letterStore';
import { supabase, isBackendConfigured } from '../../lib/supabaseClient';

const FONTS = ['Inter', 'Georgia', 'Times New Roman', 'Arial', 'Courier New'];
const field =
  'w-full rounded-lg border border-secondary-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/40 dark:border-secondary-700 dark:bg-secondary-800 dark:text-slate-100';
const label = 'mb-1 block text-xs font-semibold text-secondary-500';

const longDate = (d = new Date()) => d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
const plusDays = (n) => longDate(new Date(Date.now() + n * 86400000));

// Letter editor: pick a template, edit any text on the sheet, choose / edit signatories,
// draw or upload a signature, then print or send it to the author's Notifications + email.
// Render with key={paper.id} so its state resets per paper.
export default function LetterEditor({ paper, initialTemplate = 'ACCEPTED', onClose }) {
  const { signatories: roster, saveSignatory, logLetter, notify } = useChair();
  const { user } = useAuth();

  const vars = useMemo(
    () => ({ tracking: paper.id, title: paper.title, author: paper.author, date: longDate(), due: plusDays(14) }),
    [paper]
  );

  const [letter, setLetter] = useState(() => buildLetter(initialTemplate, vars));
  const [email, setEmail] = useState(paper.authorEmail || '');
  // Signatories on THIS letter (copies; picking from the roster or editing here never alters other letters).
  const [chosen, setChosen] = useState(() => roster.slice(0, 1).map((s) => ({ ...s })));
  useEffect(() => {
    if (!isBackendConfigured || !paper.authorId || email) return;
    supabase.rpc('admin_get_email', { p_user: paper.authorId }).then(({ data }) => data && setEmail(data));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paper.authorId]);
  const [padFor, setPadFor] = useState(null); // index of signatory being signed
  const [font, setFont] = useState('Inter');
  const [size, setSize] = useState(14);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const switchTemplate = (key) => {
    if (!window.confirm('Switch template? Text you edited on the sheet will be replaced.')) return;
    setLetter(buildLetter(key, vars));
  };

  const updateSig = (i, patch) => setChosen((prev) => prev.map((s, j) => (j === i ? { ...s, ...patch } : s)));
  const pickSig = (i, id) => {
    const s = roster.find((r) => r.id === id);
    if (s) updateSig(i, { ...s });
  };
  const addSig = () =>
    setChosen((prev) => [...prev, { id: `new-${Date.now()}`, full_name: 'Full Name', position: 'Position', signature_url: null }]);

  // Remember edited names / signatures in the roster (letter_signatories) for next time.
  const rememberSignatories = async () => {
    const out = [];
    for (const s of chosen) out.push(await saveSignatory(s));
    setChosen(out);
    return out;
  };

  const saveDraft = async () => {
    setBusy(true);
    await rememberSignatories();
    logLetter({ paperId: paper.id, label: `${LETTER_TEMPLATES[letter.template].label} Letter (draft)`, status: 'Draft', recipientEmail: email });
    notify('Draft saved to the letters ledger.');
    setBusy(false);
    onClose();
  };

  const send = async () => {
    setError('');
    if (!/^\S+@\S+\.\S+$/.test(email)) return setError('Enter the author’s email address first.');
    if (!window.confirm(`Send this letter to ${email}? It will appear in their Notifications and be emailed.`)) return;
    setBusy(true);
    const sigs = await rememberSignatories();
    const res = await sendLetterToAuthor({ letter, signatories: sigs, recipientEmail: email, paper, senderId: user?.id });
    setBusy(false);
    if (!res.ok) return setError(`Could not send: ${res.error}`);
    logLetter({ paperId: paper.id, label: `${LETTER_TEMPLATES[letter.template].label} Letter`, status: 'Sent', recipientEmail: email });
    notify(res.warning ? `Letter sent. ${res.warning}` : `Letter sent to ${email}.`);
    onClose();
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex flex-col bg-secondary-100 dark:bg-secondary-950">
      <header className="flex flex-wrap items-center gap-3 border-b border-secondary-200 bg-white px-4 py-3 print:hidden dark:border-secondary-800 dark:bg-secondary-900">
        <button type="button" onClick={onClose} aria-label="Close editor" className="rounded-lg p-2 text-secondary-500 hover:bg-secondary-100 dark:hover:bg-secondary-800">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="mr-auto">
          <h2 className="text-base font-bold text-secondary-900 dark:text-white">Letter editor</h2>
          <p className="text-xs text-secondary-500">{paper.id} &middot; {paper.author}</p>
        </div>
        <select value={font} onChange={(e) => setFont(e.target.value)} className="rounded-lg border border-secondary-300 bg-white px-3 py-2 text-sm dark:border-secondary-700 dark:bg-secondary-800" aria-label="Font">
          {FONTS.map((f) => <option key={f}>{f}</option>)}
        </select>
        <div className="flex items-center gap-1 text-sm">
          <button type="button" className="h-8 w-8 rounded-lg border border-secondary-300 font-bold" onClick={() => setSize((s) => Math.max(11, s - 1))}>-</button>
          <span className="w-10 text-center text-xs font-semibold">{size}px</span>
          <button type="button" className="h-8 w-8 rounded-lg border border-secondary-300 font-bold" onClick={() => setSize((s) => Math.min(20, s + 1))}>+</button>
        </div>
        <ChairButton variant="secondary" icon={Printer} onClick={() => window.print()}>Print / PDF</ChairButton>
        <ChairButton variant="secondary" icon={Save} onClick={saveDraft} disabled={busy}>Save draft</ChairButton>
        <ChairButton icon={Send} onClick={send} disabled={busy}>Send to author</ChairButton>
      </header>

      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        <aside className="w-full flex-shrink-0 space-y-6 overflow-y-auto border-b border-secondary-200 bg-white p-5 print:hidden lg:w-80 lg:border-b-0 lg:border-r dark:border-secondary-800 dark:bg-secondary-900">
          <section>
            <h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-secondary-500">1. Template</h3>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(LETTER_TEMPLATES).map(([key, t]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => key !== letter.template && switchTemplate(key)}
                  className={`rounded-lg border px-2 py-2 text-xs font-semibold ${
                    letter.template === key ? 'border-primary-600 bg-primary-50 text-primary-700' : 'border-secondary-300 text-secondary-600 hover:bg-secondary-50'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
            <p className="mt-2 text-xs text-secondary-400">Click any text on the sheet to edit it.</p>
          </section>

          <section>
            <h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-secondary-500">2. Send to</h3>
            <label className={label} htmlFor="le-email">Author email</label>
            <input id="le-email" type="email" className={field} placeholder="author@school.edu" value={email} onChange={(e) => setEmail(e.target.value)} />
            <p className="mt-1 text-xs text-secondary-400">The letter appears in this person&apos;s Notifications and is emailed.</p>
          </section>

          <section>
            <h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-secondary-500">3. Signatories</h3>
            <div className="space-y-3">
              {chosen.map((s, i) => (
                <div key={s.id ?? i} className="space-y-2 rounded-xl border border-secondary-200 p-3 dark:border-secondary-700">
                  <div className="flex items-center gap-2">
                    <select className={field} value={roster.some((r) => r.id === s.id) ? s.id : ''} onChange={(e) => pickSig(i, e.target.value)} aria-label="Choose signatory">
                      <option value="" disabled>New / edited</option>
                      {roster.map((r) => <option key={r.id} value={r.id}>{r.full_name}</option>)}
                    </select>
                    {chosen.length > 1 && (
                      <button type="button" aria-label="Remove signatory" onClick={() => setChosen((p) => p.filter((_, j) => j !== i))} className="rounded-lg p-2 text-red-500 hover:bg-red-50">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  <input className={field} value={s.full_name} onChange={(e) => updateSig(i, { full_name: e.target.value })} aria-label="Full name" />
                  <input className={field} value={s.position} onChange={(e) => updateSig(i, { position: e.target.value })} aria-label="Position" />
                  {s.signature_url && <img src={s.signature_url} alt="" className="h-10 object-contain" />}
                  <ChairButton size="sm" variant="secondary" icon={PenLine} onClick={() => setPadFor(i)}>
                    {s.signature_url ? 'Replace e-signature' : 'Add e-signature'}
                  </ChairButton>
                </div>
              ))}
            </div>
            {chosen.length < 3 && (
              <ChairButton size="sm" variant="secondary" icon={Plus} className="mt-3" onClick={addSig}>Add signatory</ChairButton>
            )}
          </section>

          {error && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
        </aside>

        <main className="flex-1 overflow-y-auto p-4 sm:p-8">
          <LetterPaper letter={letter} onChange={setLetter} signatories={chosen} editable fontFamily={font === 'Inter' ? undefined : font} fontSize={size} />
        </main>
      </div>

      {padFor !== null && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 print:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setPadFor(null)} />
          <div className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-card dark:bg-secondary-900">
            <button type="button" aria-label="Close" onClick={() => setPadFor(null)} className="absolute right-3 top-3 rounded-lg p-1.5 text-secondary-400 hover:bg-secondary-100"><X className="h-4 w-4" /></button>
            <h3 className="mb-3 text-base font-bold">E-signature for {chosen[padFor]?.full_name}</h3>
            <SignaturePad
              onCancel={() => setPadFor(null)}
              onSave={(url) => { updateSig(padFor, { signature_url: url }); setPadFor(null); }}
            />
          </div>
        </div>
      )}
    </div>,
    document.body
  );
}
