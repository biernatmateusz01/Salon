// Send a sample reminder to check SMTP / SMSAPI settings:
//   npm run notify:test -- --email you@example.com --phone 500600700 --locale pl
import { parseArgs } from 'node:util';
import { buildReminder, sendEmail, sendSms } from './notifications.js';
import { addMinutes, nowLocal } from './time.js';

const { values } = parseArgs({ options: { email: { type: 'string' }, phone: { type: 'string' }, locale: { type: 'string', default: 'pl' } } });
if (!values.email && !values.phone) {
  console.error('Usage: npm run notify:test -- --email you@example.com --phone 500600700 [--locale pl|en|es|ru]');
  process.exit(1);
}

const msg = buildReminder({
  client_name: 'Test Client',
  service_name: 'Classic haircut',
  start_at: addMinutes(nowLocal(), 24 * 60),
  locale: values.locale,
});
if (values.email) console.log('email:', await sendEmail({ to: values.email, subject: msg.subject, text: msg.text, html: msg.html }));
if (values.phone) console.log('sms:', await sendSms({ to: values.phone, message: msg.sms, locale: msg.locale }));
