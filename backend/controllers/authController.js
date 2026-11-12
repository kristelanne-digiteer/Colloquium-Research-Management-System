import 'dotenv/config';
import crypto from 'crypto';
import nodemailer from 'nodemailer';
import PDFDocument from 'pdfkit';
import { createClient } from '@supabase/supabase-js';

// ------------------------------------------------------------ clients
// Service-role key = server only. NEVER prefix it with VITE_ (it would leak to the browser).
const supabase = createClient(
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const SMTP_PORT = parseInt(process.env.SMTP_PORT || '587', 10);
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: SMTP_PORT,
  secure: SMTP_PORT === 465,
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
});

const FROM = process.env.EMAIL_FROM || `"Colloquium Research System" <${process.env.SMTP_USER}>`;
// Read at call time so the Vite plugin can set it to the port each teammate's dev server actually uses.
const appUrl = () => process.env.APP_URL || 'http://localhost:5173';
const ADMIN_ROLES = ['ADMIN', 'EC_CHAIR'];
const MAX_EMAIL_ATTEMPTS = 3;

const esc = (s) =>
  String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// Throws on failure (auth flows need the error).
const sendMail = (to, subject, html) => transporter.sendMail({ from: FROM, to, subject, html });

const pinHtml = (heading, pin) => `
  <div style="font-family:Arial,sans-serif;padding:20px;color:#333">
    <h2 style="color:#1B3C53">${heading}</h2>
    <p>Your 6-digit code is:</p>
    <p style="font-size:30px;font-weight:bold;letter-spacing:8px">${pin}</p>
    <p>It expires in 10 minutes. If this wasn't you, ignore this email.</p>
  </div>`;

const emailService = {
  sendVerificationPin: (to, pin) => sendMail(to, 'Colloquium: your verification code', pinHtml('Verify your account', pin)),
  sendPasswordResetCode: (to, pin) => sendMail(to, 'Colloquium: your password reset code', pinHtml('Reset your password', pin)),
};

const PIN_TTL_MINUTES = 10;
const MAX_ATTEMPTS = 5;
const RESEND_COOLDOWN_SECONDS = 60;
const PIN_SECRET = process.env.PIN_SECRET || 'dev-only-change-me';

// ---------------------------------------------------------------- helpers

const normalizeEmail = (email) => String(email || '').trim().toLowerCase();
const isEmail = (v) => /^\S+@\S+\.\S+$/.test(v);

// 6-digit PIN: 100000 - 999999
const generatePin = () => crypto.randomInt(100000, 1000000).toString();

const hashPin = (email, purpose, pin) =>
  crypto.createHmac('sha256', PIN_SECRET).update(`${email}:${purpose}:${pin}`).digest('hex');

const safeEqual = (a, b) => {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  return ba.length === bb.length && crypto.timingSafeEqual(ba, bb);
};

const httpError = (status, message) => Object.assign(new Error(message), { status });

const sendError = (res, err, fallback) => {
  if (err.status) return res.status(err.status).json({ error: err.message });
  console.error(`[Auth] ${fallback}`, err);
  return res.status(500).json({
    error: fallback,
    details: process.env.NODE_ENV === 'production' ? undefined : err.message,
  });
};

async function findUserByEmail(email) {
  const perPage = 200;
  for (let page = 1; page <= 50; page++) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage });
    if (error) throw error;
    const found = data.users.find((u) => (u.email || '').toLowerCase() === email);
    if (found) return found;
    if (data.users.length < perPage) return null;
  }
  return null;
}

async function getLatestPin(email, purpose, { onlyActive = false } = {}) {
  let q = supabase
    .from('email_verifications')
    .select('*')
    .eq('email', email)
    .eq('purpose', purpose);
  if (onlyActive) q = q.eq('consumed', false);
  const { data, error } = await q.order('created_at', { ascending: false }).limit(1);
  if (error) throw error;
  return data && data.length ? data[0] : null;
}

