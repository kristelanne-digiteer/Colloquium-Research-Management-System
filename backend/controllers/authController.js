const crypto = require('crypto');
const supabase = require('../config/supabase');
const emailService = require('../services/emailService');

const PIN_TTL_MINUTES = 10;
const MAX_ATTEMPTS = 5;
const RESEND_COOLDOWN_SECONDS = 60;
const PIN_SECRET = process.env.PIN_SECRET || 'dev-only-change-me';

// ---------------------------------------------------------------- helpers

const normalizeEmail = (email) => String(email || '').trim().toLowerCase();
const isEmail = (v) => /^\S+@\S+\.\S+$/.test(v);

// 5-digit PIN: 10000 - 99999
const generatePin = () => crypto.randomInt(10000, 100000).toString();

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

// Supabase has no "get user by email" admin call, so we page through users.
// Fine for a class project; swap for an RPC/SQL lookup if the user count grows.
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

  // Invalidate older unused PINs
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

// Throws an httpError if the PIN is wrong/expired/locked. Marks it used when correct.
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

exports.register = async (req, res) => {
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

    // Create the Supabase Auth user, UNCONFIRMED. Supabase does not email anyone for this call.
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: false,
      user_metadata: metadata,
    });

    if (error) {
      const exists = error.code === 'email_exists' || /already|registered/i.test(error.message);
      if (!exists) throw httpError(400, error.message);

      // Email exists: if it never finished verification, let them retry; otherwise block.
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
      message: 'Registration successful. Please check your email for the 5-digit verification PIN.',
      email,
      expires_in: `${PIN_TTL_MINUTES} minutes`,
    });
  } catch (err) {
    sendError(res, err, 'Server error during registration.');
  }
};

exports.verifyPin = async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email);
    const { pin } = req.body;
    if (!isEmail(email) || !pin) throw httpError(400, 'Email and PIN are required.');

    const user = await findUserByEmail(email);
    if (!user) throw httpError(404, 'User not found.');
    if (user.email_confirmed_at) throw httpError(400, 'Account is already verified.');

    await consumePin(email, 'signup', pin);

    // Mark the email as confirmed in Supabase Auth so the user can now log in.
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

exports.resendPin = async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email);
    if (!isEmail(email)) throw httpError(400, 'A valid email is required.');

    const user = await findUserByEmail(email);
    // Same answer whether or not the account exists (prevents user enumeration)
    if (user && !user.email_confirmed_at) {
      const pin = await issuePin(email, 'signup');
      await emailService.sendVerificationPin(email, pin);
    }
    res.status(200).json({ message: 'If the account needs verification, a new code has been sent.' });
  } catch (err) {
    sendError(res, err, 'Could not resend the code.');
  }
};

exports.forgotPassword = async (req, res) => {
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
        if (err.status !== 429) throw err; // cooldown: still answer generically
      }
    }
    res.status(200).json(generic);
  } catch (err) {
    sendError(res, err, 'Error processing forgot password request.');
  }
};

exports.resetPassword = async (req, res) => {
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