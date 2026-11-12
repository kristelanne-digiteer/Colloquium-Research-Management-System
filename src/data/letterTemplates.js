// Letter templates, mirrored from Colloquium_Letter_Templates.pdf.
// Placeholders: {tracking} {title} {author} {date} {due}
// `comments` = numbered reviewer comments (only used by revisions / rejection).

export const LETTER_TEMPLATES = {
  RECEIVED: {
    label: 'Received',
    badge: 'RECEIVED',
    heading: 'Submission received: {tracking}',
    intro:
      'Thank you for submitting your paper to Colloquium. We confirm that we have received it with the details below.',
    details: [['Tracking No.', '{tracking}'], ['Paper title', '{title}'], ['Author', '{author}'], ['Date received', '{date}']],
    body:
      'Your paper will now go through an initial screening by the editorial team. If it passes, it will be assigned to reviewers. Please keep your tracking number so you can follow the status of your submission and quote it in any correspondence with us.\n\nWe will contact you once a decision has been made.',
    comments: null,
    closing: 'Sincerely,',
  },
  INVITATION: {
    label: 'Review invitation',
    badge: 'REVIEW INVITATION',
    heading: 'Invitation to review: {tracking}',
    intro:
      'We would like to invite you to review a paper submitted to Colloquium, given your expertise in the subject area.',
    details: [['Tracking No.', '{tracking}'], ['Paper title', '{title}'], ['Author', '{author}'], ['Review due', '{due}']],
    body:
      "The abstract and full manuscript are available once you log in to the system. Please accept or decline this invitation as soon as you can so we can reassign the paper if needed. If you accept, we ask that you assess the paper's originality, methodology, clarity, and relevance, and submit your recommendation and comments by the due date above.\n\nPlease let us know if you notice any conflict of interest with the author. Reviews are kept confidential.\n\nThank you for your time and service to the community.",
    comments: null,
    closing: 'Sincerely,',
  },
  ACCEPTED: {
    label: 'Accepted',
    badge: 'ACCEPTED',
    heading: 'Your paper has been accepted: {tracking}',
    intro:
      'We are pleased to inform you that, after peer review, your paper has been accepted for presentation and publication in Colloquium.',
    details: [['Tracking No.', '{tracking}'], ['Paper title', '{title}'], ['Author', '{author}'], ['Decision', 'Accepted'], ['Decision date', '{date}']],
    body:
      'The reviewers and the editorial board found your work to be a valuable contribution. In the coming days we will send the next steps, including the final formatting guidelines, the camera-ready submission, and the presentation schedule.\n\nCongratulations, and thank you for choosing Colloquium.',
    comments: null,
    closing: 'Sincerely,',
  },
  REVISIONS: {
    label: 'Revisions requested',
    badge: 'REVISIONS REQUESTED',
    heading: 'Revisions requested: {tracking}',
    intro:
      'Thank you for submitting your paper to Colloquium. After peer review, the editorial board has decided that your paper requires revision before a final decision can be made.',
    details: [['Tracking No.', '{tracking}'], ['Paper title', '{title}'], ['Author', '{author}'], ['Decision', 'Revisions required'], ['Revised paper due', '{due}']],
    body:
      "Please address each comment in your revised manuscript and include a short response letter explaining the changes you made, or why you chose not to make a change. Replace your file in My Submissions using the same tracking number (no new submission is created). Papers received after the due date may not be considered.\n\nWe appreciate your effort and look forward to your revised paper.",
    comments: [
      'The problem statement is clear, but the related work section needs more recent references.',
      'Please explain how reviewer assignment avoids conflicts of interest.',
    ],
    closing: 'Sincerely,',
  },
  REJECTED: {
    label: 'Not accepted',
    badge: 'DECISION',
    heading: 'Decision on your submission: {tracking}',
    intro:
      'Thank you for submitting your paper to Colloquium and for the time and effort you put into it. After careful peer review, we regret to inform you that we are unable to accept your paper.',
    details: [['Tracking No.', '{tracking}'], ['Paper title', '{title}'], ['Author', '{author}'], ['Decision', 'Not accepted'], ['Decision date', '{date}']],
    body:
      'This decision was based on the reviewers’ evaluations. Their comments are below, in the hope that they help you improve your work. Once the comments are resolved you may resubmit by replacing your file.\n\nWe encourage you to consider this feedback and to submit your work to future calls. We wish you success in your research.',
    comments: ['The scope of the paper is outside the theme of this colloquium.'],
    closing: 'Sincerely,',
  },
};

export const fillPlaceholders = (text, vars) =>
  String(text ?? '').replace(/\{(\w+)\}/g, (_, k) => (vars[k] ?? `{${k}}`));

// Build the editable letter state from a template + paper.
export function buildLetter(templateKey, vars) {
  const t = LETTER_TEMPLATES[templateKey];
  const f = (s) => fillPlaceholders(s, vars);
  return {
    template: templateKey,
    badge: t.badge,
    heading: f(t.heading),
    date: vars.date,
    greeting: `Dear ${vars.author},`,
    intro: f(t.intro),
    details: t.details.map(([k, v]) => [k, f(v)]),
    body: f(t.body),
    comments: t.comments ? [...t.comments] : null,
    closing: t.closing,
    tracking: vars.tracking,
  };
}
