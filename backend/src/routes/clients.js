import { Router } from 'express';
import { db } from '../db.js';
import { requireAdmin, HttpError } from '../auth.js';

const router = Router();
router.use(requireAdmin);

const CLIENT_COLUMNS = 'u.id, u.name, u.email, u.phone, u.notes, u.created_at, u.password_hash IS NOT NULL AS has_account';

router.get('/', (req, res) => {
  const q = `%${String(req.query.q ?? '').trim()}%`;
  const rows = db
    .prepare(
      `SELECT ${CLIENT_COLUMNS},
              COUNT(a.id) FILTER (WHERE a.status = 'completed') AS visits,
              MAX(a.start_at) FILTER (WHERE a.status IN ('completed', 'booked')) AS last_visit
         FROM users u
         LEFT JOIN appointments a ON a.client_id = u.id
        WHERE u.role = 'client' AND (u.name LIKE ? OR u.email LIKE ? OR u.phone LIKE ?)
        GROUP BY u.id
        ORDER BY u.name COLLATE NOCASE`,
    )
    .all(q, q, q);
  res.json(rows);
});

// Add a client manually (e.g. walk-in or phone booking) — no password needed.
router.post('/', (req, res) => {
  const { name, email, phone, notes = '' } = req.body ?? {};
  if (!name?.trim()) throw new HttpError(400, 'Name is required');
  const normalized = email?.trim() ? email.trim().toLowerCase() : null;
  if (normalized && db.prepare('SELECT 1 FROM users WHERE email = ?').get(normalized)) {
    throw new HttpError(409, 'A client with this email already exists');
  }
  const { lastInsertRowid } = db
    .prepare(`INSERT INTO users (name, email, phone, notes, role) VALUES (?, ?, ?, ?, 'client')`)
    .run(name.trim(), normalized, phone?.trim() || null, notes);
  res.status(201).json(db.prepare(`SELECT ${CLIENT_COLUMNS} FROM users u WHERE id = ?`).get(lastInsertRowid));
});

router.get('/:id', (req, res) => {
  const client = db.prepare(`SELECT ${CLIENT_COLUMNS} FROM users u WHERE id = ? AND role = 'client'`).get(req.params.id);
  if (!client) throw new HttpError(404, 'Client not found');
  const appointments = db
    .prepare(
      `SELECT a.*, s.name AS service_name, s.price
         FROM appointments a JOIN services s ON s.id = a.service_id
        WHERE a.client_id = ? ORDER BY a.start_at DESC`,
    )
    .all(req.params.id);
  res.json({ ...client, appointments });
});

router.put('/:id', (req, res) => {
  const { name, email, phone, notes } = req.body ?? {};
  if (!name?.trim()) throw new HttpError(400, 'Name is required');
  const { changes } = db
    .prepare(`UPDATE users SET name = ?, email = ?, phone = ?, notes = ? WHERE id = ? AND role = 'client'`)
    .run(name.trim(), email?.trim().toLowerCase() || null, phone?.trim() || null, notes ?? '', req.params.id);
  if (!changes) throw new HttpError(404, 'Client not found');
  res.json(db.prepare(`SELECT ${CLIENT_COLUMNS} FROM users u WHERE id = ?`).get(req.params.id));
});

router.delete('/:id', (req, res) => {
  db.prepare(`DELETE FROM users WHERE id = ? AND role = 'client'`).run(req.params.id);
  res.status(204).end();
});

export default router;