async function issuePin(email, purpose) {
  const latest = await getLatestPin(email, purpose);
  if (latest) {
    const ageSeconds = (Date.now() - new Date(latest.created_at).getTime()) / 1000;
    if (ageSeconds < RESEND_COOLDOWN_SECONDS) {
      const wait = Math.ceil(RESEND_COOLDOWN_SECONDS - ageSeconds);
      throw httpError(429, `Please wait ${wait}s before requesting a new code.`);
    }
  }

  const { error: clearError } = await supabase
    .from('email_verifications')
    .update({ consumed: true })
    .eq('email', email)
    .eq('purpose', purpose)
    .eq('consumed', false);
  if (clearError) throw clearError;

  const pin = generatePin();
  const { error: insertError } = await supabase.from('email_verifications').insert({
    email,
    purpose,
    pin_hash: hashPin(email, purpose, pin),
    expires_at: new Date(Date.now() + PIN_TTL_MINUTES * 60 * 1000).toISOString(),
  });
  if (insertError) throw insertError;

  return pin;
}

async function consumePin(email, purpose, pin) {
  const rec = await getLatestPin(email, purpose, { onlyActive: true });
  if (!rec) throw httpError(400, 'Invalid or expired PIN code.');

  if (new Date() > new Date(rec.expires_at)) {
    throw httpError(400, 'Invalid or expired PIN code.');
  }
  if (rec.attempts >= MAX_ATTEMPTS) {
    throw httpError(429, 'Too many wrong attempts. Please request a new code.');
  }

  const given = hashPin(email, purpose, String(pin || '').trim());
  if (!safeEqual(given, rec.pin_hash)) {
    await supabase
      .from('email_verifications')
      .update({ attempts: rec.attempts + 1 })
      .eq('id', rec.id);
    throw httpError(400, 'Invalid or expired PIN code.');
  }

  const { error } = await supabase
    .from('email_verifications')
    .update({ consumed: true })
    .eq('id', rec.id);
  if (error) throw error;
}

// ------------------------------------------------------------- endpoints

export const register = async (req, res) => {
  try {
    const { name, phone_number, password, affiliation, field_of_study, roles } = req.body;
    const email = normalizeEmail(req.body.email);

    if (!name || !isEmail(email)) throw httpError(400, 'Name and a valid email are required.');
    if (!password || password.length < 8) {
      throw httpError(400, 'Password must be at least 8 characters.');
    }

    const metadata = {
      full_name: name,
      affiliation: affiliation || null,
      field_of_study: field_of_study || null,
      phone_number: phone_number || null,
      roles: roles || ['Author'],
    };

    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: false,
      user_metadata: metadata,
    });

    if (error) {
      const exists = error.code === 'email_exists' || /already|registered/i.test(error.message);
      if (!exists) throw httpError(400, error.message);

      const existing = await findUserByEmail(email);
      if (existing && !existing.email_confirmed_at) {
        const upd = await supabase.auth.admin.updateUserById(existing.id, {
          password,
          user_metadata: metadata,
        });
        if (upd.error) throw upd.error;
      } else {
        throw httpError(400, 'Email already registered.');
      }
    }

    const pin = await issuePin(email, 'signup');
    await emailService.sendVerificationPin(email, pin);

    res.status(201).json({
      message: 'Registration successful. Please check your email for the 6-digit verification PIN.',
      email,
      expires_in: `${PIN_TTL_MINUTES} minutes`,
    });
  } catch (err) {
    sendError(res, err, 'Server error during registration.');
  }
};

export const verifyPin = async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email);
    const { pin } = req.body;
    if (!isEmail(email) || !pin) throw httpError(400, 'Email and PIN are required.');

    const user = await findUserByEmail(email);
    if (!user) throw httpError(404, 'User not found.');
    if (user.email_confirmed_at) throw httpError(400, 'Account is already verified.');

    await consumePin(email, 'signup', pin);

    const { error } = await supabase.auth.admin.updateUserById(user.id, { email_confirm: true });
    if (error) throw error;

    res.status(200).json({
      message: 'Account successfully verified! You can now log in.',
      user: {
        id: user.id,
        name: user.user_metadata?.full_name,
        email,
        roles: user.user_metadata?.roles,
        is_verified: true,
      },
    });
  } catch (err) {
    sendError(res, err, 'Verification failed.');
  }
};

