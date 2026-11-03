import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { db } from '../db.js';
import { signToken, requireAuth, HttpError } from '../auth.js';

const router = Router();

const publicUser = ({ password_hash, ...u }) => u;

router.post('/register', (req, res) => {
  const { name, email, phone, password } = req.body ?? {};
  if (!name?.trim() || !email?.trim() || !password) throw new HttpError(400, 'Name, email and password are required');
  if (password.length < 6) throw new HttpError(400, 'Password must be at least 6 characters');

  const normalized = email.trim().toLowerCase();
  const existing = db.prepare('SELECT * FROM users WHERE email = ?').get(normalized);
  if (existing?.password_hash) throw new HttpError(409, 'An account with this email already exists');

  const hash = bcrypt.hashSync(password, 10);
  let user;
  if (existing) {
    // Client was added by the salon earlier (walk-in) — let them claim the record.
    db.prepare('UPDATE users SET password_hash = ?, name = ?, phone = COALESCE(?, phone) WHERE id = ?').run(
      hash, name.trim(), phone ?? null, existing.id,
    );
    user = db.prepare('SELECT * FROM users WHERE id = ?').get(existing.id);
  } else {
    const { lastInsertRowid } = db
      .prepare(`INSERT INTO users (name, email, phone, password_hash, role) VALUES (?, ?, ?, ?, 'client')`)
      .run(name.trim(), normalized, phone ?? null, hash);
    user = db.prepare('SELECT * FROM users WHERE id = ?').get(lastInsertRowid);
  }
  res.status(201).json({ token: signToken(user), user: publicUser(user) });
});

router.post('/login', (req, res) => {
  const { email, password } = req.body ?? {};
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(String(email ?? '').trim().toLowerCase());
  if (!user?.password_hash || !bcrypt.compareSync(String(password ?? ''), user.password_hash)) {
    throw new HttpError(401, 'Invalid email or password');
  }
  res.json({ token: signToken(user), user: publicUser(user) });
});

router.get('/me', requireAuth, (req, res) => {
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
  if (!user) throw new HttpError(404, 'User not found');
  res.json(publicUser(user));
});

export default router;
