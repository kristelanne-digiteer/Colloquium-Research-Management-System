/**
 * Email service (nodemailer over SMTP).
 * If SMTP is not configured, nothing is sent; with DEV_LOG_PIN=true the PIN is printed
 * in the terminal so you can still test the flow.
 */
const nodemailer = require('nodemailer');

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;
  const { SMTP_HOST, SMTP_USER, SMTP_PASS } = process.env;
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) return null;

  const port = Number(process.env.SMTP_PORT || 587);
  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port,
    secure: port === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });
  return transporter;
}

async function send({ to, subject, html }) {
  const t = getTransporter();
  if (!t) return { sent: false };
  await t.sendMail({
    from: process.env.MAIL_FROM || `"Colloquium System" <${process.env.SMTP_USER}>`,
    to,
    subject,
    html,
  });
  return { sent: true };
}

function devLog(label, to, code) {
  if (process.env.DEV_LOG_PIN === 'true') {
    console.log(`[Email Service][DEV] ${label} for ${to}: ${code}`);
  }
}

const esc = (v) =>
  String(v ?? '').replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])
  );

const pinBox = (code) =>
  `<h1 style="letter-spacing:8px;font-family:monospace;">${esc(code)}</h1>`;

// ------------------------------------------------------------ PIN emails

exports.sendVerificationPin = async (email, pin) => {
  const result = await send({
    to: email,
    subject: 'Your Verification PIN - Colloquium System',
    html:
      `<h3>Welcome to the Colloquium Research Management System</h3>` +
      `<p>Your verification PIN is:</p>${pinBox(pin)}` +
      `<p>This code expires in 10 minutes. If you didn't sign up, ignore this email.</p>`,
  });
  if (!result.sent) {
    console.warn('[Email Service] SMTP not configured - verification email was NOT sent.');
    devLog('Verification PIN', email, pin);
  }
  return result;
};

exports.sendPasswordResetCode = async (email, code) => {
  const result = await send({
    to: email,
    subject: 'Your Password Reset Code - Colloquium System',
    html:
      `<h3>Reset your Colloquium password</h3>` +
      `<p>Your reset code is:</p>${pinBox(code)}` +
      `<p>This code expires in 10 minutes. If you didn't request this, ignore this email.</p>`,
  });
  if (!result.sent) {
    console.warn('[Email Service] SMTP not configured - reset email was NOT sent.');
    devLog('Password reset code', email, code);
  }
  return result;
};

// ------------------------------------------------- notification templates
// Each template returns { title, message, subject, html }.
// title/message are plain text (shown in-app); html is escaped for email.

const make = (title, message, subject) => ({
  title,
  message,
  subject,
  html:
    `<h3>${esc(title)}</h3><p>${esc(message)}</p>` +
    `<p style="color:#64748b;font-size:12px;">Colloquium Research Management System</p>`,
});

const inConf = (d) => (d.conferenceName ? ` in ${d.conferenceName}` : '');

const templates = {
  submission_received: (d) =>
    make(
      'Submission received',
      `Your paper "${d.paperTitle}" (${d.trackingNumber}) was received${inConf(d)}.`,
      `Submission receipt - ${d.trackingNumber}`
    ),
  review_assigned: (d) =>
    make(
      'New review assignment',
      `You were assigned to review "${d.paperTitle}" (${d.trackingNumber})` +
        `${d.dueDate ? `. Review due: ${d.dueDate}` : ''}.`,
      `Review assignment - ${d.trackingNumber}`
    ),
  status_changed: (d) =>
    make(
      'Submission status updated',
      `The status of "${d.paperTitle}" (${d.trackingNumber}) is now: ${d.status}.`,
      `Status update - ${d.trackingNumber}`
    ),
  stage1_accepted: (d) =>
    make(
      'Accepted for PRESENTATION',
      `Congratulations! Your paper "${d.paperTitle}" (${d.trackingNumber}) is accepted for PRESENTATION${inConf(d)}.`,
      `Paper ${d.trackingNumber} accepted for presentation`
    ),
  stage2_endorsed: (d) =>
    make(
      'ENDORSED for publication',
      `Congratulations! Your paper "${d.paperTitle}" (${d.trackingNumber}) has been ENDORSED for publication.`,
      `Paper ${d.trackingNumber} endorsed for publication`
    ),
  deadline_reminder: (d) =>
    make(
      'Deadline reminder',
      `Reminder: ${d.deadlineName} is due ${d.dueDate}.`,
      `Deadline reminder - ${d.deadlineName}`
    ),
};

exports.templates = templates;

exports.sendNotificationEmail = async (to, type, data) => {
  const build = templates[type];
  if (!build) throw new Error(`Unknown notification type: ${type}`);
  const { subject, html } = build(data || {});
  return send({ to, subject, html });
};

// --- Collaborator Integration Triggers (Stage 1 & Stage 2 Notifications) ---
// Same signatures as before, now built on the shared templates.
exports.sendStage1AcceptanceEmail = (authorEmail, paperTitle, trackingNumber, conferenceName) =>
  exports.sendNotificationEmail(authorEmail, 'stage1_accepted', {
    paperTitle,
    trackingNumber,
    conferenceName,
  });

exports.sendStage2EndorsementEmail = (authorEmail, paperTitle, trackingNumber) =>
  exports.sendNotificationEmail(authorEmail, 'stage2_endorsed', { paperTitle, trackingNumber });