export const resendPin = async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email);
    if (!isEmail(email)) throw httpError(400, 'A valid email is required.');

    const user = await findUserByEmail(email);
    if (user && !user.email_confirmed_at) {
      const pin = await issuePin(email, 'signup');
      await emailService.sendVerificationPin(email, pin);
    }
    res.status(200).json({ message: 'If the account needs verification, a new code has been sent.' });
  } catch (err) {
    sendError(res, err, 'Could not resend the code.');
  }
};

export const forgotPassword = async (req, res) => {
  const generic = { message: 'If the account exists, a reset code has been sent.' };
  try {
    const email = normalizeEmail(req.body.identifier || req.body.email);
    if (!isEmail(email)) throw httpError(400, 'A valid email is required.');

    const user = await findUserByEmail(email);
    if (user && user.email_confirmed_at) {
      try {
        const code = await issuePin(email, 'recovery');
        await emailService.sendPasswordResetCode(email, code);
      } catch (err) {
        if (err.status !== 429) throw err;
      }
    }
    res.status(200).json(generic);
  } catch (err) {
    sendError(res, err, 'Error processing forgot password request.');
  }
};

export const resetPassword = async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email);
    const { code, newPassword } = req.body;

    if (!isEmail(email) || !code) throw httpError(400, 'Email and reset code are required.');
    if (!newPassword || newPassword.length < 8) {
      throw httpError(400, 'Password must be at least 8 characters.');
    }

    const user = await findUserByEmail(email);
    if (!user) throw httpError(400, 'Invalid reset code or email.');

    await consumePin(email, 'recovery', code);

    const { error } = await supabase.auth.admin.updateUserById(user.id, { password: newPassword });
    if (error) throw error;

    res.status(200).json({ message: 'Password successfully reset. Please log in.' });
  } catch (err) {
    sendError(res, err, 'Password reset failed.');
  }
};

// =====================================================================
// NOTIFICATION SERVICE (Stage 1 acceptance, Stage 2 endorsement, rejection)
// =====================================================================

const DECISIONS = {
  ACCEPTED: {
    type: 'acceptance_stage_1',
    title: 'Accepted for PRESENTATION',
    color: '#059669',
    subject: 'Colloquium: Accepted for PRESENTATION (Stage 1)',
    body: (t) => `Good news! Your paper <em>"${t}"</em> has met the majority rule and is officially <strong>Accepted for PRESENTATION</strong> (Stage 1).`,
    message: (t) => `Your paper "${t}" is Accepted for PRESENTATION.`,
  },
  ENDORSED: {
    type: 'endorsement_stage_2',
    title: 'ENDORSED for publication',
    color: '#2563EB',
    subject: 'Colloquium: ENDORSED for Publication (Stage 2)',
    body: (t) => `Your paper <em>"${t}"</em> received publisher endorsement and is now <strong>ENDORSED for publication</strong> (Stage 2).`,
    message: (t) => `Your paper "${t}" is ENDORSED for publication.`,
  },
  REVISIONS_REQUESTED: {
    type: 'revisions_requested',
    title: 'Revisions requested',
    color: '#D97706',
    subject: 'Colloquium: Revisions requested for your paper',
    body: (t) => `The review committee has requested <strong>revisions</strong> for your paper <em>"${t}"</em>. Please review the reviewer feedback and resubmit your revised package.`,
    message: (t) => `Revisions requested for "${t}".`,
  },
  REJECTED: {
    type: 'rejected',
    title: 'Submission decision: Not accepted',
    color: '#DC2626',
    subject: 'Colloquium: Submission decision',
    body: (t) => `After review, your paper <em>"${t}"</em> was <strong>not accepted</strong>.`,
    message: (t) => `Your paper "${t}" was not accepted.`,
  },
};

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const decisionHtml = (d, name, title, extra, attached = false) => `
  <div style="font-family:Arial,sans-serif;padding:20px;color:#333">
    <h2 style="color:${d.color}">${esc(d.title)}</h2>
    <p>Dear <strong>${esc(name || 'Researcher')}</strong>,</p>
    <p>${d.body(esc(title))}</p>
    ${extra ? `<p>${esc(extra)}</p>` : ''}
    ${attached ? '<p>Your official decision letter is attached as a PDF.</p>' : ''}
    <p><a href="${appUrl()}/notifications">Open your dashboard</a></p>
    <p>Colloquium Research Management Committee</p>
  </div>`;

