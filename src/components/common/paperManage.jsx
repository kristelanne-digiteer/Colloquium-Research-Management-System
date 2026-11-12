import { useRef, useState } from 'react';
import { Pencil, RotateCcw, Trash2, Upload } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import ManuscriptViewer from './manuscriptViewer';
import { MANUSCRIPT_BUCKET, folderOf } from '../../lib/db';

const MAX = 25 * 1024 * 1024;
const box = 'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#456882]/40';

// Author tools for one paper: edit details, replace / delete the file, delete the submission.
// The file is overwritten in place (same folder, one file), so a resubmission never creates a second submission.
export default function PaperManage({ paper, authorId, onChanged, onDeleted }) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(paper.title);
  const [abstract, setAbstract] = useState(paper.abstract);
  const [msg, setMsg] = useState({ type: '', text: '' });
  const [busy, setBusy] = useState(false);
  const [fileKey, setFileKey] = useState(0);
  const fileRef = useRef(null);
  const folder = folderOf(authorId, paper.dbId);
  const decided = paper.status === 'Approved' || paper.status === 'Declined';
  const revisionOpen = Boolean(paper.revisionDeadline) && !decided;
  const locked = !revisionOpen && (paper.reviewProgress > 0 || decided);
  const [fileChanged, setFileChanged] = useState(false);

  const run = async (fn, okText) => {
    setBusy(true);
    setMsg({ type: '', text: '' });
    const err = await fn();
    setBusy(false);
    if (err) setMsg({ type: 'error', text: err });
    else if (okText) setMsg({ type: 'ok', text: okText });
  };

  const clearFolder = async () => {
    const { data } = await supabase.storage.from(MANUSCRIPT_BUCKET).list(folder);
    const paths = (data ?? []).filter((f) => f.id).map((f) => `${folder}/${f.name}`);
    if (paths.length) {
      const { error } = await supabase.storage.from(MANUSCRIPT_BUCKET).remove(paths);
      if (error) return error.message;
    }
    return null;
  };

  const save = () =>
    run(async () => {
      if (!title.trim()) return 'The title cannot be empty.';
      const { error } = await supabase.from('submissions').update({ title: title.trim(), abstract: abstract.trim(), updated_at: new Date().toISOString() }).eq('id', paper.dbId);
      if (error) return error.message;
      setEditing(false);
      onChanged();
      return null;
    }, 'Saved.');

  const replaceFile = (file) =>
    run(async () => {
      if (!file) return null;
      if (file.size > MAX) return 'The file is over 25 MB.';
      const clearErr = await clearFolder(); // override: the old file is removed first
      if (clearErr) return clearErr;
      const { error } = await supabase.storage.from(MANUSCRIPT_BUCKET).upload(`${folder}/${Date.now()}-${file.name}`, file);
      if (error) return error.message;
      setFileKey((k) => k + 1);
      setFileChanged(true);
      return null;
    }, revisionOpen ? 'File replaced. Press "Resubmit for review" when you are done.' : 'File replaced.');

  const deleteFile = () => {
    if (!window.confirm('Delete the uploaded file? You can attach a new one afterwards.')) return;
    run(async () => {
      const err = await clearFolder();
      if (!err) setFileKey((k) => k + 1);
      return err;
    }, 'File deleted.');
  };

  // Same submission goes back to review as a new round (the database function resets the assignments).
  const resubmit = () => {
    if (!fileChanged && !window.confirm('You have not replaced the file in this session. Resubmit anyway?')) return;
    run(async () => {
      const { error } = await supabase.rpc('resubmit_paper', { p_id: paper.dbId });
      if (error) return `Could not resubmit: ${error.message}`;
      onChanged();
      return null;
    }, 'Resubmitted. Your reviewers have been notified.');
  };

  const deletePaper = () => {
    if (!window.confirm(`Delete submission ${paper.id} permanently? This cannot be undone.`)) return;
    run(async () => {
      const { error } = await supabase.from('submissions').delete().eq('id', paper.dbId);
      if (error) return `Could not delete: ${error.message}`;
      await clearFolder();
      onDeleted();
      return null;
    });
  };

  return (
    <div className="space-y-4">
      {revisionOpen && (
        <div className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-xs text-amber-900">
          <p className="font-bold">Revision requested{paper.revisionDeadline ? ` - due ${new Date(paper.revisionDeadline).toLocaleDateString('en-US', { dateStyle: 'medium' })}` : ''}</p>
          <p className="mt-1">Read the reviewers' comments above, update your title, abstract and file, then resubmit. This keeps the same tracking number.</p>
          <button type="button" disabled={busy} onClick={resubmit} className="mt-2 inline-flex items-center gap-1 rounded-lg bg-amber-600 px-3 py-1.5 text-[11px] font-bold text-white disabled:opacity-60">
            <RotateCcw className="h-3.5 w-3.5" /> Resubmit for review
          </button>
        </div>
      )}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-black">Manuscript file</h4>
          <div className="flex gap-2">
            <button type="button" disabled={busy || locked} onClick={() => fileRef.current?.click()} className="inline-flex items-center gap-1 rounded-lg bg-[#456882] px-3 py-1.5 text-[11px] font-bold text-white disabled:opacity-50">
              <Upload className="h-3.5 w-3.5" /> Replace file
            </button>
            <button type="button" disabled={busy || locked} onClick={deleteFile} className="inline-flex items-center gap-1 rounded-lg border border-red-300 px-3 py-1.5 text-[11px] font-bold text-red-600 disabled:opacity-50">
              <Trash2 className="h-3.5 w-3.5" /> Delete file
            </button>
          </div>
          <input ref={fileRef} type="file" accept=".pdf,.doc,.docx" className="hidden" onChange={(e) => { replaceFile(e.target.files?.[0]); e.target.value = ''; }} />
        </div>
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <ManuscriptViewer authorId={authorId} submissionId={paper.dbId} height="40vh" refreshKey={fileKey} />
        </div>
      </div>

      {editing ? (
        <div className="space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-3">
          <input className={box} value={title} onChange={(e) => setTitle(e.target.value)} aria-label="Title" />
          <textarea rows={5} className={box} value={abstract} onChange={(e) => setAbstract(e.target.value)} aria-label="Abstract" />
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => { setEditing(false); setTitle(paper.title); setAbstract(paper.abstract); }} className="rounded-lg bg-slate-200 px-3 py-1.5 text-[11px] font-bold text-slate-700">Cancel</button>
            <button type="button" disabled={busy} onClick={save} className="rounded-lg bg-[#1B3C53] px-3 py-1.5 text-[11px] font-bold text-white disabled:opacity-60">Save changes</button>
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          <button type="button" disabled={locked} onClick={() => setEditing(true)} className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-1.5 text-[11px] font-bold text-slate-700 disabled:opacity-50">
            <Pencil className="h-3.5 w-3.5" /> Edit title & abstract
          </button>
          <button type="button" disabled={busy} onClick={deletePaper} className="inline-flex items-center gap-1 rounded-lg border border-red-300 px-3 py-1.5 text-[11px] font-bold text-red-600 disabled:opacity-50">
            <Trash2 className="h-3.5 w-3.5" /> Delete submission
          </button>
        </div>
      )}
      {locked && <p className="text-[11px] text-slate-400">Editing is locked once a review or decision exists. If the EC Chair requests a revision, editing and resubmitting open up here.</p>}
      {msg.text && <p role={msg.type === 'error' ? 'alert' : 'status'} className={`text-xs font-semibold ${msg.type === 'error' ? 'text-red-600' : 'text-emerald-700'}`}>{msg.text}</p>}
    </div>
  );
}
