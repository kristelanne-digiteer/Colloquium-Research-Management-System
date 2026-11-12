import { useEffect, useRef } from 'react';

// Textarea that grows with its content and looks like plain text until focused.
function AutoText({ value, onChange, readOnly, className = '', ...rest }) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = '0px';
    el.style.height = `${el.scrollHeight}px`;
  }, [value]);

  if (readOnly) return <p className={`whitespace-pre-wrap ${className}`}>{value}</p>;
  return (
    <textarea
      ref={ref}
      rows={1}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`block w-full resize-none overflow-hidden rounded bg-transparent outline-none ring-primary-400/60 hover:bg-primary-50/60 focus:bg-primary-50 focus:ring-2 ${className}`}
      {...rest}
    />
  );
}

// The letter sheet. editable=false renders the read-only version (author view / print).
// letter: see buildLetter() in data/letterTemplates.js
// signatories: [{ id, full_name, position, signature_url }]
export default function LetterPaper({ letter, onChange, signatories, editable = false, fontFamily, fontSize = 14 }) {
  const set = (patch) => onChange({ ...letter, ...patch });
  const setDetail = (i, col, v) =>
    set({ details: letter.details.map((row, j) => (j === i ? (col === 0 ? [v, row[1]] : [row[0], v]) : row)) });
  const setComment = (i, v) => set({ comments: letter.comments.map((c, j) => (j === i ? v : c)) });

  return (
    <div
      className="print-area mx-auto w-full max-w-[760px] bg-white px-12 py-10 text-slate-800 shadow-card"
      style={{ fontFamily: fontFamily || undefined, fontSize }}
    >
      <div className="flex items-center justify-between border-b border-slate-200 pb-3">
        <span className="text-lg font-bold text-primary-600">Colloquium</span>
        {editable ? (
          <input
            value={letter.badge}
            onChange={(e) => set({ badge: e.target.value })}
            className="w-56 rounded bg-transparent text-right text-xs font-semibold tracking-widest text-slate-400 outline-none hover:bg-primary-50/60 focus:bg-primary-50"
          />
        ) : (
          <span className="text-xs font-semibold tracking-widest text-slate-400">{letter.badge}</span>
        )}
      </div>

      <AutoText readOnly={!editable} value={letter.heading} onChange={(v) => set({ heading: v })} className="mt-6 text-2xl font-bold leading-tight text-slate-900" />
      <AutoText readOnly={!editable} value={letter.date} onChange={(v) => set({ date: v })} className="mt-1 text-sm text-slate-500" />

      <AutoText readOnly={!editable} value={letter.greeting} onChange={(v) => set({ greeting: v })} className="mt-6" />
      <AutoText readOnly={!editable} value={letter.intro} onChange={(v) => set({ intro: v })} className="mt-3 leading-relaxed" />

      <div className="my-6 rounded-lg bg-slate-50 px-5 py-4">
        {letter.details.map(([k, v], i) => (
          <div key={i} className="flex gap-6 py-1.5">
            {editable ? (
              <input value={k} onChange={(e) => setDetail(i, 0, e.target.value)} className="w-36 flex-shrink-0 rounded bg-transparent text-[11px] font-semibold uppercase tracking-wide text-slate-500 outline-none focus:bg-white" />
            ) : (
              <span className="w-36 flex-shrink-0 text-[11px] font-semibold uppercase tracking-wide text-slate-500">{k}</span>
            )}
            <div className="min-w-0 flex-1">
              <AutoText readOnly={!editable} value={v} onChange={(x) => setDetail(i, 1, x)} className="font-medium" />
            </div>
          </div>
        ))}
      </div>

      {letter.comments && (
        <div className="mb-5">
          <p className="mb-2 font-semibold">Reviewers&apos; comments</p>
          <ol className="space-y-2">
            {letter.comments.map((c, i) => (
              <li key={i} className="flex gap-2">
                <span className="mt-0.5 w-5 flex-shrink-0 text-slate-500">{i + 1}.</span>
                <div className="min-w-0 flex-1">
                  <AutoText readOnly={!editable} value={c} onChange={(v) => setComment(i, v)} className="leading-relaxed" />
                </div>
                {editable && (
                  <button type="button" onClick={() => set({ comments: letter.comments.filter((_, j) => j !== i) })} className="print:hidden text-xs text-red-500 hover:underline">
                    remove
                  </button>
                )}
              </li>
            ))}
          </ol>
          {editable && (
            <button type="button" onClick={() => set({ comments: [...letter.comments, ''] })} className="mt-2 text-xs font-semibold text-primary-600 hover:underline print:hidden">
              + Add comment
            </button>
          )}
        </div>
      )}

      <AutoText readOnly={!editable} value={letter.body} onChange={(v) => set({ body: v })} className="leading-relaxed" />

      <div className="mt-8">
        <AutoText readOnly={!editable} value={letter.closing} onChange={(v) => set({ closing: v })} />
        <div className="mt-3 flex flex-wrap gap-x-12 gap-y-6">
          {signatories.map((s, i) => (
            <div key={s.id ?? i} className="min-w-[180px]">
              <div className="flex h-14 items-end">
                {s.signature_url ? (
                  <img src={s.signature_url} alt={`Signature of ${s.full_name}`} className="max-h-14 max-w-[200px] object-contain" />
                ) : editable ? (
                  <span className="text-[11px] italic text-slate-300 print:hidden">no signature yet</span>
                ) : null}
              </div>
              <div className="border-t border-slate-400 pt-1">
                <p className="text-sm font-semibold">{s.full_name}</p>
                <p className="text-xs text-slate-500">{s.position}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-10 flex justify-between border-t border-slate-200 pt-2 text-[11px] text-slate-400">
        <span>Colloquium</span>
        <span>Ref {letter.tracking}</span>
      </div>
    </div>
  );
}
