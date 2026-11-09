const crypto = require('crypto');
const express = require('express');
const { notify, EVENT_TYPES } = require('../services/notificationService');

const router = express.Router();

// Only trusted server-side callers (your teammates' modules) may trigger notifications.
function requireApiKey(req, res, next) {
  const expected = process.env.NOTIFY_API_KEY;
  if (!expected) return res.status(503).json({ error: 'NOTIFY_API_KEY is not configured.' });

  const given = Buffer.from(String(req.get('x-api-key') || ''));
  const want = Buffer.from(expected);
  if (given.length !== want.length || !crypto.timingSafeEqual(given, want)) {
    return res.status(401).json({ error: 'Invalid API key.' });
  }
  next();
}

// POST /api/notifications/trigger
// body: { type, userId, data, scheduledFor?, sendEmail? }
router.post('/trigger', requireApiKey, async (req, res) => {
  try {
    const { type, userId, data, scheduledFor, sendEmail } = req.body || {};
    const row = await notify({
      type,
      userId,
      data: data || {},
      scheduledFor,
      sendEmail: sendEmail !== false,
    });
    res.status(202).json({ message: 'Notification queued.', id: row.id });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ error: err.message });
    console.error('[Notifications] trigger failed:', err);
    res.status(500).json({ error: 'Could not queue notification.' });
  }
});

// GET /api/notifications/types - handy for teammates
router.get('/types', (req, res) => res.json({ types: EVENT_TYPES }));

module.exports = router;