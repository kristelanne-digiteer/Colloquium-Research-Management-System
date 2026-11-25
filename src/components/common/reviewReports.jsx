import { useCallback, useEffect, useState } from 'react';
import { FileText, Upload } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';

export const REPORTS_BUCKET = 'review-reports';
const MAX = 25 * 1024 * 1024;
const KINDS = [
  { key: 'ai', label: 'AI Detection Report' },
  { key: 'plag', label: 'Plagiarism / Similarity Index Report' },
];
const ACCEPT = '.pdf,.doc,.docx,.png,.jpg,.jpeg';

// Files live in  review-reports/<submissionId>/<reviewerId>/<kind>__<timestamp>__<original name>
// One file per kind: uploading again replaces the old one.
const displayName = (stored) => stored.split('__').slice(2).join('__') || stored;

// editable = the assigned reviewer uploads / replaces. Not editable = EC Chair view only.
export default function ReviewReports({ submissionId, reviewerId, editable = false }) {
  const [files, setFiles] = useState({}); // kind -> { name, path }
  const [busy, setBusy] = useState('');
  const [msg, setMsg] = useState({ type: '', text: '' });
  const folder = `${submissionId}/${reviewerId}`;

  const load = useCallback(async () => {
    const { data, error } = await supabase.storage.from(REPORTS_BUCKET).list(folder, { sortBy: { column: 'name', order: 'asc' } });
    if (error) return setMsg({ type: 'error', text: `Could not load reports: ${error.message}` });
    const next = {};
    (data ?? []).filter((f) => f.id).forEach((f) => {
      const kind = f.name.split('__')[0];
      next[kind] = { name: f.name, path: `${folder}/${f.name}` }; // later timestamps win
    });
    setFiles(next);
  }, [folder]);

  useEffect(() => { load(); }, [load]);

  const open = async (path) => {
    const { data, error } = await supabase.storage.from(REPORTS_BUCKET).createSignedUrl(path, 300);
    if (error) return setMsg({ type: 'error', text: `Could not open the file: ${error.message}` });
    window.open(data.signedUrl, '_blank', 'noopener');
  };

  const upload = async (kind, file) => {
    if (!file) return;
    setMsg({ type: '', text: '' });
    if (file.size > MAX) return setMsg({ type: 'error', text: 'File is too large (25 MB max).' });
    setBusy(kind);
    const safe = file.name.replace(/[^\w.\-]+/g, '_');
    const path = `${folder}/${kind}__${Date.now()}__${safe}`;
    const { error } = await supabase.storage.from(REPORTS_BUCKET).upload(path, file);
    if (error) {
      setBusy('');
      return setMsg({ type: 'error', text: `Upload failed: ${error.message}` });
    }
    // Remove the report it replaces (only after the new one is safely uploaded).
    const old = files[kind];
    if (old) await supabase.storage.from(REPORTS_BUCKET).remove([old.path]);
    setBusy('');
    setMsg({ type: 'ok', text: 'Report uploaded.' });
    load();
  };

  return (
    <div className="space-y-2">
      <p className="text-xs font-bold uppercase tracking-wide text-secondary-500">Plagiarism &amp; AI reports</p>
      {KINDS.map(({ key, label }) => {
        const f = files[key];
        return (
          <div key={key} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-secondary-200 px-3 py-2 dark:border-secondary-700">
            <div className="min-w-0">
              <p className="text-xs font-semibold text-secondary-700 dark:text-secondary-200">{label}</p>
              {f ? (
                <button type="button" onClick={() => open(f.path)} className="mt-0.5 inline-flex max-w-full items-center gap-1 truncate text-xs font-semibold text-primary-600 hover:underline">
                  <FileText className="h-3.5 w-3.5 shrink-0" /> <span className="truncate">{displayName(f.name)}</span>
                </button>
              ) : (
                <p className="mt-0.5 text-xs text-secondary-400">{editable ? 'Not uploaded yet.' : 'Not uploaded by the reviewer.'}</p>
              )}
            </div>
            {editable && (
              <label className={`inline-flex cursor-pointer items-center gap-1 rounded-lg border border-secondary-300 px-3 py-1.5 text-xs font-semibold text-secondary-700 hover:bg-secondary-50 dark:border-secondary-600 dark:text-secondary-200 ${busy ? 'pointer-events-none opacity-60' : ''}`}>
                <Upload className="h-3.5 w-3.5" /> {busy === key ? 'Uploading...' : f ? 'Replace' : 'Upload'}
                <input type="file" accept={ACCEPT} className="hidden" disabled={Boolean(busy)} onChange={(e) => { upload(key, e.target.files?.[0]); e.target.value = ''; }} />
              </label>
            )}
          </div>
        );
      })}
      {msg.text && <p role={msg.type === 'error' ? 'alert' : 'status'} className={`text-xs font-semibold ${msg.type === 'error' ? 'text-red-600' : 'text-emerald-700'}`}>{msg.text}</p>}
    </div>
  );
}
