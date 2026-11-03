import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import bcrypt from 'bcryptjs';
import { config } from './config.js';

mkdirSync(new URL('../data/', import.meta.url), { recursive: true });
export const db = new DatabaseSync(config.dbPath);

db.exec(`
  PRAGMA foreign_keys = ON;
  PRAGMA journal_mode = WAL;

  CREATE TABLE IF NOT EXISTS users (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    name          TEXT NOT NULL,
    email         TEXT UNIQUE,
    phone         TEXT,
    password_hash TEXT,
    role          TEXT NOT NULL DEFAULT 'client' CHECK (role IN ('client', 'admin')),
    notes         TEXT NOT NULL DEFAULT '',
    created_at    TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS services (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    name         TEXT NOT NULL,
    description  TEXT NOT NULL DEFAULT '',
    duration_min INTEGER NOT NULL,
    price        REAL NOT NULL,
    active       INTEGER NOT NULL DEFAULT 1
  );

  -- Times are stored as local wall-clock strings "YYYY-MM-DDTHH:mm" (single-location salon).
  CREATE TABLE IF NOT EXISTS appointments (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    client_id  INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    service_id INTEGER NOT NULL REFERENCES services(id),
    start_at   TEXT NOT NULL,
    end_at     TEXT NOT NULL,
    status     TEXT NOT NULL DEFAULT 'booked' CHECK (status IN ('booked', 'completed', 'cancelled', 'no_show')),
    notes      TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE INDEX IF NOT EXISTS idx_appt_start ON appointments(start_at);
`);

// Seed an admin account and a few default services on first run.
const hasAdmin = db.prepare(`SELECT 1 FROM users WHERE role = 'admin' LIMIT 1`).get();
if (!hasAdmin) {
  db.prepare(`INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, 'admin')`).run(
    'Salon Admin',
    config.adminEmail,
    bcrypt.hashSync(config.adminPassword, 10),
  );
  console.log(`Seeded admin account: ${config.adminEmail}`);
}

const hasServices = db.prepare(`SELECT 1 FROM services LIMIT 1`).get();
if (!hasServices) {
  const insert = db.prepare(`INSERT INTO services (name, description, duration_min, price) VALUES (?, ?, ?, ?)`);
  insert.run('Classic haircut', 'Cut, wash and style', 30, 60);
  insert.run('Beard trim', 'Shape-up with hot towel', 20, 40);
  insert.run('Haircut + beard', 'The full package', 50, 90);
  insert.run('Hair colouring', 'Single-process colour', 90, 180);
}
