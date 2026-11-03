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
};
