import express from 'express';
import cors from 'cors';
import { config } from './config.js';
import './db.js';
import authRoutes from './routes/auth.js';
import serviceRoutes from './routes/services.js';
import clientRoutes from './routes/clients.js';
import appointmentRoutes from './routes/appointments.js';

const app = express();
app.use(cors({ origin: config.corsOrigin }));
app.use(express.json());

app.get('/api/health', (_req, res) => res.json({ ok: true }));
app.get('/api/config', (_req, res) => res.json({ hours: config.hours }));
app.use('/api/auth', authRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/appointments', appointmentRoutes);

app.use((_req, res) => res.status(404).json({ error: 'Not found' }));
app.use((err, _req, res, _next) => {
  if (!err.status) console.error(err);
  res.status(err.status ?? 500).json({ error: err.status ? err.message : 'Internal server error' });
});

app.listen(config.port, () => console.log(`API listening on http://localhost:${config.port}`));
