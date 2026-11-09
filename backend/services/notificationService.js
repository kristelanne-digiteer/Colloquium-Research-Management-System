/**
 * Notification trigger system.
 *
 * - notify(...)        : other modules call this when something happens
 *                        (event emitter entry point).
 * - notifications table: stores the in-app notification AND acts as a durable
 *                        email queue (email_status = pending/sent/failed/skipped).
 * - worker             : sends due emails right away (event) and every minute (cron-style),
 *                        which also covers scheduled deadline reminders and retries.
 *
 * No Redis or paid service needed, so it stays inside the free tier.
 */
const { EventEmitter } = require('events');
const supabase = require('../config/supabase');
const emailService = require('./emailService');

const bus = new EventEmitter();
const MAX_EMAIL_ATTEMPTS = 3;
const TICK_MS = 60 * 1000;
const BATCH_SIZE = 25;

let processing = false;
let timer = null;

const httpError = (status, message) => Object.assign(new Error(message), { status });

const EVENT_TYPES = Object.keys(emailService.templates);

async function notify({ type, userId, data = {}, scheduledFor, sendEmail = true }) {
  if (!EVENT_TYPES.includes(type)) {
    throw httpError(400, `Unknown notification type. Use one of: ${EVENT_TYPES.join(', ')}`);
  }
  if (!userId) throw httpError(400, 'userId is required.');

  let when = new Date();
  if (scheduledFor) {
    when = new Date(scheduledFor);
    if (Number.isNaN(when.getTime())) throw httpError(400, 'scheduledFor is not a valid date.');
  }

  const { data: userRes, error: userErr } = await supabase.auth.admin.getUserById(userId);
  if (userErr || !userRes?.user) throw httpError(404, 'User not found.');

  const { title, message } = emailService.templates[type](data);

  const { data: row, error } = await supabase
    .from('notifications')
    .insert({
      user_id: userId,
      recipient_email: userRes.user.email || null,
      type,
      title,
      message,
      data,
      send_email: Boolean(sendEmail),
      email_status: sendEmail ? 'pending' : 'skipped',
      scheduled_for: when.toISOString(),
    })
    .select()
    .single();
  if (error) throw error;

  bus.emit('notification:created', row.id);
  return row;
}

async function processDue() {
  if (processing) return;
  processing = true;
  try {
    const { data: rows, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('email_status', 'pending')
      .lte('scheduled_for', new Date().toISOString())
      .order('scheduled_for', { ascending: true })
      .limit(BATCH_SIZE);
    if (error) throw error;

    for (const row of rows || []) {
      if (!row.send_email || !row.recipient_email) {
        await supabase.from('notifications').update({ email_status: 'skipped' }).eq('id', row.id);
        continue;
      }
      try {
        const result = await emailService.sendNotificationEmail(
          row.recipient_email,
          row.type,
          row.data
        );
        // sent:false means SMTP is not configured - mark skipped so it doesn't loop forever
        await supabase
          .from('notifications')
          .update({ email_status: result.sent ? 'sent' : 'skipped' })
          .eq('id', row.id);
      } catch (err) {
        const attempts = row.email_attempts + 1;
        console.error(`[Notifications] Email failed for ${row.id}:`, err.message);
        await supabase
          .from('notifications')
          .update({
            email_attempts: attempts,
            email_status: attempts >= MAX_EMAIL_ATTEMPTS ? 'failed' : 'pending',
          })
          .eq('id', row.id);
      }
    }
  } catch (err) {
    console.error('[Notifications] Worker error:', err.message);
  } finally {
    processing = false;
  }
}

function start() {
  if (timer) return;
  bus.on('notification:created', () => setImmediate(processDue));
  timer = setInterval(processDue, TICK_MS);
  processDue();
  console.log('[Notifications] Worker started.');
}

module.exports = { notify, processDue, start, EVENT_TYPES };