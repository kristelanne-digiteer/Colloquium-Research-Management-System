// Mock data ported from the vanilla EC Chair portal (app.js -> state).
// When the Supabase tables are ready, replace these with real queries inside context/chairContext.jsx.

export const initialSubmissions = [
  {
    id: 'EC-2026-089',
    title: 'AI-Driven Diagnostics in Clinical Trials: Privacy & Consent Standards',
    keywords: ['Artificial Intelligence', 'Bioethics', 'Data Privacy'],
    author: 'Dr. Clara Oswald',
    status: 'Approved',
    reviewsDone: 3,
    reviewsTotal: 3,
    consensus: 'Approved by All (3/3)',
  },
  {
    id: 'EC-2026-092',
    title: 'Gene-Editing Therapies for Rare Pediatric Autoimmune Conditions',
    keywords: ['CRISPR', 'Pediatrics', 'Gene Therapy'],
    author: 'Prof. Marcus Brody',
    status: 'For Review',
    reviewsDone: 1,
    reviewsTotal: 3,
    consensus: 'Pending 2 Reviews',
  },
  {
    id: 'EC-2026-095',
    title: 'Psychological Impact of Extended Isolation in Deep-Space Analogs',
    keywords: ['Behavioral Health', 'Space Medicine'],
    author: 'Dr. Elena Rostova',
    status: 'Resubmission',
    reviewsDone: 2,
    reviewsTotal: 3,
    consensus: 'Revision Requested',
  },
  {
    id: 'EC-2026-101',
    title: 'Neural Interface Telemetry: High-Frequency Brain-Computer Protocols',
    keywords: ['Neuroethics', 'Neuralink', 'BCI'],
    author: 'Dr. Arthur Pendelton',
    status: 'Rejected',
    reviewsDone: 3,
    reviewsTotal: 3,
    consensus: 'Rejected (2/3 Major Risks)',
  },
];

export const initialReviewers = [
  { id: 'r1', name: 'Prof. Sarah Jenkins', specialization: 'Biomedical Ethics', workloadCount: 2, assignedPapers: ['EC-2026-089', 'EC-2026-092'], initials: 'SJ' },
  { id: 'r2', name: 'Dr. Robert Chen', specialization: 'Clinical Trials & AI', workloadCount: 1, assignedPapers: ['EC-2026-089'], initials: 'RC' },
  { id: 'r3', name: 'Dr. Amara Okezie', specialization: 'Genomics & CRISPR', workloadCount: 0, assignedPapers: [], initials: 'AO' },
  { id: 'r4', name: 'Prof. David Vance', specialization: 'Neuroethics & BCI', workloadCount: 3, assignedPapers: ['EC-2026-089', 'EC-2026-095', 'EC-2026-101'], initials: 'DV' },
];

export const initialLetters = [
  { id: 'DOC-2026-001', type: 'Acceptance Letter', trackingId: 'EC-2026-089', author: 'Dr. Clara Oswald', date: 'May 12, 2026' },
  { id: 'DOC-2026-002', type: 'Endorsement Letter', trackingId: 'EC-2026-095', author: 'Dr. Elena Rostova', date: 'May 14, 2026' },
];
