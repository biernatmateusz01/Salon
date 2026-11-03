import { db } from './db.js';
import { config } from './config.js';
import { addMinutes, nowLocal } from './time.js';
import { buildReminder, emailConfigured, sendEmail, sendSms, smsConfigured } from './notifications.js';

const DUE = db.prepare(`
  SELECT a.id, a.start_at, s.name AS service_name,
         u.name AS client_name, u.email, u.phone, u.locale
    FROM appointments a
    JOIN services s ON s.id = a.service_id
    JOIN users u ON u.id = a.client_id
   WHERE a.status = 'booked' AND a.reminder_sent_at IS NULL
     AND a.start_at > ? AND a.start_at <= ?
   ORDER BY a.start_at`);

const MARK_SENT = db.prepare(`UPDATE appointments SET reminder_sent_at = datetime('now') WHERE id = ?`);

/** Send reminders for every booked appointment starting within the reminder window. */
export async function sendDueReminders() {
  const now = nowLocal();
  const due = DUE.all(now, addMinutes(now, config.reminders.hoursBefore * 60));
  for (const appt of due) {
    // Mark first so a failing provider never causes repeated messages.
    MARK_SENT.run(appt.id);
    const msg = buildReminder(appt);
    const jobs = [];
    if (appt.email) jobs.push(sendEmail({ to: appt.email, subject: msg.subject, text: msg.text, html: msg.html }));
    if (appt.phone) jobs.push(sendSms({ to: appt.phone, message: msg.sms, locale: msg.locale }));
    const results = await Promise.allSettled(jobs);
    for (const r of results) {
      if (r.status === 'rejected') console.error(`[reminders] appointment #${appt.id}: ${r.reason.message}`);
    }
  }
  return due.length;
}

export function startReminderLoop() {
  if (!config.reminders.enabled) return console.log('Reminders disabled (REMINDERS_ENABLED=false)');
  console.log(
    `Reminders: ${config.reminders.hoursBefore}h before, email ${emailConfigured() ? 'via SMTP' : 'dry-run'}, ` +
      `SMS ${smsConfigured() ? `via SMSAPI${config.smsapi.test ? ' (test mode)' : ''}` : 'dry-run'}`,
  );
  const tick = () => sendDueReminders().catch((e) => console.error('[reminders]', e));
  tick();
  setInterval(tick, config.reminders.checkEveryMin * 60_000).unref();
}
