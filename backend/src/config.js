import { fileURLToPath } from 'node:url';

export const config = {
  port: Number(process.env.API_PORT ?? 4000),
  jwtSecret: process.env.JWT_SECRET ?? 'dev-secret-change-me',
  dbPath: process.env.DB_PATH ?? fileURLToPath(new URL('../data/salon.db', import.meta.url)),
  corsOrigin: process.env.CORS_ORIGIN ?? 'http://localhost:3000',
  adminEmail: process.env.ADMIN_EMAIL ?? 'admin@salon.local',
  adminPassword: process.env.ADMIN_PASSWORD ?? 'admin123',

  // Opening hours per weekday (0 = Sunday). null = closed.
  hours: {
    0: null,
    1: { open: '09:00', close: '18:00' },
    2: { open: '09:00', close: '18:00' },
    3: { open: '09:00', close: '18:00' },
    4: { open: '09:00', close: '20:00' },
    5: { open: '09:00', close: '20:00' },
    6: { open: '10:00', close: '15:00' },
  },
  slotStepMin: 15,

  salonName: process.env.SALON_NAME ?? 'Salon',
  salonAddress: process.env.SALON_ADDRESS ?? '',
  locales: ['pl', 'en', 'es', 'ru'],
  defaultLocale: process.env.DEFAULT_LOCALE ?? 'pl',

  // 24h reminders. Without credentials, messages are only printed to the console.
  reminders: {
    enabled: process.env.REMINDERS_ENABLED !== 'false',
    hoursBefore: Number(process.env.REMINDER_HOURS_BEFORE ?? 24),
    checkEveryMin: Number(process.env.REMINDER_CHECK_EVERY_MIN ?? 5),
  },
  smtp: {
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: process.env.SMTP_SECURE === 'true',
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
    from: process.env.SMTP_FROM,
  },
  smsapi: {
    token: process.env.SMSAPI_TOKEN,
    from: process.env.SMSAPI_FROM, // registered sender name; leave empty to use SMSAPI's default
    test: process.env.SMSAPI_TEST === 'true', // validate without sending or charging
  },
};
