import { useEffect, useState } from 'react';
import { Download, FileText } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { MANUSCRIPT_BUCKET, fileLabel, folderOf } from '../../lib/db';

// Shows the file the author uploaded (PDF inline, anything else as a download link).
// Reviewers can read it only while the paper is assigned to them (storage policy "ms reviewer read").
export default function ManuscriptViewer({ authorId, submissionId, height = '70vh', refreshKey = 0 }) {
  const [state, setState] = useState({ loading: true, file: null, url: '', error: '' });

  useEffect(() => {
    let alive = true;
    (async () => {
      setState({ loading: true, file: null, url: '', error: '' });
      const folder = folderOf(authorId, submissionId);
      const { data: files, error } = await supabase.storage.from(MANUSCRIPT_BUCKET).list(folder, { sortBy: { column: 'created_at', order: 'desc' } });
      if (!alive) return;
      if (error) return setState({ loading: false, file: null, url: '', error: error.message });
      const file = (files ?? []).find((f) => f.name && f.id);
      if (!file) return setState({ loading: false, file: null, url: '', error: '' });
      const { data, error: urlError } = await supabase.storage.from(MANUSCRIPT_BUCKET).createSignedUrl(`${folder}/${file.name}`, 3600);
      if (!alive) return;
      setState({ loading: false, file, url: data?.signedUrl ?? '', error: urlError?.message ?? '' });
    })();
    return () => { alive = false; };
  }, [authorId, submissionId, refreshKey]);

  if (state.loading) return <p className="p-6 text-center text-sm text-secondary-500">Loading manuscript...</p>;
  if (state.error) return <p role="alert" className="p-6 text-center text-sm text-red-600">Could not open the manuscript: {state.error}</p>;
  if (!state.file) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 p-10 text-center text-sm text-secondary-500">
        <FileText className="h-8 w-8 text-secondary-300" />
        The author has not uploaded a manuscript file for this paper.
      </div>
    );
  }
  const isPdf = /\.pdf$/i.test(state.file.name);
  return (
    <div>
      <div className="flex items-center justify-between gap-3 border-b border-secondary-200 px-4 py-2 text-xs dark:border-secondary-800">
        <span className="truncate font-semibold">{fileLabel(state.file.name)}</span>
        <a href={state.url} target="_blank" rel="noreferrer" download className="inline-flex items-center gap-1 font-semibold text-primary-600 hover:underline">
          <Download className="h-3.5 w-3.5" /> Download
        </a>
      </div>
      {isPdf ? (
        <iframe title="Manuscript" src={state.url} className="w-full" style={{ height }} />
      ) : (
        <p className="p-6 text-center text-sm text-secondary-500">This file type cannot be previewed here. Use Download to open it.</p>
      )}
    </div>
  );
}