async function deliverNotificationEmail(row, html, subject, attachments) {
  try {
    await transporter.sendMail({ from: FROM, to: row.recipient_email, subject, html, attachments });
    await supabase.from('notifications')
      .update({ email_status: 'sent', email_attempts: row.email_attempts + 1 }).eq('id', row.id);
    return true;
  } catch (err) {
    console.error('[Notify] email failed:', err.message);
    await supabase.from('notifications')
      .update({ email_status: 'failed', email_attempts: row.email_attempts + 1 }).eq('id', row.id);
    return false;
  }
}


// ---- Decision letter PDF (basic layout built from letters.content; attached to the email)
function buildLetterPdf(letter) {
  return new Promise((resolve, reject) => {
    let c = {};
    try { c = JSON.parse(letter.content); } catch { c = { body: letter.content }; }
    const doc = new PDFDocument({ size: 'A4', margin: 64 });
    const chunks = [];
    doc.on('data', (d) => chunks.push(d));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    doc.font('Helvetica-Bold').fontSize(16).text('Colloquium Research Management System', { align: 'center' });
    doc.moveDown(0.5).font('Helvetica').fontSize(10).fillColor('#555')
      .text(`Ref: ${letter.reference_code || ''}   |   ${new Date(letter.generated_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`, { align: 'center' });
    doc.moveDown(2).fillColor('#000').font('Helvetica-Bold').fontSize(13).text(c.title || 'Official Decision Letter');
    doc.moveDown().font('Helvetica').fontSize(11).text(c.body || '', { align: 'left', lineGap: 3 });

    const sigs = Array.isArray(letter.signatories_data) && letter.signatories_data.length
      ? letter.signatories_data
      : [{ name: letter.signatory_name, position: letter.signatory_position }];
    doc.moveDown(3);
    sigs.forEach((sg) => {
      doc.font('Helvetica-Bold').fontSize(11).text(sg.name || '');
      doc.font('Helvetica').fontSize(10).fillColor('#555').text(sg.position || '').fillColor('#000');
      doc.moveDown(1.5);
    });
    doc.end();
  });
}

// notifications rows from the chair letter editor carry no submission id,
// so match the author's submission by the paper title quoted in the message.
async function findLetterFor(row) {
  if (!row.user_id) return {};
  const { data: subs } = await supabase.from('submissions').select('id, title').eq('author_id', row.user_id);
  const sub = (subs || []).find((x) => row.message?.includes(`"${x.title}"`));
  if (!sub) return {};
  const { data } = await supabase.from('letters').select('*')
    .eq('submission_id', sub.id).order('generated_at', { ascending: false }).limit(1);
  return { sub, letter: data?.[0] || null };
}

// "Official Decision Notice: REVISIONS REQUESTED" -> a key of DECISIONS (DECLINED reuses REJECTED).
function decisionKeyFromTitle(title) {
  const m = /Notice:\s*(.+)$/i.exec(title || '');
  const k = (m?.[1] || '').trim().toUpperCase().replace(/\s+/g, '_');
  return k === 'DECLINED' ? 'REJECTED' : DECISIONS[k] ? k : null;
}

// Core function: in-app notification (notifications table) + email to the author.
// submissionRef = submissions.id (uuid) or tracking_number.
export async function notifyAuthorDecision(submissionRef, decisionKey, extra = '') {
  const d = DECISIONS[decisionKey];
  if (!d) throw httpError(400, 'Invalid decision.');

  const col = UUID_RE.test(submissionRef) ? 'id' : 'tracking_number';
  const { data: sub, error: subErr } = await supabase
    .from('submissions').select('id, author_id, title, tracking_number').eq(col, submissionRef).maybeSingle();
  if (subErr) throw subErr;
  if (!sub) throw httpError(404, 'Submission not found.');

  const [{ data: au, error: auErr }, { data: prof }] = await Promise.all([
    supabase.auth.admin.getUserById(sub.author_id),
    supabase.from('profiles').select('full_name, notification_preferences').eq('id', sub.author_id).maybeSingle(),
  ]);
  if (auErr || !au?.user?.email) throw httpError(404, 'Author email not found.');

  const prefs = prof?.notification_preferences || {};
  const wantsEmail = prefs.email !== false && prefs.submissionUpdates !== false;

  const { data: row, error: insErr } = await supabase.from('notifications').insert({
    user_id: sub.author_id,
    recipient_email: au.user.email,
    type: d.type,
    title: d.title,
    message: d.message(sub.title),
    data: { submission_id: sub.id, tracking_number: sub.tracking_number, decision: decisionKey },
    send_email: wantsEmail,
    email_status: wantsEmail ? 'pending' : 'skipped',
  }).select().single();
  if (insErr) throw insErr;

  let emailed = false;
  if (wantsEmail) {
    emailed = await deliverNotificationEmail(row, decisionHtml(d, prof?.full_name, sub.title, extra), d.subject);
  }
  return { notification_id: row.id, emailed, skipped_email: !wantsEmail };
}

