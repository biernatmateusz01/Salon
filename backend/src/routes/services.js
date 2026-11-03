import { Router } from 'express';
import { db } from '../db.js';
import { requireAdmin, HttpError } from '../auth.js';

const router = Router();

router.get('/', (req, res) => {
  const all = req.query.all === '1';
  const rows = db.prepare(`SELECT * FROM services ${all ? '' : 'WHERE active = 1'} ORDER BY name`).all();
  res.json(rows);
});

function parseService(body) {
  const { name, description = '', duration_min, price } = body ?? {};
  if (!name?.trim()) throw new HttpError(400, 'Name is required');
  const duration = Number(duration_min);
  const cost = Number(price);
  if (!Number.isInteger(duration) || duration < 5) throw new HttpError(400, 'Duration must be at least 5 minutes');
  if (!(cost >= 0)) throw new HttpError(400, 'Price must be a positive number');
  return { name: name.trim(), description, duration, cost };
}

router.post('/', requireAdmin, (req, res) => {
  const s = parseService(req.body);
  const { lastInsertRowid } = db
    .prepare('INSERT INTO services (name, description, duration_min, price) VALUES (?, ?, ?, ?)')
    .run(s.name, s.description, s.duration, s.cost);
  res.status(201).json(db.prepare('SELECT * FROM services WHERE id = ?').get(lastInsertRowid));
});

router.put('/:id', requireAdmin, (req, res) => {
  const s = parseService(req.body);
  const active = req.body.active === false || req.body.active === 0 ? 0 : 1;
  const { changes } = db
    .prepare('UPDATE services SET name = ?, description = ?, duration_min = ?, price = ?, active = ? WHERE id = ?')
    .run(s.name, s.description, s.duration, s.cost, active, req.params.id);
  if (!changes) throw new HttpError(404, 'Service not found');
  res.json(db.prepare('SELECT * FROM services WHERE id = ?').get(req.params.id));
});

// Soft-delete so past appointments keep their service.
router.delete('/:id', requireAdmin, (req, res) => {
  db.prepare('UPDATE services SET active = 0 WHERE id = ?').run(req.params.id);
  res.status(204).end();
});

export default router;
