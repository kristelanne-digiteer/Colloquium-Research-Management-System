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

const pinBox = (code) =>
  `<h1 style="letter-spacing:8px;font-family:monospace;">${code}</h1>`;

exports.sendVerificationPin = async (email, pin) => {
  const result = await send({
    to: email,
    subject: 'Your 5-Digit Verification PIN - Colloquium System',
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

// --- Collaborator Integration Triggers (Stage 1 & Stage 2 Notifications) ---
exports.sendStage1AcceptanceEmail = async (authorEmail, paperTitle, trackingNumber, conferenceName) => {
  return send({
    to: authorEmail,
    subject: `Paper ${trackingNumber} accepted for presentation`,
    html:
      `<p>Congratulations, your paper <b>${paperTitle}</b> (${trackingNumber}) ` +
      `is accepted for PRESENTATION in ${conferenceName}.</p>`,
  });
};

exports.sendStage2EndorsementEmail = async (authorEmail, paperTitle, trackingNumber) => {
  return send({
    to: authorEmail,
    subject: `Paper ${trackingNumber} endorsed for publication`,
    html:
      `<p>Congratulations, your paper <b>${paperTitle}</b> (${trackingNumber}) ` +
      `will be ENDORSED for publication.</p>`,
  });
};