// Chair-only guard: Bearer <supabase access token> + profiles.roles contains ADMIN / EC_CHAIR.
async function requireChair(req) {
  const token = (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  if (!token) throw httpError(401, 'Missing token.');
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data?.user) throw httpError(401, 'Invalid session.');
  const { data: p } = await supabase.from('profiles').select('roles').eq('id', data.user.id).maybeSingle();
  if (!(p?.roles || []).some((r) => ADMIN_ROLES.includes(String(r).toUpperCase()))) {
    throw httpError(403, 'Only the EC Chair can send decision notifications.');
  }
}

// POST /api/auth/notify-decision   body: { submissionId, decision: 'ACCEPTED'|'ENDORSED'|'REJECTED', note? }
export const notifyDecision = async (req, res) => {
  try {
    await requireChair(req);
    const { submissionId, decision, note } = req.body;
    if (!submissionId || !decision) throw httpError(400, 'submissionId and decision are required.');
    const result = await notifyAuthorDecision(submissionId, String(decision).toUpperCase(), note);
    res.status(200).json({ success: true, ...result });
  } catch (err) {
    sendError(res, err, 'Could not send notification.');
  }
};

// Kept for the original spec names.
export const sendAcceptanceNotification = (req, res) => {
  req.body.decision = 'ACCEPTED';
  return notifyDecision(req, res);
};
export const sendEndorsementNotification = (req, res) => {
  req.body.decision = 'ENDORSED';
  return notifyDecision(req, res);
};

// Retry worker: resends pending/failed emails (max 3 tries, 20 per run = light on free quota).
export async function processPendingEmails() {
  const { data: rows } = await supabase.from('notifications')
    .select('*').eq('send_email', true).in('email_status', ['pending', 'failed'])
    .lt('email_attempts', MAX_EMAIL_ATTEMPTS).lte('scheduled_for', new Date().toISOString())
    .not('recipient_email', 'is', null).limit(20);

  for (const r of rows || []) {
    let attachments, html, subject = `Colloquium: ${r.title}`;
    try {
      const isNotice = r.type === 'DECISION_NOTICE';
      const { sub, letter } = isNotice ? await findLetterFor(r) : {};
      if (letter) {
        attachments = [{ filename: `${letter.reference_code || 'decision-letter'}.pdf`, content: await buildLetterPdf(letter), contentType: 'application/pdf' }];
      }
      const d = isNotice ? DECISIONS[decisionKeyFromTitle(r.title)] : null;
      if (d) {
        const paper = sub?.title || /"(.+)"/.exec(r.message || '')?.[1] || '';
        const { data: prof } = await supabase.from('profiles').select('full_name').eq('id', r.user_id).maybeSingle();
        html = decisionHtml(d, prof?.full_name, paper, '', !!attachments);
        subject = d.subject;
      }
    } catch (e) {
      console.error('[Notify] PDF/template build failed, sending basic email:', e.message);
    }
    html ||= `<div style="font-family:Arial,sans-serif;padding:20px"><h3>${esc(r.title)}</h3><p>${esc(r.message)}</p><p><a href="${appUrl()}/notifications">Go to this link </a></p></div>`;
    await deliverNotificationEmail(r, html, subject, attachments);
  }
}

export const startNotificationWorker = (everyMs = 5 * 60 * 1000) => {
  const run = () => processPendingEmails().catch((e) => console.error('[Notify] worker error:', e.message));
  run();
  return setInterval(run, everyMs);
};