import { useEffect, useRef, useState } from 'react';
import { ArrowDown, ArrowUp, ImagePlus, Trash2 } from 'lucide-react';

const MAX_IMAGES = 6;
const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, n));

// Shrinks a picture before it is stored inside the review (keeps the saved review small).
function compressImage(file, maxW = 1400, quality = 0.85) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const im = new Image();
    im.onload = () => {
      const scale = Math.min(1, maxW / im.width);
      const c = document.createElement('canvas');
      c.width = Math.round(im.width * scale);
      c.height = Math.round(im.height * scale);
      const ctx = c.getContext('2d');
      ctx.fillStyle = '#fff';
      ctx.fillRect(0, 0, c.width, c.height);
      ctx.drawImage(im, 0, 0, c.width, c.height);
      URL.revokeObjectURL(url);
      resolve(c.toDataURL('image/jpeg', quality));
    };
    im.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Could not read that image.'));
    };
    im.src = url;
  });
}

// One picture on the sheet. When editable: drag the corner to resize, or use the size buttons.
function SheetImage({ img, editable, first, last, onChange, onRemove, onMove }) {
  const startDrag = (e) => {
    e.preventDefault();
    const box = e.currentTarget.parentElement.parentElement.getBoundingClientRect().width;
    const startX = e.clientX;
    const startW = img.width;
    const move = (ev) => onChange({ width: clamp(Math.round(startW + ((ev.clientX - startX) / box) * 100), 15, 100) });
    const up = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  };

  return (
    <figure className="my-4 break-inside-avoid" >
      {editable && (
        <div className="mx-auto mb-1 flex flex-wrap items-center justify-center gap-1 text-[11px] print:hidden">
          {[25, 50, 75, 100].map((w) => (
            <button key={w} type="button" onClick={() => onChange({ width: w })} className={`rounded px-2 py-0.5 font-semibold ${img.width === w ? 'bg-primary-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>{w}%</button>
          ))}
          <button type="button" disabled={first} onClick={() => onMove(-1)} aria-label="Move up" className="rounded bg-slate-100 p-1 text-slate-600 hover:bg-slate-200 disabled:opacity-40"><ArrowUp className="h-3 w-3" /></button>
          <button type="button" disabled={last} onClick={() => onMove(1)} aria-label="Move down" className="rounded bg-slate-100 p-1 text-slate-600 hover:bg-slate-200 disabled:opacity-40"><ArrowDown className="h-3 w-3" /></button>
          <button type="button" onClick={onRemove} aria-label="Remove image" className="rounded bg-red-50 p-1 text-red-600 hover:bg-red-100"><Trash2 className="h-3 w-3" /></button>
        </div>
      )}
      <div className="relative mx-auto" style={{ width: `${img.width}%` }}>
        <img src={img.src} alt={img.caption || 'Review attachment'} className={`block w-full rounded border border-slate-200 ${editable ? 'ring-primary-400/60 hover:ring-2' : ''}`} draggable={false} />
        {editable && (
          <span
            onPointerDown={startDrag}
            title="Drag to resize"
            className="absolute -bottom-1.5 -right-1.5 h-4 w-4 cursor-nwse-resize rounded-sm border-2 border-white bg-primary-600 shadow print:hidden"
            style={{ touchAction: 'none' }}
          />
        )}
      </div>
      {editable ? (
        <input
          value={img.caption ?? ''}
          onChange={(e) => onChange({ caption: e.target.value })}
          placeholder="Add a caption (optional)"
          className="mx-auto mt-1 block w-full rounded bg-transparent text-center text-xs text-slate-500 outline-none hover:bg-primary-50/60 focus:bg-primary-50"
        />
      ) : (
        img.caption && <figcaption className="mt-1 text-center text-xs text-slate-500">{img.caption}</figcaption>
      )}
    </figure>
  );
}

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
export default function LetterPaper({ letter, onChange, signatories, editable = false, allowImages = false, fontFamily, fontSize = 14 }) {
  const set = (patch) => onChange({ ...letter, ...patch });
  const images = letter.images ?? [];
  const canInsert = editable && allowImages;
  const latest = useRef(letter);
  latest.current = letter;
  const [imgError, setImgError] = useState('');
  const [imgBusy, setImgBusy] = useState(false);

  const setImage = (id, patch) => set({ images: images.map((im) => (im.id === id ? { ...im, ...patch } : im)) });
  const removeImage = (id) => set({ images: images.filter((im) => im.id !== id) });
  const moveImage = (i, dir) => {
    const next = [...images];
    const j = i + dir;
    if (j < 0 || j >= next.length) return;
    [next[i], next[j]] = [next[j], next[i]];
    set({ images: next });
  };
  const addImages = async (list) => {
    const files = Array.from(list ?? []).filter((f) => f.type.startsWith('image/'));
    if (!files.length) return setImgError('Only image files can be inserted.');
    const room = MAX_IMAGES - (latest.current.images ?? []).length;
    if (room <= 0) return setImgError(`You can insert up to ${MAX_IMAGES} images.`);
    setImgError('');
    setImgBusy(true);
    try {
      const added = [];
      for (const f of files.slice(0, room)) {
        added.push({ id: `img-${Date.now()}-${added.length}`, src: await compressImage(f), width: 60, caption: '' });
      }
      onChange({ ...latest.current, images: [...(latest.current.images ?? []), ...added] });
      if (files.length > room) setImgError(`Only ${MAX_IMAGES} images fit. The rest were skipped.`);
    } catch (err) {
      setImgError(err.message);
    }
    setImgBusy(false);
  };
  // Ctrl+V a screenshot anywhere on the sheet (normal text paste is left alone).
  const onPaste = (e) => {
    if (!canInsert) return;
    const files = Array.from(e.clipboardData?.files ?? []).filter((f) => f.type.startsWith('image/'));
    if (!files.length) return;
    e.preventDefault();
    addImages(files);
  };
  const setDetail = (i, col, v) =>
    set({ details: letter.details.map((row, j) => (j === i ? (col === 0 ? [v, row[1]] : [row[0], v]) : row)) });
  const setComment = (i, v) => set({ comments: letter.comments.map((c, j) => (j === i ? v : c)) });

  return (
    <div
      className="print-area mx-auto w-full max-w-[760px] bg-white px-12 py-10 text-slate-800 shadow-card"
      style={{ fontFamily: fontFamily || undefined, fontSize }}
      onPaste={onPaste}
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

      {images.map((im, i) => (
        <SheetImage
          key={im.id}
          img={im}
          editable={editable}
          first={i === 0}
          last={i === images.length - 1}
          onChange={(patch) => setImage(im.id, patch)}
          onRemove={() => removeImage(im.id)}
          onMove={(dir) => moveImage(i, dir)}
        />
      ))}
      {canInsert && (
        <div className="mt-3 print:hidden">
          <label className={`inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-dashed border-primary-300 px-3 py-2 text-xs font-semibold text-primary-700 hover:bg-primary-50 ${imgBusy ? 'pointer-events-none opacity-60' : ''}`}>
            <ImagePlus className="h-4 w-4" /> {imgBusy ? 'Adding...' : 'Insert image'}
            <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => { addImages(e.target.files); e.target.value = ''; }} />
          </label>
          <span className="ml-2 text-[11px] text-slate-400">or paste a screenshot (Ctrl+V) on this page &middot; drag the blue corner to resize</span>
          {imgError && <p role="alert" className="mt-1 text-xs font-semibold text-red-600">{imgError}</p>}
        </div>
      )}

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
