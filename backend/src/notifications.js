import nodemailer from 'nodemailer';
import { config } from './config.js';

// ---------------------------------------------------------------------------
// Message templates (one per supported locale)
// ---------------------------------------------------------------------------

const INTL_LOCALE = { pl: 'pl-PL', en: 'en-GB', es: 'es-ES', ru: 'ru-RU' };

const TEMPLATES = {
  pl: {
    subject: (a) => `Przypomnienie: ${a.service}, ${a.date} o ${a.time}`,
    greeting: (a) => `Dzień dobry ${a.name},`,
    body: (a) => `przypominamy o wizycie w ${a.salon}: ${a.service}, ${a.date} o ${a.time}.`,
    cancel: 'Jeśli nie możesz przyjść, odwołaj wizytę w aplikacji lub zadzwoń do nas.',
    signoff: 'Do zobaczenia!',
    sms: (a) => `${a.salon}: przypominamy o wizycie (${a.service}) ${a.date} o ${a.time}. Do zobaczenia!`,
  },
  en: {
    subject: (a) => `Reminder: ${a.service}, ${a.date} at ${a.time}`,
    greeting: (a) => `Hi ${a.name},`,
    body: (a) => `this is a reminder of your appointment at ${a.salon}: ${a.service}, ${a.date} at ${a.time}.`,
    cancel: "If you can't make it, please cancel in the app or give us a call.",
    signoff: 'See you soon!',
    sms: (a) => `${a.salon}: reminder of your appointment (${a.service}) on ${a.date} at ${a.time}. See you!`,
  },
  es: {
    subject: (a) => `Recordatorio: ${a.service}, ${a.date} a las ${a.time}`,
    greeting: (a) => `Hola ${a.name}:`,
    body: (a) => `te recordamos tu cita en ${a.salon}: ${a.service}, ${a.date} a las ${a.time}.`,
    cancel: 'Si no puedes venir, cancela la cita en la aplicación o llámanos.',
    signoff: '¡Hasta pronto!',
    sms: (a) => `${a.salon}: recordatorio de tu cita (${a.service}) el ${a.date} a las ${a.time}. ¡Hasta pronto!`,
  },
  ru: {
    subject: (a) => `Напоминание: ${a.service}, ${a.date} в ${a.time}`,
    greeting: (a) => `Здравствуйте, ${a.name}!`,
    body: (a) => `Напоминаем о вашем визите в ${a.salon}: ${a.service}, ${a.date} в ${a.time}.`,
    cancel: 'Если вы не сможете прийти, отмените визит в приложении или позвоните нам.',
    signoff: 'До встречи!',
    sms: (a) => `${a.salon}: напоминаем о визите (${a.service}) ${a.date} в ${a.time}. До встречи!`,
  },
};

/** Build the reminder email + SMS for an appointment row joined with client and service. */
export function buildReminder(appt) {
  const locale = TEMPLATES[appt.locale] ? appt.locale : config.defaultLocale;
  const t = TEMPLATES[locale];
  const date = new Intl.DateTimeFormat(INTL_LOCALE[locale], { weekday: 'long', day: 'numeric', month: 'long' }).format(
    new Date(`${appt.start_at.slice(0, 10)}T12:00:00`),
  );
  const vars = {
    name: appt.client_name.split(' ')[0],
    salon: config.salonName,
    service: appt.service_name,
    date,
    time: appt.start_at.slice(11, 16),
  };
  const lines = [t.greeting(vars), '', t.body(vars), t.cancel, '', t.signoff, config.salonName, config.salonAddress].filter(
    (l, i, all) => l !== '' || all[i - 1] !== '',
  );
  return {
    locale,
    subject: t.subject(vars),
    text: lines.join('\n').trim(),
    html: `<div style="font-family:system-ui,sans-serif;font-size:15px;line-height:1.5;color:#1f1a17">${lines
      .map((l) => (l ? `<p style="margin:0 0 4px">${escapeHtml(l)}</p>` : '<br>'))
      .join('')}</div>`,
    sms: t.sms(vars),
  };
}

const escapeHtml = (s) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

// ---------------------------------------------------------------------------
// Email (SMTP via nodemailer)
// ---------------------------------------------------------------------------

export const emailConfigured = () => !!(config.smtp.host && config.smtp.from);

let transporter;
function getTransporter() {
  transporter ??= nodemailer.createTransport({
    host: config.smtp.host,
    port: config.smtp.port,
    secure: config.smtp.secure,
    auth: config.smtp.user ? { user: config.smtp.user, pass: config.smtp.pass } : undefined,
  });
  return transporter;
}

export async function sendEmail({ to, subject, text, html }) {
  if (!emailConfigured()) {
    console.log(`[email:dry-run] to=${to} subject="${subject}"\n${text}\n`);
    return { dryRun: true };
  }
  const info = await getTransporter().sendMail({ from: config.smtp.from, to, subject, text, html });
  return { id: info.messageId };
}

// ---------------------------------------------------------------------------
// SMS (SMSAPI.pl REST API)
// ---------------------------------------------------------------------------

export const smsConfigured = () => !!config.smsapi.token;

/** "500 600 700" → "48500600700"; numbers with a country code are kept as-is. */
export function normalizePhone(phone) {
  const digits = String(phone ?? '').replace(/^\+/, '').replace(/\D/g, '').replace(/^00/, '');
  if (!digits) return null;
  return digits.length === 9 ? `48${digits}` : digits;
}

export async function sendSms({ to, message, locale }) {
  const number = normalizePhone(to);
  if (!number) throw new Error(`Invalid phone number: ${to}`);
  if (!smsConfigured()) {
    console.log(`[sms:dry-run] to=${number}\n${message}\n`);
    return { dryRun: true };
  }
  const body = new URLSearchParams({ to: number, message, format: 'json', encoding: 'utf-8' });
  if (config.smsapi.from) body.set('from', config.smsapi.from);
  // Strip Polish/Spanish diacritics so the SMS fits the cheaper 160-char GSM encoding (Cyrillic can't be normalised).
  if (locale !== 'ru') body.set('normalize', '1');
  if (config.smsapi.test) body.set('test', '1');

  const res = await fetch('https://api.smsapi.pl/sms.do', {
    method: 'POST',
    headers: { Authorization: `Bearer ${config.smsapi.token}` },
    body,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.error) throw new Error(`SMSAPI error ${data.error ?? res.status}: ${data.message ?? res.statusText}`);
  return { id: data.list?.[0]?.id };
}
