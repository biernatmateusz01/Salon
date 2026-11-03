import { Router } from 'express';
import { db } from '../db.js';
import { config } from '../config.js';
import { requireAuth, HttpError } from '../auth.js';
import { addMinutes, fromMinutes, isDate, isDateTime, nowLocal, toMinutes, weekday } from '../time.js';

const router = Router();

const SELECT_APPT = `
  SELECT a.*, s.name AS service_name, s.price, s.duration_min,
         u.name AS client_name, u.phone AS client_phone, u.email AS client_email
    FROM appointments a
    JOIN services s ON s.id = a.service_id
    JOIN users u ON u.id = a.client_id`;

function getService(id) {
  const service = db.prepare('SELECT * FROM services WHERE id = ?').get(id);
  if (!service) throw new HttpError(404, 'Service not found');
  return service;
}

function hasOverlap(start, end, ignoreId = 0) {
  return !!db
    .prepare(`SELECT 1 FROM appointments WHERE status = 'booked' AND id != ? AND start_at < ? AND end_at > ? LIMIT 1`)
    .get(ignoreId, end, start);
}

function withinOpeningHours(start, end) {
  const [date, time] = start.split('T');
  const hours = config.hours[weekday(date)];
  if (!hours) return false;
  return end.startsWith(date) && toMinutes(time) >= toMinutes(hours.open) && toMinutes(end.split('T')[1]) <= toMinutes(hours.close);
}

// Public: free slots for a given day and service.
router.get('/availability', (req, res) => {
  const { date, serviceId } = req.query;
  if (!isDate(date)) throw new HttpError(400, 'date must be YYYY-MM-DD');
  const service = getService(serviceId);
  const hours = config.hours[weekday(date)];
  if (!hours) return res.json({ date, open: false, slots: [] });

  const booked = db
    .prepare(`SELECT start_at, end_at FROM appointments WHERE status = 'booked' AND start_at LIKE ?`)
    .all(`${date}T%`)
    .map((a) => [toMinutes(a.start_at.slice(11)), toMinutes(a.end_at.slice(11))]);

  const now = nowLocal();
  const slots = [];
  for (let t = toMinutes(hours.open); t + service.duration_min <= toMinutes(hours.close); t += config.slotStepMin) {
    const end = t + service.duration_min;
    const start = `${date}T${fromMinutes(t)}`;
    if (start <= now) continue;
    if (booked.some(([bs, be]) => t < be && end > bs)) continue;
    slots.push(fromMinutes(t));
  }
  res.json({ date, open: true, hours, slots });
});

router.use(requireAuth);

// Clients see their own appointments; admins see everything (optionally within a range).
router.get('/', (req, res) => {
  const { from, to, status } = req.query;
  const where = [];
  const params = [];
  if (req.user.role !== 'admin') {
    where.push('a.client_id = ?');
    params.push(req.user.id);
  }
  if (isDate(from)) {
    where.push('a.start_at >= ?');
    params.push(`${from}T00:00`);
  }
  if (isDate(to)) {
    where.push('a.start_at <= ?');
    params.push(`${to}T23:59`);
  }
  if (status) {
    where.push('a.status = ?');
    params.push(status);
  }
  const sql = `${SELECT_APPT} ${where.length ? `WHERE ${where.join(' AND ')}` : ''} ORDER BY a.start_at`;
  res.json(db.prepare(sql).all(...params));
});

router.post('/', (req, res) => {
  const { serviceId, start, notes = '' } = req.body ?? {};
  const isAdmin = req.user.role === 'admin';
  const clientId = isAdmin ? Number(req.body.clientId) : req.user.id;
  if (!clientId) throw new HttpError(400, 'clientId is required');
  if (!isDateTime(start)) throw new HttpError(400, 'start must be YYYY-MM-DDTHH:mm');

  const service = getService(serviceId);
  if (!service.active && !isAdmin) throw new HttpError(400, 'Service is not available');
  const end = addMinutes(start, service.duration_min);

  if (!isAdmin) {
    if (start <= nowLocal()) throw new HttpError(400, 'Cannot book in the past');
    if (!withinOpeningHours(start, end)) throw new HttpError(400, 'Outside opening hours');
  }
  if (hasOverlap(start, end)) throw new HttpError(409, 'That time slot is already taken');

  const { lastInsertRowid } = db
    .prepare('INSERT INTO appointments (client_id, service_id, start_at, end_at, notes) VALUES (?, ?, ?, ?, ?)')
    .run(clientId, service.id, start, end, notes);
  res.status(201).json(db.prepare(`${SELECT_APPT} WHERE a.id = ?`).get(lastInsertRowid));
});

router.patch('/:id', (req, res) => {
  const appt = db.prepare('SELECT * FROM appointments WHERE id = ?').get(req.params.id);
  if (!appt) throw new HttpError(404, 'Appointment not found');
  const isAdmin = req.user.role === 'admin';

  if (!isAdmin) {
    // Clients may only cancel their own upcoming bookings.
    if (appt.client_id !== req.user.id) throw new HttpError(404, 'Appointment not found');
    if (req.body.status !== 'cancelled') throw new HttpError(403, 'Clients can only cancel appointments');
    if (appt.status !== 'booked' || appt.start_at <= nowLocal()) throw new HttpError(400, 'This appointment can no longer be cancelled');
    db.prepare(`UPDATE appointments SET status = 'cancelled' WHERE id = ?`).run(appt.id);
    return res.json(db.prepare(`${SELECT_APPT} WHERE a.id = ?`).get(appt.id));
  }

  const status = req.body.status ?? appt.status;
  if (!['booked', 'completed', 'cancelled', 'no_show'].includes(status)) throw new HttpError(400, 'Invalid status');
  const serviceId = req.body.serviceId ?? appt.service_id;
  const start = req.body.start ?? appt.start_at;
  if (!isDateTime(start)) throw new HttpError(400, 'start must be YYYY-MM-DDTHH:mm');
  const end = addMinutes(start, getService(serviceId).duration_min);
  if (status === 'booked' && hasOverlap(start, end, appt.id)) throw new HttpError(409, 'That time slot is already taken');

  db.prepare('UPDATE appointments SET service_id = ?, start_at = ?, end_at = ?, status = ?, notes = ? WHERE id = ?').run(
    serviceId, start, end, status, req.body.notes ?? appt.notes, appt.id,
  );
  res.json(db.prepare(`${SELECT_APPT} WHERE a.id = ?`).get(appt.id));
});

export default router;
