import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { db } from '../db.js';
import { signToken, requireAuth, HttpError } from '../auth.js';
import { config } from '../config.js';

const router = Router();

const publicUser = ({ password_hash, ...u }) => u;
const toLocale = (l) => (config.locales.includes(l) ? l : config.defaultLocale);

router.post('/register', (req, res) => {
  const { name, email, phone, password, locale } = req.body ?? {};
  if (!name?.trim() || !email?.trim() || !password) throw new HttpError(400, 'Name, email and password are required', 'missing_fields');
  if (password.length < 6) throw new HttpError(400, 'Password must be at least 6 characters', 'password_too_short');

  const normalized = email.trim().toLowerCase();
  const existing = db.prepare('SELECT * FROM users WHERE email = ?').get(normalized);
  if (existing?.password_hash) throw new HttpError(409, 'An account with this email already exists', 'email_taken');

  const hash = bcrypt.hashSync(password, 10);
  let user;
  if (existing) {
    // Client was added by the salon earlier (walk-in) — let them claim the record.
    db.prepare('UPDATE users SET password_hash = ?, name = ?, phone = COALESCE(?, phone), locale = ? WHERE id = ?').run(
      hash, name.trim(), phone || null, toLocale(locale), existing.id,
    );
    user = db.prepare('SELECT * FROM users WHERE id = ?').get(existing.id);
  } else {
    const { lastInsertRowid } = db
      .prepare(`INSERT INTO users (name, email, phone, password_hash, role, locale) VALUES (?, ?, ?, ?, 'client', ?)`)
      .run(name.trim(), normalized, phone || null, hash, toLocale(locale));
    user = db.prepare('SELECT * FROM users WHERE id = ?').get(lastInsertRowid);
  }
  res.status(201).json({ token: signToken(user), user: publicUser(user) });
});

router.post('/login', (req, res) => {
  const { email, password } = req.body ?? {};
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(String(email ?? '').trim().toLowerCase());
  if (!user?.password_hash || !bcrypt.compareSync(String(password ?? ''), user.password_hash)) {
    throw new HttpError(401, 'Invalid email or password', 'invalid_credentials');
  }
  res.json({ token: signToken(user), user: publicUser(user) });
});

router.get('/me', requireAuth, (req, res) => {
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
  if (!user) throw new HttpError(404, 'User not found', 'not_found');
  res.json(publicUser(user));
});

// Remember the language the user picked, so reminders arrive in it.
router.patch('/me', requireAuth, (req, res) => {
  if (!config.locales.includes(req.body?.locale)) throw new HttpError(400, 'Unsupported locale', 'invalid_input');
  db.prepare('UPDATE users SET locale = ? WHERE id = ?').run(req.body.locale, req.user.id);
  res.json(publicUser(db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id)));
});

export default router;
