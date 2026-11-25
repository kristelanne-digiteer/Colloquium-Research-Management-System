import * as auth from '../../backend/controllers/authController.js';

const handlers = {
  register: auth.register,
  'verify-pin': auth.verifyPin,
  'resend-pin': auth.resendPin,
  'forgot-password': auth.forgotPassword,
  'reset-password': auth.resetPassword,
  'notify-decision': auth.notifyDecision,
};

export default async function handler(req, res) {
  const { action } = req.query;
  const fn = handlers[action];

  if (req.method !== 'POST' || !fn) {
    return res.status(404).json({ error: 'Not found' });
  }

  return fn(req, res);
}