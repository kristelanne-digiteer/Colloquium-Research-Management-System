import { useState, useRef } from 'react'

const MAX = 10 * 1024 * 1024
const EMPTY = { title: '', abstract: '', keywords: '', authors: '', emails: '', affil: '' }

const PATHS = {
  edit: 'M4 20h4L19 9l-4-4L4 16zM13 7l4 4',
  doc: 'M6 3h8l4 4v14H6zM9 12h6M9 16h6M9 8h3',
  reset: 'M20 12a8 8 0 11-2.5-5.8M20 4v5h-5',
  cloud: 'M7 18a4.5 4.5 0 01-.5-9 6 6 0 0111.5 1.5A3.8 3.8 0 0117.5 18zm5-9l-4 4h3v3h2v-3h3z',
  folder: 'M3 6a2 2 0 012-2h5l2 2h7a2 2 0 012 2v1H3zM3 10h19l-2 9H5z',
  shield: 'M12 2l8 3v6c0 5-3.5 9-8 11-4.5-2-8-6-8-11V5zm-1 13l6-6-1.4-1.4L11 12.2 8.9 10.1 7.5 11.5z',
  send: 'M2 12L22 3l-4 18-6-5-3 4v-6l9-8-11 6z',
}
const FILLED = ['cloud', 'folder', 'shield', 'send']

function Icon({ name, className }) {
  const filled = FILLED.includes(name)
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill={filled ? 'currentColor' : 'none'}
      stroke={filled ? 'none' : 'currentColor'}
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={PATHS[name]} />
    </svg>
  )
}

function DropZone({ title, icon, multiple, files, onFiles, children, hint }) {
  const inputRef = useRef(null)
  const [over, setOver] = useState(false)
  const [error, setError] = useState('')

  const handle = (list) => {
    const ok = []
    const bad = []
    Array.from(list).forEach((f) => {
      if (f.type !== 'application/pdf' && !/\.pdf$/i.test(f.name)) bad.push(`${f.name} is not a PDF`)
      else if (f.size > MAX) bad.push(`${f.name} is over 10 MB`)
      else ok.push(f)
    })
    setError(bad.join('; '))
    if (ok.length) onFiles(multiple ? ok : [ok[0]])
  }

  return (
    <div className="upload">
      <h4><Icon name={icon} />{title}</h4>
      <div
        className={`drop${over ? ' over' : ''}`}
        onDragOver={(e) => { e.preventDefault(); setOver(true) }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => { e.preventDefault(); setOver(false); handle(e.dataTransfer.files) }}
      >
        <Icon name="cloud" className="cloud" />
        {children}
        <button type="button" className="browse" onClick={() => inputRef.current.click()}>
          <Icon name="folder" />Browse Files
        </button>
        <div className="small" style={{ marginTop: 8 }}>{hint}</div>
        <div className={`fname${error ? ' err' : ''}`} aria-live="polite">
          {error || files.map((f) => f.name).join(', ')}
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf"
          multiple={multiple}
          hidden
          onChange={(e) => handle(e.target.files)}
        />
      </div>
    </div>
  )
}

export default function AuthorSubmissionForm() {
  const [form, setForm] = useState(EMPTY)
  const [mainPaper, setMainPaper] = useState([])
  const [reports, setReports] = useState([])
  const [toast, setToast] = useState('')

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value })
  const notify = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000) }

  const reset = () => { setForm(EMPTY); setMainPaper([]); setReports([]) }

  const submit = (e) => {
    e.preventDefault()
    if (Object.values(form).some((v) => !v.trim())) return notify('Fill in all required fields marked with *.')
    if (!mainPaper.length) return notify('Upload your main paper as a PDF.')

    // Send to your backend (PHP, Node, etc.)
    const data = new FormData()
    Object.entries(form).forEach(([k, v]) => data.append(k, v))
    data.append('main_paper', mainPaper[0])
    reports.forEach((f) => data.append('reports[]', f))
    // fetch('http://localhost/your-api/submit.php', { method: 'POST', body: data })

    notify('Paper submitted.')
  }

  return (
    <section className="panel">
      <div className="panel-head">
        <div className="badge sm"><Icon name="edit" /></div>
        <div>
          <h3>Author Submission Form</h3>
          <p>Fill out the details below to submit your research paper.</p>
        </div>
      </div>

      <form onSubmit={submit} noValidate>
        <div className="grid">
          <div>
            <div className="field">
              <label htmlFor="title"><i>*</i>Title</label>
              <input id="title" value={form.title} onChange={set('title')} placeholder="Enter your paper title…" />
            </div>
            <div className="field counter">
              <label htmlFor="abstract"><i>*</i>Abstract</label>
              <textarea id="abstract" maxLength={1000} value={form.abstract} onChange={set('abstract')}
                placeholder="Provide a brief summary of your research…" />
              <span>{form.abstract.length} / 1000</span>
            </div>
            <div className="field">
              <label htmlFor="keywords"><i>*</i>Keywords</label>
              <input id="keywords" value={form.keywords} onChange={set('keywords')} placeholder="Enter keywords, separated by commas…" />
            </div>
            <div className="two field">
              <div>
                <label htmlFor="authors"><i>*</i>Author Names</label>
                <input id="authors" value={form.authors} onChange={set('authors')} placeholder="e.g. Juan Dela Cruz, Maria Santos" />
              </div>
              <div>
                <label htmlFor="emails"><i>*</i>Email Addresses</label>
                <input id="emails" value={form.emails} onChange={set('emails')} placeholder="e.g. juan@email.com" />
              </div>
            </div>
            <div className="field">
              <label htmlFor="affil"><i>*</i>Affiliations</label>
              <input id="affil" value={form.affil} onChange={set('affil')} placeholder="e.g. Polytechnic University of the Philippines" />
            </div>
          </div>

          <div className="rule" />

          <div>
            <DropZone title="Main Paper" icon="doc" files={mainPaper} onFiles={setMainPaper}
              hint="PDF only • Max size: 10 MB">
              <div className="big">Drag and drop your PDF file here</div>
              <div className="small">or</div>
            </DropZone>
            <DropZone title="Plagiarism & AI Reports" icon="shield" multiple files={reports} onFiles={setReports}
              hint="PDF only • Max size: 10 MB each">
              <div className="big">Upload your Plagiarism Report and<br />AI Detection Report (PDF)</div>
            </DropZone>
          </div>
        </div>

        <div className="actions">
          <button type="button" className="btn ghost" onClick={reset}><Icon name="reset" />Reset Form</button>
          <button type="submit" className="btn primary"><Icon name="send" />Submit Paper</button>
        </div>
      </form>

      {toast && <div className="toast show" role="status">{toast}</div>}
    </section>
  )
}